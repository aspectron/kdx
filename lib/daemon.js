const fs = require('fs-extra');
const du = require('du');
const os = require('os');
const path = require('path');
const mkdirp = require('mkdirp');
const utils = require("./utils");
const EventEmitter = require("events");
const _ = require("underscore");
const TermSink = require("./term-sink.js");
const { spawn } = require('child_process');
const { dpc } = require('@aspectron/flow-async');

const isNW = typeof nw != 'undefined';

const MAX_LOG_SIZE = 1024 * 1024 * 15;
module.exports = class Daemon  extends TermSink {

	static procInfoFields = ['cpu','memory','pmem','vmem'];

	constructor(manager, task, options={}) {
		super(manager, task);
		this.manager = manager;
		this.task = { ...task };
		if(!this.task.conf)
			this.task.conf = { };
		this.PLATFORM_BINARY_EXTENSION = process.platform == 'win32' ? '.exe' : '';
		this.folder = path.join(manager.dataFolder, task.key);
		fs.ensureDirSync(this.folder);
		this.logFolder = path.join(this.folder,'logs');
		fs.ensureDirSync(this.logFolder);
		this.logFile = path.join(this.logFolder,`${this.task.type}.log`);

		this.options = Object.assign({
			relaunch : true,
			delay : 3000,
			tolerance : 5000,
			restarts : 0,
			exit_timeout: 2e4
		}, options);

		if(!this.options.args)
			this.options.args = []

		this.pollers = { };
		this.relaunch = this.options.relaunch;
		this.delay = this.options.delay;
		this.restarts = 0;//this.options.restarts;
		this.tolerance = this.options.tolerance;
		this.ts = Date.now();
		this.kick = false;
		this.storageSizeInBytes = -1;
		this.storageSizeInBytesTS = 0;
		this.storageUsageRateBytesPerHour = [];
		this.state_ = 'starting';

		this.SIGTERM = this.createInterrupt('SIGTERM');
		this.SIGINT = this.createInterrupt('SIGINT');
		this.WAIT_FOR_EXIT = this.createInterrupt(null);
		process.on("SIGINT", ()=>{
			if(this.state == 'stopping')
				return
			let next = ()=>{
				setTimeout(()=>{
					this.terminate();
					process.exit();
				}, 2000);
			}

			let p = this.stop && this.stop();
			if(p) {
				p.then(e=>next())
			}else{
				next();
			}

		});

		this.on('start', ()=>{ 
			this.flushProcInfo();
			this.renderTaskInfo();

			this.createPoller(1 * 60 * 1000, () => {
				return new Promise((resolve) => {
					if(!fs.existsSync(this.logFile))
						return resolve();

					fs.stat(this.logFile, (err, stats) => {
						if(err) {
							console.log(err);
							return resolve();
						}

						if(stats.size > MAX_LOG_SIZE) {
							let next = this.logFile.replace('.log',`.old`);
							if(fs.existsSync(next))
								fs.unlinkSync(next);
							fs.renameSync(this.logFile, next);

						}

					})
				})
			})

			// this.createPoller(1 * 60 * 1000, async () => {
			// 	this.updateStorageSize();
			// })
		})

		this.on('running', () => {
			isNW && (this['monitor-storage-usage'] || this['monitor-storage-rate'] ) && this.createPoller(1 * 30 * 1000, async () => {
				this.updateStorageSize(true);
			})

			isNW && this.createPoller(1000, async () => {
				this.renderTaskInfo();
			})

		})

		this.on('exit', () => {

			this.flushProcInfo();

			this.renderTaskInfo();
		})

		this.on('halt', () => {
			this.stopPollers();
		})

		isNW && dpc(() => {
			this.updateStorageSize(false);
		})

		this.mute = true;
		const { args } = manager;
		// rely on object property order
		Object.keys(args).forEach((arg) => {
			if(arg == 'unmute' || arg == 'verbose' || args == `unmute-${task.type}` || args == `unmute-${task.id}`)
				this.mute = false;
			if(arg == `mute-${task.type}` || arg == `mute-${task.id}`)
				this.mute = true;
		})

	}

	flushProcInfo() {
		const pi = this.procInfo;
		if(pi) {
			Daemon.procInfoFields.forEach(k => { 
				if(pi[k] !== undefined) 
					pi[k] = 0; 
				flow?.samplers.get(`${this.task.key}-${k}`).put(0);
			});
		}
	}

	async updateStorageSize(render = true) {
		let storageSizeInBytesPrev = this.storageSizeInBytes;
		let storageSizeInBytesPrevTS = this.storageSizeInBytesTS;
		this.storageSizeInBytes = await this.du();
		this.storageSizeInBytesTS = Date.now();

		if(storageSizeInBytesPrev != -1) {
			let delta = this.storageSizeInBytes - storageSizeInBytesPrev;
			if(delta < 0)
				delta = 0;

			this.storageUsageRateBytesPerHour.push(delta / (this.storageSizeInBytesTS - storageSizeInBytesPrevTS) * 1000 * 60 * 60);
			while(this.storageUsageRateBytesPerHour.length > 5)
				this.storageUsageRateBytesPerHour.shift();


			this.storageUsageRateBytesPerHourAvg = this.storageUsageRateBytesPerHour.reduce((a,b) => a+b, 0) / this.storageUsageRateBytesPerHour.length;
		}


		if(typeof flow != 'undefined' && this['monitor-storage-usage']){
			flow.samplers.get(`${this.task.key}-storage-used`).put(this.storageSizeInBytes);
			if(this['monitor-storage-rate'] && this.storageUsageRateBytesPerHourAvg) {
				flow.samplers.get(`${this.task.key}-storage-per-hour`).put(this.storageUsageRateBytesPerHourAvg);
				flow.samplers.get(`${this.task.key}-storage-per-year`).put(this.storageUsageRateBytesPerHourAvg*365);
			}
		}

		// console.log("du:",this.storageSizeInBytes);
		if(render)
			this.renderTaskInfo();
	}

	renderTab(html, T) {
		const { task } = this;
		let caption = task.type.toUpperCase();
		let id = task.id.toUpperCase();
		if(task.type == 'app') {
			caption = id;
			id = '';
		}
		// if(/app/ig.test(caption)) {
		// }
		// console.log('tab:',caption,id);
		return html`
			<div style="display:flex;flex-direction:row;${this.running?'':'color:red;'}">
				<div style="font-size:18px;" caption>${caption}</div>
				<div style="font-size:10px; margin-top:8px;">${id}</div>
			</div>`;
	}
	//<div style="font-size:18px;" caption><flow-i18n text="${caption}"></flow-i18n></div>

	async renderModuleInfo({ html, i18n }) {
		const { task } = this;
		if(task.hidden)
			return Promise.resolve();
		let version = await this.getVersion();
		if(version == 'N/A')
			version = false;
		else
			version = Array.isArray(version) ? `v${version.join('.')}` : (version || '');
		let caption = task.type;
		//let id = task.id;
	
		let id = task.id.match(/[a-zA-Z]+|[0-9]+(?:\.[0-9]+)?|\.[0-9]+/g);
		let [ prefix, suffix ] = id;
		if(/app/ig.test(caption)) {
			caption = task.id;
			id = prefix = suffix = '';
		}

		const storageUsageRateBytesPerHour = this.storageUsageRateBytesPerHourAvg;//.reduce((a,b) => a+b, 0) / this.storageUsageRateBytesPerHour.length;

		let [size,size_unit] = this.storageSizeInBytes == -1 ? ['---',''] : this.storageSizeInBytes.toFileSize().split(' ');
		let [rate_hr,rate_hr_unit] = (!this.storageUsageRateBytesPerHour.length) ? ['---',''] : (storageUsageRateBytesPerHour).toFileSize().split(' ');
		let [rate_year,rate_year_unit] = (!this.storageUsageRateBytesPerHour.length) ? ['---',''] : (storageUsageRateBytesPerHour*24*365).toFileSize().split(' ');
		// console.log('storage rate:',rate,rate_unit,this.storageUsageRateBytesPerHour);
		const state = this.state;
		const uptime = this.getUptime();
		// const cpu = parseFloat(this.procInfo?.cpu || 0).toFixed(2);
		// const cpu = parseFloat(this.procInfo?.cpu || 0).toFixed(2);
		const pisrc = this.procInfo || {};
		const pi = { };
		Daemon.procInfoFields.forEach(k => { if(pisrc[k] !== undefined) pi[k] = pisrc[k]; });
		//let { cpu, memory, pmem, vmem } = pi;
		/*
		pi.cpu = 0.1;
		pi.memory = 10;
		pi.pmem = 100
		pi.vmem = 1000;
		*/
		if(pi.cpu !== undefined) {
			pi.cpu = { suffix : '%', value : pi.cpu < 0.01 ? pi.cpu.toFixed(4) : (pi.cpu < 10 ? pi.cpu.toFixed(2) : pi.cpu.toFixed(0)), title : 'CPU' }
		}
		if(pi.memory !== undefined) {
			pi.memory = { suffix : '%', value : pi.memory, title : 'MEMORY' }
		}
		if(pi.pmem !== undefined) {
			let [value,suffix] = pi.pmem.toFileSize().split(' ');
			pi.pmem = { value, suffix, title : 'RAM' }
		}
		if(pi.vmem !== undefined) {
			let [value,suffix] = pi.vmem.toFileSize().split(' ');
			pi.vmem = { value, suffix, title : 'VIRTUAL MEMORY' }
		}

		// this.log('pi:',pi);
		// const memorySuffix = '%';
		// const cpu = (this.procInfo?.cpu || 0).toFixed(4);
		// const memory = (this.procInfo?.memory || 0).toFixed(4);
		// const pmem = isNaN(this.procInfo?.pmem) ? undefined : 
		// const vmem = (this.procInfo?.vmem || 0).toFixed(4);
		return html`
			<div class="task ${state}" ?running=${this.running} ?version=${version}>
				<div class="col-1">
					<span class="type">${caption.toUpperCase()} ${prefix}<sub class="suffix">${suffix||''}</sub>${(state?((' - '+state).toUpperCase()):'')}</span>
					<br/><span class="version">${version}</span>
				</div>
				<div class="col-2"><span class="id"></span></div>
			</div>

			${
				this.manager.controller.advanced ? 
					html`<flow-data-badge class="uptime" has-colon title="${i18n.t('UPTIME')}">${uptime}</flow-data-badge>` : ''
			}

			${
				this['monitor-storage-usage'] ?
					html`
					<flow-data-badge-graph sampler="${this.task.key}-storage-used" has-colon suffix="${size_unit}" title="${i18n.t('STORAGE USED')}" @click=${this.updateStorageSize}>${size}</flow-data-badge-graph>
					` : ''
			}

			${
				this['monitor-storage-rate'] ?
					html`
					<flow-data-badge-graph sampler="${this.task.key}-storage-per-hour" has-colon x-prefix="5M AVG" suffix="${rate_hr_unit} / HOUR" title="${i18n.t('STORAGE RATE | 5M AVG')}" @click=${this.updateStorageSize}>${rate_hr}</flow-data-badge-graph>
					<flow-data-badge-graph sampler="${this.task.key}-storage-per-year" has-colon x-prefix="5M AVG" suffix="${rate_year_unit} / YEAR" title="${i18n.t('STORAGE RATE | 5M AVG')}" @click=${this.updateStorageSize}>${rate_year}</flow-data-badge-graph>
					` : ''
			}

			${	
				this.manager.controller.advanced ?
					Object.entries(pi).map(([k,v]) => {
						return html`<flow-data-badge-graph class="${k}" sampler="${this.task.key}-${k}" has-colon suffix="${v.suffix}" title="${i18n.t(v.title)}">${v.value}</flow-data-badge-graph>`;
					})
				: ''
			}

			`;
	}

	redraw() {
		this.manager.redraw();
	}
	
	async getVersion() {
		if(this.version)
			return Promise.resolve(this.version);

		if(!this.vsargs_)
			return Promise.resolve('N/A');

		return new Promise((resolve) => {
			this.exec(...this.vsargs_.args).then((text)=>{
				if(this.vsargs_.filter)
					text = this.vsargs_.filter(text);
				let version = text.split('\n').shift().trim();
				let v = version.match(/(?<major>\d+)\.(?<minor>\d+)\.(?<patch>[^\s]+)/);
				if(v) {
					this.version = [...v].slice(1);
					this.semver = v.groups;
				}
				else
					this.version = version || 'N/A';
				resolve(text);
			})
		});
	}

	exec(...args) {
		return new Promise((resolve) => {
			let text = '';
			let proc = args.shift();
			utils.spawn(proc, args, { stdout : (data) => {
				text += data.toString('utf8');
			}}).then(()=>{
				resolve(text.trim());
			})
		})
	}

	VSARGS(args, filter) {
		this.vsargs_ = { args, filter };
		return this.getVersion();
	}

	silentTerminate(interrupt = 'SIGTERM'){
		this.__destroySink = false;
		this.terminate(interrupt);
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
			//this.emit('halt');
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
			return new Promise(async(resolve, reject) => {

				this.state = 'stopping';

				if(this.restart_dpc) {
					clearTimeout(this.restart_dpc);
					delete this.restart_dpc;
				}

				if(!this.process)
					return resolve('not running');
				await this.beforeInterrupt(interrupt);

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

	run(options) {
		if(options)
			Object.assign(this.options, options);

		return new Promise(async (resolve, reject) => {
			delete this.restart_dpc;
			let args = [];
			if (typeof this.options.args  == 'function'){
				let _args = await this.options.args();
				if(_args)
					args = _args.slice()
			}else{
				args = (this.options.args||[]).slice();
			}

			this.options.verbose && console.log("running:", args);

			if(this.process) {
				// throw new Error("Process is already running!");
				console.error("Process is already running",this);
				return reject('process is already running');
			}
			this.__destroySink = true;

			let proc = this.task.conf.executable ||this.task.conf.exec ||this.task.conf.binary || args.shift();
			//this.name = this.options.name || proc;
			let cwd = this.options.cwd || process.cwd();
			//let windowsHide = this.options.windowsHide;
			let detached = this.options.detached;
			//let env = (this.options.env && Object.keys(this.options.env).length) ? this.options.env : undefined;

			let target = proc;
			if(proc=="node"){
				target = path.join(this.manager.appFolder, proc);
				if(!fs.existsSync(target))
					target = "node";
			}else if(!fs.existsSync(target)) {
				target = path.join(cwd,proc);
				if(!fs.existsSync(target))
					target = null;
			}

			if(!target) {
				this.writeToSink(`WARNING`.brightRed+` unable to locate executable '${proc}'`);
			}
			else if(fs.existsSync(target)){
				let stat = fs.statSync(target);
				if(this.manager.controller?.buildType != 'generic') {
					this.writeToSink(`${proc} - created ${stat.birthtime.toString()}`);
				}
			}

			//let filter = options.filter || function(data) { return data; };

			let filter_ = (data) => { return data; }
			let stdout = (typeof(this.options.stdout) == 'function') ? this.options.stdout : filter_;
			let stderr = (typeof(this.options.stderr) == 'function') ? this.options.stderr : filter_;

			// console.log(proc, args, { cwd, windowsHide });
			//this.process = spawn(proc, args, { cwd, windowsHide, detached, env });
			
			this.state = '';

			this.ts_run = Date.now();

			// if(this.manager.controller.verbose)
			// this.writeToSink(`running ${[proc,...args].join(' ')}\r\n\r\n`);
			this.process = spawn(target, args, { cwd, detached, env : process.env });
			this.running = true;
			this.manager.redraw();
			this.emit('start');

			const runningEmitter = dpc(1000, () => {
				this.emit('running');
			})

			let prefix = this.getName();
			this.process.stdout.on('data',(data) => {
				fs.appendFile(this.logFile,data, ()=>{});
				this.writeToSink(data);
				//console.log(data.toString('utf8'));
				let text = stdout(data);
				if(!this.mute && text) {
					process.stdout.write(text.toString('utf8').trim().split('\n').map(v=>`${prefix} ${v}`).join("\n")+"\n");
				}
				// if(options.logger)
				// 	options.logger.write(data);
			});

			this.process.stderr.on('data',(data) => {
				fs.appendFile(this.logFile,data,()=>{});
				this.writeToSink(data);
				this.log("stderr", data.toString('utf8'));
				let text = stdout(data);
				if(!this.mute && text) {
					process.stderr.write(text);
				}
				// if(logger)
				// 	options.logger.write(data);
			});

			this.process.on('exit', (code) => {
				clearTimeout(runningEmitter);
				this.ts_run = null;
				this.state = 'stop';
				this.running = false;
				this.manager.redraw();
				this.emit('exit',code);
				let { name } = this.task;
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
					this.emit('halt');
					if(this.__destroySink)
						this.destroySink();
				}
			});

			resolve();
		})            
	}

	toConfig(args){
		const conf = [];
		_.forEach(args, (v, k)=>{
			conf.push(`${k}=${v}`);
		})
		return conf.join(os.EOL);
	}

	
	getDeployableBinary(...args) {
		return this.manager.getDeployableBinary(...args);
	}
	// 	let buildType = this.manager.controller?.buildType || 'generic';
	// 	switch(buildType) {
	// 		case 'generic': {
	// 			return path.join(this.getBinaryFolder(), ...args)+this.PLATFORM_BINARY_EXTENSION;
	// 		}
			
	// 		case 'local': {
	// 			return path.join(os.homedir(),'.kdx','bin',utils.platform, ...args)+this.PLATFORM_BINARY_EXTENSION;
	// 		}			
	// 	}
	// }

	getBinary(...args){
		return path.join(this.getBinaryFolder(), ...args)+this.PLATFORM_BINARY_EXTENSION;
	}

	getBinaryFolder(){
		return this.manager.getBinaryFolder();
	}

	prepareForShutdown() {
		this.prepareForShutdownIsCalled = true;
		this.relaunch = false;
		if(this.restart_dpc) {
			clearTimeout(this.restart_dpc);
			delete this.restart_dpc;
		}

		this.stopPollers();
	}

	destroy(){
		this.stop();
	}
	async stop(wait_for_exit) {
		if(!this.prepareForShutdownIsCalled)
			this.prepareForShutdown();

		return new Promise(async (resolve,reject) => {
			let waits = [ ]
			if(wait_for_exit)
				waits.push('WAIT_FOR_EXIT');
			waits.push('SIGINT');
			waits.push('SIGTERM');
			while(waits.length) {
				let wait = waits.shift();
				this.log(('  ...'+wait+'^').yellow.bold);
				try {
					await this[wait](this.options.exit_timeout);
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



	async du() { 

		let storageBytes = -1;
        try {
            storageBytes = await du(this.folder, {
				filter : (f) => {
					if(/(\\|\/)logs(\\|\/)/i.test(f)) {
						//console.log('du:',f,false);
						return false;
					}
					//console.log('du:',f,true);
                    return true;
				}
            });
        } catch(ex) {
			console.log(`du error on folder ${this.folder}`);
			console.log(ex);
		}                

		return Promise.resolve(storageBytes); 
	}

	createPoller(interval, fn) {

		let uid = parseInt(Math.round(Math.random()*0xffff)+''+Date.now().toString().substring(4)).toString(16);

		const poller = async () => {
			fn().then(()=>{
				if(this.pollers[uid])
					this.pollers[uid] = dpc(interval, poller);
			}).catch((ex)=>{
				console.log("poller",uid,"aborting...");
				console.log("reason:",ex);
			})

		}

		this.pollers[uid] = dpc(()=>{});
		poller();

		return uid;
	}

	stopPoller(uid) {
		if(this.pollers[uid]) {
			clearTimeout(this.pollers[uid]);
			delete this.pollers[uid];
		}
	}

	stopPollers() {
		Object.values(this.pollers).forEach((poller) => {
			clearTimeout(poller);
		})
		this.pollers = { };
	}

	get state() {
		return this.state_;
	}

	set state(state) {
		this.state_ = state;
		this.renderTaskInfo();
	}

	resolvePath(p) {
		return p
			.replace(/$APPS/, path.join(this.manager.appFolder,'apps'));
	}


	getUptime() {
		if(!this.running || !this.ts_run)
			return '--:--:--';
		let delta = Math.round((Date.now() - this.ts_run) / 1000);
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

	onProcMonData(data) {
		const { pslist, snapshot, system } = data;

		
		// console.log("pslist:",pslist);
		// console.log("snapshot", snapshot);
		// console.log("system", system);

		const pid = this.process?.pid || null;
		if(!pid)
			return;

		let list = null;
		if(snapshot) {
			list = snapshot.filter(p => p.pid == pid);
		} else if(pslist) {
			list = pslist.filter(p => p.pid == pid);
		}

		if(list && list.length && typeof flow != 'undefined') {
			this.procInfo = list.shift();
			//console.log("PROCDATA:",this.task.name,list.shift());
			flow.samplers.get(`${this.task.key}-cpu`).put(this.procInfo.cpu);
			if(this.procInfo.memory !== undefined)
				flow.samplers.get(`${this.task.key}-memory`).put(this.procInfo.memory);
			if(this.procInfo.pmem !== undefined)
				flow.samplers.get(`${this.task.key}-pmem`).put(this.procInfo.pmem);
			if(this.procInfo.vmem !== undefined)
				flow.samplers.get(`${this.task.key}-vmem`).put(this.procInfo.vmem);
		}

	}
}