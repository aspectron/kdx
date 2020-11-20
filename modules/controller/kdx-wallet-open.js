import {html, css, BaseElement, ScrollbarStyle} from '/node_modules/@aspectron/flow-ux/src/base-element.js';
import {Wallet} from './wallet.js';

class KDXWalletOpen extends BaseElement{

	static get properties() {
		return {
			inputType:{type:String}
		};
	}

	static get styles(){
		return [ScrollbarStyle, css`
			:host{
				font-family: "Open Sans";
			}
			.input-type-btn{
				align-self:center;margin:5px 10px;cursor:pointer;
			}
			flow-btn{vertical-align:bottom;margin-bottom:5px;}
		`];
	}
	constructor() {
		super();
		this.inputType = "password";
	}
	render(){
		let icon = this.inputType=="password"?'eye':'eye-slash';
		return html`
			<flow-input class="password" outer-border
				label="Unlock the wallet with your password" 
				type="${this.inputType}" placeholder="Password">
				<fa-icon class="input-type-btn" slot="sufix"
					@click="${this.changeInputType}"
					icon="${icon}"></fa-icon>
			</flow-input>
			<flow-btn @click="${this.openWallet}">OPEN WALLET</flow-btn>
		`
	}
	updated(changes){
        super.updated(changes);
    }
    changeInputType(){
    	this.inputType = this.inputType=="password"?'text':'password';
    }
    openWallet(){
    	let password = this.renderRoot.querySelector(".password").value;
    	
    }
}

KDXWalletOpen.define("kdx-wallet-open");