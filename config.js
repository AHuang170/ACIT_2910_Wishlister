var mysql = require('mysql');
require('dotenv').config();
var connection = mysql.createConnection({
    host     : process.env.host,
    user     : process.env.user,
    password : process.env.password,
    database : process.env.database,
    port     : 3306
});

var secretKey = process.env.secretKey;

module.exports = {
    mysql, connection, secretKey
};
