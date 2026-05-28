/**
 * TourList – Pagina pubblica con la lista dei tour aperti.
 * Prima cosa che l'utente vede quando arriva sul portale.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function TourList( { config } ) {
  const [ tours,   setTours   ] = useState( [] );
  const [ loading, setLoading ] = useState( true );
  const [ error,   setError   ] = useState( null );

  useEffect( () => {
    api.getTours()
      .then( setTours )
      .catch( e => setError( e.message ) )
      .finally( () => setLoading( false ) );
  }, [] );

  return (
    <div className="motortour-app-root">

      {/* Header */}
      <header className="mt-tour-header">
        <div className="mt-container">
          <p style={ { fontSize: 12, opacity: .7, marginBottom: 4 } }>Motoclub Salentum Terrae A.S.D.</p>
          <h1>🏍️ I nostri Tour</h1>
          <p style={ { opacity: .85, margin: 0 } }>
            Avventure su due ruote nel Salento e oltre
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="mt-container mt-page">

        { loading && <div className="mt-spinner" /> }

        { error && (
          <div className="mt-alert mt-alert-error">
            Impossibile caricare i tour: { error }
          </div>
        ) }

        { ! loading && ! error && tours.length === 0 && (
          <div className="mt-alert mt-alert-info" style={ { textAlign: 'center', padding: 32 } }>
            <div style={ { fontSize: 40, marginBottom: 8 } }>🏍️</div>
            <strong>Nessun tour aperto al momento.</strong>
            <p style={ { margin: '8px 0 0', color: '#666' } }>Torna presto per scoprire i prossimi eventi!</p>
          </div>
        ) }

        <div style={ { display: 'flex', flexDirection: 'column', gap: 16 } }>
          { tours.map( tour => (
            <TourCard key={ tour.id } tour={ tour } />
          ) ) }
        </div>

        {/* Link login per chi è già iscritto */}
        <div style={ { textAlign: 'center', marginTop: 32, padding: '16px 0', borderTop: '1px solid var(--mt-border)' } }>
          <p style={ { color: 'var(--mt-text-muted)', fontSize: 14 } }>
            Sei già iscritto a un tour?{' '}
            <Link to="/login" style={ { color: 'var(--mt-primary)', fontWeight: 600 } }>
              Accedi alla tua area riservata →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function TourCard( { tour } ) {
  const isOpen   = tour.status === 'open';
  const dateStr  = tour.date
    ? new Date( tour.date ).toLocaleDateString( 'it-IT', { day: 'numeric', month: 'long', year: 'numeric' } )
    : '';

  // Applica i colori custom del tour
  const style = {
    '--mt-primary':   tour.color_primary   || '#6c3de8',
    '--mt-secondary': tour.color_secondary || '#1a1a2e',
  };

  return (
    <div className="mt-card" style={ style }>

      { tour.banner_url && (
        <img
          src={ tour.banner_url }
          alt={ tour.title }
          style={ { width: '100%', height: 180, objectFit: 'cover', display: 'block' } }
        />
      ) }

      { ! tour.banner_url && (
        <div style={ {
          height: 120,
          background: 'var(--mt-header-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
        } }>
          🏍️
        </div>
      ) }

      <div className="mt-card-body">

        {/* Badge status */}
        <div style={ { marginBottom: 8 } }>
          { tour.charity && (
            <span className="mt-badge" style={ { background: '#fff3e0', color: '#e65100', marginRight: 6 } }>
              🤝 Benefico
            </span>
          ) }
          <span className={ `mt-badge ${ isOpen ? 'mt-badge-approved' : 'mt-badge-rejected' }` }>
            { isOpen ? '🟢 Iscrizioni aperte' : '🔴 Iscrizioni chiuse' }
          </span>
        </div>

        <h2 style={ { fontSize: 18, marginBottom: 8 } }>{ tour.title }</h2>

        <div style={ { fontSize: 13, color: 'var(--mt-text-muted)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 } }>
          { dateStr && <span>📅 { dateStr }</span> }
          { tour.time_start && <span>🕐 Raduno ore { tour.time_start }</span> }
          { tour.meeting_point && <span>📍 { tour.meeting_point }</span> }
          { tour.deadline && (
            <span>⏰ Iscrizioni entro il {
              new Date( tour.deadline ).toLocaleDateString( 'it-IT', { day: 'numeric', month: 'long', year: 'numeric' } )
            }</span>
          ) }
          { tour.onlus_name && <span>🤝 A favore di: { tour.onlus_name }</span> }
        </div>

        { isOpen ? (
          <Link to={ `/iscriviti/${ tour.id }` } className="mt-btn mt-btn-primary mt-btn-full">
            Iscriviti al tour →
          </Link>
        ) : (
          <button className="mt-btn mt-btn-full" disabled style={ { background: '#ccc', color: '#666', cursor: 'not-allowed' } }>
            Iscrizioni chiuse
          </button>
        ) }
      </div>
    </div>
  );
}
