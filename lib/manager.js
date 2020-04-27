//const crypto = require('crypto');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const utils = require("./utils");
const _ = require('underscore');
const EventEmitter = require("events");

class KaspaProcessManager extends EventEmitter{
	constructor(dataFolder="", appFolder="") {
		super();
		this.appFolder = appFolder || path.join(__dirname, '..');
		this.dataFolder = dataFolder;
		this.tasks = [];
		this.ctors = { };
		this.flags = {};
		this.nameToTaskMap = { };

		fs.readdirSync(path.join(this.appFolder, 'lib', 'interfaces'))
			.map(iface => iface.replace(/\.js$/ig,''))
			.filter(iface=>!iface.match(/^\./))
			.forEach(iface => {
				if(iface == 'mysql')
					return
				this.ctors[iface] = require(path.join(this.appFolder, 'lib', 'interfaces', iface));
			});
	}

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

		const startupTypeOrder = ['kaspad','mqtt','mysql','pgsql','kasparovsyncd','kasparovd','simulator','txgen'];
		const typeMap = { };

		Object.entries(daemons).forEach(([name, config]) => {
			let conf = { };
			Object.assign(conf, config);

			let [type, id] = name.split(":");
			if(!typeMap[type])
				typeMap[type] = [ ];
			typeMap[type].push({conf, args:conf.args, name, type, key:name.replace(":", "-"), id});
		})
		
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

	getBinaryFolder(){
		return path.join(this.appFolder, 'bin', utils.platform);
	}
}

module.exports = KaspaProcessManager;
