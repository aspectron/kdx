if (0) {
	typeof(chrome) != 'undefined' && chrome.developerPrivate.openDevTools({
		renderViewId: -1,
		renderProcessId: -1,
		extensionId: chrome.runtime.id,
	});
}

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
// const NUID = require('nuid');

/**
* Class FlowBaseline
* @example
* const app = new FlowBaseline({
*	appFolder: __dirname,
*	ident: 'flow-baseline',
* });
* app.main();
*/
class FlowBaseline {
	/**
	* @param {Object} [options]
	*/
	constructor(options={}) {
		/**
		* @type {Object}
		*/
		this.options = options;
	}

	/**
	* Main process
	* @return {Promise}
	*/
	main() {
		return new Promise((resolve, reject) => {
			console.log('FlowBaseline - init()'.yellow);
			nw.Window.open('modules/flow/flow.html', {
				new_instance: true,
				id: 'kdx',
				title: 'KaspaDX',
				width: 1027,
				height: 768,
				resizable: true,
				frame: true,
				transparent: false,
				show: true,
				// http://docs.nwjs.io/en/latest/References/Manifest%20Format/#window-subfields
			}, (a, b) => {
				console.log('a:', a, 'b:', b, 'this:', this);
				resolve();
			});
		});
	}

	/**
	* Initialize data directories
	*/
	initDataDir() {
		if (process.platform == 'win32') {
			this.homeFolder = path.join(os.homedir(), '.flow');
		} else {
			this.homeFolder = path.join(os.homedir(), '.flow');
		}

		this.dataFolder = path.join(this.homeFolder, 'data');
		fs.ensureDirSync(this.dataFolder);
	}

	/**
	* Logs given variables
	* @param {...*} args
	*/
	log(...args) {
		args.unshift('TT:');
		console.log(args);
	}
}

/**
*
*/
const app = new FlowBaseline({
	appFolder: __dirname,
	ident: 'flow-baseline',
});

(async ()=>{
	await app.main();
})();

process.on('exit', ()=>{
});
