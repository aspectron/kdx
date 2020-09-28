const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const utils = require('./utils');
const { dpc, clearDPC } = require('@aspectron/flow-async');
const gRPC = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = __dirname + '/messages.proto';

const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
const proto = gRPC.loadPackageDefinition(packageDefinition);
const {P2P, RPC} = proto.protowire;
console.log("P2P, RPC", P2P, RPC)

class Kaspad_gRPC_Interface  {
	constructor(ident) {
		this.args = utils.args();
		this.flags = { ...this.args }
        this.ident = ident;
        this.pending = { };
    }

    setAddress(address = 'localhost:16210') {
        this.address = address;
    }

    connect() {
        this.reconnect = true;
        console.log('gRPC connecting to',this.address);
        this.client = new RPC(this.address, gRPC.credentials.createInsecure(),
            { 
                // "grpc.keepalive_timeout_ms": 25000 
            }
        );

        this.stream = this.createStream();
        this.initIntake(this.stream);
        const reconnect = () => {
            if(this.reconnect_dpc) {
                clearDPC(this.reconnect_dpc);
                delete this.reconnect_dpc;
            }

            this.clearPending();
  //          this.stream?.end?.();
            delete this.stream;
            delete this.client;
            if(this.reconnect) {
                this.reconnect_dpc = dpc(1000, () => {
                    this.connect();
                })
            }
        }
        this.stream.on('error', (error) => {
            console.error('gRPC',error);
            reconnect();
        })
        this.stream.on('end', () => {
            reconnect();
        })
    }

    disconnect() {
        if(this.reconnect_dpc) {
            clearDPC(this.reconnect_dpc);
            delete this.reconnect_dpc;
        }
        this.reconnect = false;
        this.stream && this.stream.end();
        this.clearPending();
    }

    clearPending() {
        Object.keys(this.pending).forEach(key => {
            let list = this.pending[key];
            list.forEach(o=>o.reject('closing by force'));
            this.pending[key] = [];
        });
    }

    close() { this.disconnect() }

    createStream() {
        if(!this.client)
            return null;
        const stream = this.client.MessageStream((...args)=>{
            console.log("MessageStream fn", args)
        });
        return stream;
    }

    initIntake(stream) {
        stream.on('data',(data) => {
            if(data.payload) {
                let name = data.payload;
                let payload = data[name];
                let ident = name.replace(/^get|Response$/ig,'').toLowerCase();
                this.handleIntake({name, payload, ident });
            }
        });
    }

    handleIntake(o) {
        if(this.intakeHandler) {
            this.intakeHandler(o);
        } else {
            let handlers = this.pending[o.name];
            this.verbose && console.log('intake:',o,'handlers:',handlers);
            if(handlers && handlers.length)
                handlers.shift().resolve(o.payload);
        }
    }

    setIntakeHandler(fn) {
        this.intakeHandler = fn;
    }

    post(name, args = { }) {
        if(!this.stream)
            return false;

        let req = {
            [name]:args
        }
        this.verbose && console.log('post:',req);
        this.stream.write(req);

        return true;
    }

    call(req) {
        this.verbose && console.log('call to',req);
        if(!this.client)
            return Promise.reject('not connected');

        return new Promise((resolve, reject) => {
            let stream = this.stream; // this.createStream();
            if(!stream) {
                console.log('could not create stream');
                return reject('not connected');
            }

            const resp = req.replace(/Request$/,'Response');
            if(!this.pending[resp])
                this.pending[resp] = [];
            let handlers = this.pending[resp];
            handlers.push({resolve,reject});

            // stream.on('data', (data) => {
            //     console.log('data',data);
            //     resolve(data);
            //     stream.end();
            // });
            // stream.on('error', (error) => {
            //     console.log('error',error);
            //     reject(error);
            // })
            // stream.on('end', () => {
            //     console.log('end');
            // })

//            console.log('callback registration done...');

            this.post(req);
        })
    }

	testRPC(){

        const client = new RPC(this.address, gRPC.credentials.createInsecure(),
            { 
                // "grpc.keepalive_timeout_ms": 25000 
            }
        );
        console.log('client',this.client);
		//let reqStream = {getBlockDagInfoRequest:{}};
		let stream = client.MessageStream((...args)=>{
			console.log("MessageStream fn", args)
		});

		console.log("stream", stream);

        // stream.on('readable', (...args)=>{
		// 	console.log('stream readable', args);
        // });
        stream.on('error', (error)=>{
			console.log('stream error', error);
        });
		stream.on('metadata', function(...args) {
			console.log('stream metadata', args);
		});
		stream.on('status', function(...args) {
			console.log('stream status', args);
		});
		stream.on('data', function(data) {
			console.log('stream data', data);
//			console.log('stream data', JSON.stringify(data,null,'\t'));
			// stream.end();
		});
		stream.on('end', (a, b)=>{
			console.log('stream end', a, b);
		});
		stream.on('finish', (a, b)=>{
			console.log('stream finish', a, b);
		});

        setInterval(() => {
            let req = {
//                getConnectedPeerInfoRequest:{}
//getBlockDagInfoRequest:{}
                getMempoolEntriesRequest:{}
            }
            console.log(new Date,'req:',req);
            stream.write(req);

        }, 2500);
    }


	static testRPC_static(){
		var client = new RPC('localhost:16210', gRPC.credentials.createInsecure());
		console.log("client", client)
		//let reqStream = {getBlockDagInfoRequest:{}};
		let stream = client.MessageStream((...args)=>{
			console.log("MessageStream fn", args)
		});

		console.log("stream", stream);

		stream.on('metadata', function(...args) {
			console.log('stream metadata', args);
		});
		stream.on('status', function(...args) {
			console.log('stream status', args);
		});
		stream.on('data', function(...args) {
			console.log('stream data', args);
			stream.end();
		});
		stream.on('end', (a, b)=>{
			console.log('stream end', a, b);
		});
		stream.on('finish', (a, b)=>{
			console.log('stream finish', a, b);
		});
		let req = {
			getBlockDagInfoRequest:{}
		}
		stream.write(req);
	}

}

if(utils.args().test) {
    (async ()=>{

        try {
            let rpc = new Kaspad_gRPC_Interface();
            rpc.setAddress('localhost:16210');
            //rpc.testRPC();

            rpc.connect();
            let resp = await rpc.call('getBlockDagInfoRequest');
            console.log("got resp:", resp);
            // Kaspad_gRPC_Interface.testRPC_Client();
        } catch(ex) {
            console.log(ex);
        }
    })();
}

module.exports = Kaspad_gRPC_Interface;
