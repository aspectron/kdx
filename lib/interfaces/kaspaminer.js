const fs = require('fs');
const os = require('os');
const path = require('path');
const utils = require("@aspectron/flow-utils");
const { dpc } = require('@aspectron/flow-async');
const Daemon = require('../daemon');

module.exports = class Simulator extends Daemon {
	constructor(manager, task) {
		super(manager, task);
		console.log(`Creating ${task.type}`.green.bold);
		// this.verbose = true;
		this.rate = 0;
		this.rate1m = 0;
	}

	getPeers(){
		return this.task.conf.peers;
	}

	async start() {
		this._stopped = false;
		const {manager} = this;

//		console.log("++++++++++++++++ KASPAMINER STARTING")
/*
		let peers = this.getPeers();

		let args = (peers || []).map((peer) => {
			return peer;
			let ip = this.getIPv4(peer.ip);
			if(!ip) {
				this.log(`unable to resolve ip for peer (perhaps peer has no host?)`.red.bold, peer);
				return null;
			}
			let port = this.globals.kaspad.ports.rpc+peer.seq;
			return `${ip}:${port}`;
		}).filter(t => t);


		if(!args.length) {
			this.log("no IPs present as there are no peer references".magenta.bold);
			return;
		}

		const configFile = path.join(this.folder, 'simulator.conf');
		let text = args.join(os.EOL);
		fs.writeFileSync(configFile,text);
		this.log(`connecting to:`.yellow.bold, args.join(', ').bold);
*/




		let defaults = {
			//logdir:     logsFolder, // Directory to log output. (default:
							// C:\Users\aspect\AppData\Local\Apiserver)
			rpcuser: 	'user', // RPC username
			rpcpass: 	'pass', // RPC password
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

		if(!args.miningaddr) {
			args.miningaddr = 'kaspatest:qpc3hr2kmnu6j0crw42cmryptzqmyqm9gstqp5r863';
//				args.miningaddr = 'kaspa:qqg767gkznmsuah5xeer9f72lwqu642nqvlmujtpmk';
			//args.miningaddr = 'kaspa:qr35ennsep3hxfe7lnz5ee7j5jgmkjswsslwxj42ta';
		}		

		args['rpccert'] = path.join(manager.dataFolder, 'rpc.cert');	

		let blocks = 0;
		// const rpcCertFile = path.join(manager.dataFolder, 'rpc.cert');

		// const blockDelay = this.task.blockdelay || 2000;
		//console.log("++++++++++++++++ KASPAMINER VSARGS")

		await this.VSARGS([this.getBinary('kaspaminer'),'--version']);

		args = Object.entries(args);

		const flags = utils.args();
		//console.log("++++++++++++++++ KASPAMINER FLAGS",flags)
		
		this.options = {
			args : () => {
				// this.log(`--addresslist=${configFile}`,`--cert=${rpcCertFile}`);
				let _args_ = [
					this.getBinary('kaspaminer'),
					// `--block-delay=${blockDelay}`,
					// `--addresslist=${configFile}`,
					// `--cert=${rpcCertFile}`
				];

				if(/linux/.test(utils.platform) && flags.nice) {
					_args_ = ['/bin/nice','-10',..._args_];
				}
				let a = _args_.concat(args.map(([k, v]) => {
					return ((v === undefined || v === null || v === '') ? `--${k}` : `--${k}=${v}`);
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
				let match = data.toString().match(/Found block/g);
				// console.log("kaspaminer match:", match);
				blocks += (match && match.length) || 0;


				return this.digestStdout(data);
			}
		};
		//console.log("KASPAMINER STATUS:",this.manager.enableMining,flags.mine);
		if(this.manager.enableMining || flags.mine) {
			dpc(0, () => {
				//console.log("----------------- KASPAMINER STARTING")
				this.run()
			})
		} else {
			//console.log("----------------- KASPAMINER NOT RUNNING")
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
			this.rate = rate;
			//this.gauge('blocks_per_sec-avg-1m', Σ);
			this.rate1m = Σ;
			seq++;

			if(typeof flow != 'undefined' && flow.samplers) {
				flow.samplers.get(`${this.task.key}-block-rate`).put(this.rate);
				flow.samplers.get(`${this.task.key}-block-rate-avg`).put(this.rate1m);
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
		clearInterval(this.statusTimer);
		if(this.restartTimeoutId)
			clearTimeout(this.restartTimeoutId)

		return super.stop();
	}

	async renderModuleInfo({ html }) {
		let els = await super.renderModuleInfo({ html });



		let rate = html`
			<flow-data-badge-graph style="min-width:128px;" sampler="${this.task.key}-block-rate" suffix=" / SEC" title="BLOCK RATE" align="right">${this.rate.toFixed(2)}</flow-data-badge-graph>
			<flow-data-badge-graph style="min-width:128px;" sampler="${this.task.key}-block-rate-avg" suffix=" / MIN" title="BLOCKS RATE (AVG)" align="right">${this.rate1m.toFixed(2)}</flow-data-badge-graph>
		`;

		return html`${els}${rate}`;
	}
}

