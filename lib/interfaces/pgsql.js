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
	constructor(manager, task) {
		super(manager, task);
		console.log(`Creating ${task.type}`.green.bold);
	}

	start() {
		this.log("mysql::start()");
		return new Promise(async (resolve,reject) => {

			const core = this.manager.core;
			//const env = core.env;

			let defaults = {
				datadir : this.folder
			}

			let args = Object.assign({}, this.task.args || {});

			// let peers = this.getPeers();
			// if(!peers) {
			// 	console.log(`No peers available for TXGEN - bailing...`.red.bold, peer);
			// 	return null;
			// }

			// let peer = peers.shift();
			// let ip = peer.ip;
			// let port = (env.KASPAD_P2P_BASE_PORT+this.task.seq);
			// args['address'] = `${ip}:${port}`;

			args = Object.entries(Object.assign(defaults, args)).map((o) => {
				const [k,v] = o;
				return {k,v};
			});


			// try {
			// 	if(fs.existsSync('/etc/my.cnf.d/mariadb-server.cnf'))
			// 		fs.unlinkSync('/etc/my.cnf.d/mariadb-server.cnf');
			// } catch(ex) {
			// 	console.log('WARNING - MariaDB - Critical Condition while trying to erase /etc/my.cnf.d/mariadb-server.cnf: please ensure you have correct access rights');
			// 	console.log('Error unlinking default mariadb config in /etc/my.cnf.d - ',ex.toString());
			// }

			
			/*if(os.platform() == 'darwin'){
				this.pgsqlBinFolder = '/usr/local/mysql/bin';
			/}else */if(isDocker_ || os.platform() == 'linux') {
				this.pgsqlBinFolder = '/usr/bin';
			} else {
				const pgsqlFolder = fs.readdirSync(this.manager.core.getBinaryFolder()).filter(f => f.match(/^postgresql/i)).shift();
				if(!pgsqlFolder) {
					this.log(`pgSQL - Unable to find 'pgsql' folder in 'bin'`);
					return;
				}
				this.pgsqlBinFolder = path.join(this.manager.core.getBinaryFolder(), pgsqlFolder, 'bin');
			}
			
			this.binary = { };
			this.binary.postgres = path.join(this.pgsqlBinFolder,'postgres')+this.PLATFORM_BINARY_EXTENSION;
			this.binary.pg_ctl = path.join(this.pgsqlBinFolder,'pg_ctl')+this.PLATFORM_BINARY_EXTENSION;
			this.binary.psql = path.join(this.pgsqlBinFolder,'psql')+this.PLATFORM_BINARY_EXTENSION;
			this.binary.initdb = path.join(this.pgsqlBinFolder,'initdb')+this.PLATFORM_BINARY_EXTENSION;
			// this.binary.mysqld_safe = path.join(this.pgsqlBinFolder,'mysqld_safe')+this.PLATFORM_BINARY_EXTENSION;
			// this.binary.mysql = path.join(this.pgsqlBinFolder,'mysql')+this.PLATFORM_BINARY_EXTENSION;
			// this.binary.mysqladmin = path.join(this.pgsqlBinFolder,'mysqladmin')+this.PLATFORM_BINARY_EXTENSION;
			// this.binary.mysql_install_db = path.join(this.pgsqlBinFolder,'mysql_install_db')+this.PLATFORM_BINARY_EXTENSION;

			this.dataFolder = path.join(this.folder, 'data');
			mkdirp.sync(path.join(this.folder, 'logs'));

			this.logFile = path.join(this.folder, 'logs',`${this.task.key}.log`);

			// const binary_mysqld = path.join(this.manager.core.getBinaryFolder(),this.pgsqlBinFolder,'mysqld')+this.PLATFORM_BINARY_EXTENSION;
			// const binary_mysql = path.join(this.manager.core.getBinaryFolder(),this.pgsqlBinFolder,'mysql')+this.PLATFORM_BINARY_EXTENSION;
			//const binary = path.join(core.appFolder,'bin','mysql-8.0.18-winx64','bin','mysqld')+this.PLATFORM_BINARY_EXTENSION;
			//		const rpcCertFile = path.join(core.appFolder,'bin','rpc.cert');
			//console.log('running',binary.cyan.bold);
			//const maria = os.platform() != 'win32' || fs.existsSync(this.binary.mysql_install_db);
console.log("CONFIG:".brightRed,this.task.conf);
			const port = this.task.conf.args.port;//this.globals.mysql.ports.client+this.task.seq;

			args = [
				// `--basedir=${this.folder}`,
				`-D`,
				this.dataFolder,
				`-p`,
				port,
				// `--port=${port}`,
				// `--log-error=${this.logFile}`,
				// `--user=root`,
				// '--timezone=UTC'
				//`--console`
			];

			// if(os.platform() != 'win32') {
			// 	this.uid = Date.now().toString(16);
			// 	args.push(`--pid-file=/var/run/mysqld/${this.task.key}-${this.uid}.pid`);
			// 	args.push(`--socket=/var/run/mysqld/${this.task.key}-${this.uid}.sock`);
			// }

			// if(os.platform() == 'darwin'){
			// 	args.push(`--ledir=${this.pgsqlBinFolder}`)
			// }


			const run = (...custom_args) => {
				return new Promise((resolve,reject) => {
					dpc(async ()=>{
						await this.initProcess({
							verbose : true,
							cwd : os.platform() == 'win32' ? this.folder : '/usr',
							// detached : true,
							args : () => {
								return [
									this.binary.postgres,
									//maria ? this.binary.mysqld_safe : this.binary.mysqld,
									// this.binary.mysqld,
									...custom_args,
									...args
								];
							}
						})
						this.proc.run();
						resolve();
					})
				})
			}

			if(this.core.flags['reset-pgsql']) {
				this.log("+-","Emptying pgSQL data folder".brightBlue);
				this.log("+-->", this.dataFolder.brightWhite);
				fs.emptyDirSync(this.dataFolder);
			}

			if(!fs.existsSync(path.join(this.dataFolder,'pg_version'))) {
				this.log("+-","pgSQL: initializing data folder".brightYellow,"\n+-->",this.dataFolder.brightWhite);

				const init = new Promise(async (resolve,reject) => {
					try {

						await utils.spawn(this.binary.initdb,[
							//`--basedir=${this.folder}`,
							// `-v`,
							// `ON_ERROR_STOP=1`,
							`-D`,
							this.dataFolder,
							`-U`,
							`postgres`
							//,
							// `--verbose`,
							
							
							// `--user=root`
							// `--user=root`
							// `--user=root`
							// `--user=root`
							// `--user=root`
							
							
							
							//`--user=ubuntu`

						], { 
							cwd : this.folder
							//cwd : '/usr'
						}); //.then(resolve).catch(reject);

						resolve();
						
						// , async (error, stdout, stderr)=>{
						// 	this.log((stdout.toString()+stderr.toString()).blue);
						// 	if(error) {
						// 		this.log(error);
						// 		this.log('FATAL - ABORTING pgSQL STARTUP SEQUENCE! [1]'.brightRed);
						// 		return reject();
						// 	}
						// 	resolve();
						// });		

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
					this.log('FATAL - ABORTING MYSQL STARTUP SEQUENCE! [4]'.brightRed);
					return;
				}

				await run();
				// await run('--skip-grant-tables');
				this.log("pgSQL PID:", this.proc.process.pid);

				//resolve();

				// console.log("Sleeping while MySQL is starting up...".color(48));
				// await this.sleep(3000);
				// console.log("Sleep done...  MySQL should be running by now...".color(48));


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
					// if(os.platform() != 'win32')
					// pgsqlInitArgs.push(`--socket=/var/run/mysqld/${this.task.key}-${this.uid}.sock`);
					// pgsqlInitArgs.push('-h','localhost','-u','root','-P',port,`--connect-timeout=15`,'-e',
					//`CREATE DATABASE kasparov; ALTER USER root@localhost IDENTIFIED BY 'khost'; GRANT ALL PRIVILEGES ON *.* TO root@localhost; FLUSH PRIVILEGES;`);
					// `ALTER USER 'root'@'localhost' IDENTIFIED BY 'khost'; UPDATE mysql.user SET Host='%' WHERE Host='localhost' AND User='root'; FLUSH PRIVILEGES;`);
					// mysqlInitArgs.push('-h','localhost','-u','root','-P',port,`--connect-timeout=15`,'-e',`ALTER USER 'root'@'localhost' IDENTIFIED BY 'khost'; FLUSH PRIVILEGES;`);
					// mysqlInitArgs.push('-h','localhost','-u','root','-P',port,`--connect-timeout=15`,'-e',`ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password AS 'khost'; FLUSH PRIVILEGES;`);

					try {
						await utils.spawn(this.binary.psql,psqlInitArgs,{
							cwd : this.folder
						}); 
						this.log("...pgSQL configuration successful!".brightYellow);
						
						resolve();
					} catch(ex) {
						reject(ex);
					}

					/*,async (error, stdout, stderr)=>{
						if(error) {
							this.log("Error configuring pgsql".brightRed);
							this.log(error);
						}
						if(stdout.toString() || stderr.toString())
							this.log((stdout+stderr).blue);
						this.log("pgSQL configuration successful!".brightYellow);

						// if(this.core.flags['test-pgsql']) {
						// 	dpc(PGSQL_TEST_DELAY, () => {
						// 		this.log(`Connecting to instantiated MySQL Db - port: ${port}`.brightYellow);
						// 		const db = mysql.createConnection({
						// 			host : 'localhost', port,
						// 			user : 'root',
						// 			password: 'khost',
						// 			// database: 'mysql',
						// 			// insecureAuth : true
						// 		});
								
						// 		db.connect(async (err) => {
						// 			resolve();
						// 			if(err) {
						// 				this.log(err);
						// 				this.log("FATAL - MYSQL STARTUP SEQUENCE! [2]".brightRed);
						// 				return;// resolve();
						// 			}

						// 			this.log("MySQL connection SUCCESSFUL!".brightYellow);
						// 			db.end(()=>{
						// 				this.log("MySQL client disconnecting.".brightYellow);
						// 			});
						// 		});
						// 	});
						// }
						// else {
							// resolve();

						// }
					});*/
				});
				
			}
			else {
				await run();
				resolve();
			}
		})
	}

	stop() {
		if(!this.proc)
			return null;

		return new Promise((resolve,reject)=>{

			const user = 'root';
			const pass = 'khost';
			const host = 'localhost';
			//const port = this.globals.mysql.ports.client+this.task.seq;
			const port = this.task.conf.port

			this.proc.relaunch = false;
			this.proc.no_warnings = true;
			let fail = false;
			const timeout = setTimeout(()=>{
				fail = true;
				this.log("pgSQL daemon shutdown has timed-out".brightYellow);
				resolve();
			}, 15_000);	// ...should be more than plenty...
			this.proc.once('halt', () => {
				if(!fail) {
					this.log("pgSQL daemon has gracefully halted".brightYellow);
					clearTimeout(timeout);
					resolve();
				}
			});

			//const mysqladmin = path.join(this.manager.core.getBinaryFolder(),this.pgsqlBinFolder,'mysqladmin')+this.PLATFORM_BINARY_EXTENSION;
			

			this.log('pgSQL is being shutdown');
			
			const args = [`stop`,'-D',this.dataFolder];
			// if(os.platform() != 'win32')
			//  	args.push(`--socket=/var/run/mysqld/${this.task.key}-${this.uid}.sock`);
			// else
			// 	args.push('--protocol=tcp');
			
			//args.push(`stop`,'-D',this.dataFolder);

			// args.push(`--user=${user}`,
			// `--password=${pass}`,
			// `--host=${host}`,
			// `--port=${port}`,
			// `-e`,`SHUTDOWN;`);

			this.log(this.binary.pg_ctl, args);

			// mysqlInitArgs.push('-h','localhost','-u','root','-P',port,`--connect-timeout=15`,'-e',
			// `ALTER USER 'root'@'localhost' IDENTIFIED BY 'khost'; UPDATE mysql.user SET Host='%' WHERE Host='localhost' AND User='root'; FLUSH PRIVILEGES;`);
			// mysqlInitArgs.push('-h','localhost','-u','root','-P',port,`--connect-timeout=15`,'-e',`ALTER USER 'root'@'localhost' IDENTIFIED BY 'khost'; FLUSH PRIVILEGES;`);
			// mysqlInitArgs.push('-h','localhost','-u','root','-P',port,`--connect-timeout=15`,'-e',`ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password AS 'khost'; FLUSH PRIVILEGES;`);
			// execFile(this.binary.mysql,mysqlInitArgs,{
			// 	cwd : this.folder
			// },async (error, stdout, stderr)=>{
			// 	if(error) {
			// 		this.log("Error configuring mysql".brightRed);
			// 		this.log(error);
			// 	}
			///////////////////////////////////

			execFile(this.binary.pg_ctl, args, {
				cwd : this.folder
			}, (error,stdout,stderr) => {
				if(error) {
					this.log("Error configuring mysql".brightRed);
					this.log(error);
				}			
				
				// this.log('MySQL shutdown posted...');
				// this.proc.terminate();
			})
		})
	}
}

