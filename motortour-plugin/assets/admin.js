/**
 * MotorTour — Admin JS
 * Gestisce le azioni rapide approva/rifiuta/revisione con AJAX
 */
(function ($) {
    'use strict';

    let pendingRejectId    = null;
    let pendingRejectNonce = null;
    let pendingRejectType  = 'registration'; // 'registration' | 'enrollment'

    // ── Approvazione ─────────────────────────────────────────────────────────
    $(document).on('click', '.mt-btn-approve', function () {
        const $btn  = $(this);
        const regId = $btn.data('id');
        const nonce = $btn.data('nonce') || mtAdmin.nonce;

        if (!confirm('Confermi l\'approvazione dell\'iscrizione?')) return;

        $btn.prop('disabled', true).text('...');

        $.post(mtAdmin.ajaxUrl, {
            action: 'mt_approve_registration',
            reg_id: regId,
            nonce:  nonce,
        }).done(function (res) {
            if (res.success) {
                showToast('✅ Iscrizione approvata!', 'success');
                // Ricarica dopo 1 secondo per aggiornare lo stato
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast('Errore: ' + (res.data?.message || 'Sconosciuto'), 'error');
                $btn.prop('disabled', false).text('✅ Approva');
            }
        }).fail(function () {
            showToast('Errore di rete.', 'error');
            $btn.prop('disabled', false).text('✅ Approva');
        });
    });

    // ── Approvazione richiesta tour ───────────────────────────────────────────
    $(document).on('click', '.mt-btn-approve-enroll', function () {
        const $btn     = $(this);
        const enrollId = $btn.data('id');
        const nonce    = $btn.data('nonce') || mtAdmin.nonce;

        if (!confirm('Confermi l\'approvazione della richiesta tour?')) return;

        $btn.prop('disabled', true).text('...');

        $.post(mtAdmin.ajaxUrl, {
            action:    'mt_approve_enrollment',
            enroll_id: enrollId,
            nonce:     nonce,
        }).done(function (res) {
            if (res.success) {
                showToast('✅ Richiesta approvata!', 'success');
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast('Errore: ' + (res.data?.message || 'Sconosciuto'), 'error');
                $btn.prop('disabled', false).text('✅');
            }
        }).fail(function () {
            showToast('Errore di rete.', 'error');
            $btn.prop('disabled', false).text('✅');
        });
    });

    // ── Rifiuto ───────────────────────────────────────────────────────────────
    $(document).on('click', '.mt-btn-reject', function () {
        pendingRejectId    = $(this).data('id');
        pendingRejectNonce = $(this).data('nonce') || mtAdmin.nonce;
        pendingRejectType  = 'registration';
        $('#mt-reject-reason').val('');
        $('#mt-reject-modal').show();
    });

    // ── Rifiuto richiesta tour ────────────────────────────────────────────────
    $(document).on('click', '.mt-btn-reject-enroll', function () {
        pendingRejectId    = $(this).data('id');
        pendingRejectNonce = $(this).data('nonce') || mtAdmin.nonce;
        pendingRejectType  = 'enrollment';
        $('#mt-reject-reason').val('');
        $('#mt-reject-modal').show();
    });

    $(document).on('click', '#mt-reject-cancel', function () {
        $('#mt-reject-modal').hide();
        pendingRejectId    = null;
        pendingRejectNonce = null;
    });

    $(document).on('click', '#mt-reject-confirm', function () {
        const reason = $('#mt-reject-reason').val().trim();
        if (!reason) {
            alert('Inserisci una motivazione prima di procedere.');
            return;
        }

        $(this).prop('disabled', true).text('...');

        const isEnrollment = pendingRejectType === 'enrollment';
        const postData = isEnrollment
            ? { action: 'mt_reject_enrollment', enroll_id: pendingRejectId, nonce: pendingRejectNonce, reason }
            : { action: 'mt_reject_registration', reg_id: pendingRejectId, nonce: pendingRejectNonce, reason };

        $.post(mtAdmin.ajaxUrl, postData).done(function (res) {
            if (res.success) {
                showToast(isEnrollment ? '❌ Richiesta rifiutata.' : '❌ Iscrizione rifiutata.', 'success');
                $('#mt-reject-modal').hide();
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast('Errore: ' + (res.data?.message || 'Sconosciuto'), 'error');
            }
        }).fail(function () {
            showToast('Errore di rete.', 'error');
        }).always(function () {
            $('#mt-reject-confirm').prop('disabled', false).text('Conferma rifiuto');
        });
    });

    // ── Segna in revisione ────────────────────────────────────────────────────
    $(document).on('click', '.mt-btn-review', function () {
        const $btn  = $(this);
        const regId = $btn.data('id');
        const nonce = $btn.data('nonce') || mtAdmin.nonce;

        $btn.prop('disabled', true).text('...');

        $.post(mtAdmin.ajaxUrl, {
            action: 'mt_review_registration',
            reg_id: regId,
            nonce:  nonce,
        }).done(function (res) {
            if (res.success) {
                showToast('🔍 Segnata in revisione.', 'success');
                setTimeout(() => location.reload(), 800);
            } else {
                showToast('Errore.', 'error');
                $btn.prop('disabled', false).text('🔍 Segna in revisione');
            }
        });
    });

    // ── Toast notifications ───────────────────────────────────────────────────
    function showToast(msg, type) {
        const $toast = $('<div>')
            .addClass('mt-toast mt-toast-' + type)
            .text(msg)
            .css({
                position:   'fixed',
                bottom:     '24px',
                right:      '24px',
                background: type === 'success' ? '#28a745' : '#dc3545',
                color:      '#fff',
                padding:    '12px 20px',
                borderRadius: '8px',
                fontSize:   '14px',
                fontWeight: '600',
                zIndex:     999999,
                boxShadow:  '0 4px 12px rgba(0,0,0,.2)',
            })
            .appendTo('body');

        setTimeout(() => $toast.fadeOut(300, function () { $(this).remove(); }), 3000);
    }

})(jQuery);
