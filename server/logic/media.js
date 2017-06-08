////////////////////////////////////////////////////////////////////////////////
// Video Library - Business Logic
//
// Interface for adding library root paths and ingesting their content
////////////////////////////////////////////////////////////////////////////////
/*global require, exports, console */
const vlc = require('../tools/vlc').vlc;
const entity = require('../db/media').media;
const debugMsg = require('../utils/messager').debugMsg;
const server = require('../server.js');

var media = function (mediaid) {
	var self = {
		// queries media information
		get: function (handler) {
			entity(mediaid).get(handler);
		},

		// plays back a video
		play: function (handler) {
			self.get(function (data) {				
				// starting playback
				var path = data[0].root + data[0].path;
				debugMsg("MEDIA - starting playback of file: " + path);

				var browser_extensions = '^.+\\.(mp4|webm|ogv|3gp)$';
				if ( path.match(browser_extensions) != null && server.HTML5PLAYER === true ) {
					var logicPath = path;
					exports.logicPath = logicPath;
				} else {				
					vlc.exec(path, function (path) {
						debugMsg("MEDIA - playback finished or interrupted");
					});
				}

				// not waiting for playback to finish
				if (handler) {
					handler(path);
				}
			});
			return self;
		},

		// rates media file
		rate: function (rating, handler) {
			debugMsg("MEDIA - rating media: " + mediaid + " at: " + rating);
			entity(mediaid).set({rating: rating}, handler);
			return self;
		}
	};

	return self;
};

// exports
exports.media = media;

