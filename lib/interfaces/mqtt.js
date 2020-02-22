const os = require('os');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const { utils } = require("micro-fabric");
const Daemon = require('../daemon');
const isDocker = require('is-docker');

const isDocker_ = isDocker();

module.exports = class Mosquitto extends Daemon {
	constructor(manager, task) {
		super(manager,task);
		// console.log(task);
	}

	start() {
		return new Promise((resolve,reject) => {

			const core = this.manager.core;
			const env = core.env;

			let logsFolder = path.join(this.folder,'logs');
			mkdirp.sync(logsFolder);

			// let defaults = {
            //     port :  (this.globals.mqtt.ports.base+this.task.seq*2)
			// }

            // let args = { };
			// (this.task.args || []).forEach((p) => {
			// 	let [k,v] = p.split('=');
			// 	args[k] = v;
			// })
            
			// args = Object.entries(Object.assign(defaults, args)).map(([k,v]) => {
			// 	return `${k} ${v}`;
            // });

            const args = [];
            
            // args.push(`listener ${this.task.args.port}`);
            // args.push(`protocol mqtt`);
            args.push(`listener ${this.task.port}`);
            args.push(`protocol websockets`);

            const config = `# generated on ${new Date}`+'\n'+args.join('\n')+'\n';
            const configFile = path.join(this.folder, 'mosquitto.conf');
            fs.writeFileSync(configFile, config);
            this.log(config);

            let mqttBinary = {
                'win32' : this.getBinary(path.join('mosquitto','mosquitto')),
                'darwin': 'mosquitto',
                'linux': '/usr/sbin/mosquitto'
            }[os.platform()];

            if(isDocker_)
                mqttBinary = '/usr/sbin/mosquitto';

            this.initProcess({
                args : () => {
                    return [
                        mqttBinary,
                        '-v',
                        '-c',configFile
                    //	`--cert=${rpcCertFile}`
                    ];
                }
            }).then(resolve);

            this.proc.mute = false;
		})
	}
}
