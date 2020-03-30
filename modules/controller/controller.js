const os = require('os');
const path = require('path');
const { utils } = require('micro-fabric');
const KaspaProcessManager = require("../../lib/manager.js");

class Controller {
	constructor(){
		this.flags = {};
		this.manager = new KaspaProcessManager(this);
	}

	getBinaryFolder(){
		return path.join(__dirname,'../..', 'bin', utils.platform);
	}
}

module.exports = Controller;