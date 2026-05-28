import React from 'react';
import { C } from '../styles/theme';

export default function Step( { num, text } ) {
  // Separa "Titolo — descrizione" se c'è il trattino
  const parts = text.split( ' — ' );
  const title = parts[0];
  const desc  = parts[1];

  return (
    <div style={ { display: 'flex', gap: 14, alignItems: 'flex-start' } }>
      <div style={ {
        width: 28, height: 28,
        borderRadius: '50%',
        background: C.primary,
        color: '#fff',
        fontSize: 12,
        fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
      } }>
        { num }
      </div>
      <div>
        <p style={ { margin: 0, fontSize: 14, fontWeight: 600, color: C.dark } }>{ title }</p>
        { desc && (
          <p style={ { margin: '2px 0 0', fontSize: 13, color: C.textMuted, lineHeight: 1.5 } }>{ desc }</p>
        ) }
      </div>
    </div>
  );
}
