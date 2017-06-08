////////////////////////////////////////////////////////////////////////////////
// GZip
////////////////////////////////////////////////////////////////////////////////
/*global require, exports */
const tool = require('../tools/tool').tool;

var gzip = function () {
	var self = Object.create(tool, {executable: {value: 'gzip'}, binary: {value: true}});
	
	self.exec = function (handler) {
		tool.exec.call(self, [], function (code, data) {
			if (handler) {
				handler(data);
			}
		});
	};
	
	return self;
}();

exports.gzip = gzip;

