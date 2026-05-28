<?php
namespace MotorTour;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Gestisce tutte le notifiche email del plugin.
 *
 * Email inviate:
 *  - mt_registration_submitted   → Ricevuta iscrizione (utente + admin)
 *  - mt_registration_under_review → In revisione (utente)
 *  - mt_registration_approved    → Approvata (utente)
 *  - mt_registration_rejected    → Rifiutata (utente)
 */
class Email {

    public function register_hooks(): void {
        add_action( 'mt_registration_submitted',    [ $this, 'on_submitted' ] );
        add_action( 'mt_registration_under_review', [ $this, 'on_under_review' ] );
        add_action( 'mt_registration_approved',     [ $this, 'on_approved' ] );
        add_action( 'mt_registration_rejected',     [ $this, 'on_rejected' ] );
    }

    // ─── Handlers ─────────────────────────────────────────────────────────────

    public function on_submitted( int $reg_id ): void {
        $data = $this->get_email_data( $reg_id );
        if ( ! $data ) return;

        // Email all'utente
        $this->send(
            $data['email'],
            sprintf( '✅ Iscrizione ricevuta – %s', $data['tour_title'] ),
            $this->template_submitted_user( $data )
        );

        // Email all'admin
        $admin_email = get_option( 'admin_email' );
        $this->send(
            $admin_email,
            sprintf( '📋 Nuova iscrizione – %s (%s)', $data['pilot_name'], $data['tour_title'] ),
            $this->template_submitted_admin( $data )
        );
    }

    public function on_under_review( int $reg_id ): void {
        $data = $this->get_email_data( $reg_id );
        if ( ! $data ) return;

        $this->send(
            $data['email'],
            sprintf( '🔍 La tua iscrizione è in revisione – %s', $data['tour_title'] ),
            $this->template_under_review( $data )
        );
    }

    public function on_approved( int $reg_id ): void {
        $data = $this->get_email_data( $reg_id );
        if ( ! $data ) return;

        // Email all'utente con link di accesso
        $this->send(
            $data['email'],
            sprintf( '🎉 Iscrizione approvata! – %s', $data['tour_title'] ),
            $this->template_approved( $data )
        );

        // Email all'admin
        $admin_email = get_option( 'admin_email' );
        $this->send(
            $admin_email,
            sprintf( '✅ Iscrizione approvata – %s', $data['pilot_name'] ),
            $this->template_approved_admin( $data )
        );
    }

    public function on_rejected( int $reg_id ): void {
        $data = $this->get_email_data( $reg_id );
        if ( ! $data ) return;

        $this->send(
            $data['email'],
            sprintf( '❌ Iscrizione non accettata – %s', $data['tour_title'] ),
            $this->template_rejected( $data )
        );
    }

    // ─── Template email ───────────────────────────────────────────────────────

    private function template_submitted_user( array $d ): string {
        $site = get_bloginfo( 'name' );
        return $this->wrap( "
            <h2>Ciao {$d['pilot_first_name']}! 👋</h2>
            <p>Abbiamo ricevuto la tua iscrizione per il tour:</p>
            <div class='highlight'><strong>{$d['tour_title']}</strong><br>{$d['tour_date']}</div>
            <p>I tuoi dati e i documenti allegati sono in attesa di verifica da parte del nostro staff.<br>
            Ti contatteremo via email non appena l'iscrizione sarà processata.</p>
            <p><strong>Cosa succede adesso?</strong></p>
            <ol>
                <li>Il nostro staff verifica i tuoi dati e documenti</li>
                <li>Ricevi una email di conferma o di richiesta integrazioni</li>
                <li>Se tutto è ok, il tuo profilo viene attivato e puoi accedere all'area riservata del tour</li>
            </ol>
            <p>Per qualsiasi informazione rispondi a questa email o scrivici su Instagram.</p>
            <p>A presto su due ruote! 🏍️<br><strong>Motoclub Salentum Terrae A.S.D.</strong></p>
        " );
    }

    private function template_submitted_admin( array $d ): string {
        $admin_url = admin_url( "post.php?post={$d['reg_id']}&action=edit" );
        return $this->wrap( "
            <h2>📋 Nuova iscrizione ricevuta</h2>
            <table class='data-table'>
                <tr><td>Tour</td><td><strong>{$d['tour_title']}</strong></td></tr>
                <tr><td>Pilota</td><td>{$d['pilot_name']}</td></tr>
                <tr><td>Email</td><td>{$d['email']}</td></tr>
                <tr><td>Telefono</td><td>{$d['pilot_phone']}</td></tr>
                <tr><td>Moto</td><td>{$d['moto_model']} – {$d['moto_plate']}</td></tr>
                <tr><td>Passeggero</td><td>" . ( $d['has_passenger'] ? '✅ Sì' : 'No' ) . "</td></tr>
                <tr><td>Inviata il</td><td>{$d['submitted_at']}</td></tr>
            </table>
            <p><a href='{$admin_url}' class='btn'>Visualizza iscrizione nel backend →</a></p>
        " );
    }

    private function template_under_review( array $d ): string {
        return $this->wrap( "
            <h2>La tua iscrizione è in revisione 🔍</h2>
            <p>Ciao <strong>{$d['pilot_first_name']}</strong>,</p>
            <p>Buone notizie! Il nostro staff ha preso in carico la tua iscrizione per il tour <strong>{$d['tour_title']}</strong> ed è in fase di verifica.</p>
            <p>Ti aggiorneremo a breve.</p>
            <p>A presto! 🏍️<br><strong>Motoclub Salentum Terrae A.S.D.</strong></p>
        " );
    }

    private function template_approved( array $d ): string {
        $portal_url = home_url( '/portale-tour' );
        return $this->wrap( "
            <h2>🎉 Sei dentro! Iscrizione approvata</h2>
            <p>Ciao <strong>{$d['pilot_first_name']}</strong>,</p>
            <p>La tua iscrizione per il tour <strong>{$d['tour_title']}</strong> è stata <strong>approvata</strong>!</p>
            <p>Puoi ora accedere all'area riservata del tour con le tue credenziali:</p>
            <div class='highlight'>
                <strong>Email:</strong> {$d['email']}<br>
                <strong>Password:</strong> quella che hai scelto durante l'iscrizione
            </div>
            <p><a href='{$portal_url}' class='btn'>Accedi al portale →</a></p>
            <p>Nell'area riservata troverai:</p>
            <ul>
                <li>🗺️ Itinerario completo con tappe</li>
                <li>📍 Punti di interesse</li>
                <li>📋 Regole e informazioni pratiche</li>
            </ul>
            <p>Non vediamo l'ora di vederti in sella! 🏍️<br><strong>Motoclub Salentum Terrae A.S.D.</strong></p>
        " );
    }

    private function template_approved_admin( array $d ): string {
        return $this->wrap( "
            <h2>✅ Iscrizione approvata</h2>
            <p>L'utente <strong>{$d['pilot_name']}</strong> ({$d['email']}) è stato approvato e il suo account è attivo.</p>
            <p>Tour: <strong>{$d['tour_title']}</strong></p>
        " );
    }

    private function template_rejected( array $d ): string {
        $reason = ! empty( $d['reject_reason'] ) ? "<div class='highlight'><strong>Motivazione:</strong><br>{$d['reject_reason']}</div>" : '';
        return $this->wrap( "
            <h2>Iscrizione non accettata</h2>
            <p>Ciao <strong>{$d['pilot_first_name']}</strong>,</p>
            <p>Ci dispiace, ma la tua iscrizione per il tour <strong>{$d['tour_title']}</strong> non può essere accettata.</p>
            {$reason}
            <p>Per chiarimenti o per inviare una nuova iscrizione con i dati corretti, rispondi a questa email.</p>
            <p>Grazie per l'interesse e speriamo di vederti al prossimo tour! 🏍️<br><strong>Motoclub Salentum Terrae A.S.D.</strong></p>
        " );
    }

    // ─── Wrapper HTML ─────────────────────────────────────────────────────────

    private function wrap( string $content ): string {
        $logo_url = MT_PLUGIN_URL . 'assets/logo-email.png';
        $year     = date( 'Y' );
        return "
<!DOCTYPE html>
<html lang='it'>
<head>
<meta charset='UTF-8'>
<meta name='viewport' content='width=device-width, initial-scale=1.0'>
<style>
  body { margin:0; padding:0; background:#f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { max-width:600px; margin:32px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.08); }
  .header { background:#1a1a2e; padding:24px 32px; text-align:center; }
  .header img { height:48px; }
  .header h1 { color:#fff; margin:8px 0 0; font-size:18px; letter-spacing:.5px; }
  .body { padding:32px; color:#333; line-height:1.6; }
  h2 { color:#1a1a2e; margin-top:0; }
  .highlight { background:#f8f4ff; border-left:4px solid #6c3de8; padding:16px; border-radius:0 8px 8px 0; margin:16px 0; }
  .btn { display:inline-block; background:#6c3de8; color:#fff !important; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; margin:16px 0; }
  .data-table { width:100%; border-collapse:collapse; }
  .data-table td { padding:8px 12px; border-bottom:1px solid #eee; }
  .data-table td:first-child { color:#666; width:40%; }
  ol, ul { padding-left:20px; }
  li { margin-bottom:6px; }
  .footer { background:#f8f8f8; padding:16px 32px; text-align:center; font-size:12px; color:#999; border-top:1px solid #eee; }
  a { color:#6c3de8; }
</style>
</head>
<body>
<div class='wrapper'>
  <div class='header'>
    <h1>Motoclub Salentum Terrae A.S.D.</h1>
  </div>
  <div class='body'>
    {$content}
  </div>
  <div class='footer'>
    © {$year} Motoclub Salentum Terrae A.S.D. · Lecce<br>
    <a href='mailto:motoclubsalentumterrae@gmail.com'>motoclubsalentumterrae@gmail.com</a>
  </div>
</div>
</body>
</html>";
    }

    // ─── Raccolta dati per le email ───────────────────────────────────────────

    private function get_email_data( int $reg_id ): ?array {
        $post = get_post( $reg_id );
        if ( ! $post ) return null;

        $meta     = get_post_meta( $reg_id );
        $tour_id  = (int) ( $meta['mt_reg_tour_id'][0] ?? 0 );
        $tour     = get_post( $tour_id );

        $submitted_raw = $meta['mt_reg_submitted_at'][0] ?? '';
        $submitted_fmt = $submitted_raw
            ? wp_date( 'd/m/Y H:i', strtotime( $submitted_raw ) )
            : '';

        return [
            'reg_id'         => $reg_id,
            'email'          => $meta['mt_reg_email'][0] ?? '',
            'pilot_first_name' => $meta['mt_reg_pilot_first_name'][0] ?? '',
            'pilot_name'     => trim( ( $meta['mt_reg_pilot_first_name'][0] ?? '' ) . ' ' . ( $meta['mt_reg_pilot_last_name'][0] ?? '' ) ),
            'pilot_phone'    => $meta['mt_reg_pilot_phone'][0] ?? '',
            'moto_model'     => $meta['mt_reg_moto_model'][0] ?? '',
            'moto_plate'     => $meta['mt_reg_moto_plate'][0] ?? '',
            'has_passenger'  => (bool) ( $meta['mt_reg_has_passenger'][0] ?? false ),
            'reject_reason'  => $meta['mt_reg_reject_reason'][0] ?? '',
            'submitted_at'   => $submitted_fmt,
            'tour_title'     => $tour ? $tour->post_title : '–',
            'tour_date'      => $tour ? wp_date( 'd/m/Y', strtotime( get_post_meta( $tour_id, 'mt_tour_date', true ) ) ) : '',
        ];
    }

    // ─── Send wrapper ─────────────────────────────────────────────────────────

    private function send( string $to, string $subject, string $html ): void {
        add_filter( 'wp_mail_content_type', fn() => 'text/html' );
        wp_mail(
            $to,
            '[MotorTour] ' . $subject,
            $html,
            [ 'From: Motoclub Salentum Terrae <noreply@' . parse_url( home_url(), PHP_URL_HOST ) . '>' ]
        );
        remove_filter( 'wp_mail_content_type', fn() => 'text/html' );
    }
}
