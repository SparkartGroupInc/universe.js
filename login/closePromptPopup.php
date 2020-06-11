<!DOCTYPE html>
<html lang="en">
<body>

  <script>

    // After a successful login in the popup the parent window is redirected by
    // Universe to /login/reload (hardcoded path). This page is responsible for
    // closing the popup and navigating to the final destination.

    // Copied from https://wzrd.in/standalone/cookie@0.1.2, until HTTPS is enabled on browserify.sparkart.net
    !function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var r;r="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,r.cookie=e()}}(function(){return function e(r,n,o){function t(u,f){if(!n[u]){if(!r[u]){var a="function"==typeof require&&require;if(!f&&a)return a(u,!0);if(i)return i(u,!0);var p=new Error("Cannot find module '"+u+"'");throw p.code="MODULE_NOT_FOUND",p}var s=n[u]={exports:{}};r[u][0].call(s.exports,function(e){var n=r[u][1][e];return t(n?n:e)},s,s.exports,e,r,n,o)}return n[u].exports}for(var i="function"==typeof require&&require,u=0;u<o.length;u++)t(o[u]);return t}({1:[function(e,r,n){var o=function(e,r,n){n=n||{};var o=n.encode||i,t=[e+"="+o(r)];if(null!=n.maxAge){var u=n.maxAge-0;if(isNaN(u))throw new Error("maxAge should be a Number");t.push("Max-Age="+u)}return n.domain&&t.push("Domain="+n.domain),n.path&&t.push("Path="+n.path),n.expires&&t.push("Expires="+n.expires.toUTCString()),n.httpOnly&&t.push("HttpOnly"),n.secure&&t.push("Secure"),t.join("; ")},t=function(e,r){r=r||{};var n={},o=e.split(/; */),t=r.decode||u;return o.forEach(function(e){var r=e.indexOf("=");if(!(r<0)){var o=e.substr(0,r).trim(),i=e.substr(++r,e.length).trim();if('"'==i[0]&&(i=i.slice(1,-1)),void 0==n[o])try{n[o]=t(i)}catch(e){n[o]=i}}}),n},i=encodeURIComponent,u=decodeURIComponent;r.exports.serialize=o,r.exports.parse=t},{}]},{},[1])(1)});

    var redirect = cookie.parse(document.cookie).redirect;

    document.cookie = cookie.serialize('redirect', false, {path: '/login', expires: new Date('Thu, 01 Jan 1970 00:00:00 GMT')});

    if( window.opener && redirect ){
      window.opener.location.href = redirect;
      window.close();
    }

  </script>

</body>
</html>
