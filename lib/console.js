const fs = require('fs');
const path = require('path');
const utils = require('./utils');

class Console {

    constructor(controller, terminal) {
        this.controller = controller;
        this.manager = controller.manager;
        this.terminal = terminal;
        this.handlers = { };
        terminal.registerSink(this);

        this.walletBin = path.join(this.manager.appFolder,'bin',utils.platform,'wallet'+(utils.platform == 'windows-x64'?'.exe':''));


        terminal.write("KDX Console\n");

    }

	complete() {}

	digest(cmd) {
		return new Promise((resolve,reject) => {
			let args = cmd.split(/\s+/);
			let op = args.shift();
			if(!op)
				return Promise.resolve();

            if(/digest|complete/i.test(op))
                return reject(`digest/complete keywords are not allowed`);

            const handler = this[op] || this.handlers[op];
            
            if(!handler) {
                let taskMap = { }
                this.manager.tasks.forEach((task) => {
                    console.log(`testing task [${task.id}]:`,task);
                    taskMap[task.id] = task;
                });

                console.log('tasking op:',op);
                if(taskMap[op]) {
                    console.log("found matching task!", taskMap[op]);
                    return Promise.resolve(`${op}: found matchin task`);
                }
            }



			if(!handler) {
				reject(`${op}: unknown command`);
				return;
			}

			let ret = handler.call(this, ...args);
			if(ret && ret.then && typeof ret.then == 'function') {
				ret.then(resolve).catch(reject);
			}
			else {
				resolve();
			}
		})
	}
	
	echo(...args) { return Promise.resolve(`echo returns text`.red); }
	test(...args) { 
        this.terminal.write('writing to terminal...'); 
    }

    "demo-wallet"() {

        if(!fs.existsSync(this.walletBin))
            return Promise.reject(`wallet executable not found`);
        this.isWalletEnabled = true;
        this.terminal.write('Demo Wallet is accessible');
    }

    async wallet(...args) {
        // if(!this.isWalletEnabled)
        //     return Promise.reject(`Please use 'demo-wallet' command to enable use of the demo wallet`);

        let cmd = args.shift();
        switch(cmd) {
            case 'balance': {
                let [address] = args;
                return this.spawn(this.walletBin,['balance',`/kasparov-address:${kasparov}`]);

            } break;
            case 'send': {
                let [key,address,amount] = args;
            } break;
            case 'create': {
                return this.spawn(this.walletBin,['create']);
            } break;
            default: {
                return this.help('wallet');
            } break;
        }


        //await this.spawn(this.walletBin,['/?']);
    }

    help() {

    }

    ls() {

    }

    build() {

    }

    stop() {

    }

    start() {
        
    }

    spawn(proc, args, opts) {
        
        return utils.spawn(proc, args, {
            stdout : (data) => { this.terminal.term.write(data.toString().replace(/\n/g,'\r\n')); return data; },
            ...opts
        })
    }
}

module.exports = Console;