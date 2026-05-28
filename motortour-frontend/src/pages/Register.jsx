/**
 * Register – Iscrizione base al club (4 step).
 *
 * Step 1: Account (email + password)
 * Step 2: Dati Pilota (dati anagrafici)
 * Step 3: Documenti (patente obbligatoria + allegato extra opzionale)
 * Step 4: Consensi (liberatoria + privacy) + invio
 *
 * Moto e passeggero vengono indicati alla richiesta di ogni singolo tour.
 */
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const STEPS = [
  { label: 'Account'    },
  { label: 'Pilota'     },
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
  // Step 4
  consent_waiver: false, consent_privacy: false,
};

export default function Register( { config } ) {
  const [ step,        setStep        ] = useState( 0 );
  const [ form,        setForm        ] = useState( INITIAL_FORM );
  const [ errors,      setErrors      ] = useState( {} );
  const [ files,       setFiles       ] = useState( { license: null, extra: null } );
  const [ loading,     setLoading     ] = useState( false );
  const [ submitError, setSubmitError ] = useState( null );
  const [ success,     setSuccess     ] = useState( false );

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
      if ( ! files.license ) err.license = 'Patente obbligatoria';
    }
    if ( stepIndex === 3 ) {
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
    const err = validate( 3 );
    if ( Object.keys( err ).length ) { setErrors( err ); return; }

    setLoading( true );
    setSubmitError( null );

    const formData = new FormData();
    const textFields = [
      'email', 'password',
      'pilot_first_name', 'pilot_last_name', 'pilot_birth_place', 'pilot_birth_date',
      'pilot_city', 'pilot_address', 'pilot_zip', 'pilot_phone',
    ];
    textFields.forEach( f => formData.append( f, form[ f ] || '' ) );
    formData.append( 'consent_waiver',  form.consent_waiver  ? '1' : '0' );
    formData.append( 'consent_privacy', form.consent_privacy ? '1' : '0' );

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

  if ( success ) return <SuccessScreen />;

  return (
    <div className="motortour-app-root">

      {/* Header */}
      <header className="mt-tour-header">
        <div className="mt-container">
          <h1>🏍️ Iscriviti al Motoclub</h1>
          <p style={ { margin: 0, opacity: .85 } }>Motoclub Salentum Terrae A.S.D.</p>
        </div>
      </header>

      <main className="mt-container mt-page">

        {/* Step indicator */}
        <div className="mt-steps" aria-label="Passaggi iscrizione">
          { STEPS.map( ( s, i ) => (
            <div key={ i } className={ `mt-step ${ i < step ? 'done' : i === step ? 'active' : '' }` }>
              { i > 0 && (
                <div style={ {
                  position: 'absolute', top: 16, right: '50%', left: 0, height: 2,
                  background: i <= step ? 'var(--mt-primary)' : 'var(--mt-border)',
                } } />
              ) }
              <div className="mt-step-dot">{ i < step ? '✓' : i + 1 }</div>
              <span className="mt-step-label">{ s.label }</span>
            </div>
          ) ) }
        </div>

        {/* Step content */}
        <div className="mt-card">
          <div className="mt-card-body">

            { submitError && <div className="mt-alert mt-alert-error">{ submitError }</div> }

            { step === 0 && <StepAccount   form={ form } update={ update } errors={ errors } /> }
            { step === 1 && <StepPilot     form={ form } update={ update } errors={ errors } /> }
            { step === 2 && <StepDocuments files={ files } setFiles={ setFiles } errors={ errors } /> }
            { step === 3 && <StepConsents  form={ form } update={ update } errors={ errors } /> }

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

        <p style={ { textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--mt-text-muted)' } }>
          Hai già un account?{' '}
          <Link to="/login" style={ { color: 'var(--mt-primary)', fontWeight: 600 } }>Accedi →</Link>
        </p>
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
        Crea le credenziali di accesso. Dopo l'approvazione potrai entrare nell'area riservata e iscriverti ai tour.
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
      <h2 style={ { marginBottom: 4 } }>Dati personali</h2>
      <p style={ { color: 'var(--mt-text-muted)', fontSize: 14, marginBottom: 20 } }>
        Dati anagrafici del pilota. Moto e passeggero li indicherai alla richiesta di ogni tour.
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
        <Field label="Indirizzo" required error={ errors.pilot_address }>
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

// ── Step 3: Documenti ─────────────────────────────────────────────────────────
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
        <label className="mt-label">
          Allegato aggiuntivo{' '}
          <span style={ { color: 'var(--mt-text-muted)', fontWeight: 400 } }>(opzionale)</span>
        </label>
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
  const inputRef = useRef();
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

// ── Step 4: Consensi ──────────────────────────────────────────────────────────
function StepConsents( { form, update, errors } ) {
  const WAIVER_TEXT = `La partecipazione all'evento obbliga il Partecipante ad osservare tutte le regole di buona condotta e di rispetto della circolazione stradale, impegnandosi a mantenere un comportamento prudente ed una guida del proprio mezzo in sicurezza per sé e per gli altri. Il partecipante esonera e manleva il "MOTOCLUB SALENTUM TERRAE A.S.D. ed i suoi organizzatori" da ogni responsabilità per danni alla propria persona, a cosa o verso terzi oltre per tutte le cause non menzionate che potranno verificarsi durante l'esecuzione dell'evento.`;
  const PRIVACY_TEXT = `Con la sottoscrizione si autorizza l'organizzatore dell'evento al trattamento dei dati personali ai sensi dell'art. 13 del Regolamento UE 2016/679 (GDPR), nel rispetto dei criteri di correttezza e trasparenza, tutelando la riservatezza e i diritti del partecipante e per fini leciti. Il trattamento sarà effettuato anche con l'ausilio di mezzi informatici per tutte le finalità strettamente connesse alla realizzazione dell'evento.`;

  return (
    <>
      <h2 style={ { marginBottom: 4 } }>Consensi obbligatori</h2>
      <p style={ { color: 'var(--mt-text-muted)', fontSize: 14, marginBottom: 20 } }>
        Leggi attentamente e accetta le condizioni per completare l'iscrizione al club.
      </p>

      <div style={ { background: '#f8f8f8', borderRadius: 8, padding: '14px 16px', marginBottom: 12, fontSize: 13, color: '#444', lineHeight: 1.6, maxHeight: 120, overflow: 'auto', border: '1px solid var(--mt-border)' } }>
        <strong>Condizioni generali e liberatoria</strong><br />
        { WAIVER_TEXT }
      </div>
      <div className={ `mt-checkbox-group ${ errors.consent_waiver ? 'error' : '' }` } style={ { marginBottom: 20 } }>
        <input type="checkbox" id="consent_waiver" checked={ form.consent_waiver }
               onChange={ e => update( 'consent_waiver', e.target.checked ) } />
        <label htmlFor="consent_waiver">
          <strong>Accetto le condizioni generali e la liberatoria</strong> <span className="required">*</span>
        </label>
      </div>
      { errors.consent_waiver && <p className="mt-field-error" style={ { marginTop: -16, marginBottom: 12 } }>{ errors.consent_waiver }</p> }

      <div style={ { background: '#f8f8f8', borderRadius: 8, padding: '14px 16px', marginBottom: 12, fontSize: 13, color: '#444', lineHeight: 1.6, maxHeight: 120, overflow: 'auto', border: '1px solid var(--mt-border)' } }>
        <strong>Informativa sulla privacy (GDPR)</strong><br />
        { PRIVACY_TEXT }
      </div>
      <div className={ `mt-checkbox-group ${ errors.consent_privacy ? 'error' : '' }` }>
        <input type="checkbox" id="consent_privacy" checked={ form.consent_privacy }
               onChange={ e => update( 'consent_privacy', e.target.checked ) } />
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
function SuccessScreen() {
  return (
    <div className="motortour-app-root">
      <header className="mt-tour-header">
        <div className="mt-container">
          <h1>🏍️ Motoclub Salentum Terrae A.S.D.</h1>
        </div>
      </header>
      <main className="mt-container mt-page" style={ { textAlign: 'center', paddingTop: 48 } }>
        <div style={ { fontSize: 64, marginBottom: 16 } }>🎉</div>
        <h2>Iscrizione inviata!</h2>
        <p style={ { color: 'var(--mt-text-muted)', fontSize: 15, maxWidth: 420, margin: '0 auto 24px' } }>
          Abbiamo ricevuto la tua iscrizione al Motoclub.<br />
          Controlla la tua email — ti abbiamo inviato una conferma.<br />
          Lo staff verificherà i documenti e ti avviserà appena l'iscrizione sarà attivata.
        </p>
        <p style={ { color: 'var(--mt-text-muted)', fontSize: 14, maxWidth: 400, margin: '0 auto 32px' } }>
          Una volta approvato/a potrai accedere con le tue credenziali e iscriverti ai tour disponibili.
        </p>
        <Link to="/login" className="mt-btn mt-btn-primary">
          Vai al login →
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
