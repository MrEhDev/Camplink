// Aquí implemento el componente raíz de la SPA Camplink,
// gestionando la redirección por defecto al Diario de Ruta para usuarios autenticados,
// el acceso al Perfil de Explorador, Perfil Público nómada, visor de lugares y la notificación festiva de trofeos.

import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './views/LandingPage';
import DescubreMapa from './views/DescubreMapa';
import DescubreLista from './views/DescubreLista';
import DiarioDeRuta from './views/DiarioDeRuta';
import GuiaDelNomada from './views/GuiaDelNomada';
import TallerNomada from './views/TallerNomada';
import LugarDetalle from './views/LugarDetalle';
import PerfilExplorador from './views/PerfilExplorador';
import PerfilPublico from './views/PerfilPublico';
import OrganizarViaje from './views/OrganizarViaje';
import VitrinaTrofeos from './views/VitrinaTrofeos';

import ModalCheckIn from './components/ModalCheckIn';
import ModalCrearLugar from './components/ModalCrearLugar';
import RadarNomadaModal from './components/RadarNomadaModal';
import NotificacionTrofeoModal from './components/NotificacionTrofeoModal';

export default function App() {
  // Aquí controlo la navegación de la SPA según la sesión activa del usuario
  const { usuario } = useAuth();
  const [vistaActiva, setVistaActiva] = useState(usuario ? 'diario' : 'landing');
  const [lugarSeleccionadoId, setLugarSeleccionadoId] = useState(null);
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState(null);

  // Modales Globales
  const [modalCheckInLugar, setModalCheckInLugar] = useState(null);
  const [modalNuevoLugarAbierto, setModalNuevoLugarAbierto] = useState(false);
  const [modalRadarAbierto, setModalRadarAbierto] = useState(false);
  const [radarUbicacion, setRadarUbicacion] = useState(null);
  const [trofeosCelebracion, setTrofeosCelebracion] = useState(null);

  const abrirRadarConUbicacion = (ubicacion = null) => {
    // Aquí abro el radar centrado opcionalmente en una parada o lugar seleccionado
    setRadarUbicacion(ubicacion);
    setModalRadarAbierto(true);
  };

  // Si el usuario inicia sesión y está en landing, la primera página por defecto es el Diario de Ruta
  useEffect(() => {
    if (usuario && vistaActiva === 'landing') {
      setVistaActiva('diario');
    } else if (!usuario) {
      setVistaActiva('landing');
    }
  }, [usuario]);

  useEffect(() => {
    // Aquí actualizo el título SEO del navegador para cada vista
    const titulosPorVista = {
      landing: 'Camplink | La Comunidad Camper y Autocaravanista',
      diario: 'Diario de Ruta | Red Social de Exploradores',
      descubre: 'Descubre Lugares y Mapa Camper en Vivo | Camplink',
      descubre_lista: 'Catálogo de Lugares y Pernoctas Camper | Camplink',
      guia: 'Guía del Nómada | Manuales y Consejos Técnicos',
      taller: 'Taller Nómada | Mantenimiento, Brico y Piezas 3D',
      lugar_detalle: 'Detalle de Lugar de Pernocta | Camplink',
      perfil: 'Mi Perfil Camper, Mis Viajes y Trofeos | Camplink',
      perfil_publico: 'Perfil del Explorador | Camplink',
      organizar: 'Organizar y Planificar Viaje Camper | Camplink',
    };

    document.title = titulosPorVista[vistaActiva] || 'Camplink';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [vistaActiva]);

  const abrirDetalleLugar = (id) => {
    // Aquí abro la ficha detallada de un lugar específico
    setLugarSeleccionadoId(id);
    setVistaActiva('lugar_detalle');
  };

  const abrirPerfilUsuario = (id) => {
    // Aquí abro el perfil público de otro explorador
    setUsuarioSeleccionadoId(id);
    setVistaActiva('perfil_publico');
  };

  const abrirCheckIn = (lugar) => {
    // Aquí despliego el modal para registrar una pernocta en el lugar seleccionado
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
        abrirLoginModal={() => {
          setVistaActiva('landing');
          setTimeout(() => {
            document.getElementById('seccion-auth')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />

      {/* Contenido Dinámico de la SPA */}
      <main style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {!usuario ? (
          <LandingPage
            setVistaActiva={setVistaActiva}
            abrirNuevoLugar={() => setModalNuevoLugarAbierto(true)}
          />
        ) : (
          <>
            {vistaActiva === 'diario' && (
              <DiarioDeRuta
                alSeleccionarLugar={abrirDetalleLugar}
                alVerPerfilUsuario={abrirPerfilUsuario}
              />
            )}

            {vistaActiva === 'descubre' && (
              <DescubreMapa
                alSeleccionarLugar={abrirDetalleLugar}
                alHacerCheckin={abrirCheckIn}
                alCambiarALista={() => setVistaActiva('descubre_lista')}
              />
            )}

            {vistaActiva === 'descubre_lista' && (
              <DescubreLista
                alSeleccionarLugar={abrirDetalleLugar}
                alCambiarAMapa={() => setVistaActiva('descubre')}
                alAbrirNuevoLugar={() => setModalCrearLugarAbierto(true)}
                alNavegarOrganizar={() => setVistaActiva('organizar')}
              />
            )}

            {vistaActiva === 'guia' && (
              <GuiaDelNomada />
            )}

            {vistaActiva === 'taller' && (
              <TallerNomada />
            )}

            {vistaActiva === 'lugar_detalle' && (
              <LugarDetalle
                lugarId={lugarSeleccionadoId}
                alVolver={() => setVistaActiva('descubre')}
                alHacerCheckin={abrirCheckIn}
                alNavegarOrganizar={() => setVistaActiva('organizar')}
                abrirRadar={abrirRadarConUbicacion}
              />
            )}

            {vistaActiva === 'perfil' && (
              <PerfilExplorador
                alSeleccionarLugar={abrirDetalleLugar}
                alVerPerfilUsuario={abrirPerfilUsuario}
                alNavegarOrganizar={() => setVistaActiva('organizar')}
                abrirRadar={abrirRadarConUbicacion}
              />
            )}

            {vistaActiva === 'organizar' && (
              <OrganizarViaje
                alSeleccionarLugar={abrirDetalleLugar}
                alExplorarMapa={() => setVistaActiva('descubre')}
                abrirRadar={abrirRadarConUbicacion}
              />
            )}

            {vistaActiva === 'trofeos' && (
              <VitrinaTrofeos />
            )}

            {vistaActiva === 'perfil_publico' && (
              <PerfilPublico
                usuarioId={usuarioSeleccionadoId}
                alVolver={() => setVistaActiva('diario')}
                alSeleccionarLugar={abrirDetalleLugar}
              />
            )}
          </>
        )}
      </main>

      {/* Pie de Página */}
      {(!usuario || (vistaActiva !== 'descubre' && vistaActiva !== 'descubre_lista')) && (
        <Footer setVistaActiva={setVistaActiva} />
      )}

      {/* MODALES GLOBALES (Solo si está autenticado) */}
      {usuario && modalCheckInLugar && (
        <ModalCheckIn
          lugar={modalCheckInLugar}
          alCerrar={() => setModalCheckInLugar(null)}
          alCompletar={(res) => {
            if (res?.nuevos_trofeos && res.nuevos_trofeos.length > 0) {
              setTrofeosCelebracion(res.nuevos_trofeos);
            }
            setVistaActiva('perfil');
          }}
        />
      )}

      {usuario && modalNuevoLugarAbierto && (
        <ModalCrearLugar
          alCerrar={() => setModalNuevoLugarAbierto(false)}
          alCompletar={() => {
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
    </div>
  );
}