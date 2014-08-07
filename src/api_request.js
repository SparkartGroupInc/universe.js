var NO_OP = function(){};

var jsonp = require('jsonp');
var xhr = require('xhr');

module.exports = function( endpoint, key, options, callback ){
  if( typeof options === 'function' ){
    callback = options;
    options = {};
  }
  callback = callback || NO_OP;
  var base_url = options.api_url || 'https://services.sparkart.net/api/v1/';
  var url = base_url + endpoint +'?key='+ key;

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