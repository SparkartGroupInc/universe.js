const universejs = require('../../')({environment: 'test', key: '12345'});
const login = require('../../login');

window.universeStatus = undefined;

universejs.init(function(err, data) {
  if (err) throw err;

  // Create a Log In / Log Out link
  const a = document.createElement('a');
  a.id = 'universeButton';
  const linkText = document.createTextNode(data.customer ? 'Log Out' : 'Log In');
  a.appendChild(linkText);
  a.title = data.customer ? 'Log Out' : 'Log In';
  a.href = (data.customer ? '//universe-js.test:8081/1/logout?redirect=' : 'login?redirect=') + encodeURIComponent(window.location.href);
  document.body.appendChild(a);

  // Linkify it
  login.linkify({links: {login: '//universe-js.test:8081/1/login'}});

  // Tell browser-test.js we're done
  window.universeStatus = data.customer ? 'logged in' : 'logged out';
});
