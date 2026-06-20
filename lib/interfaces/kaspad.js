const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const { dpc, Semaphore } = require("@aspectron/flow-async");
const utils = require("@aspectron/flow-utils");
const Daemon = require('../daemon');
const pkg = require("../../package");
const natUpnp = require("@runonflux/nat-upnp");
const { loadKaspaSdk, buildKaspaResolver } = require('../kaspa-wasm-loader');

// Legacy default testnet suffix, used when the daemon config carries no
// explicit `netsuffix`. Kaspa's testnet ran suffix 10 before the move to
// suffix 12, so an unsuffixed config keeps resolving to testnet-10.
const DEFAULT_TESTNET_SUFFIX = 10;

module.exports = class Kaspad extends Daemon {
	constructor(manager, task) {
		super(manager, task, {exit_timeout:6e4});
		this.log(`Creating ${task.type}`.green.bold);
		this['monitor-storage-usage'] = true;
		this['monitor-storage-rate'] = false;
		this.data = [ ];

		this.upnpClient = new natUpnp.Client({timeout: 4000});
		this.upnpRetries = 2;
		this.upnpTtl = 7200; // 2 hours
		this.upnpRenewalSec = Math.floor(this.upnpTtl / 4);
		this.upnpRenewalInterval = null;
		this.upnpMaxInPeers = 16;
		this.ready = new Semaphore();
	}

	start() {
		this.log("kaspad::start() invoked...");
		return new Promise(async (resolve,reject) => {

			// Public Node (connect-only): ride a remote public node over the SDK
			// Resolver instead of spawning a local kaspad -- no process, no IBD.
			if(this.task.conf.connectOnly) {
				await this.startConnectOnly();
				this.beginMonitoring();
				return resolve();
			}

			if(this.task.conf['reset-peers'])
				this.cleanupResidualData();

			this.log("kaspad::start() running");

			let defaults = {
				appdir : this.folder
			};
			
			let args = Object.assign({}, defaults, this.task.args);

			this.syncFile = path.join(this.folder, 'sync.json');
			if(fs.existsSync(this.syncFile)) {
				try {
					let syncJSON = fs.readFileSync(this.syncFile,'utf-8');
					this.syncData = JSON.parse(syncJSON);
				} catch(ex) {
					console.log(ex);
				}
			}

			await new Promise(resolve => setTimeout(resolve, 500)); // Ensure "sink" has enough time to get ready to receive messages before proceeding

			if (!("uacomment" in args)) {
				const uacomment = `kdx_${pkg['version']}`
				this.writeToSink(`KASPAD: Adding uacomment=${uacomment} to arguments\n`);
				args['uacomment'] = uacomment;
			} else if (!args['uacomment']) {
				delete args['uacomment']; // Allow to disable uacomment
			}

			if (this.task.conf['upnpEnabled'] && args['listen'] && args['listen'].indexOf(":") !== -1) {
				this.writeToSink(`UPNP: `+`ENABLED`.green+`. Set `+`"upnpEnabled": false`.yellow+` in Settings -> Advanced -> Service Configuration to disable\n`);
				const nodePort = args['listen'].split(':')[1];
				let externalip = await this.getExternalIp();
				if (externalip) {
					if (!("externalip" in args)) {
						this.writeToSink(`KASPAD: Adding externalip=${externalip} to arguments\n`);
						args['externalip'] = externalip;
					}
					const publicPort = await this.forwardPort(nodePort, this.upnpRetries);
					if (publicPort) {
						let externalip = args['externalip'].split(':')[0];
						this.writeToSink(`KASPAD: Changing externalip from ${args['externalip']} to ${externalip}:${publicPort} in arguments\n`);
						args['externalip'] = `${externalip}:${publicPort}`;
						if (publicPort !== nodePort) {
							this.writeToSink(`KASPAD: Changing listener port from ${nodePort} to ${publicPort} in arguments\n`);
							args['listen'] = `${args['listen'].split(':')[0]}:${publicPort}`;
						}
						if (!("maxinpeers" in args)) {
							this.writeToSink(`KASPAD: Adding maxinpeers=${this.upnpMaxInPeers} to arguments\n`);
							args['maxinpeers'] = this.upnpMaxInPeers;
						}
					}
				}
			} else {
				this.writeToSink(`UPNP: `+`DISABLED`.yellow+`. Set `+`"upnpEnabled": true`.yellow+` in Settings -> Advanced -> Service Configuration to enable\n`);
			}

			const configFile = path.join(this.folder, 'kaspad.conf');
			let text = this.toConfig(args);
			fs.writeFileSync(configFile, text);

			this.manager.registerString(this,'address','P2P',args.listen);
			this.manager.registerString(this,'address','RPC',args.rpclisten);

			const argsList = Object.entries(args);
			const binaryName = this.task.conf.binary || 'kaspad';
			await this.VSARGS([this.getDeployableBinary(binaryName),'--version']);

			// Capture this instance's kaspad output into a per-network log file
			// (kaspad-<networkId>.log) so a kd<N> instance reused across networks
			// never accumulates more than one network's lines in a single log.
			const networkId = this.resolveNetworkId(args);
			this.logFile = path.join(this.logFolder, `${this.task.type}-${networkId}.log`);

			this.run({
				args : async () => {
					let _args_ = [
 						this.getDeployableBinary(binaryName)
					];

					if(!this.task.conf['skip-utxoindex']){
						_args_.push('--utxoindex')
					}

					let a = _args_.concat(argsList.map(([k, v]) => {
						if((v === undefined || v === null || v === true || v === ''))
							return `--${k}`;
						else
							return `--${k}=${v}`;
					}));
					console.log("kaspad:", a.join(" "))
					return a;
				},
				stdout : (data) => this.detectDatadirLock(data)
			})

			let kaspaSdk = null;
			let borshPort = null;
			try {
				kaspaSdk = await loadKaspaSdk();
				borshPort = kaspaSdk.RpcClient.defaultPort(kaspaSdk.Encoding.Borsh, networkId);
			} catch(ex) {
				this.log(`kaspad wRPC: unable to load SDK or resolve borsh port for network ${networkId}: ${ex}`);
			}
			if(!borshPort) {
				this.rpcInfo = { error : 'RPC is unable to connect'}
			}else{
				const url = `ws://127.0.0.1:${borshPort}`;
				this.rpc = new kaspaSdk.RpcClient({ url, encoding : kaspaSdk.Encoding.Borsh });
				this.rpc.connect({ blockAsyncConnect : false, strategy : 'retry' }).catch((err)=>{
					this.log(`kaspad wRPC connect error: ${err}`);
				});
			}

			this.beginMonitoring();
			resolve();
		})
	}

	// Poll the node over wRPC for chain stats and render them. Shared by the
	// local-node and connect-only (Public Node) paths -- both expose the same
	// this.rpc client, so the monitor renders identically over a local or a
	// resolved remote node.
	beginMonitoring() {
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

		// mutes all kaspad processes by default
		this.mute = true;
	}

	// Public Node (connect-only): build a resolver-based wRPC client to a remote
	// public node for the selected network instead of a loopback url client.
	// Chain stats (blue score, DAG sync, peers) arrive over RPC; local-resource
	// panels have no local process to read and stay N/A on this template.
	async startConnectOnly() {
		const networkId = this.resolveNetworkId(this.task.args || {});
		let kaspaSdk = null;
		try {
			kaspaSdk = await loadKaspaSdk();
		} catch(ex) {
			this.log(`kaspad wRPC: unable to load SDK for connect-only network ${networkId}: ${ex}`);
		}
		if(!kaspaSdk) {
			this.rpcInfo = { error : 'RPC is unable to connect' };
			return;
		}
		const resolver = buildKaspaResolver(kaspaSdk, this.task.conf.resolver);
		this.rpc = new kaspaSdk.RpcClient({ resolver, networkId, encoding : kaspaSdk.Encoding.Borsh });
		this.rpc.connect({ blockAsyncConnect : false, strategy : 'retry' }).catch((err)=>{
			this.log(`kaspad wRPC connect error: ${err}`);
		});
	}
	
	// kaspad panics and exits when another node already holds this appdir's
	// database lock (rocksdb flock -> "Resource temporarily unavailable"). The
	// daemon supervisor would otherwise relaunch every few seconds, turning a
	// single conflict into a panic loop. Detect the lock failure once, stop
	// relaunching, and surface a friendly already-running notice instead.
	detectDatadirLock(data) {
		if(!this.datadirLockHandled && /lock file:.*Resource temporarily unavailable/i.test(data.toString())) {
			this.datadirLockHandled = true;
			this.relaunch = false;
			this.writeToSink(`\r\n\r\n`+`This data directory is already in use by another running node.`.yellow.bold+` KDX will not start a second node on the same directory; stop the other instance or use a separate data directory.\r\n\r\n`);
			try {
				if(typeof FlowDialog != 'undefined')
					FlowDialog.show('Node already running', 'This data directory is already in use by another kaspad instance. Stop the other instance or use a separate data directory.');
			} catch(ex) {
				/* UI dialog realm not reachable from the process supervisor; the sink notice above is the surfaced signal */
			}
		}
		return data;
	}

	getExternalIp() {
		return this.upnpClient.getPublicIp().then((publicIp) => {
			this.writeToSink(`UPNP: Got public IP: ${publicIp}\n`);
			return publicIp;
		}).catch((err) => {
			this.writeToSink(`UPNP: Could not get public IP: ${err.message}\n`.red);
		});
	}

	forwardPort(port, retries) {
		return new Promise(resolve => setTimeout(resolve, 1000)).then(() => {
			return this.upnpClient.createMapping({
				public: port,
				private: port,
				description: 'KDX',
				ttl: this.upnpTtl
			}).then(() => {
				this.writeToSink(`UPNP: Public port ${port} successfully mapped to local port ${port}\n`.green);
				this.scheduleRenewal(port);
				return port;
			}).catch((err) => {
				if (retries) {
					const alternativePort = Math.floor(Math.random() * 45000) + 20000;
					this.writeToSink(`UPNP: Mapping of public port ${port} failed, trying alternative port ${alternativePort}.\n`.yellow);
					return this.forwardPort(alternativePort, --retries);
				} else {
					this.writeToSink(`UPNP: Mapping of public port ${port} failed: ${err.message}\n`.red);
				}
			});
		});
	}

	scheduleRenewal(port) {
		this.writeToSink(`UPNP: Scheduling for lease renewal in ${this.upnpRenewalSec} seconds\n`);
		clearInterval(this.upnpRenewalInterval);
		this.upnpRenewalInterval = setInterval(() => {
			this.writeToSink(`UPNP: Lease is set to expire, starting renewal\n`);
			this.forwardPort(port);
		}, this.upnpRenewalSec * 1000);
	}

	getTS(ts) {
		var d = new Date(ts);
		return d.toJSON().replace('T',' ');
	}

	getTimeDelta(ts) {
		if(!ts)
			return '--:--:--';
		let delta = Math.round(ts / 1000);
		let sec = (delta % 60);
		let min = Math.floor(delta / 60 % 60);
		let hrs = Math.floor(delta / 60 / 60 % 24);
		let days = Math.floor(delta / 60 / 60 / 24);

		sec = (sec<10?'0':'')+sec;
		min = (min<10?'0':'')+min;
		hrs = (hrs<10?'0':'')+hrs;

		if(days && days >= 1) {
			return `${days.toFixed(0)} day${days>1?'s':''} ${hrs}:${min}:${sec}`;
		} else {
			return `${hrs}:${min}:${sec}`;
		}

	}

	async renderModuleInfo({ html, i18n }) {
		let els = await super.renderModuleInfo({ html, i18n });

		if(!this.rpcInfo){
			return html`${els}
				<flow-data-badge has-colon style="--flow-primary-color:orange;" 
					title="${i18n.t("STATUS")}" align="right">${i18n.t("CONNECTING...")}</flow-data-badge>`;
		}
		let table = html`
			${
				this.data.map((o) => {
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
					} else if(/^(blocks|headers|sync|blue)/i.test(o.name)) {
						css += 'min-width:120px;'
					} else if(/(sync)/i.test(o.name)) {
						css += 'min-width:120px;'
					} else if(/^(difficulty|mempool|median latency)/i.test(o.name)) {
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
						return html`<flow-data-badge has-colon style="${css}" prefix="${prefix}" suffix="${suffix}" title="${i18n.t(name)}" align="${align}">${value}</flow-data-badge>`;
					else
						return html`<flow-data-badge-graph 
							has-colon style="${css}" prefix="${prefix}"
							suffix="${suffix}" title="${i18n.t(name)}"
							align="${align}"
							sampler="${sampler}">${value}</flow-data-badge-graph>`;

				}).filter(v=>v)
			}
		`;

		return html`${els}
				${table}
		`;

	}

	async stop() {
		this.prepareForShutdown();

		if (this.upnpRenewalInterval) {
			clearInterval(this.upnpRenewalInterval);
			delete this.upnpRenewalInterval;
		}

		let ableToPostShutdown = false;
		if(this.rpc) {
			try {
				await this.rpc.shutdown();
				ableToPostShutdown = true;
			} catch(ex) {
				/* node control RPC unavailable; fall back to process-manager signals */
			}
			try {
				await this.rpc.disconnect();
			} catch(ex) {
				/* monitor RPC disconnect best-effort */
			}
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

	resolveNetworkId(args) {
		const networkType = ['testnet','devnet','simnet'].filter(v=>args[v] !== undefined).shift() || 'mainnet';
		const testnetSuffix = args.netsuffix ?? DEFAULT_TESTNET_SUFFIX;
		return {
			mainnet : 'mainnet',
			testnet : `testnet-${testnetSuffix}`,
			devnet : 'devnet',
			simnet : 'simnet'
		}[networkType];
	}

	getStats() {
		return new Promise(async (resolve, reject) => {
			if(!this.rpc)
				return reject("RPC:TODO")
			const data = { }
	        try {
	            const bdi = await this.rpc.getBlockDagInfo();
	            const mpi = await this.rpc.getMempoolEntries({includeOrphanPool:false, filterTransactionPool:false});
	            const cpi = await this.rpc.getConnectedPeerInfo();
	            const sbs = await this.rpc.getSinkBlueScore();
				Object.assign(data, {blockdaginfo:bdi, mempoolentries:mpi, connectedpeerinfo:cpi, sinkbluescore:sbs});
				this.rpcInfo = data;
				const blueScore = Number(sbs.blueScore);
				const blockCount = parseInt(bdi.blockCount);
				const headerCount = parseInt(bdi.headerCount);
				let syncSample = 0;
				let syncValue = '';


				const medianOffset = (30+45)*1000; // allow 45 sec behind median
				const medianShift = Math.ceil(263*0.5*1000);

				const ts_ = new Date();
				const ts = ts_.getTime() - medianShift;//+(ts_.getTimezoneOffset()*60*1000);

				const pastMedianTime = parseInt(bdi.pastMedianTime);
				const pastMedianTimeDiff = Math.max(ts - pastMedianTime, 0);

				const peerCount = cpi.peerInfo.length;

				if(blockCount == 1) {
					syncValue = 'WAITING FOR HEADERS...';
				}

				if(!this.syncData && blockCount > 1) {
					this.syncData = {
						version : 1,
						medianTimeStart : {
							block : blockCount,
							timestamp : pastMedianTime
						}
					};
					// Persist the sync-progress anchor only for a local node (which
					// sets syncFile during start). A connect-only Public Node rides
					// an already-synced remote node -- there is no local IBD to track
					// and no kaspad data dir to write into, so keep syncData in memory
					// for the display and skip the on-disk write.
					if(this.syncFile)
						fs.writeFileSync(this.syncFile,JSON.stringify(this.syncData,null,'\t'));
				}

				let syncSampleT = 0;
				let syncValueT = '';
				if(this.syncData && blockCount > 1) {
					// let ts = Date.now();
					const total = (ts-medianOffset) - this.syncData.medianTimeStart.timestamp;
					const range = pastMedianTime - this.syncData.medianTimeStart.timestamp;
					let delta = range / total;
					if(delta >= 1.0) {
						delta = 1.0;
						syncSample = delta*100;
						syncValue = (syncSample).toFixed()+' %';
					} else {
						syncSample = delta*100;
						syncValue = (syncSample).toFixed(3)+' %';
					}
					
					//console.log('sync', {ts,syncSample,total,range,delta,pastMedianTime,start:this.syncData.medianTimeStart.timestamp});

					syncSampleT = ts-pastMedianTime;//-medianShift;
					if(syncSampleT <= 0) {
						syncSampleT = 0;
						syncValueT = '00:00:00';
					}
					else
						syncValueT = this.getTimeDelta(syncSampleT);
				}
				else {
					syncSample = 0;
					syncValue = 'WAITING...';
					syncSampleT = 0;
					syncValueT = 'N/A';
				}


				const sources =  {
					"Network Name" : { value : bdi.network },
					//"DAG Type" : { value : bdi.dag },
					//"Protocol" : { value : i.protocolVersion, prefix : 'v ' },
					"Peers" : { sample : peerCount, value : (peerCount).toCS(), graph : true },
					"Headers" : { sample : headerCount, value : (headerCount).toCS(), graph : true },
					"Blocks" : { sample : blockCount, value : (blockCount).toCS(), graph : true },
					"Blue Score" : { sample : blueScore, value : (blueScore).toCS(), graph : true },
					"DAG Sync" : { sample : syncSample, value : syncValue, graph : true },
					// "DAG Sync" : { sample : sync, value : (sync).toFixed(2)+' %', graph : true },
					//"Relay Fee" : { sample : i.relayFee },
					//"Errors" : i.errors,
					"Median Time UTC" : { time : this.getTS(pastMedianTime), sample : pastMedianTime, graph : true },
					"Median Latency" : { sample : syncSampleT, value : syncValueT, graph : true },
					//'line-break' : 'line-break',
					//"Pruned" : bdi.pruned?'Yes':'No',
					"Difficulty" : { sample : bdi.difficulty, graph : true },
					"Mempool Size" : { sample : mpi.mempoolEntries.length, value : (mpi.mempoolEntries.length).toCS(), graph : true, advanced : true },
					//"Mempool" : { sample : mpi.bytes, value : (mpi.bytes).toFileSize(), suffix : true, graph : true, advanced : true },
					// "Network Rx" : { sample : net.totalBytesRecv, value : (net.totalBytesRecv).toFileSize(), suffix : t=>`${t} / S`, css : 'min-width:160px', graph : true },
					// "Network Tx" : { sample : net.totalBytesSent, value : (net.totalBytesSent).toFileSize(), suffix : t=>`${t} / S`, css : 'min-width:160px', graph : true },
					//"Network Time" : { sample: net.timeMillis, time : this.getTS(net.timeMillis), graph : true }
				};

				if(this.task.id == 'kd0') {
					this.manager.emit(`sync-status`, {
						networkName:bdi.network, sync: syncSample,
						headerCount, blockCount, id : this.task.id, pastMedianTime,
						pastMedianTimeDiff,
						skipUTXOIndex: !!(this.task.conf?.["skip-utxoindex"])
					});
				}

				this.data = this.sourcesToData(sources);
	        } catch(ex) {
	             console.log('KASPAD monitor:'.bold,ex);
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
