/**
 * Register – Form iscrizione multi-step (6 step).
 *
 * Step 1: Account (email + password)
 * Step 2: Dati Pilota
 * Step 3: Moto
 * Step 4: Passeggero (opzionale)
 * Step 5: Documenti (patente obbligatoria + allegato extra opzionale)
 * Step 6: Consensi (liberatoria + privacy) + riepilogo + invio
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';

const STEPS = [
  { label: 'Account'    },
  { label: 'Pilota'     },
  { label: 'Moto'       },
  { label: 'Passeggero' },
  { label: 'Documenti'  },
  { label: 'Consensi'   },
];

const INITIAL_FORM = {
  // Step 1
  email: '', password: '', passwordConfirm: '',
  // Step 2
  pilot_first_name: '', pilot_last_name: '',
  pilot_birth_place: '', pilot_birth_date: '',
  pilot_city: '', pilot_address: '', pilot_zip: '', pilot_phone: '',
  // Step 3
  moto_model: '', moto_plate: '',
  // Step 4
  has_passenger: false,
  passenger_full_name: '', passenger_birth_place: '', passenger_birth_date: '',
  passenger_city: '', passenger_address: '', passenger_phone: '',
  // Step 5 (files gestiti separatamente)
  // Step 6
  consent_waiver: false, consent_privacy: false,
};

export default function Register( { config } ) {
  const { tourId }         = useParams();
  const navigate           = useNavigate();
  const [ tour,   setTour ]   = useState( null );
  const [ step,   setStep ]   = useState( 0 );
  const [ form,   setForm ]   = useState( INITIAL_FORM );
  const [ errors, setErrors ] = useState( {} );
  const [ files,  setFiles ]  = useState( { license: null, extra: null } );
  const [ loading, setLoading ] = useState( false );
  const [ submitError, setSubmitError ] = useState( null );
  const [ success, setSuccess ] = useState( false );

  useEffect( () => {
    api.getTour( tourId )
      .then( t => {
        setTour( t );
        // Applica colori del tour
        document.documentElement.style.setProperty( '--mt-primary',   t.color_primary   || '#6c3de8' );
        document.documentElement.style.setProperty( '--mt-secondary', t.color_secondary || '#1a1a2e' );
      } )
      .catch( () => navigate( '/' ) );
  }, [ tourId ] );

  const update = ( field, value ) => {
    setForm( f => ( { ...f, [ field ]: value } ) );
    setErrors( e => ( { ...e, [ field ]: undefined } ) );
  };

  // ── Validazione per step ──────────────────────────────────────────────────
  const validate = ( stepIndex ) => {
    const err = {};
    if ( stepIndex === 0 ) {
      if ( ! form.email )              err.email           = 'Email obbligatoria';
      else if ( ! /\S+@\S+\.\S+/.test( form.email ) ) err.email = 'Email non valida';
      if ( ! form.password )           err.password        = 'Password obbligatoria';
      else if ( form.password.length < 8 ) err.password    = 'Minimo 8 caratteri';
      if ( form.password !== form.passwordConfirm ) err.passwordConfirm = 'Le password non coincidono';
    }
    if ( stepIndex === 1 ) {
      [ 'pilot_first_name', 'pilot_last_name', 'pilot_birth_place', 'pilot_birth_date',
        'pilot_city', 'pilot_address', 'pilot_zip', 'pilot_phone' ].forEach( f => {
        if ( ! form[ f ] ) err[ f ] = 'Campo obbligatorio';
      } );
    }
    if ( stepIndex === 2 ) {
      if ( ! form.moto_model ) err.moto_model = 'Campo obbligatorio';
      if ( ! form.moto_plate ) err.moto_plate = 'Campo obbligatorio';
    }
    if ( stepIndex === 3 && form.has_passenger ) {
      [ 'passenger_full_name', 'passenger_birth_place', 'passenger_birth_date', 'passenger_phone' ].forEach( f => {
        if ( ! form[ f ] ) err[ f ] = 'Campo obbligatorio';
      } );
    }
    if ( stepIndex === 4 ) {
      if ( ! files.license ) err.license = 'Patente obbligatoria';
    }
    if ( stepIndex === 5 ) {
      if ( ! form.consent_waiver ) err.consent_waiver = 'Devi accettare la liberatoria';
      if ( ! form.consent_privacy ) err.consent_privacy = 'Devi accettare la privacy';
    }
    return err;
  };

  const nextStep = () => {
    const err = validate( step );
    if ( Object.keys( err ).length ) { setErrors( err ); return; }
    setStep( s => Math.min( s + 1, STEPS.length - 1 ) );
    window.scrollTo( { top: 0, behavior: 'smooth' } );
  };

  const prevStep = () => {
    setStep( s => Math.max( s - 1, 0 ) );
    window.scrollTo( { top: 0, behavior: 'smooth' } );
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validate( 5 );
    if ( Object.keys( err ).length ) { setErrors( err ); return; }

    setLoading( true );
    setSubmitError( null );

    const formData = new FormData();
    formData.append( 'tour_id', tourId );

    // Tutti i campi testo
    const textFields = [
      'email', 'password',
      'pilot_first_name', 'pilot_last_name', 'pilot_birth_place', 'pilot_birth_date',
      'pilot_city', 'pilot_address', 'pilot_zip', 'pilot_phone',
      'moto_model', 'moto_plate',
      'passenger_full_name', 'passenger_birth_place', 'passenger_birth_date',
      'passenger_city', 'passenger_address', 'passenger_phone',
    ];
    textFields.forEach( f => formData.append( f, form[ f ] || '' ) );
    formData.append( 'consent_waiver',  form.consent_waiver  ? '1' : '0' );
    formData.append( 'consent_privacy', form.consent_privacy ? '1' : '0' );

    // Files
    if ( files.license ) formData.append( 'license_file', files.license );
    if ( files.extra )   formData.append( 'extra_file',   files.extra );

    try {
      await api.submitRegistration( formData );
      setSuccess( true );
      window.scrollTo( { top: 0, behavior: 'smooth' } );
    } catch ( e ) {
      setSubmitError( e.message );
    } finally {
      setLoading( false );
    }
  };

  if ( ! tour ) return <div className="motortour-app-root"><div className="mt-spinner" /></div>;

  if ( success ) return <SuccessScreen tour={ tour } />;

  return (
    <div className="motortour-app-root">

      {/* Header tour */}
      <header className="mt-tour-header">
        <div className="mt-container">
          { tour.logo_url && (
            <img src={ tour.logo_url } alt={ tour.title }
                 style={ { height: 48, marginBottom: 8, borderRadius: 8 } } />
          ) }
          <h1>{ tour.title }</h1>
          { tour.date && (
            <p className="mt-tour-date">
              📅 { new Date( tour.date ).toLocaleDateString( 'it-IT', { day: 'numeric', month: 'long', year: 'numeric' } ) }
            </p>
          ) }
        </div>
      </header>

      <main className="mt-container mt-page">

        {/* Step indicator */}
        <div className="mt-steps" aria-label="Passaggi iscrizione">
          { STEPS.map( ( s, i ) => (
            <div
              key={ i }
              className={ `mt-step ${ i < step ? 'done' : i === step ? 'active' : '' }` }
            >
              { i > 0 && (
                <div style={ {
                  position: 'absolute', top: 16, right: '50%', left: 0,
                  height: 2,
                  background: i <= step ? 'var(--mt-primary)' : 'var(--mt-border)',
                } } />
              ) }
              <div className="mt-step-dot">
                { i < step ? '✓' : i + 1 }
              </div>
              <span className="mt-step-label">{ s.label }</span>
            </div>
          ) ) }
        </div>

        {/* Step content */}
        <div className="mt-card">
          <div className="mt-card-body">

            { submitError && <div className="mt-alert mt-alert-error">{ submitError }</div> }

            { step === 0 && <StepAccount  form={ form } update={ update } errors={ errors } /> }
            { step === 1 && <StepPilot    form={ form } update={ update } errors={ errors } /> }
            { step === 2 && <StepMoto     form={ form } update={ update } errors={ errors } /> }
            { step === 3 && <StepPassenger form={ form } update={ update } errors={ errors } /> }
            { step === 4 && <StepDocuments files={ files } setFiles={ setFiles } errors={ errors } /> }
            { step === 5 && <StepConsents  form={ form } update={ update } errors={ errors } tour={ tour } /> }

            {/* Navigation */}
            <div style={ { display: 'flex', gap: 12, marginTop: 24, justifyContent: step === 0 ? 'flex-end' : 'space-between' } }>
              { step > 0 && (
                <button className="mt-btn mt-btn-outline" onClick={ prevStep } disabled={ loading }>
                  ← Indietro
                </button>
              ) }
              { step < STEPS.length - 1 ? (
                <button className="mt-btn mt-btn-primary" onClick={ nextStep }>
                  Continua →
                </button>
              ) : (
                <button className="mt-btn mt-btn-primary" onClick={ handleSubmit } disabled={ loading }>
                  { loading ? 'Invio in corso...' : '✅ Invia iscrizione' }
                </button>
              ) }
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Step 1: Account ───────────────────────────────────────────────────────────
function StepAccount( { form, update, errors } ) {
  return (
    <>
      <h2 style={ { marginBottom: 4 } }>Account</h2>
      <p style={ { color: 'var(--mt-text-muted)', fontSize: 14, marginBottom: 20 } }>
        Crea le tue credenziali di accesso. Le userai per entrare nell'area riservata del tour una volta approvata l'iscrizione.
      </p>
      <Field label="Email" required error={ errors.email }>
        <input className={ `mt-input ${ errors.email ? 'error' : '' }` }
               type="email" value={ form.email }
               onChange={ e => update( 'email', e.target.value ) }
               placeholder="la-tua@email.it" autoComplete="email" />
      </Field>
      <div className="mt-form-row">
        <Field label="Password" required error={ errors.password }>
          <input className={ `mt-input ${ errors.password ? 'error' : '' }` }
                 type="password" value={ form.password }
                 onChange={ e => update( 'password', e.target.value ) }
                 placeholder="Minimo 8 caratteri" />
        </Field>
        <Field label="Conferma password" required error={ errors.passwordConfirm }>
          <input className={ `mt-input ${ errors.passwordConfirm ? 'error' : '' }` }
                 type="password" value={ form.passwordConfirm }
                 onChange={ e => update( 'passwordConfirm', e.target.value ) }
                 placeholder="Ripeti la password" />
        </Field>
      </div>
    </>
  );
}

// ── Step 2: Pilota ────────────────────────────────────────────────────────────
function StepPilot( { form, update, errors } ) {
  return (
    <>
      <h2 style={ { marginBottom: 4 } }>Dati Pilota</h2>
      <p style={ { color: 'var(--mt-text-muted)', fontSize: 14, marginBottom: 20 } }>
        Dati anagrafici del pilota (chi guida la moto).
      </p>
      <div className="mt-form-row">
        <Field label="Nome" required error={ errors.pilot_first_name }>
          <input className={ `mt-input ${ errors.pilot_first_name ? 'error' : '' }` }
                 value={ form.pilot_first_name }
                 onChange={ e => update( 'pilot_first_name', e.target.value ) } />
        </Field>
        <Field label="Cognome" required error={ errors.pilot_last_name }>
          <input className={ `mt-input ${ errors.pilot_last_name ? 'error' : '' }` }
                 value={ form.pilot_last_name }
                 onChange={ e => update( 'pilot_last_name', e.target.value ) } />
        </Field>
      </div>
      <div className="mt-form-row">
        <Field label="Luogo di nascita" required error={ errors.pilot_birth_place }>
          <input className={ `mt-input ${ errors.pilot_birth_place ? 'error' : '' }` }
                 value={ form.pilot_birth_place }
                 onChange={ e => update( 'pilot_birth_place', e.target.value ) }
                 placeholder="es. Lecce" />
        </Field>
        <Field label="Data di nascita" required error={ errors.pilot_birth_date }>
          <input className={ `mt-input ${ errors.pilot_birth_date ? 'error' : '' }` }
                 type="date" value={ form.pilot_birth_date }
                 onChange={ e => update( 'pilot_birth_date', e.target.value ) } />
        </Field>
      </div>
      <Field label="Comune di residenza" required error={ errors.pilot_city }>
        <input className={ `mt-input ${ errors.pilot_city ? 'error' : '' }` }
               value={ form.pilot_city }
               onChange={ e => update( 'pilot_city', e.target.value ) }
               placeholder="es. Lecce" />
      </Field>
      <div className="mt-form-row">
        <Field label="Indirizzo" required error={ errors.pilot_address } style={ { gridColumn: '1' } }>
          <input className={ `mt-input ${ errors.pilot_address ? 'error' : '' }` }
                 value={ form.pilot_address }
                 onChange={ e => update( 'pilot_address', e.target.value ) }
                 placeholder="Via Roma 1" />
        </Field>
        <Field label="CAP" required error={ errors.pilot_zip }>
          <input className={ `mt-input ${ errors.pilot_zip ? 'error' : '' }` }
                 value={ form.pilot_zip } maxLength={ 5 }
                 onChange={ e => update( 'pilot_zip', e.target.value ) }
                 placeholder="73100" />
        </Field>
      </div>
      <Field label="Cellulare" required error={ errors.pilot_phone }>
        <input className={ `mt-input ${ errors.pilot_phone ? 'error' : '' }` }
               type="tel" value={ form.pilot_phone }
               onChange={ e => update( 'pilot_phone', e.target.value ) }
               placeholder="+39 333 000 0000" />
      </Field>
    </>
  );
}

// ── Step 3: Moto ──────────────────────────────────────────────────────────────
function StepMoto( { form, update, errors } ) {
  return (
    <>
      <h2 style={ { marginBottom: 4 } }>Dati Moto</h2>
      <p style={ { color: 'var(--mt-text-muted)', fontSize: 14, marginBottom: 20 } }>
        Informazioni sul mezzo con cui parteciperai al tour.
      </p>
      <Field label="Modello moto" required error={ errors.moto_model }>
        <input className={ `mt-input ${ errors.moto_model ? 'error' : '' }` }
               value={ form.moto_model }
               onChange={ e => update( 'moto_model', e.target.value ) }
               placeholder="es. Honda CB500F" />
      </Field>
      <Field label="Targa" required error={ errors.moto_plate }>
        <input className={ `mt-input ${ errors.moto_plate ? 'error' : '' }` }
               value={ form.moto_plate }
               onChange={ e => update( 'moto_plate', e.target.value.toUpperCase() ) }
               placeholder="es. AB123CD"
               style={ { textTransform: 'uppercase', letterSpacing: 2 } } />
      </Field>
    </>
  );
}

// ── Step 4: Passeggero ────────────────────────────────────────────────────────
function StepPassenger( { form, update, errors } ) {
  return (
    <>
      <h2 style={ { marginBottom: 4 } }>Passeggero</h2>
      <p style={ { color: 'var(--mt-text-muted)', fontSize: 14, marginBottom: 20 } }>
        Se porterai un passeggero, inserisci i suoi dati. Altrimenti procedi oltre.
      </p>

      <div className="mt-checkbox-group" style={ { marginBottom: 20 } }>
        <input
          type="checkbox" id="has_passenger"
          checked={ form.has_passenger }
          onChange={ e => update( 'has_passenger', e.target.checked ) }
        />
        <label htmlFor="has_passenger" style={ { fontSize: 15, color: 'var(--mt-text)', fontWeight: 600 } }>
          Partecipo con un passeggero
        </label>
      </div>

      { form.has_passenger && (
        <>
          <Field label="Nome e Cognome passeggero" required error={ errors.passenger_full_name }>
            <input className={ `mt-input ${ errors.passenger_full_name ? 'error' : '' }` }
                   value={ form.passenger_full_name }
                   onChange={ e => update( 'passenger_full_name', e.target.value ) }
                   placeholder="es. Maria Rossi" />
          </Field>
          <div className="mt-form-row">
            <Field label="Luogo di nascita" required error={ errors.passenger_birth_place }>
              <input className={ `mt-input ${ errors.passenger_birth_place ? 'error' : '' }` }
                     value={ form.passenger_birth_place }
                     onChange={ e => update( 'passenger_birth_place', e.target.value ) } />
            </Field>
            <Field label="Data di nascita" required error={ errors.passenger_birth_date }>
              <input className={ `mt-input ${ errors.passenger_birth_date ? 'error' : '' }` }
                     type="date" value={ form.passenger_birth_date }
                     onChange={ e => update( 'passenger_birth_date', e.target.value ) } />
            </Field>
          </div>
          <div className="mt-form-row">
            <Field label="Comune di residenza" error={ errors.passenger_city }>
              <input className="mt-input" value={ form.passenger_city }
                     onChange={ e => update( 'passenger_city', e.target.value ) } />
            </Field>
            <Field label="Cellulare" required error={ errors.passenger_phone }>
              <input className={ `mt-input ${ errors.passenger_phone ? 'error' : '' }` }
                     type="tel" value={ form.passenger_phone }
                     onChange={ e => update( 'passenger_phone', e.target.value ) } />
            </Field>
          </div>
          <Field label="Indirizzo" error={ errors.passenger_address }>
            <input className="mt-input" value={ form.passenger_address }
                   onChange={ e => update( 'passenger_address', e.target.value ) } />
          </Field>
        </>
      ) }
    </>
  );
}

// ── Step 5: Documenti ─────────────────────────────────────────────────────────
function StepDocuments( { files, setFiles, errors } ) {
  return (
    <>
      <h2 style={ { marginBottom: 4 } }>Documenti</h2>
      <p style={ { color: 'var(--mt-text-muted)', fontSize: 14, marginBottom: 20 } }>
        Carica i documenti richiesti. Formati accettati: JPG, PNG, PDF. Max 10 MB.
      </p>

      <div className="mt-form-group">
        <label className="mt-label">Patente di guida <span className="required">*</span></label>
        <FileDropzone
          file={ files.license }
          onChange={ f => setFiles( s => ( { ...s, license: f } ) ) }
          accept="image/jpeg,image/png,image/webp,application/pdf"
          hint="Foto o scansione della patente"
          error={ errors.license }
        />
      </div>

      <div className="mt-form-group" style={ { marginTop: 8 } }>
        <label className="mt-label">Allegato aggiuntivo <span style={ { color: 'var(--mt-text-muted)', fontWeight: 400 } }>(opzionale)</span></label>
        <FileDropzone
          file={ files.extra }
          onChange={ f => setFiles( s => ( { ...s, extra: f } ) ) }
          accept="image/jpeg,image/png,image/webp,application/pdf"
          hint="Eventuali altri documenti richiesti dall'organizzazione"
        />
      </div>
    </>
  );
}

function FileDropzone( { file, onChange, accept, hint, error } ) {
  const inputRef   = useRef();
  const [ drag, setDrag ] = useState( false );

  const handleFile = f => {
    if ( f && f.size <= 10 * 1024 * 1024 ) onChange( f );
    else if ( f ) alert( 'File troppo grande. Max 10 MB.' );
  };

  return (
    <div>
      <div
        className={ `mt-file-upload ${ drag ? 'drag-over' : '' } ${ error ? 'error' : '' }` }
        style={ { borderColor: error ? 'var(--mt-accent)' : undefined, position: 'relative' } }
        onClick={ () => inputRef.current?.click() }
        onDragOver={ e => { e.preventDefault(); setDrag( true ); } }
        onDragLeave={ () => setDrag( false ) }
        onDrop={ e => { e.preventDefault(); setDrag( false ); handleFile( e.dataTransfer.files[0] ); } }
      >
        <input
          ref={ inputRef } type="file" accept={ accept }
          style={ { display: 'none' } }
          onChange={ e => handleFile( e.target.files[0] ) }
        />
        <div className="mt-file-upload-icon">{ file ? '✅' : '📎' }</div>
        <div className="mt-file-upload-text">
          { file ? 'File caricato' : 'Tocca o trascina il file qui' }
        </div>
        { file && <div className="mt-file-upload-name">{ file.name }</div> }
        { ! file && <div className="mt-file-upload-hint">{ hint }</div> }
      </div>
      { error && <p className="mt-field-error">{ error }</p> }
    </div>
  );
}

// ── Step 6: Consensi ──────────────────────────────────────────────────────────
function StepConsents( { form, update, errors, tour } ) {
  const WAIVER_TEXT = `La partecipazione all'evento obbliga il Partecipante ad osservare tutte le regole di buona condotta e di rispetto della circolazione stradale, impegnandosi a mantenere un comportamento prudente ed una guida del proprio mezzo in sicurezza per sé e per gli altri. Il partecipante esonera e manleva il "MOTOCLUB SALENTUM TERRAE A.S.D. ed i suoi organizzatori" da ogni responsabilità per danni alla propria persona, a cosa o verso terzi oltre per tutte le cause non menzionate che potranno verificarsi durante l'esecuzione dell'evento.`;

  const PRIVACY_TEXT = `Con la sottoscrizione si autorizza l'organizzatore dell'evento al trattamento dei dati personali ai sensi dell'art. 13 del Regolamento UE 2016/679 (GDPR), nel rispetto dei criteri di correttezza e trasparenza, tutelando la riservatezza e i diritti del partecipante e per fini leciti. Il trattamento sarà effettuato anche con l'ausilio di mezzi informatici per tutte le finalità strettamente connesse alla realizzazione dell'evento.`;

  return (
    <>
      <h2 style={ { marginBottom: 4 } }>Consensi obbligatori</h2>
      <p style={ { color: 'var(--mt-text-muted)', fontSize: 14, marginBottom: 20 } }>
        Leggi attentamente e accetta le condizioni per completare l'iscrizione.
      </p>

      {/* Liberatoria */}
      <div style={ {
        background: '#f8f8f8',
        borderRadius: 8,
        padding: '14px 16px',
        marginBottom: 12,
        fontSize: 13,
        color: '#444',
        lineHeight: 1.6,
        maxHeight: 120,
        overflow: 'auto',
        border: '1px solid var(--mt-border)',
      } }>
        <strong>Condizioni generali e liberatoria</strong><br />
        { WAIVER_TEXT }
      </div>

      <div className={ `mt-checkbox-group ${ errors.consent_waiver ? 'error' : '' }` } style={ { marginBottom: 20 } }>
        <input
          type="checkbox" id="consent_waiver"
          checked={ form.consent_waiver }
          onChange={ e => update( 'consent_waiver', e.target.checked ) }
        />
        <label htmlFor="consent_waiver">
          <strong>Accetto le condizioni generali e la liberatoria</strong> — dichiaro di aver letto e compreso il testo sopra. <span className="required">*</span>
        </label>
      </div>
      { errors.consent_waiver && <p className="mt-field-error" style={ { marginTop: -16, marginBottom: 12 } }>{ errors.consent_waiver }</p> }

      {/* Privacy */}
      <div style={ {
        background: '#f8f8f8',
        borderRadius: 8,
        padding: '14px 16px',
        marginBottom: 12,
        fontSize: 13,
        color: '#444',
        lineHeight: 1.6,
        maxHeight: 120,
        overflow: 'auto',
        border: '1px solid var(--mt-border)',
      } }>
        <strong>Informativa sulla privacy (GDPR)</strong><br />
        { PRIVACY_TEXT }
      </div>

      <div className={ `mt-checkbox-group ${ errors.consent_privacy ? 'error' : '' }` }>
        <input
          type="checkbox" id="consent_privacy"
          checked={ form.consent_privacy }
          onChange={ e => update( 'consent_privacy', e.target.checked ) }
        />
        <label htmlFor="consent_privacy">
          <strong>Acconsento al trattamento dei dati personali</strong> ai sensi del GDPR. <span className="required">*</span>
        </label>
      </div>
      { errors.consent_privacy && <p className="mt-field-error" style={ { marginTop: 4 } }>{ errors.consent_privacy }</p> }

      <div className="mt-alert mt-alert-info" style={ { marginTop: 20 } }>
        ℹ️ Dopo l'invio riceverai una email di conferma. L'iscrizione diventa attiva solo dopo la verifica manuale dei documenti da parte dello staff.
      </div>
    </>
  );
}

// ── Schermata successo ────────────────────────────────────────────────────────
function SuccessScreen( { tour } ) {
  return (
    <div className="motortour-app-root">
      <header className="mt-tour-header">
        <div className="mt-container">
          <h1>{ tour.title }</h1>
        </div>
      </header>
      <main className="mt-container mt-page" style={ { textAlign: 'center', paddingTop: 48 } }>
        <div style={ { fontSize: 64, marginBottom: 16 } }>🎉</div>
        <h2>Iscrizione inviata!</h2>
        <p style={ { color: 'var(--mt-text-muted)', fontSize: 15, maxWidth: 420, margin: '0 auto 24px' } }>
          Abbiamo ricevuto la tua iscrizione per <strong>{ tour.title }</strong>.<br />
          Controlla la tua email — ti abbiamo inviato una conferma.<br />
          Lo staff verificherà i documenti e ti avviserà appena l'iscrizione sarà attivata.
        </p>
        <Link to="/login" className="mt-btn mt-btn-primary">
          Vai al login per controllare lo stato →
        </Link>
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

// (imports already at top via destructuring)
