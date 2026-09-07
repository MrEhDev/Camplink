// Aquí defino el pie de página limpio de Camplink con enlaces útiles y manifiesto nómada.

import React from 'react';

export default function Footer({ setVistaActiva }) {
  return (
    <footer className="camplink-footer" style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-glass)', padding: '40px 0 24px' }}>
      <div className="camplink-container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '32px',
          marginBottom: '32px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <img src="/camplink-logo.png" alt="Camplink" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
              <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-forest)', margin: 0, fontWeight: 800 }}>Camplink</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
              La red abierta y libre para exploradores nómadas, furgonetas camper y autocaravanas. 
              Respeta el entorno, no dejes huella y disfruta de la ruta.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.96rem', marginBottom: '12px', color: 'var(--text-primary)', fontWeight: 700 }}>Exploración & Rutas</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)', padding: 0, margin: 0 }}>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setVistaActiva('descubre'); }}>🗺️ Mapa Completo de Pernoctas</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setVistaActiva('diario'); }}>🧭 Diario de Ruta Comunitario</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setVistaActiva('organizar'); }}>⛽ Planificador de Viajes</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.96rem', marginBottom: '12px', color: 'var(--text-primary)', fontWeight: 700 }}>Comunidad & Taller</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)', padding: 0, margin: 0 }}>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setVistaActiva('taller'); }}>🛠️ Taller 3D de Camperización</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setVistaActiva('guia'); }}>📖 Guía del Nómada</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setVistaActiva('trofeos'); }}>🏆 Vitrina de Logros Camper</a></li>
              <li><a href="mailto:Camplink.app.info@gmail.com">✉️ Contacto: Camplink.app.info@gmail.com</a></li>
            </ul>
          </div>
        </div>

        <div style={{
          paddingTop: '20px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.82rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            © {new Date().getFullYear()} Camplink • Conectando la Comunidad al Aire Libre.
          </div>
          <div>
            Hecho con pasión por el camperismo y la vida sobre ruedas 🌲🏕️🚐
          </div>
        </div>
      </div>
    </footer>
  );
}
