var EVENTS_URL = 'https://services.sparkart.net/api/v1/events';

var util = require('util');
var extend = require('extend');
var Base = require('./base.js');

var events_template = require('./templates/events.hbs');

var Events = function( config ){
	config = extend( config, {
		url:  function(){
			return EVENTS_URL +'?key='+ this.key
		},
		template: events_template
	})
	Base.call( this, config );
};

util.inherits( Events, Base );

module.exports = Events;