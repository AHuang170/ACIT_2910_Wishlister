/**
 * Server functions
 * @module ./server
 */

 /**
  * Moduels used with application
  */
const express = require('express');
const hbs = require('hbs');
const fs = require('fs');
const _ = require('lodash');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const subsearch = require('subsequence-search');
const bcrypt = require('bcrypt');
const serverPort = 8080;
const math = require('mathjs');
const request_module = require('request');
const path = require('path');
const hbsMailer = require('nodemailer-express-handlebars')
const nodemailer = require('nodemailer');



/**
 * constant for password hash algorithm
 */
const saltRounds = 10;

/**
 * import local modules
 */
const server_function = require('./server_function.js')

//Contains all functions that uses the steam api, namely steam and game_loop
const steam_function = require('./steam.js');

// --------------------------------- MySQL RDS ---------------------------------
const sql_db_function = require('./sql_db.js');
// ------------------------------- recaptcha secretKey -------------------------
const config = require('./config.js');
// ------------------------------- Load Game List ------------------------------
var gamelist = fs.readFileSync('filtered_games.json');
var gameobj = JSON.parse(gamelist);
var dataList = {};
dataList['data'] = gameobj.applist.apps;
dataList['searchInProps'] = ['name'];

/** @constructor */
var app = express();

hbs.registerPartials(__dirname + '/views/partials');
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieSession({
    name: 'steamWisklistSession',
    secret: 'uBE9Lz6pBC'
}));

// ----------------------------------- Helpers ---------------------------------
hbs.registerHelper('getCurrentYear', () => {
    return new Date().getFullYear();
})

hbs.registerHelper('message', (text) => {
    return text.toUpperCase();
})

// Displays the wishlist results in the wishlist partial
hbs.registerHelper('apps', (list) => {
    var titleList = list.gameList;
    var out = '';
    var bg_style_class = '';
    for (var item in titleList) {
        if (titleList[item][2] === 'Discount 0%') {
            bg_style_class = 'game shadow';
            // out = `${out}<div class='game shadow' id='${titleList[item][4]}' >${titleList[item][3]}<p>${titleList[item][0]}</p><p>${titleList[item][1]}<img class='wishlistlogo' src='${titleList[item][5]}_logo.png'></img></p><p>${titleList[item][2]}</p><div class='deleteButton' onclick='deleteMessage(${titleList[item][4]})' >x</div></div>`;
        } else {
            bg_style_class = 'game_sale shadow';
            // out = `${out}<div class='game_sale shadow' id='${titleList[item][4]}' >${titleList[item][3]}<p>${titleList[item][0]}</p><p>${titleList[item][1]}<img class='wishlistlogo' src='${titleList[item][5]}_logo.png'></img></p><p>${titleList[item][2]}</p><div class='deleteButton' onclick='deleteMessage(${titleList[item][4]})' >x</div></div>`;
        }
        // out = `${out}<div class='${bg_style_class}' id='${titleList[item][4]}' >${titleList[item][3]}<p>${titleList[item][0]}</p><p>${titleList[item][1]}<img class='wishlistlogo' src='${titleList[item][5]}_logo.png'></img></p><p>${titleList[item][2]}</p><div class='deleteButton' onclick='deleteMessage(${titleList[item][4]})' >x</div></div>`;
        out = `${out}<div class='${bg_style_class}' id='${titleList[item][4]}' >${titleList[item][3]}<br>${titleList[item][0]}<br>${titleList[item][1]}<img class='wishlistlogo' src='${titleList[item][5]}_logo.png'></img><br>${titleList[item][2]}<div class='deleteButton' onclick='deleteMessage(${titleList[item][4]})' >x</div></div>`;
    }
    return out;
});

// Display the search results in the search partial
hbs.registerHelper('searchResults', (list) => {
    var out = '';
    for (var index in list.searchList) {
        out = out + `<a href="/fetchDetails?n=${list.searchList[index]}">${list.searchList[index]}</a><br>`;
    }
    return out;
})

// ----------------------------------- Routes ----------------------------------
/**
 * Main page before login
 * @name Main Page
 * @route {GET} /
 */
app.get('/', (request, response) => {

    var target_id = -1;
    if (request.session.uid != undefined) {
        target_id = request.session.uid;
    }

    sql_db_function.fetch_wishlist(target_id).then((queryResult) => {

        return steam_function.game_loop(queryResult);

    }).then((result) => {

        request.session.wishlist = result;

        response.render('index.hbs', {
            gameList: server_function.sort_wishlist(request.session.sort, request.session.wishlist),
            year: new Date().getFullYear(),
            loggedIn: request.session.loggedIn,
            userName: request.session.userName,
            details: 'Game Search'

        });

    }).catch((error) => {

        server_function.serverError(response, error);

    });

});

/**
 * Search for game using static JSON gamelist, and Steam API
 * @name Game Search
 * @route {POST} /
 */
app.post('/', (request, response) => {
    var target_game_name = request.body.game;
    if(request.body.sort_value==undefined){
        if(request.session.sort==undefined){
            request.session.sort = "name"
        }
    }else {
        request.session.sort = request.body.sort_value;
        target_game_name = request.session.fetchedGame;

    }
    if (target_game_name == '' | target_game_name == undefined) {
        request.session.fetchedGame = undefined;
        response.render('index.hbs', {
            gameList: server_function.sort_wishlist(request.session.sort, request.session.wishlist),
            year: new Date().getFullYear(),
            loggedIn: request.session.loggedIn,
            userName: request.session.userName,
            details: 'Game Search'
        })
    } else {
        var index = _.findIndex(gameobj['applist'].apps, function(o) {
            return o.name == target_game_name;
        });

        if (index != -1) {
            var appid = gameobj['applist'].apps[index].appid.toString();
            request.session.appid = appid;
            console.log(`app.post appid: ${appid}`);
            steam_function.get_game_object(appid).then((result) => {
                var initial_price = parseInt(result.initial);
                var disct_percentage = parseInt(result.discount_percent);
                var current_price = `$${server_function.get_final_price(initial_price, disct_percentage)}`;
                var store_logo = `${result.store}_logo.png`;
                request.session.fetchedGame = result.name;
                response.render('index.hbs', {
                    gameList: server_function.sort_wishlist(request.session.sort, request.session.wishlist),
                    year: new Date().getFullYear(),
                    loggedIn: request.session.loggedIn,
                    userName: request.session.userName,
                    gamename: `${result.name}`,
                    price: `Current Price: ${current_price}`,
                    discount: `Discount ${disct_percentage}%`,
                    displayDetails: true,
                    gameThumb: `<img id=\"gameThumb\" class=\"shadow\" src=\"${result.steam_thumb}\" />`,
                    store: `<img class='wishlistlogo' src='${store_logo}'></img>`,
                    details: 'Game Details'
                });
            }).catch((error) => {
                console.log(error);
            });
        } else {
            // If no exact match, then use subsequence parameters for keyword
            // search
            var result = subsearch.search({
                rank: subsearch.transforms.rank('name'),
                noHighlight: subsearch.transforms.noHighlight,
            }, dataList, request.body.game);
            var gameList = [];
            var maxItem = result.data.length;

            maxItem = server_function.set_max_items(maxItem);
            for (i = 0; i < maxItem; i++) {
                var gameName = result.data[i].name;
                gameList.push(gameName);
            }

            resultNotFound = maxItem == 0;

            response.render('index.hbs', {
                gameList: server_function.sort_wishlist(request.session.sort, request.session.wishlist),
                year: new Date().getFullYear(),
                loggedIn: request.session.loggedIn,
                userName: request.session.userName,
                distype: "block",
                searchList: gameList,
                notFound: resultNotFound,
                error: "Game not found.",
                details: "Search Results"
            });
        }
    }
});

/**
 * Using the appid of a found game, query the steam API and display result
 * @name Query Details
 * @route {GET} /fetchDetails
 */
app.get('/fetchDetails', (request, response) => {
    if(request.body.sort_value==undefined){
        if(request.session.sort==undefined){
            request.session.sort = "name"
        }
    }else {
        request.session.sort = request.body.sort_value
    }
    var index = _.findIndex(gameobj['applist'].apps, function(o) {
        return o.name == request.query.n;
    });
    if (index != -1) {
        var appid = gameobj['applist'].apps[index].appid.toString();
        request.session.appid = appid;
        console.log(`app.fetchDetals appid: ${appid}`);
        steam_function.get_game_object(appid).then((result) => {
                var initial_price = parseInt(result.initial);
                var disct_percentage = parseInt(result.discount_percent);
                var final_price = server_function.get_final_price(initial_price, disct_percentage);
                var current_price = `$${final_price}`;
                var store_logo = `${result.store}_logo.png`;
                request.session.fetchedGame = result.name;
                response.render('index.hbs', {
                        gameList: server_function.sort_wishlist(request.session.sort, request.session.wishlist),
                        year: new Date().getFullYear(),
                        failedAuth: false,
                        loggedIn: request.session.loggedIn,
                        userName: request.session.userName,
                        gamename: `${result.name}`,
                        price: `Current Price: ${current_price}`,
                        discount: `Discount ${disct_percentage}%`,
                        displayDetails: true,
                        gameThumb: `<img id=\"gameThumb\" class=\"shadow\" src=\"${result.steam_thumb}\" />`,
                        details: 'Game Details',
                        store: `<img class='wishlistlogo' src='${store_logo}'></img>`
                    });
        }).catch((error) => {
            console.log(error);
        });
    }
});




/**
 * Authorize users through the login panel on the home page. Passwords are
 * hashed and stored in teh MySQL database
 * @name User Authentication
 * @route {POST} /loginAuth
 */
app.post('/loginAuth', (request, response) => {
    var input_name = request.body.username
    var input_pass = request.body.password
    var resultName = 'numMatch'
    var robot = false; //checking by recapcha


    // var query = `SELECT * FROM users WHERE username = '${input_name}'`;



    request.session.sort = 'sale'

    if(request.body.sort_value==undefined){
        if(request.session.sort==undefined){
            request.session.sort = "name"
        }
    }else {
        request.session.sort = request.body.sort_value
    }
    var empty_field = server_function.check_for_empty_fields(input_name, input_pass);

    if(request.body['g-recaptcha-response'] === undefined || request.body['g-recaptcha-response'] === '' || request.body['g-recaptcha-response'] === null) {
       robot = true;
     }

    var secretKey = config.secretKey;
    // req.connection.remoteAddress will provide IP address of connected user.
    var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + request.body['g-recaptcha-response'] + "&remoteip=" + request.connection.remoteAddress;
    // Hitting GET request to the URL, Google will respond with success or error scenario.
    request_module(verificationUrl,function(error,response,body) {
     body = JSON.parse(body);
      // Success will be true or false depending upon captcha validation.
    if(body.success !== undefined && !body.success) {
     robot = true;
    }
 });
 if (robot){  // if recaptcha validation failed
   request.session.loggedIn = false;
   response.render('index.hbs',{
       year: new Date().getFullYear(),
       failedAuth: false,
       responseCode:true,
       emptyField: empty_field,
       loggedIn: false,
       details: 'Game Search'
   });
   return;
 }



    sql_db_function.fetch_user_detail(input_name).then((result) => {
      if (result.length != 1) {
          request.session.loggedIn = false;
          response.render('index.hbs', {
              year: new Date().getFullYear(),
              failedAuth: true,
              responseCode:robot,
              emptyField: empty_field,
              loggedIn: request.session.loggedIn,
              details: 'Game Search'
          });


      } else {
        var hashed_pass = result[0]["password"];

        bcrypt.compare(input_pass, hashed_pass).then(function(authenticated) {
            if (authenticated) {

                request.session.loggedIn = true;
                request.session.userName = input_name;
                request.session.uid = result[0]["uid"];



                sql_db_function.fetch_wishlist(request.session.uid).then((queryResult) => {
                  return steam_function.game_loop(queryResult);
                }).then((result) => {
                  request.session.wishlist = result;
                  response.render('index.hbs', {
                      gameList: server_function.sort_wishlist(request.session.sort, request.session.wishlist),
                      year: new Date().getFullYear(),
                      loggedIn: request.session.loggedIn,
                      userName: request.session.userName,
                      details: 'Game Search'
                  });

                }).catch((error) => {
                    serverError(response, error);
                });

            } else {
                request.session.loggedIn = false;
                response.render('index.hbs', {
                    year: new Date().getFullYear(),
                    failedAuth: true,
                    loggedIn: request.session.loggedIn,
                    details: 'Game Search'
                });
            }
        }).catch((error) => {
            serverError(response, error);
        });
      }

    }).catch((error) => {
        server_function.serverError(response, error);
    })

});

/**
 * Delete sessions data and re-render the home page
 * @name User logout
 * @route {GET} /logout
 */
app.get('/logout', (request, response) => {
    request.session = null;
    response.render('index.hbs', {
        year: new Date().getFullYear(),
        details: 'Game Search'
    });
});

/**
 * Deletes items from user's wishlist
 * @name Remove Item From Wishlist
 * @route {GET} /removeFromWishlist
 */
app.get('/removeFromWishlist', (request, response) => {
    var appid = request.query.a;
    // console.log(`APPID is:${appid}`);
    var uid = request.session.uid;

    sql_db_function.delete_from_wishlist(uid, appid).then((result) => {
        return
    });

    sql_db_function.fetch_wishlist(uid).then((queryResult) => {
        return steam_function.game_loop(queryResult);
    }).then((result) => {
        request.session.wishlist = result;
        response.render('index.hbs', {
            gameList: server_function.sort_wishlist(request.session.sort, request.session.wishlist),
            year: new Date().getFullYear(),
            loggedIn: request.session.loggedIn,
            userName: request.session.userName,
            details: 'Game Search'
        });
    }).catch((error) => {
        server_function.serverError(response, error);
    });
});

/**
 * Load a new page where the user can create an account
 * @name Create Account
 * @route {GET} /accCreate
 */
app.get('/accCreate', (request, response) => {
    response.render('acc_create.hbs', {
        creatingUser: true,
        noLogIn: true
    });
});

/**
 * Load a new page where the user can recover their password via an email
 * @name Password Recovery
 * @route {GET} /RecoverPassword
 */
app.get('/RecoverPassword', (request, response) => {
    response.render('passwordRecovery.hbs', {

    });
});

/**
 * Load a new page from the emailed link where a user can enter their new password
 * @name Enter New Password
 * @route {GET} /passwordRecoveryEntry
 */
app.get('/passwordRecoveryEntry', (request, response) => {
    response.render('passwordRecoveryEntry.hbs', {});
});

/**
 * Accepts the user's email, name, and password. Performs server side checks for
 * password quality
 * @name Enter New Password
 * @route {POST} /createUser
 */
app.post('/createUser', (request, response) => {
    var input_user_email = request.body.acc_email;
    var input_user_name = request.body.acc_name;
    var input_user_pass = request.body.acc_pass;
    var input_dupe_pass = request.body.rpt_pass;
    var weak_pass = server_function.check_password_length(input_user_pass);
    var short_name = server_function.check_username_length(input_user_name);
    var pass_space = server_function.check_password_spaces(input_user_pass);
    var containsSpace = server_function.check_username_spaces(input_user_name);
    var pw_mismatch = server_function.check_matching_passwords(input_user_pass, input_dupe_pass);
    var resultName = 'numName';
    var invalidEmail = server_function.validateEmail(input_user_email);
    var emailName = 'emailName';
    var emailDBStatus = 'temp';
    var result = 'temp';

    sql_db_function.check_user_existence(input_user_name, resultName).then((result) => {
        result = result;

        sql_db_function.check_email_existence(input_user_email, emailName).then((status) => {
            emailDBStatus = status

            if (weak_pass || weak_pass || short_name || pass_space || containsSpace || pw_mismatch || result || invalidEmail || emailDBStatus) {
                response.render('acc_create.hbs', {
                    mismatch: pw_mismatch,
                    shortName: short_name,
                    hasSpace: containsSpace,
                    duplicateName: result,
                    weakPass: weak_pass,
                    spacePass: pass_space,
                    invalidEmailError: invalidEmail,
                    emailNotFound: emailDBStatus,
                    noLogIn: true
                });

            } else {
                bcrypt.hash(input_user_pass, saltRounds).then((hash) => {
                    return sql_db_function.insert_user(input_user_name, hash, input_user_email);
                }).then((result) => {
                    if (result) {
                        response.render('acc_created.hbs', {
                            noLogIn: true
                        });

                    }
                }).catch((error) => {
                    server_function.serverError(response, error);
                });
            }
        }).catch((error) => {
            server_function.serverError(response, error);
        });
    }).catch((error) => {
        server_function.serverError(response, error);
    });
})

/**
 * Add game to wishlist and store result in MySQL database for current user
 * @name Add Item to Wishlist
 * @route {POST} /addToWishlist
 */
app.post('/addToWishlist', (request, response) => {

    // Step 1 - Check if a user is logged in. If not, ask them to log in
    if (request.session.loggedIn != true) {
        response.render('index.hbs', {
            year: new Date().getFullYear(),
            loggedIn: request.session.loggedIn,
            error: `Please login first to add to wishlist.`
        });
    } else if (request.session.loggedIn === true) {

        var duplicate = false;
        // Pre-Step 2 - check for duplicate entry
        sql_db_function.fetch_wishlist_duplicates(request.session.uid, request.session.appid).then((result) => {

            duplicate = (result.length != 0);

            if (!duplicate) {

                sql_db_function.insert_wishlist(request.session.uid, request.session.appid).then((result) => {
                    // Step 3 - Get all their games from the database, and update the wishlist
                }).catch((error) => {
                    server_function.serverError(response, error);
                });
            }

            sql_db_function.fetch_wishlist(request.session.uid).then((queryResult) => {
                return steam_function.game_loop(queryResult);
            }).then((result) => {
                request.session.wishlist = result;

                response.render('index.hbs', {
                    gameList: server_function.sort_wishlist(request.session.sort, request.session.wishlist),
                    year: new Date().getFullYear(),
                    loggedIn: request.session.loggedIn,
                    userName: request.session.userName,
                    badAdd: duplicate,
                    details: 'Game Search'
                });
            }).catch((error) => {
                server_function.serverError(response, error);
            });
        });
    }
});

/**
 * Test if the users email is in the database and send them an email if it is
 * @name Send Password Recovery Email
 * @route {POST} /passwordRecovery
 */
app.post('/passwordRecovery', (request, response) => {

    var recovery_email = request.body.rec_email;
    var resultEmail = 'boolMatch';
    var invalidEmail = server_function.validateEmail(recovery_email, resultEmail);
    var token = 'token';
    var uid = 'uid';

    sql_db_function.check_email_existence(recovery_email, resultEmail).then((result) => {

        if (result) {
            // get uid from email
            sql_db_function.get_uid_from_email(recovery_email).then((resultingUID) => {
                return resultingUID;
            }).then((uidResult) => {
                //generate token
                var num = (Math.random() * 100000) + (Math.random() * 100000000000000000);
                var token = num.toString('16');
                token = token + token + token;
                token = token.split('').sort(function() { return 0.5 - Math.random() }).join('');
                uid = uidResult[0];
                userName = uidResult[1];

                // updating db with token
                sql_db_function.update_token(uid, token).then((uid) => {

                    //sending the email
                    var hbsMailer = require('nodemailer-express-handlebars'),
                        email = 'wishlisterhelp@gmail.com',
                        pass = 'Pa$$word123';
                    var path = require('path');
                    // var hbsExpress = require('express-handlebars');
                    var nodemailer = require('nodemailer');
                    var transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: email,
                            pass: pass
                        }
                    });

                    var handlebarsOptions = {
                        viewEngine: 'handlebars',
                        viewPath: path.resolve('./email_templates/'),
                        extName: '.html'
                    };

                    transporter.use('compile', hbsMailer(handlebarsOptions));

                    var mailOptions = {
                        from: email,
                        to: recovery_email,
                        template: 'reset-password-email',
                        subject: 'Password Recovery for Wishlister',
                        context: {
                            url: 'http://localhost:8080/passwordRecoveryEntry?id=' + uid + '?token=' + token,
                            name: userName
                        }
                    };

                    /// add username to uid get function and add it to email

                    transporter.sendMail(mailOptions, function(error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            response.render('index.hbs', {
                                gameList: server_function.sort_wishlist(request.session.sort, request.session.wishlist),
                                year: new Date().getFullYear(),
                                loggedIn: request.session.loggedIn,
                                userName: request.session.userName,
                                details: 'Game Search',
                                emailSent: true
                            });
                        }
                    });
                }).catch((error) => {
                    server_function.serverError(response, error);
                });
            }).catch((error) => {
                server_function.serverError(response, error);
            });
        } else {
            response.render('passwordRecovery.hbs', {
                emailNotFound: true,
                invalidEmailError: invalidEmail
            });
        }
    })
});

/**
 * Function to change the users password after checking the token provided and
 * token expiry is valid
 * @name Update User Password
 * @route {POST} /passwordRecoveryChange
 */
app.post('/passwordRecoveryChange', (request, response) => {
    var new_pass = request.body.rec_pass;
    var uid = 1;
    var token = '1';
    var currentTime = 'databaseTime';
    var tokenTime = 'tokenTime';
    var linked = request.query.id;

    if (linked.indexOf('?token=') != -1) {
        linked = linked.split('?token=');
        uid = linked[0];
        token = linked[1];

    }

    sql_db_function.check_token(uid, token, currentTime, tokenTime).then((queryResult) => {

        if (queryResult) {

            //hash, render, db function
            bcrypt.hash(new_pass, saltRounds).then((hash) => {
                return sql_db_function.update_password(uid, hash);
            }).then((result) => {
                if (result) {
                    var userInfo = result;
                    response.render('passwordRecovered.hbs', {
                        noLogIn: true
                    });


                    var email = 'wishlisterhelp@gmail.com',
                        pass = 'Pa$$word123';

                    var transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: email,
                            pass: pass
                        }
                    });

                    var handlebarsOptions = {
                        viewEngine: 'handlebars',
                        viewPath: path.resolve('./email_templates/'),
                        extName: '.html'
                    };

                    transporter.use('compile', hbsMailer(handlebarsOptions));

                    var mailOptions = {
                        from: email,
                        to: userInfo[0].email,
                        template: 'reset-password-confirmation',
                        subject: 'Password for Wishlister Changed',
                        context: {
                            name: userInfo[0].username
                        }
                    };

                    /// add username to uid get function and add it to email

                    transporter.sendMail(mailOptions, function(error, info) {
                        if (error) {
                            console.log(error);
                        }
                    });
                }
            }).catch((error) => {
                server_function.serverError(response, error);
            });
        } else {
            response.render('passwordRecoveryEntry.hbs', {
                tokenInvalid: true
            });


        }
    }).catch((error) => {
        server_function.serverError(response, error);
    });
});

/**
 * Handle all other paths and render 404 error page
 * @name Render 404 Page
 * @route {USE} *
 */
app.use((request, response) => {
    response.status(404);
    response.render('404.hbs');
});

/**
 * Listen on port 8080
 */
app.listen(8080, () => {
    console.log(`Server is up on the port ${serverPort}`);
});
