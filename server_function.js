/**
 * Server functions
 * @module ./server_function.js
 */

 /**
  * Lodash module installed with npm
  */
const _ = require('lodash');

/**
 * Checks for server error, displays a message, and returns a boolean value
 * @alias module:./server_function.serverError
 * @param {string} response A response message
 * @param {string} errorMsg An error message
 * @returns {boolean} False if there is an error, and True otherwise
 */
var serverError = (response, errorMsg) => {
    if (response == undefined) {
        return false
    } else {
        console.log(errorMsg);
        response.status(500);
        response.render('500.hbs');
        return true
    }
}

/**
 * Check if a new username is at least 6 characters in length
 * @alias module:./server_function.check_username_length
 * @param {string} input_user_name The username being checked
 * @returns {boolean} Returns True if the name length is shorter than 6 characters in length, and returns False otherwise
 */
var check_username_length = (input_user_name) => {
    return (input_user_name.length < 6);
}

/**
 * Check if a new username has any spaces
 * @alias module:./server_function.check_username_spaces
 * @param {string} input_user_name The username being checked
 * @returns {boolean} Returns True if the name has spaces, and returns False if it does not
 */
var check_username_spaces = (input_user_name) => {
    return (input_user_name.indexOf(" ") != -1)
}

/**
 * Check if a password is at least 8 characters in length
 * @alias module:./server_function.check_password_length
 * @param {string} input_user_pass The password being checked
 * @returns {boolean} Returns True if the the password is shorter than 8 characters in length, and returns False otherwise
 */
var check_password_length = (input_user_pass) => {
    return input_user_pass.length < 8;
}

/**
 * Check if a password has any spaces
 * @alias module:./server_function.check_password_spaces
 * @param {string} input_user_pass The password being checked
 * @returns {boolean} Returns True if the password has spaces, and returns False if it does not
 */
var check_password_spaces = (input_user_pass) => {
    return input_user_pass.indexOf(" ") != -1;
}

/**
 * Checks if two password match each other
 * @alias module:./server_function.check_matching_passwords
 * @param {string} password_1 The password from the first password entry field
 * @param {string} password_2 The password from the second password entry field
 * @returns {boolean} Returns True if the passwords match, and False otherwise
 */
var check_matching_passwords = (password_1, password_2) => {
    return password_1 != password_2;
}

/**
 * Check if the user did not input a name or password
 * @alias module:./server_function.check_for_empty_fields
 * @param {string} input_name Text from the username input field
 * @param {string} input_pass Text from the password input field
 * @returns {boolean} Returns True either of the fields are an empty string
 */
var check_for_empty_fields = (input_name, input_pass) => {
    return (input_name == '' || input_pass == '');
}

/**
 * Calculate the final price for a game based on the original price and the current discount percentage
 * @alias module:./server_function.get_final_price
 * @param {number} initial_price The initial price for a game, does not include a decimal place for cents
 * @param {number} disct_percentage The discount percentage for a game, does not include a decimal place
 * @returns {string} Returns a percentage number as a string
 */
var get_final_price = (initial_price, disct_percentage) => {
    return (initial_price * (1 - (disct_percentage / 100)) / 100).toFixed(2).toString();
}

/**
 * Set the max number of search results that will be displayed to 10
 * @alias module:./server_function.set_max_items
 * @param {number} item_count The number of search results that were returned
 * @returns {number} The number of search results to be displayed
 */
var set_max_items = (item_count) => {
    return_count = item_count;
    if (return_count > 10) {
        return_count = 10;
    }
    return return_count;
}

/**
 * Check if a valid email address was entered using a regular expression
 * @alias module:./server_function.validateEmail
 * @param {string} email The email address a user entered
 * @returns {string} Returns an error message if the entered email address is not valid
 */
var validateEmail = (email) => {
    var valid = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    error = !valid.test(email);
    return error;
}

/**
 * Sort the user's wishlist by name, from A to Z
 * @alias module:./server_function.sort_by_name
 * @param {array} wishlist An array of arrays which contain wishlist information
 * @returns {array} A sorted array of wishlist information arrays
 */
var sort_by_name = (wishlist) => {
    return wishlist.sort((a,b) => a[0].toLowerCase().localeCompare(b[0].toLowerCase()));
}

/**
 * Sort the user's wishlist by price, lowest to highest
 * @alias module:./server_function.sort_by_price
 * @param {array} wishlist An array of arrays which contain wishlist information
 * @returns {array} A sorted array of wishlist information arrays
 */
var sort_by_price = (wishlist) => {
    return wishlist.sort((a, b) => {
        var price1 = a[1].replace('Current Price: $','')
        var price2 = b[1].replace('Current Price: $','')
        return parseInt(price1) - parseInt(price2)
    });
}

/**
 * Sort the user's wishlist by sale. On sale games are first, followed by games which are not on sale. Each sublist is sorted by name, A to Z.
 * @alias module:./server_function.sort_by_sale
 * @param {array} wishlist An array of arrays which contain wishlist information
 * @returns {array} A sorted array of wishlist information arrays
 */
var sort_by_sale = (wishlist) => {
    var sale_list = [], nosale_list = [];

    for (i = 0; i < wishlist.length; i++) {
        if (wishlist[i][2] == 'Discount 0%') {
            nosale_list.push(wishlist[i])
        } else {
            sale_list.push(wishlist[i])
        }
    }
    return sort_by_name(sale_list).concat(sort_by_name(nosale_list))
}

/**
 * Choose a sorting algorithm and perform the sort
 * @alias module:./server_function.sort_wishlist
 * @param {string} type The desired sorting algorithm, must be name, price, or sale
 * @param {array} wishlist An array of arrays which contain wishlist information
 * @returns {array} A sorted array of wishlist information arrays
 */
var sort_wishlist = (type, wishlist) => {
    if (type == 'name') {
        return sort_by_name(wishlist)
    } else if (type == 'price') {
        return sort_by_price(wishlist)
    } else if (type == 'sale') {
        return sort_by_sale(wishlist)
    }
}

module.exports = {
    serverError,
    check_username_length,
    check_username_spaces,
    check_password_length,
    check_password_spaces,
    check_matching_passwords,
    check_for_empty_fields,
    get_final_price,
    set_max_items,
    validateEmail,
    sort_by_name,
    sort_by_sale,
    sort_by_price,
    sort_wishlist
}
