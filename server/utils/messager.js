// Copyright (C) 2016 by Henrique Lechner
////////////////////////////////////////////////////////////////////////////////
// Shell Message Sender
//
// Provide an organized way to send message to system shell.
////////////////////////////////////////////////////////////////////////////////
var	os = require('os').platform,
	server = require('../server.js'),
	msg;

// check the OS which should receive a colored message.
var colorMsg = {
	'linux': true,
	'freebsd': true,
	'openbsd': true,
	'sunos': true,
	'darwin': true
}[os()] || false;

var debug = function debugMsg(msg) {
	var debugInfo = {
		true: '\x1b[1;93m[DEBUG]\x1b[0m'
	}[colorMsg] || '[DEBUG]'

	// send message if debug is enabled
	if ( server.DEBUG === true ) {
		console.log( debugInfo, msg );
	}
}

exports.debugMsg = debug;