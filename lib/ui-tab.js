const EventEmitter = require("events");
const isNw = typeof nw != 'undefined';
class UITab extends EventEmitter{
	constructor(manager, task) {
		super();
		this.task = task;
		this.manager = manager;
		this.app = this.manager.core;
		const name = this.constructor.name;
		this.log = Function.prototype.bind.call(
			console.log,
			console,
			`%c[${name}]`,
			`font-weight:bold;`
		);

		this.prefix = this.getName()+'|';
	}

	createSink() {
		this.app.emit("task-start", this)
	}

	writeToSink(data) {
		
		data = data.toString('utf8').split('\n').map(v=>`${this.prefix} ${v}`);//);///.join('\n'));

console.log("write to sink:",data);
		this.app.emit("task-data", this, data);//data.toString('utf8').split('\n'));
	}

	initProcess(){
		if(!isNw)
			return
		this.log("initUI")
		

		// this.proc.on("start", ()=>{
		// 	dpc(10, ()=>{
		// 		this.proc.process.stdout.on('data', data=> {
		// 			//data.toString('utf8').split('\n').map( l => console.log(l) );
		// 			this.app.emit("task-data", this, data.toString('utf8').split('\n'));
		// 		})
		// 		this.proc.process.stderr.on('data',(data) => {
		// 			this.app.emit("task-error", this, data.toString('utf8').split('\n'));
		// 		})
		// 	})
		// });
		// this.proc.on("exit", ()=>{
		// 	this.app.emit("task-exit", this)
		// })
	}

	// async start() {
	// 	this.app.emit("task-start", this)
	// }

	destroySink() {
		this.app.emit("task-exit", this);
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

module.exports = UITab;