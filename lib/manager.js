//const crypto = require('crypto');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const utils = require("./utils");
const _ = require('underscore');

class KaspaProcessManager {
	constructor(core, appFolder) {
		this.core = core;
		this.dataFolder = core.dataFolder;
		this.tasks = [];
		this.ctors = { };
		this.nameToTaskMap = { };

		fs.readdirSync(path.join(__dirname, 'interfaces'))
			.map(iface => iface.replace(/\.js$/ig,''))
			.filter(iface=>!iface.match(/^\./))
			.forEach(iface => {
				this.ctors[iface] = require(`./interfaces/${iface}`);
			});
	}

	// getHash(o, h = 'sha1') {
	// 	return crypto.createHash(h).update(JSON.stringify(o)).digest('hex');
	// }

	// getGlobal(path_, default_ = null) {
	// 	if(!this.global)
	// 		return default_;
	// 	let v = this.global;
	// 	let list = path_.split('.');
	// 	while(list.length) {
	// 		let k = list.shift();
	// 		v = v[k];
	// 		if(v === undefined)
	// 			return default_;
	// 	}
	// 	if(typeof(v) == 'object')
	// 		return default_;
	// 	return v;
	// }

	// resolveNameToTask(name) {
	// 	return this.nameToTaskMap[name];
	// }

	// absorbGlobals(data) {
	// 	let defaults = JSON.parse(JSON.stringify(this.core.globals));
	// 	return utils.merge(defaults, data || { });
	// }

	sleep(t) {
		return new Promise((resolve,reject)=>{
			setTimeout(resolve, t);
		})
	}


	async start(daemons={}) {
		const daemonsConfig = {
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

console.log('daemons:',daemons);

		const startupTypeOrder = ['kaspad','mqtt','mysql','pgsql','kasparovsyncd','kasparovd','simulator','txgen'];
		const typeMap = { };

		Object.entries(daemons).forEach(([name, config]) => {
			//let [type,ident] = name.split(':');
			let conf = { };
			// if(daemonsConfig[name])
			// 	Object.assign(conf, daemonsConfig[name]);
			Object.assign(conf, config);

			let [type, id] = name.split(":");
			if(!typeMap[type])
				typeMap[type] = [ ];
			typeMap[type].push({conf, args:conf.args, name, type, key:name.replace(":", "-"), id});
		})
/*
		_.forEach(daemonsConfig, (defaultConf, name) => {
			console.log('A', name+':', defaultConf);
			if(name.indexOf("__") == 0 || !daemons[name])
				return
			console.log('B');
			let conf = {};
			utils.merge(conf, defaultConf)
			console.log('C');
			if(_.isObject(daemons[name]))
				utils.merge(conf, daemons[name]);
			console.log('D name:',name,'conf:',conf);

			let [type, id] = name.split(":");
			if(!typeMap[type])
				typeMap[type] = [ ];
			typeMap[type].push({conf, args:conf.args, name, type, key:name.replace(":", "-"), id});
		});
*/		
		console.log(typeMap)
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


// 	async setTasks(args, simulation) {

// 		const { tasks, peers, hosts, globals } = args;

// 		this.peers = peers;
// 		this.globals = this.absorbGlobals(globals);

// 		// this.statsd.updateSettings({
// 		// 	namespace : this.globals.topology.namespace,
// 		// 	address : this.globals.statsd.address,
// 		// 	intervals : this.globals.statsd.intervals
// 		// })

// 		this.peersNameMap = { };
// 		this.peers.forEach(p => this.peersNameMap[p.name] = p);

// 		let pendingMap = { }
// 		tasks.forEach(t => pendingMap[t.hash] = t);
// 		let existingMap = { }
// 		this.tasks.forEach(t => existingMap[t.hash] = t);

// 		let pendingList = tasks.map(t => t.hash);
// 		let existingList = this.tasks.map(t => t.hash);

// 		let include = pendingList.filter(h => !existingList.includes(h));
// 		let remove = existingList.filter(h => !pendingList.includes(h));

// 		let jobs = remove.map(h => this.stopTask(existingMap[h])).filter(t=>t && typeof t.then == 'function');
// 		if(jobs.length) {
// 			console.log(`awaiting shutdown of ${jobs.length} daemons...`.bold);
// 			await Promise.all(jobs);
// 			console.log('giving OS time to flush buffer... 1 sec...'.bold);
// 			await this.sleep(1000);
// 		}
// //		include.forEach(h => this.startTask(pendingMap[h]));
// 		if(include.length) {
// 			console.log(`waiting for ${include.length} jobs to start.`)
// 			//jobs = include.map(h => this.startTask(pendingMap[h]));
// 			jobs = include.map(h => pendingMap[h]);
// 			const startupTypeOrder = ['kaspad','mqtt','mysql','pgsql','kasparovsyncd','kasparov','kasparovd','simulator','txgen'];
// 			const typeMap = { };
// 			jobs.forEach((task) => {
// 				if(!typeMap[task.type])
// 					typeMap[task.type] = [ ];
// 				typeMap[task.type].push(task);
// 			});
// 			const typeList = Object.keys(typeMap);
// 			typeList.sort((a,b)=>{
// 				let aT = startupTypeOrder.indexOf(a);
// 				let bT = startupTypeOrder.indexOf(b);
// 				if(aT == -1)
// 					aT = startupTypeOrder.length;
// 				if(bT == -1)
// 					bT = startupTypeOrder.length;
// 				return aT-bT;
// 			});
// 			const stages = typeList.length;
// 			while(typeList.length) {
// 				let type = typeList.shift();
// 				console.log(`stage ${typeList.length}/${stages}: ${type}[${typeMap[type].length}]`);
// 				await Promise.all(typeMap[type].map(t=>this.startTask(t)));
// 			}
// //			console.log('sorted:'.brightCyan, jobs.map(j=>`${j.type}-${j.name}`).join(', '));
// //			await Promise.all(jobs.map(t=>this.startTask(t)));
// 			console.log('all jobs started... setTasks() finished.')
// 		}
// 		else {
// 			console.log('no new jobs to start... setTasks() finished.')
// 		}
// 	}

// 	getTask(name) {
// 		// console.log(name,"for",this.nameToTaskMap);
// 		return this.nameToTaskMap[name];
// 	}

// 	startTask(task) {
// 		this.verbose && console.log("START".green.bold,this.getTaskInfoString(task));
// 		this.tasks.push(task);
// 		this.nameToTaskMap[task.name] = task;

// 		if(!task.args)
// 			task.args = [ ];

// 		if(!this.ctors[task.type]) {
// 			// console.log(`MANAGER`.red.bold,`node type '${task.type}' is not a constructor`.bold,'ctor[task.type]');
// 			this.verbose && console.log(`MANAGER unknown node type `.brightRed,(task.type||'').brightWhite);
// 			return Promise.resolve();
// 		}

// 		task.impl = task.proc = new this.ctors[task.type](this, task);
// 		if(task.impl.start) {
// 			this.verbose && console.log("manager startTask() initiating task.impl.start()");
// 			return task.impl.start();
// 		}
		
// 		return Promise.resolve();
// 	}

// 	stopTask(task) {
// 		// console.log("STOP".red.bold,this.getTaskInfoString(task));
// 		let index = this.tasks.map(t => t.hash).indexOf(task.hash);
// 		this.tasks.splice(index,1);
// 		delete this.nameToTaskMap[task.name];
// 		if(task.proc)
// 			return task.proc.stop();
// 		return null;
// 	}

// 	getTaskInfoString(task) {
// 		const { type, name, seq, peers, args, ip, } = task;
// 		return `${type} ${name}:${seq} ${(peers||[]).join(' ')}`;
// 	}

}

module.exports = KaspaProcessManager;
