const request = require('request');

// Query Steam API using a valid appid
var steam = (game_id) => {
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

// Display a list of games stored in the user's wishlist. Appids are retreived
// form the MySQL database. The async function makes the page wait until then
// the retrieval is complete
var game_loop = (queryResult) => {
    return new Promise(async(resolve, reject) => {
        var returnList = [];

        for (const item of queryResult) {
            try {
                var steam_result = await steam(item.appid);
            } catch (error) {
                reject(error);
            }

            var initial_price = parseInt(steam_result.price_overview.initial);
            var disct_percentage = parseInt(steam_result.price_overview.discount_percent);
            var current_price = (initial_price * (1 - (disct_percentage / 100)) / 100).toFixed(2);
            var steam_name = `${steam_result.name}`;
            var steam_price = `Current Price: $${current_price.toString()}`;
            var steam_discount = `Discount ${disct_percentage}%`;
            var steam_thumb = `<img class=\"wishThumb shadow\" src=\"${steam_result.header_image}\" />`;

            returnList.push([steam_name, steam_price, steam_discount, steam_thumb]);
        }
        resolve(returnList);
    })
}

module.exports = {
  steam, game_loop
}
