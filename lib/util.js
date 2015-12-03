module.exports = require('solidus-client/lib/util');

module.exports.isMobile = !module.exports.isNode && navigator.userAgent.match(/Mobile/i);
