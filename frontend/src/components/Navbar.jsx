// Aquí implemento la barra de navegación Mobile First y Glassmorphism para Camplink,
// con el isotipo oficial de Camplink como logo, menú hamburguesa a la izquierda del selector de tema,
// y altura optimizada de 80px en versión móvil.

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n/LanguageContext';
import { 
  Compass, Map, Wrench, BookOpen, Route, Calendar, 
  Sun, Moon, Sunset, PlusCircle, LogIn, LogOut, 
  User, Radar, Menu, X, Sparkles, Navigation, Bell, Check, Heart, MessageSquare, MessageCircle, UserPlus, Trophy, Award, Info, Shield 
} from 'lucide-react';
import { peticionApi } from '../services/api';

const formatearUsuario = (u) => {
  if (!u) return '';
  const s = String(u).trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

export default function Navbar({ 
  vistaActiva, 
  setVistaActiva, 
  abrirRadar, 
  abrirNuevoLugar, 
  abrirLoginModal, 
  alVerPerfilUsuario,
  abrirTutorial,
  tieneAvisoCheckin = false
}) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [panelNotifsAbierto, setPanelNotifsAbierto] = useState(false);
  const [toastNotif, setToastNotif] = useState(null);
  const [haciendoScroll, setHaciendoScroll] = useState(false);
  const prevNoLeidasRef = React.useRef(0);
  const notifWrapperRef = React.useRef(null);

  // Detectar scroll para atenuar botones flotantes superiores en móvil
  React.useEffect(() => {
    const manejarScroll = () => {
      const pos = window.scrollY || document.documentElement.scrollTop || 0;
      setHaciendoScroll(pos > 20);
    };
    window.addEventListener('scroll', manejarScroll, { passive: true });
    return () => window.removeEventListener('scroll', manejarScroll);
  }, []);

  // Cerrar panel de notificaciones al hacer clic fuera de forma segura en escritorio y móvil
  React.useEffect(() => {
    const handleClickFuera = (e) => {
      if (!e.target.closest('.notif-wrapper') && !e.target.closest('.notif-dropdown-panel')) {
        setPanelNotifsAbierto(false);
      }
    };
    if (panelNotifsAbierto) {
      document.addEventListener('mousedown', handleClickFuera);
      document.addEventListener('touchstart', handleClickFuera);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickFuera);
      document.removeEventListener('touchstart', handleClickFuera);
    };
  }, [panelNotifsAbierto]);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const { usuario, logout } = useAuth();

  const manejarLogout = async () => {
    setVistaActiva('landing');
    setMenuMovilAbierto(false);
    await logout();
  };
  const { tema, cambiarTema } = useTheme();
  const { idioma, cambiarIdioma, t } = useTranslation();

  const alternarTema = () => {
    if (tema === 'claro') cambiarTema('oscuro');
    else if (tema === 'oscuro') cambiarTema('puesta_de_sol');
    else cambiarTema('claro');
  };

  const alternarIdioma = () => {
    cambiarIdioma(idioma === 'es' ? 'en' : 'es');
  };

  const cargarNotificaciones = async () => {
    if (!usuario) return;
    try {
      const res = await peticionApi('/api/exploradores/notificaciones/');
      if (res) {
        const nuevasNotifs = res.notificaciones || [];
        const nuevoNoLeidas = res.no_leidas || 0;
        
        // Si hay una nueva notificación entrante, lanzar Toast emergente en pantalla
        if (nuevoNoLeidas > prevNoLeidasRef.current && nuevasNotifs.length > 0) {
          const masReciente = nuevasNotifs[0];
          if (!masReciente.leida) {
            setToastNotif(masReciente);
            setTimeout(() => setToastNotif(null), 6000);
          }
        }
        prevNoLeidasRef.current = nuevoNoLeidas;
        setNotificaciones(nuevasNotifs);
        setNoLeidas(nuevoNoLeidas);
      }
    } catch (e) {
      console.warn('Error al cargar notificaciones:', e);
    }
  };

  React.useEffect(() => {
    cargarNotificaciones();
    if (usuario) {
      // Polling cada 4 segundos para actualización en vivo de comentarios, likes y seguidores
      const interval = setInterval(cargarNotificaciones, 4000);
      return () => clearInterval(interval);
    }
  }, [usuario]);

    const forzarNotificacionPrueba = async (tipo = 'reaccion') => {
    try {
      const res = await peticionApi('/api/exploradores/notificaciones/probar/', {
        method: 'POST',
        data: { tipo }
      });
      if (res?.notificacion) {
        setToastNotif(res.notificacion);
        setTimeout(() => setToastNotif(null), 6000);
        cargarNotificaciones();
      }
    } catch (e) {
      console.warn('Error al forzar notificacion:', e);
    }
  };

  const marcarNotificacionesLeidas = async (notifId = null) => {
    // Actualización optimista e inmediata para que desaparezca al instante de la lista
    if (notifId) {
      setNotificaciones(prev => prev.map(n => n.id === notifId ? { ...n, leida: true } : n));
      setNoLeidas(prev => Math.max(0, prev - 1));
    } else {
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
    }
    try {
      await peticionApi('/api/exploradores/notificaciones/', {
        method: 'POST',
        data: notifId ? { notificacion_id: notifId } : {}
      });
    } catch (e) {
      console.warn('Error al marcar notificaciones:', e);
    }
  };

  const manejarClickNotificacion = (notif) => {
    // 1. Descartar de la lista y cerrar el panel de forma inmediata
    marcarNotificacionesLeidas(notif.id);
    setPanelNotifsAbierto(false);

    const enlace = notif.enlace || '';
    const tipo = notif.tipo || '';
    const tituloLower = (notif.titulo || '').toLowerCase();
    const mensajeLower = (notif.mensaje || '').toLowerCase();

    // 1. Enlace a perfil de explorador: /explorador/123 o tipo 'seguimiento'
    if (enlace.startsWith('/explorador/') || tipo === 'seguimiento') {
      const matchUserId = enlace.match(/\/explorador\/(\d+)/);
      const userId = matchUserId ? parseInt(matchUserId[1]) : (notif.usuario_origen_id || null);
      if (alVerPerfilUsuario && userId) {
        alVerPerfilUsuario(userId);
        return;
      }
    }

    // 2. Enlace a detalle de lugar de pernocta: /lugar/123 o /?lugar=123
    const matchLugar = enlace.match(/\/lugar\/(\d+)/) || enlace.match(/[?&]lugar=(\d+)/);
    if (matchLugar) {
      const lugarId = parseInt(matchLugar[1]);
      if (alSeleccionarLugar && lugarId) {
        alSeleccionarLugar(lugarId);
        return;
      }
    }

    // 3. Enlace a Taller Camplink: /taller, /taller?id=..., /taller?publicacion=..., /taller?revision=...
    const esDeTaller = enlace.includes('/taller') ||
                       tipo === 'taller' ||
                       tipo === 'moderacion_taller' ||
                       tituloLower.includes('brico') ||
                       tituloLower.includes('taller') ||
                       mensajeLower.includes('taller');

    if (esDeTaller) {
      let targetUrl = enlace.includes('/taller') ? enlace : '/taller';
      window.history.pushState({}, '', targetUrl);
      setVistaActiva('taller');
      window.dispatchEvent(new Event('popstate'));
      return;
    }

    // 4. Enlace a Trofeos
    if (tipo === 'trofeo' || enlace.includes('/trofeos') || tituloLower.includes('trofeo') || tituloLower.includes('vitrina')) {
      window.history.pushState({}, '', '/trofeos');
      setVistaActiva('trofeos');
      window.dispatchEvent(new Event('popstate'));
      return;
    }

    // 5. Enlace a Organizar Viaje / Invitación compartida
    if (enlace.includes('/organizar') || tipo === 'grupo' || tituloLower.includes('viaje') || mensajeLower.includes('viaje')) {
      window.history.pushState({}, '', '/organizar');
      setVistaActiva('organizar');
      window.dispatchEvent(new Event('popstate'));
      return;
    }

    // 6. Enlace a Perfil
    if (enlace.includes('/perfil')) {
      window.history.pushState({}, '', '/perfil');
      setVistaActiva('perfil');
      window.dispatchEvent(new Event('popstate'));
      return;
    }

    // 7. Enlace a Diario de Ruta: /diario, /diario?post=...
    if (enlace.includes('/diario') || tipo === 'comentario' || tipo === 'reaccion' || tituloLower.includes('vivencia') || tituloLower.includes('diario') || tituloLower.includes('coment')) {
      const targetUrl = enlace.includes('/diario') ? enlace : '/diario';
      window.history.pushState({}, '', targetUrl);
      setVistaActiva('diario');
      window.dispatchEvent(new Event('popstate'));
      return;
    }

    // 8. Enlace a Mapa / Descubre
    if (enlace.includes('/mapa') || enlace.includes('/descubre') || enlace.includes('/lugares')) {
      window.history.pushState({}, '', '/mapa');
      setVistaActiva('descubre');
      window.dispatchEvent(new Event('popstate'));
      return;
    }

    // 9. Fallback si tiene cualquier enlace relativo
    if (enlace && enlace.startsWith('/')) {
      window.history.pushState({}, '', enlace);
      const clean = enlace.split('?')[0].replace('/', '');
      if (clean) setVistaActiva(clean);
      window.dispatchEvent(new Event('popstate'));
    }

    // Enlace genérico
    if (enlace) {
      window.history.pushState({}, '', enlace);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const navegar = (vista) => {
    setVistaActiva(vista);
    setMenuMovilAbierto(false);
  };

  const renderBotonTema = () => (
    <button 
      key="btn-tema"
      className="btn-icon theme-toggle-btn" 
      onClick={alternarTema} 
      title={`Modo de visualización actual: ${tema}. Clic para cambiar.`}
      style={{
        height: '38px',
        width: '38px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: 'var(--bg-surface-elevated)',
        border: '1.5px solid var(--border-color)',
        flexShrink: 0,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
      }}
    >
      {tema === 'claro' && <Sun size={19} color="#EAB308" strokeWidth={2.3} />}
      {tema === 'oscuro' && <Moon size={19} color="#38BDF8" strokeWidth={2.3} />}
      {(tema === 'puesta_de_sol' || tema === 'calido') && <Sunset size={19} color="#F97316" strokeWidth={2.3} />}
    </button>
  );

  const renderBotonIdioma = () => (
    <button 
      key="btn-idioma"
      className="btn-icon lang-toggle-btn" 
      onClick={alternarIdioma} 
      title="Cambiar idioma (ES / EN)"
      style={{
        height: '38px',
        width: '38px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: 'var(--bg-surface-elevated)',
        border: '1.5px solid var(--border-color)',
        fontWeight: 700,
        fontSize: '0.74rem',
        color: 'var(--text-primary)',
        flexShrink: 0,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
      }}
    >
      {idioma.toUpperCase()}
    </button>
  );

  const renderCampanaNotificaciones = () => {
    if (!usuario) return null;
    return (
      <div ref={notifWrapperRef} style={{ position: 'relative' }} className="notif-wrapper">
        <button
          type="button"
          className="btn-icon notif-bell-btn"
          onClick={() => setPanelNotifsAbierto(!panelNotifsAbierto)}
          title={noLeidas > 0 ? `${noLeidas} notificaciones nuevas` : "Notificaciones nómadas"}
          style={{
            height: '38px',
            width: '38px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: noLeidas > 0 ? 'rgba(35, 83, 52, 0.25)' : 'var(--bg-surface-elevated)',
            border: noLeidas > 0 ? '1.5px solid var(--accent-forest)' : '1.5px solid var(--border-color)',
            cursor: 'pointer',
            position: 'relative',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}
        >
          <Bell size={18} color={noLeidas > 0 ? 'var(--accent-forest)' : 'var(--text-primary)'} />
          {noLeidas > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: '0.68rem',
                fontWeight: 800,
                minWidth: '18px',
                height: '18px',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
              }}
            >
              {noLeidas > 99 ? '99+' : noLeidas}
            </span>
          )}
        </button>

        {/* PANEL FLOTANTE DE NOTIFICACIONES */}
        {panelNotifsAbierto && (
          <div
            className="notif-dropdown-panel"
            style={{
              position: 'absolute',
              top: '48px',
              right: '0',
              width: '350px',
              maxWidth: 'calc(100vw - 24px)',
              maxHeight: '440px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 12px 35px rgba(0,0,0,0.35)',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            {/* Header de Notificaciones */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={15} color="var(--accent-forest)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Notificaciones</span>
                {noLeidas > 0 && (
                  <span style={{
                    fontSize: '0.70rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(35, 83, 52, 0.25)',
                    color: 'var(--accent-forest)',
                    border: '1px solid var(--accent-forest)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    lineHeight: 1
                  }}>
                    {noLeidas} nuevas
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {noLeidas > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      marcarNotificacionesLeidas();
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-forest)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    Marcar leídas
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Notificaciones */}
            <div style={{ overflowY: 'auto', flex: 1, maxHeight: '360px' }}>
              {notificaciones.filter(n => !n.leida).length === 0 ? (
                <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Bell size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: '0.84rem' }}>No tienes notificaciones pendientes.</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', opacity: 0.8 }}>Todas las leídas están archivadas en tu perfil.</p>
                </div>
              ) : (
                notificaciones.filter(n => !n.leida).map((n) => {
                  const esSeguidor = n.tipo === 'seguimiento';
                  const esComentario = n.tipo === 'comentario';
                  const esReaccion = n.tipo === 'reaccion';
                  const esTrofeo = n.tipo === 'trofeo';

                  return (
                    <div
                      key={n.id}
                      onClick={() => manejarClickNotificacion(n)}
                      style={{
                        padding: '12px 14px',
                        borderBottom: '1px solid var(--border-color)',
                        background: n.leida ? 'transparent' : 'rgba(35, 83, 52, 0.08)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = n.leida ? 'transparent' : 'rgba(35, 83, 52, 0.08)'}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: esSeguidor ? 'rgba(59, 130, 246, 0.2)' : esComentario ? 'rgba(16, 185, 129, 0.2)' : esReaccion ? 'rgba(239, 68, 68, 0.2)' : esTrofeo ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.1)',
                          color: esSeguidor ? '#3B82F6' : esComentario ? '#10B981' : esReaccion ? '#EF4444' : esTrofeo ? '#F59E0B' : 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        {esSeguidor && <UserPlus size={15} />}
                        {esComentario && <MessageCircle size={15} />}
                        {esReaccion && <Heart size={15} />}
                        {esTrofeo && <Award size={15} />}
                        {!esSeguidor && !esComentario && !esReaccion && !esTrofeo && <Sparkles size={15} />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {n.usuario_origen_nombre && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (n.usuario_origen_id && alVerPerfilUsuario) {
                                alVerPerfilUsuario(n.usuario_origen_id);
                                setPanelNotifsAbierto(false);
                              }
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              color: 'var(--accent-forest)',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              marginBottom: '2px'
                            }}
                            title={`Ver perfil de ${n.usuario_origen_nombre}`}
                          >
                            <User size={12} /> @{n.usuario_origen_nombre}
                          </button>
                        )}
                        <div style={{ fontSize: '0.84rem', fontWeight: n.leida ? 600 : 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {n.titulo}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.35', wordBreak: 'break-word' }}>
                          {n.mensaje}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {new Date(n.fecha_creacion).toLocaleDateString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {!n.leida && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-forest)', flexShrink: 0, marginTop: '6px' }} />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* 1. NAVBAR SUPERIOR PARA ESCRITORIO (PC) */}
      <header className="camplink-navbar desktop-only-navbar">
        <div className="camplink-container">
          <div className="navbar-inner" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
            
            {/* LADO IZQUIERDO: BOTÓN HAMBURGUESA TABLET + LOGO */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* BOTÓN HAMBURGUESA TABLET */}
              <button 
                type="button"
                className="btn-hamburger mobile-nav-toggle"
                onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
                style={{
                  height: '38px',
                  width: '38px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: menuMovilAbierto ? 'var(--accent-forest)' : 'var(--bg-glass)',
                  color: menuMovilAbierto ? '#FFFFFF' : 'var(--text-primary)',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title="Abrir menú de navegación"
              >
                {menuMovilAbierto ? <X size={19} /> : <Menu size={19} />}
              </button>

              <div 
                className="navbar-brand" 
                onClick={() => navegar(usuario ? 'home' : 'landing')} 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                title="Camplink | Conectando Comunidad al Aire Libre"
              >
                <img loading="lazy" decoding="async" 
                  src="/camplink-logo.png" 
                  alt="Camplink Logo" 
                  className="navbar-brand-logo"
                />
                <span className="navbar-brand-name" style={{ marginLeft: '8px', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                  Camplink
                </span>
              </div>
            </div>

            {/* NAVEGACIÓN ESCRITORIO */}
            {usuario && (
              <nav className="desktop-nav">
                <ul className="navbar-nav" style={{ display: 'flex', gap: '6px', listStyle: 'none', margin: 0, padding: 0 }}>
                  <li>
                    <button 
                      className={`nav-link ${vistaActiva === 'diario' ? 'active' : ''}`}
                      onClick={() => navegar('diario')}
                      style={{ height: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Compass size={16} />
                      <span>{t('nav_diario')}</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`nav-link ${vistaActiva === 'descubre_lista' ? 'active' : ''}`}
                      onClick={() => navegar('descubre_lista')}
                      style={{ height: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Navigation size={16} />
                      <span>{t('nav_lugares', 'Lugares')}</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`nav-link ${vistaActiva === 'descubre' ? 'active' : ''}`}
                      onClick={() => navegar('descubre')}
                      style={{ height: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Map size={16} />
                      <span>{t('nav_descubre', 'Mapa')}</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`nav-link ${vistaActiva === 'organizar' ? 'active' : ''}`}
                      onClick={() => navegar('organizar')}
                      style={{ height: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Route size={16} />
                      <span>Organizar Viaje</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`nav-link ${vistaActiva === 'taller' || vistaActiva === 'taller_crear' || vistaActiva === 'guia' ? 'active' : ''}`}
                      onClick={() => navegar('taller')}
                      style={{ height: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Wrench size={16} />
                      <span>{t('nav_taller')}</span>
                    </button>
                  </li>
                </ul>
              </nav>
            )}

            {/* LADO DERECHO: ACCIONES RÁPIDAS + TEMA + IDIOMA + PERFIL */}
            <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
              {renderBotonTema()}
              {renderBotonIdioma()}
              {renderCampanaNotificaciones()}

              {/* BOTÓN RADAR EN ESCRITORIO */}
              {usuario && (
                <button 
                  className="btn btn-secondary btn-sm nav-radar-btn" 
                  onClick={abrirRadar}
                  style={{
                    height: '36px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '0 10px',
                    borderRadius: 'var(--radius-full)',
                    border: '1.5px solid var(--accent-earth)',
                    background: 'rgba(217, 119, 6, 0.14)',
                    flexShrink: 0
                  }}
                  title="Radar Nómada: gasolineras, servicios y puntos clave"
                >
                  <Radar size={16} color="var(--accent-earth)" />
                  <span className="nav-radar-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Radar</span>
                </button>
              )}

              {/* AÑADIR LUGAR EN ESCRITORIO */}
              {usuario && (
                <button 
                  className="btn btn-primary btn-sm desktop-only-action" 
                  onClick={abrirNuevoLugar}
                  style={{
                    height: '36px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0 10px',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  <PlusCircle size={14} />
                  <span style={{ fontSize: '0.8rem' }}>Lugar</span>
                </button>
              )}

              {/* PERFIL O LOGIN */}
              {usuario ? (
                <button 
                  className={`btn ${vistaActiva === 'perfil' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => navegar('perfil')}
                  style={{
                    height: '36px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '0 10px',
                    borderRadius: 'var(--radius-full)',
                    flexShrink: 0
                  }}
                  title="Mi Perfil"
                >
                  <User size={14} />
                  <span className="user-capitalized" style={{ maxWidth: '75px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.78rem' }}>
                    {formatearUsuario(usuario.username)}
                  </span>
                </button>
              ) : (
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={abrirLoginModal}
                  style={{
                    height: '36px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}
                >
                  {t('nav_login')}
                </button>
              )}

              {/* LOGOUT EN ESCRITORIO */}
              {usuario && (
                <button 
                  className="btn-icon desktop-only-action" 
                  onClick={manejarLogout} 
                  title={t('nav_logout')}
                  style={{
                    height: '36px',
                    width: '36px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MENÚ DESPLEGABLE EN VISTA TABLET */}
        {menuMovilAbierto && (
          <div className="mobile-nav-dropdown" style={{
            position: 'absolute',
            top: '64px',
            left: 0,
            right: 0,
            width: '100%',
            background: 'var(--bg-surface-elevated)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            borderBottom: '2px solid var(--border-color)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
            zIndex: 1005,
            padding: '16px 20px 24px',
            boxSizing: 'border-box'
          }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {usuario ? (
                <>
                  <li>
                    <button
                      className={`nav-link ${vistaActiva === 'diario' ? 'active' : ''}`}
                      onClick={() => navegar('diario')}
                      style={{ width: '100%', height: '44px', justifyContent: 'flex-start', padding: '0 16px', gap: '10px', fontSize: '0.95rem' }}
                    >
                      <Compass size={18} color="var(--accent-forest)" />
                      <span>{t('nav_diario')}</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`nav-link ${vistaActiva === 'descubre_lista' ? 'active' : ''}`}
                      onClick={() => navegar('descubre_lista')}
                      style={{ width: '100%', height: '44px', justifyContent: 'flex-start', padding: '0 16px', gap: '10px', fontSize: '0.95rem' }}
                    >
                      <Navigation size={18} color="#38BDF8" />
                      <span>{t('nav_lugares', 'Lugares')}</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`nav-link ${vistaActiva === 'descubre' ? 'active' : ''}`}
                      onClick={() => navegar('descubre')}
                      style={{ width: '100%', height: '44px', justifyContent: 'flex-start', padding: '0 16px', gap: '10px', fontSize: '0.95rem' }}
                    >
                      <Map size={18} color="var(--accent-earth)" />
                      <span>{t('nav_descubre', 'Mapa')}</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`nav-link ${vistaActiva === 'organizar' ? 'active' : ''}`}
                      onClick={() => navegar('organizar')}
                      style={{ width: '100%', height: '44px', justifyContent: 'flex-start', padding: '0 16px', gap: '10px', fontSize: '0.95rem' }}
                    >
                      <Route size={18} color="#8B5CF6" />
                      <span>Organizar Viaje</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`nav-link ${vistaActiva === 'taller' || vistaActiva === 'taller_crear' || vistaActiva === 'guia' ? 'active' : ''}`}
                      onClick={() => navegar('taller')}
                      style={{ width: '100%', height: '44px', justifyContent: 'flex-start', padding: '0 16px', gap: '10px', fontSize: '0.95rem' }}
                    >
                      <Wrench size={18} color="var(--accent-forest)" />
                      <span>{t('nav_taller')}</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`nav-link ${vistaActiva === 'perfil' ? 'active' : ''}`}
                      onClick={() => navegar('perfil')}
                      style={{ width: '100%', height: '44px', justifyContent: 'flex-start', padding: '0 16px', gap: '10px', fontSize: '0.95rem' }}
                    >
                      <User size={18} color="#EAB308" />
                      <span>Mi Perfil (@{usuario.username})</span>
                    </button>
                  </li>
                  <li style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                    <button
                      className="nav-link"
                      onClick={manejarLogout}
                      style={{ width: '100%', height: '44px', justifyContent: 'flex-start', padding: '0 16px', gap: '10px', fontSize: '0.95rem', color: '#EF4444' }}
                    >
                      <LogOut size={18} />
                      <span>{t('nav_logout')}</span>
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      abrirLoginModal();
                      setMenuMovilAbierto(false);
                    }}
                    style={{ width: '100%', height: '44px', justifyContent: 'center' }}
                  >
                    <LogIn size={18} /> <span>{t('nav_login')}</span>
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </header>

      {/* 2. CONTROLES FLOTANTES SUPERIORES EN MÓVIL (TEMA + IDIOMA A LA IZQUIERDA, NOTIFICACIONES A LA DERECHA) */}
      <div className={`mobile-top-floating-bar ${tieneAvisoCheckin ? 'con-aviso-checkin' : ''} ${haciendoScroll ? 'scrolled' : ''}`}>
        <div className="mobile-top-floating-left">
          {renderBotonTema()}
          {renderBotonIdioma()}
        </div>
        <div className="mobile-top-floating-right">
          {renderCampanaNotificaciones()}
        </div>
      </div>

      {/* 3. BARRA DE NAVEGACIÓN INFERIOR MÓVIL (BOTTOM NAVIGATION BAR) */}
      <nav className="mobile-bottom-nav">
        {/* 1. Diario */}
        <button
          type="button"
          className={`mobile-bottom-nav-item ${vistaActiva === 'diario' ? 'active' : ''}`}
          onClick={() => navegar('diario')}
          title="Diario de Ruta"
        >
          <Compass size={19} />
          <span>Diario</span>
        </button>

        {/* 2. Lista */}
        <button
          type="button"
          className={`mobile-bottom-nav-item ${vistaActiva === 'descubre_lista' ? 'active' : ''}`}
          onClick={() => navegar('descubre_lista')}
          title="Lugares en Lista"
        >
          <Navigation size={19} />
          <span>Lista</span>
        </button>

        {/* 3. Mapa */}
        <button
          type="button"
          className={`mobile-bottom-nav-item ${vistaActiva === 'descubre' ? 'active' : ''}`}
          onClick={() => navegar('descubre')}
          title="Lugares en Mapa"
        >
          <Map size={19} />
          <span>Mapa</span>
        </button>

        {/* 4. Inicio - LOGO MÁS GRANDE Y DESTACADO */}
        <button
          type="button"
          className={`mobile-bottom-nav-item mobile-bottom-nav-home ${vistaActiva === 'landing' || vistaActiva === 'home' ? 'active' : ''}`}
          onClick={() => navegar(usuario ? 'home' : 'landing')}
          title="Inicio Camplink"
        >
          <div className="mobile-home-icon-wrap">
            <img
              src="/camplink-logo.png"
              alt="Inicio"
              className="mobile-home-icon"
            />
          </div>
          <span>Inicio</span>
        </button>

        {/* 5. Viaje */}
        <button
          type="button"
          className={`mobile-bottom-nav-item ${vistaActiva === 'organizar' ? 'active' : ''}`}
          onClick={() => navegar('organizar')}
          title="Organizar Viaje"
        >
          <Route size={19} />
          <span>Viaje</span>
        </button>

        {/* 6. Taller */}
        <button
          type="button"
          className={`mobile-bottom-nav-item ${vistaActiva === 'taller' || vistaActiva === 'taller_crear' || vistaActiva === 'guia' ? 'active' : ''}`}
          onClick={() => navegar('taller')}
          title="Taller Camplink"
        >
          <Wrench size={19} />
          <span>Taller</span>
        </button>

        {/* 7. Perfil */}
        <button
          type="button"
          className={`mobile-bottom-nav-item ${vistaActiva === 'perfil' ? 'active' : ''}`}
          onClick={() => usuario ? navegar('perfil') : abrirLoginModal()}
          title={usuario ? `Perfil de @${usuario.username}` : 'Iniciar Sesión'}
        >
          <User size={19} />
          <span>{usuario ? 'Perfil' : 'Entrar'}</span>
        </button>
      </nav>

      {/* 4. BOTÓN FLOTANTE DE RADAR (EN EL AIRE, DIRECTAMENTE SOBRE EL ICONO DE PERFIL) */}
      <button
        type="button"
        className="mobile-floating-radar"
        onClick={abrirRadar}
        title="Radar Nómada: gasolineras baratas y servicios cercanos"
      >
        <Radar size={22} color="#FFFFFF" />
      </button>
    </>
  );
}
