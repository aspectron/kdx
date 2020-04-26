const {App} = require("./app.js");

chrome.developerPrivate.openDevTools({
	renderViewId: -1,
	renderProcessId: -1,
	extensionId: chrome.runtime.id,
});

class NWApp extends App{
	/**
	* @param {Object} [options={}]
	*/
	constructor(options={}) {
		super(options);
		this.on("ui-init", ()=>{
			this.initDaemons();
		})

		global.app = this;
	}

	/**
	* Main process
	* @return {Promise}
	*/
	main() {
		if(!this.dataFolder)
			return Promise.resolve();
		return new Promise((resolve, reject) => {
			console.log('ControllerModule - init()'.bold);
			nw.Window.open('modules/controller/controller.html', {
				//new_instance: true,
				id: 'kdx',
				title: 'KaspaDX',
				width: 1027,
				height: 768,
				resizable: true,
				frame: true,
				transparent: false,
				show: true,
				// http://docs.nwjs.io/en/latest/References/Manifest%20Format/#window-subfields
			}, (win, b) => {
				console.log("win", win)
				// win.app = this;
				// global.abcapp = "123";
				resolve();
			});
		});
	}

	initDataFolder(){
		let msg = super.initDataFolder();
		if(msg){
			console.error(msg.red)
			nw.Window.open('modules/initialize/initialize.html', {
				//new_instance: true,
				id: 'initialize',
				title: 'KaspaDX',
				width: 1027,
				height: 768,
				resizable: true,
				frame: true,
				transparent: false,
				show: true,
				// http://docs.nwjs.io/en/latest/References/Manifest%20Format/#window-subfields
			}, (win, b) => {
				//win.app = this;
				//global.abcapp = "456";
			});
		}
	}

	setDataDir(dataDir, restartDelay = 0){
		super.setDataDir(dataDir);
		this.emit("disable-ui", {CODE:'DATA-DIR'})
		dpc(restartDelay, ()=>this.reload());
	}

	reload(){
		chrome.runtime.reload();
	}
}

module.exports = {NWApp};