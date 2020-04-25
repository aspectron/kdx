const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const mkdirp = require('mkdirp');
const { utils } = require("micro-fabric");
const EventEmitter = require("events");
const _ = require("underscore");
const UITab = require("./ui-tab.js");

module.exports = class Daemon  extends UITab {

	constructor(manager, task) {
		super(manager, task);
		this.manager = manager;
		this.task = task;
		this.core = manager.core;
		this.PLATFORM_BINARY_EXTENSION = process.platform == 'win32' ? '.exe' : '';
		this.folder = path.join(manager.dataFolder, task.key);
		fs.ensureDirSync(this.folder);

		this.options = Object.assign({
			relaunch : true,
			delay : 3000,
			tolerance : 5000,
			restarts : 0
		});

		this.relaunch = this.options.relaunch;
		this.delay = this.options.delay;
		this.restarts = 0;//this.options.restarts;
		this.tolerance = this.options.tolerance;
		this.ts = Date.now();
		this.kick = false;

		this.SIGTERM = this.createInterrupt('SIGTERM');
		this.SIGINT = this.createInterrupt('SIGINT');
		this.WAIT_FOR_EXIT = this.createInterrupt(null);
		process.on("SIGINT", ()=>{
			this.stop && this.stop();

			setTimeout(()=>{
				this.terminate();
				process.exit();
			}, 2000);
		})
	}
	
	terminate(interrupt = 'SIGTERM') {
		if(this.restart_dpc) {
			clearTimeout(this.restart_dpc);
			delete this.restart_dpc;
		}

		const proc = this.process;
		delete this.process;
		this.relaunch = false;
		if(!proc)
			return Promise.resolve();

		return new Promise((resolve,reject) => {
			this.once('exit', (code) => {
				resolve(code);
			})
			proc.kill(interrupt);
			this.emit('halt');
			// return Promise.resolve();
		});
	}

	restart(interrupt = 'SIGTERM') {
		if(this.process) {
			this.kick = true;
			this.process.kill(interrupt);
		}

		return Promise.resolve();
	}

	createInterrupt(interrupt) {
		return (t = 1e4, fallback = undefined) => {
			return new Promise((resolve, reject) => {

				if(this.restart_dpc) {
					clearTimeout(this.restart_dpc);
					delete this.restart_dpc;
				}

				if(!this.process)
					return reject('not running');

				const ts = Date.now();
				let success = false;
				const exitHandler = (code) => {
					success = true;
					return resolve(code);
				}
				this.once('exit', exitHandler);
				this.relaunch = false;
				// console.log('...'+interrupt);
				if(interrupt)
					this.process.kill(interrupt);

				const monitor = () => {
					if(success)
						return;
					let d = Date.now() - ts;
					if(d > t) {
						this.off('exit', exitHandler);
						if(fallback) {
							return fallback().then(resolve,reject);
						}
						else {
							return reject(`${interrupt || 'WAIT_FOR_EXIT'} timeout`);
						}
					}
					dpc(30, monitor);
				}
				dpc(5, monitor);
			})
		}
	}

	run() {
		return new Promise((resolve, reject) => {
			delete this.restart_dpc;

			let fn_ = (typeof(this.options.args) == 'function');
			let args = fn_ ? this.options.args().slice() : this.options.args.slice();

			this.options.verbose && console.log("running:", args);

			if(this.process) {
				// throw new Error("Process is already running!");
				console.error("Process is already running",this);
				return reject('process is already running');
			}

			let proc = args.shift();
			this.name = this.options.name || proc;
			let cwd = this.options.cwd || process.cwd();
			let windowsHide = this.options.windowsHide;
			let detached = this.options.detached;
			let env = (this.options.env && Object.keys(this.options.env).length) ? this.options.env : undefined;

			//let filter = options.filter || function(data) { return data; };

			let filter_ = (data) => { return data; }
			let stdout = (typeof(this.options.stdout) == 'function') ? this.options.stdout : filter_;
			let stderr = (typeof(this.options.stderr) == 'function') ? this.options.stderr : filter_;

			// console.log(proc, args, { cwd, windowsHide });
			this.emit('start');
			this.process = spawn(proc, args, { cwd, windowsHide, detached, env });

			let prefix = this.getName()+'|';
			this.process.stdout.on('data',(data) => {
				//console.log(data.toString('utf8'));
				let text = stdout(data);
				if(!this.mute && text) {
					process.stdout.write(text.split('\n').map(v=>`${prefix} ${v}`).join('\n'));
				}
				if(this.options.logger)
					this.options.logger.write(data);
			});

			this.process.stderr.on('data',(data) => {
				//console.error(data.toString('utf8'));
				let text = stdout(data);
				if(!this.mute && text) {
					process.stderr.write(text);
				}
				if(this.options.logger)
					this.options.logger.write(data);
			});

			this.process.on('exit', (code) => {
				this.emit('exit',code);
				let { name } = this;
				if(code && !this.options.no_warnings)
					console.log(`WARNING - child ${name} exited with code ${code}`);
				delete this.process;
				let ts = Date.now();
				if(this.options.restarts && this.ts && (ts - this.ts) < this.tolerance) {
					this.restarts++;
				}
				if(this.options.restarts && this.restarts == this.options.restarts) {
					this.relaunch = false;
					console.log(`Too many restarts ${this.restarts}/${this.options.restarts} ...giving up`);
				}
				this.ts = ts;
				if(this.relaunch) {
					if(this.options.restarts && !this.kick)
						console.log(`Restarting process '${name}': ${this.restarts}/${this.options.restarts} `);
					else
						console.log(`Restarting process '${name}'`);
					this.restart_dpc = dpc(this.kick ? 0 : this.delay, () => {
						this.kick = false;
						if(this.relaunch)
							this.run();
					});
				}
				else {
						this.emit('halt')
				}
			});

			resolve();
		})            
	}




	// constructor(manager, task) {
	// 	this.manager = manager;
	// 	this.core = manager.core;
	// 	this.globals = manager.globals;
	// 	this.task = task;
	// 	if(Daemon.seq === undefined)
	// 		Daemon.seq = 0;
	// 	this.seq = Daemon.seq++;

	// 	this.colors = ['green','cyan','yellow','magenta','blue'];

	// 	this.PLATFORM_BINARY_EXTENSION = process.platform == 'win32' ? '.exe' : '';

	// 	this.log("init".bold, task);

	// 	let seq = task.seq < 10 ? '0'+task.seq : task.seq;

	// 	let datadir = this.core.config.datadir || path.join(os.homedir(),'khost');

	// 	let simulationName = this.core.simulation.name;
	// 	let schema = this.core.resolveFolderSchema(this.core.config.schema, {
	// 		'SIMULATION-NAME' : simulationName,
	// 		'TYPE-NAME' : task.type,
	// 		'INSTANCE-NAME' : task.name,
	// 		'HOSTNAME' : os.hostname(),
	// 		'IP' : task.ip,
	// 		'DAEMON-SEQUENCE' : task.seq,			
	// 	});

	// 	this.folder = path.join(datadir, schema);
	// 	// `${task.type}-${seq}`
		
	// 	if(!fs.existsSync(this.folder))
	// 		mkdirp.sync(process.platform == 'win32' ? this.folder : this.folder.toLowerCase());
	// 	mkdirp.sync(path.join(this.folder,'logs'));

	// 	this.logFile = path.join(this.folder,'logs',`${task.type}.log`);
	// }

	// initProcess(options) {
	// 	let defaults = {
	// 		verbose : true,
	// 		detached : false,
	// 		relaunch : true
	// 	};

	// 	const procOpts = Object.assign(
	// 		defaults, { 
	// 			logger : new utils.Logger({ filename: this.logFile }),
	// 			stdout : (data) => { 
	// 				return this.digestStdout(data);
	// 			}
	// 	}, options);

	// 	// console.log("DAEMON proc options".cyan.bold, this.task.name, procOpts.stdout.toString());

	// 	this.proc = new utils.Process(procOpts);
	// 	this.proc.buffer = '';
	// 	this.proc.on('halt', () => { this.proc.options.logger && this.proc.options.logger.halt(); })
	// 	this.proc.on('start', () => { this.tsStart = Date.now(); this.online = true; })
	// 	this.proc.on('exit', () => { this.tsExit = Date.now(); this.online = false; })
		
	// 	if(this.core.flags.mute)
	// 		this.proc.mute = true;

	// 	return this.proc.run();
	// }

	// digestStdout(data) {
	// 	let t = data.toString();
	// 	let trail = t[t.length-1] != '\n';
	// 	// console.log(t[t.length-1].split(''))
	// 	if(this.proc.buffer) {
	// 		// console.log('buffer:',this.proc.buffer,'incoming:',t);
	// 		t = this.proc.buffer+t;
	// 		this.proc.buffer = null;
	// 	}

	// 	t = t.split('\n');
	// 	if(trail)
	// 		this.proc.buffer = t.pop();

	// 	const c = this.colors[this.seq%this.colors.length];
	// 	t = t.map(t=>t?`${this.task.name} | `[c].bold+t:t);


	// 	return t.join('\n');

	// }

	// async start() { return Promise.resolve(); }

	// async stop() {
	// 	if(this.proc) {
	// 		return this.proc.SIGINT(1e4, () => {
	// 			return this.proc.SIGTERM()
	// 		})	

	// 	}
	// 	else {
	// 		return Promise.resolve();
	// 	}
	// }

	// pathForStatsD() {
	// 	const { task } = this;
	// 	return `hosts.${os.hostname()}.nodes.${task.type}.${task.name}`
	// 	//return `hosts.${this.core.supervisorHostname||'default'}.nodes.${task.type}.${task.name}`
	// }

	// gauge(...args) {
	// 	if(!this.core.supervisorHostname) {
	// 		console.log("no supervisor... skipping updates...",...args);
	// 		return;
	// 	}

	// 	this.core.kstats.statsd.gauge(`${this.pathForStatsD()}`,...args);
	// }

	// async getStats(post) { return Promise.resolve({}); }
	// async getStorage() { 

    //     try {
    //         let storageBytes = await utils.storageSize(this.folder, { });
    //         this.gauge('storage.bytes_used',storageBytes);
    //     } catch(ex) {
    //     	console.log("Error while getting folder size for".red.bold,this.folder.bold);
    //     	console.log(ex.toString().red.bold);
    //     }

	// 	return Promise.resolve({}); 
	// }

	// getBTCDStyleConfig(args) {
	// 	let props = []
	// 	Object.entries(args).forEach((arg) => {
	// 		let [k,v] = arg;
	// 		if(Array.isArray(v))
	// 			props.push(...v.map(v_ => [k,v_]));
	// 		else
	// 			props.push([k,v]);
	// 	});
	// 	props = props.map((t) => { let [k,v] = t; return `${k}=${v}`})
	// 	props.unshift(`# generated on ${new Date} for ${this.task.type}[${this.task.name}]`)
	// 	return props.join('\n');
	// }

	// getPeers() {
	// 	return (this.task.peers || []).map(name => {
	// 		let peer = this.manager.peersNameMap[name];
	// 		if(!peer || !peer.ip) {
	// 			this.log(`unable to resolve ip for peer (perhaps peer has no host?)`.red.bold, peer);
	// 			return null;
	// 		}
	// 		peer = utils.clone(peer);
	// 		if(peer.host == this.task.host && peer.ip == this.task.ip)
	// 			peer.ip = '127.0.0.1';
	// 		// let ip = peer.ip;
	// 		return peer;
	// 		// TODO - REVIEW
	// 		// let port = env.KASPAD_P2P_BASE_PORT+peer.seq;
	// 		// return `${ip}:${port}`;
	// 	}).filter(t => t);		
	// }

	// getIPv4(ip) {
	// 	return ip.replace(/^.*:/, '');
	// }

	// getBinary(...args) {
	// 	return this.core.getBinary(...args);
	// }

	// async sleep(t) {
	// 	return new Promise((resolve,reject) => {
	// 		setTimeout(resolve, t);
	// 	})

	// }
	toConfig(args){
		const conf = [];
		_.forEach(args, (v, k)=>{
			conf.push(`${k}=${v}`);
		})
		return conf.join(os.EOL);
	}
	getBinary(...args){
		return path.join(this.core.getBinaryFolder(), ...args)+this.PLATFORM_BINARY_EXTENSION;
	}

	initProcess(conf){
		this.proc = new utils.Process(conf);
		super.initProcess();
		return this.proc;
	}
	destroy(){
		this.stop();
	}
	async stop() {
		return new Promise(async (resolve,reject) => {
			if(this.proc)
				this.proc.relaunch = false;

			let ableToPostShutdown = false;
			if(this.rpc) {
				this.rpc.reconnect = false;

				try {
					let ret = await this.rpc.call('stop',[]);
					ableToPostShutdownRPC = true;
					//console.log('KASPAD RPC STOP ret:',ret);
				} catch(ex) { /*console.log(`MANAGER SHUTDOWN: ${ex.toString()}`.red.bold,'\n',ex.stack)*/ }
			}

			// try {
			// 	if(this.observer) {
			// 		this.observer.stop();
			// 		this.core.kstats.destroyObserver(this.observer);
			// 		delete this.observer;
			// 	}

			if(this.rpc){
				this.rpc.close();
				delete this.rpc;
			}
			// } catch(ex) { /*console.log(`MANAGER SHUTDOWN: ${ex.toString()}`.red.bold,'\n',ex.stack)*/ }

			let waits = [ ]
			if(ableToPostShutdown)
				waits.push('WAIT_FOR_EXIT');
			waits.push('SIGINT');
			waits.push('SIGTERM');
			while(waits.length) {
				let wait = waits.shift();
				this.log(('  ...'+wait+'^').yellow.bold);
				try {
					await this.proc[wait](1e4);
					return resolve();
				} catch(ex) {
					console.log(ex.toString());
					if(ex.stack)
						console.log(ex.stack);
				}
			}

			reject();
		});
	}
}