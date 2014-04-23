var NO_OP = function(){};
var API_BASE_URL = 'https://services.sparkart.net/api/v1/';

var jsonp = require('jsonp');
var xhr = require('xhr');

var Event = require('./src/event.js');
var Events = require('./src/events.js');

var Universe = function( config ){
	if( !config.api_key ){
		throw new Error('api_key must be specified when instantiating a Universe');
	}
	this.api_key = config.api_key;
	this.logged_in = null;
	this.customer = null;
	this.fanclub = null;
	this.account_request_complete = false;
	this.fanclub_request_complete = false;
	this.queued_widgets = [];

	var fanclub = this;

	// attempt to run fanclub.initialize
	var attemptInit = function(){
		if( fanclub.account_request_complete && fanclub.fanclub_request_complete ){
			fanclub.initialize();
		}
	};

	// Check login status, so we can short-circuit other API requests if logged out
	this.request( 'account/status', { jsonp: true }, function( err, response ){
		this.logged_in = response.logged_in;
		// Request full account object from API if user is logged in
		if( this.logged_in ){
			fanclub.request( 'account', function( err, response ){
				fanclub.customer = response ? response.customer : null;
				fanclub.account_request_complete = true;
				attemptInit();
			});
		// Skip account request if user is not logged in
		} else {			
			fanclub.account_request_complete = true;
			attemptInit();
		}
	});

	// Fetch initial Fanclub data from API
	this.request( 'fanclub', function( err, response ){
		fanclub.fanclub = response ? response.fanclub : null;
		fanclub.fanclub_request_complete = true;
		attemptInit();
	});
};

Universe.prototype.initialize = function(){
	console.log('initialize fanclub!', this);
	this.queuedWidgets();
};

// generate a request url from a given endpoint
Universe.prototype.generateURLfromEndpoint = function( endpoint ){
	return API_BASE_URL + endpoint +'?key='+ this.api_key;
};

// request data from an API endpoint
Universe.prototype.request = function( endpoint, options, callback ){
	if( typeof options === 'function' ){
		callback = options;
		options = {};
	}
	callback = callback || NO_OP;
	var url = this.generateURLfromEndpoint( endpoint );

	// Use JSONP if this is IE or option is set
	if( typeof XDomainRequest === 'undefined' || options.jsonp ){
		jsonp( url, function( err, data ){
			callback( err, data );
		});
	}
	else {
		xhr({
			uri: url,
			cors: true
		}, function( err, request, response ){
			var data = JSON.parse( response );
			callback( err, data );
		});
	}
};

// initialize a widget
Universe.prototype.widget = function( name, options ){
	console.log('widget',name);
	if( !( this.account_request_complete && this.fanclub_request_complete ) ){
		this.queued_widgets.push( [name,options] );
		return;
	}
	options.key = this.api_key;
	switch( name ){
	case 'event':
		new Event( options );
	break;
	case 'events':
		new Events( options );
	break;
	}
};

Universe.prototype.queuedWidgets = function(){
	console.log( 'queued', this.queued_widgets );
	for( var i = this.queued_widgets.length - 1; i >= 0; i-- ){
		this.widget.apply( this, this.queued_widgets[i] );
	}
	this.queued_widgets = [];
};

module.exports = Universe;