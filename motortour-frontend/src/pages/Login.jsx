import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../App';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = '/area-riservata';

  const [ form,    setForm    ] = useState( { email: '', password: '' } );
  const [ loading, setLoading ] = useState( false );
  const [ error,   setError   ] = useState( null );

  const handleChange = e => setForm( f => ( { ...f, [ e.target.name ]: e.target.value } ) );

  const handleSubmit = async e => {
    e.preventDefault();
    setError( null );
    setLoading( true );
    try {
      const res = await api.login( form.email, form.password );
      login( res.token, { id: res.user_id, name: res.name, email: res.email } );
      navigate( from, { replace: true } );
    } catch ( err ) {
      setError( err.message );
    } finally {
      setLoading( false );
    }
  };

  return (
    <div className="motortour-app-root">
      <header className="mt-tour-header">
        <div className="mt-container">
          <h1>🔐 Accedi al portale</h1>
          <p style={ { margin: 0, opacity: .85 } }>Motoclub Salentum Terrae A.S.D.</p>
        </div>
      </header>

      <main className="mt-container mt-page" style={ { maxWidth: 440 } }>
        <div className="mt-card">
          <div className="mt-card-body">

            { error && <div className="mt-alert mt-alert-error">{ error }</div> }

            <form onSubmit={ handleSubmit } noValidate>
              <div className="mt-form-group">
                <label className="mt-label" htmlFor="email">Email <span className="required">*</span></label>
                <input
                  id="email" name="email" type="email"
                  className="mt-input"
                  value={ form.email }
                  onChange={ handleChange }
                  autoComplete="email"
                  required
                />
              </div>

              <div className="mt-form-group">
                <label className="mt-label" htmlFor="password">Password <span className="required">*</span></label>
                <input
                  id="password" name="password" type="password"
                  className="mt-input"
                  value={ form.password }
                  onChange={ handleChange }
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="mt-btn mt-btn-primary mt-btn-full"
                disabled={ loading }
                style={ { marginTop: 8 } }
              >
                { loading ? 'Accesso in corso...' : 'Accedi →' }
              </button>
            </form>

            <p style={ { textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--mt-text-muted)' } }>
              Non sei ancora iscritto?{' '}
              <Link to="/" style={ { color: 'var(--mt-primary)', fontWeight: 600 } }>
                Scopri i tour disponibili
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
