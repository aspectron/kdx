import {html, css, BaseElement, ScrollbarStyle} from '/node_modules/@aspectron/flow-ux/src/base-element.js';
import {
	Wallet,
	setLocalWallet, getLocalWallet,
	getLocalSetting, setLocalSetting,
	getUniqueId
} from './wallet.js';

export * from './kdx-wallet-open-dialog.js';
export * from './kdx-wallet-seeds-dialog.js';
export * from './kdx-wallet-send-dialog.js';
export * from './kdx-wallet-receive-dialog.js';

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
			.container{padding:15px;}
			.maskable{
				position:relative;
			}
			.maskable:after{
				content:"";
				opacity:0.9;background-color:var(--flow-background-color);
				display:block;width:100%;height:100%;position:absolute;top:0px;left:0px;
			}
			:host(.active) .maskable:after{display:none;}
			.wallet-warning{
				max-width:640px;margin:5px auto;padding:10px;text-align:center;
				background-color:var(--kdx-wallet-warning-bg, #fdf8e4);
			}
			.heading{margin:5px 15px 25px;font-size:1.5rem;}
			flow-btn{vertical-align:bottom;margin-bottom:5px;}
			.error-message{color:#F00;margin:10px 0px;}
			[hidden]{display:none}
			.h-box{display:flex;align-items:center}
			.h-box .label{min-width:100px}
			.top-line{
				border-top:1px solid var(--flow-primary-color);
				padding-top:5px;margin-top:10px
			}
			.flex{flex:1}
			.body{display:flex;align-items:top}
			.tx-title{width:100%;display:flex;align-items:center;margin-bottom:10px;}
			.left-area{flex:4}
			.right-area{flex:3}
			[txout] .amount{color:red}
			.buttons{margin:20px 0px;}
			.balances .value{text-align:right}
			.balances .balance{display:flex;justify-content: space-between;}
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
				
				<div class="body">
					<div class="left-area">
						${this.renderBackupWarning()}
						<div class="error-message">${this.errorMessage}</div>
						${this.renderTX()}
					</div>
					<div class="flex"></div>
					<div class="right-area">
						${this.renderBalance()}
						${this.renderButtons()}
					</div>
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
			<flow-expandable static-icon expand class="wallet-warning" icon="exclamation-triangle" no-info>
				<div slot="title">Your wallet is only accessible from this device.
					Back it up, take it with you.</div>
				<flow-btn @click="${this.showSeedRecoveryDialog}">SHOW RECOVERY SEED</flow-btn>
				<flow-btn @click="${this.showSaveWalletDialog}">SAVE WALLET</flow-btn>
			</flow-expandable>`
	}
	renderButtons(){
		if(!this.wallet)
			return '';
		return html`
			<div class="buttons">
				<flow-btn @click="${this.showSendDialog}">SEND</flow-btn>
				<flow-btn @click="${this.showReceiveDialog}">RECEIVE</flow-btn>
			</div>`
	}

	renderBalance(){
		if(!this.wallet)
			return '';
		let {availableBalance, totalBalance} = this.wallet.utxoSet;
		let pending = totalBalance - availableBalance;
		return html`
			<flow-expandable static-icon class="balances" expand icon="wallet" no-info>
				<div slot="title">
					Balanace
					<fa-icon ?hidden=${!this.isLoading} icon="spinner"></fa-icon>
				</div>
				<div class="balance">
					<span class="label">Available:</span>
					<span class="value">${this.formatKSD(availableBalance)} KSP</span>
				</div>
				<div class="balance">
					<span class="label">Pending:</span>
					<span class="value">${this.formatKSD(pending)} KSP</span>
				</div>
				<div class="balance top-line">
					<span class="label">Total:</span>
					<span class="value">${this.formatKSD(totalBalance)} KSP</span>
				</div>
			</flow-expandable>
		`
	}
	renderTX(){
		if(!this.wallet)
			return '';

		let txs = [{
			in:1,
			date: "2020-02-21 01:22",
			amount:34674330000,
			note:"Service",
			address: "kaspatest:qrjtaaaryx3ngg48p888e52fd6e7u4epjvh46p7rqz"
		},{
			in:0,
			date: "2020-02-21 01:22",
			amount:54545,
			note:"Purchase",
			address: "kaspatest:qrjtaaaryx3ngg48p888e52fd6e7u4epjvh46p7rqz"
		}]

		return html`
		<div class="heading">Resent transcations</div>
		<div class="transcations">
		${txs.map(tx=>{
			return html`
				<flow-expandable static-icon expand ?txin=${tx.in} ?txout=${!tx.in}
					icon="${tx.in?'sign-in':'sign-out'}" no-info>
					<div class="tx-title" slot="title">
						<div class="tx-date flex">${tx.date}</div>
						<div class="amount">
							${tx.in?'':'-'}${this.formatKSD(tx.amount)}KSP
						</div>
					</div>
					<div>
						${tx.note} (${tx.address})
					</div>
				</flow-expandable>
			`
		})}
		</div>`
	}
	formatKSD(value){
		return (value/1e8).toFixed(4);
	}
	/*
	show(){
		this.classList.add('active');
	}
	hide(){
		this.classList.remove('active');
	}
	*/
	showError(err){
		console.log("showError:err", err)
		this.errorMessage = err.error || err+"";
	}
	async setWallet(wallet){
		console.log("setWallet:", wallet)
		await this.getWalletInfo(wallet);
		await this.loadData();
	}
	async getWalletInfo(wallet){
		// Restore wallet and set store
		// Get network
    	//const network = LocalStorage.getItem(localSavedNetworkVar);
    	//const selectedNetwork = network || DEFAULT_NETWORK;
    	//await wallet.updateNetwork(selectedNetwork);
    	this.uid = getUniqueId(wallet.mnemonic);
    	const cache = getLocalSetting(`cache-${this.uid}`);
    	const {addresses} = cache||{};
    	if (addresses?.receiveCounter !== 0 || addresses?.changeCounter !== 0) {
			wallet.restoreCache(cache);
			this._isCache = true;
	    }

	    this.wallet = wallet;
	}
	async loadData() {
		try {
			this.isLoading = true;
			/*if (this._isCache) {
				this.log("calling loadData-> refreshState")
				await this.refreshState();
				this.isLoading = false;
			}else{*/
				this.log("calling loadData-> wallet.addressDiscovery")
				await this.wallet.addressDiscovery();
				this.saveCache();
				this.isLoading = false;
			/*}*/
		} catch (err) {
			this.isLoading = false;
			this.showError(err);
		}
	}

	/*
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
			this.saveCache();
			this.isLoading = false;
		} catch (err) {
			this.isLoading = false;
			this.showError(err);
		}
	}
	*/
	saveCache(){
		let cache = Object.assign({}, this.wallet.cache);
		cache.utxos = Object.assign({}, cache.utxos);
		cache.utxos.utxoStorage = {};
		console.log("cache", cache)
		setLocalSetting(`cache-${this.uid}`, cache);
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
	showSendDialog(){
		if(!this.sendDialog){
			this.sendDialog = document.createElement("kdx-wallet-send-dialog");
			this.parentNode.appendChild(this.sendDialog);
		}
		console.log("this.sendDialog", this.sendDialog)
		this.sendDialog.open({}, ()=>{
			
		})
	}
	showReceiveDialog(){
		if(!this.receiveDialog){
			this.receiveDialog = document.createElement("kdx-wallet-receive-dialog");
			this.parentNode.appendChild(this.receiveDialog);
		}
		let {address} = this.wallet.addressManager.receiveAddress.current;
		this.receiveDialog.open({address}, ()=>{
			
		})
	}
}

KDXWallet.define("kdx-wallet");