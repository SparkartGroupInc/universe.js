var assert = require('assert');

var SolidusClient = require('solidus-client');
var Universe = require('../../index');

var config = require('../config');

if (require('solidus-client/lib/util').isNode) {
  global.localStorage = {
    storage: {},
    setItem: (k, v) => localStorage.storage[k] = v,
    getItem: k => localStorage.storage[k],
    removeItem: k => delete localStorage.storage[k]
  };
}

const login = () => {
  localStorage.setItem('universeAccessToken', 'valid_access_token');
  localStorage.setItem('universeAccessTokenExpiration', (new Date().getTime() + 5000).toString());
  localStorage.setItem('universeRefreshToken', 'valid_refresh_token');
  localStorage.setItem('universeRefreshTokenExpiration', (new Date().getTime() + 50000).toString());
};

const logout = () => {
  localStorage.removeItem('universeAccessToken');
  localStorage.removeItem('universeAccessTokenExpiration');
  localStorage.removeItem('universeRefreshToken');
  localStorage.removeItem('universeRefreshTokenExpiration');
};

module.exports = function() {

describe('Universe', function() {
  var random = Math.random;

  before(function() {
    Math.random = function() {return 1};
  })

  after(function() {
    Math.random = random;
  });

  beforeEach(login);
  afterEach(logout);

  describe('.init', function() {
    it('fetches the current fanclub and customer', function(done) {
      var callbackCalled;
      var universe = new Universe({environment: 'test', key: '12345'});
      universe.init(function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, {fanclub: 'demo!', customer: 'me!'});
        callbackCalled = true;
      });
      universe.on('error', function(err) {
        assert(false);
      });
      universe.on('ready', function(data) {
        assert(callbackCalled);
        assert.deepEqual(data, {fanclub: 'demo!', customer: 'me!'});
        done();
      });
    });

    it('with fanclub already in context', function(done) {
      var context = {
        resources: {
          fanclub: {fanclub: 'exists!'}
        }
      };

      var universe = new Universe({environment: 'test', key: '12345', context: context});
      universe.init(function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, {fanclub: 'exists!', customer: 'me!'});
        done();
      });
    });

    it('with no logged in customer', function(done) {
      logout();
      var universe = new Universe({environment: 'test', key: '12345'});
      universe.init(function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, {fanclub: 'demo!', customer: undefined});
        done();
      });
    });

    it('with no callback', function(done) {
      var universe = new Universe({environment: 'test', key: '12345'});
      universe.init();
      universe.on('ready', function(data) {
        assert.deepEqual(data, {fanclub: 'demo!', customer: 'me!'});
        done();
      });
    });

    it('with error', function(done) {
      logout();
      var callbackCalled;
      var universe = new Universe({environment: 'test', key: 'wrong'});
      universe.init(function(err, data) {
        assert.equal(err.status, 404);
        callbackCalled = true;
      });
      universe.on('error', function(err) {
        assert(callbackCalled);
        assert.equal(err.status, 404);
        done();
      });
      universe.on('ready', function(data) {
        assert(false);
      });
    });

    it('with error and no callback', function(done) {
      logout();
      var universe = new Universe({environment: 'test', key: 'wrong'});
      universe.init();
      universe.on('error', function(err) {
        assert.equal(err.status, 404);
        done();
      });
    });

    it('with real connection', function(done) {
      this.timeout(5000);
      logout();
      var universe = new Universe({environment: 'production', key: '85fb2147-06bb-4923-9589-34b186a3899c'});
      universe.init(function(err, data) {
        assert.ifError(err);
        assert.equal(data.fanclub.name, 'Universe Demo');
        done();
      });
    });
  });

  describe('.render', function() {
    var render = SolidusClient.prototype.render;

    afterEach(function() {
      SolidusClient.prototype.render = render;
    });

    it('expands the Universe resources URLs', function(done) {
      SolidusClient.prototype.render = function(view) {
        assert.deepEqual(view.resources, {
          plans1:  universe.resource('/plans'),
          plans2:  'http://solidus.com',
          plans3:  12345,
          plans4:  null,
          plans5:  undefined,
          plans6:  {url: universe.resource('/plans').url},
          plans7:  {url: 'http://solidus.com'},
          plans8:  {url: 12345},
          plans9:  {url: null},
          plans10: {url: undefined}
        });
        done();
      };

      var universe = new Universe({environment: 'test', key: '12345'});
      universe.render({
        resources: {
          plans1:  '/plans',
          plans2:  'http://solidus.com',
          plans3:  12345,
          plans4:  null,
          plans5:  undefined,
          plans6:  {url: '/plans'},
          plans7:  {url: 'http://solidus.com'},
          plans8:  {url: 12345},
          plans9:  {url: null},
          plans10: {url: undefined},
        }
      });
    });

    it('with no resources', function(done) {
      SolidusClient.prototype.render = function(view) {
        assert(!view.resources);
        done();
      };

      var universe = new Universe({environment: 'test', key: '12345'});
      universe.render({});
    });
  });

  describe('.get', function() {
    it('expands the endpoint', function(done) {
      var universe = new Universe({environment: 'test', key: '12345'});
      universe.get('/account', function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, {customer: 'me!'});
        done();
      });
    });

    it('refreshes an expired access token', function(done) {
      localStorage.setItem('universeAccessTokenExpiration', '1');
      var universe = new Universe({environment: 'test', key: '12345'});
      universe.get('/account', function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, {customer: 'me!'});
        assert.equal(localStorage.getItem('universeAccessToken'), 'valid_access_token_2');
        assert(localStorage.getItem('universeAccessTokenExpiration') > new Date().getTime());
        assert(localStorage.getItem('universeAccessTokenExpiration') < new Date().getTime() + 6000);
        assert.equal(localStorage.getItem('universeRefreshToken'), 'valid_refresh_token_2');
        assert(localStorage.getItem('universeRefreshTokenExpiration') > new Date().getTime());
        assert(localStorage.getItem('universeRefreshTokenExpiration') < new Date().getTime() + 51000);
        done();
      });
    });

    it('refreshes an access token with missing expiration', function(done) {
      localStorage.removeItem('universeAccessTokenExpiration');
      var universe = new Universe({environment: 'test', key: '12345'});
      universe.get('/account', function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, {customer: 'me!'});
        assert.equal(localStorage.getItem('universeAccessToken'), 'valid_access_token_2');
        assert(localStorage.getItem('universeAccessTokenExpiration') > new Date().getTime());
        assert(localStorage.getItem('universeAccessTokenExpiration') < new Date().getTime() + 6000);
        assert.equal(localStorage.getItem('universeRefreshToken'), 'valid_refresh_token_2');
        assert(localStorage.getItem('universeRefreshTokenExpiration') > new Date().getTime());
        assert(localStorage.getItem('universeRefreshTokenExpiration') < new Date().getTime() + 51000);
        done();
      });
    });

    it('does not refresh an invalid access token', function(done) {
      localStorage.setItem('universeAccessToken', 'invalid_access_token');
      var universe = new Universe({environment: 'test', key: '12345'});
      universe.get('/account', function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, {});
        assert.equal(localStorage.getItem('universeAccessToken'), 'invalid_access_token');
        assert(localStorage.getItem('universeAccessTokenExpiration') > new Date().getTime());
        assert(localStorage.getItem('universeAccessTokenExpiration') < new Date().getTime() + 6000);
        assert.equal(localStorage.getItem('universeRefreshToken'), 'valid_refresh_token');
        assert(localStorage.getItem('universeRefreshTokenExpiration') > new Date().getTime());
        assert(localStorage.getItem('universeRefreshTokenExpiration') < new Date().getTime() + 51000);
        done();
      });
    });

    it('clears all tokens when the refresh token is expired', function(done) {
      localStorage.setItem('universeAccessTokenExpiration', '1');
      localStorage.setItem('universeRefreshTokenExpiration', '1');
      var universe = new Universe({environment: 'test', key: '12345'});
      universe.get('/account', function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, {});
        assert(!localStorage.getItem('universeAccessToken'));
        assert(!localStorage.getItem('universeAccessTokenExpiration'));
        assert(!localStorage.getItem('universeRefreshToken'));
        assert(!localStorage.getItem('universeRefreshTokenExpiration'));
        done();
      });
    });

    it('clears all tokens when the refresh token is invalid', function(done) {
      localStorage.setItem('universeAccessTokenExpiration', '1');
      localStorage.setItem('universeRefreshToken', 'invalid_refresh_token');
      var universe = new Universe({environment: 'test', key: '12345'});
      universe.get('/account', function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, {});
        assert(!localStorage.getItem('universeAccessToken'));
        assert(!localStorage.getItem('universeAccessTokenExpiration'));
        assert(!localStorage.getItem('universeRefreshToken'));
        assert(!localStorage.getItem('universeRefreshTokenExpiration'));
        done();
      });
    });

    it('clears all tokens when the refresh token is missing expiration', function(done) {
      localStorage.setItem('universeAccessTokenExpiration', '1');
      localStorage.removeItem('universeRefreshTokenExpiration');
      var universe = new Universe({environment: 'test', key: '12345'});
      universe.get('/account', function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, {});
        assert(!localStorage.getItem('universeAccessToken'));
        assert(!localStorage.getItem('universeAccessTokenExpiration'));
        assert(!localStorage.getItem('universeRefreshToken'));
        assert(!localStorage.getItem('universeRefreshTokenExpiration'));
        done();
      });
    });

    it('does not clear the refresh token when it cannot be refreshed', function(done) {
      localStorage.setItem('universeAccessTokenExpiration', '1');
      localStorage.setItem('universeRefreshToken', 'oh no'); // Triggers a 404 from /refresh
      var universe = new Universe({environment: 'test', key: '12345'});
      universe.get('/account', function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, {});
        assert(!localStorage.getItem('universeAccessToken'));
        assert(!localStorage.getItem('universeAccessTokenExpiration'));
        assert.equal(localStorage.getItem('universeRefreshToken'), 'oh no');
        assert(localStorage.getItem('universeRefreshTokenExpiration') > new Date().getTime());
        assert(localStorage.getItem('universeRefreshTokenExpiration') < new Date().getTime() + 51000);
        done();
      });
    });
  });

  describe('.post', function() {
    it('with jsonp adds _method=POST to the query', function(done) {
      var body   = {id: 1, email: 'test@sparkart.com'};
      var result = {status: 'ok', customer: body};

      var universe = new Universe({environment: 'test', key: '12345'});
      universe.post('/account', body, function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, result);
        done();
      });
    });
  });

  describe('.resource', function() {
    it('returns a resource from a Universe endpoint', function(done) {
      var universe = new Universe({environment: 'test', key: '12345'});
      var resource = universe.resource('/account');
      assert.deepEqual(resource, {
        url: config.host + '/api/v1/account',
        query: {key: '12345'},
        headers: {
          Authorization: 'Bearer valid_access_token'
        }
      });
      done();
    });

    it('with no logged in customer', function(done) {
      logout();
      var universe = new Universe({environment: 'test', key: '12345'});
      var resource = universe.resource('/account');
      assert.deepEqual(resource, {
        url: config.host + '/api/v1/account',
        query: {key: '12345'},
        headers: {}
      });
      done();
    });
  });

  describe('.jsonpResource', function() {
    it('returns a resource from a Universe endpoint', function(done) {
      var universe = new Universe({environment: 'test', key: '12345'});
      var resource = universe.jsonpResource('/account/status');
      assert.deepEqual(resource, {
        url: config.host + '/api/v1/account/status',
        jsonp: true
      });
      done();
    });
  });
});

};
