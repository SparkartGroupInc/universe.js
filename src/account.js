var ACCOUNT_ENDPOINT = 'account/';

var $ = require('jquery');
var inherits = require('inherits');
var Base = require('./base.js');
var apiRequest = require('./api_request.js');

var account_template = require('./templates/account.hbs');
var errors_template = require('./templates/errors.hbs');

var Account = function( config ){
  config = $.extend( config, {
    endpoint: ACCOUNT_ENDPOINT,
    template: account_template
  });
  Base.call( this, config );
};

inherits( Account, Base );

Account.prototype.bindEvents = function(){
  var account = this;
  this.$el
  .off('.sparkart')
  .on( 'submit.sparkart', function( e ){
    e.preventDefault();
    var $form = $(this);
    var form_data = {
      username: $form.find('input[name="username"]').val(),
      first_name: $form.find('input[name="first_name"]').val(),
      last_name: $form.find('input[name="last_name"]').val(),
      email: $form.find('input[name="email"]').val(),
      current_password: $form.find('input[name="current_password"]').val(),
      password: $form.find('input[name="password"]').val(),
      password_confirmation: $form.find('input[name="password_confirmation"]').val()
    };

    // hide errors and error status
    account.hideErrors( $form );

    // disable the form until submission is complete
    $form.find('button[type="submit"]').prop( 'disabled', true );

    apiRequest( 'account', this.key, {
      method: 'post',
      api_url: this.api_url,
      data: form_data
    }, function( err, response ){
      console.log('post response',err,response);
      if( err ){
        account.showErrors( $form, err );
      }
      else {
        console.log( 'account', account );
        account.showSuccess( $form );
      }
    });
    console.log( e, form_data );
  });
};

Account.prototype.showErrors = function( $form, errors ){
  var errors_markup = errors_template({ errors: errors });
  $form.addClass('error')
    .find('div.errors').html( errors_markup ).show();
};

Account.prototype.showSuccess = function( $form, message ){
  $form.addClass('success')
    .find('div.success').html( message ).show();
};

Account.prototype.hideErrors = function( $form ){
  $form.removeClass('error success')
    .find('div.errors, div.success').hide();
};

module.exports = Account;