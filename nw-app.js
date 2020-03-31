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
	}

	/**
	* Main process
	* @return {Promise}
	*/
	main() {
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
				win.app = this;
				resolve();
			});
		});
	}
}

module.exports = {NWApp};