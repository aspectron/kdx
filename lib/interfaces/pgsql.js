const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const mkdirp = require('mkdirp');
const { execFile, execFileSync } = require('child_process');

const utils = require("../utils");
const Daemon = require('../daemon');
const { Pool, Client } = require('pg');

const isDocker = require('is-docker');
const isDocker_ = isDocker();

const PGSQL_STARTUP_DELAY = 1250; // msec
const PGSQL_TEST_DELAY = 500; // msec

module.exports = class pgSQL extends Daemon {

	start() {
		this.log("pgSQL::start()");
		return new Promise(async (resolve,reject) => {

			let defaults = {
				datadir : this.folder
			}

			let args = Object.assign({}, this.task.args || {});

			args = Object.entries(Object.assign(defaults, args)).map((o) => {
				const [k,v] = o;
				return {k,v};
			});

			if(isDocker_ || os.platform() == 'linux') {
				this.pgsqlBinFolder = '/usr/bin';
			} else {
				const pgsqlFolder = fs.readdirSync(this.manager.getBinaryFolder()).filter(f => f.match(/^postgresql/i)).shift();
				if(!pgsqlFolder) {
					this.log(`pgSQL - Unable to find 'pgsql' folder in 'bin'`);
					return;
				}
				this.pgsqlBinFolder = path.join(this.manager.getBinaryFolder(), pgsqlFolder, 'bin');
			}
			
			this.binary = { };
			this.binary.postgres = path.join(this.pgsqlBinFolder,'postgres')+this.PLATFORM_BINARY_EXTENSION;
			this.binary.pg_ctl = path.join(this.pgsqlBinFolder,'pg_ctl')+this.PLATFORM_BINARY_EXTENSION;
			this.binary.psql = path.join(this.pgsqlBinFolder,'psql')+this.PLATFORM_BINARY_EXTENSION;
			this.binary.initdb = path.join(this.pgsqlBinFolder,'initdb')+this.PLATFORM_BINARY_EXTENSION;

			this.dataFolder = path.join(this.folder, 'data');
			mkdirp.sync(path.join(this.folder, 'logs'));

			this.logFile = path.join(this.folder, 'logs',`${this.task.key}.log`);

			this.log("CONFIG:".brightRed, this.task.conf);
			const port = this.task.conf.port;

			args = [
				`-D`,
				this.dataFolder,
				`-p`,
				port,
				// `--port=${port}`,
				// `--log-error=${this.logFile}`,
				// `--user=root`,
				'--timezone=UTC'
				//`--console`
			];

			const run = (...custom_args) => {
				return new Promise((resolve,reject) => {
					dpc(async ()=>{
						await this.run({
							verbose : true,
							cwd : os.platform() == 'win32' ? this.folder : '/usr',
							// detached : true,
							args : () => {
								return [
									this.binary.postgres,
									...custom_args,
									...args
								];
							}
						});
						resolve();
					})
				})
			}

			if(this.manager.flags['reset-pgsql']) {
				this.log("+-","Emptying pgSQL data folder".brightBlue);
				this.log("+-->", this.dataFolder.brightWhite);
				fs.emptyDirSync(this.dataFolder);
			}

			if(!fs.existsSync(path.join(this.dataFolder,'pg_version'))) {
				dpc(async ()=>{
					this.log("+-","pgSQL: initializing data folder".brightYellow,"\n+-->",this.dataFolder.brightWhite);

					const init = new Promise(async (resolve,reject) => {
						try {

							await utils.spawn(this.binary.initdb,[
								`-D`,
								this.dataFolder,
								`-U`,
								`postgres`
							], { 
								cwd : this.folder,
								stdout : (data) => this.writeToSink(data)
							});

							resolve();
							
						} catch(ex) {
							console.log(ex);
							this.log('FATAL - ABORTING pgSQL STARTUP SEQUENCE! [3]'.brightRed);
							reject(ex);
							return;
						}
							
					});
					
					try {
						await init;
					} catch(ex) {
						console.log(ex);
						this.log('FATAL - ABORTING pgSQL STARTUP SEQUENCE! [4]'.brightRed);
						return;
					}

					await run();
					this.log("pgSQL PID:", this.process.pid);

					const initFile = path.join(this.dataFolder,'init.sql');
					fs.writeFileSync(initFile, `CREATE USER kaspa WITH PASSWORD 'kaspa';\nCREATE DATABASE kasparov;\nGRANT ALL PRIVILEGES ON DATABASE kasparov TO kaspa;`);

					//console.log("waiting for 2 seconds")
					dpc(PGSQL_STARTUP_DELAY, async () => {
						this.log("init pgSQL Db".brightYellow);

						const psqlInitArgs = [
							`-v`,
							`ON_ERROR_STOP=1`,
							`--username`,
							`postgres`,
							`-p`,
							port,
							`-f`,
							initFile
						];
						try {
							await utils.spawn(this.binary.psql,psqlInitArgs,{
								cwd : this.folder,
								stdout : (data) => this.writeToSink(data)
							}); 
							this.log("...pgSQL configuration successful!".brightYellow);
							
							resolve();
						} catch(ex) {
							reject(ex);
						}

					});
				})
			}
			else {
				dpc(async ()=>{
					await run();
					resolve();
				})
			}
		})
	}

	stop() {
		this.relaunch = false;
		if(!this.process)
			return null;

		return new Promise((resolve,reject)=>{

			this.relaunch = false;
			this.no_warnings = true;
			let fail = false;
			const timeout = setTimeout(()=>{
				fail = true;
				this.log("pgSQL daemon shutdown has timed-out".brightYellow);
				resolve();
			}, 15_000);
			this.once('halt', () => {
				if(!fail) {
					this.log("pgSQL daemon has gracefully halted".brightYellow);
					clearTimeout(timeout);
					resolve();
				}
			});


			this.log('pgSQL is being shutdown');
			
			const args = [`stop`,'-D',this.dataFolder];

			this.log(this.binary.pg_ctl, args);

			execFile(this.binary.pg_ctl, args, {
				cwd : this.folder
			}, (error,stdout,stderr) => {
				if(error) {
					this.log("Error configuring mysql".brightRed);
					this.log(error);
				}			
				
			})
		})
	}
}

