var assert = require('assert');
var Handlebars = require('handlebars');
var nock = require('nock');

var SolidusClient = require('solidus-client');
var Universe = require('../index');

describe('Universe', function() {
  describe('.ready', function() {
    it('fetches the current fanclub and customer', function(done) {
      nock('https://services.sparkart.net').get('/api/v1/fanclub?key=12345').reply(200, '{"fanclub": "demo!"}');
      nock('https://services.sparkart.net').get('/api/v1/account/status').reply(200, '{"logged_in": true}');
      nock('https://services.sparkart.net').get('/api/v1/account?key=12345').reply(200, '{"customer": "me!"}');

      var universe = new Universe({key: '12345'});
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

    it('with staging environment', function(done) {
      nock('https://staging.services.sparkart.net').get('/api/v1/fanclub?key=12345').reply(200, '{"fanclub": "demo!"}');
      nock('https://staging.services.sparkart.net').get('/api/v1/account/status').reply(200, '{"logged_in": true}');
      nock('https://staging.services.sparkart.net').get('/api/v1/account?key=12345').reply(200, '{"customer": "me!"}');

      var universe = new Universe({environment: 'staging', key: '12345'});
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

    it('with bad environment defaults to production', function(done) {
      nock('https://services.sparkart.net').get('/api/v1/fanclub?key=12345').reply(200, '{"fanclub": "demo!"}');
      nock('https://services.sparkart.net').get('/api/v1/account/status').reply(200, '{"logged_in": true}');
      nock('https://services.sparkart.net').get('/api/v1/account?key=12345').reply(200, '{"customer": "me!"}');

      var universe = new Universe({environment: 'bad', key: '12345'});
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
      nock('https://services.sparkart.net').get('/api/v1/account/status').reply(200, '{"logged_in": true}');
      nock('https://services.sparkart.net').get('/api/v1/account?key=12345').reply(200, '{"customer": "me!"}');

      var context = {
        resources: {
          fanclub: {fanclub: 'demo!'}
        }
      };

      var universe = new Universe({key: '12345', context: context});
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
      nock('https://services.sparkart.net').get('/api/v1/fanclub?key=12345').reply(200, '{"fanclub": "demo!"}');
      nock('https://services.sparkart.net').get('/api/v1/account/status').reply(200, '{"logged_in": false}');

      var universe = new Universe({key: '12345'});
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
          plans6:  {url: 'https://services.sparkart.net/api/v1/plans'},
          plans7:  {url: 'http://solidus.com'},
          plans8:  {url: 12345},
          plans9:  {url: null},
          plans10: {url: undefined}
        });
        done();
      };

      var universe = new Universe({key: '12345'});
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

      var universe = new Universe({key: '12345'});
      universe.render({});
    });
  });

  describe('.post', function() {
    it('sends data to the endpoint', function(done) {
      var body   = {id: 1, email: 'test@sparkart.com'};
      var result = {status: 'ok', customer: body};
      nock('https://services.sparkart.net').post('/api/v1/account?key=12345', body).reply(200, JSON.stringify(result));

      var universe = new Universe({key: '12345'});
      universe.post('/account', body, function(err, data) {
        assert.ifError(err);
        assert.deepEqual(data, result);
        done();
      });
    });
  });

  describe('.resource', function() {
    it('returns a resource from a Universe endpoint', function(done) {
      var universe = new Universe({key: '12345'});
      var resource = universe.resource('/account');
      assert.deepEqual(resource, {
        url: 'https://services.sparkart.net/api/v1/account',
        query: {key: '12345'},
        with_credentials: true
      });
      done();
    });
  });

  describe('.jsonpResource', function() {
    it('returns a resource from a Universe endpoint', function(done) {
      var universe = new Universe({key: '12345'});
      var resource = universe.jsonpResource('/account/status');
      assert.deepEqual(resource, {
        url: 'https://services.sparkart.net/api/v1/account/status',
        jsonp: true
      });
      done();
    });
  });
});
