const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const { dpc, Semaphore } = require("@aspectron/flow-async");
const utils = require("@aspectron/flow-utils");
const Daemon = require('../daemon');
const {Client:KaspaGRPC} = require('kaspa-grpc');

module.exports = class Kaspad extends Daemon {
	constructor(manager, task) {
		super(manager, task, {exit_timeout:6e4});
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
				//debuglevel : 'info',
				// rpcuser : 'user',
				// rpcpass : 'pass',
				//rpccert : path.join(manager.dataFolder, 'rpc.cert'),
				//rpckey : path.join(manager.dataFolder, 'rpc.key'),
				//nobanning : 1,
				//nodnsseed : 1,
				//listen : '0.0.0.0:'+(this.globals.kaspad.ports.p2p+this.task.seq),
				//listen : '0.0.0.0:'+(env.KASPAD_P2P_BASE_PORT+this.task.seq),
				//rpclisten : '0.0.0.0:'+(this.globals.kaspad.ports.rpc+this.task.seq),
				datadir : this.folder,
				//addrindex : 1,
				// acceptanceindex : 1,
				//testnet:1
				//profile: (this.globals.kaspad.ports.profiler+this.task.seq)  // http://localhost:7000/debug/pprof/
			};


			//let args = {};
			
			// Object.entries(this.task.args || {}).map(([k, v]) => {
			// 	if(['devnet','testnet','mainnet','simnet'].includes(k) && (v === undefined || v === null || v === true))
			// 		v = 1;
			// 	if(args[k]) {
			// 		if(Array.isArray(args[k]))
			// 			args[k].push(v);
			// 		else
			// 			args[k] = [args[k], v];
			// 	}
			// 	else
			// 		args[k] = v;
			// });
			
			let args = Object.assign({}, defaults, this.task.args);

			let addresses = {
				'regnet' : 'kaspareg:qr35ennsep3hxfe7lnz5ee7j5jgmkjswsslwxj42ta',
				'devnet' : 'kaspatest:qputx94qseratdmjs0j395mq8u03er0x3u2xu3wvh9',
				'simnet' : 'kaspasim:qr35ennsep3hxfe7lnz5ee7j5jgmkjswsslwxj42ta',
				'kaspa' : 'kaspa:qr35ennsep3hxfe7lnz5ee7j5jgmkjswsslwxj42ta',
				'testnet': 'kaspatest:qpc3hr2kmnu6j0crw42cmryptzqmyqm9gstqp5r863'
			};

			// delete args.rpcuser;
			// delete args.rpcpass;

			// if(!args.miningaddr) {
			// 	Object.entries(addresses).forEach(([k,v]) => {
			// 		if(args[k] === 1)
			// 			args.miningaddr = v;
			// 	})
			// }

			/*
				Private key (hex):      32396163626339626538656238333830623863343733333434376538396562653064333233646466353366316261653834383834326664343731646539373039

				These are your public addresses for each network, where money is to be sent.
				Address (mainnet):      kaspa:qqg767gkznmsuah5xeer9f72lwqu642nqvlmujtpmk
				Address (testnet):      kaspatest:qqg767gkznmsuah5xeer9f72lwqu642nqv060jg645
				Address (devnet):       kaspadev:qqg767gkznmsuah5xeer9f72lwqu642nqv5hskdzke
			*/

			// 			if(!args.miningaddr) {
			// 				args.miningaddr = 'kaspatest:qpc3hr2kmnu6j0crw42cmryptzqmyqm9gstqp5r863';
			// //				args.miningaddr = 'kaspa:qqg767gkznmsuah5xeer9f72lwqu642nqvlmujtpmk';
			// 				//args.miningaddr = 'kaspa:qr35ennsep3hxfe7lnz5ee7j5jgmkjswsslwxj42ta';
			// 			}

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

			const argsList = Object.entries(args);			




			await this.VSARGS([this.getDeployableBinary('kaspad'),'--version']);

			this.run({
				args : () => {
					// console.log((this.task.name||'?').yellow.bold,`'${this.folder}'`.cyan.bold,this.task);
// 					return [
// 						this.getDeployableBinary('kaspad'),
// 						//`--datadir=`,
// 						`--utxoindex`,
// //						`--configfile=${configFile}`,
// 					].concat(args);


					let _args_ = [
 						this.getDeployableBinary('kaspad'),
 						`--utxoindex`,
						// `--block-delay=${blockDelay}`,
						// `--addresslist=${configFile}`,
						// `--cert=${rpcCertFile}`
					];
	
					// if(/linux/.test(utils.platform) && flags.nice) {
					// 	_args_ = ['/bin/nice','-10',..._args_];
					// }

					let a = _args_.concat(argsList.map(([k, v]) => {

						if((v === undefined || v === null || v === true || v === ''))
							return `--${k}`;
						else
//						if(k == 'datadir')
							return [`--${k}`,`${v}`];
						// else {
						// 	// if(/0\.0\.0\.0/.test(v))
						// 	// 	v = v.replace('0.0.0.0','127.0.0.1');
						// 	return `--${k}=${v}`;
						// }

					})).flat();
	console.log('kaspad args:',a);
					return a;

				}
			})



			let [addr,port] = args.rpclisten.split(':');
			port = parseInt(port);
			if(!port || isNaN(port)) {
				this.rpcInfo = { error : 'RPC is unable to connect'}
			}else{
				let iface = '127.0.0.1';
				if(addr && !['0.0.0.0','127.0.0.1','localhost'].includes(addr))
					iface = addr;
				this.rpc = new KaspaGRPC({
					host:`${iface}:${port}`,
					uid: ': daemon'
				});
				this.rpc.connect();
			}

			this.createPoller(1250, ()=>{
				return new Promise((resolve) => {
					this.getStats().then(()=>{
						try {
							this.renderTaskInfo();
						} catch(ex) {
							console.log('error in renderTaskInfo[0]');
							console.log(ex);
						}
						resolve();
					}).catch((err)=>{
						this.log(`error polling websocket json rpc (is 'rpclisten' properly configured?) `)
						this.log(err);
						try {
							this.renderTaskInfo();
						} catch(ex) {
							console.log('error in renderTaskInfo[1]');
							console.log(ex);
						}
						resolve();

						// TODO - UPDATE UI (HOME PAGE to reflect)
					})
				})
			});


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

		if(!this.rpcInfo){
			return html`${els}
				<flow-data-badge has-colon style="--flow-primary-color:orange;" 
					title="STATUS" align="right">CONNECTING...</flow-data-badge>`;
		}
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
					} else if(/^(peers)/i.test(o.name)) {
						css += 'min-width:80px;'
					} else if(/^(blocks|headers|sync)/i.test(o.name)) {
						css += 'min-width:120px;'
					} else if(/(sync)/i.test(o.name)) {
						css += 'min-width:120px;'
					} else if(/^(difficulty|mempool)/i.test(o.name)) {
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

	async stop() {
		this.prepareForShutdown();

		let ableToPostShutdown = false;
		if(this.rpc) {
			this.rpc.reconnect = false;

			try {
				if(!process.env.KASPA_JSON_RPC)				
					await this.rpc.call('shutDown');
				else
					await this.rpc.call('stop',[]);
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

	getStats() {
		return new Promise(async (resolve, reject) => {
			if(!this.rpc)
				return reject("RPC:TODO")
			const data = { }
	        try {
	            for(let method of ['getBlockDagInfo','getMempoolEntries','getConnectedPeerInfo'])
					data[method.replace(/^get/,'').toLowerCase()] = await this.rpc.call(method+'Request');
console.log("KASPAD DATA:",data);
				this.rpcInfo = data;
				const {blockdaginfo:bdi,mempoolentries:mpi,nettotals:net,connectedpeerinfo:cpi} = data;
				const blockCount = parseInt(bdi.blockCount);
				const headerCount = parseInt(bdi.headerCount);
				const sync = (blockCount/headerCount)*100;
				const pastMedianTime = parseInt(bdi.pastMedianTime);
				const peerCount = cpi.infos.length;
				// const peerCount = cpi.infos.length;
				const sources =  {
					"Network Name" : { value : bdi.networkName },
					//"DAG Type" : { value : bdi.dag },
					//"Protocol" : { value : i.protocolVersion, prefix : 'v ' },
					"Peers" : { sample : peerCount, value : (peerCount).toCS(), graph : true },
					"Blocks" : { sample : blockCount, value : (blockCount).toCS(), graph : true },
					"Headers" : { sample : headerCount, value : (headerCount).toCS(), graph : true },
					"DAG Sync" : { sample : sync, value : (sync).toFixed(2)+' %', graph : true },
					"Difficulty" : { sample : bdi.difficulty, graph : true },
					//"Relay Fee" : { sample : i.relayFee },
					//"Errors" : i.errors,
					"Median Time" : { time : this.getTS(pastMedianTime), sample : pastMedianTime, graph : true },
					//'line-break' : 'line-break',
					//"Pruned" : bdi.pruned?'Yes':'No',
					"Mempool Size" : { sample : mpi.entries.length, value : (mpi.entries.length).toCS(), graph : true, advanced : true },
					//"Mempool" : { sample : mpi.bytes, value : (mpi.bytes).toFileSize(), suffix : true, graph : true, advanced : true },
					// "Network Rx" : { sample : net.totalBytesRecv, value : (net.totalBytesRecv).toFileSize(), suffix : t=>`${t} / S`, css : 'min-width:160px', graph : true },
					// "Network Tx" : { sample : net.totalBytesSent, value : (net.totalBytesSent).toFileSize(), suffix : t=>`${t} / S`, css : 'min-width:160px', graph : true },
					//"Network Time" : { sample: net.timeMillis, time : this.getTS(net.timeMillis), graph : true }
				};

				this.data = this.sourcesToData(sources);
	        } catch(ex) {
	             console.log('KASPAD monitor:'.bold,ex.toString().red.bold);
	            return reject(ex);
	        }

	        return resolve(data);
		})

	}

	sourcesToData(sources) {
		return Object.entries(sources).map(([name,entry]) => {
			if(typeof entry != 'object')
				entry = { value : entry };
			entry.name = name;
			entry.value = entry.value || entry.sample;
			if(entry.sample !== undefined) {
				let property = name.toLowerCase().replace(/\s/g,'-');
				entry.sampler = `${this.task.key}-${property}`;
				if(typeof flow != 'undefined')
					flow.samplers.get(entry.sampler).put(entry.sample);
			}
			return entry;
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