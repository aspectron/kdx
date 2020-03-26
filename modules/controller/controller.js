const os = require('os');
const path = require('path');
const { utils } = require('micro-fabric');

class Controller {
	constructor(){
		this.flags = {};
	}

	getBinaryFolder(){
		return path.join(__dirname,'../..', 'bin', utils.platform);
	}
}

module.exports = Controller;