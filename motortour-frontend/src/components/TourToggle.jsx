import React from 'react';
import { C } from '../styles/theme';
import Icon from './Icons';

export default function TourToggle( { open, onToggle, count } ) {
  return (
    <div style={ { padding: '10px 16px', background: '#f0ebfd', borderBottom: '1px solid #d8cef7' } }>
      <button
        onClick={ onToggle }
        style={ {
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: open ? C.dark : C.primary,
          border: 'none',
          borderRadius: 50,
          padding: '10px 18px',
          cursor: 'pointer',
          transition: 'background .2s',
        } }
        aria-expanded={ open }
        aria-label="Mostra/nascondi tour in programma"
      >
        <div style={ { display: 'flex', alignItems: 'center', gap: 8 } }>
          <span style={ { fontSize: 14, color: '#fff' } }>🏍️</span>
          <span style={ { fontSize: 13, color: '#fff', fontWeight: 600 } }>Tour in programma</span>
        </div>
        <div style={ { display: 'flex', alignItems: 'center', gap: 8 } }>
          { count > 0 && (
            <span style={ {
              background: '#fff',
              color: C.primary,
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 12,
            } }>
              { count } { count === 1 ? 'aperto' : 'aperti' }
            </span>
          ) }
          <span style={ { color: '#fff' } }>
            { open ? <Icon.chevronUp /> : <Icon.chevronDown /> }
          </span>
        </div>
      </button>
    </div>
  );
}
