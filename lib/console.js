const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const utils = require('./utils');
const pkg = require('../package');
const du = require('du');

class Console {

    constructor(controller, terminal) {
        this.controller = controller;
        this.manager = controller.manager;
        this.terminal = terminal;
        this.handlers = { };
        terminal.registerSink(this);

        this.appFolder = this.manager.appFolder;
        this.binFolder = path.join(this.appFolder,'bin',utils.platform);
        this.walletBin = path.join(this.binFolder,'wallet'+(utils.platform == 'windows-x64'?'.exe':''));

        terminal.write(`KDX console v${pkg.version}\r\n\r\ntype 'help' for usage information\n`);
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

    async du(...args) {
        let tasks = [...this.manager.tasks];
        let width = tasks.reduce((p,task)=>{ return Math.max(p||0,task.key.length); }) + 1;
        console.log
        let total = 0;
        while(tasks.length) {
            let task = tasks.shift();
            if(!task.impl) {
                this.log((task.key+':').padStart(width),'N/A'.padStart(12));
                continue;
            }

            let bytes = await task.impl.du();
            total += bytes;
            this.log((task.key+':').padStart(width),bytes.toFileSize().padStart(12));
        }
        this.log(('total:').padStart(width),total.toFileSize().padStart(12));
    }

    "demo-wallet"() {

        if(!fs.existsSync(this.walletBin))
            return Promise.reject(`wallet executable not found`);
        this.isWalletEnabled = true;
        this.terminal.write('demo wallet is accessible'.brightGreen);
    }

    getKasparovTasks() {
        return this.manager.tasks.filter(t=>t.type=="kasparovd");
    }

    getKasparovsyncTasks() {
        return this.manager.tasks.filter(t=>t.type=="kasparovsyncd");
    }

    getKasparovAddress() {
        let cfg = this.getKasparovTasks().shift();
        if(!cfg)
            return Promise.reject(`kasparov is not instantiated`);
        if(!cfg.args)
            return Promise.reject(`kasparov configuration has no args object`);
        if(!cfg.args.listen)
            return Promise.reject(`kasparov configuration arguments have no 'listen' property`);
        let address = `http://${cfg.args.listen}`;
        return Promise.resolve(address);
    }

    async wallet(...args) {
        // if(!this.isWalletEnabled)
        //     return Promise.reject(`Please use 'demo-wallet' command to enable use of the demo wallet`);

        let cmd = args.shift();
        switch(cmd) {
            case 'balance': {
                let kasparov = await this.getKasparovAddress();
                let [address] = args;
                if(!address)
                    return Promise.reject('usage: wallet balance <address>');
                this.log(this.walletBin,'balance',`/kasparov-address:${kasparov}`,`/address:${address}`);
                return this.spawn(this.walletBin,['balance',`/kasparov-address:${kasparov}`,`/address:${address}`]);
            } break;
            case 'send': {
                let kasparov = await this.getKasparovAddress();
                let [private_key,to_address,amount] = args;
                if(!private_key || !to_address)
                    return Promise.reject('usage: wallet balance <private-key> <to-address>');
                return this.spawn(this.walletBin,['balance',`/kasparov-address:${kasparov}`,`/private-key:${private_key}`,`/to-address:${to_address}`,`/send-amount:${amount}`]);
            } break;
            case 'create': {
                return this.spawn(this.walletBin,['create']);
            } break;
            default: {
                return this.help('wallet');
            } break;
        }
    }

    async migrate(cmd) {

        const kasparovsyncdBin = path.join(this.binFolder,'kasparovsyncd'+(process.platform == 'win32' ? '.exe' : ''));
        if(!fs.existsSync(kasparovsyncdBin)) {
            this.log(`error: unable to locate ${kasparovBin}`.red);
            return Promise.reject(`error: kasparov executable not found`);
        }

        let tasks = this.getKasparovsyncTasks();
        if(!tasks.length)
            return Promise.reject(`no kasparovsync tasks detected`);
        //let folders = tasks.map(task => task.impl.folder);
        let argsList =  tasks.map(task => {
        //    task.impl.options

            let args = (typeof task.impl.options.args  == 'function') ? task.impl.options.args().slice() : task.impl.options.args.slice();
            return args;


        });
        
        tasks.forEach(task => task.impl.terminate());

        // let dc = this.manager.getDC();
        // await this.manager.stop();

        // await utils.spawn(this.getBinary('kasparovsyncd'), migrateArgs, {
        //     cwd : path.join(this.getBinaryFolder(), 'database'),
        //     stdout : (data) => this.writeToSink(data)
        // });



        while(argsList.length) {
            let args = argsList.shift().slice();
            
            // this.log(args.shift(),['--migrate', ...args]);
            await this.spawn(kasparovsyncdBin,['--migrate', ...args], { 
                cwd : path.join(this.binFolder,'database')
            });
        }

        //await this.manager.start(dc);
        tasks.forEach(task => task.impl.run());

    }


    async purge(cmd) {
        if(cmd != 'everything')
            return Promise.reject(`To confirm, please enter "purge everything" command`);

        let dc = this.manager.getDC();
        await this.manager.stop();
        await fse.remove(this.manager.dataFolder);
        await mkdirp(this.manager.dataFolder);
        await this.manager.start(dc);
    }

    help(term) {
        switch(term) {
            default: {

                this.terminal.write(`
Supported commands:\r
\r
stop [type|id]\r
start [type|id]\r
kasparov migrate\r
wallet <create|send|balance>\r
build - rebuild kaspa node\r
                `)

            } break;
        }
    }

    build(...args) {
        return this.spawn(process.argv[0], [path.join(this.appFolder,'build','build.js'), ...args], {
            cwd : path.join(this.appFolder,'build')
        });         

    }

    async stop(ident) {
        if(ident) {
            let tasks = this.manager.tasks.filter(task => { return [task.type, task.id].includes(ident); });
            let jobs = tasks.map(t => t.impl.terminate());
            await Promise.all(jobs);
            this.log(`${jobs.length} service${jobs.length == 1 ? '' : 's'} stopped`);
            return Promise.resolve();
        } 
        else
            return this.manager.stop();
    }

    async start(ident) {
        if(ident) {
            let tasks = this.manager.tasks.filter(task => { return [task.type, task.id].includes(ident); });
            let jobs = tasks.map(t => t.impl.run());
            await Promise.all(jobs);
            this.log(`${jobs.length} service${jobs.length == 1 ? '' : 's'} started`);
            return Promise.resolve();
        }
        else
            return this.manager.start();
    }

    spawn(proc, args, opts) {
        console.log('CONSOLE SPAWN',proc,args);
        return utils.spawn(proc, args, {
            stdout : (data) => { this.terminal.term.write(data.toString().replace(/\n/g,'\r\n')); return data; },
            ...opts
        })
    }

    log(...args) {
        this.terminal.write(...args);
    }
}

module.exports = Console;