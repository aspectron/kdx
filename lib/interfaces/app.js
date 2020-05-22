const os = require('os');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const utils = require("../utils");
const Daemon = require('../daemon');
const isDocker = require('is-docker');

const isDocker_ = isDocker();

module.exports = class KaspaApp extends Daemon {
	start() {
		return new Promise(async (resolve,reject) => {


			let logsFolder = path.join(this.folder,'logs');
			mkdirp.sync(logsFolder);

            let args = this.task.conf.args;
            if(!args)
                return reject(`App config missing 'args : []'`);
            let {conf} = this.task;
            let cwd = conf.folder||conf.root||conf.cwd||conf.workdir||conf.dir;

            args = args.map((v) => {
                if(typeof v != 'string')
                    return v;
                return v.replace(/\$HOME/i,os.homedir())
                    .replace(/\$MODULES/i,path.join(__dirname,'../..'));
            });

            this.run({
                args : () => {
                    return args;
                },
                cwd
            });
            
            this.mute = false;

            dpc(2000, async () => {
                if(this.task.conf.open)
                    await this.open();

                resolve();
            })
		})
    }

    open() {
        return new Promise((resolve, reject) => {
            let url = this.task.conf.location || this.task.conf.url;
console.log('open',this,this.task.this.task.conf);
            if(url && typeof nw != 'undefined') {
                nw.Window.open(url, {
                    //new_instance: true,
                    id: this.task.id,
                    title: (this.task.id||'').toUpperCase(),
                    width: 1027,
                    height: 768,
                    resizable: true,
                    frame: true,
                    transparent: false,
                    show: true,
                    // http://docs.nwjs.io/en/latest/References/Manifest%20Format/#window-subfields
                }, (win, b) => {

                    this.window = win;
                    // console.log("win", win)
                    // win.app = this;
                    // global.abcapp = "123";
                    resolve();
                });
            }
        });


    }
    
    async stop() {
        try {
            this?.window?.close?.();
        } catch(ex) {
            console.log(ex);
        }

        let waitForShutdown = false;
        if(this.task.conf.exit) {

            try {
                let resp = await fetch(this.task.conf.exit);
                waitForShutdown = true;
            } catch(ex) {

            }
        }

        return super.stop(waitForShutdown);
    }
}
