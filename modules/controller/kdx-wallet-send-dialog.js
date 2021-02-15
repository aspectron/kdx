import {
	html, css, Dialog, askForPassword, KAS,
	formatForMachine, formatForHuman
} from './dialog.js';
const pass = "";

class KDXWalletSendDialog extends Dialog{
	static get styles(){
		return [Dialog.styles, 
		css`
			.container{
				max-height:670px;
				--flow-input-label-font-size: 0.9rem;
				--flow-input-label-padding: 5px 7px;
				--flow-input-font-family: 'Consolas';
				--flow-input-font-size:14px;
				--flow-input-font-weight: normal;
				--flow-input-height:50px;
				--flow-input-margin: 20px 0px;
				--flow-input-padding: 10px 10px 10px 16px;
			
			}
			.buttons{justify-content:flex-end;align-items:center}
			.spinner{margin-right:20px}
			.estimate-tx-error{color:red}
			.estimate-tx span{display:block}	
			flow-checkbox{width:100%;margin:15px 0px;}
			[col] { display:flex; flex-direction: row;flex-wrap:wrap }
			[spacer] { min-width: 32px; }
			[flex] { flex:1; }
			flow-input{min-width:100px;}
			flow-input.amount,
			flow-input.fee{flex:1}
			flow-checkbox{margin:8px 0px;}
			@media (max-width:400px){
				[spacer] { min-width: 100%; }
			}
		`]
	}
	renderHeading(){
		return 'SEND';
	}
	renderBody(){
		return html`
			<!--div class="sub-heading">Send funds
			to: kaspatest:qrhefqj5c80m59d9cdx4ssxw96vguvn9fgy6yc0qtd
			</div-->
			<flow-input class="address full-width" outer-border
				label="Recipient Address (Must start with 'kaspa' prefix)" value=""
				placeholder="">
			</flow-input>
			<div col>
				<flow-input class="amount full-width" outer-border
					label="Amount in KAS" @keyup=${this.onAmountChange}
					placeholder="">
				</flow-input>
				<div spacer></div>
				<flow-input class="fee full-width"
					label="Priority Fee"
					@keyup="${this.onNetworkFeeChange}">
				</flow-input>
			</div>
			<flow-input class="note full-width" outer-border label="Note"></flow-input>
			<flow-checkbox class="calculate-network-fee" checked
				@changed="${this.onCalculateFeeChange}">Automatically calculate network fee</flow-checkbox>
			<!--flow-input class="maximum-fee full-width" label="Maximum network fee"></flow-input-->
			<flow-checkbox class="inclusive-fee"
				@changed="${this.onInclusiveFeeChange}">Include fee in the amount</flow-checkbox>
			${this.renderEstimate()}
			<div class="error">${this.errorMessage}</div>`;
	}
	renderEstimate(){
		if(this.estimateError)
			return html`<div class="estimate-tx-error">${this.estimateError}</div>`;
		let {dataFee, fee, totalAmount, txSize} = this.estimate;
		return html`<div class="estimate-tx">
			${txSize?html`<span class="tx-size">Transaction size: ${txSize.toFileSize()}<span>`:''}
			${dataFee?html`<span class="tx-data-fee">Data fee: ${KAS(dataFee)} KAS<span>`:''}
			${fee?html`<span class="tx-fee">Total fee: ${KAS(fee)} KAS<span>`:''}
			${totalAmount?html`<span class="tx-total">Total: ${KAS(totalAmount)} KAS<span>`:''}
		</div>`
	}
	renderButtons(){
		const estimating = this.estimateTxSignal && !this.estimateTxSignal.isResolved;
		const estimateFee = this.estimate?.fee;
		console.log("renderButtons", this.estimate)
		return html`
			${estimating?html`<fa-icon 
				class="spinner" icon="spinner"
				style__="position:absolute"></fa-icon>`:''}
			<flow-btn @click="${this.cancel}">Cancel</flow-btn>
			<flow-btn primary 
				?disabled=${estimating || !this.estimateTxSignal || !estimateFee}
				@click="${this.sendAfterConfirming}">SEND
			</flow-btn>`
	}
	open(args, callback){
		this.callback = callback;
		this.args = args;
		this.wallet = args.wallet;
		this.estimateError = "";
		this.estimate = {};
		this.alertFeeAmount = 3000;
		this.show();
	}
	cleanUpForm(){
		this.qSAll("flow-input").forEach(input=>{
    		input.value = "";
    	})
	}
    cancel(){
    	this.cleanUpForm();
    	this.hide();
    }
    getFormData(){
    	let address = this.qS(".address").value;
    	let amount = this.qS(".amount").value;
    	let note = this.qS(".note").value;
    	let fee = this.qS(".fee").value;
    	let calculateNetworkFee = !!this.qS(".calculate-network-fee").checked;
    	let inclusiveFee = !!this.qS(".inclusive-fee").checked;
    	/*
    	let networkFeeMax = this.qS(".maximum-fee").value;
    	if(networkFeeMax && fee && fee>networkFeeMax){
    		this.setError("Invalid fee")
    		return
    	}
    	*/

    	return {
    		amount:formatForMachine(amount),
    		fee:formatForMachine(fee),
    		address, note, 
    		calculateNetworkFee,
    		inclusiveFee
    	};
    }
    onNetworkFeeChange(){
    	this.estimateTx();
    }
    onAmountChange(){
    	this.estimateTx();
    }
    onCalculateFeeChange(){
    	this.estimateTx();
    }
    onInclusiveFeeChange(){
    	this.estimateTx();
    }
    
	estimateTx(){
		this.debounce('estimateTx', ()=>{
			this.requestUpdate("estimateTx", null)
			let p = this._estimateTx();
			p.then(()=>{
				p.isResolved = true;
				this.requestUpdate("estimateTx", null)
			})

			this.estimateTxSignal = p;
		}, 300)
	}

	async _estimateTx(){
    	const formData = this.getFormData();
    	if(!formData)
    		return

    	console.log("formData:", formData)
    	let {error, data:estimate} = await this.wallet.estimateTx(formData);
    	console.log("estimateTx:error:", error, "estimate:", estimate)
    	this.estimateError = error;
    	if(estimate){
    		this.estimate = estimate;
    	}else{
    		this.estimate = {};
    	}
    }
    async sendAfterConfirming(){
    	let estimate = this.estimate;
    	if(!estimate)
    		return
    	if(estimate.fee > this.alertFeeAmount){
    		let {btn} = await FlowDialog.alert("Warning", 
    			html`Transaction Fee (${KAS(estimate.fee)} KAS) is very large.`,
    			'',
    			['Cancel', 'Submit:primary']);

    		if(btn !='submit')
    			return
    	}
    	const formData = this.getFormData();
    	if(!formData)
    		return
    	console.log("formData", formData)
    	askForPassword({confirmBtnText:"CONFIRM SEND", pass}, ({btn, password})=>{
    		console.log("btn, password", btn, password)
    		if(btn!="confirm")
    			return
			formData.password = password;
			this.hide();
			this.callback(formData);
    	})
    }
}

KDXWalletSendDialog.define("kdx-wallet-send-dialog");