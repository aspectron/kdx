true && nw.Window.get().showDevTools();
const {RPC} = require("./../../resources/rpc.js");
const os = require("os");

class Initializer{
	constructor(){
		this.init();
	}
	async init(){
		this.initRPC();
		this.initData = await this.get("get-init-data");
		let {configFolder, config} = this.initData;
		let $folderInput = $("#data-folder-input");
		let folderInput = $folderInput[0];
		let originalValue = config.dataDir || configFolder;
		folderInput.value = originalValue;
		$folderInput.on("change", (e)=>{
			console.log(e.detail.value, folderInput.value);
		});

		$("flow-btn.reset-data-dir").on("click", ()=>{
			folderInput.setValue(originalValue);
		}) 
		$("flow-btn.save-config").on("click", async()=>{
			let value = folderInput.value;
			if(!value)
				return

			if(value==originalValue)
				value = '';
			this.setUiDisabled(true);
			let err = await this.get("set-data-dir", {dataDir:value});
			FlowDialog.show("Error", err.error || err)
			console.log("err:", err)
			this.setUiDisabled(false);
		})
	}
	initRPC(){
		let rpc = new RPC({});

		this.rpc = rpc;

		rpc.on("disable-ui", (args)=>{
			$('body').addClass("disable");
		});
		rpc.on("enable-ui", (args)=>{
			$('body').removeClass("disable");
		});
	}
	saveConfig(config){
		//console.log("saveConfig:config", config)
		try{
			config = JSON.parse(config);
		}catch(e){
			return
		}
		this.post("set-config", {config});
	}
	setUiDisabled(disabled){
		document.body.classList.toggle("disable", disabled);
	}
	post(subject, data){
		this.rpc.dispatch(subject, data)
	}

	get(subject, data){
		return new Promise((resolve, reject)=>{
			this.rpc.dispatch(subject, data, (err, result)=>{
				if(err)
					return resolve(err)

				resolve(result);
			})
		})
	}
}

const initializer = new Initializer();
