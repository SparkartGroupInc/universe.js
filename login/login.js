var cookie = require('cookie');
var Delegate = require('dom-delegate');
var qs = require('query-string');

var util = require('../lib/util');

/**
 * Override login links, including those added dynamically
 * @param {object} fanclub - universe /api/v1/fanclub data
 * @param {object} scope - DOM node to scope links to
 * @param {function} processor - Login options (for the query string) processor
 */

function linkify (fanclub, scope, processor) {
  if (!processor && typeof(scope) === 'function') {
    processor = scope;
    scope = undefined;
  }

  var delegate = new Delegate(scope || document.body);

  delegate.on('click', 'a', function (event) {
    var link = event.target ? findClosestTag(event.target, 'a') : null;
    var url = link ? link.getAttribute('href') : null;
    if (!url) return;

    if (url.match('login')) {
      event.preventDefault();
      module.exports.prompt(fanclub, url, processor);
    }
  });
};

/**
 * Finds a specific tag closest to the given element, searching its parent nodes
 * @param {object} element - element where to start searching
 * @param {object} tag - tag to find
 */

function findClosestTag(element, tag) {
  tag = tag.toLowerCase();
  do {
    if (element.nodeName.toLowerCase() === tag) return element;
  } while (element = element.parentNode);
};

/**
 * Open a login prompt in a popup to minimize user disorientation,
 * with an exception for mobile devices where window.close doesn't work
 * @param {object} fanclub - universe /api/v1/fanclub data
 * @param {string|object} [options] - login URL or configuration object
 * @param {string} options.url - login URL
 * @param {string} options.* - Universe configuration parameters to passthrough
 * @param {function} processor - Login options (for the query string) processor
 */

function prompt (fanclub, options, processor) {
  if (!processor && typeof(options) === 'function') {
    processor = options;
    options = undefined;
  }

  if (util.isMobile) {
    module.exports.setUrl(config(fanclub, options, false, processor).url);
  } else {
    var login = config(fanclub, options, true, processor);

    // Set desired final destination in a cookie to preserve through intermediary redirects
    module.exports.setCookie(login.redirect);

    popup(login.url);
  }

};

/**
 * Creates config object, sets login URL from Universe instance if not defined
 * @private
 * @param {string|object} options - login URL or configuration object
 * @param {function} processor - Login options (for the query string) processor
 */

function config (fanclub, options, popup, processor) {

  if (typeof options === 'string' && !options.match(/\?/)) options = {};
  if (typeof options === 'string') options = qs.parse(options.split('?').pop());

  var loginUrl = fanclub.links.login;

  if (!options.redirect || !options.redirect.match(/^https?:\/\//)) {
    var redirect = options.redirect || '/';
    if (redirect.substr(0,1) !== '/') redirect = location.pathname.replace(/[^\/]*$/, redirect);

    options.redirect = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + redirect;
  }

  if (popup) options.popup = 1;
  if (processor) options = processor(options);

  return {
    url: loginUrl + '?' + qs.stringify(options),
    redirect: options.redirect
  }
};

/**
 * Open a small popup window centered within the parent window
 * @private
 * @param {string} url
 */

function popup (url) {
  var screenTop = window.screenTop || window.screenY;
  var screenLeft = window.screenLeft || window.screenX;

  var options = {
    width: 560,
    height: 420,
    resizable: 0,
    menubar: 0,
    location: 0,
    toolbar: 0,
    personalbar: 0,
    status: 0,
    scrollbars: 0
  };

  // Center popup
  options.top = screenTop + ((window.innerHeight - options.height) / 2);
  options.left = screenLeft + ((window.innerWidth - options.width) / 2);

  module.exports.openUrl(url, options);
};

module.exports = {
  linkify: linkify,
  prompt: prompt,

  // Exposed for testing
  setUrl: function(url) {window.location.href = url},
  setCookie: function(url) {document.cookie = cookie.serialize('redirect', url, {path: '/login'})},
  openUrl: function(url, options) {
    // HACK: Required so the referrer is set properly in IE
    var wnd = window.open('', 'universeLogin', qs.stringify(options).replace(/&/g, ','));
    wnd.location.href = url;
  }
};