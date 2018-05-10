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
  /**
   * Promise to query from database
   * @returns {Promise.resolve} A list of the query results
   * @returns {Promise.reject} Returns the err variable
   */
  return new Promise ((resolve, reject) => {
    var chkQuery = `SELECT * FROM wishlist WHERE uid = ${uid} AND appid = ${appid}`;
    /**
     * @param chkquery - Sql command used to query from the table
     * @param {requestCallback} err - error message from Database
     * @param {requestCallback} queryResult - result of the query
     * @param {requestCallback} fields - Column labels that's not used
     */
    connection.query(chkQuery, function(err, result, fields) {
        if(err){
          reject(err);
        }else{
          resolve(result);
        }
    });
  });
}

/**
 * insert new game into wishlist table
 * @alias module:./sql_db.insert_wishlist
 * @param uid - The uid of the user
 * @param appid - The appid of the game
 * @returns {Promise} Promise to query from the database
 */
var insert_wishlist = (uid, appid) => {
  /**
   * Promise to query from database
   * @returns {Promise.resolve} A list of the query results
   * @returns {Promise.reject} Returns the err variable
   */
  return new Promise ((resolve, reject) => {

    var addQuery = `INSERT INTO wishlist (uid, appid) VALUES (${uid}, ${appid})`;
    /**
     * @param addquery - Sql command used to insert into wishlist table
     * @param {requestCallback} err - error message from Database
     * @param {requestCallback} queryResult - result of the query
     * @param {requestCallback} fields - Column labels that's not used
     */
    connection.query(addQuery, function(err, result, fields) {
        if(err){
          reject(err);
        }else{
          resolve(result);
        }
    });
  });
}

/**
 * check if the the user name exist in database table
 * @alias module:./sql_db.check_user_existence
 * @param input_user_name - name of the new user
 * @param resultName - column label of the query result
 * @returns {Promise} Promise to query from the database
 */
var delete_from_wishlist = (uid, appid) => {
  /**
   * Promise to query from database
   * @returns {Promise.resolve} A list of the query results
   * @returns {Promise.reject} Returns the err variable
   */
  return new Promise ((resolve, reject) => {

    var deleteQuery = `DELETE FROM wishlist WHERE (uid=${uid} AND appid=${appid})`;
    /**
     * @param addquery - Sql command used to insert into wishlist table
     * @param {requestCallback} err - error message from Database
     * @param {requestCallback} queryResult - result of the query
     * @param {requestCallback} fields - Column labels that's not used
     */
    connection.query(deleteQuery, function(err, result, fields) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
    });
  });
}

/**
 * fetch user details from users table
 * @alias module:./sql_db.fetch_user_detail
 * @param input_name - name of the user
 * @returns {Promise} Promise to query from the database
 */
var fetch_user_detail = (input_name) => {

  /**
   * Promise to query from database
   * @returns {Promise.resolve} A list of the query results
   * @returns {Promise.reject} Returns the err variable
   */
  return new Promise ((resolve, reject) => {
    var query = `SELECT * FROM users WHERE username = '${input_name}'`;

    /**
     * @param query - Sql command used to query from users table
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
 * insert new user name and hashed password to users table
 * @alias module:./sql_db.insert_user
 * @param input_user_name - name of the new user
 * @param hash - hashed password by the user
 * @param email - email entered by the user
 * @returns {Promise} Promise to query from the database
 */
var insert_user = (input_user_name, hash, input_user_email) => {

  /**
   * Promise to query from database
   * @returns {Promise.resolve} Returns the query results
   * @returns {Promise.reject} Returns the err variable
   */
  return new Promise ((resolve, reject) => {
    var addQ = `INSERT INTO users (uid, username, password, email) VALUES (NULL, '${input_user_name}', '${hash}', '${input_user_email}');`;

    /**
     * @param addq - Sql command to insert into users table
     * @param {requestCallback} err - error message from Database
     * @param {requestCallback} queryResult - result of the query
     * @param {requestCallback} fields - Column labels that's not used
     */

    connection.query(addQ, function(err, result, fields) {
        if (err){
          reject(err);
        }else{
          resolve(true);
        }
    });
  });
}

/**
 * check if the the user name exist in database table
 * @alias module:./sql_db.check_user_existence
 * @param input_user_name - name of the new user
 * @param resultName - column label of the query result
 * @returns {Promise} Promise to query from the database
 */
var check_user_existence = (input_user_name, resultName) => {

  /**
   * Promise to query from database
   * @returns {Promise.resolve} Returns the query results
   * @returns {Promise.reject} Returns the err variable
   */
  return new Promise ((resolve, reject) => {
    var nameQuery = `SELECT count(*) AS ${resultName} FROM users WHERE username = '${input_user_name}'`;
    var queryResult = false;

    /**
     * @param nameQuery - Sql command to query users table
     * @param {requestCallback} err - error message from Database
     * @param {requestCallback} result - result of the query
     * @param {requestCallback} fields - Column labels that's not used
     */
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

var check_email_existence = (input_user_email, emailName) => {

  /**
   * Promise to query from database
   * @returns {Promise.resolve} Returns the query results
   * @returns {Promise.reject} Returns the err variable
   */
  return new Promise ((resolve, reject) => {
    var emailSearch = `SELECT count(*) AS ${emailName} FROM users WHERE email = '${input_user_email}'`;
    var queryResult = false;

    /**
     * @param nameQuery - Sql command to query users table
     * @param {requestCallback} err - error message from Database
     * @param {requestCallback} result - result of the query
     * @param {requestCallback} fields - Column labels that's not used
     */
    connection.query(emailSearch, function(err, result, fields) {
        if (err) {
            reject(err);
        }

        if (result[0][emailName] >= 1) {
            queryResult = true;

        }

        resolve(queryResult);
    });
  })
}

var get_uid_from_email = (input_user_email) => {

  /**
   * Promise to query from database
   * @returns {Promise.resolve} Returns the query results
   * @returns {Promise.reject} Returns the err variable
   */
  return new Promise ((resolve, reject) => {
    var emailSearch = `SELECT * FROM users WHERE email = '${input_user_email}'`;
    var queryResult = 'An error has occured..';

    /**
     * @param nameQuery - Sql command to query users table
     * @param {requestCallback} err - error message from Database
     * @param {requestCallback} result - result of the query
     * @param {requestCallback} fields - Column labels that's not used
     */
    connection.query(emailSearch, function(err, result, fields) {
        if (err) {
            reject(err);
        }


        queryResult = result[0]['uid'];
        resolve(queryResult);
    });
  })
}

module.exports = {
  fetch_wishlist, fetch_wishlist_duplicates, insert_wishlist, fetch_user_detail, insert_user, check_user_existence, check_email_existence, delete_from_wishlist, get_uid_from_email
}
