<?php
/**
 * Plugin Name:       MotorTour
 * Plugin URI:        https://motoclubsalentumterrae.it
 * Description:       Portale iscrizioni tour motociclistici – Motoclub Salentum Terrae A.S.D.
 * Version:           1.0.0
 * Author:            Motoclub Salentum Terrae
 * Author URI:        https://motoclubsalentumterrae.it
 * Text Domain:       motortour
 * Domain Path:       /languages
 * Requires at least: 6.0
 * Requires PHP:      8.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// ─── Costanti ────────────────────────────────────────────────────────────────
define( 'MT_VERSION',     '1.0.0' );
define( 'MT_PLUGIN_FILE', __FILE__ );
define( 'MT_PLUGIN_DIR',  plugin_dir_path( __FILE__ ) );
define( 'MT_PLUGIN_URL',  plugin_dir_url( __FILE__ ) );
define( 'MT_PLUGIN_BASE', plugin_basename( __FILE__ ) );

// ─── Autoload classi ─────────────────────────────────────────────────────────
spl_autoload_register( function ( string $class ) {
    $prefix = 'MotorTour\\';
    if ( strncmp( $prefix, $class, strlen( $prefix ) ) !== 0 ) {
        return;
    }
    $relative = str_replace( '\\', DIRECTORY_SEPARATOR, substr( $class, strlen( $prefix ) ) );
    $file     = MT_PLUGIN_DIR . 'includes/' . $relative . '.php';
    if ( file_exists( $file ) ) {
        require_once $file;
    }
} );

// ─── Bootstrap ───────────────────────────────────────────────────────────────
/**
 * Punto di ingresso principale del plugin.
 * Tutte le classi vengono istanziate qui in modo da avere un singolo posto
 * dove capire cosa gira e in quale ordine.
 */
function motortour_boot(): void {

    // Registrazione CPT e tassonomie
    $post_types = new MotorTour\PostTypes();
    $post_types->register_hooks();

    // REST API
    $api = new MotorTour\RestAPI();
    $api->register_hooks();

    // Logica iscrizioni (upload, stati, credenziali)
    $registration = new MotorTour\Registration();
    $registration->register_hooks();

    // Email notifiche
    $email = new MotorTour\Email();
    $email->register_hooks();

    // Admin UI custom (solo in bacheca)
    if ( is_admin() ) {
        $admin = new MotorTour\AdminUI();
        $admin->register_hooks();
    }

    // Enqueue frontend (React bundle + shortcode)
    $frontend = new MotorTour\Frontend();
    $frontend->register_hooks();
}
add_action( 'plugins_loaded', 'motortour_boot' );

// ─── Attivazione / Disattivazione ────────────────────────────────────────────
register_activation_hook( __FILE__, 'motortour_activate' );
function motortour_activate(): void {
    // Crea le tabelle aggiuntive se servono (per ora basta flush rewrite)
    motortour_boot();
    flush_rewrite_rules();

    // Crea la pagina "Portale" con lo shortcode se non esiste già
    $page = get_page_by_path( 'portale-tour' );
    if ( ! $page ) {
        wp_insert_post( [
            'post_title'   => 'Portale Tour',
            'post_name'    => 'portale-tour',
            'post_content' => '[motortour_app]',
            'post_status'  => 'publish',
            'post_type'    => 'page',
        ] );
    }
}

register_deactivation_hook( __FILE__, 'motortour_deactivate' );
function motortour_deactivate(): void {
    flush_rewrite_rules();
}
