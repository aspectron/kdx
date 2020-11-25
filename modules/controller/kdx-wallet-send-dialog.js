import {html, css, Dialog, askForPassword} from './dialog.js';

class KDXWalletSendDialog extends Dialog{
	static get styles(){
		return [Dialog.styles, 
		css`
			.container{max-height:400px}
			.buttons{justify-content:flex-end}
		`]
	}
	renderHeading(){
		return 'SEND';
	}
	renderBody(){
		return html`
			<!--div class="sub-heading">Send funds</div-->
			<flow-input class="address full-width" outer-border
				label="Recipient Kaspa Address"
				placeholder="kaspatest:qrjtaaaryx3ngg48p888e52fd6e7u4epjvh46p7rqz">
			</flow-input>
			<flow-input class="amount full-width" outer-border
				label="Amount in KAS"
				placeholder="1">
			</flow-input>
			<flow-input class="note full-width" outer-border label="Note">
			</flow-input>
			<div class="error">${this.errorMessage}</div>`;
	}
	renderButtons(){
		return html`
			<flow-btn @click="${this.cancel}">Cancel</flow-btn>
			<flow-btn primary @click="${this.sendAfterConfirming}">SEND</flow-btn>`
	}
	open(args, callback){
		this.callback = callback;
		this.args = args;
		this.show();
	}
    cancel(){
    	this.qSAll("flow-input").forEach(input=>{
    		input.value = "";
    	})
    	this.hide();
    }
    sendAfterConfirming(){
    	let address = this.qS(".address").value;
    	let amount = this.qS(".amount").value;
    	let note = this.qS(".note").value;

    	let info = {address, amount, note};
    	askForPassword({confirmBtnText:"CONFIRM SEND"}, ({btn, password})=>{
    		if(btn!="send")
    			return
			info.password = password;
			this.send(info);
    	})
    }
    send(info){
    	console.log("info", info)
    }
}

KDXWalletSendDialog.define("kdx-wallet-send-dialog");