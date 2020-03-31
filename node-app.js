const {App} = require("./app.js");

class NodeApp extends App{
	constructor(options={}){
		super(options);
	}

	main() {
		return new Promise((resolve, reject) => {
			this.initDaemons();
			resolve();
		})
	}
}

module.exports = {NodeApp};