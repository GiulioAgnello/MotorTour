<?php
namespace MotorTour;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Admin UI custom per il backend WordPress.
 *
 * - Menu principale "MotorTour" con sottosezioni
 * - Dashboard iscrizioni con filtri per stato
 * - Metabox custom per Tour e Iscrizioni
 * - Azioni rapide: approva / rifiuta / metti in revisione
 * - Colonne custom nelle liste CPT
 */
class AdminUI {

    public function register_hooks(): void {
        add_action( 'admin_menu',            [ $this, 'register_menus' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_assets' ] );
        add_action( 'add_meta_boxes',        [ $this, 'register_metaboxes' ] );
        add_action( 'save_post_mt_tour',     [ $this, 'save_tour_meta' ], 10, 2 );

        // Azioni AJAX per approvazione/rifiuto
        add_action( 'wp_ajax_mt_approve_registration',      [ $this, 'ajax_approve' ] );
        add_action( 'wp_ajax_mt_reject_registration',       [ $this, 'ajax_reject' ] );
        add_action( 'wp_ajax_mt_review_registration',       [ $this, 'ajax_set_review' ] );

        // Colonne custom nelle liste
        add_filter( 'manage_mt_registration_posts_columns',       [ $this, 'registration_columns' ] );
        add_action( 'manage_mt_registration_posts_custom_column', [ $this, 'registration_column_content' ], 10, 2 );
        add_filter( 'manage_mt_tour_posts_columns',               [ $this, 'tour_columns' ] );
        add_action( 'manage_mt_tour_posts_custom_column',         [ $this, 'tour_column_content' ], 10, 2 );

        // Filtro per stato iscrizione
        add_action( 'restrict_manage_posts', [ $this, 'filter_registrations_by_status' ] );
        add_filter( 'parse_query',           [ $this, 'apply_status_filter' ] );

        // Ruolo custom motortour_member
        add_action( 'init', [ $this, 'register_custom_role' ] );
    }

    // ─── Menu ─────────────────────────────────────────────────────────────────

    public function register_menus(): void {
        add_menu_page(
            __( 'MotorTour', 'motortour' ),
            __( 'MotorTour', 'motortour' ),
            'manage_options',
            'motortour',
            [ $this, 'page_dashboard' ],
            'dashicons-palmtree',
            30
        );

        add_submenu_page( 'motortour', __( 'Dashboard', 'motortour' ),     __( 'Dashboard', 'motortour' ),    'manage_options', 'motortour',               [ $this, 'page_dashboard' ] );
        add_submenu_page( 'motortour', __( 'Iscrizioni', 'motortour' ),    __( 'Iscrizioni', 'motortour' ),   'manage_options', 'edit.php?post_type=mt_registration' );
        add_submenu_page( 'motortour', __( 'Tour', 'motortour' ),          __( 'Tour', 'motortour' ),         'manage_options', 'edit.php?post_type=mt_tour' );
        add_submenu_page( 'motortour', __( 'Tappe', 'motortour' ),         __( 'Tappe', 'motortour' ),        'manage_options', 'edit.php?post_type=mt_stage' );
        add_submenu_page( 'motortour', __( 'POI', 'motortour' ),           __( 'POI', 'motortour' ),          'manage_options', 'edit.php?post_type=mt_poi' );
        add_submenu_page( 'motortour', __( 'Impostazioni', 'motortour' ),  __( 'Impostazioni', 'motortour' ), 'manage_options', 'motortour-settings',        [ $this, 'page_settings' ] );
    }

    // ─── Dashboard ────────────────────────────────────────────────────────────

    public function page_dashboard(): void {
        $counts = $this->get_registration_counts();
        $recent = get_posts( [
            'post_type'      => 'mt_registration',
            'posts_per_page' => 10,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ] );
        ?>
        <div class="wrap mt-dashboard">
            <h1 class="mt-page-title">
                <span class="dashicons dashicons-palmtree"></span>
                MotorTour — Dashboard
            </h1>

            <div class="mt-stats-grid">
                <?php foreach ( [
                    [ 'pending',      '🕐', 'In attesa',     $counts['pending'] ],
                    [ 'under_review', '🔍', 'In revisione',  $counts['under_review'] ],
                    [ 'approved',     '✅', 'Approvate',     $counts['approved'] ],
                    [ 'rejected',     '❌', 'Rifiutate',     $counts['rejected'] ],
                ] as [ $status, $icon, $label, $count ] ) : ?>
                <div class="mt-stat-card mt-stat-<?php echo esc_attr( $status ); ?>">
                    <span class="mt-stat-icon"><?php echo $icon; ?></span>
                    <span class="mt-stat-count"><?php echo (int) $count; ?></span>
                    <span class="mt-stat-label"><?php echo esc_html( $label ); ?></span>
                    <a href="edit.php?post_type=mt_registration&mt_status=<?php echo esc_attr( $status ); ?>"
                       class="mt-stat-link">Vedi →</a>
                </div>
                <?php endforeach; ?>
            </div>

            <h2>Iscrizioni recenti</h2>
            <table class="wp-list-table widefat fixed striped mt-table">
                <thead>
                    <tr>
                        <th>Partecipante</th>
                        <th>Tour</th>
                        <th>Stato</th>
                        <th>Data invio</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ( $recent as $reg ) :
                    $meta       = get_post_meta( $reg->ID );
                    $status     = $meta['mt_reg_status'][0] ?? 'pending';
                    $tour_id    = (int) ( $meta['mt_reg_tour_id'][0] ?? 0 );
                    $tour       = $tour_id ? get_post( $tour_id ) : null;
                    $submitted  = $meta['mt_reg_submitted_at'][0] ?? '';
                    $name       = trim( ( $meta['mt_reg_pilot_first_name'][0] ?? '' ) . ' ' . ( $meta['mt_reg_pilot_last_name'][0] ?? '' ) );
                    $email      = $meta['mt_reg_email'][0] ?? '';
                    ?>
                    <tr>
                        <td>
                            <strong><?php echo esc_html( $name ); ?></strong><br>
                            <small><?php echo esc_html( $email ); ?></small>
                        </td>
                        <td><?php echo $tour ? esc_html( $tour->post_title ) : '–'; ?></td>
                        <td><?php echo $this->status_badge( $status ); ?></td>
                        <td><?php echo $submitted ? esc_html( wp_date( 'd/m/Y H:i', strtotime( $submitted ) ) ) : '–'; ?></td>
                        <td class="mt-actions">
                            <a href="<?php echo esc_url( get_edit_post_link( $reg->ID ) ); ?>" class="button button-small">
                                Dettagli
                            </a>
                            <?php if ( $status === 'pending' || $status === 'under_review' ) : ?>
                            <button class="button button-primary button-small mt-btn-approve"
                                    data-id="<?php echo $reg->ID; ?>"
                                    data-nonce="<?php echo wp_create_nonce( 'mt_admin_action' ); ?>">
                                ✅ Approva
                            </button>
                            <button class="button button-small mt-btn-reject"
                                    data-id="<?php echo $reg->ID; ?>"
                                    data-nonce="<?php echo wp_create_nonce( 'mt_admin_action' ); ?>">
                                ❌ Rifiuta
                            </button>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <!-- Modal rifiuto -->
        <div id="mt-reject-modal" style="display:none;">
            <div class="mt-modal-overlay">
                <div class="mt-modal">
                    <h3>Motivazione rifiuto</h3>
                    <textarea id="mt-reject-reason" rows="4" placeholder="Inserisci una motivazione da inviare all'utente..."></textarea>
                    <div class="mt-modal-actions">
                        <button id="mt-reject-confirm" class="button button-primary">Conferma rifiuto</button>
                        <button id="mt-reject-cancel" class="button">Annulla</button>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    // ─── Pagina impostazioni ──────────────────────────────────────────────────

    public function page_settings(): void {
        $active_tab = $_GET['tab'] ?? 'generale';

        // ── Salvataggio tab generale ──
        if ( isset( $_POST['mt_save_generale'] ) && check_admin_referer( 'mt_settings_generale' ) ) {
            update_option( 'mt_admin_email', sanitize_email( $_POST['mt_admin_email'] ?? '' ) );
            update_option( 'mt_from_name',   sanitize_text_field( $_POST['mt_from_name'] ?? '' ) );
            echo '<div class="notice notice-success"><p>Impostazioni generali salvate.</p></div>';
        }

        // ── Salvataggio tab landing ──
        if ( isset( $_POST['mt_save_landing'] ) && check_admin_referer( 'mt_settings_landing' ) ) {
            $landing_fields = [
                'mt_landing_title'       => 'sanitize_text_field',
                'mt_landing_subtitle'    => 'sanitize_text_field',
                'mt_landing_location'    => 'sanitize_text_field',
                'mt_landing_description' => 'sanitize_textarea_field',
                'mt_landing_p1_title'    => 'sanitize_text_field',
                'mt_landing_p1_text'     => 'sanitize_text_field',
                'mt_landing_p2_title'    => 'sanitize_text_field',
                'mt_landing_p2_text'     => 'sanitize_text_field',
                'mt_landing_p3_title'    => 'sanitize_text_field',
                'mt_landing_p3_text'     => 'sanitize_text_field',
                'mt_landing_step1'       => 'sanitize_text_field',
                'mt_landing_step2'       => 'sanitize_text_field',
                'mt_landing_step3'       => 'sanitize_text_field',
                'mt_landing_step4'       => 'sanitize_text_field',
                'mt_landing_email'       => 'sanitize_email',
                'mt_landing_instagram'   => 'esc_url_raw',
                'mt_landing_facebook'    => 'esc_url_raw',
                'mt_landing_logo_url'    => 'esc_url_raw',
            ];
            foreach ( $landing_fields as $key => $sanitizer ) {
                update_option( $key, $sanitizer( $_POST[ $key ] ?? '' ) );
            }
            echo '<div class="notice notice-success"><p>Testi della landing aggiornati! Le modifiche sono subito visibili sul portale.</p></div>';
        }

        $admin_email = get_option( 'mt_admin_email', get_option( 'admin_email' ) );
        $from_name   = get_option( 'mt_from_name', 'Motoclub Salentum Terrae A.S.D.' );
        $portal_url  = home_url( '/portale-tour' );
        ?>
        <div class="wrap">
            <h1>Impostazioni MotorTour</h1>

            <!-- Tab navigation -->
            <nav class="nav-tab-wrapper">
                <a href="?page=motortour-settings&tab=generale"
                   class="nav-tab <?php echo $active_tab === 'generale' ? 'nav-tab-active' : ''; ?>">
                    ⚙️ Generale
                </a>
                <a href="?page=motortour-settings&tab=landing"
                   class="nav-tab <?php echo $active_tab === 'landing' ? 'nav-tab-active' : ''; ?>">
                    🌐 Testi Landing
                </a>
            </nav>

            <?php if ( $active_tab === 'generale' ) : ?>
            <!-- ── TAB GENERALE ── -->
            <form method="post" style="margin-top: 20px;">
                <?php wp_nonce_field( 'mt_settings_generale' ); ?>
                <table class="form-table">
                    <tr>
                        <th><label for="mt_admin_email">Email notifiche admin</label></th>
                        <td>
                            <input type="email" id="mt_admin_email" name="mt_admin_email"
                                   value="<?php echo esc_attr( $admin_email ); ?>" class="regular-text">
                            <p class="description">L'email che riceve le notifiche di nuove iscrizioni.</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="mt_from_name">Nome mittente email</label></th>
                        <td>
                            <input type="text" id="mt_from_name" name="mt_from_name"
                                   value="<?php echo esc_attr( $from_name ); ?>" class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th>URL portale</th>
                        <td>
                            <a href="<?php echo esc_url( $portal_url ); ?>" target="_blank">
                                <?php echo esc_html( $portal_url ); ?> ↗
                            </a>
                        </td>
                    </tr>
                </table>
                <p class="submit">
                    <input type="submit" name="mt_save_generale" class="button button-primary" value="Salva impostazioni">
                </p>
            </form>

            <?php elseif ( $active_tab === 'landing' ) : ?>
            <!-- ── TAB LANDING ── -->
            <form method="post" style="margin-top: 20px;">
                <?php wp_nonce_field( 'mt_settings_landing' ); ?>

                <h2>Hero</h2>
                <table class="form-table">
                    <tr>
                        <th><label for="mt_landing_title">Titolo principale</label></th>
                        <td><input type="text" id="mt_landing_title" name="mt_landing_title"
                                   value="<?php echo esc_attr( get_option( 'mt_landing_title', 'Tour in moto nel Salento e oltre' ) ); ?>"
                                   class="large-text"></td>
                    </tr>
                    <tr>
                        <th><label for="mt_landing_subtitle">Sottotitolo</label></th>
                        <td><input type="text" id="mt_landing_subtitle" name="mt_landing_subtitle"
                                   value="<?php echo esc_attr( get_option( 'mt_landing_subtitle', 'Per amicizia e solidarietà' ) ); ?>"
                                   class="large-text"></td>
                    </tr>
                    <tr>
                        <th><label for="mt_landing_location">Riga location (sotto titolo)</label></th>
                        <td><input type="text" id="mt_landing_location" name="mt_landing_location"
                                   value="<?php echo esc_attr( get_option( 'mt_landing_location', 'A.S.D. · Lecce, Puglia' ) ); ?>"
                                   class="regular-text">
                            <p class="description">Es. "A.S.D. · Lecce, Puglia"</p></td>
                    </tr>
                    <tr>
                        <th><label for="mt_landing_logo_url">URL Logo</label></th>
                        <td><input type="url" id="mt_landing_logo_url" name="mt_landing_logo_url"
                                   value="<?php echo esc_attr( get_option( 'mt_landing_logo_url', '' ) ); ?>"
                                   class="large-text" placeholder="https://...">
                            <p class="description">Carica il logo dalla Libreria media e incolla qui l'URL.</p></td>
                    </tr>
                </table>

                <h2>Chi siamo</h2>
                <table class="form-table">
                    <tr>
                        <th><label for="mt_landing_description">Testo "Chi siamo"</label></th>
                        <td><textarea id="mt_landing_description" name="mt_landing_description"
                                      rows="4" class="large-text"><?php echo esc_textarea( get_option( 'mt_landing_description', '' ) ); ?></textarea></td>
                    </tr>
                </table>

                <h2>Le tre pillole (cosa facciamo)</h2>
                <table class="form-table">
                    <?php foreach ( [ 1, 2, 3 ] as $n ) : ?>
                    <tr>
                        <th>Pillola <?php echo $n; ?></th>
                        <td>
                            <input type="text" name="mt_landing_p<?php echo $n; ?>_title"
                                   value="<?php echo esc_attr( get_option( "mt_landing_p{$n}_title", '' ) ); ?>"
                                   class="regular-text" placeholder="Titolo" style="margin-bottom:6px; display:block;">
                            <input type="text" name="mt_landing_p<?php echo $n; ?>_text"
                                   value="<?php echo esc_attr( get_option( "mt_landing_p{$n}_text", '' ) ); ?>"
                                   class="large-text" placeholder="Testo descrittivo">
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </table>

                <h2>Come partecipare (4 step)</h2>
                <table class="form-table">
                    <?php foreach ( [ 1, 2, 3, 4 ] as $n ) : ?>
                    <tr>
                        <th><label>Step <?php echo $n; ?></label></th>
                        <td><input type="text" name="mt_landing_step<?php echo $n; ?>"
                                   value="<?php echo esc_attr( get_option( "mt_landing_step{$n}", '' ) ); ?>"
                                   class="large-text" placeholder="Testo step <?php echo $n; ?>"></td>
                    </tr>
                    <?php endforeach; ?>
                </table>

                <h2>Contatti e social</h2>
                <table class="form-table">
                    <tr>
                        <th><label for="mt_landing_email">Email pubblica</label></th>
                        <td><input type="email" id="mt_landing_email" name="mt_landing_email"
                                   value="<?php echo esc_attr( get_option( 'mt_landing_email', '' ) ); ?>"
                                   class="regular-text"></td>
                    </tr>
                    <tr>
                        <th><label for="mt_landing_instagram">Instagram URL</label></th>
                        <td><input type="url" id="mt_landing_instagram" name="mt_landing_instagram"
                                   value="<?php echo esc_attr( get_option( 'mt_landing_instagram', '' ) ); ?>"
                                   class="regular-text" placeholder="https://instagram.com/..."></td>
                    </tr>
                    <tr>
                        <th><label for="mt_landing_facebook">Facebook URL</label></th>
                        <td><input type="url" id="mt_landing_facebook" name="mt_landing_facebook"
                                   value="<?php echo esc_attr( get_option( 'mt_landing_facebook', '' ) ); ?>"
                                   class="regular-text" placeholder="https://facebook.com/..."></td>
                    </tr>
                </table>

                <p class="submit">
                    <input type="submit" name="mt_save_landing" class="button button-primary" value="Salva testi landing">
                </p>
            </form>
            <?php endif; ?>

        </div>
        <?php
    }

    // ─── Metabox Tour ─────────────────────────────────────────────────────────

    public function register_metaboxes(): void {
        add_meta_box( 'mt_tour_details', '📋 Dettagli Tour', [ $this, 'metabox_tour_details' ], 'mt_tour', 'normal', 'high' );
        add_meta_box( 'mt_tour_identity', '🎨 Identità Visiva', [ $this, 'metabox_tour_identity' ], 'mt_tour', 'side', 'default' );
        add_meta_box( 'mt_registration_details', '👤 Dati Iscrizione', [ $this, 'metabox_registration_details' ], 'mt_registration', 'normal', 'high' );
        add_meta_box( 'mt_registration_actions', '⚙️ Azioni', [ $this, 'metabox_registration_actions' ], 'mt_registration', 'side', 'high' );
    }

    public function metabox_tour_details( \WP_Post $post ): void {
        wp_nonce_field( 'mt_tour_meta', 'mt_tour_nonce' );
        $m = function( $key ) use ( $post ) { return esc_attr( get_post_meta( $post->ID, $key, true ) ); };
        ?>
        <div class="mt-metabox-grid">
            <div class="mt-field">
                <label>📅 Data evento</label>
                <input type="date" name="mt_tour_date" value="<?php echo $m('mt_tour_date'); ?>">
            </div>
            <div class="mt-field">
                <label>🕐 Orario raduno</label>
                <input type="time" name="mt_tour_time_start" value="<?php echo $m('mt_tour_time_start'); ?>">
            </div>
            <div class="mt-field">
                <label>📍 Punto di raduno</label>
                <input type="text" name="mt_tour_meeting_point" value="<?php echo $m('mt_tour_meeting_point'); ?>" placeholder="es. Bar Commercio – Lecce">
            </div>
            <div class="mt-field">
                <label>🗓️ Scadenza iscrizioni</label>
                <input type="date" name="mt_tour_deadline" value="<?php echo $m('mt_tour_deadline'); ?>">
            </div>
            <div class="mt-field">
                <label>👥 Max partecipanti</label>
                <input type="number" name="mt_tour_max_participants" value="<?php echo $m('mt_tour_max_participants'); ?>" min="0">
            </div>
            <div class="mt-field">
                <label>🍽️ Tipologia pranzo</label>
                <input type="text" name="mt_tour_lunch_type" value="<?php echo $m('mt_tour_lunch_type'); ?>" placeholder="es. al sacco condiviso">
            </div>
            <div class="mt-field mt-field-full">
                <label>📊 Stato tour</label>
                <select name="mt_tour_status">
                    <?php foreach ( [ 'draft' => 'Bozza', 'open' => 'Iscrizioni aperte', 'closed' => 'Iscrizioni chiuse', 'archived' => 'Archiviato' ] as $val => $lbl ) : ?>
                    <option value="<?php echo $val; ?>" <?php selected( get_post_meta( $post->ID, 'mt_tour_status', true ), $val ); ?>>
                        <?php echo esc_html( $lbl ); ?>
                    </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="mt-field mt-field-full">
                <label>
                    <input type="checkbox" name="mt_tour_charity" value="1" <?php checked( get_post_meta( $post->ID, 'mt_tour_charity', true ), '1' ); ?>>
                    Tour benefico (collegato a ONLUS)
                </label>
            </div>
            <div class="mt-field mt-field-full">
                <label>🤝 Nome ONLUS</label>
                <input type="text" name="mt_tour_onlus_name" value="<?php echo $m('mt_tour_onlus_name'); ?>" placeholder="es. Associazione XYZ ONLUS">
            </div>
        </div>
        <?php
    }

    public function metabox_tour_identity( \WP_Post $post ): void {
        $primary   = esc_attr( get_post_meta( $post->ID, 'mt_tour_color_primary', true ) ?: '#6c3de8' );
        $secondary = esc_attr( get_post_meta( $post->ID, 'mt_tour_color_secondary', true ) ?: '#1a1a2e' );
        ?>
        <div class="mt-metabox-grid">
            <div class="mt-field">
                <label>🎨 Colore primario</label>
                <input type="color" name="mt_tour_color_primary" value="<?php echo $primary; ?>">
            </div>
            <div class="mt-field">
                <label>🎨 Colore secondario</label>
                <input type="color" name="mt_tour_color_secondary" value="<?php echo $secondary; ?>">
            </div>
        </div>
        <p><small>Logo e banner si caricano dal campo "Immagine in evidenza" e da un campo media dedicato.</small></p>
        <?php
    }

    public function metabox_registration_details( \WP_Post $post ): void {
        $meta = get_post_meta( $post->ID );
        $get  = fn( $key ) => esc_html( $meta[ $key ][0] ?? '–' );
        $tour = get_post( (int) ( $meta['mt_reg_tour_id'][0] ?? 0 ) );
        ?>
        <div class="mt-reg-details">
            <div class="mt-reg-section">
                <h4>🏍️ Tour</h4>
                <p><?php echo $tour ? esc_html( $tour->post_title ) : '–'; ?></p>
            </div>

            <div class="mt-reg-section">
                <h4>👤 Pilota</h4>
                <table class="mt-detail-table">
                    <tr><td>Nome completo</td><td><?php echo $get('mt_reg_pilot_first_name') . ' ' . $get('mt_reg_pilot_last_name'); ?></td></tr>
                    <tr><td>Nato a / il</td><td><?php echo $get('mt_reg_pilot_birth_place') . ' – ' . $get('mt_reg_pilot_birth_date'); ?></td></tr>
                    <tr><td>Residenza</td><td><?php echo $get('mt_reg_pilot_address') . ', ' . $get('mt_reg_pilot_city') . ' ' . $get('mt_reg_pilot_zip'); ?></td></tr>
                    <tr><td>Cellulare</td><td><?php echo $get('mt_reg_pilot_phone'); ?></td></tr>
                    <tr><td>Email</td><td><?php echo $get('mt_reg_email'); ?></td></tr>
                </table>
            </div>

            <div class="mt-reg-section">
                <h4>🏍️ Moto</h4>
                <table class="mt-detail-table">
                    <tr><td>Modello</td><td><?php echo $get('mt_reg_moto_model'); ?></td></tr>
                    <tr><td>Targa</td><td><?php echo $get('mt_reg_moto_plate'); ?></td></tr>
                </table>
            </div>

            <?php if ( ! empty( $meta['mt_reg_has_passenger'][0] ) ) : ?>
            <div class="mt-reg-section">
                <h4>👥 Passeggero</h4>
                <table class="mt-detail-table">
                    <tr><td>Nome</td><td><?php echo $get('mt_reg_pass_full_name'); ?></td></tr>
                    <tr><td>Nato a / il</td><td><?php echo $get('mt_reg_pass_birth_place') . ' – ' . $get('mt_reg_pass_birth_date'); ?></td></tr>
                    <tr><td>Cellulare</td><td><?php echo $get('mt_reg_pass_phone'); ?></td></tr>
                </table>
            </div>
            <?php endif; ?>

            <div class="mt-reg-section">
                <h4>📄 Documenti</h4>
                <?php
                $license_id = (int) ( $meta['mt_reg_doc_license_id'][0] ?? 0 );
                $extra_id   = (int) ( $meta['mt_reg_doc_extra_id'][0] ?? 0 );
                if ( $license_id ) {
                    $url = wp_get_attachment_url( $license_id );
                    echo "<p><a href='" . esc_url( $url ) . "' target='_blank' class='button button-small'>📎 Visualizza Patente</a></p>";
                }
                if ( $extra_id ) {
                    $url = wp_get_attachment_url( $extra_id );
                    echo "<p><a href='" . esc_url( $url ) . "' target='_blank' class='button button-small'>📎 Visualizza Allegato extra</a></p>";
                }
                if ( ! $license_id && ! $extra_id ) echo '<p><em>Nessun documento allegato.</em></p>';
                ?>
            </div>

            <div class="mt-reg-section">
                <h4>✅ Consensi</h4>
                <p>Liberatoria: <?php echo ! empty( $meta['mt_reg_consent_waiver'][0] ) ? '✅ ' . esc_html( $meta['mt_reg_consent_waiver_at'][0] ?? '' ) : '❌'; ?></p>
                <p>Privacy: <?php echo ! empty( $meta['mt_reg_consent_privacy'][0] ) ? '✅ ' . esc_html( $meta['mt_reg_consent_privacy_at'][0] ?? '' ) : '❌'; ?></p>
            </div>
        </div>
        <?php
    }

    public function metabox_registration_actions( \WP_Post $post ): void {
        $status = get_post_meta( $post->ID, 'mt_reg_status', true ) ?: 'pending';
        $nonce  = wp_create_nonce( 'mt_admin_action' );
        echo $this->status_badge( $status );
        echo '<br><br>';
        if ( in_array( $status, [ 'pending', 'under_review' ] ) ) {
            echo "<button class='button button-primary mt-btn-approve' data-id='{$post->ID}' data-nonce='{$nonce}' style='width:100%;margin-bottom:8px'>✅ Approva iscrizione</button>";
            echo "<button class='button mt-btn-reject' data-id='{$post->ID}' data-nonce='{$nonce}' style='width:100%'>❌ Rifiuta iscrizione</button>";
        }
        if ( $status === 'pending' ) {
            echo "<br><button class='button mt-btn-review' data-id='{$post->ID}' data-nonce='{$nonce}' style='width:100%;margin-top:8px'>🔍 Segna in revisione</button>";
        }
        if ( $status === 'rejected' ) {
            $reason = esc_html( get_post_meta( $post->ID, 'mt_reg_reject_reason', true ) );
            if ( $reason ) echo "<p><strong>Motivazione:</strong><br>{$reason}</p>";
        }
    }

    // ─── Save metabox tour ────────────────────────────────────────────────────

    public function save_tour_meta( int $post_id, \WP_Post $post ): void {
        if ( ! isset( $_POST['mt_tour_nonce'] ) || ! wp_verify_nonce( $_POST['mt_tour_nonce'], 'mt_tour_meta' ) ) return;
        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
        if ( ! current_user_can( 'edit_post', $post_id ) ) return;

        $text_fields = [ 'mt_tour_date', 'mt_tour_time_start', 'mt_tour_meeting_point', 'mt_tour_deadline', 'mt_tour_status', 'mt_tour_lunch_type', 'mt_tour_onlus_name', 'mt_tour_color_primary', 'mt_tour_color_secondary' ];
        foreach ( $text_fields as $field ) {
            if ( isset( $_POST[ $field ] ) ) {
                update_post_meta( $post_id, $field, sanitize_text_field( $_POST[ $field ] ) );
            }
        }
        update_post_meta( $post_id, 'mt_tour_max_participants', absint( $_POST['mt_tour_max_participants'] ?? 0 ) );
        update_post_meta( $post_id, 'mt_tour_charity', isset( $_POST['mt_tour_charity'] ) ? '1' : '0' );
    }

    // ─── AJAX actions ─────────────────────────────────────────────────────────

    public function ajax_approve(): void {
        check_ajax_referer( 'mt_admin_action', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Non autorizzato', 403 );
        $reg_id = absint( $_POST['reg_id'] ?? 0 );
        ( new Registration() )->approve( $reg_id );
        wp_send_json_success( [ 'message' => 'Iscrizione approvata.' ] );
    }

    public function ajax_reject(): void {
        check_ajax_referer( 'mt_admin_action', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Non autorizzato', 403 );
        $reg_id = absint( $_POST['reg_id'] ?? 0 );
        $reason = sanitize_textarea_field( $_POST['reason'] ?? '' );
        ( new Registration() )->reject( $reg_id, $reason );
        wp_send_json_success( [ 'message' => 'Iscrizione rifiutata.' ] );
    }

    public function ajax_set_review(): void {
        check_ajax_referer( 'mt_admin_action', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Non autorizzato', 403 );
        $reg_id = absint( $_POST['reg_id'] ?? 0 );
        ( new Registration() )->set_under_review( $reg_id );
        wp_send_json_success( [ 'message' => 'Iscrizione segnata in revisione.' ] );
    }

    // ─── Colonne custom ───────────────────────────────────────────────────────

    public function registration_columns( array $cols ): array {
        return [
            'cb'         => $cols['cb'],
            'mt_pilot'   => 'Partecipante',
            'mt_tour'    => 'Tour',
            'mt_status'  => 'Stato',
            'mt_docs'    => 'Docs',
            'mt_submitted' => 'Data invio',
            'mt_actions' => 'Azioni rapide',
        ];
    }

    public function registration_column_content( string $col, int $post_id ): void {
        $meta = get_post_meta( $post_id );
        switch ( $col ) {
            case 'mt_pilot':
                $name  = trim( ( $meta['mt_reg_pilot_first_name'][0] ?? '' ) . ' ' . ( $meta['mt_reg_pilot_last_name'][0] ?? '' ) );
                $email = $meta['mt_reg_email'][0] ?? '';
                echo '<strong>' . esc_html( $name ) . '</strong><br><small>' . esc_html( $email ) . '</small>';
                break;
            case 'mt_tour':
                $tour = get_post( (int) ( $meta['mt_reg_tour_id'][0] ?? 0 ) );
                echo $tour ? esc_html( $tour->post_title ) : '–';
                break;
            case 'mt_status':
                echo $this->status_badge( $meta['mt_reg_status'][0] ?? 'pending' );
                break;
            case 'mt_docs':
                $has_license = ! empty( $meta['mt_reg_doc_license_id'][0] );
                $has_extra   = ! empty( $meta['mt_reg_doc_extra_id'][0] );
                echo $has_license ? '<span title="Patente allegata">📄</span> ' : '<span title="Patente mancante" style="opacity:.3">📄</span> ';
                echo $has_extra   ? '<span title="Allegato extra">📎</span>' : '';
                break;
            case 'mt_submitted':
                $raw = $meta['mt_reg_submitted_at'][0] ?? '';
                echo $raw ? esc_html( wp_date( 'd/m/Y', strtotime( $raw ) ) ) : '–';
                break;
            case 'mt_actions':
                $status = $meta['mt_reg_status'][0] ?? 'pending';
                $nonce  = wp_create_nonce( 'mt_admin_action' );
                if ( in_array( $status, [ 'pending', 'under_review' ] ) ) {
                    echo "<button class='button button-small mt-btn-approve' data-id='{$post_id}' data-nonce='{$nonce}'>✅</button> ";
                    echo "<button class='button button-small mt-btn-reject'  data-id='{$post_id}' data-nonce='{$nonce}'>❌</button>";
                }
                break;
        }
    }

    public function tour_columns( array $cols ): array {
        return [
            'cb'          => $cols['cb'],
            'title'       => 'Titolo',
            'mt_date'     => 'Data',
            'mt_status'   => 'Stato',
            'mt_reg_count'=> 'Iscritti',
            'date'        => $cols['date'],
        ];
    }

    public function tour_column_content( string $col, int $post_id ): void {
        switch ( $col ) {
            case 'mt_date':
                $d = get_post_meta( $post_id, 'mt_tour_date', true );
                echo $d ? esc_html( wp_date( 'd/m/Y', strtotime( $d ) ) ) : '–';
                break;
            case 'mt_status':
                $map = [ 'draft' => '⚪ Bozza', 'open' => '🟢 Aperto', 'closed' => '🔴 Chiuso', 'archived' => '⬛ Archiviato' ];
                $s   = get_post_meta( $post_id, 'mt_tour_status', true );
                echo esc_html( $map[ $s ] ?? $s );
                break;
            case 'mt_reg_count':
                $count = count( get_posts( [
                    'post_type' => 'mt_registration', 'posts_per_page' => -1,
                    'meta_query' => [ [ 'key' => 'mt_reg_tour_id', 'value' => $post_id ] ],
                ] ) );
                echo (int) $count;
                break;
        }
    }

    // ─── Filtro per stato ────────────────────────────────────────────────────

    public function filter_registrations_by_status(): void {
        if ( get_current_screen()->post_type !== 'mt_registration' ) return;
        $current = $_GET['mt_status'] ?? '';
        echo '<select name="mt_status">';
        echo '<option value="">Tutti gli stati</option>';
        foreach ( [ 'pending' => 'In attesa', 'under_review' => 'In revisione', 'approved' => 'Approvate', 'rejected' => 'Rifiutate' ] as $val => $lbl ) {
            printf( '<option value="%s" %s>%s</option>', esc_attr( $val ), selected( $current, $val, false ), esc_html( $lbl ) );
        }
        echo '</select>';
    }

    public function apply_status_filter( \WP_Query $query ): void {
        if ( ! is_admin() || $query->get( 'post_type' ) !== 'mt_registration' || empty( $_GET['mt_status'] ) ) return;
        $query->set( 'meta_query', [ [ 'key' => 'mt_reg_status', 'value' => sanitize_text_field( $_GET['mt_status'] ) ] ] );
    }

    // ─── Ruolo custom ─────────────────────────────────────────────────────────

    public function register_custom_role(): void {
        if ( ! get_role( 'motortour_member' ) ) {
            add_role( 'motortour_member', __( 'Membro MotorTour', 'motortour' ), [
                'read' => true,
            ] );
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function status_badge( string $status ): string {
        $map = [
            'pending'      => [ '🕐 In attesa',    '#f0ad4e', '#fff' ],
            'under_review' => [ '🔍 In revisione',  '#5bc0de', '#fff' ],
            'approved'     => [ '✅ Approvata',     '#5cb85c', '#fff' ],
            'rejected'     => [ '❌ Rifiutata',     '#d9534f', '#fff' ],
        ];
        [ $label, $bg, $color ] = $map[ $status ] ?? [ $status, '#ccc', '#333' ];
        return sprintf(
            '<span style="background:%s;color:%s;padding:3px 8px;border-radius:12px;font-size:12px;font-weight:600;">%s</span>',
            $bg, $color, esc_html( $label )
        );
    }

    private function get_registration_counts(): array {
        $counts = [ 'pending' => 0, 'under_review' => 0, 'approved' => 0, 'rejected' => 0 ];
        foreach ( array_keys( $counts ) as $status ) {
            $counts[ $status ] = count( get_posts( [
                'post_type'      => 'mt_registration',
                'posts_per_page' => -1,
                'meta_query'     => [ [ 'key' => 'mt_reg_status', 'value' => $status ] ],
            ] ) );
        }
        return $counts;
    }

    // ─── Assets ──────────────────────────────────────────────────────────────

    public function enqueue_admin_assets( string $hook ): void {
        // Carica solo sulle pagine del plugin
        $screen = get_current_screen();
        if ( ! $screen ) return;
        if ( ! in_array( $screen->post_type, [ 'mt_tour', 'mt_registration', 'mt_stage', 'mt_poi' ] )
             && $screen->id !== 'toplevel_page_motortour' ) return;

        wp_enqueue_style(
            'mt-admin',
            MT_PLUGIN_URL . 'assets/admin.css',
            [],
            MT_VERSION
        );

        wp_enqueue_script(
            'mt-admin',
            MT_PLUGIN_URL . 'assets/admin.js',
            [ 'jquery' ],
            MT_VERSION,
            true
        );

        wp_localize_script( 'mt-admin', 'mtAdmin', [
            'ajaxUrl' => admin_url( 'admin-ajax.php' ),
            'nonce'   => wp_create_nonce( 'mt_admin_action' ),
        ] );
    }
}
