const os = require('os');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const utils = require("@aspectron/flow-utils");
const { dpc } = require('@aspectron/flow-async');
const Daemon = require('../daemon');
const isDocker = require('is-docker');

const isDocker_ = isDocker();

module.exports = class Mosquitto extends Daemon {
	start() {
		return new Promise(async (resolve,reject) => {


			let logsFolder = path.join(this.folder,'logs');
			mkdirp.sync(logsFolder);

            const args = [];

            args.push(`listener ${this.task.conf.port}`);
            args.push(`protocol mqtt`);

            const config = `# generated on ${new Date}`+'\n'+args.join('\n')+'\n';
            const configFile = path.join(this.folder, 'mosquitto.conf');
            fs.writeFileSync(configFile, config);
            this.log(config);

			this.manager.registerString(this,'port','MQTT',this.task.conf.port);

            let mqttBinary = {
                'win32' : this.getBinary(path.join('mosquitto','mosquitto')),

                'darwin': [
                    path.join(this.getBinaryFolder(),'/mosquitto/mosquitto'),
                    path.join(this.getBinaryFolder(),'/brew/sbin/mosquitto'),
                    // '/usr/local/Cellar/mosquitto/1.6.11/sbin/mosquitto',
                    '/usr/local/Cellar/mosquitto/1.6.10/sbin/mosquitto',
                    '/usr/local/Cellar/mosquitto/1.6.9/sbin/mosquitto',
                ],
                'linux': '/usr/sbin/mosquitto'
            }[os.platform()];

            if(os.platform() == 'darwin') {
                ['bin','sbin','lib'].forEach(f => {
                    process.env.PATH.push(path.join(this.getBinaryFolder(),'brew',f));
                });
            }

            if(Array.isArray(mqttBinary)) {
                mqttBinary = mqttBinary.filter(f => { return fs.existsSync(f); }).shift();
                if(!mqttBinary) 
                    this.writeToSink(`Unable to locate mqtt binary...\n\r`);
                else
                    this.writeToSink(`using mosquitto binary at ${mqttBinary}\n\r`);
            }

			await this.VSARGS([mqttBinary,'-h'],(text)=>{
                return text.split('\n').shift().trim();
            });

            if(isDocker_)
                mqttBinary = '/usr/sbin/mosquitto';

            this.run({
                args : () => {
                    return [
                        mqttBinary,
                        '-v',
                        '-c',configFile
                    //	`--cert=${rpcCertFile}`
                    ];
                }
            });
            // this.mute = false;
            resolve();
		})
	}
}
