(window.navigator.plugins.namedItem('Native Client') !== null) 
	&& nw.Window.get().showDevTools();
const os = require("os");
const pkg = require("../../package");
const {RPC} = require("./../../resources/rpc.js");
const Manager = require("./../../lib/manager.js");
const Build = require("./../../lib/build.js");

import {html, render} from 'lit-html';
import {repeat} from 'lit-html/directives/repeat.js';

class Controller{
	constructor(){
		this.initTrayMenu();
		this.init();
	}
	
	async init(){
		this.initRPC();
		this.initTheme();
		await this.initManager();
		this.taskTabs = {};
		this.taskTerminals = {};
		this.initCaption();
		await this.initSettings();
		const win = nw.Window.get();
		win.on("close", ()=>{
			this.stopDaemons();
			this.tray.remove();
			this.tray = null;
			win.close(true)
		});
		this.initBuild();
		this.setUiLoading(false);		
	}
	setUiLoading(loading){
		document.body.classList.toggle("ui-loading", loading);
	}
	initRPC(){
		let rpc = new RPC({});

		this.rpc = rpc;

		rpc.on("disable-ui", (args)=>{
			$('body').addClass("disable");
		});
		rpc.on("enable-ui", (args)=>{
			$('body').removeClass("disable");
		});
	}
	async initManager(){
		this.initData = await this.get("get-init-data");
		let {dataFolder, appFolder} = this.initData;
		let manager = global.manager || new Manager(this, dataFolder, appFolder);
		if(global.manager){
			manager.controller = this;
			manager.dataFolder = dataFolder;
			manager.appFolder = appFolder;
		}

		this.manager = manager;
		manager.on("task-info", async (daemon)=>{
			if(!daemon.renderModuleInfo)
				return

			let {task} = daemon;

			let info = await daemon.renderModuleInfo(html);
			let section = html`<div class="task-info">${info}</div>`;
			this.renderModuleInfo(task, section);
		})
		manager.on("task-start", (daemon)=>{
			console.log("init-task:task", daemon.task)
			this.initTaskTab(daemon.task);

		});
		manager.on("task-exit", (daemon)=>{
			console.log("task-exit", daemon.task)
			this.removeTaskTab(daemon.task);
		})
		manager.on("task-data", (daemon, data)=>{
			//console.log("task-data", daemon.task, data)
			let terminal = this.taskTerminals[daemon.task.key];
			if(!terminal || !terminal.term)
				return
			//data.map(d=>{
				//console.log("data-line", d.trim())
				terminal.term.write(data.toString('utf8').replace(/\n/g,'\r\n')); //(d.trim());
			//});
		});

		if(global.manager){
			let {config:daemons} = await this.get("get-modules-config");
			if(!daemons)
				return "Could Not load modules."
			console.log("restartDaemons", daemons)
			this.restartDaemons(daemons);
		}else{
			this.initDaemons();
		}

		global.manager = manager;
	}
	async initTheme(){
		let {theme, invertTerminals} = await this.get("get-config");
		this.setTheme(theme || 'light');
		this.setInvertTerminals(!!invertTerminals);
	}
	setInvertTerminals(invertTerminals){
		this.invertTerminals = invertTerminals;
		this.post("set-invert-terminals", {invertTerminals});
		document.body.classList.toggle("invert-terminals", invertTerminals)
		document.body.dispatchEvent(new CustomEvent("flow-theme-changed"));
	}
	setTheme(theme){
		this.theme = theme;
		this.post("set-theme", {theme});
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

		document.body.dispatchEvent(new CustomEvent("flow-theme-changed"));
	}
	initCaption(){
		let caption = document.querySelector('flow-caption-bar');
		this.caption = caption;

		caption.version = pkg.version;

		caption.tabs = [{
			title : "Home".toUpperCase(),
			id : "home",
			cls:"home"
		},{
			title : "Settings".toUpperCase(),
			id : "settings"
		},{
			title : "RPC",
			id : "rpc",
			disable:true,
			section: 'advance'
		},{
			title : "BUILD",
			id : "build",
			disable:true,
			section: 'advance'
		}];

		/*
		for(let i=0; i<15; i++){
			caption.tabs.push({
				title: 'Tab '+i,
				id:'tab-'+i
			})
		}
		*/

		caption["active"] = "home";
	}
	initBuild(){
		this.buildTerminal = document.querySelector(".build-terminal");
		this.build = new Build();
		this.build.on("terminal-data", (data)=>{
			console.log("terminal-data", data)
			this.buildTerminal.write(data.trim());
		})
	}
	initTrayMenu() {
		let tray = new nw.Tray({
			icon: 'resources/images/tray-icon.png',
			alticon:'resources/images/tray-icon.png',
			iconsAreTemplates: false
		});

		this.tray = tray;

		if(os.platform != 'darwin')
			tray.title = 'KDX';

		let debugMenu = new nw.Menu();
		let debugItems = {
			'Data' : 'DATA.debug',
			'Main' : () => {
				chrome.developerPrivate.openDevTools({ 
					renderViewId: -1, 
					renderProcessId: -1, 
					extensionId: chrome.runtime.id 
				})
			}
		};

		Object.entries(debugItems).forEach(([k,v]) => {
			debugMenu.append(new nw.MenuItem({
				label: k,
				click : () => {
					if(typeof(v) == 'string'){
						//this.rpc.publish(v)
						return
					}

					if(typeof(v) == 'function')
						v();
				}
			}))
		})


		let infoMenu = new nw.Menu();
		let infoItems = {
			'GPU' : 'chrome://gpu',
			'Flags' : 'chrome://flags',
			'Media' : 'chrome://media-internals',
		};
		this.userWindows = {};
		Object.entries(infoItems).forEach(([k,v]) => {
			infoMenu.append(new nw.MenuItem({
				label: k,
				click : () => {
			   		nw.Window.open(v, {
			   			id : v,
			   			title : k,
			   			position : "center",
			   			resizable : true,
			   			show_in_taskbar : true,
			   			show : true,
			   			width : 1024,
			   			height : 1024
			   		}, (win) => {
			   			this.userWindows[v] = win;
			   			win.data = { host : this }
			   			win.on('close', () => {
			   			 	console.log(`Closing ${k} window...`)
			   			 	win.close(true);
			   			 	delete this.userWindows[v];
			   			})
			   		})

			   		let win = this.userWindows[v];
			   		if(win) {
			   			delete this.userWindows[v];
		   			 	console.log(`Closing ${k} window...`)
			   			win.close(true);
			   		}
				}
			}))
		})

		let menu = new nw.Menu();
		menu.append(new nw.MenuItem({ 
			label : 'Info',
			submenu : infoMenu
		}));

		if(this.isDevMode()) {
			menu.append(new nw.MenuItem({ 
				label : 'Debug',
				submenu : debugMenu
			}));
		}

		menu.append(new nw.MenuItem({ 
			type : 'separator'
		}));

		menu.append(new nw.MenuItem({ 
			label : 'Exit',
			click : () => {
				this.exit();
			}
		}));

		tray.menu = menu;
	}

	async initSettings(){
		let themeInput = document.querySelector("#settings-dark-theme");
		let invertTermInput = document.querySelector("#settings-invert-terminal");
		let scriptHolder = document.querySelector('#settings-script');
		let advancedEl = document.querySelector('#settings-advanced');
		advancedEl.addEventListener('changed', (e)=>{
			let advanced = e.detail.checked;
			let index = this.caption.tabs.forEach((t, index)=>{
				if(t.section == 'advance'){
					this.caption.set(`tabs.${index}.disable`, !advanced)
				}
			});

			localStorage.advancedUI = advanced?1:0;
			
			scriptHolder.classList.toggle("active", advanced)
			document.body.classList.toggle("advance-ui", advanced)
		});
		advancedEl.setChecked(localStorage.advancedUI==1);
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
		let {config, configFolder, modules} = this.initData;
		this.disableConfigUpdates = true;
		this.configEditor.session.setValue(JSON.stringify(modules, null, "\t"));
		this.disableConfigUpdates = false;
		$("flow-btn.save-config").on("click", ()=>{
			let config = this.configEditor.session.getValue();
			this.saveModulesConfig(config);
		})

		let $folderInput = $("#data-folder-input");
		let folderInput = $folderInput[0];
		let originalValue = config.dataDir || configFolder;
		folderInput.value = originalValue;
		$(".reset-data-dir").on("click", e=>{
			folderInput.setValue(originalValue);
		});
		$(".apply-data-dir").on("click", e=>{
			this.post("set-data-dir", {dataDir:folderInput.value});
		});
		$(".use-default-data-dir").on("click", e=>{
			folderInput.setValue(configFolder);
		});
		$folderInput.on("change", (e)=>{
			let value = folderInput.value;
			console.log(originalValue, value);
			$('.data-folder-input-tools').toggleClass("active", value!=originalValue);
			$(".apply-data-dir").attr('disabled', value?null:true);
			$('.use-default-data-dir')[0].disabled = value==configFolder;
		});

		themeInput.addEventListener('changed', (e)=>{
			let theme = e.detail.checked ? 'dark' : 'light';
			this.setTheme(theme);
		});
		invertTermInput.addEventListener('changed', (e)=>{
			this.setInvertTerminals(e.detail.checked);
		});
		themeInput.checked = config.theme == 'dark';
		invertTermInput.checked = !!config.invertTerminals;
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
				disable:!advanced,
				render:()=>{
					//console.log("renderTab:",task);

					if(task?.impl?.renderTab)
						return task.impl.renderTab(html);

					return html`
						<div style="display:flex;flex-direction:row;">
							<div style="font-size:18px;">${task.type}</div>
							<div style="font-size:10px; margin-top:8px;">${task.id}</div>
						</div>`;
				}
			});
		}
		
		this.taskTabs[key] = document.querySelector(`tab-content[for="${key}"]`);
		if(!this.taskTabs[key]){
			const template = document.createElement('template');
			template.innerHTML = 
			`<tab-content for="${key}" data-active-display="flex" class="advance term">
				<flow-terminal noinput class="x-terminal" background="transparent" foreground="transparent"></flow-terminal>
				<div class="tools">
					<flow-btn data-action="RUN">RUN</flow-btn>
					<flow-btn data-action="STOP">STOP</flow-btn>
					<flow-btn data-action="RESTART">RESTART</flow-btn>
					<flow-btn data-action="PURGE_DATA">PURGE DATA</flow-btn>
				</div>
			</tab-content>`
			let tabContent = template.content.firstChild;
			tabContent.querySelector(".tools").addEventListener('click', e=>{
				this.onToolsClick(e);
			});
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
	async saveModulesConfig(config){
		//console.log("saveModulesConfig:config", config)
		try{
			config = JSON.parse(config);
		}catch(e){
			return
		}
		let {config:daemons} = await this.get("set-modules-config", {config});

		console.log("updatedConfig", daemons)
		if(daemons)
			this.restartDaemons(daemons);
	}
	onToolsClick(e){
		let $target = $(e.target).closest("[data-action]");
		let $tabContent = $target.closest("tab-content");
		let key = ($tabContent.attr("for")+"").replace(/\-/g, ":");
		let action = $target.attr("data-action");
		if(!action || !$tabContent.length)
			return

		console.log("onToolsClick:TODO", action, key)
	}
	async initDaemons(daemons){
		if(!daemons){
			let {config} = await this.get("get-modules-config");
			if(!config)
				return "Could Not load modules."
			daemons = config;
		}
			
		console.log("initDaemons", daemons)
		this.manager.start(daemons);
	}
	async restartDaemons(daemons){
		try{
			await this.manager.stop();
			console.log("initDaemons....")
			dpc(1000, ()=>{
				this.initDaemons(daemons);
			});
		}catch(e){
			console.log("restartDaemons:error", e)
			dpc(1000, ()=>{
				this.initDaemons(daemons);
			});
		}
	}
	async stopDaemons(){
		try{
			await this.manager.stop();
		}catch(e){
			console.log("manager.stop:error", e)
			return false;
		}

		return true;
	}
	post(subject, data){
		this.rpc.dispatch(subject, data)
	}
	get(subject, data){
		return new Promise((resolve, reject)=>{
			this.rpc.dispatch(subject, data, (err, result)=>{
				if(err)
					return resolve(err)

				resolve(result);
			})
		})
	}
	redraw() {
		this?.caption?.requestUpdate();
	}
	renderModuleInfo(task, info){
		this._infoTable = this._infoTable || document.querySelector("#process-info-table");
		this._taskInfo = this._taskInfo || {};
		
		this._taskInfo[task.key] = info;
		let list = Object.entries(this._taskInfo);
		render(repeat(list, ([k])=>k, ([k, info])=>info), this._infoTable);
	}
	exit(){
		window.onbeforeunload();
		window.close();
	}
	isDevMode() {
	    return (window.navigator.plugins.namedItem('Native Client') !== null);
	}
}
console.log("global.manager::::", global.manager)
let uiCtl = new Controller();

window.onbeforeunload = ()=>{
	uiCtl.stopDaemons();
	if(uiCtl.tray){
		uiCtl.tray.remove();
		uiCtl.tray = null;
	}
}

window.xxxxuiCtl = uiCtl;

