<?php
namespace MotorTour;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Registra tutti i Custom Post Types e i loro meta fields.
 *
 * CPT registrati:
 *  - mt_tour        → Tour / Evento
 *  - mt_registration → Iscrizione utente
 *  - mt_stage       → Tappa del tour
 *  - mt_poi         → Punto di interesse
 */
class PostTypes {

    public function register_hooks(): void {
        add_action( 'init', [ $this, 'register_post_types' ] );
        add_action( 'init', [ $this, 'register_meta_fields' ] );
    }

    // ─── Registrazione CPT ───────────────────────────────────────────────────

    public function register_post_types(): void {
        $this->register_tour();
        $this->register_registration();
        $this->register_stage();
        $this->register_poi();
    }

    private function register_tour(): void {
        register_post_type( 'mt_tour', [
            'labels' => [
                'name'               => __( 'Tour', 'motortour' ),
                'singular_name'      => __( 'Tour', 'motortour' ),
                'add_new'            => __( 'Aggiungi Tour', 'motortour' ),
                'add_new_item'       => __( 'Nuovo Tour', 'motortour' ),
                'edit_item'          => __( 'Modifica Tour', 'motortour' ),
                'view_item'          => __( 'Visualizza Tour', 'motortour' ),
                'all_items'          => __( 'Tutti i Tour', 'motortour' ),
                'search_items'       => __( 'Cerca Tour', 'motortour' ),
            ],
            'public'              => false,
            'show_ui'             => true,
            'show_in_menu'        => false, // lo mostriamo nel menu custom
            'show_in_rest'        => true,
            'supports'            => [ 'title', 'editor', 'thumbnail' ],
            'menu_icon'           => 'dashicons-palmtree',
            'capability_type'     => 'post',
            'has_archive'         => false,
            'rewrite'             => false,
        ] );
    }

    private function register_registration(): void {
        register_post_type( 'mt_registration', [
            'labels' => [
                'name'               => __( 'Iscrizioni', 'motortour' ),
                'singular_name'      => __( 'Iscrizione', 'motortour' ),
                'add_new_item'       => __( 'Nuova Iscrizione', 'motortour' ),
                'edit_item'          => __( 'Gestisci Iscrizione', 'motortour' ),
                'all_items'          => __( 'Tutte le Iscrizioni', 'motortour' ),
            ],
            'public'              => false,
            'show_ui'             => true,
            'show_in_menu'        => false,
            'show_in_rest'        => false, // gestiamo noi gli endpoint
            'supports'            => [ 'title' ],
            'capability_type'     => 'post',
            'has_archive'         => false,
            'rewrite'             => false,
        ] );
    }

    private function register_stage(): void {
        register_post_type( 'mt_stage', [
            'labels' => [
                'name'               => __( 'Tappe', 'motortour' ),
                'singular_name'      => __( 'Tappa', 'motortour' ),
                'add_new_item'       => __( 'Nuova Tappa', 'motortour' ),
                'edit_item'          => __( 'Modifica Tappa', 'motortour' ),
                'all_items'          => __( 'Tutte le Tappe', 'motortour' ),
            ],
            'public'              => false,
            'show_ui'             => true,
            'show_in_menu'        => false,
            'show_in_rest'        => true,
            'supports'            => [ 'title', 'editor' ],
            'capability_type'     => 'post',
            'has_archive'         => false,
            'rewrite'             => false,
        ] );
    }

    private function register_poi(): void {
        register_post_type( 'mt_poi', [
            'labels' => [
                'name'               => __( 'Punti di Interesse', 'motortour' ),
                'singular_name'      => __( 'POI', 'motortour' ),
                'add_new_item'       => __( 'Nuovo POI', 'motortour' ),
                'edit_item'          => __( 'Modifica POI', 'motortour' ),
                'all_items'          => __( 'Tutti i POI', 'motortour' ),
            ],
            'public'              => false,
            'show_ui'             => true,
            'show_in_menu'        => false,
            'show_in_rest'        => true,
            'supports'            => [ 'title', 'editor', 'thumbnail' ],
            'capability_type'     => 'post',
            'has_archive'         => false,
            'rewrite'             => false,
        ] );
    }

    // ─── Meta fields (register_meta per REST API) ────────────────────────────

    public function register_meta_fields(): void {
        $this->register_tour_meta();
        $this->register_registration_meta();
        $this->register_stage_meta();
        $this->register_poi_meta();
    }

    private function register_tour_meta(): void {
        $fields = [
            // Logistica
            'mt_tour_date'              => 'string',  // es. "2026-06-07"
            'mt_tour_time_start'        => 'string',  // es. "08:00"
            'mt_tour_meeting_point'     => 'string',  // Luogo di raduno
            'mt_tour_meeting_address'   => 'string',
            'mt_tour_max_participants'  => 'integer',
            'mt_tour_deadline'          => 'string',  // scadenza iscrizioni
            'mt_tour_status'            => 'string',  // draft | open | closed | archived
            // Identità visiva
            'mt_tour_color_primary'     => 'string',  // es. "#e63946"
            'mt_tour_color_secondary'   => 'string',
            'mt_tour_logo_id'           => 'integer', // attachment ID
            'mt_tour_banner_id'         => 'integer',
            // Info aggiuntive
            'mt_tour_charity'           => 'boolean', // è un tour benefico?
            'mt_tour_onlus_name'        => 'string',
            'mt_tour_rules'             => 'string',  // testo regole (HTML)
            'mt_tour_lunch_type'        => 'string',  // es. "al sacco condiviso"
        ];

        foreach ( $fields as $key => $type ) {
            register_post_meta( 'mt_tour', $key, [
                'type'         => $type,
                'single'       => true,
                'show_in_rest' => true,
                'default'      => $type === 'integer' ? 0 : ( $type === 'boolean' ? false : '' ),
            ] );
        }
    }

    private function register_registration_meta(): void {
        $fields = [
            // Collegamento
            'mt_reg_tour_id'            => 'integer',
            'mt_reg_user_id'            => 'integer', // WP user ID (0 se non ancora creato)
            'mt_reg_status'             => 'string',  // pending|under_review|approved|rejected
            'mt_reg_reject_reason'      => 'string',

            // Account (temporaneo fino ad approvazione)
            'mt_reg_email'              => 'string',
            'mt_reg_password_hash'      => 'string',  // hash bcrypt, poi migrato su WP user

            // Dati Pilota
            'mt_reg_pilot_first_name'   => 'string',
            'mt_reg_pilot_last_name'    => 'string',
            'mt_reg_pilot_birth_place'  => 'string',
            'mt_reg_pilot_birth_date'   => 'string',
            'mt_reg_pilot_city'         => 'string',
            'mt_reg_pilot_address'      => 'string',
            'mt_reg_pilot_zip'          => 'string',
            'mt_reg_pilot_phone'        => 'string',

            // Moto
            'mt_reg_moto_model'         => 'string',
            'mt_reg_moto_plate'         => 'string',

            // Passeggero (opzionale)
            'mt_reg_has_passenger'      => 'boolean',
            'mt_reg_pass_full_name'     => 'string',
            'mt_reg_pass_birth_place'   => 'string',
            'mt_reg_pass_birth_date'    => 'string',
            'mt_reg_pass_city'          => 'string',
            'mt_reg_pass_address'       => 'string',
            'mt_reg_pass_phone'         => 'string',

            // Documenti (attachment IDs)
            'mt_reg_doc_license_id'     => 'integer', // patente
            'mt_reg_doc_extra_id'       => 'integer', // allegato aggiuntivo opzionale

            // Consensi
            'mt_reg_consent_waiver'     => 'boolean',
            'mt_reg_consent_waiver_at'  => 'string',  // ISO datetime
            'mt_reg_consent_privacy'    => 'boolean',
            'mt_reg_consent_privacy_at' => 'string',

            // Timestamps
            'mt_reg_submitted_at'       => 'string',
            'mt_reg_reviewed_at'        => 'string',
            'mt_reg_approved_at'        => 'string',
        ];

        foreach ( $fields as $key => $type ) {
            register_post_meta( 'mt_registration', $key, [
                'type'         => $type,
                'single'       => true,
                'show_in_rest' => false, // non esponiamo via REST direttamente
                'default'      => $type === 'integer' ? 0 : ( $type === 'boolean' ? false : '' ),
            ] );
        }
    }

    private function register_stage_meta(): void {
        $fields = [
            'mt_stage_tour_id'    => 'integer',
            'mt_stage_order'      => 'integer',   // posizione nell'itinerario
            'mt_stage_time'       => 'string',    // orario previsto
            'mt_stage_location'   => 'string',    // nome luogo
            'mt_stage_address'    => 'string',
            'mt_stage_lat'        => 'number',
            'mt_stage_lng'        => 'number',
            'mt_stage_notes'      => 'string',
        ];

        foreach ( $fields as $key => $type ) {
            register_post_meta( 'mt_stage', $key, [
                'type'         => $type,
                'single'       => true,
                'show_in_rest' => true,
                'default'      => $type === 'integer' ? 0 : ( $type === 'number' ? 0.0 : '' ),
            ] );
        }
    }

    private function register_poi_meta(): void {
        $fields = [
            'mt_poi_tour_id'   => 'integer',
            'mt_poi_stage_id'  => 'integer',
            'mt_poi_type'      => 'string',   // ristorante|monumento|natura|carburante|altro
            'mt_poi_address'   => 'string',
            'mt_poi_lat'       => 'number',
            'mt_poi_lng'       => 'number',
            'mt_poi_phone'     => 'string',
            'mt_poi_website'   => 'string',
            'mt_poi_notes'     => 'string',
        ];

        foreach ( $fields as $key => $type ) {
            register_post_meta( 'mt_poi', $key, [
                'type'         => $type,
                'single'       => true,
                'show_in_rest' => true,
                'default'      => $type === 'integer' ? 0 : ( $type === 'number' ? 0.0 : '' ),
            ] );
        }
    }
}
