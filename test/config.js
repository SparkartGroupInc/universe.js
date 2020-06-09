var fs = require('fs');
var url  = require('url');

// Safari doesn't like localhost, see https://www.browserstack.com/question/663
module.exports.port = 8081;
module.exports.host = 'http://lvh.me:' + module.exports.port;

module.exports.routes = function (req, res) {
  if (req.url.indexOf('/test/browser/') == 0) {
    fs.readFile('.' + req.url.replace(/\?.*$/, ''), function(err, data) {
      var content_type;
      if (/\.css$/.test(req.url)) content_type = 'text/css';
      else if (/\.js$/.test(req.url)) content_type = 'text/javascript';
      else content_type = 'text/html';
      res.writeHead(200, {'Content-Type': content_type});
      res.end(err || data);
    });
    return;
  }

  var success = function(data) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    var callback = url.parse(req.url, true).query.callback;
    if (callback) {
      res.end(callback + '(' + JSON.stringify(data) + ');');
    } else {
      res.end(JSON.stringify(data));
    }
  };

  var not_found = function() {
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({error: 'Not Found: ' + req.url}));
  };

  var logged_in = req.headers.authorization && req.headers.authorization.match(/^Bearer valid_access_token(_\d+)?$/);

  switch ((req.method + ' ' + req.url).replace(/solidus_client_jsonp_callback_\d+/, 'solidus_client_jsonp_callback')) {
  case 'GET /api/v1/fanclub?key=12345':
  case 'GET /api/v1/fanclub?key=12345&callback=solidus_client_jsonp_callback':
    success({fanclub: 'demo!'});
    break;

  case 'GET /api/v1/fanclub?key=wrong':
  case 'GET /api/v1/fanclub?key=wrong&callback=solidus_client_jsonp_callback':
    success({status: 'error', message: 'Not Found'});
    break;

  case 'GET /api/v1/account/status':
  case 'GET /api/v1/account/status?callback=solidus_client_jsonp_callback':
    success({logged_in: logged_in});
    break;

  case 'GET /api/v1/account?key=12345':
  case 'GET /api/v1/account?key=12345&callback=solidus_client_jsonp_callback':
    success(logged_in ? {customer: 'me!'} : {});
    break;

  case 'POST /api/v1/account?key=12345':
    var body = '';
    req.on('data', function(data) {body += data;});
    req.on('end', function() {
      if (body == '{"id":1,"email":"test@sparkart.com"}') success({status: 'ok', customer: {id: 1, email: 'test@sparkart.com'}});
      else not_found();
    });
    break;

  case 'GET /api/v1/account?key=12345&_method=POST&callback=solidus_client_jsonp_callback&id=1&email=test%40sparkart.com':
    success({status: 'ok', customer: {id: 1, email: 'test@sparkart.com'}});
    break;

  case 'POST /api/v1/login/refresh?key=12345':
    if (req.headers['x-refresh-token'] === 'valid_refresh_token') {
      var now = new Date().getTime();
      success({
        access_token: 'valid_access_token_2',
        access_token_expires_at: now + 5000,
        refresh_token: 'valid_refresh_token_2',
        refresh_token_expires_at: now + 50000
      });
    } else if (req.headers['x-refresh-token'] === 'oh no') {
      not_found();
    } else {
      res.writeHead(401, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({error: 'Invalid refresh token'}));
    }
    break;

  default:
    not_found();
  }
};
