false && nw.Window.get().showDevTools();
const { BroadcastChannelRPC : FlowRPC } = require("@aspectron/flow-rpc");
const os = require("os");
const fs = require("fs");
const path = require("path");

class Initializer{
	constructor(){
		this.init();
	}
	async init(){
		this.initRPC();
		this.appData = await this.get("get-app-data");
		console.log("this.appData", this.appData)
		this.appFolder = this.appData.appFolder;
		let {configFolder, config} = this.appData;
		if(!config)
			config = { }
		let $folderInput = $("#data-folder-input");
		let folderInput = $folderInput[0];
		let originalValue = config.dataDir || configFolder;
		folderInput.value = originalValue;
		$folderInput.on("changed", (e)=>{
			console.log(e.detail.value, folderInput.value);
		});
		let $upnp = $("#settings-enable-upnp");
		let upnp = $upnp[0];
		upnp.value = true;

		$("flow-btn.reset-data-dir").on("click", ()=>{
			folderInput.setValue(originalValue);
		}) 
		$("flow-btn.save-config").on("click", async()=>{
			let value = folderInput.value;
			if(!value)
				return;

			if(value==originalValue)
				value = '';

			const defaults = this.templates[this.tpl_template];
			defaults.ident = this.tpl_template;
			const network = this.tpl_network;
			const upnpEnabled = upnp.value;

			this.setUiDisabled(true);
			let err = await this.get("set-app-data-dir", {dataDir:value, defaults, network, upnpEnabled });
			FlowDialog.show("Error", err.error || err)
			console.log("err:", err)
			this.setUiDisabled(false);
		})

		this.initTemplates();

		this.checkCompatibility();
	}

	initRPC(){
		let rpc = new FlowRPC({bcastChannel:'kdx'});

		this.rpc = rpc;

		rpc.on("disable-ui", (args)=>{
			$('body').addClass("disable");
		});
		rpc.on("enable-ui", (args)=>{
			$('body').removeClass("disable");
		});
	}

	initTemplates() {

//		this.tpl_network = 'testnet';
		this.tpl_network = 'mainnet';
		this.tpl_template = 'kaspad-node-only';

		try {
			this.templates = JSON.parse(fs.readFileSync(path.join(this.appFolder,'.templates'))+'');
		} catch(ex) {
			alert('Error loading configuration templates file .templates:\n\n'+ex+'');
		}

		const qS = document.querySelector.bind(document);
		let tplEl = qS('#template-list');
		let netEl = qS('#network-list');
		tplEl.innerHTML = Object.entries(this.templates).map(([ident,tpl]) => {
			return `<div class="menu-item" value="${ident}">${tpl.description}</div>`;
		}).join('');
		tplEl.selected = this.tpl_template;
		netEl.setAttribute('selected', this.tpl_network);

		window.addEventListener('select', (e) => {
			let { selected } = e.detail;
			switch(e.target.id) {
				case 'network-list': {
					this.tpl_network = selected;
				} break;

				case 'template-list': {
					this.tpl_template = selected;
				} break;
			}
		})
		// TODO - implement selection-based loading
		// TODO - confirm dialog before loading
	}


	saveConfig(config){
		//console.log("saveConfig:config", config)
		try{
			config = JSON.parse(config);
		}catch(e){
			return
		}
		this.post("set-app-config", {config});
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

	checkCompatibility() {
		/*
		if(os.platform() != 'linux')
			return;

		let html = `
		`;
		$("body").append(html);
		*/
	}
}

const initializer = new Initializer();
