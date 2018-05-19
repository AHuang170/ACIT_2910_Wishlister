var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : process.env.host,
    user     : process.env.user,
    password : process.env.password,
    database : process.env.database,
    port     : process.env.port
});

var secretKey = process.env.secretKey;

module.exports = {
    mysql, connection, secretKey
};
