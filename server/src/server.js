////////////////////////////////////////////////////////////////////////////////
// NDVM Application Server
////////////////////////////////////////////////////////////////////////////////
/*global require, process, console */
var	$http = require('http'),
		$url = require('url'),
		$path = require('path'),
		browser = require('./tools/browser').browser,
		file = require('./ajax/file'),

		// modlules
		library = require('./ajax/library'),
		media = require('./ajax/media'),
		tag = require('./ajax/tag'),
		root = require('./ajax/root'),
		system = require('./ajax/system'),
		
		// environmental variables
		PORT = 7519,
		DEBUG = false,
		BROWSER = true,
		
		// server object
		server;
		
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

module.exports.DEBUG = DEBUG;

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
		
	case 'pack':
		// packs css of js files together in one request
		(function () {
			var type = {'css': 'css', 'js': 'js'}[query.type] || 'js',
					ext = '.' + type,
					files = query.files.split(/\s*,\s*/),
					i, filePath;
			res.writeHead(200, {"Content-Type": "text/" + {'css': 'css', 'js': 'javascript'}[type]});
			for (i = 0; i < files.length; i++) {
				if (files[i].split('/')[0] === 'common') {
					filePath = $path.join(process.cwd(), '../../' + files[i] + ext);
				} else {
					filePath = $path.join(process.cwd(), '../../client/www/' + files[i] + ext);
				}
				file.add(filePath, res);
			}
			res.end();
		}());
		break;
		
	default:
		// acting as static file server
		(function () {
			var	filePath;
				
			switch (endpoint.split('/')[1]) {
			case 'cache':
				filePath = $path.join(process.cwd(), '..' + endpoint);
				break;
			case 'common':
				filePath = $path.join(process.cwd(), '../..' + endpoint);
				break;
			default:
				filePath = $path.join(process.cwd(), '../../client/www' + endpoint);
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

