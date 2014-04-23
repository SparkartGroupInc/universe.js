!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Universe=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var NO_OP = function(){};

var Event = _dereq_('./src/event.js');
var Events = _dereq_('./src/events.js');
var apiRequest = _dereq_('./src/api_request.js');

var Universe = function( config ){
	if( !config.key ){
		throw new Error('key must be specified when instantiating a Universe');
	}
	this.key = config.key;
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
	apiRequest( 'account/status', this.key, { jsonp: true }, function( err, response ){
		this.logged_in = response.logged_in;
		// Request full account object from API if user is logged in
		if( this.logged_in ){
			apiRequest( 'account', this.key, function( err, response ){
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
	apiRequest( 'fanclub', this.key, function( err, response ){
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
	switch( name ){
	case 'event':
		new Event( options );
	break;
	case 'events':
		new Events( options );
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
},{"./src/api_request.js":122,"./src/event.js":124,"./src/events.js":125}],2:[function(_dereq_,module,exports){
/*!
  * domready (c) Dustin Diaz 2014 - License MIT
  */
!function (name, definition) {

  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()

}('domready', function () {

  var fns = [], listener
    , doc = document
    , domContentLoaded = 'DOMContentLoaded'
    , loaded = /^loaded|^c/.test(doc.readyState)

  function flush (fn) {
    loaded = 1
    while (fn = fns.shift()) fn()
  }

  doc.addEventListener(domContentLoaded, listener = function () {
    doc.removeEventListener(domContentLoaded, listener)
    flush()
  })

  return function (fn) {
    loaded ? fn() : fns.push(fn)
  }

});

},{}],3:[function(_dereq_,module,exports){
module.exports = function(opts) {
  return new ElementClass(opts)
}

function ElementClass(opts) {
  if (!(this instanceof ElementClass)) return new ElementClass(opts)
  var self = this
  if (!opts) opts = {}
  if (opts instanceof HTMLElement) opts = {el: opts}
  this.opts = opts
  this.el = opts.el || document.body
  if (typeof this.el !== 'object') this.el = document.querySelector(this.el)
}

ElementClass.prototype.add = function(className) {
  var el = this.el
  if (!el) return
  if (el.className === "") return el.className = className
  var classes = el.className.split(' ')
  if (classes.indexOf(className) > -1) return classes
  classes.push(className)
  el.className = classes.join(' ')
  return classes
}

ElementClass.prototype.remove = function(className) {
  var el = this.el
  if (!el) return
  if (el.className === "") return
  var classes = el.className.split(' ')
  var idx = classes.indexOf(className)
  if (idx > -1) classes.splice(idx, 1)
  el.className = classes.join(' ')
  return classes
}

ElementClass.prototype.has = function(className) {
  var el = this.el
  if (!el) return
  var classes = el.className.split(' ')
  return classes.indexOf(className) > -1
}

},{}],4:[function(_dereq_,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

function isPlainObject(obj) {
	if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval)
		return false;

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method)
		return false;

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for ( key in obj ) {}

	return key === undefined || hasOwn.call( obj, key );
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone,
	    target = arguments[0] || {},
	    i = 1,
	    length = arguments.length,
	    deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && typeof target !== "function") {
		target = {};
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( isPlainObject(copy) || (copyIsArray = Array.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];

					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

},{}],5:[function(_dereq_,module,exports){
module.exports = _dereq_('./lib');
},{"./lib":30}],6:[function(_dereq_,module,exports){
module.exports = function(){
	var numbers = Array.prototype.slice.call( arguments, 0, -1 );
	var result = 0;
	for( var i = numbers.length - 1; i >= 0; i-- ){
		result += parseFloat( numbers[i], 10 ) || 0;
	}
	return result;
};
},{}],7:[function(_dereq_,module,exports){
// Modified form of `timeago` helper from https://github.com/assemble/handlebars-helpers

var newDate = _dereq_('new-date');

var YEAR = 60 * 60 * 24 * 365;
var MONTH = 60 * 60 * 24 * 30;
var DAY = 60 * 60 * 24;
var HOUR = 60 * 60;

module.exports = function( date ){
	date = newDate( date );
	var seconds = Math.floor( ( new Date() - date ) / 1000 );
	var interval = Math.floor( seconds / YEAR );
	if( interval > 1 ) return interval +' years ago';
	interval = Math.floor( seconds / MONTH );
	if( interval > 1 ) return interval +' months ago';
	interval = Math.floor( seconds / DAY );
	if( interval > 1 ) return interval +' days ago';
	interval = Math.floor( seconds / HOUR );
	if( interval > 1 ) return interval +' hours ago';
	interval = Math.floor( seconds / 60 );
	if( interval > 1 ) return interval +' minutes ago';
	if( Math.floor( seconds ) <= 1 ) return 'Just now';
	else return Math.floor( seconds ) +' seconds ago';
};
},{"new-date":97}],8:[function(_dereq_,module,exports){
module.exports = function( collection, start, end, options ){
	options = options || end;
	if( typeof start !== 'number' ) return;
	end = ( typeof end !== 'number' ) ? collection.length : ( end > 0 )? end + 1 : end;
	collection = collection.slice( start, end );
	var result = '';
	for( var i = 0; i < collection.length; i++ ){
		result += options.fn( collection[i] );
	}
	return result;
};
},{}],9:[function(_dereq_,module,exports){
module.exports = function( collection, item, options ){
	// string check
	if( typeof collection === 'string' ){
		if( collection.search( item ) >= 0 ){
			return options.fn(this);
		}
		else {
			return options.inverse(this);
		}
	}
	// "collection" check (objects & arrays)
	for( var prop in collection ){
		if( collection.hasOwnProperty( prop ) ){
			if( collection[prop] == item ) return options.fn(this);
		}
	}
	return options.inverse(this);
};
},{}],10:[function(_dereq_,module,exports){
module.exports = function(){
	var numbers = Array.prototype.slice.call( arguments, 1, -1 );
	var result = arguments[0];
	for( var i = numbers.length - 1; i >= 0; i-- ){
		result /= parseFloat( numbers[i], 10 ) || 0;
	}
	return result;
};
},{}],11:[function(_dereq_,module,exports){
module.exports = function( string ){
	return encodeURIComponent( string );	
};
},{}],12:[function(_dereq_,module,exports){
module.exports = function( left, right, exact, options ){
	options = options || exact;
	exact = ( exact === 'exact' ) ? true : false;
	var is_equal = exact ? ( left === right ) : ( left == right );
	if( is_equal ) return options.fn(this);
	return options.inverse(this);
};
},{}],13:[function(_dereq_,module,exports){
module.exports = function( collection, count, options ){
	options = options || count;
	count = ( typeof count === 'number' ) ? count : 1;
	var result = '';
	var i = 0;
	for( var key in collection ){
		if( collection.hasOwnProperty( key ) ){
			result += options.fn( collection[key] );
			i++;
			if( i == count ) break;
		}
	}
	return result;
};
},{}],14:[function(_dereq_,module,exports){
var strftimeTZ = _dereq_('strftime').strftimeTZ;
var newDate = _dereq_('new-date');

module.exports = function( date_string, format, offset ){
	offset = ( typeof offset === 'number' ) ? offset : null;
	var date = newDate( date_string );
	return strftimeTZ( format, date, offset );
};
},{"new-date":97,"strftime":102}],15:[function(_dereq_,module,exports){
module.exports = function( left, right, equal, options ){
	options = options || equal;
	equal = ( equal === 'equal' ) ? true : false;
	var is_greater = equal ? ( left >= right ) : ( left > right );
	if( is_greater ) return options.fn( this );
	return options.inverse( this );
};
},{}],16:[function(_dereq_,module,exports){
module.exports = function( collection, separator ){
	separator = ( typeof separator === 'string' ) ? separator : '';
	// if the collectoin is an array this is easy
	if( collection.join ) return collection.join( separator );
	// if it's not we actually have to write code.
	var result = '';
	for( var property in collection ){
		if( collection.hasOwnProperty(property) ){
			result += collection[property] + separator;
		}
	}
	return result.slice( 0, -separator.length );
};
},{}],17:[function(_dereq_,module,exports){
var _isArray = _dereq_('lodash.isarray');
var _reduce = _dereq_('lodash.reduce');

module.exports = function( collection, count, options ){
	options = options || count;
	count = ( typeof count === 'number' ) ? count : 1;
	// if collection is an object, make it an array
	// otherwise we have no way to clip off the "end"
	if( !_isArray( collection ) ){
		var collection_array = [];
		for( var key in collection ){
			if( collection.hasOwnProperty( key ) ){
				collection_array.push( collection[key] );
			}
		}
		collection = collection_array;
	}
	var collection_last = collection.slice( -1 * count );
	var result = _reduce( collection_last, function( previous, current ){
		return previous + options.fn( current );
	}, '' );
	return result;
};
},{"lodash.isarray":31,"lodash.reduce":33}],18:[function(_dereq_,module,exports){
module.exports = function( collection ){
	if( collection.length ) return collection.length;
	var length = 0;
	for( var prop in collection ){
		if( collection.hasOwnProperty( prop ) ){
			length++;
		}
	}
	return length;
};
},{}],19:[function(_dereq_,module,exports){
module.exports = function( left, right, equal, options ){
	options = options || equal;
	equal = ( equal === 'equal' ) ? true : false;
	var is_greater = equal ? ( left <= right ) : ( left < right );
	if( is_greater ) return options.fn( this );
	return options.inverse( this );
};
},{}],20:[function(_dereq_,module,exports){
module.exports = function( string ){
	return ( string || '' ).toLowerCase();	
};
},{}],21:[function(_dereq_,module,exports){
module.exports = function(){
	var numbers = Array.prototype.slice.call( arguments, 1, -1 );
	var result = arguments[0];
	for( var i = numbers.length - 1; i >= 0; i-- ){
		result *= parseFloat( numbers[i], 10 ) || 0;
	}
	return result;
};
},{}],22:[function(_dereq_,module,exports){
module.exports = function( collection, start, amount, options ){
	options = options || amount;
	if( typeof start !== 'number' ) return;
	var end = ( typeof amount !== 'number' ) ? collection.length : start + amount;
	collection = collection.slice( start, end );
	var result = '';
	for( var i = 0; i < collection.length; i++ ){
		result += options.fn( collection[i] );
	}
	return result;
};
},{}],23:[function(_dereq_,module,exports){
module.exports = function( string, to_replace, replacement ){
	return ( string || '' ).replace( to_replace, replacement );
};
},{}],24:[function(_dereq_,module,exports){
module.exports = function( collection, options ){
	var result = '';
	for( var i = collection.length - 1; i >= 0; i-- ){
		result += options.fn( collection[i] );
	}
	return result;
};
},{}],25:[function(_dereq_,module,exports){
// Simple shuffling method based off of http://bost.ocks.org/mike/shuffle/
var shuffle = function( array ){
	var i = array.length, j, swap;
	while( i ){
		j = Math.floor( Math.random() * i-- );
		swap = array[i];
		array[i] = array[j];
		array[j] = swap;
	}
	return array;
};

module.exports = function( collection, options ){
	var shuffled = shuffle( collection );
	var result = '';
	for( var i = 0; i < shuffled.length; i++ ){
		result += options.fn( shuffled[i] );
	}
	return result;
};
},{}],26:[function(_dereq_,module,exports){
module.exports = function(){
	var numbers = Array.prototype.slice.call( arguments, 1, -1 );
	var result = parseFloat( arguments[0], 10 );
	for( var i = numbers.length - 1; i >= 0; i-- ){
		result -= parseFloat( numbers[i], 10 ) || 0;
	}
	return result;
};
},{}],27:[function(_dereq_,module,exports){
module.exports = function( number, zero, options ){
	options = options || zero;
	zero = ( zero === 'zero' ) ? true : false;
	var result = '';
	var i;
	if( zero ){
		for( i = 0; i < number; i++ ) result += options.fn( i );
	}
	else {
		for( i = 1; i <= number; i++ ) result += options.fn( i );
	}
	return result;
};
},{}],28:[function(_dereq_,module,exports){
module.exports = function( string ){
	return ( string || '' ).toUpperCase();
};
},{}],29:[function(_dereq_,module,exports){
module.exports = function( collection, key, value, limit, options ){
	options = options || limit;
	if( typeof limit !== 'number' ) limit = Infinity;
	var matches = 0;
	var result = '';
	for( var i = 0; i < collection.length; i++ ){
		if( collection[i][key] === value ){
			result += options.fn( collection[i] );
			matches++;
			if( matches === limit ) return result;
		}
	}
	return result;
};
},{}],30:[function(_dereq_,module,exports){
var helpers = {
	// string
	lowercase: _dereq_('./helpers/lowercase.js'),
	uppercase: _dereq_('./helpers/uppercase.js'),
	replace: _dereq_('./helpers/replace.js'),
	encode: _dereq_('./helpers/encode.js'),
	// collection
	length: _dereq_('./helpers/length.js'),
	contains: _dereq_('./helpers/contains.js'),
	first: _dereq_('./helpers/first.js'),
	last: _dereq_('./helpers/last.js'),
	between: _dereq_('./helpers/between.js'),
	range: _dereq_('./helpers/range.js'),
	where: _dereq_('./helpers/where.js'),
	shuffle: _dereq_('./helpers/shuffle.js'),
	reverse: _dereq_('./helpers/reverse.js'),
	join: _dereq_('./helpers/join.js'),
	// date
	ago: _dereq_('./helpers/ago.js'),
	formatDate: _dereq_('./helpers/formatDate.js'),
	// equality
	equal: _dereq_('./helpers/equal.js'),
	greater: _dereq_('./helpers/greater.js'),
	less: _dereq_('./helpers/less.js'),
	// numbers
	times: _dereq_('./helpers/times.js'),
	add: _dereq_('./helpers/add.js'),
	subtract: _dereq_('./helpers/subtract.js'),
	multiply: _dereq_('./helpers/multiply.js'),
	divide: _dereq_('./helpers/divide.js')
};

module.exports.help = function( Handlebars ){
	for( var name in helpers ){
		Handlebars.registerHelper( name, helpers[name] );
	}
};
},{"./helpers/add.js":6,"./helpers/ago.js":7,"./helpers/between.js":8,"./helpers/contains.js":9,"./helpers/divide.js":10,"./helpers/encode.js":11,"./helpers/equal.js":12,"./helpers/first.js":13,"./helpers/formatDate.js":14,"./helpers/greater.js":15,"./helpers/join.js":16,"./helpers/last.js":17,"./helpers/length.js":18,"./helpers/less.js":19,"./helpers/lowercase.js":20,"./helpers/multiply.js":21,"./helpers/range.js":22,"./helpers/replace.js":23,"./helpers/reverse.js":24,"./helpers/shuffle.js":25,"./helpers/subtract.js":26,"./helpers/times.js":27,"./helpers/uppercase.js":28,"./helpers/where.js":29}],31:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isNative = _dereq_('lodash._isnative');

/** `Object#toString` result shortcuts */
var arrayClass = '[object Array]';

/** Used for native method references */
var objectProto = Object.prototype;

/** Used to resolve the internal [[Class]] of values */
var toString = objectProto.toString;

/* Native method shortcuts for methods with the same name as other `lodash` methods */
var nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray;

/**
 * Checks if `value` is an array.
 *
 * @static
 * @memberOf _
 * @type Function
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
 * @example
 *
 * (function() { return _.isArray(arguments); })();
 * // => false
 *
 * _.isArray([1, 2, 3]);
 * // => true
 */
var isArray = nativeIsArray || function(value) {
  return value && typeof value == 'object' && typeof value.length == 'number' &&
    toString.call(value) == arrayClass || false;
};

module.exports = isArray;

},{"lodash._isnative":32}],32:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used for native method references */
var objectProto = Object.prototype;

/** Used to resolve the internal [[Class]] of values */
var toString = objectProto.toString;

/** Used to detect if a method is native */
var reNative = RegExp('^' +
  String(toString)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/toString| for [^\]]+/g, '.*?') + '$'
);

/**
 * Checks if `value` is a native function.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
 */
function isNative(value) {
  return typeof value == 'function' && reNative.test(value);
}

module.exports = isNative;

},{}],33:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var createCallback = _dereq_('lodash.createcallback'),
    forOwn = _dereq_('lodash.forown');

/**
 * Reduces a collection to a value which is the accumulated result of running
 * each element in the collection through the callback, where each successive
 * callback execution consumes the return value of the previous execution. If
 * `accumulator` is not provided the first element of the collection will be
 * used as the initial `accumulator` value. The callback is bound to `thisArg`
 * and invoked with four arguments; (accumulator, value, index|key, collection).
 *
 * @static
 * @memberOf _
 * @alias foldl, inject
 * @category Collections
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} [callback=identity] The function called per iteration.
 * @param {*} [accumulator] Initial value of the accumulator.
 * @param {*} [thisArg] The `this` binding of `callback`.
 * @returns {*} Returns the accumulated value.
 * @example
 *
 * var sum = _.reduce([1, 2, 3], function(sum, num) {
 *   return sum + num;
 * });
 * // => 6
 *
 * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
 *   result[key] = num * 3;
 *   return result;
 * }, {});
 * // => { 'a': 3, 'b': 6, 'c': 9 }
 */
function reduce(collection, callback, accumulator, thisArg) {
  if (!collection) return accumulator;
  var noaccum = arguments.length < 3;
  callback = createCallback(callback, thisArg, 4);

  var index = -1,
      length = collection.length;

  if (typeof length == 'number') {
    if (noaccum) {
      accumulator = collection[++index];
    }
    while (++index < length) {
      accumulator = callback(accumulator, collection[index], index, collection);
    }
  } else {
    forOwn(collection, function(value, index, collection) {
      accumulator = noaccum
        ? (noaccum = false, value)
        : callback(accumulator, value, index, collection)
    });
  }
  return accumulator;
}

module.exports = reduce;

},{"lodash.createcallback":34,"lodash.forown":70}],34:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseCreateCallback = _dereq_('lodash._basecreatecallback'),
    baseIsEqual = _dereq_('lodash._baseisequal'),
    isObject = _dereq_('lodash.isobject'),
    keys = _dereq_('lodash.keys'),
    property = _dereq_('lodash.property');

/**
 * Produces a callback bound to an optional `thisArg`. If `func` is a property
 * name the created callback will return the property value for a given element.
 * If `func` is an object the created callback will return `true` for elements
 * that contain the equivalent object properties, otherwise it will return `false`.
 *
 * @static
 * @memberOf _
 * @category Utilities
 * @param {*} [func=identity] The value to convert to a callback.
 * @param {*} [thisArg] The `this` binding of the created callback.
 * @param {number} [argCount] The number of arguments the callback accepts.
 * @returns {Function} Returns a callback function.
 * @example
 *
 * var characters = [
 *   { 'name': 'barney', 'age': 36 },
 *   { 'name': 'fred',   'age': 40 }
 * ];
 *
 * // wrap to create custom callback shorthands
 * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
 *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
 *   return !match ? func(callback, thisArg) : function(object) {
 *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
 *   };
 * });
 *
 * _.filter(characters, 'age__gt38');
 * // => [{ 'name': 'fred', 'age': 40 }]
 */
function createCallback(func, thisArg, argCount) {
  var type = typeof func;
  if (func == null || type == 'function') {
    return baseCreateCallback(func, thisArg, argCount);
  }
  // handle "_.pluck" style callback shorthands
  if (type != 'object') {
    return property(func);
  }
  var props = keys(func),
      key = props[0],
      a = func[key];

  // handle "_.where" style callback shorthands
  if (props.length == 1 && a === a && !isObject(a)) {
    // fast path the common case of providing an object with a single
    // property containing a primitive value
    return function(object) {
      var b = object[key];
      return a === b && (a !== 0 || (1 / a == 1 / b));
    };
  }
  return function(object) {
    var length = props.length,
        result = false;

    while (length--) {
      if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
        break;
      }
    }
    return result;
  };
}

module.exports = createCallback;

},{"lodash._basecreatecallback":35,"lodash._baseisequal":54,"lodash.isobject":63,"lodash.keys":65,"lodash.property":69}],35:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var bind = _dereq_('lodash.bind'),
    identity = _dereq_('lodash.identity'),
    setBindData = _dereq_('lodash._setbinddata'),
    support = _dereq_('lodash.support');

/** Used to detected named functions */
var reFuncName = /^\s*function[ \n\r\t]+\w/;

/** Used to detect functions containing a `this` reference */
var reThis = /\bthis\b/;

/** Native method shortcuts */
var fnToString = Function.prototype.toString;

/**
 * The base implementation of `_.createCallback` without support for creating
 * "_.pluck" or "_.where" style callbacks.
 *
 * @private
 * @param {*} [func=identity] The value to convert to a callback.
 * @param {*} [thisArg] The `this` binding of the created callback.
 * @param {number} [argCount] The number of arguments the callback accepts.
 * @returns {Function} Returns a callback function.
 */
function baseCreateCallback(func, thisArg, argCount) {
  if (typeof func != 'function') {
    return identity;
  }
  // exit early for no `thisArg` or already bound by `Function#bind`
  if (typeof thisArg == 'undefined' || !('prototype' in func)) {
    return func;
  }
  var bindData = func.__bindData__;
  if (typeof bindData == 'undefined') {
    if (support.funcNames) {
      bindData = !func.name;
    }
    bindData = bindData || !support.funcDecomp;
    if (!bindData) {
      var source = fnToString.call(func);
      if (!support.funcNames) {
        bindData = !reFuncName.test(source);
      }
      if (!bindData) {
        // checks if `func` references the `this` keyword and stores the result
        bindData = reThis.test(source);
        setBindData(func, bindData);
      }
    }
  }
  // exit early if there are no `this` references or `func` is bound
  if (bindData === false || (bindData !== true && bindData[1] & 1)) {
    return func;
  }
  switch (argCount) {
    case 1: return function(value) {
      return func.call(thisArg, value);
    };
    case 2: return function(a, b) {
      return func.call(thisArg, a, b);
    };
    case 3: return function(value, index, collection) {
      return func.call(thisArg, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(thisArg, accumulator, value, index, collection);
    };
  }
  return bind(func, thisArg);
}

module.exports = baseCreateCallback;

},{"lodash._setbinddata":36,"lodash.bind":39,"lodash.identity":51,"lodash.support":52}],36:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isNative = _dereq_('lodash._isnative'),
    noop = _dereq_('lodash.noop');

/** Used as the property descriptor for `__bindData__` */
var descriptor = {
  'configurable': false,
  'enumerable': false,
  'value': null,
  'writable': false
};

/** Used to set meta data on functions */
var defineProperty = (function() {
  // IE 8 only accepts DOM elements
  try {
    var o = {},
        func = isNative(func = Object.defineProperty) && func,
        result = func(o, o, o) && func;
  } catch(e) { }
  return result;
}());

/**
 * Sets `this` binding data on a given function.
 *
 * @private
 * @param {Function} func The function to set data on.
 * @param {Array} value The data array to set.
 */
var setBindData = !defineProperty ? noop : function(func, value) {
  descriptor.value = value;
  defineProperty(func, '__bindData__', descriptor);
};

module.exports = setBindData;

},{"lodash._isnative":37,"lodash.noop":38}],37:[function(_dereq_,module,exports){
module.exports=_dereq_(32)
},{}],38:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/**
 * A no-operation function.
 *
 * @static
 * @memberOf _
 * @category Utilities
 * @example
 *
 * var object = { 'name': 'fred' };
 * _.noop(object) === undefined;
 * // => true
 */
function noop() {
  // no operation performed
}

module.exports = noop;

},{}],39:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var createWrapper = _dereq_('lodash._createwrapper'),
    slice = _dereq_('lodash._slice');

/**
 * Creates a function that, when called, invokes `func` with the `this`
 * binding of `thisArg` and prepends any additional `bind` arguments to those
 * provided to the bound function.
 *
 * @static
 * @memberOf _
 * @category Functions
 * @param {Function} func The function to bind.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {...*} [arg] Arguments to be partially applied.
 * @returns {Function} Returns the new bound function.
 * @example
 *
 * var func = function(greeting) {
 *   return greeting + ' ' + this.name;
 * };
 *
 * func = _.bind(func, { 'name': 'fred' }, 'hi');
 * func();
 * // => 'hi fred'
 */
function bind(func, thisArg) {
  return arguments.length > 2
    ? createWrapper(func, 17, slice(arguments, 2), null, thisArg)
    : createWrapper(func, 1, null, null, thisArg);
}

module.exports = bind;

},{"lodash._createwrapper":40,"lodash._slice":50}],40:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseBind = _dereq_('lodash._basebind'),
    baseCreateWrapper = _dereq_('lodash._basecreatewrapper'),
    isFunction = _dereq_('lodash.isfunction'),
    slice = _dereq_('lodash._slice');

/**
 * Used for `Array` method references.
 *
 * Normally `Array.prototype` would suffice, however, using an array literal
 * avoids issues in Narwhal.
 */
var arrayRef = [];

/** Native method shortcuts */
var push = arrayRef.push,
    unshift = arrayRef.unshift;

/**
 * Creates a function that, when called, either curries or invokes `func`
 * with an optional `this` binding and partially applied arguments.
 *
 * @private
 * @param {Function|string} func The function or method name to reference.
 * @param {number} bitmask The bitmask of method flags to compose.
 *  The bitmask may be composed of the following flags:
 *  1 - `_.bind`
 *  2 - `_.bindKey`
 *  4 - `_.curry`
 *  8 - `_.curry` (bound)
 *  16 - `_.partial`
 *  32 - `_.partialRight`
 * @param {Array} [partialArgs] An array of arguments to prepend to those
 *  provided to the new function.
 * @param {Array} [partialRightArgs] An array of arguments to append to those
 *  provided to the new function.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {number} [arity] The arity of `func`.
 * @returns {Function} Returns the new function.
 */
function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
  var isBind = bitmask & 1,
      isBindKey = bitmask & 2,
      isCurry = bitmask & 4,
      isCurryBound = bitmask & 8,
      isPartial = bitmask & 16,
      isPartialRight = bitmask & 32;

  if (!isBindKey && !isFunction(func)) {
    throw new TypeError;
  }
  if (isPartial && !partialArgs.length) {
    bitmask &= ~16;
    isPartial = partialArgs = false;
  }
  if (isPartialRight && !partialRightArgs.length) {
    bitmask &= ~32;
    isPartialRight = partialRightArgs = false;
  }
  var bindData = func && func.__bindData__;
  if (bindData && bindData !== true) {
    // clone `bindData`
    bindData = slice(bindData);
    if (bindData[2]) {
      bindData[2] = slice(bindData[2]);
    }
    if (bindData[3]) {
      bindData[3] = slice(bindData[3]);
    }
    // set `thisBinding` is not previously bound
    if (isBind && !(bindData[1] & 1)) {
      bindData[4] = thisArg;
    }
    // set if previously bound but not currently (subsequent curried functions)
    if (!isBind && bindData[1] & 1) {
      bitmask |= 8;
    }
    // set curried arity if not yet set
    if (isCurry && !(bindData[1] & 4)) {
      bindData[5] = arity;
    }
    // append partial left arguments
    if (isPartial) {
      push.apply(bindData[2] || (bindData[2] = []), partialArgs);
    }
    // append partial right arguments
    if (isPartialRight) {
      unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
    }
    // merge flags
    bindData[1] |= bitmask;
    return createWrapper.apply(null, bindData);
  }
  // fast path for `_.bind`
  var creater = (bitmask == 1 || bitmask === 17) ? baseBind : baseCreateWrapper;
  return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);
}

module.exports = createWrapper;

},{"lodash._basebind":41,"lodash._basecreatewrapper":45,"lodash._slice":50,"lodash.isfunction":49}],41:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseCreate = _dereq_('lodash._basecreate'),
    isObject = _dereq_('lodash.isobject'),
    setBindData = _dereq_('lodash._setbinddata'),
    slice = _dereq_('lodash._slice');

/**
 * Used for `Array` method references.
 *
 * Normally `Array.prototype` would suffice, however, using an array literal
 * avoids issues in Narwhal.
 */
var arrayRef = [];

/** Native method shortcuts */
var push = arrayRef.push;

/**
 * The base implementation of `_.bind` that creates the bound function and
 * sets its meta data.
 *
 * @private
 * @param {Array} bindData The bind data array.
 * @returns {Function} Returns the new bound function.
 */
function baseBind(bindData) {
  var func = bindData[0],
      partialArgs = bindData[2],
      thisArg = bindData[4];

  function bound() {
    // `Function#bind` spec
    // http://es5.github.io/#x15.3.4.5
    if (partialArgs) {
      // avoid `arguments` object deoptimizations by using `slice` instead
      // of `Array.prototype.slice.call` and not assigning `arguments` to a
      // variable as a ternary expression
      var args = slice(partialArgs);
      push.apply(args, arguments);
    }
    // mimic the constructor's `return` behavior
    // http://es5.github.io/#x13.2.2
    if (this instanceof bound) {
      // ensure `new bound` is an instance of `func`
      var thisBinding = baseCreate(func.prototype),
          result = func.apply(thisBinding, args || arguments);
      return isObject(result) ? result : thisBinding;
    }
    return func.apply(thisArg, args || arguments);
  }
  setBindData(bound, bindData);
  return bound;
}

module.exports = baseBind;

},{"lodash._basecreate":42,"lodash._setbinddata":36,"lodash._slice":50,"lodash.isobject":63}],42:[function(_dereq_,module,exports){
(function (global){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isNative = _dereq_('lodash._isnative'),
    isObject = _dereq_('lodash.isobject'),
    noop = _dereq_('lodash.noop');

/* Native method shortcuts for methods with the same name as other `lodash` methods */
var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} prototype The object to inherit from.
 * @returns {Object} Returns the new object.
 */
function baseCreate(prototype, properties) {
  return isObject(prototype) ? nativeCreate(prototype) : {};
}
// fallback for browsers without `Object.create`
if (!nativeCreate) {
  baseCreate = (function() {
    function Object() {}
    return function(prototype) {
      if (isObject(prototype)) {
        Object.prototype = prototype;
        var result = new Object;
        Object.prototype = null;
      }
      return result || global.Object();
    };
  }());
}

module.exports = baseCreate;

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"lodash._isnative":43,"lodash.isobject":63,"lodash.noop":44}],43:[function(_dereq_,module,exports){
module.exports=_dereq_(32)
},{}],44:[function(_dereq_,module,exports){
module.exports=_dereq_(38)
},{}],45:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseCreate = _dereq_('lodash._basecreate'),
    isObject = _dereq_('lodash.isobject'),
    setBindData = _dereq_('lodash._setbinddata'),
    slice = _dereq_('lodash._slice');

/**
 * Used for `Array` method references.
 *
 * Normally `Array.prototype` would suffice, however, using an array literal
 * avoids issues in Narwhal.
 */
var arrayRef = [];

/** Native method shortcuts */
var push = arrayRef.push;

/**
 * The base implementation of `createWrapper` that creates the wrapper and
 * sets its meta data.
 *
 * @private
 * @param {Array} bindData The bind data array.
 * @returns {Function} Returns the new function.
 */
function baseCreateWrapper(bindData) {
  var func = bindData[0],
      bitmask = bindData[1],
      partialArgs = bindData[2],
      partialRightArgs = bindData[3],
      thisArg = bindData[4],
      arity = bindData[5];

  var isBind = bitmask & 1,
      isBindKey = bitmask & 2,
      isCurry = bitmask & 4,
      isCurryBound = bitmask & 8,
      key = func;

  function bound() {
    var thisBinding = isBind ? thisArg : this;
    if (partialArgs) {
      var args = slice(partialArgs);
      push.apply(args, arguments);
    }
    if (partialRightArgs || isCurry) {
      args || (args = slice(arguments));
      if (partialRightArgs) {
        push.apply(args, partialRightArgs);
      }
      if (isCurry && args.length < arity) {
        bitmask |= 16 & ~32;
        return baseCreateWrapper([func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity]);
      }
    }
    args || (args = arguments);
    if (isBindKey) {
      func = thisBinding[key];
    }
    if (this instanceof bound) {
      thisBinding = baseCreate(func.prototype);
      var result = func.apply(thisBinding, args);
      return isObject(result) ? result : thisBinding;
    }
    return func.apply(thisBinding, args);
  }
  setBindData(bound, bindData);
  return bound;
}

module.exports = baseCreateWrapper;

},{"lodash._basecreate":46,"lodash._setbinddata":36,"lodash._slice":50,"lodash.isobject":63}],46:[function(_dereq_,module,exports){
module.exports=_dereq_(42)
},{"lodash._isnative":47,"lodash.isobject":63,"lodash.noop":48}],47:[function(_dereq_,module,exports){
module.exports=_dereq_(32)
},{}],48:[function(_dereq_,module,exports){
module.exports=_dereq_(38)
},{}],49:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/**
 * Checks if `value` is a function.
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 */
function isFunction(value) {
  return typeof value == 'function';
}

module.exports = isFunction;

},{}],50:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/**
 * Slices the `collection` from the `start` index up to, but not including,
 * the `end` index.
 *
 * Note: This function is used instead of `Array#slice` to support node lists
 * in IE < 9 and to ensure dense arrays are returned.
 *
 * @private
 * @param {Array|Object|string} collection The collection to slice.
 * @param {number} start The start index.
 * @param {number} end The end index.
 * @returns {Array} Returns the new array.
 */
function slice(array, start, end) {
  start || (start = 0);
  if (typeof end == 'undefined') {
    end = array ? array.length : 0;
  }
  var index = -1,
      length = end - start || 0,
      result = Array(length < 0 ? 0 : length);

  while (++index < length) {
    result[index] = array[start + index];
  }
  return result;
}

module.exports = slice;

},{}],51:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utilities
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'name': 'fred' };
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;

},{}],52:[function(_dereq_,module,exports){
(function (global){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isNative = _dereq_('lodash._isnative');

/** Used to detect functions containing a `this` reference */
var reThis = /\bthis\b/;

/**
 * An object used to flag environments features.
 *
 * @static
 * @memberOf _
 * @type Object
 */
var support = {};

/**
 * Detect if functions can be decompiled by `Function#toString`
 * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
 *
 * @memberOf _.support
 * @type boolean
 */
support.funcDecomp = !isNative(global.WinRTError) && reThis.test(function() { return this; });

/**
 * Detect if `Function#name` is supported (all but IE).
 *
 * @memberOf _.support
 * @type boolean
 */
support.funcNames = typeof Function.name == 'string';

module.exports = support;

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"lodash._isnative":53}],53:[function(_dereq_,module,exports){
module.exports=_dereq_(32)
},{}],54:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var forIn = _dereq_('lodash.forin'),
    getArray = _dereq_('lodash._getarray'),
    isFunction = _dereq_('lodash.isfunction'),
    objectTypes = _dereq_('lodash._objecttypes'),
    releaseArray = _dereq_('lodash._releasearray');

/** `Object#toString` result shortcuts */
var argsClass = '[object Arguments]',
    arrayClass = '[object Array]',
    boolClass = '[object Boolean]',
    dateClass = '[object Date]',
    numberClass = '[object Number]',
    objectClass = '[object Object]',
    regexpClass = '[object RegExp]',
    stringClass = '[object String]';

/** Used for native method references */
var objectProto = Object.prototype;

/** Used to resolve the internal [[Class]] of values */
var toString = objectProto.toString;

/** Native method shortcuts */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.isEqual`, without support for `thisArg` binding,
 * that allows partial "_.where" style comparisons.
 *
 * @private
 * @param {*} a The value to compare.
 * @param {*} b The other value to compare.
 * @param {Function} [callback] The function to customize comparing values.
 * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
 * @param {Array} [stackA=[]] Tracks traversed `a` objects.
 * @param {Array} [stackB=[]] Tracks traversed `b` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
  // used to indicate that when comparing objects, `a` has at least the properties of `b`
  if (callback) {
    var result = callback(a, b);
    if (typeof result != 'undefined') {
      return !!result;
    }
  }
  // exit early for identical values
  if (a === b) {
    // treat `+0` vs. `-0` as not equal
    return a !== 0 || (1 / a == 1 / b);
  }
  var type = typeof a,
      otherType = typeof b;

  // exit early for unlike primitive values
  if (a === a &&
      !(a && objectTypes[type]) &&
      !(b && objectTypes[otherType])) {
    return false;
  }
  // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
  // http://es5.github.io/#x15.3.4.4
  if (a == null || b == null) {
    return a === b;
  }
  // compare [[Class]] names
  var className = toString.call(a),
      otherClass = toString.call(b);

  if (className == argsClass) {
    className = objectClass;
  }
  if (otherClass == argsClass) {
    otherClass = objectClass;
  }
  if (className != otherClass) {
    return false;
  }
  switch (className) {
    case boolClass:
    case dateClass:
      // coerce dates and booleans to numbers, dates to milliseconds and booleans
      // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
      return +a == +b;

    case numberClass:
      // treat `NaN` vs. `NaN` as equal
      return (a != +a)
        ? b != +b
        // but treat `+0` vs. `-0` as not equal
        : (a == 0 ? (1 / a == 1 / b) : a == +b);

    case regexpClass:
    case stringClass:
      // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
      // treat string primitives and their corresponding object instances as equal
      return a == String(b);
  }
  var isArr = className == arrayClass;
  if (!isArr) {
    // unwrap any `lodash` wrapped values
    var aWrapped = hasOwnProperty.call(a, '__wrapped__'),
        bWrapped = hasOwnProperty.call(b, '__wrapped__');

    if (aWrapped || bWrapped) {
      return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
    }
    // exit for functions and DOM nodes
    if (className != objectClass) {
      return false;
    }
    // in older versions of Opera, `arguments` objects have `Array` constructors
    var ctorA = a.constructor,
        ctorB = b.constructor;

    // non `Object` object instances with different constructors are not equal
    if (ctorA != ctorB &&
          !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) &&
          ('constructor' in a && 'constructor' in b)
        ) {
      return false;
    }
  }
  // assume cyclic structures are equal
  // the algorithm for detecting cyclic structures is adapted from ES 5.1
  // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
  var initedStack = !stackA;
  stackA || (stackA = getArray());
  stackB || (stackB = getArray());

  var length = stackA.length;
  while (length--) {
    if (stackA[length] == a) {
      return stackB[length] == b;
    }
  }
  var size = 0;
  result = true;

  // add `a` and `b` to the stack of traversed objects
  stackA.push(a);
  stackB.push(b);

  // recursively compare objects and arrays (susceptible to call stack limits)
  if (isArr) {
    // compare lengths to determine if a deep comparison is necessary
    length = a.length;
    size = b.length;
    result = size == length;

    if (result || isWhere) {
      // deep compare the contents, ignoring non-numeric properties
      while (size--) {
        var index = length,
            value = b[size];

        if (isWhere) {
          while (index--) {
            if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {
              break;
            }
          }
        } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
          break;
        }
      }
    }
  }
  else {
    // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
    // which, in this case, is more costly
    forIn(b, function(value, key, b) {
      if (hasOwnProperty.call(b, key)) {
        // count the number of properties.
        size++;
        // deep compare each property value.
        return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));
      }
    });

    if (result && !isWhere) {
      // ensure both objects have the same number of properties
      forIn(a, function(value, key, a) {
        if (hasOwnProperty.call(a, key)) {
          // `size` will be `-1` if `a` has more properties than `b`
          return (result = --size > -1);
        }
      });
    }
  }
  stackA.pop();
  stackB.pop();

  if (initedStack) {
    releaseArray(stackA);
    releaseArray(stackB);
  }
  return result;
}

module.exports = baseIsEqual;

},{"lodash._getarray":55,"lodash._objecttypes":57,"lodash._releasearray":58,"lodash.forin":61,"lodash.isfunction":62}],55:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var arrayPool = _dereq_('lodash._arraypool');

/**
 * Gets an array from the array pool or creates a new one if the pool is empty.
 *
 * @private
 * @returns {Array} The array from the pool.
 */
function getArray() {
  return arrayPool.pop() || [];
}

module.exports = getArray;

},{"lodash._arraypool":56}],56:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used to pool arrays and objects used internally */
var arrayPool = [];

module.exports = arrayPool;

},{}],57:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used to determine if values are of the language type Object */
var objectTypes = {
  'boolean': false,
  'function': true,
  'object': true,
  'number': false,
  'string': false,
  'undefined': false
};

module.exports = objectTypes;

},{}],58:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var arrayPool = _dereq_('lodash._arraypool'),
    maxPoolSize = _dereq_('lodash._maxpoolsize');

/**
 * Releases the given array back to the array pool.
 *
 * @private
 * @param {Array} [array] The array to release.
 */
function releaseArray(array) {
  array.length = 0;
  if (arrayPool.length < maxPoolSize) {
    arrayPool.push(array);
  }
}

module.exports = releaseArray;

},{"lodash._arraypool":59,"lodash._maxpoolsize":60}],59:[function(_dereq_,module,exports){
module.exports=_dereq_(56)
},{}],60:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used as the max size of the `arrayPool` and `objectPool` */
var maxPoolSize = 40;

module.exports = maxPoolSize;

},{}],61:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseCreateCallback = _dereq_('lodash._basecreatecallback'),
    objectTypes = _dereq_('lodash._objecttypes');

/**
 * Iterates over own and inherited enumerable properties of an object,
 * executing the callback for each property. The callback is bound to `thisArg`
 * and invoked with three arguments; (value, key, object). Callbacks may exit
 * iteration early by explicitly returning `false`.
 *
 * @static
 * @memberOf _
 * @type Function
 * @category Objects
 * @param {Object} object The object to iterate over.
 * @param {Function} [callback=identity] The function called per iteration.
 * @param {*} [thisArg] The `this` binding of `callback`.
 * @returns {Object} Returns `object`.
 * @example
 *
 * function Shape() {
 *   this.x = 0;
 *   this.y = 0;
 * }
 *
 * Shape.prototype.move = function(x, y) {
 *   this.x += x;
 *   this.y += y;
 * };
 *
 * _.forIn(new Shape, function(value, key) {
 *   console.log(key);
 * });
 * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)
 */
var forIn = function(collection, callback, thisArg) {
  var index, iterable = collection, result = iterable;
  if (!iterable) return result;
  if (!objectTypes[typeof iterable]) return result;
  callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
    for (index in iterable) {
      if (callback(iterable[index], index, collection) === false) return result;
    }
  return result
};

module.exports = forIn;

},{"lodash._basecreatecallback":35,"lodash._objecttypes":57}],62:[function(_dereq_,module,exports){
module.exports=_dereq_(49)
},{}],63:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var objectTypes = _dereq_('lodash._objecttypes');

/**
 * Checks if `value` is the language type of Object.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // check if the value is the ECMAScript language type of Object
  // http://es5.github.io/#x8
  // and avoid a V8 bug
  // http://code.google.com/p/v8/issues/detail?id=2291
  return !!(value && objectTypes[typeof value]);
}

module.exports = isObject;

},{"lodash._objecttypes":64}],64:[function(_dereq_,module,exports){
module.exports=_dereq_(57)
},{}],65:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isNative = _dereq_('lodash._isnative'),
    isObject = _dereq_('lodash.isobject'),
    shimKeys = _dereq_('lodash._shimkeys');

/* Native method shortcuts for methods with the same name as other `lodash` methods */
var nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys;

/**
 * Creates an array composed of the own enumerable property names of an object.
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns an array of property names.
 * @example
 *
 * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
 * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
 */
var keys = !nativeKeys ? shimKeys : function(object) {
  if (!isObject(object)) {
    return [];
  }
  return nativeKeys(object);
};

module.exports = keys;

},{"lodash._isnative":66,"lodash._shimkeys":67,"lodash.isobject":63}],66:[function(_dereq_,module,exports){
module.exports=_dereq_(32)
},{}],67:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var objectTypes = _dereq_('lodash._objecttypes');

/** Used for native method references */
var objectProto = Object.prototype;

/** Native method shortcuts */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A fallback implementation of `Object.keys` which produces an array of the
 * given object's own enumerable property names.
 *
 * @private
 * @type Function
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns an array of property names.
 */
var shimKeys = function(object) {
  var index, iterable = object, result = [];
  if (!iterable) return result;
  if (!(objectTypes[typeof object])) return result;
    for (index in iterable) {
      if (hasOwnProperty.call(iterable, index)) {
        result.push(index);
      }
    }
  return result
};

module.exports = shimKeys;

},{"lodash._objecttypes":68}],68:[function(_dereq_,module,exports){
module.exports=_dereq_(57)
},{}],69:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/**
 * Creates a "_.pluck" style function, which returns the `key` value of a
 * given object.
 *
 * @static
 * @memberOf _
 * @category Utilities
 * @param {string} key The name of the property to retrieve.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var characters = [
 *   { 'name': 'fred',   'age': 40 },
 *   { 'name': 'barney', 'age': 36 }
 * ];
 *
 * var getName = _.property('name');
 *
 * _.map(characters, getName);
 * // => ['barney', 'fred']
 *
 * _.sortBy(characters, getName);
 * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]
 */
function property(key) {
  return function(object) {
    return object[key];
  };
}

module.exports = property;

},{}],70:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseCreateCallback = _dereq_('lodash._basecreatecallback'),
    keys = _dereq_('lodash.keys'),
    objectTypes = _dereq_('lodash._objecttypes');

/**
 * Iterates over own enumerable properties of an object, executing the callback
 * for each property. The callback is bound to `thisArg` and invoked with three
 * arguments; (value, key, object). Callbacks may exit iteration early by
 * explicitly returning `false`.
 *
 * @static
 * @memberOf _
 * @type Function
 * @category Objects
 * @param {Object} object The object to iterate over.
 * @param {Function} [callback=identity] The function called per iteration.
 * @param {*} [thisArg] The `this` binding of `callback`.
 * @returns {Object} Returns `object`.
 * @example
 *
 * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
 *   console.log(key);
 * });
 * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
 */
var forOwn = function(collection, callback, thisArg) {
  var index, iterable = collection, result = iterable;
  if (!iterable) return result;
  if (!objectTypes[typeof iterable]) return result;
  callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
    var ownIndex = -1,
        ownProps = objectTypes[typeof iterable] && keys(iterable),
        length = ownProps ? ownProps.length : 0;

    while (++ownIndex < length) {
      index = ownProps[ownIndex];
      if (callback(iterable[index], index, collection) === false) return result;
    }
  return result
};

module.exports = forOwn;

},{"lodash._basecreatecallback":71,"lodash._objecttypes":92,"lodash.keys":93}],71:[function(_dereq_,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"lodash._setbinddata":72,"lodash.bind":75,"lodash.identity":89,"lodash.support":90}],72:[function(_dereq_,module,exports){
module.exports=_dereq_(36)
},{"lodash._isnative":73,"lodash.noop":74}],73:[function(_dereq_,module,exports){
module.exports=_dereq_(32)
},{}],74:[function(_dereq_,module,exports){
module.exports=_dereq_(38)
},{}],75:[function(_dereq_,module,exports){
arguments[4][39][0].apply(exports,arguments)
},{"lodash._createwrapper":76,"lodash._slice":88}],76:[function(_dereq_,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"lodash._basebind":77,"lodash._basecreatewrapper":82,"lodash._slice":88,"lodash.isfunction":87}],77:[function(_dereq_,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"lodash._basecreate":78,"lodash._setbinddata":72,"lodash._slice":88,"lodash.isobject":81}],78:[function(_dereq_,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"lodash._isnative":79,"lodash.isobject":81,"lodash.noop":80}],79:[function(_dereq_,module,exports){
module.exports=_dereq_(32)
},{}],80:[function(_dereq_,module,exports){
module.exports=_dereq_(38)
},{}],81:[function(_dereq_,module,exports){
module.exports=_dereq_(63)
},{"lodash._objecttypes":92}],82:[function(_dereq_,module,exports){
arguments[4][45][0].apply(exports,arguments)
},{"lodash._basecreate":83,"lodash._setbinddata":72,"lodash._slice":88,"lodash.isobject":86}],83:[function(_dereq_,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"lodash._isnative":84,"lodash.isobject":86,"lodash.noop":85}],84:[function(_dereq_,module,exports){
module.exports=_dereq_(32)
},{}],85:[function(_dereq_,module,exports){
module.exports=_dereq_(38)
},{}],86:[function(_dereq_,module,exports){
module.exports=_dereq_(63)
},{"lodash._objecttypes":92}],87:[function(_dereq_,module,exports){
module.exports=_dereq_(49)
},{}],88:[function(_dereq_,module,exports){
module.exports=_dereq_(50)
},{}],89:[function(_dereq_,module,exports){
module.exports=_dereq_(51)
},{}],90:[function(_dereq_,module,exports){
module.exports=_dereq_(52)
},{"lodash._isnative":91}],91:[function(_dereq_,module,exports){
module.exports=_dereq_(32)
},{}],92:[function(_dereq_,module,exports){
module.exports=_dereq_(57)
},{}],93:[function(_dereq_,module,exports){
arguments[4][65][0].apply(exports,arguments)
},{"lodash._isnative":94,"lodash._shimkeys":95,"lodash.isobject":96}],94:[function(_dereq_,module,exports){
module.exports=_dereq_(32)
},{}],95:[function(_dereq_,module,exports){
module.exports=_dereq_(67)
},{"lodash._objecttypes":92}],96:[function(_dereq_,module,exports){
module.exports=_dereq_(63)
},{"lodash._objecttypes":92}],97:[function(_dereq_,module,exports){

var is = _dereq_('is')
  , isodate = _dereq_('isodate')
  , milliseconds = _dereq_('./milliseconds')
  , seconds = _dereq_('./seconds');


/**
 * Returns a new Javascript Date object, allowing a variety of extra input types
 * over the native Date constructor.
 *
 * @param {Date|String|Number} val
 */

module.exports = function newDate (val) {
  if (is.number(val)) return new Date(toMs(val));
  if (is.date(val)) return new Date(val.getTime()); // firefox woulda floored

  // date strings
  if (isodate.is(val)) return isodate.parse(val);
  if (milliseconds.is(val)) return milliseconds.parse(val);
  if (seconds.is(val)) return seconds.parse(val);

  // fallback to Date.parse
  return new Date(val);
};


/**
 * If the number passed val is seconds from the epoch, turn it into milliseconds.
 * Milliseconds would be greater than 31557600000 (December 31, 1970).
 *
 * @param {Number} num
 */

function toMs (num) {
  if (num < 31557600000) return num * 1000;
  return num;
}
},{"./milliseconds":98,"./seconds":99,"is":100,"isodate":101}],98:[function(_dereq_,module,exports){

/**
 * Matcher.
 */

var matcher = /\d{13}/;


/**
 * Check whether a string is a millisecond date string.
 *
 * @param {String} string
 * @return {Boolean}
 */

exports.is = function (string) {
  return matcher.test(string);
};


/**
 * Convert a millisecond string to a date.
 *
 * @param {String} millis
 * @return {Date}
 */

exports.parse = function (millis) {
  millis = parseInt(millis, 10);
  return new Date(millis);
};
},{}],99:[function(_dereq_,module,exports){

/**
 * Matcher.
 */

var matcher = /\d{10}/;


/**
 * Check whether a string is a second date string.
 *
 * @param {String} string
 * @return {Boolean}
 */

exports.is = function (string) {
  return matcher.test(string);
};


/**
 * Convert a second string to a date.
 *
 * @param {String} seconds
 * @return {Date}
 */

exports.parse = function (seconds) {
  var millis = parseInt(seconds, 10) * 1000;
  return new Date(millis);
};
},{}],100:[function(_dereq_,module,exports){

/**!
 * is
 * the definitive JavaScript type testing library
 * 
 * @copyright 2013 Enrico Marino
 * @license MIT
 */

var objProto = Object.prototype;
var owns = objProto.hasOwnProperty;
var toString = objProto.toString;
var isActualNaN = function (value) {
  return value !== value;
};
var NON_HOST_TYPES = {
  "boolean": 1,
  "number": 1,
  "string": 1,
  "undefined": 1
};

/**
 * Expose `is`
 */

var is = module.exports = {};

/**
 * Test general.
 */

/**
 * is.type
 * Test if `value` is a type of `type`.
 *
 * @param {Mixed} value value to test
 * @param {String} type type
 * @return {Boolean} true if `value` is a type of `type`, false otherwise
 * @api public
 */

is.a =
is.type = function (value, type) {
  return typeof value === type;
};

/**
 * is.defined
 * Test if `value` is defined.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if 'value' is defined, false otherwise
 * @api public
 */

is.defined = function (value) {
  return value !== undefined;
};

/**
 * is.empty
 * Test if `value` is empty.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is empty, false otherwise
 * @api public
 */

is.empty = function (value) {
  var type = toString.call(value);
  var key;

  if ('[object Array]' === type || '[object Arguments]' === type) {
    return value.length === 0;
  }

  if ('[object Object]' === type) {
    for (key in value) if (owns.call(value, key)) return false;
    return true;
  }

  if ('[object String]' === type) {
    return '' === value;
  }

  return false;
};

/**
 * is.equal
 * Test if `value` is equal to `other`.
 *
 * @param {Mixed} value value to test
 * @param {Mixed} other value to compare with
 * @return {Boolean} true if `value` is equal to `other`, false otherwise
 */

is.equal = function (value, other) {
  var type = toString.call(value)
  var key;

  if (type !== toString.call(other)) {
    return false;
  }

  if ('[object Object]' === type) {
    for (key in value) {
      if (!is.equal(value[key], other[key])) {
        return false;
      }
    }
    return true;
  }

  if ('[object Array]' === type) {
    key = value.length;
    if (key !== other.length) {
      return false;
    }
    while (--key) {
      if (!is.equal(value[key], other[key])) {
        return false;
      }
    }
    return true;
  }

  if ('[object Function]' === type) {
    return value.prototype === other.prototype;
  }

  if ('[object Date]' === type) {
    return value.getTime() === other.getTime();
  }

  return value === other;
};

/**
 * is.hosted
 * Test if `value` is hosted by `host`.
 *
 * @param {Mixed} value to test
 * @param {Mixed} host host to test with
 * @return {Boolean} true if `value` is hosted by `host`, false otherwise
 * @api public
 */

is.hosted = function (value, host) {
  var type = typeof host[value];
  return type === 'object' ? !!host[value] : !NON_HOST_TYPES[type];
};

/**
 * is.instance
 * Test if `value` is an instance of `constructor`.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is an instance of `constructor`
 * @api public
 */

is.instance = is['instanceof'] = function (value, constructor) {
  return value instanceof constructor;
};

/**
 * is.null
 * Test if `value` is null.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is null, false otherwise
 * @api public
 */

is['null'] = function (value) {
  return value === null;
};

/**
 * is.undefined
 * Test if `value` is undefined.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is undefined, false otherwise
 * @api public
 */

is.undefined = function (value) {
  return value === undefined;
};

/**
 * Test arguments.
 */

/**
 * is.arguments
 * Test if `value` is an arguments object.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is an arguments object, false otherwise
 * @api public
 */

is.arguments = function (value) {
  var isStandardArguments = '[object Arguments]' === toString.call(value);
  var isOldArguments = !is.array(value) && is.arraylike(value) && is.object(value) && is.fn(value.callee);
  return isStandardArguments || isOldArguments;
};

/**
 * Test array.
 */

/**
 * is.array
 * Test if 'value' is an array.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is an array, false otherwise
 * @api public
 */

is.array = function (value) {
  return '[object Array]' === toString.call(value);
};

/**
 * is.arguments.empty
 * Test if `value` is an empty arguments object.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is an empty arguments object, false otherwise
 * @api public
 */
is.arguments.empty = function (value) {
  return is.arguments(value) && value.length === 0;
};

/**
 * is.array.empty
 * Test if `value` is an empty array.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is an empty array, false otherwise
 * @api public
 */
is.array.empty = function (value) {
  return is.array(value) && value.length === 0;
};

/**
 * is.arraylike
 * Test if `value` is an arraylike object.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is an arguments object, false otherwise
 * @api public
 */

is.arraylike = function (value) {
  return !!value && !is.boolean(value)
    && owns.call(value, 'length')
    && isFinite(value.length)
    && is.number(value.length)
    && value.length >= 0;
};

/**
 * Test boolean.
 */

/**
 * is.boolean
 * Test if `value` is a boolean.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is a boolean, false otherwise
 * @api public
 */

is.boolean = function (value) {
  return '[object Boolean]' === toString.call(value);
};

/**
 * is.false
 * Test if `value` is false.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is false, false otherwise
 * @api public
 */

is['false'] = function (value) {
  return is.boolean(value) && (value === false || value.valueOf() === false);
};

/**
 * is.true
 * Test if `value` is true.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is true, false otherwise
 * @api public
 */

is['true'] = function (value) {
  return is.boolean(value) && (value === true || value.valueOf() === true);
};

/**
 * Test date.
 */

/**
 * is.date
 * Test if `value` is a date.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is a date, false otherwise
 * @api public
 */

is.date = function (value) {
  return '[object Date]' === toString.call(value);
};

/**
 * Test element.
 */

/**
 * is.element
 * Test if `value` is an html element.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is an HTML Element, false otherwise
 * @api public
 */

is.element = function (value) {
  return value !== undefined
    && typeof HTMLElement !== 'undefined'
    && value instanceof HTMLElement
    && value.nodeType === 1;
};

/**
 * Test error.
 */

/**
 * is.error
 * Test if `value` is an error object.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is an error object, false otherwise
 * @api public
 */

is.error = function (value) {
  return '[object Error]' === toString.call(value);
};

/**
 * Test function.
 */

/**
 * is.fn / is.function (deprecated)
 * Test if `value` is a function.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is a function, false otherwise
 * @api public
 */

is.fn = is['function'] = function (value) {
  var isAlert = typeof window !== 'undefined' && value === window.alert;
  return isAlert || '[object Function]' === toString.call(value);
};

/**
 * Test number.
 */

/**
 * is.number
 * Test if `value` is a number.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is a number, false otherwise
 * @api public
 */

is.number = function (value) {
  return '[object Number]' === toString.call(value);
};

/**
 * is.infinite
 * Test if `value` is positive or negative infinity.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is positive or negative Infinity, false otherwise
 * @api public
 */
is.infinite = function (value) {
  return value === Infinity || value === -Infinity;
};

/**
 * is.decimal
 * Test if `value` is a decimal number.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is a decimal number, false otherwise
 * @api public
 */

is.decimal = function (value) {
  return is.number(value) && !isActualNaN(value) && value % 1 !== 0;
};

/**
 * is.divisibleBy
 * Test if `value` is divisible by `n`.
 *
 * @param {Number} value value to test
 * @param {Number} n dividend
 * @return {Boolean} true if `value` is divisible by `n`, false otherwise
 * @api public
 */

is.divisibleBy = function (value, n) {
  var isDividendInfinite = is.infinite(value);
  var isDivisorInfinite = is.infinite(n);
  var isNonZeroNumber = is.number(value) && !isActualNaN(value) && is.number(n) && !isActualNaN(n) && n !== 0;
  return isDividendInfinite || isDivisorInfinite || (isNonZeroNumber && value % n === 0);
};

/**
 * is.int
 * Test if `value` is an integer.
 *
 * @param value to test
 * @return {Boolean} true if `value` is an integer, false otherwise
 * @api public
 */

is.int = function (value) {
  return is.number(value) && !isActualNaN(value) && value % 1 === 0;
};

/**
 * is.maximum
 * Test if `value` is greater than 'others' values.
 *
 * @param {Number} value value to test
 * @param {Array} others values to compare with
 * @return {Boolean} true if `value` is greater than `others` values
 * @api public
 */

is.maximum = function (value, others) {
  if (isActualNaN(value)) {
    throw new TypeError('NaN is not a valid value');
  } else if (!is.arraylike(others)) {
    throw new TypeError('second argument must be array-like');
  }
  var len = others.length;

  while (--len >= 0) {
    if (value < others[len]) {
      return false;
    }
  }

  return true;
};

/**
 * is.minimum
 * Test if `value` is less than `others` values.
 *
 * @param {Number} value value to test
 * @param {Array} others values to compare with
 * @return {Boolean} true if `value` is less than `others` values
 * @api public
 */

is.minimum = function (value, others) {
  if (isActualNaN(value)) {
    throw new TypeError('NaN is not a valid value');
  } else if (!is.arraylike(others)) {
    throw new TypeError('second argument must be array-like');
  }
  var len = others.length;

  while (--len >= 0) {
    if (value > others[len]) {
      return false;
    }
  }

  return true;
};

/**
 * is.nan
 * Test if `value` is not a number.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is not a number, false otherwise
 * @api public
 */

is.nan = function (value) {
  return !is.number(value) || value !== value;
};

/**
 * is.even
 * Test if `value` is an even number.
 *
 * @param {Number} value value to test
 * @return {Boolean} true if `value` is an even number, false otherwise
 * @api public
 */

is.even = function (value) {
  return is.infinite(value) || (is.number(value) && value === value && value % 2 === 0);
};

/**
 * is.odd
 * Test if `value` is an odd number.
 *
 * @param {Number} value value to test
 * @return {Boolean} true if `value` is an odd number, false otherwise
 * @api public
 */

is.odd = function (value) {
  return is.infinite(value) || (is.number(value) && value === value && value % 2 !== 0);
};

/**
 * is.ge
 * Test if `value` is greater than or equal to `other`.
 *
 * @param {Number} value value to test
 * @param {Number} other value to compare with
 * @return {Boolean}
 * @api public
 */

is.ge = function (value, other) {
  if (isActualNaN(value) || isActualNaN(other)) {
    throw new TypeError('NaN is not a valid value');
  }
  return !is.infinite(value) && !is.infinite(other) && value >= other;
};

/**
 * is.gt
 * Test if `value` is greater than `other`.
 *
 * @param {Number} value value to test
 * @param {Number} other value to compare with
 * @return {Boolean}
 * @api public
 */

is.gt = function (value, other) {
  if (isActualNaN(value) || isActualNaN(other)) {
    throw new TypeError('NaN is not a valid value');
  }
  return !is.infinite(value) && !is.infinite(other) && value > other;
};

/**
 * is.le
 * Test if `value` is less than or equal to `other`.
 *
 * @param {Number} value value to test
 * @param {Number} other value to compare with
 * @return {Boolean} if 'value' is less than or equal to 'other'
 * @api public
 */

is.le = function (value, other) {
  if (isActualNaN(value) || isActualNaN(other)) {
    throw new TypeError('NaN is not a valid value');
  }
  return !is.infinite(value) && !is.infinite(other) && value <= other;
};

/**
 * is.lt
 * Test if `value` is less than `other`.
 *
 * @param {Number} value value to test
 * @param {Number} other value to compare with
 * @return {Boolean} if `value` is less than `other`
 * @api public
 */

is.lt = function (value, other) {
  if (isActualNaN(value) || isActualNaN(other)) {
    throw new TypeError('NaN is not a valid value');
  }
  return !is.infinite(value) && !is.infinite(other) && value < other;
};

/**
 * is.within
 * Test if `value` is within `start` and `finish`.
 *
 * @param {Number} value value to test
 * @param {Number} start lower bound
 * @param {Number} finish upper bound
 * @return {Boolean} true if 'value' is is within 'start' and 'finish'
 * @api public
 */
is.within = function (value, start, finish) {
  if (isActualNaN(value) || isActualNaN(start) || isActualNaN(finish)) {
    throw new TypeError('NaN is not a valid value');
  } else if (!is.number(value) || !is.number(start) || !is.number(finish)) {
    throw new TypeError('all arguments must be numbers');
  }
  var isAnyInfinite = is.infinite(value) || is.infinite(start) || is.infinite(finish);
  return isAnyInfinite || (value >= start && value <= finish);
};

/**
 * Test object.
 */

/**
 * is.object
 * Test if `value` is an object.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is an object, false otherwise
 * @api public
 */

is.object = function (value) {
  return value && '[object Object]' === toString.call(value);
};

/**
 * is.hash
 * Test if `value` is a hash - a plain object literal.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is a hash, false otherwise
 * @api public
 */

is.hash = function (value) {
  return is.object(value) && value.constructor === Object && !value.nodeType && !value.setInterval;
};

/**
 * Test regexp.
 */

/**
 * is.regexp
 * Test if `value` is a regular expression.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is a regexp, false otherwise
 * @api public
 */

is.regexp = function (value) {
  return '[object RegExp]' === toString.call(value);
};

/**
 * Test string.
 */

/**
 * is.string
 * Test if `value` is a string.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if 'value' is a string, false otherwise
 * @api public
 */

is.string = function (value) {
  return '[object String]' === toString.call(value);
};


},{}],101:[function(_dereq_,module,exports){

/**
 * Matcher, slightly modified from:
 *
 * https://github.com/csnover/js-iso8601/blob/lax/iso8601.js
 */

var matcher = /^(\d{4})(?:-?(\d{2})(?:-?(\d{2}))?)?(?:([ T])(\d{2}):?(\d{2})(?::?(\d{2})(?:[,\.](\d{1,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?)?)?$/;


/**
 * Convert an ISO date string to a date. Fallback to native `Date.parse`.
 *
 * https://github.com/csnover/js-iso8601/blob/lax/iso8601.js
 *
 * @param {String} iso
 * @return {Date}
 */

exports.parse = function (iso) {
  var numericKeys = [1, 5, 6, 7, 8, 11, 12];
  var arr = matcher.exec(iso);
  var offset = 0;

  // fallback to native parsing
  if (!arr) return new Date(iso);

  // remove undefined values
  for (var i = 0, val; val = numericKeys[i]; i++) {
    arr[val] = parseInt(arr[val], 10) || 0;
  }

  // allow undefined days and months
  arr[2] = parseInt(arr[2], 10) || 1;
  arr[3] = parseInt(arr[3], 10) || 1;

  // month is 0-11
  arr[2]--;

  // allow abitrary sub-second precision
  if (arr[8]) arr[8] = (arr[8] + '00').substring(0, 3);

  // apply timezone if one exists
  if (arr[4] == ' ') {
    offset = new Date().getTimezoneOffset();
  } else if (arr[9] !== 'Z' && arr[10]) {
    offset = arr[11] * 60 + arr[12];
    if ('+' == arr[10]) offset = 0 - offset;
  }

  var millis = Date.UTC(arr[1], arr[2], arr[3], arr[5], arr[6] + offset, arr[7], arr[8]);
  return new Date(millis);
};


/**
 * Checks whether a `string` is an ISO date string. `strict` mode requires that
 * the date string at least have a year, month and date.
 *
 * @param {String} string
 * @param {Boolean} strict
 * @return {Boolean}
 */

exports.is = function (string, strict) {
  if (strict && false === /^\d{4}-\d{2}-\d{2}/.test(string)) return false;
  return matcher.test(string);
};
},{}],102:[function(_dereq_,module,exports){
//
// strftime
// github.com/samsonjs/strftime
// @_sjs
//
// Copyright 2010 - 2013 Sami Samhuri <sami@samhuri.net>
//
// MIT License
// http://sjs.mit-license.org
//

;(function() {

  //// Where to export the API
  var namespace;

  // CommonJS / Node module
  if (typeof module !== 'undefined') {
    namespace = module.exports = strftime;
  }

  // Browsers and other environments
  else {
    // Get the global object. Works in ES3, ES5, and ES5 strict mode.
    namespace = (function(){ return this || (1,eval)('this') }());
  }

  function words(s) { return (s || '').split(' '); }

  var DefaultLocale =
  { days: words('Sunday Monday Tuesday Wednesday Thursday Friday Saturday')
  , shortDays: words('Sun Mon Tue Wed Thu Fri Sat')
  , months: words('January February March April May June July August September October November December')
  , shortMonths: words('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec')
  , AM: 'AM'
  , PM: 'PM'
  , am: 'am'
  , pm: 'pm'
  };

  namespace.strftime = strftime;
  function strftime(fmt, d, locale) {
    return _strftime(fmt, d, locale);
  }

  // locale is optional
  namespace.strftimeTZ = strftime.strftimeTZ = strftimeTZ;
  function strftimeTZ(fmt, d, locale, timezone) {
    if (typeof locale == 'number' && timezone == null) {
      timezone = locale;
      locale = undefined;
    }
    return _strftime(fmt, d, locale, { timezone: timezone });
  }

  namespace.strftimeUTC = strftime.strftimeUTC = strftimeUTC;
  function strftimeUTC(fmt, d, locale) {
    return _strftime(fmt, d, locale, { utc: true });
  }

  namespace.localizedStrftime = strftime.localizedStrftime = localizedStrftime;
  function localizedStrftime(locale) {
    return function(fmt, d, options) {
      return strftime(fmt, d, locale, options);
    };
  }

  // d, locale, and options are optional, but you can't leave
  // holes in the argument list. If you pass options you have to pass
  // in all the preceding args as well.
  //
  // options:
  //   - locale   [object] an object with the same structure as DefaultLocale
  //   - timezone [number] timezone offset in minutes from GMT
  function _strftime(fmt, d, locale, options) {
    options = options || {};

    // d and locale are optional so check if d is really the locale
    if (d && !quacksLikeDate(d)) {
      locale = d;
      d = undefined;
    }
    d = d || new Date();

    locale = locale || DefaultLocale;
    locale.formats = locale.formats || {};

    // Hang on to this Unix timestamp because we might mess with it directly below.
    var timestamp = d.getTime();

    if (options.utc || typeof options.timezone == 'number') {
      d = dateToUTC(d);
    }

    if (typeof options.timezone == 'number') {
      d = new Date(d.getTime() + (options.timezone * 60000));
    }

    // Most of the specifiers supported by C's strftime, and some from Ruby.
    // Some other syntax extensions from Ruby are supported: %-, %_, and %0
    // to pad with nothing, space, or zero (respectively).
    return fmt.replace(/%([-_0]?.)/g, function(_, c) {
      var mod, padding;
      if (c.length == 2) {
        mod = c[0];
        // omit padding
        if (mod == '-') {
          padding = '';
        }
        // pad with space
        else if (mod == '_') {
          padding = ' ';
        }
        // pad with zero
        else if (mod == '0') {
          padding = '0';
        }
        else {
          // unrecognized, return the format
          return _;
        }
        c = c[1];
      }
      switch (c) {
        case 'A': return locale.days[d.getDay()];
        case 'a': return locale.shortDays[d.getDay()];
        case 'B': return locale.months[d.getMonth()];
        case 'b': return locale.shortMonths[d.getMonth()];
        case 'C': return pad(Math.floor(d.getFullYear() / 100), padding);
        case 'D': return _strftime(locale.formats.D || '%m/%d/%y', d, locale);
        case 'd': return pad(d.getDate(), padding);
        case 'e': return d.getDate();
        case 'F': return _strftime(locale.formats.F || '%Y-%m-%d', d, locale);
        case 'H': return pad(d.getHours(), padding);
        case 'h': return locale.shortMonths[d.getMonth()];
        case 'I': return pad(hours12(d), padding);
        case 'j':
          var y = new Date(d.getFullYear(), 0, 1);
          var day = Math.ceil((d.getTime() - y.getTime()) / (1000 * 60 * 60 * 24));
          return pad(day, 3);
        case 'k': return pad(d.getHours(), padding == null ? ' ' : padding);
        case 'L': return pad(Math.floor(timestamp % 1000), 3);
        case 'l': return pad(hours12(d), padding == null ? ' ' : padding);
        case 'M': return pad(d.getMinutes(), padding);
        case 'm': return pad(d.getMonth() + 1, padding);
        case 'n': return '\n';
        case 'o': return String(d.getDate()) + ordinal(d.getDate());
        case 'P': return d.getHours() < 12 ? locale.am : locale.pm;
        case 'p': return d.getHours() < 12 ? locale.AM : locale.PM;
        case 'R': return _strftime(locale.formats.R || '%H:%M', d, locale);
        case 'r': return _strftime(locale.formats.r || '%I:%M:%S %p', d, locale);
        case 'S': return pad(d.getSeconds(), padding);
        case 's': return Math.floor(timestamp / 1000);
        case 'T': return _strftime(locale.formats.T || '%H:%M:%S', d, locale);
        case 't': return '\t';
        case 'U': return pad(weekNumber(d, 'sunday'), padding);
        case 'u':
          var day = d.getDay();
          return day == 0 ? 7 : day; // 1 - 7, Monday is first day of the week
        case 'v': return _strftime(locale.formats.v || '%e-%b-%Y', d, locale);
        case 'W': return pad(weekNumber(d, 'monday'), padding);
        case 'w': return d.getDay(); // 0 - 6, Sunday is first day of the week
        case 'Y': return d.getFullYear();
        case 'y':
          var y = String(d.getFullYear());
          return y.slice(y.length - 2);
        case 'Z':
          if (options.utc) {
            return "GMT";
          }
          else {
            var tz = d.toString().match(/\((\w+)\)/);
            return tz && tz[1] || '';
          }
        case 'z':
          if (options.utc) {
            return "+0000";
          }
          else {
            var off = typeof options.timezone == 'number' ? options.timezone : -d.getTimezoneOffset();
            return (off < 0 ? '-' : '+') + pad(Math.abs(off / 60)) + pad(off % 60);
          }
        default: return c;
      }
    });
  }

  function dateToUTC(d) {
    var msDelta = (d.getTimezoneOffset() || 0) * 60000;
    return new Date(d.getTime() + msDelta);
  }

  var RequiredDateMethods = ['getTime', 'getTimezoneOffset', 'getDay', 'getDate', 'getMonth', 'getFullYear', 'getYear', 'getHours', 'getMinutes', 'getSeconds'];
  function quacksLikeDate(x) {
    var i = 0
      , n = RequiredDateMethods.length
      ;
    for (i = 0; i < n; ++i) {
      if (typeof x[RequiredDateMethods[i]] != 'function') {
        return false;
      }
    }
    return true;
  }

  // Default padding is '0' and default length is 2, both are optional.
  function pad(n, padding, length) {
    // pad(n, <length>)
    if (typeof padding === 'number') {
      length = padding;
      padding = '0';
    }

    // Defaults handle pad(n) and pad(n, <padding>)
    if (padding == null) {
      padding = '0';
    }
    length = length || 2;

    var s = String(n);
    // padding may be an empty string, don't loop forever if it is
    if (padding) {
      while (s.length < length) s = padding + s;
    }
    return s;
  }

  function hours12(d) {
    var hour = d.getHours();
    if (hour == 0) hour = 12;
    else if (hour > 12) hour -= 12;
    return hour;
  }

  // Get the ordinal suffix for a number: st, nd, rd, or th
  function ordinal(n) {
    var i = n % 10
      , ii = n % 100
      ;
    if ((ii >= 11 && ii <= 13) || i === 0 || i >= 4) {
      return 'th';
    }
    switch (i) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
    }
  }

  // firstWeekday: 'sunday' or 'monday', default is 'sunday'
  //
  // Pilfered & ported from Ruby's strftime implementation.
  function weekNumber(d, firstWeekday) {
    firstWeekday = firstWeekday || 'sunday';

    // This works by shifting the weekday back by one day if we
    // are treating Monday as the first day of the week.
    var wday = d.getDay();
    if (firstWeekday == 'monday') {
      if (wday == 0) // Sunday
        wday = 6;
      else
        wday--;
    }
    var firstDayOfYear = new Date(d.getFullYear(), 0, 1)
      , yday = (d - firstDayOfYear) / 86400000
      , weekNum = (yday + 7 - wday) / 7
      ;
    return Math.floor(weekNum);
  }

}());

},{}],103:[function(_dereq_,module,exports){
"use strict";
/*globals Handlebars: true */
var base = _dereq_("./handlebars/base");

// Each of these augment the Handlebars object. No need to setup here.
// (This is done to easily share code between commonjs and browse envs)
var SafeString = _dereq_("./handlebars/safe-string")["default"];
var Exception = _dereq_("./handlebars/exception")["default"];
var Utils = _dereq_("./handlebars/utils");
var runtime = _dereq_("./handlebars/runtime");

// For compatibility and usage outside of module systems, make the Handlebars object a namespace
var create = function() {
  var hb = new base.HandlebarsEnvironment();

  Utils.extend(hb, base);
  hb.SafeString = SafeString;
  hb.Exception = Exception;
  hb.Utils = Utils;

  hb.VM = runtime;
  hb.template = function(spec) {
    return runtime.template(spec, hb);
  };

  return hb;
};

var Handlebars = create();
Handlebars.create = create;

exports["default"] = Handlebars;
},{"./handlebars/base":104,"./handlebars/exception":105,"./handlebars/runtime":106,"./handlebars/safe-string":107,"./handlebars/utils":108}],104:[function(_dereq_,module,exports){
"use strict";
var Utils = _dereq_("./utils");
var Exception = _dereq_("./exception")["default"];

var VERSION = "1.3.0";
exports.VERSION = VERSION;var COMPILER_REVISION = 4;
exports.COMPILER_REVISION = COMPILER_REVISION;
var REVISION_CHANGES = {
  1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
  2: '== 1.0.0-rc.3',
  3: '== 1.0.0-rc.4',
  4: '>= 1.0.0'
};
exports.REVISION_CHANGES = REVISION_CHANGES;
var isArray = Utils.isArray,
    isFunction = Utils.isFunction,
    toString = Utils.toString,
    objectType = '[object Object]';

function HandlebarsEnvironment(helpers, partials) {
  this.helpers = helpers || {};
  this.partials = partials || {};

  registerDefaultHelpers(this);
}

exports.HandlebarsEnvironment = HandlebarsEnvironment;HandlebarsEnvironment.prototype = {
  constructor: HandlebarsEnvironment,

  logger: logger,
  log: log,

  registerHelper: function(name, fn, inverse) {
    if (toString.call(name) === objectType) {
      if (inverse || fn) { throw new Exception('Arg not supported with multiple helpers'); }
      Utils.extend(this.helpers, name);
    } else {
      if (inverse) { fn.not = inverse; }
      this.helpers[name] = fn;
    }
  },

  registerPartial: function(name, str) {
    if (toString.call(name) === objectType) {
      Utils.extend(this.partials,  name);
    } else {
      this.partials[name] = str;
    }
  }
};

function registerDefaultHelpers(instance) {
  instance.registerHelper('helperMissing', function(arg) {
    if(arguments.length === 2) {
      return undefined;
    } else {
      throw new Exception("Missing helper: '" + arg + "'");
    }
  });

  instance.registerHelper('blockHelperMissing', function(context, options) {
    var inverse = options.inverse || function() {}, fn = options.fn;

    if (isFunction(context)) { context = context.call(this); }

    if(context === true) {
      return fn(this);
    } else if(context === false || context == null) {
      return inverse(this);
    } else if (isArray(context)) {
      if(context.length > 0) {
        return instance.helpers.each(context, options);
      } else {
        return inverse(this);
      }
    } else {
      return fn(context);
    }
  });

  instance.registerHelper('each', function(context, options) {
    var fn = options.fn, inverse = options.inverse;
    var i = 0, ret = "", data;

    if (isFunction(context)) { context = context.call(this); }

    if (options.data) {
      data = createFrame(options.data);
    }

    if(context && typeof context === 'object') {
      if (isArray(context)) {
        for(var j = context.length; i<j; i++) {
          if (data) {
            data.index = i;
            data.first = (i === 0);
            data.last  = (i === (context.length-1));
          }
          ret = ret + fn(context[i], { data: data });
        }
      } else {
        for(var key in context) {
          if(context.hasOwnProperty(key)) {
            if(data) { 
              data.key = key; 
              data.index = i;
              data.first = (i === 0);
            }
            ret = ret + fn(context[key], {data: data});
            i++;
          }
        }
      }
    }

    if(i === 0){
      ret = inverse(this);
    }

    return ret;
  });

  instance.registerHelper('if', function(conditional, options) {
    if (isFunction(conditional)) { conditional = conditional.call(this); }

    // Default behavior is to render the positive path if the value is truthy and not empty.
    // The `includeZero` option may be set to treat the condtional as purely not empty based on the
    // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
    if ((!options.hash.includeZero && !conditional) || Utils.isEmpty(conditional)) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  });

  instance.registerHelper('unless', function(conditional, options) {
    return instance.helpers['if'].call(this, conditional, {fn: options.inverse, inverse: options.fn, hash: options.hash});
  });

  instance.registerHelper('with', function(context, options) {
    if (isFunction(context)) { context = context.call(this); }

    if (!Utils.isEmpty(context)) return options.fn(context);
  });

  instance.registerHelper('log', function(context, options) {
    var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
    instance.log(level, context);
  });
}

var logger = {
  methodMap: { 0: 'debug', 1: 'info', 2: 'warn', 3: 'error' },

  // State enum
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  level: 3,

  // can be overridden in the host environment
  log: function(level, obj) {
    if (logger.level <= level) {
      var method = logger.methodMap[level];
      if (typeof console !== 'undefined' && console[method]) {
        console[method].call(console, obj);
      }
    }
  }
};
exports.logger = logger;
function log(level, obj) { logger.log(level, obj); }

exports.log = log;var createFrame = function(object) {
  var obj = {};
  Utils.extend(obj, object);
  return obj;
};
exports.createFrame = createFrame;
},{"./exception":105,"./utils":108}],105:[function(_dereq_,module,exports){
"use strict";

var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

function Exception(message, node) {
  var line;
  if (node && node.firstLine) {
    line = node.firstLine;

    message += ' - ' + line + ':' + node.firstColumn;
  }

  var tmp = Error.prototype.constructor.call(this, message);

  // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
  for (var idx = 0; idx < errorProps.length; idx++) {
    this[errorProps[idx]] = tmp[errorProps[idx]];
  }

  if (line) {
    this.lineNumber = line;
    this.column = node.firstColumn;
  }
}

Exception.prototype = new Error();

exports["default"] = Exception;
},{}],106:[function(_dereq_,module,exports){
"use strict";
var Utils = _dereq_("./utils");
var Exception = _dereq_("./exception")["default"];
var COMPILER_REVISION = _dereq_("./base").COMPILER_REVISION;
var REVISION_CHANGES = _dereq_("./base").REVISION_CHANGES;

function checkRevision(compilerInfo) {
  var compilerRevision = compilerInfo && compilerInfo[0] || 1,
      currentRevision = COMPILER_REVISION;

  if (compilerRevision !== currentRevision) {
    if (compilerRevision < currentRevision) {
      var runtimeVersions = REVISION_CHANGES[currentRevision],
          compilerVersions = REVISION_CHANGES[compilerRevision];
      throw new Exception("Template was precompiled with an older version of Handlebars than the current runtime. "+
            "Please update your precompiler to a newer version ("+runtimeVersions+") or downgrade your runtime to an older version ("+compilerVersions+").");
    } else {
      // Use the embedded version info since the runtime doesn't know about this revision yet
      throw new Exception("Template was precompiled with a newer version of Handlebars than the current runtime. "+
            "Please update your runtime to a newer version ("+compilerInfo[1]+").");
    }
  }
}

exports.checkRevision = checkRevision;// TODO: Remove this line and break up compilePartial

function template(templateSpec, env) {
  if (!env) {
    throw new Exception("No environment passed to template");
  }

  // Note: Using env.VM references rather than local var references throughout this section to allow
  // for external users to override these as psuedo-supported APIs.
  var invokePartialWrapper = function(partial, name, context, helpers, partials, data) {
    var result = env.VM.invokePartial.apply(this, arguments);
    if (result != null) { return result; }

    if (env.compile) {
      var options = { helpers: helpers, partials: partials, data: data };
      partials[name] = env.compile(partial, { data: data !== undefined }, env);
      return partials[name](context, options);
    } else {
      throw new Exception("The partial " + name + " could not be compiled when running in runtime-only mode");
    }
  };

  // Just add water
  var container = {
    escapeExpression: Utils.escapeExpression,
    invokePartial: invokePartialWrapper,
    programs: [],
    program: function(i, fn, data) {
      var programWrapper = this.programs[i];
      if(data) {
        programWrapper = program(i, fn, data);
      } else if (!programWrapper) {
        programWrapper = this.programs[i] = program(i, fn);
      }
      return programWrapper;
    },
    merge: function(param, common) {
      var ret = param || common;

      if (param && common && (param !== common)) {
        ret = {};
        Utils.extend(ret, common);
        Utils.extend(ret, param);
      }
      return ret;
    },
    programWithDepth: env.VM.programWithDepth,
    noop: env.VM.noop,
    compilerInfo: null
  };

  return function(context, options) {
    options = options || {};
    var namespace = options.partial ? options : env,
        helpers,
        partials;

    if (!options.partial) {
      helpers = options.helpers;
      partials = options.partials;
    }
    var result = templateSpec.call(
          container,
          namespace, context,
          helpers,
          partials,
          options.data);

    if (!options.partial) {
      env.VM.checkRevision(container.compilerInfo);
    }

    return result;
  };
}

exports.template = template;function programWithDepth(i, fn, data /*, $depth */) {
  var args = Array.prototype.slice.call(arguments, 3);

  var prog = function(context, options) {
    options = options || {};

    return fn.apply(this, [context, options.data || data].concat(args));
  };
  prog.program = i;
  prog.depth = args.length;
  return prog;
}

exports.programWithDepth = programWithDepth;function program(i, fn, data) {
  var prog = function(context, options) {
    options = options || {};

    return fn(context, options.data || data);
  };
  prog.program = i;
  prog.depth = 0;
  return prog;
}

exports.program = program;function invokePartial(partial, name, context, helpers, partials, data) {
  var options = { partial: true, helpers: helpers, partials: partials, data: data };

  if(partial === undefined) {
    throw new Exception("The partial " + name + " could not be found");
  } else if(partial instanceof Function) {
    return partial(context, options);
  }
}

exports.invokePartial = invokePartial;function noop() { return ""; }

exports.noop = noop;
},{"./base":104,"./exception":105,"./utils":108}],107:[function(_dereq_,module,exports){
"use strict";
// Build out our basic SafeString type
function SafeString(string) {
  this.string = string;
}

SafeString.prototype.toString = function() {
  return "" + this.string;
};

exports["default"] = SafeString;
},{}],108:[function(_dereq_,module,exports){
"use strict";
/*jshint -W004 */
var SafeString = _dereq_("./safe-string")["default"];

var escape = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "`": "&#x60;"
};

var badChars = /[&<>"'`]/g;
var possible = /[&<>"'`]/;

function escapeChar(chr) {
  return escape[chr] || "&amp;";
}

function extend(obj, value) {
  for(var key in value) {
    if(Object.prototype.hasOwnProperty.call(value, key)) {
      obj[key] = value[key];
    }
  }
}

exports.extend = extend;var toString = Object.prototype.toString;
exports.toString = toString;
// Sourced from lodash
// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
var isFunction = function(value) {
  return typeof value === 'function';
};
// fallback for older versions of Chrome and Safari
if (isFunction(/x/)) {
  isFunction = function(value) {
    return typeof value === 'function' && toString.call(value) === '[object Function]';
  };
}
var isFunction;
exports.isFunction = isFunction;
var isArray = Array.isArray || function(value) {
  return (value && typeof value === 'object') ? toString.call(value) === '[object Array]' : false;
};
exports.isArray = isArray;

function escapeExpression(string) {
  // don't escape SafeStrings, since they're already safe
  if (string instanceof SafeString) {
    return string.toString();
  } else if (!string && string !== 0) {
    return "";
  }

  // Force a string conversion as this will be done by the append regardless and
  // the regex test will do this transparently behind the scenes, causing issues if
  // an object's to string has escaped characters in it.
  string = "" + string;

  if(!possible.test(string)) { return string; }
  return string.replace(badChars, escapeChar);
}

exports.escapeExpression = escapeExpression;function isEmpty(value) {
  if (!value && value !== 0) {
    return true;
  } else if (isArray(value) && value.length === 0) {
    return true;
  } else {
    return false;
  }
}

exports.isEmpty = isEmpty;
},{"./safe-string":107}],109:[function(_dereq_,module,exports){
// Create a simple path alias to allow browserify to resolve
// the runtime on a supported path.
module.exports = _dereq_('./dist/cjs/handlebars.runtime');

},{"./dist/cjs/handlebars.runtime":103}],110:[function(_dereq_,module,exports){
module.exports = _dereq_("handlebars/runtime")["default"];

},{"handlebars/runtime":109}],111:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],112:[function(_dereq_,module,exports){
/**
 * Module dependencies
 */

var debug = _dereq_('debug')('jsonp');

/**
 * Module exports.
 */

module.exports = jsonp;

/**
 * Callback index.
 */

var count = 0;

/**
 * Noop function.
 */

function noop(){}

/**
 * JSONP handler
 *
 * Options:
 *  - param {String} qs parameter (`callback`)
 *  - timeout {Number} how long after a timeout error is emitted (`60000`)
 *
 * @param {String} url
 * @param {Object|Function} optional options / callback
 * @param {Function} optional callback
 */

function jsonp(url, opts, fn){
  if ('function' == typeof opts) {
    fn = opts;
    opts = {};
  }
  if (!opts) opts = {};

  var prefix = opts.prefix || '__jp';
  var param = opts.param || 'callback';
  var timeout = null != opts.timeout ? opts.timeout : 60000;
  var enc = encodeURIComponent;
  var target = document.getElementsByTagName('script')[0] || document.head;
  var script;
  var timer;

  // generate a unique id for this request
  var id = prefix + (count++);

  if (timeout) {
    timer = setTimeout(function(){
      cleanup();
      if (fn) fn(new Error('Timeout'));
    }, timeout);
  }

  function cleanup(){
    script.parentNode.removeChild(script);
    window[id] = noop;
  }

  window[id] = function(data){
    debug('jsonp got', data);
    if (timer) clearTimeout(timer);
    cleanup();
    if (fn) fn(null, data);
  };

  // add qs component
  url += (~url.indexOf('?') ? '&' : '?') + param + '=' + enc(id);
  url = url.replace('?&', '?');

  debug('jsonp req "%s"', url);

  // create script
  script = document.createElement('script');
  script.src = url;
  target.parentNode.insertBefore(script, target);
}

},{"debug":113}],113:[function(_dereq_,module,exports){

/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  try {
    localStorage.debug = name;
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

// persist

try {
  if (window.localStorage) debug.enable(localStorage.debug);
} catch(e){}

},{}],114:[function(_dereq_,module,exports){
/*!
 * Sizzle CSS Selector Engine
 *  Copyright 2011, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
	expando = "sizcache" + (Math.random() + '').replace('.', ''),
	done = 0,
	toString = Object.prototype.toString,
	hasDuplicate = false,
	baseHasDuplicate = true,
	rBackslash = /\\/g,
	rReturn = /\r\n/g,
	rNonWord = /\W/;

// Here we check if the JavaScript engine is using some sort of
// optimization where it does not always call our comparision
// function. If that is the case, discard the hasDuplicate value.
//   Thus far that includes Google Chrome.
[0, 0].sort(function() {
	baseHasDuplicate = false;
	return 0;
});

var Sizzle = function( selector, context, results, seed ) {
	results = results || [];
	context = context || document;

	var origContext = context;

	if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
		return [];
	}

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	var m, set, checkSet, extra, ret, cur, pop, i,
		prune = true,
		contextXML = Sizzle.isXML( context ),
		parts = [],
		soFar = selector;

	// Reset the position of the chunker regexp (start from head)
	do {
		chunker.exec( "" );
		m = chunker.exec( soFar );

		if ( m ) {
			soFar = m[3];

			parts.push( m[1] );

			if ( m[2] ) {
				extra = m[3];
				break;
			}
		}
	} while ( m );

	if ( parts.length > 1 && origPOS.exec( selector ) ) {

		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
			set = posProcess( parts[0] + parts[1], context, seed );

		} else {
			set = Expr.relative[ parts[0] ] ?
				[ context ] :
				Sizzle( parts.shift(), context );

			while ( parts.length ) {
				selector = parts.shift();

				if ( Expr.relative[ selector ] ) {
					selector += parts.shift();
				}

				set = posProcess( selector, set, seed );
			}
		}

	} else {
		// Take a shortcut and set the context if the root selector is an ID
		// (but not if it'll be faster if the inner selector is an ID)
		if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {

			ret = Sizzle.find( parts.shift(), context, contextXML );
			context = ret.expr ?
				Sizzle.filter( ret.expr, ret.set )[0] :
				ret.set[0];
		}

		if ( context ) {
			ret = seed ?
				{ expr: parts.pop(), set: makeArray(seed) } :
				Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );

			set = ret.expr ?
				Sizzle.filter( ret.expr, ret.set ) :
				ret.set;

			if ( parts.length > 0 ) {
				checkSet = makeArray( set );

			} else {
				prune = false;
			}

			while ( parts.length ) {
				cur = parts.pop();
				pop = cur;

				if ( !Expr.relative[ cur ] ) {
					cur = "";
				} else {
					pop = parts.pop();
				}

				if ( pop == null ) {
					pop = context;
				}

				Expr.relative[ cur ]( checkSet, pop, contextXML );
			}

		} else {
			checkSet = parts = [];
		}
	}

	if ( !checkSet ) {
		checkSet = set;
	}

	if ( !checkSet ) {
		Sizzle.error( cur || selector );
	}

	if ( toString.call(checkSet) === "[object Array]" ) {
		if ( !prune ) {
			results.push.apply( results, checkSet );

		} else if ( context && context.nodeType === 1 ) {
			for ( i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && Sizzle.contains(context, checkSet[i])) ) {
					results.push( set[i] );
				}
			}

		} else {
			for ( i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
					results.push( set[i] );
				}
			}
		}

	} else {
		makeArray( checkSet, results );
	}

	if ( extra ) {
		Sizzle( extra, origContext, results, seed );
		Sizzle.uniqueSort( results );
	}

	return results;
};

Sizzle.uniqueSort = function( results ) {
	if ( sortOrder ) {
		hasDuplicate = baseHasDuplicate;
		results.sort( sortOrder );

		if ( hasDuplicate ) {
			for ( var i = 1; i < results.length; i++ ) {
				if ( results[i] === results[ i - 1 ] ) {
					results.splice( i--, 1 );
				}
			}
		}
	}

	return results;
};

Sizzle.matches = function( expr, set ) {
	return Sizzle( expr, null, null, set );
};

Sizzle.matchesSelector = function( node, expr ) {
	return Sizzle( expr, null, null, [node] ).length > 0;
};

Sizzle.find = function( expr, context, isXML ) {
	var set, i, len, match, type, left;

	if ( !expr ) {
		return [];
	}

	for ( i = 0, len = Expr.order.length; i < len; i++ ) {
		type = Expr.order[i];

		if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
			left = match[1];
			match.splice( 1, 1 );

			if ( left.substr( left.length - 1 ) !== "\\" ) {
				match[1] = (match[1] || "").replace( rBackslash, "" );
				set = Expr.find[ type ]( match, context, isXML );

				if ( set != null ) {
					expr = expr.replace( Expr.match[ type ], "" );
					break;
				}
			}
		}
	}

	if ( !set ) {
		set = typeof context.getElementsByTagName !== "undefined" ?
			context.getElementsByTagName( "*" ) :
			[];
	}

	return { set: set, expr: expr };
};

Sizzle.filter = function( expr, set, inplace, not ) {
	var match, anyFound,
		type, found, item, filter, left,
		i, pass,
		old = expr,
		result = [],
		curLoop = set,
		isXMLFilter = set && set[0] && Sizzle.isXML( set[0] );

	while ( expr && set.length ) {
		for ( type in Expr.filter ) {
			if ( (match = Expr.leftMatch[ type ].exec( expr )) != null && match[2] ) {
				filter = Expr.filter[ type ];
				left = match[1];

				anyFound = false;

				match.splice(1,1);

				if ( left.substr( left.length - 1 ) === "\\" ) {
					continue;
				}

				if ( curLoop === result ) {
					result = [];
				}

				if ( Expr.preFilter[ type ] ) {
					match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

					if ( !match ) {
						anyFound = found = true;

					} else if ( match === true ) {
						continue;
					}
				}

				if ( match ) {
					for ( i = 0; (item = curLoop[i]) != null; i++ ) {
						if ( item ) {
							found = filter( item, match, i, curLoop );
							pass = not ^ found;

							if ( inplace && found != null ) {
								if ( pass ) {
									anyFound = true;

								} else {
									curLoop[i] = false;
								}

							} else if ( pass ) {
								result.push( item );
								anyFound = true;
							}
						}
					}
				}

				if ( found !== undefined ) {
					if ( !inplace ) {
						curLoop = result;
					}

					expr = expr.replace( Expr.match[ type ], "" );

					if ( !anyFound ) {
						return [];
					}

					break;
				}
			}
		}

		// Improper expression
		if ( expr === old ) {
			if ( anyFound == null ) {
				Sizzle.error( expr );

			} else {
				break;
			}
		}

		old = expr;
	}

	return curLoop;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Utility function for retreiving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
var getText = Sizzle.getText = function( elem ) {
    var i, node,
		nodeType = elem.nodeType,
		ret = "";

	if ( nodeType ) {
		if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
			// Use textContent || innerText for elements
			if ( typeof elem.textContent === 'string' ) {
				return elem.textContent;
			} else if ( typeof elem.innerText === 'string' ) {
				// Replace IE's carriage returns
				return elem.innerText.replace( rReturn, '' );
			} else {
				// Traverse it's children
				for ( elem = elem.firstChild; elem; elem = elem.nextSibling) {
					ret += getText( elem );
				}
			}
		} else if ( nodeType === 3 || nodeType === 4 ) {
			return elem.nodeValue;
		}
	} else {

		// If no nodeType, this is expected to be an array
		for ( i = 0; (node = elem[i]); i++ ) {
			// Do not traverse comment nodes
			if ( node.nodeType !== 8 ) {
				ret += getText( node );
			}
		}
	}
	return ret;
};

var Expr = Sizzle.selectors = {
	order: [ "ID", "NAME", "TAG" ],

	match: {
		ID: /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
		CLASS: /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
		NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,
		ATTR: /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,
		TAG: /^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,
		CHILD: /:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,
		POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,
		PSEUDO: /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
	},

	leftMatch: {},

	attrMap: {
		"class": "className",
		"for": "htmlFor"
	},

	attrHandle: {
		href: function( elem ) {
			return elem.getAttribute( "href" );
		},
		type: function( elem ) {
			return elem.getAttribute( "type" );
		}
	},

	relative: {
		"+": function(checkSet, part){
			var isPartStr = typeof part === "string",
				isTag = isPartStr && !rNonWord.test( part ),
				isPartStrNotTag = isPartStr && !isTag;

			if ( isTag ) {
				part = part.toLowerCase();
			}

			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
				if ( (elem = checkSet[i]) ) {
					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

					checkSet[i] = isPartStrNotTag || elem && elem.nodeName.toLowerCase() === part ?
						elem || false :
						elem === part;
				}
			}

			if ( isPartStrNotTag ) {
				Sizzle.filter( part, checkSet, true );
			}
		},

		">": function( checkSet, part ) {
			var elem,
				isPartStr = typeof part === "string",
				i = 0,
				l = checkSet.length;

			if ( isPartStr && !rNonWord.test( part ) ) {
				part = part.toLowerCase();

				for ( ; i < l; i++ ) {
					elem = checkSet[i];

					if ( elem ) {
						var parent = elem.parentNode;
						checkSet[i] = parent.nodeName.toLowerCase() === part ? parent : false;
					}
				}

			} else {
				for ( ; i < l; i++ ) {
					elem = checkSet[i];

					if ( elem ) {
						checkSet[i] = isPartStr ?
							elem.parentNode :
							elem.parentNode === part;
					}
				}

				if ( isPartStr ) {
					Sizzle.filter( part, checkSet, true );
				}
			}
		},

		"": function(checkSet, part, isXML){
			var nodeCheck,
				doneName = done++,
				checkFn = dirCheck;

			if ( typeof part === "string" && !rNonWord.test( part ) ) {
				part = part.toLowerCase();
				nodeCheck = part;
				checkFn = dirNodeCheck;
			}

			checkFn( "parentNode", part, doneName, checkSet, nodeCheck, isXML );
		},

		"~": function( checkSet, part, isXML ) {
			var nodeCheck,
				doneName = done++,
				checkFn = dirCheck;

			if ( typeof part === "string" && !rNonWord.test( part ) ) {
				part = part.toLowerCase();
				nodeCheck = part;
				checkFn = dirNodeCheck;
			}

			checkFn( "previousSibling", part, doneName, checkSet, nodeCheck, isXML );
		}
	},

	find: {
		ID: function( match, context, isXML ) {
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [m] : [];
			}
		},

		NAME: function( match, context ) {
			if ( typeof context.getElementsByName !== "undefined" ) {
				var ret = [],
					results = context.getElementsByName( match[1] );

				for ( var i = 0, l = results.length; i < l; i++ ) {
					if ( results[i].getAttribute("name") === match[1] ) {
						ret.push( results[i] );
					}
				}

				return ret.length === 0 ? null : ret;
			}
		},

		TAG: function( match, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( match[1] );
			}
		}
	},
	preFilter: {
		CLASS: function( match, curLoop, inplace, result, not, isXML ) {
			match = " " + match[1].replace( rBackslash, "" ) + " ";

			if ( isXML ) {
				return match;
			}

			for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
				if ( elem ) {
					if ( not ^ (elem.className && (" " + elem.className + " ").replace(/[\t\n\r]/g, " ").indexOf(match) >= 0) ) {
						if ( !inplace ) {
							result.push( elem );
						}

					} else if ( inplace ) {
						curLoop[i] = false;
					}
				}
			}

			return false;
		},

		ID: function( match ) {
			return match[1].replace( rBackslash, "" );
		},

		TAG: function( match, curLoop ) {
			return match[1].replace( rBackslash, "" ).toLowerCase();
		},

		CHILD: function( match ) {
			if ( match[1] === "nth" ) {
				if ( !match[2] ) {
					Sizzle.error( match[0] );
				}

				match[2] = match[2].replace(/^\+|\s*/g, '');

				// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
				var test = /(-?)(\d*)(?:n([+\-]?\d*))?/.exec(
					match[2] === "even" && "2n" || match[2] === "odd" && "2n+1" ||
					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

				// calculate the numbers (first)n+(last) including if they are negative
				match[2] = (test[1] + (test[2] || 1)) - 0;
				match[3] = test[3] - 0;
			}
			else if ( match[2] ) {
				Sizzle.error( match[0] );
			}

			// TODO: Move to normal caching system
			match[0] = done++;

			return match;
		},

		ATTR: function( match, curLoop, inplace, result, not, isXML ) {
			var name = match[1] = match[1].replace( rBackslash, "" );

			if ( !isXML && Expr.attrMap[name] ) {
				match[1] = Expr.attrMap[name];
			}

			// Handle if an un-quoted value was used
			match[4] = ( match[4] || match[5] || "" ).replace( rBackslash, "" );

			if ( match[2] === "~=" ) {
				match[4] = " " + match[4] + " ";
			}

			return match;
		},

		PSEUDO: function( match, curLoop, inplace, result, not ) {
			if ( match[1] === "not" ) {
				// If we're dealing with a complex expression, or a simple one
				if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
					match[3] = Sizzle(match[3], null, null, curLoop);

				} else {
					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);

					if ( !inplace ) {
						result.push.apply( result, ret );
					}

					return false;
				}

			} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
				return true;
			}

			return match;
		},

		POS: function( match ) {
			match.unshift( true );

			return match;
		}
	},

	filters: {
		enabled: function( elem ) {
			return elem.disabled === false && elem.type !== "hidden";
		},

		disabled: function( elem ) {
			return elem.disabled === true;
		},

		checked: function( elem ) {
			return elem.checked === true;
		},

		selected: function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		parent: function( elem ) {
			return !!elem.firstChild;
		},

		empty: function( elem ) {
			return !elem.firstChild;
		},

		has: function( elem, i, match ) {
			return !!Sizzle( match[3], elem ).length;
		},

		header: function( elem ) {
			return (/h\d/i).test( elem.nodeName );
		},

		text: function( elem ) {
			var attr = elem.getAttribute( "type" ), type = elem.type;
			// IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
			// use getAttribute instead to test this case
			return elem.nodeName.toLowerCase() === "input" && "text" === type && ( attr === type || attr === null );
		},

		radio: function( elem ) {
			return elem.nodeName.toLowerCase() === "input" && "radio" === elem.type;
		},

		checkbox: function( elem ) {
			return elem.nodeName.toLowerCase() === "input" && "checkbox" === elem.type;
		},

		file: function( elem ) {
			return elem.nodeName.toLowerCase() === "input" && "file" === elem.type;
		},

		password: function( elem ) {
			return elem.nodeName.toLowerCase() === "input" && "password" === elem.type;
		},

		submit: function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return (name === "input" || name === "button") && "submit" === elem.type;
		},

		image: function( elem ) {
			return elem.nodeName.toLowerCase() === "input" && "image" === elem.type;
		},

		reset: function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return (name === "input" || name === "button") && "reset" === elem.type;
		},

		button: function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && "button" === elem.type || name === "button";
		},

		input: function( elem ) {
			return (/input|select|textarea|button/i).test( elem.nodeName );
		},

		focus: function( elem ) {
			return elem === elem.ownerDocument.activeElement;
		}
	},
	setFilters: {
		first: function( elem, i ) {
			return i === 0;
		},

		last: function( elem, i, match, array ) {
			return i === array.length - 1;
		},

		even: function( elem, i ) {
			return i % 2 === 0;
		},

		odd: function( elem, i ) {
			return i % 2 === 1;
		},

		lt: function( elem, i, match ) {
			return i < match[3] - 0;
		},

		gt: function( elem, i, match ) {
			return i > match[3] - 0;
		},

		nth: function( elem, i, match ) {
			return match[3] - 0 === i;
		},

		eq: function( elem, i, match ) {
			return match[3] - 0 === i;
		}
	},
	filter: {
		PSEUDO: function( elem, match, i, array ) {
			var name = match[1],
				filter = Expr.filters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );

			} else if ( name === "contains" ) {
				return (elem.textContent || elem.innerText || getText([ elem ]) || "").indexOf(match[3]) >= 0;

			} else if ( name === "not" ) {
				var not = match[3];

				for ( var j = 0, l = not.length; j < l; j++ ) {
					if ( not[j] === elem ) {
						return false;
					}
				}

				return true;

			} else {
				Sizzle.error( name );
			}
		},

		CHILD: function( elem, match ) {
			var first, last,
				doneName, parent, cache,
				count, diff,
				type = match[1],
				node = elem;

			switch ( type ) {
				case "only":
				case "first":
					while ( (node = node.previousSibling) ) {
						if ( node.nodeType === 1 ) {
							return false;
						}
					}

					if ( type === "first" ) {
						return true;
					}

					node = elem;

					/* falls through */
				case "last":
					while ( (node = node.nextSibling) ) {
						if ( node.nodeType === 1 ) {
							return false;
						}
					}

					return true;

				case "nth":
					first = match[2];
					last = match[3];

					if ( first === 1 && last === 0 ) {
						return true;
					}

					doneName = match[0];
					parent = elem.parentNode;

					if ( parent && (parent[ expando ] !== doneName || !elem.nodeIndex) ) {
						count = 0;

						for ( node = parent.firstChild; node; node = node.nextSibling ) {
							if ( node.nodeType === 1 ) {
								node.nodeIndex = ++count;
							}
						}

						parent[ expando ] = doneName;
					}

					diff = elem.nodeIndex - last;

					if ( first === 0 ) {
						return diff === 0;

					} else {
						return ( diff % first === 0 && diff / first >= 0 );
					}
			}
		},

		ID: function( elem, match ) {
			return elem.nodeType === 1 && elem.getAttribute("id") === match;
		},

		TAG: function( elem, match ) {
			return (match === "*" && elem.nodeType === 1) || !!elem.nodeName && elem.nodeName.toLowerCase() === match;
		},

		CLASS: function( elem, match ) {
			return (" " + (elem.className || elem.getAttribute("class")) + " ")
				.indexOf( match ) > -1;
		},

		ATTR: function( elem, match ) {
			var name = match[1],
				result = Sizzle.attr ?
					Sizzle.attr( elem, name ) :
					Expr.attrHandle[ name ] ?
					Expr.attrHandle[ name ]( elem ) :
					elem[ name ] != null ?
						elem[ name ] :
						elem.getAttribute( name ),
				value = result + "",
				type = match[2],
				check = match[4];

			return result == null ?
				type === "!=" :
				!type && Sizzle.attr ?
				result != null :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!check ?
				value && result !== false :
				type === "!=" ?
				value !== check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
				false;
		},

		POS: function( elem, match, i, array ) {
			var name = match[2],
				filter = Expr.setFilters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			}
		}
	}
};

var origPOS = Expr.match.POS,
	fescape = function(all, num){
		return "\\" + (num - 0 + 1);
	};

for ( var type in Expr.match ) {
	Expr.match[ type ] = new RegExp( Expr.match[ type ].source + (/(?![^\[]*\])(?![^\(]*\))/.source) );
	Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source.replace(/\\(\d+)/g, fescape) );
}
// Expose origPOS
// "global" as in regardless of relation to brackets/parens
Expr.match.globalPOS = origPOS;

var makeArray = function( array, results ) {
	array = Array.prototype.slice.call( array, 0 );

	if ( results ) {
		results.push.apply( results, array );
		return results;
	}

	return array;
};

// Perform a simple check to determine if the browser is capable of
// converting a NodeList to an array using builtin methods.
// Also verifies that the returned array holds DOM nodes
// (which is not the case in the Blackberry browser)
try {
	Array.prototype.slice.call( document.documentElement.childNodes, 0 )[0].nodeType;

// Provide a fallback method if it does not work
} catch( e ) {
	makeArray = function( array, results ) {
		var i = 0,
			ret = results || [];

		if ( toString.call(array) === "[object Array]" ) {
			Array.prototype.push.apply( ret, array );

		} else {
			if ( typeof array.length === "number" ) {
				for ( var l = array.length; i < l; i++ ) {
					ret.push( array[i] );
				}

			} else {
				for ( ; array[i]; i++ ) {
					ret.push( array[i] );
				}
			}
		}

		return ret;
	};
}

var sortOrder, siblingCheck;

if ( document.documentElement.compareDocumentPosition ) {
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
			return a.compareDocumentPosition ? -1 : 1;
		}

		return a.compareDocumentPosition(b) & 4 ? -1 : 1;
	};

} else {
	sortOrder = function( a, b ) {
		// The nodes are identical, we can exit early
		if ( a === b ) {
			hasDuplicate = true;
			return 0;

		// Fallback to using sourceIndex (in IE) if it's available on both nodes
		} else if ( a.sourceIndex && b.sourceIndex ) {
			return a.sourceIndex - b.sourceIndex;
		}

		var al, bl,
			ap = [],
			bp = [],
			aup = a.parentNode,
			bup = b.parentNode,
			cur = aup;

		// If the nodes are siblings (or identical) we can do a quick check
		if ( aup === bup ) {
			return siblingCheck( a, b );

		// If no parents were found then the nodes are disconnected
		} else if ( !aup ) {
			return -1;

		} else if ( !bup ) {
			return 1;
		}

		// Otherwise they're somewhere else in the tree so we need
		// to build up a full list of the parentNodes for comparison
		while ( cur ) {
			ap.unshift( cur );
			cur = cur.parentNode;
		}

		cur = bup;

		while ( cur ) {
			bp.unshift( cur );
			cur = cur.parentNode;
		}

		al = ap.length;
		bl = bp.length;

		// Start walking down the tree looking for a discrepancy
		for ( var i = 0; i < al && i < bl; i++ ) {
			if ( ap[i] !== bp[i] ) {
				return siblingCheck( ap[i], bp[i] );
			}
		}

		// We ended someplace up the tree so do a sibling check
		return i === al ?
			siblingCheck( a, bp[i], -1 ) :
			siblingCheck( ap[i], b, 1 );
	};

	siblingCheck = function( a, b, ret ) {
		if ( a === b ) {
			return ret;
		}

		var cur = a.nextSibling;

		while ( cur ) {
			if ( cur === b ) {
				return -1;
			}

			cur = cur.nextSibling;
		}

		return 1;
	};
}

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
(function(){
	// We're going to inject a fake input element with a specified name
	var form = document.createElement("div"),
		id = "script" + (new Date()).getTime(),
		root = document.documentElement;

	form.innerHTML = "<a name='" + id + "'/>";

	// Inject it into the root element, check its status, and remove it quickly
	root.insertBefore( form, root.firstChild );

	// The workaround has to do additional checks after a getElementById
	// Which slows things down for other browsers (hence the branching)
	if ( document.getElementById( id ) ) {
		Expr.find.ID = function( match, context, isXML ) {
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);

				return m ?
					m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ?
						[m] :
						undefined :
					[];
			}
		};

		Expr.filter.ID = function( elem, match ) {
			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");

			return elem.nodeType === 1 && node && node.nodeValue === match;
		};
	}

	root.removeChild( form );

	// release memory in IE
	root = form = null;
})();

(function(){
	// Check to see if the browser returns only elements
	// when doing getElementsByTagName("*")

	// Create a fake element
	var div = document.createElement("div");
	div.appendChild( document.createComment("") );

	// Make sure no comments are found
	if ( div.getElementsByTagName("*").length > 0 ) {
		Expr.find.TAG = function( match, context ) {
			var results = context.getElementsByTagName( match[1] );

			// Filter out possible comments
			if ( match[1] === "*" ) {
				var tmp = [];

				for ( var i = 0; results[i]; i++ ) {
					if ( results[i].nodeType === 1 ) {
						tmp.push( results[i] );
					}
				}

				results = tmp;
			}

			return results;
		};
	}

	// Check to see if an attribute returns normalized href attributes
	div.innerHTML = "<a href='#'></a>";

	if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
			div.firstChild.getAttribute("href") !== "#" ) {

		Expr.attrHandle.href = function( elem ) {
			return elem.getAttribute( "href", 2 );
		};
	}

	// release memory in IE
	div = null;
})();

if ( document.querySelectorAll ) {
	(function(){
		var oldSizzle = Sizzle,
			div = document.createElement("div"),
			id = "__sizzle__";

		div.innerHTML = "<p class='TEST'></p>";

		// Safari can't handle uppercase or unicode characters when
		// in quirks mode.
		if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
			return;
		}

		Sizzle = function( query, context, extra, seed ) {
			context = context || document;

			// Only use querySelectorAll on non-XML documents
			// (ID selectors don't work in non-HTML documents)
			if ( !seed && !Sizzle.isXML(context) ) {
				// See if we find a selector to speed up
				var match = /^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec( query );

				if ( match && (context.nodeType === 1 || context.nodeType === 9) ) {
					// Speed-up: Sizzle("TAG")
					if ( match[1] ) {
						return makeArray( context.getElementsByTagName( query ), extra );

					// Speed-up: Sizzle(".CLASS")
					} else if ( match[2] && Expr.find.CLASS && context.getElementsByClassName ) {
						return makeArray( context.getElementsByClassName( match[2] ), extra );
					}
				}

				if ( context.nodeType === 9 ) {
					// Speed-up: Sizzle("body")
					// The body element only exists once, optimize finding it
					if ( query === "body" && context.body ) {
						return makeArray( [ context.body ], extra );

					// Speed-up: Sizzle("#ID")
					} else if ( match && match[3] ) {
						var elem = context.getElementById( match[3] );

						// Check parentNode to catch when Blackberry 4.6 returns
						// nodes that are no longer in the document #6963
						if ( elem && elem.parentNode ) {
							// Handle the case where IE and Opera return items
							// by name instead of ID
							if ( elem.id === match[3] ) {
								return makeArray( [ elem ], extra );
							}

						} else {
							return makeArray( [], extra );
						}
					}

					try {
						return makeArray( context.querySelectorAll(query), extra );
					} catch(qsaError) {}

				// qSA works strangely on Element-rooted queries
				// We can work around this by specifying an extra ID on the root
				// and working up from there (Thanks to Andrew Dupont for the technique)
				// IE 8 doesn't work on object elements
				} else if ( context.nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
					var oldContext = context,
						old = context.getAttribute( "id" ),
						nid = old || id,
						hasParent = context.parentNode,
						relativeHierarchySelector = /^\s*[+~]/.test( query );

					if ( !old ) {
						context.setAttribute( "id", nid );
					} else {
						nid = nid.replace( /'/g, "\\$&" );
					}
					if ( relativeHierarchySelector && hasParent ) {
						context = context.parentNode;
					}

					try {
						if ( !relativeHierarchySelector || hasParent ) {
							return makeArray( context.querySelectorAll( "[id='" + nid + "'] " + query ), extra );
						}

					} catch(pseudoError) {
					} finally {
						if ( !old ) {
							oldContext.removeAttribute( "id" );
						}
					}
				}
			}

			return oldSizzle(query, context, extra, seed);
		};

		for ( var prop in oldSizzle ) {
			Sizzle[ prop ] = oldSizzle[ prop ];
		}

		// release memory in IE
		div = null;
	})();
}

(function(){
	var html = document.documentElement,
		matches = html.matchesSelector || html.mozMatchesSelector || html.webkitMatchesSelector || html.msMatchesSelector;

	if ( matches ) {
		// Check to see if it's possible to do matchesSelector
		// on a disconnected node (IE 9 fails this)
		var disconnectedMatch = !matches.call( document.createElement( "div" ), "div" ),
			pseudoWorks = false;

		try {
			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( document.documentElement, "[test!='']:sizzle" );

		} catch( pseudoError ) {
			pseudoWorks = true;
		}

		Sizzle.matchesSelector = function( node, expr ) {
			// Make sure that attribute selectors are quoted
			expr = expr.replace(/\=\s*([^'"\]]*)\s*\]/g, "='$1']");

			if ( !Sizzle.isXML( node ) ) {
				try {
					if ( pseudoWorks || !Expr.match.PSEUDO.test( expr ) && !/!=/.test( expr ) ) {
						var ret = matches.call( node, expr );

						// IE 9's matchesSelector returns false on disconnected nodes
						if ( ret || !disconnectedMatch ||
								// As well, disconnected nodes are said to be in a document
								// fragment in IE 9, so check for that
								node.document && node.document.nodeType !== 11 ) {
							return ret;
						}
					}
				} catch(e) {}
			}

			return Sizzle(expr, null, null, [node]).length > 0;
		};
	}
})();

(function(){
	var div = document.createElement("div");

	div.innerHTML = "<div class='test e'></div><div class='test'></div>";

	// Opera can't find a second classname (in 9.6)
	// Also, make sure that getElementsByClassName actually exists
	if ( !div.getElementsByClassName || div.getElementsByClassName("e").length === 0 ) {
		return;
	}

	// Safari caches class attributes, doesn't catch changes (in 3.2)
	div.lastChild.className = "e";

	if ( div.getElementsByClassName("e").length === 1 ) {
		return;
	}

	Expr.order.splice(1, 0, "CLASS");
	Expr.find.CLASS = function( match, context, isXML ) {
		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
			return context.getElementsByClassName(match[1]);
		}
	};

	// release memory in IE
	div = null;
})();

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];

		if ( elem ) {
			var match = false;

			elem = elem[dir];

			while ( elem ) {
				if ( elem[ expando ] === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 && !isXML ){
					elem[ expando ] = doneName;
					elem.sizset = i;
				}

				if ( elem.nodeName.toLowerCase() === cur ) {
					match = elem;
					break;
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];

		if ( elem ) {
			var match = false;

			elem = elem[dir];

			while ( elem ) {
				if ( elem[ expando ] === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 ) {
					if ( !isXML ) {
						elem[ expando ] = doneName;
						elem.sizset = i;
					}

					if ( typeof cur !== "string" ) {
						if ( elem === cur ) {
							match = true;
							break;
						}

					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
						match = elem;
						break;
					}
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

if ( document.documentElement.contains ) {
	Sizzle.contains = function( a, b ) {
		return a !== b && (a.contains ? a.contains(b) : true);
	};

} else if ( document.documentElement.compareDocumentPosition ) {
	Sizzle.contains = function( a, b ) {
		return !!(a.compareDocumentPosition(b) & 16);
	};

} else {
	Sizzle.contains = function() {
		return false;
	};
}

Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;

	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

var posProcess = function( selector, context, seed ) {
	var match,
		tmpSet = [],
		later = "",
		root = context.nodeType ? [context] : context;

	// Position selectors must be done after the filter
	// And so must :not(positional) so we move all PSEUDOs to the end
	while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
		later += match[0];
		selector = selector.replace( Expr.match.PSEUDO, "" );
	}

	selector = Expr.relative[selector] ? selector + "*" : selector;

	for ( var i = 0, l = root.length; i < l; i++ ) {
		Sizzle( selector, root[i], tmpSet, seed );
	}

	return Sizzle.filter( later, tmpSet );
};

// EXPOSE

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Sizzle;
} else {
  window.Sizzle = Sizzle;
}

})();

},{}],115:[function(_dereq_,module,exports){
module.exports=_dereq_(111)
},{}],116:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],117:[function(_dereq_,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],118:[function(_dereq_,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = _dereq_('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = _dereq_('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,_dereq_("/Users/eric/Repos/universe.js/node_modules/watchify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":117,"/Users/eric/Repos/universe.js/node_modules/watchify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":116,"inherits":115}],119:[function(_dereq_,module,exports){
var window = _dereq_("global/window")
var once = _dereq_("once")

var messages = {
    "0": "Internal XMLHttpRequest Error",
    "4": "4xx Client Error",
    "5": "5xx Server Error"
}

var XHR = window.XMLHttpRequest || noop
var XDR = "withCredentials" in (new XHR()) ?
        window.XMLHttpRequest : window.XDomainRequest

module.exports = createXHR

function createXHR(options, callback) {
    if (typeof options === "string") {
        options = { uri: options }
    }

    options = options || {}
    callback = once(callback)

    var xhr

    if (options.cors) {
        xhr = new XDR()
    } else {
        xhr = new XHR()
    }

    var uri = xhr.url = options.uri
    var method = xhr.method = options.method || "GET"
    var body = options.body || options.data
    var headers = xhr.headers = options.headers || {}
    var sync = !!options.sync
    var isJson = false

    if ("json" in options) {
        isJson = true
        headers["Content-Type"] = "application/json"
        body = JSON.stringify(options.json)
    }

    xhr.onreadystatechange = readystatechange
    xhr.onload = load
    xhr.onerror = error
    // IE9 must have onprogress be set to a unique function.
    xhr.onprogress = function () {
        // IE must die
    }
    // hate IE
    xhr.ontimeout = noop
    xhr.open(method, uri, !sync)
    if (options.cors) {
        xhr.withCredentials = true
    }
    // Cannot set timeout with sync request
    if (!sync) {
        xhr.timeout = "timeout" in options ? options.timeout : 5000
    }

    if ( xhr.setRequestHeader) {
        Object.keys(headers).forEach(function (key) {
            xhr.setRequestHeader(key, headers[key])
        })
    }

    xhr.send(body)

    return xhr

    function readystatechange() {
        if (xhr.readyState === 4) {
            load()
        }
    }

    function load() {
        var error = null
        var status = xhr.statusCode = xhr.status
        var body = xhr.body = xhr.response ||
            xhr.responseText || xhr.responseXML

        if (status === 0 || (status >= 400 && status < 600)) {
            var message = xhr.responseText ||
                messages[String(xhr.status).charAt(0)]
            error = new Error(message)

            error.statusCode = xhr.status
        }

        if (isJson) {
            try {
                body = xhr.body = JSON.parse(body)
            } catch (e) {}
        }

        callback(error, xhr, body)
    }

    function error(evt) {
        callback(evt, xhr)
    }
}


function noop() {}

},{"global/window":120,"once":121}],120:[function(_dereq_,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window
} else if (typeof global !== "undefined") {
    module.exports = global
} else {
    module.exports = {}
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],121:[function(_dereq_,module,exports){
module.exports = once

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })
})

function once (fn) {
  var called = false
  return function () {
    if (called) return
    called = true
    return fn.apply(this, arguments)
  }
}

},{}],122:[function(_dereq_,module,exports){
var NO_OP = function(){};
var API_BASE_URL = 'https://services.sparkart.net/api/v1/';

var jsonp = _dereq_('jsonp');
var xhr = _dereq_('xhr');

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
},{"jsonp":112,"xhr":119}],123:[function(_dereq_,module,exports){
var NO_OP = function(){};

var domready = _dereq_('domready');
var sizzle = _dereq_('sizzle');
var elClass = _dereq_('element-class');
var Handlebars = _dereq_('hbsfy/runtime');
var handlebars_helper = _dereq_('handlebars-helper');

handlebars_helper.help( Handlebars );

var apiRequest = _dereq_('./api_request.js');

var Base = function( config ){
	this.key = config.key || this.key;
	this.endpoint = config.endpoint || this.endpoint;
	this.el = config.el;
	this.template = config.template || this.template || _dereq_('./test.hbs');
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
},{"./api_request.js":122,"./test.hbs":128,"domready":2,"element-class":3,"handlebars-helper":5,"hbsfy/runtime":110,"sizzle":114}],124:[function(_dereq_,module,exports){
var EVENTS_ENDPOINT = 'events/';

var inherits = _dereq_('inherits');
var Base = _dereq_('./base.js');

var events_template = _dereq_('./templates/event.hbs');

var Events = function( config ){
	config = extend( config, {
		endpoint: EVENTS_ENDPOINT + config.id,
		template: events_template
	})
	Base.call( this, config );
};

inherits( Events, Base );

module.exports = Events;
},{"./base.js":123,"./templates/event.hbs":126,"inherits":111}],125:[function(_dereq_,module,exports){
var EVENTS_ENDPOINT = 'events/';

var util = _dereq_('util');
var extend = _dereq_('extend');
var Base = _dereq_('./base.js');

var events_template = _dereq_('./templates/events.hbs');

var Events = function( config ){
	config = extend( config, {
		endpoint: EVENTS_ENDPOINT,
		template: events_template
	})
	Base.call( this, config );
};

util.inherits( Events, Base );

module.exports = Events;
},{"./base.js":123,"./templates/events.hbs":127,"extend":4,"util":118}],126:[function(_dereq_,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = _dereq_('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n";
  options={hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data}
  if (helper = helpers.venue) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.venue); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.venue) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n<h3>";
  if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</h3>\n<time>"
    + escapeExpression((helper = helpers.formatDate || (depth0 && depth0.formatDate),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.date), "%b %-d", options) : helperMissing.call(depth0, "formatDate", (depth0 && depth0.date), "%b %-d", options)))
    + "</time>\n<p>";
  if (helper = helpers.description) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.description); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</p>\n";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "<h2>";
  if (helper = helpers.city) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.city); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + ", ";
  if (helper = helpers.state) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.state); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</h2>";
  return buffer;
  }

  options={hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}
  if (helper = helpers.event) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.event); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.event) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}); }
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  });

},{"hbsfy/runtime":110}],127:[function(_dereq_,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = _dereq_('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n	<li>\n		";
  options={hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data}
  if (helper = helpers.venue) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.venue); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.venue) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		<h3>";
  if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</h3>\n		<time>"
    + escapeExpression((helper = helpers.formatDate || (depth0 && depth0.formatDate),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.date), "%b %-d", options) : helperMissing.call(depth0, "formatDate", (depth0 && depth0.date), "%b %-d", options)))
    + "</time>\n		<p>";
  if (helper = helpers.description) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.description); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</p>\n	</li>\n";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "<h2>";
  if (helper = helpers.city) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.city); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + ", ";
  if (helper = helpers.state) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.state); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</h2>";
  return buffer;
  }

  buffer += "<ul class=\"listing\">\n";
  options={hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}
  if (helper = helpers.events) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.events); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.events) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>";
  return buffer;
  });

},{"hbsfy/runtime":110}],128:[function(_dereq_,module,exports){
// hbsfy compiled Handlebars template
var Handlebars = _dereq_('hbsfy/runtime');
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "test";
  });

},{"hbsfy/runtime":110}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2RvbXJlYWR5L3JlYWR5LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2VsZW1lbnQtY2xhc3MvaW5kZXguanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvZXh0ZW5kL2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL2xpYi9oZWxwZXJzL2FkZC5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9saWIvaGVscGVycy9hZ28uanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbGliL2hlbHBlcnMvYmV0d2Vlbi5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9saWIvaGVscGVycy9jb250YWlucy5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9saWIvaGVscGVycy9kaXZpZGUuanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbGliL2hlbHBlcnMvZW5jb2RlLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL2xpYi9oZWxwZXJzL2VxdWFsLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL2xpYi9oZWxwZXJzL2ZpcnN0LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL2xpYi9oZWxwZXJzL2Zvcm1hdERhdGUuanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbGliL2hlbHBlcnMvZ3JlYXRlci5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9saWIvaGVscGVycy9qb2luLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL2xpYi9oZWxwZXJzL2xhc3QuanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbGliL2hlbHBlcnMvbGVuZ3RoLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL2xpYi9oZWxwZXJzL2xlc3MuanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbGliL2hlbHBlcnMvbG93ZXJjYXNlLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL2xpYi9oZWxwZXJzL211bHRpcGx5LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL2xpYi9oZWxwZXJzL3JhbmdlLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL2xpYi9oZWxwZXJzL3JlcGxhY2UuanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbGliL2hlbHBlcnMvcmV2ZXJzZS5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9saWIvaGVscGVycy9zaHVmZmxlLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL2xpYi9oZWxwZXJzL3N1YnRyYWN0LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL2xpYi9oZWxwZXJzL3RpbWVzLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL2xpYi9oZWxwZXJzL3VwcGVyY2FzZS5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9saWIvaGVscGVycy93aGVyZS5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9saWIvaW5kZXguanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbm9kZV9tb2R1bGVzL2xvZGFzaC5pc2FycmF5L2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL25vZGVfbW9kdWxlcy9sb2Rhc2guaXNhcnJheS9ub2RlX21vZHVsZXMvbG9kYXNoLl9pc25hdGl2ZS9pbmRleC5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9ub2RlX21vZHVsZXMvbG9kYXNoLnJlZHVjZS9pbmRleC5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9ub2RlX21vZHVsZXMvbG9kYXNoLnJlZHVjZS9ub2RlX21vZHVsZXMvbG9kYXNoLmNyZWF0ZWNhbGxiYWNrL2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL25vZGVfbW9kdWxlcy9sb2Rhc2gucmVkdWNlL25vZGVfbW9kdWxlcy9sb2Rhc2guY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWNyZWF0ZWNhbGxiYWNrL2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL25vZGVfbW9kdWxlcy9sb2Rhc2gucmVkdWNlL25vZGVfbW9kdWxlcy9sb2Rhc2guY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWNyZWF0ZWNhbGxiYWNrL25vZGVfbW9kdWxlcy9sb2Rhc2guX3NldGJpbmRkYXRhL2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL25vZGVfbW9kdWxlcy9sb2Rhc2gucmVkdWNlL25vZGVfbW9kdWxlcy9sb2Rhc2guY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWNyZWF0ZWNhbGxiYWNrL25vZGVfbW9kdWxlcy9sb2Rhc2guX3NldGJpbmRkYXRhL25vZGVfbW9kdWxlcy9sb2Rhc2gubm9vcC9pbmRleC5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9ub2RlX21vZHVsZXMvbG9kYXNoLnJlZHVjZS9ub2RlX21vZHVsZXMvbG9kYXNoLmNyZWF0ZWNhbGxiYWNrL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjcmVhdGVjYWxsYmFjay9ub2RlX21vZHVsZXMvbG9kYXNoLmJpbmQvaW5kZXguanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbm9kZV9tb2R1bGVzL2xvZGFzaC5yZWR1Y2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5jcmVhdGVjYWxsYmFjay9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5iaW5kL25vZGVfbW9kdWxlcy9sb2Rhc2guX2NyZWF0ZXdyYXBwZXIvaW5kZXguanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbm9kZV9tb2R1bGVzL2xvZGFzaC5yZWR1Y2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5jcmVhdGVjYWxsYmFjay9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5iaW5kL25vZGVfbW9kdWxlcy9sb2Rhc2guX2NyZWF0ZXdyYXBwZXIvbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWJpbmQvaW5kZXguanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbm9kZV9tb2R1bGVzL2xvZGFzaC5yZWR1Y2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5jcmVhdGVjYWxsYmFjay9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5iaW5kL25vZGVfbW9kdWxlcy9sb2Rhc2guX2NyZWF0ZXdyYXBwZXIvbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWJpbmQvbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWNyZWF0ZS9pbmRleC5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9ub2RlX21vZHVsZXMvbG9kYXNoLnJlZHVjZS9ub2RlX21vZHVsZXMvbG9kYXNoLmNyZWF0ZWNhbGxiYWNrL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjcmVhdGVjYWxsYmFjay9ub2RlX21vZHVsZXMvbG9kYXNoLmJpbmQvbm9kZV9tb2R1bGVzL2xvZGFzaC5fY3JlYXRld3JhcHBlci9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlY3JlYXRld3JhcHBlci9pbmRleC5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9ub2RlX21vZHVsZXMvbG9kYXNoLnJlZHVjZS9ub2RlX21vZHVsZXMvbG9kYXNoLmNyZWF0ZWNhbGxiYWNrL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjcmVhdGVjYWxsYmFjay9ub2RlX21vZHVsZXMvbG9kYXNoLmJpbmQvbm9kZV9tb2R1bGVzL2xvZGFzaC5fY3JlYXRld3JhcHBlci9ub2RlX21vZHVsZXMvbG9kYXNoLmlzZnVuY3Rpb24vaW5kZXguanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbm9kZV9tb2R1bGVzL2xvZGFzaC5yZWR1Y2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5jcmVhdGVjYWxsYmFjay9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5iaW5kL25vZGVfbW9kdWxlcy9sb2Rhc2guX3NsaWNlL2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL25vZGVfbW9kdWxlcy9sb2Rhc2gucmVkdWNlL25vZGVfbW9kdWxlcy9sb2Rhc2guY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWNyZWF0ZWNhbGxiYWNrL25vZGVfbW9kdWxlcy9sb2Rhc2guaWRlbnRpdHkvaW5kZXguanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbm9kZV9tb2R1bGVzL2xvZGFzaC5yZWR1Y2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5jcmVhdGVjYWxsYmFjay9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5zdXBwb3J0L2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL25vZGVfbW9kdWxlcy9sb2Rhc2gucmVkdWNlL25vZGVfbW9kdWxlcy9sb2Rhc2guY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWlzZXF1YWwvaW5kZXguanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbm9kZV9tb2R1bGVzL2xvZGFzaC5yZWR1Y2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5jcmVhdGVjYWxsYmFjay9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlaXNlcXVhbC9ub2RlX21vZHVsZXMvbG9kYXNoLl9nZXRhcnJheS9pbmRleC5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9ub2RlX21vZHVsZXMvbG9kYXNoLnJlZHVjZS9ub2RlX21vZHVsZXMvbG9kYXNoLmNyZWF0ZWNhbGxiYWNrL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2Vpc2VxdWFsL25vZGVfbW9kdWxlcy9sb2Rhc2guX2dldGFycmF5L25vZGVfbW9kdWxlcy9sb2Rhc2guX2FycmF5cG9vbC9pbmRleC5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9ub2RlX21vZHVsZXMvbG9kYXNoLnJlZHVjZS9ub2RlX21vZHVsZXMvbG9kYXNoLmNyZWF0ZWNhbGxiYWNrL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2Vpc2VxdWFsL25vZGVfbW9kdWxlcy9sb2Rhc2guX29iamVjdHR5cGVzL2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL25vZGVfbW9kdWxlcy9sb2Rhc2gucmVkdWNlL25vZGVfbW9kdWxlcy9sb2Rhc2guY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWlzZXF1YWwvbm9kZV9tb2R1bGVzL2xvZGFzaC5fcmVsZWFzZWFycmF5L2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL25vZGVfbW9kdWxlcy9sb2Rhc2gucmVkdWNlL25vZGVfbW9kdWxlcy9sb2Rhc2guY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWlzZXF1YWwvbm9kZV9tb2R1bGVzL2xvZGFzaC5fcmVsZWFzZWFycmF5L25vZGVfbW9kdWxlcy9sb2Rhc2guX21heHBvb2xzaXplL2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL25vZGVfbW9kdWxlcy9sb2Rhc2gucmVkdWNlL25vZGVfbW9kdWxlcy9sb2Rhc2guY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWlzZXF1YWwvbm9kZV9tb2R1bGVzL2xvZGFzaC5mb3Jpbi9pbmRleC5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9ub2RlX21vZHVsZXMvbG9kYXNoLnJlZHVjZS9ub2RlX21vZHVsZXMvbG9kYXNoLmNyZWF0ZWNhbGxiYWNrL25vZGVfbW9kdWxlcy9sb2Rhc2guaXNvYmplY3QvaW5kZXguanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbm9kZV9tb2R1bGVzL2xvZGFzaC5yZWR1Y2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5jcmVhdGVjYWxsYmFjay9ub2RlX21vZHVsZXMvbG9kYXNoLmtleXMvaW5kZXguanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbm9kZV9tb2R1bGVzL2xvZGFzaC5yZWR1Y2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5jcmVhdGVjYWxsYmFjay9ub2RlX21vZHVsZXMvbG9kYXNoLmtleXMvbm9kZV9tb2R1bGVzL2xvZGFzaC5fc2hpbWtleXMvaW5kZXguanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbm9kZV9tb2R1bGVzL2xvZGFzaC5yZWR1Y2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5jcmVhdGVjYWxsYmFjay9ub2RlX21vZHVsZXMvbG9kYXNoLnByb3BlcnR5L2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL25vZGVfbW9kdWxlcy9sb2Rhc2gucmVkdWNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZm9yb3duL2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL25vZGVfbW9kdWxlcy9sb2Rhc2gucmVkdWNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZm9yb3duL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjcmVhdGVjYWxsYmFjay9pbmRleC5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9ub2RlX21vZHVsZXMvbG9kYXNoLnJlZHVjZS9ub2RlX21vZHVsZXMvbG9kYXNoLmZvcm93bi9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5iaW5kL2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL25vZGVfbW9kdWxlcy9sb2Rhc2gucmVkdWNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZm9yb3duL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjcmVhdGVjYWxsYmFjay9ub2RlX21vZHVsZXMvbG9kYXNoLmJpbmQvbm9kZV9tb2R1bGVzL2xvZGFzaC5fY3JlYXRld3JhcHBlci9pbmRleC5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9ub2RlX21vZHVsZXMvbG9kYXNoLnJlZHVjZS9ub2RlX21vZHVsZXMvbG9kYXNoLmZvcm93bi9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5iaW5kL25vZGVfbW9kdWxlcy9sb2Rhc2guX2NyZWF0ZXdyYXBwZXIvbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWJpbmQvaW5kZXguanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbm9kZV9tb2R1bGVzL2xvZGFzaC5yZWR1Y2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5mb3Jvd24vbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWNyZWF0ZWNhbGxiYWNrL25vZGVfbW9kdWxlcy9sb2Rhc2guYmluZC9ub2RlX21vZHVsZXMvbG9kYXNoLl9jcmVhdGV3cmFwcGVyL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2ViaW5kL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjcmVhdGUvaW5kZXguanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy1oZWxwZXIvbm9kZV9tb2R1bGVzL2xvZGFzaC5yZWR1Y2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5mb3Jvd24vbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWNyZWF0ZWNhbGxiYWNrL25vZGVfbW9kdWxlcy9sb2Rhc2guYmluZC9ub2RlX21vZHVsZXMvbG9kYXNoLl9jcmVhdGV3cmFwcGVyL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjcmVhdGV3cmFwcGVyL2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL25vZGVfbW9kdWxlcy9sb2Rhc2gucmVkdWNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZm9yb3duL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjcmVhdGVjYWxsYmFjay9ub2RlX21vZHVsZXMvbG9kYXNoLmJpbmQvbm9kZV9tb2R1bGVzL2xvZGFzaC5fY3JlYXRld3JhcHBlci9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlY3JlYXRld3JhcHBlci9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlY3JlYXRlL2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL25vZGVfbW9kdWxlcy9sb2Rhc2gucmVkdWNlL25vZGVfbW9kdWxlcy9sb2Rhc2guZm9yb3duL25vZGVfbW9kdWxlcy9sb2Rhc2gua2V5cy9pbmRleC5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9ub2RlX21vZHVsZXMvbmV3LWRhdGUvbGliL2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL25vZGVfbW9kdWxlcy9uZXctZGF0ZS9saWIvbWlsbGlzZWNvbmRzLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL25vZGVfbW9kdWxlcy9uZXctZGF0ZS9saWIvc2Vjb25kcy5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9ub2RlX21vZHVsZXMvbmV3LWRhdGUvbm9kZV9tb2R1bGVzL2lzL2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMtaGVscGVyL25vZGVfbW9kdWxlcy9uZXctZGF0ZS9ub2RlX21vZHVsZXMvaXNvZGF0ZS9pbmRleC5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzLWhlbHBlci9ub2RlX21vZHVsZXMvc3RyZnRpbWUvc3RyZnRpbWUuanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzLnJ1bnRpbWUuanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL2Jhc2UuanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL2V4Y2VwdGlvbi5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMvcnVudGltZS5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMvc2FmZS1zdHJpbmcuanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL3V0aWxzLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvcnVudGltZS5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYnNmeS9ydW50aW1lLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvanNvbnAvaW5kZXguanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvanNvbnAvbm9kZV9tb2R1bGVzL2RlYnVnL2RlYnVnLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL3NpenpsZS9zaXp6bGUuanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luc2VydC1tb2R1bGUtZ2xvYmFscy9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMveGhyL2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL3hoci9ub2RlX21vZHVsZXMvZ2xvYmFsL3dpbmRvdy5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy94aHIvbm9kZV9tb2R1bGVzL29uY2Uvb25jZS5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL3NyYy9hcGlfcmVxdWVzdC5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL3NyYy9iYXNlLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvc3JjL2V2ZW50LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvc3JjL2V2ZW50cy5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL3NyYy90ZW1wbGF0ZXMvZXZlbnQuaGJzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvc3JjL3RlbXBsYXRlcy9ldmVudHMuaGJzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvc3JjL3Rlc3QuaGJzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7OztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBOzs7Ozs7OztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOzs7Ozs7OztBQ0FBOztBQ0FBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0FBOzs7Ozs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5ckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDejZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1a0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgTk9fT1AgPSBmdW5jdGlvbigpe307XG5cbnZhciBFdmVudCA9IHJlcXVpcmUoJy4vc3JjL2V2ZW50LmpzJyk7XG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9zcmMvZXZlbnRzLmpzJyk7XG52YXIgYXBpUmVxdWVzdCA9IHJlcXVpcmUoJy4vc3JjL2FwaV9yZXF1ZXN0LmpzJyk7XG5cbnZhciBVbml2ZXJzZSA9IGZ1bmN0aW9uKCBjb25maWcgKXtcblx0aWYoICFjb25maWcua2V5ICl7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdrZXkgbXVzdCBiZSBzcGVjaWZpZWQgd2hlbiBpbnN0YW50aWF0aW5nIGEgVW5pdmVyc2UnKTtcblx0fVxuXHR0aGlzLmtleSA9IGNvbmZpZy5rZXk7XG5cdHRoaXMubG9nZ2VkX2luID0gbnVsbDtcblx0dGhpcy5jdXN0b21lciA9IG51bGw7XG5cdHRoaXMuZmFuY2x1YiA9IG51bGw7XG5cdHRoaXMuYWNjb3VudF9yZXF1ZXN0X2NvbXBsZXRlID0gZmFsc2U7XG5cdHRoaXMuZmFuY2x1Yl9yZXF1ZXN0X2NvbXBsZXRlID0gZmFsc2U7XG5cdHRoaXMucXVldWVkX3dpZGdldHMgPSBbXTtcblxuXHR2YXIgZmFuY2x1YiA9IHRoaXM7XG5cblx0Ly8gYXR0ZW1wdCB0byBydW4gZmFuY2x1Yi5pbml0aWFsaXplXG5cdHZhciBhdHRlbXB0SW5pdCA9IGZ1bmN0aW9uKCl7XG5cdFx0aWYoIGZhbmNsdWIuYWNjb3VudF9yZXF1ZXN0X2NvbXBsZXRlICYmIGZhbmNsdWIuZmFuY2x1Yl9yZXF1ZXN0X2NvbXBsZXRlICl7XG5cdFx0XHRmYW5jbHViLmluaXRpYWxpemUoKTtcblx0XHR9XG5cdH07XG5cblx0Ly8gQ2hlY2sgbG9naW4gc3RhdHVzLCBzbyB3ZSBjYW4gc2hvcnQtY2lyY3VpdCBvdGhlciBBUEkgcmVxdWVzdHMgaWYgbG9nZ2VkIG91dFxuXHRhcGlSZXF1ZXN0KCAnYWNjb3VudC9zdGF0dXMnLCB0aGlzLmtleSwgeyBqc29ucDogdHJ1ZSB9LCBmdW5jdGlvbiggZXJyLCByZXNwb25zZSApe1xuXHRcdHRoaXMubG9nZ2VkX2luID0gcmVzcG9uc2UubG9nZ2VkX2luO1xuXHRcdC8vIFJlcXVlc3QgZnVsbCBhY2NvdW50IG9iamVjdCBmcm9tIEFQSSBpZiB1c2VyIGlzIGxvZ2dlZCBpblxuXHRcdGlmKCB0aGlzLmxvZ2dlZF9pbiApe1xuXHRcdFx0YXBpUmVxdWVzdCggJ2FjY291bnQnLCB0aGlzLmtleSwgZnVuY3Rpb24oIGVyciwgcmVzcG9uc2UgKXtcblx0XHRcdFx0ZmFuY2x1Yi5jdXN0b21lciA9IHJlc3BvbnNlID8gcmVzcG9uc2UuY3VzdG9tZXIgOiBudWxsO1xuXHRcdFx0XHRmYW5jbHViLmFjY291bnRfcmVxdWVzdF9jb21wbGV0ZSA9IHRydWU7XG5cdFx0XHRcdGF0dGVtcHRJbml0KCk7XG5cdFx0XHR9KTtcblx0XHQvLyBTa2lwIGFjY291bnQgcmVxdWVzdCBpZiB1c2VyIGlzIG5vdCBsb2dnZWQgaW5cblx0XHR9IGVsc2Uge1x0XHRcdFxuXHRcdFx0ZmFuY2x1Yi5hY2NvdW50X3JlcXVlc3RfY29tcGxldGUgPSB0cnVlO1xuXHRcdFx0YXR0ZW1wdEluaXQoKTtcblx0XHR9XG5cdH0pO1xuXG5cdC8vIEZldGNoIGluaXRpYWwgRmFuY2x1YiBkYXRhIGZyb20gQVBJXG5cdGFwaVJlcXVlc3QoICdmYW5jbHViJywgdGhpcy5rZXksIGZ1bmN0aW9uKCBlcnIsIHJlc3BvbnNlICl7XG5cdFx0ZmFuY2x1Yi5mYW5jbHViID0gcmVzcG9uc2UgPyByZXNwb25zZS5mYW5jbHViIDogbnVsbDtcblx0XHRmYW5jbHViLmZhbmNsdWJfcmVxdWVzdF9jb21wbGV0ZSA9IHRydWU7XG5cdFx0YXR0ZW1wdEluaXQoKTtcblx0fSk7XG59O1xuXG5Vbml2ZXJzZS5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKCl7XG5cdGNvbnNvbGUubG9nKCdpbml0aWFsaXplIGZhbmNsdWIhJywgdGhpcyk7XG5cdHRoaXMucXVldWVkV2lkZ2V0cygpO1xufTtcblxuLy8gaW5pdGlhbGl6ZSBhIHdpZGdldFxuVW5pdmVyc2UucHJvdG90eXBlLndpZGdldCA9IGZ1bmN0aW9uKCBuYW1lLCBvcHRpb25zICl7XG5cdC8vIGlmIHRoZSBhY2NvdW50IG9yIGZhbmNsdWIgcmVxdWVzdHMgYXJlIHN0aWxsIHBlbmRpbmcsIHF1ZXVlIHRoaXMgZm9yIGxhdGVyXG5cdGlmKCAhKCB0aGlzLmFjY291bnRfcmVxdWVzdF9jb21wbGV0ZSAmJiB0aGlzLmZhbmNsdWJfcmVxdWVzdF9jb21wbGV0ZSApICl7XG5cdFx0dGhpcy5xdWV1ZWRfd2lkZ2V0cy5wdXNoKCBbbmFtZSxvcHRpb25zXSApO1xuXHRcdHJldHVybjtcblx0fVxuXHRvcHRpb25zLmtleSA9IHRoaXMua2V5O1xuXHRzd2l0Y2goIG5hbWUgKXtcblx0Y2FzZSAnZXZlbnQnOlxuXHRcdG5ldyBFdmVudCggb3B0aW9ucyApO1xuXHRicmVhaztcblx0Y2FzZSAnZXZlbnRzJzpcblx0XHRuZXcgRXZlbnRzKCBvcHRpb25zICk7XG5cdGJyZWFrO1xuXHR9XG59O1xuXG4vLyBsb29wIHRocm91Z2ggcXVldWVkIHdpZGdldCBpbml0aWFsaXphaXRvbnMgYW5kIGluaXRpYWxpemUgdGhlbSBhbGxcblVuaXZlcnNlLnByb3RvdHlwZS5xdWV1ZWRXaWRnZXRzID0gZnVuY3Rpb24oKXtcblx0Zm9yKCB2YXIgaSA9IHRoaXMucXVldWVkX3dpZGdldHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKXtcblx0XHR0aGlzLndpZGdldC5hcHBseSggdGhpcywgdGhpcy5xdWV1ZWRfd2lkZ2V0c1tpXSApO1xuXHR9XG5cdHRoaXMucXVldWVkX3dpZGdldHMgPSBbXTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVW5pdmVyc2U7IiwiLyohXG4gICogZG9tcmVhZHkgKGMpIER1c3RpbiBEaWF6IDIwMTQgLSBMaWNlbnNlIE1JVFxuICAqL1xuIWZ1bmN0aW9uIChuYW1lLCBkZWZpbml0aW9uKSB7XG5cbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcpIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpXG4gIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PSAnb2JqZWN0JykgZGVmaW5lKGRlZmluaXRpb24pXG4gIGVsc2UgdGhpc1tuYW1lXSA9IGRlZmluaXRpb24oKVxuXG59KCdkb21yZWFkeScsIGZ1bmN0aW9uICgpIHtcblxuICB2YXIgZm5zID0gW10sIGxpc3RlbmVyXG4gICAgLCBkb2MgPSBkb2N1bWVudFxuICAgICwgZG9tQ29udGVudExvYWRlZCA9ICdET01Db250ZW50TG9hZGVkJ1xuICAgICwgbG9hZGVkID0gL15sb2FkZWR8XmMvLnRlc3QoZG9jLnJlYWR5U3RhdGUpXG5cbiAgZnVuY3Rpb24gZmx1c2ggKGZuKSB7XG4gICAgbG9hZGVkID0gMVxuICAgIHdoaWxlIChmbiA9IGZucy5zaGlmdCgpKSBmbigpXG4gIH1cblxuICBkb2MuYWRkRXZlbnRMaXN0ZW5lcihkb21Db250ZW50TG9hZGVkLCBsaXN0ZW5lciA9IGZ1bmN0aW9uICgpIHtcbiAgICBkb2MucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb21Db250ZW50TG9hZGVkLCBsaXN0ZW5lcilcbiAgICBmbHVzaCgpXG4gIH0pXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChmbikge1xuICAgIGxvYWRlZCA/IGZuKCkgOiBmbnMucHVzaChmbilcbiAgfVxuXG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0cykge1xuICByZXR1cm4gbmV3IEVsZW1lbnRDbGFzcyhvcHRzKVxufVxuXG5mdW5jdGlvbiBFbGVtZW50Q2xhc3Mob3B0cykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRWxlbWVudENsYXNzKSkgcmV0dXJuIG5ldyBFbGVtZW50Q2xhc3Mob3B0cylcbiAgdmFyIHNlbGYgPSB0aGlzXG4gIGlmICghb3B0cykgb3B0cyA9IHt9XG4gIGlmIChvcHRzIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIG9wdHMgPSB7ZWw6IG9wdHN9XG4gIHRoaXMub3B0cyA9IG9wdHNcbiAgdGhpcy5lbCA9IG9wdHMuZWwgfHwgZG9jdW1lbnQuYm9keVxuICBpZiAodHlwZW9mIHRoaXMuZWwgIT09ICdvYmplY3QnKSB0aGlzLmVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLmVsKVxufVxuXG5FbGVtZW50Q2xhc3MucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICB2YXIgZWwgPSB0aGlzLmVsXG4gIGlmICghZWwpIHJldHVyblxuICBpZiAoZWwuY2xhc3NOYW1lID09PSBcIlwiKSByZXR1cm4gZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lXG4gIHZhciBjbGFzc2VzID0gZWwuY2xhc3NOYW1lLnNwbGl0KCcgJylcbiAgaWYgKGNsYXNzZXMuaW5kZXhPZihjbGFzc05hbWUpID4gLTEpIHJldHVybiBjbGFzc2VzXG4gIGNsYXNzZXMucHVzaChjbGFzc05hbWUpXG4gIGVsLmNsYXNzTmFtZSA9IGNsYXNzZXMuam9pbignICcpXG4gIHJldHVybiBjbGFzc2VzXG59XG5cbkVsZW1lbnRDbGFzcy5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gIHZhciBlbCA9IHRoaXMuZWxcbiAgaWYgKCFlbCkgcmV0dXJuXG4gIGlmIChlbC5jbGFzc05hbWUgPT09IFwiXCIpIHJldHVyblxuICB2YXIgY2xhc3NlcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpXG4gIHZhciBpZHggPSBjbGFzc2VzLmluZGV4T2YoY2xhc3NOYW1lKVxuICBpZiAoaWR4ID4gLTEpIGNsYXNzZXMuc3BsaWNlKGlkeCwgMSlcbiAgZWwuY2xhc3NOYW1lID0gY2xhc3Nlcy5qb2luKCcgJylcbiAgcmV0dXJuIGNsYXNzZXNcbn1cblxuRWxlbWVudENsYXNzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihjbGFzc05hbWUpIHtcbiAgdmFyIGVsID0gdGhpcy5lbFxuICBpZiAoIWVsKSByZXR1cm5cbiAgdmFyIGNsYXNzZXMgPSBlbC5jbGFzc05hbWUuc3BsaXQoJyAnKVxuICByZXR1cm4gY2xhc3Nlcy5pbmRleE9mKGNsYXNzTmFtZSkgPiAtMVxufVxuIiwidmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KG9iaikge1xuXHRpZiAoIW9iaiB8fCB0b1N0cmluZy5jYWxsKG9iaikgIT09ICdbb2JqZWN0IE9iamVjdF0nIHx8IG9iai5ub2RlVHlwZSB8fCBvYmouc2V0SW50ZXJ2YWwpXG5cdFx0cmV0dXJuIGZhbHNlO1xuXG5cdHZhciBoYXNfb3duX2NvbnN0cnVjdG9yID0gaGFzT3duLmNhbGwob2JqLCAnY29uc3RydWN0b3InKTtcblx0dmFyIGhhc19pc19wcm9wZXJ0eV9vZl9tZXRob2QgPSBoYXNPd24uY2FsbChvYmouY29uc3RydWN0b3IucHJvdG90eXBlLCAnaXNQcm90b3R5cGVPZicpO1xuXHQvLyBOb3Qgb3duIGNvbnN0cnVjdG9yIHByb3BlcnR5IG11c3QgYmUgT2JqZWN0XG5cdGlmIChvYmouY29uc3RydWN0b3IgJiYgIWhhc19vd25fY29uc3RydWN0b3IgJiYgIWhhc19pc19wcm9wZXJ0eV9vZl9tZXRob2QpXG5cdFx0cmV0dXJuIGZhbHNlO1xuXG5cdC8vIE93biBwcm9wZXJ0aWVzIGFyZSBlbnVtZXJhdGVkIGZpcnN0bHksIHNvIHRvIHNwZWVkIHVwLFxuXHQvLyBpZiBsYXN0IG9uZSBpcyBvd24sIHRoZW4gYWxsIHByb3BlcnRpZXMgYXJlIG93bi5cblx0dmFyIGtleTtcblx0Zm9yICgga2V5IGluIG9iaiApIHt9XG5cblx0cmV0dXJuIGtleSA9PT0gdW5kZWZpbmVkIHx8IGhhc093bi5jYWxsKCBvYmosIGtleSApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBleHRlbmQoKSB7XG5cdHZhciBvcHRpb25zLCBuYW1lLCBzcmMsIGNvcHksIGNvcHlJc0FycmF5LCBjbG9uZSxcblx0ICAgIHRhcmdldCA9IGFyZ3VtZW50c1swXSB8fCB7fSxcblx0ICAgIGkgPSAxLFxuXHQgICAgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aCxcblx0ICAgIGRlZXAgPSBmYWxzZTtcblxuXHQvLyBIYW5kbGUgYSBkZWVwIGNvcHkgc2l0dWF0aW9uXG5cdGlmICggdHlwZW9mIHRhcmdldCA9PT0gXCJib29sZWFuXCIgKSB7XG5cdFx0ZGVlcCA9IHRhcmdldDtcblx0XHR0YXJnZXQgPSBhcmd1bWVudHNbMV0gfHwge307XG5cdFx0Ly8gc2tpcCB0aGUgYm9vbGVhbiBhbmQgdGhlIHRhcmdldFxuXHRcdGkgPSAyO1xuXHR9XG5cblx0Ly8gSGFuZGxlIGNhc2Ugd2hlbiB0YXJnZXQgaXMgYSBzdHJpbmcgb3Igc29tZXRoaW5nIChwb3NzaWJsZSBpbiBkZWVwIGNvcHkpXG5cdGlmICggdHlwZW9mIHRhcmdldCAhPT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgdGFyZ2V0ICE9PSBcImZ1bmN0aW9uXCIpIHtcblx0XHR0YXJnZXQgPSB7fTtcblx0fVxuXG5cdGZvciAoIDsgaSA8IGxlbmd0aDsgaSsrICkge1xuXHRcdC8vIE9ubHkgZGVhbCB3aXRoIG5vbi1udWxsL3VuZGVmaW5lZCB2YWx1ZXNcblx0XHRpZiAoIChvcHRpb25zID0gYXJndW1lbnRzWyBpIF0pICE9IG51bGwgKSB7XG5cdFx0XHQvLyBFeHRlbmQgdGhlIGJhc2Ugb2JqZWN0XG5cdFx0XHRmb3IgKCBuYW1lIGluIG9wdGlvbnMgKSB7XG5cdFx0XHRcdHNyYyA9IHRhcmdldFsgbmFtZSBdO1xuXHRcdFx0XHRjb3B5ID0gb3B0aW9uc1sgbmFtZSBdO1xuXG5cdFx0XHRcdC8vIFByZXZlbnQgbmV2ZXItZW5kaW5nIGxvb3Bcblx0XHRcdFx0aWYgKCB0YXJnZXQgPT09IGNvcHkgKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBSZWN1cnNlIGlmIHdlJ3JlIG1lcmdpbmcgcGxhaW4gb2JqZWN0cyBvciBhcnJheXNcblx0XHRcdFx0aWYgKCBkZWVwICYmIGNvcHkgJiYgKCBpc1BsYWluT2JqZWN0KGNvcHkpIHx8IChjb3B5SXNBcnJheSA9IEFycmF5LmlzQXJyYXkoY29weSkpICkgKSB7XG5cdFx0XHRcdFx0aWYgKCBjb3B5SXNBcnJheSApIHtcblx0XHRcdFx0XHRcdGNvcHlJc0FycmF5ID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRjbG9uZSA9IHNyYyAmJiBBcnJheS5pc0FycmF5KHNyYykgPyBzcmMgOiBbXTtcblxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRjbG9uZSA9IHNyYyAmJiBpc1BsYWluT2JqZWN0KHNyYykgPyBzcmMgOiB7fTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBOZXZlciBtb3ZlIG9yaWdpbmFsIG9iamVjdHMsIGNsb25lIHRoZW1cblx0XHRcdFx0XHR0YXJnZXRbIG5hbWUgXSA9IGV4dGVuZCggZGVlcCwgY2xvbmUsIGNvcHkgKTtcblxuXHRcdFx0XHQvLyBEb24ndCBicmluZyBpbiB1bmRlZmluZWQgdmFsdWVzXG5cdFx0XHRcdH0gZWxzZSBpZiAoIGNvcHkgIT09IHVuZGVmaW5lZCApIHtcblx0XHRcdFx0XHR0YXJnZXRbIG5hbWUgXSA9IGNvcHk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvLyBSZXR1cm4gdGhlIG1vZGlmaWVkIG9iamVjdFxuXHRyZXR1cm4gdGFyZ2V0O1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWInKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCl7XG5cdHZhciBudW1iZXJzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMCwgLTEgKTtcblx0dmFyIHJlc3VsdCA9IDA7XG5cdGZvciggdmFyIGkgPSBudW1iZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICl7XG5cdFx0cmVzdWx0ICs9IHBhcnNlRmxvYXQoIG51bWJlcnNbaV0sIDEwICkgfHwgMDtcblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufTsiLCIvLyBNb2RpZmllZCBmb3JtIG9mIGB0aW1lYWdvYCBoZWxwZXIgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vYXNzZW1ibGUvaGFuZGxlYmFycy1oZWxwZXJzXG5cbnZhciBuZXdEYXRlID0gcmVxdWlyZSgnbmV3LWRhdGUnKTtcblxudmFyIFlFQVIgPSA2MCAqIDYwICogMjQgKiAzNjU7XG52YXIgTU9OVEggPSA2MCAqIDYwICogMjQgKiAzMDtcbnZhciBEQVkgPSA2MCAqIDYwICogMjQ7XG52YXIgSE9VUiA9IDYwICogNjA7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIGRhdGUgKXtcblx0ZGF0ZSA9IG5ld0RhdGUoIGRhdGUgKTtcblx0dmFyIHNlY29uZHMgPSBNYXRoLmZsb29yKCAoIG5ldyBEYXRlKCkgLSBkYXRlICkgLyAxMDAwICk7XG5cdHZhciBpbnRlcnZhbCA9IE1hdGguZmxvb3IoIHNlY29uZHMgLyBZRUFSICk7XG5cdGlmKCBpbnRlcnZhbCA+IDEgKSByZXR1cm4gaW50ZXJ2YWwgKycgeWVhcnMgYWdvJztcblx0aW50ZXJ2YWwgPSBNYXRoLmZsb29yKCBzZWNvbmRzIC8gTU9OVEggKTtcblx0aWYoIGludGVydmFsID4gMSApIHJldHVybiBpbnRlcnZhbCArJyBtb250aHMgYWdvJztcblx0aW50ZXJ2YWwgPSBNYXRoLmZsb29yKCBzZWNvbmRzIC8gREFZICk7XG5cdGlmKCBpbnRlcnZhbCA+IDEgKSByZXR1cm4gaW50ZXJ2YWwgKycgZGF5cyBhZ28nO1xuXHRpbnRlcnZhbCA9IE1hdGguZmxvb3IoIHNlY29uZHMgLyBIT1VSICk7XG5cdGlmKCBpbnRlcnZhbCA+IDEgKSByZXR1cm4gaW50ZXJ2YWwgKycgaG91cnMgYWdvJztcblx0aW50ZXJ2YWwgPSBNYXRoLmZsb29yKCBzZWNvbmRzIC8gNjAgKTtcblx0aWYoIGludGVydmFsID4gMSApIHJldHVybiBpbnRlcnZhbCArJyBtaW51dGVzIGFnbyc7XG5cdGlmKCBNYXRoLmZsb29yKCBzZWNvbmRzICkgPD0gMSApIHJldHVybiAnSnVzdCBub3cnO1xuXHRlbHNlIHJldHVybiBNYXRoLmZsb29yKCBzZWNvbmRzICkgKycgc2Vjb25kcyBhZ28nO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBjb2xsZWN0aW9uLCBzdGFydCwgZW5kLCBvcHRpb25zICl7XG5cdG9wdGlvbnMgPSBvcHRpb25zIHx8IGVuZDtcblx0aWYoIHR5cGVvZiBzdGFydCAhPT0gJ251bWJlcicgKSByZXR1cm47XG5cdGVuZCA9ICggdHlwZW9mIGVuZCAhPT0gJ251bWJlcicgKSA/IGNvbGxlY3Rpb24ubGVuZ3RoIDogKCBlbmQgPiAwICk/IGVuZCArIDEgOiBlbmQ7XG5cdGNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uLnNsaWNlKCBzdGFydCwgZW5kICk7XG5cdHZhciByZXN1bHQgPSAnJztcblx0Zm9yKCB2YXIgaSA9IDA7IGkgPCBjb2xsZWN0aW9uLmxlbmd0aDsgaSsrICl7XG5cdFx0cmVzdWx0ICs9IG9wdGlvbnMuZm4oIGNvbGxlY3Rpb25baV0gKTtcblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBjb2xsZWN0aW9uLCBpdGVtLCBvcHRpb25zICl7XG5cdC8vIHN0cmluZyBjaGVja1xuXHRpZiggdHlwZW9mIGNvbGxlY3Rpb24gPT09ICdzdHJpbmcnICl7XG5cdFx0aWYoIGNvbGxlY3Rpb24uc2VhcmNoKCBpdGVtICkgPj0gMCApe1xuXHRcdFx0cmV0dXJuIG9wdGlvbnMuZm4odGhpcyk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIG9wdGlvbnMuaW52ZXJzZSh0aGlzKTtcblx0XHR9XG5cdH1cblx0Ly8gXCJjb2xsZWN0aW9uXCIgY2hlY2sgKG9iamVjdHMgJiBhcnJheXMpXG5cdGZvciggdmFyIHByb3AgaW4gY29sbGVjdGlvbiApe1xuXHRcdGlmKCBjb2xsZWN0aW9uLmhhc093blByb3BlcnR5KCBwcm9wICkgKXtcblx0XHRcdGlmKCBjb2xsZWN0aW9uW3Byb3BdID09IGl0ZW0gKSByZXR1cm4gb3B0aW9ucy5mbih0aGlzKTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIG9wdGlvbnMuaW52ZXJzZSh0aGlzKTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpe1xuXHR2YXIgbnVtYmVycyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKCBhcmd1bWVudHMsIDEsIC0xICk7XG5cdHZhciByZXN1bHQgPSBhcmd1bWVudHNbMF07XG5cdGZvciggdmFyIGkgPSBudW1iZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICl7XG5cdFx0cmVzdWx0IC89IHBhcnNlRmxvYXQoIG51bWJlcnNbaV0sIDEwICkgfHwgMDtcblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBzdHJpbmcgKXtcblx0cmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudCggc3RyaW5nICk7XHRcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggbGVmdCwgcmlnaHQsIGV4YWN0LCBvcHRpb25zICl7XG5cdG9wdGlvbnMgPSBvcHRpb25zIHx8IGV4YWN0O1xuXHRleGFjdCA9ICggZXhhY3QgPT09ICdleGFjdCcgKSA/IHRydWUgOiBmYWxzZTtcblx0dmFyIGlzX2VxdWFsID0gZXhhY3QgPyAoIGxlZnQgPT09IHJpZ2h0ICkgOiAoIGxlZnQgPT0gcmlnaHQgKTtcblx0aWYoIGlzX2VxdWFsICkgcmV0dXJuIG9wdGlvbnMuZm4odGhpcyk7XG5cdHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIGNvbGxlY3Rpb24sIGNvdW50LCBvcHRpb25zICl7XG5cdG9wdGlvbnMgPSBvcHRpb25zIHx8IGNvdW50O1xuXHRjb3VudCA9ICggdHlwZW9mIGNvdW50ID09PSAnbnVtYmVyJyApID8gY291bnQgOiAxO1xuXHR2YXIgcmVzdWx0ID0gJyc7XG5cdHZhciBpID0gMDtcblx0Zm9yKCB2YXIga2V5IGluIGNvbGxlY3Rpb24gKXtcblx0XHRpZiggY29sbGVjdGlvbi5oYXNPd25Qcm9wZXJ0eSgga2V5ICkgKXtcblx0XHRcdHJlc3VsdCArPSBvcHRpb25zLmZuKCBjb2xsZWN0aW9uW2tleV0gKTtcblx0XHRcdGkrKztcblx0XHRcdGlmKCBpID09IGNvdW50ICkgYnJlYWs7XG5cdFx0fVxuXHR9XG5cdHJldHVybiByZXN1bHQ7XG59OyIsInZhciBzdHJmdGltZVRaID0gcmVxdWlyZSgnc3RyZnRpbWUnKS5zdHJmdGltZVRaO1xudmFyIG5ld0RhdGUgPSByZXF1aXJlKCduZXctZGF0ZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBkYXRlX3N0cmluZywgZm9ybWF0LCBvZmZzZXQgKXtcblx0b2Zmc2V0ID0gKCB0eXBlb2Ygb2Zmc2V0ID09PSAnbnVtYmVyJyApID8gb2Zmc2V0IDogbnVsbDtcblx0dmFyIGRhdGUgPSBuZXdEYXRlKCBkYXRlX3N0cmluZyApO1xuXHRyZXR1cm4gc3RyZnRpbWVUWiggZm9ybWF0LCBkYXRlLCBvZmZzZXQgKTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggbGVmdCwgcmlnaHQsIGVxdWFsLCBvcHRpb25zICl7XG5cdG9wdGlvbnMgPSBvcHRpb25zIHx8IGVxdWFsO1xuXHRlcXVhbCA9ICggZXF1YWwgPT09ICdlcXVhbCcgKSA/IHRydWUgOiBmYWxzZTtcblx0dmFyIGlzX2dyZWF0ZXIgPSBlcXVhbCA/ICggbGVmdCA+PSByaWdodCApIDogKCBsZWZ0ID4gcmlnaHQgKTtcblx0aWYoIGlzX2dyZWF0ZXIgKSByZXR1cm4gb3B0aW9ucy5mbiggdGhpcyApO1xuXHRyZXR1cm4gb3B0aW9ucy5pbnZlcnNlKCB0aGlzICk7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIGNvbGxlY3Rpb24sIHNlcGFyYXRvciApe1xuXHRzZXBhcmF0b3IgPSAoIHR5cGVvZiBzZXBhcmF0b3IgPT09ICdzdHJpbmcnICkgPyBzZXBhcmF0b3IgOiAnJztcblx0Ly8gaWYgdGhlIGNvbGxlY3RvaW4gaXMgYW4gYXJyYXkgdGhpcyBpcyBlYXN5XG5cdGlmKCBjb2xsZWN0aW9uLmpvaW4gKSByZXR1cm4gY29sbGVjdGlvbi5qb2luKCBzZXBhcmF0b3IgKTtcblx0Ly8gaWYgaXQncyBub3Qgd2UgYWN0dWFsbHkgaGF2ZSB0byB3cml0ZSBjb2RlLlxuXHR2YXIgcmVzdWx0ID0gJyc7XG5cdGZvciggdmFyIHByb3BlcnR5IGluIGNvbGxlY3Rpb24gKXtcblx0XHRpZiggY29sbGVjdGlvbi5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSkgKXtcblx0XHRcdHJlc3VsdCArPSBjb2xsZWN0aW9uW3Byb3BlcnR5XSArIHNlcGFyYXRvcjtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHJlc3VsdC5zbGljZSggMCwgLXNlcGFyYXRvci5sZW5ndGggKTtcbn07IiwidmFyIF9pc0FycmF5ID0gcmVxdWlyZSgnbG9kYXNoLmlzYXJyYXknKTtcbnZhciBfcmVkdWNlID0gcmVxdWlyZSgnbG9kYXNoLnJlZHVjZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBjb2xsZWN0aW9uLCBjb3VudCwgb3B0aW9ucyApe1xuXHRvcHRpb25zID0gb3B0aW9ucyB8fCBjb3VudDtcblx0Y291bnQgPSAoIHR5cGVvZiBjb3VudCA9PT0gJ251bWJlcicgKSA/IGNvdW50IDogMTtcblx0Ly8gaWYgY29sbGVjdGlvbiBpcyBhbiBvYmplY3QsIG1ha2UgaXQgYW4gYXJyYXlcblx0Ly8gb3RoZXJ3aXNlIHdlIGhhdmUgbm8gd2F5IHRvIGNsaXAgb2ZmIHRoZSBcImVuZFwiXG5cdGlmKCAhX2lzQXJyYXkoIGNvbGxlY3Rpb24gKSApe1xuXHRcdHZhciBjb2xsZWN0aW9uX2FycmF5ID0gW107XG5cdFx0Zm9yKCB2YXIga2V5IGluIGNvbGxlY3Rpb24gKXtcblx0XHRcdGlmKCBjb2xsZWN0aW9uLmhhc093blByb3BlcnR5KCBrZXkgKSApe1xuXHRcdFx0XHRjb2xsZWN0aW9uX2FycmF5LnB1c2goIGNvbGxlY3Rpb25ba2V5XSApO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRjb2xsZWN0aW9uID0gY29sbGVjdGlvbl9hcnJheTtcblx0fVxuXHR2YXIgY29sbGVjdGlvbl9sYXN0ID0gY29sbGVjdGlvbi5zbGljZSggLTEgKiBjb3VudCApO1xuXHR2YXIgcmVzdWx0ID0gX3JlZHVjZSggY29sbGVjdGlvbl9sYXN0LCBmdW5jdGlvbiggcHJldmlvdXMsIGN1cnJlbnQgKXtcblx0XHRyZXR1cm4gcHJldmlvdXMgKyBvcHRpb25zLmZuKCBjdXJyZW50ICk7XG5cdH0sICcnICk7XG5cdHJldHVybiByZXN1bHQ7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIGNvbGxlY3Rpb24gKXtcblx0aWYoIGNvbGxlY3Rpb24ubGVuZ3RoICkgcmV0dXJuIGNvbGxlY3Rpb24ubGVuZ3RoO1xuXHR2YXIgbGVuZ3RoID0gMDtcblx0Zm9yKCB2YXIgcHJvcCBpbiBjb2xsZWN0aW9uICl7XG5cdFx0aWYoIGNvbGxlY3Rpb24uaGFzT3duUHJvcGVydHkoIHByb3AgKSApe1xuXHRcdFx0bGVuZ3RoKys7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBsZW5ndGg7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIGxlZnQsIHJpZ2h0LCBlcXVhbCwgb3B0aW9ucyApe1xuXHRvcHRpb25zID0gb3B0aW9ucyB8fCBlcXVhbDtcblx0ZXF1YWwgPSAoIGVxdWFsID09PSAnZXF1YWwnICkgPyB0cnVlIDogZmFsc2U7XG5cdHZhciBpc19ncmVhdGVyID0gZXF1YWwgPyAoIGxlZnQgPD0gcmlnaHQgKSA6ICggbGVmdCA8IHJpZ2h0ICk7XG5cdGlmKCBpc19ncmVhdGVyICkgcmV0dXJuIG9wdGlvbnMuZm4oIHRoaXMgKTtcblx0cmV0dXJuIG9wdGlvbnMuaW52ZXJzZSggdGhpcyApO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBzdHJpbmcgKXtcblx0cmV0dXJuICggc3RyaW5nIHx8ICcnICkudG9Mb3dlckNhc2UoKTtcdFxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCl7XG5cdHZhciBudW1iZXJzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMSwgLTEgKTtcblx0dmFyIHJlc3VsdCA9IGFyZ3VtZW50c1swXTtcblx0Zm9yKCB2YXIgaSA9IG51bWJlcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKXtcblx0XHRyZXN1bHQgKj0gcGFyc2VGbG9hdCggbnVtYmVyc1tpXSwgMTAgKSB8fCAwO1xuXHR9XG5cdHJldHVybiByZXN1bHQ7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIGNvbGxlY3Rpb24sIHN0YXJ0LCBhbW91bnQsIG9wdGlvbnMgKXtcblx0b3B0aW9ucyA9IG9wdGlvbnMgfHwgYW1vdW50O1xuXHRpZiggdHlwZW9mIHN0YXJ0ICE9PSAnbnVtYmVyJyApIHJldHVybjtcblx0dmFyIGVuZCA9ICggdHlwZW9mIGFtb3VudCAhPT0gJ251bWJlcicgKSA/IGNvbGxlY3Rpb24ubGVuZ3RoIDogc3RhcnQgKyBhbW91bnQ7XG5cdGNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uLnNsaWNlKCBzdGFydCwgZW5kICk7XG5cdHZhciByZXN1bHQgPSAnJztcblx0Zm9yKCB2YXIgaSA9IDA7IGkgPCBjb2xsZWN0aW9uLmxlbmd0aDsgaSsrICl7XG5cdFx0cmVzdWx0ICs9IG9wdGlvbnMuZm4oIGNvbGxlY3Rpb25baV0gKTtcblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBzdHJpbmcsIHRvX3JlcGxhY2UsIHJlcGxhY2VtZW50ICl7XG5cdHJldHVybiAoIHN0cmluZyB8fCAnJyApLnJlcGxhY2UoIHRvX3JlcGxhY2UsIHJlcGxhY2VtZW50ICk7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIGNvbGxlY3Rpb24sIG9wdGlvbnMgKXtcblx0dmFyIHJlc3VsdCA9ICcnO1xuXHRmb3IoIHZhciBpID0gY29sbGVjdGlvbi5sZW5ndGggLSAxOyBpID49IDA7IGktLSApe1xuXHRcdHJlc3VsdCArPSBvcHRpb25zLmZuKCBjb2xsZWN0aW9uW2ldICk7XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn07IiwiLy8gU2ltcGxlIHNodWZmbGluZyBtZXRob2QgYmFzZWQgb2ZmIG9mIGh0dHA6Ly9ib3N0Lm9ja3Mub3JnL21pa2Uvc2h1ZmZsZS9cbnZhciBzaHVmZmxlID0gZnVuY3Rpb24oIGFycmF5ICl7XG5cdHZhciBpID0gYXJyYXkubGVuZ3RoLCBqLCBzd2FwO1xuXHR3aGlsZSggaSApe1xuXHRcdGogPSBNYXRoLmZsb29yKCBNYXRoLnJhbmRvbSgpICogaS0tICk7XG5cdFx0c3dhcCA9IGFycmF5W2ldO1xuXHRcdGFycmF5W2ldID0gYXJyYXlbal07XG5cdFx0YXJyYXlbal0gPSBzd2FwO1xuXHR9XG5cdHJldHVybiBhcnJheTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIGNvbGxlY3Rpb24sIG9wdGlvbnMgKXtcblx0dmFyIHNodWZmbGVkID0gc2h1ZmZsZSggY29sbGVjdGlvbiApO1xuXHR2YXIgcmVzdWx0ID0gJyc7XG5cdGZvciggdmFyIGkgPSAwOyBpIDwgc2h1ZmZsZWQubGVuZ3RoOyBpKysgKXtcblx0XHRyZXN1bHQgKz0gb3B0aW9ucy5mbiggc2h1ZmZsZWRbaV0gKTtcblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCl7XG5cdHZhciBudW1iZXJzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMSwgLTEgKTtcblx0dmFyIHJlc3VsdCA9IHBhcnNlRmxvYXQoIGFyZ3VtZW50c1swXSwgMTAgKTtcblx0Zm9yKCB2YXIgaSA9IG51bWJlcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKXtcblx0XHRyZXN1bHQgLT0gcGFyc2VGbG9hdCggbnVtYmVyc1tpXSwgMTAgKSB8fCAwO1xuXHR9XG5cdHJldHVybiByZXN1bHQ7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIG51bWJlciwgemVybywgb3B0aW9ucyApe1xuXHRvcHRpb25zID0gb3B0aW9ucyB8fCB6ZXJvO1xuXHR6ZXJvID0gKCB6ZXJvID09PSAnemVybycgKSA/IHRydWUgOiBmYWxzZTtcblx0dmFyIHJlc3VsdCA9ICcnO1xuXHR2YXIgaTtcblx0aWYoIHplcm8gKXtcblx0XHRmb3IoIGkgPSAwOyBpIDwgbnVtYmVyOyBpKysgKSByZXN1bHQgKz0gb3B0aW9ucy5mbiggaSApO1xuXHR9XG5cdGVsc2Uge1xuXHRcdGZvciggaSA9IDE7IGkgPD0gbnVtYmVyOyBpKysgKSByZXN1bHQgKz0gb3B0aW9ucy5mbiggaSApO1xuXHR9XG5cdHJldHVybiByZXN1bHQ7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIHN0cmluZyApe1xuXHRyZXR1cm4gKCBzdHJpbmcgfHwgJycgKS50b1VwcGVyQ2FzZSgpO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBjb2xsZWN0aW9uLCBrZXksIHZhbHVlLCBsaW1pdCwgb3B0aW9ucyApe1xuXHRvcHRpb25zID0gb3B0aW9ucyB8fCBsaW1pdDtcblx0aWYoIHR5cGVvZiBsaW1pdCAhPT0gJ251bWJlcicgKSBsaW1pdCA9IEluZmluaXR5O1xuXHR2YXIgbWF0Y2hlcyA9IDA7XG5cdHZhciByZXN1bHQgPSAnJztcblx0Zm9yKCB2YXIgaSA9IDA7IGkgPCBjb2xsZWN0aW9uLmxlbmd0aDsgaSsrICl7XG5cdFx0aWYoIGNvbGxlY3Rpb25baV1ba2V5XSA9PT0gdmFsdWUgKXtcblx0XHRcdHJlc3VsdCArPSBvcHRpb25zLmZuKCBjb2xsZWN0aW9uW2ldICk7XG5cdFx0XHRtYXRjaGVzKys7XG5cdFx0XHRpZiggbWF0Y2hlcyA9PT0gbGltaXQgKSByZXR1cm4gcmVzdWx0O1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufTsiLCJ2YXIgaGVscGVycyA9IHtcblx0Ly8gc3RyaW5nXG5cdGxvd2VyY2FzZTogcmVxdWlyZSgnLi9oZWxwZXJzL2xvd2VyY2FzZS5qcycpLFxuXHR1cHBlcmNhc2U6IHJlcXVpcmUoJy4vaGVscGVycy91cHBlcmNhc2UuanMnKSxcblx0cmVwbGFjZTogcmVxdWlyZSgnLi9oZWxwZXJzL3JlcGxhY2UuanMnKSxcblx0ZW5jb2RlOiByZXF1aXJlKCcuL2hlbHBlcnMvZW5jb2RlLmpzJyksXG5cdC8vIGNvbGxlY3Rpb25cblx0bGVuZ3RoOiByZXF1aXJlKCcuL2hlbHBlcnMvbGVuZ3RoLmpzJyksXG5cdGNvbnRhaW5zOiByZXF1aXJlKCcuL2hlbHBlcnMvY29udGFpbnMuanMnKSxcblx0Zmlyc3Q6IHJlcXVpcmUoJy4vaGVscGVycy9maXJzdC5qcycpLFxuXHRsYXN0OiByZXF1aXJlKCcuL2hlbHBlcnMvbGFzdC5qcycpLFxuXHRiZXR3ZWVuOiByZXF1aXJlKCcuL2hlbHBlcnMvYmV0d2Vlbi5qcycpLFxuXHRyYW5nZTogcmVxdWlyZSgnLi9oZWxwZXJzL3JhbmdlLmpzJyksXG5cdHdoZXJlOiByZXF1aXJlKCcuL2hlbHBlcnMvd2hlcmUuanMnKSxcblx0c2h1ZmZsZTogcmVxdWlyZSgnLi9oZWxwZXJzL3NodWZmbGUuanMnKSxcblx0cmV2ZXJzZTogcmVxdWlyZSgnLi9oZWxwZXJzL3JldmVyc2UuanMnKSxcblx0am9pbjogcmVxdWlyZSgnLi9oZWxwZXJzL2pvaW4uanMnKSxcblx0Ly8gZGF0ZVxuXHRhZ286IHJlcXVpcmUoJy4vaGVscGVycy9hZ28uanMnKSxcblx0Zm9ybWF0RGF0ZTogcmVxdWlyZSgnLi9oZWxwZXJzL2Zvcm1hdERhdGUuanMnKSxcblx0Ly8gZXF1YWxpdHlcblx0ZXF1YWw6IHJlcXVpcmUoJy4vaGVscGVycy9lcXVhbC5qcycpLFxuXHRncmVhdGVyOiByZXF1aXJlKCcuL2hlbHBlcnMvZ3JlYXRlci5qcycpLFxuXHRsZXNzOiByZXF1aXJlKCcuL2hlbHBlcnMvbGVzcy5qcycpLFxuXHQvLyBudW1iZXJzXG5cdHRpbWVzOiByZXF1aXJlKCcuL2hlbHBlcnMvdGltZXMuanMnKSxcblx0YWRkOiByZXF1aXJlKCcuL2hlbHBlcnMvYWRkLmpzJyksXG5cdHN1YnRyYWN0OiByZXF1aXJlKCcuL2hlbHBlcnMvc3VidHJhY3QuanMnKSxcblx0bXVsdGlwbHk6IHJlcXVpcmUoJy4vaGVscGVycy9tdWx0aXBseS5qcycpLFxuXHRkaXZpZGU6IHJlcXVpcmUoJy4vaGVscGVycy9kaXZpZGUuanMnKVxufTtcblxubW9kdWxlLmV4cG9ydHMuaGVscCA9IGZ1bmN0aW9uKCBIYW5kbGViYXJzICl7XG5cdGZvciggdmFyIG5hbWUgaW4gaGVscGVycyApe1xuXHRcdEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoIG5hbWUsIGhlbHBlcnNbbmFtZV0gKTtcblx0fVxufTsiLCIvKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIGlzTmF0aXZlID0gcmVxdWlyZSgnbG9kYXNoLl9pc25hdGl2ZScpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHNob3J0Y3V0cyAqL1xudmFyIGFycmF5Q2xhc3MgPSAnW29iamVjdCBBcnJheV0nO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byByZXNvbHZlIHRoZSBpbnRlcm5hbCBbW0NsYXNzXV0gb2YgdmFsdWVzICovXG52YXIgdG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyogTmF0aXZlIG1ldGhvZCBzaG9ydGN1dHMgZm9yIG1ldGhvZHMgd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMgKi9cbnZhciBuYXRpdmVJc0FycmF5ID0gaXNOYXRpdmUobmF0aXZlSXNBcnJheSA9IEFycmF5LmlzQXJyYXkpICYmIG5hdGl2ZUlzQXJyYXk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYW4gYXJyYXkuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEB0eXBlIEZ1bmN0aW9uXG4gKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYW4gYXJyYXksIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogKGZ1bmN0aW9uKCkgeyByZXR1cm4gXy5pc0FycmF5KGFyZ3VtZW50cyk7IH0pKCk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNBcnJheShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICovXG52YXIgaXNBcnJheSA9IG5hdGl2ZUlzQXJyYXkgfHwgZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyAmJiB0eXBlb2YgdmFsdWUubGVuZ3RoID09ICdudW1iZXInICYmXG4gICAgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gYXJyYXlDbGFzcyB8fCBmYWxzZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheTtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIHJlc29sdmUgdGhlIGludGVybmFsIFtbQ2xhc3NdXSBvZiB2YWx1ZXMgKi9cbnZhciB0b1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgaWYgYSBtZXRob2QgaXMgbmF0aXZlICovXG52YXIgcmVOYXRpdmUgPSBSZWdFeHAoJ14nICtcbiAgU3RyaW5nKHRvU3RyaW5nKVxuICAgIC5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgJ1xcXFwkJicpXG4gICAgLnJlcGxhY2UoL3RvU3RyaW5nfCBmb3IgW15cXF1dKy9nLCAnLio/JykgKyAnJCdcbik7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBuYXRpdmUgZnVuY3Rpb24uXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzTmF0aXZlKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJyAmJiByZU5hdGl2ZS50ZXN0KHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc05hdGl2ZTtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgY3JlYXRlQ2FsbGJhY2sgPSByZXF1aXJlKCdsb2Rhc2guY3JlYXRlY2FsbGJhY2snKSxcbiAgICBmb3JPd24gPSByZXF1aXJlKCdsb2Rhc2guZm9yb3duJyk7XG5cbi8qKlxuICogUmVkdWNlcyBhIGNvbGxlY3Rpb24gdG8gYSB2YWx1ZSB3aGljaCBpcyB0aGUgYWNjdW11bGF0ZWQgcmVzdWx0IG9mIHJ1bm5pbmdcbiAqIGVhY2ggZWxlbWVudCBpbiB0aGUgY29sbGVjdGlvbiB0aHJvdWdoIHRoZSBjYWxsYmFjaywgd2hlcmUgZWFjaCBzdWNjZXNzaXZlXG4gKiBjYWxsYmFjayBleGVjdXRpb24gY29uc3VtZXMgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgcHJldmlvdXMgZXhlY3V0aW9uLiBJZlxuICogYGFjY3VtdWxhdG9yYCBpcyBub3QgcHJvdmlkZWQgdGhlIGZpcnN0IGVsZW1lbnQgb2YgdGhlIGNvbGxlY3Rpb24gd2lsbCBiZVxuICogdXNlZCBhcyB0aGUgaW5pdGlhbCBgYWNjdW11bGF0b3JgIHZhbHVlLiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgXG4gKiBhbmQgaW52b2tlZCB3aXRoIGZvdXIgYXJndW1lbnRzOyAoYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleHxrZXksIGNvbGxlY3Rpb24pLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAYWxpYXMgZm9sZGwsIGluamVjdFxuICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gKiBAcGFyYW0geyp9IFthY2N1bXVsYXRvcl0gSW5pdGlhbCB2YWx1ZSBvZiB0aGUgYWNjdW11bGF0b3IuXG4gKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBhY2N1bXVsYXRlZCB2YWx1ZS5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIHN1bSA9IF8ucmVkdWNlKFsxLCAyLCAzXSwgZnVuY3Rpb24oc3VtLCBudW0pIHtcbiAqICAgcmV0dXJuIHN1bSArIG51bTtcbiAqIH0pO1xuICogLy8gPT4gNlxuICpcbiAqIHZhciBtYXBwZWQgPSBfLnJlZHVjZSh7ICdhJzogMSwgJ2InOiAyLCAnYyc6IDMgfSwgZnVuY3Rpb24ocmVzdWx0LCBudW0sIGtleSkge1xuICogICByZXN1bHRba2V5XSA9IG51bSAqIDM7XG4gKiAgIHJldHVybiByZXN1bHQ7XG4gKiB9LCB7fSk7XG4gKiAvLyA9PiB7ICdhJzogMywgJ2InOiA2LCAnYyc6IDkgfVxuICovXG5mdW5jdGlvbiByZWR1Y2UoY29sbGVjdGlvbiwgY2FsbGJhY2ssIGFjY3VtdWxhdG9yLCB0aGlzQXJnKSB7XG4gIGlmICghY29sbGVjdGlvbikgcmV0dXJuIGFjY3VtdWxhdG9yO1xuICB2YXIgbm9hY2N1bSA9IGFyZ3VtZW50cy5sZW5ndGggPCAzO1xuICBjYWxsYmFjayA9IGNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCA0KTtcblxuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24ubGVuZ3RoO1xuXG4gIGlmICh0eXBlb2YgbGVuZ3RoID09ICdudW1iZXInKSB7XG4gICAgaWYgKG5vYWNjdW0pIHtcbiAgICAgIGFjY3VtdWxhdG9yID0gY29sbGVjdGlvblsrK2luZGV4XTtcbiAgICB9XG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIGFjY3VtdWxhdG9yID0gY2FsbGJhY2soYWNjdW11bGF0b3IsIGNvbGxlY3Rpb25baW5kZXhdLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGZvck93bihjb2xsZWN0aW9uLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgIGFjY3VtdWxhdG9yID0gbm9hY2N1bVxuICAgICAgICA/IChub2FjY3VtID0gZmFsc2UsIHZhbHVlKVxuICAgICAgICA6IGNhbGxiYWNrKGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pXG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGFjY3VtdWxhdG9yO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjZTtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgYmFzZUNyZWF0ZUNhbGxiYWNrID0gcmVxdWlyZSgnbG9kYXNoLl9iYXNlY3JlYXRlY2FsbGJhY2snKSxcbiAgICBiYXNlSXNFcXVhbCA9IHJlcXVpcmUoJ2xvZGFzaC5fYmFzZWlzZXF1YWwnKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJ2xvZGFzaC5pc29iamVjdCcpLFxuICAgIGtleXMgPSByZXF1aXJlKCdsb2Rhc2gua2V5cycpLFxuICAgIHByb3BlcnR5ID0gcmVxdWlyZSgnbG9kYXNoLnByb3BlcnR5Jyk7XG5cbi8qKlxuICogUHJvZHVjZXMgYSBjYWxsYmFjayBib3VuZCB0byBhbiBvcHRpb25hbCBgdGhpc0FyZ2AuIElmIGBmdW5jYCBpcyBhIHByb3BlcnR5XG4gKiBuYW1lIHRoZSBjcmVhdGVkIGNhbGxiYWNrIHdpbGwgcmV0dXJuIHRoZSBwcm9wZXJ0eSB2YWx1ZSBmb3IgYSBnaXZlbiBlbGVtZW50LlxuICogSWYgYGZ1bmNgIGlzIGFuIG9iamVjdCB0aGUgY3JlYXRlZCBjYWxsYmFjayB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzXG4gKiB0aGF0IGNvbnRhaW4gdGhlIGVxdWl2YWxlbnQgb2JqZWN0IHByb3BlcnRpZXMsIG90aGVyd2lzZSBpdCB3aWxsIHJldHVybiBgZmFsc2VgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgVXRpbGl0aWVzXG4gKiBAcGFyYW0geyp9IFtmdW5jPWlkZW50aXR5XSBUaGUgdmFsdWUgdG8gY29udmVydCB0byBhIGNhbGxiYWNrLlxuICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIHRoZSBjcmVhdGVkIGNhbGxiYWNrLlxuICogQHBhcmFtIHtudW1iZXJ9IFthcmdDb3VudF0gVGhlIG51bWJlciBvZiBhcmd1bWVudHMgdGhlIGNhbGxiYWNrIGFjY2VwdHMuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgYSBjYWxsYmFjayBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgJ2FnZSc6IDM2IH0sXG4gKiAgIHsgJ25hbWUnOiAnZnJlZCcsICAgJ2FnZSc6IDQwIH1cbiAqIF07XG4gKlxuICogLy8gd3JhcCB0byBjcmVhdGUgY3VzdG9tIGNhbGxiYWNrIHNob3J0aGFuZHNcbiAqIF8uY3JlYXRlQ2FsbGJhY2sgPSBfLndyYXAoXy5jcmVhdGVDYWxsYmFjaywgZnVuY3Rpb24oZnVuYywgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAqICAgdmFyIG1hdGNoID0gL14oLis/KV9fKFtnbF10KSguKykkLy5leGVjKGNhbGxiYWNrKTtcbiAqICAgcmV0dXJuICFtYXRjaCA/IGZ1bmMoY2FsbGJhY2ssIHRoaXNBcmcpIDogZnVuY3Rpb24ob2JqZWN0KSB7XG4gKiAgICAgcmV0dXJuIG1hdGNoWzJdID09ICdndCcgPyBvYmplY3RbbWF0Y2hbMV1dID4gbWF0Y2hbM10gOiBvYmplY3RbbWF0Y2hbMV1dIDwgbWF0Y2hbM107XG4gKiAgIH07XG4gKiB9KTtcbiAqXG4gKiBfLmZpbHRlcihjaGFyYWN0ZXJzLCAnYWdlX19ndDM4Jyk7XG4gKiAvLyA9PiBbeyAnbmFtZSc6ICdmcmVkJywgJ2FnZSc6IDQwIH1dXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUNhbGxiYWNrKGZ1bmMsIHRoaXNBcmcsIGFyZ0NvdW50KSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIGZ1bmM7XG4gIGlmIChmdW5jID09IG51bGwgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGJhc2VDcmVhdGVDYWxsYmFjayhmdW5jLCB0aGlzQXJnLCBhcmdDb3VudCk7XG4gIH1cbiAgLy8gaGFuZGxlIFwiXy5wbHVja1wiIHN0eWxlIGNhbGxiYWNrIHNob3J0aGFuZHNcbiAgaWYgKHR5cGUgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gcHJvcGVydHkoZnVuYyk7XG4gIH1cbiAgdmFyIHByb3BzID0ga2V5cyhmdW5jKSxcbiAgICAgIGtleSA9IHByb3BzWzBdLFxuICAgICAgYSA9IGZ1bmNba2V5XTtcblxuICAvLyBoYW5kbGUgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2sgc2hvcnRoYW5kc1xuICBpZiAocHJvcHMubGVuZ3RoID09IDEgJiYgYSA9PT0gYSAmJiAhaXNPYmplY3QoYSkpIHtcbiAgICAvLyBmYXN0IHBhdGggdGhlIGNvbW1vbiBjYXNlIG9mIHByb3ZpZGluZyBhbiBvYmplY3Qgd2l0aCBhIHNpbmdsZVxuICAgIC8vIHByb3BlcnR5IGNvbnRhaW5pbmcgYSBwcmltaXRpdmUgdmFsdWVcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICB2YXIgYiA9IG9iamVjdFtrZXldO1xuICAgICAgcmV0dXJuIGEgPT09IGIgJiYgKGEgIT09IDAgfHwgKDEgLyBhID09IDEgLyBiKSk7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgdmFyIGxlbmd0aCA9IHByb3BzLmxlbmd0aCxcbiAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG5cbiAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgIGlmICghKHJlc3VsdCA9IGJhc2VJc0VxdWFsKG9iamVjdFtwcm9wc1tsZW5ndGhdXSwgZnVuY1twcm9wc1tsZW5ndGhdXSwgbnVsbCwgdHJ1ZSkpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUNhbGxiYWNrO1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBiaW5kID0gcmVxdWlyZSgnbG9kYXNoLmJpbmQnKSxcbiAgICBpZGVudGl0eSA9IHJlcXVpcmUoJ2xvZGFzaC5pZGVudGl0eScpLFxuICAgIHNldEJpbmREYXRhID0gcmVxdWlyZSgnbG9kYXNoLl9zZXRiaW5kZGF0YScpLFxuICAgIHN1cHBvcnQgPSByZXF1aXJlKCdsb2Rhc2guc3VwcG9ydCcpO1xuXG4vKiogVXNlZCB0byBkZXRlY3RlZCBuYW1lZCBmdW5jdGlvbnMgKi9cbnZhciByZUZ1bmNOYW1lID0gL15cXHMqZnVuY3Rpb25bIFxcblxcclxcdF0rXFx3LztcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGZ1bmN0aW9ucyBjb250YWluaW5nIGEgYHRoaXNgIHJlZmVyZW5jZSAqL1xudmFyIHJlVGhpcyA9IC9cXGJ0aGlzXFxiLztcblxuLyoqIE5hdGl2ZSBtZXRob2Qgc2hvcnRjdXRzICovXG52YXIgZm5Ub1N0cmluZyA9IEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZztcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5jcmVhdGVDYWxsYmFja2Agd2l0aG91dCBzdXBwb3J0IGZvciBjcmVhdGluZ1xuICogXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IFtmdW5jPWlkZW50aXR5XSBUaGUgdmFsdWUgdG8gY29udmVydCB0byBhIGNhbGxiYWNrLlxuICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIHRoZSBjcmVhdGVkIGNhbGxiYWNrLlxuICogQHBhcmFtIHtudW1iZXJ9IFthcmdDb3VudF0gVGhlIG51bWJlciBvZiBhcmd1bWVudHMgdGhlIGNhbGxiYWNrIGFjY2VwdHMuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgYSBjYWxsYmFjayBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gYmFzZUNyZWF0ZUNhbGxiYWNrKGZ1bmMsIHRoaXNBcmcsIGFyZ0NvdW50KSB7XG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGlkZW50aXR5O1xuICB9XG4gIC8vIGV4aXQgZWFybHkgZm9yIG5vIGB0aGlzQXJnYCBvciBhbHJlYWR5IGJvdW5kIGJ5IGBGdW5jdGlvbiNiaW5kYFxuICBpZiAodHlwZW9mIHRoaXNBcmcgPT0gJ3VuZGVmaW5lZCcgfHwgISgncHJvdG90eXBlJyBpbiBmdW5jKSkge1xuICAgIHJldHVybiBmdW5jO1xuICB9XG4gIHZhciBiaW5kRGF0YSA9IGZ1bmMuX19iaW5kRGF0YV9fO1xuICBpZiAodHlwZW9mIGJpbmREYXRhID09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHN1cHBvcnQuZnVuY05hbWVzKSB7XG4gICAgICBiaW5kRGF0YSA9ICFmdW5jLm5hbWU7XG4gICAgfVxuICAgIGJpbmREYXRhID0gYmluZERhdGEgfHwgIXN1cHBvcnQuZnVuY0RlY29tcDtcbiAgICBpZiAoIWJpbmREYXRhKSB7XG4gICAgICB2YXIgc291cmNlID0gZm5Ub1N0cmluZy5jYWxsKGZ1bmMpO1xuICAgICAgaWYgKCFzdXBwb3J0LmZ1bmNOYW1lcykge1xuICAgICAgICBiaW5kRGF0YSA9ICFyZUZ1bmNOYW1lLnRlc3Qoc291cmNlKTtcbiAgICAgIH1cbiAgICAgIGlmICghYmluZERhdGEpIHtcbiAgICAgICAgLy8gY2hlY2tzIGlmIGBmdW5jYCByZWZlcmVuY2VzIHRoZSBgdGhpc2Aga2V5d29yZCBhbmQgc3RvcmVzIHRoZSByZXN1bHRcbiAgICAgICAgYmluZERhdGEgPSByZVRoaXMudGVzdChzb3VyY2UpO1xuICAgICAgICBzZXRCaW5kRGF0YShmdW5jLCBiaW5kRGF0YSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIGV4aXQgZWFybHkgaWYgdGhlcmUgYXJlIG5vIGB0aGlzYCByZWZlcmVuY2VzIG9yIGBmdW5jYCBpcyBib3VuZFxuICBpZiAoYmluZERhdGEgPT09IGZhbHNlIHx8IChiaW5kRGF0YSAhPT0gdHJ1ZSAmJiBiaW5kRGF0YVsxXSAmIDEpKSB7XG4gICAgcmV0dXJuIGZ1bmM7XG4gIH1cbiAgc3dpdGNoIChhcmdDb3VudCkge1xuICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIHZhbHVlKTtcbiAgICB9O1xuICAgIGNhc2UgMjogcmV0dXJuIGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgYSwgYik7XG4gICAgfTtcbiAgICBjYXNlIDM6IHJldHVybiBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKTtcbiAgICB9O1xuICAgIGNhc2UgNDogcmV0dXJuIGZ1bmN0aW9uKGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gYmluZChmdW5jLCB0aGlzQXJnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlQ3JlYXRlQ2FsbGJhY2s7XG4iLCIvKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIGlzTmF0aXZlID0gcmVxdWlyZSgnbG9kYXNoLl9pc25hdGl2ZScpLFxuICAgIG5vb3AgPSByZXF1aXJlKCdsb2Rhc2gubm9vcCcpO1xuXG4vKiogVXNlZCBhcyB0aGUgcHJvcGVydHkgZGVzY3JpcHRvciBmb3IgYF9fYmluZERhdGFfX2AgKi9cbnZhciBkZXNjcmlwdG9yID0ge1xuICAnY29uZmlndXJhYmxlJzogZmFsc2UsXG4gICdlbnVtZXJhYmxlJzogZmFsc2UsXG4gICd2YWx1ZSc6IG51bGwsXG4gICd3cml0YWJsZSc6IGZhbHNlXG59O1xuXG4vKiogVXNlZCB0byBzZXQgbWV0YSBkYXRhIG9uIGZ1bmN0aW9ucyAqL1xudmFyIGRlZmluZVByb3BlcnR5ID0gKGZ1bmN0aW9uKCkge1xuICAvLyBJRSA4IG9ubHkgYWNjZXB0cyBET00gZWxlbWVudHNcbiAgdHJ5IHtcbiAgICB2YXIgbyA9IHt9LFxuICAgICAgICBmdW5jID0gaXNOYXRpdmUoZnVuYyA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgJiYgZnVuYyxcbiAgICAgICAgcmVzdWx0ID0gZnVuYyhvLCBvLCBvKSAmJiBmdW5jO1xuICB9IGNhdGNoKGUpIHsgfVxuICByZXR1cm4gcmVzdWx0O1xufSgpKTtcblxuLyoqXG4gKiBTZXRzIGB0aGlzYCBiaW5kaW5nIGRhdGEgb24gYSBnaXZlbiBmdW5jdGlvbi5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gc2V0IGRhdGEgb24uXG4gKiBAcGFyYW0ge0FycmF5fSB2YWx1ZSBUaGUgZGF0YSBhcnJheSB0byBzZXQuXG4gKi9cbnZhciBzZXRCaW5kRGF0YSA9ICFkZWZpbmVQcm9wZXJ0eSA/IG5vb3AgOiBmdW5jdGlvbihmdW5jLCB2YWx1ZSkge1xuICBkZXNjcmlwdG9yLnZhbHVlID0gdmFsdWU7XG4gIGRlZmluZVByb3BlcnR5KGZ1bmMsICdfX2JpbmREYXRhX18nLCBkZXNjcmlwdG9yKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0QmluZERhdGE7XG4iLCIvKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xuXG4vKipcbiAqIEEgbm8tb3BlcmF0aW9uIGZ1bmN0aW9uLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgVXRpbGl0aWVzXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciBvYmplY3QgPSB7ICduYW1lJzogJ2ZyZWQnIH07XG4gKiBfLm5vb3Aob2JqZWN0KSA9PT0gdW5kZWZpbmVkO1xuICogLy8gPT4gdHJ1ZVxuICovXG5mdW5jdGlvbiBub29wKCkge1xuICAvLyBubyBvcGVyYXRpb24gcGVyZm9ybWVkXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbm9vcDtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgY3JlYXRlV3JhcHBlciA9IHJlcXVpcmUoJ2xvZGFzaC5fY3JlYXRld3JhcHBlcicpLFxuICAgIHNsaWNlID0gcmVxdWlyZSgnbG9kYXNoLl9zbGljZScpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0LCB3aGVuIGNhbGxlZCwgaW52b2tlcyBgZnVuY2Agd2l0aCB0aGUgYHRoaXNgXG4gKiBiaW5kaW5nIG9mIGB0aGlzQXJnYCBhbmQgcHJlcGVuZHMgYW55IGFkZGl0aW9uYWwgYGJpbmRgIGFyZ3VtZW50cyB0byB0aG9zZVxuICogcHJvdmlkZWQgdG8gdGhlIGJvdW5kIGZ1bmN0aW9uLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25zXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBiaW5kLlxuICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBmdW5jYC5cbiAqIEBwYXJhbSB7Li4uKn0gW2FyZ10gQXJndW1lbnRzIHRvIGJlIHBhcnRpYWxseSBhcHBsaWVkLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgYm91bmQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciBmdW5jID0gZnVuY3Rpb24oZ3JlZXRpbmcpIHtcbiAqICAgcmV0dXJuIGdyZWV0aW5nICsgJyAnICsgdGhpcy5uYW1lO1xuICogfTtcbiAqXG4gKiBmdW5jID0gXy5iaW5kKGZ1bmMsIHsgJ25hbWUnOiAnZnJlZCcgfSwgJ2hpJyk7XG4gKiBmdW5jKCk7XG4gKiAvLyA9PiAnaGkgZnJlZCdcbiAqL1xuZnVuY3Rpb24gYmluZChmdW5jLCB0aGlzQXJnKSB7XG4gIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID4gMlxuICAgID8gY3JlYXRlV3JhcHBlcihmdW5jLCAxNywgc2xpY2UoYXJndW1lbnRzLCAyKSwgbnVsbCwgdGhpc0FyZylcbiAgICA6IGNyZWF0ZVdyYXBwZXIoZnVuYywgMSwgbnVsbCwgbnVsbCwgdGhpc0FyZyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmluZDtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgYmFzZUJpbmQgPSByZXF1aXJlKCdsb2Rhc2guX2Jhc2ViaW5kJyksXG4gICAgYmFzZUNyZWF0ZVdyYXBwZXIgPSByZXF1aXJlKCdsb2Rhc2guX2Jhc2VjcmVhdGV3cmFwcGVyJyksXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2xvZGFzaC5pc2Z1bmN0aW9uJyksXG4gICAgc2xpY2UgPSByZXF1aXJlKCdsb2Rhc2guX3NsaWNlJyk7XG5cbi8qKlxuICogVXNlZCBmb3IgYEFycmF5YCBtZXRob2QgcmVmZXJlbmNlcy5cbiAqXG4gKiBOb3JtYWxseSBgQXJyYXkucHJvdG90eXBlYCB3b3VsZCBzdWZmaWNlLCBob3dldmVyLCB1c2luZyBhbiBhcnJheSBsaXRlcmFsXG4gKiBhdm9pZHMgaXNzdWVzIGluIE5hcndoYWwuXG4gKi9cbnZhciBhcnJheVJlZiA9IFtdO1xuXG4vKiogTmF0aXZlIG1ldGhvZCBzaG9ydGN1dHMgKi9cbnZhciBwdXNoID0gYXJyYXlSZWYucHVzaCxcbiAgICB1bnNoaWZ0ID0gYXJyYXlSZWYudW5zaGlmdDtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCwgd2hlbiBjYWxsZWQsIGVpdGhlciBjdXJyaWVzIG9yIGludm9rZXMgYGZ1bmNgXG4gKiB3aXRoIGFuIG9wdGlvbmFsIGB0aGlzYCBiaW5kaW5nIGFuZCBwYXJ0aWFsbHkgYXBwbGllZCBhcmd1bWVudHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb258c3RyaW5nfSBmdW5jIFRoZSBmdW5jdGlvbiBvciBtZXRob2QgbmFtZSB0byByZWZlcmVuY2UuXG4gKiBAcGFyYW0ge251bWJlcn0gYml0bWFzayBUaGUgYml0bWFzayBvZiBtZXRob2QgZmxhZ3MgdG8gY29tcG9zZS5cbiAqICBUaGUgYml0bWFzayBtYXkgYmUgY29tcG9zZWQgb2YgdGhlIGZvbGxvd2luZyBmbGFnczpcbiAqICAxIC0gYF8uYmluZGBcbiAqICAyIC0gYF8uYmluZEtleWBcbiAqICA0IC0gYF8uY3VycnlgXG4gKiAgOCAtIGBfLmN1cnJ5YCAoYm91bmQpXG4gKiAgMTYgLSBgXy5wYXJ0aWFsYFxuICogIDMyIC0gYF8ucGFydGlhbFJpZ2h0YFxuICogQHBhcmFtIHtBcnJheX0gW3BhcnRpYWxBcmdzXSBBbiBhcnJheSBvZiBhcmd1bWVudHMgdG8gcHJlcGVuZCB0byB0aG9zZVxuICogIHByb3ZpZGVkIHRvIHRoZSBuZXcgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge0FycmF5fSBbcGFydGlhbFJpZ2h0QXJnc10gQW4gYXJyYXkgb2YgYXJndW1lbnRzIHRvIGFwcGVuZCB0byB0aG9zZVxuICogIHByb3ZpZGVkIHRvIHRoZSBuZXcgZnVuY3Rpb24uXG4gKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGZ1bmNgLlxuICogQHBhcmFtIHtudW1iZXJ9IFthcml0eV0gVGhlIGFyaXR5IG9mIGBmdW5jYC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVXcmFwcGVyKGZ1bmMsIGJpdG1hc2ssIHBhcnRpYWxBcmdzLCBwYXJ0aWFsUmlnaHRBcmdzLCB0aGlzQXJnLCBhcml0eSkge1xuICB2YXIgaXNCaW5kID0gYml0bWFzayAmIDEsXG4gICAgICBpc0JpbmRLZXkgPSBiaXRtYXNrICYgMixcbiAgICAgIGlzQ3VycnkgPSBiaXRtYXNrICYgNCxcbiAgICAgIGlzQ3VycnlCb3VuZCA9IGJpdG1hc2sgJiA4LFxuICAgICAgaXNQYXJ0aWFsID0gYml0bWFzayAmIDE2LFxuICAgICAgaXNQYXJ0aWFsUmlnaHQgPSBiaXRtYXNrICYgMzI7XG5cbiAgaWYgKCFpc0JpbmRLZXkgJiYgIWlzRnVuY3Rpb24oZnVuYykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yO1xuICB9XG4gIGlmIChpc1BhcnRpYWwgJiYgIXBhcnRpYWxBcmdzLmxlbmd0aCkge1xuICAgIGJpdG1hc2sgJj0gfjE2O1xuICAgIGlzUGFydGlhbCA9IHBhcnRpYWxBcmdzID0gZmFsc2U7XG4gIH1cbiAgaWYgKGlzUGFydGlhbFJpZ2h0ICYmICFwYXJ0aWFsUmlnaHRBcmdzLmxlbmd0aCkge1xuICAgIGJpdG1hc2sgJj0gfjMyO1xuICAgIGlzUGFydGlhbFJpZ2h0ID0gcGFydGlhbFJpZ2h0QXJncyA9IGZhbHNlO1xuICB9XG4gIHZhciBiaW5kRGF0YSA9IGZ1bmMgJiYgZnVuYy5fX2JpbmREYXRhX187XG4gIGlmIChiaW5kRGF0YSAmJiBiaW5kRGF0YSAhPT0gdHJ1ZSkge1xuICAgIC8vIGNsb25lIGBiaW5kRGF0YWBcbiAgICBiaW5kRGF0YSA9IHNsaWNlKGJpbmREYXRhKTtcbiAgICBpZiAoYmluZERhdGFbMl0pIHtcbiAgICAgIGJpbmREYXRhWzJdID0gc2xpY2UoYmluZERhdGFbMl0pO1xuICAgIH1cbiAgICBpZiAoYmluZERhdGFbM10pIHtcbiAgICAgIGJpbmREYXRhWzNdID0gc2xpY2UoYmluZERhdGFbM10pO1xuICAgIH1cbiAgICAvLyBzZXQgYHRoaXNCaW5kaW5nYCBpcyBub3QgcHJldmlvdXNseSBib3VuZFxuICAgIGlmIChpc0JpbmQgJiYgIShiaW5kRGF0YVsxXSAmIDEpKSB7XG4gICAgICBiaW5kRGF0YVs0XSA9IHRoaXNBcmc7XG4gICAgfVxuICAgIC8vIHNldCBpZiBwcmV2aW91c2x5IGJvdW5kIGJ1dCBub3QgY3VycmVudGx5IChzdWJzZXF1ZW50IGN1cnJpZWQgZnVuY3Rpb25zKVxuICAgIGlmICghaXNCaW5kICYmIGJpbmREYXRhWzFdICYgMSkge1xuICAgICAgYml0bWFzayB8PSA4O1xuICAgIH1cbiAgICAvLyBzZXQgY3VycmllZCBhcml0eSBpZiBub3QgeWV0IHNldFxuICAgIGlmIChpc0N1cnJ5ICYmICEoYmluZERhdGFbMV0gJiA0KSkge1xuICAgICAgYmluZERhdGFbNV0gPSBhcml0eTtcbiAgICB9XG4gICAgLy8gYXBwZW5kIHBhcnRpYWwgbGVmdCBhcmd1bWVudHNcbiAgICBpZiAoaXNQYXJ0aWFsKSB7XG4gICAgICBwdXNoLmFwcGx5KGJpbmREYXRhWzJdIHx8IChiaW5kRGF0YVsyXSA9IFtdKSwgcGFydGlhbEFyZ3MpO1xuICAgIH1cbiAgICAvLyBhcHBlbmQgcGFydGlhbCByaWdodCBhcmd1bWVudHNcbiAgICBpZiAoaXNQYXJ0aWFsUmlnaHQpIHtcbiAgICAgIHVuc2hpZnQuYXBwbHkoYmluZERhdGFbM10gfHwgKGJpbmREYXRhWzNdID0gW10pLCBwYXJ0aWFsUmlnaHRBcmdzKTtcbiAgICB9XG4gICAgLy8gbWVyZ2UgZmxhZ3NcbiAgICBiaW5kRGF0YVsxXSB8PSBiaXRtYXNrO1xuICAgIHJldHVybiBjcmVhdGVXcmFwcGVyLmFwcGx5KG51bGwsIGJpbmREYXRhKTtcbiAgfVxuICAvLyBmYXN0IHBhdGggZm9yIGBfLmJpbmRgXG4gIHZhciBjcmVhdGVyID0gKGJpdG1hc2sgPT0gMSB8fCBiaXRtYXNrID09PSAxNykgPyBiYXNlQmluZCA6IGJhc2VDcmVhdGVXcmFwcGVyO1xuICByZXR1cm4gY3JlYXRlcihbZnVuYywgYml0bWFzaywgcGFydGlhbEFyZ3MsIHBhcnRpYWxSaWdodEFyZ3MsIHRoaXNBcmcsIGFyaXR5XSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlV3JhcHBlcjtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgYmFzZUNyZWF0ZSA9IHJlcXVpcmUoJ2xvZGFzaC5fYmFzZWNyZWF0ZScpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnbG9kYXNoLmlzb2JqZWN0JyksXG4gICAgc2V0QmluZERhdGEgPSByZXF1aXJlKCdsb2Rhc2guX3NldGJpbmRkYXRhJyksXG4gICAgc2xpY2UgPSByZXF1aXJlKCdsb2Rhc2guX3NsaWNlJyk7XG5cbi8qKlxuICogVXNlZCBmb3IgYEFycmF5YCBtZXRob2QgcmVmZXJlbmNlcy5cbiAqXG4gKiBOb3JtYWxseSBgQXJyYXkucHJvdG90eXBlYCB3b3VsZCBzdWZmaWNlLCBob3dldmVyLCB1c2luZyBhbiBhcnJheSBsaXRlcmFsXG4gKiBhdm9pZHMgaXNzdWVzIGluIE5hcndoYWwuXG4gKi9cbnZhciBhcnJheVJlZiA9IFtdO1xuXG4vKiogTmF0aXZlIG1ldGhvZCBzaG9ydGN1dHMgKi9cbnZhciBwdXNoID0gYXJyYXlSZWYucHVzaDtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5iaW5kYCB0aGF0IGNyZWF0ZXMgdGhlIGJvdW5kIGZ1bmN0aW9uIGFuZFxuICogc2V0cyBpdHMgbWV0YSBkYXRhLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBiaW5kRGF0YSBUaGUgYmluZCBkYXRhIGFycmF5LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgYm91bmQgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VCaW5kKGJpbmREYXRhKSB7XG4gIHZhciBmdW5jID0gYmluZERhdGFbMF0sXG4gICAgICBwYXJ0aWFsQXJncyA9IGJpbmREYXRhWzJdLFxuICAgICAgdGhpc0FyZyA9IGJpbmREYXRhWzRdO1xuXG4gIGZ1bmN0aW9uIGJvdW5kKCkge1xuICAgIC8vIGBGdW5jdGlvbiNiaW5kYCBzcGVjXG4gICAgLy8gaHR0cDovL2VzNS5naXRodWIuaW8vI3gxNS4zLjQuNVxuICAgIGlmIChwYXJ0aWFsQXJncykge1xuICAgICAgLy8gYXZvaWQgYGFyZ3VtZW50c2Agb2JqZWN0IGRlb3B0aW1pemF0aW9ucyBieSB1c2luZyBgc2xpY2VgIGluc3RlYWRcbiAgICAgIC8vIG9mIGBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbGAgYW5kIG5vdCBhc3NpZ25pbmcgYGFyZ3VtZW50c2AgdG8gYVxuICAgICAgLy8gdmFyaWFibGUgYXMgYSB0ZXJuYXJ5IGV4cHJlc3Npb25cbiAgICAgIHZhciBhcmdzID0gc2xpY2UocGFydGlhbEFyZ3MpO1xuICAgICAgcHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgICAvLyBtaW1pYyB0aGUgY29uc3RydWN0b3IncyBgcmV0dXJuYCBiZWhhdmlvclxuICAgIC8vIGh0dHA6Ly9lczUuZ2l0aHViLmlvLyN4MTMuMi4yXG4gICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBib3VuZCkge1xuICAgICAgLy8gZW5zdXJlIGBuZXcgYm91bmRgIGlzIGFuIGluc3RhbmNlIG9mIGBmdW5jYFxuICAgICAgdmFyIHRoaXNCaW5kaW5nID0gYmFzZUNyZWF0ZShmdW5jLnByb3RvdHlwZSksXG4gICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQmluZGluZywgYXJncyB8fCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIGlzT2JqZWN0KHJlc3VsdCkgPyByZXN1bHQgOiB0aGlzQmluZGluZztcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyB8fCBhcmd1bWVudHMpO1xuICB9XG4gIHNldEJpbmREYXRhKGJvdW5kLCBiaW5kRGF0YSk7XG4gIHJldHVybiBib3VuZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlQmluZDtcbiIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgaXNOYXRpdmUgPSByZXF1aXJlKCdsb2Rhc2guX2lzbmF0aXZlJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCdsb2Rhc2guaXNvYmplY3QnKSxcbiAgICBub29wID0gcmVxdWlyZSgnbG9kYXNoLm5vb3AnKTtcblxuLyogTmF0aXZlIG1ldGhvZCBzaG9ydGN1dHMgZm9yIG1ldGhvZHMgd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMgKi9cbnZhciBuYXRpdmVDcmVhdGUgPSBpc05hdGl2ZShuYXRpdmVDcmVhdGUgPSBPYmplY3QuY3JlYXRlKSAmJiBuYXRpdmVDcmVhdGU7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uY3JlYXRlYCB3aXRob3V0IHN1cHBvcnQgZm9yIGFzc2lnbmluZ1xuICogcHJvcGVydGllcyB0byB0aGUgY3JlYXRlZCBvYmplY3QuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm90b3R5cGUgVGhlIG9iamVjdCB0byBpbmhlcml0IGZyb20uXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBuZXcgb2JqZWN0LlxuICovXG5mdW5jdGlvbiBiYXNlQ3JlYXRlKHByb3RvdHlwZSwgcHJvcGVydGllcykge1xuICByZXR1cm4gaXNPYmplY3QocHJvdG90eXBlKSA/IG5hdGl2ZUNyZWF0ZShwcm90b3R5cGUpIDoge307XG59XG4vLyBmYWxsYmFjayBmb3IgYnJvd3NlcnMgd2l0aG91dCBgT2JqZWN0LmNyZWF0ZWBcbmlmICghbmF0aXZlQ3JlYXRlKSB7XG4gIGJhc2VDcmVhdGUgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gT2JqZWN0KCkge31cbiAgICByZXR1cm4gZnVuY3Rpb24ocHJvdG90eXBlKSB7XG4gICAgICBpZiAoaXNPYmplY3QocHJvdG90eXBlKSkge1xuICAgICAgICBPYmplY3QucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IE9iamVjdDtcbiAgICAgICAgT2JqZWN0LnByb3RvdHlwZSA9IG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0IHx8IGdsb2JhbC5PYmplY3QoKTtcbiAgICB9O1xuICB9KCkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VDcmVhdGU7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBiYXNlQ3JlYXRlID0gcmVxdWlyZSgnbG9kYXNoLl9iYXNlY3JlYXRlJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCdsb2Rhc2guaXNvYmplY3QnKSxcbiAgICBzZXRCaW5kRGF0YSA9IHJlcXVpcmUoJ2xvZGFzaC5fc2V0YmluZGRhdGEnKSxcbiAgICBzbGljZSA9IHJlcXVpcmUoJ2xvZGFzaC5fc2xpY2UnKTtcblxuLyoqXG4gKiBVc2VkIGZvciBgQXJyYXlgIG1ldGhvZCByZWZlcmVuY2VzLlxuICpcbiAqIE5vcm1hbGx5IGBBcnJheS5wcm90b3R5cGVgIHdvdWxkIHN1ZmZpY2UsIGhvd2V2ZXIsIHVzaW5nIGFuIGFycmF5IGxpdGVyYWxcbiAqIGF2b2lkcyBpc3N1ZXMgaW4gTmFyd2hhbC5cbiAqL1xudmFyIGFycmF5UmVmID0gW107XG5cbi8qKiBOYXRpdmUgbWV0aG9kIHNob3J0Y3V0cyAqL1xudmFyIHB1c2ggPSBhcnJheVJlZi5wdXNoO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBjcmVhdGVXcmFwcGVyYCB0aGF0IGNyZWF0ZXMgdGhlIHdyYXBwZXIgYW5kXG4gKiBzZXRzIGl0cyBtZXRhIGRhdGEuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGJpbmREYXRhIFRoZSBiaW5kIGRhdGEgYXJyYXkuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gYmFzZUNyZWF0ZVdyYXBwZXIoYmluZERhdGEpIHtcbiAgdmFyIGZ1bmMgPSBiaW5kRGF0YVswXSxcbiAgICAgIGJpdG1hc2sgPSBiaW5kRGF0YVsxXSxcbiAgICAgIHBhcnRpYWxBcmdzID0gYmluZERhdGFbMl0sXG4gICAgICBwYXJ0aWFsUmlnaHRBcmdzID0gYmluZERhdGFbM10sXG4gICAgICB0aGlzQXJnID0gYmluZERhdGFbNF0sXG4gICAgICBhcml0eSA9IGJpbmREYXRhWzVdO1xuXG4gIHZhciBpc0JpbmQgPSBiaXRtYXNrICYgMSxcbiAgICAgIGlzQmluZEtleSA9IGJpdG1hc2sgJiAyLFxuICAgICAgaXNDdXJyeSA9IGJpdG1hc2sgJiA0LFxuICAgICAgaXNDdXJyeUJvdW5kID0gYml0bWFzayAmIDgsXG4gICAgICBrZXkgPSBmdW5jO1xuXG4gIGZ1bmN0aW9uIGJvdW5kKCkge1xuICAgIHZhciB0aGlzQmluZGluZyA9IGlzQmluZCA/IHRoaXNBcmcgOiB0aGlzO1xuICAgIGlmIChwYXJ0aWFsQXJncykge1xuICAgICAgdmFyIGFyZ3MgPSBzbGljZShwYXJ0aWFsQXJncyk7XG4gICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgfVxuICAgIGlmIChwYXJ0aWFsUmlnaHRBcmdzIHx8IGlzQ3VycnkpIHtcbiAgICAgIGFyZ3MgfHwgKGFyZ3MgPSBzbGljZShhcmd1bWVudHMpKTtcbiAgICAgIGlmIChwYXJ0aWFsUmlnaHRBcmdzKSB7XG4gICAgICAgIHB1c2guYXBwbHkoYXJncywgcGFydGlhbFJpZ2h0QXJncyk7XG4gICAgICB9XG4gICAgICBpZiAoaXNDdXJyeSAmJiBhcmdzLmxlbmd0aCA8IGFyaXR5KSB7XG4gICAgICAgIGJpdG1hc2sgfD0gMTYgJiB+MzI7XG4gICAgICAgIHJldHVybiBiYXNlQ3JlYXRlV3JhcHBlcihbZnVuYywgKGlzQ3VycnlCb3VuZCA/IGJpdG1hc2sgOiBiaXRtYXNrICYgfjMpLCBhcmdzLCBudWxsLCB0aGlzQXJnLCBhcml0eV0pO1xuICAgICAgfVxuICAgIH1cbiAgICBhcmdzIHx8IChhcmdzID0gYXJndW1lbnRzKTtcbiAgICBpZiAoaXNCaW5kS2V5KSB7XG4gICAgICBmdW5jID0gdGhpc0JpbmRpbmdba2V5XTtcbiAgICB9XG4gICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBib3VuZCkge1xuICAgICAgdGhpc0JpbmRpbmcgPSBiYXNlQ3JlYXRlKGZ1bmMucHJvdG90eXBlKTtcbiAgICAgIHZhciByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNCaW5kaW5nLCBhcmdzKTtcbiAgICAgIHJldHVybiBpc09iamVjdChyZXN1bHQpID8gcmVzdWx0IDogdGhpc0JpbmRpbmc7XG4gICAgfVxuICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXNCaW5kaW5nLCBhcmdzKTtcbiAgfVxuICBzZXRCaW5kRGF0YShib3VuZCwgYmluZERhdGEpO1xuICByZXR1cm4gYm91bmQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUNyZWF0ZVdyYXBwZXI7XG4iLCIvKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgZnVuY3Rpb24uXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RzXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGdW5jdGlvbihfKTtcbiAqIC8vID0+IHRydWVcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbic7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNGdW5jdGlvbjtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKlxuICogU2xpY2VzIHRoZSBgY29sbGVjdGlvbmAgZnJvbSB0aGUgYHN0YXJ0YCBpbmRleCB1cCB0bywgYnV0IG5vdCBpbmNsdWRpbmcsXG4gKiB0aGUgYGVuZGAgaW5kZXguXG4gKlxuICogTm90ZTogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIGluc3RlYWQgb2YgYEFycmF5I3NsaWNlYCB0byBzdXBwb3J0IG5vZGUgbGlzdHNcbiAqIGluIElFIDwgOSBhbmQgdG8gZW5zdXJlIGRlbnNlIGFycmF5cyBhcmUgcmV0dXJuZWQuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBzbGljZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCBUaGUgc3RhcnQgaW5kZXguXG4gKiBAcGFyYW0ge251bWJlcn0gZW5kIFRoZSBlbmQgaW5kZXguXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBhcnJheS5cbiAqL1xuZnVuY3Rpb24gc2xpY2UoYXJyYXksIHN0YXJ0LCBlbmQpIHtcbiAgc3RhcnQgfHwgKHN0YXJ0ID0gMCk7XG4gIGlmICh0eXBlb2YgZW5kID09ICd1bmRlZmluZWQnKSB7XG4gICAgZW5kID0gYXJyYXkgPyBhcnJheS5sZW5ndGggOiAwO1xuICB9XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gZW5kIC0gc3RhcnQgfHwgMCxcbiAgICAgIHJlc3VsdCA9IEFycmF5KGxlbmd0aCA8IDAgPyAwIDogbGVuZ3RoKTtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHJlc3VsdFtpbmRleF0gPSBhcnJheVtzdGFydCArIGluZGV4XTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNsaWNlO1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqXG4gKiBUaGlzIG1ldGhvZCByZXR1cm5zIHRoZSBmaXJzdCBhcmd1bWVudCBwcm92aWRlZCB0byBpdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IFV0aWxpdGllc1xuICogQHBhcmFtIHsqfSB2YWx1ZSBBbnkgdmFsdWUuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyBgdmFsdWVgLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAnbmFtZSc6ICdmcmVkJyB9O1xuICogXy5pZGVudGl0eShvYmplY3QpID09PSBvYmplY3Q7XG4gKiAvLyA9PiB0cnVlXG4gKi9cbmZ1bmN0aW9uIGlkZW50aXR5KHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpZGVudGl0eTtcbiIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgaXNOYXRpdmUgPSByZXF1aXJlKCdsb2Rhc2guX2lzbmF0aXZlJyk7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBmdW5jdGlvbnMgY29udGFpbmluZyBhIGB0aGlzYCByZWZlcmVuY2UgKi9cbnZhciByZVRoaXMgPSAvXFxidGhpc1xcYi87XG5cbi8qKlxuICogQW4gb2JqZWN0IHVzZWQgdG8gZmxhZyBlbnZpcm9ubWVudHMgZmVhdHVyZXMuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEB0eXBlIE9iamVjdFxuICovXG52YXIgc3VwcG9ydCA9IHt9O1xuXG4vKipcbiAqIERldGVjdCBpZiBmdW5jdGlvbnMgY2FuIGJlIGRlY29tcGlsZWQgYnkgYEZ1bmN0aW9uI3RvU3RyaW5nYFxuICogKGFsbCBidXQgUFMzIGFuZCBvbGRlciBPcGVyYSBtb2JpbGUgYnJvd3NlcnMgJiBhdm9pZGVkIGluIFdpbmRvd3MgOCBhcHBzKS5cbiAqXG4gKiBAbWVtYmVyT2YgXy5zdXBwb3J0XG4gKiBAdHlwZSBib29sZWFuXG4gKi9cbnN1cHBvcnQuZnVuY0RlY29tcCA9ICFpc05hdGl2ZShnbG9iYWwuV2luUlRFcnJvcikgJiYgcmVUaGlzLnRlc3QoZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KTtcblxuLyoqXG4gKiBEZXRlY3QgaWYgYEZ1bmN0aW9uI25hbWVgIGlzIHN1cHBvcnRlZCAoYWxsIGJ1dCBJRSkuXG4gKlxuICogQG1lbWJlck9mIF8uc3VwcG9ydFxuICogQHR5cGUgYm9vbGVhblxuICovXG5zdXBwb3J0LmZ1bmNOYW1lcyA9IHR5cGVvZiBGdW5jdGlvbi5uYW1lID09ICdzdHJpbmcnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN1cHBvcnQ7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBmb3JJbiA9IHJlcXVpcmUoJ2xvZGFzaC5mb3JpbicpLFxuICAgIGdldEFycmF5ID0gcmVxdWlyZSgnbG9kYXNoLl9nZXRhcnJheScpLFxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdsb2Rhc2guaXNmdW5jdGlvbicpLFxuICAgIG9iamVjdFR5cGVzID0gcmVxdWlyZSgnbG9kYXNoLl9vYmplY3R0eXBlcycpLFxuICAgIHJlbGVhc2VBcnJheSA9IHJlcXVpcmUoJ2xvZGFzaC5fcmVsZWFzZWFycmF5Jyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgc2hvcnRjdXRzICovXG52YXIgYXJnc0NsYXNzID0gJ1tvYmplY3QgQXJndW1lbnRzXScsXG4gICAgYXJyYXlDbGFzcyA9ICdbb2JqZWN0IEFycmF5XScsXG4gICAgYm9vbENsYXNzID0gJ1tvYmplY3QgQm9vbGVhbl0nLFxuICAgIGRhdGVDbGFzcyA9ICdbb2JqZWN0IERhdGVdJyxcbiAgICBudW1iZXJDbGFzcyA9ICdbb2JqZWN0IE51bWJlcl0nLFxuICAgIG9iamVjdENsYXNzID0gJ1tvYmplY3QgT2JqZWN0XScsXG4gICAgcmVnZXhwQ2xhc3MgPSAnW29iamVjdCBSZWdFeHBdJyxcbiAgICBzdHJpbmdDbGFzcyA9ICdbb2JqZWN0IFN0cmluZ10nO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byByZXNvbHZlIHRoZSBpbnRlcm5hbCBbW0NsYXNzXV0gb2YgdmFsdWVzICovXG52YXIgdG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqIE5hdGl2ZSBtZXRob2Qgc2hvcnRjdXRzICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5pc0VxdWFsYCwgd2l0aG91dCBzdXBwb3J0IGZvciBgdGhpc0FyZ2AgYmluZGluZyxcbiAqIHRoYXQgYWxsb3dzIHBhcnRpYWwgXCJfLndoZXJlXCIgc3R5bGUgY29tcGFyaXNvbnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gYSBUaGUgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7Kn0gYiBUaGUgb3RoZXIgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFja10gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBjb21wYXJpbmcgdmFsdWVzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2lzV2hlcmU9ZmFsc2VdIEEgZmxhZyB0byBpbmRpY2F0ZSBwZXJmb3JtaW5nIHBhcnRpYWwgY29tcGFyaXNvbnMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tBPVtdXSBUcmFja3MgdHJhdmVyc2VkIGBhYCBvYmplY3RzLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQj1bXV0gVHJhY2tzIHRyYXZlcnNlZCBgYmAgb2JqZWN0cy5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VJc0VxdWFsKGEsIGIsIGNhbGxiYWNrLCBpc1doZXJlLCBzdGFja0EsIHN0YWNrQikge1xuICAvLyB1c2VkIHRvIGluZGljYXRlIHRoYXQgd2hlbiBjb21wYXJpbmcgb2JqZWN0cywgYGFgIGhhcyBhdCBsZWFzdCB0aGUgcHJvcGVydGllcyBvZiBgYmBcbiAgaWYgKGNhbGxiYWNrKSB7XG4gICAgdmFyIHJlc3VsdCA9IGNhbGxiYWNrKGEsIGIpO1xuICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gISFyZXN1bHQ7XG4gICAgfVxuICB9XG4gIC8vIGV4aXQgZWFybHkgZm9yIGlkZW50aWNhbCB2YWx1ZXNcbiAgaWYgKGEgPT09IGIpIHtcbiAgICAvLyB0cmVhdCBgKzBgIHZzLiBgLTBgIGFzIG5vdCBlcXVhbFxuICAgIHJldHVybiBhICE9PSAwIHx8ICgxIC8gYSA9PSAxIC8gYik7XG4gIH1cbiAgdmFyIHR5cGUgPSB0eXBlb2YgYSxcbiAgICAgIG90aGVyVHlwZSA9IHR5cGVvZiBiO1xuXG4gIC8vIGV4aXQgZWFybHkgZm9yIHVubGlrZSBwcmltaXRpdmUgdmFsdWVzXG4gIGlmIChhID09PSBhICYmXG4gICAgICAhKGEgJiYgb2JqZWN0VHlwZXNbdHlwZV0pICYmXG4gICAgICAhKGIgJiYgb2JqZWN0VHlwZXNbb3RoZXJUeXBlXSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gZXhpdCBlYXJseSBmb3IgYG51bGxgIGFuZCBgdW5kZWZpbmVkYCBhdm9pZGluZyBFUzMncyBGdW5jdGlvbiNjYWxsIGJlaGF2aW9yXG4gIC8vIGh0dHA6Ly9lczUuZ2l0aHViLmlvLyN4MTUuMy40LjRcbiAgaWYgKGEgPT0gbnVsbCB8fCBiID09IG51bGwpIHtcbiAgICByZXR1cm4gYSA9PT0gYjtcbiAgfVxuICAvLyBjb21wYXJlIFtbQ2xhc3NdXSBuYW1lc1xuICB2YXIgY2xhc3NOYW1lID0gdG9TdHJpbmcuY2FsbChhKSxcbiAgICAgIG90aGVyQ2xhc3MgPSB0b1N0cmluZy5jYWxsKGIpO1xuXG4gIGlmIChjbGFzc05hbWUgPT0gYXJnc0NsYXNzKSB7XG4gICAgY2xhc3NOYW1lID0gb2JqZWN0Q2xhc3M7XG4gIH1cbiAgaWYgKG90aGVyQ2xhc3MgPT0gYXJnc0NsYXNzKSB7XG4gICAgb3RoZXJDbGFzcyA9IG9iamVjdENsYXNzO1xuICB9XG4gIGlmIChjbGFzc05hbWUgIT0gb3RoZXJDbGFzcykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgIGNhc2UgYm9vbENsYXNzOlxuICAgIGNhc2UgZGF0ZUNsYXNzOlxuICAgICAgLy8gY29lcmNlIGRhdGVzIGFuZCBib29sZWFucyB0byBudW1iZXJzLCBkYXRlcyB0byBtaWxsaXNlY29uZHMgYW5kIGJvb2xlYW5zXG4gICAgICAvLyB0byBgMWAgb3IgYDBgIHRyZWF0aW5nIGludmFsaWQgZGF0ZXMgY29lcmNlZCB0byBgTmFOYCBhcyBub3QgZXF1YWxcbiAgICAgIHJldHVybiArYSA9PSArYjtcblxuICAgIGNhc2UgbnVtYmVyQ2xhc3M6XG4gICAgICAvLyB0cmVhdCBgTmFOYCB2cy4gYE5hTmAgYXMgZXF1YWxcbiAgICAgIHJldHVybiAoYSAhPSArYSlcbiAgICAgICAgPyBiICE9ICtiXG4gICAgICAgIC8vIGJ1dCB0cmVhdCBgKzBgIHZzLiBgLTBgIGFzIG5vdCBlcXVhbFxuICAgICAgICA6IChhID09IDAgPyAoMSAvIGEgPT0gMSAvIGIpIDogYSA9PSArYik7XG5cbiAgICBjYXNlIHJlZ2V4cENsYXNzOlxuICAgIGNhc2Ugc3RyaW5nQ2xhc3M6XG4gICAgICAvLyBjb2VyY2UgcmVnZXhlcyB0byBzdHJpbmdzIChodHRwOi8vZXM1LmdpdGh1Yi5pby8jeDE1LjEwLjYuNClcbiAgICAgIC8vIHRyZWF0IHN0cmluZyBwcmltaXRpdmVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIG9iamVjdCBpbnN0YW5jZXMgYXMgZXF1YWxcbiAgICAgIHJldHVybiBhID09IFN0cmluZyhiKTtcbiAgfVxuICB2YXIgaXNBcnIgPSBjbGFzc05hbWUgPT0gYXJyYXlDbGFzcztcbiAgaWYgKCFpc0Fycikge1xuICAgIC8vIHVud3JhcCBhbnkgYGxvZGFzaGAgd3JhcHBlZCB2YWx1ZXNcbiAgICB2YXIgYVdyYXBwZWQgPSBoYXNPd25Qcm9wZXJ0eS5jYWxsKGEsICdfX3dyYXBwZWRfXycpLFxuICAgICAgICBiV3JhcHBlZCA9IGhhc093blByb3BlcnR5LmNhbGwoYiwgJ19fd3JhcHBlZF9fJyk7XG5cbiAgICBpZiAoYVdyYXBwZWQgfHwgYldyYXBwZWQpIHtcbiAgICAgIHJldHVybiBiYXNlSXNFcXVhbChhV3JhcHBlZCA/IGEuX193cmFwcGVkX18gOiBhLCBiV3JhcHBlZCA/IGIuX193cmFwcGVkX18gOiBiLCBjYWxsYmFjaywgaXNXaGVyZSwgc3RhY2tBLCBzdGFja0IpO1xuICAgIH1cbiAgICAvLyBleGl0IGZvciBmdW5jdGlvbnMgYW5kIERPTSBub2Rlc1xuICAgIGlmIChjbGFzc05hbWUgIT0gb2JqZWN0Q2xhc3MpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gaW4gb2xkZXIgdmVyc2lvbnMgb2YgT3BlcmEsIGBhcmd1bWVudHNgIG9iamVjdHMgaGF2ZSBgQXJyYXlgIGNvbnN0cnVjdG9yc1xuICAgIHZhciBjdG9yQSA9IGEuY29uc3RydWN0b3IsXG4gICAgICAgIGN0b3JCID0gYi5jb25zdHJ1Y3RvcjtcblxuICAgIC8vIG5vbiBgT2JqZWN0YCBvYmplY3QgaW5zdGFuY2VzIHdpdGggZGlmZmVyZW50IGNvbnN0cnVjdG9ycyBhcmUgbm90IGVxdWFsXG4gICAgaWYgKGN0b3JBICE9IGN0b3JCICYmXG4gICAgICAgICAgIShpc0Z1bmN0aW9uKGN0b3JBKSAmJiBjdG9yQSBpbnN0YW5jZW9mIGN0b3JBICYmIGlzRnVuY3Rpb24oY3RvckIpICYmIGN0b3JCIGluc3RhbmNlb2YgY3RvckIpICYmXG4gICAgICAgICAgKCdjb25zdHJ1Y3RvcicgaW4gYSAmJiAnY29uc3RydWN0b3InIGluIGIpXG4gICAgICAgICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICAvLyBhc3N1bWUgY3ljbGljIHN0cnVjdHVyZXMgYXJlIGVxdWFsXG4gIC8vIHRoZSBhbGdvcml0aG0gZm9yIGRldGVjdGluZyBjeWNsaWMgc3RydWN0dXJlcyBpcyBhZGFwdGVkIGZyb20gRVMgNS4xXG4gIC8vIHNlY3Rpb24gMTUuMTIuMywgYWJzdHJhY3Qgb3BlcmF0aW9uIGBKT2AgKGh0dHA6Ly9lczUuZ2l0aHViLmlvLyN4MTUuMTIuMylcbiAgdmFyIGluaXRlZFN0YWNrID0gIXN0YWNrQTtcbiAgc3RhY2tBIHx8IChzdGFja0EgPSBnZXRBcnJheSgpKTtcbiAgc3RhY2tCIHx8IChzdGFja0IgPSBnZXRBcnJheSgpKTtcblxuICB2YXIgbGVuZ3RoID0gc3RhY2tBLmxlbmd0aDtcbiAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgaWYgKHN0YWNrQVtsZW5ndGhdID09IGEpIHtcbiAgICAgIHJldHVybiBzdGFja0JbbGVuZ3RoXSA9PSBiO1xuICAgIH1cbiAgfVxuICB2YXIgc2l6ZSA9IDA7XG4gIHJlc3VsdCA9IHRydWU7XG5cbiAgLy8gYWRkIGBhYCBhbmQgYGJgIHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0c1xuICBzdGFja0EucHVzaChhKTtcbiAgc3RhY2tCLnB1c2goYik7XG5cbiAgLy8gcmVjdXJzaXZlbHkgY29tcGFyZSBvYmplY3RzIGFuZCBhcnJheXMgKHN1c2NlcHRpYmxlIHRvIGNhbGwgc3RhY2sgbGltaXRzKVxuICBpZiAoaXNBcnIpIHtcbiAgICAvLyBjb21wYXJlIGxlbmd0aHMgdG8gZGV0ZXJtaW5lIGlmIGEgZGVlcCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeVxuICAgIGxlbmd0aCA9IGEubGVuZ3RoO1xuICAgIHNpemUgPSBiLmxlbmd0aDtcbiAgICByZXN1bHQgPSBzaXplID09IGxlbmd0aDtcblxuICAgIGlmIChyZXN1bHQgfHwgaXNXaGVyZSkge1xuICAgICAgLy8gZGVlcCBjb21wYXJlIHRoZSBjb250ZW50cywgaWdub3Jpbmcgbm9uLW51bWVyaWMgcHJvcGVydGllc1xuICAgICAgd2hpbGUgKHNpemUtLSkge1xuICAgICAgICB2YXIgaW5kZXggPSBsZW5ndGgsXG4gICAgICAgICAgICB2YWx1ZSA9IGJbc2l6ZV07XG5cbiAgICAgICAgaWYgKGlzV2hlcmUpIHtcbiAgICAgICAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgICAgICAgaWYgKChyZXN1bHQgPSBiYXNlSXNFcXVhbChhW2luZGV4XSwgdmFsdWUsIGNhbGxiYWNrLCBpc1doZXJlLCBzdGFja0EsIHN0YWNrQikpKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghKHJlc3VsdCA9IGJhc2VJc0VxdWFsKGFbc2l6ZV0sIHZhbHVlLCBjYWxsYmFjaywgaXNXaGVyZSwgc3RhY2tBLCBzdGFja0IpKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIC8vIGRlZXAgY29tcGFyZSBvYmplY3RzIHVzaW5nIGBmb3JJbmAsIGluc3RlYWQgb2YgYGZvck93bmAsIHRvIGF2b2lkIGBPYmplY3Qua2V5c2BcbiAgICAvLyB3aGljaCwgaW4gdGhpcyBjYXNlLCBpcyBtb3JlIGNvc3RseVxuICAgIGZvckluKGIsIGZ1bmN0aW9uKHZhbHVlLCBrZXksIGIpIHtcbiAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGIsIGtleSkpIHtcbiAgICAgICAgLy8gY291bnQgdGhlIG51bWJlciBvZiBwcm9wZXJ0aWVzLlxuICAgICAgICBzaXplKys7XG4gICAgICAgIC8vIGRlZXAgY29tcGFyZSBlYWNoIHByb3BlcnR5IHZhbHVlLlxuICAgICAgICByZXR1cm4gKHJlc3VsdCA9IGhhc093blByb3BlcnR5LmNhbGwoYSwga2V5KSAmJiBiYXNlSXNFcXVhbChhW2tleV0sIHZhbHVlLCBjYWxsYmFjaywgaXNXaGVyZSwgc3RhY2tBLCBzdGFja0IpKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChyZXN1bHQgJiYgIWlzV2hlcmUpIHtcbiAgICAgIC8vIGVuc3VyZSBib3RoIG9iamVjdHMgaGF2ZSB0aGUgc2FtZSBudW1iZXIgb2YgcHJvcGVydGllc1xuICAgICAgZm9ySW4oYSwgZnVuY3Rpb24odmFsdWUsIGtleSwgYSkge1xuICAgICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChhLCBrZXkpKSB7XG4gICAgICAgICAgLy8gYHNpemVgIHdpbGwgYmUgYC0xYCBpZiBgYWAgaGFzIG1vcmUgcHJvcGVydGllcyB0aGFuIGBiYFxuICAgICAgICAgIHJldHVybiAocmVzdWx0ID0gLS1zaXplID4gLTEpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgc3RhY2tBLnBvcCgpO1xuICBzdGFja0IucG9wKCk7XG5cbiAgaWYgKGluaXRlZFN0YWNrKSB7XG4gICAgcmVsZWFzZUFycmF5KHN0YWNrQSk7XG4gICAgcmVsZWFzZUFycmF5KHN0YWNrQik7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlSXNFcXVhbDtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgYXJyYXlQb29sID0gcmVxdWlyZSgnbG9kYXNoLl9hcnJheXBvb2wnKTtcblxuLyoqXG4gKiBHZXRzIGFuIGFycmF5IGZyb20gdGhlIGFycmF5IHBvb2wgb3IgY3JlYXRlcyBhIG5ldyBvbmUgaWYgdGhlIHBvb2wgaXMgZW1wdHkuXG4gKlxuICogQHByaXZhdGVcbiAqIEByZXR1cm5zIHtBcnJheX0gVGhlIGFycmF5IGZyb20gdGhlIHBvb2wuXG4gKi9cbmZ1bmN0aW9uIGdldEFycmF5KCkge1xuICByZXR1cm4gYXJyYXlQb29sLnBvcCgpIHx8IFtdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldEFycmF5O1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqIFVzZWQgdG8gcG9vbCBhcnJheXMgYW5kIG9iamVjdHMgdXNlZCBpbnRlcm5hbGx5ICovXG52YXIgYXJyYXlQb29sID0gW107XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlQb29sO1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqIFVzZWQgdG8gZGV0ZXJtaW5lIGlmIHZhbHVlcyBhcmUgb2YgdGhlIGxhbmd1YWdlIHR5cGUgT2JqZWN0ICovXG52YXIgb2JqZWN0VHlwZXMgPSB7XG4gICdib29sZWFuJzogZmFsc2UsXG4gICdmdW5jdGlvbic6IHRydWUsXG4gICdvYmplY3QnOiB0cnVlLFxuICAnbnVtYmVyJzogZmFsc2UsXG4gICdzdHJpbmcnOiBmYWxzZSxcbiAgJ3VuZGVmaW5lZCc6IGZhbHNlXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG9iamVjdFR5cGVzO1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBhcnJheVBvb2wgPSByZXF1aXJlKCdsb2Rhc2guX2FycmF5cG9vbCcpLFxuICAgIG1heFBvb2xTaXplID0gcmVxdWlyZSgnbG9kYXNoLl9tYXhwb29sc2l6ZScpO1xuXG4vKipcbiAqIFJlbGVhc2VzIHRoZSBnaXZlbiBhcnJheSBiYWNrIHRvIHRoZSBhcnJheSBwb29sLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBbYXJyYXldIFRoZSBhcnJheSB0byByZWxlYXNlLlxuICovXG5mdW5jdGlvbiByZWxlYXNlQXJyYXkoYXJyYXkpIHtcbiAgYXJyYXkubGVuZ3RoID0gMDtcbiAgaWYgKGFycmF5UG9vbC5sZW5ndGggPCBtYXhQb29sU2l6ZSkge1xuICAgIGFycmF5UG9vbC5wdXNoKGFycmF5KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlbGVhc2VBcnJheTtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKiBVc2VkIGFzIHRoZSBtYXggc2l6ZSBvZiB0aGUgYGFycmF5UG9vbGAgYW5kIGBvYmplY3RQb29sYCAqL1xudmFyIG1heFBvb2xTaXplID0gNDA7XG5cbm1vZHVsZS5leHBvcnRzID0gbWF4UG9vbFNpemU7XG4iLCIvKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIGJhc2VDcmVhdGVDYWxsYmFjayA9IHJlcXVpcmUoJ2xvZGFzaC5fYmFzZWNyZWF0ZWNhbGxiYWNrJyksXG4gICAgb2JqZWN0VHlwZXMgPSByZXF1aXJlKCdsb2Rhc2guX29iamVjdHR5cGVzJyk7XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBvd24gYW5kIGluaGVyaXRlZCBlbnVtZXJhYmxlIHByb3BlcnRpZXMgb2YgYW4gb2JqZWN0LFxuICogZXhlY3V0aW5nIHRoZSBjYWxsYmFjayBmb3IgZWFjaCBwcm9wZXJ0eS4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYFxuICogYW5kIGludm9rZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM7ICh2YWx1ZSwga2V5LCBvYmplY3QpLiBDYWxsYmFja3MgbWF5IGV4aXRcbiAqIGl0ZXJhdGlvbiBlYXJseSBieSBleHBsaWNpdGx5IHJldHVybmluZyBgZmFsc2VgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAdHlwZSBGdW5jdGlvblxuICogQGNhdGVnb3J5IE9iamVjdHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqIEBleGFtcGxlXG4gKlxuICogZnVuY3Rpb24gU2hhcGUoKSB7XG4gKiAgIHRoaXMueCA9IDA7XG4gKiAgIHRoaXMueSA9IDA7XG4gKiB9XG4gKlxuICogU2hhcGUucHJvdG90eXBlLm1vdmUgPSBmdW5jdGlvbih4LCB5KSB7XG4gKiAgIHRoaXMueCArPSB4O1xuICogICB0aGlzLnkgKz0geTtcbiAqIH07XG4gKlxuICogXy5mb3JJbihuZXcgU2hhcGUsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAqICAgY29uc29sZS5sb2coa2V5KTtcbiAqIH0pO1xuICogLy8gPT4gbG9ncyAneCcsICd5JywgYW5kICdtb3ZlJyAocHJvcGVydHkgb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQgYWNyb3NzIGVudmlyb25tZW50cylcbiAqL1xudmFyIGZvckluID0gZnVuY3Rpb24oY29sbGVjdGlvbiwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgdmFyIGluZGV4LCBpdGVyYWJsZSA9IGNvbGxlY3Rpb24sIHJlc3VsdCA9IGl0ZXJhYmxlO1xuICBpZiAoIWl0ZXJhYmxlKSByZXR1cm4gcmVzdWx0O1xuICBpZiAoIW9iamVjdFR5cGVzW3R5cGVvZiBpdGVyYWJsZV0pIHJldHVybiByZXN1bHQ7XG4gIGNhbGxiYWNrID0gY2FsbGJhY2sgJiYgdHlwZW9mIHRoaXNBcmcgPT0gJ3VuZGVmaW5lZCcgPyBjYWxsYmFjayA6IGJhc2VDcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG4gICAgZm9yIChpbmRleCBpbiBpdGVyYWJsZSkge1xuICAgICAgaWYgKGNhbGxiYWNrKGl0ZXJhYmxlW2luZGV4XSwgaW5kZXgsIGNvbGxlY3Rpb24pID09PSBmYWxzZSkgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIHJldHVybiByZXN1bHRcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZm9ySW47XG4iLCIvKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIG9iamVjdFR5cGVzID0gcmVxdWlyZSgnbG9kYXNoLl9vYmplY3R0eXBlcycpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZSBsYW5ndWFnZSB0eXBlIG9mIE9iamVjdC5cbiAqIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3Qoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KDEpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgLy8gY2hlY2sgaWYgdGhlIHZhbHVlIGlzIHRoZSBFQ01BU2NyaXB0IGxhbmd1YWdlIHR5cGUgb2YgT2JqZWN0XG4gIC8vIGh0dHA6Ly9lczUuZ2l0aHViLmlvLyN4OFxuICAvLyBhbmQgYXZvaWQgYSBWOCBidWdcbiAgLy8gaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MjI5MVxuICByZXR1cm4gISEodmFsdWUgJiYgb2JqZWN0VHlwZXNbdHlwZW9mIHZhbHVlXSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3Q7XG4iLCIvKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIGlzTmF0aXZlID0gcmVxdWlyZSgnbG9kYXNoLl9pc25hdGl2ZScpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnbG9kYXNoLmlzb2JqZWN0JyksXG4gICAgc2hpbUtleXMgPSByZXF1aXJlKCdsb2Rhc2guX3NoaW1rZXlzJyk7XG5cbi8qIE5hdGl2ZSBtZXRob2Qgc2hvcnRjdXRzIGZvciBtZXRob2RzIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzICovXG52YXIgbmF0aXZlS2V5cyA9IGlzTmF0aXZlKG5hdGl2ZUtleXMgPSBPYmplY3Qua2V5cykgJiYgbmF0aXZlS2V5cztcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGFycmF5IGNvbXBvc2VkIG9mIHRoZSBvd24gZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcyBvZiBhbiBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RzXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhbiBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5rZXlzKHsgJ29uZSc6IDEsICd0d28nOiAyLCAndGhyZWUnOiAzIH0pO1xuICogLy8gPT4gWydvbmUnLCAndHdvJywgJ3RocmVlJ10gKHByb3BlcnR5IG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkIGFjcm9zcyBlbnZpcm9ubWVudHMpXG4gKi9cbnZhciBrZXlzID0gIW5hdGl2ZUtleXMgPyBzaGltS2V5cyA6IGZ1bmN0aW9uKG9iamVjdCkge1xuICBpZiAoIWlzT2JqZWN0KG9iamVjdCkpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgcmV0dXJuIG5hdGl2ZUtleXMob2JqZWN0KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5cztcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgb2JqZWN0VHlwZXMgPSByZXF1aXJlKCdsb2Rhc2guX29iamVjdHR5cGVzJyk7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBOYXRpdmUgbWV0aG9kIHNob3J0Y3V0cyAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQSBmYWxsYmFjayBpbXBsZW1lbnRhdGlvbiBvZiBgT2JqZWN0LmtleXNgIHdoaWNoIHByb2R1Y2VzIGFuIGFycmF5IG9mIHRoZVxuICogZ2l2ZW4gb2JqZWN0J3Mgb3duIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEB0eXBlIEZ1bmN0aW9uXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhbiBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAqL1xudmFyIHNoaW1LZXlzID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gIHZhciBpbmRleCwgaXRlcmFibGUgPSBvYmplY3QsIHJlc3VsdCA9IFtdO1xuICBpZiAoIWl0ZXJhYmxlKSByZXR1cm4gcmVzdWx0O1xuICBpZiAoIShvYmplY3RUeXBlc1t0eXBlb2Ygb2JqZWN0XSkpIHJldHVybiByZXN1bHQ7XG4gICAgZm9yIChpbmRleCBpbiBpdGVyYWJsZSkge1xuICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoaXRlcmFibGUsIGluZGV4KSkge1xuICAgICAgICByZXN1bHQucHVzaChpbmRleCk7XG4gICAgICB9XG4gICAgfVxuICByZXR1cm4gcmVzdWx0XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNoaW1LZXlzO1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqXG4gKiBDcmVhdGVzIGEgXCJfLnBsdWNrXCIgc3R5bGUgZnVuY3Rpb24sIHdoaWNoIHJldHVybnMgdGhlIGBrZXlgIHZhbHVlIG9mIGFcbiAqIGdpdmVuIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IFV0aWxpdGllc1xuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gcmV0cmlldmUuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gKiAgIHsgJ25hbWUnOiAnZnJlZCcsICAgJ2FnZSc6IDQwIH0sXG4gKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgJ2FnZSc6IDM2IH1cbiAqIF07XG4gKlxuICogdmFyIGdldE5hbWUgPSBfLnByb3BlcnR5KCduYW1lJyk7XG4gKlxuICogXy5tYXAoY2hhcmFjdGVycywgZ2V0TmFtZSk7XG4gKiAvLyA9PiBbJ2Jhcm5leScsICdmcmVkJ11cbiAqXG4gKiBfLnNvcnRCeShjaGFyYWN0ZXJzLCBnZXROYW1lKTtcbiAqIC8vID0+IFt7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiB9LCB7ICduYW1lJzogJ2ZyZWQnLCAgICdhZ2UnOiA0MCB9XVxuICovXG5mdW5jdGlvbiBwcm9wZXJ0eShrZXkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3Rba2V5XTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwcm9wZXJ0eTtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgYmFzZUNyZWF0ZUNhbGxiYWNrID0gcmVxdWlyZSgnbG9kYXNoLl9iYXNlY3JlYXRlY2FsbGJhY2snKSxcbiAgICBrZXlzID0gcmVxdWlyZSgnbG9kYXNoLmtleXMnKSxcbiAgICBvYmplY3RUeXBlcyA9IHJlcXVpcmUoJ2xvZGFzaC5fb2JqZWN0dHlwZXMnKTtcblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIG93biBlbnVtZXJhYmxlIHByb3BlcnRpZXMgb2YgYW4gb2JqZWN0LCBleGVjdXRpbmcgdGhlIGNhbGxiYWNrXG4gKiBmb3IgZWFjaCBwcm9wZXJ0eS4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIHRocmVlXG4gKiBhcmd1bWVudHM7ICh2YWx1ZSwga2V5LCBvYmplY3QpLiBDYWxsYmFja3MgbWF5IGV4aXQgaXRlcmF0aW9uIGVhcmx5IGJ5XG4gKiBleHBsaWNpdGx5IHJldHVybmluZyBgZmFsc2VgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAdHlwZSBGdW5jdGlvblxuICogQGNhdGVnb3J5IE9iamVjdHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5mb3JPd24oeyAnMCc6ICd6ZXJvJywgJzEnOiAnb25lJywgJ2xlbmd0aCc6IDIgfSwgZnVuY3Rpb24obnVtLCBrZXkpIHtcbiAqICAgY29uc29sZS5sb2coa2V5KTtcbiAqIH0pO1xuICogLy8gPT4gbG9ncyAnMCcsICcxJywgYW5kICdsZW5ndGgnIChwcm9wZXJ0eSBvcmRlciBpcyBub3QgZ3VhcmFudGVlZCBhY3Jvc3MgZW52aXJvbm1lbnRzKVxuICovXG52YXIgZm9yT3duID0gZnVuY3Rpb24oY29sbGVjdGlvbiwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgdmFyIGluZGV4LCBpdGVyYWJsZSA9IGNvbGxlY3Rpb24sIHJlc3VsdCA9IGl0ZXJhYmxlO1xuICBpZiAoIWl0ZXJhYmxlKSByZXR1cm4gcmVzdWx0O1xuICBpZiAoIW9iamVjdFR5cGVzW3R5cGVvZiBpdGVyYWJsZV0pIHJldHVybiByZXN1bHQ7XG4gIGNhbGxiYWNrID0gY2FsbGJhY2sgJiYgdHlwZW9mIHRoaXNBcmcgPT0gJ3VuZGVmaW5lZCcgPyBjYWxsYmFjayA6IGJhc2VDcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG4gICAgdmFyIG93bkluZGV4ID0gLTEsXG4gICAgICAgIG93blByb3BzID0gb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSAmJiBrZXlzKGl0ZXJhYmxlKSxcbiAgICAgICAgbGVuZ3RoID0gb3duUHJvcHMgPyBvd25Qcm9wcy5sZW5ndGggOiAwO1xuXG4gICAgd2hpbGUgKCsrb3duSW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIGluZGV4ID0gb3duUHJvcHNbb3duSW5kZXhdO1xuICAgICAgaWYgKGNhbGxiYWNrKGl0ZXJhYmxlW2luZGV4XSwgaW5kZXgsIGNvbGxlY3Rpb24pID09PSBmYWxzZSkgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIHJldHVybiByZXN1bHRcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZm9yT3duO1xuIiwiYXJndW1lbnRzWzRdWzM1XVswXS5hcHBseShleHBvcnRzLGFyZ3VtZW50cykiLCJhcmd1bWVudHNbNF1bMzldWzBdLmFwcGx5KGV4cG9ydHMsYXJndW1lbnRzKSIsImFyZ3VtZW50c1s0XVs0MF1bMF0uYXBwbHkoZXhwb3J0cyxhcmd1bWVudHMpIiwiYXJndW1lbnRzWzRdWzQxXVswXS5hcHBseShleHBvcnRzLGFyZ3VtZW50cykiLCJhcmd1bWVudHNbNF1bNDJdWzBdLmFwcGx5KGV4cG9ydHMsYXJndW1lbnRzKSIsImFyZ3VtZW50c1s0XVs0NV1bMF0uYXBwbHkoZXhwb3J0cyxhcmd1bWVudHMpIiwiYXJndW1lbnRzWzRdWzQyXVswXS5hcHBseShleHBvcnRzLGFyZ3VtZW50cykiLCJhcmd1bWVudHNbNF1bNjVdWzBdLmFwcGx5KGV4cG9ydHMsYXJndW1lbnRzKSIsIlxudmFyIGlzID0gcmVxdWlyZSgnaXMnKVxuICAsIGlzb2RhdGUgPSByZXF1aXJlKCdpc29kYXRlJylcbiAgLCBtaWxsaXNlY29uZHMgPSByZXF1aXJlKCcuL21pbGxpc2Vjb25kcycpXG4gICwgc2Vjb25kcyA9IHJlcXVpcmUoJy4vc2Vjb25kcycpO1xuXG5cbi8qKlxuICogUmV0dXJucyBhIG5ldyBKYXZhc2NyaXB0IERhdGUgb2JqZWN0LCBhbGxvd2luZyBhIHZhcmlldHkgb2YgZXh0cmEgaW5wdXQgdHlwZXNcbiAqIG92ZXIgdGhlIG5hdGl2ZSBEYXRlIGNvbnN0cnVjdG9yLlxuICpcbiAqIEBwYXJhbSB7RGF0ZXxTdHJpbmd8TnVtYmVyfSB2YWxcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG5ld0RhdGUgKHZhbCkge1xuICBpZiAoaXMubnVtYmVyKHZhbCkpIHJldHVybiBuZXcgRGF0ZSh0b01zKHZhbCkpO1xuICBpZiAoaXMuZGF0ZSh2YWwpKSByZXR1cm4gbmV3IERhdGUodmFsLmdldFRpbWUoKSk7IC8vIGZpcmVmb3ggd291bGRhIGZsb29yZWRcblxuICAvLyBkYXRlIHN0cmluZ3NcbiAgaWYgKGlzb2RhdGUuaXModmFsKSkgcmV0dXJuIGlzb2RhdGUucGFyc2UodmFsKTtcbiAgaWYgKG1pbGxpc2Vjb25kcy5pcyh2YWwpKSByZXR1cm4gbWlsbGlzZWNvbmRzLnBhcnNlKHZhbCk7XG4gIGlmIChzZWNvbmRzLmlzKHZhbCkpIHJldHVybiBzZWNvbmRzLnBhcnNlKHZhbCk7XG5cbiAgLy8gZmFsbGJhY2sgdG8gRGF0ZS5wYXJzZVxuICByZXR1cm4gbmV3IERhdGUodmFsKTtcbn07XG5cblxuLyoqXG4gKiBJZiB0aGUgbnVtYmVyIHBhc3NlZCB2YWwgaXMgc2Vjb25kcyBmcm9tIHRoZSBlcG9jaCwgdHVybiBpdCBpbnRvIG1pbGxpc2Vjb25kcy5cbiAqIE1pbGxpc2Vjb25kcyB3b3VsZCBiZSBncmVhdGVyIHRoYW4gMzE1NTc2MDAwMDAgKERlY2VtYmVyIDMxLCAxOTcwKS5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbnVtXG4gKi9cblxuZnVuY3Rpb24gdG9NcyAobnVtKSB7XG4gIGlmIChudW0gPCAzMTU1NzYwMDAwMCkgcmV0dXJuIG51bSAqIDEwMDA7XG4gIHJldHVybiBudW07XG59IiwiXG4vKipcbiAqIE1hdGNoZXIuXG4gKi9cblxudmFyIG1hdGNoZXIgPSAvXFxkezEzfS87XG5cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGEgc3RyaW5nIGlzIGEgbWlsbGlzZWNvbmQgZGF0ZSBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0cmluZ1xuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5leHBvcnRzLmlzID0gZnVuY3Rpb24gKHN0cmluZykge1xuICByZXR1cm4gbWF0Y2hlci50ZXN0KHN0cmluZyk7XG59O1xuXG5cbi8qKlxuICogQ29udmVydCBhIG1pbGxpc2Vjb25kIHN0cmluZyB0byBhIGRhdGUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG1pbGxpc1xuICogQHJldHVybiB7RGF0ZX1cbiAqL1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKG1pbGxpcykge1xuICBtaWxsaXMgPSBwYXJzZUludChtaWxsaXMsIDEwKTtcbiAgcmV0dXJuIG5ldyBEYXRlKG1pbGxpcyk7XG59OyIsIlxuLyoqXG4gKiBNYXRjaGVyLlxuICovXG5cbnZhciBtYXRjaGVyID0gL1xcZHsxMH0vO1xuXG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhIHN0cmluZyBpcyBhIHNlY29uZCBkYXRlIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbmV4cG9ydHMuaXMgPSBmdW5jdGlvbiAoc3RyaW5nKSB7XG4gIHJldHVybiBtYXRjaGVyLnRlc3Qoc3RyaW5nKTtcbn07XG5cblxuLyoqXG4gKiBDb252ZXJ0IGEgc2Vjb25kIHN0cmluZyB0byBhIGRhdGUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHNlY29uZHNcbiAqIEByZXR1cm4ge0RhdGV9XG4gKi9cblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChzZWNvbmRzKSB7XG4gIHZhciBtaWxsaXMgPSBwYXJzZUludChzZWNvbmRzLCAxMCkgKiAxMDAwO1xuICByZXR1cm4gbmV3IERhdGUobWlsbGlzKTtcbn07IiwiXG4vKiohXG4gKiBpc1xuICogdGhlIGRlZmluaXRpdmUgSmF2YVNjcmlwdCB0eXBlIHRlc3RpbmcgbGlicmFyeVxuICogXG4gKiBAY29weXJpZ2h0IDIwMTMgRW5yaWNvIE1hcmlub1xuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxudmFyIG9ialByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcbnZhciBvd25zID0gb2JqUHJvdG8uaGFzT3duUHJvcGVydHk7XG52YXIgdG9TdHJpbmcgPSBvYmpQcm90by50b1N0cmluZztcbnZhciBpc0FjdHVhbE5hTiA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT09IHZhbHVlO1xufTtcbnZhciBOT05fSE9TVF9UWVBFUyA9IHtcbiAgXCJib29sZWFuXCI6IDEsXG4gIFwibnVtYmVyXCI6IDEsXG4gIFwic3RyaW5nXCI6IDEsXG4gIFwidW5kZWZpbmVkXCI6IDFcbn07XG5cbi8qKlxuICogRXhwb3NlIGBpc2BcbiAqL1xuXG52YXIgaXMgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vKipcbiAqIFRlc3QgZ2VuZXJhbC5cbiAqL1xuXG4vKipcbiAqIGlzLnR5cGVcbiAqIFRlc3QgaWYgYHZhbHVlYCBpcyBhIHR5cGUgb2YgYHR5cGVgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIHZhbHVlIHRvIHRlc3RcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIHR5cGVcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyBhIHR5cGUgb2YgYHR5cGVgLCBmYWxzZSBvdGhlcndpc2VcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuaXMuYSA9XG5pcy50eXBlID0gZnVuY3Rpb24gKHZhbHVlLCB0eXBlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IHR5cGU7XG59O1xuXG4vKipcbiAqIGlzLmRlZmluZWRcbiAqIFRlc3QgaWYgYHZhbHVlYCBpcyBkZWZpbmVkLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgJ3ZhbHVlJyBpcyBkZWZpbmVkLCBmYWxzZSBvdGhlcndpc2VcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuaXMuZGVmaW5lZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT09IHVuZGVmaW5lZDtcbn07XG5cbi8qKlxuICogaXMuZW1wdHlcbiAqIFRlc3QgaWYgYHZhbHVlYCBpcyBlbXB0eS5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGB2YWx1ZWAgaXMgZW1wdHksIGZhbHNlIG90aGVyd2lzZVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5pcy5lbXB0eSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB2YXIga2V5O1xuXG4gIGlmICgnW29iamVjdCBBcnJheV0nID09PSB0eXBlIHx8ICdbb2JqZWN0IEFyZ3VtZW50c10nID09PSB0eXBlKSB7XG4gICAgcmV0dXJuIHZhbHVlLmxlbmd0aCA9PT0gMDtcbiAgfVxuXG4gIGlmICgnW29iamVjdCBPYmplY3RdJyA9PT0gdHlwZSkge1xuICAgIGZvciAoa2V5IGluIHZhbHVlKSBpZiAob3ducy5jYWxsKHZhbHVlLCBrZXkpKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpZiAoJ1tvYmplY3QgU3RyaW5nXScgPT09IHR5cGUpIHtcbiAgICByZXR1cm4gJycgPT09IHZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBpcy5lcXVhbFxuICogVGVzdCBpZiBgdmFsdWVgIGlzIGVxdWFsIHRvIGBvdGhlcmAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgdmFsdWUgdG8gdGVzdFxuICogQHBhcmFtIHtNaXhlZH0gb3RoZXIgdmFsdWUgdG8gY29tcGFyZSB3aXRoXG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGB2YWx1ZWAgaXMgZXF1YWwgdG8gYG90aGVyYCwgZmFsc2Ugb3RoZXJ3aXNlXG4gKi9cblxuaXMuZXF1YWwgPSBmdW5jdGlvbiAodmFsdWUsIG90aGVyKSB7XG4gIHZhciB0eXBlID0gdG9TdHJpbmcuY2FsbCh2YWx1ZSlcbiAgdmFyIGtleTtcblxuICBpZiAodHlwZSAhPT0gdG9TdHJpbmcuY2FsbChvdGhlcikpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoJ1tvYmplY3QgT2JqZWN0XScgPT09IHR5cGUpIHtcbiAgICBmb3IgKGtleSBpbiB2YWx1ZSkge1xuICAgICAgaWYgKCFpcy5lcXVhbCh2YWx1ZVtrZXldLCBvdGhlcltrZXldKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKCdbb2JqZWN0IEFycmF5XScgPT09IHR5cGUpIHtcbiAgICBrZXkgPSB2YWx1ZS5sZW5ndGg7XG4gICAgaWYgKGtleSAhPT0gb3RoZXIubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHdoaWxlICgtLWtleSkge1xuICAgICAgaWYgKCFpcy5lcXVhbCh2YWx1ZVtrZXldLCBvdGhlcltrZXldKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKCdbb2JqZWN0IEZ1bmN0aW9uXScgPT09IHR5cGUpIHtcbiAgICByZXR1cm4gdmFsdWUucHJvdG90eXBlID09PSBvdGhlci5wcm90b3R5cGU7XG4gIH1cblxuICBpZiAoJ1tvYmplY3QgRGF0ZV0nID09PSB0eXBlKSB7XG4gICAgcmV0dXJuIHZhbHVlLmdldFRpbWUoKSA9PT0gb3RoZXIuZ2V0VGltZSgpO1xuICB9XG5cbiAgcmV0dXJuIHZhbHVlID09PSBvdGhlcjtcbn07XG5cbi8qKlxuICogaXMuaG9zdGVkXG4gKiBUZXN0IGlmIGB2YWx1ZWAgaXMgaG9zdGVkIGJ5IGBob3N0YC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZSB0byB0ZXN0XG4gKiBAcGFyYW0ge01peGVkfSBob3N0IGhvc3QgdG8gdGVzdCB3aXRoXG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGB2YWx1ZWAgaXMgaG9zdGVkIGJ5IGBob3N0YCwgZmFsc2Ugb3RoZXJ3aXNlXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmlzLmhvc3RlZCA9IGZ1bmN0aW9uICh2YWx1ZSwgaG9zdCkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiBob3N0W3ZhbHVlXTtcbiAgcmV0dXJuIHR5cGUgPT09ICdvYmplY3QnID8gISFob3N0W3ZhbHVlXSA6ICFOT05fSE9TVF9UWVBFU1t0eXBlXTtcbn07XG5cbi8qKlxuICogaXMuaW5zdGFuY2VcbiAqIFRlc3QgaWYgYHZhbHVlYCBpcyBhbiBpbnN0YW5jZSBvZiBgY29uc3RydWN0b3JgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyBhbiBpbnN0YW5jZSBvZiBgY29uc3RydWN0b3JgXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmlzLmluc3RhbmNlID0gaXNbJ2luc3RhbmNlb2YnXSA9IGZ1bmN0aW9uICh2YWx1ZSwgY29uc3RydWN0b3IpIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgY29uc3RydWN0b3I7XG59O1xuXG4vKipcbiAqIGlzLm51bGxcbiAqIFRlc3QgaWYgYHZhbHVlYCBpcyBudWxsLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyBudWxsLCBmYWxzZSBvdGhlcndpc2VcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuaXNbJ251bGwnXSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09IG51bGw7XG59O1xuXG4vKipcbiAqIGlzLnVuZGVmaW5lZFxuICogVGVzdCBpZiBgdmFsdWVgIGlzIHVuZGVmaW5lZC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGB2YWx1ZWAgaXMgdW5kZWZpbmVkLCBmYWxzZSBvdGhlcndpc2VcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuaXMudW5kZWZpbmVkID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gdW5kZWZpbmVkO1xufTtcblxuLyoqXG4gKiBUZXN0IGFyZ3VtZW50cy5cbiAqL1xuXG4vKipcbiAqIGlzLmFyZ3VtZW50c1xuICogVGVzdCBpZiBgdmFsdWVgIGlzIGFuIGFyZ3VtZW50cyBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiBgdmFsdWVgIGlzIGFuIGFyZ3VtZW50cyBvYmplY3QsIGZhbHNlIG90aGVyd2lzZVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5pcy5hcmd1bWVudHMgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgdmFyIGlzU3RhbmRhcmRBcmd1bWVudHMgPSAnW29iamVjdCBBcmd1bWVudHNdJyA9PT0gdG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIHZhciBpc09sZEFyZ3VtZW50cyA9ICFpcy5hcnJheSh2YWx1ZSkgJiYgaXMuYXJyYXlsaWtlKHZhbHVlKSAmJiBpcy5vYmplY3QodmFsdWUpICYmIGlzLmZuKHZhbHVlLmNhbGxlZSk7XG4gIHJldHVybiBpc1N0YW5kYXJkQXJndW1lbnRzIHx8IGlzT2xkQXJndW1lbnRzO1xufTtcblxuLyoqXG4gKiBUZXN0IGFycmF5LlxuICovXG5cbi8qKlxuICogaXMuYXJyYXlcbiAqIFRlc3QgaWYgJ3ZhbHVlJyBpcyBhbiBhcnJheS5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGB2YWx1ZWAgaXMgYW4gYXJyYXksIGZhbHNlIG90aGVyd2lzZVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5pcy5hcnJheSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gJ1tvYmplY3QgQXJyYXldJyA9PT0gdG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG59O1xuXG4vKipcbiAqIGlzLmFyZ3VtZW50cy5lbXB0eVxuICogVGVzdCBpZiBgdmFsdWVgIGlzIGFuIGVtcHR5IGFyZ3VtZW50cyBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiBgdmFsdWVgIGlzIGFuIGVtcHR5IGFyZ3VtZW50cyBvYmplY3QsIGZhbHNlIG90aGVyd2lzZVxuICogQGFwaSBwdWJsaWNcbiAqL1xuaXMuYXJndW1lbnRzLmVtcHR5ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBpcy5hcmd1bWVudHModmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMDtcbn07XG5cbi8qKlxuICogaXMuYXJyYXkuZW1wdHlcbiAqIFRlc3QgaWYgYHZhbHVlYCBpcyBhbiBlbXB0eSBhcnJheS5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGB2YWx1ZWAgaXMgYW4gZW1wdHkgYXJyYXksIGZhbHNlIG90aGVyd2lzZVxuICogQGFwaSBwdWJsaWNcbiAqL1xuaXMuYXJyYXkuZW1wdHkgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIGlzLmFycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDA7XG59O1xuXG4vKipcbiAqIGlzLmFycmF5bGlrZVxuICogVGVzdCBpZiBgdmFsdWVgIGlzIGFuIGFycmF5bGlrZSBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiBgdmFsdWVgIGlzIGFuIGFyZ3VtZW50cyBvYmplY3QsIGZhbHNlIG90aGVyd2lzZVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5pcy5hcnJheWxpa2UgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgIWlzLmJvb2xlYW4odmFsdWUpXG4gICAgJiYgb3ducy5jYWxsKHZhbHVlLCAnbGVuZ3RoJylcbiAgICAmJiBpc0Zpbml0ZSh2YWx1ZS5sZW5ndGgpXG4gICAgJiYgaXMubnVtYmVyKHZhbHVlLmxlbmd0aClcbiAgICAmJiB2YWx1ZS5sZW5ndGggPj0gMDtcbn07XG5cbi8qKlxuICogVGVzdCBib29sZWFuLlxuICovXG5cbi8qKlxuICogaXMuYm9vbGVhblxuICogVGVzdCBpZiBgdmFsdWVgIGlzIGEgYm9vbGVhbi5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGB2YWx1ZWAgaXMgYSBib29sZWFuLCBmYWxzZSBvdGhlcndpc2VcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuaXMuYm9vbGVhbiA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gJ1tvYmplY3QgQm9vbGVhbl0nID09PSB0b1N0cmluZy5jYWxsKHZhbHVlKTtcbn07XG5cbi8qKlxuICogaXMuZmFsc2VcbiAqIFRlc3QgaWYgYHZhbHVlYCBpcyBmYWxzZS5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGB2YWx1ZWAgaXMgZmFsc2UsIGZhbHNlIG90aGVyd2lzZVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5pc1snZmFsc2UnXSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gaXMuYm9vbGVhbih2YWx1ZSkgJiYgKHZhbHVlID09PSBmYWxzZSB8fCB2YWx1ZS52YWx1ZU9mKCkgPT09IGZhbHNlKTtcbn07XG5cbi8qKlxuICogaXMudHJ1ZVxuICogVGVzdCBpZiBgdmFsdWVgIGlzIHRydWUuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiBgdmFsdWVgIGlzIHRydWUsIGZhbHNlIG90aGVyd2lzZVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5pc1sndHJ1ZSddID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBpcy5ib29sZWFuKHZhbHVlKSAmJiAodmFsdWUgPT09IHRydWUgfHwgdmFsdWUudmFsdWVPZigpID09PSB0cnVlKTtcbn07XG5cbi8qKlxuICogVGVzdCBkYXRlLlxuICovXG5cbi8qKlxuICogaXMuZGF0ZVxuICogVGVzdCBpZiBgdmFsdWVgIGlzIGEgZGF0ZS5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGB2YWx1ZWAgaXMgYSBkYXRlLCBmYWxzZSBvdGhlcndpc2VcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuaXMuZGF0ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gJ1tvYmplY3QgRGF0ZV0nID09PSB0b1N0cmluZy5jYWxsKHZhbHVlKTtcbn07XG5cbi8qKlxuICogVGVzdCBlbGVtZW50LlxuICovXG5cbi8qKlxuICogaXMuZWxlbWVudFxuICogVGVzdCBpZiBgdmFsdWVgIGlzIGFuIGh0bWwgZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGB2YWx1ZWAgaXMgYW4gSFRNTCBFbGVtZW50LCBmYWxzZSBvdGhlcndpc2VcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuaXMuZWxlbWVudCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT09IHVuZGVmaW5lZFxuICAgICYmIHR5cGVvZiBIVE1MRWxlbWVudCAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB2YWx1ZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50XG4gICAgJiYgdmFsdWUubm9kZVR5cGUgPT09IDE7XG59O1xuXG4vKipcbiAqIFRlc3QgZXJyb3IuXG4gKi9cblxuLyoqXG4gKiBpcy5lcnJvclxuICogVGVzdCBpZiBgdmFsdWVgIGlzIGFuIGVycm9yIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGB2YWx1ZWAgaXMgYW4gZXJyb3Igb2JqZWN0LCBmYWxzZSBvdGhlcndpc2VcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuaXMuZXJyb3IgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuICdbb2JqZWN0IEVycm9yXScgPT09IHRvU3RyaW5nLmNhbGwodmFsdWUpO1xufTtcblxuLyoqXG4gKiBUZXN0IGZ1bmN0aW9uLlxuICovXG5cbi8qKlxuICogaXMuZm4gLyBpcy5mdW5jdGlvbiAoZGVwcmVjYXRlZClcbiAqIFRlc3QgaWYgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uLCBmYWxzZSBvdGhlcndpc2VcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuaXMuZm4gPSBpc1snZnVuY3Rpb24nXSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgaXNBbGVydCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHZhbHVlID09PSB3aW5kb3cuYWxlcnQ7XG4gIHJldHVybiBpc0FsZXJ0IHx8ICdbb2JqZWN0IEZ1bmN0aW9uXScgPT09IHRvU3RyaW5nLmNhbGwodmFsdWUpO1xufTtcblxuLyoqXG4gKiBUZXN0IG51bWJlci5cbiAqL1xuXG4vKipcbiAqIGlzLm51bWJlclxuICogVGVzdCBpZiBgdmFsdWVgIGlzIGEgbnVtYmVyLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyBhIG51bWJlciwgZmFsc2Ugb3RoZXJ3aXNlXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmlzLm51bWJlciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gJ1tvYmplY3QgTnVtYmVyXScgPT09IHRvU3RyaW5nLmNhbGwodmFsdWUpO1xufTtcblxuLyoqXG4gKiBpcy5pbmZpbml0ZVxuICogVGVzdCBpZiBgdmFsdWVgIGlzIHBvc2l0aXZlIG9yIG5lZ2F0aXZlIGluZmluaXR5LlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyBwb3NpdGl2ZSBvciBuZWdhdGl2ZSBJbmZpbml0eSwgZmFsc2Ugb3RoZXJ3aXNlXG4gKiBAYXBpIHB1YmxpY1xuICovXG5pcy5pbmZpbml0ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09IEluZmluaXR5IHx8IHZhbHVlID09PSAtSW5maW5pdHk7XG59O1xuXG4vKipcbiAqIGlzLmRlY2ltYWxcbiAqIFRlc3QgaWYgYHZhbHVlYCBpcyBhIGRlY2ltYWwgbnVtYmVyLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyBhIGRlY2ltYWwgbnVtYmVyLCBmYWxzZSBvdGhlcndpc2VcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuaXMuZGVjaW1hbCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gaXMubnVtYmVyKHZhbHVlKSAmJiAhaXNBY3R1YWxOYU4odmFsdWUpICYmIHZhbHVlICUgMSAhPT0gMDtcbn07XG5cbi8qKlxuICogaXMuZGl2aXNpYmxlQnlcbiAqIFRlc3QgaWYgYHZhbHVlYCBpcyBkaXZpc2libGUgYnkgYG5gLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB2YWx1ZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcGFyYW0ge051bWJlcn0gbiBkaXZpZGVuZFxuICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiBgdmFsdWVgIGlzIGRpdmlzaWJsZSBieSBgbmAsIGZhbHNlIG90aGVyd2lzZVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5pcy5kaXZpc2libGVCeSA9IGZ1bmN0aW9uICh2YWx1ZSwgbikge1xuICB2YXIgaXNEaXZpZGVuZEluZmluaXRlID0gaXMuaW5maW5pdGUodmFsdWUpO1xuICB2YXIgaXNEaXZpc29ySW5maW5pdGUgPSBpcy5pbmZpbml0ZShuKTtcbiAgdmFyIGlzTm9uWmVyb051bWJlciA9IGlzLm51bWJlcih2YWx1ZSkgJiYgIWlzQWN0dWFsTmFOKHZhbHVlKSAmJiBpcy5udW1iZXIobikgJiYgIWlzQWN0dWFsTmFOKG4pICYmIG4gIT09IDA7XG4gIHJldHVybiBpc0RpdmlkZW5kSW5maW5pdGUgfHwgaXNEaXZpc29ySW5maW5pdGUgfHwgKGlzTm9uWmVyb051bWJlciAmJiB2YWx1ZSAlIG4gPT09IDApO1xufTtcblxuLyoqXG4gKiBpcy5pbnRcbiAqIFRlc3QgaWYgYHZhbHVlYCBpcyBhbiBpbnRlZ2VyLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGB2YWx1ZWAgaXMgYW4gaW50ZWdlciwgZmFsc2Ugb3RoZXJ3aXNlXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmlzLmludCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gaXMubnVtYmVyKHZhbHVlKSAmJiAhaXNBY3R1YWxOYU4odmFsdWUpICYmIHZhbHVlICUgMSA9PT0gMDtcbn07XG5cbi8qKlxuICogaXMubWF4aW11bVxuICogVGVzdCBpZiBgdmFsdWVgIGlzIGdyZWF0ZXIgdGhhbiAnb3RoZXJzJyB2YWx1ZXMuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIHZhbHVlIHRvIHRlc3RcbiAqIEBwYXJhbSB7QXJyYXl9IG90aGVycyB2YWx1ZXMgdG8gY29tcGFyZSB3aXRoXG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGB2YWx1ZWAgaXMgZ3JlYXRlciB0aGFuIGBvdGhlcnNgIHZhbHVlc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5pcy5tYXhpbXVtID0gZnVuY3Rpb24gKHZhbHVlLCBvdGhlcnMpIHtcbiAgaWYgKGlzQWN0dWFsTmFOKHZhbHVlKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ05hTiBpcyBub3QgYSB2YWxpZCB2YWx1ZScpO1xuICB9IGVsc2UgaWYgKCFpcy5hcnJheWxpa2Uob3RoZXJzKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3NlY29uZCBhcmd1bWVudCBtdXN0IGJlIGFycmF5LWxpa2UnKTtcbiAgfVxuICB2YXIgbGVuID0gb3RoZXJzLmxlbmd0aDtcblxuICB3aGlsZSAoLS1sZW4gPj0gMCkge1xuICAgIGlmICh2YWx1ZSA8IG90aGVyc1tsZW5dKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIGlzLm1pbmltdW1cbiAqIFRlc3QgaWYgYHZhbHVlYCBpcyBsZXNzIHRoYW4gYG90aGVyc2AgdmFsdWVzLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB2YWx1ZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcGFyYW0ge0FycmF5fSBvdGhlcnMgdmFsdWVzIHRvIGNvbXBhcmUgd2l0aFxuICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiBgdmFsdWVgIGlzIGxlc3MgdGhhbiBgb3RoZXJzYCB2YWx1ZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuaXMubWluaW11bSA9IGZ1bmN0aW9uICh2YWx1ZSwgb3RoZXJzKSB7XG4gIGlmIChpc0FjdHVhbE5hTih2YWx1ZSkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdOYU4gaXMgbm90IGEgdmFsaWQgdmFsdWUnKTtcbiAgfSBlbHNlIGlmICghaXMuYXJyYXlsaWtlKG90aGVycykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdzZWNvbmQgYXJndW1lbnQgbXVzdCBiZSBhcnJheS1saWtlJyk7XG4gIH1cbiAgdmFyIGxlbiA9IG90aGVycy5sZW5ndGg7XG5cbiAgd2hpbGUgKC0tbGVuID49IDApIHtcbiAgICBpZiAodmFsdWUgPiBvdGhlcnNbbGVuXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBpcy5uYW5cbiAqIFRlc3QgaWYgYHZhbHVlYCBpcyBub3QgYSBudW1iZXIuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiBgdmFsdWVgIGlzIG5vdCBhIG51bWJlciwgZmFsc2Ugb3RoZXJ3aXNlXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmlzLm5hbiA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gIWlzLm51bWJlcih2YWx1ZSkgfHwgdmFsdWUgIT09IHZhbHVlO1xufTtcblxuLyoqXG4gKiBpcy5ldmVuXG4gKiBUZXN0IGlmIGB2YWx1ZWAgaXMgYW4gZXZlbiBudW1iZXIuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyBhbiBldmVuIG51bWJlciwgZmFsc2Ugb3RoZXJ3aXNlXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmlzLmV2ZW4gPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIGlzLmluZmluaXRlKHZhbHVlKSB8fCAoaXMubnVtYmVyKHZhbHVlKSAmJiB2YWx1ZSA9PT0gdmFsdWUgJiYgdmFsdWUgJSAyID09PSAwKTtcbn07XG5cbi8qKlxuICogaXMub2RkXG4gKiBUZXN0IGlmIGB2YWx1ZWAgaXMgYW4gb2RkIG51bWJlci5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdmFsdWUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiBgdmFsdWVgIGlzIGFuIG9kZCBudW1iZXIsIGZhbHNlIG90aGVyd2lzZVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5pcy5vZGQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIGlzLmluZmluaXRlKHZhbHVlKSB8fCAoaXMubnVtYmVyKHZhbHVlKSAmJiB2YWx1ZSA9PT0gdmFsdWUgJiYgdmFsdWUgJSAyICE9PSAwKTtcbn07XG5cbi8qKlxuICogaXMuZ2VcbiAqIFRlc3QgaWYgYHZhbHVlYCBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gYG90aGVyYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdmFsdWUgdmFsdWUgdG8gdGVzdFxuICogQHBhcmFtIHtOdW1iZXJ9IG90aGVyIHZhbHVlIHRvIGNvbXBhcmUgd2l0aFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuaXMuZ2UgPSBmdW5jdGlvbiAodmFsdWUsIG90aGVyKSB7XG4gIGlmIChpc0FjdHVhbE5hTih2YWx1ZSkgfHwgaXNBY3R1YWxOYU4ob3RoZXIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignTmFOIGlzIG5vdCBhIHZhbGlkIHZhbHVlJyk7XG4gIH1cbiAgcmV0dXJuICFpcy5pbmZpbml0ZSh2YWx1ZSkgJiYgIWlzLmluZmluaXRlKG90aGVyKSAmJiB2YWx1ZSA+PSBvdGhlcjtcbn07XG5cbi8qKlxuICogaXMuZ3RcbiAqIFRlc3QgaWYgYHZhbHVlYCBpcyBncmVhdGVyIHRoYW4gYG90aGVyYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdmFsdWUgdmFsdWUgdG8gdGVzdFxuICogQHBhcmFtIHtOdW1iZXJ9IG90aGVyIHZhbHVlIHRvIGNvbXBhcmUgd2l0aFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuaXMuZ3QgPSBmdW5jdGlvbiAodmFsdWUsIG90aGVyKSB7XG4gIGlmIChpc0FjdHVhbE5hTih2YWx1ZSkgfHwgaXNBY3R1YWxOYU4ob3RoZXIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignTmFOIGlzIG5vdCBhIHZhbGlkIHZhbHVlJyk7XG4gIH1cbiAgcmV0dXJuICFpcy5pbmZpbml0ZSh2YWx1ZSkgJiYgIWlzLmluZmluaXRlKG90aGVyKSAmJiB2YWx1ZSA+IG90aGVyO1xufTtcblxuLyoqXG4gKiBpcy5sZVxuICogVGVzdCBpZiBgdmFsdWVgIGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byBgb3RoZXJgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB2YWx1ZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcGFyYW0ge051bWJlcn0gb3RoZXIgdmFsdWUgdG8gY29tcGFyZSB3aXRoXG4gKiBAcmV0dXJuIHtCb29sZWFufSBpZiAndmFsdWUnIGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byAnb3RoZXInXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmlzLmxlID0gZnVuY3Rpb24gKHZhbHVlLCBvdGhlcikge1xuICBpZiAoaXNBY3R1YWxOYU4odmFsdWUpIHx8IGlzQWN0dWFsTmFOKG90aGVyKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ05hTiBpcyBub3QgYSB2YWxpZCB2YWx1ZScpO1xuICB9XG4gIHJldHVybiAhaXMuaW5maW5pdGUodmFsdWUpICYmICFpcy5pbmZpbml0ZShvdGhlcikgJiYgdmFsdWUgPD0gb3RoZXI7XG59O1xuXG4vKipcbiAqIGlzLmx0XG4gKiBUZXN0IGlmIGB2YWx1ZWAgaXMgbGVzcyB0aGFuIGBvdGhlcmAuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIHZhbHVlIHRvIHRlc3RcbiAqIEBwYXJhbSB7TnVtYmVyfSBvdGhlciB2YWx1ZSB0byBjb21wYXJlIHdpdGhcbiAqIEByZXR1cm4ge0Jvb2xlYW59IGlmIGB2YWx1ZWAgaXMgbGVzcyB0aGFuIGBvdGhlcmBcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuaXMubHQgPSBmdW5jdGlvbiAodmFsdWUsIG90aGVyKSB7XG4gIGlmIChpc0FjdHVhbE5hTih2YWx1ZSkgfHwgaXNBY3R1YWxOYU4ob3RoZXIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignTmFOIGlzIG5vdCBhIHZhbGlkIHZhbHVlJyk7XG4gIH1cbiAgcmV0dXJuICFpcy5pbmZpbml0ZSh2YWx1ZSkgJiYgIWlzLmluZmluaXRlKG90aGVyKSAmJiB2YWx1ZSA8IG90aGVyO1xufTtcblxuLyoqXG4gKiBpcy53aXRoaW5cbiAqIFRlc3QgaWYgYHZhbHVlYCBpcyB3aXRoaW4gYHN0YXJ0YCBhbmQgYGZpbmlzaGAuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIHZhbHVlIHRvIHRlc3RcbiAqIEBwYXJhbSB7TnVtYmVyfSBzdGFydCBsb3dlciBib3VuZFxuICogQHBhcmFtIHtOdW1iZXJ9IGZpbmlzaCB1cHBlciBib3VuZFxuICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiAndmFsdWUnIGlzIGlzIHdpdGhpbiAnc3RhcnQnIGFuZCAnZmluaXNoJ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuaXMud2l0aGluID0gZnVuY3Rpb24gKHZhbHVlLCBzdGFydCwgZmluaXNoKSB7XG4gIGlmIChpc0FjdHVhbE5hTih2YWx1ZSkgfHwgaXNBY3R1YWxOYU4oc3RhcnQpIHx8IGlzQWN0dWFsTmFOKGZpbmlzaCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdOYU4gaXMgbm90IGEgdmFsaWQgdmFsdWUnKTtcbiAgfSBlbHNlIGlmICghaXMubnVtYmVyKHZhbHVlKSB8fCAhaXMubnVtYmVyKHN0YXJ0KSB8fCAhaXMubnVtYmVyKGZpbmlzaCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdhbGwgYXJndW1lbnRzIG11c3QgYmUgbnVtYmVycycpO1xuICB9XG4gIHZhciBpc0FueUluZmluaXRlID0gaXMuaW5maW5pdGUodmFsdWUpIHx8IGlzLmluZmluaXRlKHN0YXJ0KSB8fCBpcy5pbmZpbml0ZShmaW5pc2gpO1xuICByZXR1cm4gaXNBbnlJbmZpbml0ZSB8fCAodmFsdWUgPj0gc3RhcnQgJiYgdmFsdWUgPD0gZmluaXNoKTtcbn07XG5cbi8qKlxuICogVGVzdCBvYmplY3QuXG4gKi9cblxuLyoqXG4gKiBpcy5vYmplY3RcbiAqIFRlc3QgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZmFsc2Ugb3RoZXJ3aXNlXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmlzLm9iamVjdCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgJiYgJ1tvYmplY3QgT2JqZWN0XScgPT09IHRvU3RyaW5nLmNhbGwodmFsdWUpO1xufTtcblxuLyoqXG4gKiBpcy5oYXNoXG4gKiBUZXN0IGlmIGB2YWx1ZWAgaXMgYSBoYXNoIC0gYSBwbGFpbiBvYmplY3QgbGl0ZXJhbC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGB2YWx1ZWAgaXMgYSBoYXNoLCBmYWxzZSBvdGhlcndpc2VcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuaXMuaGFzaCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gaXMub2JqZWN0KHZhbHVlKSAmJiB2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0ICYmICF2YWx1ZS5ub2RlVHlwZSAmJiAhdmFsdWUuc2V0SW50ZXJ2YWw7XG59O1xuXG4vKipcbiAqIFRlc3QgcmVnZXhwLlxuICovXG5cbi8qKlxuICogaXMucmVnZXhwXG4gKiBUZXN0IGlmIGB2YWx1ZWAgaXMgYSByZWd1bGFyIGV4cHJlc3Npb24uXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiBgdmFsdWVgIGlzIGEgcmVnZXhwLCBmYWxzZSBvdGhlcndpc2VcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuaXMucmVnZXhwID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiAnW29iamVjdCBSZWdFeHBdJyA9PT0gdG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG59O1xuXG4vKipcbiAqIFRlc3Qgc3RyaW5nLlxuICovXG5cbi8qKlxuICogaXMuc3RyaW5nXG4gKiBUZXN0IGlmIGB2YWx1ZWAgaXMgYSBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiAndmFsdWUnIGlzIGEgc3RyaW5nLCBmYWxzZSBvdGhlcndpc2VcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuaXMuc3RyaW5nID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiAnW29iamVjdCBTdHJpbmddJyA9PT0gdG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG59O1xuXG4iLCJcbi8qKlxuICogTWF0Y2hlciwgc2xpZ2h0bHkgbW9kaWZpZWQgZnJvbTpcbiAqXG4gKiBodHRwczovL2dpdGh1Yi5jb20vY3Nub3Zlci9qcy1pc284NjAxL2Jsb2IvbGF4L2lzbzg2MDEuanNcbiAqL1xuXG52YXIgbWF0Y2hlciA9IC9eKFxcZHs0fSkoPzotPyhcXGR7Mn0pKD86LT8oXFxkezJ9KSk/KT8oPzooWyBUXSkoXFxkezJ9KTo/KFxcZHsyfSkoPzo6PyhcXGR7Mn0pKD86WyxcXC5dKFxcZHsxLH0pKT8pPyg/OihaKXwoWytcXC1dKShcXGR7Mn0pKD86Oj8oXFxkezJ9KSk/KT8pPyQvO1xuXG5cbi8qKlxuICogQ29udmVydCBhbiBJU08gZGF0ZSBzdHJpbmcgdG8gYSBkYXRlLiBGYWxsYmFjayB0byBuYXRpdmUgYERhdGUucGFyc2VgLlxuICpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9jc25vdmVyL2pzLWlzbzg2MDEvYmxvYi9sYXgvaXNvODYwMS5qc1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBpc29cbiAqIEByZXR1cm4ge0RhdGV9XG4gKi9cblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChpc28pIHtcbiAgdmFyIG51bWVyaWNLZXlzID0gWzEsIDUsIDYsIDcsIDgsIDExLCAxMl07XG4gIHZhciBhcnIgPSBtYXRjaGVyLmV4ZWMoaXNvKTtcbiAgdmFyIG9mZnNldCA9IDA7XG5cbiAgLy8gZmFsbGJhY2sgdG8gbmF0aXZlIHBhcnNpbmdcbiAgaWYgKCFhcnIpIHJldHVybiBuZXcgRGF0ZShpc28pO1xuXG4gIC8vIHJlbW92ZSB1bmRlZmluZWQgdmFsdWVzXG4gIGZvciAodmFyIGkgPSAwLCB2YWw7IHZhbCA9IG51bWVyaWNLZXlzW2ldOyBpKyspIHtcbiAgICBhcnJbdmFsXSA9IHBhcnNlSW50KGFyclt2YWxdLCAxMCkgfHwgMDtcbiAgfVxuXG4gIC8vIGFsbG93IHVuZGVmaW5lZCBkYXlzIGFuZCBtb250aHNcbiAgYXJyWzJdID0gcGFyc2VJbnQoYXJyWzJdLCAxMCkgfHwgMTtcbiAgYXJyWzNdID0gcGFyc2VJbnQoYXJyWzNdLCAxMCkgfHwgMTtcblxuICAvLyBtb250aCBpcyAwLTExXG4gIGFyclsyXS0tO1xuXG4gIC8vIGFsbG93IGFiaXRyYXJ5IHN1Yi1zZWNvbmQgcHJlY2lzaW9uXG4gIGlmIChhcnJbOF0pIGFycls4XSA9IChhcnJbOF0gKyAnMDAnKS5zdWJzdHJpbmcoMCwgMyk7XG5cbiAgLy8gYXBwbHkgdGltZXpvbmUgaWYgb25lIGV4aXN0c1xuICBpZiAoYXJyWzRdID09ICcgJykge1xuICAgIG9mZnNldCA9IG5ldyBEYXRlKCkuZ2V0VGltZXpvbmVPZmZzZXQoKTtcbiAgfSBlbHNlIGlmIChhcnJbOV0gIT09ICdaJyAmJiBhcnJbMTBdKSB7XG4gICAgb2Zmc2V0ID0gYXJyWzExXSAqIDYwICsgYXJyWzEyXTtcbiAgICBpZiAoJysnID09IGFyclsxMF0pIG9mZnNldCA9IDAgLSBvZmZzZXQ7XG4gIH1cblxuICB2YXIgbWlsbGlzID0gRGF0ZS5VVEMoYXJyWzFdLCBhcnJbMl0sIGFyclszXSwgYXJyWzVdLCBhcnJbNl0gKyBvZmZzZXQsIGFycls3XSwgYXJyWzhdKTtcbiAgcmV0dXJuIG5ldyBEYXRlKG1pbGxpcyk7XG59O1xuXG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgYSBgc3RyaW5nYCBpcyBhbiBJU08gZGF0ZSBzdHJpbmcuIGBzdHJpY3RgIG1vZGUgcmVxdWlyZXMgdGhhdFxuICogdGhlIGRhdGUgc3RyaW5nIGF0IGxlYXN0IGhhdmUgYSB5ZWFyLCBtb250aCBhbmQgZGF0ZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHN0cmljdFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5leHBvcnRzLmlzID0gZnVuY3Rpb24gKHN0cmluZywgc3RyaWN0KSB7XG4gIGlmIChzdHJpY3QgJiYgZmFsc2UgPT09IC9eXFxkezR9LVxcZHsyfS1cXGR7Mn0vLnRlc3Qoc3RyaW5nKSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gbWF0Y2hlci50ZXN0KHN0cmluZyk7XG59OyIsIi8vXG4vLyBzdHJmdGltZVxuLy8gZ2l0aHViLmNvbS9zYW1zb25qcy9zdHJmdGltZVxuLy8gQF9zanNcbi8vXG4vLyBDb3B5cmlnaHQgMjAxMCAtIDIwMTMgU2FtaSBTYW1odXJpIDxzYW1pQHNhbWh1cmkubmV0PlxuLy9cbi8vIE1JVCBMaWNlbnNlXG4vLyBodHRwOi8vc2pzLm1pdC1saWNlbnNlLm9yZ1xuLy9cblxuOyhmdW5jdGlvbigpIHtcblxuICAvLy8vIFdoZXJlIHRvIGV4cG9ydCB0aGUgQVBJXG4gIHZhciBuYW1lc3BhY2U7XG5cbiAgLy8gQ29tbW9uSlMgLyBOb2RlIG1vZHVsZVxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBuYW1lc3BhY2UgPSBtb2R1bGUuZXhwb3J0cyA9IHN0cmZ0aW1lO1xuICB9XG5cbiAgLy8gQnJvd3NlcnMgYW5kIG90aGVyIGVudmlyb25tZW50c1xuICBlbHNlIHtcbiAgICAvLyBHZXQgdGhlIGdsb2JhbCBvYmplY3QuIFdvcmtzIGluIEVTMywgRVM1LCBhbmQgRVM1IHN0cmljdCBtb2RlLlxuICAgIG5hbWVzcGFjZSA9IChmdW5jdGlvbigpeyByZXR1cm4gdGhpcyB8fCAoMSxldmFsKSgndGhpcycpIH0oKSk7XG4gIH1cblxuICBmdW5jdGlvbiB3b3JkcyhzKSB7IHJldHVybiAocyB8fCAnJykuc3BsaXQoJyAnKTsgfVxuXG4gIHZhciBEZWZhdWx0TG9jYWxlID1cbiAgeyBkYXlzOiB3b3JkcygnU3VuZGF5IE1vbmRheSBUdWVzZGF5IFdlZG5lc2RheSBUaHVyc2RheSBGcmlkYXkgU2F0dXJkYXknKVxuICAsIHNob3J0RGF5czogd29yZHMoJ1N1biBNb24gVHVlIFdlZCBUaHUgRnJpIFNhdCcpXG4gICwgbW9udGhzOiB3b3JkcygnSmFudWFyeSBGZWJydWFyeSBNYXJjaCBBcHJpbCBNYXkgSnVuZSBKdWx5IEF1Z3VzdCBTZXB0ZW1iZXIgT2N0b2JlciBOb3ZlbWJlciBEZWNlbWJlcicpXG4gICwgc2hvcnRNb250aHM6IHdvcmRzKCdKYW4gRmViIE1hciBBcHIgTWF5IEp1biBKdWwgQXVnIFNlcCBPY3QgTm92IERlYycpXG4gICwgQU06ICdBTSdcbiAgLCBQTTogJ1BNJ1xuICAsIGFtOiAnYW0nXG4gICwgcG06ICdwbSdcbiAgfTtcblxuICBuYW1lc3BhY2Uuc3RyZnRpbWUgPSBzdHJmdGltZTtcbiAgZnVuY3Rpb24gc3RyZnRpbWUoZm10LCBkLCBsb2NhbGUpIHtcbiAgICByZXR1cm4gX3N0cmZ0aW1lKGZtdCwgZCwgbG9jYWxlKTtcbiAgfVxuXG4gIC8vIGxvY2FsZSBpcyBvcHRpb25hbFxuICBuYW1lc3BhY2Uuc3RyZnRpbWVUWiA9IHN0cmZ0aW1lLnN0cmZ0aW1lVFogPSBzdHJmdGltZVRaO1xuICBmdW5jdGlvbiBzdHJmdGltZVRaKGZtdCwgZCwgbG9jYWxlLCB0aW1lem9uZSkge1xuICAgIGlmICh0eXBlb2YgbG9jYWxlID09ICdudW1iZXInICYmIHRpbWV6b25lID09IG51bGwpIHtcbiAgICAgIHRpbWV6b25lID0gbG9jYWxlO1xuICAgICAgbG9jYWxlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gX3N0cmZ0aW1lKGZtdCwgZCwgbG9jYWxlLCB7IHRpbWV6b25lOiB0aW1lem9uZSB9KTtcbiAgfVxuXG4gIG5hbWVzcGFjZS5zdHJmdGltZVVUQyA9IHN0cmZ0aW1lLnN0cmZ0aW1lVVRDID0gc3RyZnRpbWVVVEM7XG4gIGZ1bmN0aW9uIHN0cmZ0aW1lVVRDKGZtdCwgZCwgbG9jYWxlKSB7XG4gICAgcmV0dXJuIF9zdHJmdGltZShmbXQsIGQsIGxvY2FsZSwgeyB1dGM6IHRydWUgfSk7XG4gIH1cblxuICBuYW1lc3BhY2UubG9jYWxpemVkU3RyZnRpbWUgPSBzdHJmdGltZS5sb2NhbGl6ZWRTdHJmdGltZSA9IGxvY2FsaXplZFN0cmZ0aW1lO1xuICBmdW5jdGlvbiBsb2NhbGl6ZWRTdHJmdGltZShsb2NhbGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZm10LCBkLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gc3RyZnRpbWUoZm10LCBkLCBsb2NhbGUsIG9wdGlvbnMpO1xuICAgIH07XG4gIH1cblxuICAvLyBkLCBsb2NhbGUsIGFuZCBvcHRpb25zIGFyZSBvcHRpb25hbCwgYnV0IHlvdSBjYW4ndCBsZWF2ZVxuICAvLyBob2xlcyBpbiB0aGUgYXJndW1lbnQgbGlzdC4gSWYgeW91IHBhc3Mgb3B0aW9ucyB5b3UgaGF2ZSB0byBwYXNzXG4gIC8vIGluIGFsbCB0aGUgcHJlY2VkaW5nIGFyZ3MgYXMgd2VsbC5cbiAgLy9cbiAgLy8gb3B0aW9uczpcbiAgLy8gICAtIGxvY2FsZSAgIFtvYmplY3RdIGFuIG9iamVjdCB3aXRoIHRoZSBzYW1lIHN0cnVjdHVyZSBhcyBEZWZhdWx0TG9jYWxlXG4gIC8vICAgLSB0aW1lem9uZSBbbnVtYmVyXSB0aW1lem9uZSBvZmZzZXQgaW4gbWludXRlcyBmcm9tIEdNVFxuICBmdW5jdGlvbiBfc3RyZnRpbWUoZm10LCBkLCBsb2NhbGUsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIC8vIGQgYW5kIGxvY2FsZSBhcmUgb3B0aW9uYWwgc28gY2hlY2sgaWYgZCBpcyByZWFsbHkgdGhlIGxvY2FsZVxuICAgIGlmIChkICYmICFxdWFja3NMaWtlRGF0ZShkKSkge1xuICAgICAgbG9jYWxlID0gZDtcbiAgICAgIGQgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGQgPSBkIHx8IG5ldyBEYXRlKCk7XG5cbiAgICBsb2NhbGUgPSBsb2NhbGUgfHwgRGVmYXVsdExvY2FsZTtcbiAgICBsb2NhbGUuZm9ybWF0cyA9IGxvY2FsZS5mb3JtYXRzIHx8IHt9O1xuXG4gICAgLy8gSGFuZyBvbiB0byB0aGlzIFVuaXggdGltZXN0YW1wIGJlY2F1c2Ugd2UgbWlnaHQgbWVzcyB3aXRoIGl0IGRpcmVjdGx5IGJlbG93LlxuICAgIHZhciB0aW1lc3RhbXAgPSBkLmdldFRpbWUoKTtcblxuICAgIGlmIChvcHRpb25zLnV0YyB8fCB0eXBlb2Ygb3B0aW9ucy50aW1lem9uZSA9PSAnbnVtYmVyJykge1xuICAgICAgZCA9IGRhdGVUb1VUQyhkKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMudGltZXpvbmUgPT0gJ251bWJlcicpIHtcbiAgICAgIGQgPSBuZXcgRGF0ZShkLmdldFRpbWUoKSArIChvcHRpb25zLnRpbWV6b25lICogNjAwMDApKTtcbiAgICB9XG5cbiAgICAvLyBNb3N0IG9mIHRoZSBzcGVjaWZpZXJzIHN1cHBvcnRlZCBieSBDJ3Mgc3RyZnRpbWUsIGFuZCBzb21lIGZyb20gUnVieS5cbiAgICAvLyBTb21lIG90aGVyIHN5bnRheCBleHRlbnNpb25zIGZyb20gUnVieSBhcmUgc3VwcG9ydGVkOiAlLSwgJV8sIGFuZCAlMFxuICAgIC8vIHRvIHBhZCB3aXRoIG5vdGhpbmcsIHNwYWNlLCBvciB6ZXJvIChyZXNwZWN0aXZlbHkpLlxuICAgIHJldHVybiBmbXQucmVwbGFjZSgvJShbLV8wXT8uKS9nLCBmdW5jdGlvbihfLCBjKSB7XG4gICAgICB2YXIgbW9kLCBwYWRkaW5nO1xuICAgICAgaWYgKGMubGVuZ3RoID09IDIpIHtcbiAgICAgICAgbW9kID0gY1swXTtcbiAgICAgICAgLy8gb21pdCBwYWRkaW5nXG4gICAgICAgIGlmIChtb2QgPT0gJy0nKSB7XG4gICAgICAgICAgcGFkZGluZyA9ICcnO1xuICAgICAgICB9XG4gICAgICAgIC8vIHBhZCB3aXRoIHNwYWNlXG4gICAgICAgIGVsc2UgaWYgKG1vZCA9PSAnXycpIHtcbiAgICAgICAgICBwYWRkaW5nID0gJyAnO1xuICAgICAgICB9XG4gICAgICAgIC8vIHBhZCB3aXRoIHplcm9cbiAgICAgICAgZWxzZSBpZiAobW9kID09ICcwJykge1xuICAgICAgICAgIHBhZGRpbmcgPSAnMCc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgLy8gdW5yZWNvZ25pemVkLCByZXR1cm4gdGhlIGZvcm1hdFxuICAgICAgICAgIHJldHVybiBfO1xuICAgICAgICB9XG4gICAgICAgIGMgPSBjWzFdO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChjKSB7XG4gICAgICAgIGNhc2UgJ0EnOiByZXR1cm4gbG9jYWxlLmRheXNbZC5nZXREYXkoKV07XG4gICAgICAgIGNhc2UgJ2EnOiByZXR1cm4gbG9jYWxlLnNob3J0RGF5c1tkLmdldERheSgpXTtcbiAgICAgICAgY2FzZSAnQic6IHJldHVybiBsb2NhbGUubW9udGhzW2QuZ2V0TW9udGgoKV07XG4gICAgICAgIGNhc2UgJ2InOiByZXR1cm4gbG9jYWxlLnNob3J0TW9udGhzW2QuZ2V0TW9udGgoKV07XG4gICAgICAgIGNhc2UgJ0MnOiByZXR1cm4gcGFkKE1hdGguZmxvb3IoZC5nZXRGdWxsWWVhcigpIC8gMTAwKSwgcGFkZGluZyk7XG4gICAgICAgIGNhc2UgJ0QnOiByZXR1cm4gX3N0cmZ0aW1lKGxvY2FsZS5mb3JtYXRzLkQgfHwgJyVtLyVkLyV5JywgZCwgbG9jYWxlKTtcbiAgICAgICAgY2FzZSAnZCc6IHJldHVybiBwYWQoZC5nZXREYXRlKCksIHBhZGRpbmcpO1xuICAgICAgICBjYXNlICdlJzogcmV0dXJuIGQuZ2V0RGF0ZSgpO1xuICAgICAgICBjYXNlICdGJzogcmV0dXJuIF9zdHJmdGltZShsb2NhbGUuZm9ybWF0cy5GIHx8ICclWS0lbS0lZCcsIGQsIGxvY2FsZSk7XG4gICAgICAgIGNhc2UgJ0gnOiByZXR1cm4gcGFkKGQuZ2V0SG91cnMoKSwgcGFkZGluZyk7XG4gICAgICAgIGNhc2UgJ2gnOiByZXR1cm4gbG9jYWxlLnNob3J0TW9udGhzW2QuZ2V0TW9udGgoKV07XG4gICAgICAgIGNhc2UgJ0knOiByZXR1cm4gcGFkKGhvdXJzMTIoZCksIHBhZGRpbmcpO1xuICAgICAgICBjYXNlICdqJzpcbiAgICAgICAgICB2YXIgeSA9IG5ldyBEYXRlKGQuZ2V0RnVsbFllYXIoKSwgMCwgMSk7XG4gICAgICAgICAgdmFyIGRheSA9IE1hdGguY2VpbCgoZC5nZXRUaW1lKCkgLSB5LmdldFRpbWUoKSkgLyAoMTAwMCAqIDYwICogNjAgKiAyNCkpO1xuICAgICAgICAgIHJldHVybiBwYWQoZGF5LCAzKTtcbiAgICAgICAgY2FzZSAnayc6IHJldHVybiBwYWQoZC5nZXRIb3VycygpLCBwYWRkaW5nID09IG51bGwgPyAnICcgOiBwYWRkaW5nKTtcbiAgICAgICAgY2FzZSAnTCc6IHJldHVybiBwYWQoTWF0aC5mbG9vcih0aW1lc3RhbXAgJSAxMDAwKSwgMyk7XG4gICAgICAgIGNhc2UgJ2wnOiByZXR1cm4gcGFkKGhvdXJzMTIoZCksIHBhZGRpbmcgPT0gbnVsbCA/ICcgJyA6IHBhZGRpbmcpO1xuICAgICAgICBjYXNlICdNJzogcmV0dXJuIHBhZChkLmdldE1pbnV0ZXMoKSwgcGFkZGluZyk7XG4gICAgICAgIGNhc2UgJ20nOiByZXR1cm4gcGFkKGQuZ2V0TW9udGgoKSArIDEsIHBhZGRpbmcpO1xuICAgICAgICBjYXNlICduJzogcmV0dXJuICdcXG4nO1xuICAgICAgICBjYXNlICdvJzogcmV0dXJuIFN0cmluZyhkLmdldERhdGUoKSkgKyBvcmRpbmFsKGQuZ2V0RGF0ZSgpKTtcbiAgICAgICAgY2FzZSAnUCc6IHJldHVybiBkLmdldEhvdXJzKCkgPCAxMiA/IGxvY2FsZS5hbSA6IGxvY2FsZS5wbTtcbiAgICAgICAgY2FzZSAncCc6IHJldHVybiBkLmdldEhvdXJzKCkgPCAxMiA/IGxvY2FsZS5BTSA6IGxvY2FsZS5QTTtcbiAgICAgICAgY2FzZSAnUic6IHJldHVybiBfc3RyZnRpbWUobG9jYWxlLmZvcm1hdHMuUiB8fCAnJUg6JU0nLCBkLCBsb2NhbGUpO1xuICAgICAgICBjYXNlICdyJzogcmV0dXJuIF9zdHJmdGltZShsb2NhbGUuZm9ybWF0cy5yIHx8ICclSTolTTolUyAlcCcsIGQsIGxvY2FsZSk7XG4gICAgICAgIGNhc2UgJ1MnOiByZXR1cm4gcGFkKGQuZ2V0U2Vjb25kcygpLCBwYWRkaW5nKTtcbiAgICAgICAgY2FzZSAncyc6IHJldHVybiBNYXRoLmZsb29yKHRpbWVzdGFtcCAvIDEwMDApO1xuICAgICAgICBjYXNlICdUJzogcmV0dXJuIF9zdHJmdGltZShsb2NhbGUuZm9ybWF0cy5UIHx8ICclSDolTTolUycsIGQsIGxvY2FsZSk7XG4gICAgICAgIGNhc2UgJ3QnOiByZXR1cm4gJ1xcdCc7XG4gICAgICAgIGNhc2UgJ1UnOiByZXR1cm4gcGFkKHdlZWtOdW1iZXIoZCwgJ3N1bmRheScpLCBwYWRkaW5nKTtcbiAgICAgICAgY2FzZSAndSc6XG4gICAgICAgICAgdmFyIGRheSA9IGQuZ2V0RGF5KCk7XG4gICAgICAgICAgcmV0dXJuIGRheSA9PSAwID8gNyA6IGRheTsgLy8gMSAtIDcsIE1vbmRheSBpcyBmaXJzdCBkYXkgb2YgdGhlIHdlZWtcbiAgICAgICAgY2FzZSAndic6IHJldHVybiBfc3RyZnRpbWUobG9jYWxlLmZvcm1hdHMudiB8fCAnJWUtJWItJVknLCBkLCBsb2NhbGUpO1xuICAgICAgICBjYXNlICdXJzogcmV0dXJuIHBhZCh3ZWVrTnVtYmVyKGQsICdtb25kYXknKSwgcGFkZGluZyk7XG4gICAgICAgIGNhc2UgJ3cnOiByZXR1cm4gZC5nZXREYXkoKTsgLy8gMCAtIDYsIFN1bmRheSBpcyBmaXJzdCBkYXkgb2YgdGhlIHdlZWtcbiAgICAgICAgY2FzZSAnWSc6IHJldHVybiBkLmdldEZ1bGxZZWFyKCk7XG4gICAgICAgIGNhc2UgJ3knOlxuICAgICAgICAgIHZhciB5ID0gU3RyaW5nKGQuZ2V0RnVsbFllYXIoKSk7XG4gICAgICAgICAgcmV0dXJuIHkuc2xpY2UoeS5sZW5ndGggLSAyKTtcbiAgICAgICAgY2FzZSAnWic6XG4gICAgICAgICAgaWYgKG9wdGlvbnMudXRjKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJHTVRcIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgdHogPSBkLnRvU3RyaW5nKCkubWF0Y2goL1xcKChcXHcrKVxcKS8pO1xuICAgICAgICAgICAgcmV0dXJuIHR6ICYmIHR6WzFdIHx8ICcnO1xuICAgICAgICAgIH1cbiAgICAgICAgY2FzZSAneic6XG4gICAgICAgICAgaWYgKG9wdGlvbnMudXRjKSB7XG4gICAgICAgICAgICByZXR1cm4gXCIrMDAwMFwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBvZmYgPSB0eXBlb2Ygb3B0aW9ucy50aW1lem9uZSA9PSAnbnVtYmVyJyA/IG9wdGlvbnMudGltZXpvbmUgOiAtZC5nZXRUaW1lem9uZU9mZnNldCgpO1xuICAgICAgICAgICAgcmV0dXJuIChvZmYgPCAwID8gJy0nIDogJysnKSArIHBhZChNYXRoLmFicyhvZmYgLyA2MCkpICsgcGFkKG9mZiAlIDYwKTtcbiAgICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6IHJldHVybiBjO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gZGF0ZVRvVVRDKGQpIHtcbiAgICB2YXIgbXNEZWx0YSA9IChkLmdldFRpbWV6b25lT2Zmc2V0KCkgfHwgMCkgKiA2MDAwMDtcbiAgICByZXR1cm4gbmV3IERhdGUoZC5nZXRUaW1lKCkgKyBtc0RlbHRhKTtcbiAgfVxuXG4gIHZhciBSZXF1aXJlZERhdGVNZXRob2RzID0gWydnZXRUaW1lJywgJ2dldFRpbWV6b25lT2Zmc2V0JywgJ2dldERheScsICdnZXREYXRlJywgJ2dldE1vbnRoJywgJ2dldEZ1bGxZZWFyJywgJ2dldFllYXInLCAnZ2V0SG91cnMnLCAnZ2V0TWludXRlcycsICdnZXRTZWNvbmRzJ107XG4gIGZ1bmN0aW9uIHF1YWNrc0xpa2VEYXRlKHgpIHtcbiAgICB2YXIgaSA9IDBcbiAgICAgICwgbiA9IFJlcXVpcmVkRGF0ZU1ldGhvZHMubGVuZ3RoXG4gICAgICA7XG4gICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKHR5cGVvZiB4W1JlcXVpcmVkRGF0ZU1ldGhvZHNbaV1dICE9ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIERlZmF1bHQgcGFkZGluZyBpcyAnMCcgYW5kIGRlZmF1bHQgbGVuZ3RoIGlzIDIsIGJvdGggYXJlIG9wdGlvbmFsLlxuICBmdW5jdGlvbiBwYWQobiwgcGFkZGluZywgbGVuZ3RoKSB7XG4gICAgLy8gcGFkKG4sIDxsZW5ndGg+KVxuICAgIGlmICh0eXBlb2YgcGFkZGluZyA9PT0gJ251bWJlcicpIHtcbiAgICAgIGxlbmd0aCA9IHBhZGRpbmc7XG4gICAgICBwYWRkaW5nID0gJzAnO1xuICAgIH1cblxuICAgIC8vIERlZmF1bHRzIGhhbmRsZSBwYWQobikgYW5kIHBhZChuLCA8cGFkZGluZz4pXG4gICAgaWYgKHBhZGRpbmcgPT0gbnVsbCkge1xuICAgICAgcGFkZGluZyA9ICcwJztcbiAgICB9XG4gICAgbGVuZ3RoID0gbGVuZ3RoIHx8IDI7XG5cbiAgICB2YXIgcyA9IFN0cmluZyhuKTtcbiAgICAvLyBwYWRkaW5nIG1heSBiZSBhbiBlbXB0eSBzdHJpbmcsIGRvbid0IGxvb3AgZm9yZXZlciBpZiBpdCBpc1xuICAgIGlmIChwYWRkaW5nKSB7XG4gICAgICB3aGlsZSAocy5sZW5ndGggPCBsZW5ndGgpIHMgPSBwYWRkaW5nICsgcztcbiAgICB9XG4gICAgcmV0dXJuIHM7XG4gIH1cblxuICBmdW5jdGlvbiBob3VyczEyKGQpIHtcbiAgICB2YXIgaG91ciA9IGQuZ2V0SG91cnMoKTtcbiAgICBpZiAoaG91ciA9PSAwKSBob3VyID0gMTI7XG4gICAgZWxzZSBpZiAoaG91ciA+IDEyKSBob3VyIC09IDEyO1xuICAgIHJldHVybiBob3VyO1xuICB9XG5cbiAgLy8gR2V0IHRoZSBvcmRpbmFsIHN1ZmZpeCBmb3IgYSBudW1iZXI6IHN0LCBuZCwgcmQsIG9yIHRoXG4gIGZ1bmN0aW9uIG9yZGluYWwobikge1xuICAgIHZhciBpID0gbiAlIDEwXG4gICAgICAsIGlpID0gbiAlIDEwMFxuICAgICAgO1xuICAgIGlmICgoaWkgPj0gMTEgJiYgaWkgPD0gMTMpIHx8IGkgPT09IDAgfHwgaSA+PSA0KSB7XG4gICAgICByZXR1cm4gJ3RoJztcbiAgICB9XG4gICAgc3dpdGNoIChpKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiAnc3QnO1xuICAgICAgY2FzZSAyOiByZXR1cm4gJ25kJztcbiAgICAgIGNhc2UgMzogcmV0dXJuICdyZCc7XG4gICAgfVxuICB9XG5cbiAgLy8gZmlyc3RXZWVrZGF5OiAnc3VuZGF5JyBvciAnbW9uZGF5JywgZGVmYXVsdCBpcyAnc3VuZGF5J1xuICAvL1xuICAvLyBQaWxmZXJlZCAmIHBvcnRlZCBmcm9tIFJ1YnkncyBzdHJmdGltZSBpbXBsZW1lbnRhdGlvbi5cbiAgZnVuY3Rpb24gd2Vla051bWJlcihkLCBmaXJzdFdlZWtkYXkpIHtcbiAgICBmaXJzdFdlZWtkYXkgPSBmaXJzdFdlZWtkYXkgfHwgJ3N1bmRheSc7XG5cbiAgICAvLyBUaGlzIHdvcmtzIGJ5IHNoaWZ0aW5nIHRoZSB3ZWVrZGF5IGJhY2sgYnkgb25lIGRheSBpZiB3ZVxuICAgIC8vIGFyZSB0cmVhdGluZyBNb25kYXkgYXMgdGhlIGZpcnN0IGRheSBvZiB0aGUgd2Vlay5cbiAgICB2YXIgd2RheSA9IGQuZ2V0RGF5KCk7XG4gICAgaWYgKGZpcnN0V2Vla2RheSA9PSAnbW9uZGF5Jykge1xuICAgICAgaWYgKHdkYXkgPT0gMCkgLy8gU3VuZGF5XG4gICAgICAgIHdkYXkgPSA2O1xuICAgICAgZWxzZVxuICAgICAgICB3ZGF5LS07XG4gICAgfVxuICAgIHZhciBmaXJzdERheU9mWWVhciA9IG5ldyBEYXRlKGQuZ2V0RnVsbFllYXIoKSwgMCwgMSlcbiAgICAgICwgeWRheSA9IChkIC0gZmlyc3REYXlPZlllYXIpIC8gODY0MDAwMDBcbiAgICAgICwgd2Vla051bSA9ICh5ZGF5ICsgNyAtIHdkYXkpIC8gN1xuICAgICAgO1xuICAgIHJldHVybiBNYXRoLmZsb29yKHdlZWtOdW0pO1xuICB9XG5cbn0oKSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qZ2xvYmFscyBIYW5kbGViYXJzOiB0cnVlICovXG52YXIgYmFzZSA9IHJlcXVpcmUoXCIuL2hhbmRsZWJhcnMvYmFzZVwiKTtcblxuLy8gRWFjaCBvZiB0aGVzZSBhdWdtZW50IHRoZSBIYW5kbGViYXJzIG9iamVjdC4gTm8gbmVlZCB0byBzZXR1cCBoZXJlLlxuLy8gKFRoaXMgaXMgZG9uZSB0byBlYXNpbHkgc2hhcmUgY29kZSBiZXR3ZWVuIGNvbW1vbmpzIGFuZCBicm93c2UgZW52cylcbnZhciBTYWZlU3RyaW5nID0gcmVxdWlyZShcIi4vaGFuZGxlYmFycy9zYWZlLXN0cmluZ1wiKVtcImRlZmF1bHRcIl07XG52YXIgRXhjZXB0aW9uID0gcmVxdWlyZShcIi4vaGFuZGxlYmFycy9leGNlcHRpb25cIilbXCJkZWZhdWx0XCJdO1xudmFyIFV0aWxzID0gcmVxdWlyZShcIi4vaGFuZGxlYmFycy91dGlsc1wiKTtcbnZhciBydW50aW1lID0gcmVxdWlyZShcIi4vaGFuZGxlYmFycy9ydW50aW1lXCIpO1xuXG4vLyBGb3IgY29tcGF0aWJpbGl0eSBhbmQgdXNhZ2Ugb3V0c2lkZSBvZiBtb2R1bGUgc3lzdGVtcywgbWFrZSB0aGUgSGFuZGxlYmFycyBvYmplY3QgYSBuYW1lc3BhY2VcbnZhciBjcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGhiID0gbmV3IGJhc2UuSGFuZGxlYmFyc0Vudmlyb25tZW50KCk7XG5cbiAgVXRpbHMuZXh0ZW5kKGhiLCBiYXNlKTtcbiAgaGIuU2FmZVN0cmluZyA9IFNhZmVTdHJpbmc7XG4gIGhiLkV4Y2VwdGlvbiA9IEV4Y2VwdGlvbjtcbiAgaGIuVXRpbHMgPSBVdGlscztcblxuICBoYi5WTSA9IHJ1bnRpbWU7XG4gIGhiLnRlbXBsYXRlID0gZnVuY3Rpb24oc3BlYykge1xuICAgIHJldHVybiBydW50aW1lLnRlbXBsYXRlKHNwZWMsIGhiKTtcbiAgfTtcblxuICByZXR1cm4gaGI7XG59O1xuXG52YXIgSGFuZGxlYmFycyA9IGNyZWF0ZSgpO1xuSGFuZGxlYmFycy5jcmVhdGUgPSBjcmVhdGU7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gSGFuZGxlYmFyczsiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBVdGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIEV4Y2VwdGlvbiA9IHJlcXVpcmUoXCIuL2V4Y2VwdGlvblwiKVtcImRlZmF1bHRcIl07XG5cbnZhciBWRVJTSU9OID0gXCIxLjMuMFwiO1xuZXhwb3J0cy5WRVJTSU9OID0gVkVSU0lPTjt2YXIgQ09NUElMRVJfUkVWSVNJT04gPSA0O1xuZXhwb3J0cy5DT01QSUxFUl9SRVZJU0lPTiA9IENPTVBJTEVSX1JFVklTSU9OO1xudmFyIFJFVklTSU9OX0NIQU5HRVMgPSB7XG4gIDE6ICc8PSAxLjAucmMuMicsIC8vIDEuMC5yYy4yIGlzIGFjdHVhbGx5IHJldjIgYnV0IGRvZXNuJ3QgcmVwb3J0IGl0XG4gIDI6ICc9PSAxLjAuMC1yYy4zJyxcbiAgMzogJz09IDEuMC4wLXJjLjQnLFxuICA0OiAnPj0gMS4wLjAnXG59O1xuZXhwb3J0cy5SRVZJU0lPTl9DSEFOR0VTID0gUkVWSVNJT05fQ0hBTkdFUztcbnZhciBpc0FycmF5ID0gVXRpbHMuaXNBcnJheSxcbiAgICBpc0Z1bmN0aW9uID0gVXRpbHMuaXNGdW5jdGlvbixcbiAgICB0b1N0cmluZyA9IFV0aWxzLnRvU3RyaW5nLFxuICAgIG9iamVjdFR5cGUgPSAnW29iamVjdCBPYmplY3RdJztcblxuZnVuY3Rpb24gSGFuZGxlYmFyc0Vudmlyb25tZW50KGhlbHBlcnMsIHBhcnRpYWxzKSB7XG4gIHRoaXMuaGVscGVycyA9IGhlbHBlcnMgfHwge307XG4gIHRoaXMucGFydGlhbHMgPSBwYXJ0aWFscyB8fCB7fTtcblxuICByZWdpc3RlckRlZmF1bHRIZWxwZXJzKHRoaXMpO1xufVxuXG5leHBvcnRzLkhhbmRsZWJhcnNFbnZpcm9ubWVudCA9IEhhbmRsZWJhcnNFbnZpcm9ubWVudDtIYW5kbGViYXJzRW52aXJvbm1lbnQucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogSGFuZGxlYmFyc0Vudmlyb25tZW50LFxuXG4gIGxvZ2dlcjogbG9nZ2VyLFxuICBsb2c6IGxvZyxcblxuICByZWdpc3RlckhlbHBlcjogZnVuY3Rpb24obmFtZSwgZm4sIGludmVyc2UpIHtcbiAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuICAgICAgaWYgKGludmVyc2UgfHwgZm4pIHsgdGhyb3cgbmV3IEV4Y2VwdGlvbignQXJnIG5vdCBzdXBwb3J0ZWQgd2l0aCBtdWx0aXBsZSBoZWxwZXJzJyk7IH1cbiAgICAgIFV0aWxzLmV4dGVuZCh0aGlzLmhlbHBlcnMsIG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaW52ZXJzZSkgeyBmbi5ub3QgPSBpbnZlcnNlOyB9XG4gICAgICB0aGlzLmhlbHBlcnNbbmFtZV0gPSBmbjtcbiAgICB9XG4gIH0sXG5cbiAgcmVnaXN0ZXJQYXJ0aWFsOiBmdW5jdGlvbihuYW1lLCBzdHIpIHtcbiAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuICAgICAgVXRpbHMuZXh0ZW5kKHRoaXMucGFydGlhbHMsICBuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wYXJ0aWFsc1tuYW1lXSA9IHN0cjtcbiAgICB9XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyRGVmYXVsdEhlbHBlcnMoaW5zdGFuY2UpIHtcbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2hlbHBlck1pc3NpbmcnLCBmdW5jdGlvbihhcmcpIHtcbiAgICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwiTWlzc2luZyBoZWxwZXI6ICdcIiArIGFyZyArIFwiJ1wiKTtcbiAgICB9XG4gIH0pO1xuXG4gIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdibG9ja0hlbHBlck1pc3NpbmcnLCBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIGludmVyc2UgPSBvcHRpb25zLmludmVyc2UgfHwgZnVuY3Rpb24oKSB7fSwgZm4gPSBvcHRpb25zLmZuO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oY29udGV4dCkpIHsgY29udGV4dCA9IGNvbnRleHQuY2FsbCh0aGlzKTsgfVxuXG4gICAgaWYoY29udGV4dCA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGZuKHRoaXMpO1xuICAgIH0gZWxzZSBpZihjb250ZXh0ID09PSBmYWxzZSB8fCBjb250ZXh0ID09IG51bGwpIHtcbiAgICAgIHJldHVybiBpbnZlcnNlKHRoaXMpO1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheShjb250ZXh0KSkge1xuICAgICAgaWYoY29udGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZS5oZWxwZXJzLmVhY2goY29udGV4dCwgb3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW52ZXJzZSh0aGlzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZuKGNvbnRleHQpO1xuICAgIH1cbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2VhY2gnLCBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIGZuID0gb3B0aW9ucy5mbiwgaW52ZXJzZSA9IG9wdGlvbnMuaW52ZXJzZTtcbiAgICB2YXIgaSA9IDAsIHJldCA9IFwiXCIsIGRhdGE7XG5cbiAgICBpZiAoaXNGdW5jdGlvbihjb250ZXh0KSkgeyBjb250ZXh0ID0gY29udGV4dC5jYWxsKHRoaXMpOyB9XG5cbiAgICBpZiAob3B0aW9ucy5kYXRhKSB7XG4gICAgICBkYXRhID0gY3JlYXRlRnJhbWUob3B0aW9ucy5kYXRhKTtcbiAgICB9XG5cbiAgICBpZihjb250ZXh0ICYmIHR5cGVvZiBjb250ZXh0ID09PSAnb2JqZWN0Jykge1xuICAgICAgaWYgKGlzQXJyYXkoY29udGV4dCkpIHtcbiAgICAgICAgZm9yKHZhciBqID0gY29udGV4dC5sZW5ndGg7IGk8ajsgaSsrKSB7XG4gICAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgIGRhdGEuaW5kZXggPSBpO1xuICAgICAgICAgICAgZGF0YS5maXJzdCA9IChpID09PSAwKTtcbiAgICAgICAgICAgIGRhdGEubGFzdCAgPSAoaSA9PT0gKGNvbnRleHQubGVuZ3RoLTEpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0ID0gcmV0ICsgZm4oY29udGV4dFtpXSwgeyBkYXRhOiBkYXRhIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IodmFyIGtleSBpbiBjb250ZXh0KSB7XG4gICAgICAgICAgaWYoY29udGV4dC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICBpZihkYXRhKSB7IFxuICAgICAgICAgICAgICBkYXRhLmtleSA9IGtleTsgXG4gICAgICAgICAgICAgIGRhdGEuaW5kZXggPSBpO1xuICAgICAgICAgICAgICBkYXRhLmZpcnN0ID0gKGkgPT09IDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0ID0gcmV0ICsgZm4oY29udGV4dFtrZXldLCB7ZGF0YTogZGF0YX0pO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmKGkgPT09IDApe1xuICAgICAgcmV0ID0gaW52ZXJzZSh0aGlzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignaWYnLCBmdW5jdGlvbihjb25kaXRpb25hbCwgb3B0aW9ucykge1xuICAgIGlmIChpc0Z1bmN0aW9uKGNvbmRpdGlvbmFsKSkgeyBjb25kaXRpb25hbCA9IGNvbmRpdGlvbmFsLmNhbGwodGhpcyk7IH1cblxuICAgIC8vIERlZmF1bHQgYmVoYXZpb3IgaXMgdG8gcmVuZGVyIHRoZSBwb3NpdGl2ZSBwYXRoIGlmIHRoZSB2YWx1ZSBpcyB0cnV0aHkgYW5kIG5vdCBlbXB0eS5cbiAgICAvLyBUaGUgYGluY2x1ZGVaZXJvYCBvcHRpb24gbWF5IGJlIHNldCB0byB0cmVhdCB0aGUgY29uZHRpb25hbCBhcyBwdXJlbHkgbm90IGVtcHR5IGJhc2VkIG9uIHRoZVxuICAgIC8vIGJlaGF2aW9yIG9mIGlzRW1wdHkuIEVmZmVjdGl2ZWx5IHRoaXMgZGV0ZXJtaW5lcyBpZiAwIGlzIGhhbmRsZWQgYnkgdGhlIHBvc2l0aXZlIHBhdGggb3IgbmVnYXRpdmUuXG4gICAgaWYgKCghb3B0aW9ucy5oYXNoLmluY2x1ZGVaZXJvICYmICFjb25kaXRpb25hbCkgfHwgVXRpbHMuaXNFbXB0eShjb25kaXRpb25hbCkpIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmZuKHRoaXMpO1xuICAgIH1cbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ3VubGVzcycsIGZ1bmN0aW9uKGNvbmRpdGlvbmFsLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIGluc3RhbmNlLmhlbHBlcnNbJ2lmJ10uY2FsbCh0aGlzLCBjb25kaXRpb25hbCwge2ZuOiBvcHRpb25zLmludmVyc2UsIGludmVyc2U6IG9wdGlvbnMuZm4sIGhhc2g6IG9wdGlvbnMuaGFzaH0pO1xuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignd2l0aCcsIGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBpZiAoaXNGdW5jdGlvbihjb250ZXh0KSkgeyBjb250ZXh0ID0gY29udGV4dC5jYWxsKHRoaXMpOyB9XG5cbiAgICBpZiAoIVV0aWxzLmlzRW1wdHkoY29udGV4dCkpIHJldHVybiBvcHRpb25zLmZuKGNvbnRleHQpO1xuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignbG9nJywgZnVuY3Rpb24oY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBsZXZlbCA9IG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmRhdGEubGV2ZWwgIT0gbnVsbCA/IHBhcnNlSW50KG9wdGlvbnMuZGF0YS5sZXZlbCwgMTApIDogMTtcbiAgICBpbnN0YW5jZS5sb2cobGV2ZWwsIGNvbnRleHQpO1xuICB9KTtcbn1cblxudmFyIGxvZ2dlciA9IHtcbiAgbWV0aG9kTWFwOiB7IDA6ICdkZWJ1ZycsIDE6ICdpbmZvJywgMjogJ3dhcm4nLCAzOiAnZXJyb3InIH0sXG5cbiAgLy8gU3RhdGUgZW51bVxuICBERUJVRzogMCxcbiAgSU5GTzogMSxcbiAgV0FSTjogMixcbiAgRVJST1I6IDMsXG4gIGxldmVsOiAzLFxuXG4gIC8vIGNhbiBiZSBvdmVycmlkZGVuIGluIHRoZSBob3N0IGVudmlyb25tZW50XG4gIGxvZzogZnVuY3Rpb24obGV2ZWwsIG9iaikge1xuICAgIGlmIChsb2dnZXIubGV2ZWwgPD0gbGV2ZWwpIHtcbiAgICAgIHZhciBtZXRob2QgPSBsb2dnZXIubWV0aG9kTWFwW2xldmVsXTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiYgY29uc29sZVttZXRob2RdKSB7XG4gICAgICAgIGNvbnNvbGVbbWV0aG9kXS5jYWxsKGNvbnNvbGUsIG9iaik7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuZXhwb3J0cy5sb2dnZXIgPSBsb2dnZXI7XG5mdW5jdGlvbiBsb2cobGV2ZWwsIG9iaikgeyBsb2dnZXIubG9nKGxldmVsLCBvYmopOyB9XG5cbmV4cG9ydHMubG9nID0gbG9nO3ZhciBjcmVhdGVGcmFtZSA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICB2YXIgb2JqID0ge307XG4gIFV0aWxzLmV4dGVuZChvYmosIG9iamVjdCk7XG4gIHJldHVybiBvYmo7XG59O1xuZXhwb3J0cy5jcmVhdGVGcmFtZSA9IGNyZWF0ZUZyYW1lOyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgZXJyb3JQcm9wcyA9IFsnZGVzY3JpcHRpb24nLCAnZmlsZU5hbWUnLCAnbGluZU51bWJlcicsICdtZXNzYWdlJywgJ25hbWUnLCAnbnVtYmVyJywgJ3N0YWNrJ107XG5cbmZ1bmN0aW9uIEV4Y2VwdGlvbihtZXNzYWdlLCBub2RlKSB7XG4gIHZhciBsaW5lO1xuICBpZiAobm9kZSAmJiBub2RlLmZpcnN0TGluZSkge1xuICAgIGxpbmUgPSBub2RlLmZpcnN0TGluZTtcblxuICAgIG1lc3NhZ2UgKz0gJyAtICcgKyBsaW5lICsgJzonICsgbm9kZS5maXJzdENvbHVtbjtcbiAgfVxuXG4gIHZhciB0bXAgPSBFcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBtZXNzYWdlKTtcblxuICAvLyBVbmZvcnR1bmF0ZWx5IGVycm9ycyBhcmUgbm90IGVudW1lcmFibGUgaW4gQ2hyb21lIChhdCBsZWFzdCksIHNvIGBmb3IgcHJvcCBpbiB0bXBgIGRvZXNuJ3Qgd29yay5cbiAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgZXJyb3JQcm9wcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgdGhpc1tlcnJvclByb3BzW2lkeF1dID0gdG1wW2Vycm9yUHJvcHNbaWR4XV07XG4gIH1cblxuICBpZiAobGluZSkge1xuICAgIHRoaXMubGluZU51bWJlciA9IGxpbmU7XG4gICAgdGhpcy5jb2x1bW4gPSBub2RlLmZpcnN0Q29sdW1uO1xuICB9XG59XG5cbkV4Y2VwdGlvbi5wcm90b3R5cGUgPSBuZXcgRXJyb3IoKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBFeGNlcHRpb247IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgVXRpbHMgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBFeGNlcHRpb24gPSByZXF1aXJlKFwiLi9leGNlcHRpb25cIilbXCJkZWZhdWx0XCJdO1xudmFyIENPTVBJTEVSX1JFVklTSU9OID0gcmVxdWlyZShcIi4vYmFzZVwiKS5DT01QSUxFUl9SRVZJU0lPTjtcbnZhciBSRVZJU0lPTl9DSEFOR0VTID0gcmVxdWlyZShcIi4vYmFzZVwiKS5SRVZJU0lPTl9DSEFOR0VTO1xuXG5mdW5jdGlvbiBjaGVja1JldmlzaW9uKGNvbXBpbGVySW5mbykge1xuICB2YXIgY29tcGlsZXJSZXZpc2lvbiA9IGNvbXBpbGVySW5mbyAmJiBjb21waWxlckluZm9bMF0gfHwgMSxcbiAgICAgIGN1cnJlbnRSZXZpc2lvbiA9IENPTVBJTEVSX1JFVklTSU9OO1xuXG4gIGlmIChjb21waWxlclJldmlzaW9uICE9PSBjdXJyZW50UmV2aXNpb24pIHtcbiAgICBpZiAoY29tcGlsZXJSZXZpc2lvbiA8IGN1cnJlbnRSZXZpc2lvbikge1xuICAgICAgdmFyIHJ1bnRpbWVWZXJzaW9ucyA9IFJFVklTSU9OX0NIQU5HRVNbY3VycmVudFJldmlzaW9uXSxcbiAgICAgICAgICBjb21waWxlclZlcnNpb25zID0gUkVWSVNJT05fQ0hBTkdFU1tjb21waWxlclJldmlzaW9uXTtcbiAgICAgIHRocm93IG5ldyBFeGNlcHRpb24oXCJUZW1wbGF0ZSB3YXMgcHJlY29tcGlsZWQgd2l0aCBhbiBvbGRlciB2ZXJzaW9uIG9mIEhhbmRsZWJhcnMgdGhhbiB0aGUgY3VycmVudCBydW50aW1lLiBcIitcbiAgICAgICAgICAgIFwiUGxlYXNlIHVwZGF0ZSB5b3VyIHByZWNvbXBpbGVyIHRvIGEgbmV3ZXIgdmVyc2lvbiAoXCIrcnVudGltZVZlcnNpb25zK1wiKSBvciBkb3duZ3JhZGUgeW91ciBydW50aW1lIHRvIGFuIG9sZGVyIHZlcnNpb24gKFwiK2NvbXBpbGVyVmVyc2lvbnMrXCIpLlwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVXNlIHRoZSBlbWJlZGRlZCB2ZXJzaW9uIGluZm8gc2luY2UgdGhlIHJ1bnRpbWUgZG9lc24ndCBrbm93IGFib3V0IHRoaXMgcmV2aXNpb24geWV0XG4gICAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwiVGVtcGxhdGUgd2FzIHByZWNvbXBpbGVkIHdpdGggYSBuZXdlciB2ZXJzaW9uIG9mIEhhbmRsZWJhcnMgdGhhbiB0aGUgY3VycmVudCBydW50aW1lLiBcIitcbiAgICAgICAgICAgIFwiUGxlYXNlIHVwZGF0ZSB5b3VyIHJ1bnRpbWUgdG8gYSBuZXdlciB2ZXJzaW9uIChcIitjb21waWxlckluZm9bMV0rXCIpLlwiKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0cy5jaGVja1JldmlzaW9uID0gY2hlY2tSZXZpc2lvbjsvLyBUT0RPOiBSZW1vdmUgdGhpcyBsaW5lIGFuZCBicmVhayB1cCBjb21waWxlUGFydGlhbFxuXG5mdW5jdGlvbiB0ZW1wbGF0ZSh0ZW1wbGF0ZVNwZWMsIGVudikge1xuICBpZiAoIWVudikge1xuICAgIHRocm93IG5ldyBFeGNlcHRpb24oXCJObyBlbnZpcm9ubWVudCBwYXNzZWQgdG8gdGVtcGxhdGVcIik7XG4gIH1cblxuICAvLyBOb3RlOiBVc2luZyBlbnYuVk0gcmVmZXJlbmNlcyByYXRoZXIgdGhhbiBsb2NhbCB2YXIgcmVmZXJlbmNlcyB0aHJvdWdob3V0IHRoaXMgc2VjdGlvbiB0byBhbGxvd1xuICAvLyBmb3IgZXh0ZXJuYWwgdXNlcnMgdG8gb3ZlcnJpZGUgdGhlc2UgYXMgcHN1ZWRvLXN1cHBvcnRlZCBBUElzLlxuICB2YXIgaW52b2tlUGFydGlhbFdyYXBwZXIgPSBmdW5jdGlvbihwYXJ0aWFsLCBuYW1lLCBjb250ZXh0LCBoZWxwZXJzLCBwYXJ0aWFscywgZGF0YSkge1xuICAgIHZhciByZXN1bHQgPSBlbnYuVk0uaW52b2tlUGFydGlhbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmIChyZXN1bHQgIT0gbnVsbCkgeyByZXR1cm4gcmVzdWx0OyB9XG5cbiAgICBpZiAoZW52LmNvbXBpbGUpIHtcbiAgICAgIHZhciBvcHRpb25zID0geyBoZWxwZXJzOiBoZWxwZXJzLCBwYXJ0aWFsczogcGFydGlhbHMsIGRhdGE6IGRhdGEgfTtcbiAgICAgIHBhcnRpYWxzW25hbWVdID0gZW52LmNvbXBpbGUocGFydGlhbCwgeyBkYXRhOiBkYXRhICE9PSB1bmRlZmluZWQgfSwgZW52KTtcbiAgICAgIHJldHVybiBwYXJ0aWFsc1tuYW1lXShjb250ZXh0LCBvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEV4Y2VwdGlvbihcIlRoZSBwYXJ0aWFsIFwiICsgbmFtZSArIFwiIGNvdWxkIG5vdCBiZSBjb21waWxlZCB3aGVuIHJ1bm5pbmcgaW4gcnVudGltZS1vbmx5IG1vZGVcIik7XG4gICAgfVxuICB9O1xuXG4gIC8vIEp1c3QgYWRkIHdhdGVyXG4gIHZhciBjb250YWluZXIgPSB7XG4gICAgZXNjYXBlRXhwcmVzc2lvbjogVXRpbHMuZXNjYXBlRXhwcmVzc2lvbixcbiAgICBpbnZva2VQYXJ0aWFsOiBpbnZva2VQYXJ0aWFsV3JhcHBlcixcbiAgICBwcm9ncmFtczogW10sXG4gICAgcHJvZ3JhbTogZnVuY3Rpb24oaSwgZm4sIGRhdGEpIHtcbiAgICAgIHZhciBwcm9ncmFtV3JhcHBlciA9IHRoaXMucHJvZ3JhbXNbaV07XG4gICAgICBpZihkYXRhKSB7XG4gICAgICAgIHByb2dyYW1XcmFwcGVyID0gcHJvZ3JhbShpLCBmbiwgZGF0YSk7XG4gICAgICB9IGVsc2UgaWYgKCFwcm9ncmFtV3JhcHBlcikge1xuICAgICAgICBwcm9ncmFtV3JhcHBlciA9IHRoaXMucHJvZ3JhbXNbaV0gPSBwcm9ncmFtKGksIGZuKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcm9ncmFtV3JhcHBlcjtcbiAgICB9LFxuICAgIG1lcmdlOiBmdW5jdGlvbihwYXJhbSwgY29tbW9uKSB7XG4gICAgICB2YXIgcmV0ID0gcGFyYW0gfHwgY29tbW9uO1xuXG4gICAgICBpZiAocGFyYW0gJiYgY29tbW9uICYmIChwYXJhbSAhPT0gY29tbW9uKSkge1xuICAgICAgICByZXQgPSB7fTtcbiAgICAgICAgVXRpbHMuZXh0ZW5kKHJldCwgY29tbW9uKTtcbiAgICAgICAgVXRpbHMuZXh0ZW5kKHJldCwgcGFyYW0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuICAgIHByb2dyYW1XaXRoRGVwdGg6IGVudi5WTS5wcm9ncmFtV2l0aERlcHRoLFxuICAgIG5vb3A6IGVudi5WTS5ub29wLFxuICAgIGNvbXBpbGVySW5mbzogbnVsbFxuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdmFyIG5hbWVzcGFjZSA9IG9wdGlvbnMucGFydGlhbCA/IG9wdGlvbnMgOiBlbnYsXG4gICAgICAgIGhlbHBlcnMsXG4gICAgICAgIHBhcnRpYWxzO1xuXG4gICAgaWYgKCFvcHRpb25zLnBhcnRpYWwpIHtcbiAgICAgIGhlbHBlcnMgPSBvcHRpb25zLmhlbHBlcnM7XG4gICAgICBwYXJ0aWFscyA9IG9wdGlvbnMucGFydGlhbHM7XG4gICAgfVxuICAgIHZhciByZXN1bHQgPSB0ZW1wbGF0ZVNwZWMuY2FsbChcbiAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgbmFtZXNwYWNlLCBjb250ZXh0LFxuICAgICAgICAgIGhlbHBlcnMsXG4gICAgICAgICAgcGFydGlhbHMsXG4gICAgICAgICAgb3B0aW9ucy5kYXRhKTtcblxuICAgIGlmICghb3B0aW9ucy5wYXJ0aWFsKSB7XG4gICAgICBlbnYuVk0uY2hlY2tSZXZpc2lvbihjb250YWluZXIuY29tcGlsZXJJbmZvKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuXG5leHBvcnRzLnRlbXBsYXRlID0gdGVtcGxhdGU7ZnVuY3Rpb24gcHJvZ3JhbVdpdGhEZXB0aChpLCBmbiwgZGF0YSAvKiwgJGRlcHRoICovKSB7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAzKTtcblxuICB2YXIgcHJvZyA9IGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBbY29udGV4dCwgb3B0aW9ucy5kYXRhIHx8IGRhdGFdLmNvbmNhdChhcmdzKSk7XG4gIH07XG4gIHByb2cucHJvZ3JhbSA9IGk7XG4gIHByb2cuZGVwdGggPSBhcmdzLmxlbmd0aDtcbiAgcmV0dXJuIHByb2c7XG59XG5cbmV4cG9ydHMucHJvZ3JhbVdpdGhEZXB0aCA9IHByb2dyYW1XaXRoRGVwdGg7ZnVuY3Rpb24gcHJvZ3JhbShpLCBmbiwgZGF0YSkge1xuICB2YXIgcHJvZyA9IGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHJldHVybiBmbihjb250ZXh0LCBvcHRpb25zLmRhdGEgfHwgZGF0YSk7XG4gIH07XG4gIHByb2cucHJvZ3JhbSA9IGk7XG4gIHByb2cuZGVwdGggPSAwO1xuICByZXR1cm4gcHJvZztcbn1cblxuZXhwb3J0cy5wcm9ncmFtID0gcHJvZ3JhbTtmdW5jdGlvbiBpbnZva2VQYXJ0aWFsKHBhcnRpYWwsIG5hbWUsIGNvbnRleHQsIGhlbHBlcnMsIHBhcnRpYWxzLCBkYXRhKSB7XG4gIHZhciBvcHRpb25zID0geyBwYXJ0aWFsOiB0cnVlLCBoZWxwZXJzOiBoZWxwZXJzLCBwYXJ0aWFsczogcGFydGlhbHMsIGRhdGE6IGRhdGEgfTtcblxuICBpZihwYXJ0aWFsID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwiVGhlIHBhcnRpYWwgXCIgKyBuYW1lICsgXCIgY291bGQgbm90IGJlIGZvdW5kXCIpO1xuICB9IGVsc2UgaWYocGFydGlhbCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgcmV0dXJuIHBhcnRpYWwoY29udGV4dCwgb3B0aW9ucyk7XG4gIH1cbn1cblxuZXhwb3J0cy5pbnZva2VQYXJ0aWFsID0gaW52b2tlUGFydGlhbDtmdW5jdGlvbiBub29wKCkgeyByZXR1cm4gXCJcIjsgfVxuXG5leHBvcnRzLm5vb3AgPSBub29wOyIsIlwidXNlIHN0cmljdFwiO1xuLy8gQnVpbGQgb3V0IG91ciBiYXNpYyBTYWZlU3RyaW5nIHR5cGVcbmZ1bmN0aW9uIFNhZmVTdHJpbmcoc3RyaW5nKSB7XG4gIHRoaXMuc3RyaW5nID0gc3RyaW5nO1xufVxuXG5TYWZlU3RyaW5nLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gXCJcIiArIHRoaXMuc3RyaW5nO1xufTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBTYWZlU3RyaW5nOyIsIlwidXNlIHN0cmljdFwiO1xuLypqc2hpbnQgLVcwMDQgKi9cbnZhciBTYWZlU3RyaW5nID0gcmVxdWlyZShcIi4vc2FmZS1zdHJpbmdcIilbXCJkZWZhdWx0XCJdO1xuXG52YXIgZXNjYXBlID0ge1xuICBcIiZcIjogXCImYW1wO1wiLFxuICBcIjxcIjogXCImbHQ7XCIsXG4gIFwiPlwiOiBcIiZndDtcIixcbiAgJ1wiJzogXCImcXVvdDtcIixcbiAgXCInXCI6IFwiJiN4Mjc7XCIsXG4gIFwiYFwiOiBcIiYjeDYwO1wiXG59O1xuXG52YXIgYmFkQ2hhcnMgPSAvWyY8PlwiJ2BdL2c7XG52YXIgcG9zc2libGUgPSAvWyY8PlwiJ2BdLztcblxuZnVuY3Rpb24gZXNjYXBlQ2hhcihjaHIpIHtcbiAgcmV0dXJuIGVzY2FwZVtjaHJdIHx8IFwiJmFtcDtcIjtcbn1cblxuZnVuY3Rpb24gZXh0ZW5kKG9iaiwgdmFsdWUpIHtcbiAgZm9yKHZhciBrZXkgaW4gdmFsdWUpIHtcbiAgICBpZihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIGtleSkpIHtcbiAgICAgIG9ialtrZXldID0gdmFsdWVba2V5XTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0cy5leHRlbmQgPSBleHRlbmQ7dmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbmV4cG9ydHMudG9TdHJpbmcgPSB0b1N0cmluZztcbi8vIFNvdXJjZWQgZnJvbSBsb2Rhc2hcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iZXN0aWVqcy9sb2Rhc2gvYmxvYi9tYXN0ZXIvTElDRU5TRS50eHRcbnZhciBpc0Z1bmN0aW9uID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbn07XG4vLyBmYWxsYmFjayBmb3Igb2xkZXIgdmVyc2lvbnMgb2YgQ2hyb21lIGFuZCBTYWZhcmlcbmlmIChpc0Z1bmN0aW9uKC94LykpIHtcbiAgaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbiAgfTtcbn1cbnZhciBpc0Z1bmN0aW9uO1xuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpID8gdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEFycmF5XScgOiBmYWxzZTtcbn07XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBlc2NhcGVFeHByZXNzaW9uKHN0cmluZykge1xuICAvLyBkb24ndCBlc2NhcGUgU2FmZVN0cmluZ3MsIHNpbmNlIHRoZXkncmUgYWxyZWFkeSBzYWZlXG4gIGlmIChzdHJpbmcgaW5zdGFuY2VvZiBTYWZlU3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy50b1N0cmluZygpO1xuICB9IGVsc2UgaWYgKCFzdHJpbmcgJiYgc3RyaW5nICE9PSAwKSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cblxuICAvLyBGb3JjZSBhIHN0cmluZyBjb252ZXJzaW9uIGFzIHRoaXMgd2lsbCBiZSBkb25lIGJ5IHRoZSBhcHBlbmQgcmVnYXJkbGVzcyBhbmRcbiAgLy8gdGhlIHJlZ2V4IHRlc3Qgd2lsbCBkbyB0aGlzIHRyYW5zcGFyZW50bHkgYmVoaW5kIHRoZSBzY2VuZXMsIGNhdXNpbmcgaXNzdWVzIGlmXG4gIC8vIGFuIG9iamVjdCdzIHRvIHN0cmluZyBoYXMgZXNjYXBlZCBjaGFyYWN0ZXJzIGluIGl0LlxuICBzdHJpbmcgPSBcIlwiICsgc3RyaW5nO1xuXG4gIGlmKCFwb3NzaWJsZS50ZXN0KHN0cmluZykpIHsgcmV0dXJuIHN0cmluZzsgfVxuICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoYmFkQ2hhcnMsIGVzY2FwZUNoYXIpO1xufVxuXG5leHBvcnRzLmVzY2FwZUV4cHJlc3Npb24gPSBlc2NhcGVFeHByZXNzaW9uO2Z1bmN0aW9uIGlzRW1wdHkodmFsdWUpIHtcbiAgaWYgKCF2YWx1ZSAmJiB2YWx1ZSAhPT0gMCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnRzLmlzRW1wdHkgPSBpc0VtcHR5OyIsIi8vIENyZWF0ZSBhIHNpbXBsZSBwYXRoIGFsaWFzIHRvIGFsbG93IGJyb3dzZXJpZnkgdG8gcmVzb2x2ZVxuLy8gdGhlIHJ1bnRpbWUgb24gYSBzdXBwb3J0ZWQgcGF0aC5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kaXN0L2Nqcy9oYW5kbGViYXJzLnJ1bnRpbWUnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImhhbmRsZWJhcnMvcnVudGltZVwiKVtcImRlZmF1bHRcIl07XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llc1xuICovXG5cbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ2pzb25wJyk7XG5cbi8qKlxuICogTW9kdWxlIGV4cG9ydHMuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBqc29ucDtcblxuLyoqXG4gKiBDYWxsYmFjayBpbmRleC5cbiAqL1xuXG52YXIgY291bnQgPSAwO1xuXG4vKipcbiAqIE5vb3AgZnVuY3Rpb24uXG4gKi9cblxuZnVuY3Rpb24gbm9vcCgpe31cblxuLyoqXG4gKiBKU09OUCBoYW5kbGVyXG4gKlxuICogT3B0aW9uczpcbiAqICAtIHBhcmFtIHtTdHJpbmd9IHFzIHBhcmFtZXRlciAoYGNhbGxiYWNrYClcbiAqICAtIHRpbWVvdXQge051bWJlcn0gaG93IGxvbmcgYWZ0ZXIgYSB0aW1lb3V0IGVycm9yIGlzIGVtaXR0ZWQgKGA2MDAwMGApXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHBhcmFtIHtPYmplY3R8RnVuY3Rpb259IG9wdGlvbmFsIG9wdGlvbnMgLyBjYWxsYmFja1xuICogQHBhcmFtIHtGdW5jdGlvbn0gb3B0aW9uYWwgY2FsbGJhY2tcbiAqL1xuXG5mdW5jdGlvbiBqc29ucCh1cmwsIG9wdHMsIGZuKXtcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIG9wdHMpIHtcbiAgICBmbiA9IG9wdHM7XG4gICAgb3B0cyA9IHt9O1xuICB9XG4gIGlmICghb3B0cykgb3B0cyA9IHt9O1xuXG4gIHZhciBwcmVmaXggPSBvcHRzLnByZWZpeCB8fCAnX19qcCc7XG4gIHZhciBwYXJhbSA9IG9wdHMucGFyYW0gfHwgJ2NhbGxiYWNrJztcbiAgdmFyIHRpbWVvdXQgPSBudWxsICE9IG9wdHMudGltZW91dCA/IG9wdHMudGltZW91dCA6IDYwMDAwO1xuICB2YXIgZW5jID0gZW5jb2RlVVJJQ29tcG9uZW50O1xuICB2YXIgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpWzBdIHx8IGRvY3VtZW50LmhlYWQ7XG4gIHZhciBzY3JpcHQ7XG4gIHZhciB0aW1lcjtcblxuICAvLyBnZW5lcmF0ZSBhIHVuaXF1ZSBpZCBmb3IgdGhpcyByZXF1ZXN0XG4gIHZhciBpZCA9IHByZWZpeCArIChjb3VudCsrKTtcblxuICBpZiAodGltZW91dCkge1xuICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgY2xlYW51cCgpO1xuICAgICAgaWYgKGZuKSBmbihuZXcgRXJyb3IoJ1RpbWVvdXQnKSk7XG4gICAgfSwgdGltZW91dCk7XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhbnVwKCl7XG4gICAgc2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcbiAgICB3aW5kb3dbaWRdID0gbm9vcDtcbiAgfVxuXG4gIHdpbmRvd1tpZF0gPSBmdW5jdGlvbihkYXRhKXtcbiAgICBkZWJ1ZygnanNvbnAgZ290JywgZGF0YSk7XG4gICAgaWYgKHRpbWVyKSBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIGNsZWFudXAoKTtcbiAgICBpZiAoZm4pIGZuKG51bGwsIGRhdGEpO1xuICB9O1xuXG4gIC8vIGFkZCBxcyBjb21wb25lbnRcbiAgdXJsICs9ICh+dXJsLmluZGV4T2YoJz8nKSA/ICcmJyA6ICc/JykgKyBwYXJhbSArICc9JyArIGVuYyhpZCk7XG4gIHVybCA9IHVybC5yZXBsYWNlKCc/JicsICc/Jyk7XG5cbiAgZGVidWcoJ2pzb25wIHJlcSBcIiVzXCInLCB1cmwpO1xuXG4gIC8vIGNyZWF0ZSBzY3JpcHRcbiAgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gIHNjcmlwdC5zcmMgPSB1cmw7XG4gIHRhcmdldC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShzY3JpcHQsIHRhcmdldCk7XG59XG4iLCJcbi8qKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZGVidWc7XG5cbi8qKlxuICogQ3JlYXRlIGEgZGVidWdnZXIgd2l0aCB0aGUgZ2l2ZW4gYG5hbWVgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtUeXBlfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkZWJ1ZyhuYW1lKSB7XG4gIGlmICghZGVidWcuZW5hYmxlZChuYW1lKSkgcmV0dXJuIGZ1bmN0aW9uKCl7fTtcblxuICByZXR1cm4gZnVuY3Rpb24oZm10KXtcbiAgICBmbXQgPSBjb2VyY2UoZm10KTtcblxuICAgIHZhciBjdXJyID0gbmV3IERhdGU7XG4gICAgdmFyIG1zID0gY3VyciAtIChkZWJ1Z1tuYW1lXSB8fCBjdXJyKTtcbiAgICBkZWJ1Z1tuYW1lXSA9IGN1cnI7XG5cbiAgICBmbXQgPSBuYW1lXG4gICAgICArICcgJ1xuICAgICAgKyBmbXRcbiAgICAgICsgJyArJyArIGRlYnVnLmh1bWFuaXplKG1zKTtcblxuICAgIC8vIFRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4XG4gICAgLy8gd2hlcmUgYGNvbnNvbGUubG9nYCBkb2Vzbid0IGhhdmUgJ2FwcGx5J1xuICAgIHdpbmRvdy5jb25zb2xlXG4gICAgICAmJiBjb25zb2xlLmxvZ1xuICAgICAgJiYgRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5LmNhbGwoY29uc29sZS5sb2csIGNvbnNvbGUsIGFyZ3VtZW50cyk7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgY3VycmVudGx5IGFjdGl2ZSBkZWJ1ZyBtb2RlIG5hbWVzLlxuICovXG5cbmRlYnVnLm5hbWVzID0gW107XG5kZWJ1Zy5za2lwcyA9IFtdO1xuXG4vKipcbiAqIEVuYWJsZXMgYSBkZWJ1ZyBtb2RlIGJ5IG5hbWUuIFRoaXMgY2FuIGluY2x1ZGUgbW9kZXNcbiAqIHNlcGFyYXRlZCBieSBhIGNvbG9uIGFuZCB3aWxkY2FyZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZGVidWcuZW5hYmxlID0gZnVuY3Rpb24obmFtZSkge1xuICB0cnkge1xuICAgIGxvY2FsU3RvcmFnZS5kZWJ1ZyA9IG5hbWU7XG4gIH0gY2F0Y2goZSl7fVxuXG4gIHZhciBzcGxpdCA9IChuYW1lIHx8ICcnKS5zcGxpdCgvW1xccyxdKy8pXG4gICAgLCBsZW4gPSBzcGxpdC5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIG5hbWUgPSBzcGxpdFtpXS5yZXBsYWNlKCcqJywgJy4qPycpO1xuICAgIGlmIChuYW1lWzBdID09PSAnLScpIHtcbiAgICAgIGRlYnVnLnNraXBzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lLnN1YnN0cigxKSArICckJykpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGRlYnVnLm5hbWVzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lICsgJyQnKSk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIERpc2FibGUgZGVidWcgb3V0cHV0LlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZGVidWcuZGlzYWJsZSA9IGZ1bmN0aW9uKCl7XG4gIGRlYnVnLmVuYWJsZSgnJyk7XG59O1xuXG4vKipcbiAqIEh1bWFuaXplIHRoZSBnaXZlbiBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5kZWJ1Zy5odW1hbml6ZSA9IGZ1bmN0aW9uKG1zKSB7XG4gIHZhciBzZWMgPSAxMDAwXG4gICAgLCBtaW4gPSA2MCAqIDEwMDBcbiAgICAsIGhvdXIgPSA2MCAqIG1pbjtcblxuICBpZiAobXMgPj0gaG91cikgcmV0dXJuIChtcyAvIGhvdXIpLnRvRml4ZWQoMSkgKyAnaCc7XG4gIGlmIChtcyA+PSBtaW4pIHJldHVybiAobXMgLyBtaW4pLnRvRml4ZWQoMSkgKyAnbSc7XG4gIGlmIChtcyA+PSBzZWMpIHJldHVybiAobXMgLyBzZWMgfCAwKSArICdzJztcbiAgcmV0dXJuIG1zICsgJ21zJztcbn07XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBtb2RlIG5hbWUgaXMgZW5hYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5kZWJ1Zy5lbmFibGVkID0gZnVuY3Rpb24obmFtZSkge1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gZGVidWcuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZGVidWcuc2tpcHNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gZGVidWcubmFtZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZGVidWcubmFtZXNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogQ29lcmNlIGB2YWxgLlxuICovXG5cbmZ1bmN0aW9uIGNvZXJjZSh2YWwpIHtcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuICByZXR1cm4gdmFsO1xufVxuXG4vLyBwZXJzaXN0XG5cbnRyeSB7XG4gIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlKSBkZWJ1Zy5lbmFibGUobG9jYWxTdG9yYWdlLmRlYnVnKTtcbn0gY2F0Y2goZSl7fVxuIiwiLyohXG4gKiBTaXp6bGUgQ1NTIFNlbGVjdG9yIEVuZ2luZVxuICogIENvcHlyaWdodCAyMDExLCBUaGUgRG9qbyBGb3VuZGF0aW9uXG4gKiAgUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCwgQlNELCBhbmQgR1BMIExpY2Vuc2VzLlxuICogIE1vcmUgaW5mb3JtYXRpb246IGh0dHA6Ly9zaXp6bGVqcy5jb20vXG4gKi9cbihmdW5jdGlvbigpe1xuXG52YXIgY2h1bmtlciA9IC8oKD86XFwoKD86XFwoW14oKV0rXFwpfFteKCldKykrXFwpfFxcWyg/OlxcW1teXFxbXFxdXSpcXF18WydcIl1bXidcIl0qWydcIl18W15cXFtcXF0nXCJdKykrXFxdfFxcXFwufFteID4rfiwoXFxbXFxcXF0rKSt8Wz4rfl0pKFxccyosXFxzKik/KCg/Oi58XFxyfFxcbikqKS9nLFxuXHRleHBhbmRvID0gXCJzaXpjYWNoZVwiICsgKE1hdGgucmFuZG9tKCkgKyAnJykucmVwbGFjZSgnLicsICcnKSxcblx0ZG9uZSA9IDAsXG5cdHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcblx0aGFzRHVwbGljYXRlID0gZmFsc2UsXG5cdGJhc2VIYXNEdXBsaWNhdGUgPSB0cnVlLFxuXHRyQmFja3NsYXNoID0gL1xcXFwvZyxcblx0clJldHVybiA9IC9cXHJcXG4vZyxcblx0ck5vbldvcmQgPSAvXFxXLztcblxuLy8gSGVyZSB3ZSBjaGVjayBpZiB0aGUgSmF2YVNjcmlwdCBlbmdpbmUgaXMgdXNpbmcgc29tZSBzb3J0IG9mXG4vLyBvcHRpbWl6YXRpb24gd2hlcmUgaXQgZG9lcyBub3QgYWx3YXlzIGNhbGwgb3VyIGNvbXBhcmlzaW9uXG4vLyBmdW5jdGlvbi4gSWYgdGhhdCBpcyB0aGUgY2FzZSwgZGlzY2FyZCB0aGUgaGFzRHVwbGljYXRlIHZhbHVlLlxuLy8gICBUaHVzIGZhciB0aGF0IGluY2x1ZGVzIEdvb2dsZSBDaHJvbWUuXG5bMCwgMF0uc29ydChmdW5jdGlvbigpIHtcblx0YmFzZUhhc0R1cGxpY2F0ZSA9IGZhbHNlO1xuXHRyZXR1cm4gMDtcbn0pO1xuXG52YXIgU2l6emxlID0gZnVuY3Rpb24oIHNlbGVjdG9yLCBjb250ZXh0LCByZXN1bHRzLCBzZWVkICkge1xuXHRyZXN1bHRzID0gcmVzdWx0cyB8fCBbXTtcblx0Y29udGV4dCA9IGNvbnRleHQgfHwgZG9jdW1lbnQ7XG5cblx0dmFyIG9yaWdDb250ZXh0ID0gY29udGV4dDtcblxuXHRpZiAoIGNvbnRleHQubm9kZVR5cGUgIT09IDEgJiYgY29udGV4dC5ub2RlVHlwZSAhPT0gOSApIHtcblx0XHRyZXR1cm4gW107XG5cdH1cblxuXHRpZiAoICFzZWxlY3RvciB8fCB0eXBlb2Ygc2VsZWN0b3IgIT09IFwic3RyaW5nXCIgKSB7XG5cdFx0cmV0dXJuIHJlc3VsdHM7XG5cdH1cblxuXHR2YXIgbSwgc2V0LCBjaGVja1NldCwgZXh0cmEsIHJldCwgY3VyLCBwb3AsIGksXG5cdFx0cHJ1bmUgPSB0cnVlLFxuXHRcdGNvbnRleHRYTUwgPSBTaXp6bGUuaXNYTUwoIGNvbnRleHQgKSxcblx0XHRwYXJ0cyA9IFtdLFxuXHRcdHNvRmFyID0gc2VsZWN0b3I7XG5cblx0Ly8gUmVzZXQgdGhlIHBvc2l0aW9uIG9mIHRoZSBjaHVua2VyIHJlZ2V4cCAoc3RhcnQgZnJvbSBoZWFkKVxuXHRkbyB7XG5cdFx0Y2h1bmtlci5leGVjKCBcIlwiICk7XG5cdFx0bSA9IGNodW5rZXIuZXhlYyggc29GYXIgKTtcblxuXHRcdGlmICggbSApIHtcblx0XHRcdHNvRmFyID0gbVszXTtcblxuXHRcdFx0cGFydHMucHVzaCggbVsxXSApO1xuXG5cdFx0XHRpZiAoIG1bMl0gKSB7XG5cdFx0XHRcdGV4dHJhID0gbVszXTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXHR9IHdoaWxlICggbSApO1xuXG5cdGlmICggcGFydHMubGVuZ3RoID4gMSAmJiBvcmlnUE9TLmV4ZWMoIHNlbGVjdG9yICkgKSB7XG5cblx0XHRpZiAoIHBhcnRzLmxlbmd0aCA9PT0gMiAmJiBFeHByLnJlbGF0aXZlWyBwYXJ0c1swXSBdICkge1xuXHRcdFx0c2V0ID0gcG9zUHJvY2VzcyggcGFydHNbMF0gKyBwYXJ0c1sxXSwgY29udGV4dCwgc2VlZCApO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdHNldCA9IEV4cHIucmVsYXRpdmVbIHBhcnRzWzBdIF0gP1xuXHRcdFx0XHRbIGNvbnRleHQgXSA6XG5cdFx0XHRcdFNpenpsZSggcGFydHMuc2hpZnQoKSwgY29udGV4dCApO1xuXG5cdFx0XHR3aGlsZSAoIHBhcnRzLmxlbmd0aCApIHtcblx0XHRcdFx0c2VsZWN0b3IgPSBwYXJ0cy5zaGlmdCgpO1xuXG5cdFx0XHRcdGlmICggRXhwci5yZWxhdGl2ZVsgc2VsZWN0b3IgXSApIHtcblx0XHRcdFx0XHRzZWxlY3RvciArPSBwYXJ0cy5zaGlmdCgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0c2V0ID0gcG9zUHJvY2Vzcyggc2VsZWN0b3IsIHNldCwgc2VlZCApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9IGVsc2Uge1xuXHRcdC8vIFRha2UgYSBzaG9ydGN1dCBhbmQgc2V0IHRoZSBjb250ZXh0IGlmIHRoZSByb290IHNlbGVjdG9yIGlzIGFuIElEXG5cdFx0Ly8gKGJ1dCBub3QgaWYgaXQnbGwgYmUgZmFzdGVyIGlmIHRoZSBpbm5lciBzZWxlY3RvciBpcyBhbiBJRClcblx0XHRpZiAoICFzZWVkICYmIHBhcnRzLmxlbmd0aCA+IDEgJiYgY29udGV4dC5ub2RlVHlwZSA9PT0gOSAmJiAhY29udGV4dFhNTCAmJlxuXHRcdFx0XHRFeHByLm1hdGNoLklELnRlc3QocGFydHNbMF0pICYmICFFeHByLm1hdGNoLklELnRlc3QocGFydHNbcGFydHMubGVuZ3RoIC0gMV0pICkge1xuXG5cdFx0XHRyZXQgPSBTaXp6bGUuZmluZCggcGFydHMuc2hpZnQoKSwgY29udGV4dCwgY29udGV4dFhNTCApO1xuXHRcdFx0Y29udGV4dCA9IHJldC5leHByID9cblx0XHRcdFx0U2l6emxlLmZpbHRlciggcmV0LmV4cHIsIHJldC5zZXQgKVswXSA6XG5cdFx0XHRcdHJldC5zZXRbMF07XG5cdFx0fVxuXG5cdFx0aWYgKCBjb250ZXh0ICkge1xuXHRcdFx0cmV0ID0gc2VlZCA/XG5cdFx0XHRcdHsgZXhwcjogcGFydHMucG9wKCksIHNldDogbWFrZUFycmF5KHNlZWQpIH0gOlxuXHRcdFx0XHRTaXp6bGUuZmluZCggcGFydHMucG9wKCksIHBhcnRzLmxlbmd0aCA9PT0gMSAmJiAocGFydHNbMF0gPT09IFwiflwiIHx8IHBhcnRzWzBdID09PSBcIitcIikgJiYgY29udGV4dC5wYXJlbnROb2RlID8gY29udGV4dC5wYXJlbnROb2RlIDogY29udGV4dCwgY29udGV4dFhNTCApO1xuXG5cdFx0XHRzZXQgPSByZXQuZXhwciA/XG5cdFx0XHRcdFNpenpsZS5maWx0ZXIoIHJldC5leHByLCByZXQuc2V0ICkgOlxuXHRcdFx0XHRyZXQuc2V0O1xuXG5cdFx0XHRpZiAoIHBhcnRzLmxlbmd0aCA+IDAgKSB7XG5cdFx0XHRcdGNoZWNrU2V0ID0gbWFrZUFycmF5KCBzZXQgKTtcblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cHJ1bmUgPSBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0d2hpbGUgKCBwYXJ0cy5sZW5ndGggKSB7XG5cdFx0XHRcdGN1ciA9IHBhcnRzLnBvcCgpO1xuXHRcdFx0XHRwb3AgPSBjdXI7XG5cblx0XHRcdFx0aWYgKCAhRXhwci5yZWxhdGl2ZVsgY3VyIF0gKSB7XG5cdFx0XHRcdFx0Y3VyID0gXCJcIjtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRwb3AgPSBwYXJ0cy5wb3AoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICggcG9wID09IG51bGwgKSB7XG5cdFx0XHRcdFx0cG9wID0gY29udGV4dDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdEV4cHIucmVsYXRpdmVbIGN1ciBdKCBjaGVja1NldCwgcG9wLCBjb250ZXh0WE1MICk7XG5cdFx0XHR9XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0Y2hlY2tTZXQgPSBwYXJ0cyA9IFtdO1xuXHRcdH1cblx0fVxuXG5cdGlmICggIWNoZWNrU2V0ICkge1xuXHRcdGNoZWNrU2V0ID0gc2V0O1xuXHR9XG5cblx0aWYgKCAhY2hlY2tTZXQgKSB7XG5cdFx0U2l6emxlLmVycm9yKCBjdXIgfHwgc2VsZWN0b3IgKTtcblx0fVxuXG5cdGlmICggdG9TdHJpbmcuY2FsbChjaGVja1NldCkgPT09IFwiW29iamVjdCBBcnJheV1cIiApIHtcblx0XHRpZiAoICFwcnVuZSApIHtcblx0XHRcdHJlc3VsdHMucHVzaC5hcHBseSggcmVzdWx0cywgY2hlY2tTZXQgKTtcblxuXHRcdH0gZWxzZSBpZiAoIGNvbnRleHQgJiYgY29udGV4dC5ub2RlVHlwZSA9PT0gMSApIHtcblx0XHRcdGZvciAoIGkgPSAwOyBjaGVja1NldFtpXSAhPSBudWxsOyBpKysgKSB7XG5cdFx0XHRcdGlmICggY2hlY2tTZXRbaV0gJiYgKGNoZWNrU2V0W2ldID09PSB0cnVlIHx8IGNoZWNrU2V0W2ldLm5vZGVUeXBlID09PSAxICYmIFNpenpsZS5jb250YWlucyhjb250ZXh0LCBjaGVja1NldFtpXSkpICkge1xuXHRcdFx0XHRcdHJlc3VsdHMucHVzaCggc2V0W2ldICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKCBpID0gMDsgY2hlY2tTZXRbaV0gIT0gbnVsbDsgaSsrICkge1xuXHRcdFx0XHRpZiAoIGNoZWNrU2V0W2ldICYmIGNoZWNrU2V0W2ldLm5vZGVUeXBlID09PSAxICkge1xuXHRcdFx0XHRcdHJlc3VsdHMucHVzaCggc2V0W2ldICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0fSBlbHNlIHtcblx0XHRtYWtlQXJyYXkoIGNoZWNrU2V0LCByZXN1bHRzICk7XG5cdH1cblxuXHRpZiAoIGV4dHJhICkge1xuXHRcdFNpenpsZSggZXh0cmEsIG9yaWdDb250ZXh0LCByZXN1bHRzLCBzZWVkICk7XG5cdFx0U2l6emxlLnVuaXF1ZVNvcnQoIHJlc3VsdHMgKTtcblx0fVxuXG5cdHJldHVybiByZXN1bHRzO1xufTtcblxuU2l6emxlLnVuaXF1ZVNvcnQgPSBmdW5jdGlvbiggcmVzdWx0cyApIHtcblx0aWYgKCBzb3J0T3JkZXIgKSB7XG5cdFx0aGFzRHVwbGljYXRlID0gYmFzZUhhc0R1cGxpY2F0ZTtcblx0XHRyZXN1bHRzLnNvcnQoIHNvcnRPcmRlciApO1xuXG5cdFx0aWYgKCBoYXNEdXBsaWNhdGUgKSB7XG5cdFx0XHRmb3IgKCB2YXIgaSA9IDE7IGkgPCByZXN1bHRzLmxlbmd0aDsgaSsrICkge1xuXHRcdFx0XHRpZiAoIHJlc3VsdHNbaV0gPT09IHJlc3VsdHNbIGkgLSAxIF0gKSB7XG5cdFx0XHRcdFx0cmVzdWx0cy5zcGxpY2UoIGktLSwgMSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHJlc3VsdHM7XG59O1xuXG5TaXp6bGUubWF0Y2hlcyA9IGZ1bmN0aW9uKCBleHByLCBzZXQgKSB7XG5cdHJldHVybiBTaXp6bGUoIGV4cHIsIG51bGwsIG51bGwsIHNldCApO1xufTtcblxuU2l6emxlLm1hdGNoZXNTZWxlY3RvciA9IGZ1bmN0aW9uKCBub2RlLCBleHByICkge1xuXHRyZXR1cm4gU2l6emxlKCBleHByLCBudWxsLCBudWxsLCBbbm9kZV0gKS5sZW5ndGggPiAwO1xufTtcblxuU2l6emxlLmZpbmQgPSBmdW5jdGlvbiggZXhwciwgY29udGV4dCwgaXNYTUwgKSB7XG5cdHZhciBzZXQsIGksIGxlbiwgbWF0Y2gsIHR5cGUsIGxlZnQ7XG5cblx0aWYgKCAhZXhwciApIHtcblx0XHRyZXR1cm4gW107XG5cdH1cblxuXHRmb3IgKCBpID0gMCwgbGVuID0gRXhwci5vcmRlci5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHR0eXBlID0gRXhwci5vcmRlcltpXTtcblxuXHRcdGlmICggKG1hdGNoID0gRXhwci5sZWZ0TWF0Y2hbIHR5cGUgXS5leGVjKCBleHByICkpICkge1xuXHRcdFx0bGVmdCA9IG1hdGNoWzFdO1xuXHRcdFx0bWF0Y2guc3BsaWNlKCAxLCAxICk7XG5cblx0XHRcdGlmICggbGVmdC5zdWJzdHIoIGxlZnQubGVuZ3RoIC0gMSApICE9PSBcIlxcXFxcIiApIHtcblx0XHRcdFx0bWF0Y2hbMV0gPSAobWF0Y2hbMV0gfHwgXCJcIikucmVwbGFjZSggckJhY2tzbGFzaCwgXCJcIiApO1xuXHRcdFx0XHRzZXQgPSBFeHByLmZpbmRbIHR5cGUgXSggbWF0Y2gsIGNvbnRleHQsIGlzWE1MICk7XG5cblx0XHRcdFx0aWYgKCBzZXQgIT0gbnVsbCApIHtcblx0XHRcdFx0XHRleHByID0gZXhwci5yZXBsYWNlKCBFeHByLm1hdGNoWyB0eXBlIF0sIFwiXCIgKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGlmICggIXNldCApIHtcblx0XHRzZXQgPSB0eXBlb2YgY29udGV4dC5nZXRFbGVtZW50c0J5VGFnTmFtZSAhPT0gXCJ1bmRlZmluZWRcIiA/XG5cdFx0XHRjb250ZXh0LmdldEVsZW1lbnRzQnlUYWdOYW1lKCBcIipcIiApIDpcblx0XHRcdFtdO1xuXHR9XG5cblx0cmV0dXJuIHsgc2V0OiBzZXQsIGV4cHI6IGV4cHIgfTtcbn07XG5cblNpenpsZS5maWx0ZXIgPSBmdW5jdGlvbiggZXhwciwgc2V0LCBpbnBsYWNlLCBub3QgKSB7XG5cdHZhciBtYXRjaCwgYW55Rm91bmQsXG5cdFx0dHlwZSwgZm91bmQsIGl0ZW0sIGZpbHRlciwgbGVmdCxcblx0XHRpLCBwYXNzLFxuXHRcdG9sZCA9IGV4cHIsXG5cdFx0cmVzdWx0ID0gW10sXG5cdFx0Y3VyTG9vcCA9IHNldCxcblx0XHRpc1hNTEZpbHRlciA9IHNldCAmJiBzZXRbMF0gJiYgU2l6emxlLmlzWE1MKCBzZXRbMF0gKTtcblxuXHR3aGlsZSAoIGV4cHIgJiYgc2V0Lmxlbmd0aCApIHtcblx0XHRmb3IgKCB0eXBlIGluIEV4cHIuZmlsdGVyICkge1xuXHRcdFx0aWYgKCAobWF0Y2ggPSBFeHByLmxlZnRNYXRjaFsgdHlwZSBdLmV4ZWMoIGV4cHIgKSkgIT0gbnVsbCAmJiBtYXRjaFsyXSApIHtcblx0XHRcdFx0ZmlsdGVyID0gRXhwci5maWx0ZXJbIHR5cGUgXTtcblx0XHRcdFx0bGVmdCA9IG1hdGNoWzFdO1xuXG5cdFx0XHRcdGFueUZvdW5kID0gZmFsc2U7XG5cblx0XHRcdFx0bWF0Y2guc3BsaWNlKDEsMSk7XG5cblx0XHRcdFx0aWYgKCBsZWZ0LnN1YnN0ciggbGVmdC5sZW5ndGggLSAxICkgPT09IFwiXFxcXFwiICkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCBjdXJMb29wID09PSByZXN1bHQgKSB7XG5cdFx0XHRcdFx0cmVzdWx0ID0gW107XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIEV4cHIucHJlRmlsdGVyWyB0eXBlIF0gKSB7XG5cdFx0XHRcdFx0bWF0Y2ggPSBFeHByLnByZUZpbHRlclsgdHlwZSBdKCBtYXRjaCwgY3VyTG9vcCwgaW5wbGFjZSwgcmVzdWx0LCBub3QsIGlzWE1MRmlsdGVyICk7XG5cblx0XHRcdFx0XHRpZiAoICFtYXRjaCApIHtcblx0XHRcdFx0XHRcdGFueUZvdW5kID0gZm91bmQgPSB0cnVlO1xuXG5cdFx0XHRcdFx0fSBlbHNlIGlmICggbWF0Y2ggPT09IHRydWUgKSB7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIG1hdGNoICkge1xuXHRcdFx0XHRcdGZvciAoIGkgPSAwOyAoaXRlbSA9IGN1ckxvb3BbaV0pICE9IG51bGw7IGkrKyApIHtcblx0XHRcdFx0XHRcdGlmICggaXRlbSApIHtcblx0XHRcdFx0XHRcdFx0Zm91bmQgPSBmaWx0ZXIoIGl0ZW0sIG1hdGNoLCBpLCBjdXJMb29wICk7XG5cdFx0XHRcdFx0XHRcdHBhc3MgPSBub3QgXiBmb3VuZDtcblxuXHRcdFx0XHRcdFx0XHRpZiAoIGlucGxhY2UgJiYgZm91bmQgIT0gbnVsbCApIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAoIHBhc3MgKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRhbnlGb3VuZCA9IHRydWU7XG5cblx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y3VyTG9vcFtpXSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKCBwYXNzICkge1xuXHRcdFx0XHRcdFx0XHRcdHJlc3VsdC5wdXNoKCBpdGVtICk7XG5cdFx0XHRcdFx0XHRcdFx0YW55Rm91bmQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCBmb3VuZCAhPT0gdW5kZWZpbmVkICkge1xuXHRcdFx0XHRcdGlmICggIWlucGxhY2UgKSB7XG5cdFx0XHRcdFx0XHRjdXJMb29wID0gcmVzdWx0O1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGV4cHIgPSBleHByLnJlcGxhY2UoIEV4cHIubWF0Y2hbIHR5cGUgXSwgXCJcIiApO1xuXG5cdFx0XHRcdFx0aWYgKCAhYW55Rm91bmQgKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gW107XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJbXByb3BlciBleHByZXNzaW9uXG5cdFx0aWYgKCBleHByID09PSBvbGQgKSB7XG5cdFx0XHRpZiAoIGFueUZvdW5kID09IG51bGwgKSB7XG5cdFx0XHRcdFNpenpsZS5lcnJvciggZXhwciApO1xuXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRvbGQgPSBleHByO1xuXHR9XG5cblx0cmV0dXJuIGN1ckxvb3A7XG59O1xuXG5TaXp6bGUuZXJyb3IgPSBmdW5jdGlvbiggbXNnICkge1xuXHR0aHJvdyBuZXcgRXJyb3IoIFwiU3ludGF4IGVycm9yLCB1bnJlY29nbml6ZWQgZXhwcmVzc2lvbjogXCIgKyBtc2cgKTtcbn07XG5cbi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbiBmb3IgcmV0cmVpdmluZyB0aGUgdGV4dCB2YWx1ZSBvZiBhbiBhcnJheSBvZiBET00gbm9kZXNcbiAqIEBwYXJhbSB7QXJyYXl8RWxlbWVudH0gZWxlbVxuICovXG52YXIgZ2V0VGV4dCA9IFNpenpsZS5nZXRUZXh0ID0gZnVuY3Rpb24oIGVsZW0gKSB7XG4gICAgdmFyIGksIG5vZGUsXG5cdFx0bm9kZVR5cGUgPSBlbGVtLm5vZGVUeXBlLFxuXHRcdHJldCA9IFwiXCI7XG5cblx0aWYgKCBub2RlVHlwZSApIHtcblx0XHRpZiAoIG5vZGVUeXBlID09PSAxIHx8IG5vZGVUeXBlID09PSA5IHx8IG5vZGVUeXBlID09PSAxMSApIHtcblx0XHRcdC8vIFVzZSB0ZXh0Q29udGVudCB8fCBpbm5lclRleHQgZm9yIGVsZW1lbnRzXG5cdFx0XHRpZiAoIHR5cGVvZiBlbGVtLnRleHRDb250ZW50ID09PSAnc3RyaW5nJyApIHtcblx0XHRcdFx0cmV0dXJuIGVsZW0udGV4dENvbnRlbnQ7XG5cdFx0XHR9IGVsc2UgaWYgKCB0eXBlb2YgZWxlbS5pbm5lclRleHQgPT09ICdzdHJpbmcnICkge1xuXHRcdFx0XHQvLyBSZXBsYWNlIElFJ3MgY2FycmlhZ2UgcmV0dXJuc1xuXHRcdFx0XHRyZXR1cm4gZWxlbS5pbm5lclRleHQucmVwbGFjZSggclJldHVybiwgJycgKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIFRyYXZlcnNlIGl0J3MgY2hpbGRyZW5cblx0XHRcdFx0Zm9yICggZWxlbSA9IGVsZW0uZmlyc3RDaGlsZDsgZWxlbTsgZWxlbSA9IGVsZW0ubmV4dFNpYmxpbmcpIHtcblx0XHRcdFx0XHRyZXQgKz0gZ2V0VGV4dCggZWxlbSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICggbm9kZVR5cGUgPT09IDMgfHwgbm9kZVR5cGUgPT09IDQgKSB7XG5cdFx0XHRyZXR1cm4gZWxlbS5ub2RlVmFsdWU7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXG5cdFx0Ly8gSWYgbm8gbm9kZVR5cGUsIHRoaXMgaXMgZXhwZWN0ZWQgdG8gYmUgYW4gYXJyYXlcblx0XHRmb3IgKCBpID0gMDsgKG5vZGUgPSBlbGVtW2ldKTsgaSsrICkge1xuXHRcdFx0Ly8gRG8gbm90IHRyYXZlcnNlIGNvbW1lbnQgbm9kZXNcblx0XHRcdGlmICggbm9kZS5ub2RlVHlwZSAhPT0gOCApIHtcblx0XHRcdFx0cmV0ICs9IGdldFRleHQoIG5vZGUgKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblx0cmV0dXJuIHJldDtcbn07XG5cbnZhciBFeHByID0gU2l6emxlLnNlbGVjdG9ycyA9IHtcblx0b3JkZXI6IFsgXCJJRFwiLCBcIk5BTUVcIiwgXCJUQUdcIiBdLFxuXG5cdG1hdGNoOiB7XG5cdFx0SUQ6IC8jKCg/OltcXHdcXHUwMGMwLVxcdUZGRkZcXC1dfFxcXFwuKSspLyxcblx0XHRDTEFTUzogL1xcLigoPzpbXFx3XFx1MDBjMC1cXHVGRkZGXFwtXXxcXFxcLikrKS8sXG5cdFx0TkFNRTogL1xcW25hbWU9WydcIl0qKCg/OltcXHdcXHUwMGMwLVxcdUZGRkZcXC1dfFxcXFwuKSspWydcIl0qXFxdLyxcblx0XHRBVFRSOiAvXFxbXFxzKigoPzpbXFx3XFx1MDBjMC1cXHVGRkZGXFwtXXxcXFxcLikrKVxccyooPzooXFxTPz0pXFxzKig/OihbJ1wiXSkoLio/KVxcM3woIz8oPzpbXFx3XFx1MDBjMC1cXHVGRkZGXFwtXXxcXFxcLikqKXwpfClcXHMqXFxdLyxcblx0XHRUQUc6IC9eKCg/OltcXHdcXHUwMGMwLVxcdUZGRkZcXCpcXC1dfFxcXFwuKSspLyxcblx0XHRDSElMRDogLzoob25seXxudGh8bGFzdHxmaXJzdCktY2hpbGQoPzpcXChcXHMqKGV2ZW58b2RkfCg/OlsrXFwtXT9cXGQrfCg/OlsrXFwtXT9cXGQqKT9uXFxzKig/OlsrXFwtXVxccypcXGQrKT8pKVxccypcXCkpPy8sXG5cdFx0UE9TOiAvOihudGh8ZXF8Z3R8bHR8Zmlyc3R8bGFzdHxldmVufG9kZCkoPzpcXCgoXFxkKilcXCkpPyg/PVteXFwtXXwkKS8sXG5cdFx0UFNFVURPOiAvOigoPzpbXFx3XFx1MDBjMC1cXHVGRkZGXFwtXXxcXFxcLikrKSg/OlxcKChbJ1wiXT8pKCg/OlxcKFteXFwpXStcXCl8W15cXChcXCldKikrKVxcMlxcKSk/L1xuXHR9LFxuXG5cdGxlZnRNYXRjaDoge30sXG5cblx0YXR0ck1hcDoge1xuXHRcdFwiY2xhc3NcIjogXCJjbGFzc05hbWVcIixcblx0XHRcImZvclwiOiBcImh0bWxGb3JcIlxuXHR9LFxuXG5cdGF0dHJIYW5kbGU6IHtcblx0XHRocmVmOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSggXCJocmVmXCIgKTtcblx0XHR9LFxuXHRcdHR5cGU6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0cmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKCBcInR5cGVcIiApO1xuXHRcdH1cblx0fSxcblxuXHRyZWxhdGl2ZToge1xuXHRcdFwiK1wiOiBmdW5jdGlvbihjaGVja1NldCwgcGFydCl7XG5cdFx0XHR2YXIgaXNQYXJ0U3RyID0gdHlwZW9mIHBhcnQgPT09IFwic3RyaW5nXCIsXG5cdFx0XHRcdGlzVGFnID0gaXNQYXJ0U3RyICYmICFyTm9uV29yZC50ZXN0KCBwYXJ0ICksXG5cdFx0XHRcdGlzUGFydFN0ck5vdFRhZyA9IGlzUGFydFN0ciAmJiAhaXNUYWc7XG5cblx0XHRcdGlmICggaXNUYWcgKSB7XG5cdFx0XHRcdHBhcnQgPSBwYXJ0LnRvTG93ZXJDYXNlKCk7XG5cdFx0XHR9XG5cblx0XHRcdGZvciAoIHZhciBpID0gMCwgbCA9IGNoZWNrU2V0Lmxlbmd0aCwgZWxlbTsgaSA8IGw7IGkrKyApIHtcblx0XHRcdFx0aWYgKCAoZWxlbSA9IGNoZWNrU2V0W2ldKSApIHtcblx0XHRcdFx0XHR3aGlsZSAoIChlbGVtID0gZWxlbS5wcmV2aW91c1NpYmxpbmcpICYmIGVsZW0ubm9kZVR5cGUgIT09IDEgKSB7fVxuXG5cdFx0XHRcdFx0Y2hlY2tTZXRbaV0gPSBpc1BhcnRTdHJOb3RUYWcgfHwgZWxlbSAmJiBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IHBhcnQgP1xuXHRcdFx0XHRcdFx0ZWxlbSB8fCBmYWxzZSA6XG5cdFx0XHRcdFx0XHRlbGVtID09PSBwYXJ0O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICggaXNQYXJ0U3RyTm90VGFnICkge1xuXHRcdFx0XHRTaXp6bGUuZmlsdGVyKCBwYXJ0LCBjaGVja1NldCwgdHJ1ZSApO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRcIj5cIjogZnVuY3Rpb24oIGNoZWNrU2V0LCBwYXJ0ICkge1xuXHRcdFx0dmFyIGVsZW0sXG5cdFx0XHRcdGlzUGFydFN0ciA9IHR5cGVvZiBwYXJ0ID09PSBcInN0cmluZ1wiLFxuXHRcdFx0XHRpID0gMCxcblx0XHRcdFx0bCA9IGNoZWNrU2V0Lmxlbmd0aDtcblxuXHRcdFx0aWYgKCBpc1BhcnRTdHIgJiYgIXJOb25Xb3JkLnRlc3QoIHBhcnQgKSApIHtcblx0XHRcdFx0cGFydCA9IHBhcnQudG9Mb3dlckNhc2UoKTtcblxuXHRcdFx0XHRmb3IgKCA7IGkgPCBsOyBpKysgKSB7XG5cdFx0XHRcdFx0ZWxlbSA9IGNoZWNrU2V0W2ldO1xuXG5cdFx0XHRcdFx0aWYgKCBlbGVtICkge1xuXHRcdFx0XHRcdFx0dmFyIHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZTtcblx0XHRcdFx0XHRcdGNoZWNrU2V0W2ldID0gcGFyZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IHBhcnQgPyBwYXJlbnQgOiBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Zm9yICggOyBpIDwgbDsgaSsrICkge1xuXHRcdFx0XHRcdGVsZW0gPSBjaGVja1NldFtpXTtcblxuXHRcdFx0XHRcdGlmICggZWxlbSApIHtcblx0XHRcdFx0XHRcdGNoZWNrU2V0W2ldID0gaXNQYXJ0U3RyID9cblx0XHRcdFx0XHRcdFx0ZWxlbS5wYXJlbnROb2RlIDpcblx0XHRcdFx0XHRcdFx0ZWxlbS5wYXJlbnROb2RlID09PSBwYXJ0O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICggaXNQYXJ0U3RyICkge1xuXHRcdFx0XHRcdFNpenpsZS5maWx0ZXIoIHBhcnQsIGNoZWNrU2V0LCB0cnVlICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0XCJcIjogZnVuY3Rpb24oY2hlY2tTZXQsIHBhcnQsIGlzWE1MKXtcblx0XHRcdHZhciBub2RlQ2hlY2ssXG5cdFx0XHRcdGRvbmVOYW1lID0gZG9uZSsrLFxuXHRcdFx0XHRjaGVja0ZuID0gZGlyQ2hlY2s7XG5cblx0XHRcdGlmICggdHlwZW9mIHBhcnQgPT09IFwic3RyaW5nXCIgJiYgIXJOb25Xb3JkLnRlc3QoIHBhcnQgKSApIHtcblx0XHRcdFx0cGFydCA9IHBhcnQudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0bm9kZUNoZWNrID0gcGFydDtcblx0XHRcdFx0Y2hlY2tGbiA9IGRpck5vZGVDaGVjaztcblx0XHRcdH1cblxuXHRcdFx0Y2hlY2tGbiggXCJwYXJlbnROb2RlXCIsIHBhcnQsIGRvbmVOYW1lLCBjaGVja1NldCwgbm9kZUNoZWNrLCBpc1hNTCApO1xuXHRcdH0sXG5cblx0XHRcIn5cIjogZnVuY3Rpb24oIGNoZWNrU2V0LCBwYXJ0LCBpc1hNTCApIHtcblx0XHRcdHZhciBub2RlQ2hlY2ssXG5cdFx0XHRcdGRvbmVOYW1lID0gZG9uZSsrLFxuXHRcdFx0XHRjaGVja0ZuID0gZGlyQ2hlY2s7XG5cblx0XHRcdGlmICggdHlwZW9mIHBhcnQgPT09IFwic3RyaW5nXCIgJiYgIXJOb25Xb3JkLnRlc3QoIHBhcnQgKSApIHtcblx0XHRcdFx0cGFydCA9IHBhcnQudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0bm9kZUNoZWNrID0gcGFydDtcblx0XHRcdFx0Y2hlY2tGbiA9IGRpck5vZGVDaGVjaztcblx0XHRcdH1cblxuXHRcdFx0Y2hlY2tGbiggXCJwcmV2aW91c1NpYmxpbmdcIiwgcGFydCwgZG9uZU5hbWUsIGNoZWNrU2V0LCBub2RlQ2hlY2ssIGlzWE1MICk7XG5cdFx0fVxuXHR9LFxuXG5cdGZpbmQ6IHtcblx0XHRJRDogZnVuY3Rpb24oIG1hdGNoLCBjb250ZXh0LCBpc1hNTCApIHtcblx0XHRcdGlmICggdHlwZW9mIGNvbnRleHQuZ2V0RWxlbWVudEJ5SWQgIT09IFwidW5kZWZpbmVkXCIgJiYgIWlzWE1MICkge1xuXHRcdFx0XHR2YXIgbSA9IGNvbnRleHQuZ2V0RWxlbWVudEJ5SWQobWF0Y2hbMV0pO1xuXHRcdFx0XHQvLyBDaGVjayBwYXJlbnROb2RlIHRvIGNhdGNoIHdoZW4gQmxhY2tiZXJyeSA0LjYgcmV0dXJuc1xuXHRcdFx0XHQvLyBub2RlcyB0aGF0IGFyZSBubyBsb25nZXIgaW4gdGhlIGRvY3VtZW50ICM2OTYzXG5cdFx0XHRcdHJldHVybiBtICYmIG0ucGFyZW50Tm9kZSA/IFttXSA6IFtdO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHROQU1FOiBmdW5jdGlvbiggbWF0Y2gsIGNvbnRleHQgKSB7XG5cdFx0XHRpZiAoIHR5cGVvZiBjb250ZXh0LmdldEVsZW1lbnRzQnlOYW1lICE9PSBcInVuZGVmaW5lZFwiICkge1xuXHRcdFx0XHR2YXIgcmV0ID0gW10sXG5cdFx0XHRcdFx0cmVzdWx0cyA9IGNvbnRleHQuZ2V0RWxlbWVudHNCeU5hbWUoIG1hdGNoWzFdICk7XG5cblx0XHRcdFx0Zm9yICggdmFyIGkgPSAwLCBsID0gcmVzdWx0cy5sZW5ndGg7IGkgPCBsOyBpKysgKSB7XG5cdFx0XHRcdFx0aWYgKCByZXN1bHRzW2ldLmdldEF0dHJpYnV0ZShcIm5hbWVcIikgPT09IG1hdGNoWzFdICkge1xuXHRcdFx0XHRcdFx0cmV0LnB1c2goIHJlc3VsdHNbaV0gKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gcmV0Lmxlbmd0aCA9PT0gMCA/IG51bGwgOiByZXQ7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdFRBRzogZnVuY3Rpb24oIG1hdGNoLCBjb250ZXh0ICkge1xuXHRcdFx0aWYgKCB0eXBlb2YgY29udGV4dC5nZXRFbGVtZW50c0J5VGFnTmFtZSAhPT0gXCJ1bmRlZmluZWRcIiApIHtcblx0XHRcdFx0cmV0dXJuIGNvbnRleHQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoIG1hdGNoWzFdICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXHRwcmVGaWx0ZXI6IHtcblx0XHRDTEFTUzogZnVuY3Rpb24oIG1hdGNoLCBjdXJMb29wLCBpbnBsYWNlLCByZXN1bHQsIG5vdCwgaXNYTUwgKSB7XG5cdFx0XHRtYXRjaCA9IFwiIFwiICsgbWF0Y2hbMV0ucmVwbGFjZSggckJhY2tzbGFzaCwgXCJcIiApICsgXCIgXCI7XG5cblx0XHRcdGlmICggaXNYTUwgKSB7XG5cdFx0XHRcdHJldHVybiBtYXRjaDtcblx0XHRcdH1cblxuXHRcdFx0Zm9yICggdmFyIGkgPSAwLCBlbGVtOyAoZWxlbSA9IGN1ckxvb3BbaV0pICE9IG51bGw7IGkrKyApIHtcblx0XHRcdFx0aWYgKCBlbGVtICkge1xuXHRcdFx0XHRcdGlmICggbm90IF4gKGVsZW0uY2xhc3NOYW1lICYmIChcIiBcIiArIGVsZW0uY2xhc3NOYW1lICsgXCIgXCIpLnJlcGxhY2UoL1tcXHRcXG5cXHJdL2csIFwiIFwiKS5pbmRleE9mKG1hdGNoKSA+PSAwKSApIHtcblx0XHRcdFx0XHRcdGlmICggIWlucGxhY2UgKSB7XG5cdFx0XHRcdFx0XHRcdHJlc3VsdC5wdXNoKCBlbGVtICk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR9IGVsc2UgaWYgKCBpbnBsYWNlICkge1xuXHRcdFx0XHRcdFx0Y3VyTG9vcFtpXSA9IGZhbHNlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fSxcblxuXHRcdElEOiBmdW5jdGlvbiggbWF0Y2ggKSB7XG5cdFx0XHRyZXR1cm4gbWF0Y2hbMV0ucmVwbGFjZSggckJhY2tzbGFzaCwgXCJcIiApO1xuXHRcdH0sXG5cblx0XHRUQUc6IGZ1bmN0aW9uKCBtYXRjaCwgY3VyTG9vcCApIHtcblx0XHRcdHJldHVybiBtYXRjaFsxXS5yZXBsYWNlKCByQmFja3NsYXNoLCBcIlwiICkudG9Mb3dlckNhc2UoKTtcblx0XHR9LFxuXG5cdFx0Q0hJTEQ6IGZ1bmN0aW9uKCBtYXRjaCApIHtcblx0XHRcdGlmICggbWF0Y2hbMV0gPT09IFwibnRoXCIgKSB7XG5cdFx0XHRcdGlmICggIW1hdGNoWzJdICkge1xuXHRcdFx0XHRcdFNpenpsZS5lcnJvciggbWF0Y2hbMF0gKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdG1hdGNoWzJdID0gbWF0Y2hbMl0ucmVwbGFjZSgvXlxcK3xcXHMqL2csICcnKTtcblxuXHRcdFx0XHQvLyBwYXJzZSBlcXVhdGlvbnMgbGlrZSAnZXZlbicsICdvZGQnLCAnNScsICcybicsICczbisyJywgJzRuLTEnLCAnLW4rNidcblx0XHRcdFx0dmFyIHRlc3QgPSAvKC0/KShcXGQqKSg/Om4oWytcXC1dP1xcZCopKT8vLmV4ZWMoXG5cdFx0XHRcdFx0bWF0Y2hbMl0gPT09IFwiZXZlblwiICYmIFwiMm5cIiB8fCBtYXRjaFsyXSA9PT0gXCJvZGRcIiAmJiBcIjJuKzFcIiB8fFxuXHRcdFx0XHRcdCEvXFxELy50ZXN0KCBtYXRjaFsyXSApICYmIFwiMG4rXCIgKyBtYXRjaFsyXSB8fCBtYXRjaFsyXSk7XG5cblx0XHRcdFx0Ly8gY2FsY3VsYXRlIHRoZSBudW1iZXJzIChmaXJzdCluKyhsYXN0KSBpbmNsdWRpbmcgaWYgdGhleSBhcmUgbmVnYXRpdmVcblx0XHRcdFx0bWF0Y2hbMl0gPSAodGVzdFsxXSArICh0ZXN0WzJdIHx8IDEpKSAtIDA7XG5cdFx0XHRcdG1hdGNoWzNdID0gdGVzdFszXSAtIDA7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmICggbWF0Y2hbMl0gKSB7XG5cdFx0XHRcdFNpenpsZS5lcnJvciggbWF0Y2hbMF0gKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gVE9ETzogTW92ZSB0byBub3JtYWwgY2FjaGluZyBzeXN0ZW1cblx0XHRcdG1hdGNoWzBdID0gZG9uZSsrO1xuXG5cdFx0XHRyZXR1cm4gbWF0Y2g7XG5cdFx0fSxcblxuXHRcdEFUVFI6IGZ1bmN0aW9uKCBtYXRjaCwgY3VyTG9vcCwgaW5wbGFjZSwgcmVzdWx0LCBub3QsIGlzWE1MICkge1xuXHRcdFx0dmFyIG5hbWUgPSBtYXRjaFsxXSA9IG1hdGNoWzFdLnJlcGxhY2UoIHJCYWNrc2xhc2gsIFwiXCIgKTtcblxuXHRcdFx0aWYgKCAhaXNYTUwgJiYgRXhwci5hdHRyTWFwW25hbWVdICkge1xuXHRcdFx0XHRtYXRjaFsxXSA9IEV4cHIuYXR0ck1hcFtuYW1lXTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gSGFuZGxlIGlmIGFuIHVuLXF1b3RlZCB2YWx1ZSB3YXMgdXNlZFxuXHRcdFx0bWF0Y2hbNF0gPSAoIG1hdGNoWzRdIHx8IG1hdGNoWzVdIHx8IFwiXCIgKS5yZXBsYWNlKCByQmFja3NsYXNoLCBcIlwiICk7XG5cblx0XHRcdGlmICggbWF0Y2hbMl0gPT09IFwifj1cIiApIHtcblx0XHRcdFx0bWF0Y2hbNF0gPSBcIiBcIiArIG1hdGNoWzRdICsgXCIgXCI7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBtYXRjaDtcblx0XHR9LFxuXG5cdFx0UFNFVURPOiBmdW5jdGlvbiggbWF0Y2gsIGN1ckxvb3AsIGlucGxhY2UsIHJlc3VsdCwgbm90ICkge1xuXHRcdFx0aWYgKCBtYXRjaFsxXSA9PT0gXCJub3RcIiApIHtcblx0XHRcdFx0Ly8gSWYgd2UncmUgZGVhbGluZyB3aXRoIGEgY29tcGxleCBleHByZXNzaW9uLCBvciBhIHNpbXBsZSBvbmVcblx0XHRcdFx0aWYgKCAoIGNodW5rZXIuZXhlYyhtYXRjaFszXSkgfHwgXCJcIiApLmxlbmd0aCA+IDEgfHwgL15cXHcvLnRlc3QobWF0Y2hbM10pICkge1xuXHRcdFx0XHRcdG1hdGNoWzNdID0gU2l6emxlKG1hdGNoWzNdLCBudWxsLCBudWxsLCBjdXJMb29wKTtcblxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHZhciByZXQgPSBTaXp6bGUuZmlsdGVyKG1hdGNoWzNdLCBjdXJMb29wLCBpbnBsYWNlLCB0cnVlIF4gbm90KTtcblxuXHRcdFx0XHRcdGlmICggIWlucGxhY2UgKSB7XG5cdFx0XHRcdFx0XHRyZXN1bHQucHVzaC5hcHBseSggcmVzdWx0LCByZXQgKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSBlbHNlIGlmICggRXhwci5tYXRjaC5QT1MudGVzdCggbWF0Y2hbMF0gKSB8fCBFeHByLm1hdGNoLkNISUxELnRlc3QoIG1hdGNoWzBdICkgKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbWF0Y2g7XG5cdFx0fSxcblxuXHRcdFBPUzogZnVuY3Rpb24oIG1hdGNoICkge1xuXHRcdFx0bWF0Y2gudW5zaGlmdCggdHJ1ZSApO1xuXG5cdFx0XHRyZXR1cm4gbWF0Y2g7XG5cdFx0fVxuXHR9LFxuXG5cdGZpbHRlcnM6IHtcblx0XHRlbmFibGVkOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiBlbGVtLmRpc2FibGVkID09PSBmYWxzZSAmJiBlbGVtLnR5cGUgIT09IFwiaGlkZGVuXCI7XG5cdFx0fSxcblxuXHRcdGRpc2FibGVkOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiBlbGVtLmRpc2FibGVkID09PSB0cnVlO1xuXHRcdH0sXG5cblx0XHRjaGVja2VkOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiBlbGVtLmNoZWNrZWQgPT09IHRydWU7XG5cdFx0fSxcblxuXHRcdHNlbGVjdGVkOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdC8vIEFjY2Vzc2luZyB0aGlzIHByb3BlcnR5IG1ha2VzIHNlbGVjdGVkLWJ5LWRlZmF1bHRcblx0XHRcdC8vIG9wdGlvbnMgaW4gU2FmYXJpIHdvcmsgcHJvcGVybHlcblx0XHRcdGlmICggZWxlbS5wYXJlbnROb2RlICkge1xuXHRcdFx0XHRlbGVtLnBhcmVudE5vZGUuc2VsZWN0ZWRJbmRleDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGVsZW0uc2VsZWN0ZWQgPT09IHRydWU7XG5cdFx0fSxcblxuXHRcdHBhcmVudDogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gISFlbGVtLmZpcnN0Q2hpbGQ7XG5cdFx0fSxcblxuXHRcdGVtcHR5OiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiAhZWxlbS5maXJzdENoaWxkO1xuXHRcdH0sXG5cblx0XHRoYXM6IGZ1bmN0aW9uKCBlbGVtLCBpLCBtYXRjaCApIHtcblx0XHRcdHJldHVybiAhIVNpenpsZSggbWF0Y2hbM10sIGVsZW0gKS5sZW5ndGg7XG5cdFx0fSxcblxuXHRcdGhlYWRlcjogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gKC9oXFxkL2kpLnRlc3QoIGVsZW0ubm9kZU5hbWUgKTtcblx0XHR9LFxuXG5cdFx0dGV4dDogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHR2YXIgYXR0ciA9IGVsZW0uZ2V0QXR0cmlidXRlKCBcInR5cGVcIiApLCB0eXBlID0gZWxlbS50eXBlO1xuXHRcdFx0Ly8gSUU2IGFuZCA3IHdpbGwgbWFwIGVsZW0udHlwZSB0byAndGV4dCcgZm9yIG5ldyBIVE1MNSB0eXBlcyAoc2VhcmNoLCBldGMpXG5cdFx0XHQvLyB1c2UgZ2V0QXR0cmlidXRlIGluc3RlYWQgdG8gdGVzdCB0aGlzIGNhc2Vcblx0XHRcdHJldHVybiBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IFwiaW5wdXRcIiAmJiBcInRleHRcIiA9PT0gdHlwZSAmJiAoIGF0dHIgPT09IHR5cGUgfHwgYXR0ciA9PT0gbnVsbCApO1xuXHRcdH0sXG5cblx0XHRyYWRpbzogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSBcImlucHV0XCIgJiYgXCJyYWRpb1wiID09PSBlbGVtLnR5cGU7XG5cdFx0fSxcblxuXHRcdGNoZWNrYm94OiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IFwiaW5wdXRcIiAmJiBcImNoZWNrYm94XCIgPT09IGVsZW0udHlwZTtcblx0XHR9LFxuXG5cdFx0ZmlsZTogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSBcImlucHV0XCIgJiYgXCJmaWxlXCIgPT09IGVsZW0udHlwZTtcblx0XHR9LFxuXG5cdFx0cGFzc3dvcmQ6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0cmV0dXJuIGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gXCJpbnB1dFwiICYmIFwicGFzc3dvcmRcIiA9PT0gZWxlbS50eXBlO1xuXHRcdH0sXG5cblx0XHRzdWJtaXQ6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0dmFyIG5hbWUgPSBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRyZXR1cm4gKG5hbWUgPT09IFwiaW5wdXRcIiB8fCBuYW1lID09PSBcImJ1dHRvblwiKSAmJiBcInN1Ym1pdFwiID09PSBlbGVtLnR5cGU7XG5cdFx0fSxcblxuXHRcdGltYWdlOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IFwiaW5wdXRcIiAmJiBcImltYWdlXCIgPT09IGVsZW0udHlwZTtcblx0XHR9LFxuXG5cdFx0cmVzZXQ6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0dmFyIG5hbWUgPSBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRyZXR1cm4gKG5hbWUgPT09IFwiaW5wdXRcIiB8fCBuYW1lID09PSBcImJ1dHRvblwiKSAmJiBcInJlc2V0XCIgPT09IGVsZW0udHlwZTtcblx0XHR9LFxuXG5cdFx0YnV0dG9uOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHZhciBuYW1lID0gZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0cmV0dXJuIG5hbWUgPT09IFwiaW5wdXRcIiAmJiBcImJ1dHRvblwiID09PSBlbGVtLnR5cGUgfHwgbmFtZSA9PT0gXCJidXR0b25cIjtcblx0XHR9LFxuXG5cdFx0aW5wdXQ6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0cmV0dXJuICgvaW5wdXR8c2VsZWN0fHRleHRhcmVhfGJ1dHRvbi9pKS50ZXN0KCBlbGVtLm5vZGVOYW1lICk7XG5cdFx0fSxcblxuXHRcdGZvY3VzOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiBlbGVtID09PSBlbGVtLm93bmVyRG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcblx0XHR9XG5cdH0sXG5cdHNldEZpbHRlcnM6IHtcblx0XHRmaXJzdDogZnVuY3Rpb24oIGVsZW0sIGkgKSB7XG5cdFx0XHRyZXR1cm4gaSA9PT0gMDtcblx0XHR9LFxuXG5cdFx0bGFzdDogZnVuY3Rpb24oIGVsZW0sIGksIG1hdGNoLCBhcnJheSApIHtcblx0XHRcdHJldHVybiBpID09PSBhcnJheS5sZW5ndGggLSAxO1xuXHRcdH0sXG5cblx0XHRldmVuOiBmdW5jdGlvbiggZWxlbSwgaSApIHtcblx0XHRcdHJldHVybiBpICUgMiA9PT0gMDtcblx0XHR9LFxuXG5cdFx0b2RkOiBmdW5jdGlvbiggZWxlbSwgaSApIHtcblx0XHRcdHJldHVybiBpICUgMiA9PT0gMTtcblx0XHR9LFxuXG5cdFx0bHQ6IGZ1bmN0aW9uKCBlbGVtLCBpLCBtYXRjaCApIHtcblx0XHRcdHJldHVybiBpIDwgbWF0Y2hbM10gLSAwO1xuXHRcdH0sXG5cblx0XHRndDogZnVuY3Rpb24oIGVsZW0sIGksIG1hdGNoICkge1xuXHRcdFx0cmV0dXJuIGkgPiBtYXRjaFszXSAtIDA7XG5cdFx0fSxcblxuXHRcdG50aDogZnVuY3Rpb24oIGVsZW0sIGksIG1hdGNoICkge1xuXHRcdFx0cmV0dXJuIG1hdGNoWzNdIC0gMCA9PT0gaTtcblx0XHR9LFxuXG5cdFx0ZXE6IGZ1bmN0aW9uKCBlbGVtLCBpLCBtYXRjaCApIHtcblx0XHRcdHJldHVybiBtYXRjaFszXSAtIDAgPT09IGk7XG5cdFx0fVxuXHR9LFxuXHRmaWx0ZXI6IHtcblx0XHRQU0VVRE86IGZ1bmN0aW9uKCBlbGVtLCBtYXRjaCwgaSwgYXJyYXkgKSB7XG5cdFx0XHR2YXIgbmFtZSA9IG1hdGNoWzFdLFxuXHRcdFx0XHRmaWx0ZXIgPSBFeHByLmZpbHRlcnNbIG5hbWUgXTtcblxuXHRcdFx0aWYgKCBmaWx0ZXIgKSB7XG5cdFx0XHRcdHJldHVybiBmaWx0ZXIoIGVsZW0sIGksIG1hdGNoLCBhcnJheSApO1xuXG5cdFx0XHR9IGVsc2UgaWYgKCBuYW1lID09PSBcImNvbnRhaW5zXCIgKSB7XG5cdFx0XHRcdHJldHVybiAoZWxlbS50ZXh0Q29udGVudCB8fCBlbGVtLmlubmVyVGV4dCB8fCBnZXRUZXh0KFsgZWxlbSBdKSB8fCBcIlwiKS5pbmRleE9mKG1hdGNoWzNdKSA+PSAwO1xuXG5cdFx0XHR9IGVsc2UgaWYgKCBuYW1lID09PSBcIm5vdFwiICkge1xuXHRcdFx0XHR2YXIgbm90ID0gbWF0Y2hbM107XG5cblx0XHRcdFx0Zm9yICggdmFyIGogPSAwLCBsID0gbm90Lmxlbmd0aDsgaiA8IGw7IGorKyApIHtcblx0XHRcdFx0XHRpZiAoIG5vdFtqXSA9PT0gZWxlbSApIHtcblx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0U2l6emxlLmVycm9yKCBuYW1lICk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdENISUxEOiBmdW5jdGlvbiggZWxlbSwgbWF0Y2ggKSB7XG5cdFx0XHR2YXIgZmlyc3QsIGxhc3QsXG5cdFx0XHRcdGRvbmVOYW1lLCBwYXJlbnQsIGNhY2hlLFxuXHRcdFx0XHRjb3VudCwgZGlmZixcblx0XHRcdFx0dHlwZSA9IG1hdGNoWzFdLFxuXHRcdFx0XHRub2RlID0gZWxlbTtcblxuXHRcdFx0c3dpdGNoICggdHlwZSApIHtcblx0XHRcdFx0Y2FzZSBcIm9ubHlcIjpcblx0XHRcdFx0Y2FzZSBcImZpcnN0XCI6XG5cdFx0XHRcdFx0d2hpbGUgKCAobm9kZSA9IG5vZGUucHJldmlvdXNTaWJsaW5nKSApIHtcblx0XHRcdFx0XHRcdGlmICggbm9kZS5ub2RlVHlwZSA9PT0gMSApIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmICggdHlwZSA9PT0gXCJmaXJzdFwiICkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bm9kZSA9IGVsZW07XG5cblx0XHRcdFx0XHQvKiBmYWxscyB0aHJvdWdoICovXG5cdFx0XHRcdGNhc2UgXCJsYXN0XCI6XG5cdFx0XHRcdFx0d2hpbGUgKCAobm9kZSA9IG5vZGUubmV4dFNpYmxpbmcpICkge1xuXHRcdFx0XHRcdFx0aWYgKCBub2RlLm5vZGVUeXBlID09PSAxICkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cblx0XHRcdFx0Y2FzZSBcIm50aFwiOlxuXHRcdFx0XHRcdGZpcnN0ID0gbWF0Y2hbMl07XG5cdFx0XHRcdFx0bGFzdCA9IG1hdGNoWzNdO1xuXG5cdFx0XHRcdFx0aWYgKCBmaXJzdCA9PT0gMSAmJiBsYXN0ID09PSAwICkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0ZG9uZU5hbWUgPSBtYXRjaFswXTtcblx0XHRcdFx0XHRwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGU7XG5cblx0XHRcdFx0XHRpZiAoIHBhcmVudCAmJiAocGFyZW50WyBleHBhbmRvIF0gIT09IGRvbmVOYW1lIHx8ICFlbGVtLm5vZGVJbmRleCkgKSB7XG5cdFx0XHRcdFx0XHRjb3VudCA9IDA7XG5cblx0XHRcdFx0XHRcdGZvciAoIG5vZGUgPSBwYXJlbnQuZmlyc3RDaGlsZDsgbm9kZTsgbm9kZSA9IG5vZGUubmV4dFNpYmxpbmcgKSB7XG5cdFx0XHRcdFx0XHRcdGlmICggbm9kZS5ub2RlVHlwZSA9PT0gMSApIHtcblx0XHRcdFx0XHRcdFx0XHRub2RlLm5vZGVJbmRleCA9ICsrY291bnQ7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0cGFyZW50WyBleHBhbmRvIF0gPSBkb25lTmFtZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRkaWZmID0gZWxlbS5ub2RlSW5kZXggLSBsYXN0O1xuXG5cdFx0XHRcdFx0aWYgKCBmaXJzdCA9PT0gMCApIHtcblx0XHRcdFx0XHRcdHJldHVybiBkaWZmID09PSAwO1xuXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJldHVybiAoIGRpZmYgJSBmaXJzdCA9PT0gMCAmJiBkaWZmIC8gZmlyc3QgPj0gMCApO1xuXHRcdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0SUQ6IGZ1bmN0aW9uKCBlbGVtLCBtYXRjaCApIHtcblx0XHRcdHJldHVybiBlbGVtLm5vZGVUeXBlID09PSAxICYmIGVsZW0uZ2V0QXR0cmlidXRlKFwiaWRcIikgPT09IG1hdGNoO1xuXHRcdH0sXG5cblx0XHRUQUc6IGZ1bmN0aW9uKCBlbGVtLCBtYXRjaCApIHtcblx0XHRcdHJldHVybiAobWF0Y2ggPT09IFwiKlwiICYmIGVsZW0ubm9kZVR5cGUgPT09IDEpIHx8ICEhZWxlbS5ub2RlTmFtZSAmJiBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IG1hdGNoO1xuXHRcdH0sXG5cblx0XHRDTEFTUzogZnVuY3Rpb24oIGVsZW0sIG1hdGNoICkge1xuXHRcdFx0cmV0dXJuIChcIiBcIiArIChlbGVtLmNsYXNzTmFtZSB8fCBlbGVtLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpKSArIFwiIFwiKVxuXHRcdFx0XHQuaW5kZXhPZiggbWF0Y2ggKSA+IC0xO1xuXHRcdH0sXG5cblx0XHRBVFRSOiBmdW5jdGlvbiggZWxlbSwgbWF0Y2ggKSB7XG5cdFx0XHR2YXIgbmFtZSA9IG1hdGNoWzFdLFxuXHRcdFx0XHRyZXN1bHQgPSBTaXp6bGUuYXR0ciA/XG5cdFx0XHRcdFx0U2l6emxlLmF0dHIoIGVsZW0sIG5hbWUgKSA6XG5cdFx0XHRcdFx0RXhwci5hdHRySGFuZGxlWyBuYW1lIF0gP1xuXHRcdFx0XHRcdEV4cHIuYXR0ckhhbmRsZVsgbmFtZSBdKCBlbGVtICkgOlxuXHRcdFx0XHRcdGVsZW1bIG5hbWUgXSAhPSBudWxsID9cblx0XHRcdFx0XHRcdGVsZW1bIG5hbWUgXSA6XG5cdFx0XHRcdFx0XHRlbGVtLmdldEF0dHJpYnV0ZSggbmFtZSApLFxuXHRcdFx0XHR2YWx1ZSA9IHJlc3VsdCArIFwiXCIsXG5cdFx0XHRcdHR5cGUgPSBtYXRjaFsyXSxcblx0XHRcdFx0Y2hlY2sgPSBtYXRjaFs0XTtcblxuXHRcdFx0cmV0dXJuIHJlc3VsdCA9PSBudWxsID9cblx0XHRcdFx0dHlwZSA9PT0gXCIhPVwiIDpcblx0XHRcdFx0IXR5cGUgJiYgU2l6emxlLmF0dHIgP1xuXHRcdFx0XHRyZXN1bHQgIT0gbnVsbCA6XG5cdFx0XHRcdHR5cGUgPT09IFwiPVwiID9cblx0XHRcdFx0dmFsdWUgPT09IGNoZWNrIDpcblx0XHRcdFx0dHlwZSA9PT0gXCIqPVwiID9cblx0XHRcdFx0dmFsdWUuaW5kZXhPZihjaGVjaykgPj0gMCA6XG5cdFx0XHRcdHR5cGUgPT09IFwifj1cIiA/XG5cdFx0XHRcdChcIiBcIiArIHZhbHVlICsgXCIgXCIpLmluZGV4T2YoY2hlY2spID49IDAgOlxuXHRcdFx0XHQhY2hlY2sgP1xuXHRcdFx0XHR2YWx1ZSAmJiByZXN1bHQgIT09IGZhbHNlIDpcblx0XHRcdFx0dHlwZSA9PT0gXCIhPVwiID9cblx0XHRcdFx0dmFsdWUgIT09IGNoZWNrIDpcblx0XHRcdFx0dHlwZSA9PT0gXCJePVwiID9cblx0XHRcdFx0dmFsdWUuaW5kZXhPZihjaGVjaykgPT09IDAgOlxuXHRcdFx0XHR0eXBlID09PSBcIiQ9XCIgP1xuXHRcdFx0XHR2YWx1ZS5zdWJzdHIodmFsdWUubGVuZ3RoIC0gY2hlY2subGVuZ3RoKSA9PT0gY2hlY2sgOlxuXHRcdFx0XHR0eXBlID09PSBcInw9XCIgP1xuXHRcdFx0XHR2YWx1ZSA9PT0gY2hlY2sgfHwgdmFsdWUuc3Vic3RyKDAsIGNoZWNrLmxlbmd0aCArIDEpID09PSBjaGVjayArIFwiLVwiIDpcblx0XHRcdFx0ZmFsc2U7XG5cdFx0fSxcblxuXHRcdFBPUzogZnVuY3Rpb24oIGVsZW0sIG1hdGNoLCBpLCBhcnJheSApIHtcblx0XHRcdHZhciBuYW1lID0gbWF0Y2hbMl0sXG5cdFx0XHRcdGZpbHRlciA9IEV4cHIuc2V0RmlsdGVyc1sgbmFtZSBdO1xuXG5cdFx0XHRpZiAoIGZpbHRlciApIHtcblx0XHRcdFx0cmV0dXJuIGZpbHRlciggZWxlbSwgaSwgbWF0Y2gsIGFycmF5ICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59O1xuXG52YXIgb3JpZ1BPUyA9IEV4cHIubWF0Y2guUE9TLFxuXHRmZXNjYXBlID0gZnVuY3Rpb24oYWxsLCBudW0pe1xuXHRcdHJldHVybiBcIlxcXFxcIiArIChudW0gLSAwICsgMSk7XG5cdH07XG5cbmZvciAoIHZhciB0eXBlIGluIEV4cHIubWF0Y2ggKSB7XG5cdEV4cHIubWF0Y2hbIHR5cGUgXSA9IG5ldyBSZWdFeHAoIEV4cHIubWF0Y2hbIHR5cGUgXS5zb3VyY2UgKyAoLyg/IVteXFxbXSpcXF0pKD8hW15cXChdKlxcKSkvLnNvdXJjZSkgKTtcblx0RXhwci5sZWZ0TWF0Y2hbIHR5cGUgXSA9IG5ldyBSZWdFeHAoIC8oXig/Oi58XFxyfFxcbikqPykvLnNvdXJjZSArIEV4cHIubWF0Y2hbIHR5cGUgXS5zb3VyY2UucmVwbGFjZSgvXFxcXChcXGQrKS9nLCBmZXNjYXBlKSApO1xufVxuLy8gRXhwb3NlIG9yaWdQT1Ncbi8vIFwiZ2xvYmFsXCIgYXMgaW4gcmVnYXJkbGVzcyBvZiByZWxhdGlvbiB0byBicmFja2V0cy9wYXJlbnNcbkV4cHIubWF0Y2guZ2xvYmFsUE9TID0gb3JpZ1BPUztcblxudmFyIG1ha2VBcnJheSA9IGZ1bmN0aW9uKCBhcnJheSwgcmVzdWx0cyApIHtcblx0YXJyYXkgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCggYXJyYXksIDAgKTtcblxuXHRpZiAoIHJlc3VsdHMgKSB7XG5cdFx0cmVzdWx0cy5wdXNoLmFwcGx5KCByZXN1bHRzLCBhcnJheSApO1xuXHRcdHJldHVybiByZXN1bHRzO1xuXHR9XG5cblx0cmV0dXJuIGFycmF5O1xufTtcblxuLy8gUGVyZm9ybSBhIHNpbXBsZSBjaGVjayB0byBkZXRlcm1pbmUgaWYgdGhlIGJyb3dzZXIgaXMgY2FwYWJsZSBvZlxuLy8gY29udmVydGluZyBhIE5vZGVMaXN0IHRvIGFuIGFycmF5IHVzaW5nIGJ1aWx0aW4gbWV0aG9kcy5cbi8vIEFsc28gdmVyaWZpZXMgdGhhdCB0aGUgcmV0dXJuZWQgYXJyYXkgaG9sZHMgRE9NIG5vZGVzXG4vLyAod2hpY2ggaXMgbm90IHRoZSBjYXNlIGluIHRoZSBCbGFja2JlcnJ5IGJyb3dzZXIpXG50cnkge1xuXHRBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCggZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNoaWxkTm9kZXMsIDAgKVswXS5ub2RlVHlwZTtcblxuLy8gUHJvdmlkZSBhIGZhbGxiYWNrIG1ldGhvZCBpZiBpdCBkb2VzIG5vdCB3b3JrXG59IGNhdGNoKCBlICkge1xuXHRtYWtlQXJyYXkgPSBmdW5jdGlvbiggYXJyYXksIHJlc3VsdHMgKSB7XG5cdFx0dmFyIGkgPSAwLFxuXHRcdFx0cmV0ID0gcmVzdWx0cyB8fCBbXTtcblxuXHRcdGlmICggdG9TdHJpbmcuY2FsbChhcnJheSkgPT09IFwiW29iamVjdCBBcnJheV1cIiApIHtcblx0XHRcdEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KCByZXQsIGFycmF5ICk7XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKCB0eXBlb2YgYXJyYXkubGVuZ3RoID09PSBcIm51bWJlclwiICkge1xuXHRcdFx0XHRmb3IgKCB2YXIgbCA9IGFycmF5Lmxlbmd0aDsgaSA8IGw7IGkrKyApIHtcblx0XHRcdFx0XHRyZXQucHVzaCggYXJyYXlbaV0gKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmb3IgKCA7IGFycmF5W2ldOyBpKysgKSB7XG5cdFx0XHRcdFx0cmV0LnB1c2goIGFycmF5W2ldICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gcmV0O1xuXHR9O1xufVxuXG52YXIgc29ydE9yZGVyLCBzaWJsaW5nQ2hlY2s7XG5cbmlmICggZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uICkge1xuXHRzb3J0T3JkZXIgPSBmdW5jdGlvbiggYSwgYiApIHtcblx0XHRpZiAoIGEgPT09IGIgKSB7XG5cdFx0XHRoYXNEdXBsaWNhdGUgPSB0cnVlO1xuXHRcdFx0cmV0dXJuIDA7XG5cdFx0fVxuXG5cdFx0aWYgKCAhYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiB8fCAhYi5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiApIHtcblx0XHRcdHJldHVybiBhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uID8gLTEgOiAxO1xuXHRcdH1cblxuXHRcdHJldHVybiBhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKGIpICYgNCA/IC0xIDogMTtcblx0fTtcblxufSBlbHNlIHtcblx0c29ydE9yZGVyID0gZnVuY3Rpb24oIGEsIGIgKSB7XG5cdFx0Ly8gVGhlIG5vZGVzIGFyZSBpZGVudGljYWwsIHdlIGNhbiBleGl0IGVhcmx5XG5cdFx0aWYgKCBhID09PSBiICkge1xuXHRcdFx0aGFzRHVwbGljYXRlID0gdHJ1ZTtcblx0XHRcdHJldHVybiAwO1xuXG5cdFx0Ly8gRmFsbGJhY2sgdG8gdXNpbmcgc291cmNlSW5kZXggKGluIElFKSBpZiBpdCdzIGF2YWlsYWJsZSBvbiBib3RoIG5vZGVzXG5cdFx0fSBlbHNlIGlmICggYS5zb3VyY2VJbmRleCAmJiBiLnNvdXJjZUluZGV4ICkge1xuXHRcdFx0cmV0dXJuIGEuc291cmNlSW5kZXggLSBiLnNvdXJjZUluZGV4O1xuXHRcdH1cblxuXHRcdHZhciBhbCwgYmwsXG5cdFx0XHRhcCA9IFtdLFxuXHRcdFx0YnAgPSBbXSxcblx0XHRcdGF1cCA9IGEucGFyZW50Tm9kZSxcblx0XHRcdGJ1cCA9IGIucGFyZW50Tm9kZSxcblx0XHRcdGN1ciA9IGF1cDtcblxuXHRcdC8vIElmIHRoZSBub2RlcyBhcmUgc2libGluZ3MgKG9yIGlkZW50aWNhbCkgd2UgY2FuIGRvIGEgcXVpY2sgY2hlY2tcblx0XHRpZiAoIGF1cCA9PT0gYnVwICkge1xuXHRcdFx0cmV0dXJuIHNpYmxpbmdDaGVjayggYSwgYiApO1xuXG5cdFx0Ly8gSWYgbm8gcGFyZW50cyB3ZXJlIGZvdW5kIHRoZW4gdGhlIG5vZGVzIGFyZSBkaXNjb25uZWN0ZWRcblx0XHR9IGVsc2UgaWYgKCAhYXVwICkge1xuXHRcdFx0cmV0dXJuIC0xO1xuXG5cdFx0fSBlbHNlIGlmICggIWJ1cCApIHtcblx0XHRcdHJldHVybiAxO1xuXHRcdH1cblxuXHRcdC8vIE90aGVyd2lzZSB0aGV5J3JlIHNvbWV3aGVyZSBlbHNlIGluIHRoZSB0cmVlIHNvIHdlIG5lZWRcblx0XHQvLyB0byBidWlsZCB1cCBhIGZ1bGwgbGlzdCBvZiB0aGUgcGFyZW50Tm9kZXMgZm9yIGNvbXBhcmlzb25cblx0XHR3aGlsZSAoIGN1ciApIHtcblx0XHRcdGFwLnVuc2hpZnQoIGN1ciApO1xuXHRcdFx0Y3VyID0gY3VyLnBhcmVudE5vZGU7XG5cdFx0fVxuXG5cdFx0Y3VyID0gYnVwO1xuXG5cdFx0d2hpbGUgKCBjdXIgKSB7XG5cdFx0XHRicC51bnNoaWZ0KCBjdXIgKTtcblx0XHRcdGN1ciA9IGN1ci5wYXJlbnROb2RlO1xuXHRcdH1cblxuXHRcdGFsID0gYXAubGVuZ3RoO1xuXHRcdGJsID0gYnAubGVuZ3RoO1xuXG5cdFx0Ly8gU3RhcnQgd2Fsa2luZyBkb3duIHRoZSB0cmVlIGxvb2tpbmcgZm9yIGEgZGlzY3JlcGFuY3lcblx0XHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBhbCAmJiBpIDwgYmw7IGkrKyApIHtcblx0XHRcdGlmICggYXBbaV0gIT09IGJwW2ldICkge1xuXHRcdFx0XHRyZXR1cm4gc2libGluZ0NoZWNrKCBhcFtpXSwgYnBbaV0gKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBXZSBlbmRlZCBzb21lcGxhY2UgdXAgdGhlIHRyZWUgc28gZG8gYSBzaWJsaW5nIGNoZWNrXG5cdFx0cmV0dXJuIGkgPT09IGFsID9cblx0XHRcdHNpYmxpbmdDaGVjayggYSwgYnBbaV0sIC0xICkgOlxuXHRcdFx0c2libGluZ0NoZWNrKCBhcFtpXSwgYiwgMSApO1xuXHR9O1xuXG5cdHNpYmxpbmdDaGVjayA9IGZ1bmN0aW9uKCBhLCBiLCByZXQgKSB7XG5cdFx0aWYgKCBhID09PSBiICkge1xuXHRcdFx0cmV0dXJuIHJldDtcblx0XHR9XG5cblx0XHR2YXIgY3VyID0gYS5uZXh0U2libGluZztcblxuXHRcdHdoaWxlICggY3VyICkge1xuXHRcdFx0aWYgKCBjdXIgPT09IGIgKSB7XG5cdFx0XHRcdHJldHVybiAtMTtcblx0XHRcdH1cblxuXHRcdFx0Y3VyID0gY3VyLm5leHRTaWJsaW5nO1xuXHRcdH1cblxuXHRcdHJldHVybiAxO1xuXHR9O1xufVxuXG4vLyBDaGVjayB0byBzZWUgaWYgdGhlIGJyb3dzZXIgcmV0dXJucyBlbGVtZW50cyBieSBuYW1lIHdoZW5cbi8vIHF1ZXJ5aW5nIGJ5IGdldEVsZW1lbnRCeUlkIChhbmQgcHJvdmlkZSBhIHdvcmthcm91bmQpXG4oZnVuY3Rpb24oKXtcblx0Ly8gV2UncmUgZ29pbmcgdG8gaW5qZWN0IGEgZmFrZSBpbnB1dCBlbGVtZW50IHdpdGggYSBzcGVjaWZpZWQgbmFtZVxuXHR2YXIgZm9ybSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksXG5cdFx0aWQgPSBcInNjcmlwdFwiICsgKG5ldyBEYXRlKCkpLmdldFRpbWUoKSxcblx0XHRyb290ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXG5cdGZvcm0uaW5uZXJIVE1MID0gXCI8YSBuYW1lPSdcIiArIGlkICsgXCInLz5cIjtcblxuXHQvLyBJbmplY3QgaXQgaW50byB0aGUgcm9vdCBlbGVtZW50LCBjaGVjayBpdHMgc3RhdHVzLCBhbmQgcmVtb3ZlIGl0IHF1aWNrbHlcblx0cm9vdC5pbnNlcnRCZWZvcmUoIGZvcm0sIHJvb3QuZmlyc3RDaGlsZCApO1xuXG5cdC8vIFRoZSB3b3JrYXJvdW5kIGhhcyB0byBkbyBhZGRpdGlvbmFsIGNoZWNrcyBhZnRlciBhIGdldEVsZW1lbnRCeUlkXG5cdC8vIFdoaWNoIHNsb3dzIHRoaW5ncyBkb3duIGZvciBvdGhlciBicm93c2VycyAoaGVuY2UgdGhlIGJyYW5jaGluZylcblx0aWYgKCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggaWQgKSApIHtcblx0XHRFeHByLmZpbmQuSUQgPSBmdW5jdGlvbiggbWF0Y2gsIGNvbnRleHQsIGlzWE1MICkge1xuXHRcdFx0aWYgKCB0eXBlb2YgY29udGV4dC5nZXRFbGVtZW50QnlJZCAhPT0gXCJ1bmRlZmluZWRcIiAmJiAhaXNYTUwgKSB7XG5cdFx0XHRcdHZhciBtID0gY29udGV4dC5nZXRFbGVtZW50QnlJZChtYXRjaFsxXSk7XG5cblx0XHRcdFx0cmV0dXJuIG0gP1xuXHRcdFx0XHRcdG0uaWQgPT09IG1hdGNoWzFdIHx8IHR5cGVvZiBtLmdldEF0dHJpYnV0ZU5vZGUgIT09IFwidW5kZWZpbmVkXCIgJiYgbS5nZXRBdHRyaWJ1dGVOb2RlKFwiaWRcIikubm9kZVZhbHVlID09PSBtYXRjaFsxXSA/XG5cdFx0XHRcdFx0XHRbbV0gOlxuXHRcdFx0XHRcdFx0dW5kZWZpbmVkIDpcblx0XHRcdFx0XHRbXTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0RXhwci5maWx0ZXIuSUQgPSBmdW5jdGlvbiggZWxlbSwgbWF0Y2ggKSB7XG5cdFx0XHR2YXIgbm9kZSA9IHR5cGVvZiBlbGVtLmdldEF0dHJpYnV0ZU5vZGUgIT09IFwidW5kZWZpbmVkXCIgJiYgZWxlbS5nZXRBdHRyaWJ1dGVOb2RlKFwiaWRcIik7XG5cblx0XHRcdHJldHVybiBlbGVtLm5vZGVUeXBlID09PSAxICYmIG5vZGUgJiYgbm9kZS5ub2RlVmFsdWUgPT09IG1hdGNoO1xuXHRcdH07XG5cdH1cblxuXHRyb290LnJlbW92ZUNoaWxkKCBmb3JtICk7XG5cblx0Ly8gcmVsZWFzZSBtZW1vcnkgaW4gSUVcblx0cm9vdCA9IGZvcm0gPSBudWxsO1xufSkoKTtcblxuKGZ1bmN0aW9uKCl7XG5cdC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgYnJvd3NlciByZXR1cm5zIG9ubHkgZWxlbWVudHNcblx0Ly8gd2hlbiBkb2luZyBnZXRFbGVtZW50c0J5VGFnTmFtZShcIipcIilcblxuXHQvLyBDcmVhdGUgYSBmYWtlIGVsZW1lbnRcblx0dmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdGRpdi5hcHBlbmRDaGlsZCggZG9jdW1lbnQuY3JlYXRlQ29tbWVudChcIlwiKSApO1xuXG5cdC8vIE1ha2Ugc3VyZSBubyBjb21tZW50cyBhcmUgZm91bmRcblx0aWYgKCBkaXYuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCIqXCIpLmxlbmd0aCA+IDAgKSB7XG5cdFx0RXhwci5maW5kLlRBRyA9IGZ1bmN0aW9uKCBtYXRjaCwgY29udGV4dCApIHtcblx0XHRcdHZhciByZXN1bHRzID0gY29udGV4dC5nZXRFbGVtZW50c0J5VGFnTmFtZSggbWF0Y2hbMV0gKTtcblxuXHRcdFx0Ly8gRmlsdGVyIG91dCBwb3NzaWJsZSBjb21tZW50c1xuXHRcdFx0aWYgKCBtYXRjaFsxXSA9PT0gXCIqXCIgKSB7XG5cdFx0XHRcdHZhciB0bXAgPSBbXTtcblxuXHRcdFx0XHRmb3IgKCB2YXIgaSA9IDA7IHJlc3VsdHNbaV07IGkrKyApIHtcblx0XHRcdFx0XHRpZiAoIHJlc3VsdHNbaV0ubm9kZVR5cGUgPT09IDEgKSB7XG5cdFx0XHRcdFx0XHR0bXAucHVzaCggcmVzdWx0c1tpXSApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJlc3VsdHMgPSB0bXA7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiByZXN1bHRzO1xuXHRcdH07XG5cdH1cblxuXHQvLyBDaGVjayB0byBzZWUgaWYgYW4gYXR0cmlidXRlIHJldHVybnMgbm9ybWFsaXplZCBocmVmIGF0dHJpYnV0ZXNcblx0ZGl2LmlubmVySFRNTCA9IFwiPGEgaHJlZj0nIyc+PC9hPlwiO1xuXG5cdGlmICggZGl2LmZpcnN0Q2hpbGQgJiYgdHlwZW9mIGRpdi5maXJzdENoaWxkLmdldEF0dHJpYnV0ZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuXHRcdFx0ZGl2LmZpcnN0Q2hpbGQuZ2V0QXR0cmlidXRlKFwiaHJlZlwiKSAhPT0gXCIjXCIgKSB7XG5cblx0XHRFeHByLmF0dHJIYW5kbGUuaHJlZiA9IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0cmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKCBcImhyZWZcIiwgMiApO1xuXHRcdH07XG5cdH1cblxuXHQvLyByZWxlYXNlIG1lbW9yeSBpbiBJRVxuXHRkaXYgPSBudWxsO1xufSkoKTtcblxuaWYgKCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsICkge1xuXHQoZnVuY3Rpb24oKXtcblx0XHR2YXIgb2xkU2l6emxlID0gU2l6emxlLFxuXHRcdFx0ZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSxcblx0XHRcdGlkID0gXCJfX3NpenpsZV9fXCI7XG5cblx0XHRkaXYuaW5uZXJIVE1MID0gXCI8cCBjbGFzcz0nVEVTVCc+PC9wPlwiO1xuXG5cdFx0Ly8gU2FmYXJpIGNhbid0IGhhbmRsZSB1cHBlcmNhc2Ugb3IgdW5pY29kZSBjaGFyYWN0ZXJzIHdoZW5cblx0XHQvLyBpbiBxdWlya3MgbW9kZS5cblx0XHRpZiAoIGRpdi5xdWVyeVNlbGVjdG9yQWxsICYmIGRpdi5xdWVyeVNlbGVjdG9yQWxsKFwiLlRFU1RcIikubGVuZ3RoID09PSAwICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdFNpenpsZSA9IGZ1bmN0aW9uKCBxdWVyeSwgY29udGV4dCwgZXh0cmEsIHNlZWQgKSB7XG5cdFx0XHRjb250ZXh0ID0gY29udGV4dCB8fCBkb2N1bWVudDtcblxuXHRcdFx0Ly8gT25seSB1c2UgcXVlcnlTZWxlY3RvckFsbCBvbiBub24tWE1MIGRvY3VtZW50c1xuXHRcdFx0Ly8gKElEIHNlbGVjdG9ycyBkb24ndCB3b3JrIGluIG5vbi1IVE1MIGRvY3VtZW50cylcblx0XHRcdGlmICggIXNlZWQgJiYgIVNpenpsZS5pc1hNTChjb250ZXh0KSApIHtcblx0XHRcdFx0Ly8gU2VlIGlmIHdlIGZpbmQgYSBzZWxlY3RvciB0byBzcGVlZCB1cFxuXHRcdFx0XHR2YXIgbWF0Y2ggPSAvXihcXHcrJCl8XlxcLihbXFx3XFwtXSskKXxeIyhbXFx3XFwtXSskKS8uZXhlYyggcXVlcnkgKTtcblxuXHRcdFx0XHRpZiAoIG1hdGNoICYmIChjb250ZXh0Lm5vZGVUeXBlID09PSAxIHx8IGNvbnRleHQubm9kZVR5cGUgPT09IDkpICkge1xuXHRcdFx0XHRcdC8vIFNwZWVkLXVwOiBTaXp6bGUoXCJUQUdcIilcblx0XHRcdFx0XHRpZiAoIG1hdGNoWzFdICkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIG1ha2VBcnJheSggY29udGV4dC5nZXRFbGVtZW50c0J5VGFnTmFtZSggcXVlcnkgKSwgZXh0cmEgKTtcblxuXHRcdFx0XHRcdC8vIFNwZWVkLXVwOiBTaXp6bGUoXCIuQ0xBU1NcIilcblx0XHRcdFx0XHR9IGVsc2UgaWYgKCBtYXRjaFsyXSAmJiBFeHByLmZpbmQuQ0xBU1MgJiYgY29udGV4dC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lICkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIG1ha2VBcnJheSggY29udGV4dC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCBtYXRjaFsyXSApLCBleHRyYSApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICggY29udGV4dC5ub2RlVHlwZSA9PT0gOSApIHtcblx0XHRcdFx0XHQvLyBTcGVlZC11cDogU2l6emxlKFwiYm9keVwiKVxuXHRcdFx0XHRcdC8vIFRoZSBib2R5IGVsZW1lbnQgb25seSBleGlzdHMgb25jZSwgb3B0aW1pemUgZmluZGluZyBpdFxuXHRcdFx0XHRcdGlmICggcXVlcnkgPT09IFwiYm9keVwiICYmIGNvbnRleHQuYm9keSApIHtcblx0XHRcdFx0XHRcdHJldHVybiBtYWtlQXJyYXkoIFsgY29udGV4dC5ib2R5IF0sIGV4dHJhICk7XG5cblx0XHRcdFx0XHQvLyBTcGVlZC11cDogU2l6emxlKFwiI0lEXCIpXG5cdFx0XHRcdFx0fSBlbHNlIGlmICggbWF0Y2ggJiYgbWF0Y2hbM10gKSB7XG5cdFx0XHRcdFx0XHR2YXIgZWxlbSA9IGNvbnRleHQuZ2V0RWxlbWVudEJ5SWQoIG1hdGNoWzNdICk7XG5cblx0XHRcdFx0XHRcdC8vIENoZWNrIHBhcmVudE5vZGUgdG8gY2F0Y2ggd2hlbiBCbGFja2JlcnJ5IDQuNiByZXR1cm5zXG5cdFx0XHRcdFx0XHQvLyBub2RlcyB0aGF0IGFyZSBubyBsb25nZXIgaW4gdGhlIGRvY3VtZW50ICM2OTYzXG5cdFx0XHRcdFx0XHRpZiAoIGVsZW0gJiYgZWxlbS5wYXJlbnROb2RlICkge1xuXHRcdFx0XHRcdFx0XHQvLyBIYW5kbGUgdGhlIGNhc2Ugd2hlcmUgSUUgYW5kIE9wZXJhIHJldHVybiBpdGVtc1xuXHRcdFx0XHRcdFx0XHQvLyBieSBuYW1lIGluc3RlYWQgb2YgSURcblx0XHRcdFx0XHRcdFx0aWYgKCBlbGVtLmlkID09PSBtYXRjaFszXSApIHtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbWFrZUFycmF5KCBbIGVsZW0gXSwgZXh0cmEgKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gbWFrZUFycmF5KCBbXSwgZXh0cmEgKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIG1ha2VBcnJheSggY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KSwgZXh0cmEgKTtcblx0XHRcdFx0XHR9IGNhdGNoKHFzYUVycm9yKSB7fVxuXG5cdFx0XHRcdC8vIHFTQSB3b3JrcyBzdHJhbmdlbHkgb24gRWxlbWVudC1yb290ZWQgcXVlcmllc1xuXHRcdFx0XHQvLyBXZSBjYW4gd29yayBhcm91bmQgdGhpcyBieSBzcGVjaWZ5aW5nIGFuIGV4dHJhIElEIG9uIHRoZSByb290XG5cdFx0XHRcdC8vIGFuZCB3b3JraW5nIHVwIGZyb20gdGhlcmUgKFRoYW5rcyB0byBBbmRyZXcgRHVwb250IGZvciB0aGUgdGVjaG5pcXVlKVxuXHRcdFx0XHQvLyBJRSA4IGRvZXNuJ3Qgd29yayBvbiBvYmplY3QgZWxlbWVudHNcblx0XHRcdFx0fSBlbHNlIGlmICggY29udGV4dC5ub2RlVHlwZSA9PT0gMSAmJiBjb250ZXh0Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgIT09IFwib2JqZWN0XCIgKSB7XG5cdFx0XHRcdFx0dmFyIG9sZENvbnRleHQgPSBjb250ZXh0LFxuXHRcdFx0XHRcdFx0b2xkID0gY29udGV4dC5nZXRBdHRyaWJ1dGUoIFwiaWRcIiApLFxuXHRcdFx0XHRcdFx0bmlkID0gb2xkIHx8IGlkLFxuXHRcdFx0XHRcdFx0aGFzUGFyZW50ID0gY29udGV4dC5wYXJlbnROb2RlLFxuXHRcdFx0XHRcdFx0cmVsYXRpdmVIaWVyYXJjaHlTZWxlY3RvciA9IC9eXFxzKlsrfl0vLnRlc3QoIHF1ZXJ5ICk7XG5cblx0XHRcdFx0XHRpZiAoICFvbGQgKSB7XG5cdFx0XHRcdFx0XHRjb250ZXh0LnNldEF0dHJpYnV0ZSggXCJpZFwiLCBuaWQgKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0bmlkID0gbmlkLnJlcGxhY2UoIC8nL2csIFwiXFxcXCQmXCIgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKCByZWxhdGl2ZUhpZXJhcmNoeVNlbGVjdG9yICYmIGhhc1BhcmVudCApIHtcblx0XHRcdFx0XHRcdGNvbnRleHQgPSBjb250ZXh0LnBhcmVudE5vZGU7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGlmICggIXJlbGF0aXZlSGllcmFyY2h5U2VsZWN0b3IgfHwgaGFzUGFyZW50ICkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gbWFrZUFycmF5KCBjb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoIFwiW2lkPSdcIiArIG5pZCArIFwiJ10gXCIgKyBxdWVyeSApLCBleHRyYSApO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0fSBjYXRjaChwc2V1ZG9FcnJvcikge1xuXHRcdFx0XHRcdH0gZmluYWxseSB7XG5cdFx0XHRcdFx0XHRpZiAoICFvbGQgKSB7XG5cdFx0XHRcdFx0XHRcdG9sZENvbnRleHQucmVtb3ZlQXR0cmlidXRlKCBcImlkXCIgKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG9sZFNpenpsZShxdWVyeSwgY29udGV4dCwgZXh0cmEsIHNlZWQpO1xuXHRcdH07XG5cblx0XHRmb3IgKCB2YXIgcHJvcCBpbiBvbGRTaXp6bGUgKSB7XG5cdFx0XHRTaXp6bGVbIHByb3AgXSA9IG9sZFNpenpsZVsgcHJvcCBdO1xuXHRcdH1cblxuXHRcdC8vIHJlbGVhc2UgbWVtb3J5IGluIElFXG5cdFx0ZGl2ID0gbnVsbDtcblx0fSkoKTtcbn1cblxuKGZ1bmN0aW9uKCl7XG5cdHZhciBodG1sID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxuXHRcdG1hdGNoZXMgPSBodG1sLm1hdGNoZXNTZWxlY3RvciB8fCBodG1sLm1vek1hdGNoZXNTZWxlY3RvciB8fCBodG1sLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBodG1sLm1zTWF0Y2hlc1NlbGVjdG9yO1xuXG5cdGlmICggbWF0Y2hlcyApIHtcblx0XHQvLyBDaGVjayB0byBzZWUgaWYgaXQncyBwb3NzaWJsZSB0byBkbyBtYXRjaGVzU2VsZWN0b3Jcblx0XHQvLyBvbiBhIGRpc2Nvbm5lY3RlZCBub2RlIChJRSA5IGZhaWxzIHRoaXMpXG5cdFx0dmFyIGRpc2Nvbm5lY3RlZE1hdGNoID0gIW1hdGNoZXMuY2FsbCggZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggXCJkaXZcIiApLCBcImRpdlwiICksXG5cdFx0XHRwc2V1ZG9Xb3JrcyA9IGZhbHNlO1xuXG5cdFx0dHJ5IHtcblx0XHRcdC8vIFRoaXMgc2hvdWxkIGZhaWwgd2l0aCBhbiBleGNlcHRpb25cblx0XHRcdC8vIEdlY2tvIGRvZXMgbm90IGVycm9yLCByZXR1cm5zIGZhbHNlIGluc3RlYWRcblx0XHRcdG1hdGNoZXMuY2FsbCggZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCBcIlt0ZXN0IT0nJ106c2l6emxlXCIgKTtcblxuXHRcdH0gY2F0Y2goIHBzZXVkb0Vycm9yICkge1xuXHRcdFx0cHNldWRvV29ya3MgPSB0cnVlO1xuXHRcdH1cblxuXHRcdFNpenpsZS5tYXRjaGVzU2VsZWN0b3IgPSBmdW5jdGlvbiggbm9kZSwgZXhwciApIHtcblx0XHRcdC8vIE1ha2Ugc3VyZSB0aGF0IGF0dHJpYnV0ZSBzZWxlY3RvcnMgYXJlIHF1b3RlZFxuXHRcdFx0ZXhwciA9IGV4cHIucmVwbGFjZSgvXFw9XFxzKihbXidcIlxcXV0qKVxccypcXF0vZywgXCI9JyQxJ11cIik7XG5cblx0XHRcdGlmICggIVNpenpsZS5pc1hNTCggbm9kZSApICkge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGlmICggcHNldWRvV29ya3MgfHwgIUV4cHIubWF0Y2guUFNFVURPLnRlc3QoIGV4cHIgKSAmJiAhLyE9Ly50ZXN0KCBleHByICkgKSB7XG5cdFx0XHRcdFx0XHR2YXIgcmV0ID0gbWF0Y2hlcy5jYWxsKCBub2RlLCBleHByICk7XG5cblx0XHRcdFx0XHRcdC8vIElFIDkncyBtYXRjaGVzU2VsZWN0b3IgcmV0dXJucyBmYWxzZSBvbiBkaXNjb25uZWN0ZWQgbm9kZXNcblx0XHRcdFx0XHRcdGlmICggcmV0IHx8ICFkaXNjb25uZWN0ZWRNYXRjaCB8fFxuXHRcdFx0XHRcdFx0XHRcdC8vIEFzIHdlbGwsIGRpc2Nvbm5lY3RlZCBub2RlcyBhcmUgc2FpZCB0byBiZSBpbiBhIGRvY3VtZW50XG5cdFx0XHRcdFx0XHRcdFx0Ly8gZnJhZ21lbnQgaW4gSUUgOSwgc28gY2hlY2sgZm9yIHRoYXRcblx0XHRcdFx0XHRcdFx0XHRub2RlLmRvY3VtZW50ICYmIG5vZGUuZG9jdW1lbnQubm9kZVR5cGUgIT09IDExICkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBjYXRjaChlKSB7fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gU2l6emxlKGV4cHIsIG51bGwsIG51bGwsIFtub2RlXSkubGVuZ3RoID4gMDtcblx0XHR9O1xuXHR9XG59KSgpO1xuXG4oZnVuY3Rpb24oKXtcblx0dmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cblx0ZGl2LmlubmVySFRNTCA9IFwiPGRpdiBjbGFzcz0ndGVzdCBlJz48L2Rpdj48ZGl2IGNsYXNzPSd0ZXN0Jz48L2Rpdj5cIjtcblxuXHQvLyBPcGVyYSBjYW4ndCBmaW5kIGEgc2Vjb25kIGNsYXNzbmFtZSAoaW4gOS42KVxuXHQvLyBBbHNvLCBtYWtlIHN1cmUgdGhhdCBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lIGFjdHVhbGx5IGV4aXN0c1xuXHRpZiAoICFkaXYuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSB8fCBkaXYuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImVcIikubGVuZ3RoID09PSAwICkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdC8vIFNhZmFyaSBjYWNoZXMgY2xhc3MgYXR0cmlidXRlcywgZG9lc24ndCBjYXRjaCBjaGFuZ2VzIChpbiAzLjIpXG5cdGRpdi5sYXN0Q2hpbGQuY2xhc3NOYW1lID0gXCJlXCI7XG5cblx0aWYgKCBkaXYuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImVcIikubGVuZ3RoID09PSAxICkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdEV4cHIub3JkZXIuc3BsaWNlKDEsIDAsIFwiQ0xBU1NcIik7XG5cdEV4cHIuZmluZC5DTEFTUyA9IGZ1bmN0aW9uKCBtYXRjaCwgY29udGV4dCwgaXNYTUwgKSB7XG5cdFx0aWYgKCB0eXBlb2YgY29udGV4dC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lICE9PSBcInVuZGVmaW5lZFwiICYmICFpc1hNTCApIHtcblx0XHRcdHJldHVybiBjb250ZXh0LmdldEVsZW1lbnRzQnlDbGFzc05hbWUobWF0Y2hbMV0pO1xuXHRcdH1cblx0fTtcblxuXHQvLyByZWxlYXNlIG1lbW9yeSBpbiBJRVxuXHRkaXYgPSBudWxsO1xufSkoKTtcblxuZnVuY3Rpb24gZGlyTm9kZUNoZWNrKCBkaXIsIGN1ciwgZG9uZU5hbWUsIGNoZWNrU2V0LCBub2RlQ2hlY2ssIGlzWE1MICkge1xuXHRmb3IgKCB2YXIgaSA9IDAsIGwgPSBjaGVja1NldC5sZW5ndGg7IGkgPCBsOyBpKysgKSB7XG5cdFx0dmFyIGVsZW0gPSBjaGVja1NldFtpXTtcblxuXHRcdGlmICggZWxlbSApIHtcblx0XHRcdHZhciBtYXRjaCA9IGZhbHNlO1xuXG5cdFx0XHRlbGVtID0gZWxlbVtkaXJdO1xuXG5cdFx0XHR3aGlsZSAoIGVsZW0gKSB7XG5cdFx0XHRcdGlmICggZWxlbVsgZXhwYW5kbyBdID09PSBkb25lTmFtZSApIHtcblx0XHRcdFx0XHRtYXRjaCA9IGNoZWNrU2V0W2VsZW0uc2l6c2V0XTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICggZWxlbS5ub2RlVHlwZSA9PT0gMSAmJiAhaXNYTUwgKXtcblx0XHRcdFx0XHRlbGVtWyBleHBhbmRvIF0gPSBkb25lTmFtZTtcblx0XHRcdFx0XHRlbGVtLnNpenNldCA9IGk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gY3VyICkge1xuXHRcdFx0XHRcdG1hdGNoID0gZWxlbTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGVsZW0gPSBlbGVtW2Rpcl07XG5cdFx0XHR9XG5cblx0XHRcdGNoZWNrU2V0W2ldID0gbWF0Y2g7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGRpckNoZWNrKCBkaXIsIGN1ciwgZG9uZU5hbWUsIGNoZWNrU2V0LCBub2RlQ2hlY2ssIGlzWE1MICkge1xuXHRmb3IgKCB2YXIgaSA9IDAsIGwgPSBjaGVja1NldC5sZW5ndGg7IGkgPCBsOyBpKysgKSB7XG5cdFx0dmFyIGVsZW0gPSBjaGVja1NldFtpXTtcblxuXHRcdGlmICggZWxlbSApIHtcblx0XHRcdHZhciBtYXRjaCA9IGZhbHNlO1xuXG5cdFx0XHRlbGVtID0gZWxlbVtkaXJdO1xuXG5cdFx0XHR3aGlsZSAoIGVsZW0gKSB7XG5cdFx0XHRcdGlmICggZWxlbVsgZXhwYW5kbyBdID09PSBkb25lTmFtZSApIHtcblx0XHRcdFx0XHRtYXRjaCA9IGNoZWNrU2V0W2VsZW0uc2l6c2V0XTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICggZWxlbS5ub2RlVHlwZSA9PT0gMSApIHtcblx0XHRcdFx0XHRpZiAoICFpc1hNTCApIHtcblx0XHRcdFx0XHRcdGVsZW1bIGV4cGFuZG8gXSA9IGRvbmVOYW1lO1xuXHRcdFx0XHRcdFx0ZWxlbS5zaXpzZXQgPSBpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmICggdHlwZW9mIGN1ciAhPT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdFx0XHRcdGlmICggZWxlbSA9PT0gY3VyICkge1xuXHRcdFx0XHRcdFx0XHRtYXRjaCA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0fSBlbHNlIGlmICggU2l6emxlLmZpbHRlciggY3VyLCBbZWxlbV0gKS5sZW5ndGggPiAwICkge1xuXHRcdFx0XHRcdFx0bWF0Y2ggPSBlbGVtO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZWxlbSA9IGVsZW1bZGlyXTtcblx0XHRcdH1cblxuXHRcdFx0Y2hlY2tTZXRbaV0gPSBtYXRjaDtcblx0XHR9XG5cdH1cbn1cblxuaWYgKCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY29udGFpbnMgKSB7XG5cdFNpenpsZS5jb250YWlucyA9IGZ1bmN0aW9uKCBhLCBiICkge1xuXHRcdHJldHVybiBhICE9PSBiICYmIChhLmNvbnRhaW5zID8gYS5jb250YWlucyhiKSA6IHRydWUpO1xuXHR9O1xuXG59IGVsc2UgaWYgKCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY29tcGFyZURvY3VtZW50UG9zaXRpb24gKSB7XG5cdFNpenpsZS5jb250YWlucyA9IGZ1bmN0aW9uKCBhLCBiICkge1xuXHRcdHJldHVybiAhIShhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKGIpICYgMTYpO1xuXHR9O1xuXG59IGVsc2Uge1xuXHRTaXp6bGUuY29udGFpbnMgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH07XG59XG5cblNpenpsZS5pc1hNTCA9IGZ1bmN0aW9uKCBlbGVtICkge1xuXHQvLyBkb2N1bWVudEVsZW1lbnQgaXMgdmVyaWZpZWQgZm9yIGNhc2VzIHdoZXJlIGl0IGRvZXNuJ3QgeWV0IGV4aXN0XG5cdC8vIChzdWNoIGFzIGxvYWRpbmcgaWZyYW1lcyBpbiBJRSAtICM0ODMzKVxuXHR2YXIgZG9jdW1lbnRFbGVtZW50ID0gKGVsZW0gPyBlbGVtLm93bmVyRG9jdW1lbnQgfHwgZWxlbSA6IDApLmRvY3VtZW50RWxlbWVudDtcblxuXHRyZXR1cm4gZG9jdW1lbnRFbGVtZW50ID8gZG9jdW1lbnRFbGVtZW50Lm5vZGVOYW1lICE9PSBcIkhUTUxcIiA6IGZhbHNlO1xufTtcblxudmFyIHBvc1Byb2Nlc3MgPSBmdW5jdGlvbiggc2VsZWN0b3IsIGNvbnRleHQsIHNlZWQgKSB7XG5cdHZhciBtYXRjaCxcblx0XHR0bXBTZXQgPSBbXSxcblx0XHRsYXRlciA9IFwiXCIsXG5cdFx0cm9vdCA9IGNvbnRleHQubm9kZVR5cGUgPyBbY29udGV4dF0gOiBjb250ZXh0O1xuXG5cdC8vIFBvc2l0aW9uIHNlbGVjdG9ycyBtdXN0IGJlIGRvbmUgYWZ0ZXIgdGhlIGZpbHRlclxuXHQvLyBBbmQgc28gbXVzdCA6bm90KHBvc2l0aW9uYWwpIHNvIHdlIG1vdmUgYWxsIFBTRVVET3MgdG8gdGhlIGVuZFxuXHR3aGlsZSAoIChtYXRjaCA9IEV4cHIubWF0Y2guUFNFVURPLmV4ZWMoIHNlbGVjdG9yICkpICkge1xuXHRcdGxhdGVyICs9IG1hdGNoWzBdO1xuXHRcdHNlbGVjdG9yID0gc2VsZWN0b3IucmVwbGFjZSggRXhwci5tYXRjaC5QU0VVRE8sIFwiXCIgKTtcblx0fVxuXG5cdHNlbGVjdG9yID0gRXhwci5yZWxhdGl2ZVtzZWxlY3Rvcl0gPyBzZWxlY3RvciArIFwiKlwiIDogc2VsZWN0b3I7XG5cblx0Zm9yICggdmFyIGkgPSAwLCBsID0gcm9vdC5sZW5ndGg7IGkgPCBsOyBpKysgKSB7XG5cdFx0U2l6emxlKCBzZWxlY3Rvciwgcm9vdFtpXSwgdG1wU2V0LCBzZWVkICk7XG5cdH1cblxuXHRyZXR1cm4gU2l6emxlLmZpbHRlciggbGF0ZXIsIHRtcFNldCApO1xufTtcblxuLy8gRVhQT1NFXG5cbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICBtb2R1bGUuZXhwb3J0cyA9IFNpenpsZTtcbn0gZWxzZSB7XG4gIHdpbmRvdy5TaXp6bGUgPSBTaXp6bGU7XG59XG5cbn0pKCk7XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGV2LnNvdXJjZTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID09PSB3aW5kb3cgfHwgc291cmNlID09PSBudWxsKSAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbnNlcnQtbW9kdWxlLWdsb2JhbHMvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qc1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwidmFyIHdpbmRvdyA9IHJlcXVpcmUoXCJnbG9iYWwvd2luZG93XCIpXG52YXIgb25jZSA9IHJlcXVpcmUoXCJvbmNlXCIpXG5cbnZhciBtZXNzYWdlcyA9IHtcbiAgICBcIjBcIjogXCJJbnRlcm5hbCBYTUxIdHRwUmVxdWVzdCBFcnJvclwiLFxuICAgIFwiNFwiOiBcIjR4eCBDbGllbnQgRXJyb3JcIixcbiAgICBcIjVcIjogXCI1eHggU2VydmVyIEVycm9yXCJcbn1cblxudmFyIFhIUiA9IHdpbmRvdy5YTUxIdHRwUmVxdWVzdCB8fCBub29wXG52YXIgWERSID0gXCJ3aXRoQ3JlZGVudGlhbHNcIiBpbiAobmV3IFhIUigpKSA/XG4gICAgICAgIHdpbmRvdy5YTUxIdHRwUmVxdWVzdCA6IHdpbmRvdy5YRG9tYWluUmVxdWVzdFxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVhIUlxuXG5mdW5jdGlvbiBjcmVhdGVYSFIob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgb3B0aW9ucyA9IHsgdXJpOiBvcHRpb25zIH1cbiAgICB9XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgIGNhbGxiYWNrID0gb25jZShjYWxsYmFjaylcblxuICAgIHZhciB4aHJcblxuICAgIGlmIChvcHRpb25zLmNvcnMpIHtcbiAgICAgICAgeGhyID0gbmV3IFhEUigpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgeGhyID0gbmV3IFhIUigpXG4gICAgfVxuXG4gICAgdmFyIHVyaSA9IHhoci51cmwgPSBvcHRpb25zLnVyaVxuICAgIHZhciBtZXRob2QgPSB4aHIubWV0aG9kID0gb3B0aW9ucy5tZXRob2QgfHwgXCJHRVRcIlxuICAgIHZhciBib2R5ID0gb3B0aW9ucy5ib2R5IHx8IG9wdGlvbnMuZGF0YVxuICAgIHZhciBoZWFkZXJzID0geGhyLmhlYWRlcnMgPSBvcHRpb25zLmhlYWRlcnMgfHwge31cbiAgICB2YXIgc3luYyA9ICEhb3B0aW9ucy5zeW5jXG4gICAgdmFyIGlzSnNvbiA9IGZhbHNlXG5cbiAgICBpZiAoXCJqc29uXCIgaW4gb3B0aW9ucykge1xuICAgICAgICBpc0pzb24gPSB0cnVlXG4gICAgICAgIGhlYWRlcnNbXCJDb250ZW50LVR5cGVcIl0gPSBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgICAgICBib2R5ID0gSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5qc29uKVxuICAgIH1cblxuICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSByZWFkeXN0YXRlY2hhbmdlXG4gICAgeGhyLm9ubG9hZCA9IGxvYWRcbiAgICB4aHIub25lcnJvciA9IGVycm9yXG4gICAgLy8gSUU5IG11c3QgaGF2ZSBvbnByb2dyZXNzIGJlIHNldCB0byBhIHVuaXF1ZSBmdW5jdGlvbi5cbiAgICB4aHIub25wcm9ncmVzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gSUUgbXVzdCBkaWVcbiAgICB9XG4gICAgLy8gaGF0ZSBJRVxuICAgIHhoci5vbnRpbWVvdXQgPSBub29wXG4gICAgeGhyLm9wZW4obWV0aG9kLCB1cmksICFzeW5jKVxuICAgIGlmIChvcHRpb25zLmNvcnMpIHtcbiAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRydWVcbiAgICB9XG4gICAgLy8gQ2Fubm90IHNldCB0aW1lb3V0IHdpdGggc3luYyByZXF1ZXN0XG4gICAgaWYgKCFzeW5jKSB7XG4gICAgICAgIHhoci50aW1lb3V0ID0gXCJ0aW1lb3V0XCIgaW4gb3B0aW9ucyA/IG9wdGlvbnMudGltZW91dCA6IDUwMDBcbiAgICB9XG5cbiAgICBpZiAoIHhoci5zZXRSZXF1ZXN0SGVhZGVyKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKGhlYWRlcnMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoa2V5LCBoZWFkZXJzW2tleV0pXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgeGhyLnNlbmQoYm9keSlcblxuICAgIHJldHVybiB4aHJcblxuICAgIGZ1bmN0aW9uIHJlYWR5c3RhdGVjaGFuZ2UoKSB7XG4gICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgbG9hZCgpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2FkKCkge1xuICAgICAgICB2YXIgZXJyb3IgPSBudWxsXG4gICAgICAgIHZhciBzdGF0dXMgPSB4aHIuc3RhdHVzQ29kZSA9IHhoci5zdGF0dXNcbiAgICAgICAgdmFyIGJvZHkgPSB4aHIuYm9keSA9IHhoci5yZXNwb25zZSB8fFxuICAgICAgICAgICAgeGhyLnJlc3BvbnNlVGV4dCB8fCB4aHIucmVzcG9uc2VYTUxcblxuICAgICAgICBpZiAoc3RhdHVzID09PSAwIHx8IChzdGF0dXMgPj0gNDAwICYmIHN0YXR1cyA8IDYwMCkpIHtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0geGhyLnJlc3BvbnNlVGV4dCB8fFxuICAgICAgICAgICAgICAgIG1lc3NhZ2VzW1N0cmluZyh4aHIuc3RhdHVzKS5jaGFyQXQoMCldXG4gICAgICAgICAgICBlcnJvciA9IG5ldyBFcnJvcihtZXNzYWdlKVxuXG4gICAgICAgICAgICBlcnJvci5zdGF0dXNDb2RlID0geGhyLnN0YXR1c1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzSnNvbikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBib2R5ID0geGhyLmJvZHkgPSBKU09OLnBhcnNlKGJvZHkpXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICB9XG5cbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIHhociwgYm9keSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihldnQpIHtcbiAgICAgICAgY2FsbGJhY2soZXZ0LCB4aHIpXG4gICAgfVxufVxuXG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHdpbmRvd1xufSBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBnbG9iYWxcbn0gZWxzZSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7fVxufVxuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIm1vZHVsZS5leHBvcnRzID0gb25jZVxuXG5vbmNlLnByb3RvID0gb25jZShmdW5jdGlvbiAoKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShGdW5jdGlvbi5wcm90b3R5cGUsICdvbmNlJywge1xuICAgIHZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gb25jZSh0aGlzKVxuICAgIH0sXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0pXG59KVxuXG5mdW5jdGlvbiBvbmNlIChmbikge1xuICB2YXIgY2FsbGVkID0gZmFsc2VcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoY2FsbGVkKSByZXR1cm5cbiAgICBjYWxsZWQgPSB0cnVlXG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgfVxufVxuIiwidmFyIE5PX09QID0gZnVuY3Rpb24oKXt9O1xudmFyIEFQSV9CQVNFX1VSTCA9ICdodHRwczovL3NlcnZpY2VzLnNwYXJrYXJ0Lm5ldC9hcGkvdjEvJztcblxudmFyIGpzb25wID0gcmVxdWlyZSgnanNvbnAnKTtcbnZhciB4aHIgPSByZXF1aXJlKCd4aHInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggZW5kcG9pbnQsIGtleSwgb3B0aW9ucywgY2FsbGJhY2sgKXtcblx0aWYoIHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nICl7XG5cdFx0Y2FsbGJhY2sgPSBvcHRpb25zO1xuXHRcdG9wdGlvbnMgPSB7fTtcblx0fVxuXHRjYWxsYmFjayA9IGNhbGxiYWNrIHx8IE5PX09QO1xuXHR2YXIgdXJsID0gQVBJX0JBU0VfVVJMICsgZW5kcG9pbnQgKyc/a2V5PScrIGtleTtcblxuXHQvLyBVc2UgSlNPTlAgaWYgdGhpcyBpcyBJRSBvciBvcHRpb24gaXMgc2V0XG5cdGlmKCB0eXBlb2YgWERvbWFpblJlcXVlc3QgPT09ICd1bmRlZmluZWQnIHx8IG9wdGlvbnMuanNvbnAgKXtcblx0XHRqc29ucCggdXJsLCBmdW5jdGlvbiggZXJyLCBkYXRhICl7XG5cdFx0XHRjYWxsYmFjayggZXJyLCBkYXRhICk7XG5cdFx0fSk7XG5cdH1cblx0ZWxzZSB7XG5cdFx0eGhyKHtcblx0XHRcdHVyaTogdXJsLFxuXHRcdFx0Y29yczogdHJ1ZVxuXHRcdH0sIGZ1bmN0aW9uKCBlcnIsIHJlcXVlc3QsIHJlc3BvbnNlICl7XG5cdFx0XHR2YXIgZGF0YSA9IEpTT04ucGFyc2UoIHJlc3BvbnNlICk7XG5cdFx0XHRjYWxsYmFjayggZXJyLCBkYXRhICk7XG5cdFx0fSk7XG5cdH1cbn07IiwidmFyIE5PX09QID0gZnVuY3Rpb24oKXt9O1xuXG52YXIgZG9tcmVhZHkgPSByZXF1aXJlKCdkb21yZWFkeScpO1xudmFyIHNpenpsZSA9IHJlcXVpcmUoJ3NpenpsZScpO1xudmFyIGVsQ2xhc3MgPSByZXF1aXJlKCdlbGVtZW50LWNsYXNzJyk7XG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbnZhciBoYW5kbGViYXJzX2hlbHBlciA9IHJlcXVpcmUoJ2hhbmRsZWJhcnMtaGVscGVyJyk7XG5cbmhhbmRsZWJhcnNfaGVscGVyLmhlbHAoIEhhbmRsZWJhcnMgKTtcblxudmFyIGFwaVJlcXVlc3QgPSByZXF1aXJlKCcuL2FwaV9yZXF1ZXN0LmpzJyk7XG5cbnZhciBCYXNlID0gZnVuY3Rpb24oIGNvbmZpZyApe1xuXHR0aGlzLmtleSA9IGNvbmZpZy5rZXkgfHwgdGhpcy5rZXk7XG5cdHRoaXMuZW5kcG9pbnQgPSBjb25maWcuZW5kcG9pbnQgfHwgdGhpcy5lbmRwb2ludDtcblx0dGhpcy5lbCA9IGNvbmZpZy5lbDtcblx0dGhpcy50ZW1wbGF0ZSA9IGNvbmZpZy50ZW1wbGF0ZSB8fCB0aGlzLnRlbXBsYXRlIHx8IHJlcXVpcmUoJy4vdGVzdC5oYnMnKTtcblx0dGhpcy5wcmVwcm9jZXNzb3IgPSBjb25maWcucHJlcHJvY2Vzc29yO1xuXHRkb21yZWFkeSggZnVuY3Rpb24oKXtcblx0XHRpZiggdHlwZW9mIHRoaXMuZWwgPT09ICdzdHJpbmcnICl7XG5cdFx0XHR0aGlzLmVsID0gc2l6emxlKCB0aGlzLmVsICk7XG5cdFx0fVxuXHRcdHRoaXMucmVxdWVzdCgpO1xuXHR9LmJpbmQoIHRoaXMgKSApO1xufTtcblxuQmFzZS5wcm90b3R5cGUucmVxdWVzdCA9IGZ1bmN0aW9uKCBvcHRpb25zLCBjYWxsYmFjayApe1xuXHR2YXIgYmFzZSA9IHRoaXM7XG5cdGlmKCB0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJyApe1xuXHRcdGNhbGxiYWNrID0gb3B0aW9ucztcblx0XHRvcHRpb25zID0ge307XG5cdH1cblx0Y2FsbGJhY2sgPSBjYWxsYmFjayB8fCBOT19PUDtcblx0ZWxDbGFzcyggdGhpcy5lbCApLmFkZCgnbG9hZGluZycpO1xuXHRhcGlSZXF1ZXN0KCB0aGlzLmVuZHBvaW50LCB0aGlzLmtleSwgZnVuY3Rpb24oIGVyciwgcmVzcG9uc2UgKXtcblx0XHRiYXNlLnJlbmRlciggcmVzcG9uc2UgKTtcblx0XHRlbENsYXNzKCB0aGlzLmVsICkucmVtb3ZlKCdsb2FkaW5nJyk7XG5cdFx0aWYoIGVyciApIGVsQ2xhc3MoIHRoaXMuZWwgKS5hZGQoJ2Vycm9yJyk7XG5cdH0pO1xufTtcblxuQmFzZS5wcm90b3R5cGUucHJlcHJvY2VzcyA9IGZ1bmN0aW9uKCBkYXRhICl7XG5cdHRyeSB7XG5cdFx0aWYoIHRoaXMucHJlcHJvY2Vzc29yICkgZGF0YSA9IHRoaXMucHJlcHJvY2Vzc29yKCBkYXRhICk7XG5cdH1cblx0Y2F0Y2goIGVyciApe1xuXHRcdGlmKCBlcnIgKSBjb25zb2xlLmxvZygnRXJyb3IgcHJlcHJvY2Vzc2luZyBtb2R1bGUgcmVzb3VyY2UnKTtcblx0fVxuXHRyZXR1cm4gZGF0YTtcbn07XG5cbkJhc2UucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCBkYXRhICl7XG5cdGRhdGEgPSB0aGlzLnByZXByb2Nlc3MoIGRhdGEgKTtcblx0dHJ5IHtcblx0XHRmb3IoIHZhciBpID0gdGhpcy5lbC5sZW5ndGggLSAxOyBpID49IDA7IGktLSApe1xuXHRcdFx0dGhpcy5lbFtpXS5pbm5lckhUTUwgPSB0aGlzLnRlbXBsYXRlKCBkYXRhICk7XG5cdFx0fVxuXHR9XG5cdGNhdGNoKCBlcnIgKXtcblx0XHRpZiggZXJyICkgY29uc29sZS5sb2coJ0Vycm9yIHJlbmRlcmluZyBtb2R1bGUnKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2U7IiwidmFyIEVWRU5UU19FTkRQT0lOVCA9ICdldmVudHMvJztcblxudmFyIGluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcbnZhciBCYXNlID0gcmVxdWlyZSgnLi9iYXNlLmpzJyk7XG5cbnZhciBldmVudHNfdGVtcGxhdGUgPSByZXF1aXJlKCcuL3RlbXBsYXRlcy9ldmVudC5oYnMnKTtcblxudmFyIEV2ZW50cyA9IGZ1bmN0aW9uKCBjb25maWcgKXtcblx0Y29uZmlnID0gZXh0ZW5kKCBjb25maWcsIHtcblx0XHRlbmRwb2ludDogRVZFTlRTX0VORFBPSU5UICsgY29uZmlnLmlkLFxuXHRcdHRlbXBsYXRlOiBldmVudHNfdGVtcGxhdGVcblx0fSlcblx0QmFzZS5jYWxsKCB0aGlzLCBjb25maWcgKTtcbn07XG5cbmluaGVyaXRzKCBFdmVudHMsIEJhc2UgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudHM7IiwidmFyIEVWRU5UU19FTkRQT0lOVCA9ICdldmVudHMvJztcblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJyk7XG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpO1xuXG52YXIgZXZlbnRzX3RlbXBsYXRlID0gcmVxdWlyZSgnLi90ZW1wbGF0ZXMvZXZlbnRzLmhicycpO1xuXG52YXIgRXZlbnRzID0gZnVuY3Rpb24oIGNvbmZpZyApe1xuXHRjb25maWcgPSBleHRlbmQoIGNvbmZpZywge1xuXHRcdGVuZHBvaW50OiBFVkVOVFNfRU5EUE9JTlQsXG5cdFx0dGVtcGxhdGU6IGV2ZW50c190ZW1wbGF0ZVxuXHR9KVxuXHRCYXNlLmNhbGwoIHRoaXMsIGNvbmZpZyApO1xufTtcblxudXRpbC5pbmhlcml0cyggRXZlbnRzLCBCYXNlICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRzOyIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzLnRlbXBsYXRlKGZ1bmN0aW9uIChIYW5kbGViYXJzLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgdGhpcy5jb21waWxlckluZm8gPSBbNCwnPj0gMS4wLjAnXTtcbmhlbHBlcnMgPSB0aGlzLm1lcmdlKGhlbHBlcnMsIEhhbmRsZWJhcnMuaGVscGVycyk7IGRhdGEgPSBkYXRhIHx8IHt9O1xuICB2YXIgc3RhY2sxLCBoZWxwZXIsIG9wdGlvbnMsIGZ1bmN0aW9uVHlwZT1cImZ1bmN0aW9uXCIsIGVzY2FwZUV4cHJlc3Npb249dGhpcy5lc2NhcGVFeHByZXNzaW9uLCBzZWxmPXRoaXMsIGJsb2NrSGVscGVyTWlzc2luZz1oZWxwZXJzLmJsb2NrSGVscGVyTWlzc2luZywgaGVscGVyTWlzc2luZz1oZWxwZXJzLmhlbHBlck1pc3Npbmc7XG5cbmZ1bmN0aW9uIHByb2dyYW0xKGRlcHRoMCxkYXRhKSB7XG4gIFxuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXIsIG9wdGlvbnM7XG4gIGJ1ZmZlciArPSBcIlxcblwiO1xuICBvcHRpb25zPXtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSgyLCBwcm9ncmFtMiwgZGF0YSksZGF0YTpkYXRhfVxuICBpZiAoaGVscGVyID0gaGVscGVycy52ZW51ZSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIG9wdGlvbnMpOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC52ZW51ZSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwgb3B0aW9ucykgOiBoZWxwZXI7IH1cbiAgaWYgKCFoZWxwZXJzLnZlbnVlKSB7IHN0YWNrMSA9IGJsb2NrSGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgc3RhY2sxLCB7aGFzaDp7fSxpbnZlcnNlOnNlbGYubm9vcCxmbjpzZWxmLnByb2dyYW0oMiwgcHJvZ3JhbTIsIGRhdGEpLGRhdGE6ZGF0YX0pOyB9XG4gIGlmKHN0YWNrMSB8fCBzdGFjazEgPT09IDApIHsgYnVmZmVyICs9IHN0YWNrMTsgfVxuICBidWZmZXIgKz0gXCJcXG48aDM+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnRpdGxlKSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLnRpdGxlKTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KSA6IGhlbHBlcjsgfVxuICBidWZmZXIgKz0gZXNjYXBlRXhwcmVzc2lvbihzdGFjazEpXG4gICAgKyBcIjwvaDM+XFxuPHRpbWU+XCJcbiAgICArIGVzY2FwZUV4cHJlc3Npb24oKGhlbHBlciA9IGhlbHBlcnMuZm9ybWF0RGF0ZSB8fCAoZGVwdGgwICYmIGRlcHRoMC5mb3JtYXREYXRlKSxvcHRpb25zPXtoYXNoOnt9LGRhdGE6ZGF0YX0saGVscGVyID8gaGVscGVyLmNhbGwoZGVwdGgwLCAoZGVwdGgwICYmIGRlcHRoMC5kYXRlKSwgXCIlYiAlLWRcIiwgb3B0aW9ucykgOiBoZWxwZXJNaXNzaW5nLmNhbGwoZGVwdGgwLCBcImZvcm1hdERhdGVcIiwgKGRlcHRoMCAmJiBkZXB0aDAuZGF0ZSksIFwiJWIgJS1kXCIsIG9wdGlvbnMpKSlcbiAgICArIFwiPC90aW1lPlxcbjxwPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5kZXNjcmlwdGlvbikgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5kZXNjcmlwdGlvbik7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L3A+XFxuXCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH1cbmZ1bmN0aW9uIHByb2dyYW0yKGRlcHRoMCxkYXRhKSB7XG4gIFxuICB2YXIgYnVmZmVyID0gXCJcIiwgc3RhY2sxLCBoZWxwZXI7XG4gIGJ1ZmZlciArPSBcIjxoMj5cIjtcbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMuY2l0eSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5jaXR5KTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KSA6IGhlbHBlcjsgfVxuICBidWZmZXIgKz0gZXNjYXBlRXhwcmVzc2lvbihzdGFjazEpXG4gICAgKyBcIiwgXCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLnN0YXRlKSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLnN0YXRlKTsgc3RhY2sxID0gdHlwZW9mIGhlbHBlciA9PT0gZnVuY3Rpb25UeXBlID8gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KSA6IGhlbHBlcjsgfVxuICBidWZmZXIgKz0gZXNjYXBlRXhwcmVzc2lvbihzdGFjazEpXG4gICAgKyBcIjwvaDI+XCI7XG4gIHJldHVybiBidWZmZXI7XG4gIH1cblxuICBvcHRpb25zPXtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSgxLCBwcm9ncmFtMSwgZGF0YSksZGF0YTpkYXRhfVxuICBpZiAoaGVscGVyID0gaGVscGVycy5ldmVudCkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIG9wdGlvbnMpOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5ldmVudCk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwgb3B0aW9ucykgOiBoZWxwZXI7IH1cbiAgaWYgKCFoZWxwZXJzLmV2ZW50KSB7IHN0YWNrMSA9IGJsb2NrSGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgc3RhY2sxLCB7aGFzaDp7fSxpbnZlcnNlOnNlbGYubm9vcCxmbjpzZWxmLnByb2dyYW0oMSwgcHJvZ3JhbTEsIGRhdGEpLGRhdGE6ZGF0YX0pOyB9XG4gIGlmKHN0YWNrMSB8fCBzdGFjazEgPT09IDApIHsgcmV0dXJuIHN0YWNrMTsgfVxuICBlbHNlIHsgcmV0dXJuICcnOyB9XG4gIH0pO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnMudGVtcGxhdGUoZnVuY3Rpb24gKEhhbmRsZWJhcnMsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICB0aGlzLmNvbXBpbGVySW5mbyA9IFs0LCc+PSAxLjAuMCddO1xuaGVscGVycyA9IHRoaXMubWVyZ2UoaGVscGVycywgSGFuZGxlYmFycy5oZWxwZXJzKTsgZGF0YSA9IGRhdGEgfHwge307XG4gIHZhciBidWZmZXIgPSBcIlwiLCBzdGFjazEsIGhlbHBlciwgb3B0aW9ucywgZnVuY3Rpb25UeXBlPVwiZnVuY3Rpb25cIiwgZXNjYXBlRXhwcmVzc2lvbj10aGlzLmVzY2FwZUV4cHJlc3Npb24sIHNlbGY9dGhpcywgYmxvY2tIZWxwZXJNaXNzaW5nPWhlbHBlcnMuYmxvY2tIZWxwZXJNaXNzaW5nLCBoZWxwZXJNaXNzaW5nPWhlbHBlcnMuaGVscGVyTWlzc2luZztcblxuZnVuY3Rpb24gcHJvZ3JhbTEoZGVwdGgwLGRhdGEpIHtcbiAgXG4gIHZhciBidWZmZXIgPSBcIlwiLCBzdGFjazEsIGhlbHBlciwgb3B0aW9ucztcbiAgYnVmZmVyICs9IFwiXFxuXHQ8bGk+XFxuXHRcdFwiO1xuICBvcHRpb25zPXtoYXNoOnt9LGludmVyc2U6c2VsZi5ub29wLGZuOnNlbGYucHJvZ3JhbSgyLCBwcm9ncmFtMiwgZGF0YSksZGF0YTpkYXRhfVxuICBpZiAoaGVscGVyID0gaGVscGVycy52ZW51ZSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIG9wdGlvbnMpOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC52ZW51ZSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwgb3B0aW9ucykgOiBoZWxwZXI7IH1cbiAgaWYgKCFoZWxwZXJzLnZlbnVlKSB7IHN0YWNrMSA9IGJsb2NrSGVscGVyTWlzc2luZy5jYWxsKGRlcHRoMCwgc3RhY2sxLCB7aGFzaDp7fSxpbnZlcnNlOnNlbGYubm9vcCxmbjpzZWxmLnByb2dyYW0oMiwgcHJvZ3JhbTIsIGRhdGEpLGRhdGE6ZGF0YX0pOyB9XG4gIGlmKHN0YWNrMSB8fCBzdGFjazEgPT09IDApIHsgYnVmZmVyICs9IHN0YWNrMTsgfVxuICBidWZmZXIgKz0gXCJcXG5cdFx0PGgzPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy50aXRsZSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC50aXRsZSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2gzPlxcblx0XHQ8dGltZT5cIlxuICAgICsgZXNjYXBlRXhwcmVzc2lvbigoaGVscGVyID0gaGVscGVycy5mb3JtYXREYXRlIHx8IChkZXB0aDAgJiYgZGVwdGgwLmZvcm1hdERhdGUpLG9wdGlvbnM9e2hhc2g6e30sZGF0YTpkYXRhfSxoZWxwZXIgPyBoZWxwZXIuY2FsbChkZXB0aDAsIChkZXB0aDAgJiYgZGVwdGgwLmRhdGUpLCBcIiViICUtZFwiLCBvcHRpb25zKSA6IGhlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIFwiZm9ybWF0RGF0ZVwiLCAoZGVwdGgwICYmIGRlcHRoMC5kYXRlKSwgXCIlYiAlLWRcIiwgb3B0aW9ucykpKVxuICAgICsgXCI8L3RpbWU+XFxuXHRcdDxwPlwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5kZXNjcmlwdGlvbikgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5kZXNjcmlwdGlvbik7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L3A+XFxuXHQ8L2xpPlxcblwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9XG5mdW5jdGlvbiBwcm9ncmFtMihkZXB0aDAsZGF0YSkge1xuICBcbiAgdmFyIGJ1ZmZlciA9IFwiXCIsIHN0YWNrMSwgaGVscGVyO1xuICBidWZmZXIgKz0gXCI8aDI+XCI7XG4gIGlmIChoZWxwZXIgPSBoZWxwZXJzLmNpdHkpIHsgc3RhY2sxID0gaGVscGVyLmNhbGwoZGVwdGgwLCB7aGFzaDp7fSxkYXRhOmRhdGF9KTsgfVxuICBlbHNlIHsgaGVscGVyID0gKGRlcHRoMCAmJiBkZXB0aDAuY2l0eSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCIsIFwiO1xuICBpZiAoaGVscGVyID0gaGVscGVycy5zdGF0ZSkgeyBzdGFjazEgPSBoZWxwZXIuY2FsbChkZXB0aDAsIHtoYXNoOnt9LGRhdGE6ZGF0YX0pOyB9XG4gIGVsc2UgeyBoZWxwZXIgPSAoZGVwdGgwICYmIGRlcHRoMC5zdGF0ZSk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwge2hhc2g6e30sZGF0YTpkYXRhfSkgOiBoZWxwZXI7IH1cbiAgYnVmZmVyICs9IGVzY2FwZUV4cHJlc3Npb24oc3RhY2sxKVxuICAgICsgXCI8L2gyPlwiO1xuICByZXR1cm4gYnVmZmVyO1xuICB9XG5cbiAgYnVmZmVyICs9IFwiPHVsIGNsYXNzPVxcXCJsaXN0aW5nXFxcIj5cXG5cIjtcbiAgb3B0aW9ucz17aGFzaDp7fSxpbnZlcnNlOnNlbGYubm9vcCxmbjpzZWxmLnByb2dyYW0oMSwgcHJvZ3JhbTEsIGRhdGEpLGRhdGE6ZGF0YX1cbiAgaWYgKGhlbHBlciA9IGhlbHBlcnMuZXZlbnRzKSB7IHN0YWNrMSA9IGhlbHBlci5jYWxsKGRlcHRoMCwgb3B0aW9ucyk7IH1cbiAgZWxzZSB7IGhlbHBlciA9IChkZXB0aDAgJiYgZGVwdGgwLmV2ZW50cyk7IHN0YWNrMSA9IHR5cGVvZiBoZWxwZXIgPT09IGZ1bmN0aW9uVHlwZSA/IGhlbHBlci5jYWxsKGRlcHRoMCwgb3B0aW9ucykgOiBoZWxwZXI7IH1cbiAgaWYgKCFoZWxwZXJzLmV2ZW50cykgeyBzdGFjazEgPSBibG9ja0hlbHBlck1pc3NpbmcuY2FsbChkZXB0aDAsIHN0YWNrMSwge2hhc2g6e30saW52ZXJzZTpzZWxmLm5vb3AsZm46c2VsZi5wcm9ncmFtKDEsIHByb2dyYW0xLCBkYXRhKSxkYXRhOmRhdGF9KTsgfVxuICBpZihzdGFjazEgfHwgc3RhY2sxID09PSAwKSB7IGJ1ZmZlciArPSBzdGFjazE7IH1cbiAgYnVmZmVyICs9IFwiXFxuPC91bD5cIjtcbiAgcmV0dXJuIGJ1ZmZlcjtcbiAgfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbiAoSGFuZGxlYmFycyxkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gIHRoaXMuY29tcGlsZXJJbmZvID0gWzQsJz49IDEuMC4wJ107XG5oZWxwZXJzID0gdGhpcy5tZXJnZShoZWxwZXJzLCBIYW5kbGViYXJzLmhlbHBlcnMpOyBkYXRhID0gZGF0YSB8fCB7fTtcbiAgXG5cblxuICByZXR1cm4gXCJ0ZXN0XCI7XG4gIH0pO1xuIl19
(1)
});
