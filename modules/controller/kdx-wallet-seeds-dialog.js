import {html, css, Dialog, chunks, getRandomInt, shuffle} from './dialog.js';
import {
	Wallet,
	setLocalWallet, getLocalWallet,
	getLocalSetting, setLocalSetting
} from './wallet.js';

class KDXWalletSeedsDialog extends Dialog{

	static get properties() {
		return {
			step:{type:Number, reflect:true},
			inputType:{type:String}
		};
	}

	static get styles(){
		return [Dialog.styles, css`
			.heading{text-align:center}
			.container{max-height:660px}
			.buttons{justify-content:flex-end}
			.dull-text{opacity:0.5}
			.text-center{text-align:center;}
			.words{margin:20px 0px;}
			.words .row, .button-row{display:flex;justify-content:center;}
			.words .cell{flex:1;text-align:center;padding:5px}
			.words .word{color:var(--flow-primary-color)}
			.dots{text-align:center;padding:10px;}
			.dots .dot{margin:2px}
			.button-row{margin:20px 0px;}
			.button-row flow-btn{margin:10px; flex:1;}
			.dot[icon="check"]{--fa-icon-color:var(--flow-primary-color)}
			.dot[icon="times"]{--fa-icon-color:#F00;}
			.varification-msg{margin-bottom:5px;text-align:center}
			.varification-title{margin:20px 5px;text-align:center}
			.success-msg{text-align:center;margin-top:65px}
			.varification-msg-box{min-height:80px;}
		`];
	}
	constructor() {
		super();
		this.hideable = true;
		this.step = 1;
	}
	open(args, callback){
		this.step = args.step||1;
		this.callback = callback;
		this.args = args;
		this.hideable = !!args.hideable
		this.show();
	}
	buildRenderArgs(){
		let {step} = this;
		let stepName = `Step${step}`;
		return {stepName};
	}
	renderHeading({stepName}){
		return `Recovery Seed`;
	}
	renderBody({stepName}){
		return this[`render${stepName}`]();
	}
	renderButtons({stepName}){
		return this[`render${stepName}Buttons`]();
	}
	renderStep1(){
		let {mnemonic} = this.args;
		let words = mnemonic.split(" ");
		const wordRows = chunks(words, 4);
		let indexes = [];
		while(indexes.length<3){
			let n;
			do{
				n = getRandomInt(0, 11);
			}while(indexes.includes(n));

			indexes.push(n);
		}
		this.words = words;
		this.correctWords = indexes.map(index=>words[index]);
		this.indexes = indexes;
		let otherWords = words;
		this.indexes.forEach(index=>{
			otherWords.splice(index, 1);
		})
		this.otherWords = shuffle(otherWords);
		this.varificationStep = 0;
		this.varificationStepAnswered = '';


		console.log("indexes", wordRows, indexes, this.correctWords)

		return html`
			<p>
				Your wallet is accessible by a seed phrase.
				The seed phrase is an ordered 12-word secret phrase.
			</p>
			<p>
				Make sure no one is looking, as anyone with your
				seed phrase can access your wallet your funds.
				Write it down and keep it safe.
			</p>
			<div class="words">
				${wordRows.map((words, index)=>{
					return html`
					<div class="row">
						${words.map((word, i)=>{
							return html`
							<div class="cell">
								<div class="word">${word}</div>
								${index*4+i+1}
							</div>
							`;
						})}
					</div>
					`;
				})}
			</div>
			<p class="dull-text text-center">
				Cool fact: there are more 12-word phrase combinations than nanoseconds
				since the big bang!
			</p>	
		`
	}
	renderStep2(){
		let otherWords = chunks(this.otherWords, 3);
		let words = otherWords[this.varificationStep];
		words.push(this.correctWords[this.varificationStep])
		words = shuffle(words);
		let index = this.indexes[this.varificationStep];
		let numToStr = (num)=>{
			return num+(({"1":"st", "2":"nd", "3":"rd"})[num]||'th');
		}
		let msg = `Make sure you wrote the phrase down correctly by 
				answering this quick checkup.`;
		let subMsg = '';
		if(this.varificationStepAnswered == 'error'){
			msg = 'Wrong. Retry or go back';
		}else if(this.varificationStep>0){
			if(this.varificationStep==1){
				msg = 'Good job! Two more checks to go';
				subMsg =`Be wary and cautious of your secret phrase.
						Never reveal it to anyone.`
			}
			else{
				msg = 'Awesome, one more to go!';
				subMsg = `It is recommended to keep several copies of your secret
						seed hidden away in different places.`
			}
		}
		return html`
			<div class="dots">
				${this.indexes.map((v, index)=>{
					let icon = this.varificationStepAnswered?'times':'circle';
					if(index<this.varificationStep)
						icon = "check";
					else if(index>this.varificationStep)
						icon = "circle";
					return html`<fa-icon class="dot" icon="${icon}"></fa-icon>`
				})}
			</div>
			<div class="varification-msg-box">
				<p class="varification-msg">${msg}</p>
				<div ?hidden=${!subMsg} class="sub-msg dull-text">${subMsg}</div>
			</div>
			<div class="varification-title">What is the ${numToStr(index+1)} word?</div>
			<!--div>${this.correctWords[this.varificationStep]} ${this.varificationStepAnswered}</div-->
			<div class="button-row" @click="${this.wordClick}">
				${words.map(word=>{
					return html`
					<flow-btn class="cell" data-word="${word}">
						${word}
					</flow-btn>
					`;
				})}
			</div>
		`
	}
	renderStep3(){
		return html`
			<div class="dots">
				<fa-icon class="dot" icon="check"></fa-icon>
				<fa-icon class="dot" icon="check"></fa-icon>
				<fa-icon class="dot" icon="check"></fa-icon>
			</div>
			<p class="text-center">Great Success!</p\]>
			<p class="success-msg">
				Remember...<br />
				Anyone with this 12-word phrase can access your wallet your funds.
				Keep it safe!
			</p>
		`
	}
	renderStep1Buttons(){
		return html`<flow-btn primary @click="${e=>this.step=2}">NEXT</flow-btn>`
	}
	renderStep2Buttons(){
		return html`<flow-btn primary @click="${e=>this.step=2}">BACK TO THE WORDS</flow-btn>`
	}
	renderStep3Buttons(){
		return html`<flow-btn primary @click="${this.finish}">DONE</flow-btn>`
	}
	updated(changes){
        super.updated(changes);
        if(changes.has("step")){
        	this.inputType = "password";
        }
    }
    changeInputType(){
    	this.inputType = this.inputType=="password"?'text':'password';
    }
    wordClick(e){
    	let btn = e.target.closest("flow-btn");
    	if(!btn)
    		return
    	let word = btn.dataset.word;
    	if(this.correctWords[this.varificationStep] == word){
    		if(this.varificationStep == 2){
    			this.step = 3;
    			return
    		}
    		this.varificationStepAnswered = '';
    		this.varificationStep += 1;
    		this.requestUpdate("answered", null);
    		return
    	}

    	this.varificationStepAnswered = 'error';
    	this.requestUpdate("answered", null);
    }

    finish(){
    	this.callback({finished:true, dialog:this});
    	this.callback = null;
    	this.hide();
    }

}

KDXWalletSeedsDialog.define("kdx-wallet-seeds-dialog");