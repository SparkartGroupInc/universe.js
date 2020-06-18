var assert = require('assert');
var webdriver = require('selenium-webdriver');
var _ = require('underscore');

var config = require('./config');

var browserStackConfig = {
  'browserstack.local': true,
  'browserstack.user':  'sparkart',
  'browserstack.key':   'TODO',
  'name':               'universe-js'
}

var setups = [
  // https://caniuse.com/usage-table
  {browserName: 'IE', browser_version: '11.0'}, // TODO: localStorage seems very unreliable on IE
  {browserName: 'Edge', browser_version: '18.0'},
  {browserName: 'Edge', browser_version: '17.0'},
  {browserName: 'Firefox', browser_version: '76.0'},
  {browserName: 'Firefox', browser_version: '75.0'},
  {browserName: 'Chrome', browser_version: '83'},
  {browserName: 'Chrome', browser_version: '81'},
  {browserName: 'Chrome', browser_version: '80'},
  {browserName: 'Chrome', browser_version: '79'},
  {browserName: 'Chrome', browser_version: '78'},
  {browserName: 'Safari', browser_version: '13.1'},
  {browserName: 'Safari', browser_version: '13.0'},
  {browserName: 'Safari', browser_version: '12.1'},
  {browserName: 'Safari', browser_version: '11.1'},
  {browserName: 'Opera', browser_version: '12.15'},

  // https://www.browserstack.com/test-on-the-right-mobile-devices
  // {device: 'iPhone 8', os_version: '13.0', realMobile: true},
  // {device: 'iPhone XR', os_version: '12.0', realMobile: true},
  // {device: 'Google Pixel 3', os_version: '9.0', realMobile: true},
  // {device: 'Samsung Galaxy S9 Plus', os_version: '8.0', realMobile: true},
  // {device: 'Samsung Galaxy S8', os_version: '7.0', realMobile: true},
  // {device: 'iPad 6th', os_version: '11.0', realMobile: true},
  // {device: 'iPhone 8 Plus', os_version: '12.0', realMobile: true},
  // {device: 'iPhone 6S', os_version: '12.0', realMobile: true},
  // {device: 'Google Pixel 4', os_version: '10.0', realMobile: true},
  // {device: 'Huawei P20 Lite', os_version: '9.0', realMobile: true},
  // {device: 'Samsung Galaxy J7 Prime', os_version: '7.0', realMobile: true},
  // {device: 'Samsung Galaxy A8', os_version: '7.0', realMobile: true},
  // {device: 'Samsung Galaxy J5 Prime', os_version: '6.0', realMobile: true},
  // {device: 'Samsung Galaxy Tab S4', os_version: '8.0', realMobile: true}
];

setups.forEach(function (setup) {
  describe(_.compact([setup.device, setup.os_version, setup.browserName, setup.browser_version]).join(', '), function() {
    var driver;

    before(function() {
      driver = new webdriver.Builder()
        .usingServer('http://hub-cloud.browserstack.com/wd/hub')
        .withCapabilities(_.extend({}, browserStackConfig, setup))
        .build();
    });

    after(function() {
      driver.quit();
    });

    it('runs the mocha tests', async done => {
      let err;
      await driver.get(config.testPage);
      await driver.wait(async () => {
        const finished = await driver.executeScript('return (typeof mocha_finished !== "undefined") && mocha_finished');
        if (!finished) return false;

        const stats = await driver.executeScript('return mocha_stats');
        console.log('    Passes: ' + stats.passes + ', Failures: ' + stats.failures + ', Duration: ' + (stats.duration / 1000).toFixed(2) + 's');

        if (!stats.tests) {
          err = new Error('Failed to run tests');
        } else if (stats.failures) {
          err = new Error(`${stats.failures} tests failed`);
          const failures = await driver.executeScript('return mocha_failures');
          for (var i = 0; i < failures.length; ++i) {
            var prefix = '    ' + (i + 1) + '. ';
            console.log(prefix + failures[i][0]);
            console.log(Array(prefix.length + 1).join(' ') + failures[i][1]);
          }
        }

        return true;
      });
      done(err);
    });
  });
});
