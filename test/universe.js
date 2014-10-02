var assert = require('assert');
var Handlebars = require('handlebars');
var nock = require('nock');

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

  describe('.view', function() {
    it('expands the Universe resources URLs', function(done) {
      var view = {
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
      };
      var universe = new Universe({key: '12345'});
      view = universe.view(view);
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
    });

    it('adds a .render method to the view', function(done) {
      nock('https://services.sparkart.net').get('/api/v1/plans?key=12345').reply(200, '{"plans": "success!"}');

      var view = {
        resources: {plans: '/plans'},
        template: Handlebars.compile('test {{resources.plans.plans}}')
      };
      var universe = new Universe({key: '12345'});
      view = universe.view(view);
      view.render(function(html) {
        assert.equal(html, 'test success!');
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
