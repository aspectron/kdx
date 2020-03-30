true && typeof(nw) != "undefined" && nw.Window && nw.Window.get().showDevTools()
const rpc = new RPC();
window.rpc = rpc;

/*
rpc.on("config", (msg, from)=>{
	console.log("got config:", msg, 'from:'+from)
})

//rpc.dispatchTo("main", "init", {text:"send me config"});
//rpc.dispatch("init", {text:"send me config"});
rpc.dispatch("get-config", (error, config)=>{
	console.log("get-config:error, config", error, config)
})
*/


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
		this.configEditor = ace.edit(scriptHolder.querySelector(".script-box"), {
			mode : 'ace/mode/javascript',
			selectionStyle : 'text'
		});
		this.configEditor.setTheme("ace/theme/chrome");
		this.configEditor.session.setUseWrapMode(false);
		this.configEditor.session.on('change', (delta) => {
			//console.log("scriptEditorChange",delta);

			//if(this.disableConfigUpdates)
			//	return;

			//let script = this.configEditor.session.getValue();
			//this.onConfigValueChange(script);

		});
		rpc.dispatch("get-config", (error, config)=>{
			console.log("get-config:error, config", error, config)
			if(config){
				this.disableConfigUpdates = true;
				this.configEditor.session.setValue(JSON.stringify(config, null, "\t"));
				this.disableConfigUpdates = false;
			}
		})
		$("flow-btn.save-config").on("click", ()=>{
			let config = this.configEditor.session.getValue();
			this.saveConfig(config);
		})
	}
	saveConfig(config){
		console.log("saveConfig:config", config)
		try{
			config = JSON.parse(config);
		}catch(e){
			return
		}
		rpc.dispatch("set-config", {config}, ()=>{
			//
		})
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