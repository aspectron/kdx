const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const { utils } = require('micro-fabric');
const EventEmitter = require("events");

global.dpc = (delay, fn)=>{
	if(typeof delay == 'function'){
		fn = delay;
		delay = fn || 0;
	}
	setTimeout(fn, delay);
}


class App extends EventEmitter{
	constructor(options={}){
		super();
		this.options = options;
		this.appFolder = options.appFolder;
		this.flags = {};//TODO get args from command line
		this.init();
	}
	init(){
		const KaspaProcessManager = require(path.join(this.appFolder, "lib/manager.js"));
		this.manager = new KaspaProcessManager(this);
		this.dataFolder = this.manager.dataFolder;
		this.initConfig();
	}

	getBinaryFolder(){
		return path.join(this.appFolder, 'bin', utils.platform);
	}

	/**
	* initlize config object
	*/
	initConfig(){
		this.config = {};
		this.configFile = path.join(this.dataFolder, "config.json");
		if(!fs.existsSync(this.configFile))
			this.setConfig(this.config);
		else
			this.config = this.getConfig();
	}

	/**
	* save config
	* @param {Object} config JSON config
	*/
	setConfig(config){
		if(typeof config == 'object')
			config = JSON.stringify(config, null, "\t")
		fs.writeFileSync(this.configFile, config);
		this.config = this.getConfig();
	}

	/**
	* read config file and return config as JSON object
	* @param {Object} [defaults={}] default config object
	* @return {Object} config as JSON
	*/
	getConfig(defaults = {}){
		return fs.readJSONSync(this.configFile, {throws:false}) || defaults;
	}

	initDaemons(){
		let daemons = this.config.daemons || {};
		console.log("initDaemons", daemons)
		this.startDaemons(daemons);
	}

	startDaemons(daemons={}){
		this.daemons = daemons;
		this.manager.start(daemons);
	}

	async restartDaemons(){
		try{
			await this.manager.stop();
			console.log("initDaemons....")
			dpc(1000, ()=>{
				this.initDaemons();
			});
		}catch(e){
			console.log("restartDaemons:error", e)
		}
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

module.exports = {App};