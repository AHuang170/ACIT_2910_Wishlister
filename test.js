var steam = require("./steam")
var sql = require("./sql_db.js")

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
