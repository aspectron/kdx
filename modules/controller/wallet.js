const {Wallet, kaspaSetup} = require("kaspa-wallet");
const crypto = require('crypto');
kaspaSetup();
//console.log("Wallet", Wallet)
export const {RPC} = require("kaspa-wallet-grpc-node");
import {html, css} from '/node_modules/@aspectron/flow-ux/src/base-element.js';


Wallet.setRPC(new RPC({
	clientConfig:{
		host:"127.0.0.1:16210"
	}
}))

export const setLocalSetting = (name, value, prefix='kaspa-')=>{
	if(!window.localStorage)
		return

	console.log("setLocalSetting ", name+":", value)

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


export const getUniqueId = (mnemonic)=>{
	const secret = 'c0fa1bc00531bd78ef38c628449c5102aeabd49b5dc3a2a516ea6ea959d6658e';
	/*
	return crypto.createHmac('sha256', secret)
		.update(mnemonic)
		.digest('hex');
	*/
	return crypto.scryptSync(mnemonic, secret, 20, { N: 1024 }).toString('hex');
}

export const validatePassword = (password)=>{
	const regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
	return regex.test(password);
}

export const askForPassword = async (args, callback)=>{
	if(typeof args == 'function'){
		callback = args;
		args = {};
	}
	const {confirmBtnText="CONFIRM"} = args||{}
	let inputType = "password";
	let icon = "eye";
	let errorMessage = "";
	const updateDialog = ()=>{
		dialog.body = body();
		//dialog.requestUpdate("body", null)
	}
	const changeInputType = ()=>{
		inputType = inputType=="password"?"text":"password";
		icon = inputType=="password"?'eye':'eye-slash';
		updateDialog();
	}
	let body = ()=>{
		return html`
			<div class="msg">Enter a password to send a transaction.</div>
			<flow-input label="Password" class="password full-width" outer-border
				name="password" type="${inputType}" placeholder="Password">
				<fa-icon class="fa-btn"
					slot="sufix"
					@click="${changeInputType}"
					icon="${icon}"></fa-icon>
			</flow-input>
			<div class="error-msg">${errorMessage}</div>
		`
	}

	const p = FlowDialog.show({
		title:"Password",
		body:body(),
		cls:"short-dialog",
		btns:['Cancel',{
			text:confirmBtnText,
			value:"send",
			handler(resolve, result){
				let {values} = result;
				let {password} = values;
				if(!validatePassword(password)){
					errorMessage = `At least 8 characters, one capital, one lower,
    				one number, and one symbol`
    				updateDialog()
    				return
    			}
				resolve(result)
			}
		}]
	});
	const {dialog} = p;
	const result = await p;
	result.password = result.values.password;
	callback(result)
}

Wallet.getLocalWallet = getLocalWallet;
Wallet.setLocalWallet = setLocalWallet;

window.askForPassword = askForPassword;

export {Wallet};
