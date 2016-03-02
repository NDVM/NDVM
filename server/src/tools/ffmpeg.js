////////////////////////////////////////////////////////////////////////////////
// ffmpeg tool
////////////////////////////////////////////////////////////////////////////////
/*global require, exports, console */
var	$path = require('path'),
	tool = require('../tools/tool').tool,
	execSync = require('child_process').execSync,

ffmpeg = function () {
	var

	self = Object.create(tool, {
		executable: {value: 'ffmpeg'},
		stderr: {value: true}
	});

	// collect video data using ffprobe
	function ffprobe(handler, inPath) {
	
		// ffprobe arguments:	
		var args = [
			'-of', 'json',
			'-show_streams',
			'-show_format',
			'-sexagesimal',
			'-v', 'quiet',
			'"' + inPath + '"'
		];
		var metadata = {};		
		
		// execute ffprobe:
		var result = JSON.parse(execSync('ffprobe ' + args.join(" ") ));
		
		// check where is the 'video' to collect the data		  
		for (i = 0; i < result.streams.length; i++) {
			if ( result.streams[i]['codec_type'] === 'video' ) {
				var arr = i;
				break;
			}
		}
		
		// fields to collect:		  
		var field = [
			'dimensions',
			'duration',
			'codec_name'
		];
		
		// collecting data
		for (i in field) {
			switch(field[i]){
				case 'dimensions':
					var width=JSON.stringify(result.streams[arr][ 'width' ]);
					var height=JSON.stringify(result.streams[arr][ 'height' ]);
					metadata[ field[i] ]= width + 'x' + height;
					break;
				case 'duration':
					metadata[ field[i] ]= result.format.duration.split('.')[0];
					break;
				default:
					if ( result.streams[arr][ field[i] ] != undefined ) {
						var field_rst = JSON.stringify(result.streams[arr][ field[i] ]);
						metadata[ field[i] ]= field_rst.replace(/"/g, '');
					}
					break;
			}
		};
		
		// passing on results
		handler(metadata);
	}
	
	// extracts metadata from video file
	// - inPath: path to video file
	// - outPath: path to thumbnail, no thumbnail will be generated when absent
	// - count: number of thumbs to generate
	self.exec = function (inPath, outPath, count, handler) {
		var args = outPath ? [
			'-i', inPath,
			'-f', 'image2',
			'-vframes', count || 1,
			'-aspect', '4:3',
			'-filter:vf', 'scale=\'if(gt(a,4/3),128,-1)\':' + 
			   '\'if(gt(a,4/3),-1,96)\',' + 
			   'pad=w=128:h=97:x=(ow-iw)/2:y=(oh-ih)/2:color=black',
			'-y',
			'-ss', '15',
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

