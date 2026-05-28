/**
 * Dashboard – Area riservata post-approvazione.
 * Mostra lo stato dell'iscrizione e il link al tour.
 */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../App';

const STATUS_INFO = {
  pending: {
    icon: '🕐',
    label: 'In attesa di verifica',
    desc: 'La tua iscrizione è stata ricevuta. Il nostro staff la verificherà a breve.',
    color: '#856404',
    bg: '#fff3cd',
  },
  under_review: {
    icon: '🔍',
    label: 'In revisione',
    desc: 'Il nostro staff sta controllando i tuoi documenti. Ti aggiorneremo presto!',
    color: '#0c5460',
    bg: '#d1ecf1',
  },
  approved: {
    icon: '🎉',
    label: 'Iscrizione approvata!',
    desc: 'Sei ufficialmente iscritto al tour. Puoi accedere a tutti i dettagli dell\'evento.',
    color: '#155724',
    bg: '#d4edda',
  },
  rejected: {
    icon: '😔',
    label: 'Iscrizione non accettata',
    desc: 'La tua iscrizione non è stata accettata. Controlla l\'email per i dettagli.',
    color: '#721c24',
    bg: '#f8d7da',
  },
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [ reg,     setReg     ] = useState( null );
  const [ loading, setLoading ] = useState( true );
  const [ error,   setError   ] = useState( null );

  useEffect( () => {
    api.getMyRegistration()
      .then( setReg )
      .catch( e => setError( e.message ) )
      .finally( () => setLoading( false ) );
  }, [] );

  const handleLogout = async () => {
    await api.logout();
    logout();
    navigate( '/' );
  };

  if ( loading ) return <div className="motortour-app-root"><div className="mt-spinner" /></div>;

  const status     = reg?.status || 'pending';
  const statusInfo = STATUS_INFO[ status ] || STATUS_INFO.pending;
  const isApproved = status === 'approved';

  return (
    <div className="motortour-app-root">

      {/* Header */}
      <header className="mt-tour-header">
        <div className="mt-container" style={ { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 } }>
          <div>
            <p style={ { fontSize: 12, opacity: .7, marginBottom: 4 } }>Benvenuto/a</p>
            <h1 style={ { marginBottom: 0 } }>{ user?.name || 'Motociclista' } 👋</h1>
          </div>
          <button
            className="mt-btn mt-btn-outline"
            onClick={ handleLogout }
            style={ { borderColor: 'rgba(255,255,255,.6)', color: '#fff' } }
          >
            Esci
          </button>
        </div>
      </header>

      <main className="mt-container mt-page">

        { error && <div className="mt-alert mt-alert-error">{ error }</div> }

        {/* Status card */}
        { reg && (
          <div className="mt-card" style={ { marginBottom: 20 } }>
            <div className="mt-card-body">
              <div style={ {
                background: statusInfo.bg,
                borderRadius: 8,
                padding: '16px 20px',
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
              } }>
                <span style={ { fontSize: 32, flexShrink: 0 } }>{ statusInfo.icon }</span>
                <div>
                  <strong style={ { color: statusInfo.color, fontSize: 16, display: 'block', marginBottom: 4 } }>
                    { statusInfo.label }
                  </strong>
                  <p style={ { margin: 0, fontSize: 14, color: statusInfo.color, opacity: .85 } }>
                    { statusInfo.desc }
                  </p>
                  { status === 'rejected' && reg.reject_reason && (
                    <p style={ { margin: '8px 0 0', fontSize: 13, fontStyle: 'italic' } }>
                      "{ reg.reject_reason }"
                    </p>
                  ) }
                </div>
              </div>

              {/* Info tour */}
              { reg.tour && (
                <div style={ { marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--mt-border)' } }>
                  <p style={ { margin: 0, fontSize: 13, color: 'var(--mt-text-muted)' } }>Tour iscritto</p>
                  <strong style={ { fontSize: 16 } }>{ reg.tour.title }</strong>
                  { reg.tour.date && (
                    <p style={ { margin: '4px 0 0', fontSize: 13, color: 'var(--mt-text-muted)' } }>
                      📅 { new Date( reg.tour.date ).toLocaleDateString( 'it-IT', { day: 'numeric', month: 'long', year: 'numeric' } ) }
                    </p>
                  ) }
                </div>
              ) }

              {/* CTA per approvati */}
              { isApproved && (
                <Link
                  to="/area-riservata/tour"
                  className="mt-btn mt-btn-primary mt-btn-full"
                  style={ { marginTop: 16 } }
                >
                  🗺️ Accedi ai dettagli del tour →
                </Link>
              ) }
            </div>
          </div>
        ) }

        {/* Info timestamps */}
        { reg && (
          <div className="mt-card">
            <div className="mt-card-body">
              <h3 style={ { fontSize: 15, marginBottom: 12 } }>📋 Riepilogo iscrizione</h3>
              <table style={ { width: '100%', fontSize: 13, borderCollapse: 'collapse' } }>
                <tbody>
                  { reg.submitted_at && (
                    <tr style={ { borderBottom: '1px solid var(--mt-border)' } }>
                      <td style={ { padding: '8px 0', color: 'var(--mt-text-muted)' } }>Inviata il</td>
                      <td style={ { padding: '8px 0', textAlign: 'right' } }>
                        { new Date( reg.submitted_at ).toLocaleString( 'it-IT' ) }
                      </td>
                    </tr>
                  ) }
                  { reg.reviewed_at && (
                    <tr style={ { borderBottom: '1px solid var(--mt-border)' } }>
                      <td style={ { padding: '8px 0', color: 'var(--mt-text-muted)' } }>In revisione dal</td>
                      <td style={ { padding: '8px 0', textAlign: 'right' } }>
                        { new Date( reg.reviewed_at ).toLocaleString( 'it-IT' ) }
                      </td>
                    </tr>
                  ) }
                  { reg.approved_at && (
                    <tr>
                      <td style={ { padding: '8px 0', color: 'var(--mt-text-muted)' } }>Approvata il</td>
                      <td style={ { padding: '8px 0', textAlign: 'right' } }>
                        { new Date( reg.approved_at ).toLocaleString( 'it-IT' ) }
                      </td>
                    </tr>
                  ) }
                </tbody>
              </table>
            </div>
          </div>
        ) }
      </main>
    </div>
  );
}
