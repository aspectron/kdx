const crypto = require('crypto');

import {html, css, BaseElement, ScrollbarStyle} from '/node_modules/@aspectron/flow-ux/src/base-element.js';
import {
	Wallet,
	setLocalWallet, getLocalWallet,
	getLocalSetting, setLocalSetting
} from './wallet.js';

export * from './kdx-wallet-open-dialog.js';
export * from './kdx-wallet-seeds-dialog.js';

const getUniqueId = (mnemonic)=>{
	const secret = 'c0fa1bc00531bd78ef38c628449c5102aeabd49b5dc3a2a516ea6ea959d6658e';
	return crypto.createHmac('sha256', secret)
		.update(mnemonic)
		.digest('hex');
}

class KDXWallet extends BaseElement{

	static get properties() {
		return {
			wallet:{type:Object},
			isLoading:{type:Boolean},
			errorMessage:{type:String}
		};
	}

	static get styles(){
		return [ScrollbarStyle, css`
			.maskable{
				position:relative;
			}
			.maskable:after{
				content:"";
				opacity:0.9;background-color:var(--flow-background-color);
				display:block;width:100%;height:100%;position:absolute;top:0px;left:0px;
			}
			:host(.active) .maskable:after{display:none;}
			.container{
				
			}
			.heading{margin:5px 15px 25px;font-size:1.5rem;}
			.body{}
			flow-btn{vertical-align:bottom;margin-bottom:5px;}
			.error-message{color:#F00}
		`];
	}
	constructor() {
		super();
	}
	render(){
		return html`
			<div class="container">
				<h2 class="heading">
					Wallet
					<fa-icon ?hidden=${!this.isLoading} icon="spinner"></fa-icon>
				</h2>
				${this.renderBackupWarning()}
				<div class="error-message">${this.errorMessage}</div>
				<div class="body maskable">
					<div>Balanace: $123.4</div>
				</div>
			</div>
		`
	}
	renderBackupWarning(){
		let haveBackup = getLocalSetting("have-backup") == 1;
		let wallet = getLocalWallet();
		if(haveBackup || !wallet || !this.wallet)
			return '';
		return html`
			<flow-form-control class="wallet-warning" icon="exclamation-triangle">
				<div slot="title">Your wallet is only accessible from this device.
					Back it up, take it with you.</div>
				<flow-btn @click="${this.showSeedRecoveryDialog}">SHOW RECOVERY SEED</flow-btn>
				<flow-btn @click="${this.showSaveWalletDialog}">SAVE WALLET</flow-btn>
			</flow-form-control>`
	}
	show(){
		this.classList.add('active');
	}
	hide(){
		this.classList.remove('active');
	}
	showError(err){
		console.log("showError:err", err)
		this.errorMessage = err.error || err+"";
	}
	async setWallet(wallet){
		this.wallet = wallet;
		console.log("setWallet:", wallet)
		this.uid = getUniqueId(wallet.mnemonic);
		await this.loadData();
	}
	async loadData() {
		try {
			this.isLoading = true;
			const cache = getLocalSetting(`cache-${this.uid}`);
			if (
				cache &&
				(cache.addresses.receiveCounter!==0 || cache.addresses.changeCounter!== 0)
			) {
				this.log("calling loadData-> refreshState")
				await this.refreshState();
				this.isLoading = false;
			}else{
				this.log("calling loadData-> wallet.addressDiscovery")
				await this.wallet.addressDiscovery();
				setLocalSetting(`cache-${this.uid}`, this.wallet.cache);
				this.isLoading = false;
			}
		} catch (err) {
			this.isLoading = false;
			this.showError(err);
		}
	}

	async refreshState() {
		try {
			this.isLoading = true;
			if ( 1 || this.wallet.addressManager.shouldFetch.length === 0) {
				this.log("calling refreshState-> wallet.addressDiscovery")
				await this.wallet.addressDiscovery();
			} else {
				this.log("calling refreshState-> wallet.updateState")
				await this.wallet.updateState();
			}
			setLocalSetting(`cache-${this.uid}`, this.wallet.cache);
			this.isLoading = false;
		} catch (err) {
			this.isLoading = false;
			this.showError(err);
		}
	}
	connectedCallback(){
		super.connectedCallback();

		let encryptedMnemonic = getLocalWallet();
		if(encryptedMnemonic){
			showWalletInitDialog({
				mode:"open"
			}, (err, {password, dialog})=>{
				this.handleInitDialogCallback({password, dialog, encryptedMnemonic})
			})
		}else{
			showWalletInitDialog({
				mode:"create",
				hideOpenMode:true
			}, (err, {password, dialog})=>{
				this.handleInitDialogCallback({password, dialog})
			})
		}
	}
	async handleInitDialogCallback({dialog, password, encryptedMnemonic}){
		let {mode} = dialog;
		if(mode =="open"){
			const wallet = await Wallet.import(password, encryptedMnemonic)
			.catch(error=>{
				console.log("import wallet error:", error)
				dialog.setError("Incorrect passsword.");
			});

			if(!wallet)
				return

			dialog.hide();
			this.setWallet(wallet);
			return
		}
		if(mode == "create"){
			const wallet = new Wallet();
			encryptedMnemonic = await wallet.export(password);
			setLocalWallet(encryptedMnemonic);
			setLocalSetting("have-backup", 0);
			dialog.hide();
			this.setWallet(wallet);
			return
		}
	}
	showSeedRecoveryDialog(){
		let encryptedMnemonic = getLocalWallet();
		if(!this.seedsDialog){
			this.seedsDialog = document.createElement("kdx-wallet-seeds-dialog");
			this.parentNode.appendChild(this.seedsDialog);
		}
		//console.log("encryptedMnemonic", encryptedMnemonic)
		this.seedsDialog.open({encryptedMnemonic}, ({finished})=>{
			if(finished){
				setLocalSetting("have-backup", 1);
				this.requestUpdate("have-backup", null)
			}
		})
	}
}

KDXWallet.define("kdx-wallet");