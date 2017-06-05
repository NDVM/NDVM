////////////////////////////////////////////////////////////////////////////////
// NDVM Application Server
////////////////////////////////////////////////////////////////////////////////
/*global require, process, console */
var $http = require('http');
var $url = require('url');
var $path = require('path');
var $fs = require('fs');
var browser = require('./tools/browser').browser;
var file = require('./ajax/file');
var logicMedia = require('./logic/media');
var debugMsg = require('./utils/messager').debugMsg;

// modules
var library = require('./ajax/library');
var media = require('./ajax/media');
var tag = require('./ajax/tag');
var root = require('./ajax/root');
var system = require('./ajax/system');

// environmental variables
var PORT = 7519;         // node.js port
var DEBUG = false;       // debug (true/false)
var BROWSER = true;      // launch browser (true/false)
var HTML5PLAYER = false; // html 5 player (true/false)

// server object
var server;

// processing command line arguments
(function () {
	var argv = process.argv,
			i;
	for (i = 0; i < argv.length; i++) {
		switch (argv[i]) {
		case 'debug':
			DEBUG = true;
			console.log("DEBUG enabled");
			break;
		case 'port':
			PORT = parseInt(argv[i + 1], 10) || 7519;
			console.log("PORT set to " + PORT);
			break;
		case 'nobrowser':
			BROWSER = false;
			console.log("'No Browser' feature enabled");
			break;
		}
	}
}());

// export variables
module.exports.DEBUG = DEBUG;
module.exports.HTML5PLAYER = HTML5PLAYER;

// creating server object
server = $http.createServer(function (req, res) {
	var	url = $url.parse(req.url, true),
			endpoint = url.pathname,
			query = url.query,
			ok;

  // executing command
	switch (endpoint.split('/')[1]) {
	case 'lib':
		library.run(endpoint, query, res);
		break;

	case 'media':
		media.run(endpoint, query, res);
		break;

	case 'tag':
		tag.run(endpoint, query, res);
		break;

	case 'root':
		root.run(endpoint, query, res);
		break;

	case 'sys':
		system.run(endpoint, query, res);
		break;

	case 'video-stream':
		debugMsg("SERVER.js - Requested '"+ endpoint +"'");
		(function () {
			var mediaid = req.url.split('?')[1];

			logicMedia.media(mediaid).play();
			var _file = logicMedia.logicPath;

			var range = req.headers.range;
			var positions = range.replace(/bytes=/, "").split("-");
			var start = parseInt(positions[0], 10);

			$fs.stat(_file, function(err, stats) {
				var total = stats.size;
				var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
				var chunksize = (end - start) + 1;

				res.writeHead(206, {
					"Content-Range": "bytes " + start + "-" + end + "/" + total,
					"Accept-Ranges": "bytes",
					"Content-Length": chunksize
				});

			var stream = $fs.createReadStream(_file, { start: start, end: end })
			   .on("open", function() {
				stream.pipe(res);
			   }).on("error", function(err) {
				res.end(err);
			   });
			});
		}());
		break;

	default:
		// acting as static file server
		(function () {
			var	filePath;

			switch (endpoint.split('/')[1]) {
			case 'cache':
				filePath = $path.join(process.cwd(), '../data' + endpoint);
				break;
			default:
				filePath = $path.join(process.cwd(), '../client' + endpoint);
				break;
			}

			file.fetch(filePath, res, DEBUG);
		}());
	}
});

var url = 'http://127.0.0.1:' + PORT;
server.listen(PORT, '0.0.0.0', function () {
	console.log("Server running at " + url);
	if ( BROWSER === true ) {
		browser.exec(url, function () {
			console.log("Browser started.");
		});
	}
});

