import React from 'react';
import { C } from '../styles/theme';

export function Section( { children, id } ) {
  return (
    <section id={ id } style={ { padding: '32px 24px', borderBottom: `1px solid ${ C.border }` } }>
      { children }
    </section>
  );
}

export function SectionLabel( { children } ) {
  return (
    <p style={ {
      margin: '0 0 14px',
      fontSize: 11,
      fontWeight: 700,
      color: C.primary,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
    } }>
      { children }
    </p>
  );
}
