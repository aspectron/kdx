// Assembled export surface for the re-engined `@kaspa/wallet-worker`.
// The UI consumes Wallet (the main-thread wrapper), initKaspaFramework, the
// loggers, Storage, helper, and the confirmation-count constants from here.

import { WalletWrapper, initKaspaFramework, workerLog, log } from './wallet-wrapper.js';
import { helper, Storage, KAS, CONFIRMATION_COUNT, COINBASE_CFM_COUNT } from './lib.js';

export const Wallet = WalletWrapper;
// The UI drives the wrapper directly and never instantiates `Core`; the alias
// keeps the historical export name resolvable.
export const Core = WalletWrapper;
export const Decimal = helper.Decimal;
export const Deferred = helper.Deferred;

export {
  initKaspaFramework,
  workerLog,
  log,
  helper,
  Storage,
  KAS,
  CONFIRMATION_COUNT,
  COINBASE_CFM_COUNT
};
