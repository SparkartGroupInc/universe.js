var EVENTS_ENDPOINT = 'events/';

var $ = require('jquery');
var util = require('util');
var Base = require('./base.js');

var events_template = require('./templates/events.hbs');

var Events = function( config ){
	config = $.extend( config, {
		endpoint: EVENTS_ENDPOINT,
		template: events_template
	})
	Base.call( this, config );
};

util.inherits( Events, Base );

module.exports = Events;