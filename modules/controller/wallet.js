const {Wallet, bitcoreKaspaSetup} = require("kaspa-module").default;
bitcoreKaspaSetup();
//console.log("Wallet", Wallet)

import {getLocalSetting as getLS, setLocalSetting as setLS} from '/node_modules/@aspectron/flow-ux/src/base-element.js';

const prefix = 'kaspa-';

export const getLocalSetting = (key, defaults)=>{
	return getLS(key, defaults, prefix)
}

export const setLocalSetting = (key, value)=>{
	return setLS(key, value, prefix)
}

export const getLocalWallet = ()=>{
	return getLocalSetting("wallet")
}

export const setLocalWallet = (wallet)=>{
	let oldWallet = getLocalWallet();
	if(oldWallet)
		setLocalSetting("wallet-"+Date.now(), oldWallet);

	return setLocalSetting("wallet", wallet);
}

Wallet.getLocalWallet = getLocalWallet;
Wallet.setLocalWallet = setLocalWallet;

export {Wallet, bitcoreKaspaSetup};