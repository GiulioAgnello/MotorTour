/**
 * Client HTTP per le chiamate alla REST API WordPress.
 * Legge apiUrl e nonce da window.mtConfig.
 *
 * Token salvato in localStorage per sessione persistente tra tab e riavvii.
 */

const getConfig = () => window.mtConfig || {};

export async function apiFetch( endpoint, options = {} ) {
  const { apiUrl, nonce } = getConfig();
  const url     = `${ apiUrl }/${ endpoint.replace( /^\//, '' ) }`;
  const token   = localStorage.getItem( 'mt_token' );

  const headers = {
    'X-WP-Nonce': nonce,
    ...( options.headers || {} ),
  };

  // Aggiungi Authorization se loggato via JWT
  if ( token ) {
    headers['Authorization'] = `Bearer ${ token }`;
  }

  // Non impostare Content-Type per FormData (il browser lo fa da solo con boundary)
  if ( ! ( options.body instanceof FormData ) ) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch( url, {
    ...options,
    headers,
    body: options.body instanceof FormData
      ? options.body
      : options.body ? JSON.stringify( options.body ) : undefined,
  } );

  const data = await response.json();

  if ( ! response.ok ) {
    const error = new Error( data?.message || 'Errore di rete' );
    error.code   = data?.code;
    error.status = response.status;
    throw error;
  }

  return data;
}

// ── Helpers specifici ────────────────────────────────────────────────────────

export const api = {
  // Tour (pubblici)
  getTours:   ()       => apiFetch( 'tours' ),
  getTour:    ( id )   => apiFetch( `tours/${ id }` ),

  // Iscrizione base al club
  submitRegistration: ( formData ) => apiFetch( 'register', { method: 'POST', body: formData } ),

  // Auth
  login:  ( email, pwd ) => apiFetch( 'auth/login',  { method: 'POST', body: { email, password: pwd } } ),
  logout: ()             => apiFetch( 'auth/logout', { method: 'POST' } ),

  // Area riservata — membership
  getMyRegistration: () => apiFetch( 'my/registration' ),
  getMyProfile:      () => apiFetch( 'my/profile' ),

  // Area riservata — richieste tour
  getMyEnrollments:  ()          => apiFetch( 'my/enrollments' ),
  enrollTour:        ( tourId, body ) => apiFetch( `tours/${ tourId }/enroll`, { method: 'POST', body } ),

  // Dettaglio tour (itinerario completo, solo per approvati)
  getMyTour: () => apiFetch( 'my/tour' ),
};
