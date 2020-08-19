const App = require("./app");
const path = require("path");
const fse = require("fs-extra");
const os = require("os");
const utils = require("./lib/utils");

class NodeApp extends App{
	constructor(options={}){
		super(options);
		this.args = utils.args();
	}

	async main() {
		if(!this.dataFolder)
			return Promise.resolve();

		if(this.args.purge || this.args.reset) {
			try {
				console.log('purging'.brightMagenta,this.dataFolder.brightWhite);
				await fse.remove(this.dataFolder);
				await fse.remove(path.join(os.homedir(),'.kdx'));
				console.log('done'.brightGreen);
				process.exit(0);
			} catch(err) {
				console.log(err.toString().brightRed);
				process.exit(0);
			}
			return;
		}

		const KaspaProcessManager = require(path.join(this.appFolder, "lib/manager.js"));
		this.manager = new KaspaProcessManager(null, this.dataFolder, this.appFolder);

		return new Promise((resolve, reject) => {
			this.initDaemons();
			resolve();
		})
	}

	/**
	* initlizing data folder error handler
	*/
	dataDirInitError(){
		console.error(`Please start app with --init=/path/to/data/dir or --init for default (~/.kdx/data)`.red);
		this.exit();
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

module.exports = NodeApp;