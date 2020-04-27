true && nw.Window.get().showDevTools();
// const app = nw.Window.get().app;
const os = require("os");

const app = global.app;
//console.log("INIT global.abcapp",global.app);
//console.log("current app is",app);

class Controller{
	constructor(){
		this.init();
	}
	init(){
		this.initTheme();
		this.taskTabs = {};
		this.taskTerminals = {};
		this.initCaption();
		this.initSettings();
		this.initTaskUI();
		const win = nw.Window.get();
		win.on("close", ()=>{
			app.stopDaemons();
			win.close(true)
		});
		document.body.classList.remove("ui-loading");
	}
	initTheme(){
		let theme = app.getConfig().theme || 'light';
		this.setTheme(theme);
	}
	setTheme(theme){
		this.theme = theme;
		app.setTheme(theme);
		document.body.classList.forEach(c=>{
			if(c.indexOf('flow-theme') === 0 && c!='flow-theme'+theme){
				document.body.classList.remove(c);
			}
		})

		document.body.classList.add("flow-theme-"+theme)

		if(this.configEditor){
			if(this.theme == 'dark')
				this.configEditor.setTheme("ace/theme/tomorrow_night_eighties");
			else
				this.configEditor.setTheme("ace/theme/chrome");
		}
	}
	initCaption(){
		let caption = document.querySelector('flow-caption-bar');
		this.caption = caption;
		caption.tabs = [{
			title : "Home",
			id : "home",
			cls:"home"
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
		let themeInput = document.querySelector("#settings-dark-theme");
		let scriptHolder = document.querySelector('#settings-script');
		let advancedEl = document.querySelector('#settings-advanced');
		advancedEl.addEventListener('changed', (e)=>{
			//console.log("advancedEl", e.detail.checked)
			//caption.tabs[2].disable = !e.detail.checked;
			//caption.tabs = caption.tabs.slice(0);
			//caption.requestTabsUpdate();
			let advanced = e.detail.checked;
			let index = this.caption.tabs.forEach((t, index)=>{
				if(t.section == 'advance'){
					this.caption.set(`tabs.${index}.disable`, !advanced)
				}
			});
			
			scriptHolder.classList.toggle("active", advanced)
			document.body.classList.toggle("advance-ui", advanced)
		})
		this.configEditor = ace.edit(scriptHolder.querySelector(".script-box"), {
			mode : 'ace/mode/javascript',
			selectionStyle : 'text'
		});
		if(this.theme == 'dark')
			this.configEditor.setTheme("ace/theme/tomorrow_night_eighties");
		else
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
		this.configEditor.session.setValue(JSON.stringify(app.getModulesConfig(), null, "\t"));
		this.disableConfigUpdates = false;
		$("flow-btn.save-config").on("click", ()=>{
			let config = this.configEditor.session.getValue();
			this.saveModulesConfig(config);
		})

		let $folderInput = $("#data-folder-input");
		let folderInput = $folderInput[0];
		let originalValue = config.dataDir || app.configFolder;
		folderInput.value = originalValue;
		$(".reset-data-dir").on("click", e=>{
			folderInput.setValue(originalValue);
		});
		$(".apply-data-dir").on("click", e=>{
			app.setDataDir(folderInput.value, 2500);
		});
		$(".use-default-data-dir").on("click", e=>{
			folderInput.setValue(app.configFolder);
		});
		$folderInput.on("change", (e)=>{
			let value = folderInput.value;
			console.log(originalValue, value);
			$('.data-folder-input-tools').toggleClass("active", value!=originalValue);
			$(".apply-data-dir").attr('disabled', value?null:true);
			$('.use-default-data-dir')[0].disabled = value==app.configFolder;
		});

		themeInput.addEventListener('changed', (e)=>{
			let theme = e.detail.checked ? 'dark' : 'light';
			this.setTheme(theme);
		});
		themeInput.checked = config.theme == 'dark';
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
		const advanced = document.querySelector('#settings-advanced').checked;
		const {key, name} = task;
		if(key.indexOf("simulator")===0)
			return;
		const {caption} = this;
		let tab = caption.tabs.find(t=>t.id == key);
		//console.log("tab", tab, key, name)
		
		let lastValue = caption.cloneValue(caption.tabs);
		if(tab){
			tab.disable = !advanced;
			console.log("tab.disable", tab)
		}else{
			caption.tabs.push({
				title:name,
				id:key,
				section:'advance',
				disable:!advanced
			});
		}
		
		this.taskTabs[key] = document.querySelector(`tab-content[for="${key}"]`);
		if(!this.taskTabs[key]){
			const template = document.createElement('template');
			template.innerHTML = 
			`<tab-content for="${key}" data-active-display="flex" class="advance">
				<flow-terminal noinput class="x-terminal" background="#000" foreground="#FFF"></flow-terminal>
				<div class="tools">
					<flow-btn data-action="RUN">RUN</flow-btn>
					<flow-btn data-action="STOP">STOP</flow-btn>
					<flow-btn data-action="RESTART">RESTART</flow-btn>
					<flow-btn data-action="PURGE-DATA">PURGE DATA</flow-btn>
				</div>
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
		if(tabContent && tabContent.parentNode)
			document.body.removeChild(tabContent);

		if(newTabs.length == caption.tabs.length)
			return;
		let lastValue = caption.cloneValue(caption.tabs);

		caption.tabs = newTabs;

		caption.requestUpdate('tabs', lastValue)
	}
	saveModulesConfig(config){
		//console.log("saveModulesConfig:config", config)
		try{
			config = JSON.parse(config);
		}catch(e){
			return
		}
		app.saveModulesConfig(config);
		app.restartDaemons();
	}
}

const uiController = new Controller();
app.uiController = uiController;
app.emit("ui-init");
app.on("disable-ui", (args)=>{
	$('body').addClass("disable");
})
app.on("enable-ui", (args)=>{
	$('body').removeClass("disable");
})

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