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
  User, Radar, Menu, X, Sparkles, Navigation, Bell, Check, Heart, MessageSquare, UserPlus, Trophy, Info, Shield 
} from 'lucide-react';
import { peticionApi } from '../services/api';

const formatearUsuario = (u) => {
  if (!u) return '';
  const s = String(u);
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function Navbar({ 
  vistaActiva, 
  setVistaActiva, 
  abrirRadar, 
  abrirNuevoLugar, 
  abrirLoginModal, 
  alVerPerfilUsuario 
}) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [panelNotifsAbierto, setPanelNotifsAbierto] = useState(false);
  const [toastNotif, setToastNotif] = useState(null);
  const prevNoLeidasRef = React.useRef(0);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const { usuario, logout } = useAuth();
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
    try {
      await peticionApi('/api/exploradores/notificaciones/', {
        method: 'POST',
        data: notifId ? { notificacion_id: notifId } : {}
      });
      if (notifId) {
        setNotificaciones(prev => prev.map(n => n.id === notifId ? { ...n, leida: true } : n));
        setNoLeidas(prev => Math.max(0, prev - 1));
      } else {
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
        setNoLeidas(0);
      }
    } catch (e) {
      console.warn('Error al marcar notificaciones:', e);
    }
  };

  const manejarClickNotificacion = (notif) => {
    marcarNotificacionesLeidas(notif.id);
    setPanelNotifsAbierto(false);
    if (notif.enlace?.startsWith('/explorador/')) {
      const userId = parseInt(notif.enlace.replace('/explorador/', ''));
      if (alVerPerfilUsuario && userId) {
        alVerPerfilUsuario(userId);
        return;
      }
    }
    if (notif.enlace === '/diario' || notif.tipo === 'comentario' || notif.tipo === 'reaccion') {
      setVistaActiva('diario');
      return;
    }
    if (notif.tipo === 'trofeo') {
      setVistaActiva('perfil');
      return;
    }
  };

  const navegar = (vista) => {
    setVistaActiva(vista);
    setMenuMovilAbierto(false);
  };

  return (
    <header className="camplink-navbar">
      <div className="camplink-container">
        <div className="navbar-inner">
          
          {/* LADO IZQUIERDO: BOTÓN HAMBURGUESA MÓVIL + ISOTIPO LOGO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* BOTÓN HAMBURGUESA MÓVIL */}
            <button 
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
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                cursor: 'pointer',
                flexShrink: 0
              }}
              title="Abrir menú de navegación"
            >
              {menuMovilAbierto ? <X size={19} /> : <Menu size={19} />}
            </button>

            {/* ISOTIPO LOGO DE LA WEB (SUSTITUYE AL NOMBRE) */}
            <div 
              className="navbar-brand" 
              onClick={() => navegar(usuario ? 'diario' : 'landing')} 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
              title="Camplink | Conectando Comunidad al Aire Libre"
            >
              <img 
                src="/camplink-logo.png" 
                alt="Camplink Logo" 
                className="navbar-brand-logo"
              />
            </div>
          </div>

          {/* NAVEGACIÓN ESCRITORIO (OCULTA EN MÓVIL) */}
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
                    className={`nav-link ${(vistaActiva === 'descubre' || vistaActiva === 'descubre_lista') ? 'active' : ''}`}
                    onClick={() => navegar('descubre')}
                    style={{ height: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Map size={16} />
                    <span>{t('nav_descubre')}</span>
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
                    className={`nav-link ${vistaActiva === 'guia' ? 'active' : ''}`}
                    onClick={() => navegar('guia')}
                    style={{ height: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <BookOpen size={16} />
                    <span>{t('nav_guia')}</span>
                  </button>
                </li>
                <li>
                  <button 
                    className={`nav-link ${vistaActiva === 'taller' ? 'active' : ''}`}
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
          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* SELECTOR DE TEMA */}
            <button 
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
                background: 'var(--bg-surface)',
                border: '1.5px solid var(--border-color)',
                flexShrink: 0,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            >
              {tema === 'claro' && <Sun size={19} color="#EAB308" strokeWidth={2.3} />}
              {tema === 'oscuro' && <Moon size={19} color="#38BDF8" strokeWidth={2.3} />}
              {(tema === 'puesta_de_sol' || tema === 'calido') && <Sunset size={19} color="#F97316" strokeWidth={2.3} />}
            </button>

            {/* SELECTOR DE IDIOMA */}
            <button 
              className="btn-icon lang-toggle-btn" 
              onClick={alternarIdioma} 
              title="Cambiar idioma (ES / EN)"
              style={{
                height: '36px',
                width: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                fontWeight: 700,
                fontSize: '0.74rem',
                flexShrink: 0
              }}
            >
              {idioma.toUpperCase()}
            </button>

            {/* CAMPANA DE NOTIFICACIONES */}
            {usuario && (
              <div style={{ position: 'relative' }} className="notif-wrapper">
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
                    background: noLeidas > 0 ? 'rgba(35, 83, 52, 0.25)' : 'var(--bg-surface)',
                    border: noLeidas > 0 ? '1.5px solid var(--accent-forest)' : '1.5px solid var(--border-color)',
                    cursor: 'pointer',
                    position: 'relative',
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
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
                      maxWidth: '90vw',
                      maxHeight: '440px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 12px 35px rgba(0,0,0,0.3)',
                      zIndex: 1000,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      backdropFilter: 'blur(16px)'
                    }}
                  >
                    {/* Header de Notificaciones */}
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bell size={15} color="var(--accent-forest)" />
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Notificaciones</span>
                        {noLeidas > 0 && (
                          <span className="badge-camper badge-forest" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                            {noLeidas} nuevas
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => forzarNotificacionPrueba('reaccion')}
                          style={{ background: 'rgba(35, 83, 52, 0.2)', border: '1px solid var(--accent-forest)', color: 'var(--accent-forest)', fontSize: '0.72rem', fontWeight: 700, borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                          title="Enviar una notificación simulada de prueba para comprobar en vivo"
                        >
                          ⚡ Probar
                        </button>
                        {noLeidas > 0 && (
                          <button
                            type="button"
                            onClick={() => marcarNotificacionesLeidas()}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-forest)', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                          >
                            Marcar leídas
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Lista de Notificaciones */}
                    <div style={{ overflowY: 'auto', flex: 1, maxHeight: '360px' }}>
                      {notificaciones.length === 0 ? (
                        <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          <Bell size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                          <p style={{ margin: 0, fontSize: '0.84rem' }}>No tienes notificaciones aún.</p>
                        </div>
                      ) : (
                        notificaciones.map((n) => {
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
                                {esComentario && <MessageSquare size={15} />}
                                {esReaccion && <Heart size={15} fill="#EF4444" />}
                                {esTrofeo && <Trophy size={15} />}
                                {!esSeguidor && !esComentario && !esReaccion && !esTrofeo && <Info size={15} />}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
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
            )}

            {/* ACCIONES DE ESCRITORIO (RADAR Y AÑADIR LUGAR) */}
            {usuario && (
              <>
                <button 
                  className="btn btn-secondary btn-sm desktop-only-action" 
                  onClick={abrirRadar}
                  style={{
                    height: '36px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0 10px',
                    borderRadius: 'var(--radius-full)'
                  }}
                  title="Radar Nómada"
                >
                  <Radar size={14} color="var(--accent-earth)" />
                  <span style={{ fontSize: '0.8rem' }}>Radar</span>
                </button>

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
                  <span style={{ fontSize: '0.8rem' }}>Añadir</span>
                </button>
              </>
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
                onClick={logout} 
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

        {/* MENÚ MÓVIL DESPLEGABLE COMPLETO CON FONDO OPACO */}
        {menuMovilAbierto && (
          <div className="mobile-nav-dropdown" style={{
            position: 'absolute',
            top: '80px',
            left: 0,
            right: 0,
            width: '100%',
            background: 'var(--bg-surface)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            borderBottom: '2px solid var(--border-color)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
            zIndex: 1005,
            padding: '16px 16px 24px',
            boxSizing: 'border-box'
          }}>
            {usuario && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => { abrirRadar(); setMenuMovilAbierto(false); }}
                  style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.84rem' }}
                >
                  <Radar size={16} color="var(--accent-earth)" /> <span>Radar Nómada</span>
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => { abrirNuevoLugar(); setMenuMovilAbierto(false); }}
                  style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.84rem' }}
                >
                  <PlusCircle size={16} /> <span>Añadir Lugar</span>
                </button>
              </div>
            )}

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {usuario ? (
                <>
                  <li>
                    <button 
                      className={`nav-link ${vistaActiva === 'diario' ? 'active' : ''}`}
                      onClick={() => navegar('diario')}
                      style={{ width: '100%', height: '40px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px', borderRadius: 'var(--radius-sm)' }}
                    >
                      <Compass size={17} /> <span>{t('nav_diario')}</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`nav-link ${vistaActiva === 'descubre' ? 'active' : ''}`}
                      onClick={() => navegar('descubre')}
                      style={{ width: '100%', height: '40px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px', borderRadius: 'var(--radius-sm)' }}
                    >
                      <Map size={17} /> <span>🗺️ Descubre (Mapa)</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`nav-link ${vistaActiva === 'descubre_lista' ? 'active' : ''}`}
                      onClick={() => navegar('descubre_lista')}
                      style={{ width: '100%', height: '40px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px', borderRadius: 'var(--radius-sm)' }}
                    >
                      <Navigation size={17} /> <span>📋 Descubre (Lista)</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`nav-link ${vistaActiva === 'organizar' ? 'active' : ''}`}
                      onClick={() => navegar('organizar')}
                      style={{ width: '100%', height: '40px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px', borderRadius: 'var(--radius-sm)' }}
                    >
                      <Route size={17} /> <span>Organizar Viaje</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`nav-link ${vistaActiva === 'guia' ? 'active' : ''}`}
                      onClick={() => navegar('guia')}
                      style={{ width: '100%', height: '40px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px', borderRadius: 'var(--radius-sm)' }}
                    >
                      <BookOpen size={17} /> <span>{t('nav_guia')}</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`nav-link ${vistaActiva === 'taller' ? 'active' : ''}`}
                      onClick={() => navegar('taller')}
                      style={{ width: '100%', height: '40px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px', borderRadius: 'var(--radius-sm)' }}
                    >
                      <Wrench size={17} /> <span>{t('nav_taller')}</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`nav-link ${vistaActiva === 'perfil' ? 'active' : ''}`}
                      onClick={() => navegar('perfil')}
                      style={{ width: '100%', height: '40px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px', borderRadius: 'var(--radius-sm)' }}
                    >
                      <User size={17} /> <span className="user-capitalized">Mi Perfil ({formatearUsuario(usuario.username)})</span>
                    </button>
                  </li>
                  <li style={{ marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                    <button 
                      className="nav-link"
                      onClick={() => { logout(); setMenuMovilAbierto(false); }}
                      style={{ width: '100%', height: '40px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px', color: '#EF4444' }}
                    >
                      <LogOut size={17} /> <span>{t('nav_logout')}</span>
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
                    style={{ width: '100%', height: '42px', justifyContent: 'center' }}
                  >
                    <LogIn size={18} /> <span>{t('nav_login')}</span>
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
