const App = require("./app.js");
const fs = require("fs");
const path = require("path");


false && chrome.developerPrivate.openDevTools({
	renderViewId: -1,
	renderProcessId: -1,
	extensionId: chrome.runtime.id,
});

class NWApp extends App{

	constructor(options){
		super(options)
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
				frame: false,
				transparent: false,
				show: true,
				// http://docs.nwjs.io/en/latest/References/Manifest%20Format/#window-subfields
			}, (win) => {
				console.log("win", win)
				resolve();
			});
		});
	}

	/**
	* initlizing data folder error handler
	*/
	dataDirInitError(){
		console.error(`Please start app with --init=/path/to/data/dir [or] --init=~/.kdx [or] --init=<default>`.red);
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
		}, (win) => {

		});
	}

	initRPCHooks(){
		super.initRPCHooks();
		let rpc = this.rpc;
		rpc.on("set-invert-terminals", (args)=>{
			let {invertTerminals} = args;
			if(invertTerminals == undefined)
				return
			this.setInvertTerminals(invertTerminals);
		});

		rpc.on("set-run-in-bg", (args)=>{
			let {runInBG} = args;
			if(runInBG == undefined)
				return
			this.setRunInBG(runInBG);
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

		rpc.on("set-app-data-dir", async (args, callback)=>{
			let {dataDir, restartDelay} = args;
			//return callback({error: "Invalid directory"});
			if(dataDir === ""){
				await this.setDataDir(dataDir, restartDelay||2000);
				return
			}
			if(dataDir == undefined || !fs.existsSync(dataDir))
				return callback({error: "Invalid directory"})
			fs.stat(dataDir, async(err, stats)=>{
				if(err)
					return callback(err);
				if(!stats.isDirectory())
					return callback({error: "Invalid directory"});

				await this.setDataDir(dataDir, restartDelay||2000);
			})
		});
		
	}

	async setDataDir(dataDir, restartDelay = 0){
		await super.setDataDir(dataDir);
		this.rpc.dispatch("disable-ui", {CODE:'DATA-DIR'})
		dpc(restartDelay, ()=>this.reload());
	}
}

module.exports = NWApp