import {
	html, css, BaseElement, ScrollbarStyle,
	FlowFormat, SpinnerStyle
} from '/node_modules/@aspectron/flow-ux/flow-ux.js';
import '/node_modules/@aspectron/flow-ux/resources/extern/decimal.js/decimal.js'
import {
	initKaspaFramework, Wallet, RPC,
	setLocalWallet, getLocalWallet,
	getLocalSetting, setLocalSetting,
	getUniqueId, formatForMachine, KSP,
	GetTS
} from './wallet.js';

export * from './kdx-wallet-open-dialog.js';
export * from './kdx-wallet-seeds-dialog.js';
export * from './kdx-wallet-send-dialog.js';
export * from './kdx-wallet-receive-dialog.js';
export * from './kdx-wallet-tx-dialog.js';

class KDXWallet extends BaseElement{

	static get properties() {
		return {
			wallet:{type:Object},
			isLoading:{type:Boolean},
			errorMessage:{type:String},
			receiveAddress:{type:String},
			changeAddress:{type:String},
			txs:{type:Array},
			blueScore:{type:Number},
			status:{type:String}
		};
	}

	static get styles(){
		return [ScrollbarStyle, SpinnerStyle, css`
			.container{padding:15px;}
			.wallet-warning{
				max-width:640px;margin:5px auto;padding:10px;text-align:center;
				background-color:var(--kdx-wallet-warning-bg, #fdf8e4);
			}
			.heading{margin:5px 15px 25px;font-size:1.5rem;}
			flow-btn{vertical-align:bottom;margin:5px;}
			.error-message{color:#F00;margin:10px 0px;}
			[hidden]{display:none}
			.h-box{display:flex;align-items:center}
			.h-box .label{min-width:100px}
			.top-line{
				border-top:1px solid var(--flow-primary-color);
				padding-top:5px;margin-top:10px
			}
			.flex{flex:1}
			.body{display:flex;align-items:top;flex-wrap:wrap}
			.tx-title{width:100%;display:flex;align-items:center;margin-bottom:10px;}
			.left-area{flex:4;margin-left:20px;max-width:600px;}
			.right-area{flex:6;margin-left:20px;max-width:750px;}
			.divider{flex:1}
			@media (max-width:950px){
				.left-area,.right-area{margin:auto;min-width:none}
				.divider{min-width:100%;height:100px}
			}
			[txout] .amount{color:red}
			.buttons{margin:20px 0px;}
			/*.balances .value{text-align:right}
			.balances .balance{display:flex;justify-content: space-between;}*/
			.loading-img{width:20px;height:20px;vertical-align:text-top;}

			.balance-badge{
				display:flex;flex-direction:column;padding:10px;
				border-radius:10px;max-width:fit-content;
				/*
				box-shadow:var(--flow-box-shadow);
				border:2px solid var(--flow-primary-color);
				*/
			}
			.balance{display:flex;flex-direction:column;padding:5px;}
       		.value{font-family : "IBM Plex Sans Condensed"; font-size: 36px; margin-top: 4px;}
		 	.value-pending{
		 		font-family : "IBM Plex Sans Condensed"; font-size: 20px; margin-top: 4px;
		 	} 
			.label { font-family : "Open Sans"; font-size: 20px; }
			.label-pending { font-family : "Open Sans"; font-size: 14px; }
			.transactions {padding:15px;}
			.transactions .tx-body{overflow:hidden;text-overflow:ellipsis;}
			.tx-body .tx-id,
			.tx-body .tx-address{font-size:14px;max-width:100%;overflow:hidden;text-overflow:ellipsis;}
			[row]{display:flex;flex-direction:row;justify-content:space-between;}
			flow-qrcode{width:172px;margin-top:50px;box-shadow:var(--flow-box-shadow);}
			.address-badge{padding:15px;}
			.address-holder{display:flex}
			input.address{
				border:0px;-webkit-appearance:none;outline:none;margin:5px 10px 0px 0px;
				flex:1;overflow: hidden;text-overflow:ellipsis;font-size:16px;
				max-width:450px;background-color:transparent;color:var(--flow-primary-color);
				font-family:"Exo 2";
			}
			.qr-code-holder{
				display:flex;align-items:flex-end;justify-content:space-between;
				max-width:370px;
			}
			.status{
				display:flex;
				margin-top:50px;
			}
			.tx-open-icon{cursor:pointer;margin-left:10px;}
		`];
	}
	constructor() {
		super();
		this.txs = [];
	}

	setNetworkSettings(settings){
		this.local_kaspad_settings = settings;
	}

	async initNetworkSettings() {
		console.log("$$$$$$$$$$$$$$$ KASPAD SETTINGS", this.local_kaspad_settings);

		if(this.rpc) {
			this.rpc.disconnect();
			// !!! FIXME delete wallet instance?
			delete this.rpc;
		}

		if(!this.local_kaspad_settings)
			return false;
		
		const { network, port } = this.local_kaspad_settings;
		//const port = Wallet.networkTypes[network].port;
		this.rpc = new RPC({ clientConfig:{ host : `127.0.0.1:${port}` } });
		this.network = network;
	}
	disconnectRPC(){
		if(this.rpc)
			this.rpc.disconnect()
	}
	async connectRPC(){
		if(this.rpc)
			return this.rpc.connect()
	}
	render(){
		return html`
			<div class="container">
				<h2 class="heading">
					<fa-icon ?hidden=${!this.isLoading} 
						class="spinner" icon="spinner" style="position:absolute"></fa-icon>
				</h2>
				
				<div class="body">
					<div class="left-area">
						${this.renderBackupWarning()}
						<div class="error-message">${this.errorMessage}</div>
						${this.renderBalance()}
						${this.renderAddress()}
						${this.renderQRAndSendBtn()}
					</div>
					<div class="divider"></div>
					<div class="right-area">
						${this.renderTX()}
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
	renderAddress(){
		if(!this.wallet)
			return '';

		return html`
		<div class="address-badge">
			<div>Receive Address:</div>
			<div class="address-holder">
				<input class="address" readonly value="${this.receiveAddress||''}">
				<fa-icon ?hidden=${!this.receiveAddress} 
					@click="${this.copyAddress}"
					title="Copy to clipboard" icon="copy"></fa-icon>
			</div>
		</div>`
	}

	renderBalance(){
		if(!this.wallet || !this.wallet.balance)
			return html``;

		const { balance : { available, pending } } = this.wallet;
		// let availableBalance = 67580000000000;
		// let totalBalance = 100000000000000.40;
		// let pending = totalBalance - availableBalance;
		return html`
  			<div class="balance-badge">
                <div class="balance">
                    <span class="label">Available</span>
                    <span class="value">${this.formatKSP(available)} KSP</span>
                </div>
                <div class="balance pending">
                    <span class="label-pending">Pending</span>
                    <span class="value-pending">${this.formatKSP(pending)} KSP</span>
                </div>
            </div>
		`;

			// <!-- <flow-expandable static-icon class="balances" expand icon="wallet" no-info>
			// 	<div slot="title">
			// 		Balanace
			// 		<img class="loading-img" ?hidden=${!this.isLoading} src="/resources/images/spinner.svg">
			// 	</div>
			// 	<div class="balance">
			// 		<span class="label">Available:</span>
			// 		<span class="value">${this.formatKSP(availableBalance)} KSP</span>
			// 	</div>
			// 	<div class="balance">
			// 		<span class="label">Pending:</span>
			// 		<span class="value">${this.formatKSP(pending)} KSP</span>
			// 	</div>
			// 	<div class="balance top-line">
			// 		<span class="label">Total:</span>
			// 		<span class="value">${this.formatKSP(totalBalance)} KSP</span>
			// 	</div>
			// </flow-expandable> -->
	}

	renderQRAndSendBtn(){
		if(!this.wallet)
			return '';
		return html`
			<div class="qr-code-holder">
				<flow-qrcode text="${this.receiveAddress||""}"></flow-qrcode>
				<flow-btn primary @click="${this.showSendDialog}">SEND</flow-btn>
			</div>
			<div class="status">
				Wallet Satus: ${this.status||'Offline'},
				DAG blue score: ${this.blueScore?FlowFormat.commas(this.blueScore):''}
			</div>
		`
	}

	renderTX(){
		if(!this.wallet)
			return '';

		/*
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
		*/

		return html`
		<div class="heading">Recent transcations 
			<fa-icon title="Show all transcations" class="tx-open-icon" 
				icon="list" @click="${this.showTxDialog}"></fa-icon></div>
		<div class="transcations">
		${this.txs.slice(0, 6).map(tx=>{
			return html`
				<flow-expandable static-icon expand ?txin=${tx.in} ?txout=${!tx.in}
					icon="${tx.in?'sign-in':'sign-out'}" no-info>
					<div class="tx-title" slot="title">
						<div class="tx-date flex">${tx.date}</div>
						<div class="amount">
							${tx.in?'':'-'}${this.formatKSP(tx.amount)} KSP
						</div>
					</div>
					<div class="tx-body">
						${tx.note}
						<div class="tx-id">${tx.id}</div>
						<div class="tx-address">${tx.address}</div>
					</div>
				</flow-expandable>
			`
		})}
		</div>`
	}

	copyAddress(){
		let input = this.renderRoot.querySelector("input.address");
		input.select();
		input.setSelectionRange(0, 99999)
		document.execCommand("copy");
	}
	
	formatKSP(value){
		return KSP(value);//(value/1e8).toFixed(8).replace(/000000$/,'');
	}
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
    	this.uid = getUniqueId(await wallet.mnemonic);
    	const cache = getLocalSetting(`cache-${this.uid}`);
    	const {addresses} = cache||{};
    	if (cache && (addresses?.receiveCounter !== 0 || addresses?.changeCounter !== 0)) {
			wallet.restoreCache(cache);
			this._isCache = true;
	    }

	    wallet.on("blue-score-changed", (e)=>{
	    	this.blueScore = e.blueScore;
	    	this.status = 'Online';//TODO
	    })
	    wallet.on("balance-update", ()=>{
	    	this.requestUpdate("balance", null);
	    })
	    wallet.on("new-transaction", (tx)=>{
	    	tx.date = GetTS(new Date(tx.ts));
	    	this.txs.unshift(tx);
	    	this.txs = this.txs.slice(0, 200);
	    	this.requestUpdate("balance", null);
	    	if(this.txDialog)
	    		this.txDialog.onNewTx(tx)
	    })
	    wallet.on("new-address", (detail)=>{
	    	let {receive, change} = detail;
	    	this.receiveAddress = receive;
	    	this.changeAddress = change;
	    })

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
				await this.wallet.sync();
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
		/*
		let cache = Object.assign({}, this.wallet.cache);
		cache.utxos = Object.assign({}, cache.utxos);
		cache.utxos.utxoStorage = {};
		console.log("cache", cache)
		setLocalSetting(`cache-${this.uid}`, cache);
		*/
	}
	connectedCallback(){
		super.connectedCallback();

		initKaspaFramework().then(()=>{
			let encryptedMnemonic = getLocalWallet();
			if(encryptedMnemonic){
				showWalletInitDialog({
					mode:"open"
				}, (err, info)=>{
					info.encryptedMnemonic = encryptedMnemonic;
					this.handleInitDialogCallback(info)
				})
			}else{
				showWalletInitDialog({
					mode:"init",
					hideOpenMode:true
				}, (err, info)=>{
					console.log("showWalletInitDialog:result", info)
					this.handleInitDialogCallback(info)
				})
			}
		})
	}
	async handleInitDialogCallback({dialog, password, seedPhrase, encryptedMnemonic}){
		console.log("$$$$$$$ INIT NETWORK SETTINGS - START");
		await this.initNetworkSettings();
		console.log("$$$$$$$ INIT NETWORK SETTINGS - DONE");

		const { network, rpc } = this;
		console.log("$$$$$$$ INIT NETWORK SETTINGS", { network, rpc });

		if(!rpc)
			return FlowDialog.alert("Error", "Kaspa Daemon config is missing.");


		let {mode} = dialog;
		console.log("$$$$$$$ mode", mode)
		if(mode =="open"){
			const wallet = await Wallet.import(password, encryptedMnemonic, {network, rpc})
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

			// TODO - GET CURRENT NETWORK TYPE
			// TODO - CREATE CORRESPONDING RPC
			const wallet = new Wallet(null,null,{network,rpc});
			encryptedMnemonic = await wallet.export(password);
			setLocalWallet(encryptedMnemonic);
			setLocalSetting("have-backup", 0);
			dialog.hide();
			this.setWallet(wallet);
			return
		}

		if(mode == "recover"){
			const { network, rpc } = this;

			console.log("recover:Wallet:seedPhrase, password", seedPhrase, password)
			let wallet;
			try{
				wallet = Wallet.fromMnemonic(seedPhrase, { network, rpc });
			}catch(error){
				console.log("recover:Wallet.fromMnemonic error", error)
				dialog.setError(`Invalid seed (${error.message})`);
			}

			if(!wallet)
				return
			const encryptedMnemonic = await wallet.export(password);
			console.log("encryptedMnemonic", encryptedMnemonic)
			const imported = await Wallet.import(password, encryptedMnemonic, { network, rpc })
			.catch(error=>{
				console.log("recover:Wallet.import error", error)
			})
			if(!imported){
				dialog.setError("Invalid password.");
				return
			}
			setLocalWallet(encryptedMnemonic);
			setLocalSetting("have-backup", 1);
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
	showTxDialog(){
		if(!this.txDialog){
			this.txDialog = document.createElement("kdx-wallet-tx-dialog");
			this.parentNode.appendChild(this.txDialog);
		}
		console.log("this.txDialog", this.txDialog)
		this.txDialog.open({wallet:this}, (args)=>{})
	}
	showSendDialog(){
		if(!this.sendDialog){
			this.sendDialog = document.createElement("kdx-wallet-send-dialog");
			this.parentNode.appendChild(this.sendDialog);
		}
		console.log("this.sendDialog", this.sendDialog)
		this.sendDialog.open({wallet:this}, (args)=>{
			this.sendTx(args);
		})
	}
	showReceiveDialog(){
		if(!this.receiveDialog){
			this.receiveDialog = document.createElement("kdx-wallet-receive-dialog");
			this.parentNode.appendChild(this.receiveDialog);
		}
		let address = this.receiveAddress;
		this.receiveDialog.open({address}, (args)=>{
		})
	}

	getMiningAddress(){
		if(!this.wallet){
			FlowDialog.alert("Error", "Please unlock or create wallet.");
			return Promise.resolve(false);
		}
		if(this.receiveAddress)
			return Promise.resolve(this.receiveAddress);

		FlowDialog.alert("Please wait", "Please wait, This may take few moments, The wallet is loading.");
		return this.wallet.receiveAddress;
	}

	async sendTx(args){
		const {
			address, amount, note, fee,
			calculateNetworkFee, inclusiveFee
		} = args;
		console.log("sendTx:args", args)

		const response = await this.wallet.submitTransaction({
			toAddr: address,
			amount,
			fee, calculateNetworkFee, inclusiveFee, note
		}).catch(error=>{
			console.log("error", error)
			error = (error+"").replace("Error:", '')
			FlowDialog.alert("Error", error);
		})

		console.log("sendTx: response", response)
	}

	async estimateTx(args){
		const {
			address, amount, note, fee,
			calculateNetworkFee, inclusiveFee
		} = args;
		console.log("estimateTx:args", args)

		let error = undefined;
		const data = await this.wallet.estimateTransaction({
			toAddr: address,
			amount,
			fee, calculateNetworkFee, inclusiveFee, note
		}).catch(err=>{
			console.log("error", err)
			error = (err+"").replace("Error:", '')
		})

		let result = {data, error}
		console.log("estimateTx:", data, error);

		return result;
	}
}

KDXWallet.define("kdx-wallet");