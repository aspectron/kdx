const os = require('os');
const fs = require('fs-extra');
const path = require('path');

const utils = require("../utils");
const Daemon = require('../daemon');
// const { WS_JSON_RPC } = os.hostname() == 'BROADWELL' ? require('../../../kstats') : require('kstats');
const RPC = require('../ws-json-rpc');

module.exports = class Kaspad extends Daemon {
	constructor(manager, task) {
		super(manager, task);
		this.log(`Creating ${task.type}`.green.bold);
		// console.log(task);
		// TODO @aspect use GIT flag to determine if we run native(local) or operate from a git repo
	}

	start() {
		const {manager} = this;
		this.log("kaspad::start() invoked...");
		return new Promise(async (resolve,reject) => {
			
			this.cleanupResidualData();
			
			this.log("kaspad::start() running");

			let defaults = {
				//devnet : 1,
				//nolisten : 1,
				//notls : 1,
				//debuglevel : 'debug',
				debuglevel : 'info',
				rpcuser : 'user',
				rpcpass : 'pass',
				rpccert : path.join(manager.dataFolder, 'rpc.cert'),
				rpckey : path.join(manager.dataFolder, 'rpc.key'),
				nobanning : 1,
				nodnsseed : 1,
				//listen : '0.0.0.0:'+(this.globals.kaspad.ports.p2p+this.task.seq),
				//listen : '0.0.0.0:'+(env.KASPAD_P2P_BASE_PORT+this.task.seq),
				//rpclisten : '0.0.0.0:'+(this.globals.kaspad.ports.rpc+this.task.seq),
				datadir : this.folder,
				//addrindex : 1,
				acceptanceindex : 1,
				testnet:1
				//profile: (this.globals.kaspad.ports.profiler+this.task.seq)  // http://localhost:7000/debug/pprof/
			};


			let args = {};
			Object.entries(this.task.args || {}).map(([k, v]) => {
				if(['devnet','testnet','mainnet','simnet'].includes(k) && v === undefined)
					v = 1;
				if(args[k]) {
					if(Array.isArray(args[k]))
						args[k].push(v);
					else
						args[k] = [args[k], v];
				}
				else
					args[k] = v;
			});
			args = Object.assign({}, defaults, args);

			let addresses = {
				'regnet' : 'kaspareg:qr35ennsep3hxfe7lnz5ee7j5jgmkjswsslwxj42ta',
				'devnet' : 'kaspatest:qputx94qseratdmjs0j395mq8u03er0x3u2xu3wvh9',
				'simnet' : 'kaspasim:qr35ennsep3hxfe7lnz5ee7j5jgmkjswsslwxj42ta',
				'kaspa' : 'kaspa:qr35ennsep3hxfe7lnz5ee7j5jgmkjswsslwxj42ta',
				'testnet': 'kaspatest:przhjdpv93xfygpqtckdc2zkzuzqeyj2pgg3hlfnac'
			};

			Object.entries(addresses).forEach(([k,v]) => {
				if(args[k])
					args.miningaddr = v;
			})

			if(!args.miningaddr)
				args.miningaddr = 'kaspa:qr35ennsep3hxfe7lnz5ee7j5jgmkjswsslwxj42ta';

			// let peers = this.getPeers();
			// if(peers) {
			// 	args.connect = peers.map((peer) => {
			// 		const port = this.globals.kaspad.ports.p2p+peer.seq;
			// 		// detect if the peer we are connecting to is on the same host
			// 		// if(peer.host == this.task.host && peer.ip == this.task.ip) {
			// 		// 	return `127.0.0.1:${port}`;
			// 		// }
			// 		const ipv4 = this.getIPv4(peer.ip);
			// 		const host = peer.host;
			// 		return `${ipv4}:${port}`;
			// 	})
			// }

			const configFile = path.join(this.folder, 'kaspad.conf');
			let text = this.toConfig(args);
			fs.writeFileSync(configFile, text);

			//this.log(text.green.bold);

			/*
			console.log("kaspad::::", [
				this.getBinary('kaspad'),
				//`--datadir=`,
				`--configfile=${configFile}`
			].join(" "))
			*/

			await this.VSARGS([this.getBinary('kaspad'),'--version']);
			
			this.run({
				args : () => {
					// console.log((this.task.name||'?').yellow.bold,`'${this.folder}'`.cyan.bold,this.task);
					return [
						this.getBinary('kaspad'),
						//`--datadir=`,
						`--configfile=${configFile}`
					];
				}
			})


/*
			this.rpc = new RPC(this.task.id);//`options.name`);

			this.rpc.on('ws:open', () => {
				// this.kstats.rpc.publish('KSTATS.connect', {
				// 	name : this.name,
				// 	addr : this.addr,
				// 	port : this.port
				// });
			});
	
			this.rpc.on('ws:close', () => {
				// this.kstats.rpc.publish('KSTATS.disconnect', {
				// 	name : this.name,
				// 	addr : this.addr,
				// 	port : this.port
				// });
			});
	
			let port = args.rpclisten.split(':').pop();
			port = parseInt(port);
			if(!port || isNaN(port))
				this.rpcInfo = { error : 'RPC is unable to connect'}
			else {
				let address = `wss://127.0.0.1:${port}/ws`;
				// if(!address.match(/^wss:\/\//))
				// 	address = 'wss://'+address;
				// if(!address.match(/\/ws$/))
				// 	address = address+'/ws';

				this.rpc.connect(address);

				this.rpcPoller = setInterval(()=>{

				}, 1250)
			}
*/

			resolve();

			// mutes all kaspad processes by default
			this.mute = true;
		})
	}

	poll() {

	}

	stop() {
		if(this.rpcPoller)
			clearInterval(this.rpcPoller);
		this?.rpc.close();
		return super.stop();
	}

	cleanupResidualData() {
		this.log('cleaning up residual data...');
		let list = fs.readdirSync(this.folder);
		list.forEach((subfolder) => {
			try {
				if(fs.lstatSync(path.join(this.folder, subfolder)).isDirectory()) {
					let target = path.join(this.folder, subfolder, 'peers.json');
					// console.log("testing:".brightBlue, target);
					if(fs.existsSync(target)) {
						this.log(`removing ${target}`);
						fs.remove(target);
					}
				}
			} catch(ex) {
				console.log(ex);	// just in case, since we use sync functions
			}
		})
	}



	async getStats(post) {

		//return Promise.resolve();

		// ---

		return new Promise(async (resolve, reject) => {
			const data = { }
	        try {
	            for(let method of ['getInfo','getBlockDagInfo','getMempoolInfo','getNetTotals'])
					data[method.replace(/^get/,'').toLowerCase()] = await this.rpc.call(method,[]);
					
				this.rpcInfo = data;
	            // console.log("kaspad:".yellow.bold,data);

	            // let stats = {
	            // 	blocks : data.info.blocks,
	            // 	connections : data.info.connections,
	            // 	difficulty : data.info.difficulty,
	            // 	relayFee : data.info.relayFee,
	            // 	headers : data.blockdaginfo.headers,
	            // 	medianTime : data.blockdaginfo.medianTime,
	            // 	mempoolsize : data.mempoolinfo.size,
	            // 	mempoolbytes : data.mempoolinfo.bytes,
	            // 	bytes_recv : data.nettotals.totalBytesRecv,
	            // 	bytes_sent : data.nettotals.totalBytesSent,
	            // };
				// console.log("kaspad stats:".yellow.bold,stats,"posting...".cyan.bold);
	            //post && this.gauge(stats);

	            // if(true) {
		        //     let storageBytes = await utils.storageSize(this.folder, {
		        //     	filter : (f) => {
		        //     		//console.log(f);
		        //     		if(f.match(/kaspad\.log$/))
		        //     		 	return false;
		        //     		return true;
		        //     	}
		        //     })

		        //     this.gauge('storage.bytes_used', storageBytes);
		        //     // console.log("STORAGE BYTES".cyan.bold,storageBytes);
		        // }

	        } catch(ex) {
	            // console.log('KASPAD monitor:'.bold,ex.toString().red.bold);
	            return reject(ex);
	        }

	        return resolve(data);
		})
	}
}

/*
{
  info: {
    version: 120000,
    protocolVersion: 70002,
    blocks: 1,
    timeOffset: 0,
    connections: 1,
    proxy: '',
    difficulty: 1.00000012,
    testNet: false,
    devNet: true,
    relayFee: 0.00001,
    errors: ''
  },
  blockdaginfo: {
    dag: 'devnet',
    blocks: 1,
    headers: 1,
    tipHashes: [
      '000033abb09b45e09ef5e3a2b92185b7503a074565ef5706904167c60b37d6f4'
    ],
    difficulty: 1.00000012,
    medianTime: 1560419646,
    utxoCommitment: '0000000000000000000000000000000000000000000000000000000000000000',
    pruned: false,
    softForks: null,
    bip9SoftForks: { dummy: [Object] }
  },
  mempoolinfo: { size: 0, bytes: 0 }
}
*/