const EventEmitter = require("events");
const isNw = typeof nw != 'undefined';
class TermSink extends EventEmitter{
	constructor(manager, task) {
		super();
		this.task = task;
		this.manager = manager
		const name = this.constructor.name;
		this.log = Function.prototype.bind.call(
			console.log,
			console,
			`%c[${name}]`,
			`font-weight:bold;`
		);

		this.prefix = this.getName();//+'|';

		this.on("exit", ()=>{
			this.renderTaskInfo();
		})

		console.log(`Creating ${this.getName()}`.green.bold);
	}

	createSink() {
		this.manager.emit("task-start", this);
		this.renderTaskInfo();
	}
	renderTaskInfo(){
		this.manager.emit("task-info", this)
	}

	writeToSink(data) {
		
		//data = data.toString('utf8').split('\n').map(v=>`${this.prefix} ${v}`);//);///.join('\n'));

		//if(!isNw)
		if(data){
			let str = data.toString('utf8');
			if(str.indexOf("Error:") > -1){
				this.log(":Error:", str);
				console.trace();
			}
		}
		
		this.manager.emit("task-data", this, data);//data.toString('utf8').split('\n'));
	}

	initProcess(){
		if(!isNw)
			return
		this.log("initUI")
	}

	destroySink() {
		this.manager.emit("task-exit", this);
		this.renderTaskInfo();
	}

	async beforeInterrupt(interrupt){
		this.manager.emit("before-interrupt", {interrupt, daemon:this});
	}

	getName() {
		let ident = `${this.task.type.toUpperCase()}[${this.task.id}]`;//[c].bold;
		return ident;
	}

	log(...args) {
		//const c = this.colors[this.seq%this.colors.length];
		
		console.log(this.getName(),...args);
	}
}

module.exports = TermSink;