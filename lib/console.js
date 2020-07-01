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
        
        //this.walletBin = path.join(this.binFolder,'wallet'+(utils.platform == 'windows-x64'?'.exe':''));
        

        terminal.write(`KDX console v${pkg.version}\r\n\r\ntype 'help' for usage information\n`);


        terminal.registerLinkHandler(controller.handleBrowserLink);
    }

	// getDeployableBinary(...args) {
	// 	let buildType = this.controller.buildType || 'generic';
	// 	switch(buildType) {
	// 		case 'generic': {
	// 			return path.join(this.manager.getBinaryFolder(), ...args)+this.PLATFORM_BINARY_EXTENSION;
	// 		}
			
	// 		case 'local': {
	// 			return path.join(os.homedir(),'.kdx','bin',utils.platform, ...args)+this.PLATFORM_BINARY_EXTENSION;
	// 		}			
	// 	}
    // }
    
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
                let task = taskMap[op];
                if(task) {
                    console.log("found matching task!", task);
                    
                    let instr = args.shift();
                    if(!instr)
                        return reject(`usage: ${op} <function> [space separated args]`);

                    let params;
                    try {
                        params = args.map(v=>JSON.parse(v));
                    } catch(ex) {
                        return reject(`unable to parse rpc call arguments: ${ex.toString()}`);
                    }

                    task.impl.rpc.call(instr, params).then((resp) => {
                        let text = ((typeof resp == 'string') ? resp : JSON.stringify(resp,null,'  ')).replace(/\n/g,'\n\r');
                        resolve(text);
                    }, (err) => {
                        reject(err.toString());
                    })

                    // return resolve(`${op}: found matchin task`);
                    return;
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

    set(...args) {
        let [k,v] = args;
        if(!k)
            this.log(`\r\nbuild type is '${this.controller.buildType}'\r\n`);

        if(!k || !v)
            return Promise.reject(`use 'set <key> <value>' to change settings`);

        switch(k) {
            case 'build': {
                if(!['generic','local'].includes(v))
                    return Promise.reject(`value must be 'generic' or 'local'`);
                this.controller.setBuildType(v);
                return Promise.resolve(`setting build type to '${v}'`);
            } break;

            default: {
                return Promise.reject(`unknown setting: ${k}`);
            }
        }

        // TODO - STORE IN CONFIG
        
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

    // "demo-wallet"() {

    //     if(!fs.existsSync(this.walletBin))
    //         return Promise.reject(`wallet executable not found`);
    //     this.isWalletEnabled = true;
    //     this.terminal.write('demo wallet is accessible'.brightGreen);
    // }

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

        let walletBin = this.manager.getDeployableBinary('wallet');

        let cmd = args.shift();
        switch(cmd) {
            case 'balance': {
                let kasparov = await this.getKasparovAddress();
                let [address] = args;
                if(!address)
                    return Promise.reject('usage: wallet balance <address>');
                //this.log(walletBin,'balance',`/kasparov-address:${kasparov}`,`/address:${address}`);
                //return this.spawn(walletBin,['balance',`/kasparov-address:${kasparov}`,`/address:${address}`]);
                return this.spawn(walletBin,['balance',`--kasparov-address=${kasparov}`,`--address=${address}`]);
            } break;
            case 'send': {
                let kasparov = await this.getKasparovAddress();
                let [private_key,to_address,amount] = args;
                if(!private_key || !to_address)
                    return Promise.reject('usage: wallet balance <private-key> <to-address>');
                return this.spawn(walletBin,['balance',`--kasparov-address=${kasparov}`,`--private-key=${private_key}`,`--to-address=${to_address}`,`--send-amount=${amount}`]);
            } break;
            case 'create': {
                return this.spawn(walletBin,['create']);
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
stop    - stop all daemons\r
start   - start all daemons\r
restart - restart all daemons\r
du      - display current storage utilization\r
migrate - upgrades Kasparov database schema\r
build   - rebuild kaspa node\r
wallet  <create|send|balance>\r
set     - configure a property:\r
          'set build <type>' - where <type> is 'generic' or 'local'\r
          (generic - included with KDX release; local - local Kaspa build)
\r
You can use kaspad instance name to make rpc calls.\r
example: 'kd0 help' or 'kd0 getinfo'\r
                `)

            } break;
        }
    }

    build(...args) {
        return new Promise((resolve, reject) => {

            this.spawn(process.argv[0], [path.join(this.appFolder,'build','build.js'), ...args], {
                cwd : path.join(this.appFolder,'build')
            }).then(()=>{
                let target = this.manager.getDeployableBinary('kaspad');
                if(fs.existsSync(target)) {
                    this.log(`setting build type to 'local'`);
                    this.set('build','local').then(resolve, reject);
                }
            }, reject)        
        })

    }

    ls(...args) {
        const tasks = this.manager.tasks;


    }

    restart() {
        this.controller.restartDaemons();
    }

    async stop(ident) {
        if(ident) {
            let tasks = this.manager.tasks.filter(task => { return [task.type.toLowerCase(), task.id.toLowerCase()].includes(ident.toLowerCase()); });
            let jobs = tasks.map(t => t.impl.terminate());
            await Promise.all(jobs);
            this.log(`${jobs.length} service${jobs.length == 1 ? '' : 's'} stopped`);
            return Promise.resolve();
        } 
        else
            return this.controller.stopDaemons();
    }

    async start(ident) {
        if(ident) {
            let tasks = this.manager.tasks.filter(task => { return [task.type.toLowerCase(), task.id.toLowerCase()].includes(ident.toLowerCase()); });
            let jobs = tasks.map(t => t.impl.run());
            await Promise.all(jobs);
            this.log(`${jobs.length} service${jobs.length == 1 ? '' : 's'} started`);
            return Promise.resolve();
        }
        else
            return this.controller.initDaemons();
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