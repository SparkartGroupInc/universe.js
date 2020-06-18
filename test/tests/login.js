var assert = require('assert');
var sinon = require('sinon');
var qs = require('query-string');
var Delegate = require('dom-delegate');

var util = require('../../lib/util');
var login = require('../../login');
var config = require('../config');

module.exports = function() {

describe('Login', function() {
  var fanclub = {
    links: {
      login: 'https://services.sparkart.net/1234/login'
    }
  };
  var sandbox;
  var mock;

  function tokensLogin() {
    localStorage.setItem('universeAccessToken', 'valid_access_token');
    localStorage.setItem('universeAccessTokenExpiration', '12345');
    localStorage.setItem('universeRefreshToken', 'valid_refresh_token');
    localStorage.setItem('universeRefreshTokenExpiration', '54321');
  }

  function tokensLogout() {
    localStorage.removeItem('universeAccessToken');
    localStorage.removeItem('universeAccessTokenExpiration');
    localStorage.removeItem('universeRefreshToken');
    localStorage.removeItem('universeRefreshTokenExpiration');
  }

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    mock = sandbox.mock(login);
  });

  afterEach(function() {
    mock.verify();
    sandbox.restore();
    tokensLogout();
  });

  describe('.linkify', function() {
    var div;

    function addLink(url) {
      div.innerHTML = '<a href="' + url + '"><img id="clickable" src="" /></a>';
    };

    function clickLink() {
      var link = document.getElementById('clickable');
      if (link.click) {
        link.click();
      } else {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        link.dispatchEvent(event);
      }
    };

    beforeEach(function() {
      div = document.createElement('div');
      document.body.appendChild(div);
    });

    afterEach(function() {
      document.body.removeChild(div);
    });

    it('replaces login link with prompt', function(done) {
      addLink('/login?a=1');
      var processor = function() {};

      mock.expects('prompt').withArgs(fanclub, '/login?a=1', processor);
      mock.expects('setUrl').never();

      login.linkify(fanclub, div, processor);
      clickLink();
      done();
    });

    it('removes the tokens before logging out', function(done) {
      tokensLogin();

      addLink('/logout?a=1');

      mock.expects('prompt').never();
      mock.expects('setUrl').never();

      login.linkify(fanclub, div);

      var delegate = new Delegate(div);
      delegate.on('click', 'a', function (event) {
        event.preventDefault();
        assert.equal(localStorage.getItem('universeAccessToken'), null);
        assert.equal(localStorage.getItem('universeAccessTokenExpiration'), null);
        assert.equal(localStorage.getItem('universeRefreshToken'), null);
        assert.equal(localStorage.getItem('universeRefreshTokenExpiration'), null);
        done();
      });

      clickLink();
    });

    it('with non-login/logout link', function(done) {
      tokensLogin();

      addLink('/something/else');

      mock.expects('prompt').never();
      mock.expects('setUrl').never();

      login.linkify(fanclub, div);

      var delegate = new Delegate(div);
      delegate.on('click', 'a', function (event) {
        event.preventDefault();
        assert.equal(localStorage.getItem('universeAccessToken'), 'valid_access_token');
        assert.equal(localStorage.getItem('universeAccessTokenExpiration'), '12345');
        assert.equal(localStorage.getItem('universeRefreshToken'), 'valid_refresh_token');
        assert.equal(localStorage.getItem('universeRefreshTokenExpiration'), '54321');
        done();
      });

      clickLink();
    });
  });

  describe('.prompt', function() {
    var expectRedirect = function(options) {
      options.redirect || (options.redirect = config.testHost + '/');
      options.popup = 1;
      mock.expects('setLoginRedirect').withArgs(options.redirect).twice();

      if (util.isMobile) {
        mock.expects('setUrl').withArgs(fanclub.links.login + '?' + qs.stringify(options)).twice();
        mock.expects('openUrl').never();
      } else {
        mock.expects('setUrl').never();
        mock.expects('openUrl').withArgs(fanclub.links.login + '?' + qs.stringify(options)).twice();
      }
    };

    it('redirects to Universe login url', function(done) {
      expectRedirect({});

      login.prompt(fanclub, '/login');
      login.prompt(fanclub, {});
      done();
    });

    it('with query string', function(done) {
      expectRedirect({a: 1, z: 2});

      login.prompt(fanclub, '/login?a=1&z=2');
      login.prompt(fanclub, {a: 1, z: 2});
      done();
    });

    it('with relative redirect', function(done) {
      expectRedirect({redirect: config.testHost + '/test/browser/redir'});

      login.prompt(fanclub, '/login?redirect=redir');
      login.prompt(fanclub, {redirect: 'redir'});
      done();
    });

    it('with absolute redirect', function(done) {
      expectRedirect({redirect: config.testHost + '/redir'});

      login.prompt(fanclub, '/login?redirect=/redir');
      login.prompt(fanclub, {redirect: '/redir'});
      done();
    });

    it('with URL redirect', function(done) {
      expectRedirect({redirect: 'http://redir.com'});

      login.prompt(fanclub, '/login?redirect=http://redir.com');
      login.prompt(fanclub, {redirect: 'http://redir.com'});
      done();
    });

    it('with processor', function(done) {
      var processor = function(options) {
        assert.equal(options.a, '1');
        assert.equal(options.z, '2');
        assert.equal(options.redirect, config.testHost + '/redir');
        options.z = 3;
        options.redirect = 'http://somesite.com';
        return options;
      };

      expectRedirect({a:1, z: 3, redirect: 'http://somesite.com'});

      login.prompt(fanclub, '/login?a=1&z=2&redirect=/redir', processor);
      login.prompt(fanclub, {a: 1, z: 2, redirect: '/redir'}, processor);
      done();
    });
  });
});

};
