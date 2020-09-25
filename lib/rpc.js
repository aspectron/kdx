const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const utils = require('./utils');
const { dpc } = require('@aspectron/flow-async');
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

/*
const {GoogleAuth} = require('google-auth-library');


console.log("gRPC", gRPC)

let channel_creds = gRPC.credentials.createSsl(null);
(new GoogleAuth()).getApplicationDefault((err, credential)=>{
	let call_creds = gRPC.credentials.createFromGoogleCredential(credential);
	let combined_creds = gRPC.credentials.combineChannelCredentials(
		  channel_creds, call_creds);
	//console.log("combined_creds ", combined_creds )
	let client = new gRPC.Client('0.0.0.0:16210', combined_creds);
	client.waitForReady(Date.now() + 1000, ()=>{
		console.log("client is ready", client)
	})
	//console.log("client client ", client)
});


let client = null;//new gRPC.Client();

//console.log("gRPC", client, gRPC.Client, gRPC)
*/


class Kaspad_gRPC_Interface  {
	constructor(ident) {
		//super();
		this.args = utils.args();
		this.flags = { ...this.args }
		this.ident = ident;
	}

	static testRPC(){
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

Kaspad_gRPC_Interface.testRPC();

module.exports = Kaspad_gRPC_Interface;
