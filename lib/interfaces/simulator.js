const fs = require('fs');
const path = require('path');

const { utils } = require("micro-fabric");
const Daemon = require('../daemon');

module.exports = class Simulator extends Daemon {
	constructor(manager, task) {
		super(manager,task);
		console.log(`Creating ${task.type}`.green.bold);
	}

	start() {

		const core = this.manager.core;
		const env = core.env;

		let peers = this.getPeers();

		let args = (peers || []).map((peer) => {
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

		const configFile = path.join(this.folder,'simulator.conf');
		let text = args.join('\n');
		fs.writeFileSync(configFile,text);
		this.log(`connecting to:`.yellow.bold,args.join(', ').bold);

		let blocks = 0;
		//console.log(text.green.bold);
		//const binary = path.join(core.appFolder,'bin','simulator')+this.PLATFORM_BINARY_EXTENSION;
		const rpcCertFile = path.join(core.appFolder,'rpc.cert');

		dpc(3000, () => {
			this.initProcess({
				args : () => {
					// this.log(`--addresslist=${configFile}`,`--cert=${rpcCertFile}`);

					return [
						this.getBinary('miningsimulator'),
						`--addresslist=${configFile}`,
						`--cert=${rpcCertFile}`
					];
				},
				stdout : (data) => { 
					if(data.toString().match(/panic\.go/)) {

						this.log("+------------------------------------------------------".magenta.bold);
						this.log("| SIMULATOR is being reset using stdio monitoring hack.".magenta.bold);
						this.log("| ...restarting in 3000 msec".magenta.bold);
						dpc(3000, () => {
							this.proc.restart();
						})
					}
					// console.log("SIMULATOR data:",data.toString());
					let match = data.toString().match(/Found block/g);
					blocks += (match && match.length) || 0;


					return this.digestStdout(data);
				}
			})
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
			this.gauge('blocks_per_sec',rate);
			this.gauge('blocks_per_sec-avg-1m',Σ);
			seq++;
		}, 10 * 1000);
	}

	async stop() {
		clearInterval(this.statusTimer);

		return super.stop();
	}
}

