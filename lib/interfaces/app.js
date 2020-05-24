const os = require('os');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const utils = require("../utils");
const Daemon = require('../daemon');
const isDocker = require('is-docker');

const isDocker_ = isDocker();

module.exports = class KaspaApp extends Daemon {

    resolveStrings(v) {
        return v.replace(/\$HOME/ig,os.homedir())
                .replace(/\$APPS/ig,this.manager.appFolder)
                .replace(/\$NODE/ig,path.join(this.manager.appFolder,'node'+this.PLATFORM_BINARY_EXTENSION))
                .replace(/\$MODULES/ig,path.join(__dirname,'../..'));        
    }

    start() {
		return new Promise(async (resolve,reject) => {


			let logsFolder = path.join(this.folder,'logs');
			mkdirp.sync(logsFolder);

            let args = this.task.conf.args;
            if(!args)
                return reject(`App config missing 'args : []'`);
            let {conf} = this.task;
            let cwd = this.resolvePath(conf.folder||conf.root||conf.cwd||conf.workdir||conf.dir);


            Object.entries(conf).forEach(([k,v]) => {
                if(typeof v == 'string') {
                    conf[k] = this.resolveStrings(v);
                }
            })

            args = args.map((v) => {
                if(typeof v != 'string')
                    return v;
                return this.resolveStrings(v);
            });

            this.run({
                args : () => {
                    return args;
                },
                cwd
            });
            
            this.mute = false;

            this.on('start', () => {
// TODO - select and enable/disable apps... by key...
                let appLinks = this.manager.controller?.qS?.(`flow-window-link[appid="${this.task.key}"]`) || [];
                console.log('#######  ====  appLinks:',appLinks);
                appLinks.forEach((link) => {
                    link.removeAttribute('disabled');
                })
            })

            this.on('exit', () => {
                let appLinks = this.manager.controller?.qS?.(`flow-window-link[appid="${this.task.key}"]`) || [];
                console.log('#######  ====  allLinks:',appLinks);
                appLinks.forEach((link) => {
                    link.setAttribute('disabled','');
                })
            })


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
// console.log('open',this,this.task.this.task.conf);
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
        let action = this.task.conf.stop;
        if(action && /^http/i.test(action)) {
            try {
                let resp = await fetch();
                waitForShutdown = true;
            } catch(ex) {

            }
        }

        return super.stop(waitForShutdown);
    }
}
