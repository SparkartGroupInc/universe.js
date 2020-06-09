var API_URLS = {
  test:       'http://lvh.me:8081/api/v1',
  staging:    'https://staging.services.sparkart.net/api/v1',
  production: 'https://services.sparkart.net/api/v1'
};

var SolidusClient = require('solidus-client');
var Resource = require('solidus-client/lib/resource');

var Universe = function(options) {
  if (!(this instanceof Universe)) return new Universe(options);

  SolidusClient.call(this, options);

  options || (options = {});
  this.environment = options.environment || 'production';
  this.key         = options.key;
};

Universe.prototype = Object.create(SolidusClient.prototype);

Universe.prototype.init = function(callback) {
  var self = this;
  var data = {};

  getFanclub.call(self, function(err, fanclub) {
    data.fanclub = fanclub;
    if (err) {
      if (callback) callback(err, data);
      return setTimeout(function() {self.emit('error', err)}, 0);
    }

    getCustomer.call(self, function(err, customer) {
      data.customer = customer;
      if (callback) callback(err, data);
      if (!err) setTimeout(function() {self.emit('ready', data)}, 0);
    });
  });
};

Universe.prototype.render = function() {
  expandResourcesEndpoints.call(this, arguments[0]);
  return SolidusClient.prototype.render.apply(this, arguments);
};

Universe.prototype.get = function(endpoint, callback) {
  requestResource.call(this, 'get', endpoint, null, callback);
};

Universe.prototype.post = function(endpoint, payload, callback) {
  requestResource.call(this, 'post', endpoint, payload, callback);
};

Universe.prototype.resource = function(endpoint) {
  const resource = {
    url: resourceUrl.call(this, endpoint),
    query: {
      key: this.key
    },
    with_credentials: true,
    headers: {}
  };

  if (sessionStorage.getItem('universeAccessToken')) {
    resource.headers.Authorization = 'Bearer ' + sessionStorage.getItem('universeAccessToken');
  }

  return resource;
};

Universe.prototype.jsonpResource = function(endpoint) {
  return {
    url: resourceUrl.call(this, endpoint),
    jsonp: true
  };
};

// PRIVATE

var getFanclub = function(callback) {
  if (this.context && this.context.resources && this.context.resources.fanclub) {
    callback(null, this.context.resources.fanclub.fanclub);
  } else {
    this.get('/fanclub', function(err, data) {
      callback(err, data ? data.fanclub : null);
    });
  }
};

var getCustomer = function(callback) {
  if (sessionStorage.getItem('universeAccessToken')) {
    this.get('/account', function(err, data) {
      callback(err, data ? data.customer : null);
    });
  } else {
    callback();
  }
};

var expandResourcesEndpoints = function(view) {
  if (!view || typeof view !== 'object') return;

  for (var name in view.resources) {
    var resource = view.resources[name];
    if (typeof resource === 'string' && resource[0] === '/') {
      resource = this.resource(resource);
    } else if (resource !== null && typeof resource === 'object' && typeof resource.url === 'string' && resource.url[0] === '/') {
      resource.url = resourceUrl.call(this, resource.url);
    }
    view.resources[name] = resource;
  }
};

var resourceUrl = function(endpoint) {
  return (API_URLS[this.environment] || API_URLS['production']) + endpoint;
};

var requestResource = function(method, endpoint, payload, callback) {
  const self = this;

  validateTokens.call(self, function(err) {
    const cb = (err, response) => callback(err, response ? response.data : undefined);
    const resource = new Resource(self.resource(endpoint), self.resources_options);
    if (method === 'get') {
      resource.get(cb);
    } else if (method === 'post') {
      if (resource.requestType() == 'jsonp') {
        resource.options.query || (resource.options.query = {});
        resource.options.query._method = 'POST';
      }
      resource.post(payload, cb);
    }
  });
}

var validateTokens = function(callback) {
  const now = new Date().getTime();

  if (sessionStorage.getItem('universeAccessToken') && now < sessionStorage.getItem('universeAccessTokenExpiration')) {
    // Valid access token
    return callback();
  } else {
    sessionStorage.removeItem('universeAccessToken');
    sessionStorage.removeItem('universeAccessTokenExpiration');
  }

  if (!sessionStorage.getItem('universeRefreshToken') || now >= (sessionStorage.getItem('universeRefreshTokenExpiration') || Infinity)) {
    // Missing or expired refresh token
    sessionStorage.removeItem('universeRefreshToken');
    sessionStorage.removeItem('universeRefreshTokenExpiration');
    return callback(true);
  }

  // Refresh the access token
  const options = this.resource('/login/refresh');
  options.headers['X-Refresh-Token'] = sessionStorage.getItem('universeRefreshToken');
  const resource = new Resource(options, this.resources_options);
  resource.post(null, function (err, response) {
    if (err) {
      if (err.status === 401) {
        // Invalid refresh token
        sessionStorage.removeItem('universeRefreshToken');
        sessionStorage.removeItem('universeRefreshTokenExpiration');
      }
      callback(err);
    } else {
      sessionStorage.setItem('universeAccessToken', response.data.access_token);
      sessionStorage.setItem('universeAccessTokenExpiration', response.data.access_token_expires_at);
      sessionStorage.setItem('universeRefreshToken', response.data.refresh_token);
      sessionStorage.setItem('universeRefreshTokenExpiration', response.data.refresh_token_expires_at);
      callback();
    }
  });
}

module.exports = Universe;
