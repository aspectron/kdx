import {
	html, css, BaseElement, ScrollbarStyle, SpinnerStyle
} from '/node_modules/@aspectron/flow-ux/src/base-element.js';
export * from '/node_modules/@aspectron/flow-ux/src/base-element.js';
import {validatePassword} from './wallet.js';
export * from './wallet.js';;

export class Dialog extends BaseElement{

	static get properties() {
		return {
			errorMessage:{type:String},
			hideable:{type:Boolean, reflect:true}
		};
	}

	static get styles(){
		return [ScrollbarStyle, SpinnerStyle, css`
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
				box-sizing:border-box;
				width:98%;
				height:calc(100% - 10px);
				background-color:var(--flow-background-color, #F00);
				z-index:1;
				border:2px solid var(--flow-primary-color);
				border-radius:3px;
				max-width:700px;
				max-height:300px;
				margin:5px auto;
				padding:10px;
				position:relative;
				display:flex;flex-direction:column;
			}
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
			.body{flex:1;display:flex;justify-content:center;overflow:auto;}
			.inner-body{width:90%;}
			.full-width{width:100%;max-width:100%;}
			.error{
				min-height:30px;color:#F00;padding:5px;
				font-size:0.85rem;box-sizing:border-box;
			}
			.input-type-btn{
				align-self:center;margin:5px 10px;cursor:pointer;
			}
			flow-btn{vertical-align:bottom;margin-bottom:5px;}
			[hidden]{display:none}
			.buttons{margin:10px auto;display:flex;width:90%}
			.buttons flow-btn{margin:5px;}
			.buttons flow-btn:first-child{margin-left:0px;}
			.buttons flow-btn:last-child{margin-right:0px;}
		`];
	}
	render(){
		const args = this.buildRenderArgs();
		return html`
			<div class="container">
				<h2 class="heading">${this.renderHeading(args)}</h2>
				<div class="body">
					<div class="inner-body">
						${this.renderBody(args)}
					</div>
				</div>
				<div class="buttons">
					${this.renderButtons(args)}
				</div>
				<span class="close-btn" title="Close" 
					@click="${this.onCloseClick}">&times;</span>
			</div>
		`
	}
	buildRenderArgs(){
		return {};
	}
	renderHeading(args){
		return '';
	}
	renderHeading(args){
		return '';
	}
	renderButtons(args){
		return ''
	}

	firstUpdated(...args){
		super.firstUpdated(...args)
		this.qS = this.renderRoot.querySelector.bind(this.renderRoot);
		this.qSAll = this.renderRoot.querySelectorAll.bind(this.renderRoot);
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
	checkPassword(password){
    	return validatePassword(password);
    }
}