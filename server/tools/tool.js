////////////////////////////////////////////////////////////////////////////////
// Command Line Tool
//
// Base class for command line execution
////////////////////////////////////////////////////////////////////////////////
/*global require, exports, Buffer, console */
var $child_process = require('child_process'),
	system = require('../utils/system').system,
	debugMsg = require('../utils/messager').debugMsg,

tool = {
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
	
	// function developed by Jean Lopes https://github.com/jeanlopes
	toolCallback : function (that ,code, stdout, silent, handler) {
		var message;
		if (code !== 0) {
			message = ["Tool", "'" + that.executable + "'", "exited with code:", code].join(" ") + ".";
			// tool failed
			if (silent === true) {
				console.log("TOOL - silently failed. " + message);
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
	},

	// executes tool in specified mode
	// - args: command line arguments to be passed to process
	// - handler: handler to run after execution completed
	// - silent: doesn't throw exception on nonzero return value
	exec: function (args, handler, silent) {
		var stdout = [],
				that = this;		// because of nested functions

		if (!that.executable) {
			throw "No executable defined for tool.";
		}

		// starting tool
		debugMsg(["TOOL - executing:", that.executable, args ? args.join(" ") : ""].join(" "));
		that.child = $child_process.spawn(that.executable, args);

		// workaround to fix NDVM on new nodejs versions
		var cmd_var;
		var cmd_reg = new RegExp( /^(.*?)media JOIN roots USING \(rootid\) WHERE mediaid/ );
		if (that.executable == 'gzip' || cmd_reg.test( args.join(" ") ))
		 { cmd_var = true; } else { cmd_var = false; }

		// callback
		function onData(data) {
			stdout.push(Buffer.isBuffer(data) ? data.toString(that.binary ? 'binary' : 'utf8') : data);

			if ( cmd_var === true ) {
				that.toolCallback(that, 0, stdout, silent, handler);
			}
		} 
		
		// data buffering
		that.child.stdout.on('data', onData);
		if (that.stderr) {
			that.child.stderr.on('data', onData);
		}
		
		// handling tool exit
		if ( cmd_var === false ) {
			that.child.on('exit', function (code) {
				that.toolCallback(that, 0, stdout, silent, handler);
			});
		}

		return that;
	}
};

// exports
exports.tool = tool;

