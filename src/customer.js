var CUSTOMER_ENDPOINT = 'account/';

var $ = require('jquery');
var inherits = require('inherits');
var Base = require('./base.js');

var customer_template = require('./templates/customer.hbs');

var Customer = function( config ){
  config = $.extend( config, {
    endpoint: CUSTOMER_ENDPOINT,
    template: customer_template
  });
  config.preprocessors = config.preprocessors || [];
  config.preprocessors.push( function addFanclubData( data ){
    console.log( 'config.fanclub', config.fanclub );
    data.fanclub = config.fanclub;
    return data;
  });
  Base.call( this, config );
};

inherits( Customer, Base );

module.exports = Customer;