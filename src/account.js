var ACCOUNT_ENDPOINT = 'account/';

var $ = require('jquery');
var inherits = require('inherits');
var Base = require('./base.js');

var account_template = require('./templates/account.hbs');

var Account = function( config ){
	config = $.extend( config, {
		endpoint: ACCOUNT_ENDPOINT,
		template: account_template
	})
	Base.call( this, config );
};

inherits( Account, Base );

Account.prototype.bindEvents = function(){
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
		console.log( e, form_data );
	});
};

module.exports = Account;