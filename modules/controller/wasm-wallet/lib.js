// Shared support for the WASM-backed KDX wallet engine.
// Pure JS utilities usable on both the main thread and the worker; this
// module intentionally does NOT import the WASM SDK (the SDK is worker-only,
// because the synchronous main-thread compile exceeds the Chromium limit).

// Loaded via Node's resolver (KDX runs NWJS with node integration on both the
// main window and the worker, the same mechanism the prior engine used); the
// browser module loader does not resolve bare specifiers in this context.
const CryptoJS = require('crypto-js');
const Decimal = require('decimal.js');

// Confirmation depths the transaction UI uses to render progress bars.
// User transactions mature after CONFIRMATION_COUNT blue-score steps;
// coinbase outputs mature after COINBASE_CFM_COUNT.
export const CONFIRMATION_COUNT = 10;
export const COINBASE_CFM_COUNT = 100;

// One KAS expressed in sompi (the indivisible base unit).
export const SOMPI_PER_KAS = 100000000;

// Network selector aliases the UI passes (mainnet/testnet/...) mapped to the
// address-prefix / network-type names the rest of the stack uses.
export const networkTypes = {
  kaspa: { name: 'kaspa', tag: 'mainnet' },
  kaspatest: { name: 'kaspatest', tag: 'testnet' },
  kaspasim: { name: 'kaspasim', tag: 'simnet' },
  kaspadev: { name: 'kaspadev', tag: 'devnet' }
};

export const networkAliases = {
  mainnet: 'kaspa',
  testnet: 'kaspatest',
  devnet: 'kaspadev',
  simnet: 'kaspasim'
};

// Format a sompi amount as a KAS decimal string for display.
export function KAS(sompi) {
  return new Decimal(sompi.toString()).div(SOMPI_PER_KAS).toString();
}

function sha256Hex(value) {
  return CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
}

// Promise carrying its own resolve/reject (the legacy `helper.Deferred`).
function Deferred() {
  let resolveFn;
  let rejectFn;
  const promise = new Promise((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  promise.resolve = resolveFn;
  promise.reject = rejectFn;
  return promise;
}

// Deferred procedure call: `dpc(fn)` or `dpc(delayMs, fn)` (legacy signature).
function dpc(delayOrFn, maybeFn) {
  let delay = 0;
  let fn = delayOrFn;
  if (typeof delayOrFn === 'number') {
    delay = delayOrFn;
    fn = maybeFn;
  }
  return setTimeout(fn, delay);
}

let uidCounter = 0;
function UID() {
  uidCounter += 1;
  return sha256Hex(`${uidCounter}:${Date.now()}`).slice(0, 24);
}

function chunks(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) {
    out.push(list.slice(i, i + size));
  }
  return out;
}

export const helper = {
  Deferred,
  dpc,
  UID,
  chunks,
  Decimal,
  sha256: sha256Hex,
  KAS
};

// Vault cipher preserved byte-compatibly from the legacy wallet so existing
// KDX local-storage wallets unlock unchanged. AES-CFB with AnsiX923 padding
// over a PBKDF2(SHA-1, 1000) key; the ciphertext/iv/salt are length-framed in
// the same hex envelope the legacy wallet wrote. Only the password-vault
// cipher is reproduced here; all consensus crypto lives in the WASM SDK.
export class Crypto {
  static toHexCode(parts) {
    return parts
      .map((part) => {
        const text = part || '';
        return text.length.toString().padStart(5, '0') + text;
      })
      .join('');
  }

  static parseHexCode(hexCode) {
    const data = [];
    let rest = hexCode;
    while (rest.length) {
      const len = parseInt(rest.substr(0, 5), 10);
      data.push(rest.substr(5, len));
      rest = rest.substr(5 + len);
    }
    return data;
  }

  static jsonFormatter(passSalt) {
    return {
      stringify(cipherParams) {
        const data = [CryptoJS.enc.Hex.stringify(cipherParams.ciphertext)];
        data.push(cipherParams.iv ? cipherParams.iv.toString() : '');
        data.push(cipherParams.salt ? cipherParams.salt.toString() : '');
        data.push(passSalt);
        return Crypto.toHexCode(data);
      },
      parse(hexCode) {
        const [ct, iv, salt] = Crypto.parseHexCode(hexCode);
        const cipherParams = CryptoJS.lib.CipherParams.create({
          ciphertext: CryptoJS.enc.Hex.parse(ct)
        });
        if (iv) {
          cipherParams.iv = CryptoJS.enc.Hex.parse(iv);
        }
        if (salt) {
          cipherParams.salt = CryptoJS.enc.Hex.parse(salt);
        }
        return cipherParams;
      }
    };
  }

  static createKey(passphrase, saltStr = '') {
    const salt = saltStr
      ? CryptoJS.enc.Hex.parse(saltStr)
      : CryptoJS.lib.WordArray.random(128 / 8);
    return {
      key: CryptoJS.PBKDF2(passphrase, salt, {
        keySize: 512 / 32,
        iterations: 1000
      }).toString(CryptoJS.enc.Hex),
      salt: salt.toString(CryptoJS.enc.Hex)
    };
  }

  static async encrypt(passphrase, data) {
    const { key, salt } = this.createKey(passphrase);
    return CryptoJS.AES.encrypt(data, key, {
      mode: CryptoJS.mode.CFB,
      padding: CryptoJS.pad.AnsiX923,
      format: this.jsonFormatter(salt)
    }).toString();
  }

  static async decrypt(passphrase, data) {
    const parts = this.parseHexCode(data);
    const passSalt = parts[3];
    const { key } = this.createKey(passphrase, passSalt);
    return CryptoJS.AES.decrypt(data, key, {
      mode: CryptoJS.mode.CFB,
      padding: CryptoJS.pad.AnsiX923,
      format: this.jsonFormatter(passSalt)
    }).toString(CryptoJS.enc.Utf8);
  }
}

// Minimal level-filtered logger matching the legacy `log` / `workerLog` shape
// the UI and worker code call (info/debug/warn/error/setLevel).
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, off: 4 };

class Logger {
  constructor(prefix) {
    this.prefix = prefix;
    this.level = LEVELS.info;
  }

  setLevel(level) {
    if (typeof level === 'string' && level.toLowerCase() in LEVELS) {
      this.level = LEVELS[level.toLowerCase()];
    }
  }

  _emit(method, threshold, args) {
    if (this.level <= threshold) {
      // eslint-disable-next-line no-console
      console[method](this.prefix, ...args);
    }
  }

  debug(...args) { this._emit('log', LEVELS.debug, args); }
  info(...args) { this._emit('log', LEVELS.info, args); }
  warn(...args) { this._emit('warn', LEVELS.warn, args); }
  error(...args) { this._emit('error', LEVELS.error, args); }
}

export const log = new Logger('[KaspaWallet]');
export const workerLog = new Logger('[KaspaWalletWorker]');

// Local-storage wallet + cache store matching the legacy `Storage` surface the
// @kaspa/ux UI drives: it reads and writes the persisted wallet record (the
// vault-encrypted mnemonic envelope) and the UTXO/address cursor cache under
// the same localStorage keys the previous wallet used, so existing KDX wallets
// are found unchanged. Key names are fixed for backward compatibility.
const WALLET_STORE_KEY = 'kaspa-wallet';
const CACHE_STORE_KEY = 'kaspa-cache';

export class Storage {
  constructor(opt = {}) {
    if (opt.logLevel) {
      log.setLevel(opt.logLevel);
    }
    this.store = (typeof localStorage !== 'undefined') ? localStorage : null;
  }

  // Parse a stored JSON value, returning false on absence or parse error
  // (the falsy sentinel the UI checks for).
  _read(key) {
    if (!this.store) {
      return false;
    }
    const content = this.store.getItem(key);
    if (!content) {
      return false;
    }
    try {
      return JSON.parse(content);
    } catch (e) {
      return false;
    }
  }

  // Wallet record envelope, matching the historical KDX format. The `wallet`
  // field carries the stored mnemonic (the vault-encrypted string the UI
  // unlocks); `meta` carries any caller-supplied extra fields.
  _buildWalletContent(mnemonic, meta = {}) {
    return Object.assign({
      type: 'kaspa-wallet',
      encryption: 'default',
      version: 1,
      generator: 'kdx',
      wallet: { mnemonic }
    }, meta);
  }

  getWallet() {
    return this._read(WALLET_STORE_KEY);
  }

  saveWallet(mnemonic, meta = {}) {
    if (this.store) {
      this.store.setItem(WALLET_STORE_KEY, JSON.stringify(this._buildWalletContent(mnemonic, meta)));
    }
  }

  // Replace an existing wallet record: snapshot the current wallet + cache
  // under timestamped backup keys, clear the cache, then save the new wallet.
  createWallet(mnemonic, meta = {}) {
    this._backup();
    if (this.store) {
      this.store.setItem(CACHE_STORE_KEY, '');
    }
    return this.saveWallet(mnemonic, meta);
  }

  _backup() {
    if (!this.store) {
      return;
    }
    const ts = Date.now();
    const wallet = this.store.getItem(WALLET_STORE_KEY);
    if (wallet) {
      this.store.setItem(`${WALLET_STORE_KEY}-${ts}`, wallet);
    }
    const cache = this.store.getItem(CACHE_STORE_KEY);
    if (cache) {
      this.store.setItem(`${CACHE_STORE_KEY}-${ts}`, cache);
    }
  }

  getCache() {
    return this._read(CACHE_STORE_KEY);
  }

  saveCache(cache) {
    if (this.store) {
      this.store.setItem(CACHE_STORE_KEY, JSON.stringify(cache));
    }
  }

  setLogLevel(level) {
    log.setLevel(level);
  }

  addTransaction() {
    // Transaction persistence is handled by wallet-core; retained for surface
    // compatibility with the legacy storage interface.
  }
}
