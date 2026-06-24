<?php
/**
 * 42WP demo content seeder — run by @42wp/dev-env's `--demo-content` flag via:
 *   wp eval-file - <count>     (script piped on STDIN, post count as the argument)
 *
 * Creates:
 *   - ~10 `42wp_author` terms (Portuguese names), ~10 tags, ~10 categories
 *   - a pool of free images downloaded once from picsum.photos and reused
 *   - <count> posts: rich HTML content + plain-text excerpt + featured image,
 *     each linked to 1 category, 2-5 tags and 1-3 authors, with varied past dates.
 *
 * This file is managed by the dev environment; edits will be overwritten.
 */

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

// media_handle_sideload() lives in wp-admin/includes/media.php.
if ( ! function_exists( 'media_handle_sideload' ) ) {
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
}

$count = isset( $args[0] ) ? max( 1, (int) $args[0] ) : 200;

/* -------------------------------------------------------------------------- *
 * Taxonomy terms
 * -------------------------------------------------------------------------- */

// The `42wp_author` taxonomy is registered by the project itself (the 42-framework
// composer mu-plugin), so we don't register it here. If it isn't available, the
// author terms below are simply skipped (wp_insert_term returns a WP_Error).

$author_names = [ 'José Almeida', 'Ricardo Feitosa', 'Júlia Silva', 'Marina Costa', 'Pedro Henrique', 'Ana Beatriz', 'Carlos Eduardo', 'Fernanda Lima', 'Rafael Oliveira', 'Beatriz Santos' ];
$tag_names    = [ 'Guerra', 'Viagem', 'Reality Show', 'Tecnologia', 'Economia', 'Cultura', 'Saúde', 'Educação', 'Meio Ambiente', 'Entretenimento' ];
$cat_names    = [ 'Brasil', 'Mundo', 'Esportes', 'Política', 'Ciência', 'Cultura', 'Tecnologia', 'Entretenimento', 'Saúde', 'Economia' ];

$ensure_terms = static function ( array $names, $taxonomy ) {
	$ids = [];
	foreach ( $names as $name ) {
		$existing = term_exists( $name, $taxonomy );
		if ( $existing ) {
			$ids[] = (int) ( is_array( $existing ) ? $existing['term_id'] : $existing );
			continue;
		}
		$new = wp_insert_term( $name, $taxonomy );
		if ( ! is_wp_error( $new ) ) {
			$ids[] = (int) $new['term_id'];
		}
	}
	return $ids;
};

$author_ids = $ensure_terms( $author_names, '42wp_author' );
$tag_ids    = $ensure_terms( $tag_names, 'post_tag' );
$cat_ids    = $ensure_terms( $cat_names, 'category' );

WP_CLI::log( sprintf( 'Terms ready: %d authors, %d tags, %d categories.', count( $author_ids ), count( $tag_ids ), count( $cat_ids ) ) );

/* -------------------------------------------------------------------------- *
 * Image pool — downloaded once from picsum.photos, reused across posts
 * -------------------------------------------------------------------------- */

$pool_size = min( $count, 25 );
$image_ids = [];
for ( $i = 0; $i < $pool_size; $i++ ) {
	$seed = 'fortytwo-' . wp_generate_password( 10, false );
	$url  = "https://picsum.photos/seed/{$seed}/1200/630.jpg";
	$id   = media_sideload_image( $url, 0, null, 'id' );
	if ( ! is_wp_error( $id ) ) {
		$image_ids[] = (int) $id;
	}
}
WP_CLI::log( sprintf( 'Images: %d/%d downloaded from picsum.photos.', count( $image_ids ), $pool_size ) );

/* -------------------------------------------------------------------------- *
 * Lorem ipsum corpus + helpers
 * -------------------------------------------------------------------------- */

$sentences = [
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
	'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
	'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris',
	'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum',
	'Excepteur sint occaecat cupidatat non proident sunt in culpa',
	'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit',
	'Neque porro quisquam est qui dolorem ipsum quia dolor sit amet',
	'Quis autem vel eum iure reprehenderit qui in ea voluptate velit',
	'At vero eos et accusamus et iusto odio dignissimos ducimus',
	'Et harum quidem rerum facilis est et expedita distinctio',
	'Temporibus autem quibusdam et aut officiis debitis aut rerum',
	'Itaque earum rerum hic tenetur a sapiente delectus ut aut',
	'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices',
	'Pellentesque habitant morbi tristique senectus et netus malesuada',
	'Curabitur pretium tincidunt lacus gravida ornare quam viverra',
	'Donec sollicitudin molestie malesuada nulla quis lorem ut libero',
	'Vivamus suscipit tortor eget felis porttitor volutpat aliquam',
	'Cras ultricies ligula sed magna dictum porta morbi leo risus',
];

$para = static function ( $min = 3, $max = 6 ) use ( $sentences ) {
	$n      = wp_rand( $min, $max );
	$picked = [];
	for ( $i = 0; $i < $n; $i++ ) {
		$picked[] = $sentences[ array_rand( $sentences ) ];
	}
	return implode( '. ', $picked ) . '.';
};

$heading = static function ( $words = 3 ) use ( $sentences ) {
	$parts = explode( ' ', $sentences[ array_rand( $sentences ) ] );
	$parts = array_slice( $parts, 0, $words );
	return ucfirst( strtolower( implode( ' ', $parts ) ) );
};

// Pick between $min and $max random values from $arr (without repeats).
$pick = static function ( array $arr, $min, $max ) {
	if ( empty( $arr ) ) {
		return [];
	}
	$n    = min( count( $arr ), wp_rand( $min, $max ) );
	$keys = (array) array_rand( $arr, $n );
	return array_map( static function ( $k ) use ( $arr ) {
		return $arr[ $k ];
	}, $keys );
};

$figure = static function () use ( $image_ids ) {
	if ( empty( $image_ids ) ) {
		return '';
	}
	$src = wp_get_attachment_image_url( $image_ids[ array_rand( $image_ids ) ], 'large' );
	if ( ! $src ) {
		return '';
	}
	return '<figure><img src="' . esc_url( $src ) . '" alt="" loading="lazy" /></figure>' . "\n";
};

/* -------------------------------------------------------------------------- *
 * Posts
 * -------------------------------------------------------------------------- */

$now      = time();
$two_year = 2 * YEAR_IN_SECONDS;
$created  = 0;

for ( $i = 0; $i < $count; $i++ ) {
	$title = rtrim( $sentences[ array_rand( $sentences ) ], '.' );

	$content  = '<h1>' . esc_html( ucfirst( $heading( 5 ) ) ) . "</h1>\n";
	$content .= '<p>' . $para( 3, 5 ) . "</p>\n";
	$content .= $figure();
	$content .= '<h2>' . esc_html( $heading( 3 ) ) . "</h2>\n";
	$content .= '<p><strong>' . $heading( 2 ) . '.</strong> ' . $para( 2, 4 ) . ' <em>' . $heading( 3 ) . '.</em></p>' . "\n";
	$content .= "<ul>\n\t<li>" . $heading( 4 ) . "</li>\n\t<li>" . $heading( 4 ) . "</li>\n\t<li>" . $heading( 4 ) . "</li>\n</ul>\n";
	$content .= '<blockquote><p>' . $sentences[ array_rand( $sentences ) ] . ".</p></blockquote>\n";
	$content .= '<h2>' . esc_html( $heading( 3 ) ) . "</h2>\n";
	$content .= '<p>' . $para( 3, 5 ) . "</p>\n";
	$content .= $figure();
	$content .= '<h3>' . esc_html( $heading( 2 ) ) . "</h3>\n";
	$content .= '<p>' . $para( 2, 4 ) . " <a href=\"#\">" . $heading( 2 ) . "</a>.</p>\n";

	$excerpt = $para( 1, 2 ); // plain text, no HTML

	$date_ts  = $now - wp_rand( 0, $two_year ); // always in the past
	$post_id  = wp_insert_post( [
		'post_title'    => ucfirst( $title ),
		'post_content'  => $content,
		'post_excerpt'  => $excerpt,
		'post_status'   => 'publish',
		'post_type'     => 'post',
		'post_author'   => 1,
		'post_date'     => date( 'Y-m-d H:i:s', $date_ts ),
		'post_date_gmt' => gmdate( 'Y-m-d H:i:s', $date_ts ),
	], true );

	if ( is_wp_error( $post_id ) ) {
		continue;
	}

	if ( $cat_ids ) {
		wp_set_object_terms( $post_id, $cat_ids[ array_rand( $cat_ids ) ], 'category' );
	}
	if ( $tag_ids ) {
		wp_set_object_terms( $post_id, $pick( $tag_ids, 2, 5 ), 'post_tag' );
	}
	if ( $author_ids ) {
		wp_set_object_terms( $post_id, $pick( $author_ids, 1, 3 ), '42wp_author' );
	}
	if ( $image_ids ) {
		set_post_thumbnail( $post_id, $image_ids[ array_rand( $image_ids ) ] );
	}

	$created++;
	if ( 0 === $created % 25 ) {
		WP_CLI::log( sprintf( '  %d/%d posts created...', $created, $count ) );
	}
}

WP_CLI::success( sprintf( 'Created %d demo posts.', $created ) );
