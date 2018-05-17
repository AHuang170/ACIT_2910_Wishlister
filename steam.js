/**
 * Steam API modules
 * @module ./steam
 */

 /**
  * Request module installed with npm
  */
const request = require('request');
const gog = require('./gog.js');

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
                var result_obj = await get_game_object(item.appid);
            } catch(error) {
                reject(error);
            }
            // try {
            //     var steam_result = await steam(item.appid);
            // } catch (error) {
            //     reject(error);
            // }
            //
            // var steam_object = Object.assign({}, extract_steam_data(steam_result));
            // var steam_name = steam_object.name
            // console.log('steam 1',steam_name)
            // var gog_object = await gog.gog_api([steam_name]);
            // console.log('steam 2',steam_name)
            // result = gog.isolate_game_obj(steam_name, gog_object)
            // if (result == undefined){
            //     return undefined
            // } else {
            //     return gog.extract_data(result)
            // }
            //
            //
            // var result_obj = compare_prices(steam_object, gog_object);
            //
            // // TODO: implement price comparison here
            returnList.push(process_object(result_obj))
        }
        resolve(returnList);
    })
}

var get_game_object = (app_id) => {
  return new Promise((resolve, reject) =>{
    var game_name = "";
    var steam_object = {};
    steam(app_id).then((result) => {
      game_name = result.name;
      steam_object = Object.assign({}, extract_steam_data(result));
      return gog.gog_api([game_name])
    }).then((result) => {
      var isolated_obj = gog.isolate_game_obj(game_name, result);
      var result_gog_obj = undefined;
      if (isolated_obj != undefined){
        result_gog_obj = Object.assign({}, gog.extract_data(isolated_obj));
      }
      resolve (compare_prices(steam_object, result_gog_obj));

    })
  })
}

var extract_steam_data = (raw_data) => {
  return {
    name: raw_data.name,
    initial: raw_data.price_overview.initial,
    discount_percent: raw_data.price_overview.discount_percent,
    steam_thumb: raw_data.header_image,
    appid: raw_data.steam_appid
  }
}

/**
 * Returns a formatted list of game information which is ready to be rendered
 * @param steam_result A JSON object containing game information returned from the Steam API
 * @returns {array} An array containing formatted fields ready to be rendered to HTML
 */
function process_object(input_object) {
  var initial_price = parseInt(input_object.initial);
  var disct_percentage = parseInt(input_object.discount_percent);
  var current_price = calculate_price(initial_price, disct_percentage);
  var steam_name = `${input_object.name}`;
  var steam_price = `Current Price: $${current_price.toString()}`;
  var steam_discount = `Discount ${disct_percentage}%`;
  var steam_thumb = `<img class=\"wishThumb shadow\" src=\"${input_object.steam_thumb}\" />`;
  var appid = input_object.appid;
  return ([steam_name, steam_price, steam_discount, steam_thumb, appid]);
}

/**
 * Returns the discounted game price
 * @param {number} initial_price Initial price from the Steam API, does not include decimal place
 * @param {number} disct_percentage Discount perfect from the Steam API, does not include decimal place
 * @returns {number} The current discounted price of a game
 */
var calculate_price = (initial_price, disct_percentage) => {
  return (initial_price * (1 - (disct_percentage / 100)) / 100).toFixed(2);
}

function compare_prices(steam_obj, gog_obj){
    console.log(`>>>>>Steam:\n${JSON.stringify(steam_obj, undefined, 2)}`)
    console.log(`>>>>>GOG:\n${JSON.stringify(gog_obj, undefined, 2)}`)
    var winner = '';
    if(gog_obj != undefined){
        var gog_price = parseInt(gog_obj.initial) * (1 - (gog_obj.discount_percent / 100));
        var steam_price = parseInt(steam_obj.initial) * (1 - (steam_obj.discount_percent / 100));
        if(gog_price < steam_price){
            winner = Object.assign({},gog_obj)
            winner['store'] = 'gog'
            winner['steam_thumb']  = steam_obj.steam_thumb
            // console.log(winner)
            winner['appid'] = steam_obj.appid
        }else{
            winner = Object.assign({},steam_obj)
            winner['store'] = 'steam'
        }
    } else{
        winner = Object.assign({},steam_obj)
        winner['store'] = 'steam'
    }
    return winner
}

module.exports = {
  steam, game_loop, process_object, calculate_price, compare_prices, extract_steam_data
}
