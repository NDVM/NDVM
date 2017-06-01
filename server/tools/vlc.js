////////////////////////////////////////////////////////////////////////////////
// VLC Video Playback Tool
////////////////////////////////////////////////////////////////////////////////
/*global require, exports */
var	tool = require('./tool').tool,

vlc = function () {
	var self = Object.create(tool, {executable: {value: 'vlc'}});
			
	self.exec = function (path, handler) {

		var args = ['-q', path];

		tool.exec.call(self, args, function (code, data) {
			if (handler) {
				handler(data);
			}
		});
		return self;
	};
	
	return self;
}();

exports.vlc = vlc;

