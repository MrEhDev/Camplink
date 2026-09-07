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
  User, Radar, Menu, X, Sparkles, Navigation 
} from 'lucide-react';

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
  abrirLoginModal 
}) {
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
