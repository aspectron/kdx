const os = require('os');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const { execFileSync } = require('child_process');
const { utils } = require("micro-fabric");
const Daemon = require('../daemon');
// const { WS_JSON_RPC } = os.hostname() == 'BROADWELL' ? require('../../../kstats') : require('kstats');

module.exports = class KasparovSyncd extends Daemon {
	constructor(manager, task) {
		super(manager, task);
		// console.log(task);
	}

	start() {

		return new Promise((resolve,reject) => {

			const {core, manager} = this;
			const env = core.env;

			// apiserver --dbname=kaspa --dbuser=root --dbpass=OqLWvd5po2(_ --rpcuser=user --rpcpass=pass --rpcserver=localhost:9000 --rpccert=rpc.cert


			// $ ./kasparovsyncd 
			//--rpcserver=localhost:16210 
			//--rpccert=path/to/rpc.cert 
			//--rpcuser=user 
			//--rpcpass=pass 
			//--dbuser=user 
			//--dbpass=pass 
			//--dbaddress=localhost:3306 
			//--dbname=kasparov 
			//--migrate 
			//--testnet

			// $ ./kasparovsyncd 
			//--rpcserver=localhost:16210 
			//--rpccert=path/to/rpc.cert 
			//--rpcuser=user 
			//--rpcpass=pass 
			//--dbuser=user 
			//--dbpass=pass 
			//--dbaddress=localhost:3306 
			//--dbname=kasparov 
			//--mqttaddress=localhost:1883 
			//--mqttuser=user 
			//--mqttpass=pass 
			//--testnet


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


			/*let peers = this.getPeers();
			if(!peers || !peers.length) {
				console.log(`No peers available for Kasparov - aborting...`.red.bold);
				return resolve();
			}

			// this.log('peers:', peers);
			
			const peerTargets = { };
			// FIFO - first to register gets priority
			peers.forEach((p) => { if(!peerTargets[p.type]) peerTargets[p.type] = p; });
			if(!peerTargets.kaspad || !peerTargets.mysql || !peerTargets.mqtt) {
				console.log(`Kasparovsyncd needs 3 peers [kaspad, mysql, mqtt] - bailing...`.brightRed);
				console.log('peerTargets:',peerTargets);
				return resolve();
			}

			// this.log('peerTargets:',peerTargets);

			let ip = this.getIPv4(peerTargets.kaspad.ip);
			let port = (this.globals.kaspad.ports.rpc+peerTargets.kaspad.seq);
			args['rpcserver'] = `${ip}:${port}`;

			ip = this.getIPv4(peerTargets.mysql.ip);
			port = (this.globals.mysql.ports.client+peerTargets.mysql.seq);
			args['dbaddress'] = `${ip}:${port}`;
			
			ip = this.getIPv4(peerTargets.mqtt.ip);
			port = (this.globals.mqtt.ports.base+peerTargets.mqtt.seq);
			args['mqttaddress'] = `${ip}:${port}`;
			*/
			
			args['rpccert'] = path.join(manager.dataFolder, 'rpc.cert');

			args = Object.entries(args);
			dpc(2500, () => {

				let initFile = path.join(this.folder, '.init');
				if(!fs.existsSync(initFile)) {
					let migrateArgs = ['--migrate'].concat(args.map(([k, v]) => {
						return (v === undefined ? `--${k}` : `--${k}=${v}`);
					}));
					// this.log('executing --migrate');
					// this.log(migrateArgs);
					let stdout = execFileSync(this.getBinary('kasparovsyncd'), migrateArgs, {
						cwd : path.join(this.core.getBinaryFolder(), 'database')
					});
					this.log(stdout.toString());
					// this.log('--migrate done...');
					fs.writeFileSync(initFile, '');
				}

				this.initProcess({
					cwd : path.join(this.core.getBinaryFolder(), 'database'),
					args : () => {
						return [
							this.getBinary('kasparovsyncd'),
							//`--cert=${rpcCertFile}`
						].concat(args.map(([k, v]) => {
							return (v === undefined ? `--${k}` : `--${k}=${v}`);
						}));
					}
				})
				this.proc.mute = true;
				this.proc.run();
				resolve();
			});
		});
	}
}


