////////////////////////////////////////////////////////////////////////////////
// Cygpath
//
// Path resolution tool for Cygwin environment
////////////////////////////////////////////////////////////////////////////////
/*global require, exports */
const $path = require('path');
const tool = require('../tools/tool').tool;

var cygpath = function () {
	var self = Object.create(tool, {executable: {value: 'cygpath'}});
			
	self.exec = function (path, handler) {
		tool.exec.call(self, ['-w', path], handler ? function (code, data) {
			handler(data.replace(/\s+/g, ''));
		} : handler);
		return self;
	};
	
	return self;
}();

exports.cygpath = cygpath;

