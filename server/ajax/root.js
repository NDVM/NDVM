////////////////////////////////////////////////////////////////////////////////
// Root Path Service Endpoints
////////////////////////////////////////////////////////////////////////////////
/*global require, exports */
const envelope = require('./envelope').envelope;
const library = require('../logic/library').library;
const debugMsg = require('../utils/messager').debugMsg;

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

