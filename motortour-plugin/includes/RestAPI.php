<?php
namespace MotorTour;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Registra gli endpoint REST API del plugin.
 *
 * Namespace:  motortour/v1
 *
 * Endpoint pubblici:
 *   GET  /tours                   → lista tour aperti
 *   GET  /tours/{id}              → dettaglio tour (pubblico: titolo, data, banner)
 *   POST /register                → nuova iscrizione (+ upload documenti)
 *   POST /auth/login              → login utente registrato
 *   POST /auth/logout             → logout
 *
 * Endpoint autenticati (JWT token o cookie WP):
 *   GET  /my/registration         → stato iscrizione dell'utente loggato
 *   GET  /my/tour                 → dati completi del tour a cui è iscritto
 */
class RestAPI {

    const NAMESPACE = 'motortour/v1';

    public function register_hooks(): void {
        add_action( 'rest_api_init', [ $this, 'register_routes' ] );
    }

    public function register_routes(): void {

        // ── Tour (pubblici) ─────────────────────────────────────────────────
        register_rest_route( self::NAMESPACE, '/tours', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_tours' ],
            'permission_callback' => '__return_true',
        ] );

        register_rest_route( self::NAMESPACE, '/tours/(?P<id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_tour' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'id' => [
                    'validate_callback' => fn( $v ) => is_numeric( $v ),
                    'sanitize_callback' => 'absint',
                ],
            ],
        ] );

        // ── Iscrizione (pubblica) ────────────────────────────────────────────
        register_rest_route( self::NAMESPACE, '/register', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'submit_registration' ],
            'permission_callback' => '__return_true',
        ] );

        // ── Auth ─────────────────────────────────────────────────────────────
        register_rest_route( self::NAMESPACE, '/auth/login', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'login' ],
            'permission_callback' => '__return_true',
        ] );

        register_rest_route( self::NAMESPACE, '/auth/logout', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'logout' ],
            'permission_callback' => '__return_true',
        ] );

        // ── Area utente (richiede autenticazione) ────────────────────────────
        register_rest_route( self::NAMESPACE, '/my/registration', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_my_registration' ],
            'permission_callback' => [ $this, 'require_auth' ],
        ] );

        register_rest_route( self::NAMESPACE, '/my/tour', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_my_tour' ],
            'permission_callback' => [ $this, 'require_auth_and_approved' ],
        ] );
    }

    // ─── Permission callbacks ─────────────────────────────────────────────────

    public function require_auth( \WP_REST_Request $request ): bool|\WP_Error {
        $user_id = $this->get_user_from_token( $request );
        if ( ! $user_id ) {
            return new \WP_Error( 'mt_unauthorized', __( 'Autenticazione richiesta.', 'motortour' ), [ 'status' => 401 ] );
        }
        return true;
    }

    public function require_auth_and_approved( \WP_REST_Request $request ): bool|\WP_Error {
        $auth = $this->require_auth( $request );
        if ( is_wp_error( $auth ) ) return $auth;

        $user_id = $this->get_user_from_token( $request );
        $reg     = $this->find_registration_by_user( $user_id );
        if ( ! $reg || get_post_meta( $reg->ID, 'mt_reg_status', true ) !== 'approved' ) {
            return new \WP_Error( 'mt_not_approved', __( 'Iscrizione non ancora approvata.', 'motortour' ), [ 'status' => 403 ] );
        }
        return true;
    }

    // ─── Handlers pubblici ────────────────────────────────────────────────────

    public function get_tours( \WP_REST_Request $request ): \WP_REST_Response {
        $args = [
            'post_type'      => 'mt_tour',
            'post_status'    => 'publish',
            'posts_per_page' => 20,
            'meta_query'     => [
                [
                    'key'     => 'mt_tour_status',
                    'value'   => [ 'open', 'closed' ],
                    'compare' => 'IN',
                ],
            ],
            'orderby'  => 'meta_value',
            'meta_key' => 'mt_tour_date',
            'order'    => 'ASC',
        ];

        $tours = get_posts( $args );
        $data  = array_map( [ $this, 'format_tour_summary' ], $tours );

        return new \WP_REST_Response( $data, 200 );
    }

    public function get_tour( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
        $id   = $request->get_param( 'id' );
        $post = get_post( $id );

        if ( ! $post || $post->post_type !== 'mt_tour' ) {
            return new \WP_Error( 'mt_not_found', __( 'Tour non trovato.', 'motortour' ), [ 'status' => 404 ] );
        }

        return new \WP_REST_Response( $this->format_tour_detail( $post ), 200 );
    }

    public function submit_registration( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
        // Delegate alla classe Registration per mantenere il codice pulito
        $registration = new Registration();
        return $registration->handle_submission( $request );
    }

    public function login( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
        $email    = sanitize_email( $request->get_param( 'email' ) ?? '' );
        $password = $request->get_param( 'password' ) ?? '';

        if ( ! $email || ! $password ) {
            return new \WP_Error( 'mt_missing_fields', __( 'Email e password obbligatorie.', 'motortour' ), [ 'status' => 400 ] );
        }

        $user = get_user_by( 'email', $email );
        if ( ! $user || ! wp_check_password( $password, $user->user_pass, $user->ID ) ) {
            return new \WP_Error( 'mt_invalid_credentials', __( 'Credenziali non valide.', 'motortour' ), [ 'status' => 401 ] );
        }

        // Verifica che l'utente abbia il ruolo motortour_member
        if ( ! in_array( 'motortour_member', (array) $user->roles ) && ! user_can( $user, 'manage_options' ) ) {
            return new \WP_Error( 'mt_not_approved', __( 'Account non ancora approvato.', 'motortour' ), [ 'status' => 403 ] );
        }

        // Genera token JWT semplice (HMAC-SHA256)
        $token = $this->generate_token( $user->ID );

        return new \WP_REST_Response( [
            'token'    => $token,
            'user_id'  => $user->ID,
            'name'     => $user->display_name,
            'email'    => $user->user_email,
        ], 200 );
    }

    public function logout( \WP_REST_Request $request ): \WP_REST_Response {
        // Con JWT stateless non c'è molto da fare server-side.
        // Il frontend elimina il token dal proprio storage.
        return new \WP_REST_Response( [ 'message' => 'Logout effettuato.' ], 200 );
    }

    // ─── Handlers autenticati ─────────────────────────────────────────────────

    public function get_my_registration( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
        $user_id = $this->get_user_from_token( $request );
        $reg     = $this->find_registration_by_user( $user_id );

        if ( ! $reg ) {
            return new \WP_Error( 'mt_not_found', __( 'Nessuna iscrizione trovata.', 'motortour' ), [ 'status' => 404 ] );
        }

        $status = get_post_meta( $reg->ID, 'mt_reg_status', true );
        $tour   = get_post( get_post_meta( $reg->ID, 'mt_reg_tour_id', true ) );

        return new \WP_REST_Response( [
            'registration_id' => $reg->ID,
            'status'          => $status,
            'submitted_at'    => get_post_meta( $reg->ID, 'mt_reg_submitted_at', true ),
            'reviewed_at'     => get_post_meta( $reg->ID, 'mt_reg_reviewed_at', true ),
            'approved_at'     => get_post_meta( $reg->ID, 'mt_reg_approved_at', true ),
            'reject_reason'   => get_post_meta( $reg->ID, 'mt_reg_reject_reason', true ),
            'tour'            => $tour ? $this->format_tour_summary( $tour ) : null,
        ], 200 );
    }

    public function get_my_tour( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
        $user_id = $this->get_user_from_token( $request );
        $reg     = $this->find_registration_by_user( $user_id );
        $tour_id = (int) get_post_meta( $reg->ID, 'mt_reg_tour_id', true );
        $tour    = get_post( $tour_id );

        if ( ! $tour ) {
            return new \WP_Error( 'mt_not_found', __( 'Tour non trovato.', 'motortour' ), [ 'status' => 404 ] );
        }

        // Tappe
        $stages = get_posts( [
            'post_type'      => 'mt_stage',
            'posts_per_page' => -1,
            'meta_key'       => 'mt_stage_tour_id',
            'meta_value'     => $tour_id,
            'orderby'        => 'meta_value_num',
            'meta_query'     => [ [ 'key' => 'mt_stage_order', 'type' => 'NUMERIC' ] ],
            'order'          => 'ASC',
        ] );

        $stages_data = array_map( function( $stage ) {
            $meta = get_post_meta( $stage->ID );
            $pois = get_posts( [
                'post_type'      => 'mt_poi',
                'posts_per_page' => -1,
                'meta_query'     => [ [ 'key' => 'mt_poi_stage_id', 'value' => $stage->ID ] ],
            ] );
            return [
                'id'       => $stage->ID,
                'name'     => $stage->post_title,
                'content'  => apply_filters( 'the_content', $stage->post_content ),
                'order'    => (int) ( $meta['mt_stage_order'][0] ?? 0 ),
                'time'     => $meta['mt_stage_time'][0] ?? '',
                'location' => $meta['mt_stage_location'][0] ?? '',
                'address'  => $meta['mt_stage_address'][0] ?? '',
                'lat'      => (float) ( $meta['mt_stage_lat'][0] ?? 0 ),
                'lng'      => (float) ( $meta['mt_stage_lng'][0] ?? 0 ),
                'notes'    => $meta['mt_stage_notes'][0] ?? '',
                'pois'     => array_map( [ $this, 'format_poi' ], $pois ),
            ];
        }, $stages );

        $tour_detail          = $this->format_tour_detail( $tour );
        $tour_detail['stages'] = $stages_data;

        return new \WP_REST_Response( $tour_detail, 200 );
    }

    // ─── Helpers formatters ───────────────────────────────────────────────────

    private function format_tour_summary( \WP_Post $tour ): array {
        $logo_id   = (int) get_post_meta( $tour->ID, 'mt_tour_logo_id', true );
        $banner_id = (int) get_post_meta( $tour->ID, 'mt_tour_banner_id', true );
        return [
            'id'               => $tour->ID,
            'title'            => $tour->post_title,
            'date'             => get_post_meta( $tour->ID, 'mt_tour_date', true ),
            'time_start'       => get_post_meta( $tour->ID, 'mt_tour_time_start', true ),
            'meeting_point'    => get_post_meta( $tour->ID, 'mt_tour_meeting_point', true ),
            'status'           => get_post_meta( $tour->ID, 'mt_tour_status', true ),
            'deadline'         => get_post_meta( $tour->ID, 'mt_tour_deadline', true ),
            'max_participants' => (int) get_post_meta( $tour->ID, 'mt_tour_max_participants', true ),
            'color_primary'    => get_post_meta( $tour->ID, 'mt_tour_color_primary', true ),
            'color_secondary'  => get_post_meta( $tour->ID, 'mt_tour_color_secondary', true ),
            'logo_url'         => $logo_id ? wp_get_attachment_url( $logo_id ) : null,
            'banner_url'       => $banner_id ? wp_get_attachment_url( $banner_id ) : null,
            'charity'          => (bool) get_post_meta( $tour->ID, 'mt_tour_charity', true ),
            'onlus_name'       => get_post_meta( $tour->ID, 'mt_tour_onlus_name', true ),
        ];
    }

    private function format_tour_detail( \WP_Post $tour ): array {
        $summary          = $this->format_tour_summary( $tour );
        $summary['rules'] = get_post_meta( $tour->ID, 'mt_tour_rules', true );
        $summary['description'] = apply_filters( 'the_content', $tour->post_content );
        $summary['lunch_type']  = get_post_meta( $tour->ID, 'mt_tour_lunch_type', true );
        return $summary;
    }

    private function format_poi( \WP_Post $poi ): array {
        $meta = get_post_meta( $poi->ID );
        $thumbnail = get_the_post_thumbnail_url( $poi->ID, 'medium' );
        return [
            'id'      => $poi->ID,
            'name'    => $poi->post_title,
            'content' => apply_filters( 'the_content', $poi->post_content ),
            'type'    => $meta['mt_poi_type'][0] ?? 'altro',
            'address' => $meta['mt_poi_address'][0] ?? '',
            'lat'     => (float) ( $meta['mt_poi_lat'][0] ?? 0 ),
            'lng'     => (float) ( $meta['mt_poi_lng'][0] ?? 0 ),
            'phone'   => $meta['mt_poi_phone'][0] ?? '',
            'website' => $meta['mt_poi_website'][0] ?? '',
            'notes'   => $meta['mt_poi_notes'][0] ?? '',
            'image'   => $thumbnail ?: null,
        ];
    }

    // ─── JWT helpers ─────────────────────────────────────────────────────────

    /**
     * Genera un token JWT HS256 semplice.
     * In produzione considerare una libreria dedicata (firebase/php-jwt).
     */
    public function generate_token( int $user_id ): string {
        $secret  = $this->get_secret();
        $header  = $this->base64url_encode( json_encode( [ 'alg' => 'HS256', 'typ' => 'JWT' ] ) );
        $payload = $this->base64url_encode( json_encode( [
            'sub' => $user_id,
            'iat' => time(),
            'exp' => time() + ( 7 * DAY_IN_SECONDS ), // 7 giorni
        ] ) );
        $sig = $this->base64url_encode( hash_hmac( 'sha256', "$header.$payload", $secret, true ) );
        return "$header.$payload.$sig";
    }

    public function get_user_from_token( \WP_REST_Request $request ): int {
        $auth = $request->get_header( 'Authorization' );
        if ( ! $auth || ! str_starts_with( $auth, 'Bearer ' ) ) return 0;

        $token  = substr( $auth, 7 );
        $parts  = explode( '.', $token );
        if ( count( $parts ) !== 3 ) return 0;

        [ $header, $payload, $sig ] = $parts;
        $secret   = $this->get_secret();
        $expected = $this->base64url_encode( hash_hmac( 'sha256', "$header.$payload", $secret, true ) );

        if ( ! hash_equals( $expected, $sig ) ) return 0;

        $data = json_decode( $this->base64url_decode( $payload ), true );
        if ( ! $data || $data['exp'] < time() ) return 0;

        return (int) $data['sub'];
    }

    private function get_secret(): string {
        return defined( 'MT_JWT_SECRET' ) ? MT_JWT_SECRET : wp_salt( 'auth' );
    }

    private function base64url_encode( string $data ): string {
        return rtrim( strtr( base64_encode( $data ), '+/', '-_' ), '=' );
    }

    private function base64url_decode( string $data ): string {
        return base64_decode( strtr( $data, '-_', '+/' ) );
    }

    // ─── Utility ─────────────────────────────────────────────────────────────

    private function find_registration_by_user( int $user_id ): ?\WP_Post {
        $posts = get_posts( [
            'post_type'      => 'mt_registration',
            'posts_per_page' => 1,
            'meta_query'     => [ [ 'key' => 'mt_reg_user_id', 'value' => $user_id ] ],
        ] );
        return $posts[0] ?? null;
    }
}
