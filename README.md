# universe.js

Interacting with Sparkart's [Universe API](http://docs.services.sparkart.net), using [SolidusClient](https://github.com/solidusjs/solidus-client)! The Universe module inherits from the SolidusClient module.

# Usage

## Construction

```javascript
var Universe = require('universe-js');
var universe = new Universe({key: '12345'});
universe.context = {...};
```

Options:
 - `environment` - The Universe API to use, choices are `production` and `staging`. Defaults to `production`.
 - `key` - The Universe API key to use.

Options to use a custom URL:
 - `apiURL` - The Universe API URL to use.
 - `key` - The Universe API key to use.
 - `useJWT` - Set to `false` to store the session in a cookie (if `apiURL` is a subdomain of the current site).

## .init

Fetches the current fanclub and logged-in customer. If the instance's context already contains a `resources.fanclub` key, it is used instead of being fetched from the API. The callback argument is optional.

```javascript
universe.init(function(err, data) {
  if (err) throw err;
  if (data.customer) {
    // The customer is logged in
  }
});
universe.on('error', function(err) {
  throw err;
});
universe.on('ready', function(data) {
  if (data.customer) {
    // The customer is logged in
  }
});
```

Callback arguments:
 - `err` - Error that occured while retrieving the resources.
 - `data` - Object containing the current [`fanclub`](http://docs.services.sparkart.net/fanclubs) and [`customer`](http://docs.services.sparkart.net/customer_accounts). `customer` is available only if the customer is logged in.

Emitted events:
 - `error` - Called with the same `err` argument as the callback.
 - `ready` - Called with the same `data` argument as the callback.

## .render

Same as `solidus_client.render` but the resources can be Universe endpoints.

```javascript
var view = {
  resources: {
    events: '/events',
    other: 'http://www.other.com'
  },
  ...
};
universe.render(view, function(err, html) {
  // ...
});
```

## .get

Fetch a resource. The URL can be a Universe endpoint.

```javascript
universe.get('/events', function(err, data) {
  // ...
});
```

## .post

Post to a resource. The URL can be a Universe endpoint.

```javascript
universe.post('/account', {...}, function(err, data) {
  // ...
});
```

# Wordpress Usage

Requires a Unyson Sparkart theme, which holds the API settings as Unyson options (`universe_base`, `universe_key` and `universe_session`).

## Wordpress Functions

 - `Universe\get('/some-endpoint')`: Fetch a resource from Universe.
 - `Universe\fanclub()`: Fetches and caches the fanclub. The cache is refreshed after 5 minutes.
 - `Universe\plans()`: Fetches and caches the plans. The cache is refreshed after 5 minutes.
 - `Universe\forum_url(options)`
 - `Universe\ipboard_url(options)`
 - `Universe\login_url(options)`
 - `Universe\logout_url(options)`
 - `Universe\password_reset_url(options)`
 - `Universe\redeem_url(options)`
 - `Universe\saved_card_url(options)`
 - `Universe\legals_privacy_url(options)`
 - `Universe\legals_privacy_california_url(options)`
 - `Universe\legals_terms_url(options)`
 - `Universe\checkout_url(options)`: Requires the `'plan' => 'Some Plan'` option.
 - `Universe\upgrade_url(options)`: Requires the `'plan' => 'Some Plan'` option.

All the URL functions above support the following options:

 - `'scheme' => true|false`: Defaults to true, which keeps the `https://` part of the URL.
 - `'redirect' => '/some-path/'`: Adds a `redirect` parameter to the URL. The parameter can also be a full URL.

## Wordpress Shortcodes

 - `universe_forum_url`
 - `universe_ipboard_url`
 - `universe_login_url`
 - `universe_logout_url`
 - `universe_password_reset_url`
 - `universe_redeem_url`
 - `universe_saved_card_url`
 - `universe_legals_privacy_url`
 - `universe_legals_privacy_california_url`
 - `universe_legals_terms_url`
 - `universe_checkout_url`: Requires the `plan='Some Plan'` parameter.
 - `universe_upgrade_url`: Requires the `plan='Some Plan'` parameter.

All the shortcodes above support the following parameters:

 - `scheme=true|false`: Defaults to false, which removes the `https://` part of the URL.
 - `redirect=/some-path/`: Adds a `redirect` parameter to the URL. The parameter can also be a full URL.

## JavaScript Functions

The `universejsInstance()` function will automatically be made available to the front-end. This function returns a universe.js instance already initialized with the Unyson settings. Usage example:

```javascript
const universejs = universejsInstance();
// universejs.fanclub is already available
// universejs.plans is already available

// Get the current customer and add it to the instance
universejs.get('/account', function (err, data) {
  if (err) throw err;
  universejs.customer = data.customer;
});
```

# Development

Quick commands to build the plugin:

```shell
# Compile the build/universe.js file
docker run --rm -v "$PWD":/app -w /app node:11.14 /bin/bash -c "npm install && npm run build"

# Package the plugin in the universe-js.zip file
(rm universe-js.zip || true) && zip -r -q universe-js.zip . -x '*.DS_Store' -x '.git/*' -x 'node_modules/*'
```
