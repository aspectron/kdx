const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const { dpc, Semaphore } = require("@aspectron/flow-async");
const utils = require("@aspectron/flow-utils");
const Daemon = require('../daemon');
// const { WS_JSON_RPC } = os.hostname() == 'BROADWELL' ? require('../../../kstats') : require('kstats');
const RPC = require('../ws-json-rpc');

module.exports = class Kaspad extends Daemon {
	constructor(manager, task) {
		super(manager, task);
		this.log(`Creating ${task.type}`.green.bold);
		this['monitor-storage'] = true;
		// console.log(task);
		this.data = [ ];

		this.ready = new Semaphore();
	}

	start() {
		const {manager} = this;
		this.log("kaspad::start() invoked...");
		return new Promise(async (resolve,reject) => {
			
			if(this.task['reset-peers'])
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
				'testnet': 'kaspatest:qpc3hr2kmnu6j0crw42cmryptzqmyqm9gstqp5r863'
			};

			Object.entries(addresses).forEach(([k,v]) => {
				if(args[k] === 1)
					args.miningaddr = v;
			})

			/*
				Private key (hex):      32396163626339626538656238333830623863343733333434376538396562653064333233646466353366316261653834383834326664343731646539373039

				These are your public addresses for each network, where money is to be sent.
				Address (mainnet):      kaspa:qqg767gkznmsuah5xeer9f72lwqu642nqvlmujtpmk
				Address (testnet):      kaspatest:qqg767gkznmsuah5xeer9f72lwqu642nqv060jg645
				Address (devnet):       kaspadev:qqg767gkznmsuah5xeer9f72lwqu642nqv5hskdzke			
			*/

			if(!args.miningaddr) {
				args.miningaddr = 'kaspatest:qpc3hr2kmnu6j0crw42cmryptzqmyqm9gstqp5r863';
//				args.miningaddr = 'kaspa:qqg767gkznmsuah5xeer9f72lwqu642nqvlmujtpmk';
				//args.miningaddr = 'kaspa:qr35ennsep3hxfe7lnz5ee7j5jgmkjswsslwxj42ta';
			}

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

			this.manager.registerString(this,'address','P2P',args.listen);
			this.manager.registerString(this,'address','RPC',args.rpclisten);
			

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
						this.getDeployableBinary('kaspad'),
						//`--datadir=`,
						`--configfile=${configFile}`
					];
				}
			})



			this.rpc = new RPC(this.task.id);//`options.name`);
			// this.tps = new RPC(this.task.id+'tps');//`options.name`);
			// this.tps.on('ws:open', () => {
			// 	this.tps.register('notifyNewTransactions',[true,''], (data) => {
			// 		console.log("NOTIFY NEW TRANSACTION DATA!".brightRed, data);
			// 	})
			// });


			this.rpc.on('ws:open', () => {
				// this.kstats.rpc.publish('KSTATS.connect', {
				// 	name : this.name,
				// 	addr : this.addr,
				// 	port : this.port
				// });
				if(this.isInit) {
					this.isInit = false;
					this.ready.resolve();// = utils.semaphore();
				}
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
				const user = args.rpcuser || 'user';
				const pass = args.rpcpass || 'pass';
				const address = `wss://${user}:${pass}@localhost:${port}/ws`;
				// if(!address.match(/^wss:\/\//))
				// 	address = 'wss://'+address;
				// if(!address.match(/\/ws$/))
				// 	address = address+'/ws';
				this.log("rpc-address", address)
				this.rpc.connect(address);
				// this.tps.connect(address);

				this.createPoller(1250, ()=>{
					return new Promise((resolve) => {
						this.getStats().then(()=>{
							this.renderTaskInfo();
							resolve();
						}).catch((err)=>{
							this.log(`error polling websocket json rpc (is 'rpclisten' properly configured?) `)
							this.log(err);
							this.renderTaskInfo();
							resolve();

							// TODO - UPDATE UI (HOME PAGE to reflect)
						})
					})
				});

				// this.poll(1250, ()=>{

				// });

				// this.rpcPoller = setInterval(()=>{

				// }, 1250)
			}


			resolve();

			// mutes all kaspad processes by default
			this.mute = true;
		})
	}

	getTS(ts) {
		var d = new Date(ts);
		return d.toJSON().replace('T',' ');
	}

	async renderModuleInfo({ html }) {
		let els = await super.renderModuleInfo({ html });
		let text = JSON.stringify(this.rpcInfo || 'N/A');

		const { data } = this;

		if(this.rpcInfo) {

			let table = html`
				${
					this.data.map((o) => {
						// if(v == 'line-break')
						// 	return html`<br style="clear:both;"/>`;

						

						if(o.value === undefined)// || typeof v != 'string')
							return null;
						let { value, name, sampler, time } = o;
						let align = 'right';
						let css = o.css || '';
						if(time) {
							value = time;
							css += 'min-width:210px;'
							align = 'left';
						} else if(/^blocks/i.test(o.name)) {
							css += 'min-width:120px;'
						} else if(/^difficulty/i.test(o.name)) {
							css += 'min-width:160px;'
						}

						//console.log('v:',v);
						let suffix = o.suffix || '';
						if(o.suffix) {
							let parts = o.value.split(' ');
							value = parts.shift();
							suffix = parts.shift();

							if(typeof o.suffix == 'function') {
								suffix = o.suffix(suffix);
							}
						}

						let prefix = value.prefix || '';


						// if(v.value !== undefined)
						// 	v = v.value;
						// if(Array.isArray(v)) {
						// 	let parts = v[0].split(' ');
						// 	v = parts.shift();
						// 	suffix = parts.shift();
						// }
						if(!o.graph)
							return html`<flow-data-badge has-colon style="${css}" prefix="${prefix}" suffix="${suffix}" title="${name}" align="${align}">${value}</flow-data-badge>`;
						else
							return html`<flow-data-badge-graph has-colon style="${css}" prefix="${prefix}" suffix="${suffix}" title="${name}" align="${align}" sampler="${sampler}">${value}</flow-data-badge-graph>`;

					}).filter(v=>v)
				}
			`;

			return html`${els}
					${table}
			`;
		}
		else {
			return html`${els}
				<flow-data-badge has-colon style="--flow-primary-color:orange;" title="STATUS" align="right">CONNECTING...</flow-data-badge>`;
		}
	}

	async stop() {
		this.prepareForShutdown();

		// if(this.rpcPoller)
		// 	clearInterval(this.rpcPoller);
		//this?.rpc?.close();

		let ableToPostShutdown = false;
		if(this.rpc) {
			this.rpc.reconnect = false;

			try {
				let ret = await this.rpc.call('stop',[]);
				ableToPostShutdown = true;
				//console.log('KASPAD RPC STOP ret:',ret);
			} catch(ex) { /*console.log(`MANAGER SHUTDOWN: ${ex.toString()}`.red.bold,'\n',ex.stack)*/ }
			this.rpc.close();
			delete this.rpc;
		}

		return super.stop(ableToPostShutdown);
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
	            for(let method of ['getInfo','getBlockDagInfo','getMempoolInfo','getNetTotals','getConnectionCount'])
					data[method.replace(/^get/,'').toLowerCase()] = await this.rpc.call(method,[]);
					
				this.rpcInfo = data;

				
				
				const {info:i,blockdaginfo:bdi,mempoolinfo:mpi,nettotals:net} = data;

				const sources =  {
					"DAG Type" : { value : bdi.dag },
					"Protocol" : { value : i.protocolVersion, prefix : 'v ' },
					"Blocks" : { sample : i.blocks, value : (i.blocks).toCS(), graph : true },
					"Difficulty" : { sample : i.difficulty, graph : true },
					"Relay Fee" : { sample : i.relayFee },
					//"Errors" : i.errors,
					"Median Time" : { time : this.getTS(bdi.medianTime*1000), sample : bdi.medianTime, graph : true },
					//'line-break' : 'line-break',
					//"Pruned" : bdi.pruned?'Yes':'No',
					"Mempool Size" : { sample : mpi.size, value : (mpi.size).toCS(), graph : true, advanced : true },
					"Mempool" : { sample : mpi.bytes, value : (mpi.bytes).toFileSize(), suffix : true, graph : true, advanced : true },
					"Network Rx" : { sample : net.totalBytesRecv, value : (net.totalBytesRecv).toFileSize(), suffix : t=>`${t} / S`, css : 'min-width:160px', graph : true },
					"Network Tx" : { sample : net.totalBytesSent, value : (net.totalBytesSent).toFileSize(), suffix : t=>`${t} / S`, css : 'min-width:160px', graph : true },
					"Network Time" : { sample: net.timeMillis, time : this.getTS(net.timeMillis), graph : true }
				};

				if(i.errors)
					data.Errors = JSON.stringify(i.errors);


				this.data = Object.entries(sources).map(([name,entry]) => {
					if(typeof entry != 'object')
						entry = { value : entry };
					entry.name = name;
					entry.value = entry.value || entry.sample;
					if(entry.sample) {
						let property = name.toLowerCase().replace(/\s/g,'-');
						entry.sampler = `${this.task.key}-${property}`;
						if(typeof flow != 'undefined')
							flow.samplers.get(entry.sampler).put(entry.sample);
					}
					return entry;
				})


			//	global.flow.samplers('xxx').put(object)
	            // console.log("kaspad:".yellow.bold,data);

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
	             console.log('KASPAD monitor:'.bold,ex.toString().red.bold);
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