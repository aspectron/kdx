const os = require('os');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const utils = require("../utils");
const Daemon = require('../daemon');
const isDocker = require('is-docker');

const isDocker_ = isDocker();

module.exports = class Mosquitto extends Daemon {
	start() {
		return new Promise((resolve,reject) => {

			let logsFolder = path.join(this.folder,'logs');
			mkdirp.sync(logsFolder);

            const args = [];

            args.push(`listener ${this.task.conf.port}`);
            args.push(`protocol mqtt`);

            const config = `# generated on ${new Date}`+'\n'+args.join('\n')+'\n';
            const configFile = path.join(this.folder, 'mosquitto.conf');
            fs.writeFileSync(configFile, config);
            this.log(config);

            let mqttBinary = {
                'win32' : this.getBinary(path.join('mosquitto','mosquitto')),
                'darwin': '/usr/local/Cellar/mosquitto/1.6.9/sbin/mosquitto',//'mosquitto',
                'linux': '/usr/sbin/mosquitto'
            }[os.platform()];

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
            this.mute = false;
            resolve();
		})
	}
}
