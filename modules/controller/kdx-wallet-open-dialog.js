import {html, css, Dialog} from './dialog.js';
const pass = "Asd123###";

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
			:host([mode="create"]) .container{max-height:320px}
			:host([mode="init"]) .container{max-height:200px}
			:host([mode="recover"]) .container{max-height:450px}
			.buttons{justify-content:flex-end}
			:host([mode="init"]) .buttons{justify-content:center}

			.text-center, .heading{text-align:center;}
			.words{margin:20px 0px;}
			.words .row{display:flex;justify-content:center;}
			.words .cell{flex:1;text-align:center;padding:5px}
			input.seed{
				border:1px solid var(--flow-primary-color);
				border-radius:3px;
				padding:5px;
			}
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

		this.mode = "init";
		this.inputType = "password";
	}
	buildRenderArgs(){
		let {mode} = this;
		let modeName = mode[0].toUpperCase()+mode.substr(1);
		return {modeName};
	}
	renderHeading({modeName}){
		if(modeName == 'Init')
			return '';
		return `${modeName} Wallet`;
	}
	renderBody({modeName}){
		return this[`render${modeName}UI`]();
	}
	renderButtons({modeName}){
		return this[`render${modeName}Buttons`]();
	}
	renderInitUI(){
		return html`
			<div class="sub-heading text-center">Welcome to Kaspa Wallet</div>
		`
	}
	renderRecoverUI(){
		let rows = [0, 1, 2];
		let cells = [0, 1, 2, 3];
		let seed = testSeed.split(" ");
		return html`
			<p class="sub-heading text-center">
				Enter your 12-word seed phrase to recover your wallet
			</p>
			<div class="words" @input=${this.onSeedInput}>
				${rows.map((v, index)=>{
					return html`
					<div class="row">
						${cells.map((v, i)=>{
							return html`
							<div class="cell">
								<input class="seed word" value="${seed[index*4+i]}" data-index="${index*4+i}" />
							</div>
							`;
						})}
					</div>
					`;
				})}
			</div>
			<div class="error">${this.errorMessage}</div>
		`
	}
	renderOpenUI(){
		let icon = this.inputType=="password"?'eye':'eye-slash';
		return html`
			<div class="sub-heading">Unlock the wallet with your password</div>
			<flow-input class="password full-width" outer-border value="${pass}"
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
		return html`
			<div class="sub-heading">Create a password for your new wallet</div>
			<flow-input class="password full-width" outer-border value="${pass}"
				type="${this.inputType}" placeholder="Password">
				<fa-icon class="input-type-btn" slot="sufix"
					@click="${this.changeInputType}"
					icon="${icon}"></fa-icon>
			</flow-input>
			<div class="sub-heading">Confirm password</div>
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
			<flow-btn @click="${e=>this.mode='create'}">NEW WALLET</flow-btn>
			<flow-btn primary @click="${this.openWallet}">OPEN WALLET</flow-btn>`;
	}
	renderCreateButtons(){
		return html`
			<flow-btn @click="${e=>this.mode='init'}">Cancel</flow-btn>
			<flow-btn ?hidden=${this.hideOpenMode} 
				@click="${e=>this.mode='open'}">I HAVE WALLET</flow-btn>
			<flow-btn primary @click="${this.createWallet}">CREATE WALLET</flow-btn>
			`;
	}
	renderInitButtons(){
		return html`
			<flow-btn @click="${e=>this.mode='create'}">Create New Wallet</flow-btn>
			<flow-btn @click="${e=>this.mode='recover'}">Recover from Seed</flow-btn>`;
	}
	renderRecoverButtons(){
		return html`
			<flow-btn @click="${e=>this.mode='init'}">Cancel</flow-btn>
			<flow-btn primary @click="${this.recoverWallet}">Recover Wallet</flow-btn>`;
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
    onSeedInput(e){
    	let input = e.target.closest("input.seed");
    	if(!input || !input.dataset.index != "0")
    		return
    	let words = (input.value+"").split(" ");
    	if(words.length<2)
    		return

    	this.qSAll("input.seed.word").forEach(input=>{
    		let index = input.dataset.index;
    		input.value = words[index];
    	});

    }
    recoverWallet(){
    	let wordsMap = {};
    	let isInvalid = false;
    	this.qSAll("input.seed.word").forEach(input=>{
    		let index = input.dataset.index;
    		wordsMap[index] = input.value;
    		if(input.value.length<2)
    			isInvalid = true;
    	});

    	let words = [];
    	for(let i=0; i<12; i++){
    		words.push(wordsMap[i])
    	}

    	if(isInvalid || !words.join("").length)
    		return this.setError("Please provide valid words");

    	console.log("words", words)
    	askForPassword({
    		title:"Password to encryt the wallet",
    		confirmBtnText:"Encrypt Wallet"
    	}, ({btn, password})=>{
    		if(!password || btn != 'ok')
    			return
	    	this.callback(null, {seedPhrase:words.join(" "), password, dialog:this});
	    })
    }
}

KDXWalletOpenDialog.define("kdx-wallet-open-dialog");