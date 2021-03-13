console.log("modulemodulemodule1111")
const mod = require("@kaspa/wallet");
console.log("modulemodulemodule2222")
let keys = Object.keys(mod).join(", ")
console.log("modulemodulemodule", keys)
export const {
	helper, Wallet, Storage, initKaspaFramework
} = mod;