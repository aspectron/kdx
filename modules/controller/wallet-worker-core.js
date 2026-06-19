// Worker entry point loaded by initKaspaFramework (KaspaConfig.workerCorePath).
// Boots the WASM-backed wallet engine inside the web worker; the WorkerCore
// constructor initializes the WASM module and starts handling messages.
import { WorkerCore } from './wasm-wallet/worker-core.js';

// Instantiating the core wires up the worker message handlers and boots WASM.
new WorkerCore();
