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
        if (error) {
            reject(error);
        } else {

            var gameList = body.products;
            resolve(gameList);
          }
        });
  });
}

var isolate_game_obj = (game_name, game_list) => {
  var game_obj = undefined;
  for(i in game_list){
    if(game_list[i].title == game_name){
      game_obj = game_list[i];
    }
  }

  return game_obj
}


 module.exports = {
   gog_api, isolate_game_obj
 }
