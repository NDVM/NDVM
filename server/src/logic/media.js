////////////////////////////////////////////////////////////////////////////////
// Video Library - Business Logic
//
// Interface for adding library root paths and ingesting their content
////////////////////////////////////////////////////////////////////////////////
/*global require, exports, console */
var		entity = require('../db/media').media,
		debugMsg = require('../utils/messager').debugMsg,

media = function (mediaid) {
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

				var logicPath = path;
				exports.logicPath = logicPath;

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

