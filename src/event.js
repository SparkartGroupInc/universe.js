var EVENTS_ENDPOINT = 'events/';

$ = require('jquery');
var inherits = require('inherits');
var Base = require('./base.js');

var events_template = require('./templates/event.hbs');

var Event = function( config ){
	config = $.extend( config, {
		endpoint: EVENTS_ENDPOINT + config.id,
		template: events_template
	})
	Base.call( this, config );
};

inherits( Event, Base );

module.exports = Event;