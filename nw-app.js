const App = require("./app.js");
const fs = require("fs");
const path = require("path");


false && chrome.developerPrivate.openDevTools({
	renderViewId: -1,
	renderProcessId: -1,
	extensionId: chrome.runtime.id,
});

class NWApp extends App{

	constructor(...args){
		super(...args)
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

	initRPC(){
		super.initRPC();
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
		
	}

	setDataDir(dataDir, restartDelay = 0){
		super.setDataDir(dataDir);
		this.rpc.dispatch("disable-ui", {CODE:'DATA-DIR'})
		dpc(restartDelay, ()=>this.reload());
	}
}

module.exports = NWApp