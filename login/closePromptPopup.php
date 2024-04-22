<!DOCTYPE html>
<html lang="en">
<body>

  <script>

    const API_HOST = '<?= fw_get_db_settings_option('universe_base') ?>';
    const API_KEY = '<?= fw_get_db_settings_option('universe_key') ?>';

    // Get the refresh token from the query string. If present, use it to
    // immediately get an access token
    const refreshToken = qsParam('refresh_token');
    if (refreshToken) {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', API_HOST + '/api/v1/refresh?key=' + API_KEY);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          // Request is complete; if it was successful, save the access token
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            if (data.status === 'ok') {
              localStorage.setItem('universeAccessToken', data.access.access_token);
              localStorage.setItem('universeAccessTokenExpiration', data.access.access_token_expiration * 1000);
              localStorage.setItem('universeRefreshToken', data.access.refresh_token);
              localStorage.setItem('universeRefreshTokenExpiration', data.access.refresh_token_expiration * 1000);
            }
          }
          redirect();
        }
      };
      xhr.send(JSON.stringify({refresh_token: refreshToken}));
    } else {
      redirect();
    }

    function qsParam(name, defaultValue) {
      return decodeURIComponent((window.location.search.match(new RegExp('[\\?&]' + name + '=([^&#$]+)')) || [undefined, defaultValue || ''])[1]);
    };

    function redirect() {
      const redirect = localStorage.getItem('universeLoginRedirect') || qsParam('redirect', '/');
      localStorage.removeItem('universeLoginRedirect');
      window.location.href = redirect;
    }

  </script>

</body>
</html>
