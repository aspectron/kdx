const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const utils = require('./utils');
const { dpc } = require('@aspectron/flow-async');
const gRPC = require('grpc');


class Kaspad_gRPC_Interface  {
	constructor(ident) {
		super();
		this.args = utils.args();
		this.flags = { ...this.args }
		this.ident = ident;
	}

}

module.exports = Kaspad_gRPC_Interface;
