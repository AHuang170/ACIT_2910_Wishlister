var steam = require("./steam")
var sql = require("./sql_db.js")
var gog = require("./gog.js")

const _ = require('lodash');

beforeAll(() => {
    return steam.steam(590380).then((result) => {
        steam_object = result;
        return sql.fetch_wishlist(60);
    }).then((result) => {
        db_list = result

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
    // Rebase Test - 1
    // Rebase Test - 2
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

describe('SQL DB Tests', () => {
    test("Fetch Wishlist from MySQL Database", () => {
        expect(db_list[1].appid).
        toBe(376520)
    })
})

describe('GOG Tests', () => {
    test("Receive JSON object from GOG API", () => {
        return gog.gog_api("Witcher").then((result) => {
            expect(_.isArray(result)).
            toBeTruthy()
        })

    }),
    test("Return empty list for unmatched name", () => {
        return gog.gog_api("afdsafdsaf").then((result) => {
            expect(_.isArray(result)).
            toBe([])
        })
    })
})
