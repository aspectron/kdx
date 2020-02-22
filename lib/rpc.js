const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { EventEmitter } = require('events');

const VERSION = '1.0';

class WS_JSON_RPC extends EventEmitter {
	constructor(core, ident) {
		super();
		this.core = core;
		this.ident = ident;
		this.seq = 0;
		// on connect, calls 'help' to obtain list of all
		// commands and creates a lowercase to original map
		// this allows to normalize case for all api calls
		this.dict = { }
		this.NO_CASE = true;
		this.reconnect = true;
		this.lastErrorPostTS = 0;
	}

	connect(uri, options) {
		// console.log(`RPC[${this.ident}] websocket connecting to:`.yellow.bold,`${uri}`.bold);
		this.reconnect = true;

		const reject_ = this.core.flags['tls-reject-unauthorized'] === undefined ? false : JSON.parse(this.core.flags['tls-reject-unauthorized']);

		options = {
			rejectUnauthorized : reject_
		};

		const certfile = this.core.flags['rpc-cert'];
		if(certfile) {
			if(!fs.existsSync(certfile)) {
				console.log(`ERROR unable to locate certificate file:`.red.bold,certfile.bold);
				process.exit(1);
			}

			options.ca = [ fs.readFileSync(certfile) ];
		}


		// console.log("Ws Options".blue.bold,options);
		this.ws = new WebSocket(uri, options);
		this.ws.on('message', (...args) => { this.handleMessage(...args); });
		this.ws.on('open', (...args) => { 
			console.log(`RPC[${this.ident}] websocket connected to`.yellow.bold,`${uri}`.bold);

			if(this.NO_CASE) this.call('help',[],(err, data)=>{
				if(err)
					return console.log("RPC unable to create dict:".red.bold,err);

				this.dict = { };
				data.split('\n')
				.map(l => l.split(/\s+/).shift())
				.filter(l=>l)
				.forEach(t => this.dict[t.toLowerCase()] = t);
			})
				
			this.emit('ws:open', ...args);
		});
		this.ws.on('error', (error) => { 
			const ts = Date.now();
			if(this.core.flags.verbose || ts - this.lastErrorPostTS > 60 * 1e3) {
				this.lastErrorPostTS = ts;
				console.log(`RPC[${this.ident}] error`.red.bold,(error||'N/A').toString().red.bold);
			}
			this.emit('ws:error',error); 
		});
		this.ws.on('close', (code, msg) => { 
			if(this.core.flags.verbose)
				console.log("close".magenta.bold,code,msg);
			this.emit('ws:close', code, msg); 

			if(this.reconnect) {
				dpc(1500, () => {
					this.connect(uri,options);
				})
			}
		});
	}

	async call(...args) {

		if(typeof args[args.length-1] == 'function')
			return this.call_(...args);

		return new Promise((resolve, reject) => {
			const callback = typeof(args[args.length-1]) == 'function' ? args.pop() : (err, result) => {
				return err ? reject(err) : resolve(result);
			};

			this.call_(...args,callback);
		})
	}

	call_(...args) {

		let [method, params, callback] = args;
		if(!callback && typeof(params) == 'function') {
			callback = params;
			params = [ ];
		}

		if(this.ws.readyState !== WebSocket.OPEN)
			return callback('this.ws.readyState !== WebSocket.OPEN');

		// console.log("WebSocket Ready State:".cyan.bold,this.ws.readyState,'Connecting:', WebSocket.CONNECTING);
		// if(this.ws.readyState === WebSocket.CONNECTING) {
		// 	this.once('ws:open', () => {
		// 		this.call_(...args);
		// 	})
		// }
		// else {
		const id = ++this.seq;
		const msg = JSON.stringify({ jsonrpc : VERSION, id, method : this.dict[method] || method, params });
		this.ws.send(msg, (err) => {
			if(err)
				return callback(err);
			if(method == 'stop')
				return callback();
			else
				this.once(`res:${id}`, callback);
		})
		// }
	}

	close() {
		this.reconnect = false;
		if(this.ws) { 
			this.ws.close();
			delete this.ws;
		}
	}

	handleMessage(msg) {
		let { id, error, result, method, params } = JSON.parse(msg);
		if(error) {
			// console.log(error);
			// console.log(error.toString().red.bold);
		}
		if (id != null) {
			if (error != null) {
				return this.emit('res:' + id, this.toError(error));
			} else {
				return this.emit('res:' + id, null, result);
			}
		} 
		else if (error != null) {
			return this.emit('error', this.toError(error));
		} else if (method != null) {
			return this.emit(method, ...params);
		} else {
			return this.emit('error', new Error('Invalid message: ' + msg));
		}	
	}

	toError(data) {
		if(!data)
			return null;
		const error = new Error(data.message);
		error.code = data.code;
		return error;
	}

    registerMethods(methods) {
    	methods.forEach((method) => {
    		this[method] = (...args) => {
    			return this.call(method, ...args);
    		}
    	})
    }
}

module.exports = {
	WS_JSON_RPC
}