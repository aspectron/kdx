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
		let args;
		if (options.isNw){
			args = nw.App.fullArgv;
		}else{
			args = process.argv.slice(2);
		}
		this.flags = utils.args(args);
		this.initConfig();
		this.init();
	}
	init(){
		if(!this.dataFolder)
			return
		const KaspaProcessManager = require(path.join(this.appFolder, "lib/manager.js"));
		this.manager = new KaspaProcessManager(this);
	}

	getBinaryFolder(){
		return path.join(this.appFolder, 'bin', utils.platform);
	}

	/**
	* initlize config object
	*/
	initConfig(){
		this.configFolder = path.join(os.homedir(),'.kdx');
		fs.ensureDirSync(this.configFolder);
		this.config = {};
		this.configFile = path.join(this.configFolder, "config.json");
		if(!fs.existsSync(this.configFile)){
			this.config = fs.readJSONSync(path.join(this.appFolder, "default-config.json"), {throws:false}) || {}
			this.setConfig(this.config);
		}else{
			this.config = this.getConfig();
		}

		this.initDataFolder();
	}
	initDataFolder(){
		if(typeof this.config.dataDir == 'undefined' && !this.flags.init){
			return `Please start app with --init=/path/to/data/dir [or] --init=~/.kdx [or] --init=<default>`;
		}else if(this.flags.init){
			if(this.flags.init != '<default>')
				this.config.dataDir = this.flags.init;
		}

		//this.config.dataDir = '~/.kdx';
		if(this.config.dataDir){
			let dataDir = this.config.dataDir.replace('~', os.homedir());
			if(!path.isAbsolute(dataDir))
				return `config.dataDir (${this.config.dataDir}) is not a absolute path.`;
			this.dataFolder = dataDir;
		}else{
			this.dataFolder = this.configFolder;
			this.config.dataDir = '';
		}

		if(this.flags.init)
			this.setConfig(this.config);

		console.log("this.dataFolder", this.dataFolder)
		fs.ensureDirSync(this.dataFolder);
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
		if(!this.manager)
			return false;
		let daemons = this.config.daemons || {};
		console.log("initDaemons", daemons)
		this.startDaemons(daemons);
	}

	startDaemons(daemons={}){
		if(!this.manager)
			return false;
		this.daemons = daemons;
		this.manager.start(daemons);
	}

	async restartDaemons(){
		if(!this.manager)
			return false;
		try{
			await this.manager.stop();
			console.log("initDaemons....")
			dpc(1000, ()=>{
				this.initDaemons();
			});
		}catch(e){
			console.log("restartDaemons:error", e)
			dpc(1000, ()=>{
				this.initDaemons();
			});
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