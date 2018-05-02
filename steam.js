/**
 * Steam API modules
 * @module ./steam
 */

 /**
  * Request module installed with npm
  */
const request = require('request');

/**
 * Query Public Steam Web API
 * @alias module:./steam.steam
 * @param game_id - The application ID of the game which the user wants details for.
 * @returns {Promise} Promise to the server that the function will provide a game details object
 */
var steam = (game_id) => {

  /**
   * Promise to the server
   * @returns {Promise.resolve} A game details object
   * @returns {Promise.reject} Returns the err variable
   */
    return new Promise((resolve, reject) => {
        request({
            url: `http://store.steampowered.com/api/appdetails?appids=${game_id}`,
            json: true
        }, (error, response, body) => {
            if (error) {
                reject(error);
            } else {

                var gameData = Object.assign({}, body[game_id].data);

                if (gameData.price_overview == undefined) {
                    gameData.price_overview = {
                        initial: 0,
                        discount_percent: 0
                    };
                }
                resolve(eval(gameData));
            }
        });
    });
}

/**
 * Query Public Steam Web API
 * @alias module:./steam.game_loop
 * @param queryResult - A game information object returned by the Steam API
 * @returns {Promise} Promise to the server that the function will provide a list of lists containing game information
 */
var game_loop = (queryResult) => {

  /**
   * Promise to the server
   * @returns {Promise.resolve} A list of lists containing game information for wishlist items
   * @returns {Promise.reject} Returns the err variable
   */
    return new Promise(async(resolve, reject) => {
        var returnList = [];

        for (const item of queryResult) {
            try {
                var steam_result = await steam(item.appid);
            } catch (error) {
                reject(error);
            }

            returnList.push(process_object(steam_result))
        }
        resolve(returnList);
    })
}

function process_object(steam_result) {
  var initial_price = parseInt(steam_result.price_overview.initial);
  var disct_percentage = parseInt(steam_result.price_overview.discount_percent);
  var current_price = calculate_price(initial_price, disct_percentage);
  var steam_name = `${steam_result.name}`;
  var steam_price = `Current Price: $${current_price.toString()}`;
  var steam_discount = `Discount ${disct_percentage}%`;
  var steam_thumb = `<img class=\"wishThumb shadow\" src=\"${steam_result.header_image}\" />`;
  return ([steam_name, steam_price, steam_discount, steam_thumb]);
}

var calculate_price = (initial_price, disct_percentage) => {
  return (initial_price * (1 - (disct_percentage / 100)) / 100).toFixed(2);
}

module.exports = {
  steam, game_loop, process_object
}
