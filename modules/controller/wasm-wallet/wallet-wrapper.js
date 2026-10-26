// Main-thread wallet wrapper. Presents the exact surface the @kaspa/ux UI and
// the KDX controller already consume, while the funds engine runs in the
// worker on the wallet-core WASM SDK. This module never imports the WASM SDK
// (it cannot instantiate on the main thread); it only speaks the postMessage
// protocol to the worker core and handles the local password vault.

import { EventTargetImpl } from './event-emitter.js';
import {
  Crypto,
  helper,
  log,
  workerLog,
  KAS,
  networkTypes,
  networkAliases
} from './lib.js';

export { workerLog };

let worker;
let workerReady = helper.Deferred();
let onWorkerMessage = () => {};

const DEFAULT_WORKER_PATH = '/node_modules/@kaspa/wallet-worker/worker.js';

// Boot the wallet worker and resolve once it reports ready. Mirrors the legacy
// framework initializer: the UI awaits this before constructing a wallet.
export function initKaspaFramework(opt = {}) {
  return new Promise((resolve, reject) => {
    helper.dpc(0, () => {
      try {
        const isNode = (typeof window === 'undefined');
        const baseURL = isNode ? `file://${__dirname}/` : window.location.origin;
        const workerPath = opt.workerPath || DEFAULT_WORKER_PATH;
        const url = new URL(workerPath, baseURL);
        worker = new Worker(url, { type: 'module' });
        worker.onmessage = (msg) => {
          const { op, data } = msg.data || {};
          if (op === 'ready') {
            workerReady.resolve();
            resolve();
            return;
          }
          onWorkerMessage(op, data);
        };
        worker.onerror = (error) => {
          workerLog.error('worker error:', error.message || error);
        };
      } catch (error) {
        reject(error);
      }
    });
  });
}

export class WalletWrapper extends EventTargetImpl {
  // Validate a password against an encrypted vault without opening a wallet.
  static async checkPasswordValidity(password, encryptedMnemonic) {
    try {
      const decrypted = await Crypto.decrypt(password, encryptedMnemonic);
      const savedWallet = JSON.parse(decrypted);
      return !!(savedWallet && savedWallet.privKey);
    } catch (e) {
      return false;
    }
  }

  static async setWorkerLogLevel(level) {
    workerLog.setLevel(level);
    await workerReady;
    WalletWrapper.postMessage('worker-log-level', { level });
  }

  static postMessage(op, data) {
    worker.postMessage({ op, data });
  }

  // Build a wallet from a plaintext mnemonic (recover flow).
  static fromMnemonic(seedPhrase, networkOptions, options = {}) {
    if (!networkOptions || !networkOptions.network) {
      throw new Error('fromMnemonic(seedPhrase, networkOptions): missing network argument');
    }
    return new WalletWrapper(null, seedPhrase.trim(), networkOptions, options);
  }

  // Build a wallet from an encrypted vault (open existing wallet flow). The
  // vault cipher matches the legacy format so existing KDX wallets open.
  static async import(password, encryptedMnemonic, networkOptions, options = {}) {
    const decrypted = await Crypto.decrypt(password, encryptedMnemonic);
    const savedWallet = JSON.parse(decrypted);
    return new WalletWrapper(savedWallet.privKey, savedWallet.seedPhrase, networkOptions, options);
  }

  constructor(privKey, seedPhrase, networkOptions, options = {}) {
    super();
    // The UI passes an rpc object in networkOptions; the worker-hosted wallet
    // owns its own wRPC client, so the object is accepted for API
    // compatibility but not used for transport here.
    this.rpc = networkOptions.rpc;
    delete networkOptions.rpc;
    // A resolver-backed client (the public node) cannot cross into the worker,
    // so pass its resolver list instead; the worker then builds its own
    // resolver-backed connection rather than dialing a local node.
    const resolver = this.rpc && this.rpc.resolver;
    if (resolver) {
      networkOptions.resolver = { urls: resolver.urls || null };
    }

    this.privKey = privKey || undefined;
    this.seedPhrase = seedPhrase || undefined;
    this.network = networkOptions.network;
    this.balance = { available: 0, pending: 0, total: 0 };
    this.workerReady = workerReady;
    this._pendingCB = new Map();
    this.syncSignal = undefined;
    this.uid = helper.sha256(`${seedPhrase || ''}:${this.network}`).slice(0, 24);

    this.initWorker();
    this.initWallet(privKey, seedPhrase, networkOptions, options);
  }

  async initWallet(privKey, seedPhrase, networkOptions, options) {
    await this.workerReady;
    WalletWrapper.postMessage('wallet-init', {
      privKey,
      seedPhrase,
      networkOptions,
      options
    });
  }

  initWorker() {
    if (!worker) {
      throw new Error("Please init kaspa framework using 'await initKaspaFramework();'.");
    }
    this.worker = worker;
    onWorkerMessage = (op, data) => {
      switch (op) {
        case 'wallet-response':
          return this.handleResponse(data);
        case 'wallet-events':
          return this.handleEvents(data);
        default:
          return undefined;
      }
    };
  }

  handleEvents(msg) {
    const { name, data } = msg;
    if (name === 'balance-update') {
      this.balance = data;
    }
    if (name === 'new-address') {
      this.addresses = data;
    }
    if (name === 'grpc-flags') {
      this.grpcFlags = data;
    }
    this.emit(name, data);
  }

  // The UI asks for the node capability flags once it has subscribed to them;
  // the worker reports them when the wallet opens, so re-deliver that report.
  checkGRPCFlags() {
    if (this.grpcFlags) {
      this.emit('grpc-flags', this.grpcFlags);
    }
  }

  // The worker opens the wallet as soon as the wrapper is constructed, so when
  // a wallet is created its one-shot address event fires before the UI
  // subscribes (the UI waits for the user to back up the phrase first). A late
  // subscriber is handed the current addresses.
  on(type, callback) {
    super.on(type, callback);
    if (type === 'new-address' && this.addresses) {
      callback(this.addresses);
    }
    return this;
  }

  handleResponse(msg) {
    const { rid, error, result } = msg;
    const item = this._pendingCB.get(rid);
    if (!item) {
      return;
    }
    item.cb(error, result);
    this._pendingCB.delete(rid);
  }

  createPendingCall(cb) {
    const uid = helper.UID();
    this._pendingCB.set(uid, { uid, cb });
    return uid;
  }

  async request(fn, args, callback = undefined) {
    await this.workerReady;
    let rid;
    if (callback) {
      rid = this.createPendingCall(callback);
    }
    this.worker.postMessage({ op: 'wallet-request', data: { fn, args, rid } });
  }

  requestPromisify(fn, ...args) {
    return new Promise((resolve, reject) => {
      this.request(fn, args, (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
    });
  }

  async sync(syncOnce = undefined) {
    this.syncSignal = helper.Deferred();
    const args = [];
    if (syncOnce !== undefined) {
      args.push(syncOnce);
    }
    this.request('sync', args, () => {
      this.syncSignal.resolve();
    });
    return this.syncSignal;
  }

  setLogLevel(level) {
    this.request('setLogLevel', [level]);
  }

  startUTXOsPolling() {
    this.request('startUTXOsPolling', []);
  }

  async get(name, waitForSync = false) {
    if (waitForSync && this.syncSignal) {
      await this.syncSignal;
    }
    return new Promise((resolve, reject) => {
      this.request(name, [], (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
    });
  }

  getAfterSync(name) {
    return this.get(name, true);
  }

  get mnemonic() {
    if (this.seedPhrase) {
      return Promise.resolve(this.seedPhrase);
    }
    return this.get('mnemonic');
  }

  get receiveAddress() {
    return this.getAfterSync('receiveAddress');
  }

  submitTransaction(txParamsArg, debug = false) {
    return this.requestPromisify('submitTransaction', txParamsArg, debug);
  }

  estimateTransaction(txParamsArg) {
    return this.requestPromisify('estimateTransaction', txParamsArg);
  }

  startUpdatingTransactions(version = undefined) {
    return this.requestPromisify('startUpdatingTransactions', version);
  }

  compoundUTXOs(txCompoundOptions = {}, debug = false) {
    return this.requestPromisify('compoundUTXOs', txCompoundOptions, debug);
  }

  scanMoreAddresses(count = 100, debug = false, receiveStart = -1, changeStart = -1) {
    return this.requestPromisify('scanMoreAddresses', count, debug, receiveStart, changeStart);
  }

  // Re-encrypt the wallet into the legacy vault format so the UI backup/export
  // flow is unchanged. The exported `privKey` field is a stable non-secret
  // marker (the engine derives keys from the mnemonic via the audited
  // wallet-core; the legacy plaintext HD private key is not reconstructed) and
  // exists only to satisfy the vault's presence check.
  async export(password) {
    const vault = {
      privKey: this.privKey || this.uid,
      seedPhrase: this.seedPhrase || (await this.mnemonic)
    };
    return Crypto.encrypt(password, JSON.stringify(vault));
  }

  restoreCache(cache) {
    this.request('restoreCache', [cache]);
  }

  clearUsedUTXOs() {
    this.request('clearUsedUTXOs', []);
  }
}

// Static surface the UI reads off the wrapper (assigned after the class for
// broad toolchain compatibility).
WalletWrapper.networkTypes = networkTypes;
WalletWrapper.networkAliases = networkAliases;
WalletWrapper.KAS = KAS;
WalletWrapper.Crypto = Crypto;
WalletWrapper.passwordHandler = Crypto;

export { log, Crypto, KAS, helper };
