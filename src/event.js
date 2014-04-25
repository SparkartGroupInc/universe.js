var EVENTS_ENDPOINT = 'events/';

var extend = require('extend');
var inherits = require('inherits');
var Base = require('./base.js');

var events_template = require('./templates/event.hbs');

var Events = function( config ){
	config = extend( config, {
		endpoint: EVENTS_ENDPOINT + config.id,
		template: events_template
	})
	Base.call( this, config );
};

inherits( Events, Base );

module.exports = Events;