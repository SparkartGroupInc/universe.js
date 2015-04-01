var fs = require('fs');

module.exports.port = 8081;
module.exports.host = 'http://localhost:' + module.exports.port;

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
    if (req.url.indexOf('solidus_client_jsonp_callback_100000') == -1) {
      res.end(JSON.stringify(data));
    } else {
      res.end('solidus_client_jsonp_callback_100000(' + JSON.stringify(data) + ');');
    }
  };
  var not_found = function() {
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({error: 'Not Found: ' + req.url}));
  };

  var logged_in = req.url.indexOf('/i/') == 0;

  switch (req.method + ' ' + req.url.substring(2)) {
  case 'GET /api/v1/fanclub?key=12345':
  case 'GET /api/v1/fanclub?key=12345&callback=solidus_client_jsonp_callback_100000':
    success({fanclub: 'demo!'});
    break;

  case 'GET /api/v1/fanclub?key=wrong':
  case 'GET /api/v1/fanclub?key=wrong&callback=solidus_client_jsonp_callback_100000':
    success({status: 'error', message: 'Not Found'});
    break;

  case 'GET /api/v1/account/status':
  case 'GET /api/v1/account/status?callback=solidus_client_jsonp_callback_100000':
    success({logged_in: logged_in});
    break;

  case 'GET /api/v1/account?key=12345':
  case 'GET /api/v1/account?key=12345&callback=solidus_client_jsonp_callback_100000':
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

  case 'GET /api/v1/account?key=12345&_method=POST&callback=solidus_client_jsonp_callback_100000&id=1&email=test%40sparkart.com':
    success({status: 'ok', customer: {id: 1, email: 'test@sparkart.com'}});
    break;

  default:
    not_found();
  }
};
