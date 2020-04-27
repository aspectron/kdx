const {App} = require("./app.js");
const {RPC} = require("./resources/rpc.js");


false && chrome.developerPrivate.openDevTools({
	renderViewId: -1,
	renderProcessId: -1,
	extensionId: chrome.runtime.id,
});

class NWApp extends App{

	constructor(...args){
		super(...args)
		this.initRPC();
	}

	/**
	* Main process
	* @return {Promise}
	*/
	main() {
		if(!this.dataFolder)
			return Promise.resolve();
		return new Promise((resolve, reject) => {
			console.log('ControllerModule - init()'.bold);
			nw.Window.open('modules/controller/controller.html', {
				//new_instance: true,
				id: 'kdx',
				title: 'KaspaDX',
				width: 1027,
				height: 768,
				resizable: true,
				frame: true,
				transparent: false,
				show: true,
				// http://docs.nwjs.io/en/latest/References/Manifest%20Format/#window-subfields
			}, (win, b) => {
				console.log("win", win)
				// win.app = this;
				// global.abcapp = "123";
				resolve();
			});
		});
	}

	initDataFolder(){
		let msg = super.initDataFolder();
		if(msg){
			console.error(msg.red)
			nw.Window.open('modules/initialize/initialize.html', {
				//new_instance: true,
				id: 'initialize',
				title: 'KaspaDX',
				width: 1027,
				height: 768,
				resizable: true,
				frame: true,
				transparent: false,
				show: true,
				// http://docs.nwjs.io/en/latest/References/Manifest%20Format/#window-subfields
			}, (win, b) => {
				//win.app = this;
				//global.abcapp = "456";
			});
		}
	}

	initRPC(){
		let rpc = new RPC({});
		this.rpc = rpc;

		rpc.on("get-config", (args, callback)=>{
			console.log("get-config:args", args)
			callback(null, this.config)
		});
		rpc.on("set-config", (args)=>{
			let {config} = args;
			if(!config || !config.modules)
				return
			this.setConfig(config);
		});

		rpc.on("get-init-data", (args, callback)=>{
			console.log("get-init-data: args", args)
			let {config, configFolder, appFolder, dataFolder} = this;
			let {modules} = config;
			callback(null, {config, configFolder, modules, appFolder, dataFolder})
		});

		rpc.on("set-theme", (args)=>{
			let {theme} = args;
			if(!theme)
				return
			this.setTheme(theme);
		});

		rpc.on("set-data-dir", (args)=>{
			let {dataDir, restartDelay} = args;
			if(!dataDir)
				return
			this.setDataDir(dataDir, restartDelay||2000);
		});

		rpc.on("set-modules-config", (args, callback)=>{
			let {config} = args;
			if(!config)
				return callback({error:"Invalid Config"})
			this.saveModulesConfig(config);
			callback(null, {config:this.getModulesConfig()})
		});

		rpc.on("get-modules-config", (args, callback)=>{
			callback(null, {config:this.getModulesConfig()})
		});
		
	}

	setDataDir(dataDir, restartDelay = 0){
		super.setDataDir(dataDir);
		this.rpc.dispatch("disable-ui", {CODE:'DATA-DIR'})
		dpc(restartDelay, ()=>this.reload());
	}

	reload(){
		chrome.runtime.reload();
	}
}

module.exports = {NWApp};