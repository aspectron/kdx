const {App} = require("./app.js");

class NodeApp extends App{
	constructor(options={}){
		super(options);
	}

	main() {
		if(!this.dataFolder)
			return Promise.resolve();
		return new Promise((resolve, reject) => {
			this.initDaemons();
			resolve();
		})
	}
	initDataFolder(){
		let msg = super.initDataFolder();
		if(msg)
			console.error(msg.red)
	}
}

module.exports = {NodeApp};