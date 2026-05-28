import React from 'react';
import { Link } from 'react-router-dom';
import { C } from '../styles/theme';
import Icon from './Icons';

export default function Navbar( { landing, isLoggedIn } ) {
  return (
    <nav style={ {
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: C.surface,
      borderBottom: `1px solid ${ C.border }`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      height: 56,
    } }>

      {/* Logo + nome */}
      <div style={ { display: 'flex', alignItems: 'center', gap: 10 } }>
        { landing.logo_url ? (
          <img src={ landing.logo_url } alt="Logo" style={ { height: 32, width: 'auto' } } />
        ) : (
          <div style={ {
            width: 32, height: 32,
            background: C.dark,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
          } }>
            <Icon.moto />
          </div>
        ) }
        <div>
          <span style={ { fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', lineHeight: 1.2 } }>
            Motoclub Salentum Terrae
          </span>
          <span style={ { fontSize: 10, color: C.textMuted } }>A.S.D.</span>
        </div>
      </div>

      {/* Nav links + CTA */}
      <div style={ { display: 'flex', gap: 8, alignItems: 'center' } }>
        <a href="#chi-siamo" className="mt-nav-link">Chi siamo</a>
        <a href="#come-funziona" className="mt-nav-link">Come funziona</a>
        { isLoggedIn ? (
          <Link to="/area-riservata" style={ {
            fontSize: 13, padding: '6px 14px',
            background: C.primary, color: '#fff',
            borderRadius: 8, textDecoration: 'none', fontWeight: 500,
          } }>
            La mia area →
          </Link>
        ) : (
          <Link to="/login" style={ {
            fontSize: 13, padding: '6px 14px',
            border: `1.5px solid ${ C.border }`,
            borderRadius: 8, textDecoration: 'none', color: C.dark, fontWeight: 500,
          } }>
            Accedi
          </Link>
        ) }
      </div>
    </nav>
  );
}
