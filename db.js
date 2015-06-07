var levelup 	 = 	require('levelup');
var path 	 = 	require('path');
var dbPath 	 = 	process.env.DB_PATH || path.join(__dirname, 	 'mydb');
var db 	 = 	 levelup(dbPath);
module.exports 	 = 	 db;