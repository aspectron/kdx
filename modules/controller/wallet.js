const {Wallet, initKaspaFramework} = require("kaspa-wallet-worker");
let {Mnemonic} = Wallet;
console.log("Wallet", Wallet)
window.testSeed = new Mnemonic(Mnemonic.Words.ENGLISH).toString();
console.log("test Mnemonic: ", window.testSeed)
const crypto = require('crypto');

export const {RPC} = require("kaspa-grpc-node");
import {html, css} from '/node_modules/@aspectron/flow-ux/src/base-element.js';


export const GetTS = (d=null)=>{
    d = d || new Date();
    let year = d.getFullYear();
    let month = d.getMonth()+1; month = month < 10 ? '0' + month : month;
    let date = d.getDate(); date = date < 10 ? '0' + date : date;
    let hour = d.getHours(); hour = hour < 10 ? '0' + hour : hour;
    let min = d.getMinutes(); min = min < 10 ? '0' + min : min;
    let sec = d.getSeconds(); sec = sec < 10 ? '0' + sec : sec;
    //var time = year + '-' + month + '-' + date + ' ' + hour + ':' + min + ':' + sec;
    return `${year}-${month}-${date} ${hour}:${min}:${sec}`;
}

/**
 * Converts from sompis to KSP
 * @param val Value to convert, as string or number
 * @returns Converted value as a string
 */
export const formatForHuman = (val)=>{
  return String(Number(val) / 1e8 );
}

/**
 * Converts from KSP to sompis
 * @param val Value to convert, as string or number
 * @returns Converted value as a string
 */
export const formatForMachine = (val)=>{
  return Number(val) * 1e8;
}

export const KSP = (v, trailingZeros) => {
    var [int,frac] = Decimal(v).mul(1e-8).toFixed(8).split('.');
    int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if(trailingZeros)
        return `${int}.${frac}`;
    frac = frac?.replace(/0+$/,'');
    return frac ? `${int}.${frac}` : int;
}

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
	const {
		confirmBtnText="CONFIRM",
		confirmBtnValue="confirm",
		pass="",
		msg="",
		title="Enter a password"
	} = args||{}
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
			<div class="msg">${msg}</div>
			<flow-input class="password full-width" outer-border
				name="password" type="${inputType}" placeholder="Password"
				value="${pass}">
				<fa-icon class="fa-btn"
					slot="sufix"
					@click="${changeInputType}"
					icon="${icon}"></fa-icon>
			</flow-input>
			<div class="error-msg">${errorMessage}</div>
		`
	}

	const p = FlowDialog.show({
		title,
		body:body(),
		cls:"short-dialog",
		btns:['Cancel',{
			text:confirmBtnText,
			value:confirmBtnValue,
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

export {Wallet, initKaspaFramework};
