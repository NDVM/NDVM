////////////////////////////////////////////////////////////////////////////////
// Thumbnail
//
// Generates thumbnail images for video files
////////////////////////////////////////////////////////////////////////////////
/*global require, exports, console */
const $fs = require('fs');
const $path = require('path');
const ffmpeg = require('../tools/ffmpeg').ffmpeg;

var thumb = function () {
	var self,
			cachePath = '../data/cache/';

	// create cache dir if doesn't exist
	if (!$fs.existsSync(cachePath)) {
		$fs.mkdirSync(cachePath, '0755');
	}

	self = {
		// generates thumbnail for video
		// - path: media path relative to root
		// - name: thumbnail file name
		generate: function (path, name, handler) {
			// checking if thumbnail is already there
			var inPath = path,
					outPath = cachePath + name + '.jpg';
			// generating thumbnail
			ffmpeg.exec(inPath, outPath, 1, handler);
		}
	};

	return self;
}();

// exports
exports.thumb = thumb;

