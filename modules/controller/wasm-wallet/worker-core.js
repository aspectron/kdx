// Worker-side wallet engine backed by the rusty-kaspa wallet-core WASM SDK.
//
// The WASM `Wallet` is a self-contained runtime that owns its own wRPC
// `RpcClient`, so unlike the previous design (a main-thread RPC client plus a
// worker-side engine that round-tripped every RPC call back to the main
// thread) the engine here runs entirely inside the worker and connects
// directly to the local node. The main-thread wrapper drives this core over
// the same postMessage protocol the UI already speaks.

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

// Number of historical transaction records fetched on open for the initial
// list. Live activity streams in afterwards via pending/maturity events.
const TRANSACTION_HISTORY_PAGE = 100;

// wallet-core transaction-record data types that represent inbound value.
const INBOUND_TX_TYPES = ['incoming', 'external', 'transfer-incoming', 'stasis'];

// Resolve the network selector the controller supplies to a wallet-core network
// id. The testnet id arrives already suffixed (e.g. "testnet-12"), derived by
// the controller from the single source -- the kaspad daemon `args.netsuffix` --
// so the wallet builds transactions for the same network instance the node runs.
// The wRPC Borsh port is network-type-keyed, so it is the same across testnet
// suffixes.
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
    this.init();
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
    this.wallet = new kaspa.Wallet(walletConfig);

    this.registerWalletEvents();

    await this.wallet.walletCreate({ walletSecret: this.walletSecret });
    const prv = await this.wallet.prvKeyDataCreate({
      walletSecret: this.walletSecret,
      kind: 'mnemonic',
      mnemonic: this.mnemonic
    });
    this.prvKeyDataId = prv.prvKeyDataId;

    const created = await this.wallet.accountsCreate({
      walletSecret: this.walletSecret,
      type: LEGACY_ACCOUNT_TYPE,
      accountName: KDX_ACCOUNT_NAME,
      prvKeyDataId: this.prvKeyDataId
    });
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
    await this.wallet.connect(connectOptions);
    await this.wallet.start();
    await this.wallet.accountsActivate({ accountIds: [this.accountId] });

    // The UI open sequence completes only once it receives the node-capability
    // event; under wRPC the node KDX spawns runs with the utxo index enabled.
    this.sendWalletEvent('grpc-flags', { utxoIndex: true });
    this.sendWalletEvent('ready', { confirmedUtxosCount: this.confirmedUtxosCount });

    // History back-fill runs after the open events so it never gates them.
    await this.backfillTransactions();
  }

  // Populate the transaction list on open: the live pending/maturity events
  // only accumulate during the session, so the existing history is fetched
  // once and delivered as a bulk update.
  async backfillTransactions() {
    if (!this.wallet || !this.accountId) {
      return;
    }
    try {
      const response = await this.wallet.transactionsDataGet({
        accountId: this.accountId,
        networkId: this.networkId,
        start: 0n,
        end: BigInt(TRANSACTION_HISTORY_PAGE)
      });
      const records = (response && response.transactions) || [];
      if (records.length) {
        this.sendWalletEvent('transactions', records.map((r) => this.toUiTransaction(r)));
      }
    } catch (error) {
      workerLog.debug('transaction history back-fill skipped:', String(error));
    }
  }

  registerWalletEvents() {
    this.wallet.addEventListener((event) => {
      const { type, data } = event || {};
      switch (type) {
        case 'connect':
          this.sendWalletEvent('api-connect', data || {});
          break;
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
        case 'sync-state': {
          const state = data && data.syncState;
          this.sendWalletEvent('sync-progress', state || {});
          break;
        }
        case 'utxo-proc-start':
          this.synced = true;
          this._syncReady.resolve();
          break;
        case 'pending':
        case 'maturity':
          this.sendWalletEvent('new-transaction', this.toUiTransaction(data));
          break;
        case 'discovery':
          this.sendWalletEvent('moved-transaction', this.toUiTransaction(data));
          break;
        case 'error':
        case 'wallet-error':
        case 'utxo-proc-error':
          this.sendWalletEvent('debug-info', { error: String((data && data.message) || data || '') });
          break;
        default:
          break;
      }
    });
  }

  // Project a wallet-core transaction record onto the fields the UI
  // transaction list renders. Field names follow the wallet-core
  // ITransactionRecord shape: top-level id/value/unixtimeMsec/blockDaaScore/
  // type, with the per-variant utxo entries under data.data.utxoEntries.
  toUiTransaction(record) {
    if (!record) {
      return {};
    }
    const type = record.type || (record.data && record.data.type);
    const variant = record.data && record.data.data;
    const utxo = variant && variant.utxoEntries && variant.utxoEntries[0];
    // The UI computes `new Date(tx.ts)`; supply a millisecond timestamp (the
    // record's acceptance time, falling back to now so the date never renders
    // as an invalid value).
    const ts = record.unixtimeMsec !== undefined ? Number(record.unixtimeMsec) : Date.now();
    return {
      id: record.id,
      ts,
      amount: record.value !== undefined ? Number(record.value) : undefined,
      in: INBOUND_TX_TYPES.includes(type),
      blueScore: record.blockDaaScore !== undefined ? Number(record.blockDaaScore) : undefined,
      isCoinbase: !!(utxo && utxo.isCoinbase) || type === 'stasis',
      address: utxo && utxo.address ? String(utxo.address) : undefined,
      note: record.note
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
      startUTXOsPolling: this.handleNoop,
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

  async handleScanMoreAddresses() {
    if (!this.wallet || !this.accountId) {
      return { code: 'WALLET_NOT_OPEN' };
    }
    const created = await this.wallet.accountsCreateNewAddress({ accountId: this.accountId });
    this.receiveAddress = String(created.address || this.receiveAddress);
    return { code: 'ok' };
  }

  async handleSetLogLevel(level) {
    workerLog.setLevel(level);
    return true;
  }

  async handleNoop() {
    // The UTXO processor manages polling, transaction-time updates, and UTXO
    // selection internally; these legacy entry points are retained as no-ops.
    return true;
  }
}
