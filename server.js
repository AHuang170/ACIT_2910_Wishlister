const express = require('express');
const hbs = require('hbs');
const fs = require('fs');
const _ = require('lodash');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const subsearch = require('subsequence-search');
const bcrypt = require('bcrypt');
const serverPort = 8080;
var math = require('mathjs');

/**
 * constant for password hash algorithm
 */
const saltRounds = 10;

//Contains all functions that uses the steam api, namely steam and game_loop
const steam_function = require('./steam.js');

// --------------------------------- MySQL RDS ---------------------------------
const sql_db_function = require('./sql_db.js');

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
    for (var item in titleList) {
        if (titleList[item][2] === 'Discount 0%') {
            out = `${out}<div class='game shadow' id='${titleList[item][4]}' >${titleList[item][3]}<p>${titleList[item][0]}</p><p>${titleList[item][1]}<img class='wishlistlogo' src='Steam_logo.png'></img></p><p>${titleList[item][2]}</p><div class='deleteButton' onclick='deleteMessage(${titleList[item][4]})' >x</div></div>`;
        } else {
            out = `${out}<div class='game_sale shadow' id='${titleList[item][4]}' >${titleList[item][3]}<p>${titleList[item][0]}</p><p>${titleList[item][1]}<img id='wishlistlogo' src='Steam_logo.png'></img></p><p>${titleList[item][2]}</p><div class='deleteButton' onclick='deleteMessage(${titleList[item][4]})' >x</div></div>`;
        }
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
// Main page before login
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
          gameList: request.session.wishlist,
          year: new Date().getFullYear(),
          loggedIn: request.session.loggedIn,
          userName: request.session.userName,
          details: 'Game Search'

      });

    }).catch((error) => {

        serverError(response, error);

    });

});

// Search for game using static JSON gamelist, and Steam API
app.post('/', (request, response) => {
    if (request.body.game == '') {
        response.render('index.hbs', {
            gameList: request.session.wishlist,
            year: new Date().getFullYear(),
            loggedIn: request.session.loggedIn,
            userName: request.session.userName
        })
    } else {
        var index = _.findIndex(gameobj['applist'].apps, function(o) {
            return o.name == request.body.game;
        });

        if (index != -1) {
            var appid = gameobj['applist'].apps[index].appid.toString();
            request.session.appid = appid;

            steam_function.steam(appid).then((result) => {
                var initial_price = parseInt(result.price_overview.initial);
                var disct_percentage = parseInt(result.price_overview.discount_percent);
                var current_price = `$${get_final_price(initial_price, disct_percentage)}`;

                response.render('index.hbs', {
                    gameList: request.session.wishlist,
                    year: new Date().getFullYear(),
                    loggedIn: request.session.loggedIn,
                    userName: request.session.userName,
                    gamename: `${result.name}`,
                    price: `Current Price: ${current_price}`,
                    discount: `Discount ${disct_percentage}%`,
                    displayDetails: true,
                    gameThumb: `<img id=\"gameThumb\" class=\"shadow\" src=\"${result.header_image}\" />`,
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

            maxItem = set_max_items(maxItem);
            for (i = 0; i < maxItem; i++) {
                var gameName = result.data[i].name;
                gameList.push(gameName);
            }

            resultNotFound = maxItem == 0;

            response.render('index.hbs', {
                gameList: request.session.wishlist,
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

// Using the appid of a found game, query the steam API and display result
app.get('/fetchDetails', (request, response) => {
    var index = _.findIndex(gameobj['applist'].apps, function(o) {
        return o.name == request.query.n;
    });

    if (index != -1) {
        var appid = gameobj['applist'].apps[index].appid.toString();
        request.session.appid = appid;

        steam_function.steam(appid).then((result) => {

            var initial_price = parseInt(result.price_overview.initial);
            var disct_percentage = parseInt(result.price_overview.discount_percent);
            var final_price = get_final_price(initial_price, disct_percentage);

            var current_price = `$${final_price}`;

            response.render('index.hbs', {
                gameList: request.session.wishlist,
                year: new Date().getFullYear(),
                failedAuth: false,
                loggedIn: request.session.loggedIn,
                userName: request.session.userName,
                gamename: `${result.name}`,
                price: `Current Price: ${current_price}`,
                discount: `Discount ${disct_percentage}%`,
                displayDetails: true,
                gameThumb: `<img id=\"gameThumb\" class=\"shadow\" src=\"${result.header_image}\" />`,
                details: 'Game Details'
            });
        }).catch((error) => {
            console.log(error);
        });
    }
});

// Authorize users through the login panel on the home page. Passwords are
// hashed and stored in the MySQL database
app.post('/loginAuth', (request, response) => {
    var input_name = request.body.username
    var input_pass = request.body.password
    var resultName = 'numMatch';

    // var query = `SELECT * FROM users WHERE username = '${input_name}'`;

    var empty_field = check_for_empty_fields(input_name, input_pass);

    sql_db_function.fetch_user_detail(input_name).then((result) => {
      if (result.length != 1) {
          request.session.loggedIn = false;
          response.render('index.hbs', {
              year: new Date().getFullYear(),
              failedAuth: true,
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
                      gameList: request.session.wishlist,
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
      serverError(response, error);
    })
});

// Delete sessions data and re-render the home page
app.get('/logout', (request, response) => {
    request.session = null;
    response.render('index.hbs', {
        year: new Date().getFullYear(),
        details: 'Game Search'
    });
});

// Deletes items from user's wishlist
app.get('/removeFromWishlist', (request, response) => {
    var appid = request.query.a;
    var uid = request.session.uid;

    sql_db_function.delete_from_wishlist(uid, appid).then((result) => {
        return
    });

    sql_db_function.fetch_wishlist(uid).then((queryResult) => {
        return steam_function.game_loop(queryResult);
    }).then((result) => {
        request.session.wishlist = result;
        response.render('index.hbs', {
            gameList: request.session.wishlist,
            year: new Date().getFullYear(),
            loggedIn: request.session.loggedIn,
            userName: request.session.userName,
            details: 'Game Search'
        });
    }).catch((error) => {
          serverError(response, error);
    });
});

// Load a new page where the user can create an account
app.get('/accCreate', (request, response) => {
    response.render('acc_create.hbs', {
        creatingUser: true,
        noLogIn: true
    });
});

// Load a new page where the user can recover their password via an email
app.get('/RecoverPassword', (request, response) => {
    response.render('passwordRecovery.hbs', {

    });
});

// Load a new page from the emailed link where a user can enter their new password
app.get('/passwordRecoveryEntry', (request, response) => {
    response.render('passwordRecoveryEntry.hbs', {
    });
});


// Accepts the user's email, name, and password. Performs server side checks for
// password quality
app.post('/createUser', (request, response) => {
    var input_user_email = request.body.acc_email;
    var input_user_name = request.body.acc_name;
    var input_user_pass = request.body.acc_pass;
    var input_dupe_pass = request.body.rpt_pass;
    var weak_pass = check_password_length(input_user_pass);
    var short_name = check_username_length(input_user_name);
    var pass_space = check_password_spaces(input_user_pass);
    var containsSpace = check_username_spaces(input_user_name);
    var pw_mismatch = check_matching_passwords(input_user_pass, input_dupe_pass);
    var resultName = 'numName';
    var invalidEmail = validateEmail(input_user_email);
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
            }).then((result)=>{
              if(result){
                response.render('acc_created.hbs', {
                    noLogIn: true
                });

              }
            }).catch((error) => {
                serverError(response, error);
            });
        }
    }).catch((error) => {
        serverError(response, error);
    });
  }).catch((error) => {
      serverError(response, error);
  });
})

// Add game to wishlist and store result in MySQL database for current user
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
                serverError(response, error);
              });
          }

          sql_db_function.fetch_wishlist(request.session.uid).then((queryResult) => {
            return steam_function.game_loop(queryResult);
          }).then((result) => {
            request.session.wishlist = result;
            response.render('index.hbs', {
                gameList: request.session.wishlist,
                year: new Date().getFullYear(),
                loggedIn: request.session.loggedIn,
                userName: request.session.userName,
                badAdd: duplicate,
                details: 'Game Search'
            });
          }).catch((error) => {
              serverError(response, error);
          });
        });
      }
});

//

// test if the users email is in the database and send them an email if it is

app.post('/passwordRecovery', (request, response) => {

    var recovery_email = request.body.rec_email;
    var resultEmail = 'boolMatch';
    var invalidEmail = validateEmail(recovery_email, resultEmail);
    var token = 'token';
    var uid = 'uid';

    sql_db_function.check_email_existence(recovery_email, resultEmail).then((result) => {

      if (result)
      {
        // get uid from email
            sql_db_function.get_uid_from_email(recovery_email).then((resultingUID) => {
                return resultingUID;
            }).then((uid) => {
              //generate token
              var num = (Math.random()*100000)+(Math.random()*100000000000000000);
              var token = num.toString('16');
              token = token + token + token;
              token = token.split('').sort(function(){return 0.5-Math.random()}).join('');


              //sending the email
      var nodemailer = require('nodemailer');
      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'wishlisterhelp@gmail.com',
          pass: 'Pa$$word123'
        }
      });
      var mailOptions = {
        from: 'wishlisterhelp@gmail.com',
        to: recovery_email,
        subject: 'Password Recovery for Wishlister',
        text: 'http://localhost:8080/passwordRecoveryEntry?id='+uid+'token='+token
      };

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          response.render('index.hbs',  {
            gameList: request.session.wishlist,
            year: new Date().getFullYear(),
            loggedIn: request.session.loggedIn,
            userName: request.session.userName,
            details: 'Game Search',
            emailSent: true
          });
        }
      });
    })
      }
      else {
            response.render('passwordRecovery.hbs', {
              emailNotFound: true,
              invalidEmailError: invalidEmail
            });
      }
    })
  });

// temp function to check changing password
app.post('/passwordRecoveryChange', (request, response) => {
  var new_pass = request.body.rec_pass;
  var uid = 111;


  // note add empty hidden input field containing

//hash, render, db function
  bcrypt.hash(new_pass, saltRounds).then((hash) => {
      return sql_db_function.update_password(uid, hash);
  }).then((result)=>{
    if(result){
      response.render('passwordRecovered.hbs', {
          noLogIn: true
      });

    }
  }).catch((error) => {
      serverError(response, error);
  });
});
//end of temp function


// Handle all other paths and render 404 error page
app.use((request, response) => {
    response.status(404);
    response.render('404.hbs');
});

// Listen on port 80
app.listen(8080, () => {
    console.log(`Server is up on the port ${serverPort}`);
});

// Handle server errors and render 500 error page
var serverError = (response, errorMsg) => {
    console.log(errorMsg);
    response.status(500);
    response.render('500.hbs');
}

var check_username_length = (input_user_name) => {
  return (input_user_name.length < 6);
}

var check_username_spaces = (input_user_name) => {
  return (input_user_name.indexOf(" ") != -1)
}

var check_password_length = (input_user_pass) => {
  return input_user_pass.length < 8;
}

var check_password_spaces = (input_user_pass) => {
  return input_user_pass.indexOf(" ") != -1;
}

var check_matching_passwords = (password_1, password_2) => {
  return password_1 != password_2;
}

var check_for_empty_fields = (input_name, input_pass) => {
  return (input_name == '' || input_pass == '');
}

var get_final_price = (initial_price, disct_percentage) => {
  return (initial_price * (1 - (disct_percentage / 100)) / 100).toFixed(2).toString();
}

var set_max_items = (item_count) => {
  return_count = item_count;
  if(return_count > 10){
    return_count = 10;
  }
  return return_count;
}

// validate email

var validateEmail = (email) => {
  var valid = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  error = !valid.test(email);
  return error;
}
