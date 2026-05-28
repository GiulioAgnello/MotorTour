/**
 * TourEnrollRequest – Richiesta di iscrizione a un tour specifico.
 *
 * Accessibile solo ai soci approvati (PrivateRoute in App.jsx).
 * Campi richiesti:
 *   - Veicolo: modello moto + targa (obbligatori)
 *   - Passeggero: toggle → se sì, dati completi (nome, nascita, residenza, cellulare)
 *   - Note libere (opzionale)
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';

const INITIAL_FORM = {
  moto_model:       '',
  moto_plate:       '',
  with_passenger:   false,
  pass_full_name:   '',
  pass_birth_place: '',
  pass_birth_date:  '',
  pass_city:        '',
  pass_address:     '',
  pass_phone:       '',
  notes:            '',
};

export default function TourEnrollRequest( { config } ) {
  const { tourId }  = useParams();
  const navigate    = useNavigate();

  const [ tour,        setTour        ] = useState( null );
  const [ form,        setForm        ] = useState( INITIAL_FORM );
  const [ errors,      setErrors      ] = useState( {} );
  const [ loading,     setLoading     ] = useState( false );
  const [ submitError, setSubmitError ] = useState( null );
  const [ success,     setSuccess     ] = useState( false );
  const [ tourLoading, setTourLoading ] = useState( true );

  useEffect( () => {
    api.getTour( tourId )
      .then( t => {
        setTour( t );
        // Applica colori del tour
        document.documentElement.style.setProperty( '--mt-primary',   t.color_primary   || '#6c3de8' );
        document.documentElement.style.setProperty( '--mt-secondary', t.color_secondary || '#1a1a2e' );
      } )
      .catch( () => navigate( '/area-riservata' ) )
      .finally( () => setTourLoading( false ) );
  }, [ tourId ] );

  const update = ( field, value ) => {
    setForm( f => ( { ...f, [ field ]: value } ) );
    setErrors( e => ( { ...e, [ field ]: undefined } ) );
  };

  const validate = () => {
    const err = {};
    if ( ! form.moto_model ) err.moto_model = 'Campo obbligatorio';
    if ( ! form.moto_plate ) err.moto_plate = 'Campo obbligatorio';
    if ( form.with_passenger ) {
      if ( ! form.pass_full_name )   err.pass_full_name   = 'Campo obbligatorio';
      if ( ! form.pass_birth_place ) err.pass_birth_place = 'Campo obbligatorio';
      if ( ! form.pass_birth_date )  err.pass_birth_date  = 'Campo obbligatorio';
      if ( ! form.pass_phone )       err.pass_phone       = 'Campo obbligatorio';
    }
    return err;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const err = validate();
    if ( Object.keys( err ).length ) { setErrors( err ); return; }

    setLoading( true );
    setSubmitError( null );

    try {
      await api.enrollTour( tourId, {
        moto_model:       form.moto_model,
        moto_plate:       form.moto_plate.toUpperCase(),
        with_passenger:   form.with_passenger,
        pass_full_name:   form.pass_full_name,
        pass_birth_place: form.pass_birth_place,
        pass_birth_date:  form.pass_birth_date,
        pass_city:        form.pass_city,
        pass_address:     form.pass_address,
        pass_phone:       form.pass_phone,
        notes:            form.notes,
      } );
      setSuccess( true );
      window.scrollTo( { top: 0, behavior: 'smooth' } );
    } catch ( err ) {
      setSubmitError( err.message );
    } finally {
      setLoading( false );
    }
  };

  if ( tourLoading ) return <div className="motortour-app-root"><div className="mt-spinner" /></div>;

  if ( success ) {
    return (
      <div className="motortour-app-root">
        <header className="mt-tour-header">
          <div className="mt-container">
            { tour?.logo_url && <img src={ tour.logo_url } alt={ tour.title } style={ { height: 48, marginBottom: 8, borderRadius: 8 } } /> }
            <h1>{ tour?.title }</h1>
          </div>
        </header>
        <main className="mt-container mt-page" style={ { textAlign: 'center', paddingTop: 48 } }>
          <div style={ { fontSize: 64, marginBottom: 16 } }>🏍️</div>
          <h2>Richiesta inviata!</h2>
          <p style={ { color: 'var(--mt-text-muted)', fontSize: 15, maxWidth: 400, margin: '0 auto 32px' } }>
            La tua richiesta per <strong>{ tour?.title }</strong> è stata inviata.<br />
            Lo staff la verificherà e ti confermerà via email.
          </p>
          <Link to="/area-riservata" className="mt-btn mt-btn-primary">
            Torna alla dashboard →
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="motortour-app-root">

      {/* Header tour */}
      <header className="mt-tour-header">
        <div className="mt-container">
          { tour?.logo_url && (
            <img src={ tour.logo_url } alt={ tour.title }
                 style={ { height: 48, marginBottom: 8, borderRadius: 8 } } />
          ) }
          <h1>{ tour?.title }</h1>
          { tour?.date && (
            <p className="mt-tour-date">
              📅 { new Date( tour.date ).toLocaleDateString( 'it-IT', { day: 'numeric', month: 'long', year: 'numeric' } ) }
            </p>
          ) }
        </div>
      </header>

      <main className="mt-container mt-page">

        {/* Breadcrumb */}
        <p style={ { fontSize: 13, color: 'var(--mt-text-muted)', marginBottom: 8 } }>
          <Link to="/area-riservata" style={ { color: 'var(--mt-primary)' } }>← Dashboard</Link>
          {' '}/ Richiesta iscrizione
        </p>

        <div className="mt-card">
          <div className="mt-card-body">
            <h2 style={ { marginBottom: 4 } }>Richiesta di partecipazione</h2>
            <p style={ { color: 'var(--mt-text-muted)', fontSize: 14, marginBottom: 24 } }>
              Indica il veicolo con cui parteciperai e, se applicabile, i dati del passeggero.
              La richiesta verrà esaminata dallo staff.
            </p>

            { submitError && <div className="mt-alert mt-alert-error">{ submitError }</div> }

            <form onSubmit={ handleSubmit } noValidate>

              {/* ── Veicolo ── */}
              <h3 style={ { fontSize: 15, marginBottom: 12, color: 'var(--mt-secondary)' } }>🏍️ Veicolo</h3>

              <div className="mt-form-row">
                <Field label="Modello moto" required error={ errors.moto_model }>
                  <input
                    className={ `mt-input ${ errors.moto_model ? 'error' : '' }` }
                    value={ form.moto_model }
                    onChange={ e => update( 'moto_model', e.target.value ) }
                    placeholder="es. Honda CB500F" />
                </Field>
                <Field label="Targa" required error={ errors.moto_plate }>
                  <input
                    className={ `mt-input ${ errors.moto_plate ? 'error' : '' }` }
                    value={ form.moto_plate }
                    onChange={ e => update( 'moto_plate', e.target.value.toUpperCase() ) }
                    placeholder="es. AB123CD"
                    style={ { textTransform: 'uppercase', letterSpacing: 2 } } />
                </Field>
              </div>

              {/* ── Passeggero ── */}
              <div style={ { borderTop: '1px solid var(--mt-border)', marginTop: 24, paddingTop: 20 } }>
                <h3 style={ { fontSize: 15, marginBottom: 12, color: 'var(--mt-secondary)' } }>👥 Passeggero</h3>

                <div className="mt-checkbox-group" style={ { marginBottom: 20 } }>
                  <input
                    type="checkbox" id="with_passenger"
                    checked={ form.with_passenger }
                    onChange={ e => update( 'with_passenger', e.target.checked ) } />
                  <label htmlFor="with_passenger" style={ { fontSize: 15, fontWeight: 600 } }>
                    Partecipo con un passeggero
                  </label>
                </div>

                { form.with_passenger && (
                  <>
                    <Field label="Nome e Cognome passeggero" required error={ errors.pass_full_name }>
                      <input
                        className={ `mt-input ${ errors.pass_full_name ? 'error' : '' }` }
                        value={ form.pass_full_name }
                        onChange={ e => update( 'pass_full_name', e.target.value ) }
                        placeholder="es. Maria Rossi" />
                    </Field>
                    <div className="mt-form-row">
                      <Field label="Luogo di nascita" required error={ errors.pass_birth_place }>
                        <input
                          className={ `mt-input ${ errors.pass_birth_place ? 'error' : '' }` }
                          value={ form.pass_birth_place }
                          onChange={ e => update( 'pass_birth_place', e.target.value ) } />
                      </Field>
                      <Field label="Data di nascita" required error={ errors.pass_birth_date }>
                        <input
                          className={ `mt-input ${ errors.pass_birth_date ? 'error' : '' }` }
                          type="date" value={ form.pass_birth_date }
                          onChange={ e => update( 'pass_birth_date', e.target.value ) } />
                      </Field>
                    </div>
                    <div className="mt-form-row">
                      <Field label="Comune di residenza" error={ errors.pass_city }>
                        <input className="mt-input" value={ form.pass_city }
                               onChange={ e => update( 'pass_city', e.target.value ) } />
                      </Field>
                      <Field label="Cellulare" required error={ errors.pass_phone }>
                        <input
                          className={ `mt-input ${ errors.pass_phone ? 'error' : '' }` }
                          type="tel" value={ form.pass_phone }
                          onChange={ e => update( 'pass_phone', e.target.value ) }
                          placeholder="+39 333 000 0000" />
                      </Field>
                    </div>
                    <Field label="Indirizzo" error={ errors.pass_address }>
                      <input className="mt-input" value={ form.pass_address }
                             onChange={ e => update( 'pass_address', e.target.value ) } />
                    </Field>
                  </>
                ) }
              </div>

              {/* ── Note ── */}
              <div style={ { borderTop: '1px solid var(--mt-border)', marginTop: 24, paddingTop: 20 } }>
                <Field label="Note (opzionale)" error={ errors.notes }>
                  <textarea
                    className="mt-input"
                    rows={ 3 }
                    value={ form.notes }
                    onChange={ e => update( 'notes', e.target.value ) }
                    placeholder="Eventuali informazioni aggiuntive per lo staff..."
                    style={ { resize: 'vertical' } } />
                </Field>
              </div>

              {/* ── Azioni ── */}
              <div style={ { display: 'flex', gap: 12, marginTop: 24, justifyContent: 'space-between' } }>
                <Link to="/area-riservata" className="mt-btn mt-btn-outline">
                  ← Annulla
                </Link>
                <button type="submit" className="mt-btn mt-btn-primary" disabled={ loading }>
                  { loading ? 'Invio in corso...' : '📤 Invia richiesta' }
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Helper: Field wrapper ─────────────────────────────────────────────────────
function Field( { label, required, error, children } ) {
  return (
    <div className="mt-form-group">
      <label className="mt-label">
        { label }{ required && <span className="required"> *</span> }
      </label>
      { children }
      { error && <p className="mt-field-error">{ error }</p> }
    </div>
  );
}
