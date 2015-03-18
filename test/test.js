var util = require('solidus-client/lib/util');

if (!util.isNode) {
  require('./tests/login')();
}
require('./tests/universe-js')();
