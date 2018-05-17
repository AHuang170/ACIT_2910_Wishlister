/**
 * GOG API modules
 * @module ./gog
 */

const request = require('request');

var gog_api = (game_name) => {
  return new Promise((resolve, reject) => {
    request({
        url: `https://embed.gog.com/games/ajax/filtered?mediaType=game&search=${game_name}`,
        json: true
    }, (error, response, body) => {
        if (error || response.statusCode == 400) {
            resolve(undefined);
        } else {
            var gameList = body.products.slice();
            resolve(gameList);
          }
        });
  });
}

var isolate_game_obj = (game_name, game_list) => {
  var game_obj = undefined;
  for(i in game_list){
    // console.log('compare',game_list[i].title, game_name)
    if(game_list[i].title.toLowerCase() == game_name.toLowerCase()){

      game_obj = Object.assign({},game_list[i]);
    }
  }
  return game_obj
}

var extract_data = (raw_data) => {
  return {
    name: raw_data.title,
    initial: parseFloat(raw_data.price.baseAmount)*100,
    discount_percent: raw_data.price.discountPercentage
  }
}


 module.exports = {
   gog_api, isolate_game_obj, extract_data
 }
