var SolidusClient = require('solidus-client');

var API_URLS = {
  staging:    'http://staging.services.sparkart.net/api/v1',
  production: 'http://services.sparkart.net/api/v1'
};

var Universe = function() {
  if (!(this instanceof Universe)) return new Universe();

  this.environment    = 'production';
  this.context        = {};
  this.solidus_client = new SolidusClient();
};

Universe.prototype.ready = function(callback) {
  var self = this;

  self.context.universe || (self.context.universe = {});
  self.getFanclub(function(fanclub) {
    self.context.universe.fanclub = fanclub;
    self.getCustomer(function(customer) {
      self.context.universe.customer = customer;

      self.solidus_client.context = self.context;
      callback();
    });
  });
};

Universe.prototype.getFanclub = function(callback) {
  if (this.context.resources && this.context.resources.fanclub) {
    callback(this.context.resources.fanclub.fanclub);
  } else {
    this.getResource('/fanclub', function(err, data) {
      callback(data.fanclub);
    });
  }
};

Universe.prototype.getCustomer = function(callback) {
  var self = this;
  self.getJsonpResource('/account/status', function(err, data) {
    if (data.logged_in) {
      self.getResource('/account', function(err, data) {
        callback(data.customer);
      });
    } else {
      callback();
    }
  });
};

Universe.prototype.getResource = function(endpoint, callback) {
  this.solidus_client.getResource(this.resource(endpoint), null, callback);
};

Universe.prototype.getJsonpResource = function(endpoint, callback) {
  this.solidus_client.getResource(this.jsonpResource(endpoint), null, callback);
};

Universe.prototype.resource = function(endpoint) {
  return {
    url: this.api_url(endpoint),
    query: {
      key: this.api_key
    },
    with_credentials: true
  };
};

Universe.prototype.jsonpResource = function(endpoint) {
  return {
    url: this.api_url(endpoint),
    jsonp: true
  };
};

Universe.prototype.api_url = function(endpoint) {
  return (API_URLS[this.environment] || API_URLS['production']) + endpoint;
};

Universe.prototype.render = function() {
  return this.solidus_client.render.apply(this.solidus_client, arguments);
}

module.exports = Universe;
