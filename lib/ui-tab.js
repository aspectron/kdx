const EventEmitter = require("events");
const isNw = typeof nw != 'undefined';
class UITab extends EventEmitter{
	constructor(manager, task) {
		super();
		this.task = task;
		this.manager = manager;
		this.app = this.manager.core;
	}

	initProcess(){
		if(!isNw)
			return
		this.log("initUI")
		this.proc.on("start", ()=>{
			this.app.emit("task-start", this)
			dpc(10, ()=>{
				this.proc.process.stdout.on('data', data=> {
					//data.toString('utf8').split('\n').map( l => console.log(l) );
					this.app.emit("task-data", this, data.toString('utf8').split('\n'));
				})
				this.proc.process.stderr.on('data',(data) => {
					this.app.emit("task-error", this, data.toString('utf8').split('\n'));
				})
			})
		});
		this.proc.on("exit", ()=>{
			this.app.emit("task-exit", this)
		})
	}

	log(...args) {
		//const c = this.colors[this.seq%this.colors.length];
		let ident = `${this.task.type.toUpperCase()}[${this.task.id}]`;//[c].bold;
		console.log(ident,...args);
	}
}

module.exports = UITab;