const { App : FlowApp } = require('@aspectron/flow-app');
const utils = require('@aspectron/flow-utils');
const crypto = require('crypto');
const bs58 = require('bs58');
const colors = require('colors');
const fs = require('fs');
const os = require('os');
const path = require('path');


class App extends FlowApp{
	constructor(options={}){
		Object.assign(options, {
			ident: 'kdx',
			appFolder: process.cwd()
		})
		super(options);
		this.on("init", ()=>{
			this.main();
		})
	}

	async initConfig(){
		await super.initConfig();
		await this.initDataFolder();
		await this.initCerts();
	}

	/**
	* initlize data folder
	*/
	async initDataFolder(){
		if(typeof this.config.dataDir == 'undefined' && !('init' in this.flags)) // this.flags.init)
			return this.dataDirInitError();

		let {init} = this.flags;
		if(init && init != '.' && typeof init == 'string')
			this.config.dataDir = init;

		if(this.config.dataDir){
			let dataDir = this.config.dataDir.replace('~', os.homedir());
			if(!path.isAbsolute(dataDir))
				return `config.dataDir (${this.config.dataDir}) is not a absolute path.`;
			this.dataFolder = dataDir;
		}else{
			this.dataFolder = this.getDefaultDataFolderPath();
			this.config.dataDir = '';
		}

		if(init)
			await this.setConfig(this.config);

		this.log("DataFolder", this.dataFolder)
		this.ensureDirSync(this.dataFolder);
		this.onDataDirInit();
	}

	/**
	* initlizing data folder error handler
	*/
	dataDirInitError(){
		console.log(`Please start app with --init=/path/to/data/dir or --init for default (~/.kdx/data)`);
		this.exit();
	}

	onDataDirInit(){
		//placeholder
	}

	/**
	* @return {String} default path to data folder 
	*/
	getDefaultDataFolderPath(){
		return path.join(this.getConfigFolderPath(),'data');
	}

	/**
	* set dataDir
	* @param {String} dataDir dataDir
	*/
	async setDataDir(dataDir){
		this.config.dataDir = dataDir;
		await this.setConfig(this.config);
	}

	async initCerts() {
		if(!this.dataFolder)
			return
		if(!fs.existsSync(path.join(this.dataFolder,'rpc.cert'))) {
			const gencerts = path.join(__dirname,'bin',utils.platform,'gencerts'+(utils.platform == 'windows-x64'?'.exe':''));
			if(fs.existsSync(gencerts)) {
				await utils.spawn(gencerts,[],{cwd : this.dataFolder});
			} else {
				console.log('Error: no RPC certificates available');
			}
		}
	}

	/**
	* @return {String} path to Binaries Folder 
	*/
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

	getDefaultConfig(){
		let config = super.getDefaultConfig();

		if(!process.env['KASPA_JSON_RPC'])
			return config;

		// disabled as of Kaspad 7.0
		let rpcuser = this.randomBytes();
		let rpcpass = this.randomBytes();
		Object.entries(config.modules).forEach(([k,v]) => {
			const type = k.split(':').shift();
			if(['kaspad','kasparovd','kasparovsyncd','kaspaminer'].includes(type)) {
				v.args.rpcuser = rpcuser;
				v.args.rpcpass = rpcpass;
			}
		});

		return config;
	}

	setInvertTerminals(invertTerminals){
		this.config.invertTerminals = !!invertTerminals;
		this.setConfig(this.config);
	}
	setRunInBG(runInBG){
		this.config.runInBG = !!runInBG;
		this.setConfig(this.config);
	}
	setEnableMining(enableMining){
		this.config.enableMining = !!enableMining;
		this.setConfig(this.config);
	}
	setUseWalletForMining(useWalletForMining){
		this.config.useWalletForMining = !!useWalletForMining;
		this.setConfig(this.config);
	}
	setMiningAddress(address){
		let modules = this.getModulesConfig();
		let updated = false;
		Object.keys(modules).forEach(key=>{
			if(key.includes("kaspaminer:")){
				modules[key].args = modules[key].args||{};
				modules[key].args.miningaddr = address;
				updated = true;
			}
		})
		if(updated){
			this.config.modules = modules;
			this.setConfig(this.config);
			return true
		}
	}
	getMiningAddressFromConfig(config){
		let {modules={}} = config||this.config;
		let address = "";
		Object.keys(modules).find(key=>{
			if(key.includes("kaspaminer:")){
				modules[key].args = modules[key].args||{};
				address = modules[key].args.miningaddr;
				return !!address
			}
		})
		return address || "";
	}
	setEnableMetrics(enableMetrics){
		this.config.enableMetrics = !!enableMetrics;
		this.setConfig(this.config);
	}
	setStatsdAddress(statsdAddress){
		this.config.statsdAddress = statsdAddress;
		this.setConfig(this.config);
	}
	setStatsdPrefix(statsdPrefix){
		this.config.statsdPrefix = statsdPrefix;
		this.setConfig(this.config);
	}

	setBuildType(build) {
		this.config.build = build;
		this.setConfig(this.config);
	}

	getModulesConfig(defaults={}){
		return this.config.modules || {};
	}

	saveModulesConfig(modules = {}){
		this.config.modules = modules;
		this.setConfig(this.config);
	}

	setModulesConfigTemplate(defaults, network) {
		let prev = this.config;
		if(prev) {
			delete prev.modules;
		}
		this.config = Object.assign({},defaults,prev||{});
		this.config.network = network;

		if(network != 'mainnet') {
			Object.keys(this.config.modules).forEach((k) =>{
				const [type,ident] = k.split(':');
				if(/^(kaspa)/.test(type))
					this.config.modules[k].args[network] = true;
			})
		}

		this.setConfig(this.config);
		// TODO - apply network settings
	}
}

module.exports = App;