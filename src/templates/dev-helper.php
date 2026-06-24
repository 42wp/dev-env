<?php
/**
 * Plugin Name: 42WP Dev Helper
 * Description: Local dev shims injected by @42wp/dev-env (--vip). Ensures the
 *              WordPress admin media/file functions (media_handle_sideload,
 *              download_url, media_sideload_image, ...) are loaded in admin, REST
 *              and CLI contexts. Works around plugins such as FakerPress that call
 *              these without loading wp-admin/includes/media.php themselves — a
 *              common failure on VIP, where other code loads file.php early.
 * Author: 42WP
 *
 * This file is managed by the dev environment and mounted read-only into the
 * container; do not edit by hand.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'fortytwo_wp_load_media_includes' ) ) {
	/**
	 * Load the wp-admin media includes if they aren't already present.
	 *
	 * media_handle_sideload() lives in wp-admin/includes/media.php, while
	 * download_url() lives in file.php — plugins that guard on the latter can
	 * skip loading the former and fatal. Loading all three here is safe and idempotent.
	 */
	function fortytwo_wp_load_media_includes() {
		if ( function_exists( 'media_handle_sideload' ) ) {
			return;
		}
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
	}
}

// Cover the contexts where attachment generation runs: classic admin, the REST
// API (FakerPress 0.9+ generates via REST), and WP-CLI.
add_action( 'admin_init', 'fortytwo_wp_load_media_includes' );
add_action( 'rest_api_init', 'fortytwo_wp_load_media_includes' );

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	fortytwo_wp_load_media_includes();
}
