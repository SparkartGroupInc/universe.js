<?php
/**
 * Plugin Name: Universe JS
 * Plugin URI:  https://github.com/sparkartgroup/universe-js
 * Description: Javascript modules and PHP functions for interacting with Sparkart's Universe API.
 * Version:     1.2.6.wordpress-migration
 * Author:      Sparkart Group, Inc.
 * Author URI:  http://www.sparkart.com/
 */
namespace Universe;

function fetch_resource($endpoint) {
  // TODO store key in plugin setting
  $url = "https://services.sparkart.net/api/v1/$endpoint" . (strpos($endpoint, '?') === false ? '?key=' : '&key=') . UNIVERSE_KEY;

  // Replace dynamic path segments ({tag}, {topic})
  $url = preg_replace_callback('/\{(.+?)\}/', function ($match) {return $GLOBALS['solidus_context']['parameters'][$match[1]];}, $url);

  $request = wp_remote_get($url);
  if (is_wp_error($request)) throw $request;
  $data = json_decode(wp_remote_retrieve_body($request));
  if (strcasecmp($data->status, 'error') == 0) throw new \Exception(implode(', ', $data->messages));
  return $data;
}

function start_exclusive_content($id = '') {
  $id = $id ?: rand();
  ?>
    <script class="universe">
      site.universeReady(function(isLoggedIn){
        isLoggedIn()
          ? site.render('<?= $id ?>')
          : site.render('upsell', {redirect: window.location.href.replace(window.location.origin, '')});
      });
    </script>
    <?php get_tmpl('upsell') ?>
    <template id="tmpl-<?= $id ?>">
  <?php
}

function end_exclusive_content() {
  ?>
  </template>
  <?php
}

function get_tmpl($id) {
  ?>
  <template id="tmpl-<?= $id ?>">
    <?php get_template_part("tmpl/$id") ?>
  </template>
  <?php
}

function get_template($template) {
  include plugin_dir_path(__FILE__) . $template . '.php';
}
