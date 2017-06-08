////////////////////////////////////////////////////////////////////////////////
// System Service Endpoints
////////////////////////////////////////////////////////////////////////////////
/*global require, exports */
const envelope = require('./envelope').envelope;
const processes = require('../logic/processes').processes;
const system = require('../utils/system').system;
const debugMsg = require('../utils/messager').debugMsg;

// runs the endpoint
// - endpoint: full path of endpoint e.g. "/lib/getall"
// - query: query object
// - res: response object
function run(endpoint, query, res) {
	debugMsg("AJAX/SYSTEM - Requested '"+ endpoint +"'");
	// executing command
	switch (endpoint) {
	case '/sys/dirlist':
		// querying directory structure
		envelope(res, false, function () {
			return system.tree(query.root ? query.root.split(',') : null);
		});
		break;
	
	case '/sys/poll':
		// polling processes
		envelope(res, true, function (ok) {
			if (!query.process) {
				throw "Missing parameters";
			}
			processes.poll(query.process, function (data) {
				ok(data);
			});
		});
		break;
			
	default:
		return false;
	}
	
	return true;
}

exports.run = run;

