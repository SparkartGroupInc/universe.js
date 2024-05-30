var fs = require('fs');
var url  = require('url');

// Server runs on universe-js.test and test page runs on lvh.me, to test cross-domain requests
module.exports.port = 8081;
module.exports.host = 'http://universe-js.test:' + module.exports.port;
module.exports.sameSiteUrlLoggedIn = 'http://i.universe.lvh.me:' + module.exports.port + '/api/v1';
module.exports.sameSiteUrlLoggedOut = 'http://o.universe.lvh.me:' + module.exports.port + '/api/v1';
module.exports.testHost = 'http://lvh.me:' + module.exports.port;
module.exports.testPage = module.exports.testHost + '/test/browser/test.html';
module.exports.functionalTestPage = module.exports.testHost + '/test/browser/functional.html';
module.exports.accessTokenExpiration = 15 * 60;
module.exports.accessTokenExpirationMs = module.exports.accessTokenExpiration * 1000;
module.exports.refreshTokenExpiration = 24 * 60 * 60;
module.exports.refreshTokenExpirationMs = module.exports.refreshTokenExpiration * 1000;

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

  if (req.url.indexOf('/login/reload') == 0) {
    fs.readFile('./login/closePromptPopup.hbs', function(err, data) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(err || data);
    });
    return;
  }

  var success = function(data) {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': req.headers.origin || module.exports.testHost,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '1728000'
    });
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

  var logged_in = (req.headers.authorization && req.headers.authorization.match(/^Bearer valid_access_token(_\d+)?$/)) || (module.exports.sameSiteUrlLoggedIn.indexOf(req.headers.host) > -1);

  if (req.method === 'OPTIONS') return success();

  switch ((req.method + ' ' + req.url)
    .replace(/solidus_client_jsonp_callback_\d+/, 'solidus_client_jsonp_callback')
    .replace(/redirect=[^&#$]+/, 'redirect=')) {
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

  case 'POST /api/v1/refresh?key=12345':
    var body = '';
    req.on('data', function(data) {body += data;});
    req.on('end', function() {
      if (body == '{"refresh_token":"valid_refresh_token"}') {
        var now = new Date().getTime() / 1000;
        success({
          status: 'ok',
          access: {
            access_token: 'valid_access_token_2',
            access_token_expiration: now + module.exports.accessTokenExpiration,
            refresh_token: 'valid_refresh_token_2',
            refresh_token_expiration: now + module.exports.refreshTokenExpiration
          }
        });
      } else if (body == '{"refresh_token":"oh no"}') {
        // To test errors not related to bad refresh tokens
        not_found();
      } else {
        success({status: 'error', messages: ['Unable to decode refresh token']});
      }
    });
    break;

  case 'GET /1/login?popup=1&redirect=':
    var now = Math.round(new Date().getTime() / 1000);
    var location = [
      req.headers.origin || module.exports.testHost,
      '/login/reload?access_token=valid_access_token&access_token_expiration=',
      now + module.exports.accessTokenExpiration,
      '&refresh_token=valid_refresh_token&refresh_token_expiration=',
      now + module.exports.refreshTokenExpiration,
      '&redirect=',
      encodeURIComponent(url.parse(req.url, true).query.redirect || '')
    ].join('');
    res.writeHead(301, {Location: location});
    res.end();
    break;

  case 'GET /1/logout?redirect=':
    res.writeHead(301, {Location: url.parse(req.url, true).query.redirect || req.headers.origin || module.exports.testHost});
    res.end();
    break;

  default:
    not_found();
  }
};
