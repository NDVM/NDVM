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

var debug = function debugMsg(msg, debugmsg, stdout) {
	// msg = to be printed on console.log/stdout.write
	// debugmsg = display [DEBUG]
	// stdout = stdout.write instead of console.log
	debugmsg ? debugmsg : true
	stdout ? stdout : false
	
	var debugInfo = {
		true: '\x1b[1;93m[DEBUG]\x1b[0m'
	}[colorMsg] || '[DEBUG]'
	
	if (debugmsg === true){
		msg = debugInfo + " " + msg
	}

	// send message if debug is enabled
	if ( server.DEBUG === true ) {
		if ( stdout === true ) {
			process.stdout.write( msg );
		} else {
			console.log( msg );
		}
	}
}

exports.debugMsg = debug;
