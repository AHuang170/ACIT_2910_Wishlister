var server = require("./server.js")
var steam = require("./steam.js")
var sql = require("./sql_db.js")
var gog = require("./gog.js")
const _ = require('lodash');

var steam_object = {};
var mock_steam_obj =
{
    "name": "Into the Breach",
    "price_overview": {
        "initial": 1749,
        "discount_percent": 0
    },
    "header_image": "https://steamcdn-a.akamaihd.net/steam/apps/590380/header.jpg?t=1519989363",
    "steam_appid": 590380
};

var mock_gog_obj_1 =
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
};

var mock_gog_obj_2 =
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
};

var mock_steam_compare_obj = {
    initial: "1300",
    discount_percent: 0,
    name: "The Witcher: Enhanced Edition",
    steam_thumb: 'img_url',
    appid: '1111'
};

var mock_gog_compare_obj = {
    initial: "1300",
    discount_percent: 10,
    name: "The Witcher: Enhanced Edition"
};

var mock_gog_game_list = [mock_gog_obj_1, mock_gog_obj_2];

var mock_request_session_wishlist = [
    [
        'S.T.A.L.K.E.R.: Call of Pripyat',
        'Current Price: $6.45',
        'Discount 75%',
        'html stuff',
        41700
    ],
    [
        'David.',
        'Current Price: $2.19',
        'Discount 0%',
        'html stuff',
        346180
    ],
    [
        'MachiaVillain',
        'Current Price: $17.59',
        'Discount 20%',
        'html stuff',
        555510
    ]
];

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
        steam_object = Object.assign({}, result);

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

describe('SQL DB Tests', () => {
    test("Add user into database", () => {
        expect(sql.insert_user('TestUser', '$2a$10$QQtyTFzmeCAYhwdMd/nnQeUbGf1TJ7kNHELHRRNMHzlFvLLB55q2O', 'testuser@gmail.com')).
        toBeTruthy()
    }),
    test("Get UID from email", () => {
        return sql.get_uid_from_email('testuser@gmail.com').then((result) => {
            expect(result[0]).
            toBeGreaterThan(0)
        })
    }),
    test("Insert into wishlist", () => {
        return sql.get_uid_from_email('testuser@gmail.com').then((uid) => {
            sql.insert_wishlist(uid, '376520').then((result) => {
                expect(result.affectedRows).
                toBe(1)
            })
        })
    }),
    test("Fetch wishlist", () => {
        return sql.get_uid_from_email('testuser@gmail.com').then((uid) => {
            sql.fetch_wishlist(uid).then((result) => {
                expect(result[0].appid).
                toBe(376520)
            })
        })
    }),
    test("Delete from wishlist", () => {
        return sql.get_uid_from_email('testuser@gmail.com').then((uid) => {
            sql.delete_from_wishlist(uid, '376520').then((result) => {
                expect(result.affectedRows).
                toBe(1)
            })
        })
    }),
    test("Fetch user details", () => {
        return sql.fetch_user_detail('TestUser').then((result) => {
            expect(result[0].email).
            toBe('testuser@gmail.com')
        })
    }),
    test("Check if user exists", () => {
        return sql.check_user_existence('TestUser', 'user').then((result) => {
            expect(result).
            toBe(true)
        })
    }),
    test("Check if email exists (false)", () => {
        return sql.check_email_existence('notanemail', 'email').then((result) => {
            expect(result).
            toBe(false)
        })
    }),
    test("Check if email exists (true)", () => {
        return sql.check_email_existence('testuser@gmail.com', 'email').then((result) => {
            expect(result).
            toBe(true)
        })
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
            initial: 1289,
            discount_percent: 0,
            name: "The Witcher: Enhanced Edition",
        })
    }),
    test("Compare steam and gog prices", () => {
        expect((steam.compare_prices(mock_steam_compare_obj, mock_gog_compare_obj)).store).
        toBe("gog")
    })
})

describe("Server Tests", () => {
    test("Sort wishlist by name", () => {
        expect(server.sort_by_name(mock_request_session_wishlist)).
        toEqual([
            [
                'David.',
                'Current Price: $2.19',
                'Discount 0%',
                'html stuff',
                346180
            ],
            [
                'MachiaVillain',
                'Current Price: $17.59',
                'Discount 20%',
                'html stuff',
                555510
            ],
            [
                'S.T.A.L.K.E.R.: Call of Pripyat',
                'Current Price: $6.45',
                'Discount 75%',
                'html stuff',
                41700
            ]
        ])
    }),
    test("Sort wishlist by price", () => {
        expect(server.sort_by_price(mock_request_session_wishlist)).
        toEqual([
            [
                'David.',
                'Current Price: $2.19',
                'Discount 0%',
                'html stuff',
                346180
            ],
            [
                'S.T.A.L.K.E.R.: Call of Pripyat',
                'Current Price: $6.45',
                'Discount 75%',
                'html stuff',
                41700
            ],
            [
                'MachiaVillain',
                'Current Price: $17.59',
                'Discount 20%',
                'html stuff',
                555510
            ]
        ])
    }),
    test("Sort wishlist by sale status", () => {
        expect(server.sort_by_sale(mock_request_session_wishlist)).
        toEqual([
            [
                'MachiaVillain',
                'Current Price: $17.59',
                'Discount 20%',
                'html stuff',
                555510
            ],
            [
                'S.T.A.L.K.E.R.: Call of Pripyat',
                'Current Price: $6.45',
                'Discount 75%',
                'html stuff',
                41700
            ],
            [
                'David.',
                'Current Price: $2.19',
                'Discount 0%',
                'html stuff',
                346180
            ]
        ])
    })
})
