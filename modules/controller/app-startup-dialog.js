import {html, css, BaseElement, ScrollbarStyle} from '/node_modules/@aspectron/flow-ux/src/base-element.js';

class AppStartupDialog extends BaseElement{

	static get properties() {
		return {
			heading:{type:String},
			content:{type:String}
		};
	}

	static get styles(){
		return [ScrollbarStyle, css`
			:host{z-index:-10;opacity:0}
			:host(.active){opacity:1;z-index:100000}
			:host{
				position:fixed;top:0px;left:0px;width:100%;height:100%;
				background-color:rgba(255, 255, 255, 0.5);
				box-sizing:border-box;
				font-family: "Open Sans";
			}
			.container{
				position:absolute;
				top:5%;left:5%;
				width:90%;
				height:90%;
				background-color:var(--flow-background-color, #F00);
				overflow:auto;z-index:1;
				border:2px solid var(--flow-primary-color);
			}

			.close-btn{
			    color:var(--flow-dialog-close-btn-color, var(--flow-color));
			    position:absolute;
			    right:calc(5% + 15px);
			    top:calc(5% + 15px);
			    font-size:var(--flow-dialog-close-btn-font-size, 1.5rem);
			    cursor:pointer;z-index:2;
			    line-height:0px;
			}

			@media(max-width:425px){
				.container{

				}
			}
		`];
	}

	constructor() {
		super();
		window.showReleaseNotesDialog = (show=true)=>{
			if(show)
				this.show();
			else
				this.hide();
		}

		/*
		this.addEventListener("click", ()=>{
			this.hide();
		})
		*/
	}


	render(){
		return html`
			<div class="container">
				<h1>${this.heading}</h1>
				<flow-markdown><textarea>${this.content||""}</textarea></flow-markdown>
			</div>
			<span class="close-btn" title="Close" 
				@click="${this.onCloseClick}">&times;</span>
		`
	}
	updated(changes){
        super.updated(changes);
        if(changes.has("content")){
            this.markdown.updateHtml();
        }
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

	firstUpdated(){
		this.markdown = this.renderRoot.querySelector("flow-markdown");
	}
}

AppStartupDialog.define("app-startup-dialog");