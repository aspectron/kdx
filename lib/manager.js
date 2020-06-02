//const crypto = require('crypto');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const utils = require("./utils");
const _ = require('underscore');
const EventEmitter = require("events");
const colors = require('colors');
const WebSocket = require('ws');
const Daemon = require('./daemon');
const { dpc } = require('@aspectron/flow-async');

class KaspaProcessManager extends EventEmitter{
	constructor(controller = null, dataFolder="", appFolder="") {
		super();
		this.appFolder = appFolder || path.join(__dirname, '..');
		this.dataFolder = dataFolder;
		this.tasks = [];
		this.ctors = { };
		this.flags = {};
		this.nameToTaskMap = { };
		this.controller = controller;
		this.args = utils.args();
		this.daemon_ctx_ = { };
		this.PLATFORM_BINARY_EXTENSION = process.platform == 'win32' ? '.exe' : '';
		this.apps = this.enumerateApps();
		this.strings = { };
		this.disableProcMon = false;

		fs.readdirSync(path.join(this.appFolder, 'lib', 'interfaces'))
			.map(iface => iface.replace(/\.js$/ig,''))
			.filter(iface=>!iface.match(/^\./))
			.forEach(iface => {
				if(iface == 'mysql')
					return
				this.ctors[iface] = require(path.join(this.appFolder, 'lib', 'interfaces', iface));
			});
	}

	redraw() {
		this?.controller?.redraw?.();
	}

	sleep(t) {
		return new Promise((resolve,reject)=>{
			setTimeout(resolve, t);
		})
	}

	getDC() { return this.daemon_ctx_; }

	async start(daemons={}) {

		this.strings = { };

		this.daemon_ctx_ = daemons;

		this.startProcMon();

/*		const daemonsConfig = {
			'kaspad:kd0' : {
				args:{
					rpclisten : '0.0.0.0:16210',
					listen : '0.0.0.0:16211',
					profile : 7000
				}
			},
			'kaspad:kd1' : {
				args:{
					rpclisten : '0.0.0.0:16310',
					listen : '0.0.0.0:16311',
					profile : 7001,
					connect: '0.0.0.0:16211'
				}
			},
			'simulator:sim0' : {
				peers:['127.0.0.1:16310']
			},
			'mysql:db0' : {
				port : 18787
			},
			'pgsql:pdb0' : {
				port : 19787
			},

			'mqtt:mq0' : {
				port : 1883
			},
			'kasparovsyncd:kvsd0' : {
				args:{
					rpcserver:'localhost:16310',
					dbaddress:'localhost:18787'
				}
			},
			'kasparovd:kvd0' : {
				args:{
					listen:'localhost:1234',
					rpcserver:'localhost:16310',
					dbaddress:'localhost:18787'
				}
			}
		};
*/
		const startupTypeOrder = ['kaspad','mqtt','mysql','pgsql','kasparovsyncd','kasparovd','kaspaminer','txgen','app'];
		const typeMap = { };

		Object.entries(daemons).forEach(([name, config]) => {
			if(config.disable)
				return; // ignore dsiabled

			let [type, id] = name.split(":");
			// if(type == 'app' && !config.args)
			// 	return; // ignore apps that don't have args[]
			if(!typeMap[type])
				typeMap[type] = [ ];

			let conf = { };
			Object.assign(conf, config);
			typeMap[type].push({conf, args:conf.args, name, type, key:name.replace(":", "-"), id});
		})

		const appsMap = { };
		(typeMap.app||[]).forEach(app => appsMap[app.id] = app);
		Object.values(this.apps).forEach((cfg) => {
			if(!cfg?.engines?.node)
				return null;

			let app = {
				type : 'app',
				key : `app-${cfg.name}`.toLowerCase(),
				name : `app:${cfg.name}`,
				id : cfg.name,
				conf : {
					args : cfg?.args || [],
					folder : path.join(this.appFolder, 'apps', cfg.folder),				
				}
			};

			if(appsMap[cfg.name] && appsMap[cfg.name].conf)
				Object.assign(app.conf, appsMap[cfg.name].conf);

			appsMap[cfg.name] = Object.assign({},cfg,app,appsMap[cfg.name]||{});
		})

		typeMap.app = [];
		Object.values(appsMap).forEach((app) => {
			if(!app.args)
				return;
			typeMap.app.push(app);
			console.log("Manager - registering application:",app);
		})

		console.log("Manager typeMap:",typeMap);

		const typeList = Object.keys(typeMap);
		typeList.sort((a,b)=>{
			let aT = startupTypeOrder.indexOf(a);
			let bT = startupTypeOrder.indexOf(b);
			if(aT == -1)
				aT = startupTypeOrder.length;
			if(bT == -1)
				bT = startupTypeOrder.length;
			return aT-bT;
		});
		// console.log(typeList);
		const stages = typeList.length;
		while(typeList.length) {
			let type = typeList.shift();
			console.log(`stage ${typeList.length}/${stages}: ${type}[${typeMap[type].length}]`);
			await Promise.all(typeMap[type].map(t=>this.startTask(t)));
			typeMap[type].map(t=>t.impl?.renderTaskInfo?.());
		}

	}

	async stop() {
		//const shutdownTypeOrder = ['kaspad','mqtt','mysql','pgsql','kasparovsyncd','kasparovd','simulator','txgen'];
		//const typeMap = { };
		let jobs = this.tasks.map((t)=>{
			if(t.impl) {
				t.impl.log('going down');
				return t.impl.stop();
			} 
			return null;
		}).filter(t=>t);

		this.tasks = [ ]
		this.daemon_ctx_ = { }

		jobs.push(this.stopProcMon());
		return Promise.all(jobs);
	}

	async shutdown() {
		return new Promise((resolve, reject) =>{
			console.log("MANAGER shutdown".bold);

			const tasks = this.tasks;
			this.tasks = [ ];

			let jobs = tasks.map((t)=>{
				if(t.impl) {
					t.impl.log('going down');
					let p = t.impl.stop();
					if(p) {
						return new Promise((resolve, reject) => {
							p.then(()=>{
								t.impl.destroySink();
								resolve();
							}).catch(reject);
						})
					}
					else
						t.impl.destroySink();
				} 
				return null;
			}).filter(t=>t);

			console.log(`MANAGER waiting for ${jobs.length} daemons...`);

			return Promise.all(jobs);
		});

	}
	startTask(task) {
		this.verbose && console.log("START".green.bold, this.getTaskInfoString(task));
		this.tasks.push(task);
		this.nameToTaskMap[task.name] = task;

		if(!task.args)
			task.args = [ ];

		if(!this.ctors[task.type]) {
			// console.log(`MANAGER`.red.bold,`node type '${task.type}' is not a constructor`.bold,'ctor[task.type]');
			this.verbose && console.log(`MANAGER unknown node type `.brightRed,(task.type||'').brightWhite);
			return Promise.resolve();
		}

		task.impl = task.proc = new this.ctors[task.type](this, task);
		task.impl.createSink();
		if(task.impl.start) {
			this.verbose && console.log("manager startTask() initiating task.impl.start()");
			return task.impl.start();
		}
		
		return Promise.resolve();
	}

	getTask(name) {
		return this.nameToTaskMap[name];
	}

	getBinaryFolder(){
		return path.join(this.appFolder, 'bin', utils.platform);
	}


	getDeployableBinary(...args) {
		let buildType = this.controller?.buildType || 'generic';
		switch(buildType) {
			case 'generic': {
				return path.join(this.getBinaryFolder(), ...args)+this.PLATFORM_BINARY_EXTENSION;
			}
			
			case 'local': {
				return path.join(os.homedir(),'.kdx','bin',utils.platform, ...args)+this.PLATFORM_BINARY_EXTENSION;
			}			
		}
	}

    resolveStrings(str) {

		Object.entries(this.strings).forEach(([k,v]) => {
			if(!v) {
				console.log('resolveStrings - invalid value:',k,v);
				return;
			}
			//console.log('resolving String',k,v)
			let regexp = new RegExp('\\$'+k,'ig');
			str = str.replace(regexp,v+'');
		});

        return str.replace(/\$HOME/ig,os.homedir())
                .replace(/\$APPS/ig,path.join(this.appFolder,'apps'))
                .replace(/\$NODE/ig,path.join(this.appFolder,'node'+this.PLATFORM_BINARY_EXTENSION))
                .replace(/\$MODULES/ig,path.join(this.appFolder,'modules'));        
    }

	enumerateApps() {
		const appsFolder = path.join(this.appFolder,'apps');
		if(!fs.existsSync(appsFolder))
			return [];

		let folders = fs.readdirSync(appsFolder);
		const packages = folders.map((folder) => {
			const pkgFile = path.join(appsFolder,folder,'package.json');
			if(!fs.existsSync(pkgFile))
				return null;
			try {
				return { folder, pkg : JSON.parse(fs.readFileSync(pkgFile,'utf-8')) };
			} catch(ex) {
				console.log('exception while processing file', pkgFile, ex);
			}
			return null;			
		}).filter(v=>v);

		return packages.map(({ folder, pkg }) => {
			let { name, description, main, engines, kdx } = pkg;
			return {
				folder, name, description, main, engines, ...kdx
			}
		});
	}

	registerString(owner, valueType, ident, value) {
		try {
			if(!owner.task || !owner.task.name) {
				console.log('error while processing registerString', valueType, ident, value);
				console.log("registerString no task:", owner.task);
			}
			const [type, id] = owner.task.name.split(':');
			let port = value;

			if(valueType == 'port')
				port = value;
			if(valueType == 'address') 
				port = parseInt(value.split(':').pop());

			if(!isNaN(port)) {
				if(ident && ident.toLowerCase() != type.toLowerCase()) {
					
					console.log("REGISTERING STRING:",`"${type}-${ident}-PORT"`,value,'owner:',owner);

					this.strings[`${type}-${ident}-PORT`.toUpperCase()] = port;
					this.strings[`${id}-${ident}-PORT`.toUpperCase()] = port;
				}
				else {	
					this.strings[`${type}-PORT`.toUpperCase()] = port;
					this.strings[`${id}-PORT`.toUpperCase()] = port;
				}
			} else {
				console.trace("unknown value type",valueType);
			}
		} catch(ex) {
			console.log(ex);
		}
	}

	startProcMon() {
		if(this.disableProcMon)
			return;
			
		if(this.procmon)
			return Promise.resolve();

		this.procmon = new Daemon(this, { ident : 'procmon:pm0', key : 'procmon-pm0', type : 'procmon', id : 'pm0',
			hidden : true
		});

		this.procmon.run({
			cwd : path.join(this.appFolder,'modules','procmon'),
			args : ['node','procmon.js']
		});

		this.connectProcMon(true);

		return Promise.resolve();
	}
	
	connectProcMon(init) {
		if(init) {
			this.stopProcMonWS = false;
		}

		this.procmonws = new WebSocket('ws://127.0.0.1:9119');
		this.procmonws.on('open', function open() {
//			ws.send('something');
		});


		this.procmonws.on('message', (json) => {
			let data = null;
			try {
				data = JSON.parse(json);
				// console.log("PROCMON:",data);
			} catch(ex) {
				console.log('unable to parse procmon json:', ex);
				return;
			}
			if(!data) {
				console.log('error - no data in procmon feed');
				return;
			}
			this.tasks.forEach((task) => {
				//console.log("trying to run procmondata on",task);
				task.impl.onProcMonData(data);
			})

		})

		this.procmonws.on('error', err => console.log(err));

		this.procmonws.on('close', () => {
			if(!this.stopProcMonWS) {
				dpc(1e3, () => {
					this.connectProcMon(false);
				})
			}
		})
	}

	disconnectProcMon() {
		if(this.procmonws) {
			this.stopProcMonWS = true;
			this.procmonws.close();
			delete this.procmonws;
		}
	}

	async stopProcMon() {
		if(this.disableProcMon)
			return;
		this.disconnectProcMon();
		if(!this.procmon)
			return Promise.resolve();
		await this.procmon.stop();
		delete this.procmon;
		return Promise.resolve();
	}

	setEnableMining(enableMining) {
		this.enableMining = enableMining;

		this.tasks.forEach((task) => {
			if(/mine/ig.test(task.type)) {
				if(this.enableMining) {
					task.impl.run();
				}
				else {
					task.impl.terminate();	
				}
			}
		})
	}
}

module.exports = KaspaProcessManager;
