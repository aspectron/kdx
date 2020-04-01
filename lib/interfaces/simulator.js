const fs = require('fs');
const os = require('os');
const path = require('path');

const { utils } = require("micro-fabric");
const Daemon = require('../daemon');

module.exports = class Simulator extends Daemon {
	constructor(manager, task) {
		super(manager, task);
		console.log(`Creating ${task.type}`.green.bold);
	}

	getPeers(){
		return this.task.conf.peers;
	}

	start() {
		this._stopped = false;
		const {core, manager} = this;
		//const env = core.env;

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

		let blocks = 0;
		//console.log(text.green.bold);
		//const binary = path.join(core.appFolder,'bin','simulator')+this.PLATFORM_BINARY_EXTENSION;
		const rpcCertFile = path.join(manager.dataFolder, 'rpc.cert');

		dpc(3000, () => {
			this.initProcess({
				args : () => {
					// this.log(`--addresslist=${configFile}`,`--cert=${rpcCertFile}`);

					let a = [
						this.getBinary('miningsimulator'),
						'--block-delay=2000',
						`--addresslist=${configFile}`,
						`--cert=${rpcCertFile}`
					];

					this.log("args#######".red.bold, a.join(" "))
					return a;
				},
				stdout : (data) => { 
					if(!this._stopped && data.toString().match(/panic\.go/)) {

						this.log("+------------------------------------------------------".magenta.bold);
						this.log("| SIMULATOR is being reset using stdio monitoring hack.".magenta.bold);
						this.log("| ...restarting in 3000 msec".magenta.bold);
						this.restartTimeoutId = setTimeout(() => {
							this.proc.restart();
						}, 3000);
					}
					//console.log("SIMULATOR data:", data.toString());
					let match = data.toString().match(/Found block/g);
					blocks += (match && match.length) || 0;


					return this.digestStdout(data);
				}
			})
			this.proc.run();
		})

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
			if(seq % 5 == 0)
				this.log(`mined`.yellow.bold,(blocks+'').bold,'blocks at'.yellow.bold,rate.toFixed(2).bold,'blocks/sec'.yellow.bold,`(avg `.yellow.bold,`${Σ.toFixed(2)}`.bold,`)`.yellow.bold);
			this.gauge('blocks_per_sec', rate);
			this.gauge('blocks_per_sec-avg-1m', Σ);
			seq++;
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
}

