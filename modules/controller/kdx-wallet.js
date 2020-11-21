import {html, css, BaseElement, ScrollbarStyle} from '/node_modules/@aspectron/flow-ux/src/base-element.js';
import {
	Wallet,
	setLocalWallet, getLocalWallet,
	getLocalSetting, setLocalSetting
} from './wallet.js';

export * from './kdx-wallet-open-dialog.js';

class KDXWallet extends BaseElement{

	static get properties() {
		return {
			wallet:{type:Object}
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
		`];
	}
	constructor() {
		super();
	}
	render(){
		return html`
			<div class="container">
				<h2 class="heading">Wallet</h2>
				${this.renderBackupWarning()}
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
	setWallet(wallet){
		this.wallet = wallet;
		console.log("setWallet:", wallet)
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
}

KDXWallet.define("kdx-wallet");