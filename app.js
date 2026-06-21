const { App : FlowApp } = require('@aspectron/flow-app');
const utils = require('@aspectron/flow-utils');
const util = require('./lib/utils.js');
const crypto = require('crypto');
const bs58 = require('bs58');
const colors = require('colors');
const fs = require('fs');
const fse = require('fs-extra');
const os = require('os');
const path = require('path');

// Standard rusty-kaspad listener ports per network, keyed by the canonical
// suffixed network id the network selector emits (mainnet / testnet-10). The
// network selector -- not the template identity -- is authoritative for which
// network a local node binds, so the selected id keys this listener set and the
// set is applied to the template's kaspad entry at apply time rather than
// duplicated across per-network templates. The testnet-10 set carries the
// kaspad `testnet` flag; the SDK's default testnet suffix is 10, so a local
// testnet node resolves to testnet-10 and a connect-only entry takes the
// selected id verbatim as its networkId.
const KASPAD_NETWORK_LISTENERS = {
	'mainnet' : {
		'rpclisten' : '0.0.0.0:16110',
		'listen' : '0.0.0.0:16111',
		'rpclisten-borsh' : '0.0.0.0:17110'
	},
	'testnet-10' : {
		'testnet' : true,
		'rpclisten' : '0.0.0.0:16210',
		'listen' : '0.0.0.0:16211',
		'rpclisten-borsh' : '0.0.0.0:17210'
	}
};


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
		this.setUpnpIfMissing(true);
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

		this.log("DataFolder", this.dataFolder)
		this.ensureDirSync(this.dataFolder);
		if(init)
			await this.setConfig(this.config);
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
			const gencerts = path.join(__dirname,'bin',util.platform,'gencerts'+(util.platform == 'windows-x64'?'.exe':''));
			if(fs.existsSync(gencerts)) {
				await utils.spawn(gencerts,[],{cwd : this.dataFolder});
			} else {
				console.log('Error: no RPC certificates available');
			}
		}
	}

	async removeDataDir(){
		try {
			let datadir2path = path.join(this.dataFolder, "kaspad-kd0", "kaspa-mainnet", "datadir2");
			console.log("removeDataDir: datadir2path", datadir2path)
			if(fs.existsSync(datadir2path)){
				await fse.remove(datadir2path);
				return !fs.existsSync(datadir2path);
			}else{
				return true;
			}
		} catch(err) {
			console.log("removeDataDir: error:", err)
		}

		return false;
	}

	/**
	* @return {String} path to Binaries Folder 
	*/
	getBinaryFolder(){
		return path.join(this.appFolder, 'bin', util.platform);
	}

	/**
	* @param {String} name i18n file name
	* @return {String} path to an i18n file. The runtime-writable i18n files
	* (the harvested entries and their lock) are redirected to the user-data
	* root so they stay writable when the app payload is installed read-only;
	* the bundled translations (i18n.data) stay in the read-only app folder
	* and are still read through the inherited path.
	*/
	getI18nFilePath(name){
		if(name == 'i18n.entries' || name == 'i18n.lock')
			return path.join(this.getConfigFolderPath(), name);
		return super.getI18nFilePath(name);
	}

	/**
	* Persist i18n entries, guarded so a write failure can never throw out of
	* the fire-and-forget RPC hook. The redirect above keeps the file in a
	* writable directory; this guard covers any remaining filesystem error.
	* @param {Array} entries i18n entries
	*/
	saveI18nEntries(entries){
		try {
			super.saveI18nEntries(entries);
		} catch(err) {
			console.error('saveI18nEntries: failed to persist i18n entries:', err);
		}
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
	setSkipUTXOIndex(skipUTXOIndex){
		skipUTXOIndex = !!skipUTXOIndex;
		return this.setModuleArgs("kaspad:", {}, {"skip-utxoindex":skipUTXOIndex})
	}
	getSkipUTXOIndex(){
		let {args, params} = this.getModuleArgs("kaspad:");
		return !!params["skip-utxoindex"];
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
		this.setModuleArgs("kaspaminer:", {"mining-address": address})
	}
	setModuleArgs(search, args={}, params={}){
		let modules = this.getModulesConfig();
		let updated = false;
		Object.keys(modules).forEach(key=>{
			if(!key.includes(search))
				return
			args = {...(modules[key].args || {}), ...args};
			modules[key] = {...modules[key], ...params, args};

			updated = true;
		})
		if(updated){
			this.config.modules = modules;
			this.setConfig(this.config);
			return true
		}
		return false
	}
	getModuleArgs(search){
		let args = {};
		let params = {};
		let modules = this.getModulesConfig();
		Object.keys(modules).find(key=>{
			if(!key.includes(search))
				return
			args = {...(modules[key].args || {}), ...args};
			params = {...modules[key], ...params, args};
			return true;
		})
		return {args, params};
	}
	getMiningAddressFromConfig(config){
		let {modules={}} = config||this.config;
		let address = "";
		Object.keys(modules).find(key=>{
			if(key.includes("gpuminer:") || key.includes("kaspaminer:")){
				modules[key].args = modules[key].args||{};
				address = modules[key].args["mining-address"];
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

	setModulesConfigTemplate(defaults, network, upnpEnabled) {
		let prev = this.config || {};
		let templateModules = defaults.modules || {};
		// RESET-replace apply. Activating the warning-styled RESET control replaces
		// the active node model with exactly the selected template's module set --
		// the previous template's modules are NOT merged in, so selecting Public
		// Node then Local Node yields the Local Node module set alone, never an
		// accumulated {kaspad:public, kaspad:kd0, ...}. The replace still preserves
		// every non-module config key (theme, compounding, metrics, UPnP, ...) --
		// prev wins in the merge below -- and never touches on-disk data: kaspad
		// isolates per network under kaspad-kd<N>/kaspa-<network>/, so a node synced
		// before a RESET resumes without re-IBD when its template is re-selected
		// (deleting a data dir is the separate, explicitly confirm-gated
		// remove-datadir reset). The network selector -- not the template identity
		// -- drives the kaspad daemon args (ports + testnet flag), applied next.
		let modules = Object.assign({}, templateModules);

		this.applyNetworkToKaspadModules(modules, templateModules, network);

		this.config = Object.assign({}, defaults, prev);
		this.config.modules = modules;
		this.config.network = network;
		this.config.upnpEnabled = upnpEnabled;
		// Record the applied template key so the Settings selector reflects the
		// active template after a RESET rather than the previously-stored ident.
		// The initializer sets defaults.ident on first run; the settings apply path
		// passes it the same way, but prev wins the merge above, so set it here.
		if(defaults.ident)
			this.config.ident = defaults.ident;
		this.setUpnpIfMissing(upnpEnabled);

		this.setConfig(this.config);
	}

	// Apply the selected network to the kaspad entries the template defines. A
	// local kaspad gets the network's full listener set (ports + testnet flag); a
	// connect-only (Public Node) kaspad carries the network as an explicit
	// networkId field -- it binds nothing, so it has no listeners.
	applyNetworkToKaspadModules(modules, templateModules, network) {
		const listeners = KASPAD_NETWORK_LISTENERS[network] || KASPAD_NETWORK_LISTENERS['mainnet'];
		Object.keys(templateModules).forEach((k) => {
			const [type] = k.split(':');
			if(type != 'kaspad' || !modules[k])
				return;
			if(modules[k].connectOnly) {
				modules[k] = Object.assign({}, modules[k], { networkId : network });
				return;
			}
			let args = Object.assign({}, modules[k].args || {});
			// Clear the prior network flag first so re-applying a network is not
			// additive (switching testnet-10 -> mainnet must drop the testnet flag).
			delete args.testnet;
			Object.assign(args, listeners);
			modules[k] = Object.assign({}, modules[k], { args });
		});
	}

	setUpnpIfMissing(upnpEnabled) {
		if (this.config?.modules) {
			Object.keys(this.config.modules).forEach((k) =>{
				if (k.startsWith('kaspad:') && !('upnpEnabled' in this.config.modules[k])) {
					console.info(`${upnpEnabled ? 'Enabling' : 'Disabling'} UPNP for ${k}`);
					this.config.modules[k].upnpEnabled = upnpEnabled;
				};
			});
		}
	}
}

module.exports = App;
