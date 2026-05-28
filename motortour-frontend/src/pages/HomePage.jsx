/**
 * HomePage — Landing page + sidebar tour.
 *
 * Desktop (>=768px):
 *   [ Landing 2/3 ] [ Tour sidebar 1/3 sticky ]
 *
 * Mobile (<768px):
 *   Navbar
 *   [Toggle pill "Tour in programma"]  -> drawer scorrevole
 *   Landing content
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { api } from '../api/client';
import { C } from '../styles/theme';

import Navbar       from '../components/Navbar';
import TourToggle   from '../components/TourToggle';
import TourPanel    from '../components/TourPanel';
import HeroSection  from '../components/HeroSection';
import { Section, SectionLabel } from '../components/Section';
import Pillar       from '../components/Pillar';
import Step         from '../components/Step';
import Icon         from '../components/Icons';

// ---- CSS layout (media query desktop/mobile) ---------------------------------
const LAYOUT_CSS = `
  .mt-home-layout {
    flex-direction: column;
  }
  .mt-landing-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #fff;
  }
  .mt-tour-col {
    width: 360px;
    flex-shrink: 0;
  }
  .mt-pillars {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .mt-mobile-only  { display: block; }
  .mt-desktop-only { display: none;  }
  .mt-nav-link {
    font-size: 13px;
    color: #6b7280;
    text-decoration: none;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background .15s;
    display: none;
  }
  .mt-mobile-tour-drawer {
    background: #fff;
    border-bottom: 1px solid #e8e8ec;
    max-height: 60vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  @keyframes mt-spin {
    to { transform: rotate(360deg); }
  }
  @media (min-width: 768px) {
    .mt-home-layout    { flex-direction: row; align-items: flex-start; }
    .mt-tour-col       { display: flex; flex-direction: column; }
    .mt-mobile-only    { display: none;  }
    .mt-desktop-only   { display: flex; flex-direction: column; }
    .mt-nav-link       { display: inline-block; }
    .mt-pillars        { flex-wrap: nowrap; }
  }
  @media (min-width: 768px) {
    .mt-landing-col {
      flex: 1;
      min-width: 0;
      overflow-y: auto;
      height: 100vh;
    }
    .mt-tour-col { width: 340px; }
  }
  @media (min-width: 1024px) {
    .mt-tour-col { width: 380px; }
  }
  .mt-nav-link:hover { background: #f5f5f8; color: #1a1a2e; }
`;

// ---- Componente principale ---------------------------------------------------
export default function HomePage( { config } ) {
  const { isLoggedIn } = useAuth();
  const landing = config?.landing || {};

  const [ tours,        setTours        ] = useState( [] );
  const [ loadingTours, setLoadingTours ] = useState( true );
  const [ activeTab,    setActiveTab    ] = useState( 'tutti' );
  const [ mobileOpen,   setMobileOpen   ] = useState( false );
  const tourDrawerRef = useRef( null );

  // Chiudi drawer mobile quando si scrolla
  useEffect( () => {
    const onScroll = () => {
      if ( mobileOpen && window.scrollY > 80 ) setMobileOpen( false );
    };
    window.addEventListener( 'scroll', onScroll, { passive: true } );
    return () => window.removeEventListener( 'scroll', onScroll );
  }, [ mobileOpen ] );

  // Carica tour
  useEffect( () => {
    api.getTours()
      .then( setTours )
      .catch( () => {} )
      .finally( () => setLoadingTours( false ) );
  }, [] );

  const filteredTours = tours.filter( t => {
    if ( activeTab === 'aperti' ) return t.status === 'open';
    if ( activeTab === 'chiusi' ) return t.status === 'closed' || t.status === 'archived';
    return true;
  } );

  const openCount = tours.filter( t => t.status === 'open' ).length;

  return (
    <div style={ { minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' } }>

      <Navbar landing={ landing } isLoggedIn={ isLoggedIn } />

      <div style={ { flex: 1, display: 'flex', maxWidth: 1200, width: '100%', margin: '0 auto' } }
           className="mt-home-layout">

        {/* Colonna sinistra: landing */}
        <main className="mt-landing-col">

          {/* Toggle + drawer tour - solo mobile */}
          <div className="mt-mobile-only">
            <TourToggle
              open={ mobileOpen }
              onToggle={ () => setMobileOpen( o => !o ) }
              count={ openCount }
            />
            { mobileOpen && (
              <div ref={ tourDrawerRef } className="mt-mobile-tour-drawer">
                <TourPanel
                  tours={ filteredTours }
                  loading={ loadingTours }
                  activeTab={ activeTab }
                  onTabChange={ setActiveTab }
                  mobile
                />
              </div>
            ) }
          </div>

          <HeroSection landing={ landing } />

          <Section id="chi-siamo">
            <SectionLabel>Chi siamo</SectionLabel>
            <p style={ { fontSize: 15, lineHeight: 1.8, color: C.textMuted, margin: 0 } }>
              { landing.description || "Siamo un'associazione sportiva dilettantistica di motociclisti del Salento. Organizziamo tour ed eventi per condividere la passione per la moto, creare comunita e supportare cause benefiche insieme a ONLUS del territorio." }
            </p>
          </Section>

          <Section>
            <SectionLabel>Cosa facciamo</SectionLabel>
            <div className="mt-pillars">
              <Pillar
                icon={ <Icon.road /> }  iconColor={ C.primary }
                title={ landing.pillar_1_title || 'Tour guidati' }
                text={  landing.pillar_1_text  || 'Itinerari curati nel Salento e in tutta Italia' }
              />
              <Pillar
                icon={ <Icon.heart /> } iconColor="#e63946"
                title={ landing.pillar_2_title || 'Beneficenza' }
                text={  landing.pillar_2_text  || 'Alcuni tour raccolgono fondi per ONLUS partner' }
              />
              <Pillar
                icon={ <Icon.users /> } iconColor="#1a7a3a"
                title={ landing.pillar_3_title || 'Comunita' }
                text={  landing.pillar_3_text  || 'Una famiglia di motociclisti, aperti a tutti' }
              />
            </div>
          </Section>

          <Section id="come-funziona">
            <SectionLabel>{ landing.how_title || 'Come partecipare' }</SectionLabel>
            <div style={ { display: 'flex', flexDirection: 'column', gap: 16 } }>
              { ( landing.steps || [
                'Scegli un tour — vedi quelli aperti e clicca Iscriviti',
                'Compila il form — dati personali, moto e carica la patente',
                "Attendi l'approvazione — lo staff verifica e ti conferma via email",
                "Accedi all'area riservata — itinerario, tappe e POI tutti li",
              ] ).map( ( text, i ) => (
                <Step key={ i } num={ i + 1 } text={ text } />
              ) ) }
            </div>
          </Section>

          <footer style={ {
            padding: '32px 24px 40px',
            borderTop: `1px solid ${ C.border }`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 20,
            alignItems: 'center',
            justifyContent: 'space-between',
          } }>
            <div>
              <p style={ { margin: 0, fontSize: 13, fontWeight: 500, color: C.dark } }>Motoclub Salentum Terrae A.S.D.</p>
              <p style={ { margin: '4px 0 0', fontSize: 12, color: C.textMuted } }>{ landing.location || 'Lecce, Puglia' }</p>
            </div>
            <div style={ { display: 'flex', gap: 16, alignItems: 'center' } }>
              { landing.email && (
                <a href={ `mailto:${ landing.email }` }
                   style={ { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.primary, textDecoration: 'none' } }>
                  <Icon.mail /> { landing.email }
                </a>
              ) }
              { landing.instagram && (
                <a href={ landing.instagram } target="_blank" rel="noopener noreferrer"
                   style={ { color: C.textMuted, display: 'flex', alignItems: 'center' } }
                   aria-label="Instagram">
                  <Icon.instagram />
                </a>
              ) }
            </div>
            <p style={ { margin: 0, fontSize: 11, color: C.textMuted, width: '100%' } }>
              &copy; { new Date().getFullYear() } Motoclub Salentum Terrae A.S.D. &middot; Tutti i diritti riservati
            </p>
          </footer>
        </main>

        {/* Colonna destra: sidebar tour - solo desktop */}
        <aside className="mt-tour-col mt-desktop-only">
          <div style={ {
            position: 'sticky',
            top: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: C.surface,
            borderLeft: `1px solid ${ C.border }`,
          } }>
            <TourPanel
              tours={ filteredTours }
              loading={ loadingTours }
              activeTab={ activeTab }
              onTabChange={ setActiveTab }
            />
          </div>
        </aside>

      </div>

      <style>{ LAYOUT_CSS }</style>
    </div>
  );
}
