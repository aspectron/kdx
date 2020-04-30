const os = require('os');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const { execFileSync } = require('child_process');
const utils = require("../utils");
const Daemon = require('../daemon');
// const { WS_JSON_RPC } = os.hostname() == 'BROADWELL' ? require('../../../kstats') : require('kstats');

module.exports = class KasparovSyncd extends Daemon {

	start() {

		return new Promise(async (resolve,reject) => {

			const {manager} = this;


			let logsFolder = path.join(this.folder,'logs');
			mkdirp.sync(logsFolder);

			let defaults = {
				logdir:     logsFolder, // Directory to log output. (default:
								// C:\Users\aspect\AppData\Local\Apiserver)
				rpcuser: 	'user', // RPC username
				rpcpass: 	'pass', // RPC password
				//-rpcserver: 	'', // RPC server to connect to
				//-rpccert: 	'', // RPC server certificate chain for validation

				//-notls: 		'', // Disable TLS
				//-dbaddress: 	'', // Database address (default: localhost:3306)
				dbuser: 	'kaspa', // Database user
				dbpass: 	'kaspa', // Database password
				dbname: 	'kasparov', // Database name
				//listen: 	'', // HTTP address to listen on (default: 0.0.0.0:8080)
								// (default: 0.0.0.0:8080)
				//migrate: 	'', // Migrate the database to the latest version. The server
								// will not start when using this flag.
				// mqttaddress: '', // MQTT broker address
				//mqttuser: 	'mqtt', // MQTT server user
				//mqttpass: 	'mqtt', // MQTT server password
				testnet: 	undefined, // Use the test network
				//regtest: 	'', // Use the regression test network
				//simnet: 	'', // Use the simulation test network
				//devnet: 	'', // Use the development test network
			}

			let args = Object.assign(defaults, this.task.args||{});

			
			args['rpccert'] = path.join(manager.dataFolder, 'rpc.cert');


			args = Object.entries(args);
			dpc(2500, async () => {

				let initFile = path.join(this.folder, '.init');
				if(!fs.existsSync(initFile)) {
					let migrateArgs = ['--migrate'].concat(args.map(([k, v]) => {
						return (v === undefined ? `--${k}` : `--${k}=${v}`);
					}));
					// this.log('executing --migrate');
					// this.log(migrateArgs);

					await utils.spawn(this.getBinary('kasparovsyncd'), migrateArgs, {
						cwd : path.join(this.getBinaryFolder(), 'database'),
						stdout : (data) => this.writeToSink(data)
					});

					// let stdout = execFileSync(this.getBinary('kasparovsyncd'), migrateArgs, {
					// 	cwd : path.join(this.getBinaryFolder(), 'database')
					// });
					// this.log(stdout.toString());
					// this.log('--migrate done...');
					fs.writeFileSync(initFile, '');
				}

				await this.VSARGS([this.getBinary('kasparovsyncd'),'--version']);

				this.run({
					cwd : path.join(this.getBinaryFolder(), 'database'),
					args : () => {
						return [
							this.getBinary('kasparovsyncd'),
							//`--cert=${rpcCertFile}`
						].concat(args.map(([k, v]) => {
							return (v === undefined ? `--${k}` : `--${k}=${v}`);
						}));
					}
				})
				this.mute = true;
				resolve();
			});
		});
	}
}


