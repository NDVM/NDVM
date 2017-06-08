////////////////////////////////////////////////////////////////////////////////
// Media Entity
////////////////////////////////////////////////////////////////////////////////
/*global require, exports, console */
const entity = require('../db/entity').entity;
const db = require('../db/db').db;
const debugMsg = require('../utils/messager').debugMsg;

// constructs a where clause that will retrieve
// media records filtered by tags
var filter = function (tags, table) {
	var names = tags.split(/\s*[^A-Za-z0-9:\s]+\s*/);
	var clause = [];
	var i;

	for (i = 0; i < names.length; i++) {
		clause.push("',' || group_concat(name) LIKE '%," + names[i] + "%'");
	}
	return [
		"AND",
		(table ? table + '.' : '') + "mediaid IN (",
		"SELECT mediaid FROM tags",
		"GROUP BY mediaid",
		"HAVING",
		clause.join(" AND "),
		")"
	].join(" ");
};

// constructs a where clause that will retrieve
// media records by their id
var selection = function (mediaids) {
	var tmp = mediaids.split(/[^0-9]+/);
	return [
		"AND mediaid IN (",
		tmp.join(","),
		")"
	].join(" ");
};

var media = function (mediaid) {
	var self = Object.create(entity, {kind: {value: 'media'}, key: {value: 'mediaid'}});

	self.get = function (handler) {
		var statement = [
			"SELECT mediaid, roots.path AS root, media.path AS path, hash",
			"FROM media",
			"JOIN roots USING (rootid)",
			"WHERE mediaid =", mediaid
		].join(" ");
		debugMsg("DB/MEDIA - get - SQL: " + statement);
		db.query(statement, handler);
	};
	
	self.multiGet = function (mediaids, handler) {
		var statement = [
			"SELECT roots.rootid, mediaid, roots.path AS root, media.path AS path, hash",
			"FROM media",
			"JOIN roots USING (rootid)",
			"WHERE mediaid IN", "('" + mediaids.join("','") + "')"
		].join(" ");
		debugMsg("DB/MEDIA - multiGet - SQL: " + statement);
		db.query(statement, handler);
	};
	
	self.set = function (after, handler) {
		entity.set.call(self, {mediaid: mediaid}, after, handler);
	};
	
	return self;
};

exports.filter = filter;
exports.selection = selection;
exports.media = media;

