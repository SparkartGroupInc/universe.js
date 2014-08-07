var NO_OP = function(){};

var Customer = require('./src/customer.js');
var Account = require('./src/account.js');
var Event = require('./src/event.js');
var Events = require('./src/events.js');
var Plans = require('./src/plans.js');
var apiRequest = require('./src/api_request.js');

var Universe = function( config ){
	if( !config.key ){
		throw new Error('key must be specified when instantiating a Universe');
	}
	this.key = config.key;
	this.api_url = config.api_url;
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
	apiRequest( 'account/status', this.key, { jsonp: true, api_url: this.api_url }, function( err, response ){
		this.logged_in = response.logged_in;
		// Request full account object from API if user is logged in
		if( this.logged_in ){
			apiRequest( 'account', this.key, { api_url: this.api_url }, function( err, response ){
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
	apiRequest( 'fanclub', this.key, { api_url: this.api_url }, function( err, response ){
		fanclub.fanclub = response ? response.fanclub : null;
		fanclub.fanclub_request_complete = true;
		attemptInit();
	});
};

Universe.prototype.initialize = function(){
	console.log('initialize fanclub!', this);
	this.queuedWidgets();
};

// initialize a widget
Universe.prototype.widget = function( name, options ){
	// if the account or fanclub requests are still pending, queue this for later
	if( !( this.account_request_complete && this.fanclub_request_complete ) ){
		this.queued_widgets.push( [name,options] );
		return;
	}
	options.key = this.key;
	options.api_url = this.api_url;
	options.fanclub = this.fanclub;
	switch( name ){
	case 'customer':
		new Customer( options );
	break;
	case 'account':
		new Account( options );
	break;
	case 'event':
		new Event( options );
	break;
	case 'events':
		new Events( options );
	break;
	case 'plans':
		new Plans( options );
	break;
	}
};

// loop through queued widget initializaitons and initialize them all
Universe.prototype.queuedWidgets = function(){
	for( var i = this.queued_widgets.length - 1; i >= 0; i-- ){
		this.widget.apply( this, this.queued_widgets[i] );
	}
	this.queued_widgets = [];
};

module.exports = Universe;