const fs = require('fs-extra');
const path = require('path');

const KASPA_WASM_DIR = path.join(__dirname, '../vendor/kaspa-wasm');

// The WASM SDK is a web-target ES module. It MUST be import()-ed from a
// page-module realm (which has a valid string referrer base): a require()-d
// CommonJS module has a non-string referrer base_url under NWJS 0.112 and the
// import crashes Blink (referrer_script_info base_url). So this module no longer
// imports the SDK -- it provides the vendored wasm bytes (node fs, needs
// __dirname) and caches the instantiated SDK that a page realm feeds back in.
// Consumers keep awaiting loadKaspaSdk(); the promise resolves once a page realm
// has instantiated the SDK and called setKaspaSdk(), so late awaiters wait
// rather than race.
let kaspaSdk = null;
let resolveSdk;
const kaspaSdkPromise = new Promise((resolve) => { resolveSdk = resolve; });

function readWasmBytes() {
	return fs.readFileSync(path.join(KASPA_WASM_DIR, 'kaspa_bg.wasm'));
}

function setKaspaSdk(sdk) {
	if(kaspaSdk)
		return;
	kaspaSdk = sdk;
	resolveSdk(sdk);
}

function loadKaspaSdk() {
	return kaspaSdkPromise;
}

module.exports = { loadKaspaSdk, setKaspaSdk, readWasmBytes };
