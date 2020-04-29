const EventEmitter = require("events");
const isNw = typeof nw != 'undefined';
class Build extends EventEmitter{
	constructor(){
		super();
		this.init();
	}
	init(){
		dpc(1000, ()=>{
			this.write("Hello World")
		})
	}

	write(data){
		this.emit("terminal-data", data)
	}
}

module.exports = Build;