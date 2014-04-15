var NO_OP = function(){};

var domready = require('domready');
var sizzle = require('sizzle');
var elClass = require('element-class');
var jsonp = require('jsonp');
var xhr = require('xhr');

var Modular = function( config ){
	this.url = config.url;
	this.el = config.el;
	this.template = config.template || require('./test.hbs');
	this.preprocessor = config.preprocessor;
	domready( function(){
		if( typeof this.el === 'string' ){
			this.el = sizzle( this.el )[0];
		}
		this.request();
	}.bind( this ) );
};

Modular.prototype.request = function( options, callback ){
	if( typeof options === 'function' ){
		callback = options;
		options = {};
	}
	callback = callback || NO_OP;
	elClass( this.el ).add('loading');

	// Use JSONP if this is IE or option is set
	if( typeof XDomainRequest === 'undefined' || options.jsonp ){
		jsonp( this.url, function( err, data ){
			this.render( data );
			elClass( this.el ).remove('loading');
			if( err ) elClass( this.el ).add('error');
		}.bind( this ) );
	} else {
		xhr({
			uri: this.url,
			cors: true
		}, function( err, request, response ){
			var data = JSON.parse( response );
			this.render( data );
			elClass( this.el ).remove('loading');
			if( err ) elClass( this.el ).add('error');
		}.bind( this ) );
	}

};

Modular.prototype.render = function( data ){
	if( this.preprocessor ) data = this.preprocessor( data );
	this.el.innerHTML = this.template( data );
}

module.exports = Modular;