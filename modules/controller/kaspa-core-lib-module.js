const module = require("@kaspa/core-lib");
console.log("modulemodulemodule")
let keys = Object.keys(module);
console.log("modulemodulemodule")
console.log("xxxxxxx", keys.join(", "))
export const {
	helper, Wallet, Storage, initKaspaFramework
} = module;