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
		//super();
		this.args = utils.args();
		this.flags = { ...this.args }
		this.ident = ident;

        // console.log("client", this.client);
        // console.log('------------------------------------');

    }

    setAddress(address = 'localhost:16210') {
        this.address = address;
    }

    connect() {
        this.reconnect = true;

        this.client = new RPC(this.address, gRPC.credentials.createInsecure(),
            { 
                // "grpc.keepalive_timeout_ms": 25000 
            }
        );

        this.stream = this.createStream();
        this.initIntake(this.stream);
        this.stream.on('error', (error) => {
            console.log(error.toString());
            this.stream?.end?.();
            delete this.stream;
            delete this.client;
            if(this.reconnect) {
                this.reconnect_dpc = dpc(1000, () => {
                    this.connect();
                })
            }
        })
    }

    disconnect() {
        if(this.reconnect_dpc) {
            clearDPC(this.reconnect_dpc);
            delete this.reconnect_dpc;
        }
        this.reconnect = false;
        this.stream && this.stream.end();
    }

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
        if(this.intakeHandler)
            this.intakeHandler(o);
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
        //console.log('post:',req);
        this.stream.write(req);        

        return true;
    }

    call(name) {
        if(!this.stream)
            return Promise.reject('not connected');

        return new Promise((resolve, reject) => {
            let stream = this.createStream();
            if(!stream)
                return reject('not connected');

            stream.on('data', (data) => {
                stream.end();
                resolve(data);
            });

            stream.on('error', (error) => {
                reject(error);
            })
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
        // })

        stream.on('error', (error)=>{
			console.log('stream error', error);
        })

		stream.on('metadata', function(...args) {
			console.log('stream metadata', args);
		});
		stream.on('status', function(...args) {
			console.log('stream status', args);
		});

		stream.on('data', function(data) {
			console.log('stream data', data);
			// stream.end();
		});

		stream.on('end', (a, b)=>{
			console.log('stream end', a, b);
		})
		stream.on('finish', (a, b)=>{
			console.log('stream finish', a, b);
		})

        setInterval(() => {

            let req = {
                getBlockDagInfoRequest:{}
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
		})
		stream.on('finish', (a, b)=>{
			console.log('stream finish', a, b);
		})

		let req = {
			getBlockDagInfoRequest:{}
		}
		stream.write(req);
	}

}

let rpc = new Kaspad_gRPC_Interface();
rpc.setAddress('localhost:16210');
rpc.testRPC();
// Kaspad_gRPC_Interface.testRPC_Client();

module.exports = Kaspad_gRPC_Interface;
