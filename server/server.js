////////////////////////////////////////////////////////////////////////////////
// NDVM Application Server
////////////////////////////////////////////////////////////////////////////////
/*global require, process, console */
const $http = require('http');
const $url = require('url');
const $path = require('path');
const $fs = require('fs');
const browser = require('./tools/browser').browser;
const file = require('./ajax/file');
const logicMedia = require('./logic/media');
const debugMsg = require('./utils/messager').debugMsg;

// modules
const library = require('./ajax/library');
const media = require('./ajax/media');
const tag = require('./ajax/tag');
const root = require('./ajax/root');
const system = require('./ajax/system');

// environmental variables
var port = 7519;         // node.js port (0 = random)
var debug = false;       // debug (true/false)
var runBrowser = true;   // launch browser (true/false)
var html5Player = false; // html5 player (true/false)


// electron framework
var electron = process.versions['electron'] ? true : false;
if (electron) {	runBrowser = false; }

// server object
var server;

// processing command line arguments
(function () {
	var argv = process.argv;
	var i;

	for (i = 0; i < argv.length; i++) {
		switch (argv[i]) {
		case 'debug':
			debug = true;
			console.log("DEBUG enabled");
			break;
		case 'port':
			port = parseInt(argv[i + 1], 10) || 7519;
			console.log("PORT set to " + port);
			break;
		case 'nobrowser':
			runBrowser = false;
			console.log("'No Browser' feature enabled");
			break;
		}
	}
}());

// creating server object
server = $http.createServer(function (req, res) {
	var url = $url.parse(req.url, true);
	var endpoint = url.pathname;
	var query = url.query;
	var ok;

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
			var filePath;

			switch (endpoint.split('/')[1]) {
			case 'cache':
				filePath = $path.join(process.cwd(), '../data' + endpoint);
				break;
			default:
				filePath = $path.join(process.cwd(), '../client' + endpoint);
				break;
			}

			file.fetch(filePath, res, debug);
		}());
	}
});

server.listen(port, '0.0.0.0', function () {
	port = server.address().port;

	var url = 'http://127.0.0.1:' + port;
	console.log("Server running at " + url);

	if ( runBrowser ) {
		browser.exec(url, function () {
			console.log("Browser started.");
		});
	}
});

// export variables
module.exports.debug = debug;
module.exports.html5Player = html5Player;
module.exports.port = port;
