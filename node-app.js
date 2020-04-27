const {App} = require("./app.js");
const path = require("path");

class NodeApp extends App{
	constructor(options={}){
		super(options);
	}

	main() {
		if(!this.dataFolder)
			return Promise.resolve();

		const KaspaProcessManager = require(path.join(this.appFolder, "lib/manager.js"));
		this.manager = new KaspaProcessManager(this.dataFolder, this.appFolder);

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

	initDaemons(){
		let modules = this.getModulesConfig();
		console.log("initDaemons", modules)
		this.startDaemons(modules);
	}

	startDaemons(daemons={}){
		this.daemons = daemons;
		this.manager.start(daemons);
	}

	async stopDaemons(){
		try{
			await this.manager.stop();
		}catch(e){
			console.log("manager.stop:error", e)
			return false;
		}

		return true;
	}

	async restartDaemons(){
		try{
			await this.manager.stop();
			console.log("initDaemons....")
			dpc(1000, ()=>{
				this.initDaemons();
			});
		}catch(e){
			console.log("restartDaemons:error", e)
			dpc(1000, ()=>{
				this.initDaemons();
			});
		}
	}
}

module.exports = {NodeApp};