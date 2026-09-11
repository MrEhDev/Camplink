// Vista de inicio para el usuario autenticado: 6 tarjetas de navegación visuales con imágenes
// y títulos destacados, sin iconos ni emojis, con diseño responsive y glassmorphism.

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const formatearNombre = (u) => {
  if (!u) return 'Explorador';
  const s = String(u);
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const TARJETAS = [
  {
    id: 'diario',
    titulo: 'Diario de Ruta',
    subtitulo: 'Publicaciones y red social camper',
    etiqueta: 'Comunidad',
    overlay: 'linear-gradient(135deg, rgba(20, 55, 34, 0.72) 0%, rgba(35, 83, 52, 0.78) 100%)',
    overlayHover: 'linear-gradient(135deg, rgba(15, 42, 26, 0.86) 0%, rgba(25, 62, 38, 0.88) 100%)',
    imagen: '/cards/card_diario.jpg',
    vista: 'diario',
  },
  {
    id: 'descubre',
    titulo: 'Mapa de Lugares',
    subtitulo: 'Explora el mapa interactivo',
    etiqueta: 'Explorar',
    overlay: 'linear-gradient(135deg, rgba(4, 55, 62, 0.72) 0%, rgba(5, 80, 90, 0.78) 100%)',
    overlayHover: 'linear-gradient(135deg, rgba(3, 40, 46, 0.86) 0%, rgba(4, 60, 68, 0.88) 100%)',
    imagen: '/cards/card_mapa.jpg',
    vista: 'descubre',
  },
  {
    id: 'descubre_lista',
    titulo: 'Lista de Lugares',
    subtitulo: 'Catálogo de pernoctas y áreas',
    etiqueta: 'Catálogo',
    overlay: 'linear-gradient(135deg, rgba(14, 60, 48, 0.72) 0%, rgba(20, 90, 70, 0.78) 100%)',
    overlayHover: 'linear-gradient(135deg, rgba(10, 45, 36, 0.86) 0%, rgba(15, 68, 52, 0.88) 100%)',
    imagen: '/cards/card_lista.jpg',
    vista: 'descubre_lista',
  },
  {
    id: 'organizar',
    titulo: 'Organiza tu Viaje',
    subtitulo: 'Planifica tu próxima ruta',
    etiqueta: 'Itinerarios',
    overlay: 'linear-gradient(135deg, rgba(85, 55, 0, 0.72) 0%, rgba(120, 80, 0, 0.78) 100%)',
    overlayHover: 'linear-gradient(135deg, rgba(65, 42, 0, 0.86) 0%, rgba(90, 60, 0, 0.88) 100%)',
    imagen: '/cards/card_viajes.jpg',
    vista: 'organizar',
  },
  {
    id: 'radar',
    titulo: 'Radar del Explorador',
    subtitulo: 'Encuentra lugares cerca de ti',
    etiqueta: 'GPS En Vivo',
    overlay: 'linear-gradient(135deg, rgba(10, 45, 95, 0.72) 0%, rgba(14, 70, 140, 0.78) 100%)',
    overlayHover: 'linear-gradient(135deg, rgba(8, 35, 75, 0.86) 0%, rgba(10, 52, 105, 0.88) 100%)',
    imagen: '/cards/card_radar.jpg',
    accion: 'radar',
  },
  {
    id: 'taller',
    titulo: 'Taller Camplink',
    subtitulo: 'Manuales, brico y piezas 3D',
    etiqueta: 'Brico & 3D',
    overlay: 'linear-gradient(135deg, rgba(95, 40, 8, 0.72) 0%, rgba(140, 60, 10, 0.78) 100%)',
    overlayHover: 'linear-gradient(135deg, rgba(70, 28, 5, 0.86) 0%, rgba(105, 45, 8, 0.88) 100%)',
    imagen: '/cards/card_taller.jpg',
    vista: 'taller',
  },
];

export default function HomeDashboard({ setVistaActiva, abrirRadar }) {
  const { usuario } = useAuth();
  const [visible, setVisible] = useState(false);
  const [hoverId, setHoverId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const navegar = (tarjeta) => {
    if (tarjeta.accion === 'radar') {
      abrirRadar?.();
    } else if (tarjeta.vista) {
      setVistaActiva(tarjeta.vista);
    }
  };

  const saludo = () => {
    const h = new Date().getHours();
    if (h < 6) return '🌙 Buenas noches';
    if (h < 12) return '☀️ Buenos días';
    if (h < 20) return '🌤️ Buenas tardes';
    return '🌙 Buenas noches';
  };

  return (
    <div
      id="home-dashboard"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        minHeight: 0,
      }}
    >
      {/* ── Cabecera de bienvenida ── */}
      <div style={{
        padding: '20px 20px 12px',
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-12px)',
        transition: 'opacity 0.45s ease, transform 0.45s ease',
        flexShrink: 0,
      }}>
        <p style={{
          fontSize: '0.88rem',
          color: 'var(--text-muted)',
          fontWeight: 500,
          margin: '0 0 3px',
          letterSpacing: '0.02em',
        }}>
          {saludo()},
        </p>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(1.35rem, 5vw, 2rem)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.2,
        }}>
          {formatearNombre(usuario?.username)} 👋
        </h1>
        <p style={{
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          margin: '5px 0 0',
          fontWeight: 500,
        }}>
          ¿Qué quieres explorar hoy?
        </p>
      </div>

      {/* ── Grid de 6 tarjetas ── */}
      <div
        className="home-dashboard-grid"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: '12px',
          padding: '0 12px 14px',
          boxSizing: 'border-box',
          minHeight: 0,
        }}
      >
        {TARJETAS.map((tarjeta, idx) => {
          const isHovered = hoverId === tarjeta.id;
          const delayS = idx * 0.07;

          return (
            <button
              key={tarjeta.id}
              id={`home-card-${tarjeta.id}`}
              onClick={() => navegar(tarjeta)}
              onMouseEnter={() => setHoverId(tarjeta.id)}
              onMouseLeave={() => setHoverId(null)}
              aria-label={`Ir a ${tarjeta.titulo}`}
              style={{
                // Layout
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '16px 16px 20px',
                boxSizing: 'border-box',
                width: '100%',
                minHeight: '130px',
                // Imagen de fondo con overlay de color
                backgroundImage: `${isHovered ? tarjeta.overlayHover : tarjeta.overlay}, url("${tarjeta.imagen}")`,
                backgroundSize: 'cover, cover',
                backgroundPosition: 'center, center',
                backgroundRepeat: 'no-repeat, no-repeat',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                boxShadow: isHovered
                  ? '0 24px 55px rgba(0,0,0,0.55), inset 0 0 0 1.5px rgba(255,255,255,0.32)'
                  : '0 10px 30px rgba(0,0,0,0.38), inset 0 0 0 1px rgba(255,255,255,0.18)',
                // Animación
                opacity: visible ? 1 : 0,
                transform: visible
                  ? (isHovered ? 'scale(1.035) translateY(-3px)' : 'scale(1) translateY(0)')
                  : 'scale(0.91) translateY(18px)',
                transition: isHovered
                  ? 'transform 0.2s ease, box-shadow 0.2s ease'
                  : `opacity 0.4s ease ${delayS}s, transform 0.42s ease ${delayS}s, box-shadow 0.2s ease`,
                // Reset botón
                cursor: 'pointer',
                WebkitAppearance: 'none',
                appearance: 'none',
                outline: 'none',
                textAlign: 'left',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Viñeta sutil para contraste cinematográfico */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)',
                pointerEvents: 'none',
                borderRadius: 'var(--radius-lg)',
              }} />

              {/* Insignia superior de categoría */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 9px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.16)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.24)',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                position: 'relative',
                zIndex: 1,
              }}>
                {tarjeta.etiqueta}
              </div>

              {/* Textos con gran valor y jerarquía visual */}
              <div style={{ position: 'relative', zIndex: 1, width: '100%', paddingRight: '28px', marginTop: '14px' }}>
                <h2 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(1.15rem, 3.8vw, 1.5rem)',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  margin: '0 0 5px',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 12px rgba(0,0,0,0.95), 0 1px 4px rgba(0,0,0,1), 0 4px 20px rgba(0,0,0,0.8)',
                }}>
                  {tarjeta.titulo}
                </h2>
                <p style={{
                  fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                  color: 'rgba(255,255,255,0.92)',
                  margin: 0,
                  lineHeight: 1.35,
                  fontWeight: 600,
                  textShadow: '0 1px 6px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.7)',
                }}>
                  {tarjeta.subtitulo}
                </p>
              </div>

              {/* Botón flecha → */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: isHovered ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 800,
                color: '#FFFFFF',
                boxShadow: '0 3px 10px rgba(0,0,0,0.35)',
                transform: isHovered ? 'translate(2px,-2px) scale(1.08)' : 'translate(0,0) scale(1)',
                transition: 'all 0.18s ease',
                pointerEvents: 'none',
                zIndex: 1,
              }}>
                →
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        @media (min-width: 600px) {
          .home-dashboard-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            grid-template-rows: repeat(2, 1fr) !important;
            gap: 16px !important;
            padding: 0 20px 20px !important;
          }
        }
        @media (min-width: 1024px) {
          .home-dashboard-grid {
            max-width: 980px !important;
            margin: 0 auto !important;
            width: 100% !important;
            gap: 22px !important;
            padding: 0 36px 28px !important;
          }
        }
        [id^="home-card-"]:focus-visible {
          outline: 2px solid var(--border-focus);
          outline-offset: 3px;
        }
      `}</style>
    </div>
  );
}
