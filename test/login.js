var assert = require('assert');

var Universe = require('../index');

var config = require('./config');

describe('Universe Login Prompt', function() {

  describe('.prompt', function() {
    it('opens a popup window', function(done) {
      done();
    });

    it('does not open a popup window on mobile devices', function(done) {
      done();
    });

    it('gets login URL from Universe instance if not defined', function(done) {
      done();
    });

    it('prepends current window location to redirects if defined as relative paths', function(done) {
      done();
    });
  });

  describe('.linkify', function() {
    it('triggers login prompts for all links containing the word login', function(done) {
      done();
    });

    it('captures events for dynamically rendered HTML', function(done) {
      done();
    });

    it('scopes event delegation to body element by default', function(done) {
      done();
    });
  });


});
