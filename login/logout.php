<!DOCTYPE html>
<html lang="en">
<head>
    <meta name="referrer" content="origin">
</head>
<body>

<a id="redirect" referrerpolicy="origin" style="display:none" href="<?= Universe\logout_url() ?>"></a>
<script>

    // Clear the auth tokens and redirect to Universe so it can clear its session
    // Make sure to remove the referrer path, to prevent a redirect loop

    localStorage.removeItem('universeAccessToken');
    localStorage.removeItem('universeAccessTokenExpiration');
    localStorage.removeItem('universeRefreshToken');
    localStorage.removeItem('universeRefreshTokenExpiration');

    document.getElementById('redirect').click();

</script>
</body>
</html>
