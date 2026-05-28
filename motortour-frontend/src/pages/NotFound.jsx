import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="motortour-app-root">
      <div className="mt-container mt-page" style={ { textAlign: 'center', paddingTop: 64 } }>
        <div style={ { fontSize: 64, marginBottom: 16 } }>🏍️</div>
        <h1>404 – Pagina non trovata</h1>
        <p style={ { color: 'var(--mt-text-muted)' } }>La strada che cerchi non esiste.</p>
        <Link to="/" className="mt-btn mt-btn-primary" style={ { marginTop: 16 } }>
          ← Torna alla home
        </Link>
      </div>
    </div>
  );
}
