false && chrome.developerPrivate.openDevTools({
	renderViewId: -1,
	renderProcessId: -1,
	extensionId: chrome.runtime.id,
});
const App = require("./app.js");
const fs = require("fs");
const path = require("path");
const { dpc } = require("@aspectron/flow-async");

// Poll interval and ceiling while awaiting the node-disabled rpc-host iframe to
// load and bind the main process's flow-rpc transport onto its live channel.
const RPC_HOST_BIND_POLL_MS = 25;
const RPC_HOST_BIND_TIMEOUT_MS = 10000;

class NWApp extends App{

	constructor(options){
		super(options)
	}

	// super.initRPC() builds the flow-rpc instance inside the background page
	// NWJS synthesizes for a JS main; that page never navigates to a live
	// document, so the BroadcastChannel built there is off the live delivery
	// router and main<->renderer RPC times out. Bind the transport on a
	// node-disabled iframe instead: a live document realm whose channel joins
	// the delivery router, that does not join the CommonJS loader (so it cannot
	// repoint the renderer require base) yet shares the V8 isolate (so the rpc
	// object is usable). Done before the controller window opens and sends its
	// first request.
	async initRPC(){
		const result = await super.initRPC();
		await this.bindRpcOnHostFrame();
		return result;
	}

	bindRpcOnHostFrame(){
		return new Promise((resolve) => {
			let host;
			try {
				host = document.createElement('iframe');
			} catch(e) {
				console.error('KDX::rpc-host frame requires a background-page DOM', e);
				return resolve();
			}
			host.setAttribute('nwdisable', '');
			host.style.display = 'none';
			host.src = 'resources/rpc-host.html';
			host.addEventListener('load', () => {
				const frameWindow = host.contentWindow;
				if(frameWindow && typeof frameWindow.__bindMainTransport === 'function')
					frameWindow.__bindMainTransport(this.rpc);
				else
					console.error('KDX::rpc-host frame did not expose __bindMainTransport');
			});
			(document.body || document.documentElement).appendChild(host);
			const startedAt = Date.now();
			const awaitBind = () => {
				const frameWindow = host.contentWindow;
				if(frameWindow && frameWindow.__kdxRpcHostBound)
					return resolve();
				if(Date.now() - startedAt > RPC_HOST_BIND_TIMEOUT_MS){
					console.error('KDX::rpc-host did not bind the main flow-rpc transport within the timeout');
					return resolve();
				}
				dpc(RPC_HOST_BIND_POLL_MS, awaitBind);
			};
			awaitBind();
		});
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
				// Floor for the custom resize grips (kdx-window-resizer.js) so no
				// drag path can collapse the frameless window.
				min_width: 640,
				min_height: 480,
				resizable: true,
				frame: false,
				transparent: false,
				show: true,
				icon: 'resources/setup/Icon.png'
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
		console.error(`Please start app with --init=/path/to/data/dir or --init for default (~/.kdx/data)`.red);
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
			icon: 'resources/setup/Icon.png'
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
//		useWalletForMining
		rpc.on("set-enable-mining", (args)=>{
			let {enableMining} = args;
			if(enableMining == undefined)
				return
			this.setEnableMining(enableMining);
		});
		rpc.on("set-use-wallet-for-mining", (args, callback)=>{
			let {useWalletForMining} = args;
			if(useWalletForMining !== undefined){
				this.setUseWalletForMining(useWalletForMining);
			}
			callback()
		});
		rpc.on("set-mining-address", (args, callback)=>{
			let {address} = args;
			if(address == undefined)
				return callback({error:"Invalid address"})
			this.setMiningAddress(address);
			callback(null, {config:this.getModulesConfig()})
		})
		rpc.on("set-enable-metrics", (args)=>{
			let {enableMetrics} = args;
			if(enableMetrics == undefined)
				return
			this.setEnableMetrics(enableMetrics);
		});

		rpc.on("set-statsd-address", (args)=>{
			let {statsdAddress} = args;
			if(statsdAddress == undefined)
				return
			this.setStatsdAddress(statsdAddress);
		});

		rpc.on("set-statsd-prefix", (args)=>{
			let {statsdPrefix} = args;
			if(statsdPrefix == undefined)
				return
			this.setStatsdPrefix(statsdPrefix);
		});

		rpc.on("set-build-type", (args)=>{
			let {build} = args;
			if(build == undefined)
				return
			this.setBuildType(build);
		});

		rpc.on("set-compounding", ({compounding})=>{
			this.config.compounding = compounding;
			this.setConfig(this.config);
		})

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

		rpc.on("remove-datadir", async (args, callback)=>{
			let removed = await this.removeDataDir();
			callback(null, {removed})
		})
		rpc.on("set-skip-utxoindex", async (args, callback)=>{
			this.setSkipUTXOIndex(args.skipIndex);
			let skipUTXOIndex = this.getSkipUTXOIndex();
			callback(null, {skipUTXOIndex, config:this.getModulesConfig()})
		})

		rpc.on("set-config-template", (args, callback)=>{
			let { defaults, network } = args;
			if(defaults && network)
				this.setModulesConfigTemplate(defaults,network);
			callback(null, {config:this.config});
		});

		rpc.on("set-app-data-dir", async (args, callback)=>{
			let {dataDir, restartDelay, defaults, network, upnpEnabled } = args;
			//return callback({error: "Invalid directory"});

			if(defaults && network) {
				this.setModulesConfigTemplate(defaults, network, upnpEnabled);
			}

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
