const fs = require('fs');
const path = require('path');
const utils = require("../utils");
const Daemon = require('../daemon');

module.exports = class TxGen extends Daemon {

	async start() {

		let defaults = {
			// address="127.0.0.1:18334"
			"private-key" : "5y3R29c7Xzf4gj6BihFCrfvY86cQEX2s17uhCySKnC1j",
			"secondary-address" : 'kaspatest:przhjdpv93xfygpqtckdc2zkzuzqeyj2pgg3hlfnac',//"kaspadev:qz6r0jpu99k66danpkeh9sny82uux0npdujend59qx",
			"num-outputs": 1,
			"num-inputs": 1,
			"payload-size": 20,
			"gas-fraction": 0.05,
			"fee-rate": 5,
		}

		let args = { };

		(this.task.args || []).forEach((p) => {
			let [k,v] = p.split('=');
			args[k] = v;
		})

		let peers = this.getPeers();
		if(!peers) {
			console.log(`No peers available for TXGEN - bailing...`.red.bold, peer);
			return null;
		}

		let peer = peers.shift();
		let ip = this.getIPv4(peer.ip);
		// TODO - USE CONFIG DATA IN TXGEN
		let port = (this.globals.kaspad.ports.rpc+this.task.seq);
		args['address'] = `${ip}:${port}`;

		args = Object.entries(Object.assign(defaults, args)).map((o) => {
			const [k,v] = o;
			return {k,v};
		});

		await this.VSARGS([this.getBinary('txgen'),'--version']);
		
		const rpcCertFile = path.join(this.manager.appFolder,'rpc.cert');

		dpc(2500, () => {
			this.run({
				args : () => {
					return [
						this.getBinary('txgen'),
						`--cert=${rpcCertFile}`
					].concat(args.map((p) => {
						return (p.v === undefined ? `--${p.k}` : `--${p.k}=${p.v}`);
					}));
				}
			})
		})
	}
}

