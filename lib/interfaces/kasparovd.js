const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const mkdirp = require('mkdirp');
const { execFileSync } = require('child_process');
const utils = require("@aspectron/flow-utils");
const { dpc } = require('@aspectron/flow-async');
const Daemon = require('../daemon');
// const { WS_JSON_RPC } = os.hostname() == 'BROADWELL' ? require('../../../kstats') : require('kstats');

module.exports = class Kasparov extends Daemon {

	start() {
		return new Promise(async (resolve,reject) => {

			const {manager} = this;

			// apiserver --dbname=kaspa --dbuser=root --dbpass=OqLWvd5po2(_ --rpcuser=user --rpcpass=pass --rpcserver=localhost:9000 --rpccert=rpc.cert


			//	./kasparovd 
			//--rpcserver=localhost:16210 
			//--rpccert=path/to/rpc.cert 
			//--rpcuser=user 
			//--rpcpass=pass 
			//--dbuser=user 
			//--dbpass=pass 
			//--dbaddress=localhost:3306 
			//--dbname=kasparov 
			//--testnet

			let logsFolder = path.join(this.folder, 'logs');
			fs.ensureDirSync(logsFolder);

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
				//mqttaddress:'', // MQTT broker address
				//mqttuser: 	'', // MQTT server user
				//mqttpass: 	'', // MQTT server password
				testnet: 	undefined, // Use the test network
				//regtest: 	'', // Use the regression test network
				//simnet: 	'', // Use the simulation test network
				//devnet: 	'', // Use the development test network
			}

			let args = Object.assign(defaults, this.task.args || {});

			/*let peers = this.getPeers();
			if(!peers || !peers.length) {
				console.log(`No peers available for Kasparov - aborting...`.red.bold);
				return resolve();
			}

			//this.log('peers:', peers);
			const peerTargets = { };
			// FIFO - first to register gets priority
			peers.forEach((p) => { if(!peerTargets[p.type]) peerTargets[p.type] = p; });
			if(!peerTargets.kaspad || !peerTargets.mysql) {
				console.log(`Kasparov needs 2 peers [kaspad, mysql] - bailing...`.brightRed);
				return resolve();
			}

			// this.log('peerTargets:',peerTargets);
			let ip = this.getIPv4(peerTargets.kaspad.ip);
			let port = (this.globals.kaspad.ports.rpc+peerTargets.kaspad.seq);
			args['rpcserver'] = `${ip}:${port}`;

			ip = this.getIPv4(peerTargets.mysql.ip);
			port = (this.globals.mysql.ports.client+peerTargets.mysql.seq);
			args['dbaddress'] = `${ip}:${port}`;
			*/
			
			args['rpccert'] = path.join(manager.dataFolder, 'rpc.cert');

			this.manager.registerString(this,'address',null,args.listen);
			// this.manager.registerString(this,'address','HTTP',args.listen);


			args = Object.entries(args);
			
			await this.VSARGS([this.getBinary('kasparovd'),'--version']);

			dpc(2500, () => {
				

				this.run({
					cwd : path.join(this.getBinaryFolder(), 'database'),
					args : () => {
						return [
							this.getDeployableBinary('kasparovd'),
							//`--cert=${rpcCertFile}`
						].concat(args.map(([k, v]) => {
							return (v === undefined ? `--${k}` : `--${k}=${v}`);
						}));
					}
				});
				//this.mute = false;
				//this.proc.run();
				resolve();
			})
		})
	}
}


