if(typeof dpc == 'undefined'){
	var dpc = (delay, fn)=>{
		if(typeof delay == 'function'){
			return setTimeout(delay, fn||0);
		}else{
			return setTimeout(fn, delay||0);
		}
	}
}
class RPC {
	constructor(options={}){
		this.online = false;
		this.timeout  = 30;

		this.options = Object.assign({
			bcastChannel:'kdx',
			origin: typeof window !='undefined' ? window.location.origin:'',
			path:'/rpc',
			timeout:30
		}, options);
		this.uid = this.options.uid || Date.now()+":"+Math.ceil(Math.random()*1e16)

		this.init();

	}

	init() {
		this.initEvent();
		this.timeout = this.options.timeout;
		this.connected = false;

		if(this.options.useBcast || typeof nw != 'undefined'){
			this.initBroadcastChannel();
		}else if (this.options.path){
			this.initSocket();
		}

		var timeoutMonitor = ()=>{
			var ts = Date.now();
			var purge = [ ]
			Object.entries(this.pending).map(([id, info])=>{
				if(ts - info.ts > this.timeout * 1000) {
					info.callback({ error : "Timeout "});
					purge.push(id);
				}
			})
			purge.forEach(id=>{
				delete this.pending[id];
			})
			dpc(1000, timeoutMonitor);
		}
		dpc(1000, timeoutMonitor);
	}

	initEvent() {
		this.pending = { };
		this.events = new FabricEvents();
	}

	initBroadcastChannel(){
		var channel = new BroadcastChannel(this.options.bcastChannel, { 
			type: 'node', 
			webWorkerSupport: true
		})

		channel.onmessage = msg=>{
			//console.log('received message in channel rpc')
			//console.log(msg)
			this._processRemoteMsg(msg.data);
		}

		this._send = (msg)=>{
			channel.postMessage(msg);
		}
	}

	send(to, subject, data, reqId){
		let msg = {subject, data, reqId, to, from:this.uid};
		//console.log("sending:msg", msg)
		this._send(msg)
	}

	initSocket(){
		if (this.connected || !this.options.path)
			return;
		this.connected = true;
		this.events.emitAsync('rpc-connecting');
		this.socket = io(this.options.origin+this.options.path, this.options.ioArgs || {});
		//console.log("this.options.args"+this.options.args)
		this.socket.on('ready', ()=>{
			this.online = true;
		})
		this.socket.on('connect', ()=>{
			console.log("RPC connected");
			this.events.emit('rpc-connect');
		})
		this.socket.on('connect_error', (err)=>{
			this.events.emit('rpc-connect-error', err);
		})
		this.socket.on('error', (err)=>{ 
			console.log("RPC error", arguments);
			this.events.emit('rpc-error', err);
		})
		this.socket.on('offline', ()=>{
			//window.location.reload();
			this.events.emit('offline');
		})
		this.socket.on('disconnect', ()=>{ 
			this.online = false;
			console.log("RPC disconnected",arguments);
			this.events.emit('rpc-disconnect');

			Object.entries(this.pending).forEach(([id, info])=>{
				info.callback({ error : "Connection Closed"});
			})

			this.pending = { }
		})

		this.socket.on('message', (msg)=>{
			this._processRemoteMsg(msg);
		})

		this._send = (msg)=>{
			this.socket.emit('message', msg);
		}
	}
	_processRpcRequest(msg){
		let {to, from, subject, data, reqId} = msg;
		let list = Object.entries(this.events.events[subject]||{});
		let length = list.length;
		let callback = (error, data)=>{
			this._send({to:from, from:this.uid, subject, error, data, resId:reqId})
		}
		if(length == 1){
			let [uuid, fn] = list[0];
			fn(data, callback)
		}else if(length == 0){
			callback({error: `No such ${subject} RPC listener.`});
		}else{
			callback({error: `Many listeners for ${subject} RPC.`});
		}
	}
	_processRemoteMsg(msg){
		this.events.emit("msg", msg);
		let {to, from, subject, data, error, resId, reqId} = msg;
		if(!this.options.skipMsgFilter && to && to != this.uid)
			return;
		if(reqId)
			return this._processRpcRequest(msg);

		if(resId){
			if(this.pending[resId])
				this.pending[resId].callback.call(this, error, data, from, to);
			else{
				console.log("RPC received unknown rpc callback (strange server-side retransmit?)");
			}
			delete this.pending[resId];
			return;
		}
		if(this.trace) {
			if(this.trace === 1 || this.trace === true)
				console.log('RPC ['+this.id+']:', subject);
			else
			if(this.trace === 2)
				console.log('RPC ['+this.id+']:', subject, data, from, to);                
		}
		this.events.emit(subject, data, from, to);
	}

	close(){
		if(this.socket)
			this.socket.close();
	}

	on(op, callback) {
		this.events.on(op, callback);
	}

	dispatchTo(to, subject, data, callback) {
		if(typeof data == 'function'){
			callback = data;
			data = {};
		}
		if(!callback)
			return this.send(to, subject, data);

		let rid = Date.now()+":"+Math.ceil(Math.random()*1e16)
		this.pending[rid] = {
			ts : Date.now(),
			callback : (err, resp)=>{
				callback(err, resp);
			}
		}

		this.send(to, subject, data, rid);
	}

	dispatch(subject, data, callback) {
		this.dispatchTo(null, subject, data, callback);
	}
}

class FabricEvents{

	constructor(){

		this.events = { }
		this.listeners = null;
		this.refs = [];
		this.mevents = [];

		this.on('destroy', ()=>{
			this.mevents.forEach(uuid=>{
			   this.off(uuid);
			});
		})
	}

	on(op, fn){
		if(!fn)
			throw new Error("events::on() - callback is required");
		var uuid = Date.now()+Math.random(1000, 9999);
		if(!this.events[op])
			this.events[op] = { }
		this.events[op][uuid] = fn;//{ uuid : uuid, fn : fn }
		this.refs[uuid] = op;
		return uuid;
	}

	mon(op, fn){
		var uuid = this.on(op, fn);
		this.mevents.push(uuid);
		return uuid;
	}

	off(uuid, op) {
		if (uuid) {
			var op = this.refs[uuid];
			delete this.refs[uuid];
			delete this.events[op][uuid];
		}else if (op) {
			this.forEach(this.events[op], (fn, uuid)=>{
				delete this.refs[uuid];
			});

			delete this.events[op];
		};
	}

	// this function supports 2 types of arguments.
	//single object that contains opcode { op : 'msg' } 
	// or
	// 'msg', args...
	emit(msg) {
		var me = this;
		
		var args = Array.prototype.slice.apply(arguments);

		if(typeof(msg) == 'string') {

			var orig = args.slice();
			args.shift();

			var list = this.events[msg];
			list && this.forEach(list, fn=>{
				fn.apply(this, args);
			})

			this.listeners && this.listeners.forEach(listener=>{
				listener.emit.apply(listener, orig);
			})
		}
		else {

			var list = this.events[msg.op];
			list && this.forEach(list, fn=>{
				fn.apply(this, args);
			})

			this.listeners && this.listeners.forEach(listener=>{
				listener.emit.apply(listener, args);
			})
		}
	}
	forEach(list, fn){
		Object.entries(list).forEach(([key, value])=>{
			fn(value, key);
		})
	}

	emitAsync(op) {
		dpc(()=>{
			this.emit(op);
		})
	}

	addListener(listener) {
		if(!this.listeners)
			this.listeners = [ ]
		this.listeners.push(listener);
	}

	removeListener(listener) {
		this.listeners = Array.prototype.slice.apply(this.listeners.indexOf(listener));
	}

	getListeners() {
		return this.listeners;
	}
}
if(typeof module == "object" && typeof module.exports =="object"){
	module.exports.RPC = RPC;
	module.exports.FabricEvents = FabricEvents;
}