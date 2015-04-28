var util = require('solidus-client/lib/util');

if (!util.isNode) {
  require('./tests/checkout')();
}
require('./tests/universe-js')();
