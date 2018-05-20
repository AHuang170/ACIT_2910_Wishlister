/**
 * GOG API modules
 * @module ./gog
 */

/**
 * Request module with npm
 */
const request = require('request');

/**
 * Query Public GOG Web API
 * @alias module:./gog.gog_api
 * @param {string} game_name - The name of the game which the user wants details for.
 * @returns {Promise} Promise to the server that the function will provide a game details object
 */
var gog_api = (game_name) => {
    /**
     * Promise to the server
     * @returns {Promise.resolve} A game details object or undefined if api returns with nothing
     * @returns {Promise.reject} Returns the error variable
     */
    return new Promise((resolve, reject) => {
        request({
            url: `https://embed.gog.com/games/ajax/filtered?mediaType=game&search=${game_name}`,
            json: true
        }, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                if (response.statusCode == 400) {
                    resolve(undefined);
                } else {
                    var gameList = body.products.slice();
                    resolve(gameList);
                }
            }
        });
    });
}

/**
 * Extract the game object belonging to the game the user searched for
 * @alias module:./gog.isolate_game_obj
 * @param {string} game_name - The name of the game which the user wants details for.
 * @param {array} game_list - List of game objects with similar names
 * @returns {object} Game detail object for the searched game
 */
var isolate_game_obj = (game_name, game_list) => {
    var game_obj = undefined;
    for (i in game_list) {
        // console.log('compare',game_list[i].title, game_name)
        if (game_list[i].title.toLowerCase() == game_name.toLowerCase()) {

            game_obj = Object.assign({}, game_list[i]);
        }
    }
    return game_obj
}

/**
 * Extracts relevant game detail data
 * @alias module:./gog.extract_data
 * @param {object} raw_data - Un altered game details object returned by gog_api
 * @returns {object} Game detail object containing only relevant information
 */
var extract_data = (raw_data) => {
    return {
        name: raw_data.title,
        initial: parseFloat(raw_data.price.baseAmount) * 100,
        discount_percent: raw_data.price.discountPercentage
    }
}


module.exports = {
    gog_api,
    isolate_game_obj,
    extract_data
}
