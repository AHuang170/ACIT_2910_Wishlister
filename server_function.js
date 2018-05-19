var serverError = (response, errorMsg) => {
    if (response == undefined){
        return false
    } else {
        console.log(errorMsg);
        response.status(500);
        response.render('500.hbs');
        return true
    }
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

module.exports = {
    serverError, check_username_length, check_username_spaces,
    check_password_length, check_password_spaces, check_matching_passwords,
    check_for_empty_fields, get_final_price, set_max_items, validateEmail
}
