var PLANS_ENDPOINT = 'plans/';

var extend = require('extend');
var inherits = require('inherits');
var Base = require('./base.js');

var plans_template = require('./templates/plans.hbs');

var Events = function( config ){
	config = extend( config, {
		endpoint: PLANS_ENDPOINT,
		template: plans_template
	})
	Base.call( this, config );
};

inherits( Events, Base );

module.exports = Events;