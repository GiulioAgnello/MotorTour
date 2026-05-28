import React from 'react';
import { C } from '../styles/theme';

export default function Pillar( { icon, iconColor, title, text } ) {
  return (
    <div style={ {
      background: '#faf8ff',
      border: '1px solid #e8e4f8',
      borderRadius: 12,
      padding: '16px',
      flex: '1 1 140px',
    } }>
      <div style={ { color: iconColor, marginBottom: 10 } }>{ icon }</div>
      <p style={ { margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: C.dark } }>{ title }</p>
      <p style={ { margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.5 } }>{ text }</p>
    </div>
  );
}
