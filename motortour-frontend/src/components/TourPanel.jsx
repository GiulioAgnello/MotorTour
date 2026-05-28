import React from 'react';
import { Link } from 'react-router-dom';
import { C } from '../styles/theme';
import TourCard from './TourCard';

const TABS = [
  { key: 'tutti',  label: 'Tutti'  },
  { key: 'aperti', label: 'Aperti' },
  { key: 'chiusi', label: 'Chiusi' },
];

export default function TourPanel( { tours, loading, activeTab, onTabChange, mobile = false } ) {
  return (
    <>
      {/* Header — solo desktop */}
      { !mobile && (
        <div style={ { padding: '20px 20px 12px' } }>
          <p style={ { margin: 0, fontSize: 15, fontWeight: 600, color: C.dark } }>I nostri tour</p>
          <p style={ { margin: '3px 0 0', fontSize: 12, color: C.textMuted } }>Prossimi eventi in programma</p>
        </div>
      ) }

      {/* Tabs */}
      <div style={ {
        display: 'flex',
        borderBottom: `1px solid ${ C.border }`,
        flexShrink: 0,
        background: mobile ? '#f8f5ff' : C.surface,
      } }>
        { TABS.map( tab => (
          <button
            key={ tab.key }
            onClick={ () => onTabChange( tab.key ) }
            style={ {
              flex: 1,
              border: 'none',
              background: 'transparent',
              padding: '10px 4px',
              fontSize: 12,
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? C.primary : C.textMuted,
              borderBottom: activeTab === tab.key ? `2px solid ${ C.primary }` : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all .15s',
            } }
          >
            { tab.label }
          </button>
        ) ) }
      </div>

      {/* Lista tour */}
      <div style={ { flex: 1, overflowY: 'auto' } }>
        { loading && (
          <div style={ { padding: 32, textAlign: 'center' } }>
            <div style={ {
              width: 24, height: 24,
              border: `2px solid ${ C.border }`,
              borderTopColor: C.primary,
              borderRadius: '50%',
              animation: 'mt-spin .7s linear infinite',
              margin: '0 auto',
            } } />
          </div>
        ) }

        { !loading && tours.length === 0 && (
          <div style={ { padding: '32px 20px', textAlign: 'center' } }>
            <p style={ { fontSize: 28, marginBottom: 8 } }>🏍️</p>
            <p style={ { fontSize: 13, color: C.textMuted, margin: 0 } }>
              Nessun tour { activeTab !== 'tutti' ? 'in questa categoria' : 'disponibile' } al momento.
            </p>
          </div>
        ) }

        { tours.map( tour => <TourCard key={ tour.id } tour={ tour } /> ) }
      </div>

      {/* Footer — solo desktop */}
      { !mobile && (
        <div style={ {
          padding: '12px 20px',
          borderTop: `1px solid ${ C.border }`,
          textAlign: 'center',
          flexShrink: 0,
        } }>
          <Link to="/login" style={ { fontSize: 12, color: C.primary, textDecoration: 'none' } }>
            Già iscritto? Accedi all'area riservata →
          </Link>
        </div>
      ) }
    </>
  );
}
