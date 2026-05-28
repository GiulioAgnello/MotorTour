/**
 * App root – gestisce il routing principale:
 *
 * /                        → HomePage    (landing + lista tour)
 * /iscriviti               → Register    (iscrizione base al club, 4 step)
 * /login                   → Login
 * /area-riservata          → Dashboard   (utente approvato: stato + tour + richieste)
 * /tour/:tourId/iscrivi    → TourEnrollRequest (richiesta leggera per un tour specifico)
 * /area-riservata/tour     → TourDetail  (itinerario completo)
 */
import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import HomePage          from './pages/HomePage';
import Register          from './pages/Register';
import Login             from './pages/Login';
import Dashboard         from './pages/Dashboard';
import TourEnrollRequest from './pages/TourEnrollRequest';
import TourDetail        from './pages/TourDetail';
import NotFound          from './pages/NotFound';

// ── Context autenticazione ────────────────────────────────────────────────────
export const AuthContext = createContext( null );

export function useAuth() {
  return useContext( AuthContext );
}

// ── Provider ──────────────────────────────────────────────────────────────────
function AuthProvider( { config, children } ) {
  // localStorage per sessione persistente tra tab e riavvii
  const storedToken = localStorage.getItem( 'mt_token' );
  const storedUser  = localStorage.getItem( 'mt_user' );

  const [ token, setToken ] = useState( storedToken || null );
  const [ user,  setUser  ] = useState( storedUser ? JSON.parse( storedUser ) : config.user || null );

  const login = ( newToken, newUser ) => {
    localStorage.setItem( 'mt_token', newToken );
    localStorage.setItem( 'mt_user',  JSON.stringify( newUser ) );
    setToken( newToken );
    setUser( newUser );
  };

  const logout = () => {
    localStorage.removeItem( 'mt_token' );
    localStorage.removeItem( 'mt_user' );
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
  return (
    <AuthProvider config={ config }>
      <BrowserRouter>
        <Routes>
          <Route path="/"                          element={ <HomePage config={ config } /> } />
          <Route path="/iscriviti"                 element={ <Register config={ config } /> } />
          <Route path="/login"                     element={ <Login    config={ config } /> } />

          {/* Area riservata — richiede login */}
          <Route
            path="/area-riservata"
            element={
              <PrivateRoute>
                <Dashboard config={ config } />
              </PrivateRoute>
            }
          />
          <Route
            path="/tour/:tourId/iscrivi"
            element={
              <PrivateRoute>
                <TourEnrollRequest config={ config } />
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
