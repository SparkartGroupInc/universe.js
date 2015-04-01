# universe.js

Interacting with Sparkart's [Universe API](http://docs.services.sparkart.net), using [SolidusClient](https://github.com/solidusjs/solidus-client)! The Universe module inherits from the SolidusClient module.

# Usage

## Construction

```javascript
var Universe = require('universejs');
var universe = new Universe({key: '12345'});
universe.context = {...};
```

Options:
 - `environment` - The Universe API to use, choices are `production` and `staging`. Defaults to `production`.
 - `key` - The Universe API key to use.

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
