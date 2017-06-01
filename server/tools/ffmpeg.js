////////////////////////////////////////////////////////////////////////////////
// ffmpeg tool
////////////////////////////////////////////////////////////////////////////////
/*global require, exports, console */
var	$path = require('path'),
	tool = require('../tools/tool').tool,
	ffprobeCollectData = require('./ffprobe').ffprobeCollectData,


ffmpeg = function () {
	self = Object.create(tool, {
		executable: {value: 'ffmpeg'},
		stderr: {value: true}
	});

	// collect video data using ffprobe
	function ffprobe(handler, inPath) {

		metadata = ffprobeCollectData(inPath);

		// passing on results
		handler(metadata);
		return metadata;
	}

	// extracts metadata from video file
	// - inPath: path to video file
	// - outPath: path to thumbnail, no thumbnail will be generated when absent
	// - count: number of thumbs to generate
	self.exec = function (inPath, outPath, count, handler) {

		mdata = ffprobe(function(metadata){ },inPath)
		var parts = mdata['duration'].split(":");
		var hours = parseFloat(parts[0]);
		var minutes = parseFloat(parts[1]);
		var seconds = parseFloat(parts[2]);

		var durationSec = 3600 * hours + 60 * minutes + seconds;
		var sstime = Math.round(durationSec * 10 /100);

		var ratio = ['16','9'];  // aspect ratio
		var size = ['174','98']; // thumbnail dimension

		var args = outPath ? [
			'-ss', sstime,
			'-i', inPath ,
			'-f', 'image2',
			'-vframes', count || 1,
			'-aspect', ratio[0] + ':' + ratio[1] ,
			'-filter:vf',
			   'scale=' +
			   '\'if(gt(a,'+ratio[0]+'/'+ratio[1]+'),'+size[0]+',-1)\':' +
			   '\'if(gt(a,'+ratio[0]+'/'+ratio[1]+'),-1,'+size[1]+')\',' +
			   'pad=' +
			   'w='+size[0]+':h='+size[1]+':' +
			   'x=(ow-iw)/2:y=(oh-ih)/2:' +
			   'color=black',
			'-y',
			outPath
		] : [
			'-i', inPath
		];

		// check if thumbnail exists
		tool.exec.call(self, args, function (code, stdout) {
			if (code === 0) {
				//console.log("aqui_inPath: " + inPath);
				ffprobe(function (metadata) {
					if (handler) {
						handler(metadata);
					}
				},inPath);

			} else if (handler) {
				handler();
			}
		}, true);
	};
	
	return self;
}();

exports.ffmpeg = ffmpeg;

