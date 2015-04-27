var cookie = require('cookie');
var Delegate = require('dom-delegate');
var qs = require('querystring');
var _ = require('underscore');

function linkify(scope) {
  saveGADataToCookie();
  addGADataToLinks(scope);
}

function saveGADataToCookie() {
  if (window.location.href.indexOf('?') === -1) return;

  var query = qs.parse(window.location.href.split('?').pop().split('#')[0]);
  query = _.pick(query, function(v, k) {return v && k.indexOf('utm_') === 0});
  query = qs.stringify(query);

  if (query) document.cookie = cookie.serialize('ga_data', query);
};

function addGADataToLinks(scope) {
  var query = cookie.parse(document.cookie).ga_data;
  if (!query) return;

  var delegate = new Delegate(scope || document.body);

  delegate.on('click', 'a', function (event) {
    var url = event.target.getAttribute('href');
    if (!url.match('checkout')) return;

    event.preventDefault();
    window.location.href = url + (url.indexOf('?') === -1 ? '?' : '&') + query;
  });
};

module.exports = {
  linkify: linkify
};
