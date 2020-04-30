const os = require('os');
const fs = require('fs-extra');
const crypto = require('crypto');
const bs58 = require('bs58');
const path = require('path');
const utils = require('./lib/utils');
const colors = require('colors');
const EventEmitter = require("events");

global.dpc = (delay, fn)=>{
	if(typeof delay == 'function'){
		fn = delay;
		delay = fn || 0;
	}
	return setTimeout(fn, delay);
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
	}

	getBinaryFolder(){
		return path.join(this.appFolder, 'bin', utils.platform);
	}

	randomBytes() {
		let bytes = crypto.randomBytes(32);
		let text = bs58.encode(bytes).split('');
		while(/\d/.test(text[0]))
			text.shift();
		text = text.join('');
		return text;
	}

	/**
	* initlize config object
	*/
	initConfig(){
		this.configFolder = path.join(os.homedir(),'.kdx');
		fs.ensureDirSync(this.configFolder);
		this.config = {};
		this.configFile = path.join(this.configFolder, "config.json");
		if(!fs.existsSync(this.configFile) || this.flags['reset-config']){
			this.config = fs.readJSONSync(path.join(this.appFolder, "default-config.json"), {throws:false}) || {};
			Object.entries(this.config.modules).forEach(([k,v]) => {
				const type = k.split(':').shift();
				if(['kaspad','kasparovd','kasparovsyncd'].includes(type)) {
					v.args.rpcuser = this.randomBytes();
					v.args.rpcpass = this.randomBytes();
				}
			})
			this.setConfig(this.config);
		}else{
			this.config = this.getConfig();
			if(this.config.daemons && !this.config.modules){
				this.config.modules = this.config.daemons;
				delete this.config.daemons;
				this.setConfig(this.config);
			}
		}

		this.initDataFolder();
	}
	initDataFolder(){
		if(typeof this.config.dataDir == 'undefined' && !this.flags.init){
			return `Please start app with --init=/path/to/data/dir [or] --init=~/.kdx [or] --init=<default>`;
		}else if(this.flags.init){
			if(this.flags.init != '<default>' && this.flags.init != '.')
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

	setDataDir(dataDir){
		this.config.dataDir = dataDir;
		this.setConfig(this.config);
	}

	setTheme(theme){
		this.config.theme = theme;
		this.setConfig(this.config);
	}

	setInvertTerminals(invertTerminals){
		this.config.invertTerminals = !!invertTerminals;
		this.setConfig(this.config);
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

	getModulesConfig(defaults={}){
		return this.config.modules || {};
	}

	saveModulesConfig(modules = {}){
		this.config.modules = modules;
		this.setConfig(this.config);
	}

	/**
	* read config file and return config as JSON object
	* @param {Object} [defaults={}] default config object
	* @return {Object} config as JSON
	*/
	getConfig(defaults = {}){
		let text = fs.readFileSync(this.configFile, 'utf-8');
		return eval(`(${text})`);
		// return fs.readJSONSync(this.configFile, {throws:false}) || defaults;
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