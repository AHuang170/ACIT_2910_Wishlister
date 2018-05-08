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
  })
}



 module.exports = {
   gog_api
 }
