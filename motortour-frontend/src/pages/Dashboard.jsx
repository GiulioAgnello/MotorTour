/**
 * Dashboard – Area riservata post-approvazione.
 *
 * Sezioni:
 *   1. Benvenuto + stato membership
 *   2. I miei tour — richieste inviate con stato
 *   3. Tour disponibili — tour aperti a cui ci si può iscrivere
 */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../App';

// ── Badge stato membership ────────────────────────────────────────────────────
const MEMBERSHIP_STATUS = {
  pending: {
    icon: '🕐', label: 'In attesa di verifica',
    desc: 'La tua iscrizione è stata ricevuta. Lo staff la verificherà a breve.',
    color: '#856404', bg: '#fff3cd',
  },
  under_review: {
    icon: '🔍', label: 'In revisione',
    desc: 'Lo staff sta controllando i tuoi documenti. Ti aggiorneremo presto!',
    color: '#0c5460', bg: '#d1ecf1',
  },
  approved: {
    icon: '✅', label: 'Socio attivo',
    desc: 'Sei un socio attivo del Motoclub. Puoi richiedere di partecipare ai tour.',
    color: '#155724', bg: '#d4edda',
  },
  rejected: {
    icon: '😔', label: 'Iscrizione non accettata',
    desc: 'La tua iscrizione non è stata accettata. Controlla l\'email per i dettagli.',
    color: '#721c24', bg: '#f8d7da',
  },
};

// ── Badge stato enrollment ────────────────────────────────────────────────────
const ENROLL_STATUS = {
  pending:  { icon: '🕐', label: 'In attesa',  color: '#856404', bg: '#fff3cd' },
  approved: { icon: '✅', label: 'Confermato', color: '#155724', bg: '#d4edda' },
  rejected: { icon: '❌', label: 'Rifiutato',  color: '#721c24', bg: '#f8d7da' },
};

// ── Formatter data ────────────────────────────────────────────────────────────
const fmtDate = ( str ) => str
  ? new Date( str ).toLocaleDateString( 'it-IT', { day: 'numeric', month: 'long', year: 'numeric' } )
  : '';

export default function Dashboard( { config } ) {
  const { user, logout }   = useAuth();
  const navigate            = useNavigate();

  const [ reg,         setReg         ] = useState( null );
  const [ enrollments, setEnrollments ] = useState( [] );
  const [ tours,       setTours       ] = useState( [] );
  const [ loading,     setLoading     ] = useState( true );
  const [ error,       setError       ] = useState( null );

  useEffect( () => {
    Promise.all( [
      api.getMyRegistration(),
      api.getMyEnrollments(),
      api.getTours(),
    ] )
      .then( ( [ regData, enrollData, toursData ] ) => {
        setReg( regData );
        setEnrollments( enrollData );
        setTours( toursData );
      } )
      .catch( e => setError( e.message ) )
      .finally( () => setLoading( false ) );
  }, [] );

  const handleLogout = async () => {
    await api.logout();
    logout();
    navigate( '/' );
  };

  if ( loading ) return <div className="motortour-app-root"><div className="mt-spinner" /></div>;

  const memberStatus = reg?.status || 'pending';
  const isApproved   = memberStatus === 'approved';
  const statusInfo   = MEMBERSHIP_STATUS[ memberStatus ] || MEMBERSHIP_STATUS.pending;

  // Tour a cui il socio non ha già inviato richiesta (aperta, senza enrollment esistente)
  const enrolledTourIds = new Set( enrollments.map( e => e.tour?.id ) );
  const availableTours  = isApproved
    ? tours.filter( t => t.status === 'open' && ! enrolledTourIds.has( t.id ) )
    : [];

  return (
    <div className="motortour-app-root">

      {/* ── Header ── */}
      <header className="mt-tour-header">
        <div className="mt-container" style={ { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 } }>
          <div>
            <p style={ { fontSize: 12, opacity: .7, marginBottom: 4 } }>Benvenuto/a</p>
            <h1 style={ { marginBottom: 0 } }>{ user?.name || 'Motociclista' } 🏍️</h1>
          </div>
          <div style={ { display: 'flex', gap: 8, alignItems: 'center' } }>
            <Link to="/" className="mt-btn mt-btn-outline"
                  style={ { borderColor: 'rgba(255,255,255,.5)', color: '#fff', fontSize: 13 } }>
              🏠 Home
            </Link>
            <button className="mt-btn mt-btn-outline" onClick={ handleLogout }
                    style={ { borderColor: 'rgba(255,255,255,.5)', color: '#fff' } }>
              Esci
            </button>
          </div>
        </div>
      </header>

      <main className="mt-container mt-page">

        { error && <div className="mt-alert mt-alert-error">{ error }</div> }

        {/* ── 1. Stato membership ── */}
        <div className="mt-card" style={ { marginBottom: 20 } }>
          <div className="mt-card-body">
            <h2 style={ { fontSize: 16, marginBottom: 12, color: 'var(--mt-secondary)' } }>
              🪪 La tua tessera
            </h2>
            <div style={ {
              background: statusInfo.bg,
              borderRadius: 8, padding: '16px 20px',
              display: 'flex', gap: 16, alignItems: 'flex-start',
            } }>
              <span style={ { fontSize: 32, flexShrink: 0 } }>{ statusInfo.icon }</span>
              <div>
                <strong style={ { color: statusInfo.color, fontSize: 16, display: 'block', marginBottom: 4 } }>
                  { statusInfo.label }
                </strong>
                <p style={ { margin: 0, fontSize: 14, color: statusInfo.color, opacity: .85 } }>
                  { statusInfo.desc }
                </p>
                { memberStatus === 'rejected' && reg?.reject_reason && (
                  <p style={ { margin: '8px 0 0', fontSize: 13, fontStyle: 'italic' } }>
                    "{ reg.reject_reason }"
                  </p>
                ) }
              </div>
            </div>

            { /* Timestamps */ }
            { reg && (
              <table style={ { width: '100%', fontSize: 13, borderCollapse: 'collapse', marginTop: 12 } }>
                <tbody>
                  { reg.submitted_at && (
                    <tr style={ { borderBottom: '1px solid var(--mt-border)' } }>
                      <td style={ { padding: '6px 0', color: 'var(--mt-text-muted)' } }>Iscrizione inviata</td>
                      <td style={ { padding: '6px 0', textAlign: 'right' } }>
                        { new Date( reg.submitted_at ).toLocaleString( 'it-IT' ) }
                      </td>
                    </tr>
                  ) }
                  { reg.approved_at && (
                    <tr>
                      <td style={ { padding: '6px 0', color: 'var(--mt-text-muted)' } }>Approvata il</td>
                      <td style={ { padding: '6px 0', textAlign: 'right' } }>
                        { new Date( reg.approved_at ).toLocaleString( 'it-IT' ) }
                      </td>
                    </tr>
                  ) }
                </tbody>
              </table>
            ) }
          </div>
        </div>

        {/* ── 2. I miei tour (richieste inviate) ── */}
        { enrollments.length > 0 && (
          <div className="mt-card" style={ { marginBottom: 20 } }>
            <div className="mt-card-body">
              <h2 style={ { fontSize: 16, marginBottom: 16, color: 'var(--mt-secondary)' } }>
                🗂️ Le mie richieste tour
              </h2>
              <div style={ { display: 'flex', flexDirection: 'column', gap: 12 } }>
                { enrollments.map( enroll => {
                  const es = ENROLL_STATUS[ enroll.status ] || ENROLL_STATUS.pending;
                  return (
                    <div key={ enroll.id } style={ {
                      border: '1px solid var(--mt-border)', borderRadius: 10,
                      padding: '14px 16px', display: 'flex',
                      justifyContent: 'space-between', alignItems: 'flex-start',
                      flexWrap: 'wrap', gap: 8,
                    } }>
                      <div style={ { flex: 1, minWidth: 200 } }>
                        <strong style={ { fontSize: 15, display: 'block', marginBottom: 4 } }>
                          { enroll.tour?.title || 'Tour' }
                        </strong>
                        { enroll.tour?.date && (
                          <p style={ { margin: '0 0 4px', fontSize: 13, color: 'var(--mt-text-muted)' } }>
                            📅 { fmtDate( enroll.tour.date ) }
                          </p>
                        ) }
                        <p style={ { margin: 0, fontSize: 13, color: 'var(--mt-text-muted)' } }>
                          🏍️ { enroll.moto_model } — { enroll.moto_plate }
                          { enroll.with_passenger && ' · 👥 Con passeggero' }
                        </p>
                        { enroll.status === 'rejected' && enroll.reject_reason && (
                          <p style={ { margin: '6px 0 0', fontSize: 12, color: '#721c24', fontStyle: 'italic' } }>
                            "{ enroll.reject_reason }"
                          </p>
                        ) }
                      </div>
                      <span style={ {
                        background: es.bg, color: es.color,
                        padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                        whiteSpace: 'nowrap',
                      } }>
                        { es.icon } { es.label }
                      </span>
                    </div>
                  );
                } ) }
              </div>
            </div>
          </div>
        ) }

        {/* ── 3. Tour disponibili ── */}
        { isApproved && (
          <div className="mt-card" style={ { marginBottom: 20 } }>
            <div className="mt-card-body">
              <h2 style={ { fontSize: 16, marginBottom: 4, color: 'var(--mt-secondary)' } }>
                🗺️ Tour disponibili
              </h2>
              { availableTours.length === 0 ? (
                <p style={ { color: 'var(--mt-text-muted)', fontSize: 14, marginTop: 12 } }>
                  { enrollments.length > 0
                    ? 'Sei già iscritto a tutti i tour aperti al momento. 🎉'
                    : 'Nessun tour disponibile al momento. Torna a controllare presto!' }
                </p>
              ) : (
                <div style={ { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 } }>
                  { availableTours.map( tour => (
                    <TourCard key={ tour.id } tour={ tour } />
                  ) ) }
                </div>
              ) }
            </div>
          </div>
        ) }

        {/* ── Accesso itinerario se c'è un enrollment approvato ── */}
        { enrollments.some( e => e.status === 'approved' ) && (
          <div className="mt-card">
            <div className="mt-card-body">
              <h2 style={ { fontSize: 16, marginBottom: 8, color: 'var(--mt-secondary)' } }>
                🗺️ Itinerario
              </h2>
              <p style={ { fontSize: 14, color: 'var(--mt-text-muted)', marginBottom: 16 } }>
                Hai una partecipazione confermata. Accedi all'itinerario completo con tappe e punti di interesse.
              </p>
              <Link to="/area-riservata/tour" className="mt-btn mt-btn-primary mt-btn-full">
                Apri itinerario del tour →
              </Link>
            </div>
          </div>
        ) }

      </main>
    </div>
  );
}

// ── Card tour disponibile ─────────────────────────────────────────────────────
function TourCard( { tour } ) {
  return (
    <div style={ {
      border: '1px solid var(--mt-border)', borderRadius: 10, overflow: 'hidden',
      display: 'flex', alignItems: 'stretch',
    } }>
      { tour.banner_url && (
        <div style={ {
          width: 80, flexShrink: 0,
          background: `url(${ tour.banner_url }) center/cover no-repeat`,
        } } />
      ) }
      <div style={ { padding: '14px 16px', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 } }>
        <div>
          <strong style={ { fontSize: 15, display: 'block', marginBottom: 4 } }>{ tour.title }</strong>
          { tour.date && (
            <p style={ { margin: 0, fontSize: 13, color: 'var(--mt-text-muted)' } }>
              📅 { new Date( tour.date ).toLocaleDateString( 'it-IT', { day: 'numeric', month: 'long', year: 'numeric' } ) }
              { tour.meeting_point && ` · 📍 ${ tour.meeting_point }` }
            </p>
          ) }
          { tour.deadline && (
            <p style={ { margin: '4px 0 0', fontSize: 12, color: '#856404' } }>
              ⏰ Scadenza iscrizioni: { new Date( tour.deadline ).toLocaleDateString( 'it-IT', { day: 'numeric', month: 'short' } ) }
            </p>
          ) }
        </div>
        <Link
          to={ `/tour/${ tour.id }/iscrivi` }
          className="mt-btn mt-btn-primary"
          style={ { whiteSpace: 'nowrap', fontSize: 14 } }
        >
          Richiedi iscrizione →
        </Link>
      </div>
    </div>
  );
}
