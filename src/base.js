var NO_OP = function(){};

var $ = require('jquery');
var Handlebars = require('hbsfy/runtime');
var handlebars_helper = require('handlebars-helper');

handlebars_helper.help( Handlebars );

var apiRequest = require('./api_request.js');

var Base = function( config ){
	var base = this;
	this.key = config.key || this.key;
	this.endpoint = config.endpoint || this.endpoint;
	this.el = config.el;
	this.template = config.template || this.template || require('./test.hbs');
	this.preprocessors = config.preprocessors || [];
	$(function(){
		if( typeof base.el === 'string' ){
			base.$el = $(base.el);
		}
		base.request();
	});
};

Base.prototype.request = function( options, callback ){
	var base = this;
	if( typeof options === 'function' ){
		callback = options;
		options = {};
	}
	callback = callback || NO_OP;
	this.$el.addClass('loading');
	apiRequest( this.endpoint, this.key, function( err, response ){
		console.log('response',response);
		base.render( response );
		base.$el.removeClass('loading');
		if( err ) base.$el.addClass('error');
	});
};

// loop through all preprocessors and return transformed data
Base.prototype.preprocess = function( data ){
	console.log( 'preprocessors', this.preprocessors );
	try {
		if( this.preprocessors.length > 0 ){
			for( var i = this.preprocessors.length - 1; i >= 0; i-- ){
				data = this.preprocessors[i]( data );
			};
		}
	}
	catch( err ){
		if( err ) console.log('Error preprocessing module resource');
	}
	return data;
};

Base.prototype.render = function( data ){
	data = this.preprocess( data );
	console.log('render data',data);
	try {
		this.$el.html( this.template( data ) );
		this.bindEvents();
	}
	catch( err ){
		if( err ) console.log('Error rendering module');
	}
};

Base.prototype.bindEvents = NO_OP;

module.exports = Base;