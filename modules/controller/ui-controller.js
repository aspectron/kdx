true && typeof(nw) != "undefined" && nw.Window && nw.Window.get().showDevTools()
class UIController{
	constructor(){
		this.init();
	}
	init(){
		this.initCaption();
		this.initSettings();
	}
	initCaption(){
		let caption = document.querySelector('flow-caption-bar');
		this.caption = caption;
		caption.tabs = [{
			title : "Home",
			id : "home"
		},{
			title: "Data Folder",
			id:"data-folder"
		},{
			title : "Settings",
			id : "settings"
		},{
			title : "RPC",
			id : "rpc",
			disable:true
		}];

		caption["active-tab"] = "settings";
	}
	initSettings(){
		let scriptHolder = document.querySelector('#settings-script');
		let advancedEl = document.querySelector('#settings-advanced');
		advancedEl.addEventListener('changed', (e)=>{
			//console.log("advancedEl", e.detail.checked)
			//caption.tabs[2].disable = !e.detail.checked;
			//caption.tabs = caption.tabs.slice(0);
			//caption.requestTabsUpdate();
			let advanced = e.detail.checked;
			this.caption.set("tabs.3.disable", !advanced)
			scriptHolder.classList.toggle("active", advanced)
		})
		this.scriptEditor = ace.edit(scriptHolder.querySelector(".script-box"), {
			mode : 'ace/mode/javascript',
			selectionStyle : 'text'
		});
		this.scriptEditor.setTheme("ace/theme/chrome");
		this.scriptEditor.session.setUseWrapMode(false);
		this.scriptEditor.session.on('change', (delta) => {
			//console.log("scriptEditorChange",delta);

			if(this.disableScriptUpdates)
				return;

			let script = this.scriptEditor.session.getValue();
			this.onConfigValueChange(script);

		});
	}
	onConfigValueChange(config){

	}
}

const uiController = new UIController();

/*
caption.addEventListener('test', (e)=>{
	console.log("##### XXXXXXXXXXXXXXXXX ###### test-event", e)
})

//console.log("caption", caption, caption.fire)
document.addEventListener("WebComponentsReady", ()=>{
	//console.log("WebComponentsReady WebComponentsReady WebComponentsReady")
	caption.fire('test', {testing:true}, {bubbles:true})
})
*/