////////////////////////////////////////////////////////////////////////////////
// Database
////////////////////////////////////////////////////////////////////////////////
/*global require, exports, console */
var	sqlite = require('../tools/sqlite').sqlite,

db = function () {
	var self,
			name;
	
	// creates database
	function create(handler) {
		console.log("DB - creating DB: " + name);
		sqlite.exec('create.sql', handler, [], true);
	}
	
	self = {
		// switches databases
		name: function (value, handler) {
			name = value;
			console.log("DB - switching over to DB: " + name);
			// switching to new db
			sqlite.db(name);
			if (!sqlite.exists()) {
				// creating new db
				create(handler);
			} else if (handler) {
				handler();
			}
		},

		// executes statement that return data		
		query: function (statement, handler) {
			console.log("DB/" + name + " - executing query");
			sqlite.exec(statement, handler, ['-header', '-line']);
		},
		
		// executes statement that changes data
		nonQuery: function (statement, handler) {
			console.log("DB/" + name + " - executing non-query");
			sqlite.exec(statement, handler);
		},
		
		// executes statement that changes data
		// feeds input to sqlite process with pipe
		nonQueryPiped: function (statement, handler) {
			console.log("DB/" + name + " - executing non-query with pipe");
			sqlite.exec(statement, handler, [], true);
		}
	};
	
	self.name('default');
	
	return self;
}();

exports.db = db;

