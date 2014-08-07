var NO_OP = function(){};
var API_BASE_URL = 'https://staging.services.sparkart.net/api/v1/';

var jsonp = require('jsonp');
var xhr = require('xhr');

module.exports = function( endpoint, key, options, callback ){
	if( typeof options === 'function' ){
		callback = options;
		options = {};
	}
	callback = callback || NO_OP;
	var url = API_BASE_URL + endpoint +'?key='+ key;

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