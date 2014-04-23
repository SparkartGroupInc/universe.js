var EVENTS_ENDPOINT = 'events/';

var util = require('util');
var extend = require('extend');
var Base = require('./base.js');

var events_template = require('./templates/event.hbs');

var Events = function( config ){
	config = extend( config, {
		endpoint: EVENTS_ENDPOINT + config.id,
		template: events_template
	})
	Base.call( this, config );
};

util.inherits( Events, Base );

module.exports = Events;