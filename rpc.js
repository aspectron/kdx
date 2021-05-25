#!/usr/bin/env node
const fs = require('fs');
const { Command, Option } = require('commander');
const { RPC } = require('@kaspa/grpc-node');
const pkg = require('./package.json');
const { fstat } = require('fs');
const { colors } = require('@aspectron/colors.ts');
const { Logger, FlowLogger } = require('@aspectron/flow-logger');
const NATS = require('nats');
const jc = NATS.JSONCodec();
const log = new FlowLogger('RPC');

const networks = {
    mainnet: { port: 16110 },
    testnet: { port: 16210 },
    simnet: { port: 16510 },
    devnet: { port: 16610 }
};

const program = new Command();

class KaspaInterface {

	get options() {
		if(!this.options_) {
            this.options_ = program.opts();
			// Object.entries(this._options).forEach(([k,v])=>{ if(v === undefined) delete this._options[k]; });
		}
		return this.options_;
	}

	get network() {
        const { options } = this;
        
        let network = 'mainnet';
        Object.entries(options).forEach(([k,v])=>{ 
            if(v === undefined) 
                delete options[k]; 
            else
            if(networks[k])
                network = k;
        });
        return network;
	}

	get rpc() {
		if(this.rpc_)
			return this.rpc_;
		const { network } = this;
		const { port } = networks[network]; //Wallet.networkTypes[network];
        const { options } = this;
        const host = options.server || `127.0.0.1:${port}`;
        this.rpc_ = new RPC({ clientConfig:{ host, reconnect : false, verbose : false,  disableConnectionCheck : true  } });
		// this.rpc_.onConnectFailure((reason)=>{
		// 	const msg = `gRPC - no connection to ${Wallet.networkTypes[network].name} at ${host} (${reason})`;
    	// 	console.log('');
		// 	console.log(msg);
		// });
		return this.rpc_;
	}

    getProto() {
        const rpc = new RPC({ clientConfig:{disableConnectionCheck : true } });
        rpc.disconnect();
        return rpc.client.proto;
    }

    async main() {
        const proto = this.getProto();
        const methods = proto.KaspadMessage.type.field
            .filter(({name})=>/request/i.test(name));

        if(process.argv.includes('--verbose'))
            log.enable('verbose');

        program
            .version(pkg.version,'--version')
            .description(`Kaspa gRPC client ${pkg.version}`)
            .usage('[options] <gRPC method> [gRPC method options]')
            .option('--verbose','display arguments and additional info')
            .addOption(new Option('--testnet','use testnet network').hideHelp())
//            .option('--testnet','use testnet network').hide()
            // .option('--devnet','use devnet network')
            // .option('--simnet','use simnet network')
            //.option('--server <host>:<port>','use custom gRPC server')
            //.option('--subscribe','create a subscription channel')
            .option('--file <filename>','read arguments from file')
            ;

        program.addHelpText('after',`
Please run ${'kaspa-rpc help'.yellow} for addition information and examples.        
        `)

        program
            .command('run')
            .description('call gRPC with raw JSON arguments "run -m <method> -j <json_data>" ')
            .option('-m, --method <method>', "rpc request")
            .option('-j, --json <json>', "rpc request args as json string, default will be '{}' ")
            .action(async (cmd, options) => {
                let {json='{}', method=''} = cmd;
                //console.log("cmd", cmd)
                if(!method){
                    console.log("Invalid method")
                    this.rpc.disconnect();
                }

                //console.log("method, json_data:", method, json_data)
                let args = JSON.parse(json)
                console.log("method, args:", method, args)

                console.log("\nCalling:", method)
                console.log("Arguments:\n", JSON.stringify(args, null, "  "))
                let result = await this.rpc.request(method, args)
                .catch(error=>{
                    console.log("Error:", error)
                })
                console.log("Result:\n", JSON.stringify(result, null, "  "))
                this.rpc.disconnect();
            });

        program
            .command('help')
            .description('list available gRPC commands and examples')
            .action(async (cmd, options) => {
                console.log('');
                console.log(`Usage: rpc [options] <gRPC method> [gRPC method options]`);
                console.log('');
                console.log(`Kaspa gRPC client ${pkg.version}`);
                console.log('');
                console.log('Following gRPC commands are available:');
                console.log('');
                let padding = methods.map(method=>method.name.replace(/Request$/,'').length).reduce((a,b)=>Math.max(a,b),0);
                console.log(`  ${"Method".padEnd(padding)}  Options`);
                console.log(`  ${"------".padEnd(padding)}  -------`);
                methods.forEach(method=>{
                    const {name, typeName} = method;
                    const fn = name.replace(/Request$/,'');
                    let fields = proto[typeName].type.field;
                    let opts = fields.map(f=>`--${f.name}`);

                    let descr = `  ${fn.padEnd(padding)}  ${opts.length?opts.join(' '):''}`;
                    console.log(descr);
                });
                0 && console.log(`
Please note, when supplying JSON formatted arguments, you must escape quotes.

Examples:

    Get additional help information on gRPC method:
    $ ${`rpc addPeer --help`.yellow}

    Get list of UTXOs for an address:
    $ ${`rpc --verbose getUtxosByAddresses --addresses=[\\"kaspatest:qru9nrs0mjcrfnl7rpxhhe33l3sxzgrc3ypkvkx57u\\"]`.yellow}

    Monitor DAG Blue Score:
    $ ${`rpc --subscribe notifyVirtualSelectedParentBlueScoreChanged`.yellow}

    Get list of UTXOs for an address (load address list from file):
    $ ${`rpc --verbose getUtxosByAddresses --args=file.js`.yellow}

    Where file.js can contain: ${`{ addresses : ['kaspatest:qru9nrs0mjcrfnl7rpxhhe33l3sxzgrc3ypkvkx57u'] }`.yellow}
    (note that the file uses JavaScript syntax and can contain comments or NodeJS code producing an Object)

`);
            });

        methods.forEach(method=>{
            const {name, typeName} = method;
            const fn = name.replace(/Request$/,'');
            let fields = proto[typeName].type.field;
            let opts = fields.map(f=>`--${f.name}`);
            let cmd = program.command(fn, { hidden : true }).description(opts.length?opts.join(' '):'');
            fields.forEach(f=>{
                cmd.option(`--${f.name} <${f.name}>`, `Request argument ${f.name} of ${f.type}, ${f.defaultValue ? `default value will be ${f.defaultValue}` : `by default this argument is absent`}`)
            })

            if(fields.length) {
                cmd.option(`--proto`,`show proto declaration for ${method}`, ()=>{
                    fields.forEach(f=>{
                        console.log(f);
                    })
                })
            }

            cmd.action(async (cmd, options) => {
                let args = {};

                fields.forEach(f=>{
                    if(cmd[f.name] !== undefined){
                        if(typeof cmd[f.name] == 'boolean')
                            args[f.name] = 1;
                            // args[f.name] = cmd[f.name] || 1;
                        else
                            args[f.name] = JSON.parse(cmd[f.name]);
                    }
                })

                if(this.options.file) {
                    let file = this.options.file;
                    if(!fs.existsSync(file)) {
                        console.log("Unable to locate",file);
                        process.exit(0);
                    }

                    let text = fs.readFileSync(file,'utf8');

                    try {
                        args = eval(`(${text})`);
                        if(typeof args != 'object') {
                            console.log("Args file must produce an object");
                            process.exit(0);
                        }
                    } catch(ex) {
                        console.log(ex.toString());
                    }
                }

                if(this.options.verbose) {
                    if(this.options.subscribe)
                        console.log("\nSubscribing:", name)
                    else
                        console.log("\nCalling:", name)
                    console.log("Arguments:\n", JSON.stringify(args, null, "  "))
                }

                if(this.options.subscribe) {
                    this.rpc.subscribe(name, args, (data) => {
                        console.log(data);
                    })
                    .catch(error=>{
                        console.log("Error:", error.toString())
                        this.rpc.disconnect();
                    })

                } else {

                    this.rpc.request(name, args)
                    .then((result)=>{
                        if(this.options.verbose)
                            console.log("Result:");
                        console.log(JSON.stringify(result,null,'    '));
                        this.rpc.disconnect();
                    })
                    .catch(error=>{
                        console.log("Error:", error.toString())
                        this.rpc.disconnect();
                    })
                }
            })
        })

        program.parse(process.argv);
//        console.log('options:',this.options);
        //if()
    }



	async connectNATS(options) {
		this.nats = await NATS.connect(options);
		(async () => {
			log.info(`nats connected to ${this.nats.getServer()}`);
			for await (const status of this.nats.status()) {
				//console.info(`NATS: ${status.type}: ${status.data}`);
			}
		})().then();

		this.nats.closed().then((err) => {
			console.log(`connection closed ${err ? " with error: " + err.message : ""}`);
		});

		const { info } = this.nats.protocol;
		const entries = Object.entries(info);
		let padding = entries.map(([k]) => k.length).reduce((a,k) => Math.max(k,a));
		entries.forEach(([k,v]) => {
			log.verbose(`${k}:`.padStart(padding+1,' '),(v+''));
		})
	}

	async stopNATS() {
        if(this.nats) {
            await this.nats.drain();
            this.nats.close();
            delete this.nats;
        }
	}

    async shutdown() {
        await this.stopNATS();
        this.rpc.close();
    }

	interrupt() {
		return (signal) => {
			if(signal)
				this.log(`^${signal}...`);
			this.shutdown().then(() => {
				this.log("shutdown ok");
				process.exit();
			}, (err) => {
				this.log("shutdown failure:", err);
				process.exit();
			});
		}
	}


}

(async()=>{
    const ki = new KaspaInterface();
    await ki.main();
})();