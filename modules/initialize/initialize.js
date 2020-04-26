true && nw.Window.get().showDevTools();
//const app = nw.Window.get().app;
const app = global.app;
const os = require("os");

class Initializer{
	constructor(){
		this.init();
	}
	init(){
		let config = app.getConfig({})
		let $folderInput = $("#data-folder-input");
		let folderInput = $folderInput[0];
		let originalValue = config.dataDir || app.configFolder;
		folderInput.value = originalValue;
		$folderInput.on("change", (e)=>{
			console.log(e.detail.value, folderInput.value);
		});

		$("flow-btn.reset-data-dir").on("click", ()=>{
			folderInput.setValue(originalValue);
		}) 
		$("flow-btn.save-config").on("click", ()=>{
			let value = folderInput.value;
			if(!value)
				return

			if(value==originalValue)
				value = '';
			app.setDataDir(value);
		})
	}
	saveConfig(config){
		//console.log("saveConfig:config", config)
		try{
			config = JSON.parse(config);
		}catch(e){
			return
		}
		app.setConfig(config);
		app.restartDaemons();
	}
}

const initializer = new Initializer();
app.emit("ui-init");
