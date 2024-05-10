<?php
/**
 * Plugin Name: Universe JS
 * Plugin URI:  https://github.com/sparkartgroup/universe-js
 * Description: Javascript modules and PHP functions for interacting with Sparkart's Universe API.
 * Version:     3.0.0
 * Author:      Sparkart Group, Inc.
 * Author URI:  http://www.sparkart.com/
 */
namespace Universe;

const CACHE_VERSION = 'v1';
const CACHE_EXPIRATION = 24 * 60 * 60;
const CACHE_FRESHNESS = 5 * 60;

class APIException extends \Exception{}

// Use the Universe settings from the Unyson theme to make an API request
function get($endpoint) {
  $api_url = fw_get_db_settings_option('universe_base');
  if (!$api_url) throw new \Exception('Missing Universe API URL');
  $api_key = fw_get_db_settings_option('universe_key');
  if (!$api_key) throw new \Exception('Missing Universe API Key');

  $url = "$api_url/api/v1/$endpoint" . (strpos($endpoint, '?') === false ? '?key=' : '&key=') . $api_key;

  $request = wp_remote_get($url);
  if (is_wp_error($request)) throw new APIException($request->get_error_message());

  $data = json_decode(wp_remote_retrieve_body($request));
  if (strcasecmp($data->status, 'error') == 0) throw new APIException(implode(', ', $data->messages));

  return $data;
}

// Get and cache the fanclub
function fanclub() {
  return memoize('universe_fanclub', function() {
    return get('fanclub')->fanclub;
  });
}

// Get and cache the plans, as an array keyed by name
function plans() {
  return memoize('universe_plans', function() {
    return array_reduce(get('plans')->plans, function($plans, $plan) {
      $plans[$plan->name] = $plan;
      return $plans;
    }, []);
  });
}

// Cache the $fn result for CACHE_EXPIRATION seconds, but refresh it after CACHE_FRESHNESS seconds
function memoize($transient, $fn) {
  // Get the cached value
  $name = CACHE_VERSION . '_' . $transient;
  $data = get_transient($name);

  if ($data === false || (time() - $data['cached_at']) > CACHE_FRESHNESS) {
    // The value doesn't exist or is stale, cache a fresh value
    try {
      $data = array('cached_at' => time(), 'value' => $fn());
      set_transient($name, $data, CACHE_EXPIRATION);
    } catch (APIException $e) {
      // There's a problem with Universe, use the stale value if possible
      if ($data === false) throw $e;
    }
  }

  return $data['value'];
}

add_action('wp_enqueue_scripts', 'Universe\wp_enqueue_scripts');
function wp_enqueue_scripts() {
  wp_enqueue_script('universe-js', plugin_dir_url( __FILE__ ) . 'build/universe.js', ['jquery'], date("ymd-Gis", filemtime(plugin_dir_path( __FILE__ ) . 'build/universe.js')));
}

add_action('wp_head', 'Universe\wp_head');
function wp_head() {
  // JS function to get a Universe instance initialized with the Unyson settings
  ?>
    <script type="text/javascript">
      function universejsInstance() {
        const universejs = Universe({
          apiUrl: '<?= fw_get_db_settings_option('universe_base') . '/api/v1' ?>',
          key: '<?= fw_get_db_settings_option('universe_key') ?>',
          useJWT: <?= fw_get_db_settings_option('universe_session') === 'cookie' ? 'false' : 'true' ?>
        });
        universejs.fanclub = <?= wp_json_encode(fanclub()) ?>;
        universejs.plans = <?= wp_json_encode(plans()) ?>;
        return universejs;
      }
    </script>
  <?php
}

add_shortcode('universe_forum_url', 'Universe\forum_url');
function forum_url($atts = [], $content = '', $shortcode_tag = '') {
  return prepare_shortcode_url(fanclub()->links->forum, $atts, $content, $shortcode_tag);
}

add_shortcode('universe_ipboard_url', 'Universe\ipboard_url');
function ipboard_url($atts = [], $content = '', $shortcode_tag = '') {
  return prepare_shortcode_url(fanclub()->links->ipboard, $atts, $content, $shortcode_tag);
}

add_shortcode('universe_login_url', 'Universe\login_url');
function login_url($atts = [], $content = '', $shortcode_tag = '') {
  return prepare_shortcode_url(fanclub()->links->login, $atts, $content, $shortcode_tag);
}

add_shortcode('universe_logout_url', 'Universe\logout_url');
function logout_url($atts = [], $content = '', $shortcode_tag = '') {
  return prepare_shortcode_url(fanclub()->links->logout, $atts, $content, $shortcode_tag);
}

add_shortcode('universe_password_reset_url', 'Universe\password_reset_url');
function password_reset_url($atts = [], $content = '', $shortcode_tag = '') {
  return prepare_shortcode_url(fanclub()->links->password_reset, $atts, $content, $shortcode_tag);
}

add_shortcode('universe_redeem_url', 'Universe\redeem_url');
function redeem_url($atts = [], $content = '', $shortcode_tag = '') {
  return prepare_shortcode_url(fanclub()->links->redeem, $atts, $content, $shortcode_tag);
}

add_shortcode('universe_saved_card_url', 'Universe\saved_card_url');
function saved_card_url($atts = [], $content = '', $shortcode_tag = '') {
  return prepare_shortcode_url(fanclub()->links->saved_card, $atts, $content, $shortcode_tag);
}

add_shortcode('universe_legals_privacy_url', 'Universe\legals_privacy_url');
function legals_privacy_url($atts = [], $content = '', $shortcode_tag = '') {
  return prepare_shortcode_url(fanclub()->links->legals->privacy, $atts, $content, $shortcode_tag);
}

add_shortcode('universe_legals_privacy_california_url', 'Universe\legals_privacy_california_url');
function legals_privacy_california_url($atts = [], $content = '', $shortcode_tag = '') {
  return prepare_shortcode_url(fanclub()->links->legals->{'privacy-california'}, $atts, $content, $shortcode_tag);
}

add_shortcode('universe_legals_terms_url', 'Universe\legals_terms_url');
function legals_terms_url($atts = [], $content = '', $shortcode_tag = '') {
  return prepare_shortcode_url(fanclub()->links->legals->terms, $atts, $content, $shortcode_tag);
}

add_shortcode('universe_checkout_url', 'Universe\checkout_url');
function checkout_url($atts, $content = '', $shortcode_tag = '') {
  return prepare_shortcode_url(plans()[$atts['plan']]->checkout, $atts, $content, $shortcode_tag);
}

add_shortcode('universe_upgrade_url', 'Universe\upgrade_url');
function upgrade_url($atts, $content = '', $shortcode_tag = '') {
  $atts['redirect'] = prepare_shortcode_url(plans()[$atts['plan']]->checkout, [], '', '');
  return prepare_shortcode_url(fanclub()->links->login, $atts, $content, $shortcode_tag);
}

function prepare_shortcode_url($url, $atts, $content, $shortcode_tag) {
  // Lowercase attribute keys, set defaults
  $atts = shortcode_atts(
    array(
      'scheme' => $shortcode_tag ? 'false' : 'true',
      'redirect' => null
    ),
    array_change_key_case((array) $atts, CASE_LOWER),
    $shortcode_tag
  );

  if ($atts['scheme'] === 'false') {
    $url = preg_replace('/^https?:\/\//', '', $url);
  }
  if ($atts['redirect']) {
    $redirect = rawurlencode(str_starts_with($atts['redirect'], '/') ? get_site_url() . $atts['redirect'] : $atts['redirect']);
    $url = $url . (strpos($url, '?') === false ? '?' : '&') . "redirect=$redirect";
  }

  return $url;
}
