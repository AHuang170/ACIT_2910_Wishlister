/**
 * Wishlist modules
 * @module ./sql_db
 */

/**
 * Request module installed with npm
 */
const request = require('request');

/**
 * Config.js file for the server
 */
const config = require('./config.js');
var mysql = config.mysql;

/**
 * Function from config.js
 * @class
 */
var connection = config.connection;

/**
 * Connect to the database
 * @param {requestCallback} err - The return message if there is an error with the connection
 */
connection.connect(function(err) {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }

    console.log('Connected to database with id: ' + connection.threadId);
});

/**
 * Sql command to select all rows from the table users
 */
var sql = 'SELECT * FROM users';

/**
 * Query from the database
 * @param {string} sql - The sql command passed to the function based on user input
 * @param {requestCallback} err - Return err if there is an error
 * @param {requestCallback} rows - Return rows for a query
 * @param {requestCallback} fields - Return fields for a query
 */
connection.query(sql, function(err, rows, fields) {
    if (err) throw err
});

/**
 * fetch Wishlist
 * @alias module:./sql_db.fetch_wishlist
 * @param target_id - The uid of the user, search from the wishlist table where the uid matches this value
 * @returns {Promise} Promise to query from the database
 */
var fetch_wishlist = (target_id) => {
  /**
   * Promise to query from database
   * @returns {Promise.resolve} A list of the query results
   * @returns {Promise.reject} Returns the err variable
   */
  return new Promise((resolve, reject) => {

    var query = `SELECT * FROM wishlist WHERE uid = ${target_id}`;
    /**
     * @param query - Sql command used to query from the table
     * @param {requestCallback} err - error message from Database
     * @param {requestCallback} queryResult - result of the query
     * @param {requestCallback} fields - Column labels that's not used
     */
    connection.query(query, function(err, queryResult, fields){

      if(err){

        reject(err);

      }else{

        resolve(queryResult);

      }

    });
  });
}

/**
 * fetch Wishlist duplicates
 * @alias module:./sql_db.fetch_wishlist_duplicates
 * @param uid - The uid of the user
 * @param appid - The appid of the game
 * @returns {Promise} Promise to query from the database
 */
var fetch_wishlist_duplicates = (uid, appid) => {
  return new Promise ((resolve, reject) => {
    var chkQuery = `SELECT * FROM wishlist WHERE uid = ${uid} AND appid = ${appid}`;
    connection.query(chkQuery, function(err, result, fields) {
        if(err){
          reject(err);
        }else{
          resolve(result);
        }
    });
  });
}

var insert_wishtlist = (uid, appid) => {
  return new Promise ((resolve, reject) => {

    var addQuery = `INSERT INTO wishlist (uid, appid) VALUES (${uid}, ${appid})`;

    connection.query(addQuery, function(err, result, fields) {
        if(err){
          reject(err);
        }else{
          resolve(result);
        }
    });
  });
}

var fetch_user_detail = (input_name) => {
  return new Promise ((resolve, reject) => {
    var query = `SELECT * FROM users WHERE username = '${input_name}'`;

    connection.query(query, function(err, queryResult, fields){
      if(err){

        reject(err);

      }else{

        resolve(queryResult);

      }
    });
  });
}

var insert_user = (input_user_name, hash) => {
  return new Promise ((resolve, reject) => {
    var addQ = `INSERT INTO users (uid, username, password) VALUES (NULL, '${input_user_name}', '${hash}');`;
    connection.query(addQ, function(err, result, fields) {
        if (err){
          reject(err);
        }else{
          resolve(true);
        }
    });
  });
}

var check_user_existence = (input_user_name, resultName) => {
  return new Promise ((resolve, reject) => {
    var nameQuery = `SELECT count(*) AS ${resultName} FROM users WHERE username = '${input_user_name}'`;
    var queryResult = false;

    connection.query(nameQuery, function(err, result, fields) {
        if (err) {
            reject(err);
        }
        if (result[0][resultName] != 0) {
            queryResult = true;
        }
        resolve(queryResult);
    });
  })
}


module.exports = {
  fetch_wishlist, fetch_wishlist_duplicates, insert_wishtlist, fetch_user_detail, insert_user, check_user_existence
}
