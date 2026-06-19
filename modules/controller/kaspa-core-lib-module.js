// `@kaspa/core-lib` shim: the legacy bitcore-derived core-lib is retired; the
// helper utilities and wallet surface come from the WASM-backed engine.
// Resolved by the controller importmap entry for "@kaspa/core-lib".
export {
  helper,
  Wallet,
  Storage,
  initKaspaFramework
} from './wasm-wallet/index.js';
