import React from 'react';
import { Link } from 'react-router-dom';
import { C } from '../styles/theme';

const STATUS_MAP = {
  open:     { label: 'Iscrizioni aperte', bg: '#d4edda', color: '#155724' },
  closed:   { label: 'Chiuso',            bg: '#f8d7da', color: '#721c24' },
  archived: { label: 'Concluso',          bg: '#e8e8ec', color: '#555'    },
  draft:    { label: 'In arrivo',         bg: '#fff3cd', color: '#856404' },
};

export default function TourCard( { tour } ) {
  const st = STATUS_MAP[ tour.status ] || STATUS_MAP.draft;

  const dateStr = tour.date
    ? new Date( tour.date ).toLocaleDateString( 'it-IT', { day: 'numeric', month: 'short', year: 'numeric' } )
    : null;

  const deadlineStr = tour.deadline
    ? new Date( tour.deadline ).toLocaleDateString( 'it-IT', { day: 'numeric', month: 'short' } )
    : null;

  return (
    <div
      style={ {
        padding: '14px 20px',
        borderBottom: `1px solid ${ C.border }`,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        transition: 'background .15s',
      } }
      onMouseEnter={ e => e.currentTarget.style.background = '#faf8ff' }
      onMouseLeave={ e => e.currentTarget.style.background = 'transparent' }
    >
      {/* Accent bar */}
      <div style={ {
        width: 3,
        borderRadius: 2,
        background: tour.color_primary || C.primary,
        alignSelf: 'stretch',
        flexShrink: 0,
      } } />

      <div style={ { flex: 1, minWidth: 0 } }>
        {/* Badge + charity */}
        <div style={ { display: 'flex', gap: 4, marginBottom: 5, flexWrap: 'wrap' } }>
          <span style={ {
            fontSize: 10, fontWeight: 600, padding: '2px 8px',
            borderRadius: 12, background: st.bg, color: st.color,
          } }>
            { st.label }
          </span>
          { tour.charity && (
            <span style={ { fontSize: 10, padding: '2px 8px', borderRadius: 12, background: '#fff3e0', color: '#e65100' } }>
              🤝 Benefico
            </span>
          ) }
        </div>

        {/* Titolo */}
        <p style={ {
          margin: 0,
          fontSize: 13,
          fontWeight: 600,
          color: C.dark,
          lineHeight: 1.3,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        } }>
          { tour.title }
        </p>

        {/* Meta */}
        <div style={ { marginTop: 5, display: 'flex', flexDirection: 'column', gap: 2 } }>
          { dateStr && <span style={ { fontSize: 11, color: C.textMuted } }>📅 { dateStr }</span> }
          { tour.meeting_point && <span style={ { fontSize: 11, color: C.textMuted } }>📍 { tour.meeting_point }</span> }
          { deadlineStr && tour.status === 'open' && (
            <span style={ { fontSize: 11, color: '#856404' } }>⏰ Scade il { deadlineStr }</span>
          ) }
        </div>

        {/* CTA */}
        { tour.status === 'open' && (
          <Link
            to={ `/iscriviti/${ tour.id }` }
            style={ {
              display: 'inline-block',
              marginTop: 10,
              padding: '6px 14px',
              background: tour.color_primary || C.primary,
              color: '#fff',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
            } }
          >
            Iscriviti →
          </Link>
        ) }
      </div>
    </div>
  );
}
