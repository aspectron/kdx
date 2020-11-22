const {Wallet, bitcoreKaspaSetup} = require("kaspa-module").default;
bitcoreKaspaSetup();
//console.log("Wallet", Wallet)
export const {RPC} = require("kaspa-module-node");

Wallet.setRPC(new RPC({
	clientConfig:{
		host:"127.0.0.1:16210"
	}
}))

export const setLocalSetting = (name, value, prefix='kaspa-')=>{
	if(!window.localStorage)
		return

	window.localStorage.setItem(prefix+name, JSON.stringify(value));
}

export const getLocalSetting = (name, defaults=undefined, prefix='kaspa-')=>{
	if(!window.localStorage)
		return defaults;

	let value = window.localStorage.getItem(prefix+name);
	if(typeof(value) == 'undefined')
		return defaults

	return JSON.parse(value);
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