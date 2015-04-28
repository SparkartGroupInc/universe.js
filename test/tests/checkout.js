var assert = require('assert');
var cookie = require('cookie');

var checkout = require('../../checkout');
var config = require('../config');

module.exports = function() {

describe('Checkout', function() {
  var div;
  var getUrl = checkout.getUrl;
  var setUrl = checkout.setUrl;

  function addLink(url) {
    var link = document.createElement('a');
    link.setAttribute('href', url);
    div.appendChild(link);
    return link;
  };

  function clickLink(link) {
    if (link.click) {
      link.click();
    } else {
      var event = document.createEvent('MouseEvents');
      event.initEvent('click', true, true);
      link.dispatchEvent(event);
    }
  };

  beforeEach(function() {
    document.cookie = cookie.serialize('ga_data', false, {expires: new Date('Thu, 01 Jan 1970 00:00:00 GMT')});
    div = document.createElement('div');
    document.body.appendChild(div);
  });

  afterEach(function() {
    document.body.removeChild(div);
    checkout.getUrl = getUrl;
    checkout.setUrl = setUrl;
  });

  describe('.linkify', function() {
    it('saves the query string GS data to a cookie', function(done) {
      checkout.getUrl = function() {return 'http://test.com/something?utm_source=src&utm_medium=mdm'};
      checkout.linkify(div);
      assert.equal(cookie.parse(document.cookie).ga_data, 'utm_source=src&utm_medium=mdm');
      done();
    });

    it('with complex URL', function(done) {
      checkout.getUrl = function() {return 'http://test.com/something?a=1&utm_source=src&b=2&utm_medium=mdm#anchor'};
      checkout.linkify(div);
      assert.equal(cookie.parse(document.cookie).ga_data, 'utm_source=src&utm_medium=mdm');
      done();
    });

    it('with no GA data in query string', function(done) {
      checkout.getUrl = function() {return 'http://test.com/something?a=1'};
      checkout.linkify(div);
      assert(!cookie.parse(document.cookie).ga_data);
      done();
    });

    it('with no query string', function(done) {
      checkout.getUrl = function() {return 'http://test.com/something'};
      checkout.linkify(div);
      assert(!cookie.parse(document.cookie).ga_data);
      done();
    });

    it('adds the ga_data cookie content to checkout URL', function(done) {
      var link = addLink('https://services.sparkart.net/checkout/123');
      document.cookie = cookie.serialize('ga_data', 'utm_source=src&utm_medium=mdm');
      checkout.setUrl = function(url) {
        assert.equal(url, 'https://services.sparkart.net/checkout/123?utm_source=src&utm_medium=mdm');
        done();
      };

      checkout.linkify(div);
      clickLink(link);
    });

    it('with existing query string in checkout URL', function(done) {
      var link = addLink('https://services.sparkart.net/checkout/123?a=1');
      document.cookie = cookie.serialize('ga_data', 'utm_source=src&utm_medium=mdm');
      checkout.setUrl = function(url) {
        assert.equal(url, 'https://services.sparkart.net/checkout/123?a=1&utm_source=src&utm_medium=mdm');
        done();
      };

      checkout.linkify(div);
      clickLink(link);
    });

    it('with non-checkout URL', function(done) {
      var link = addLink('https://services.sparkart.net/something/else');
      document.cookie = cookie.serialize('ga_data', 'utm_source=src&utm_medium=mdm');
      checkout.setUrl = function(url) {
        assert.equal(url, 'https://services.sparkart.net/something/else');
        done();
      };

      checkout.linkify(div);
      clickLink(link);
    });

    it('with no cookie', function(done) {
      var link = addLink('https://services.sparkart.net/checkout/123');
      link.onclick = function(event) {
        event.preventDefault();
        done();
      };
      checkout.setUrl = function(url) {
        assert(false);
      };

      checkout.linkify(div);
      clickLink(link);
    });
  });
});

};
