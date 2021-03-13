const mod = require("@kaspa/wallet-worker");
let keys = Object.keys(mod).join(", ")
console.log("sssssssssss keys:1:", keys)
export const {Wallet, initKaspaFramework, log, workerLog, Core, Storage, helper} = mod;
console.log("sssssssssss keys:2:", keys)
