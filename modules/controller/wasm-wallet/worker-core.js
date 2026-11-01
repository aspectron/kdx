// Worker-side wallet engine backed by the rusty-kaspa wallet-core WASM SDK.
//
// The WASM `Wallet` is a self-contained runtime that owns its own wRPC
// `RpcClient`, so the engine runs entirely inside the worker and connects to
// its node itself: the local node KDX runs, or a public node picked by the
// resolver. The main-thread wrapper drives this core over the same
// postMessage protocol the UI already speaks.

import init, * as kaspa from '../../../vendor/kaspa-wasm/kaspa.js';
import { EventEmitter } from './event-emitter.js';
import { workerLog, helper, SOMPI_PER_KAS } from './lib.js';

// The legacy/KDX account kind in wallet-core. The stock WASM type union does
// not list it (the high-level API gates legacy off upstream); our SDK build
// lifts that gate, so the runtime accepts this kind even though the bundled
// type declarations were not regenerated to include it.
const LEGACY_ACCOUNT_TYPE = 'kaspa-legacy-standard';
const KDX_ACCOUNT_NAME = 'KDX';

// Project transaction fee policy: overshoot the network-required minimum by
// one KAS as a priority fee. The generator computes the mass-based minimum
// itself; this priority fee is added on top, absorbing transient mass/fee
// recomputation drift that makes exact-minimum estimates flaky.
const PRIORITY_FEE_OVERSHOOT_SOMPI = SOMPI_PER_KAS;

// wallet-core transaction-record data types that represent inbound value.
const INBOUND_TX_TYPES = ['incoming', 'external', 'transfer-incoming', 'stasis'];

// Ends a wallet open that a newer open replaced while it waited.
const REPLACED_OPEN = new Error('replaced by a newer wallet open');

// The wait before dialing a node again after its connection setup failed.
const REDIAL_INITIAL_DELAY_MS = 1000;
// Each further failed setup doubles that wait, up to this cap; a connection
// that is set up resets it.
const REDIAL_MAX_DELAY_MS = 30000;

// Wallets whose open went on to start them. A wallet that was never started
// has nothing to stop, and stopping it does not settle.
const startedWallets = new WeakSet();

// The connect call each wallet has in flight, settled either way. A connect
// call first looks up its node; a disconnect made during that lookup does not
// stop the socket the call opens afterwards.
const pendingDials = new WeakMap();

// Resolve the network the controller supplies to a wallet-core network id. The
// controller passes the canonical id of the wallet's node -- "mainnet" or a
// suffixed testnet id such as "testnet-10" -- taken from the public-node entry
// or from the local kaspad entry's arguments, so the wallet builds transactions
// for the network that node runs. Legacy network names map to their ids.
function resolveNetworkId(network) {
  const value = String(network || 'mainnet').toLowerCase();
  if (value === 'kaspa' || value === 'mainnet') {
    return 'mainnet';
  }
  if (value === 'kaspadev' || value === 'devnet') {
    return 'devnet';
  }
  if (value === 'kaspasim' || value === 'simnet') {
    return 'simnet';
  }
  // Already-resolved ids (including an explicit testnet-NN suffix) pass through
  // unchanged; wallet-core validates the network id.
  return value;
}

// wRPC Borsh endpoint for the local node KDX spawns. The default Borsh port is
// network-specific; the SDK supplies it so no port is hard-coded here.
function resolveNodeUrl(networkId) {
  const port = kaspa.RpcClient.defaultPort(kaspa.Encoding.Borsh, networkId);
  return `ws://127.0.0.1:${port}`;
}

// Resolver for a public-node wallet: the configured resolver list when one is
// given, otherwise the SDK's default public list.
function createResolver({ urls }) {
  return Array.isArray(urls) && urls.length ? new kaspa.Resolver({ urls }) : new kaspa.Resolver();
}

// Shut down a wallet that another one replaced: once its connect call has
// returned, disconnecting ends its dialing, even while it is still connecting.
async function shutDownWallet(wallet) {
  await pendingDials.get(wallet);
  await wallet.disconnect().catch((error) => {
    workerLog.debug('disconnecting the previous wallet failed:', String(error));
  });
  if (!startedWallets.has(wallet)) {
    return;
  }
  await wallet.stop().catch((error) => {
    workerLog.debug('stopping the previous wallet failed:', String(error));
  });
}

// Convert a wallet-core balance (bigint sompi fields) into the {available,
// pending, total} number shape the UI balance display consumes.
function toUiBalance(balance) {
  const mature = balance ? BigInt(balance.mature || 0n) : 0n;
  const pending = balance ? BigInt(balance.pending || 0n) : 0n;
  return {
    available: Number(mature),
    pending: Number(pending),
    total: Number(mature + pending)
  };
}

// The worker runs with Node integration, so the SDK takes it for Node.js and
// builds each wRPC socket with the Node `ws` options form, which the browser
// WebSocket here never opens. Construct sockets from the URL alone, as
// resources/realm-preload.js does for the page.
function useBrowserWebSocket() {
  const domWebSocket = self.WebSocket;
  if (typeof domWebSocket !== 'function') {
    return;
  }
  const browserWebSocket = function WebSocket(url) {
    return new domWebSocket(url);
  };
  browserWebSocket.prototype = domWebSocket.prototype;
  for (const state of ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']) {
    browserWebSocket[state] = domWebSocket[state];
  }
  self.WebSocket = browserWebSocket;
}
useBrowserWebSocket();

let wasmReady = null;
async function loadWasmBytes() {
  const wasmUrl = new URL('../../../vendor/kaspa-wasm/kaspa_bg.wasm', import.meta.url);
  // Under NWJS the app is served from a chrome-extension origin, so fetch
  // against the module-relative URL loads the packaged wasm; fall back to the
  // Node filesystem for plain file:// contexts.
  if (wasmUrl.protocol !== 'file:') {
    const response = await fetch(wasmUrl);
    return new Uint8Array(await response.arrayBuffer());
  }
  return require('fs').readFileSync(wasmUrl);
}

function ensureWasm() {
  if (!wasmReady) {
    wasmReady = loadWasmBytes().then((bytes) => init(bytes));
  }
  return wasmReady;
}

export class WorkerCore extends EventEmitter {
  constructor() {
    super();
    this.wallet = undefined;
    this.walletSecret = undefined;
    this.mnemonic = undefined;
    this.networkId = 'mainnet';
    this.accountId = undefined;
    this.receiveAddress = '';
    this.changeAddress = '';
    this.balance = { available: 0, pending: 0, total: 0 };
    this.confirmedUtxosCount = 0;
    this.daaScore = 0;
    this.synced = false;
    this._syncReady = helper.Deferred();
    this.resetAccountState();
    this.init();
  }

  resetAccountState() {
    this.accountActive = false;
    this.nodeConnected = false;
    this.nodeSynced = false;
    // Whether the last scan ran against a synced node.
    this.scanCoversSynced = false;
    // Chains the scans so that they never overlap.
    this.scanQueue = Promise.resolve();
    this.addressScanRunning = false;
    this.postedTxIds = new Set();
    // The outputs that scans found, per listed transaction id.
    this.discoveredTxs = new Map();
    this.connectOptions = undefined;
    this.redialTimer = undefined;
    this.redialDelayMs = REDIAL_INITIAL_DELAY_MS;
  }

  async init() {
    try {
      await ensureWasm();
    } catch (error) {
      this.sendWalletEvent('init-error', { error: String((error && error.stack) || error) });
      return;
    }
    addEventListener('message', (event) => {
      const { op, data } = event.data || {};
      if (!op) {
        return;
      }
      if (op !== 'wallet-init') {
        workerLog.debug('worker op:', op);
      }
      this.emit(op, data);
    });
    this.installHandlers();
    this.postMessage('ready');
  }

  postMessage(op, data = {}) {
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ op, data });
  }

  sendWalletEvent(name, data = {}) {
    this.postMessage('wallet-events', { name, data });
  }

  sendWalletResponse(rid, error = undefined, result = undefined, fn = undefined) {
    const errorMsg = error && error.message ? error.message : error;
    this.postMessage('wallet-response', { rid, fn, error: errorMsg, result });
  }

  installHandlers() {
    this.on('worker-log-level', (msg) => {
      workerLog.setLevel(msg.level);
    });

    this.on('wallet-init', (msg) => {
      this.openWallet(msg).catch((error) => {
        // A replaced open ends quietly: its failure is not the open wallet's.
        if (error === REPLACED_OPEN) {
          return;
        }
        workerLog.error('wallet-init failed:', error);
        this.sendWalletEvent('api-disconnect', { error: String(error) });
      });
    });

    this.on('wallet-request', async (msg) => {
      const { fn, rid, args = [] } = msg;
      if (!fn) {
        this.sendWalletResponse(rid, 'Invalid wallet request.');
        return;
      }
      const handler = this.requestHandlers[fn];
      if (typeof handler !== 'function') {
        this.sendWalletResponse(rid, `No such wallet method: ${fn}`);
        return;
      }
      try {
        const result = await handler.apply(this, args);
        this.sendWalletResponse(rid, undefined, result, fn);
      } catch (error) {
        this.sendWalletResponse(rid, error, undefined, fn);
      }
    });
  }

  async openWallet(msg) {
    const { seedPhrase, networkOptions = {}, options = {} } = msg;
    this.closeWallet();
    this.resetAccountState();
    this.networkId = resolveNetworkId(networkOptions.network);
    if (options.logLevel) {
      workerLog.setLevel(options.logLevel);
    }

    // A fresh wallet gets a newly generated phrase; the wrapper retrieves it
    // on demand via the `mnemonic` request so the UI can show the backup.
    this.mnemonic = seedPhrase || kaspa.Mnemonic.random(12).phrase;

    // Resident, in-memory wallet rebuilt from the mnemonic every session; the
    // wallet secret is ephemeral and never leaves this worker.
    this.walletSecret = helper.UID();
    const walletConfig = {
      resident: true,
      networkId: this.networkId,
      encoding: kaspa.Encoding.Borsh
    };
    if (networkOptions.resolver) {
      walletConfig.resolver = createResolver(networkOptions.resolver);
    }
    const wallet = new kaspa.Wallet(walletConfig);
    this.wallet = wallet;

    this.registerWalletEvents();

    // Each step waits on wallet-core. An open that a newer open replaced while
    // it waited stops at its next step, before it touches the worker's state.
    const step = (pending) => pending.then((result) => {
      if (this.wallet !== wallet) {
        throw REPLACED_OPEN;
      }
      return result;
    }, (error) => {
      throw this.wallet === wallet ? error : REPLACED_OPEN;
    });

    await step(wallet.walletCreate({ walletSecret: this.walletSecret }));
    const prv = await step(wallet.prvKeyDataCreate({
      walletSecret: this.walletSecret,
      kind: 'mnemonic',
      mnemonic: this.mnemonic
    }));
    this.prvKeyDataId = prv.prvKeyDataId;

    const created = await step(wallet.accountsCreate({
      walletSecret: this.walletSecret,
      type: LEGACY_ACCOUNT_TYPE,
      accountName: KDX_ACCOUNT_NAME,
      prvKeyDataId: this.prvKeyDataId
    }));
    const descriptor = created.accountDescriptor || created;
    this.accountId = descriptor.accountId;
    this.receiveAddress = String(descriptor.receiveAddress || '');
    this.changeAddress = String(descriptor.changeAddress || '');
    // The UI reads its displayed receive/change addresses from this event.
    this.sendWalletEvent('new-address', {
      receive: this.receiveAddress,
      change: this.changeAddress
    });

    // A resolver-backed wallet picks its public node itself; a url would
    // override the resolver, so it is passed only for the local node.
    const connectOptions = {
      networkId: this.networkId,
      blockAsyncConnect: false,
      strategy: 'retry'
    };
    if (!networkOptions.resolver) {
      connectOptions.url = resolveNodeUrl(this.networkId);
    }
    this.connectOptions = connectOptions;
    // The account is activated once the UTXO processor starts (see
    // rescanAccount), not here: the connect returns before the socket opens.
    await step(this.dial(wallet, connectOptions));
    startedWallets.add(wallet);
    await step(wallet.start());

    // The UI open sequence completes only once it receives the node-capability
    // event. The wallet's node has the utxo index: the resolver's public nodes
    // run with it, and KDX starts its local node with it unless the entry sets
    // skip-utxoindex.
    this.sendWalletEvent('grpc-flags', { utxoIndex: true });
    this.sendWalletEvent('ready', { confirmedUtxosCount: this.confirmedUtxosCount });
  }

  // Scan the account's addresses and subscribe them for live UTXO changes.
  // wallet-core does this when an account is activated, but only if its UTXO
  // processor is connected at that moment, and it never repeats it on its own:
  // a reconnect drops the address subscriptions, and an already active account
  // is not scanned again. So the account is activated on the processor's first
  // start, and every later scan restarts it through a wallet reload
  // (accountsDeactivate cannot be used: it never returns). Scans run one at a
  // time; the returned promise settles when this one has.
  rescanAccount(wallet) {
    this.scanCoversSynced = this.nodeSynced;
    const scan = async () => {
      if (wallet !== this.wallet || !this.accountId) {
        return;
      }
      if (this.accountActive) {
        await wallet.walletReload({ reactivate: true });
      } else {
        this.accountActive = true;
        await wallet.accountsActivate({ accountIds: [this.accountId] });
      }
    };
    const run = this.scanQueue.then(scan);
    // A scan that fails, or that ran before the node was synced, is repeated
    // once the node reports it is synced.
    this.scanQueue = run.catch(() => {
      if (wallet === this.wallet) {
        this.scanCoversSynced = false;
      }
    });
    return run;
  }

  scheduleRescan(wallet) {
    this.rescanAccount(wallet).catch((error) => {
      if (wallet !== this.wallet) {
        return;
      }
      workerLog.error('account scan failed:', String(error));
      this.sendWalletEvent('debug-info', { error: String(error) });
    });
  }

  // Dial the wallet's node. The dials of one wallet run one at a time; each
  // settles once its connection attempts have started, not once connected.
  dial(wallet, connectOptions) {
    const previous = pendingDials.get(wallet) || Promise.resolve();
    const dialing = previous.then(() => wallet.connect(connectOptions));
    pendingDials.set(wallet, dialing.then(() => {}, () => {}));
    return dialing;
  }

  // wallet-core gives up on a node connection whose setup fails: it reports
  // utxo-proc-error and disconnects its client, which ends the client's own
  // retries. Such a connection counts as lost and is dialed again with the
  // same options, one pending redial at a time.
  scheduleRedial(wallet) {
    if (wallet !== this.wallet || this.redialTimer) {
      return;
    }
    this.redialTimer = setTimeout(() => {
      this.redialTimer = undefined;
      this.redial(wallet);
    }, this.redialDelayMs);
  }

  redial(wallet) {
    // utxo-proc-error also reports a failed notification on a live
    // connection, which the client keeps.
    if (wallet !== this.wallet || wallet.rpc.isConnected) {
      return;
    }
    this.redialDelayMs = Math.min(this.redialDelayMs * 2, REDIAL_MAX_DELAY_MS);
    this.dial(wallet, this.connectOptions).catch((error) => {
      if (wallet !== this.wallet) {
        return;
      }
      workerLog.debug('dialing the node again failed:', String(error));
      this.scheduleRedial(wallet);
    });
  }

  // A wallet opened again -- another wallet, or the same one on another node --
  // replaces the open one, which must stop reporting and stop dialing its node.
  // It is detached at once and shuts down on its own, so a wallet still
  // waiting for its node never holds up the one that replaces it.
  closeWallet() {
    const wallet = this.wallet;
    if (!wallet) {
      return;
    }
    this.wallet = undefined;
    wallet.removeEventListener(this.walletListener);
    clearTimeout(this.redialTimer);
    this.redialTimer = undefined;
    this.receiveAddress = '';
    this.changeAddress = '';
    this.balance = { available: 0, pending: 0, total: 0 };
    this.confirmedUtxosCount = 0;
    this.daaScore = 0;
    this.synced = false;
    this._syncReady = helper.Deferred();
    shutDownWallet(wallet);
    // The wallet that replaces it shows as offline until it connects itself.
    this.sendWalletEvent('api-disconnect', {});
  }

  registerWalletEvents() {
    const wallet = this.wallet;
    this.walletListener = (event) => {
      const { type, data } = event || {};
      switch (type) {
        case 'disconnect':
          this.sendWalletEvent('api-disconnect', data || {});
          break;
        case 'balance': {
          const balance = data && data.balance;
          const ui = toUiBalance(balance);
          this.balance = ui;
          this.confirmedUtxosCount = balance ? (balance.matureUtxoCount || 0) : 0;
          this.sendWalletEvent('balance-update', {
            ...ui,
            confirmedUtxosCount: this.confirmedUtxosCount
          });
          if (!this.synced) {
            this.synced = true;
            this._syncReady.resolve();
          }
          break;
        }
        case 'daa-score-change': {
          // wallet-core exposes the virtual DAA score; the UI tracks a
          // monotonic score for confirmation progress. DAA score serves that
          // role (it is not the blue score the previous client read).
          this.daaScore = (data && data.currentDaaScore) || 0;
          this.sendWalletEvent('blue-score-changed', { blueScore: this.daaScore });
          break;
        }
        case 'server-status':
          this.nodeSynced = !!(data && data.isSynced);
          break;
        case 'sync-state': {
          const state = data && data.syncState;
          this.sendWalletEvent('sync-progress', state || {});
          const synced = !!state && state.type === 'synced';
          this.nodeSynced = synced;
          if (synced && this.accountActive && !this.scanCoversSynced) {
            this.scheduleRescan(wallet);
          }
          break;
        }
        // Every node connection starts the UTXO processor; a connection made
        // while the wallet starts emits no connect event, so this is the one
        // signal that the wallet is online.
        case 'utxo-proc-start':
          this.nodeConnected = true;
          this.redialDelayMs = REDIAL_INITIAL_DELAY_MS;
          this.synced = true;
          this._syncReady.resolve();
          this.sendWalletEvent('api-connect', {});
          this.reportNodeDaaScore(wallet);
          this.scheduleRescan(wallet);
          break;
        case 'utxo-proc-stop':
          this.nodeConnected = false;
          break;
        case 'pending':
        case 'maturity':
          this.postTransaction(data, 'new-transaction');
          break;
        // Transactions found by an address scan are the wallet's history.
        case 'discovery':
          this.postTransaction(data, 'transactions');
          break;
        case 'error':
        case 'wallet-error':
        case 'utxo-proc-error':
          this.sendWalletEvent('debug-info', { error: String((data && data.message) || data || '') });
          if (type === 'utxo-proc-error') {
            this.scheduleRedial(wallet);
          }
          break;
        default:
          break;
      }
    };
    this.wallet.addEventListener(this.walletListener);
  }

  // wallet-core reports a DAA score only once its UTXO processor runs, which
  // waits for the node to be synced, so a wallet moved to a syncing node would
  // keep showing the previous node's score. Report the node's own score as
  // soon as the wallet connects; a score already reported is never lowered.
  async reportNodeDaaScore(wallet) {
    try {
      const { virtualDaaScore } = await wallet.rpc.getServerInfo();
      const score = Number(virtualDaaScore);
      const lowered = this.daaScore && score <= this.daaScore;
      if (wallet !== this.wallet || !Number.isFinite(score) || lowered) {
        return;
      }
      this.daaScore = score;
      this.sendWalletEvent('blue-score-changed', { blueScore: score });
    } catch (error) {
      workerLog.debug('reading the node DAA score failed:', String(error));
    }
  }

  // Project a wallet-core transaction record onto the fields the UI
  // transaction list renders. Field names follow the wallet-core
  // ITransactionRecord shape: top-level id/value/unixtimeMsec/blockDaaScore/
  // type, with the per-variant utxo entries under data.utxoEntries.
  toUiTransaction(record) {
    if (!record) {
      return {};
    }
    const type = record.type;
    const variant = record.data;
    const utxo = variant && variant.utxoEntries && variant.utxoEntries[0];
    // The UI computes `new Date(tx.ts)`; supply a millisecond timestamp (the
    // record's acceptance time, falling back to now so the date never renders
    // as an invalid value).
    const ts = record.unixtimeMsec !== undefined ? Number(record.unixtimeMsec) : Date.now();
    return {
      // The record id is a WASM Hash object; the UI keys and links by its hex.
      id: String(record.id),
      ts,
      amount: record.value !== undefined ? Number(record.value) : undefined,
      in: INBOUND_TX_TYPES.includes(type),
      blueScore: record.blockDaaScore !== undefined ? Number(record.blockDaaScore) : undefined,
      isCoinbase: !!(utxo && utxo.isCoinbase) || type === 'stasis',
      address: utxo && utxo.address ? String(utxo.address) : undefined,
      note: record.note
    };
  }

  // Hand a transaction to the UI list once: `event` adds it (a live one at the
  // top, a discovered one in date order); a record seen again -- maturity
  // after pending, or rediscovery by a later scan -- updates the listed entry.
  postTransaction(record, event) {
    const tx = this.toUiTransaction(record);
    if (event === 'transactions') {
      // A transaction listed from its live record keeps that entry: a scan
      // sees only the outputs that pay this wallet, not the direction.
      if (this.postedTxIds.has(tx.id) && !this.discoveredTxs.has(tx.id)) {
        return;
      }
      this.mergeDiscoveredOutputs(tx, record);
    }
    if (this.postedTxIds.has(tx.id)) {
      this.sendWalletEvent('update-transactions', [tx]);
      return;
    }
    this.postedTxIds.add(tx.id);
    this.sendWalletEvent(event, event === 'transactions' ? [tx] : tx);
  }

  // A scan reports a transaction once for each address chain it paid (receive
  // and change), each record carrying only that chain's outputs, so the listed
  // amount is the sum of the distinct outputs found so far, shown at the
  // address first found.
  mergeDiscoveredOutputs(tx, record) {
    let found = this.discoveredTxs.get(tx.id);
    if (!found) {
      found = { address: tx.address, outputs: new Map() };
      this.discoveredTxs.set(tx.id, found);
    }
    const variant = record.data;
    for (const entry of (variant && variant.utxoEntries) || []) {
      found.outputs.set(Number(entry.index), Number(entry.amount));
    }
    if (found.outputs.size) {
      tx.amount = [...found.outputs.values()].reduce((sum, amount) => sum + amount, 0);
    }
    tx.address = found.address;
  }

  // Project a wallet-core UTXO entry onto the fields the UI UTXO list renders.
  toUiUtxo(entry) {
    const txId = String(entry.outpoint.transactionId);
    const outputIndex = Number(entry.outpoint.index);
    return {
      id: `${txId}:${outputIndex}`,
      txId,
      outputIndex,
      satoshis: Number(entry.amount),
      address: entry.address ? String(entry.address) : undefined,
      blockDaaScore: Number(entry.blockDaaScore),
      isCoinbase: !!entry.isCoinbase
    };
  }

  get requestHandlers() {
    return {
      sync: this.handleSync,
      receiveAddress: this.handleReceiveAddress,
      changeAddress: this.handleChangeAddress,
      mnemonic: this.handleMnemonic,
      getMiningAddress: this.handleReceiveAddress,
      submitTransaction: this.handleSubmitTransaction,
      estimateTransaction: this.handleEstimateTransaction,
      compoundUTXOs: this.handleCompoundUTXOs,
      scanMoreAddresses: this.handleScanMoreAddresses,
      startUpdatingTransactions: this.handleNoop,
      startUTXOsPolling: this.handleStartUTXOsPolling,
      setLogLevel: this.handleSetLogLevel,
      restoreCache: this.handleNoop,
      clearUsedUTXOs: this.handleNoop
    };
  }

  async handleSync() {
    // The UTXO processor syncs in the background after connect+start; resolve
    // once the processor is live so the UI sync gate releases, while balance
    // continues to stream via the balance event.
    await Promise.race([
      this._syncReady,
      new Promise((resolve) => helper.dpc(0, resolve))
    ]);
    return true;
  }

  async handleReceiveAddress() {
    return this.receiveAddress;
  }

  async handleChangeAddress() {
    return this.changeAddress;
  }

  async handleMnemonic() {
    return this.mnemonic;
  }

  buildPriorityFee(txParams) {
    const requested = txParams && txParams.fee ? BigInt(txParams.fee) : 0n;
    const overshoot = BigInt(PRIORITY_FEE_OVERSHOOT_SOMPI);
    return requested > overshoot ? requested : overshoot;
  }

  async handleSubmitTransaction(txParams) {
    if (!this.wallet || !this.accountId) {
      throw new Error('Wallet is not open.');
    }
    const response = await this.wallet.accountsSend({
      accountId: this.accountId,
      walletSecret: this.walletSecret,
      destination: [{ address: txParams.toAddr, amount: BigInt(txParams.amount) }],
      priorityFeeSompi: this.buildPriorityFee(txParams)
    });
    const ids = response.transactionIds || [];
    const summary = response.generatorSummary;
    const txid = (summary && summary.finalTransactionId) || ids[ids.length - 1] || ids[0];
    return { txid };
  }

  async handleEstimateTransaction(txParams) {
    if (!this.wallet || !this.accountId) {
      throw new Error('Wallet is not open.');
    }
    const response = await this.wallet.accountsEstimate({
      accountId: this.accountId,
      walletSecret: this.walletSecret,
      destination: [{ address: txParams.toAddr, amount: BigInt(txParams.amount) }],
      priorityFeeSompi: this.buildPriorityFee(txParams)
    });
    const summary = response.generatorSummary;
    return {
      fee: summary ? Number(summary.fees) : 0,
      totalAmount: Number(txParams.amount) + (summary ? Number(summary.fees) : 0),
      txSize: summary ? Number(summary.mass) : 0,
      toAddr: txParams.toAddr,
      amount: Number(txParams.amount)
    };
  }

  async handleCompoundUTXOs() {
    if (!this.wallet || !this.accountId) {
      throw new Error('Wallet is not open.');
    }
    // A send with no destination compounds the account UTXOs back to its own
    // change address; the priority-fee policy still applies.
    const response = await this.wallet.accountsSend({
      accountId: this.accountId,
      walletSecret: this.walletSecret,
      priorityFeeSompi: BigInt(PRIORITY_FEE_OVERSHOOT_SOMPI)
    });
    const ids = response.transactionIds || [];
    return { txid: ids[ids.length - 1] || ids[0] };
  }

  // The UI's UTXO list subscribes to `utxo-sync` and then asks for the set,
  // which is read once any scan in progress has finished.
  async handleStartUTXOsPolling() {
    const wallet = this.wallet;
    if (!wallet || !this.accountId) {
      throw new Error('Wallet is not open.');
    }
    await this.scanQueue;
    const { utxos = [] } = await wallet.accountsGetUtxos({ accountId: this.accountId });
    if (wallet === this.wallet) {
      this.sendWalletEvent('utxo-sync', { utxos: utxos.map((entry) => this.toUiUtxo(entry)) });
    }
    return true;
  }

  // Scan More Addresses: rescan the account's receive and change addresses
  // from index 0 and report, in the shape the UI reads, the range now known to
  // be scanned on each chain. wallet-core scans up to the account's current
  // derivation index and on until a window of unused addresses; its scan
  // depth is not settable from JS, so the UI's requested count and start
  // indexes are not used. A failure rejects, which the UI shows as an alert.
  async handleScanMoreAddresses() {
    const wallet = this.wallet;
    if (!wallet || !this.accountId) {
      throw new Error('Wallet is not open.');
    }
    if (!this.nodeConnected) {
      throw new Error('The wallet is not connected to a node.');
    }
    if (this.addressScanRunning) {
      throw new Error('An address scan is already running.');
    }
    this.addressScanRunning = true;
    this.sendWalletEvent('scan-more-addresses-started', { receiveStart: 0, changeStart: 0 });
    try {
      await this.rescanAccount(wallet);
      // The enumerated descriptors carry the derivation indexes; the
      // accountsGet response does not.
      const { accountDescriptors } = await wallet.accountsEnumerate({});
      const descriptor = accountDescriptors.find((d) => d.accountId === this.accountId);
      const { receive, change } = descriptor.derivationIndexes;
      for (const [addressType, final] of [['receive', receive], ['change', change]]) {
        this.sendWalletEvent('sync-progress', { start: 0, end: final + 1, addressType });
      }
      this.sendWalletEvent('scan-more-addresses-ended', {
        receiveFinal: receive,
        changeFinal: change
      });
      return {
        code: 'SUCCESS',
        receive: { start: 0, end: receive + 1, final: receive },
        change: { start: 0, end: change + 1, final: change }
      };
    } catch (error) {
      this.sendWalletEvent('scan-more-addresses-ended', { error: String(error) });
      throw error;
    } finally {
      this.addressScanRunning = false;
    }
  }

  async handleSetLogLevel(level) {
    workerLog.setLevel(level);
    return true;
  }

  async handleNoop() {
    // The UTXO processor manages transaction-time updates and UTXO selection
    // internally; these legacy entry points are retained as no-ops.
    return true;
  }
}
