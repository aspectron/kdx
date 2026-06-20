const fs = require('fs');
const os = require('os');
const path = require('path');
const utils = require("@aspectron/flow-utils");
const util = require("../utils.js");
const { dpc } = require('@aspectron/flow-async');
const Daemon = require('../daemon');

module.exports = class Simulator extends Daemon {
	constructor(manager, task) {
		super(manager, task);
		console.log(`Creating ${task.type}`.green.bold);
		// this.verbose = true;
		this.blockrate = 0;
		this.blockrate1m = 0;
		this.hashrate = { rate : 0, units : '' };

	}

	getPeers(){
		return this.task.conf.peers;
	}

	async start() {
		this._stopped = false;
		const {manager} = this;
		

		let defaults = {
			// logdir:     logsFolder, // Directory to log output. (default:
							// C:\Users\aspect\AppData\Local\Apiserver)
			// rpcuser: 	'user', // RPC username
			// rpcpass: 	'pass', // RPC password
			//-rpcserver: 	'', // RPC server to connect to
			//-rpccert: 	'', // RPC server certificate chain for validation

			//-notls: 		'', // Disable TLS
			//-dbaddress: 	'', // Database address (default: localhost:3306)
			// dbuser: 	'kaspa', // Database user
			// dbpass: 	'kaspa', // Database password
			// dbname: 	'kasparov', // Database name
			//listen: 	'', // HTTP address to listen on (default: 0.0.0.0:8080)
							// (default: 0.0.0.0:8080)
			//migrate: 	'', // Migrate the database to the latest version. The server
							// will not start when using this flag.
			//mqttaddress:'', // MQTT broker address
			//mqttuser: 	'', // MQTT server user
			//mqttpass: 	'', // MQTT server password
			//testnet: 	undefined, // Use the test network
			//regtest: 	'', // Use the regression test network
			//simnet: 	'', // Use the simulation test network
			//devnet: 	'', // Use the development test network
		}


		let args = Object.assign(defaults, this.task.args || {});

		// Source the local node's gRPC target + network from the kaspad daemon
		// entry (the same single source the monitor uses in
		// get_default_local_kaspad_settings), so the miner dials the node KDX
		// actually launched -- not a hardcoded port or a network default.
		let nodePort;
		let nodeTestnet = false;
		try {
			const { config: modulesConfig } = await manager.controller.get('get-modules-config');
			const kaspad = Object.entries(modulesConfig || {})
				.map(([key, value]) => ({ type: key.split(':')[0], args: value.args || {} }))
				.find((entry) => entry.type === 'kaspad');
			if(kaspad) {
				nodeTestnet = kaspad.args.testnet !== undefined && kaspad.args.testnet !== false;
				if(kaspad.args.rpclisten)
					nodePort = parseInt(kaspad.args.rpclisten.split(':').pop());
			}
		} catch(ex) {
			console.log('kaspaminer: unable to read kaspad node target from config:', ex);
		}

		// Mining reward address comes from the wallet (network-correct by address
		// type). Never mine to a foreign placeholder: if none is available, the
		// run gate below keeps mining off and prompts to set up a wallet.
		let miningAddress = await manager.controller.getMiningAddress();

		// kaspa-miner CLI: --mining-address (required), --kaspad-address (dial
		// host; the locally launched node is reached over loopback), --port (the
		// node gRPC port), --testnet. KDX's --${k}=${v} formatter emits these.
		args['kaspad-address'] = '127.0.0.1';
		if(nodePort)
			args['port'] = nodePort;
		if(nodeTestnet)
			args['testnet'] = true;
		else
			delete args.testnet;
		if(miningAddress)
			args['mining-address'] = miningAddress;
		else
			delete args['mining-address'];

		//if(process.env['KASPA_JSON_RPC'])
		//	args['rpccert'] = path.join(manager.dataFolder, 'rpc.cert');	

		let blocks = 0;
		// const rpcCertFile = path.join(manager.dataFolder, 'rpc.cert');

		// const blockDelay = this.task.blockdelay || 2000;
		//console.log("++++++++++++++++ KASPAMINER VSARGS")

		await this.VSARGS([this.getDeployableBinary(this.task.conf.binary || 'kaspa-miner'), '--version']);

		args = Object.entries(args);

		const flags = utils.args();
		//console.log("++++++++++++++++ KASPAMINER FLAGS",flags)

		this.options = {
			args : () => {
				// this.log(`--addresslist=${configFile}`,`--cert=${rpcCertFile}`);
				let _args_ = [
					this.getDeployableBinary(this.task.conf.binary || 'kaspa-miner'),
					// `--block-delay=${blockDelay}`,
					// `--addresslist=${configFile}`,
					// `--cert=${rpcCertFile}`
				];

				if(/linux/.test(util.platform) && flags.nice) {
					_args_ = ['/bin/nice','-10',..._args_];
				}
				let a = _args_.concat(args.map(([k, v]) => {
					return ((v === undefined || v === null || v === true || v === '') ? `--${k}` : `--${k}=${v}`);
				}));

				console.log("---KASPAMINER ARGS",a);
				// this.log("simulator args".red.bold, a.join(" "))
				return a;
			},
			stdout : (data) => { 
				// if(!this._stopped && data.toString().match(/panic\.go/)) {

				// 	this.log("+------------------------------------------------------".magenta.bold);
				// 	this.log("| SIMULATOR is being reset using stdio monitoring hack.".magenta.bold);
				// 	this.log("| ...restarting in 3000 msec".magenta.bold);
				// 	this.restartTimeoutId = setTimeout(() => {
				// 		this.restart();
				// 	}, 3000);
				// }
				//console.log("SIMULATOR data:", data.toString());

				let text = data.toString();

				let lines = text.split('\n');
				lines.forEach((l) => {

					if(/Found a block/g.test(l))
						blocks++;

					let hr = l.match(/hashrate is:\s*(?<rate>\d+\.?\d*)\s+(?<units>[^\s]+)/)?.groups;
					if(hr && hr.rate && hr.units) {
						this.hashrate.rate = parseFloat(hr.rate) || 0.0;
						this.hashrate.units = hr.units;
					}

				});

				// let match = data.toString().match(/Found block/g);
				// // console.log("kaspaminer match:", match);
				// blocks += (match && match.length) || 0;


				return this.digestStdout(data);
			}
		};
		//console.log("KASPAMINER STATUS:",this.manager.enableMining,flags.mine);
		if((this.manager.enableMining || flags.mine) && miningAddress) {
			dpc(0, () => {
				this.run()
			})
		} else if(this.manager.enableMining || flags.mine) {
			// Mining requested but no reward address available -- do not mine to a
			// placeholder; prompt the user to set up a wallet first.
			this.state = 'disabled';
			dpc(0, () => {
				this.writeToSink('\r\n\r\nNo mining address available. Open or create a wallet to enable mining.\r\n\r\n');
			})
		} else {
			this.state = 'disabled';
			dpc(0, () => {
				this.writeToSink('\r\n\r\nKaspaminer is disabled. Please use Enable Mining option to start it.\r\n\r\n');
			})
		}

		let tsΩ = Date.now();
		let blockΩ = 0;
		let seq = 0;
		let rateΣ = [];
		this.statusTimer = setInterval(()=>{
			let ts = Date.now();
			let tsΔ = ts-tsΩ;
			let blockΔ = blocks-blockΩ;
			let rate = blockΔ / tsΔ * 1e3;
			tsΩ = ts;
			blockΩ = blocks;
			rateΣ.push(rate);
			while(rateΣ.length > 6)
				rateΣ.shift();
			let Σ = rateΣ.reduce((a,b) => a+b, 0) / rateΣ.length;
			// if(seq % 5 == 0)
			// 	this.log(`mined`.yellow.bold,(blocks+'').bold,'blocks at'.yellow.bold,rate.toFixed(2).bold,'blocks/sec'.yellow.bold,`(avg `.yellow.bold,`${Σ.toFixed(2)}`.bold,`)`.yellow.bold);
			//this.gauge('blocks_per_sec', rate);
			this.blockrate = rate;
			//this.gauge('blocks_per_sec-avg-1m', Σ);
			this.blockrate1m = Σ;
			seq++;

			if(typeof flow != 'undefined' && flow.samplers) {
				flow.samplers.get(`${this.task.key}-block-rate`).put(this.blockrate);
				flow.samplers.get(`${this.task.key}-block-rate-avg`).put(this.blockrate1m);
				flow.samplers.get(`${this.task.key}-hash-rate`).put(this.hashrate.rate);
			}
			this.renderTaskInfo();
		}, 10 * 1000);
		
	}

	digestStdout(){

	}

	gauge(title, value){
		this.log(title, value)
	}

	async stop() {
		this._stopped = true;

		try {
			flow.samplers.get(`${this.task.key}-block-rate`).put(0);
			flow.samplers.get(`${this.task.key}-block-rate-avg`).put(0);
			flow.samplers.get(`${this.task.key}-hash-rate`).put(0);
			this.renderTaskInfo();
		} catch(ex) { console.error(ex); }

		clearInterval(this.statusTimer);
		if(this.restartTimeoutId)
			clearTimeout(this.restartTimeoutId)

		return super.stop();
	}

	async renderModuleInfo({ html, i18n }) {
		let els = await super.renderModuleInfo({ html, i18n });



		let rate = html`
			<flow-data-badge-graph style="min-width:128px;" sampler="${this.task.key}-block-rate" suffix="${i18n.t(" / SEC")}" title="${i18n.t("BLOCK RATE")}" align="right">${this.blockrate.toFixed(2)}</flow-data-badge-graph>
			<flow-data-badge-graph style="min-width:128px;" sampler="${this.task.key}-block-rate-avg" suffix="${i18n.t(" / MIN")}" title="${i18n.t("BLOCKS RATE (AVG)")}" align="right">${this.blockrate1m.toFixed(2)}</flow-data-badge-graph>
			<flow-data-badge-graph style="min-width:160px;" sampler="${this.task.key}-hash-rate" suffix="${this.hashrate.units}" title="${i18n.t("HASH RATE")}" align="right">${this.hashrate.rate.toFixed(2)}</flow-data-badge-graph>
		`;

		return html`${els}${rate}`;
	}
}
