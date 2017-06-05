////////////////////////////////////////////////////////////////////////////////
// Library Service Endpoints
////////////////////////////////////////////////////////////////////////////////
/*global require, console, process, exports */
var $path = require('path');
var file = require('./file');
var envelope = require('./envelope').envelope;
var debugMsg = require('../utils/messager').debugMsg;
var library = require('../logic/library').library;

// runs the endpoint
// - endpoint: full path of endpoint e.g. "/lib/getall"
// - query: query object
// - res: response object
function run(endpoint, query, res) {
	debugMsg("AJAX/LIBRARY - Requested '"+ endpoint +"'");
	// executing command
	switch (endpoint) {
	case '/lib/getall':
		// retrieves library list and information on selected library
		envelope(res, true, function (ok) {
			library.list(function (data) {
				ok(data);
			});
		});
		break;

	case '/lib/select':
		// sets the selected library
		envelope(res, true, function (ok) {
			if (!query.name) {
				throw "Missing parameters";
			}
			library.set(query.name, function (data) {
				debugMsg("AJAX/LIBRARY - library changed");
				ok(data);
			});
		});
		break;

	case '/lib/save':
		// saves library
		if (!query.name) {
			throw "Missing parameters";
		}
		(function () {
			var filePath = $path.join(process.cwd(), '../data/db/' + query.name + '.sqlite');
			file.fetch(filePath, res);
		}());
		break;

	default:
		return false;
	}

	return true;
}

exports.run = run;

