////////////////////////////////////////////////////////////////////////////////
// Root Path Service Endpoints
////////////////////////////////////////////////////////////////////////////////
/*global require, exports */
var envelope = require('./envelope').envelope;
var library = require('../logic/library').library;
var debugMsg = require('../utils/messager').debugMsg;

// runs the endpoint
// - endpoint: full path of endpoint e.g. "/lib/getall"
// - query: query object
// - res: response object
function run(endpoint, query, res) {
	debugMsg("AJAX/ROOT - Requested '"+ endpoint +"'");
	// executing command
	if (endpoint === '/root/add') {
		// adding path to root collection or library
		envelope(res, true, function (ok) {
			if (!query.path) {
				throw "Missing parameters";
			}
			// adding root path
			library.addRoot(query.path, function () {
				ok(query);
			});
		});
		
		return true;
	} else {
		return false;
	}
}

exports.run = run;

