/**
 * TourDetail – Area riservata: dettaglio tour con itinerario, tappe e POI.
 * Accessibile solo agli utenti con iscrizione approvata.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const POI_ICONS = {
  ristorante: '🍽️',
  monumento:  '🏛️',
  natura:     '🌿',
  carburante: '⛽',
  altro:      '📍',
};

export default function TourDetail() {
  const [ tour,    setTour    ] = useState( null );
  const [ loading, setLoading ] = useState( true );
  const [ error,   setError   ] = useState( null );
  const [ openPoi, setOpenPoi ] = useState( null );

  useEffect( () => {
    api.getMyTour()
      .then( t => {
        setTour( t );
        // Applica i colori del tour
        document.documentElement.style.setProperty( '--mt-primary',   t.color_primary   || '#6c3de8' );
        document.documentElement.style.setProperty( '--mt-secondary', t.color_secondary || '#1a1a2e' );
      } )
      .catch( e => setError( e.message ) )
      .finally( () => setLoading( false ) );
  }, [] );

  if ( loading ) return <div className="motortour-app-root"><div className="mt-spinner" /></div>;

  if ( error ) return (
    <div className="motortour-app-root">
      <div className="mt-container mt-page">
        <div className="mt-alert mt-alert-error">{ error }</div>
        <Link to="/area-riservata" className="mt-btn mt-btn-outline">← Torna alla dashboard</Link>
      </div>
    </div>
  );

  if ( ! tour ) return null;

  const dateStr = tour.date
    ? new Date( tour.date ).toLocaleDateString( 'it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } )
    : '';

  return (
    <div className="motortour-app-root">

      {/* Header */}
      <header className="mt-tour-header" style={ { position: 'relative', overflow: 'hidden' } }>
        { tour.banner_url && (
          <div style={ {
            position: 'absolute', inset: 0,
            backgroundImage: `url(${ tour.banner_url })`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: .3,
          } } />
        ) }
        <div className="mt-container" style={ { position: 'relative' } }>
          { tour.logo_url && (
            <img src={ tour.logo_url } alt={ tour.title }
                 style={ { height: 56, marginBottom: 12, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,.3)' } } />
          ) }
          <h1>{ tour.title }</h1>
          { dateStr && <p className="mt-tour-date">📅 { dateStr }</p> }
          { tour.meeting_point && (
            <p className="mt-tour-date">📍 Raduno: { tour.meeting_point }{ tour.time_start ? ` – ore ${ tour.time_start }` : '' }</p>
          ) }
          { tour.charity && tour.onlus_name && (
            <p className="mt-tour-date">🤝 A favore di: { tour.onlus_name }</p>
          ) }
        </div>
      </header>

      <main className="mt-container mt-page">

        <Link to="/area-riservata" style={ { display: 'inline-block', marginBottom: 20, fontSize: 13, color: 'var(--mt-primary)' } }>
          ← Dashboard
        </Link>

        {/* Descrizione */}
        { tour.description && (
          <div className="mt-card" style={ { marginBottom: 16 } }>
            <div className="mt-card-body">
              <h3 style={ { marginBottom: 12 } }>📋 Informazioni</h3>
              <div style={ { fontSize: 14, lineHeight: 1.7 } }
                   dangerouslySetInnerHTML={ { __html: tour.description } } />
              { tour.lunch_type && (
                <p style={ { marginTop: 12, fontSize: 14 } }>🍱 Pranzo: { tour.lunch_type }</p>
              ) }
            </div>
          </div>
        ) }

        {/* Regole */}
        { tour.rules && (
          <div className="mt-card" style={ { marginBottom: 16 } }>
            <div className="mt-card-body">
              <h3 style={ { marginBottom: 12 } }>📜 Regole del tour</h3>
              <div style={ { fontSize: 13, lineHeight: 1.7, color: 'var(--mt-text-muted)' } }
                   dangerouslySetInnerHTML={ { __html: tour.rules } } />
            </div>
          </div>
        ) }

        {/* Itinerario */}
        { tour.stages && tour.stages.length > 0 && (
          <div>
            <h2 style={ { fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 } }>
              🗺️ Itinerario
            </h2>
            <div style={ { position: 'relative' } }>
              { tour.stages.map( ( stage, i ) => (
                <StageCard
                  key={ stage.id }
                  stage={ stage }
                  index={ i }
                  isLast={ i === tour.stages.length - 1 }
                  onPoiClick={ setOpenPoi }
                />
              ) ) }
            </div>
          </div>
        ) }
      </main>

      {/* POI Modal */}
      { openPoi && (
        <PoiModal poi={ openPoi } onClose={ () => setOpenPoi( null ) } />
      ) }
    </div>
  );
}

function StageCard( { stage, index, isLast, onPoiClick } ) {
  const [ open, setOpen ] = useState( index === 0 );

  return (
    <div style={ { display: 'flex', gap: 16, marginBottom: isLast ? 0 : 24 } }>
      {/* Timeline dot */}
      <div style={ { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36, flexShrink: 0 } }>
        <div style={ {
          width: 36, height: 36,
          borderRadius: '50%',
          background: 'var(--mt-primary)',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700,
          flexShrink: 0,
        } }>
          { index + 1 }
        </div>
        { ! isLast && (
          <div style={ { flex: 1, width: 2, background: 'var(--mt-border)', minHeight: 24 } } />
        ) }
      </div>

      {/* Content */}
      <div className="mt-card" style={ { flex: 1, marginBottom: 0 } }>
        <div
          className="mt-card-body"
          style={ { cursor: 'pointer', userSelect: 'none' } }
          onClick={ () => setOpen( o => ! o ) }
        >
          <div style={ { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } }>
            <div>
              <h3 style={ { fontSize: 15, marginBottom: 2 } }>{ stage.name }</h3>
              { stage.time && (
                <p style={ { fontSize: 12, color: 'var(--mt-text-muted)', margin: 0 } }>🕐 { stage.time }</p>
              ) }
              { stage.location && (
                <p style={ { fontSize: 12, color: 'var(--mt-text-muted)', margin: '2px 0 0' } }>📍 { stage.location }</p>
              ) }
            </div>
            <span style={ { fontSize: 18, color: 'var(--mt-text-muted)', marginLeft: 8 } }>
              { open ? '▲' : '▼' }
            </span>
          </div>
        </div>

        { open && (
          <div style={ { borderTop: '1px solid var(--mt-border)', padding: '16px 20px' } }>
            { stage.content && (
              <div style={ { fontSize: 13, lineHeight: 1.7, marginBottom: stage.pois?.length ? 16 : 0 } }
                   dangerouslySetInnerHTML={ { __html: stage.content } } />
            ) }
            { stage.notes && (
              <p style={ { fontSize: 13, color: 'var(--mt-text-muted)', margin: '0 0 12px', fontStyle: 'italic' } }>
                📝 { stage.notes }
              </p>
            ) }
            { stage.address && (
              <a
                href={ `https://maps.google.com/?q=${ encodeURIComponent( stage.address ) }` }
                target="_blank"
                rel="noopener noreferrer"
                style={ { fontSize: 12, color: 'var(--mt-primary)', textDecoration: 'none', display: 'block', marginBottom: 12 } }
              >
                🗺️ Apri in Google Maps
              </a>
            ) }

            {/* POI */}
            { stage.pois && stage.pois.length > 0 && (
              <>
                <p style={ { fontSize: 12, fontWeight: 600, color: 'var(--mt-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 } }>
                  Punti di interesse
                </p>
                <div style={ { display: 'flex', flexWrap: 'wrap', gap: 8 } }>
                  { stage.pois.map( poi => (
                    <button
                      key={ poi.id }
                      onClick={ e => { e.stopPropagation(); onPoiClick( poi ); } }
                      className="mt-btn mt-btn-outline"
                      style={ { padding: '6px 12px', fontSize: 12, gap: 4 } }
                    >
                      { POI_ICONS[ poi.type ] || '📍' } { poi.name }
                    </button>
                  ) ) }
                </div>
              </>
            ) }
          </div>
        ) }
      </div>
    </div>
  );
}

function PoiModal( { poi, onClose } ) {
  return (
    <div
      style={ {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.5)',
        zIndex: 1000,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 env(safe-area-inset-bottom)',
      } }
      onClick={ onClose }
    >
      <div
        style={ {
          background: '#fff',
          borderRadius: '16px 16px 0 0',
          padding: '20px 20px calc(20px + env(safe-area-inset-bottom))',
          width: '100%',
          maxWidth: 560,
          maxHeight: '80vh',
          overflowY: 'auto',
        } }
        onClick={ e => e.stopPropagation() }
      >
        {/* Handle */}
        <div style={ { width: 40, height: 4, background: '#ddd', borderRadius: 2, margin: '0 auto 16px' } } />

        <div style={ { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 } }>
          <span style={ { fontSize: 32 } }>{ POI_ICONS[ poi.type ] || '📍' }</span>
          <div>
            <h3 style={ { margin: 0, fontSize: 18 } }>{ poi.name }</h3>
            { poi.type && (
              <p style={ { margin: 0, fontSize: 12, color: 'var(--mt-text-muted)', textTransform: 'capitalize' } }>
                { poi.type }
              </p>
            ) }
          </div>
        </div>

        { poi.image && (
          <img src={ poi.image } alt={ poi.name }
               style={ { width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 12 } } />
        ) }

        { poi.content && (
          <div style={ { fontSize: 14, lineHeight: 1.7, marginBottom: 12 } }
               dangerouslySetInnerHTML={ { __html: poi.content } } />
        ) }

        { poi.address && <p style={ { fontSize: 13, color: 'var(--mt-text-muted)', margin: '0 0 4px' } }>📍 { poi.address }</p> }
        { poi.phone   && <p style={ { fontSize: 13, margin: '0 0 4px' } }><a href={ `tel:${ poi.phone }` }>📞 { poi.phone }</a></p> }
        { poi.website && <p style={ { fontSize: 13, margin: '0 0 4px' } }><a href={ poi.website } target="_blank" rel="noopener noreferrer">🌐 Sito web</a></p> }
        { poi.notes   && <p style={ { fontSize: 13, fontStyle: 'italic', color: 'var(--mt-text-muted)', margin: '8px 0 0' } }>{ poi.notes }</p> }

        { ( poi.lat || poi.address ) && (
          <a
            href={ `https://maps.google.com/?q=${ poi.lat ? `${ poi.lat },${ poi.lng }` : encodeURIComponent( poi.address ) }` }
            target="_blank"
            rel="noopener noreferrer"
            className="mt-btn mt-btn-primary mt-btn-full"
            style={ { marginTop: 16 } }
          >
            🗺️ Apri in Google Maps
          </a>
        ) }

        <button
          className="mt-btn mt-btn-outline mt-btn-full"
          onClick={ onClose }
          style={ { marginTop: 8 } }
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}
