var cookie = require('cookie');
var Delegate = require('dom-delegate');
var qs = require('querystring');
var _ = require('underscore');

function linkify(scope) {
  saveGADataToCookie();
  addGADataToLinks(scope);
}

function saveGADataToCookie() {
  var url = module.exports.getUrl();
  if (url.indexOf('?') === -1) return;

  var query = qs.parse(url.split('?').pop().split('#')[0]);
  query = _.pick(query, function(v, k) {return v && k.indexOf('utm_') === 0});
  query = qs.stringify(query);

  if (query) document.cookie = cookie.serialize('ga_data', query);
};

function addGADataToLinks(scope) {
  var query = cookie.parse(document.cookie).ga_data;
  if (!query) return;

  var delegate = new Delegate(scope || document.body);

  delegate.on('click', 'a', function (event) {
    event.preventDefault();
    var url = event.target.getAttribute('href');
    if (url.match('checkout')) url += (url.indexOf('?') === -1 ? '?' : '&') + query;
    module.exports.setUrl(url);
  });
};

module.exports = {
  linkify: linkify,

  // Exposed for testing
  getUrl: function() {return window.location.href},
  setUrl: function(url) {window.location.href = url}
};
