var PLANS_ENDPOINT = 'plans/';

var $ = require('jquery');
var inherits = require('inherits');
var Base = require('./base.js');

var plans_template = require('./templates/plans.hbs');

var Plans = function( config ){
	config = $.extend( config, {
		endpoint: PLANS_ENDPOINT,
		template: plans_template
	})
	Base.call( this, config );
};

inherits( Plans, Base );

module.exports = Plans;