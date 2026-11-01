'use strict';

/* global globalThis */

// Unify the JavaScript realm for the flow-rpc BroadcastChannel transport in the
// NWJS renderer before any window code constructs a channel.
//
// @aspectron/flow-rpc is loaded with require(), so its `new BroadcastChannel()`
// resolves the constructor from Node's (worker_threads) global, not the DOM. In
// the renderer that Node BroadcastChannel constructs a DOM-realm MessageEvent on
// delivery and dispatches it on a Node EventTarget, which rejects anything that is
// not a Node Event ("The \"event\" argument must be an instance of Event. Received
// an instance of MessageEvent"). Binding the DOM BroadcastChannel and MessageEvent
// onto every reachable global keeps the BroadcastChannel -> MessageEvent ->
// EventTarget chain in a single (DOM) realm; the DOM BroadcastChannel is also the
// correct transport for same-origin cross-window messaging between the KDX windows.
//
// This script unifies the realm only for the renderer pages. The main process
// keeps "main": "kdx.js" (so the renderer windows retain NWJS node-app module
// semantics); the background page NWJS synthesizes for a JS main is not a live
// realm, so the main process binds its flow-rpc transport on a node-disabled
// iframe (resources/rpc-host.html) whose live realm joins the BroadcastChannel
// delivery router. The main and renderer windows then share one DOM channel.

(() => {
	if (typeof window === 'undefined' || typeof window.BroadcastChannel !== 'function') {
		return;
	}

	const domBroadcastChannel = window.BroadcastChannel;
	const domMessageEvent = window.MessageEvent;
	const domWebSocket = window.WebSocket;

	// Force the browser (single-argument) WebSocket construction path for the wRPC
	// transport. The kaspa WASM SDK is a wasm-pack web-target build whose
	// workflow-websocket client mis-detects the NWJS mixed Node+DOM renderer as Node.js
	// and constructs the socket through the Node `ws`-module config form, e.g.
	//   new WebSocket(url, undefined, undefined, undefined, undefined,
	//                 { maxReceivedFrameSize, maxReceivedMessageSize })
	// The browser-native WebSocket signature is (url, protocols); driven with the
	// trailing Node-`ws` options it upgrades the connection (HTTP 101) but never
	// reaches the OPEN state, so RpcClient.connect() never resolves and the node
	// monitor stays stuck on CONNECTING. Constructing with only the URL drops the
	// Node-config arguments and drives the browser socket on its real signature.
	let browserWebSocket = null;
	if (typeof domWebSocket === 'function') {
		browserWebSocket = function WebSocket(url) {
			return new domWebSocket(url);
		};
		browserWebSocket.prototype = domWebSocket.prototype;
		browserWebSocket.CONNECTING = domWebSocket.CONNECTING;
		browserWebSocket.OPEN = domWebSocket.OPEN;
		browserWebSocket.CLOSING = domWebSocket.CLOSING;
		browserWebSocket.CLOSED = domWebSocket.CLOSED;
	}

	// A require()'d module resolves its globals against Node's `global`, while page
	// scripts resolve against `window`/`globalThis`; under the NWJS mixed context
	// these can be distinct objects, so bind across all of them (deduplicated).
	const scopes = [];
	const candidates = [
		typeof globalThis !== 'undefined' ? globalThis : null,
		typeof global !== 'undefined' ? global : null,
		window,
	];
	for (const scope of candidates) {
		if (scope && !scopes.includes(scope)) {
			scopes.push(scope);
		}
	}

	for (const scope of scopes) {
		scope.BroadcastChannel = domBroadcastChannel;
		if (typeof domMessageEvent === 'function') {
			scope.MessageEvent = domMessageEvent;
		}
		if (browserWebSocket) {
			scope.WebSocket = browserWebSocket;
		}
	}

	console.log(`KDX::realm-preload bound DOM BroadcastChannel/MessageEvent/WebSocket across ${scopes.length} global scope(s)`);
})();
