var NO_OP = function(){};

var domready = require('domready');
var sizzle = require('sizzle');
var elClass = require('element-class');
var Handlebars = require('hbsfy/runtime');
var handlebars_helper = require('handlebars-helper');

handlebars_helper.help( Handlebars );

var apiRequest = require('./api_request.js');

var Base = function( config ){
	this.key = config.key || this.key;
	this.endpoint = config.endpoint || this.endpoint;
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
	var base = this;
	if( typeof options === 'function' ){
		callback = options;
		options = {};
	}
	callback = callback || NO_OP;
	elClass( this.el ).add('loading');
	apiRequest( this.endpoint, this.key, function( err, response ){
		base.render( response );
		elClass( this.el ).remove('loading');
		if( err ) elClass( this.el ).add('error');
	});
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