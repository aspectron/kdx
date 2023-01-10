const fs = require('fs');
const os = require('os');
const path = require('path');
const utils = require("@aspectron/flow-utils");
const { dpc } = require('@aspectron/flow-async');
const Daemon = require('../daemon');

module.exports = class GPUMiner extends Daemon {
	constructor(manager, task) {
		super(manager, task);
		console.log(`Creating ${task.type}`.green.bold);
		// this.verbose = true;
		this.blockrate = 0;
		this.blockrate1m = 0;
		this.hashrate = { rate : 0, units : '' };
		this.on("exit", ()=>{
			this.clearTastInfo();
			this.writeToSink('\r\nGPUMiner stopped.\r\n\r\n');
		})
	}

	getPeers(){
		return this.task.conf.peers;
	}

	async start() {
		this._stopped = false;
		let defaults = {

		}

		await this.VSARGS([this.getDeployableBinary('gpuminer'), '--version'], (text)=>{
			return (text.split("kaspa-miner ").pop()+"")
		});

		let configArgs = Object.assign(defaults, this.task.args || {});
		const flags = utils.args();

		this.options.args  = async () => {
			if(this.manager.controller.isMinerWaitingForWalletLogin())
				this.writeToSink('\r\nGPUMiner is waiting for mining address. Please login into wallet if not logged-in.\r\n');
			let address = await this.manager.controller.getMiningAddress()
			if(address)
				configArgs["mining-address"] = address;

			if(!configArgs["mining-address"])
				configArgs["mining-address"] = 'kaspa:pzhh76qc82wzduvsrd9xh4zde9qhp0xc8rl7qu2mvl2e42uvdqt75zrcgpm00';

			let args = Object.entries(configArgs);

			let _args_ = [
				this.getBinary('gpuminer')
			];

			if(/linux/.test(util.platform) && flags.nice) {
				_args_ = ['/bin/nice','-10',..._args_];
			}
			let a = _args_.concat(args.map(([k, v]) => {
				if (k.length == 1){
					k = `-${k}`
				}else{
					k = `--${k}`
				}
				if (v === undefined || v === null || v === true || v === ''){
					return k
				}else{
					return `${k}=${v}`;
				}
			}));

			console.log("---GPU-MINER ARGS", a);
			return a;
		};

		let blocks = 0;
		this.options.stdout = (data) => { 
			let text = data.toString();
			let lines = text.split('\n');
			lines.forEach((l) => {
				if(/Found block/g.test(l))
					blocks++;

				let hr = l.match(/Current hashrate is:? (?<rate>\d+\.?\d*)\s+(?<units>[^\s]+)/)?.groups;
				if(hr && hr.rate && hr.units) {
					this.hashrate.rate = parseFloat(hr.rate) || 0.0;
					this.hashrate.units = hr.units;
				}
			});
			return this.digestStdout(data);
		};

		if(this.manager.enableMining || flags.mine) {
			dpc(0, () => {
				//console.log("----------------- GPU-MINER STARTING")
				this.run()
			})
		} else {
			//console.log("----------------- GPU-MINER NOT RUNNING")
			this.state = 'disabled';
			dpc(0, () => {
				this.writeToSink('\r\n\r\nGPUMiner is disabled. Please use Enable Mining option to start it.\r\n\r\n');
			})
		}

		let tsΩ = Date.now();
		let blockΩ = 0;
		let rateΣ = [];
		this.statusTimer = setInterval(()=>{
			let ts = Date.now();
			let tsΔ = ts-tsΩ;
			let blockΔ = blocks-blockΩ;
			let rate = blockΔ / tsΔ * 1e3;
			tsΩ = ts;
			blockΩ = blocks;
			rateΣ.push(rate);
			while(rateΣ.length > 6)
				rateΣ.shift();
			let Σ = rateΣ.reduce((a,b) => a+b, 0) / rateΣ.length;
			this.blockrate = rate;
			this.blockrate1m = Σ;

			if(typeof flow != 'undefined' && flow.samplers) {
				flow.samplers.get(`${this.task.key}-block-rate`).put(this.blockrate);
				flow.samplers.get(`${this.task.key}-block-rate-avg`).put(this.blockrate1m);
				flow.samplers.get(`${this.task.key}-hash-rate`).put(this.hashrate.rate);
			}
			this.renderTaskInfo();
		}, 10 * 1000);
	}

	digestStdout(){

	}

	gauge(title, value){
		this.log(title, value)
	}

	clearTastInfo(){
		try {
			flow.samplers.get(`${this.task.key}-block-rate`).put(0);
			flow.samplers.get(`${this.task.key}-block-rate-avg`).put(0);
			flow.samplers.get(`${this.task.key}-hash-rate`).put(0);
			this.blockrate = 0;
			this.blockrate1m = 0;
			this.hashrate.rate = 0;
			this.renderTaskInfo();
		} catch(ex) { console.error(ex); }
	}

	async stop() {
		this._stopped = true;
		this.clearTastInfo();
		clearInterval(this.statusTimer);
		if(this.restartTimeoutId)
			clearTimeout(this.restartTimeoutId)

		return super.stop();
	}

	async renderModuleInfo({ html, i18n }) {
		let els = await super.renderModuleInfo({ html, i18n });

		let rate = html`
			<flow-data-badge-graph style="min-width:128px;" sampler="${this.task.key}-block-rate" suffix="${i18n.t(" / SEC")}" title="${i18n.t("BLOCK RATE")}" align="right">${this.blockrate.toFixed(2)}</flow-data-badge-graph>
			<flow-data-badge-graph style="min-width:128px;" sampler="${this.task.key}-block-rate-avg" suffix="${i18n.t(" / MIN")}" title="${i18n.t("BLOCKS RATE (AVG)")}" align="right">${this.blockrate1m.toFixed(2)}</flow-data-badge-graph>
			<flow-data-badge-graph style="min-width:160px;" sampler="${this.task.key}-hash-rate" suffix="${this.hashrate.units}" title="${i18n.t("HASH RATE")}" align="right">${this.hashrate.rate.toFixed(2)}</flow-data-badge-graph>
		`;

		return html`${els}${rate}`;
	}
}
