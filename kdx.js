if (1) {
	typeof(chrome) != 'undefined' && chrome.developerPrivate.openDevTools({
		renderViewId: -1,
		renderProcessId: -1,
		extensionId: chrome.runtime.id,
	});
}

const {RPC} = require("./resources/rpc.js");
const rpc = new RPC({
	skipMsgFilter:true,
	uid: "main",
	useBcast:true
});

rpc.on("msg", (msg)=>{
	console.log("rpc:msg", msg)
})

/*
rpc.on("init", (msg, from, to)=>{
	console.log("init:", msg, from, to)
	rpc.dispatchTo(from, "config", {option:1})
})
*/

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
// const NUID = require('nuid');

/**
* Class KDXApp
* @example
* const app = new KDXApp({
*	appFolder: __dirname,
*	ident: 'flow-baseline',
* });
* app.main();
*/
class KDXApp {
	/**
	* @param {Object} [options]
	*/
	constructor(options={}) {
		/**
		* @type {Object}
		*/
		this.options = options;
		this.initConfig();
		this.initRPC();
	}

	initRPC(){
		rpc.on("get-config", (args, callback)=>{
			console.log("get-config:args", args)
			callback(null, this.config)
		})
		rpc.on("set-config", (args, callback)=>{
			console.log("set-config:args", args)
			this.setConfig(args.config);
			callback(null, {success:true})
		})
	}

	initConfig(){
		this.config = {};
		this.configFile = path.join(__dirname, "config.json");
		if(!fs.existsSync(this.configFile))
			this.setConfig(this.config);
		else
			this.config = this.getConfig();
	}

	setConfig(config){
		if(typeof config == 'object')
			config = JSON.stringify(config, null, "\t")
		fs.writeFileSync(this.configFile, config);
	}
	getConfig(defaults = {}){
		return fs.readJSONSync(this.configFile, {throws:false}) || defaults;
	}

	/**
	* Main process
	* @return {Promise}
	*/
	main() {
		return new Promise((resolve, reject) => {
			console.log('FlowBaseline - init()'.yellow);
			nw.Window.open('modules/controller/controller.html', {
				new_instance: true,
				id: 'kdx',
				title: 'KaspaDX',
				width: 1027,
				height: 768,
				resizable: true,
				frame: true,
				transparent: false,
				show: true,
				// http://docs.nwjs.io/en/latest/References/Manifest%20Format/#window-subfields
			}, (a, b) => {
				console.log('a:', a, 'b:', b, 'this:', this);
				resolve();
			});
		});
	}

	/**
	* Initialize data directories
	*/
	initDataDir() {
		if (process.platform == 'win32') {
			this.homeFolder = path.join(os.homedir(), '.flow');
		} else {
			this.homeFolder = path.join(os.homedir(), '.flow');
		}

		this.dataFolder = path.join(this.homeFolder, 'data');
		fs.ensureDirSync(this.dataFolder);
	}

	/**
	* Logs given variables
	* @param {...*} args
	*/
	log(...args) {
		args.unshift('TT:');
		console.log(args);
	}
}

/**
*
*/
const app = new KDXApp({
	appFolder: __dirname,
	ident: 'flow-baseline',
});

(async ()=>{
	await app.main();
})();
