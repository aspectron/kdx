// `@kaspa/wallet-worker` shim: re-exports the WASM-backed wallet engine that
// replaces the dead bitcore-derived engine. Resolved by the controller
// importmap entry for "@kaspa/wallet-worker".
export {
  Wallet,
  initKaspaFramework,
  log,
  workerLog,
  Core,
  Storage,
  helper,
  KAS,
  Decimal,
  Deferred,
  CONFIRMATION_COUNT,
  COINBASE_CFM_COUNT
} from './wasm-wallet/index.js';
