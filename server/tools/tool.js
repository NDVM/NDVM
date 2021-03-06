////////////////////////////////////////////////////////////////////////////////
// Command Line Tool
//
// Base class for command line execution
////////////////////////////////////////////////////////////////////////////////
/*global require, exports, Buffer, console */
const $child_process = require('child_process');
const system = require('../utils/system').system;
const debugMsg = require('../utils/messager').debugMsg;

var tool = {
	// line break string depending on OS
	// to be used in RegExp objects only!
	lineBreak: system.os in {'windows': 'windows', 'cygwin': 'cygwin'} ? '\\r\\n' : '\\n',
	
	// name of executable file
	executable: null,
	
	// whether the tool's output is binary
	binary: null,
	
	// whether to collect data from stderr as well
	stderr: false,

	// parser interpreting the tool's output
	parser: null,
	
	// child process
	child: null,
	
	// pipes data to the child process' input
	pipe: function (data) {
		if (this.child) {
			this.child.stdin.end(data);
		}
		return this;
	},
	
	// executes tool in specified mode
	// - args: command line arguments to be passed to process
	// - handler: handler to run after execution completed
	// - silent: doesn't throw exception on nonzero return value
	exec: function (args, handler, silent) {
		var stdout = [];
		var that = this;	// because of nested functions

		if (!that.executable) {
			throw "No executable defined for tool.";
		}

		// starting tool
		debugMsg(["TOOL - executing:", that.executable, args ? args.join(" ") : ""].join(" "));
		that.child = $child_process.spawn(that.executable, args);

		// callback
		function onData(data) {
			debugMsg("TOOL - data return from: '"+ that.executable +
			         "' - lenght of data: " + data.length);

			stdout.push(Buffer.isBuffer(data) ?
			    data.toString(that.binary ? 'binary' : 'utf8') : data);
		}

		// data buffering
		that.child.stdout.on('data', onData);
		if (that.stderr) {
			that.child.stderr.on('data', onData);
		}

		// handling tool exit
		that.child.on('exit', function (code) {
			var message;

			// setTimeout: workaround to make sure 'data' finish first
			setTimeout(function () {
				if (code !== 0) {
					message = ["Tool", "'" + that.executable + "'",
							   "exited with code:", code].join(" ") + ".";
					// tool failed
					if (silent === true) {
						if(that.executable === 'sqlite3'){
							console.log("TOOL - silently failed. " + message);
						} else {
							debugMsg("TOOL - silently failed. " + message);
						}
						// wrapping up
						if (handler) {
							handler(code);
						}
					} else {
						// taking it seriously
						throw message;
					}
				} else if (handler) {
					if (that.parser) {
						// returning parsed data
						that.child = null;
						handler(code, that.parser.parse(stdout.join('')));
					} else {
						// returning string
						handler(code, stdout.join(''));
					}
				}
			}, 1);
		});

		return that;
	}
};

// exports
exports.tool = tool;

