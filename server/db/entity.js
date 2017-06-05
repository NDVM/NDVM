////////////////////////////////////////////////////////////////////////////////
// Data Entity
//
// Base class for table records
////////////////////////////////////////////////////////////////////////////////
/*global require, exports, console */
var db = require('../db/db').db;
var debugMsg = require('../utils/messager').debugMsg;

// escapes quotes in SQL statements by duplicating them
var quotes = function (text) { return text.replace(/'/g, "''"); };

// splits an object's keys and values into separate arrays
var split = function (object) {
	var key;
	var keys = [];
	var values = [];

	for (key in object) {
		if (object.hasOwnProperty(key)) {
			keys.push(key);
			values.push(["'", quotes(object[key]), "'"].join(""));
		}
	}
	return {'keys': keys, 'values': values};
};

// returns an array that can be used as a where or set clause
// depending on how you concatenate them
// - object: key - value pairs aka. conditions in AND relationship
// - caseless: whether conditions should be case insensitive
var clause = function (object, caseless) {
	var key, value;
	var result = [];

	for (key in object) {
		if (object.hasOwnProperty(key)) {
			value = quotes(object[key]);
			result.push([
				caseless ? 'lower(' + key + ')' : key,
				"=",
				["'", caseless ? value.toString().toLowerCase(): value, "'"].join("")
			].join(' '));
		}
	}
	return result;
};

var entity = {
	// kind of entity (aka. table name)
	kind: null,
	
	// primary key in entity
	key: null,
	
	// gets the entity(ies) from database
	get: function (before, handler) {
		var where = clause(before || {});

		var statement = [
			"SELECT * FROM",
			this.kind,
			where.length ? ["WHERE", where.join(" AND ")].join(" ") : ""
		].join(" ");

		debugMsg("DB/ENTITY - get - SQL: " + statement);
		db.query(statement, handler);
		
		return this;
	},
	
	// retrieves multiple rows from table
	// - keys: keys for rows to return
	multiGet: function (keys, handler) {
		if (!this.key) {
			throw "Entity key undefined.";
		}

		var statement  = [
			"SELECT * FROM",
			this.kind,
			"WHERE", this.key, "IN", "('" + keys.join("','") + "')"
		].join(" ");

		debugMsg("DB/ENTITY - multiGet - SQL: " + statement);
		db.query(statement, handler);
		
		return this;		
	},
	
	// adds an entity of this kind
	add: function (after, handler) {
		var pair = split(after);

		var statement = [
			"INSERT OR IGNORE INTO",
			this.kind,
			["(", pair.keys.join(","), ")"].join(""),
			"VALUES",
			["(", pair.values.join(","), ")"].join("")
		].join(" ");

		debugMsg("DB/ENTITY - add - SQL: " + statement);
		db.nonQuery(statement, handler);
		
		return this;
	},
	
	// changes the entity in the database
	set: function (before, after, handler) {
		var set = clause(after || {});
		var where = clause(before || {});

		var statement = [
			"UPDATE",
			this.kind,
			"SET",
			set.join(","),
			where.length ? ["WHERE", where.join(" AND ")].join(" ") : ""
		].join(" ");

		debugMsg("DB/ENTITY - set - SQL: " + statement);
		db.nonQuery(statement, handler);
		
		return this;
	},
	
	// updates multiple rows in table
	// - after: lookup table containing all updated rows
	// 	 indexed by key
	multiSet: function (after, handler) {
		if (!this.key) {
			throw "Entity key undefined.";
		}

		var statement = [];
		var key, set;
		var counter = 0;
		
		statement.push("BEGIN TRANSACTION");
		for (key in after) {
			if (after.hasOwnProperty(key)) {
				set = clause(after[key] || {});
				statement.push([
					"UPDATE",
					this.kind,
					"SET",
					set.join(","),
					"WHERE", this.key, "=", "'" + key + "'"
				].join(" "));
				counter++;
			}
		}
		statement.push("COMMIT");

		if (counter > 0) {
			debugMsg("DB/ENTITY - multiSet SQL statement built: " + statement.length + " lines");
			db.nonQuery(statement.join(";\n"), handler);
		} else if (handler) {
			handler();
		}
		
		return this;
	},
	
	// removes an entity of this kind
	remove: function (before, handler) {
		var where = clause(before || {});

		var statement = [
			"DELETE FROM",
			this.kind,
			"WHERE",
			where.join(" AND ")
		].join(" ");

		debugMsg("DB/ENTITY - remove - SQL: " + statement);
		db.nonQuery(statement, handler);

		return this;		
	}
};

exports.entity = entity;
exports.quotes = quotes;
exports.split = split;
exports.clause = clause;

