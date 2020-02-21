const fs = require('fs');
const os = require('os');
const path = require('path');
const mkdirp = require('mkdirp');
const { utils } = require("micro-fabric");

module.exports = class Daemon {
	constructor(manager, task) {
		this.manager = manager;
		this.core = manager.core;
		this.globals = manager.globals;
		this.task = task;
		if(Daemon.seq === undefined)
			Daemon.seq = 0;
		this.seq = Daemon.seq++;

		this.colors = ['green','cyan','yellow','magenta','blue'];

		this.PLATFORM_BINARY_EXTENSION = process.platform == 'win32' ? '.exe' : '';

		this.log("init".bold, task);

		let seq = task.seq < 10 ? '0'+task.seq : task.seq;

		let datadir = this.core.config.datadir || path.join(os.homedir(),'khost');

		let simulationName = this.core.simulation.name;
		let schema = this.core.resolveFolderSchema(this.core.config.schema, {
			'SIMULATION-NAME' : simulationName,
			'TYPE-NAME' : task.type,
			'INSTANCE-NAME' : task.name,
			'HOSTNAME' : os.hostname(),
			'IP' : task.ip,
			'DAEMON-SEQUENCE' : task.seq,			
		});

		this.folder = path.join(datadir, schema);
		// `${task.type}-${seq}`
		
		if(!fs.existsSync(this.folder))
			mkdirp.sync(process.platform == 'win32' ? this.folder : this.folder.toLowerCase());
		mkdirp.sync(path.join(this.folder,'logs'));

		this.logFile = path.join(this.folder,'logs',`${task.type}.log`);
	}

	initProcess(options) {
		let defaults = {
			verbose : true,
			detached : false,
			relaunch : true
		};

		const procOpts = Object.assign(
			defaults, { 
				logger : new utils.Logger({ filename: this.logFile }),
				stdout : (data) => { 
					return this.digestStdout(data);
				}
		}, options);

		// console.log("DAEMON proc options".cyan.bold, this.task.name, procOpts.stdout.toString());

		this.proc = new utils.Process(procOpts);
		this.proc.buffer = '';
		this.proc.on('halt', () => { this.proc.options.logger && this.proc.options.logger.halt(); })
		this.proc.on('start', () => { this.tsStart = Date.now(); this.online = true; })
		this.proc.on('exit', () => { this.tsExit = Date.now(); this.online = false; })
		
		if(this.core.flags.mute)
			this.proc.mute = true;

		return this.proc.run();
	}

	digestStdout(data) {
		let t = data.toString();
		let trail = t[t.length-1] != '\n';
		// console.log(t[t.length-1].split(''))
		if(this.proc.buffer) {
			// console.log('buffer:',this.proc.buffer,'incoming:',t);
			t = this.proc.buffer+t;
			this.proc.buffer = null;
		}

		t = t.split('\n');
		if(trail)
			this.proc.buffer = t.pop();

		const c = this.colors[this.seq%this.colors.length];
		t = t.map(t=>t?`${this.task.name} | `[c].bold+t:t);


		return t.join('\n');

	}

	async start() { return Promise.resolve(); }

	async stop() {
		if(this.proc) {
			return this.proc.SIGINT(1e4, () => {
				return this.proc.SIGTERM()
			})	

		}
		else {
			return Promise.resolve();
		}
	}

	pathForStatsD() {
		const { task } = this;
		return `hosts.${os.hostname()}.nodes.${task.type}.${task.name}`
		//return `hosts.${this.core.supervisorHostname||'default'}.nodes.${task.type}.${task.name}`
	}

	gauge(...args) {
		if(!this.core.supervisorHostname) {
			console.log("no supervisor... skipping updates...",...args);
			return;
		}

		this.core.kstats.statsd.gauge(`${this.pathForStatsD()}`,...args);
	}

	async getStats(post) { return Promise.resolve({}); }
	async getStorage() { 

        try {
            let storageBytes = await utils.storageSize(this.folder, { });
            this.gauge('storage.bytes_used',storageBytes);
        } catch(ex) {
        	console.log("Error while getting folder size for".red.bold,this.folder.bold);
        	console.log(ex.toString().red.bold);
        }

		return Promise.resolve({}); 
	}

	getBTCDStyleConfig(args) {
		let props = []
		Object.entries(args).forEach((arg) => {
			let [k,v] = arg;
			if(Array.isArray(v))
				props.push(...v.map(v_ => [k,v_]));
			else
				props.push([k,v]);
		});
		props = props.map((t) => { let [k,v] = t; return `${k}=${v}`})
		props.unshift(`# generated on ${new Date} for ${this.task.type}[${this.task.name}]`)
		return props.join('\n');
	}

	getPeers() {
		return (this.task.peers || []).map(name => {
			let peer = this.manager.peersNameMap[name];
			if(!peer || !peer.ip) {
				this.log(`unable to resolve ip for peer (perhaps peer has no host?)`.red.bold, peer);
				return null;
			}
			peer = utils.clone(peer);
			if(peer.host == this.task.host && peer.ip == this.task.ip)
				peer.ip = '127.0.0.1';
			// let ip = peer.ip;
			return peer;
			// TODO - REVIEW
			// let port = env.KASPAD_P2P_BASE_PORT+peer.seq;
			// return `${ip}:${port}`;
		}).filter(t => t);		
	}

	getIPv4(ip) {
		return ip.replace(/^.*:/, '');
	}

	getBinary(...args) {
		return this.core.getBinary(...args);
	}

	async sleep(t) {
		return new Promise((resolve,reject) => {
			setTimeout(resolve, t);
		})

	}

	log(...args) {
		const c = this.colors[this.seq%this.colors.length];
		let ident = `${this.task.type.toUpperCase()}[${this.task.name}]`[c].bold;
		console.log(ident,...args);
	}
}