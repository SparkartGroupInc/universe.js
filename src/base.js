var NO_OP = function(){};

var domready = require('domready');
var sizzle = require('sizzle');
var elClass = require('element-class');
var jsonp = require('jsonp');
var xhr = require('xhr');

var Base = function( config ){
	this.key = config.key || this.key;
	this.url = config.url || this.url;
	this.el = config.el;
	this.template = config.template || this.template || require('./test.hbs');
	this.preprocessor = config.preprocessor;
	domready( function(){
		if( typeof this.el === 'string' ){
			this.el = sizzle( this.el );
		}
		this.request();
	}.bind( this ) );
};

Base.prototype.request = function( options, callback ){
	if( typeof options === 'function' ){
		callback = options;
		options = {};
	}
	callback = callback || NO_OP;
	elClass( this.el ).add('loading');
	var url = ( typeof this.url === 'function' ) ? this.url() : this.url;

	// Use JSONP if this is IE or option is set
	if( typeof XDomainRequest === 'undefined' || options.jsonp ){
		jsonp( url, function( err, data ){
			this.render( data );
			elClass( this.el ).remove('loading');
			if( err ) elClass( this.el ).add('error');
		}.bind( this ) );
	}
	else {
		xhr({
			uri: url,
			cors: true
		}, function( err, request, response ){
			var data = JSON.parse( response );
			this.render( data );
			elClass( this.el ).remove('loading');
			if( err ) elClass( this.el ).add('error');
		}.bind( this ) );
	}

};

Base.prototype.preprocess = function( data ){
	try {
		if( this.preprocessor ) data = this.preprocessor( data );
	}
	catch( err ){
		if( err ) console.log('Error preprocessing module resource');
	}
	return data;
};

Base.prototype.render = function( data ){
	data = this.preprocess( data );
	try {
		for( var i = this.el.length - 1; i >= 0; i-- ){
			this.el[i].innerHTML = this.template( data );
		}
	}
	catch( err ){
		if( err ) console.log('Error rendering module');
	}
}

module.exports = Base;