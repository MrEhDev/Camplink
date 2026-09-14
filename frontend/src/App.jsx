// Aquí implemento el componente raíz de la SPA Camplink con Lazy Loading, Code Splitting y Error Boundary,
// gestionando la redirección por defecto al Diario de Ruta para usuarios autenticados,
// navegación pública segura para el visor de mapa/catálogo/guía y protección contra pantallas en blanco.

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { obtenerPosicionGps, calcularDistanciaKm } from './utils/geolocation';
import { X } from 'lucide-react';

// Vistas con Lazy Loading (Code Splitting dinámico para optimización de rendimiento y bundle inicial ligero)
const LandingPage = lazy(() => import('./views/LandingPage'));
const DescubreMapa = lazy(() => import('./views/DescubreMapa'));
const DescubreLista = lazy(() => import('./views/DescubreLista'));
const DiarioDeRuta = lazy(() => import('./views/DiarioDeRuta'));
const TallerCamplink = lazy(() => import('./views/TallerCamplink'));
const CrearPublicacionTaller = lazy(() => import('./views/CrearPublicacionTaller'));
const LugarDetalle = lazy(() => import('./views/LugarDetalle'));
const PerfilExplorador = lazy(() => import('./views/PerfilExplorador'));
const PerfilPublico = lazy(() => import('./views/PerfilPublico'));
const OrganizarViaje = lazy(() => import('./views/OrganizarViaje'));
const VitrinaTrofeos = lazy(() => import('./views/VitrinaTrofeos'));
const HomeDashboard = lazy(() => import('./views/HomeDashboard'));

// Modales con Lazy Loading
const ModalCheckIn = lazy(() => import('./components/ModalCheckIn'));
const ModalCrearLugar = lazy(() => import('./components/ModalCrearLugar'));
const RadarNomadaModal = lazy(() => import('./components/RadarNomadaModal'));
const NotificacionTrofeoModal = lazy(() => import('./components/NotificacionTrofeoModal'));
const TutorialBienvenidaModal = lazy(() => import('./components/TutorialBienvenidaModal'));

// Fallback de Carga Nómada Glassmorphic
function CargandoCamper() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '16px',
      color: 'var(--accent-forest)'
    }}>
      <div style={{
        width: '46px',
        height: '46px',
        borderRadius: '50%',
        border: '3.5px solid rgba(35, 83, 52, 0.15)',
        borderTopColor: 'var(--accent-forest)',
        animation: 'girarCamper 0.75s linear infinite'
      }} />
      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        Cargando experiencia nómada...
      </span>
      <style>{`
        @keyframes girarCamper {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  // Aquí controlo la navegación de la SPA según la sesión activa del usuario
  const { usuario, cargando: authCargando } = useAuth();
  // Enrutador Dinámico Bidireccional SPA (Sincronización con la URL del Navegador)
  const parsearRutaActual = () => {
    const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    if (pathname === '/mapa' || pathname === '/descubre') return { vista: 'descubre' };
    if (pathname === '/lugares' || pathname === '/lista' || pathname === '/catalogo') return { vista: 'descubre_lista' };
    if (pathname === '/diario') return { vista: 'diario' };
    if (pathname === '/organizar') return { vista: 'organizar' };
    if (pathname === '/perfil') return { vista: 'perfil' };
    if (pathname === '/guia' || pathname === '/taller') return { vista: 'taller' };
    if (pathname === '/taller/crear' || pathname === '/taller/nuevo') return { vista: 'taller_crear' };
    if (pathname === '/trofeos') return { vista: 'trofeos' };
    const matchLugar = pathname.match(/^\/lugar\/(\d+)/);
    if (matchLugar) return { vista: 'lugar_detalle', lugarId: parseInt(matchLugar[1]) };
    const matchExplorador = pathname.match(/^\/explorador\/(\d+)/);
    if (matchExplorador) return { vista: 'perfil_publico', usuarioId: parseInt(matchExplorador[1]) };
    return { vista: 'landing' };
  };

  const inicial = parsearRutaActual();
  const [vistaActiva, setVistaActiva] = useState(
    inicial.vista !== 'landing' ? inicial.vista : (usuario ? 'home' : 'landing')
  );
  const [lugarSeleccionadoId, setLugarSeleccionadoId] = useState(inicial.lugarId || null);
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState(inicial.usuarioId || null);
  const [publicacionAEditar, setPublicacionAEditar] = useState(null);

  // Modales Globales
  const [modalCheckInLugar, setModalCheckInLugar] = useState(null);
  const [toastCheckinAlerta, setToastCheckinAlerta] = useState(null);
  const [verificandoGpsCheckin, setVerificandoGpsCheckin] = useState(false);
  const [modalNuevoLugarAbierto, setModalNuevoLugarAbierto] = useState(false);
  const [modalRadarAbierto, setModalRadarAbierto] = useState(false);
  const [radarUbicacion, setRadarUbicacion] = useState(null);
  const [trofeosCelebracion, setTrofeosCelebracion] = useState(null);
  const [modalTutorialAbierto, setModalTutorialAbierto] = useState(false);
  const [lugarProgramadoHoy, setLugarProgramadoHoy] = useState(null);
  const [descartadoLugarHoy, setDescartadoLugarHoy] = useState(false);

  // Comprobar si el explorador tiene un lugar programado para la fecha de hoy
  useEffect(() => {
    if (usuario) {
      const hoyKey = new Date().toISOString().split('T')[0];
      import('./services/api').then(({ peticionApi }) => {
        peticionApi('/api/viajes/rutas/lugar-hoy/')
          .then(res => {
            if (res?.lugar) {
              const yaRealizado = localStorage.getItem(`camplink_checkin_realizado_${res.lugar.id}_${hoyKey}`);
              if (!yaRealizado) {
                setLugarProgramadoHoy(res.lugar);
              } else {
                setLugarProgramadoHoy(null);
              }
            } else {
              setLugarProgramadoHoy(null);
            }
          })
          .catch(err => console.warn('Comprobación de lugar programado para hoy:', err));
      });
    } else {
      setLugarProgramadoHoy(null);
    }
  }, [usuario]);

  // Lanzar tutorial guiado automáticamente al iniciar sesión por primera vez
  useEffect(() => {
    if (usuario) {
      const storageKey = `camplink_tutorial_visto_${usuario.id || usuario.username}`;
      const yaVisto = localStorage.getItem(storageKey);
      if (!yaVisto) {
        setModalTutorialAbierto(true);
      }
    }
  }, [usuario]);

  const cerrarTutorial = () => {
    setModalTutorialAbierto(false);
    if (usuario) {
      const storageKey = `camplink_tutorial_visto_${usuario.id || usuario.username}`;
      localStorage.setItem(storageKey, 'true');
    }
  };

  const abrirTutorial = () => {
    setModalTutorialAbierto(true);
  };

  const abrirRadarConUbicacion = (ubicacion = null) => {
    // Aquí abro el radar centrado opcionalmente en una parada o lugar seleccionado
    setRadarUbicacion(ubicacion);
    setModalRadarAbierto(true);
  };

  // Escuchar navegación del historial del navegador (Atrás / Adelante)
  useEffect(() => {
    const manejarPopState = () => {
      const ruta = parsearRutaActual();
      if (ruta.lugarId) setLugarSeleccionadoId(ruta.lugarId);
      if (ruta.usuarioId) setUsuarioSeleccionadoId(ruta.usuarioId);
      setVistaActiva(ruta.vista === 'landing' && usuario ? 'home' : ruta.vista);
    };
    window.addEventListener('popstate', manejarPopState);
    return () => window.removeEventListener('popstate', manejarPopState);
  }, [usuario]);

  // Sincronizar URL en la barra de direcciones al cambiar de vista
  useEffect(() => {
    let targetPath = '/';
    if (vistaActiva === 'descubre') targetPath = '/mapa';
    else if (vistaActiva === 'descubre_lista') targetPath = '/lugares';
    else if (vistaActiva === 'diario') targetPath = '/diario';
    else if (vistaActiva === 'organizar') targetPath = '/organizar';
    else if (vistaActiva === 'perfil') targetPath = '/perfil';
    else if (vistaActiva === 'taller_crear') targetPath = '/taller/crear';
    else if (vistaActiva === 'guia' || vistaActiva === 'taller') targetPath = '/taller';
    else if (vistaActiva === 'trofeos') targetPath = '/trofeos';
    else if (vistaActiva === 'lugar_detalle' && lugarSeleccionadoId) targetPath = `/lugar/${lugarSeleccionadoId}`;
    else if (vistaActiva === 'perfil_publico' && usuarioSeleccionadoId) targetPath = `/explorador/${usuarioSeleccionadoId}`;
    else if (vistaActiva === 'home') targetPath = '/';
    else if (vistaActiva === 'landing') targetPath = '/';

    const currentPath = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    const currentSearch = window.location.search;

    if (currentPath !== targetPath) {
      // Preservar query params (ej. ?post=X&comentario=Y o ?id=X o ?revision=X) si vamos a diario o taller
      const searchToKeep = (targetPath === '/diario' || targetPath === '/taller') ? currentSearch : '';
      window.history.pushState({ vista: vistaActiva }, '', `${targetPath}${searchToKeep}`);
    }
  }, [vistaActiva, lugarSeleccionadoId, usuarioSeleccionadoId, authCargando]);

  // Si el usuario inicia sesión y está en landing, la primera página por defecto es el Diario de Ruta
  useEffect(() => {
    if (authCargando) return; // Esperar a que la autenticación inicial finalice

    if (usuario && vistaActiva === 'landing' && (window.location.pathname === '/' || window.location.pathname === '')) {
      setVistaActiva('home');
    } else if (!usuario && vistaActiva !== 'landing' && vistaActiva !== 'descubre' && vistaActiva !== 'descubre_lista' && vistaActiva !== 'guia' && vistaActiva !== 'taller') {
      setVistaActiva('landing');
    }
  }, [usuario, authCargando, vistaActiva]);

  useEffect(() => {
    // Aquí actualizo el título SEO del navegador para cada vista
    const titulosPorVista = {
      home: 'Camplink | Inicio',
      landing: 'Camplink | La Comunidad Camper y Autocaravanista',
      diario: 'Diario de Ruta | Red Social de Exploradores',
      descubre: 'Mapa Camper en Vivo | Camplink',
      descubre_lista: 'Lugares y Pernoctas Camper | Camplink',
      guia: 'Taller Camplink | Manuales y Consejos Técnicos',
      taller: 'Taller Camplink | Mantenimiento, Brico y Piezas 3D',
      taller_crear: 'Publicar en el Taller Camplink | Camplink',
      lugar_detalle: 'Detalle de Lugar de Pernocta | Camplink',
      perfil: 'Mi Perfil Camper, Mis Viajes y Trofeos | Camplink',
      perfil_publico: 'Perfil del Explorador | Camplink',
      organizar: 'Organizar y Planificar Viaje Camper | Camplink',
      trofeos: 'Vitrina de Trofeos | Camplink'
    };

    document.title = titulosPorVista[vistaActiva] || 'Camplink';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [vistaActiva]);

  const abrirDetalleLugar = (id) => {
    // Aquí abro la ficha detallada de un lugar específico
    setLugarSeleccionadoId(id);
    setVistaActiva('lugar_detalle');
  };

  // Guardamos la vista de procedencia antes de abrir el perfil público
  const [vistaPreviaPerfil, setVistaPreviaPerfil] = useState(null);

  const abrirPerfilUsuario = (id) => {
    // Aquí abro el perfil público de otro explorador recordando la vista previa
    setVistaPreviaPerfil(vistaActiva !== 'perfil_publico' ? vistaActiva : 'diario');
    setUsuarioSeleccionadoId(id);
    setVistaActiva('perfil_publico');
  };

  const mostrarAlertaCheckin = (mensaje = 'Acércate más al lugar o activa el GPS') => {
    setToastCheckinAlerta(mensaje);
    setTimeout(() => {
      setToastCheckinAlerta(null);
    }, 4500);
  };

  const abrirCheckIn = async (lugar) => {
    if (!lugar) return;

    // Si el lugar cuenta con coordenadas geográficas, validar restricción de 20 km
    if (lugar.latitud != null && lugar.longitud != null) {
      setVerificandoGpsCheckin(true);
      try {
        const pos = await obtenerPosicionGps();
        const distKm = calcularDistanciaKm(
          pos.coords.latitude,
          pos.coords.longitude,
          parseFloat(lugar.latitud),
          parseFloat(lugar.longitud)
        );

        if (distKm == null || distKm > 20) {
          mostrarAlertaCheckin('Acércate más al lugar o activa el GPS');
          setVerificandoGpsCheckin(false);
          return;
        }
      } catch (err) {
        console.warn('Geolocalización GPS requerida para Check-in:', err);
        mostrarAlertaCheckin('Acércate más al lugar o activa el GPS');
        setVerificandoGpsCheckin(false);
        return;
      }
      setVerificandoGpsCheckin(false);
    }

    // Distancia válida dentro de los 20 km permitidos
    setModalCheckInLugar(lugar);
  };

  return (
    <div className="camplink-app" style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      {/* Barra de Navegación */}
      <Navbar
        vistaActiva={vistaActiva}
        setVistaActiva={setVistaActiva}
        abrirRadar={() => abrirRadarConUbicacion(null)}
        abrirNuevoLugar={() => setModalNuevoLugarAbierto(true)}
        alVerPerfilUsuario={abrirPerfilUsuario}
        abrirTutorial={abrirTutorial}
        abrirLoginModal={() => {
          setVistaActiva('landing');
          setTimeout(() => {
            document.getElementById('seccion-auth')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />

      {/* NOTIFICACIÓN INTERACTIVA DE LUGAR PROGRAMADO PARA HOY */}
      {usuario && lugarProgramadoHoy && !descartadoLugarHoy && (
        <div style={{
          width: '100%',
          background: 'linear-gradient(90deg, #1B3826 0%, #2A543A 50%, #1B3826 100%)',
          borderBottom: '2px solid var(--accent-forest)',
          color: '#FFFFFF',
          padding: '12px 50px 12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          position: 'relative',
          zIndex: 100,
          animation: 'fadeIn 0.3s ease'
        }}>
          {/* Botón X para cerrar arriba a la derecha */}
          <button
            type="button"
            onClick={() => setDescartadoLugarHoy(true)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.75)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Cerrar aviso"
          >
            <X size={18} />
          </button>

          <div style={{
            maxWidth: '1200px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ fontSize: '0.94rem', color: '#FFFFFF' }}>
              <span>¿Estás en <strong>{lugarProgramadoHoy.nombre}</strong>? Haz check-in al llegar para registrar tu pernocta</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => abrirDetalleLugar(lugarProgramadoHoy.id)}
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  color: '#FFFFFF',
                  borderColor: 'rgba(255,255,255,0.35)',
                  fontSize: '0.82rem',
                  padding: '5px 12px'
                }}
              >
                Ver Lugar
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => abrirCheckIn(lugarProgramadoHoy)}
                style={{
                  background: 'var(--accent-earth)',
                  borderColor: 'var(--accent-earth)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  padding: '5px 14px'
                }}
              >
                Hacer Check-in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido Dinámico de la SPA con Error Boundary y Suspense para Lazy Loading */}
      <main style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', minHeight: 0 }}>
        <ErrorBoundary onReset={() => setVistaActiva(usuario ? 'home' : 'landing')}>
          <Suspense fallback={<CargandoCamper />}>
            {/* Landing Page para usuarios no autenticados en vista landing */}
            {(!usuario && (vistaActiva === 'landing' || !vistaActiva)) && (
              <LandingPage
                setVistaActiva={setVistaActiva}
                abrirNuevoLugar={() => setModalNuevoLugarAbierto(true)}
              />
            )}

            {/* Home Dashboard para usuarios autenticados */}
            {usuario && vistaActiva === 'home' && (
              <HomeDashboard
                setVistaActiva={setVistaActiva}
                abrirRadar={() => abrirRadarConUbicacion(null)}
              />
            )}

            {/* Diario de Ruta (autenticados o cuando usuario está activo en landing) */}
            {(vistaActiva === 'diario' || (usuario && vistaActiva === 'landing')) && (
              usuario ? (
                <DiarioDeRuta
                  alSeleccionarLugar={abrirDetalleLugar}
                  alVerPerfilUsuario={abrirPerfilUsuario}
                  abrirTutorial={abrirTutorial}
                />
              ) : (
                <LandingPage
                  setVistaActiva={setVistaActiva}
                  abrirNuevoLugar={() => setModalNuevoLugarAbierto(true)}
                />
              )
            )}

            {/* Descubre Mapa (disponible para todos) */}
            {vistaActiva === 'descubre' && (
              <DescubreMapa
                alSeleccionarLugar={abrirDetalleLugar}
                alHacerCheckin={abrirCheckIn}
                alCambiarALista={() => setVistaActiva('descubre_lista')}
              />
            )}

            {/* Descubre Lista (disponible para todos) */}
            {vistaActiva === 'descubre_lista' && (
              <DescubreLista
                alSeleccionarLugar={abrirDetalleLugar}
                alCambiarAMapa={() => setVistaActiva('descubre')}
                alAbrirNuevoLugar={() => setModalNuevoLugarAbierto(true)}
                alNavegarOrganizar={() => setVistaActiva('organizar')}
              />
            )}

            {/* Taller Camplink - Hub Unificado (disponible para todos) */}
            {(vistaActiva === 'taller' || vistaActiva === 'guia') && (
              <TallerCamplink
                alCrearPublicacion={() => {
                  setPublicacionAEditar(null);
                  setVistaActiva('taller_crear');
                }}
                alEditarPublicacion={(pub) => {
                  setPublicacionAEditar(pub);
                  setVistaActiva('taller_crear');
                }}
                alVerPerfilUsuario={abrirPerfilUsuario}
              />
            )}

            {/* Crear o Editar Publicación en el Taller */}
            {vistaActiva === 'taller_crear' && (
              <CrearPublicacionTaller
                publicacionAEditar={publicacionAEditar}
                alVolver={() => {
                  setPublicacionAEditar(null);
                  setVistaActiva('taller');
                }}
                alPublicarExitoso={() => {
                  setPublicacionAEditar(null);
                  setVistaActiva('taller');
                }}
              />
            )}

            {/* Detalle de Lugar de Pernocta */}
            {vistaActiva === 'lugar_detalle' && (
              <LugarDetalle
                lugarId={lugarSeleccionadoId}
                alVolver={() => setVistaActiva('descubre')}
                alHacerCheckin={abrirCheckIn}
                alNavegarOrganizar={() => setVistaActiva('organizar')}
                abrirRadar={abrirRadarConUbicacion}
              />
            )}

            {/* Mi Perfil de Explorador */}
            {vistaActiva === 'perfil' && (
              usuario ? (
                <PerfilExplorador
                  alSeleccionarLugar={abrirDetalleLugar}
                  alVerPerfilUsuario={abrirPerfilUsuario}
                  alNavegarOrganizar={() => setVistaActiva('organizar')}
                  abrirRadar={abrirRadarConUbicacion}
                  abrirTutorial={abrirTutorial}
                />
              ) : (
                <LandingPage
                  setVistaActiva={setVistaActiva}
                  abrirNuevoLugar={() => setModalNuevoLugarAbierto(true)}
                />
              )
            )}

            {/* Organizar Viaje */}
            {vistaActiva === 'organizar' && (
              <OrganizarViaje
                alSeleccionarLugar={abrirDetalleLugar}
                alExplorarMapa={() => setVistaActiva('descubre')}
                abrirRadar={abrirRadarConUbicacion}
              />
            )}

            {/* Vitrina de Trofeos */}
            {vistaActiva === 'trofeos' && (
              <VitrinaTrofeos />
            )}

            {/* Perfil Público Nómada */}
            {vistaActiva === 'perfil_publico' && (
              <PerfilPublico
                usuarioId={usuarioSeleccionadoId}
                origenVista={vistaPreviaPerfil}
                alVolver={() => setVistaActiva(vistaPreviaPerfil || (usuario ? 'diario' : 'descubre'))}
                alSeleccionarLugar={abrirDetalleLugar}
              />
            )}

            {/* Fallback de seguridad si ninguna clave de vista coincide */}
            {!['home', 'landing', 'diario', 'descubre', 'descubre_lista', 'guia', 'taller', 'taller_crear', 'lugar_detalle', 'perfil', 'organizar', 'trofeos', 'perfil_publico'].includes(vistaActiva) && (
              usuario ? (
                <HomeDashboard
                  setVistaActiva={setVistaActiva}
                  abrirRadar={() => abrirRadarConUbicacion(null)}
                />
              ) : (
                <LandingPage
                  setVistaActiva={setVistaActiva}
                  abrirNuevoLugar={() => setModalNuevoLugarAbierto(true)}
                />
              )
            )}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Pie de Página */}
      {(!usuario || (vistaActiva !== 'home' && vistaActiva !== 'descubre' && vistaActiva !== 'descubre_lista')) && (
        <Footer setVistaActiva={setVistaActiva} />
      )}

      {/* TOAST FLOTANTE DE RESTRICCIÓN DE DISTANCIA CHECK-IN */}
      {toastCheckinAlerta && (
        <div style={{
          position: 'fixed',
          top: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999999,
          background: 'rgba(32, 14, 14, 0.96)',
          border: '1.5px solid #EF4444',
          color: '#FEE2E2',
          padding: '13px 24px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 35px rgba(0,0,0,0.55)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 700,
          fontSize: '0.94rem',
          maxWidth: '92vw',
          backdropFilter: 'blur(12px)',
          animation: 'fadeIn 0.25s ease'
        }}>
          <span style={{ fontSize: '1.3rem' }}>📍</span>
          <span>{toastCheckinAlerta}</span>
        </div>
      )}

      {/* INDICADOR DE VERIFICACIÓN GPS AL ABRIR CHECK-IN */}
      {verificandoGpsCheckin && (
        <div style={{
          position: 'fixed',
          top: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999999,
          background: 'rgba(16, 30, 22, 0.95)',
          border: '1.5px solid var(--accent-forest)',
          color: '#A3E635',
          padding: '10px 20px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 600,
          backdropFilter: 'blur(10px)'
        }}>
          <span>🛰️</span>
          <span>Comprobando cercanía GPS al lugar...</span>
        </div>
      )}

      {/* MODALES GLOBALES CON LAZY LOADING (Solo si está autenticado) */}
      <Suspense fallback={null}>
        {usuario && modalCheckInLugar && (
          <ModalCheckIn
            lugar={modalCheckInLugar}
            alCerrar={() => setModalCheckInLugar(null)}
            alCompletar={(res) => {
              if (res?.nuevos_trofeos && res.nuevos_trofeos.length > 0) {
                setTrofeosCelebracion(res.nuevos_trofeos);
              }
              // Ocultar notificación permanentemente tras hacer check-in
              setLugarProgramadoHoy(null);
              setDescartadoLugarHoy(true);
              if (modalCheckInLugar?.id) {
                try {
                  const hoyKey = new Date().toISOString().split('T')[0];
                  localStorage.setItem(`camplink_checkin_realizado_${modalCheckInLugar.id}_${hoyKey}`, 'true');
                } catch(e){}
              }
              setVistaActiva('perfil');
            }}
          />
        )}

        {usuario && modalNuevoLugarAbierto && (
          <ModalCrearLugar
            alCerrar={() => setModalNuevoLugarAbierto(false)}
            cerrado={() => setModalNuevoLugarAbierto(false)}
            alCompletar={() => {
              setModalNuevoLugarAbierto(false);
              setVistaActiva('descubre');
            }}
          />
        )}

        {usuario && modalRadarAbierto && (
          <RadarNomadaModal
            alCerrar={() => {
              setModalRadarAbierto(false);
              setRadarUbicacion(null);
            }}
            ubicacionInicial={radarUbicacion}
            alSeleccionarLugar={abrirDetalleLugar}
            alHacerCheckin={abrirCheckIn}
          />
        )}

        {trofeosCelebracion && (
          <NotificacionTrofeoModal
            trofeosNuevos={trofeosCelebracion}
            alCerrar={() => setTrofeosCelebracion(null)}
          />
        )}

        {usuario && modalTutorialAbierto && (
          <TutorialBienvenidaModal
            alCerrar={cerrarTutorial}
            alNavegar={(vista) => {
              cerrarTutorial();
              setVistaActiva(vista);
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
