import {html, css, BaseElement, ScrollbarStyle} from '/node_modules/@aspectron/flow-ux/src/base-element.js';

class KDXWalletOpenDialog extends BaseElement{

	static get properties() {
		return {
			mode:{type:String, reflect:true},
			inputType:{type:String},
			errorMessage:{type:String},
			hideable:{type:Boolean, reflect:true},
			hideOpenMode:{type:Boolean}
		};
	}

	static get styles(){
		return [ScrollbarStyle, css`
			:host{
				z-index:-10;opacity:0;
				position:absolute;top:0px;left:0px;width:100%;height:100%;
				background-color:rgba(255, 255, 255, 0.5);
				box-sizing:border-box;
				font-family: "Open Sans";
				display:none;
				align-items:center;
				justify-content:center;
			}
			:host(.active){opacity:1;z-index:100000;display:flex;}
			.container{
				width:100%;
				height:100%;
				background-color:var(--flow-background-color, #F00);
				overflow:auto;z-index:1;
				border:2px solid var(--flow-primary-color);
				border-radius:3px;
				max-width:700px;
				max-height:300px;
				margin:auto;
				padding:10px;
				position:relative;
			}
			:host([mode="restore"]) .container{max-height:350px}
			.close-btn{
			    color:var(--flow-dialog-close-btn-color, var(--flow-color));
			    position:absolute;
			    right:15px;
			    top:15px;
			    font-size:var(--flow-dialog-close-btn-font-size, 1.5rem);
			    cursor:pointer;z-index:2;
			    line-height:0px;display:none;
			}
			:host([hideable]) .close-btn{display:inline-block}
			.heading{margin:5px 15px 25px;font-size:1.5rem;}
			.sub-heading{margin:5px;font-size:1.2rem;}
			.body{display:flex;justify-content:center}
			.inner-body{width:90%;}
			.full-width{width:100%;max-width:100%;}
			.error{
				min-height:30px;color:#F00;padding:5px;
				font-size:0.8rem;box-sizing:border-box;
			}

			.input-type-btn{
				align-self:center;margin:5px 10px;cursor:pointer;
			}
			flow-btn{vertical-align:bottom;margin-bottom:5px;}
			[hidden]{display:none}
		`];
	}
	constructor() {
		super();

		window.showWalletInitDialog = (args, callback)=>{
			
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

		this.show();
	}
	render(){
		let {mode} = this;
		mode = mode[0].toUpperCase()+mode.substr(1);
		return html`
			<div class="container">
				<h2 class="heading">${`${mode} Wallet`}</h2>
				<div class="body">
					<div class="inner-body">
						${this[`render${mode}UI`]()}
					</div>
				</div>
				<span class="close-btn" title="Close" 
					@click="${this.onCloseClick}">&times;</span>
			</div>
		`
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
			<flow-btn primary @click="${this.openWallet}">OPEN WALLET</flow-btn>
			<flow-btn @click="${e=>this.mode='create'}">NEW WALLET</flow-btn>

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
			<flow-btn primary @click="${this.createWallet}">CREATE WALLET</flow-btn>
			<flow-btn ?hidden=${this.hideOpenMode} 
				@click="${e=>this.mode='open'}">I HAVE WALLET</flow-btn>	
		`
	}
	firstUpdated(...args){
		super.firstUpdated(...args)
		this.qS = this.renderRoot.querySelector.bind(this.renderRoot);
	}
	updated(changes){
        super.updated(changes);
        if(changes.has('mode')){
        	this.inputType = "password";
        	this.errorMessage = "";
        }
    }

    setError(errorMessage){
    	this.errorMessage = errorMessage;
    }

    show(){
		this.classList.add('active');
	}

	hide(){
		this.classList.remove('active');
	}

	onCloseClick(){
		this.hide();
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
    checkPassword(password){
    	const regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
    	return regex.test(password);
    }
}

KDXWalletOpenDialog.define("kdx-wallet-open-dialog");