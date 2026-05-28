<?php
namespace MotorTour;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Gestisce l'integrazione del frontend React con WordPress.
 *
 * Modalità FULL-PAGE SPA:
 *  - Intercetta la richiesta per la pagina portale via template_redirect
 *  - Bypassa completamente il tema WP (nessun header/footer/sidebar)
 *  - Serve un documento HTML minimale con solo il bundle React
 *  - I dati WP (config, testi landing, user) arrivano via window.mtConfig
 */
class Frontend {

    /** Slug della pagina portale creata all'attivazione del plugin */
    const PORTAL_SLUG = 'portale-tour';

    public function register_hooks(): void {
        add_action( 'template_redirect', [ $this, 'maybe_render_spa' ] );
        // Shortcode di fallback per chi vuole embedarlo manualmente
        add_shortcode( 'motortour_app', [ $this, 'shortcode_app' ] );
    }

    // ─── Full-page SPA takeover ───────────────────────────────────────────────

    public function maybe_render_spa(): void {
        // Attiva solo sulla pagina portale o su qualunque pagina con lo shortcode
        if ( ! $this->is_portal_page() ) {
            return;
        }
        $this->render_spa_page();
        exit;
    }

    private function is_portal_page(): bool {
        global $post;
        if ( ! $post ) return false;

        // Pagina con slug specifico
        if ( $post->post_name === self::PORTAL_SLUG ) return true;

        // Qualunque pagina WP che contiene lo shortcode [motortour_app]
        if ( has_shortcode( $post->post_content, 'motortour_app' ) ) return true;

        return false;
    }

    private function render_spa_page(): void {
        $config     = $this->get_frontend_config();
        $config_json = wp_json_encode( $config );

        $css_url = MT_PLUGIN_URL . 'assets/frontend/index.css';
        $js_url  = MT_PLUGIN_URL . 'assets/frontend/index.js';
        $version = MT_VERSION;

        $site_name = get_bloginfo( 'name' ) ?: 'Motoclub Salentum Terrae A.S.D.';
        $lang      = substr( get_locale(), 0, 2 );

        // Favicon (usa quello del plugin se presente, altrimenti WP)
        $favicon_url = file_exists( MT_PLUGIN_DIR . 'assets/favicon.ico' )
            ? MT_PLUGIN_URL . 'assets/favicon.ico'
            : get_site_icon_url( 32 );

        header( 'Content-Type: text/html; charset=UTF-8' );
        // Disabilita caching in sviluppo locale
        if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
            header( 'Cache-Control: no-store' );
        }

        echo '<!DOCTYPE html>';
        echo '<html lang="' . esc_attr( $lang ) . '">';
        echo '<head>';
        echo '<meta charset="UTF-8">';
        echo '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">';
        echo '<meta name="theme-color" content="#1a1a2e">';
        echo '<title>' . esc_html( $site_name ) . '</title>';

        if ( $favicon_url ) {
            echo '<link rel="icon" href="' . esc_url( $favicon_url ) . '">';
        }

        // CSS del bundle React
        if ( file_exists( MT_PLUGIN_DIR . 'assets/frontend/index.css' ) ) {
            echo '<link rel="stylesheet" href="' . esc_url( $css_url ) . '?v=' . esc_attr( $version ) . '">';
        }

        // Reset base — garantisce che nessun browser style interferisca
        echo '<style>
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0;height:100%;overflow-x:hidden}
body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
#motortour-app{min-height:100vh}
</style>';

        echo '</head>';
        echo '<body>';
        echo '<div id="motortour-app"></div>';

        // Configurazione passata a React
        echo '<script>window.mtConfig=' . $config_json . ';</script>';

        // Bundle React (in fondo per non bloccare il rendering)
        echo '<script src="' . esc_url( $js_url ) . '?v=' . esc_attr( $version ) . '" defer></script>';

        echo '</body>';
        echo '</html>';
    }

    // ─── Shortcode di fallback ────────────────────────────────────────────────

    public function shortcode_app( array $atts = [] ): string {
        return '<div id="motortour-app" class="motortour-app-root"></div>';
    }

    // ─── Configurazione per React ─────────────────────────────────────────────

    /**
     * Tutti i dati che React riceve da WordPress all'avvio.
     * Accessibili come window.mtConfig in JavaScript.
     */
    public function get_frontend_config(): array {
        $user_id   = get_current_user_id();
        $user_data = null;

        if ( $user_id ) {
            $wp_user = get_userdata( $user_id );
            $reg_id  = (int) get_user_meta( $user_id, 'mt_registration_id', true );
            $user_data = [
                'id'              => $user_id,
                'name'            => $wp_user->display_name,
                'email'           => $wp_user->user_email,
                'registration_id' => $reg_id ?: null,
                'is_approved'     => in_array( 'motortour_member', (array) $wp_user->roles ),
            ];
        }

        return [
            // API & auth
            'apiUrl'     => rest_url( RestAPI::NAMESPACE ),
            'nonce'      => wp_create_nonce( 'wp_rest' ),
            'siteUrl'    => home_url(),
            'pluginUrl'  => MT_PLUGIN_URL,

            // Utente loggato (null se non loggato)
            'user'       => $user_data,
            'isLoggedIn' => (bool) $user_id,

            // Testi della landing page (gestibili dal backend WP)
            'landing'    => $this->get_landing_config(),
        ];
    }

    /**
     * Testi e impostazioni della landing page.
     * Vengono letti dalle WP options — modificabili da MotorTour → Impostazioni → Landing.
     */
    private function get_landing_config(): array {
        return [
            'title'       => get_option( 'mt_landing_title',       'Tour in moto nel Salento e oltre' ),
            'subtitle'    => get_option( 'mt_landing_subtitle',     'Per amicizia e solidarietà' ),
            'location'    => get_option( 'mt_landing_location',     'A.S.D. · Lecce, Puglia' ),
            'description' => get_option( 'mt_landing_description',  'Siamo un\'associazione sportiva dilettantistica di motociclisti del Salento. Organizziamo tour ed eventi per condividere la passione per la moto, creare comunità e supportare cause benefiche insieme a ONLUS del territorio.' ),
            'pillar_1_title' => get_option( 'mt_landing_p1_title', 'Tour guidati' ),
            'pillar_1_text'  => get_option( 'mt_landing_p1_text',  'Itinerari curati nel Salento e in tutta Italia' ),
            'pillar_2_title' => get_option( 'mt_landing_p2_title', 'Beneficenza' ),
            'pillar_2_text'  => get_option( 'mt_landing_p2_text',  'Alcuni tour raccolgono fondi per ONLUS partner' ),
            'pillar_3_title' => get_option( 'mt_landing_p3_title', 'Comunità' ),
            'pillar_3_text'  => get_option( 'mt_landing_p3_text',  'Una famiglia di motociclisti, aperti a tutti' ),
            'how_title'   => get_option( 'mt_landing_how_title',   'Come partecipare' ),
            'steps'       => [
                get_option( 'mt_landing_step1', 'Scegli un tour — vedi quelli aperti e clicca Iscriviti' ),
                get_option( 'mt_landing_step2', 'Compila il form — dati personali, moto e carica la patente' ),
                get_option( 'mt_landing_step3', 'Attendi l\'approvazione — lo staff verifica e ti conferma via email' ),
                get_option( 'mt_landing_step4', 'Accedi all\'area riservata — itinerario, tappe e POI tutti lì' ),
            ],
            'email'       => get_option( 'mt_landing_email',       'motoclubsalentumterrae@gmail.com' ),
            'instagram'   => get_option( 'mt_landing_instagram',   '' ),
            'facebook'    => get_option( 'mt_landing_facebook',    '' ),
            'logo_url'    => get_option( 'mt_landing_logo_url',    '' ),
        ];
    }
}
