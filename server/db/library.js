////////////////////////////////////////////////////////////////////////////////
// Video Library - Data Model
////////////////////////////////////////////////////////////////////////////////
/*global require, exports, console */
var $path = require('path');
var $media = require('../db/media');
var quotes = require('../db/entity').quotes;
var db = require('../db/db').db;
var debugMsg = require('../utils/messager').debugMsg;

var library = function () {
	var self = {
		// queries all media ids under a root
		getPaths: function (rootid, handler) {
			var statement = [
				"SELECT path",
				"FROM media",
				"WHERE rootid =", rootid
			].join(" ");
			
			debugMsg("DB/LIBRARY - getPaths - SQL: "+ statement);
			db.query(statement, handler);
		},
		
		// queries the entire library
		getMedia: function (filter, handler) {
			var statement = [
				"SELECT media.mediaid, hash, roots.path || media.path AS path, rating, tags, keywords",
				"FROM media",
				"JOIN roots USING (rootid)",
				"NATURAL LEFT JOIN (",
				"SELECT mediaid,",
				"group_concat(name || ':' || CASE WHEN kind IS NOT NULL THEN kind ELSE '' END) AS tags",
				"FROM tags",
				"GROUP BY mediaid)",
				"NATURAL LEFT JOIN (",
				"SELECT mediaid,",
				"group_concat(key || ':' || replace(value, ',', ' ')) AS keywords",
				"FROM keywords",
				"GROUP BY mediaid)",
				"WHERE 1",
				filter ? $media.filter(filter, 'media') : ""
			].join(" ");
			
			debugMsg("DB/LIBRARY - getMedia - SQL: "+ statement);
			db.query(statement, handler);
		},
		
		// deletes media entries from library
		// - mediaids: comma separated list of media ids
		delMedia: function (mediaids, handler) {
			var clause = 'WHERE mediaid IN (' + mediaids + ')';

			var statement = [
				'BEGIN TRANSACTION;',
				'DELETE FROM keywords ' + clause + ';',
				'DELETE FROM tags ' + clause + ';',
				'DELETE FROM media ' + clause + ';',
				'COMMIT;'
			].join('\n');
			
			debugMsg("DB/LIBRARY - delMedia - SQL: "+ statement);
			db.nonQuery(statement, handler);			
		},
		
		// inserts videos into the database
		// - rootid: id of root for videos
		// - data: keywords indexed by path (rel. to root)
		// 	 format: {rootid: {path: {keyword: value}}}
		// - options: specifies what sort of information to store
		//	 format: {keywords: bool, tags: bool} (default is 'true' for both)
		fill: function (data, options, handler) {
			var statement = [];
			var rootid;
			var paths, path;
			var keywords, keyword;
			var tags, i;
			var lastid = "(SELECT value FROM vars WHERE name = 'lastid')";
			var count = 0;

			statement.push("BEGIN TRANSACTION;");

			// adding temporary table to store last accessed media id
			statement.push("CREATE TEMPORARY TABLE vars (name TEXT, value INTEGER);");
			statement.push("INSERT INTO vars (name, value) VALUES ('lastid', 0);");
			
			for (rootid in data) {
				if (data.hasOwnProperty(rootid)) {
					paths = data[rootid];
					for (path in paths) {
						if (paths.hasOwnProperty(path)) {
							// inserting statement for media path
							statement.push([
								"INSERT OR IGNORE INTO media (rootid, path)",
								"VALUES (",
								rootid + ",",
								"'" + quotes(path) + "'",
								");"
							].join(" "));
							
							// updating last accessed media id so sub-inserts can use that
							statement.push([
								"UPDATE vars SET value = (",
								"SELECT mediaid FROM media",
								"WHERE",
								"rootid = " + rootid, "AND",
								"path = '" + quotes(path) + "'",
								")",
								"WHERE name = 'lastid';"
							].join(" "));
							
							// inserting statement for media keywords (properties)
							if (options.keywords !== false) {
								keywords = paths[path];
								for (keyword in keywords) {
									if (keywords.hasOwnProperty(keyword)) {
										statement.push([
											"INSERT OR REPLACE INTO keywords (mediaid, key, value) VALUES (",
											lastid, ",'",
											keyword, "','",
											quotes(keywords[keyword]),
											"');"
										].join(""));
									}
								}
							}
							
							// inserting statement for auto tags
							if (options.tags !== false) {
								tags = []
									// filename broken down into its word-like components
									.concat($path.basename(path, $path.extname(path)).split(/[^A-Za-z0-9]+/))
									// path stripped of non-word characters and broken down by directory levels
									.concat($path.dirname(path).replace(/[^A-Za-z0-9\/\\\s]+/g, ' ').split(/[\/\\]/));
				
								for (i = 0; i < tags.length; i++) {
									if (!tags[i].length) {
										continue;
									}
									statement.push([
										"INSERT OR REPLACE INTO tags (mediaid, name) VALUES (",
										lastid, ",'",
										quotes(tags[i]),
										"');"				
									].join(""));
								}
							}
							
							// one more path processed
							count++;
						}
					}
				}
			}
			statement.push("COMMIT;");
			
			if (count > 0) {
				// executing statement
				debugMsg("DB/LIBRARY - ingest SQL statement built: " + statement.length + " lines");
				db.nonQueryPiped(statement.join('\n'), handler);
			} else {
				handler();
			}

			return self;
		}
	};
	
	return self;
}();

exports.library = library;

