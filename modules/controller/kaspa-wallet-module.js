// `@kaspa/wallet` shim: the engine surface (Core/Storage/helper plus the
// formatting helpers) now sourced from the WASM-backed engine. Resolved by the
// controller importmap entry for "@kaspa/wallet".
export {
  Core,
  Storage,
  helper,
  log,
  KAS,
  Decimal,
  Deferred,
  initKaspaFramework,
  CONFIRMATION_COUNT,
  COINBASE_CFM_COUNT
} from './wasm-wallet/index.js';
