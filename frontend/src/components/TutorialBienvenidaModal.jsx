import React, { useState } from 'react';
import {
  Sparkles, Compass, Map, Radar, Route, Trophy,
  ChevronLeft, ChevronRight, X, Check, Navigation, BookOpen, User
} from 'lucide-react';

export default function TutorialBienvenidaModal({ alCerrar, alNavegar }) {
  const [pasoActual, setPasoActual] = useState(0);

  const pasos = [
    {
      id: 'bienvenida',
      titulo: '¡Bienvenido a Camplink!',
      subtitulo: 'Tu comunidad nómada y compañero de ruta',
      icono: <Sparkles size={36} color="#F59E0B" />,
      colorAcento: '#F59E0B',
      descripcion: 'Camplink ha sido diseñado para conectar a campers, autocaravanistas y apasionados del viaje al aire libre. Descubre nuevos destinos, comparte tus aventuras y viaja con total tranquilidad.',
      puntos: [
        '🗺️ Catálogo de lugares y mapa interactivo',
        '📖 Diario de ruta donde publicar tus vivencias y seguir a otros nómadas',
        '📡 Radar en vivo para encontrar servicios y gasolineras en ruta o en el punto donde te encuentras',
        '🧭 Organizador de etapas y cálculo estimado de combustible'
      ],
      tip: 'Consejo: Puedes volver a abrir este tutorial en cualquier momento desde tu perfil 🎓 Tutorial.'
    },
    {
      id: 'diario',
      titulo: 'Diario de Ruta & Comunidad',
      subtitulo: 'Comparte crónicas, fotos y conecta con viajeros',
      icono: <Compass size={36} color="var(--accent-forest)" />,
      colorAcento: 'var(--accent-forest)',
      descripcion: 'El Diario de Ruta es el corazón social de Camplink. Publica tus paradas, sube fotos de tus rincones favoritos, comenta en las experiencias de otros exploradores y envía mensajes de apoyo.',
      puntos: [
        '✍️ Publica notas de viaje con fotos comprimidas de alta calidad',
        '❤️ Reacciona y comenta en las historias de la comunidad',
        '👥 Sigue a tus amigos nómadas y descubre dónde están acampando',
        '🔒 Comparte publicaciones públicas o exclusivas para tus seguidores'
      ],
      vistaDestino: 'diario',
      textoAccion: 'Ir al Diario de Ruta'
    },
    {
      id: 'lugares',
      titulo: 'Lugares & Mapa Nómada',
      subtitulo: 'Miles de spots verificados por la comunidad',
      icono: <Map size={36} color="#38BDF8" />,
      colorAcento: '#38BDF8',
      descripcion: 'Encuentra el sitio perfecto para pasar la noche o disfrutar del día. Explora campings, áreas camper gratuitas o de pago, parkings y puntos con servicios de agua y vaciado.',
      puntos: [
        '🔍 Filtros avanzados por tipo de lugar, precio y servicios',
        '⭐ Opiniones reales, fotos y valoraciones de otros usuarios',
        '🔒 Mis Notas Personales privadas para anotar claves y detalles secretos',
        '➕ Añade nuevos lugares descubiertos por ti para ayudar a otros'
      ],
      vistaDestino: 'descubre_lista',
      textoAccion: 'Explorar Lugares'
    },
    {
      id: 'radar',
      titulo: 'Radar Nómada en Tiempo Real',
      subtitulo: 'Tu copiloto inteligente para no quedarte tirado',
      icono: <Radar size={36} color="var(--accent-earth)" />,
      colorAcento: 'var(--accent-earth)',
      descripcion: 'En carretera cada minuto cuenta. El Radar Nómada localiza al instante lo que necesitas cerca de ti o alrededor de cualquier lugar que estés planeando visitar.',
      puntos: [
        '⛽ Gasolineras con precios de carburante actualizados diariamente',
        '🛒 Supermercados y tiendas de alimentación cercanas',
        '🧺 Lavanderías y otros servicion'
      ],
      tip: '¡Tienes el botón Radar disponible directamente en la barra de navegación móvil y de escritorio!'
    },
    {
      id: 'organizador',
      titulo: 'Organizador de Viajes',
      subtitulo: 'Planifica tus etapas teniendo en cuenta el consumo de combustible',
      icono: <Route size={36} color="#8B5CF6" />,
      colorAcento: '#8B5CF6',
      descripcion: 'Convierte tus ideas de viaje en itinerarios detallados. Define tu punto de partida, añade paradas intermedias y deja que Camplink calcule los consumos exactos.',
      puntos: [
        '📏 Estimación automática de kilómetros y coste total de combustible',
        '⛽ Cálculos basados en el depósito y consumo real de tu vehículo',
        '📄 Exportación completa de tu cuaderno de ruta en formato PDF'
      ],
      vistaDestino: 'organizar',
      textoAccion: 'Ver Organizador'
    },
    {
      id: 'perfil',
      titulo: 'Tu Perfil, Vehículo & Trofeos',
      subtitulo: 'Personaliza tus datos y desbloquea logros',
      icono: <Trophy size={36} color="#EAB308" />,
      colorAcento: '#EAB308',
      descripcion: 'En tu perfil puedes configurar tu avatar, definir las especificaciones de tu vehículo y ver tus trofeos por tus aventuras.',
      puntos: [
        '🚐 Datos de vehículo: tipo de combustible, depósito y consumo medio',
        '🏆 Trofeos que se desbloquean con tu actividad',
        '📍 Punto de partida habitual para cálculo automático de distancias',
        '👥 Gestión de compañeros de viaje y exploradores a los que sigues'
      ],
      vistaDestino: 'perfil',
      textoAccion: 'Ver Mi Perfil'
    }
  ];

  const totalPasos = pasos.length;
  const paso = pasos[pasoActual];
  const progresoPorcentaje = Math.round(((pasoActual + 1) / totalPasos) * 100);

  const irSiguiente = () => {
    if (pasoActual < totalPasos - 1) {
      setPasoActual(pasoActual + 1);
    } else {
      alCerrar();
    }
  };

  const irAnterior = () => {
    if (pasoActual > 0) {
      setPasoActual(pasoActual - 1);
    }
  };

  const ejecutarAccion = (vista) => {
    if (alNavegar && vista) {
      alNavegar(vista);
    }
    alCerrar();
  };

  return (
    <div className="modal-overlay tutorial-modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 10, 8, 0.82)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div
        className="tutorial-modal-card camper-card"
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '92vh',
          background: 'var(--bg-surface-elevated)',
          border: '1.5px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Barra de Progreso Superior */}
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', width: '100%' }}>
          <div style={{
            height: '100%',
            width: `${progresoPorcentaje}%`,
            background: 'linear-gradient(90deg, var(--accent-forest), var(--accent-earth))',
            transition: 'width 0.35s ease'
          }} />
        </div>

        {/* Encabezado del Modal */}
        <div style={{
          padding: '18px 22px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'rgba(35, 83, 52, 0.16)',
              border: '1px solid rgba(35, 83, 52, 0.3)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--accent-forest)'
            }}>
              Paso {pasoActual + 1} de {totalPasos}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Tour Guiado de Camplink
            </span>
          </div>

          <button
            onClick={alCerrar}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Saltar tutorial"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido Dinámico del Paso */}
        <div style={{
          padding: '24px 22px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Cabecera con Icono Destacado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${paso.colorAcento}40`,
              boxShadow: `0 8px 24px ${paso.colorAcento}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {paso.icono}
            </div>
            <div>
              <h3 style={{
                margin: '0 0 4px',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1.25
              }}>
                {paso.titulo}
              </h3>
              <p style={{
                margin: 0,
                fontSize: '0.84rem',
                color: 'var(--text-secondary)',
                fontWeight: 500
              }}>
                {paso.subtitulo}
              </p>
            </div>
          </div>

          {/* Descripción */}
          <p style={{
            margin: 0,
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.55
          }}>
            {paso.descripcion}
          </p>

          {/* Lista de Puntos Clave */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {paso.puntos.map((punto, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '0.84rem',
                color: 'var(--text-primary)',
                lineHeight: 1.4
              }}>
                <span>{punto}</span>
              </div>
            ))}
          </div>

          {/* Consejo / Tip si existe */}
          {paso.tip && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              fontSize: '0.80rem',
              color: 'var(--text-primary)',
              lineHeight: 1.4
            }}>
              💡 <strong>{paso.tip}</strong>
            </div>
          )}

          {/* Botón de acceso directo a la sección si aplica */}
          {paso.vistaDestino && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => ejecutarAccion(paso.vistaDestino)}
                style={{
                  fontSize: '0.8rem',
                  gap: '6px',
                  borderColor: paso.colorAcento,
                  color: 'var(--text-primary)'
                }}
              >
                <span>{paso.textoAccion}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Pie del Modal: Indicadores de Paso y Botones de Navegación */}
        <div style={{
          padding: '14px 22px 18px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'rgba(0,0,0,0.1)'
        }}>
          {/* Dots de navegación rápida */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {pasos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPasoActual(idx)}
                style={{
                  width: idx === pasoActual ? '22px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === pasoActual ? 'var(--accent-forest)' : 'rgba(255,255,255,0.2)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
                title={`Ir al paso ${idx + 1}`}
              />
            ))}
          </div>

          {/* Botones Anterior / Siguiente */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {pasoActual > 0 ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={irAnterior}
                style={{
                  height: '38px',
                  padding: '0 14px',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={alCerrar}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  padding: '8px 12px'
                }}
              >
                Omitir
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary"
              onClick={irSiguiente}
              style={{
                height: '38px',
                padding: '0 18px',
                fontSize: '0.84rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(35, 83, 52, 0.4)'
              }}
            >
              {pasoActual === totalPasos - 1 ? (
                <>
                  <span>¡Empezar a Explorar!</span>
                  <Check size={16} />
                </>
              ) : (
                <>
                  <span>Siguiente</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
