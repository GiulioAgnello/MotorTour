/**
 * App root – gestisce il routing principale:
 *
 * /              → HomePage    (landing + sidebar tour)
 * /iscriviti/:id → Register    (form iscrizione multi-step)
 * /login         → Login
 * /area-riservata → Dashboard  (utente approvato)
 * /area-riservata/tour → TourDetail (itinerario, tappe, POI)
 */
import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import HomePage     from './pages/HomePage';
import Register     from './pages/Register';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import TourDetail   from './pages/TourDetail';
import NotFound     from './pages/NotFound';

// ── Context autenticazione ────────────────────────────────────────────────────
export const AuthContext = createContext( null );

export function useAuth() {
  return useContext( AuthContext );
}

// ── Provider ──────────────────────────────────────────────────────────────────
function AuthProvider( { config, children } ) {
  const storedToken = sessionStorage.getItem( 'mt_token' );
  const storedUser  = sessionStorage.getItem( 'mt_user' );

  const [ token, setToken ]   = useState( storedToken || null );
  const [ user,  setUser  ]   = useState( storedUser ? JSON.parse( storedUser ) : config.user || null );

  const login = ( newToken, newUser ) => {
    sessionStorage.setItem( 'mt_token', newToken );
    sessionStorage.setItem( 'mt_user',  JSON.stringify( newUser ) );
    setToken( newToken );
    setUser( newUser );
  };

  const logout = () => {
    sessionStorage.removeItem( 'mt_token' );
    sessionStorage.removeItem( 'mt_user' );
    setToken( null );
    setUser( null );
  };

  return (
    <AuthContext.Provider value={ { token, user, login, logout, isLoggedIn: !! token } }>
      { children }
    </AuthContext.Provider>
  );
}

// ── Route guard per area riservata ────────────────────────────────────────────
function PrivateRoute( { children } ) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  if ( ! isLoggedIn ) {
    return <Navigate to="/login" state={ { from: location } } replace />;
  }
  return children;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App( { config } ) {
  // React Router: usiamo basename dalla URL corrente della pagina WP
  // La pagina WP è /portale-tour, quindi il router è relativo
  const basename = new URL( config.siteUrl || window.location.origin ).pathname;

  return (
    <AuthProvider config={ config }>
      {/* HashRouter funziona meglio embedded in WP senza modificare .htaccess */}
      <BrowserRouter>
        <Routes>
          <Route path="/"                    element={ <HomePage config={ config } /> } />
          <Route path="/iscriviti/:tourId"   element={ <Register config={ config } /> } />
          <Route path="/login"               element={ <Login    config={ config } /> } />
          <Route
            path="/area-riservata"
            element={
              <PrivateRoute>
                <Dashboard config={ config } />
              </PrivateRoute>
            }
          />
          <Route
            path="/area-riservata/tour"
            element={
              <PrivateRoute>
                <TourDetail config={ config } />
              </PrivateRoute>
            }
          />
          <Route path="*" element={ <NotFound /> } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
