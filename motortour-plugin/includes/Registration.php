<?php
namespace MotorTour;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Gestisce la logica di iscrizione:
 *  - Validazione e sanitizzazione dei dati in arrivo
 *  - Upload sicuro dei documenti
 *  - Creazione del CPT mt_registration
 *  - Transizione degli stati
 *  - Creazione utente WP al momento dell'approvazione
 */
class Registration {

    public function register_hooks(): void {
        // Quando un admin approva/rifiuta dal backend, crea l'utente WP
        add_action( 'mt_registration_approved', [ $this, 'create_wp_user' ] );
    }

    // ─── Submission (chiamato da RestAPI) ─────────────────────────────────────

    public function handle_submission( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {

        // 1. Validazione campi obbligatori
        $validation = $this->validate( $request );
        if ( is_wp_error( $validation ) ) return $validation;

        // 2. Sanitizza tutti i dati
        $data = $this->sanitize( $request );

        // 3. Controlla email duplicata
        if ( get_user_by( 'email', $data['email'] ) ) {
            return new \WP_Error( 'mt_email_exists', __( 'Email già registrata. Usa il login.', 'motortour' ), [ 'status' => 409 ] );
        }
        $existing = get_posts( [
            'post_type'  => 'mt_registration',
            'meta_query' => [ [ 'key' => 'mt_reg_email', 'value' => $data['email'] ] ],
        ] );
        if ( $existing ) {
            return new \WP_Error( 'mt_email_exists', __( 'Hai già una iscrizione in corso con questa email.', 'motortour' ), [ 'status' => 409 ] );
        }

        // 4. Verifica tour se fornito (opzionale nell'iscrizione base)
        $tour = $data['tour_id'] ? get_post( $data['tour_id'] ) : null;
        if ( $data['tour_id'] && ( ! $tour || $tour->post_type !== 'mt_tour' ) ) {
            return new \WP_Error( 'mt_invalid_tour', __( 'Tour non valido.', 'motortour' ), [ 'status' => 400 ] );
        }

        // 5. Upload documenti
        $license_id = $this->upload_document( $request->get_file_params(), 'license_file', $data['email'] );
        if ( is_wp_error( $license_id ) ) return $license_id;

        $extra_id = 0;
        $files    = $request->get_file_params();
        if ( ! empty( $files['extra_file'] ) && $files['extra_file']['size'] > 0 ) {
            $extra_id = $this->upload_document( $files, 'extra_file', $data['email'] );
            if ( is_wp_error( $extra_id ) ) return $extra_id;
        }

        // 6. Crea il CPT mt_registration
        $reg_title = sanitize_text_field( $data['pilot_last_name'] . ' ' . $data['pilot_first_name'] );
        if ( $tour ) {
            $reg_title .= ' – ' . $tour->post_title;
        }
        $reg_id = wp_insert_post( [
            'post_type'   => 'mt_registration',
            'post_title'  => $reg_title,
            'post_status' => 'publish',
        ] );

        if ( is_wp_error( $reg_id ) ) {
            return new \WP_Error( 'mt_save_error', __( 'Errore nel salvataggio. Riprova.', 'motortour' ), [ 'status' => 500 ] );
        }

        // 7. Salva tutti i meta
        $now = current_time( 'c' ); // ISO 8601

        update_post_meta( $reg_id, 'mt_reg_tour_id',            $data['tour_id'] );
        update_post_meta( $reg_id, 'mt_reg_user_id',            0 ); // verrà settato all'approvazione
        update_post_meta( $reg_id, 'mt_reg_status',             'pending' );
        update_post_meta( $reg_id, 'mt_reg_submitted_at',       $now );

        // Account
        update_post_meta( $reg_id, 'mt_reg_email',              $data['email'] );
        update_post_meta( $reg_id, 'mt_reg_password_hash',      wp_hash_password( $data['password'] ) );

        // Pilota
        update_post_meta( $reg_id, 'mt_reg_pilot_first_name',   $data['pilot_first_name'] );
        update_post_meta( $reg_id, 'mt_reg_pilot_last_name',    $data['pilot_last_name'] );
        update_post_meta( $reg_id, 'mt_reg_pilot_birth_place',  $data['pilot_birth_place'] );
        update_post_meta( $reg_id, 'mt_reg_pilot_birth_date',   $data['pilot_birth_date'] );
        update_post_meta( $reg_id, 'mt_reg_pilot_city',         $data['pilot_city'] );
        update_post_meta( $reg_id, 'mt_reg_pilot_address',      $data['pilot_address'] );
        update_post_meta( $reg_id, 'mt_reg_pilot_zip',          $data['pilot_zip'] );
        update_post_meta( $reg_id, 'mt_reg_pilot_phone',        $data['pilot_phone'] );

        // Documenti
        update_post_meta( $reg_id, 'mt_reg_doc_license_id',     $license_id );
        update_post_meta( $reg_id, 'mt_reg_doc_extra_id',       $extra_id );

        // Consensi
        update_post_meta( $reg_id, 'mt_reg_consent_waiver',     true );
        update_post_meta( $reg_id, 'mt_reg_consent_waiver_at',  $now );
        update_post_meta( $reg_id, 'mt_reg_consent_privacy',    true );
        update_post_meta( $reg_id, 'mt_reg_consent_privacy_at', $now );

        // 8. Notifiche email
        do_action( 'mt_registration_submitted', $reg_id );

        return new \WP_REST_Response( [
            'success'         => true,
            'registration_id' => $reg_id,
            'message'         => __( 'Iscrizione inviata! Riceverai una email di conferma a breve.', 'motortour' ),
        ], 201 );
    }

    // ─── Transizioni di stato ─────────────────────────────────────────────────

    /**
     * Metti l'iscrizione in "sotto revisione" (chiamato dall'admin).
     */
    public function set_under_review( int $reg_id ): void {
        update_post_meta( $reg_id, 'mt_reg_status', 'under_review' );
        update_post_meta( $reg_id, 'mt_reg_reviewed_at', current_time( 'c' ) );
        do_action( 'mt_registration_under_review', $reg_id );
    }

    /**
     * Approva l'iscrizione. Crea l'utente WP e invia email.
     */
    public function approve( int $reg_id ): void {
        update_post_meta( $reg_id, 'mt_reg_status', 'approved' );
        update_post_meta( $reg_id, 'mt_reg_approved_at', current_time( 'c' ) );
        do_action( 'mt_registration_approved', $reg_id );
    }

    /**
     * Rifiuta l'iscrizione con una motivazione.
     */
    public function reject( int $reg_id, string $reason ): void {
        update_post_meta( $reg_id, 'mt_reg_status', 'rejected' );
        update_post_meta( $reg_id, 'mt_reg_reject_reason', sanitize_textarea_field( $reason ) );
        do_action( 'mt_registration_rejected', $reg_id );
    }

    // ─── Creazione utente WP all'approvazione ─────────────────────────────────

    public function create_wp_user( int $reg_id ): void {
        // Evita di creare l'utente due volte
        $existing_uid = (int) get_post_meta( $reg_id, 'mt_reg_user_id', true );
        if ( $existing_uid > 0 ) return;

        $email      = get_post_meta( $reg_id, 'mt_reg_email', true );
        $first_name = get_post_meta( $reg_id, 'mt_reg_pilot_first_name', true );
        $last_name  = get_post_meta( $reg_id, 'mt_reg_pilot_last_name', true );
        $pass_hash  = get_post_meta( $reg_id, 'mt_reg_password_hash', true );

        // Crea utente con password temporanea (verrà overridden con l'hash)
        $user_id = wp_insert_user( [
            'user_login'   => sanitize_user( $email ),
            'user_email'   => $email,
            'user_pass'    => wp_generate_password(), // placeholder
            'first_name'   => $first_name,
            'last_name'    => $last_name,
            'display_name' => "$first_name $last_name",
            'role'         => 'motortour_member',
        ] );

        if ( is_wp_error( $user_id ) ) return;

        // Aggiorna con l'hash della password originale
        global $wpdb;
        $wpdb->update( $wpdb->users, [ 'user_pass' => $pass_hash ], [ 'ID' => $user_id ] );
        wp_cache_delete( $user_id, 'users' );

        // Collega utente all'iscrizione
        update_post_meta( $reg_id, 'mt_reg_user_id', $user_id );
        update_user_meta( $user_id, 'mt_registration_id', $reg_id );
    }

    // ─── Upload documenti ─────────────────────────────────────────────────────

    private function upload_document( array $files, string $key, string $email ): int|\WP_Error {
        if ( empty( $files[ $key ] ) || $files[ $key ]['error'] !== UPLOAD_ERR_OK ) {
            if ( $key === 'license_file' ) {
                return new \WP_Error( 'mt_missing_license', __( 'Patente obbligatoria.', 'motortour' ), [ 'status' => 400 ] );
            }
            return 0;
        }

        $file = $files[ $key ];

        // Whitelist MIME types
        $allowed = [ 'image/jpeg', 'image/png', 'image/webp', 'application/pdf' ];
        $finfo   = new \finfo( FILEINFO_MIME_TYPE );
        $mime    = $finfo->file( $file['tmp_name'] );
        if ( ! in_array( $mime, $allowed, true ) ) {
            return new \WP_Error( 'mt_invalid_file', __( 'Formato file non supportato. Usa JPG, PNG o PDF.', 'motortour' ), [ 'status' => 400 ] );
        }

        // Limite 10 MB
        if ( $file['size'] > 10 * MB_IN_BYTES ) {
            return new \WP_Error( 'mt_file_too_large', __( 'File troppo grande. Massimo 10 MB.', 'motortour' ), [ 'status' => 400 ] );
        }

        // Usa la media library di WP per gestire il file
        if ( ! function_exists( 'media_handle_sideload' ) ) {
            require_once ABSPATH . 'wp-admin/includes/image.php';
            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/media.php';
        }

        // Rinomina il file con email+timestamp per evitare collisioni
        $ext                  = pathinfo( $file['name'], PATHINFO_EXTENSION );
        $file['name']         = sanitize_file_name( $email . '_' . $key . '_' . time() . '.' . $ext );

        $attachment_id = media_handle_sideload( $file, 0 );
        if ( is_wp_error( $attachment_id ) ) {
            return new \WP_Error( 'mt_upload_error', __( 'Errore nel caricamento del file.', 'motortour' ), [ 'status' => 500 ] );
        }

        // Rendi il file accessibile solo agli admin (nessun URL pubblico diretto)
        update_post_meta( $attachment_id, 'mt_private_doc', true );

        return $attachment_id;
    }

    // ─── Validazione ─────────────────────────────────────────────────────────

    private function validate( \WP_REST_Request $request ): true|\WP_Error {
        // tour_id è opzionale: l'iscrizione base è al club, non a un tour specifico.
        // Moto e passeggero vengono forniti alla richiesta di ogni tour (mt_tour_enrollment).
        $required = [
            'email'             => 'Email',
            'password'          => 'Password',
            'pilot_first_name'  => 'Nome pilota',
            'pilot_last_name'   => 'Cognome pilota',
            'pilot_birth_place' => 'Luogo di nascita',
            'pilot_birth_date'  => 'Data di nascita',
            'pilot_city'        => 'Comune di residenza',
            'pilot_address'     => 'Indirizzo',
            'pilot_zip'         => 'CAP',
            'pilot_phone'       => 'Cellulare',
            'consent_waiver'    => 'Liberatoria',
            'consent_privacy'   => 'Privacy',
        ];

        foreach ( $required as $field => $label ) {
            $value = $request->get_param( $field );
            if ( $value === null || $value === '' || $value === false ) {
                return new \WP_Error(
                    'mt_missing_field',
                    sprintf( __( 'Campo obbligatorio mancante: %s', 'motortour' ), $label ),
                    [ 'status' => 400 ]
                );
            }
        }

        if ( ! is_email( $request->get_param( 'email' ) ) ) {
            return new \WP_Error( 'mt_invalid_email', __( 'Email non valida.', 'motortour' ), [ 'status' => 400 ] );
        }

        if ( strlen( $request->get_param( 'password' ) ) < 8 ) {
            return new \WP_Error( 'mt_weak_password', __( 'La password deve essere di almeno 8 caratteri.', 'motortour' ), [ 'status' => 400 ] );
        }

        // Verifica consensi espliciti
        if ( $request->get_param( 'consent_waiver' ) != '1' && $request->get_param( 'consent_waiver' ) !== true ) {
            return new \WP_Error( 'mt_missing_consent', __( 'Devi accettare la liberatoria.', 'motortour' ), [ 'status' => 400 ] );
        }
        if ( $request->get_param( 'consent_privacy' ) != '1' && $request->get_param( 'consent_privacy' ) !== true ) {
            return new \WP_Error( 'mt_missing_consent', __( 'Devi accettare la privacy.', 'motortour' ), [ 'status' => 400 ] );
        }

        return true;
    }

    // ─── Sanitizzazione ──────────────────────────────────────────────────────

    private function sanitize( \WP_REST_Request $request ): array {
        return [
            'tour_id'           => absint( $request->get_param( 'tour_id' ) ?? 0 ), // opzionale
            'email'             => sanitize_email( $request->get_param( 'email' ) ),
            'password'          => $request->get_param( 'password' ), // raw, sarà hashata
            'pilot_first_name'  => sanitize_text_field( $request->get_param( 'pilot_first_name' ) ),
            'pilot_last_name'   => sanitize_text_field( $request->get_param( 'pilot_last_name' ) ),
            'pilot_birth_place' => sanitize_text_field( $request->get_param( 'pilot_birth_place' ) ),
            'pilot_birth_date'  => sanitize_text_field( $request->get_param( 'pilot_birth_date' ) ),
            'pilot_city'        => sanitize_text_field( $request->get_param( 'pilot_city' ) ),
            'pilot_address'     => sanitize_text_field( $request->get_param( 'pilot_address' ) ),
            'pilot_zip'         => sanitize_text_field( $request->get_param( 'pilot_zip' ) ),
            'pilot_phone'       => sanitize_text_field( $request->get_param( 'pilot_phone' ) ),
        ];
    }
}
