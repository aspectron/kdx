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

const MAX_LOG_SIZE = 1024 * 1024 * 15;
module.exports = class Daemon  extends TermSink {

	constructor(manager, task) {
		super(manager, task);
		this.manager = manager;
		this.task = task;
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
			restarts : 0
		});

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

		this.SIGTERM = this.createInterrupt('SIGTERM');
		this.SIGINT = this.createInterrupt('SIGINT');
		this.WAIT_FOR_EXIT = this.createInterrupt(null);
		process.on("SIGINT", ()=>{
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

			this.mute = true;
			const { args } = manager;
			// rely on object property order
			Object.keys(args).forEach((arg) => {
				if(arg == 'unmute' || arg == 'verbose' || args == `unmute-${task.type}` || args == `unmute-${task.id}`)
					this.mute = false;
				if(arg == `mute-${task.type}` || arg == `mute-${task.id}`)
					this.mute = true;
			})
		});

		this.on('start', ()=>{ 
			
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
			this.createPoller(1 * 60 * 1000, async () => {
				this.updateStorageSize(true);
			})
		})

		this.on('exit', () => {
			this.renderTaskInfo();
		})

		dpc(() => {
			this.updateStorageSize(false);
		})

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
		}


		// console.log("du:",this.storageSizeInBytes);
		if(render)
			this.renderTaskInfo();
	}

	renderTab(html, T) {
		const { task } = this;
		let caption = task.type.toUpperCase();
		let id = task.id.toUpperCase();
		if(/app/ig.test(caption)) {
			caption = id;
			id = '';
		}
		// console.log('tab:',caption,id);
		return html`
			<div style="display:flex;flex-direction:row;${this.running?'':'color:red;'}">
				<div style="font-size:18px;"><flow-i18n text="${caption}"></flow-i18n></div>
				<div style="font-size:10px; margin-top:8px;"><flow-i18n text="${id}"></flow-i18n></div>
			</div>`;
	}

	async renderModuleInfo(html) {
		const { task } = this;
		let version = await this.getVersion();
		if(version == 'N/A')
			version = false;
		let caption = task.type;
//		let id = task.id;
	
		let id = task.id.match(/[a-zA-Z]+|[0-9]+(?:\.[0-9]+)?|\.[0-9]+/g);
		let [ prefix, suffix ] = id;
		if(/app/ig.test(caption)) {
			caption = task.id;
			id = prefix = suffix = '';
		}
		let [size,size_unit] = this.storageSizeInBytes == -1 ? ['---',''] : this.storageSizeInBytes.toFileSize().split(' ');
		let [rate,rate_unit] = (!this.storageUsageRateBytesPerHour.length) ? ['---',''] : (this.storageUsageRateBytesPerHour.reduce((a,b) => a+b, 0) / this.storageUsageRateBytesPerHour.length).toFileSize().split(' ');
		console.log('storage rate:',rate,rate_unit,this.storageUsageRateBytesPerHour);
		return html`
			<div class="task" ?running=${this.running} ?version=${version}>
				<div class="col-1">
					<span class="type">${caption.toUpperCase()} ${prefix}<sub class="suffix">${suffix||''}</sub></span>
					<br/><span class="version">${version}</span>
				</div>
				<div class="col-2"><span class="id"></span></div>
			</div>
			
			<flow-data-field has-colon suffix="${size_unit}" title="STORAGE USED" @click=${this.updateStorageSize}>${size}</flow-data-field>
			<flow-data-field has-colon x-prefix="5M AVG" suffix="${rate_unit} / HOUR" title="STORAGE RATE | 5M AVG" @click=${this.storageUsageRateBytesPerHour}>${rate}</flow-data-field>
			
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
				this.version = text.split('\n').shift().trim();
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
					return resolve('not running');

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

		return new Promise((resolve, reject) => {
			delete this.restart_dpc;
			
			let args = (typeof this.options.args  == 'function') ? this.options.args().slice() : this.options.args.slice();

			this.options.verbose && console.log("running:", args);

			if(this.process) {
				// throw new Error("Process is already running!");
				console.error("Process is already running",this);
				return reject('process is already running');
			}

			let proc = args.shift();
			//this.name = this.options.name || proc;
			let cwd = this.options.cwd || process.cwd();
			//let windowsHide = this.options.windowsHide;
			let detached = this.options.detached;
			//let env = (this.options.env && Object.keys(this.options.env).length) ? this.options.env : undefined;

			//let filter = options.filter || function(data) { return data; };

			let filter_ = (data) => { return data; }
			let stdout = (typeof(this.options.stdout) == 'function') ? this.options.stdout : filter_;
			let stderr = (typeof(this.options.stderr) == 'function') ? this.options.stderr : filter_;

			// console.log(proc, args, { cwd, windowsHide });
			//this.process = spawn(proc, args, { cwd, windowsHide, detached, env });
			this.process = spawn(proc, args, { cwd, detached, env : process.env });
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
					process.stdout.write(text.toString('utf8').split('\n').map(v=>`${prefix} ${v}`).join('\n'));
				}
				// if(options.logger)
				// 	options.logger.write(data);
			});

			this.process.stderr.on('data',(data) => {
				fs.appendFile(this.logFile,data,()=>{});
				this.writeToSink(data);
				//console.error(data.toString('utf8'));
				let text = stdout(data);
				if(!this.mute && text) {
					process.stderr.write(text);
				}
				// if(logger)
				// 	options.logger.write(data);
			});

			this.process.on('exit', (code) => {
				clearTimeout(runningEmitter);
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
		let buildType = this.manager.controller?.buildType || 'generic';
		switch(buildType) {
			case 'generic': {
				return path.join(this.getBinaryFolder(), ...args)+this.PLATFORM_BINARY_EXTENSION;
			}
			
			case 'local': {
				return path.join(os.homedir(),'.kdx','bin',utils.platform, ...args)+this.PLATFORM_BINARY_EXTENSION;
			}			
		}
	}

	getBinary(...args){
		return path.join(this.getBinaryFolder(), ...args)+this.PLATFORM_BINARY_EXTENSION;
	}

	getBinaryFolder(){
		return this.manager.getBinaryFolder();
	}

	destroy(){
		this.stop();
	}
	async stop(wait_for_exit) {
		this.relaunch = false;
		if(this.restart_dpc) {
			clearTimeout(this.restart_dpc);
			delete this.restart_dpc;
		}

		this.stopPollers();

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
					await this[wait](1e4);
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
						console.log('du:',f,false);
						return false;
					}
					console.log('du:',f,true);
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

	}

	stopPollers() {
		Object.values(this.pollers).forEach((poller) => {
			clearTimeout(poller);
		})
		this.pollers = { };
	}


}