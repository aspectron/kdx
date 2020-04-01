true && nw.Window.get().showDevTools();
const app = nw.Window.get().app;
const os = require("os");

class Controller{
	constructor(){
		this.init();
	}
	init(){
		this.taskTabs = {};
		this.taskTerminals = {};
		this.initCaption();
		this.initSettings();
		this.initTaskUI();
	}
	initCaption(){
		let caption = document.querySelector('flow-caption-bar');
		this.caption = caption;
		caption.tabs = [{
			title : "Home",
			id : "home"
		},{
			title : "Settings",
			id : "settings"
		},{
			title : "RPC",
			id : "rpc",
			disable:true,
			section: 'advance'
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
			let index = this.caption.tabs.findIndex(t=>t.section == 'advance');
			this.caption.set(`tabs.${index}.disable`, !advanced)
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
		let config = app.getConfig({})
		this.disableConfigUpdates = true;
		this.configEditor.session.setValue(JSON.stringify(config, null, "\t"));
		this.disableConfigUpdates = false;
		$("flow-btn.save-config").on("click", ()=>{
			let config = this.configEditor.session.getValue();
			this.saveConfig(config);
		})
	}
	initTaskUI(){
		app.on("task-start", (daemon)=>{
			console.log("init-task:task", daemon.task)
			this.initTaskTab(daemon.task)
		});
		app.on("task-exit", (daemon)=>{
			console.log("task-exit", daemon.task)
			this.removeTaskTab(daemon.task)
		})
		app.on("task-data", (daemon, data)=>{
			//console.log("task-data", daemon.task, data)
			let terminal = this.taskTerminals[daemon.task.key];
			if(!terminal)
				return
			data.map(d=>{
				//console.log("data-line", d.trim())
				terminal.write(d.trim());
			});
		})
	}
	initTaskTab(task){
		const {key, name} = task;
		if(key.indexOf("simulator")===0)
			return;
		const {caption} = this;
		let tab = caption.tabs.find(t=>t.id == key);
		//console.log("tab", tab, key, name)
		if(tab)
			return
		let lastValue = caption.cloneValue(caption.tabs);
		caption.tabs.push({
			title:name,
			id:key
		});
		this.taskTabs[key] = document.querySelector(`tab-content[for="${key}"]`);
		if(!this.taskTabs[key]){
			const template = document.createElement('template');
			template.innerHTML = `<tab-content for="${key}">
					<flow-terminal noinput class="x-terminal" background="#000" foreground="#FFF"></flow-terminal>
				</tab-content>`
			let tabContent = template.content.firstChild;
			this.taskTabs[key] = tabContent;
			this.taskTerminals[key] = tabContent.querySelector("flow-terminal");
			document.body.appendChild(tabContent);
		}
		

		caption.requestUpdate('tabs', lastValue)
	}
	removeTaskTab(task){
		const {key, name} = task;
		const {caption} = this;
		let newTabs = caption.tabs.filter(t=>t.id != key);
		//console.log("lastValue", caption.tabs.slice(0), newTabs.slice(0))
		let tabContent = this.taskTabs[key];
		if(tabContent)
			document.body.removeChild(tabContent);

		if(newTabs.length == caption.tabs.length)
			return;
		let lastValue = caption.cloneValue(caption.tabs);

		caption.tabs = newTabs;

		caption.requestUpdate('tabs', lastValue)
	}
	saveConfig(config){
		//console.log("saveConfig:config", config)
		try{
			config = JSON.parse(config);
		}catch(e){
			return
		}
		app.setConfig(config);
		app.restartDaemons();
	}
}

const uiController = new Controller();
app.uiController = uiController;
app.emit("ui-init");

window.xxxxController = uiController;

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