////////////////////////////////////////////////////////////////////////////////
// Tag Service Endpoints
////////////////////////////////////////////////////////////////////////////////
/*global require, exports */
var envelope = require('./envelope').envelope;
var library = require('../logic/library').library;
var tag = require('../db/tag').tag;
var debugMsg = require('../utils/messager').debugMsg;

// runs the endpoint
// - endpoint: full path of endpoint e.g. "/lib/getall"
// - query: query object
// - res: response object
function run(endpoint, query, res) {
	debugMsg("AJAX/TAG - Requested '"+ endpoint +"'");
	// executing command
	switch (endpoint) {
	case '/tag/add':
		// deleting tag
		envelope(res, true, function (ok) {
			if (!(query.mediaid || query.filter || query.mediaids) || !query.tag) {
				throw "Missing parameters";
			}
			tag.add(query, query.filter, query.mediaids, null, function () {
				ok(query);
			});
		});
		break;

	case '/tag/set':
		// updating tag
		envelope(res, true, function (ok) {
			if (!query.before || !query.after) {
				throw "Missing parameters";
			}
			tag.set(
				query.mediaid ?
					{mediaid: query.mediaid, tag: query.before} :
					{tag: query.before},
				{tag: query.after}, function () {
				ok(query);
			});
		});
		break;		
		
	case '/tag/explode':
		// exploding tag
		envelope(res, true, function (ok) {
			if (!query.tag) {
				throw "Missing parameters";
			}
			tag.explode(query, query.filter, query.mediaids, function () {
				ok(query);
			});
		});
		break;

	case '/tag/del':
		// deleting tag
		envelope(res, true, function (ok) {
			if (!query.tag) {
				throw "Missing parameters";
			}
			tag.remove(query, query.filter, query.mediaids, null, function () {
				ok(query);
			});
		});
		break;
				
	default:
		return false;
	}
	
	return true;
}

exports.run = run;

