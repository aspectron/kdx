#!/usr/bin/env node
'use strict';

// KDX `rpc` console command: a thin CLI over the node RPC surface. It drives
// the kaspa WASM SDK wRPC RpcClient (Borsh) -- the same client object the node
// monitor and wallet use -- so KDX carries no gRPC client. Each invocation
// connects, issues one method call with JSON arguments, prints the result, and
// disconnects.

const fs = require('fs');
const { Command, Option } = require('commander');
const { loadKaspaSdk } = require('./lib/kaspa-wasm-loader');
const pkg = require('./package.json');

// KDX network arg -> SDK networkId, mirroring lib/interfaces/kaspad.js
// resolveNetworkId and modules/controller/controller.js NETWORK_TO_ID.
const NETWORK_TO_ID = { mainnet: 'mainnet', testnet: 'testnet-10', devnet: 'devnet', simnet: 'simnet' };

// Function-valued RpcClient prototype members that are not request/response RPC
// calls: client lifecycle and serialization helpers.
const NON_RPC_METHODS = new Set([
	'constructor', 'free', 'toJSON', 'toString',
	'connect', 'disconnect', 'start', 'stop',
	'setResolver', 'setNetworkId', 'triggerAbort',
	'addEventListener', 'removeEventListener', 'clearEventListener', 'removeAllEventListeners'
]);

// Enumerate the node RPC methods the CLI can dispatch: own, function-valued
// members of the RpcClient prototype, excluding wasm-bindgen internals
// (underscore-prefixed), property getters (networkId, url, encoding, ...),
// lifecycle helpers, and the event-listener-based subscriptions.
function enumerateRpcMethods(RpcClient) {
	const proto = RpcClient.prototype;
	return Object.getOwnPropertyNames(proto).filter(name => {
		if (name.startsWith('_'))
			return false;
		if (NON_RPC_METHODS.has(name))
			return false;
		if (/^(subscribe|unsubscribe)/.test(name))
			return false;
		const desc = Object.getOwnPropertyDescriptor(proto, name);
		return desc && typeof desc.value === 'function';
	}).sort();
}

// wRPC responses carry bigint fields (blueScore, blockCount, ...); JSON.stringify
// cannot serialize bigint, so render them as decimal strings.
function bigintReplacer(key, value) {
	return typeof value === 'bigint' ? value.toString() : value;
}

const program = new Command();

class KaspaInterface {

	constructor(kaspa, methods) {
		this.kaspa = kaspa;
		this.methods = methods;
		this.rpc_ = null;
	}

	get options() {
		if (!this.options_)
			this.options_ = program.opts();
		return this.options_;
	}

	get networkId() {
		const { options } = this;
		const networkType = ['testnet', 'devnet', 'simnet'].filter(v => options[v] !== undefined).shift() || 'mainnet';
		return NETWORK_TO_ID[networkType];
	}

	// Build and connect a single wRPC RpcClient (Borsh) to the resolved endpoint,
	// memoized so one CLI invocation reuses one connection.
	async getRpc() {
		if (this.rpc_)
			return this.rpc_;
		const { RpcClient, Encoding } = this.kaspa;
		const { options } = this;
		let url;
		if (options.server)
			url = /^wss?:\/\//.test(options.server) ? options.server : `ws://${options.server}`;
		else
			url = `ws://127.0.0.1:${RpcClient.defaultPort(Encoding.Borsh, this.networkId)}`;
		const rpc = new RpcClient({ url, encoding: Encoding.Borsh });
		await rpc.connect();
		this.rpc_ = rpc;
		return rpc;
	}

	// Resolve request arguments from --file (JSON) or the -j/--json string.
	// Returns null on a load/parse error (the caller aborts the call).
	loadArgs(json) {
		if (this.options.file) {
			const file = this.options.file;
			if (!fs.existsSync(file)) {
				console.log('Unable to locate', file);
				return null;
			}
			try {
				return JSON.parse(fs.readFileSync(file, 'utf8'));
			} catch (ex) {
				console.log('Invalid JSON in', file, '-', ex.toString());
				return null;
			}
		}
		try {
			return JSON.parse(json || '{}');
		} catch (ex) {
			console.log('Invalid JSON arguments:', ex.toString());
			return null;
		}
	}

	async call(method, args) {
		if (this.options.verbose) {
			console.log('Calling:', method);
			console.log('Arguments:', JSON.stringify(args, bigintReplacer));
		}
		let rpc;
		try {
			rpc = await this.getRpc();
		} catch (ex) {
			console.log('RPC connection error:', ex && ex.toString ? ex.toString() : ex);
			return;
		}
		try {
			const result = await rpc[method](args);
			console.log(JSON.stringify(result, bigintReplacer, '    '));
		} catch (error) {
			console.log('Error:', error && error.toString ? error.toString() : error);
		} finally {
			try {
				await rpc.disconnect();
			} catch (ex) {
				// best-effort disconnect on a one-shot CLI
			}
		}
	}

	async main() {
		program
			.version(pkg.version, '--version')
			.description(`Kaspa wRPC client ${pkg.version}`)
			.usage('[options] <RPC method> [--json <json>]')
			.option('--verbose', 'display arguments and additional info')
			.addOption(new Option('--testnet', 'use testnet network').hideHelp())
			.option('--server <url>', 'use a custom wRPC server (ws://host:port)')
			.option('--file <filename>', 'read JSON arguments from file');

		program.addHelpText('after', '\nRun `rpc help` to list the available RPC methods.\n');

		program
			.command('run')
			.description('call an RPC method with raw JSON arguments: run -m <method> -j <json>')
			.option('-m, --method <method>', 'rpc method name')
			.option('-j, --json <json>', "rpc request args as json string, default '{}'")
			.action(async (cmd) => {
				const method = cmd.method || '';
				if (!this.methods.includes(method)) {
					console.log('Invalid method:', method || '(none)');
					return;
				}
				const args = this.loadArgs(cmd.json);
				if (args === null)
					return;
				await this.call(method, args);
			});

		program
			.command('help')
			.description('list available RPC methods')
			.action(() => {
				console.log('');
				console.log(`Kaspa wRPC client ${pkg.version}`);
				console.log('');
				console.log('Available RPC methods:');
				this.methods.forEach(method => console.log(`  ${method}`));
				console.log('');
			});

		this.methods.forEach(method => {
			program
				.command(method, { hidden: true })
				.option('-j, --json <json>', "rpc request args as json string, default '{}'")
				.action(async (cmd) => {
					const args = this.loadArgs(cmd.json);
					if (args === null)
						return;
					await this.call(method, args);
				});
		});

		await program.parseAsync(process.argv);
	}

}

(async () => {
	const kaspa = await loadKaspaSdk();
	const methods = enumerateRpcMethods(kaspa.RpcClient);
	const ki = new KaspaInterface(kaspa, methods);
	await ki.main();
	process.exit(0);
})();
