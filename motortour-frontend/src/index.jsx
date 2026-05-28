/**
 * Entry point React – si monta su #motortour-app
 * I dati di configurazione arrivano da window.mtConfig (iniettato da WP)
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

const container = document.getElementById( 'motortour-app' );

if ( container ) {
  const root = createRoot( container );
  root.render(
    <React.StrictMode>
      <App config={ window.mtConfig || {} } />
    </React.StrictMode>
  );
} else {
  console.warn( '[MotorTour] #motortour-app element not found.' );
}
