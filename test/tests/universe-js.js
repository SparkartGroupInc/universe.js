var assert = require('assert');

var SolidusClient = require('solidus-client');
var Universe = require('../../index');

var config = require('../config');

module.exports = function() {

describe('Universe', function() {
  var random = Math.random;

  before(function() {
    Math.random = function() {return 1};
  })

  after(function() {
    Math.random = random;
  });

  describe('.init', function() {
    it('fetches the current fanclub and customer', function(done) {
      var callback_called;
      var universe = new Universe({environment: 'test_in', key: '12345'});
      universe.init(function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, {fanclub: 'demo!', customer: 'me!'});
        callback_called = true;
      });
      universe.on('error', function(err) {
        assert(false);
      });
      universe.on('ready', function(data) {
        assert(callback_called);
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

      var universe = new Universe({environment: 'test_in', key: '12345', context: context});
      universe.init(function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, {fanclub: 'exists!', customer: 'me!'});
        done();
      });
    });

    it('with no logged in customer', function(done) {
      var universe = new Universe({environment: 'test_out', key: '12345'});
      universe.init(function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, {fanclub: 'demo!', customer: undefined});
        done();
      });
    });

    it('with no callback', function(done) {
      var universe = new Universe({environment: 'test_in', key: '12345'});
      universe.init();
      universe.on('ready', function(data) {
        assert.deepEqual(data, {fanclub: 'demo!', customer: 'me!'});
        done();
      });
    });

    it('with error', function(done) {
      var callback_called;
      var universe = new Universe({environment: 'test_out', key: 'wrong'});
      universe.init(function(err, data) {
        assert.equal(err.status, 404);
        callback_called = true;
      });
      universe.on('error', function(err) {
        assert(callback_called);
        assert.equal(err.status, 404);
        done();
      });
      universe.on('ready', function(data) {
        assert(false);
      });
    });

    it('with error and no callback', function(done) {
      var universe = new Universe({environment: 'test_out', key: 'wrong'});
      universe.init();
      universe.on('error', function(err) {
        assert.equal(err.status, 404);
        done();
      });
    });

    it('with real connection', function(done) {
      this.timeout(5000);
      var universe = new Universe({environment: 'staging', key: '85fb2147-06bb-4923-9589-34b186a3899c'});
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

      var universe = new Universe({environment: 'test_in', key: '12345'});
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

      var universe = new Universe({environment: 'test_in', key: '12345'});
      universe.render({});
    });
  });

  describe('.get', function() {
    it('expands the endpoint', function(done) {
      var universe = new Universe({environment: 'test_in', key: '12345'});
      universe.get('/account', function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, {customer: 'me!'});
        done();
      });
    });
  });

  describe('.post', function() {
    it('with jsonp adds _method=POST to the query', function(done) {
      var body   = {id: 1, email: 'test@sparkart.com'};
      var result = {status: 'ok', customer: body};

      var universe = new Universe({environment: 'test_in', key: '12345'});
      universe.post('/account', body, function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, result);
        done();
      });
    });
  });

  describe('.resource', function() {
    it('returns a resource from a Universe endpoint', function(done) {
      var universe = new Universe({environment: 'test_in', key: '12345'});
      var resource = universe.resource('/account');
      assert.deepEqual(resource, {
        url: config.host + '/i/api/v1/account',
        query: {key: '12345'},
        with_credentials: true
      });
      done();
    });
  });

  describe('.jsonpResource', function() {
    it('returns a resource from a Universe endpoint', function(done) {
      var universe = new Universe({environment: 'test_in', key: '12345'});
      var resource = universe.jsonpResource('/account/status');
      assert.deepEqual(resource, {
        url: config.host + '/i/api/v1/account/status',
        jsonp: true
      });
      done();
    });
  });
});

};
