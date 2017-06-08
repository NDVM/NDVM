////////////////////////////////////////////////////////////////////////////////
// ffprobe
//
// Execute "ffprobe" for each media file to determine if its a valid file
// and also to collect information about the video.
////////////////////////////////////////////////////////////////////////////////

const $path = require('path');
const execSync = require('child_process').execSync;


var ffprobe = function ffprobeCollectData(path) {
	// ffprobe arguments:
	var args = [
		'-of', 'json',
		'-show_streams',
		'-show_format',
		'-sexagesimal',
		'-v', 'quiet',
		'"' + path + '"'
	];
	var metadata = {};

	// execute ffprobe:
	var result = JSON.parse(execSync('ffprobe ' + args.join(" ") ));

	// check where is the 'video' to collect the data
	for (i = 0; i < result.streams.length; i++) {
		if ( result.streams[i]['codec_type'] === 'video') {
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

	return metadata;
}

exports.ffprobeCollectData = ffprobe;
