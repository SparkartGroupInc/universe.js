var assert = require('assert');

var SolidusClient = require('solidus-client');
var Universe = require('../index');

var config = require('./config');

describe('Universe', function() {
  var random = Math.random;

  before(function() {
    Math.random = function() {return 1};
  })

  after(function() {
    Math.random = random;
  });

  describe('.ready', function() {
    it('fetches the current fanclub and customer', function(done) {
      var universe = new Universe({environment: 'test_in', key: '12345'});
      universe.ready(function() {
        assert.deepEqual(universe.context, {
          universe: {
            fanclub: 'demo!',
            customer: 'me!'
          }
        });
        done();
      });
    });

    it('with fanclub already in context', function(done) {
      var context = {
        resources: {
          fanclub: {fanclub: 'demo!'}
        }
      };

      var universe = new Universe({environment: 'test_in', key: '12345', context: context});
      universe.ready(function() {
        assert.deepEqual(universe.context, {
          resources: {
            fanclub: {fanclub: 'demo!'}
          },
          universe: {
            fanclub: 'demo!',
            customer: 'me!'
          }
        });
        done();
      });
    });

    it('with no logged in customer', function(done) {
      var universe = new Universe({environment: 'test_out', key: '12345'});
      universe.ready(function() {
        assert.deepEqual(universe.context, {
          universe: {
            fanclub: 'demo!',
            customer: undefined
          }
        });
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
      universe.get('/{a}', {a: 'account'}, function(err, data) {
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
      universe.post('/{a}', {a: 'account'}, body, function(err, data) {
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
