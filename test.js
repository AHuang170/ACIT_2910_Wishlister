var steam = require("./steam")
var sql = require("./sql_db.js")
var gog = require("./gog.js")

const _ = require('lodash');

beforeAll(() => {

    var sql_test = new Promise((resolve, reject) => {
        sql.connection.query('START TRANSACTION;', function(err, result, fields) {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    }).then((mysql_message) => {
        console.log(mysql_message)
    })

    return steam.steam(590380).then((result) => {
        steam_object = result;
    }).then((result) => {
        mock_steam_obj =
        {
            "name": "Into the Breach",
            "price_overview": {
                "initial": 1749,
                "discount_percent": 0
            },
            "header_image": "https://steamcdn-a.akamaihd.net/steam/apps/590380/header.jpg?t=1519989363",
            "steam_appid": 590380
        }

        mock_gog_obj_1 =
        {
            customAttributes: [],
            developer: "CD PROJEKT RED",
            publisher: "CD PROJEKT RED",
            price: {
                amount: "12.89",
                baseAmount: "12.89",
                finalAmount:"12.89",
                isDiscounted: false,
                discountPercentage: 0,
                discountDifference: "0.00",
                symbol: "C$",
                isFree: false,
                discount: 0,
                isBonusStoreCreditIncluded: false,
                bonusStoreCreditAmount: "0.00",
                promoId: null
            },
            isDiscounted: false,
            isInDevelopment: false,
            id: 1207658924,
            releaseDate: 1193346000,
            buyable: true,
            title: "The Witcher: Enhanced Edition",
            image: "//images-1.gog.com/37d4a…e31aaaefc74bbcd46ebd190",
            url: "/game/the_witcher",
            supportUrl: "/support/the_witcher",
            forumUrl: "/forum/the_witcher",
            category: "Role-playing",
            originalCategory: "Role-playing",
            rating: 47,
            type: 1,
            isComingSoon: false,
            isPriceVisible: true,
            isMovie: false,
            isGame: true,
            slug: "the_witcher",
            isWishlistable: true
        }

        mock_gog_obj_2 =
        {
            customAttributes: [],
            developer: "CD PROJEKT RED",
            publisher: "CD PROJEKT RED",
            price: {
                amount: "12.89",
                baseAmount: "12.00",
                finalAmount:"6.00",
                isDiscounted: true,
                discountPercentage: 50,
                discountDifference: "6.00",
                symbol: "C$",
                isFree: false,
                discount: 0,
                isBonusStoreCreditIncluded: false,
                bonusStoreCreditAmount: "0.00",
                promoId: null
            },
            isDiscounted: false,
            isInDevelopment: false,
            id: 1207658924,
            releaseDate: 1193346000,
            buyable: true,
            title: "The Witcher 2: Enhanced Edition",
            image: "//images-1.gog.com/37d4a…e31aaaefc74bbcd46ebd190",
            url: "/game/the_witcher",
            supportUrl: "/support/the_witcher",
            forumUrl: "/forum/the_witcher",
            category: "Role-playing",
            originalCategory: "Role-playing",
            rating: 47,
            type: 1,
            isComingSoon: false,
            isPriceVisible: true,
            isMovie: false,
            isGame: true,
            slug: "the_witcher",
            isWishlistable: true
        }

        mock_steam_compare_obj = {
            price_overview: {
                initial: "13.00",
                discount_percent: 0,
            },
            name: "The Witcher: Enhanced Edition"
        };

        mock_gog_game_list = [mock_gog_obj_1, mock_gog_obj_2]

    }).then((tyler) => {
      return sql.check_email_existence('test@test.com', 'userEmail').then((validEmail) => {
        validEmailTest = validEmail;
      }).then((tyler) => {
          return sql.get_uid_from_email('test@test.com').then((userID) => {
              userIDTest = userID;
          })
      })
    })
})

afterAll(() => {
    var sql_test = new Promise((resolve, reject) => {
        sql.connection.query('ROLLBACK;', function(err, result, fields) {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })

    sql_test.then((result) => {
        console.log(result)
    })
    sql.connection.end()
})

describe("Steam Tests", () => {
  test("Receive JSON object from Steam API", () => {
      expect(steam_object.type).
      toBe("game")
  }),
  test("Process steam object - Game Title", () => {
      expect(steam.process_object(mock_steam_obj)[0]).
      toBe("Into the Breach")
  }),
  test("Calculte steam app price", () => {
    expect(steam.calculate_price(10020, 50)).
    toBe("50.10")
  })
})

// describe('SQL DB Tests', () => {
//
//     // test("Add user into database", () => {
//     //     expect(sql.insert_user())
//     // })
//
//     // test("Insert into wishlist", () => {
//     //     expect(sql.insert_wishlist())
//     // })
//
//     // test("Fetch wishlist", () => {
//     //     expect(sql.fetch_wishlist().appid).
//     //     toBe(376520)
//     // })
// })

describe('GOG Tests', () => {
    test("Receive JSON object from GOG API", () => {
        return gog.gog_api("Witcher").then((result) => {
            expect(_.isArray(result)).
            toBeTruthy()
        })

    }),
    test("Return empty list for unmatched name", () => {
        return gog.gog_api("afdsafdsaf").then((result) => {
            expect(result).
            toHaveLength(0)
        })
    }),
    test("Return just the specified game object", () => {
        expect(gog.isolate_game_obj("The Witcher: Enhanced Edition", mock_gog_game_list).title).
        toBe("The Witcher: Enhanced Edition")

    }),
    test("Return undefined for unmatched names", () => {
        expect(gog.isolate_game_obj("afdsafdsaf", [])).
        toBe(undefined)

    }),
    test("Extract data function should return an object", () => {
        expect(_.isObject(gog.extract_data(mock_gog_obj_1))).
        toBeTruthy()
    }),
    test("Extract the right attributes from the object", () => {
        expect(gog.extract_data(mock_gog_obj_1)).
        toEqual({
            initial: "12.89",
            discount_percent: 0,
            name: "The Witcher: Enhanced Edition",
        })
    }),
    test("Compare steam and gog prices", () => {
        expect(steam.compare_prices(mock_steam_compare_obj, mock_gog_obj_1)).
        toBe("gog")
    })
})

var initial_price = parseInt(steam_result.price_overview.initial);
var disct_percentage = parseInt(steam_result.price_overview.discount_percent);
var current_price = calculate_price(initial_price, disct_percentage);
var steam_name = `${steam_result.name}`;
var steam_price = `Current Price: $${current_price.toString()}`;
var steam_discount = `Discount ${disct_percentage}%`;
var steam_thumb = `<img class=\"wishThumb shadow\" src=\"${steam_result.header_image}\" />`;
var app_id = steam_result.steam_appid;
