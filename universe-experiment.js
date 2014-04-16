!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Modular=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
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

},{}],2:[function(_dereq_,module,exports){
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

},{}],3:[function(_dereq_,module,exports){
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
},{"./handlebars/base":4,"./handlebars/exception":5,"./handlebars/runtime":6,"./handlebars/safe-string":7,"./handlebars/utils":8}],4:[function(_dereq_,module,exports){
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
},{"./exception":5,"./utils":8}],5:[function(_dereq_,module,exports){
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
},{}],6:[function(_dereq_,module,exports){
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
},{"./base":4,"./exception":5,"./utils":8}],7:[function(_dereq_,module,exports){
"use strict";
// Build out our basic SafeString type
function SafeString(string) {
  this.string = string;
}

SafeString.prototype.toString = function() {
  return "" + this.string;
};

exports["default"] = SafeString;
},{}],8:[function(_dereq_,module,exports){
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
},{"./safe-string":7}],9:[function(_dereq_,module,exports){
// Create a simple path alias to allow browserify to resolve
// the runtime on a supported path.
module.exports = _dereq_('./dist/cjs/handlebars.runtime');

},{"./dist/cjs/handlebars.runtime":3}],10:[function(_dereq_,module,exports){
module.exports = _dereq_("handlebars/runtime")["default"];

},{"handlebars/runtime":9}],11:[function(_dereq_,module,exports){

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

function noop(){};

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

  var opts = opts || {};
  var param = opts.param || 'callback';
  var timeout = null != opts.timeout ? opts.timeout : 60000;
  var enc = encodeURIComponent;
  var target = document.getElementsByTagName('script')[0];
  var script;
  var timer;

  // generate a unique id for this request
  var id = count++;

  if (timeout) {
    timer = setTimeout(function(){
      cleanup();
      fn && fn(new Error('Timeout'));
    }, timeout);
  }

  function cleanup(){
    target.parentNode.removeChild(script);
    window['__jp' + id] = noop;
  }

  window['__jp' + id] = function(data){
    debug('jsonp got', data);
    if (timer) clearTimeout(timer);
    cleanup();
    fn && fn(null, data);
  };

  // add qs component
  url += (~url.indexOf('?') ? '&' : '?') + param + '=' + enc('__jp' + id + '');
  url = url.replace('?&', '?');

  debug('jsonp req "%s"', url);

  // create script
  script = document.createElement('script');
  script.src = url;
  target.parentNode.insertBefore(script, target);
};

},{"debug":12}],12:[function(_dereq_,module,exports){

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

},{}],13:[function(_dereq_,module,exports){
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

},{}],14:[function(_dereq_,module,exports){
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

},{"global/window":15,"once":16}],15:[function(_dereq_,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window
} else if (typeof global !== "undefined") {
    module.exports = global
} else {
    module.exports = {}
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],16:[function(_dereq_,module,exports){
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

},{}],17:[function(_dereq_,module,exports){
var Handlebars=_dereq_("hbsfy/runtime");module.exports=Handlebars.template(function(e,r,t,s,n){return this.compilerInfo=[4,">= 1.0.0"],t=this.merge(t,e.helpers),n=n||{},"test"});
},{"hbsfy/runtime":10}],18:[function(_dereq_,module,exports){
var NO_OP=function(){},domready=_dereq_("domready"),sizzle=_dereq_("sizzle"),elClass=_dereq_("element-class"),jsonp=_dereq_("jsonp"),xhr=_dereq_("xhr"),Modular=function(e){this.url=e.url,this.el=e.el,this.template=e.template||_dereq_("./test.hbs"),this.preprocessor=e.preprocessor,domready(function(){"string"==typeof this.el&&(this.el=sizzle(this.el)[0]),this.request()}.bind(this))};Modular.prototype.request=function(e,r){"function"==typeof e&&(r=e,e={}),r=r||NO_OP,elClass(this.el).add("loading"),"undefined"==typeof XDomainRequest||e.jsonp?jsonp(this.url,function(e,r){this.render(r),elClass(this.el).remove("loading"),e&&elClass(this.el).add("error")}.bind(this)):xhr({uri:this.url,cors:!0},function(e,r,s){var o=JSON.parse(s);this.render(o),elClass(this.el).remove("loading"),e&&elClass(this.el).add("error")}.bind(this))},Modular.prototpye.preprocess=function(e){try{this.preprocessor&&(e=this.preprocessor(e))}catch(r){r&&console.log("Error preprocessing module resource")}return e},Modular.prototype.render=function(e){e=this.preprocess(e);try{this.el.innerHTML=this.template(e)}catch(r){r&&console.log("Error rendering module")}},module.exports=Modular;
},{"./test.hbs":17,"domready":1,"element-class":2,"jsonp":11,"sizzle":13,"xhr":14}]},{},[18])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9kb21yZWFkeS9yZWFkeS5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9lbGVtZW50LWNsYXNzL2luZGV4LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvZGlzdC9janMvaGFuZGxlYmFycy5ydW50aW1lLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvZGlzdC9janMvaGFuZGxlYmFycy9iYXNlLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvZGlzdC9janMvaGFuZGxlYmFycy9leGNlcHRpb24uanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL3J1bnRpbWUuanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL3NhZmUtc3RyaW5nLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvZGlzdC9janMvaGFuZGxlYmFycy91dGlscy5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9oYW5kbGViYXJzL3J1bnRpbWUuanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvaGJzZnkvcnVudGltZS5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9qc29ucC9pbmRleC5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy9qc29ucC9ub2RlX21vZHVsZXMvZGVidWcvZGVidWcuanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMvc2l6emxlL3NpenpsZS5qcyIsIi9Vc2Vycy9lcmljL1JlcG9zL3VuaXZlcnNlLmpzL25vZGVfbW9kdWxlcy94aHIvaW5kZXguanMiLCIvVXNlcnMvZXJpYy9SZXBvcy91bml2ZXJzZS5qcy9ub2RlX21vZHVsZXMveGhyL25vZGVfbW9kdWxlcy9nbG9iYWwvd2luZG93LmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvbm9kZV9tb2R1bGVzL3hoci9ub2RlX21vZHVsZXMvb25jZS9vbmNlLmpzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvc3JjL3Rlc3QuaGJzIiwiL1VzZXJzL2VyaWMvUmVwb3MvdW5pdmVyc2UuanMvc3JjL3VuaXZlcnNlLWV4cGVyaW1lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6NkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTs7QUNBQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohXG4gICogZG9tcmVhZHkgKGMpIER1c3RpbiBEaWF6IDIwMTQgLSBMaWNlbnNlIE1JVFxuICAqL1xuIWZ1bmN0aW9uIChuYW1lLCBkZWZpbml0aW9uKSB7XG5cbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcpIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpXG4gIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PSAnb2JqZWN0JykgZGVmaW5lKGRlZmluaXRpb24pXG4gIGVsc2UgdGhpc1tuYW1lXSA9IGRlZmluaXRpb24oKVxuXG59KCdkb21yZWFkeScsIGZ1bmN0aW9uICgpIHtcblxuICB2YXIgZm5zID0gW10sIGxpc3RlbmVyXG4gICAgLCBkb2MgPSBkb2N1bWVudFxuICAgICwgZG9tQ29udGVudExvYWRlZCA9ICdET01Db250ZW50TG9hZGVkJ1xuICAgICwgbG9hZGVkID0gL15sb2FkZWR8XmMvLnRlc3QoZG9jLnJlYWR5U3RhdGUpXG5cbiAgZnVuY3Rpb24gZmx1c2ggKGZuKSB7XG4gICAgbG9hZGVkID0gMVxuICAgIHdoaWxlIChmbiA9IGZucy5zaGlmdCgpKSBmbigpXG4gIH1cblxuICBkb2MuYWRkRXZlbnRMaXN0ZW5lcihkb21Db250ZW50TG9hZGVkLCBsaXN0ZW5lciA9IGZ1bmN0aW9uICgpIHtcbiAgICBkb2MucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb21Db250ZW50TG9hZGVkLCBsaXN0ZW5lcilcbiAgICBmbHVzaCgpXG4gIH0pXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChmbikge1xuICAgIGxvYWRlZCA/IGZuKCkgOiBmbnMucHVzaChmbilcbiAgfVxuXG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0cykge1xuICByZXR1cm4gbmV3IEVsZW1lbnRDbGFzcyhvcHRzKVxufVxuXG5mdW5jdGlvbiBFbGVtZW50Q2xhc3Mob3B0cykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRWxlbWVudENsYXNzKSkgcmV0dXJuIG5ldyBFbGVtZW50Q2xhc3Mob3B0cylcbiAgdmFyIHNlbGYgPSB0aGlzXG4gIGlmICghb3B0cykgb3B0cyA9IHt9XG4gIGlmIChvcHRzIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIG9wdHMgPSB7ZWw6IG9wdHN9XG4gIHRoaXMub3B0cyA9IG9wdHNcbiAgdGhpcy5lbCA9IG9wdHMuZWwgfHwgZG9jdW1lbnQuYm9keVxuICBpZiAodHlwZW9mIHRoaXMuZWwgIT09ICdvYmplY3QnKSB0aGlzLmVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLmVsKVxufVxuXG5FbGVtZW50Q2xhc3MucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICB2YXIgZWwgPSB0aGlzLmVsXG4gIGlmICghZWwpIHJldHVyblxuICBpZiAoZWwuY2xhc3NOYW1lID09PSBcIlwiKSByZXR1cm4gZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lXG4gIHZhciBjbGFzc2VzID0gZWwuY2xhc3NOYW1lLnNwbGl0KCcgJylcbiAgaWYgKGNsYXNzZXMuaW5kZXhPZihjbGFzc05hbWUpID4gLTEpIHJldHVybiBjbGFzc2VzXG4gIGNsYXNzZXMucHVzaChjbGFzc05hbWUpXG4gIGVsLmNsYXNzTmFtZSA9IGNsYXNzZXMuam9pbignICcpXG4gIHJldHVybiBjbGFzc2VzXG59XG5cbkVsZW1lbnRDbGFzcy5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gIHZhciBlbCA9IHRoaXMuZWxcbiAgaWYgKCFlbCkgcmV0dXJuXG4gIGlmIChlbC5jbGFzc05hbWUgPT09IFwiXCIpIHJldHVyblxuICB2YXIgY2xhc3NlcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpXG4gIHZhciBpZHggPSBjbGFzc2VzLmluZGV4T2YoY2xhc3NOYW1lKVxuICBpZiAoaWR4ID4gLTEpIGNsYXNzZXMuc3BsaWNlKGlkeCwgMSlcbiAgZWwuY2xhc3NOYW1lID0gY2xhc3Nlcy5qb2luKCcgJylcbiAgcmV0dXJuIGNsYXNzZXNcbn1cblxuRWxlbWVudENsYXNzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihjbGFzc05hbWUpIHtcbiAgdmFyIGVsID0gdGhpcy5lbFxuICBpZiAoIWVsKSByZXR1cm5cbiAgdmFyIGNsYXNzZXMgPSBlbC5jbGFzc05hbWUuc3BsaXQoJyAnKVxuICByZXR1cm4gY2xhc3Nlcy5pbmRleE9mKGNsYXNzTmFtZSkgPiAtMVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKmdsb2JhbHMgSGFuZGxlYmFyczogdHJ1ZSAqL1xudmFyIGJhc2UgPSByZXF1aXJlKFwiLi9oYW5kbGViYXJzL2Jhc2VcIik7XG5cbi8vIEVhY2ggb2YgdGhlc2UgYXVnbWVudCB0aGUgSGFuZGxlYmFycyBvYmplY3QuIE5vIG5lZWQgdG8gc2V0dXAgaGVyZS5cbi8vIChUaGlzIGlzIGRvbmUgdG8gZWFzaWx5IHNoYXJlIGNvZGUgYmV0d2VlbiBjb21tb25qcyBhbmQgYnJvd3NlIGVudnMpXG52YXIgU2FmZVN0cmluZyA9IHJlcXVpcmUoXCIuL2hhbmRsZWJhcnMvc2FmZS1zdHJpbmdcIilbXCJkZWZhdWx0XCJdO1xudmFyIEV4Y2VwdGlvbiA9IHJlcXVpcmUoXCIuL2hhbmRsZWJhcnMvZXhjZXB0aW9uXCIpW1wiZGVmYXVsdFwiXTtcbnZhciBVdGlscyA9IHJlcXVpcmUoXCIuL2hhbmRsZWJhcnMvdXRpbHNcIik7XG52YXIgcnVudGltZSA9IHJlcXVpcmUoXCIuL2hhbmRsZWJhcnMvcnVudGltZVwiKTtcblxuLy8gRm9yIGNvbXBhdGliaWxpdHkgYW5kIHVzYWdlIG91dHNpZGUgb2YgbW9kdWxlIHN5c3RlbXMsIG1ha2UgdGhlIEhhbmRsZWJhcnMgb2JqZWN0IGEgbmFtZXNwYWNlXG52YXIgY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBoYiA9IG5ldyBiYXNlLkhhbmRsZWJhcnNFbnZpcm9ubWVudCgpO1xuXG4gIFV0aWxzLmV4dGVuZChoYiwgYmFzZSk7XG4gIGhiLlNhZmVTdHJpbmcgPSBTYWZlU3RyaW5nO1xuICBoYi5FeGNlcHRpb24gPSBFeGNlcHRpb247XG4gIGhiLlV0aWxzID0gVXRpbHM7XG5cbiAgaGIuVk0gPSBydW50aW1lO1xuICBoYi50ZW1wbGF0ZSA9IGZ1bmN0aW9uKHNwZWMpIHtcbiAgICByZXR1cm4gcnVudGltZS50ZW1wbGF0ZShzcGVjLCBoYik7XG4gIH07XG5cbiAgcmV0dXJuIGhiO1xufTtcblxudmFyIEhhbmRsZWJhcnMgPSBjcmVhdGUoKTtcbkhhbmRsZWJhcnMuY3JlYXRlID0gY3JlYXRlO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IEhhbmRsZWJhcnM7IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgVXRpbHMgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBFeGNlcHRpb24gPSByZXF1aXJlKFwiLi9leGNlcHRpb25cIilbXCJkZWZhdWx0XCJdO1xuXG52YXIgVkVSU0lPTiA9IFwiMS4zLjBcIjtcbmV4cG9ydHMuVkVSU0lPTiA9IFZFUlNJT047dmFyIENPTVBJTEVSX1JFVklTSU9OID0gNDtcbmV4cG9ydHMuQ09NUElMRVJfUkVWSVNJT04gPSBDT01QSUxFUl9SRVZJU0lPTjtcbnZhciBSRVZJU0lPTl9DSEFOR0VTID0ge1xuICAxOiAnPD0gMS4wLnJjLjInLCAvLyAxLjAucmMuMiBpcyBhY3R1YWxseSByZXYyIGJ1dCBkb2Vzbid0IHJlcG9ydCBpdFxuICAyOiAnPT0gMS4wLjAtcmMuMycsXG4gIDM6ICc9PSAxLjAuMC1yYy40JyxcbiAgNDogJz49IDEuMC4wJ1xufTtcbmV4cG9ydHMuUkVWSVNJT05fQ0hBTkdFUyA9IFJFVklTSU9OX0NIQU5HRVM7XG52YXIgaXNBcnJheSA9IFV0aWxzLmlzQXJyYXksXG4gICAgaXNGdW5jdGlvbiA9IFV0aWxzLmlzRnVuY3Rpb24sXG4gICAgdG9TdHJpbmcgPSBVdGlscy50b1N0cmluZyxcbiAgICBvYmplY3RUeXBlID0gJ1tvYmplY3QgT2JqZWN0XSc7XG5cbmZ1bmN0aW9uIEhhbmRsZWJhcnNFbnZpcm9ubWVudChoZWxwZXJzLCBwYXJ0aWFscykge1xuICB0aGlzLmhlbHBlcnMgPSBoZWxwZXJzIHx8IHt9O1xuICB0aGlzLnBhcnRpYWxzID0gcGFydGlhbHMgfHwge307XG5cbiAgcmVnaXN0ZXJEZWZhdWx0SGVscGVycyh0aGlzKTtcbn1cblxuZXhwb3J0cy5IYW5kbGViYXJzRW52aXJvbm1lbnQgPSBIYW5kbGViYXJzRW52aXJvbm1lbnQ7SGFuZGxlYmFyc0Vudmlyb25tZW50LnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IEhhbmRsZWJhcnNFbnZpcm9ubWVudCxcblxuICBsb2dnZXI6IGxvZ2dlcixcbiAgbG9nOiBsb2csXG5cbiAgcmVnaXN0ZXJIZWxwZXI6IGZ1bmN0aW9uKG5hbWUsIGZuLCBpbnZlcnNlKSB7XG4gICAgaWYgKHRvU3RyaW5nLmNhbGwobmFtZSkgPT09IG9iamVjdFR5cGUpIHtcbiAgICAgIGlmIChpbnZlcnNlIHx8IGZuKSB7IHRocm93IG5ldyBFeGNlcHRpb24oJ0FyZyBub3Qgc3VwcG9ydGVkIHdpdGggbXVsdGlwbGUgaGVscGVycycpOyB9XG4gICAgICBVdGlscy5leHRlbmQodGhpcy5oZWxwZXJzLCBuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGludmVyc2UpIHsgZm4ubm90ID0gaW52ZXJzZTsgfVxuICAgICAgdGhpcy5oZWxwZXJzW25hbWVdID0gZm47XG4gICAgfVxuICB9LFxuXG4gIHJlZ2lzdGVyUGFydGlhbDogZnVuY3Rpb24obmFtZSwgc3RyKSB7XG4gICAgaWYgKHRvU3RyaW5nLmNhbGwobmFtZSkgPT09IG9iamVjdFR5cGUpIHtcbiAgICAgIFV0aWxzLmV4dGVuZCh0aGlzLnBhcnRpYWxzLCAgbmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucGFydGlhbHNbbmFtZV0gPSBzdHI7XG4gICAgfVxuICB9XG59O1xuXG5mdW5jdGlvbiByZWdpc3RlckRlZmF1bHRIZWxwZXJzKGluc3RhbmNlKSB7XG4gIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdoZWxwZXJNaXNzaW5nJywgZnVuY3Rpb24oYXJnKSB7XG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEV4Y2VwdGlvbihcIk1pc3NpbmcgaGVscGVyOiAnXCIgKyBhcmcgKyBcIidcIik7XG4gICAgfVxuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignYmxvY2tIZWxwZXJNaXNzaW5nJywgZnVuY3Rpb24oY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBpbnZlcnNlID0gb3B0aW9ucy5pbnZlcnNlIHx8IGZ1bmN0aW9uKCkge30sIGZuID0gb3B0aW9ucy5mbjtcblxuICAgIGlmIChpc0Z1bmN0aW9uKGNvbnRleHQpKSB7IGNvbnRleHQgPSBjb250ZXh0LmNhbGwodGhpcyk7IH1cblxuICAgIGlmKGNvbnRleHQgPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBmbih0aGlzKTtcbiAgICB9IGVsc2UgaWYoY29udGV4dCA9PT0gZmFsc2UgfHwgY29udGV4dCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gaW52ZXJzZSh0aGlzKTtcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkoY29udGV4dCkpIHtcbiAgICAgIGlmKGNvbnRleHQubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gaW5zdGFuY2UuaGVscGVycy5lYWNoKGNvbnRleHQsIG9wdGlvbnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGludmVyc2UodGhpcyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmbihjb250ZXh0KTtcbiAgICB9XG4gIH0pO1xuXG4gIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdlYWNoJywgZnVuY3Rpb24oY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBmbiA9IG9wdGlvbnMuZm4sIGludmVyc2UgPSBvcHRpb25zLmludmVyc2U7XG4gICAgdmFyIGkgPSAwLCByZXQgPSBcIlwiLCBkYXRhO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oY29udGV4dCkpIHsgY29udGV4dCA9IGNvbnRleHQuY2FsbCh0aGlzKTsgfVxuXG4gICAgaWYgKG9wdGlvbnMuZGF0YSkge1xuICAgICAgZGF0YSA9IGNyZWF0ZUZyYW1lKG9wdGlvbnMuZGF0YSk7XG4gICAgfVxuXG4gICAgaWYoY29udGV4dCAmJiB0eXBlb2YgY29udGV4dCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGlmIChpc0FycmF5KGNvbnRleHQpKSB7XG4gICAgICAgIGZvcih2YXIgaiA9IGNvbnRleHQubGVuZ3RoOyBpPGo7IGkrKykge1xuICAgICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICBkYXRhLmluZGV4ID0gaTtcbiAgICAgICAgICAgIGRhdGEuZmlyc3QgPSAoaSA9PT0gMCk7XG4gICAgICAgICAgICBkYXRhLmxhc3QgID0gKGkgPT09IChjb250ZXh0Lmxlbmd0aC0xKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldCA9IHJldCArIGZuKGNvbnRleHRbaV0sIHsgZGF0YTogZGF0YSB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yKHZhciBrZXkgaW4gY29udGV4dCkge1xuICAgICAgICAgIGlmKGNvbnRleHQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgaWYoZGF0YSkgeyBcbiAgICAgICAgICAgICAgZGF0YS5rZXkgPSBrZXk7IFxuICAgICAgICAgICAgICBkYXRhLmluZGV4ID0gaTtcbiAgICAgICAgICAgICAgZGF0YS5maXJzdCA9IChpID09PSAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldCA9IHJldCArIGZuKGNvbnRleHRba2V5XSwge2RhdGE6IGRhdGF9KTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZihpID09PSAwKXtcbiAgICAgIHJldCA9IGludmVyc2UodGhpcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldDtcbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2lmJywgZnVuY3Rpb24oY29uZGl0aW9uYWwsIG9wdGlvbnMpIHtcbiAgICBpZiAoaXNGdW5jdGlvbihjb25kaXRpb25hbCkpIHsgY29uZGl0aW9uYWwgPSBjb25kaXRpb25hbC5jYWxsKHRoaXMpOyB9XG5cbiAgICAvLyBEZWZhdWx0IGJlaGF2aW9yIGlzIHRvIHJlbmRlciB0aGUgcG9zaXRpdmUgcGF0aCBpZiB0aGUgdmFsdWUgaXMgdHJ1dGh5IGFuZCBub3QgZW1wdHkuXG4gICAgLy8gVGhlIGBpbmNsdWRlWmVyb2Agb3B0aW9uIG1heSBiZSBzZXQgdG8gdHJlYXQgdGhlIGNvbmR0aW9uYWwgYXMgcHVyZWx5IG5vdCBlbXB0eSBiYXNlZCBvbiB0aGVcbiAgICAvLyBiZWhhdmlvciBvZiBpc0VtcHR5LiBFZmZlY3RpdmVseSB0aGlzIGRldGVybWluZXMgaWYgMCBpcyBoYW5kbGVkIGJ5IHRoZSBwb3NpdGl2ZSBwYXRoIG9yIG5lZ2F0aXZlLlxuICAgIGlmICgoIW9wdGlvbnMuaGFzaC5pbmNsdWRlWmVybyAmJiAhY29uZGl0aW9uYWwpIHx8IFV0aWxzLmlzRW1wdHkoY29uZGl0aW9uYWwpKSB7XG4gICAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlKHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gb3B0aW9ucy5mbih0aGlzKTtcbiAgICB9XG4gIH0pO1xuXG4gIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCd1bmxlc3MnLCBmdW5jdGlvbihjb25kaXRpb25hbCwgb3B0aW9ucykge1xuICAgIHJldHVybiBpbnN0YW5jZS5oZWxwZXJzWydpZiddLmNhbGwodGhpcywgY29uZGl0aW9uYWwsIHtmbjogb3B0aW9ucy5pbnZlcnNlLCBpbnZlcnNlOiBvcHRpb25zLmZuLCBoYXNoOiBvcHRpb25zLmhhc2h9KTtcbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ3dpdGgnLCBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24oY29udGV4dCkpIHsgY29udGV4dCA9IGNvbnRleHQuY2FsbCh0aGlzKTsgfVxuXG4gICAgaWYgKCFVdGlscy5pc0VtcHR5KGNvbnRleHQpKSByZXR1cm4gb3B0aW9ucy5mbihjb250ZXh0KTtcbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2xvZycsIGZ1bmN0aW9uKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICB2YXIgbGV2ZWwgPSBvcHRpb25zLmRhdGEgJiYgb3B0aW9ucy5kYXRhLmxldmVsICE9IG51bGwgPyBwYXJzZUludChvcHRpb25zLmRhdGEubGV2ZWwsIDEwKSA6IDE7XG4gICAgaW5zdGFuY2UubG9nKGxldmVsLCBjb250ZXh0KTtcbiAgfSk7XG59XG5cbnZhciBsb2dnZXIgPSB7XG4gIG1ldGhvZE1hcDogeyAwOiAnZGVidWcnLCAxOiAnaW5mbycsIDI6ICd3YXJuJywgMzogJ2Vycm9yJyB9LFxuXG4gIC8vIFN0YXRlIGVudW1cbiAgREVCVUc6IDAsXG4gIElORk86IDEsXG4gIFdBUk46IDIsXG4gIEVSUk9SOiAzLFxuICBsZXZlbDogMyxcblxuICAvLyBjYW4gYmUgb3ZlcnJpZGRlbiBpbiB0aGUgaG9zdCBlbnZpcm9ubWVudFxuICBsb2c6IGZ1bmN0aW9uKGxldmVsLCBvYmopIHtcbiAgICBpZiAobG9nZ2VyLmxldmVsIDw9IGxldmVsKSB7XG4gICAgICB2YXIgbWV0aG9kID0gbG9nZ2VyLm1ldGhvZE1hcFtsZXZlbF07XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmIGNvbnNvbGVbbWV0aG9kXSkge1xuICAgICAgICBjb25zb2xlW21ldGhvZF0uY2FsbChjb25zb2xlLCBvYmopO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcbmV4cG9ydHMubG9nZ2VyID0gbG9nZ2VyO1xuZnVuY3Rpb24gbG9nKGxldmVsLCBvYmopIHsgbG9nZ2VyLmxvZyhsZXZlbCwgb2JqKTsgfVxuXG5leHBvcnRzLmxvZyA9IGxvZzt2YXIgY3JlYXRlRnJhbWUgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgdmFyIG9iaiA9IHt9O1xuICBVdGlscy5leHRlbmQob2JqLCBvYmplY3QpO1xuICByZXR1cm4gb2JqO1xufTtcbmV4cG9ydHMuY3JlYXRlRnJhbWUgPSBjcmVhdGVGcmFtZTsiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGVycm9yUHJvcHMgPSBbJ2Rlc2NyaXB0aW9uJywgJ2ZpbGVOYW1lJywgJ2xpbmVOdW1iZXInLCAnbWVzc2FnZScsICduYW1lJywgJ251bWJlcicsICdzdGFjayddO1xuXG5mdW5jdGlvbiBFeGNlcHRpb24obWVzc2FnZSwgbm9kZSkge1xuICB2YXIgbGluZTtcbiAgaWYgKG5vZGUgJiYgbm9kZS5maXJzdExpbmUpIHtcbiAgICBsaW5lID0gbm9kZS5maXJzdExpbmU7XG5cbiAgICBtZXNzYWdlICs9ICcgLSAnICsgbGluZSArICc6JyArIG5vZGUuZmlyc3RDb2x1bW47XG4gIH1cblxuICB2YXIgdG1wID0gRXJyb3IucHJvdG90eXBlLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgbWVzc2FnZSk7XG5cbiAgLy8gVW5mb3J0dW5hdGVseSBlcnJvcnMgYXJlIG5vdCBlbnVtZXJhYmxlIGluIENocm9tZSAoYXQgbGVhc3QpLCBzbyBgZm9yIHByb3AgaW4gdG1wYCBkb2Vzbid0IHdvcmsuXG4gIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IGVycm9yUHJvcHMubGVuZ3RoOyBpZHgrKykge1xuICAgIHRoaXNbZXJyb3JQcm9wc1tpZHhdXSA9IHRtcFtlcnJvclByb3BzW2lkeF1dO1xuICB9XG5cbiAgaWYgKGxpbmUpIHtcbiAgICB0aGlzLmxpbmVOdW1iZXIgPSBsaW5lO1xuICAgIHRoaXMuY29sdW1uID0gbm9kZS5maXJzdENvbHVtbjtcbiAgfVxufVxuXG5FeGNlcHRpb24ucHJvdG90eXBlID0gbmV3IEVycm9yKCk7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gRXhjZXB0aW9uOyIsIlwidXNlIHN0cmljdFwiO1xudmFyIFV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgRXhjZXB0aW9uID0gcmVxdWlyZShcIi4vZXhjZXB0aW9uXCIpW1wiZGVmYXVsdFwiXTtcbnZhciBDT01QSUxFUl9SRVZJU0lPTiA9IHJlcXVpcmUoXCIuL2Jhc2VcIikuQ09NUElMRVJfUkVWSVNJT047XG52YXIgUkVWSVNJT05fQ0hBTkdFUyA9IHJlcXVpcmUoXCIuL2Jhc2VcIikuUkVWSVNJT05fQ0hBTkdFUztcblxuZnVuY3Rpb24gY2hlY2tSZXZpc2lvbihjb21waWxlckluZm8pIHtcbiAgdmFyIGNvbXBpbGVyUmV2aXNpb24gPSBjb21waWxlckluZm8gJiYgY29tcGlsZXJJbmZvWzBdIHx8IDEsXG4gICAgICBjdXJyZW50UmV2aXNpb24gPSBDT01QSUxFUl9SRVZJU0lPTjtcblxuICBpZiAoY29tcGlsZXJSZXZpc2lvbiAhPT0gY3VycmVudFJldmlzaW9uKSB7XG4gICAgaWYgKGNvbXBpbGVyUmV2aXNpb24gPCBjdXJyZW50UmV2aXNpb24pIHtcbiAgICAgIHZhciBydW50aW1lVmVyc2lvbnMgPSBSRVZJU0lPTl9DSEFOR0VTW2N1cnJlbnRSZXZpc2lvbl0sXG4gICAgICAgICAgY29tcGlsZXJWZXJzaW9ucyA9IFJFVklTSU9OX0NIQU5HRVNbY29tcGlsZXJSZXZpc2lvbl07XG4gICAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwiVGVtcGxhdGUgd2FzIHByZWNvbXBpbGVkIHdpdGggYW4gb2xkZXIgdmVyc2lvbiBvZiBIYW5kbGViYXJzIHRoYW4gdGhlIGN1cnJlbnQgcnVudGltZS4gXCIrXG4gICAgICAgICAgICBcIlBsZWFzZSB1cGRhdGUgeW91ciBwcmVjb21waWxlciB0byBhIG5ld2VyIHZlcnNpb24gKFwiK3J1bnRpbWVWZXJzaW9ucytcIikgb3IgZG93bmdyYWRlIHlvdXIgcnVudGltZSB0byBhbiBvbGRlciB2ZXJzaW9uIChcIitjb21waWxlclZlcnNpb25zK1wiKS5cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFVzZSB0aGUgZW1iZWRkZWQgdmVyc2lvbiBpbmZvIHNpbmNlIHRoZSBydW50aW1lIGRvZXNuJ3Qga25vdyBhYm91dCB0aGlzIHJldmlzaW9uIHlldFxuICAgICAgdGhyb3cgbmV3IEV4Y2VwdGlvbihcIlRlbXBsYXRlIHdhcyBwcmVjb21waWxlZCB3aXRoIGEgbmV3ZXIgdmVyc2lvbiBvZiBIYW5kbGViYXJzIHRoYW4gdGhlIGN1cnJlbnQgcnVudGltZS4gXCIrXG4gICAgICAgICAgICBcIlBsZWFzZSB1cGRhdGUgeW91ciBydW50aW1lIHRvIGEgbmV3ZXIgdmVyc2lvbiAoXCIrY29tcGlsZXJJbmZvWzFdK1wiKS5cIik7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydHMuY2hlY2tSZXZpc2lvbiA9IGNoZWNrUmV2aXNpb247Ly8gVE9ETzogUmVtb3ZlIHRoaXMgbGluZSBhbmQgYnJlYWsgdXAgY29tcGlsZVBhcnRpYWxcblxuZnVuY3Rpb24gdGVtcGxhdGUodGVtcGxhdGVTcGVjLCBlbnYpIHtcbiAgaWYgKCFlbnYpIHtcbiAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFwiTm8gZW52aXJvbm1lbnQgcGFzc2VkIHRvIHRlbXBsYXRlXCIpO1xuICB9XG5cbiAgLy8gTm90ZTogVXNpbmcgZW52LlZNIHJlZmVyZW5jZXMgcmF0aGVyIHRoYW4gbG9jYWwgdmFyIHJlZmVyZW5jZXMgdGhyb3VnaG91dCB0aGlzIHNlY3Rpb24gdG8gYWxsb3dcbiAgLy8gZm9yIGV4dGVybmFsIHVzZXJzIHRvIG92ZXJyaWRlIHRoZXNlIGFzIHBzdWVkby1zdXBwb3J0ZWQgQVBJcy5cbiAgdmFyIGludm9rZVBhcnRpYWxXcmFwcGVyID0gZnVuY3Rpb24ocGFydGlhbCwgbmFtZSwgY29udGV4dCwgaGVscGVycywgcGFydGlhbHMsIGRhdGEpIHtcbiAgICB2YXIgcmVzdWx0ID0gZW52LlZNLmludm9rZVBhcnRpYWwuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBpZiAocmVzdWx0ICE9IG51bGwpIHsgcmV0dXJuIHJlc3VsdDsgfVxuXG4gICAgaWYgKGVudi5jb21waWxlKSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IHsgaGVscGVyczogaGVscGVycywgcGFydGlhbHM6IHBhcnRpYWxzLCBkYXRhOiBkYXRhIH07XG4gICAgICBwYXJ0aWFsc1tuYW1lXSA9IGVudi5jb21waWxlKHBhcnRpYWwsIHsgZGF0YTogZGF0YSAhPT0gdW5kZWZpbmVkIH0sIGVudik7XG4gICAgICByZXR1cm4gcGFydGlhbHNbbmFtZV0oY29udGV4dCwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFeGNlcHRpb24oXCJUaGUgcGFydGlhbCBcIiArIG5hbWUgKyBcIiBjb3VsZCBub3QgYmUgY29tcGlsZWQgd2hlbiBydW5uaW5nIGluIHJ1bnRpbWUtb25seSBtb2RlXCIpO1xuICAgIH1cbiAgfTtcblxuICAvLyBKdXN0IGFkZCB3YXRlclxuICB2YXIgY29udGFpbmVyID0ge1xuICAgIGVzY2FwZUV4cHJlc3Npb246IFV0aWxzLmVzY2FwZUV4cHJlc3Npb24sXG4gICAgaW52b2tlUGFydGlhbDogaW52b2tlUGFydGlhbFdyYXBwZXIsXG4gICAgcHJvZ3JhbXM6IFtdLFxuICAgIHByb2dyYW06IGZ1bmN0aW9uKGksIGZuLCBkYXRhKSB7XG4gICAgICB2YXIgcHJvZ3JhbVdyYXBwZXIgPSB0aGlzLnByb2dyYW1zW2ldO1xuICAgICAgaWYoZGF0YSkge1xuICAgICAgICBwcm9ncmFtV3JhcHBlciA9IHByb2dyYW0oaSwgZm4sIGRhdGEpO1xuICAgICAgfSBlbHNlIGlmICghcHJvZ3JhbVdyYXBwZXIpIHtcbiAgICAgICAgcHJvZ3JhbVdyYXBwZXIgPSB0aGlzLnByb2dyYW1zW2ldID0gcHJvZ3JhbShpLCBmbik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcHJvZ3JhbVdyYXBwZXI7XG4gICAgfSxcbiAgICBtZXJnZTogZnVuY3Rpb24ocGFyYW0sIGNvbW1vbikge1xuICAgICAgdmFyIHJldCA9IHBhcmFtIHx8IGNvbW1vbjtcblxuICAgICAgaWYgKHBhcmFtICYmIGNvbW1vbiAmJiAocGFyYW0gIT09IGNvbW1vbikpIHtcbiAgICAgICAgcmV0ID0ge307XG4gICAgICAgIFV0aWxzLmV4dGVuZChyZXQsIGNvbW1vbik7XG4gICAgICAgIFV0aWxzLmV4dGVuZChyZXQsIHBhcmFtKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXQ7XG4gICAgfSxcbiAgICBwcm9ncmFtV2l0aERlcHRoOiBlbnYuVk0ucHJvZ3JhbVdpdGhEZXB0aCxcbiAgICBub29wOiBlbnYuVk0ubm9vcCxcbiAgICBjb21waWxlckluZm86IG51bGxcbiAgfTtcblxuICByZXR1cm4gZnVuY3Rpb24oY29udGV4dCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHZhciBuYW1lc3BhY2UgPSBvcHRpb25zLnBhcnRpYWwgPyBvcHRpb25zIDogZW52LFxuICAgICAgICBoZWxwZXJzLFxuICAgICAgICBwYXJ0aWFscztcblxuICAgIGlmICghb3B0aW9ucy5wYXJ0aWFsKSB7XG4gICAgICBoZWxwZXJzID0gb3B0aW9ucy5oZWxwZXJzO1xuICAgICAgcGFydGlhbHMgPSBvcHRpb25zLnBhcnRpYWxzO1xuICAgIH1cbiAgICB2YXIgcmVzdWx0ID0gdGVtcGxhdGVTcGVjLmNhbGwoXG4gICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgIG5hbWVzcGFjZSwgY29udGV4dCxcbiAgICAgICAgICBoZWxwZXJzLFxuICAgICAgICAgIHBhcnRpYWxzLFxuICAgICAgICAgIG9wdGlvbnMuZGF0YSk7XG5cbiAgICBpZiAoIW9wdGlvbnMucGFydGlhbCkge1xuICAgICAgZW52LlZNLmNoZWNrUmV2aXNpb24oY29udGFpbmVyLmNvbXBpbGVySW5mbyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn1cblxuZXhwb3J0cy50ZW1wbGF0ZSA9IHRlbXBsYXRlO2Z1bmN0aW9uIHByb2dyYW1XaXRoRGVwdGgoaSwgZm4sIGRhdGEgLyosICRkZXB0aCAqLykge1xuICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMyk7XG5cbiAgdmFyIHByb2cgPSBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgW2NvbnRleHQsIG9wdGlvbnMuZGF0YSB8fCBkYXRhXS5jb25jYXQoYXJncykpO1xuICB9O1xuICBwcm9nLnByb2dyYW0gPSBpO1xuICBwcm9nLmRlcHRoID0gYXJncy5sZW5ndGg7XG4gIHJldHVybiBwcm9nO1xufVxuXG5leHBvcnRzLnByb2dyYW1XaXRoRGVwdGggPSBwcm9ncmFtV2l0aERlcHRoO2Z1bmN0aW9uIHByb2dyYW0oaSwgZm4sIGRhdGEpIHtcbiAgdmFyIHByb2cgPSBmdW5jdGlvbihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICByZXR1cm4gZm4oY29udGV4dCwgb3B0aW9ucy5kYXRhIHx8IGRhdGEpO1xuICB9O1xuICBwcm9nLnByb2dyYW0gPSBpO1xuICBwcm9nLmRlcHRoID0gMDtcbiAgcmV0dXJuIHByb2c7XG59XG5cbmV4cG9ydHMucHJvZ3JhbSA9IHByb2dyYW07ZnVuY3Rpb24gaW52b2tlUGFydGlhbChwYXJ0aWFsLCBuYW1lLCBjb250ZXh0LCBoZWxwZXJzLCBwYXJ0aWFscywgZGF0YSkge1xuICB2YXIgb3B0aW9ucyA9IHsgcGFydGlhbDogdHJ1ZSwgaGVscGVyczogaGVscGVycywgcGFydGlhbHM6IHBhcnRpYWxzLCBkYXRhOiBkYXRhIH07XG5cbiAgaWYocGFydGlhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEV4Y2VwdGlvbihcIlRoZSBwYXJ0aWFsIFwiICsgbmFtZSArIFwiIGNvdWxkIG5vdCBiZSBmb3VuZFwiKTtcbiAgfSBlbHNlIGlmKHBhcnRpYWwgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgIHJldHVybiBwYXJ0aWFsKGNvbnRleHQsIG9wdGlvbnMpO1xuICB9XG59XG5cbmV4cG9ydHMuaW52b2tlUGFydGlhbCA9IGludm9rZVBhcnRpYWw7ZnVuY3Rpb24gbm9vcCgpIHsgcmV0dXJuIFwiXCI7IH1cblxuZXhwb3J0cy5ub29wID0gbm9vcDsiLCJcInVzZSBzdHJpY3RcIjtcbi8vIEJ1aWxkIG91dCBvdXIgYmFzaWMgU2FmZVN0cmluZyB0eXBlXG5mdW5jdGlvbiBTYWZlU3RyaW5nKHN0cmluZykge1xuICB0aGlzLnN0cmluZyA9IHN0cmluZztcbn1cblxuU2FmZVN0cmluZy5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFwiXCIgKyB0aGlzLnN0cmluZztcbn07XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gU2FmZVN0cmluZzsiLCJcInVzZSBzdHJpY3RcIjtcbi8qanNoaW50IC1XMDA0ICovXG52YXIgU2FmZVN0cmluZyA9IHJlcXVpcmUoXCIuL3NhZmUtc3RyaW5nXCIpW1wiZGVmYXVsdFwiXTtcblxudmFyIGVzY2FwZSA9IHtcbiAgXCImXCI6IFwiJmFtcDtcIixcbiAgXCI8XCI6IFwiJmx0O1wiLFxuICBcIj5cIjogXCImZ3Q7XCIsXG4gICdcIic6IFwiJnF1b3Q7XCIsXG4gIFwiJ1wiOiBcIiYjeDI3O1wiLFxuICBcImBcIjogXCImI3g2MDtcIlxufTtcblxudmFyIGJhZENoYXJzID0gL1smPD5cIidgXS9nO1xudmFyIHBvc3NpYmxlID0gL1smPD5cIidgXS87XG5cbmZ1bmN0aW9uIGVzY2FwZUNoYXIoY2hyKSB7XG4gIHJldHVybiBlc2NhcGVbY2hyXSB8fCBcIiZhbXA7XCI7XG59XG5cbmZ1bmN0aW9uIGV4dGVuZChvYmosIHZhbHVlKSB7XG4gIGZvcih2YXIga2V5IGluIHZhbHVlKSB7XG4gICAgaWYoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCBrZXkpKSB7XG4gICAgICBvYmpba2V5XSA9IHZhbHVlW2tleV07XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydHMuZXh0ZW5kID0gZXh0ZW5kO3ZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5leHBvcnRzLnRvU3RyaW5nID0gdG9TdHJpbmc7XG4vLyBTb3VyY2VkIGZyb20gbG9kYXNoXG4vLyBodHRwczovL2dpdGh1Yi5jb20vYmVzdGllanMvbG9kYXNoL2Jsb2IvbWFzdGVyL0xJQ0VOU0UudHh0XG52YXIgaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbic7XG59O1xuLy8gZmFsbGJhY2sgZm9yIG9sZGVyIHZlcnNpb25zIG9mIENocm9tZSBhbmQgU2FmYXJpXG5pZiAoaXNGdW5jdGlvbigveC8pKSB7XG4gIGlzRnVuY3Rpb24gPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgJiYgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG4gIH07XG59XG52YXIgaXNGdW5jdGlvbjtcbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSA/IHRvU3RyaW5nLmNhbGwodmFsdWUpID09PSAnW29iamVjdCBBcnJheV0nIDogZmFsc2U7XG59O1xuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gZXNjYXBlRXhwcmVzc2lvbihzdHJpbmcpIHtcbiAgLy8gZG9uJ3QgZXNjYXBlIFNhZmVTdHJpbmdzLCBzaW5jZSB0aGV5J3JlIGFscmVhZHkgc2FmZVxuICBpZiAoc3RyaW5nIGluc3RhbmNlb2YgU2FmZVN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcudG9TdHJpbmcoKTtcbiAgfSBlbHNlIGlmICghc3RyaW5nICYmIHN0cmluZyAhPT0gMCkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG5cbiAgLy8gRm9yY2UgYSBzdHJpbmcgY29udmVyc2lvbiBhcyB0aGlzIHdpbGwgYmUgZG9uZSBieSB0aGUgYXBwZW5kIHJlZ2FyZGxlc3MgYW5kXG4gIC8vIHRoZSByZWdleCB0ZXN0IHdpbGwgZG8gdGhpcyB0cmFuc3BhcmVudGx5IGJlaGluZCB0aGUgc2NlbmVzLCBjYXVzaW5nIGlzc3VlcyBpZlxuICAvLyBhbiBvYmplY3QncyB0byBzdHJpbmcgaGFzIGVzY2FwZWQgY2hhcmFjdGVycyBpbiBpdC5cbiAgc3RyaW5nID0gXCJcIiArIHN0cmluZztcblxuICBpZighcG9zc2libGUudGVzdChzdHJpbmcpKSB7IHJldHVybiBzdHJpbmc7IH1cbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKGJhZENoYXJzLCBlc2NhcGVDaGFyKTtcbn1cblxuZXhwb3J0cy5lc2NhcGVFeHByZXNzaW9uID0gZXNjYXBlRXhwcmVzc2lvbjtmdW5jdGlvbiBpc0VtcHR5KHZhbHVlKSB7XG4gIGlmICghdmFsdWUgJiYgdmFsdWUgIT09IDApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmIChpc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0cy5pc0VtcHR5ID0gaXNFbXB0eTsiLCIvLyBDcmVhdGUgYSBzaW1wbGUgcGF0aCBhbGlhcyB0byBhbGxvdyBicm93c2VyaWZ5IHRvIHJlc29sdmVcbi8vIHRoZSBydW50aW1lIG9uIGEgc3VwcG9ydGVkIHBhdGguXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGlzdC9janMvaGFuZGxlYmFycy5ydW50aW1lJyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJoYW5kbGViYXJzL3J1bnRpbWVcIilbXCJkZWZhdWx0XCJdO1xuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXNcbiAqL1xuXG52YXIgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCdqc29ucCcpO1xuXG4vKipcbiAqIE1vZHVsZSBleHBvcnRzLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0ganNvbnA7XG5cbi8qKlxuICogQ2FsbGJhY2sgaW5kZXguXG4gKi9cblxudmFyIGNvdW50ID0gMDtcblxuLyoqXG4gKiBOb29wIGZ1bmN0aW9uLlxuICovXG5cbmZ1bmN0aW9uIG5vb3AoKXt9O1xuXG4vKipcbiAqIEpTT05QIGhhbmRsZXJcbiAqXG4gKiBPcHRpb25zOlxuICogIC0gcGFyYW0ge1N0cmluZ30gcXMgcGFyYW1ldGVyIChgY2FsbGJhY2tgKVxuICogIC0gdGltZW91dCB7TnVtYmVyfSBob3cgbG9uZyBhZnRlciBhIHRpbWVvdXQgZXJyb3IgaXMgZW1pdHRlZCAoYDYwMDAwYClcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcGFyYW0ge09iamVjdHxGdW5jdGlvbn0gb3B0aW9uYWwgb3B0aW9ucyAvIGNhbGxiYWNrXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBvcHRpb25hbCBjYWxsYmFja1xuICovXG5cbmZ1bmN0aW9uIGpzb25wKHVybCwgb3B0cywgZm4pe1xuICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlb2Ygb3B0cykge1xuICAgIGZuID0gb3B0cztcbiAgICBvcHRzID0ge307XG4gIH1cblxuICB2YXIgb3B0cyA9IG9wdHMgfHwge307XG4gIHZhciBwYXJhbSA9IG9wdHMucGFyYW0gfHwgJ2NhbGxiYWNrJztcbiAgdmFyIHRpbWVvdXQgPSBudWxsICE9IG9wdHMudGltZW91dCA/IG9wdHMudGltZW91dCA6IDYwMDAwO1xuICB2YXIgZW5jID0gZW5jb2RlVVJJQ29tcG9uZW50O1xuICB2YXIgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpWzBdO1xuICB2YXIgc2NyaXB0O1xuICB2YXIgdGltZXI7XG5cbiAgLy8gZ2VuZXJhdGUgYSB1bmlxdWUgaWQgZm9yIHRoaXMgcmVxdWVzdFxuICB2YXIgaWQgPSBjb3VudCsrO1xuXG4gIGlmICh0aW1lb3V0KSB7XG4gICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBjbGVhbnVwKCk7XG4gICAgICBmbiAmJiBmbihuZXcgRXJyb3IoJ1RpbWVvdXQnKSk7XG4gICAgfSwgdGltZW91dCk7XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhbnVwKCl7XG4gICAgdGFyZ2V0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcbiAgICB3aW5kb3dbJ19fanAnICsgaWRdID0gbm9vcDtcbiAgfVxuXG4gIHdpbmRvd1snX19qcCcgKyBpZF0gPSBmdW5jdGlvbihkYXRhKXtcbiAgICBkZWJ1ZygnanNvbnAgZ290JywgZGF0YSk7XG4gICAgaWYgKHRpbWVyKSBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIGNsZWFudXAoKTtcbiAgICBmbiAmJiBmbihudWxsLCBkYXRhKTtcbiAgfTtcblxuICAvLyBhZGQgcXMgY29tcG9uZW50XG4gIHVybCArPSAofnVybC5pbmRleE9mKCc/JykgPyAnJicgOiAnPycpICsgcGFyYW0gKyAnPScgKyBlbmMoJ19fanAnICsgaWQgKyAnJyk7XG4gIHVybCA9IHVybC5yZXBsYWNlKCc/JicsICc/Jyk7XG5cbiAgZGVidWcoJ2pzb25wIHJlcSBcIiVzXCInLCB1cmwpO1xuXG4gIC8vIGNyZWF0ZSBzY3JpcHRcbiAgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gIHNjcmlwdC5zcmMgPSB1cmw7XG4gIHRhcmdldC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShzY3JpcHQsIHRhcmdldCk7XG59O1xuIiwiXG4vKipcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRlYnVnO1xuXG4vKipcbiAqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7VHlwZX1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGVidWcobmFtZSkge1xuICBpZiAoIWRlYnVnLmVuYWJsZWQobmFtZSkpIHJldHVybiBmdW5jdGlvbigpe307XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGZtdCl7XG4gICAgZm10ID0gY29lcmNlKGZtdCk7XG5cbiAgICB2YXIgY3VyciA9IG5ldyBEYXRlO1xuICAgIHZhciBtcyA9IGN1cnIgLSAoZGVidWdbbmFtZV0gfHwgY3Vycik7XG4gICAgZGVidWdbbmFtZV0gPSBjdXJyO1xuXG4gICAgZm10ID0gbmFtZVxuICAgICAgKyAnICdcbiAgICAgICsgZm10XG4gICAgICArICcgKycgKyBkZWJ1Zy5odW1hbml6ZShtcyk7XG5cbiAgICAvLyBUaGlzIGhhY2tlcnkgaXMgcmVxdWlyZWQgZm9yIElFOFxuICAgIC8vIHdoZXJlIGBjb25zb2xlLmxvZ2AgZG9lc24ndCBoYXZlICdhcHBseSdcbiAgICB3aW5kb3cuY29uc29sZVxuICAgICAgJiYgY29uc29sZS5sb2dcbiAgICAgICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlLCBhcmd1bWVudHMpO1xuICB9XG59XG5cbi8qKlxuICogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcy5cbiAqL1xuXG5kZWJ1Zy5uYW1lcyA9IFtdO1xuZGVidWcuc2tpcHMgPSBbXTtcblxuLyoqXG4gKiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG4gKiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmRlYnVnLmVuYWJsZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgdHJ5IHtcbiAgICBsb2NhbFN0b3JhZ2UuZGVidWcgPSBuYW1lO1xuICB9IGNhdGNoKGUpe31cblxuICB2YXIgc3BsaXQgPSAobmFtZSB8fCAnJykuc3BsaXQoL1tcXHMsXSsvKVxuICAgICwgbGVuID0gc3BsaXQubGVuZ3RoO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBuYW1lID0gc3BsaXRbaV0ucmVwbGFjZSgnKicsICcuKj8nKTtcbiAgICBpZiAobmFtZVswXSA9PT0gJy0nKSB7XG4gICAgICBkZWJ1Zy5za2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZS5zdWJzdHIoMSkgKyAnJCcpKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBkZWJ1Zy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZSArICckJykpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmRlYnVnLmRpc2FibGUgPSBmdW5jdGlvbigpe1xuICBkZWJ1Zy5lbmFibGUoJycpO1xufTtcblxuLyoqXG4gKiBIdW1hbml6ZSB0aGUgZ2l2ZW4gYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbVxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZGVidWcuaHVtYW5pemUgPSBmdW5jdGlvbihtcykge1xuICB2YXIgc2VjID0gMTAwMFxuICAgICwgbWluID0gNjAgKiAxMDAwXG4gICAgLCBob3VyID0gNjAgKiBtaW47XG5cbiAgaWYgKG1zID49IGhvdXIpIHJldHVybiAobXMgLyBob3VyKS50b0ZpeGVkKDEpICsgJ2gnO1xuICBpZiAobXMgPj0gbWluKSByZXR1cm4gKG1zIC8gbWluKS50b0ZpeGVkKDEpICsgJ20nO1xuICBpZiAobXMgPj0gc2VjKSByZXR1cm4gKG1zIC8gc2VjIHwgMCkgKyAncyc7XG4gIHJldHVybiBtcyArICdtcyc7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gbW9kZSBuYW1lIGlzIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZGVidWcuZW5hYmxlZCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGRlYnVnLnNraXBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGRlYnVnLnNraXBzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGRlYnVnLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGRlYnVnLm5hbWVzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIENvZXJjZSBgdmFsYC5cbiAqL1xuXG5mdW5jdGlvbiBjb2VyY2UodmFsKSB7XG4gIGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikgcmV0dXJuIHZhbC5zdGFjayB8fCB2YWwubWVzc2FnZTtcbiAgcmV0dXJuIHZhbDtcbn1cblxuLy8gcGVyc2lzdFxuXG50cnkge1xuICBpZiAod2luZG93LmxvY2FsU3RvcmFnZSkgZGVidWcuZW5hYmxlKGxvY2FsU3RvcmFnZS5kZWJ1Zyk7XG59IGNhdGNoKGUpe31cbiIsIi8qIVxuICogU2l6emxlIENTUyBTZWxlY3RvciBFbmdpbmVcbiAqICBDb3B5cmlnaHQgMjAxMSwgVGhlIERvam8gRm91bmRhdGlvblxuICogIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQsIEJTRCwgYW5kIEdQTCBMaWNlbnNlcy5cbiAqICBNb3JlIGluZm9ybWF0aW9uOiBodHRwOi8vc2l6emxlanMuY29tL1xuICovXG4oZnVuY3Rpb24oKXtcblxudmFyIGNodW5rZXIgPSAvKCg/OlxcKCg/OlxcKFteKCldK1xcKXxbXigpXSspK1xcKXxcXFsoPzpcXFtbXlxcW1xcXV0qXFxdfFsnXCJdW14nXCJdKlsnXCJdfFteXFxbXFxdJ1wiXSspK1xcXXxcXFxcLnxbXiA+K34sKFxcW1xcXFxdKykrfFs+K35dKShcXHMqLFxccyopPygoPzoufFxccnxcXG4pKikvZyxcblx0ZXhwYW5kbyA9IFwic2l6Y2FjaGVcIiArIChNYXRoLnJhbmRvbSgpICsgJycpLnJlcGxhY2UoJy4nLCAnJyksXG5cdGRvbmUgPSAwLFxuXHR0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG5cdGhhc0R1cGxpY2F0ZSA9IGZhbHNlLFxuXHRiYXNlSGFzRHVwbGljYXRlID0gdHJ1ZSxcblx0ckJhY2tzbGFzaCA9IC9cXFxcL2csXG5cdHJSZXR1cm4gPSAvXFxyXFxuL2csXG5cdHJOb25Xb3JkID0gL1xcVy87XG5cbi8vIEhlcmUgd2UgY2hlY2sgaWYgdGhlIEphdmFTY3JpcHQgZW5naW5lIGlzIHVzaW5nIHNvbWUgc29ydCBvZlxuLy8gb3B0aW1pemF0aW9uIHdoZXJlIGl0IGRvZXMgbm90IGFsd2F5cyBjYWxsIG91ciBjb21wYXJpc2lvblxuLy8gZnVuY3Rpb24uIElmIHRoYXQgaXMgdGhlIGNhc2UsIGRpc2NhcmQgdGhlIGhhc0R1cGxpY2F0ZSB2YWx1ZS5cbi8vICAgVGh1cyBmYXIgdGhhdCBpbmNsdWRlcyBHb29nbGUgQ2hyb21lLlxuWzAsIDBdLnNvcnQoZnVuY3Rpb24oKSB7XG5cdGJhc2VIYXNEdXBsaWNhdGUgPSBmYWxzZTtcblx0cmV0dXJuIDA7XG59KTtcblxudmFyIFNpenpsZSA9IGZ1bmN0aW9uKCBzZWxlY3RvciwgY29udGV4dCwgcmVzdWx0cywgc2VlZCApIHtcblx0cmVzdWx0cyA9IHJlc3VsdHMgfHwgW107XG5cdGNvbnRleHQgPSBjb250ZXh0IHx8IGRvY3VtZW50O1xuXG5cdHZhciBvcmlnQ29udGV4dCA9IGNvbnRleHQ7XG5cblx0aWYgKCBjb250ZXh0Lm5vZGVUeXBlICE9PSAxICYmIGNvbnRleHQubm9kZVR5cGUgIT09IDkgKSB7XG5cdFx0cmV0dXJuIFtdO1xuXHR9XG5cblx0aWYgKCAhc2VsZWN0b3IgfHwgdHlwZW9mIHNlbGVjdG9yICE9PSBcInN0cmluZ1wiICkge1xuXHRcdHJldHVybiByZXN1bHRzO1xuXHR9XG5cblx0dmFyIG0sIHNldCwgY2hlY2tTZXQsIGV4dHJhLCByZXQsIGN1ciwgcG9wLCBpLFxuXHRcdHBydW5lID0gdHJ1ZSxcblx0XHRjb250ZXh0WE1MID0gU2l6emxlLmlzWE1MKCBjb250ZXh0ICksXG5cdFx0cGFydHMgPSBbXSxcblx0XHRzb0ZhciA9IHNlbGVjdG9yO1xuXG5cdC8vIFJlc2V0IHRoZSBwb3NpdGlvbiBvZiB0aGUgY2h1bmtlciByZWdleHAgKHN0YXJ0IGZyb20gaGVhZClcblx0ZG8ge1xuXHRcdGNodW5rZXIuZXhlYyggXCJcIiApO1xuXHRcdG0gPSBjaHVua2VyLmV4ZWMoIHNvRmFyICk7XG5cblx0XHRpZiAoIG0gKSB7XG5cdFx0XHRzb0ZhciA9IG1bM107XG5cblx0XHRcdHBhcnRzLnB1c2goIG1bMV0gKTtcblxuXHRcdFx0aWYgKCBtWzJdICkge1xuXHRcdFx0XHRleHRyYSA9IG1bM107XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblx0fSB3aGlsZSAoIG0gKTtcblxuXHRpZiAoIHBhcnRzLmxlbmd0aCA+IDEgJiYgb3JpZ1BPUy5leGVjKCBzZWxlY3RvciApICkge1xuXG5cdFx0aWYgKCBwYXJ0cy5sZW5ndGggPT09IDIgJiYgRXhwci5yZWxhdGl2ZVsgcGFydHNbMF0gXSApIHtcblx0XHRcdHNldCA9IHBvc1Byb2Nlc3MoIHBhcnRzWzBdICsgcGFydHNbMV0sIGNvbnRleHQsIHNlZWQgKTtcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZXQgPSBFeHByLnJlbGF0aXZlWyBwYXJ0c1swXSBdID9cblx0XHRcdFx0WyBjb250ZXh0IF0gOlxuXHRcdFx0XHRTaXp6bGUoIHBhcnRzLnNoaWZ0KCksIGNvbnRleHQgKTtcblxuXHRcdFx0d2hpbGUgKCBwYXJ0cy5sZW5ndGggKSB7XG5cdFx0XHRcdHNlbGVjdG9yID0gcGFydHMuc2hpZnQoKTtcblxuXHRcdFx0XHRpZiAoIEV4cHIucmVsYXRpdmVbIHNlbGVjdG9yIF0gKSB7XG5cdFx0XHRcdFx0c2VsZWN0b3IgKz0gcGFydHMuc2hpZnQoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHNldCA9IHBvc1Byb2Nlc3MoIHNlbGVjdG9yLCBzZXQsIHNlZWQgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0fSBlbHNlIHtcblx0XHQvLyBUYWtlIGEgc2hvcnRjdXQgYW5kIHNldCB0aGUgY29udGV4dCBpZiB0aGUgcm9vdCBzZWxlY3RvciBpcyBhbiBJRFxuXHRcdC8vIChidXQgbm90IGlmIGl0J2xsIGJlIGZhc3RlciBpZiB0aGUgaW5uZXIgc2VsZWN0b3IgaXMgYW4gSUQpXG5cdFx0aWYgKCAhc2VlZCAmJiBwYXJ0cy5sZW5ndGggPiAxICYmIGNvbnRleHQubm9kZVR5cGUgPT09IDkgJiYgIWNvbnRleHRYTUwgJiZcblx0XHRcdFx0RXhwci5tYXRjaC5JRC50ZXN0KHBhcnRzWzBdKSAmJiAhRXhwci5tYXRjaC5JRC50ZXN0KHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdKSApIHtcblxuXHRcdFx0cmV0ID0gU2l6emxlLmZpbmQoIHBhcnRzLnNoaWZ0KCksIGNvbnRleHQsIGNvbnRleHRYTUwgKTtcblx0XHRcdGNvbnRleHQgPSByZXQuZXhwciA/XG5cdFx0XHRcdFNpenpsZS5maWx0ZXIoIHJldC5leHByLCByZXQuc2V0IClbMF0gOlxuXHRcdFx0XHRyZXQuc2V0WzBdO1xuXHRcdH1cblxuXHRcdGlmICggY29udGV4dCApIHtcblx0XHRcdHJldCA9IHNlZWQgP1xuXHRcdFx0XHR7IGV4cHI6IHBhcnRzLnBvcCgpLCBzZXQ6IG1ha2VBcnJheShzZWVkKSB9IDpcblx0XHRcdFx0U2l6emxlLmZpbmQoIHBhcnRzLnBvcCgpLCBwYXJ0cy5sZW5ndGggPT09IDEgJiYgKHBhcnRzWzBdID09PSBcIn5cIiB8fCBwYXJ0c1swXSA9PT0gXCIrXCIpICYmIGNvbnRleHQucGFyZW50Tm9kZSA/IGNvbnRleHQucGFyZW50Tm9kZSA6IGNvbnRleHQsIGNvbnRleHRYTUwgKTtcblxuXHRcdFx0c2V0ID0gcmV0LmV4cHIgP1xuXHRcdFx0XHRTaXp6bGUuZmlsdGVyKCByZXQuZXhwciwgcmV0LnNldCApIDpcblx0XHRcdFx0cmV0LnNldDtcblxuXHRcdFx0aWYgKCBwYXJ0cy5sZW5ndGggPiAwICkge1xuXHRcdFx0XHRjaGVja1NldCA9IG1ha2VBcnJheSggc2V0ICk7XG5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBydW5lID0gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdHdoaWxlICggcGFydHMubGVuZ3RoICkge1xuXHRcdFx0XHRjdXIgPSBwYXJ0cy5wb3AoKTtcblx0XHRcdFx0cG9wID0gY3VyO1xuXG5cdFx0XHRcdGlmICggIUV4cHIucmVsYXRpdmVbIGN1ciBdICkge1xuXHRcdFx0XHRcdGN1ciA9IFwiXCI7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cG9wID0gcGFydHMucG9wKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIHBvcCA9PSBudWxsICkge1xuXHRcdFx0XHRcdHBvcCA9IGNvbnRleHQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRFeHByLnJlbGF0aXZlWyBjdXIgXSggY2hlY2tTZXQsIHBvcCwgY29udGV4dFhNTCApO1xuXHRcdFx0fVxuXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNoZWNrU2V0ID0gcGFydHMgPSBbXTtcblx0XHR9XG5cdH1cblxuXHRpZiAoICFjaGVja1NldCApIHtcblx0XHRjaGVja1NldCA9IHNldDtcblx0fVxuXG5cdGlmICggIWNoZWNrU2V0ICkge1xuXHRcdFNpenpsZS5lcnJvciggY3VyIHx8IHNlbGVjdG9yICk7XG5cdH1cblxuXHRpZiAoIHRvU3RyaW5nLmNhbGwoY2hlY2tTZXQpID09PSBcIltvYmplY3QgQXJyYXldXCIgKSB7XG5cdFx0aWYgKCAhcHJ1bmUgKSB7XG5cdFx0XHRyZXN1bHRzLnB1c2guYXBwbHkoIHJlc3VsdHMsIGNoZWNrU2V0ICk7XG5cblx0XHR9IGVsc2UgaWYgKCBjb250ZXh0ICYmIGNvbnRleHQubm9kZVR5cGUgPT09IDEgKSB7XG5cdFx0XHRmb3IgKCBpID0gMDsgY2hlY2tTZXRbaV0gIT0gbnVsbDsgaSsrICkge1xuXHRcdFx0XHRpZiAoIGNoZWNrU2V0W2ldICYmIChjaGVja1NldFtpXSA9PT0gdHJ1ZSB8fCBjaGVja1NldFtpXS5ub2RlVHlwZSA9PT0gMSAmJiBTaXp6bGUuY29udGFpbnMoY29udGV4dCwgY2hlY2tTZXRbaV0pKSApIHtcblx0XHRcdFx0XHRyZXN1bHRzLnB1c2goIHNldFtpXSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0Zm9yICggaSA9IDA7IGNoZWNrU2V0W2ldICE9IG51bGw7IGkrKyApIHtcblx0XHRcdFx0aWYgKCBjaGVja1NldFtpXSAmJiBjaGVja1NldFtpXS5ub2RlVHlwZSA9PT0gMSApIHtcblx0XHRcdFx0XHRyZXN1bHRzLnB1c2goIHNldFtpXSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH0gZWxzZSB7XG5cdFx0bWFrZUFycmF5KCBjaGVja1NldCwgcmVzdWx0cyApO1xuXHR9XG5cblx0aWYgKCBleHRyYSApIHtcblx0XHRTaXp6bGUoIGV4dHJhLCBvcmlnQ29udGV4dCwgcmVzdWx0cywgc2VlZCApO1xuXHRcdFNpenpsZS51bmlxdWVTb3J0KCByZXN1bHRzICk7XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0cztcbn07XG5cblNpenpsZS51bmlxdWVTb3J0ID0gZnVuY3Rpb24oIHJlc3VsdHMgKSB7XG5cdGlmICggc29ydE9yZGVyICkge1xuXHRcdGhhc0R1cGxpY2F0ZSA9IGJhc2VIYXNEdXBsaWNhdGU7XG5cdFx0cmVzdWx0cy5zb3J0KCBzb3J0T3JkZXIgKTtcblxuXHRcdGlmICggaGFzRHVwbGljYXRlICkge1xuXHRcdFx0Zm9yICggdmFyIGkgPSAxOyBpIDwgcmVzdWx0cy5sZW5ndGg7IGkrKyApIHtcblx0XHRcdFx0aWYgKCByZXN1bHRzW2ldID09PSByZXN1bHRzWyBpIC0gMSBdICkge1xuXHRcdFx0XHRcdHJlc3VsdHMuc3BsaWNlKCBpLS0sIDEgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiByZXN1bHRzO1xufTtcblxuU2l6emxlLm1hdGNoZXMgPSBmdW5jdGlvbiggZXhwciwgc2V0ICkge1xuXHRyZXR1cm4gU2l6emxlKCBleHByLCBudWxsLCBudWxsLCBzZXQgKTtcbn07XG5cblNpenpsZS5tYXRjaGVzU2VsZWN0b3IgPSBmdW5jdGlvbiggbm9kZSwgZXhwciApIHtcblx0cmV0dXJuIFNpenpsZSggZXhwciwgbnVsbCwgbnVsbCwgW25vZGVdICkubGVuZ3RoID4gMDtcbn07XG5cblNpenpsZS5maW5kID0gZnVuY3Rpb24oIGV4cHIsIGNvbnRleHQsIGlzWE1MICkge1xuXHR2YXIgc2V0LCBpLCBsZW4sIG1hdGNoLCB0eXBlLCBsZWZ0O1xuXG5cdGlmICggIWV4cHIgKSB7XG5cdFx0cmV0dXJuIFtdO1xuXHR9XG5cblx0Zm9yICggaSA9IDAsIGxlbiA9IEV4cHIub3JkZXIubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG5cdFx0dHlwZSA9IEV4cHIub3JkZXJbaV07XG5cblx0XHRpZiAoIChtYXRjaCA9IEV4cHIubGVmdE1hdGNoWyB0eXBlIF0uZXhlYyggZXhwciApKSApIHtcblx0XHRcdGxlZnQgPSBtYXRjaFsxXTtcblx0XHRcdG1hdGNoLnNwbGljZSggMSwgMSApO1xuXG5cdFx0XHRpZiAoIGxlZnQuc3Vic3RyKCBsZWZ0Lmxlbmd0aCAtIDEgKSAhPT0gXCJcXFxcXCIgKSB7XG5cdFx0XHRcdG1hdGNoWzFdID0gKG1hdGNoWzFdIHx8IFwiXCIpLnJlcGxhY2UoIHJCYWNrc2xhc2gsIFwiXCIgKTtcblx0XHRcdFx0c2V0ID0gRXhwci5maW5kWyB0eXBlIF0oIG1hdGNoLCBjb250ZXh0LCBpc1hNTCApO1xuXG5cdFx0XHRcdGlmICggc2V0ICE9IG51bGwgKSB7XG5cdFx0XHRcdFx0ZXhwciA9IGV4cHIucmVwbGFjZSggRXhwci5tYXRjaFsgdHlwZSBdLCBcIlwiICk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRpZiAoICFzZXQgKSB7XG5cdFx0c2V0ID0gdHlwZW9mIGNvbnRleHQuZ2V0RWxlbWVudHNCeVRhZ05hbWUgIT09IFwidW5kZWZpbmVkXCIgP1xuXHRcdFx0Y29udGV4dC5nZXRFbGVtZW50c0J5VGFnTmFtZSggXCIqXCIgKSA6XG5cdFx0XHRbXTtcblx0fVxuXG5cdHJldHVybiB7IHNldDogc2V0LCBleHByOiBleHByIH07XG59O1xuXG5TaXp6bGUuZmlsdGVyID0gZnVuY3Rpb24oIGV4cHIsIHNldCwgaW5wbGFjZSwgbm90ICkge1xuXHR2YXIgbWF0Y2gsIGFueUZvdW5kLFxuXHRcdHR5cGUsIGZvdW5kLCBpdGVtLCBmaWx0ZXIsIGxlZnQsXG5cdFx0aSwgcGFzcyxcblx0XHRvbGQgPSBleHByLFxuXHRcdHJlc3VsdCA9IFtdLFxuXHRcdGN1ckxvb3AgPSBzZXQsXG5cdFx0aXNYTUxGaWx0ZXIgPSBzZXQgJiYgc2V0WzBdICYmIFNpenpsZS5pc1hNTCggc2V0WzBdICk7XG5cblx0d2hpbGUgKCBleHByICYmIHNldC5sZW5ndGggKSB7XG5cdFx0Zm9yICggdHlwZSBpbiBFeHByLmZpbHRlciApIHtcblx0XHRcdGlmICggKG1hdGNoID0gRXhwci5sZWZ0TWF0Y2hbIHR5cGUgXS5leGVjKCBleHByICkpICE9IG51bGwgJiYgbWF0Y2hbMl0gKSB7XG5cdFx0XHRcdGZpbHRlciA9IEV4cHIuZmlsdGVyWyB0eXBlIF07XG5cdFx0XHRcdGxlZnQgPSBtYXRjaFsxXTtcblxuXHRcdFx0XHRhbnlGb3VuZCA9IGZhbHNlO1xuXG5cdFx0XHRcdG1hdGNoLnNwbGljZSgxLDEpO1xuXG5cdFx0XHRcdGlmICggbGVmdC5zdWJzdHIoIGxlZnQubGVuZ3RoIC0gMSApID09PSBcIlxcXFxcIiApIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICggY3VyTG9vcCA9PT0gcmVzdWx0ICkge1xuXHRcdFx0XHRcdHJlc3VsdCA9IFtdO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCBFeHByLnByZUZpbHRlclsgdHlwZSBdICkge1xuXHRcdFx0XHRcdG1hdGNoID0gRXhwci5wcmVGaWx0ZXJbIHR5cGUgXSggbWF0Y2gsIGN1ckxvb3AsIGlucGxhY2UsIHJlc3VsdCwgbm90LCBpc1hNTEZpbHRlciApO1xuXG5cdFx0XHRcdFx0aWYgKCAhbWF0Y2ggKSB7XG5cdFx0XHRcdFx0XHRhbnlGb3VuZCA9IGZvdW5kID0gdHJ1ZTtcblxuXHRcdFx0XHRcdH0gZWxzZSBpZiAoIG1hdGNoID09PSB0cnVlICkge1xuXHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCBtYXRjaCApIHtcblx0XHRcdFx0XHRmb3IgKCBpID0gMDsgKGl0ZW0gPSBjdXJMb29wW2ldKSAhPSBudWxsOyBpKysgKSB7XG5cdFx0XHRcdFx0XHRpZiAoIGl0ZW0gKSB7XG5cdFx0XHRcdFx0XHRcdGZvdW5kID0gZmlsdGVyKCBpdGVtLCBtYXRjaCwgaSwgY3VyTG9vcCApO1xuXHRcdFx0XHRcdFx0XHRwYXNzID0gbm90IF4gZm91bmQ7XG5cblx0XHRcdFx0XHRcdFx0aWYgKCBpbnBsYWNlICYmIGZvdW5kICE9IG51bGwgKSB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKCBwYXNzICkge1xuXHRcdFx0XHRcdFx0XHRcdFx0YW55Rm91bmQgPSB0cnVlO1xuXG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdGN1ckxvb3BbaV0gPSBmYWxzZTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0fSBlbHNlIGlmICggcGFzcyApIHtcblx0XHRcdFx0XHRcdFx0XHRyZXN1bHQucHVzaCggaXRlbSApO1xuXHRcdFx0XHRcdFx0XHRcdGFueUZvdW5kID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICggZm91bmQgIT09IHVuZGVmaW5lZCApIHtcblx0XHRcdFx0XHRpZiAoICFpbnBsYWNlICkge1xuXHRcdFx0XHRcdFx0Y3VyTG9vcCA9IHJlc3VsdDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRleHByID0gZXhwci5yZXBsYWNlKCBFeHByLm1hdGNoWyB0eXBlIF0sIFwiXCIgKTtcblxuXHRcdFx0XHRcdGlmICggIWFueUZvdW5kICkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFtdO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSW1wcm9wZXIgZXhwcmVzc2lvblxuXHRcdGlmICggZXhwciA9PT0gb2xkICkge1xuXHRcdFx0aWYgKCBhbnlGb3VuZCA9PSBudWxsICkge1xuXHRcdFx0XHRTaXp6bGUuZXJyb3IoIGV4cHIgKTtcblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0b2xkID0gZXhwcjtcblx0fVxuXG5cdHJldHVybiBjdXJMb29wO1xufTtcblxuU2l6emxlLmVycm9yID0gZnVuY3Rpb24oIG1zZyApIHtcblx0dGhyb3cgbmV3IEVycm9yKCBcIlN5bnRheCBlcnJvciwgdW5yZWNvZ25pemVkIGV4cHJlc3Npb246IFwiICsgbXNnICk7XG59O1xuXG4vKipcbiAqIFV0aWxpdHkgZnVuY3Rpb24gZm9yIHJldHJlaXZpbmcgdGhlIHRleHQgdmFsdWUgb2YgYW4gYXJyYXkgb2YgRE9NIG5vZGVzXG4gKiBAcGFyYW0ge0FycmF5fEVsZW1lbnR9IGVsZW1cbiAqL1xudmFyIGdldFRleHQgPSBTaXp6bGUuZ2V0VGV4dCA9IGZ1bmN0aW9uKCBlbGVtICkge1xuICAgIHZhciBpLCBub2RlLFxuXHRcdG5vZGVUeXBlID0gZWxlbS5ub2RlVHlwZSxcblx0XHRyZXQgPSBcIlwiO1xuXG5cdGlmICggbm9kZVR5cGUgKSB7XG5cdFx0aWYgKCBub2RlVHlwZSA9PT0gMSB8fCBub2RlVHlwZSA9PT0gOSB8fCBub2RlVHlwZSA9PT0gMTEgKSB7XG5cdFx0XHQvLyBVc2UgdGV4dENvbnRlbnQgfHwgaW5uZXJUZXh0IGZvciBlbGVtZW50c1xuXHRcdFx0aWYgKCB0eXBlb2YgZWxlbS50ZXh0Q29udGVudCA9PT0gJ3N0cmluZycgKSB7XG5cdFx0XHRcdHJldHVybiBlbGVtLnRleHRDb250ZW50O1xuXHRcdFx0fSBlbHNlIGlmICggdHlwZW9mIGVsZW0uaW5uZXJUZXh0ID09PSAnc3RyaW5nJyApIHtcblx0XHRcdFx0Ly8gUmVwbGFjZSBJRSdzIGNhcnJpYWdlIHJldHVybnNcblx0XHRcdFx0cmV0dXJuIGVsZW0uaW5uZXJUZXh0LnJlcGxhY2UoIHJSZXR1cm4sICcnICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBUcmF2ZXJzZSBpdCdzIGNoaWxkcmVuXG5cdFx0XHRcdGZvciAoIGVsZW0gPSBlbGVtLmZpcnN0Q2hpbGQ7IGVsZW07IGVsZW0gPSBlbGVtLm5leHRTaWJsaW5nKSB7XG5cdFx0XHRcdFx0cmV0ICs9IGdldFRleHQoIGVsZW0gKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoIG5vZGVUeXBlID09PSAzIHx8IG5vZGVUeXBlID09PSA0ICkge1xuXHRcdFx0cmV0dXJuIGVsZW0ubm9kZVZhbHVlO1xuXHRcdH1cblx0fSBlbHNlIHtcblxuXHRcdC8vIElmIG5vIG5vZGVUeXBlLCB0aGlzIGlzIGV4cGVjdGVkIHRvIGJlIGFuIGFycmF5XG5cdFx0Zm9yICggaSA9IDA7IChub2RlID0gZWxlbVtpXSk7IGkrKyApIHtcblx0XHRcdC8vIERvIG5vdCB0cmF2ZXJzZSBjb21tZW50IG5vZGVzXG5cdFx0XHRpZiAoIG5vZGUubm9kZVR5cGUgIT09IDggKSB7XG5cdFx0XHRcdHJldCArPSBnZXRUZXh0KCBub2RlICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdHJldHVybiByZXQ7XG59O1xuXG52YXIgRXhwciA9IFNpenpsZS5zZWxlY3RvcnMgPSB7XG5cdG9yZGVyOiBbIFwiSURcIiwgXCJOQU1FXCIsIFwiVEFHXCIgXSxcblxuXHRtYXRjaDoge1xuXHRcdElEOiAvIygoPzpbXFx3XFx1MDBjMC1cXHVGRkZGXFwtXXxcXFxcLikrKS8sXG5cdFx0Q0xBU1M6IC9cXC4oKD86W1xcd1xcdTAwYzAtXFx1RkZGRlxcLV18XFxcXC4pKykvLFxuXHRcdE5BTUU6IC9cXFtuYW1lPVsnXCJdKigoPzpbXFx3XFx1MDBjMC1cXHVGRkZGXFwtXXxcXFxcLikrKVsnXCJdKlxcXS8sXG5cdFx0QVRUUjogL1xcW1xccyooKD86W1xcd1xcdTAwYzAtXFx1RkZGRlxcLV18XFxcXC4pKylcXHMqKD86KFxcUz89KVxccyooPzooWydcIl0pKC4qPylcXDN8KCM/KD86W1xcd1xcdTAwYzAtXFx1RkZGRlxcLV18XFxcXC4pKil8KXwpXFxzKlxcXS8sXG5cdFx0VEFHOiAvXigoPzpbXFx3XFx1MDBjMC1cXHVGRkZGXFwqXFwtXXxcXFxcLikrKS8sXG5cdFx0Q0hJTEQ6IC86KG9ubHl8bnRofGxhc3R8Zmlyc3QpLWNoaWxkKD86XFwoXFxzKihldmVufG9kZHwoPzpbK1xcLV0/XFxkK3woPzpbK1xcLV0/XFxkKik/blxccyooPzpbK1xcLV1cXHMqXFxkKyk/KSlcXHMqXFwpKT8vLFxuXHRcdFBPUzogLzoobnRofGVxfGd0fGx0fGZpcnN0fGxhc3R8ZXZlbnxvZGQpKD86XFwoKFxcZCopXFwpKT8oPz1bXlxcLV18JCkvLFxuXHRcdFBTRVVETzogLzooKD86W1xcd1xcdTAwYzAtXFx1RkZGRlxcLV18XFxcXC4pKykoPzpcXCgoWydcIl0/KSgoPzpcXChbXlxcKV0rXFwpfFteXFwoXFwpXSopKylcXDJcXCkpPy9cblx0fSxcblxuXHRsZWZ0TWF0Y2g6IHt9LFxuXG5cdGF0dHJNYXA6IHtcblx0XHRcImNsYXNzXCI6IFwiY2xhc3NOYW1lXCIsXG5cdFx0XCJmb3JcIjogXCJodG1sRm9yXCJcblx0fSxcblxuXHRhdHRySGFuZGxlOiB7XG5cdFx0aHJlZjogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoIFwiaHJlZlwiICk7XG5cdFx0fSxcblx0XHR0eXBlOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSggXCJ0eXBlXCIgKTtcblx0XHR9XG5cdH0sXG5cblx0cmVsYXRpdmU6IHtcblx0XHRcIitcIjogZnVuY3Rpb24oY2hlY2tTZXQsIHBhcnQpe1xuXHRcdFx0dmFyIGlzUGFydFN0ciA9IHR5cGVvZiBwYXJ0ID09PSBcInN0cmluZ1wiLFxuXHRcdFx0XHRpc1RhZyA9IGlzUGFydFN0ciAmJiAhck5vbldvcmQudGVzdCggcGFydCApLFxuXHRcdFx0XHRpc1BhcnRTdHJOb3RUYWcgPSBpc1BhcnRTdHIgJiYgIWlzVGFnO1xuXG5cdFx0XHRpZiAoIGlzVGFnICkge1xuXHRcdFx0XHRwYXJ0ID0gcGFydC50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0fVxuXG5cdFx0XHRmb3IgKCB2YXIgaSA9IDAsIGwgPSBjaGVja1NldC5sZW5ndGgsIGVsZW07IGkgPCBsOyBpKysgKSB7XG5cdFx0XHRcdGlmICggKGVsZW0gPSBjaGVja1NldFtpXSkgKSB7XG5cdFx0XHRcdFx0d2hpbGUgKCAoZWxlbSA9IGVsZW0ucHJldmlvdXNTaWJsaW5nKSAmJiBlbGVtLm5vZGVUeXBlICE9PSAxICkge31cblxuXHRcdFx0XHRcdGNoZWNrU2V0W2ldID0gaXNQYXJ0U3RyTm90VGFnIHx8IGVsZW0gJiYgZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSBwYXJ0ID9cblx0XHRcdFx0XHRcdGVsZW0gfHwgZmFsc2UgOlxuXHRcdFx0XHRcdFx0ZWxlbSA9PT0gcGFydDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIGlzUGFydFN0ck5vdFRhZyApIHtcblx0XHRcdFx0U2l6emxlLmZpbHRlciggcGFydCwgY2hlY2tTZXQsIHRydWUgKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0XCI+XCI6IGZ1bmN0aW9uKCBjaGVja1NldCwgcGFydCApIHtcblx0XHRcdHZhciBlbGVtLFxuXHRcdFx0XHRpc1BhcnRTdHIgPSB0eXBlb2YgcGFydCA9PT0gXCJzdHJpbmdcIixcblx0XHRcdFx0aSA9IDAsXG5cdFx0XHRcdGwgPSBjaGVja1NldC5sZW5ndGg7XG5cblx0XHRcdGlmICggaXNQYXJ0U3RyICYmICFyTm9uV29yZC50ZXN0KCBwYXJ0ICkgKSB7XG5cdFx0XHRcdHBhcnQgPSBwYXJ0LnRvTG93ZXJDYXNlKCk7XG5cblx0XHRcdFx0Zm9yICggOyBpIDwgbDsgaSsrICkge1xuXHRcdFx0XHRcdGVsZW0gPSBjaGVja1NldFtpXTtcblxuXHRcdFx0XHRcdGlmICggZWxlbSApIHtcblx0XHRcdFx0XHRcdHZhciBwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGU7XG5cdFx0XHRcdFx0XHRjaGVja1NldFtpXSA9IHBhcmVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSBwYXJ0ID8gcGFyZW50IDogZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZvciAoIDsgaSA8IGw7IGkrKyApIHtcblx0XHRcdFx0XHRlbGVtID0gY2hlY2tTZXRbaV07XG5cblx0XHRcdFx0XHRpZiAoIGVsZW0gKSB7XG5cdFx0XHRcdFx0XHRjaGVja1NldFtpXSA9IGlzUGFydFN0ciA/XG5cdFx0XHRcdFx0XHRcdGVsZW0ucGFyZW50Tm9kZSA6XG5cdFx0XHRcdFx0XHRcdGVsZW0ucGFyZW50Tm9kZSA9PT0gcGFydDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIGlzUGFydFN0ciApIHtcblx0XHRcdFx0XHRTaXp6bGUuZmlsdGVyKCBwYXJ0LCBjaGVja1NldCwgdHJ1ZSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdFwiXCI6IGZ1bmN0aW9uKGNoZWNrU2V0LCBwYXJ0LCBpc1hNTCl7XG5cdFx0XHR2YXIgbm9kZUNoZWNrLFxuXHRcdFx0XHRkb25lTmFtZSA9IGRvbmUrKyxcblx0XHRcdFx0Y2hlY2tGbiA9IGRpckNoZWNrO1xuXG5cdFx0XHRpZiAoIHR5cGVvZiBwYXJ0ID09PSBcInN0cmluZ1wiICYmICFyTm9uV29yZC50ZXN0KCBwYXJ0ICkgKSB7XG5cdFx0XHRcdHBhcnQgPSBwYXJ0LnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdG5vZGVDaGVjayA9IHBhcnQ7XG5cdFx0XHRcdGNoZWNrRm4gPSBkaXJOb2RlQ2hlY2s7XG5cdFx0XHR9XG5cblx0XHRcdGNoZWNrRm4oIFwicGFyZW50Tm9kZVwiLCBwYXJ0LCBkb25lTmFtZSwgY2hlY2tTZXQsIG5vZGVDaGVjaywgaXNYTUwgKTtcblx0XHR9LFxuXG5cdFx0XCJ+XCI6IGZ1bmN0aW9uKCBjaGVja1NldCwgcGFydCwgaXNYTUwgKSB7XG5cdFx0XHR2YXIgbm9kZUNoZWNrLFxuXHRcdFx0XHRkb25lTmFtZSA9IGRvbmUrKyxcblx0XHRcdFx0Y2hlY2tGbiA9IGRpckNoZWNrO1xuXG5cdFx0XHRpZiAoIHR5cGVvZiBwYXJ0ID09PSBcInN0cmluZ1wiICYmICFyTm9uV29yZC50ZXN0KCBwYXJ0ICkgKSB7XG5cdFx0XHRcdHBhcnQgPSBwYXJ0LnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdG5vZGVDaGVjayA9IHBhcnQ7XG5cdFx0XHRcdGNoZWNrRm4gPSBkaXJOb2RlQ2hlY2s7XG5cdFx0XHR9XG5cblx0XHRcdGNoZWNrRm4oIFwicHJldmlvdXNTaWJsaW5nXCIsIHBhcnQsIGRvbmVOYW1lLCBjaGVja1NldCwgbm9kZUNoZWNrLCBpc1hNTCApO1xuXHRcdH1cblx0fSxcblxuXHRmaW5kOiB7XG5cdFx0SUQ6IGZ1bmN0aW9uKCBtYXRjaCwgY29udGV4dCwgaXNYTUwgKSB7XG5cdFx0XHRpZiAoIHR5cGVvZiBjb250ZXh0LmdldEVsZW1lbnRCeUlkICE9PSBcInVuZGVmaW5lZFwiICYmICFpc1hNTCApIHtcblx0XHRcdFx0dmFyIG0gPSBjb250ZXh0LmdldEVsZW1lbnRCeUlkKG1hdGNoWzFdKTtcblx0XHRcdFx0Ly8gQ2hlY2sgcGFyZW50Tm9kZSB0byBjYXRjaCB3aGVuIEJsYWNrYmVycnkgNC42IHJldHVybnNcblx0XHRcdFx0Ly8gbm9kZXMgdGhhdCBhcmUgbm8gbG9uZ2VyIGluIHRoZSBkb2N1bWVudCAjNjk2M1xuXHRcdFx0XHRyZXR1cm4gbSAmJiBtLnBhcmVudE5vZGUgPyBbbV0gOiBbXTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0TkFNRTogZnVuY3Rpb24oIG1hdGNoLCBjb250ZXh0ICkge1xuXHRcdFx0aWYgKCB0eXBlb2YgY29udGV4dC5nZXRFbGVtZW50c0J5TmFtZSAhPT0gXCJ1bmRlZmluZWRcIiApIHtcblx0XHRcdFx0dmFyIHJldCA9IFtdLFxuXHRcdFx0XHRcdHJlc3VsdHMgPSBjb250ZXh0LmdldEVsZW1lbnRzQnlOYW1lKCBtYXRjaFsxXSApO1xuXG5cdFx0XHRcdGZvciAoIHZhciBpID0gMCwgbCA9IHJlc3VsdHMubGVuZ3RoOyBpIDwgbDsgaSsrICkge1xuXHRcdFx0XHRcdGlmICggcmVzdWx0c1tpXS5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpID09PSBtYXRjaFsxXSApIHtcblx0XHRcdFx0XHRcdHJldC5wdXNoKCByZXN1bHRzW2ldICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHJldC5sZW5ndGggPT09IDAgPyBudWxsIDogcmV0O1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRUQUc6IGZ1bmN0aW9uKCBtYXRjaCwgY29udGV4dCApIHtcblx0XHRcdGlmICggdHlwZW9mIGNvbnRleHQuZ2V0RWxlbWVudHNCeVRhZ05hbWUgIT09IFwidW5kZWZpbmVkXCIgKSB7XG5cdFx0XHRcdHJldHVybiBjb250ZXh0LmdldEVsZW1lbnRzQnlUYWdOYW1lKCBtYXRjaFsxXSApO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0cHJlRmlsdGVyOiB7XG5cdFx0Q0xBU1M6IGZ1bmN0aW9uKCBtYXRjaCwgY3VyTG9vcCwgaW5wbGFjZSwgcmVzdWx0LCBub3QsIGlzWE1MICkge1xuXHRcdFx0bWF0Y2ggPSBcIiBcIiArIG1hdGNoWzFdLnJlcGxhY2UoIHJCYWNrc2xhc2gsIFwiXCIgKSArIFwiIFwiO1xuXG5cdFx0XHRpZiAoIGlzWE1MICkge1xuXHRcdFx0XHRyZXR1cm4gbWF0Y2g7XG5cdFx0XHR9XG5cblx0XHRcdGZvciAoIHZhciBpID0gMCwgZWxlbTsgKGVsZW0gPSBjdXJMb29wW2ldKSAhPSBudWxsOyBpKysgKSB7XG5cdFx0XHRcdGlmICggZWxlbSApIHtcblx0XHRcdFx0XHRpZiAoIG5vdCBeIChlbGVtLmNsYXNzTmFtZSAmJiAoXCIgXCIgKyBlbGVtLmNsYXNzTmFtZSArIFwiIFwiKS5yZXBsYWNlKC9bXFx0XFxuXFxyXS9nLCBcIiBcIikuaW5kZXhPZihtYXRjaCkgPj0gMCkgKSB7XG5cdFx0XHRcdFx0XHRpZiAoICFpbnBsYWNlICkge1xuXHRcdFx0XHRcdFx0XHRyZXN1bHQucHVzaCggZWxlbSApO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0fSBlbHNlIGlmICggaW5wbGFjZSApIHtcblx0XHRcdFx0XHRcdGN1ckxvb3BbaV0gPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0sXG5cblx0XHRJRDogZnVuY3Rpb24oIG1hdGNoICkge1xuXHRcdFx0cmV0dXJuIG1hdGNoWzFdLnJlcGxhY2UoIHJCYWNrc2xhc2gsIFwiXCIgKTtcblx0XHR9LFxuXG5cdFx0VEFHOiBmdW5jdGlvbiggbWF0Y2gsIGN1ckxvb3AgKSB7XG5cdFx0XHRyZXR1cm4gbWF0Y2hbMV0ucmVwbGFjZSggckJhY2tzbGFzaCwgXCJcIiApLnRvTG93ZXJDYXNlKCk7XG5cdFx0fSxcblxuXHRcdENISUxEOiBmdW5jdGlvbiggbWF0Y2ggKSB7XG5cdFx0XHRpZiAoIG1hdGNoWzFdID09PSBcIm50aFwiICkge1xuXHRcdFx0XHRpZiAoICFtYXRjaFsyXSApIHtcblx0XHRcdFx0XHRTaXp6bGUuZXJyb3IoIG1hdGNoWzBdICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRtYXRjaFsyXSA9IG1hdGNoWzJdLnJlcGxhY2UoL15cXCt8XFxzKi9nLCAnJyk7XG5cblx0XHRcdFx0Ly8gcGFyc2UgZXF1YXRpb25zIGxpa2UgJ2V2ZW4nLCAnb2RkJywgJzUnLCAnMm4nLCAnM24rMicsICc0bi0xJywgJy1uKzYnXG5cdFx0XHRcdHZhciB0ZXN0ID0gLygtPykoXFxkKikoPzpuKFsrXFwtXT9cXGQqKSk/Ly5leGVjKFxuXHRcdFx0XHRcdG1hdGNoWzJdID09PSBcImV2ZW5cIiAmJiBcIjJuXCIgfHwgbWF0Y2hbMl0gPT09IFwib2RkXCIgJiYgXCIybisxXCIgfHxcblx0XHRcdFx0XHQhL1xcRC8udGVzdCggbWF0Y2hbMl0gKSAmJiBcIjBuK1wiICsgbWF0Y2hbMl0gfHwgbWF0Y2hbMl0pO1xuXG5cdFx0XHRcdC8vIGNhbGN1bGF0ZSB0aGUgbnVtYmVycyAoZmlyc3QpbisobGFzdCkgaW5jbHVkaW5nIGlmIHRoZXkgYXJlIG5lZ2F0aXZlXG5cdFx0XHRcdG1hdGNoWzJdID0gKHRlc3RbMV0gKyAodGVzdFsyXSB8fCAxKSkgLSAwO1xuXHRcdFx0XHRtYXRjaFszXSA9IHRlc3RbM10gLSAwO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoIG1hdGNoWzJdICkge1xuXHRcdFx0XHRTaXp6bGUuZXJyb3IoIG1hdGNoWzBdICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFRPRE86IE1vdmUgdG8gbm9ybWFsIGNhY2hpbmcgc3lzdGVtXG5cdFx0XHRtYXRjaFswXSA9IGRvbmUrKztcblxuXHRcdFx0cmV0dXJuIG1hdGNoO1xuXHRcdH0sXG5cblx0XHRBVFRSOiBmdW5jdGlvbiggbWF0Y2gsIGN1ckxvb3AsIGlucGxhY2UsIHJlc3VsdCwgbm90LCBpc1hNTCApIHtcblx0XHRcdHZhciBuYW1lID0gbWF0Y2hbMV0gPSBtYXRjaFsxXS5yZXBsYWNlKCByQmFja3NsYXNoLCBcIlwiICk7XG5cblx0XHRcdGlmICggIWlzWE1MICYmIEV4cHIuYXR0ck1hcFtuYW1lXSApIHtcblx0XHRcdFx0bWF0Y2hbMV0gPSBFeHByLmF0dHJNYXBbbmFtZV07XG5cdFx0XHR9XG5cblx0XHRcdC8vIEhhbmRsZSBpZiBhbiB1bi1xdW90ZWQgdmFsdWUgd2FzIHVzZWRcblx0XHRcdG1hdGNoWzRdID0gKCBtYXRjaFs0XSB8fCBtYXRjaFs1XSB8fCBcIlwiICkucmVwbGFjZSggckJhY2tzbGFzaCwgXCJcIiApO1xuXG5cdFx0XHRpZiAoIG1hdGNoWzJdID09PSBcIn49XCIgKSB7XG5cdFx0XHRcdG1hdGNoWzRdID0gXCIgXCIgKyBtYXRjaFs0XSArIFwiIFwiO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbWF0Y2g7XG5cdFx0fSxcblxuXHRcdFBTRVVETzogZnVuY3Rpb24oIG1hdGNoLCBjdXJMb29wLCBpbnBsYWNlLCByZXN1bHQsIG5vdCApIHtcblx0XHRcdGlmICggbWF0Y2hbMV0gPT09IFwibm90XCIgKSB7XG5cdFx0XHRcdC8vIElmIHdlJ3JlIGRlYWxpbmcgd2l0aCBhIGNvbXBsZXggZXhwcmVzc2lvbiwgb3IgYSBzaW1wbGUgb25lXG5cdFx0XHRcdGlmICggKCBjaHVua2VyLmV4ZWMobWF0Y2hbM10pIHx8IFwiXCIgKS5sZW5ndGggPiAxIHx8IC9eXFx3Ly50ZXN0KG1hdGNoWzNdKSApIHtcblx0XHRcdFx0XHRtYXRjaFszXSA9IFNpenpsZShtYXRjaFszXSwgbnVsbCwgbnVsbCwgY3VyTG9vcCk7XG5cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR2YXIgcmV0ID0gU2l6emxlLmZpbHRlcihtYXRjaFszXSwgY3VyTG9vcCwgaW5wbGFjZSwgdHJ1ZSBeIG5vdCk7XG5cblx0XHRcdFx0XHRpZiAoICFpbnBsYWNlICkge1xuXHRcdFx0XHRcdFx0cmVzdWx0LnB1c2guYXBwbHkoIHJlc3VsdCwgcmV0ICk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSBpZiAoIEV4cHIubWF0Y2guUE9TLnRlc3QoIG1hdGNoWzBdICkgfHwgRXhwci5tYXRjaC5DSElMRC50ZXN0KCBtYXRjaFswXSApICkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG1hdGNoO1xuXHRcdH0sXG5cblx0XHRQT1M6IGZ1bmN0aW9uKCBtYXRjaCApIHtcblx0XHRcdG1hdGNoLnVuc2hpZnQoIHRydWUgKTtcblxuXHRcdFx0cmV0dXJuIG1hdGNoO1xuXHRcdH1cblx0fSxcblxuXHRmaWx0ZXJzOiB7XG5cdFx0ZW5hYmxlZDogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gZWxlbS5kaXNhYmxlZCA9PT0gZmFsc2UgJiYgZWxlbS50eXBlICE9PSBcImhpZGRlblwiO1xuXHRcdH0sXG5cblx0XHRkaXNhYmxlZDogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gZWxlbS5kaXNhYmxlZCA9PT0gdHJ1ZTtcblx0XHR9LFxuXG5cdFx0Y2hlY2tlZDogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gZWxlbS5jaGVja2VkID09PSB0cnVlO1xuXHRcdH0sXG5cblx0XHRzZWxlY3RlZDogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHQvLyBBY2Nlc3NpbmcgdGhpcyBwcm9wZXJ0eSBtYWtlcyBzZWxlY3RlZC1ieS1kZWZhdWx0XG5cdFx0XHQvLyBvcHRpb25zIGluIFNhZmFyaSB3b3JrIHByb3Blcmx5XG5cdFx0XHRpZiAoIGVsZW0ucGFyZW50Tm9kZSApIHtcblx0XHRcdFx0ZWxlbS5wYXJlbnROb2RlLnNlbGVjdGVkSW5kZXg7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBlbGVtLnNlbGVjdGVkID09PSB0cnVlO1xuXHRcdH0sXG5cblx0XHRwYXJlbnQ6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0cmV0dXJuICEhZWxlbS5maXJzdENoaWxkO1xuXHRcdH0sXG5cblx0XHRlbXB0eTogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gIWVsZW0uZmlyc3RDaGlsZDtcblx0XHR9LFxuXG5cdFx0aGFzOiBmdW5jdGlvbiggZWxlbSwgaSwgbWF0Y2ggKSB7XG5cdFx0XHRyZXR1cm4gISFTaXp6bGUoIG1hdGNoWzNdLCBlbGVtICkubGVuZ3RoO1xuXHRcdH0sXG5cblx0XHRoZWFkZXI6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0cmV0dXJuICgvaFxcZC9pKS50ZXN0KCBlbGVtLm5vZGVOYW1lICk7XG5cdFx0fSxcblxuXHRcdHRleHQ6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0dmFyIGF0dHIgPSBlbGVtLmdldEF0dHJpYnV0ZSggXCJ0eXBlXCIgKSwgdHlwZSA9IGVsZW0udHlwZTtcblx0XHRcdC8vIElFNiBhbmQgNyB3aWxsIG1hcCBlbGVtLnR5cGUgdG8gJ3RleHQnIGZvciBuZXcgSFRNTDUgdHlwZXMgKHNlYXJjaCwgZXRjKVxuXHRcdFx0Ly8gdXNlIGdldEF0dHJpYnV0ZSBpbnN0ZWFkIHRvIHRlc3QgdGhpcyBjYXNlXG5cdFx0XHRyZXR1cm4gZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSBcImlucHV0XCIgJiYgXCJ0ZXh0XCIgPT09IHR5cGUgJiYgKCBhdHRyID09PSB0eXBlIHx8IGF0dHIgPT09IG51bGwgKTtcblx0XHR9LFxuXG5cdFx0cmFkaW86IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0cmV0dXJuIGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gXCJpbnB1dFwiICYmIFwicmFkaW9cIiA9PT0gZWxlbS50eXBlO1xuXHRcdH0sXG5cblx0XHRjaGVja2JveDogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSBcImlucHV0XCIgJiYgXCJjaGVja2JveFwiID09PSBlbGVtLnR5cGU7XG5cdFx0fSxcblxuXHRcdGZpbGU6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0cmV0dXJuIGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gXCJpbnB1dFwiICYmIFwiZmlsZVwiID09PSBlbGVtLnR5cGU7XG5cdFx0fSxcblxuXHRcdHBhc3N3b3JkOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IFwiaW5wdXRcIiAmJiBcInBhc3N3b3JkXCIgPT09IGVsZW0udHlwZTtcblx0XHR9LFxuXG5cdFx0c3VibWl0OiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHZhciBuYW1lID0gZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0cmV0dXJuIChuYW1lID09PSBcImlucHV0XCIgfHwgbmFtZSA9PT0gXCJidXR0b25cIikgJiYgXCJzdWJtaXRcIiA9PT0gZWxlbS50eXBlO1xuXHRcdH0sXG5cblx0XHRpbWFnZTogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSBcImlucHV0XCIgJiYgXCJpbWFnZVwiID09PSBlbGVtLnR5cGU7XG5cdFx0fSxcblxuXHRcdHJlc2V0OiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHZhciBuYW1lID0gZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0cmV0dXJuIChuYW1lID09PSBcImlucHV0XCIgfHwgbmFtZSA9PT0gXCJidXR0b25cIikgJiYgXCJyZXNldFwiID09PSBlbGVtLnR5cGU7XG5cdFx0fSxcblxuXHRcdGJ1dHRvbjogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHR2YXIgbmFtZSA9IGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdHJldHVybiBuYW1lID09PSBcImlucHV0XCIgJiYgXCJidXR0b25cIiA9PT0gZWxlbS50eXBlIHx8IG5hbWUgPT09IFwiYnV0dG9uXCI7XG5cdFx0fSxcblxuXHRcdGlucHV0OiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiAoL2lucHV0fHNlbGVjdHx0ZXh0YXJlYXxidXR0b24vaSkudGVzdCggZWxlbS5ub2RlTmFtZSApO1xuXHRcdH0sXG5cblx0XHRmb2N1czogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gZWxlbSA9PT0gZWxlbS5vd25lckRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG5cdFx0fVxuXHR9LFxuXHRzZXRGaWx0ZXJzOiB7XG5cdFx0Zmlyc3Q6IGZ1bmN0aW9uKCBlbGVtLCBpICkge1xuXHRcdFx0cmV0dXJuIGkgPT09IDA7XG5cdFx0fSxcblxuXHRcdGxhc3Q6IGZ1bmN0aW9uKCBlbGVtLCBpLCBtYXRjaCwgYXJyYXkgKSB7XG5cdFx0XHRyZXR1cm4gaSA9PT0gYXJyYXkubGVuZ3RoIC0gMTtcblx0XHR9LFxuXG5cdFx0ZXZlbjogZnVuY3Rpb24oIGVsZW0sIGkgKSB7XG5cdFx0XHRyZXR1cm4gaSAlIDIgPT09IDA7XG5cdFx0fSxcblxuXHRcdG9kZDogZnVuY3Rpb24oIGVsZW0sIGkgKSB7XG5cdFx0XHRyZXR1cm4gaSAlIDIgPT09IDE7XG5cdFx0fSxcblxuXHRcdGx0OiBmdW5jdGlvbiggZWxlbSwgaSwgbWF0Y2ggKSB7XG5cdFx0XHRyZXR1cm4gaSA8IG1hdGNoWzNdIC0gMDtcblx0XHR9LFxuXG5cdFx0Z3Q6IGZ1bmN0aW9uKCBlbGVtLCBpLCBtYXRjaCApIHtcblx0XHRcdHJldHVybiBpID4gbWF0Y2hbM10gLSAwO1xuXHRcdH0sXG5cblx0XHRudGg6IGZ1bmN0aW9uKCBlbGVtLCBpLCBtYXRjaCApIHtcblx0XHRcdHJldHVybiBtYXRjaFszXSAtIDAgPT09IGk7XG5cdFx0fSxcblxuXHRcdGVxOiBmdW5jdGlvbiggZWxlbSwgaSwgbWF0Y2ggKSB7XG5cdFx0XHRyZXR1cm4gbWF0Y2hbM10gLSAwID09PSBpO1xuXHRcdH1cblx0fSxcblx0ZmlsdGVyOiB7XG5cdFx0UFNFVURPOiBmdW5jdGlvbiggZWxlbSwgbWF0Y2gsIGksIGFycmF5ICkge1xuXHRcdFx0dmFyIG5hbWUgPSBtYXRjaFsxXSxcblx0XHRcdFx0ZmlsdGVyID0gRXhwci5maWx0ZXJzWyBuYW1lIF07XG5cblx0XHRcdGlmICggZmlsdGVyICkge1xuXHRcdFx0XHRyZXR1cm4gZmlsdGVyKCBlbGVtLCBpLCBtYXRjaCwgYXJyYXkgKTtcblxuXHRcdFx0fSBlbHNlIGlmICggbmFtZSA9PT0gXCJjb250YWluc1wiICkge1xuXHRcdFx0XHRyZXR1cm4gKGVsZW0udGV4dENvbnRlbnQgfHwgZWxlbS5pbm5lclRleHQgfHwgZ2V0VGV4dChbIGVsZW0gXSkgfHwgXCJcIikuaW5kZXhPZihtYXRjaFszXSkgPj0gMDtcblxuXHRcdFx0fSBlbHNlIGlmICggbmFtZSA9PT0gXCJub3RcIiApIHtcblx0XHRcdFx0dmFyIG5vdCA9IG1hdGNoWzNdO1xuXG5cdFx0XHRcdGZvciAoIHZhciBqID0gMCwgbCA9IG5vdC5sZW5ndGg7IGogPCBsOyBqKysgKSB7XG5cdFx0XHRcdFx0aWYgKCBub3Rbal0gPT09IGVsZW0gKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFNpenpsZS5lcnJvciggbmFtZSApO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRDSElMRDogZnVuY3Rpb24oIGVsZW0sIG1hdGNoICkge1xuXHRcdFx0dmFyIGZpcnN0LCBsYXN0LFxuXHRcdFx0XHRkb25lTmFtZSwgcGFyZW50LCBjYWNoZSxcblx0XHRcdFx0Y291bnQsIGRpZmYsXG5cdFx0XHRcdHR5cGUgPSBtYXRjaFsxXSxcblx0XHRcdFx0bm9kZSA9IGVsZW07XG5cblx0XHRcdHN3aXRjaCAoIHR5cGUgKSB7XG5cdFx0XHRcdGNhc2UgXCJvbmx5XCI6XG5cdFx0XHRcdGNhc2UgXCJmaXJzdFwiOlxuXHRcdFx0XHRcdHdoaWxlICggKG5vZGUgPSBub2RlLnByZXZpb3VzU2libGluZykgKSB7XG5cdFx0XHRcdFx0XHRpZiAoIG5vZGUubm9kZVR5cGUgPT09IDEgKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoIHR5cGUgPT09IFwiZmlyc3RcIiApIHtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdG5vZGUgPSBlbGVtO1xuXG5cdFx0XHRcdFx0LyogZmFsbHMgdGhyb3VnaCAqL1xuXHRcdFx0XHRjYXNlIFwibGFzdFwiOlxuXHRcdFx0XHRcdHdoaWxlICggKG5vZGUgPSBub2RlLm5leHRTaWJsaW5nKSApIHtcblx0XHRcdFx0XHRcdGlmICggbm9kZS5ub2RlVHlwZSA9PT0gMSApIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXG5cdFx0XHRcdGNhc2UgXCJudGhcIjpcblx0XHRcdFx0XHRmaXJzdCA9IG1hdGNoWzJdO1xuXHRcdFx0XHRcdGxhc3QgPSBtYXRjaFszXTtcblxuXHRcdFx0XHRcdGlmICggZmlyc3QgPT09IDEgJiYgbGFzdCA9PT0gMCApIHtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGRvbmVOYW1lID0gbWF0Y2hbMF07XG5cdFx0XHRcdFx0cGFyZW50ID0gZWxlbS5wYXJlbnROb2RlO1xuXG5cdFx0XHRcdFx0aWYgKCBwYXJlbnQgJiYgKHBhcmVudFsgZXhwYW5kbyBdICE9PSBkb25lTmFtZSB8fCAhZWxlbS5ub2RlSW5kZXgpICkge1xuXHRcdFx0XHRcdFx0Y291bnQgPSAwO1xuXG5cdFx0XHRcdFx0XHRmb3IgKCBub2RlID0gcGFyZW50LmZpcnN0Q2hpbGQ7IG5vZGU7IG5vZGUgPSBub2RlLm5leHRTaWJsaW5nICkge1xuXHRcdFx0XHRcdFx0XHRpZiAoIG5vZGUubm9kZVR5cGUgPT09IDEgKSB7XG5cdFx0XHRcdFx0XHRcdFx0bm9kZS5ub2RlSW5kZXggPSArK2NvdW50O1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHBhcmVudFsgZXhwYW5kbyBdID0gZG9uZU5hbWU7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0ZGlmZiA9IGVsZW0ubm9kZUluZGV4IC0gbGFzdDtcblxuXHRcdFx0XHRcdGlmICggZmlyc3QgPT09IDAgKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZGlmZiA9PT0gMDtcblxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gKCBkaWZmICUgZmlyc3QgPT09IDAgJiYgZGlmZiAvIGZpcnN0ID49IDAgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdElEOiBmdW5jdGlvbiggZWxlbSwgbWF0Y2ggKSB7XG5cdFx0XHRyZXR1cm4gZWxlbS5ub2RlVHlwZSA9PT0gMSAmJiBlbGVtLmdldEF0dHJpYnV0ZShcImlkXCIpID09PSBtYXRjaDtcblx0XHR9LFxuXG5cdFx0VEFHOiBmdW5jdGlvbiggZWxlbSwgbWF0Y2ggKSB7XG5cdFx0XHRyZXR1cm4gKG1hdGNoID09PSBcIipcIiAmJiBlbGVtLm5vZGVUeXBlID09PSAxKSB8fCAhIWVsZW0ubm9kZU5hbWUgJiYgZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSBtYXRjaDtcblx0XHR9LFxuXG5cdFx0Q0xBU1M6IGZ1bmN0aW9uKCBlbGVtLCBtYXRjaCApIHtcblx0XHRcdHJldHVybiAoXCIgXCIgKyAoZWxlbS5jbGFzc05hbWUgfHwgZWxlbS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKSkgKyBcIiBcIilcblx0XHRcdFx0LmluZGV4T2YoIG1hdGNoICkgPiAtMTtcblx0XHR9LFxuXG5cdFx0QVRUUjogZnVuY3Rpb24oIGVsZW0sIG1hdGNoICkge1xuXHRcdFx0dmFyIG5hbWUgPSBtYXRjaFsxXSxcblx0XHRcdFx0cmVzdWx0ID0gU2l6emxlLmF0dHIgP1xuXHRcdFx0XHRcdFNpenpsZS5hdHRyKCBlbGVtLCBuYW1lICkgOlxuXHRcdFx0XHRcdEV4cHIuYXR0ckhhbmRsZVsgbmFtZSBdID9cblx0XHRcdFx0XHRFeHByLmF0dHJIYW5kbGVbIG5hbWUgXSggZWxlbSApIDpcblx0XHRcdFx0XHRlbGVtWyBuYW1lIF0gIT0gbnVsbCA/XG5cdFx0XHRcdFx0XHRlbGVtWyBuYW1lIF0gOlxuXHRcdFx0XHRcdFx0ZWxlbS5nZXRBdHRyaWJ1dGUoIG5hbWUgKSxcblx0XHRcdFx0dmFsdWUgPSByZXN1bHQgKyBcIlwiLFxuXHRcdFx0XHR0eXBlID0gbWF0Y2hbMl0sXG5cdFx0XHRcdGNoZWNrID0gbWF0Y2hbNF07XG5cblx0XHRcdHJldHVybiByZXN1bHQgPT0gbnVsbCA/XG5cdFx0XHRcdHR5cGUgPT09IFwiIT1cIiA6XG5cdFx0XHRcdCF0eXBlICYmIFNpenpsZS5hdHRyID9cblx0XHRcdFx0cmVzdWx0ICE9IG51bGwgOlxuXHRcdFx0XHR0eXBlID09PSBcIj1cIiA/XG5cdFx0XHRcdHZhbHVlID09PSBjaGVjayA6XG5cdFx0XHRcdHR5cGUgPT09IFwiKj1cIiA/XG5cdFx0XHRcdHZhbHVlLmluZGV4T2YoY2hlY2spID49IDAgOlxuXHRcdFx0XHR0eXBlID09PSBcIn49XCIgP1xuXHRcdFx0XHQoXCIgXCIgKyB2YWx1ZSArIFwiIFwiKS5pbmRleE9mKGNoZWNrKSA+PSAwIDpcblx0XHRcdFx0IWNoZWNrID9cblx0XHRcdFx0dmFsdWUgJiYgcmVzdWx0ICE9PSBmYWxzZSA6XG5cdFx0XHRcdHR5cGUgPT09IFwiIT1cIiA/XG5cdFx0XHRcdHZhbHVlICE9PSBjaGVjayA6XG5cdFx0XHRcdHR5cGUgPT09IFwiXj1cIiA/XG5cdFx0XHRcdHZhbHVlLmluZGV4T2YoY2hlY2spID09PSAwIDpcblx0XHRcdFx0dHlwZSA9PT0gXCIkPVwiID9cblx0XHRcdFx0dmFsdWUuc3Vic3RyKHZhbHVlLmxlbmd0aCAtIGNoZWNrLmxlbmd0aCkgPT09IGNoZWNrIDpcblx0XHRcdFx0dHlwZSA9PT0gXCJ8PVwiID9cblx0XHRcdFx0dmFsdWUgPT09IGNoZWNrIHx8IHZhbHVlLnN1YnN0cigwLCBjaGVjay5sZW5ndGggKyAxKSA9PT0gY2hlY2sgKyBcIi1cIiA6XG5cdFx0XHRcdGZhbHNlO1xuXHRcdH0sXG5cblx0XHRQT1M6IGZ1bmN0aW9uKCBlbGVtLCBtYXRjaCwgaSwgYXJyYXkgKSB7XG5cdFx0XHR2YXIgbmFtZSA9IG1hdGNoWzJdLFxuXHRcdFx0XHRmaWx0ZXIgPSBFeHByLnNldEZpbHRlcnNbIG5hbWUgXTtcblxuXHRcdFx0aWYgKCBmaWx0ZXIgKSB7XG5cdFx0XHRcdHJldHVybiBmaWx0ZXIoIGVsZW0sIGksIG1hdGNoLCBhcnJheSApO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufTtcblxudmFyIG9yaWdQT1MgPSBFeHByLm1hdGNoLlBPUyxcblx0ZmVzY2FwZSA9IGZ1bmN0aW9uKGFsbCwgbnVtKXtcblx0XHRyZXR1cm4gXCJcXFxcXCIgKyAobnVtIC0gMCArIDEpO1xuXHR9O1xuXG5mb3IgKCB2YXIgdHlwZSBpbiBFeHByLm1hdGNoICkge1xuXHRFeHByLm1hdGNoWyB0eXBlIF0gPSBuZXcgUmVnRXhwKCBFeHByLm1hdGNoWyB0eXBlIF0uc291cmNlICsgKC8oPyFbXlxcW10qXFxdKSg/IVteXFwoXSpcXCkpLy5zb3VyY2UpICk7XG5cdEV4cHIubGVmdE1hdGNoWyB0eXBlIF0gPSBuZXcgUmVnRXhwKCAvKF4oPzoufFxccnxcXG4pKj8pLy5zb3VyY2UgKyBFeHByLm1hdGNoWyB0eXBlIF0uc291cmNlLnJlcGxhY2UoL1xcXFwoXFxkKykvZywgZmVzY2FwZSkgKTtcbn1cbi8vIEV4cG9zZSBvcmlnUE9TXG4vLyBcImdsb2JhbFwiIGFzIGluIHJlZ2FyZGxlc3Mgb2YgcmVsYXRpb24gdG8gYnJhY2tldHMvcGFyZW5zXG5FeHByLm1hdGNoLmdsb2JhbFBPUyA9IG9yaWdQT1M7XG5cbnZhciBtYWtlQXJyYXkgPSBmdW5jdGlvbiggYXJyYXksIHJlc3VsdHMgKSB7XG5cdGFycmF5ID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGFycmF5LCAwICk7XG5cblx0aWYgKCByZXN1bHRzICkge1xuXHRcdHJlc3VsdHMucHVzaC5hcHBseSggcmVzdWx0cywgYXJyYXkgKTtcblx0XHRyZXR1cm4gcmVzdWx0cztcblx0fVxuXG5cdHJldHVybiBhcnJheTtcbn07XG5cbi8vIFBlcmZvcm0gYSBzaW1wbGUgY2hlY2sgdG8gZGV0ZXJtaW5lIGlmIHRoZSBicm93c2VyIGlzIGNhcGFibGUgb2Zcbi8vIGNvbnZlcnRpbmcgYSBOb2RlTGlzdCB0byBhbiBhcnJheSB1c2luZyBidWlsdGluIG1ldGhvZHMuXG4vLyBBbHNvIHZlcmlmaWVzIHRoYXQgdGhlIHJldHVybmVkIGFycmF5IGhvbGRzIERPTSBub2Rlc1xuLy8gKHdoaWNoIGlzIG5vdCB0aGUgY2FzZSBpbiB0aGUgQmxhY2tiZXJyeSBicm93c2VyKVxudHJ5IHtcblx0QXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jaGlsZE5vZGVzLCAwIClbMF0ubm9kZVR5cGU7XG5cbi8vIFByb3ZpZGUgYSBmYWxsYmFjayBtZXRob2QgaWYgaXQgZG9lcyBub3Qgd29ya1xufSBjYXRjaCggZSApIHtcblx0bWFrZUFycmF5ID0gZnVuY3Rpb24oIGFycmF5LCByZXN1bHRzICkge1xuXHRcdHZhciBpID0gMCxcblx0XHRcdHJldCA9IHJlc3VsdHMgfHwgW107XG5cblx0XHRpZiAoIHRvU3RyaW5nLmNhbGwoYXJyYXkpID09PSBcIltvYmplY3QgQXJyYXldXCIgKSB7XG5cdFx0XHRBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSggcmV0LCBhcnJheSApO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmICggdHlwZW9mIGFycmF5Lmxlbmd0aCA9PT0gXCJudW1iZXJcIiApIHtcblx0XHRcdFx0Zm9yICggdmFyIGwgPSBhcnJheS5sZW5ndGg7IGkgPCBsOyBpKysgKSB7XG5cdFx0XHRcdFx0cmV0LnB1c2goIGFycmF5W2ldICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Zm9yICggOyBhcnJheVtpXTsgaSsrICkge1xuXHRcdFx0XHRcdHJldC5wdXNoKCBhcnJheVtpXSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJldDtcblx0fTtcbn1cblxudmFyIHNvcnRPcmRlciwgc2libGluZ0NoZWNrO1xuXG5pZiAoIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiApIHtcblx0c29ydE9yZGVyID0gZnVuY3Rpb24oIGEsIGIgKSB7XG5cdFx0aWYgKCBhID09PSBiICkge1xuXHRcdFx0aGFzRHVwbGljYXRlID0gdHJ1ZTtcblx0XHRcdHJldHVybiAwO1xuXHRcdH1cblxuXHRcdGlmICggIWEuY29tcGFyZURvY3VtZW50UG9zaXRpb24gfHwgIWIuY29tcGFyZURvY3VtZW50UG9zaXRpb24gKSB7XG5cdFx0XHRyZXR1cm4gYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiA/IC0xIDogMTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihiKSAmIDQgPyAtMSA6IDE7XG5cdH07XG5cbn0gZWxzZSB7XG5cdHNvcnRPcmRlciA9IGZ1bmN0aW9uKCBhLCBiICkge1xuXHRcdC8vIFRoZSBub2RlcyBhcmUgaWRlbnRpY2FsLCB3ZSBjYW4gZXhpdCBlYXJseVxuXHRcdGlmICggYSA9PT0gYiApIHtcblx0XHRcdGhhc0R1cGxpY2F0ZSA9IHRydWU7XG5cdFx0XHRyZXR1cm4gMDtcblxuXHRcdC8vIEZhbGxiYWNrIHRvIHVzaW5nIHNvdXJjZUluZGV4IChpbiBJRSkgaWYgaXQncyBhdmFpbGFibGUgb24gYm90aCBub2Rlc1xuXHRcdH0gZWxzZSBpZiAoIGEuc291cmNlSW5kZXggJiYgYi5zb3VyY2VJbmRleCApIHtcblx0XHRcdHJldHVybiBhLnNvdXJjZUluZGV4IC0gYi5zb3VyY2VJbmRleDtcblx0XHR9XG5cblx0XHR2YXIgYWwsIGJsLFxuXHRcdFx0YXAgPSBbXSxcblx0XHRcdGJwID0gW10sXG5cdFx0XHRhdXAgPSBhLnBhcmVudE5vZGUsXG5cdFx0XHRidXAgPSBiLnBhcmVudE5vZGUsXG5cdFx0XHRjdXIgPSBhdXA7XG5cblx0XHQvLyBJZiB0aGUgbm9kZXMgYXJlIHNpYmxpbmdzIChvciBpZGVudGljYWwpIHdlIGNhbiBkbyBhIHF1aWNrIGNoZWNrXG5cdFx0aWYgKCBhdXAgPT09IGJ1cCApIHtcblx0XHRcdHJldHVybiBzaWJsaW5nQ2hlY2soIGEsIGIgKTtcblxuXHRcdC8vIElmIG5vIHBhcmVudHMgd2VyZSBmb3VuZCB0aGVuIHRoZSBub2RlcyBhcmUgZGlzY29ubmVjdGVkXG5cdFx0fSBlbHNlIGlmICggIWF1cCApIHtcblx0XHRcdHJldHVybiAtMTtcblxuXHRcdH0gZWxzZSBpZiAoICFidXAgKSB7XG5cdFx0XHRyZXR1cm4gMTtcblx0XHR9XG5cblx0XHQvLyBPdGhlcndpc2UgdGhleSdyZSBzb21ld2hlcmUgZWxzZSBpbiB0aGUgdHJlZSBzbyB3ZSBuZWVkXG5cdFx0Ly8gdG8gYnVpbGQgdXAgYSBmdWxsIGxpc3Qgb2YgdGhlIHBhcmVudE5vZGVzIGZvciBjb21wYXJpc29uXG5cdFx0d2hpbGUgKCBjdXIgKSB7XG5cdFx0XHRhcC51bnNoaWZ0KCBjdXIgKTtcblx0XHRcdGN1ciA9IGN1ci5wYXJlbnROb2RlO1xuXHRcdH1cblxuXHRcdGN1ciA9IGJ1cDtcblxuXHRcdHdoaWxlICggY3VyICkge1xuXHRcdFx0YnAudW5zaGlmdCggY3VyICk7XG5cdFx0XHRjdXIgPSBjdXIucGFyZW50Tm9kZTtcblx0XHR9XG5cblx0XHRhbCA9IGFwLmxlbmd0aDtcblx0XHRibCA9IGJwLmxlbmd0aDtcblxuXHRcdC8vIFN0YXJ0IHdhbGtpbmcgZG93biB0aGUgdHJlZSBsb29raW5nIGZvciBhIGRpc2NyZXBhbmN5XG5cdFx0Zm9yICggdmFyIGkgPSAwOyBpIDwgYWwgJiYgaSA8IGJsOyBpKysgKSB7XG5cdFx0XHRpZiAoIGFwW2ldICE9PSBicFtpXSApIHtcblx0XHRcdFx0cmV0dXJuIHNpYmxpbmdDaGVjayggYXBbaV0sIGJwW2ldICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gV2UgZW5kZWQgc29tZXBsYWNlIHVwIHRoZSB0cmVlIHNvIGRvIGEgc2libGluZyBjaGVja1xuXHRcdHJldHVybiBpID09PSBhbCA/XG5cdFx0XHRzaWJsaW5nQ2hlY2soIGEsIGJwW2ldLCAtMSApIDpcblx0XHRcdHNpYmxpbmdDaGVjayggYXBbaV0sIGIsIDEgKTtcblx0fTtcblxuXHRzaWJsaW5nQ2hlY2sgPSBmdW5jdGlvbiggYSwgYiwgcmV0ICkge1xuXHRcdGlmICggYSA9PT0gYiApIHtcblx0XHRcdHJldHVybiByZXQ7XG5cdFx0fVxuXG5cdFx0dmFyIGN1ciA9IGEubmV4dFNpYmxpbmc7XG5cblx0XHR3aGlsZSAoIGN1ciApIHtcblx0XHRcdGlmICggY3VyID09PSBiICkge1xuXHRcdFx0XHRyZXR1cm4gLTE7XG5cdFx0XHR9XG5cblx0XHRcdGN1ciA9IGN1ci5uZXh0U2libGluZztcblx0XHR9XG5cblx0XHRyZXR1cm4gMTtcblx0fTtcbn1cblxuLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSBicm93c2VyIHJldHVybnMgZWxlbWVudHMgYnkgbmFtZSB3aGVuXG4vLyBxdWVyeWluZyBieSBnZXRFbGVtZW50QnlJZCAoYW5kIHByb3ZpZGUgYSB3b3JrYXJvdW5kKVxuKGZ1bmN0aW9uKCl7XG5cdC8vIFdlJ3JlIGdvaW5nIHRvIGluamVjdCBhIGZha2UgaW5wdXQgZWxlbWVudCB3aXRoIGEgc3BlY2lmaWVkIG5hbWVcblx0dmFyIGZvcm0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpLFxuXHRcdGlkID0gXCJzY3JpcHRcIiArIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCksXG5cdFx0cm9vdCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxuXHRmb3JtLmlubmVySFRNTCA9IFwiPGEgbmFtZT0nXCIgKyBpZCArIFwiJy8+XCI7XG5cblx0Ly8gSW5qZWN0IGl0IGludG8gdGhlIHJvb3QgZWxlbWVudCwgY2hlY2sgaXRzIHN0YXR1cywgYW5kIHJlbW92ZSBpdCBxdWlja2x5XG5cdHJvb3QuaW5zZXJ0QmVmb3JlKCBmb3JtLCByb290LmZpcnN0Q2hpbGQgKTtcblxuXHQvLyBUaGUgd29ya2Fyb3VuZCBoYXMgdG8gZG8gYWRkaXRpb25hbCBjaGVja3MgYWZ0ZXIgYSBnZXRFbGVtZW50QnlJZFxuXHQvLyBXaGljaCBzbG93cyB0aGluZ3MgZG93biBmb3Igb3RoZXIgYnJvd3NlcnMgKGhlbmNlIHRoZSBicmFuY2hpbmcpXG5cdGlmICggZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIGlkICkgKSB7XG5cdFx0RXhwci5maW5kLklEID0gZnVuY3Rpb24oIG1hdGNoLCBjb250ZXh0LCBpc1hNTCApIHtcblx0XHRcdGlmICggdHlwZW9mIGNvbnRleHQuZ2V0RWxlbWVudEJ5SWQgIT09IFwidW5kZWZpbmVkXCIgJiYgIWlzWE1MICkge1xuXHRcdFx0XHR2YXIgbSA9IGNvbnRleHQuZ2V0RWxlbWVudEJ5SWQobWF0Y2hbMV0pO1xuXG5cdFx0XHRcdHJldHVybiBtID9cblx0XHRcdFx0XHRtLmlkID09PSBtYXRjaFsxXSB8fCB0eXBlb2YgbS5nZXRBdHRyaWJ1dGVOb2RlICE9PSBcInVuZGVmaW5lZFwiICYmIG0uZ2V0QXR0cmlidXRlTm9kZShcImlkXCIpLm5vZGVWYWx1ZSA9PT0gbWF0Y2hbMV0gP1xuXHRcdFx0XHRcdFx0W21dIDpcblx0XHRcdFx0XHRcdHVuZGVmaW5lZCA6XG5cdFx0XHRcdFx0W107XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdEV4cHIuZmlsdGVyLklEID0gZnVuY3Rpb24oIGVsZW0sIG1hdGNoICkge1xuXHRcdFx0dmFyIG5vZGUgPSB0eXBlb2YgZWxlbS5nZXRBdHRyaWJ1dGVOb2RlICE9PSBcInVuZGVmaW5lZFwiICYmIGVsZW0uZ2V0QXR0cmlidXRlTm9kZShcImlkXCIpO1xuXG5cdFx0XHRyZXR1cm4gZWxlbS5ub2RlVHlwZSA9PT0gMSAmJiBub2RlICYmIG5vZGUubm9kZVZhbHVlID09PSBtYXRjaDtcblx0XHR9O1xuXHR9XG5cblx0cm9vdC5yZW1vdmVDaGlsZCggZm9ybSApO1xuXG5cdC8vIHJlbGVhc2UgbWVtb3J5IGluIElFXG5cdHJvb3QgPSBmb3JtID0gbnVsbDtcbn0pKCk7XG5cbihmdW5jdGlvbigpe1xuXHQvLyBDaGVjayB0byBzZWUgaWYgdGhlIGJyb3dzZXIgcmV0dXJucyBvbmx5IGVsZW1lbnRzXG5cdC8vIHdoZW4gZG9pbmcgZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCIqXCIpXG5cblx0Ly8gQ3JlYXRlIGEgZmFrZSBlbGVtZW50XG5cdHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRkaXYuYXBwZW5kQ2hpbGQoIGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQoXCJcIikgKTtcblxuXHQvLyBNYWtlIHN1cmUgbm8gY29tbWVudHMgYXJlIGZvdW5kXG5cdGlmICggZGl2LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiKlwiKS5sZW5ndGggPiAwICkge1xuXHRcdEV4cHIuZmluZC5UQUcgPSBmdW5jdGlvbiggbWF0Y2gsIGNvbnRleHQgKSB7XG5cdFx0XHR2YXIgcmVzdWx0cyA9IGNvbnRleHQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoIG1hdGNoWzFdICk7XG5cblx0XHRcdC8vIEZpbHRlciBvdXQgcG9zc2libGUgY29tbWVudHNcblx0XHRcdGlmICggbWF0Y2hbMV0gPT09IFwiKlwiICkge1xuXHRcdFx0XHR2YXIgdG1wID0gW107XG5cblx0XHRcdFx0Zm9yICggdmFyIGkgPSAwOyByZXN1bHRzW2ldOyBpKysgKSB7XG5cdFx0XHRcdFx0aWYgKCByZXN1bHRzW2ldLm5vZGVUeXBlID09PSAxICkge1xuXHRcdFx0XHRcdFx0dG1wLnB1c2goIHJlc3VsdHNbaV0gKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXN1bHRzID0gdG1wO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcmVzdWx0cztcblx0XHR9O1xuXHR9XG5cblx0Ly8gQ2hlY2sgdG8gc2VlIGlmIGFuIGF0dHJpYnV0ZSByZXR1cm5zIG5vcm1hbGl6ZWQgaHJlZiBhdHRyaWJ1dGVzXG5cdGRpdi5pbm5lckhUTUwgPSBcIjxhIGhyZWY9JyMnPjwvYT5cIjtcblxuXHRpZiAoIGRpdi5maXJzdENoaWxkICYmIHR5cGVvZiBkaXYuZmlyc3RDaGlsZC5nZXRBdHRyaWJ1dGUgIT09IFwidW5kZWZpbmVkXCIgJiZcblx0XHRcdGRpdi5maXJzdENoaWxkLmdldEF0dHJpYnV0ZShcImhyZWZcIikgIT09IFwiI1wiICkge1xuXG5cdFx0RXhwci5hdHRySGFuZGxlLmhyZWYgPSBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSggXCJocmVmXCIsIDIgKTtcblx0XHR9O1xuXHR9XG5cblx0Ly8gcmVsZWFzZSBtZW1vcnkgaW4gSUVcblx0ZGl2ID0gbnVsbDtcbn0pKCk7XG5cbmlmICggZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCApIHtcblx0KGZ1bmN0aW9uKCl7XG5cdFx0dmFyIG9sZFNpenpsZSA9IFNpenpsZSxcblx0XHRcdGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksXG5cdFx0XHRpZCA9IFwiX19zaXp6bGVfX1wiO1xuXG5cdFx0ZGl2LmlubmVySFRNTCA9IFwiPHAgY2xhc3M9J1RFU1QnPjwvcD5cIjtcblxuXHRcdC8vIFNhZmFyaSBjYW4ndCBoYW5kbGUgdXBwZXJjYXNlIG9yIHVuaWNvZGUgY2hhcmFjdGVycyB3aGVuXG5cdFx0Ly8gaW4gcXVpcmtzIG1vZGUuXG5cdFx0aWYgKCBkaXYucXVlcnlTZWxlY3RvckFsbCAmJiBkaXYucXVlcnlTZWxlY3RvckFsbChcIi5URVNUXCIpLmxlbmd0aCA9PT0gMCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRTaXp6bGUgPSBmdW5jdGlvbiggcXVlcnksIGNvbnRleHQsIGV4dHJhLCBzZWVkICkge1xuXHRcdFx0Y29udGV4dCA9IGNvbnRleHQgfHwgZG9jdW1lbnQ7XG5cblx0XHRcdC8vIE9ubHkgdXNlIHF1ZXJ5U2VsZWN0b3JBbGwgb24gbm9uLVhNTCBkb2N1bWVudHNcblx0XHRcdC8vIChJRCBzZWxlY3RvcnMgZG9uJ3Qgd29yayBpbiBub24tSFRNTCBkb2N1bWVudHMpXG5cdFx0XHRpZiAoICFzZWVkICYmICFTaXp6bGUuaXNYTUwoY29udGV4dCkgKSB7XG5cdFx0XHRcdC8vIFNlZSBpZiB3ZSBmaW5kIGEgc2VsZWN0b3IgdG8gc3BlZWQgdXBcblx0XHRcdFx0dmFyIG1hdGNoID0gL14oXFx3KyQpfF5cXC4oW1xcd1xcLV0rJCl8XiMoW1xcd1xcLV0rJCkvLmV4ZWMoIHF1ZXJ5ICk7XG5cblx0XHRcdFx0aWYgKCBtYXRjaCAmJiAoY29udGV4dC5ub2RlVHlwZSA9PT0gMSB8fCBjb250ZXh0Lm5vZGVUeXBlID09PSA5KSApIHtcblx0XHRcdFx0XHQvLyBTcGVlZC11cDogU2l6emxlKFwiVEFHXCIpXG5cdFx0XHRcdFx0aWYgKCBtYXRjaFsxXSApIHtcblx0XHRcdFx0XHRcdHJldHVybiBtYWtlQXJyYXkoIGNvbnRleHQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoIHF1ZXJ5ICksIGV4dHJhICk7XG5cblx0XHRcdFx0XHQvLyBTcGVlZC11cDogU2l6emxlKFwiLkNMQVNTXCIpXG5cdFx0XHRcdFx0fSBlbHNlIGlmICggbWF0Y2hbMl0gJiYgRXhwci5maW5kLkNMQVNTICYmIGNvbnRleHQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSApIHtcblx0XHRcdFx0XHRcdHJldHVybiBtYWtlQXJyYXkoIGNvbnRleHQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSggbWF0Y2hbMl0gKSwgZXh0cmEgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIGNvbnRleHQubm9kZVR5cGUgPT09IDkgKSB7XG5cdFx0XHRcdFx0Ly8gU3BlZWQtdXA6IFNpenpsZShcImJvZHlcIilcblx0XHRcdFx0XHQvLyBUaGUgYm9keSBlbGVtZW50IG9ubHkgZXhpc3RzIG9uY2UsIG9wdGltaXplIGZpbmRpbmcgaXRcblx0XHRcdFx0XHRpZiAoIHF1ZXJ5ID09PSBcImJvZHlcIiAmJiBjb250ZXh0LmJvZHkgKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gbWFrZUFycmF5KCBbIGNvbnRleHQuYm9keSBdLCBleHRyYSApO1xuXG5cdFx0XHRcdFx0Ly8gU3BlZWQtdXA6IFNpenpsZShcIiNJRFwiKVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAoIG1hdGNoICYmIG1hdGNoWzNdICkge1xuXHRcdFx0XHRcdFx0dmFyIGVsZW0gPSBjb250ZXh0LmdldEVsZW1lbnRCeUlkKCBtYXRjaFszXSApO1xuXG5cdFx0XHRcdFx0XHQvLyBDaGVjayBwYXJlbnROb2RlIHRvIGNhdGNoIHdoZW4gQmxhY2tiZXJyeSA0LjYgcmV0dXJuc1xuXHRcdFx0XHRcdFx0Ly8gbm9kZXMgdGhhdCBhcmUgbm8gbG9uZ2VyIGluIHRoZSBkb2N1bWVudCAjNjk2M1xuXHRcdFx0XHRcdFx0aWYgKCBlbGVtICYmIGVsZW0ucGFyZW50Tm9kZSApIHtcblx0XHRcdFx0XHRcdFx0Ly8gSGFuZGxlIHRoZSBjYXNlIHdoZXJlIElFIGFuZCBPcGVyYSByZXR1cm4gaXRlbXNcblx0XHRcdFx0XHRcdFx0Ly8gYnkgbmFtZSBpbnN0ZWFkIG9mIElEXG5cdFx0XHRcdFx0XHRcdGlmICggZWxlbS5pZCA9PT0gbWF0Y2hbM10gKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG1ha2VBcnJheSggWyBlbGVtIF0sIGV4dHJhICk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIG1ha2VBcnJheSggW10sIGV4dHJhICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdHJldHVybiBtYWtlQXJyYXkoIGNvbnRleHQucXVlcnlTZWxlY3RvckFsbChxdWVyeSksIGV4dHJhICk7XG5cdFx0XHRcdFx0fSBjYXRjaChxc2FFcnJvcikge31cblxuXHRcdFx0XHQvLyBxU0Egd29ya3Mgc3RyYW5nZWx5IG9uIEVsZW1lbnQtcm9vdGVkIHF1ZXJpZXNcblx0XHRcdFx0Ly8gV2UgY2FuIHdvcmsgYXJvdW5kIHRoaXMgYnkgc3BlY2lmeWluZyBhbiBleHRyYSBJRCBvbiB0aGUgcm9vdFxuXHRcdFx0XHQvLyBhbmQgd29ya2luZyB1cCBmcm9tIHRoZXJlIChUaGFua3MgdG8gQW5kcmV3IER1cG9udCBmb3IgdGhlIHRlY2huaXF1ZSlcblx0XHRcdFx0Ly8gSUUgOCBkb2Vzbid0IHdvcmsgb24gb2JqZWN0IGVsZW1lbnRzXG5cdFx0XHRcdH0gZWxzZSBpZiAoIGNvbnRleHQubm9kZVR5cGUgPT09IDEgJiYgY29udGV4dC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpICE9PSBcIm9iamVjdFwiICkge1xuXHRcdFx0XHRcdHZhciBvbGRDb250ZXh0ID0gY29udGV4dCxcblx0XHRcdFx0XHRcdG9sZCA9IGNvbnRleHQuZ2V0QXR0cmlidXRlKCBcImlkXCIgKSxcblx0XHRcdFx0XHRcdG5pZCA9IG9sZCB8fCBpZCxcblx0XHRcdFx0XHRcdGhhc1BhcmVudCA9IGNvbnRleHQucGFyZW50Tm9kZSxcblx0XHRcdFx0XHRcdHJlbGF0aXZlSGllcmFyY2h5U2VsZWN0b3IgPSAvXlxccypbK35dLy50ZXN0KCBxdWVyeSApO1xuXG5cdFx0XHRcdFx0aWYgKCAhb2xkICkge1xuXHRcdFx0XHRcdFx0Y29udGV4dC5zZXRBdHRyaWJ1dGUoIFwiaWRcIiwgbmlkICk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdG5pZCA9IG5pZC5yZXBsYWNlKCAvJy9nLCBcIlxcXFwkJlwiICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmICggcmVsYXRpdmVIaWVyYXJjaHlTZWxlY3RvciAmJiBoYXNQYXJlbnQgKSB7XG5cdFx0XHRcdFx0XHRjb250ZXh0ID0gY29udGV4dC5wYXJlbnROb2RlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRpZiAoICFyZWxhdGl2ZUhpZXJhcmNoeVNlbGVjdG9yIHx8IGhhc1BhcmVudCApIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIG1ha2VBcnJheSggY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKCBcIltpZD0nXCIgKyBuaWQgKyBcIiddIFwiICsgcXVlcnkgKSwgZXh0cmEgKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdH0gY2F0Y2gocHNldWRvRXJyb3IpIHtcblx0XHRcdFx0XHR9IGZpbmFsbHkge1xuXHRcdFx0XHRcdFx0aWYgKCAhb2xkICkge1xuXHRcdFx0XHRcdFx0XHRvbGRDb250ZXh0LnJlbW92ZUF0dHJpYnV0ZSggXCJpZFwiICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBvbGRTaXp6bGUocXVlcnksIGNvbnRleHQsIGV4dHJhLCBzZWVkKTtcblx0XHR9O1xuXG5cdFx0Zm9yICggdmFyIHByb3AgaW4gb2xkU2l6emxlICkge1xuXHRcdFx0U2l6emxlWyBwcm9wIF0gPSBvbGRTaXp6bGVbIHByb3AgXTtcblx0XHR9XG5cblx0XHQvLyByZWxlYXNlIG1lbW9yeSBpbiBJRVxuXHRcdGRpdiA9IG51bGw7XG5cdH0pKCk7XG59XG5cbihmdW5jdGlvbigpe1xuXHR2YXIgaHRtbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcblx0XHRtYXRjaGVzID0gaHRtbC5tYXRjaGVzU2VsZWN0b3IgfHwgaHRtbC5tb3pNYXRjaGVzU2VsZWN0b3IgfHwgaHRtbC53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHwgaHRtbC5tc01hdGNoZXNTZWxlY3RvcjtcblxuXHRpZiAoIG1hdGNoZXMgKSB7XG5cdFx0Ly8gQ2hlY2sgdG8gc2VlIGlmIGl0J3MgcG9zc2libGUgdG8gZG8gbWF0Y2hlc1NlbGVjdG9yXG5cdFx0Ly8gb24gYSBkaXNjb25uZWN0ZWQgbm9kZSAoSUUgOSBmYWlscyB0aGlzKVxuXHRcdHZhciBkaXNjb25uZWN0ZWRNYXRjaCA9ICFtYXRjaGVzLmNhbGwoIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoIFwiZGl2XCIgKSwgXCJkaXZcIiApLFxuXHRcdFx0cHNldWRvV29ya3MgPSBmYWxzZTtcblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBUaGlzIHNob3VsZCBmYWlsIHdpdGggYW4gZXhjZXB0aW9uXG5cdFx0XHQvLyBHZWNrbyBkb2VzIG5vdCBlcnJvciwgcmV0dXJucyBmYWxzZSBpbnN0ZWFkXG5cdFx0XHRtYXRjaGVzLmNhbGwoIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgXCJbdGVzdCE9JyddOnNpenpsZVwiICk7XG5cblx0XHR9IGNhdGNoKCBwc2V1ZG9FcnJvciApIHtcblx0XHRcdHBzZXVkb1dvcmtzID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRTaXp6bGUubWF0Y2hlc1NlbGVjdG9yID0gZnVuY3Rpb24oIG5vZGUsIGV4cHIgKSB7XG5cdFx0XHQvLyBNYWtlIHN1cmUgdGhhdCBhdHRyaWJ1dGUgc2VsZWN0b3JzIGFyZSBxdW90ZWRcblx0XHRcdGV4cHIgPSBleHByLnJlcGxhY2UoL1xcPVxccyooW14nXCJcXF1dKilcXHMqXFxdL2csIFwiPSckMSddXCIpO1xuXG5cdFx0XHRpZiAoICFTaXp6bGUuaXNYTUwoIG5vZGUgKSApIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRpZiAoIHBzZXVkb1dvcmtzIHx8ICFFeHByLm1hdGNoLlBTRVVETy50ZXN0KCBleHByICkgJiYgIS8hPS8udGVzdCggZXhwciApICkge1xuXHRcdFx0XHRcdFx0dmFyIHJldCA9IG1hdGNoZXMuY2FsbCggbm9kZSwgZXhwciApO1xuXG5cdFx0XHRcdFx0XHQvLyBJRSA5J3MgbWF0Y2hlc1NlbGVjdG9yIHJldHVybnMgZmFsc2Ugb24gZGlzY29ubmVjdGVkIG5vZGVzXG5cdFx0XHRcdFx0XHRpZiAoIHJldCB8fCAhZGlzY29ubmVjdGVkTWF0Y2ggfHxcblx0XHRcdFx0XHRcdFx0XHQvLyBBcyB3ZWxsLCBkaXNjb25uZWN0ZWQgbm9kZXMgYXJlIHNhaWQgdG8gYmUgaW4gYSBkb2N1bWVudFxuXHRcdFx0XHRcdFx0XHRcdC8vIGZyYWdtZW50IGluIElFIDksIHNvIGNoZWNrIGZvciB0aGF0XG5cdFx0XHRcdFx0XHRcdFx0bm9kZS5kb2N1bWVudCAmJiBub2RlLmRvY3VtZW50Lm5vZGVUeXBlICE9PSAxMSApIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gY2F0Y2goZSkge31cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIFNpenpsZShleHByLCBudWxsLCBudWxsLCBbbm9kZV0pLmxlbmd0aCA+IDA7XG5cdFx0fTtcblx0fVxufSkoKTtcblxuKGZ1bmN0aW9uKCl7XG5cdHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG5cdGRpdi5pbm5lckhUTUwgPSBcIjxkaXYgY2xhc3M9J3Rlc3QgZSc+PC9kaXY+PGRpdiBjbGFzcz0ndGVzdCc+PC9kaXY+XCI7XG5cblx0Ly8gT3BlcmEgY2FuJ3QgZmluZCBhIHNlY29uZCBjbGFzc25hbWUgKGluIDkuNilcblx0Ly8gQWxzbywgbWFrZSBzdXJlIHRoYXQgZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSBhY3R1YWxseSBleGlzdHNcblx0aWYgKCAhZGl2LmdldEVsZW1lbnRzQnlDbGFzc05hbWUgfHwgZGl2LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJlXCIpLmxlbmd0aCA9PT0gMCApIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHQvLyBTYWZhcmkgY2FjaGVzIGNsYXNzIGF0dHJpYnV0ZXMsIGRvZXNuJ3QgY2F0Y2ggY2hhbmdlcyAoaW4gMy4yKVxuXHRkaXYubGFzdENoaWxkLmNsYXNzTmFtZSA9IFwiZVwiO1xuXG5cdGlmICggZGl2LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJlXCIpLmxlbmd0aCA9PT0gMSApIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRFeHByLm9yZGVyLnNwbGljZSgxLCAwLCBcIkNMQVNTXCIpO1xuXHRFeHByLmZpbmQuQ0xBU1MgPSBmdW5jdGlvbiggbWF0Y2gsIGNvbnRleHQsIGlzWE1MICkge1xuXHRcdGlmICggdHlwZW9mIGNvbnRleHQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiAhaXNYTUwgKSB7XG5cdFx0XHRyZXR1cm4gY29udGV4dC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKG1hdGNoWzFdKTtcblx0XHR9XG5cdH07XG5cblx0Ly8gcmVsZWFzZSBtZW1vcnkgaW4gSUVcblx0ZGl2ID0gbnVsbDtcbn0pKCk7XG5cbmZ1bmN0aW9uIGRpck5vZGVDaGVjayggZGlyLCBjdXIsIGRvbmVOYW1lLCBjaGVja1NldCwgbm9kZUNoZWNrLCBpc1hNTCApIHtcblx0Zm9yICggdmFyIGkgPSAwLCBsID0gY2hlY2tTZXQubGVuZ3RoOyBpIDwgbDsgaSsrICkge1xuXHRcdHZhciBlbGVtID0gY2hlY2tTZXRbaV07XG5cblx0XHRpZiAoIGVsZW0gKSB7XG5cdFx0XHR2YXIgbWF0Y2ggPSBmYWxzZTtcblxuXHRcdFx0ZWxlbSA9IGVsZW1bZGlyXTtcblxuXHRcdFx0d2hpbGUgKCBlbGVtICkge1xuXHRcdFx0XHRpZiAoIGVsZW1bIGV4cGFuZG8gXSA9PT0gZG9uZU5hbWUgKSB7XG5cdFx0XHRcdFx0bWF0Y2ggPSBjaGVja1NldFtlbGVtLnNpenNldF07XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIGVsZW0ubm9kZVR5cGUgPT09IDEgJiYgIWlzWE1MICl7XG5cdFx0XHRcdFx0ZWxlbVsgZXhwYW5kbyBdID0gZG9uZU5hbWU7XG5cdFx0XHRcdFx0ZWxlbS5zaXpzZXQgPSBpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IGN1ciApIHtcblx0XHRcdFx0XHRtYXRjaCA9IGVsZW07XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRlbGVtID0gZWxlbVtkaXJdO1xuXHRcdFx0fVxuXG5cdFx0XHRjaGVja1NldFtpXSA9IG1hdGNoO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBkaXJDaGVjayggZGlyLCBjdXIsIGRvbmVOYW1lLCBjaGVja1NldCwgbm9kZUNoZWNrLCBpc1hNTCApIHtcblx0Zm9yICggdmFyIGkgPSAwLCBsID0gY2hlY2tTZXQubGVuZ3RoOyBpIDwgbDsgaSsrICkge1xuXHRcdHZhciBlbGVtID0gY2hlY2tTZXRbaV07XG5cblx0XHRpZiAoIGVsZW0gKSB7XG5cdFx0XHR2YXIgbWF0Y2ggPSBmYWxzZTtcblxuXHRcdFx0ZWxlbSA9IGVsZW1bZGlyXTtcblxuXHRcdFx0d2hpbGUgKCBlbGVtICkge1xuXHRcdFx0XHRpZiAoIGVsZW1bIGV4cGFuZG8gXSA9PT0gZG9uZU5hbWUgKSB7XG5cdFx0XHRcdFx0bWF0Y2ggPSBjaGVja1NldFtlbGVtLnNpenNldF07XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIGVsZW0ubm9kZVR5cGUgPT09IDEgKSB7XG5cdFx0XHRcdFx0aWYgKCAhaXNYTUwgKSB7XG5cdFx0XHRcdFx0XHRlbGVtWyBleHBhbmRvIF0gPSBkb25lTmFtZTtcblx0XHRcdFx0XHRcdGVsZW0uc2l6c2V0ID0gaTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoIHR5cGVvZiBjdXIgIT09IFwic3RyaW5nXCIgKSB7XG5cdFx0XHRcdFx0XHRpZiAoIGVsZW0gPT09IGN1ciApIHtcblx0XHRcdFx0XHRcdFx0bWF0Y2ggPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdH0gZWxzZSBpZiAoIFNpenpsZS5maWx0ZXIoIGN1ciwgW2VsZW1dICkubGVuZ3RoID4gMCApIHtcblx0XHRcdFx0XHRcdG1hdGNoID0gZWxlbTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGVsZW0gPSBlbGVtW2Rpcl07XG5cdFx0XHR9XG5cblx0XHRcdGNoZWNrU2V0W2ldID0gbWF0Y2g7XG5cdFx0fVxuXHR9XG59XG5cbmlmICggZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNvbnRhaW5zICkge1xuXHRTaXp6bGUuY29udGFpbnMgPSBmdW5jdGlvbiggYSwgYiApIHtcblx0XHRyZXR1cm4gYSAhPT0gYiAmJiAoYS5jb250YWlucyA/IGEuY29udGFpbnMoYikgOiB0cnVlKTtcblx0fTtcblxufSBlbHNlIGlmICggZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uICkge1xuXHRTaXp6bGUuY29udGFpbnMgPSBmdW5jdGlvbiggYSwgYiApIHtcblx0XHRyZXR1cm4gISEoYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihiKSAmIDE2KTtcblx0fTtcblxufSBlbHNlIHtcblx0U2l6emxlLmNvbnRhaW5zID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xufVxuXG5TaXp6bGUuaXNYTUwgPSBmdW5jdGlvbiggZWxlbSApIHtcblx0Ly8gZG9jdW1lbnRFbGVtZW50IGlzIHZlcmlmaWVkIGZvciBjYXNlcyB3aGVyZSBpdCBkb2Vzbid0IHlldCBleGlzdFxuXHQvLyAoc3VjaCBhcyBsb2FkaW5nIGlmcmFtZXMgaW4gSUUgLSAjNDgzMylcblx0dmFyIGRvY3VtZW50RWxlbWVudCA9IChlbGVtID8gZWxlbS5vd25lckRvY3VtZW50IHx8IGVsZW0gOiAwKS5kb2N1bWVudEVsZW1lbnQ7XG5cblx0cmV0dXJuIGRvY3VtZW50RWxlbWVudCA/IGRvY3VtZW50RWxlbWVudC5ub2RlTmFtZSAhPT0gXCJIVE1MXCIgOiBmYWxzZTtcbn07XG5cbnZhciBwb3NQcm9jZXNzID0gZnVuY3Rpb24oIHNlbGVjdG9yLCBjb250ZXh0LCBzZWVkICkge1xuXHR2YXIgbWF0Y2gsXG5cdFx0dG1wU2V0ID0gW10sXG5cdFx0bGF0ZXIgPSBcIlwiLFxuXHRcdHJvb3QgPSBjb250ZXh0Lm5vZGVUeXBlID8gW2NvbnRleHRdIDogY29udGV4dDtcblxuXHQvLyBQb3NpdGlvbiBzZWxlY3RvcnMgbXVzdCBiZSBkb25lIGFmdGVyIHRoZSBmaWx0ZXJcblx0Ly8gQW5kIHNvIG11c3QgOm5vdChwb3NpdGlvbmFsKSBzbyB3ZSBtb3ZlIGFsbCBQU0VVRE9zIHRvIHRoZSBlbmRcblx0d2hpbGUgKCAobWF0Y2ggPSBFeHByLm1hdGNoLlBTRVVETy5leGVjKCBzZWxlY3RvciApKSApIHtcblx0XHRsYXRlciArPSBtYXRjaFswXTtcblx0XHRzZWxlY3RvciA9IHNlbGVjdG9yLnJlcGxhY2UoIEV4cHIubWF0Y2guUFNFVURPLCBcIlwiICk7XG5cdH1cblxuXHRzZWxlY3RvciA9IEV4cHIucmVsYXRpdmVbc2VsZWN0b3JdID8gc2VsZWN0b3IgKyBcIipcIiA6IHNlbGVjdG9yO1xuXG5cdGZvciAoIHZhciBpID0gMCwgbCA9IHJvb3QubGVuZ3RoOyBpIDwgbDsgaSsrICkge1xuXHRcdFNpenpsZSggc2VsZWN0b3IsIHJvb3RbaV0sIHRtcFNldCwgc2VlZCApO1xuXHR9XG5cblx0cmV0dXJuIFNpenpsZS5maWx0ZXIoIGxhdGVyLCB0bXBTZXQgKTtcbn07XG5cbi8vIEVYUE9TRVxuXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBTaXp6bGU7XG59IGVsc2Uge1xuICB3aW5kb3cuU2l6emxlID0gU2l6emxlO1xufVxuXG59KSgpO1xuIiwidmFyIHdpbmRvdyA9IHJlcXVpcmUoXCJnbG9iYWwvd2luZG93XCIpXG52YXIgb25jZSA9IHJlcXVpcmUoXCJvbmNlXCIpXG5cbnZhciBtZXNzYWdlcyA9IHtcbiAgICBcIjBcIjogXCJJbnRlcm5hbCBYTUxIdHRwUmVxdWVzdCBFcnJvclwiLFxuICAgIFwiNFwiOiBcIjR4eCBDbGllbnQgRXJyb3JcIixcbiAgICBcIjVcIjogXCI1eHggU2VydmVyIEVycm9yXCJcbn1cblxudmFyIFhIUiA9IHdpbmRvdy5YTUxIdHRwUmVxdWVzdCB8fCBub29wXG52YXIgWERSID0gXCJ3aXRoQ3JlZGVudGlhbHNcIiBpbiAobmV3IFhIUigpKSA/XG4gICAgICAgIHdpbmRvdy5YTUxIdHRwUmVxdWVzdCA6IHdpbmRvdy5YRG9tYWluUmVxdWVzdFxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVhIUlxuXG5mdW5jdGlvbiBjcmVhdGVYSFIob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgb3B0aW9ucyA9IHsgdXJpOiBvcHRpb25zIH1cbiAgICB9XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgIGNhbGxiYWNrID0gb25jZShjYWxsYmFjaylcblxuICAgIHZhciB4aHJcblxuICAgIGlmIChvcHRpb25zLmNvcnMpIHtcbiAgICAgICAgeGhyID0gbmV3IFhEUigpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgeGhyID0gbmV3IFhIUigpXG4gICAgfVxuXG4gICAgdmFyIHVyaSA9IHhoci51cmwgPSBvcHRpb25zLnVyaVxuICAgIHZhciBtZXRob2QgPSB4aHIubWV0aG9kID0gb3B0aW9ucy5tZXRob2QgfHwgXCJHRVRcIlxuICAgIHZhciBib2R5ID0gb3B0aW9ucy5ib2R5IHx8IG9wdGlvbnMuZGF0YVxuICAgIHZhciBoZWFkZXJzID0geGhyLmhlYWRlcnMgPSBvcHRpb25zLmhlYWRlcnMgfHwge31cbiAgICB2YXIgc3luYyA9ICEhb3B0aW9ucy5zeW5jXG4gICAgdmFyIGlzSnNvbiA9IGZhbHNlXG5cbiAgICBpZiAoXCJqc29uXCIgaW4gb3B0aW9ucykge1xuICAgICAgICBpc0pzb24gPSB0cnVlXG4gICAgICAgIGhlYWRlcnNbXCJDb250ZW50LVR5cGVcIl0gPSBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgICAgICBib2R5ID0gSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5qc29uKVxuICAgIH1cblxuICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSByZWFkeXN0YXRlY2hhbmdlXG4gICAgeGhyLm9ubG9hZCA9IGxvYWRcbiAgICB4aHIub25lcnJvciA9IGVycm9yXG4gICAgLy8gSUU5IG11c3QgaGF2ZSBvbnByb2dyZXNzIGJlIHNldCB0byBhIHVuaXF1ZSBmdW5jdGlvbi5cbiAgICB4aHIub25wcm9ncmVzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gSUUgbXVzdCBkaWVcbiAgICB9XG4gICAgLy8gaGF0ZSBJRVxuICAgIHhoci5vbnRpbWVvdXQgPSBub29wXG4gICAgeGhyLm9wZW4obWV0aG9kLCB1cmksICFzeW5jKVxuICAgIGlmIChvcHRpb25zLmNvcnMpIHtcbiAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRydWVcbiAgICB9XG4gICAgLy8gQ2Fubm90IHNldCB0aW1lb3V0IHdpdGggc3luYyByZXF1ZXN0XG4gICAgaWYgKCFzeW5jKSB7XG4gICAgICAgIHhoci50aW1lb3V0ID0gXCJ0aW1lb3V0XCIgaW4gb3B0aW9ucyA/IG9wdGlvbnMudGltZW91dCA6IDUwMDBcbiAgICB9XG5cbiAgICBpZiAoIHhoci5zZXRSZXF1ZXN0SGVhZGVyKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKGhlYWRlcnMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoa2V5LCBoZWFkZXJzW2tleV0pXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgeGhyLnNlbmQoYm9keSlcblxuICAgIHJldHVybiB4aHJcblxuICAgIGZ1bmN0aW9uIHJlYWR5c3RhdGVjaGFuZ2UoKSB7XG4gICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgbG9hZCgpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2FkKCkge1xuICAgICAgICB2YXIgZXJyb3IgPSBudWxsXG4gICAgICAgIHZhciBzdGF0dXMgPSB4aHIuc3RhdHVzQ29kZSA9IHhoci5zdGF0dXNcbiAgICAgICAgdmFyIGJvZHkgPSB4aHIuYm9keSA9IHhoci5yZXNwb25zZSB8fFxuICAgICAgICAgICAgeGhyLnJlc3BvbnNlVGV4dCB8fCB4aHIucmVzcG9uc2VYTUxcblxuICAgICAgICBpZiAoc3RhdHVzID09PSAwIHx8IChzdGF0dXMgPj0gNDAwICYmIHN0YXR1cyA8IDYwMCkpIHtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0geGhyLnJlc3BvbnNlVGV4dCB8fFxuICAgICAgICAgICAgICAgIG1lc3NhZ2VzW1N0cmluZyh4aHIuc3RhdHVzKS5jaGFyQXQoMCldXG4gICAgICAgICAgICBlcnJvciA9IG5ldyBFcnJvcihtZXNzYWdlKVxuXG4gICAgICAgICAgICBlcnJvci5zdGF0dXNDb2RlID0geGhyLnN0YXR1c1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzSnNvbikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBib2R5ID0geGhyLmJvZHkgPSBKU09OLnBhcnNlKGJvZHkpXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICB9XG5cbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIHhociwgYm9keSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihldnQpIHtcbiAgICAgICAgY2FsbGJhY2soZXZ0LCB4aHIpXG4gICAgfVxufVxuXG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHdpbmRvd1xufSBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBnbG9iYWxcbn0gZWxzZSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7fVxufVxuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIm1vZHVsZS5leHBvcnRzID0gb25jZVxuXG5vbmNlLnByb3RvID0gb25jZShmdW5jdGlvbiAoKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShGdW5jdGlvbi5wcm90b3R5cGUsICdvbmNlJywge1xuICAgIHZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gb25jZSh0aGlzKVxuICAgIH0sXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0pXG59KVxuXG5mdW5jdGlvbiBvbmNlIChmbikge1xuICB2YXIgY2FsbGVkID0gZmFsc2VcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoY2FsbGVkKSByZXR1cm5cbiAgICBjYWxsZWQgPSB0cnVlXG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgfVxufVxuIiwidmFyIEhhbmRsZWJhcnM9cmVxdWlyZShcImhic2Z5L3J1bnRpbWVcIik7bW9kdWxlLmV4cG9ydHM9SGFuZGxlYmFycy50ZW1wbGF0ZShmdW5jdGlvbihlLHIsdCxzLG4pe3JldHVybiB0aGlzLmNvbXBpbGVySW5mbz1bNCxcIj49IDEuMC4wXCJdLHQ9dGhpcy5tZXJnZSh0LGUuaGVscGVycyksbj1ufHx7fSxcInRlc3RcIn0pOyIsInZhciBOT19PUD1mdW5jdGlvbigpe30sZG9tcmVhZHk9cmVxdWlyZShcImRvbXJlYWR5XCIpLHNpenpsZT1yZXF1aXJlKFwic2l6emxlXCIpLGVsQ2xhc3M9cmVxdWlyZShcImVsZW1lbnQtY2xhc3NcIiksanNvbnA9cmVxdWlyZShcImpzb25wXCIpLHhocj1yZXF1aXJlKFwieGhyXCIpLE1vZHVsYXI9ZnVuY3Rpb24oZSl7dGhpcy51cmw9ZS51cmwsdGhpcy5lbD1lLmVsLHRoaXMudGVtcGxhdGU9ZS50ZW1wbGF0ZXx8cmVxdWlyZShcIi4vdGVzdC5oYnNcIiksdGhpcy5wcmVwcm9jZXNzb3I9ZS5wcmVwcm9jZXNzb3IsZG9tcmVhZHkoZnVuY3Rpb24oKXtcInN0cmluZ1wiPT10eXBlb2YgdGhpcy5lbCYmKHRoaXMuZWw9c2l6emxlKHRoaXMuZWwpWzBdKSx0aGlzLnJlcXVlc3QoKX0uYmluZCh0aGlzKSl9O01vZHVsYXIucHJvdG90eXBlLnJlcXVlc3Q9ZnVuY3Rpb24oZSxyKXtcImZ1bmN0aW9uXCI9PXR5cGVvZiBlJiYocj1lLGU9e30pLHI9cnx8Tk9fT1AsZWxDbGFzcyh0aGlzLmVsKS5hZGQoXCJsb2FkaW5nXCIpLFwidW5kZWZpbmVkXCI9PXR5cGVvZiBYRG9tYWluUmVxdWVzdHx8ZS5qc29ucD9qc29ucCh0aGlzLnVybCxmdW5jdGlvbihlLHIpe3RoaXMucmVuZGVyKHIpLGVsQ2xhc3ModGhpcy5lbCkucmVtb3ZlKFwibG9hZGluZ1wiKSxlJiZlbENsYXNzKHRoaXMuZWwpLmFkZChcImVycm9yXCIpfS5iaW5kKHRoaXMpKTp4aHIoe3VyaTp0aGlzLnVybCxjb3JzOiEwfSxmdW5jdGlvbihlLHIscyl7dmFyIG89SlNPTi5wYXJzZShzKTt0aGlzLnJlbmRlcihvKSxlbENsYXNzKHRoaXMuZWwpLnJlbW92ZShcImxvYWRpbmdcIiksZSYmZWxDbGFzcyh0aGlzLmVsKS5hZGQoXCJlcnJvclwiKX0uYmluZCh0aGlzKSl9LE1vZHVsYXIucHJvdG90cHllLnByZXByb2Nlc3M9ZnVuY3Rpb24oZSl7dHJ5e3RoaXMucHJlcHJvY2Vzc29yJiYoZT10aGlzLnByZXByb2Nlc3NvcihlKSl9Y2F0Y2gocil7ciYmY29uc29sZS5sb2coXCJFcnJvciBwcmVwcm9jZXNzaW5nIG1vZHVsZSByZXNvdXJjZVwiKX1yZXR1cm4gZX0sTW9kdWxhci5wcm90b3R5cGUucmVuZGVyPWZ1bmN0aW9uKGUpe2U9dGhpcy5wcmVwcm9jZXNzKGUpO3RyeXt0aGlzLmVsLmlubmVySFRNTD10aGlzLnRlbXBsYXRlKGUpfWNhdGNoKHIpe3ImJmNvbnNvbGUubG9nKFwiRXJyb3IgcmVuZGVyaW5nIG1vZHVsZVwiKX19LG1vZHVsZS5leHBvcnRzPU1vZHVsYXI7Il19
(18)
});
