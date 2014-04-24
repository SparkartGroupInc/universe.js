var ACCOUNT_ENDPOINT = 'account/';

var extend = require('extend');
var inherits = require('inherits');
var Base = require('./base.js');

var account_template = require('./templates/account.hbs');

var Events = function( config ){
	config = extend( config, {
		endpoint: ACCOUNT_ENDPOINT,
		template: account_template
	})
	Base.call( this, config );
};

inherits( Events, Base );

module.exports = Events;