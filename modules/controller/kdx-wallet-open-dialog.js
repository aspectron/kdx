import {html, css, Dialog} from './dialog.js';

class KDXWalletOpenDialog extends Dialog{

	static get properties() {
		return {
			mode:{type:String, reflect:true},
			inputType:{type:String},
			hideOpenMode:{type:Boolean}
		};
	}

	static get styles(){
		return [Dialog.styles, css`
			:host([mode="restore"]) .container{max-height:350px}
		`];
	}
	constructor() {
		super();

		window.showWalletInitDialog = (args, callback)=>{

			//return callback(null, {password:"Asd123###", dialog:this, mode:"open"});
			
			this.hideable = !!args.hideable;
			this.mode = args.mode||"open";
			this.callback = callback;
			this.hideOpenMode = !!args.hideOpenMode;

			this.args = args;
			this.show();
		}

		window.hideWalletInitDialog = ()=>{
			this.hide();
		}

		this.mode = "open";
		this.inputType = "password";
	}
	buildRenderArgs(){
		let {mode} = this;
		let modeName = mode[0].toUpperCase()+mode.substr(1);
		return {modeName};
	}
	renderHeading({modeName}){
		return `${modeName} Wallet`;
	}
	renderBody({modeName}){
		return this[`render${modeName}UI`]();
	}
	renderButtons({modeName}){
		return this[`render${modeName}Buttons`]();
	}
	renderOpenUI(){
		let icon = this.inputType=="password"?'eye':'eye-slash';
		return html`
			<div class="sub-heading">Unlock the wallet with your password</div>
			<flow-input class="password full-width" outer-border
				type="${this.inputType}" placeholder="Password">
				<fa-icon class="input-type-btn" slot="sufix"
					@click="${this.changeInputType}"
					icon="${icon}"></fa-icon>
			</flow-input>
			<div class="error">${this.errorMessage}</div>
		`
	}
	renderCreateUI(){
		let icon = this.inputType=="password"?'eye':'eye-slash';
		let pass = "Asd123###";
		return html`
			<div class="sub-heading">Create a password for your new wallet</div>
			<flow-input class="password full-width" outer-border value="${pass}"
				type="${this.inputType}" placeholder="Password">
				<fa-icon class="input-type-btn" slot="sufix"
					@click="${this.changeInputType}"
					icon="${icon}"></fa-icon>
			</flow-input>
			<flow-input class="cfm-password full-width" outer-border value="${pass}"
				type="${this.inputType}" placeholder="Confirm Password">
				<fa-icon class="input-type-btn" slot="sufix"
					@click="${this.changeInputType}"
					icon="${icon}"></fa-icon>
			</flow-input>
			<div class="error">${this.errorMessage}</div>
		`
	}
	renderOpenButtons(){
		return html`
			<flow-btn primary @click="${this.openWallet}">OPEN WALLET</flow-btn>
			<flow-btn @click="${e=>this.mode='create'}">NEW WALLET</flow-btn>`;
	}
	renderCreateButtons(){
		return html`
			<flow-btn primary @click="${this.createWallet}">CREATE WALLET</flow-btn>
			<flow-btn ?hidden=${this.hideOpenMode} 
				@click="${e=>this.mode='open'}">I HAVE WALLET</flow-btn>`;
	}
	updated(changes){
        super.updated(changes);
        if(changes.has('mode')){
        	this.inputType = "password";
        	this.errorMessage = "";
        }
    }

    changeInputType(){
    	this.inputType = this.inputType=="password"?'text':'password';
    }
    openWallet(){
    	let password = this.qS(".password").value;
    	if(!this.checkPassword(password))
    		return this.setError("At least 8 characters, one capital, one lower, one number, and one symbol")

    	this.callback(null, {password, dialog:this});
    }
    createWallet(){
    	let password = this.qS(".password").value.trim();
    	let password2 = this.qS(".cfm-password").value;
    	if(!this.checkPassword(password))
    		return this.setError("At least 8 characters, one capital, one lower, one number, and one symbol")

    	if(password != password2)
    		return this.setError("Passwords do not match")

    	this.callback(null, {password, dialog:this});
    }
}

KDXWalletOpenDialog.define("kdx-wallet-open-dialog");