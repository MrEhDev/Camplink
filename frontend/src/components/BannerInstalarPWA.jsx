import React, { useState, useEffect } from 'react';
import { Download, X, Share, Info } from 'lucide-react';

export default function BannerInstalarPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(window.__camplink_pwa_prompt || null);
  const [mostrar, setMostrar] = useState(false);
  const [mostrarInstruccionesIos, setMostrarInstruccionesIos] = useState(false);
  const [mostrarInstruccionesAndroid, setMostrarInstruccionesAndroid] = useState(false);

  useEffect(() => {
    // 1. Si ya se está ejecutando en modo app PWA instalada (standalone), NO mostrar nunca
    const esStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone === true ||
                         document.referrer.includes('android-app://');
    if (esStandalone) {
      setMostrar(false);
      return;
    }

    // 2. Solo mostrar en dispositivos móviles (o pantallas móviles)
    const esMovil = /Android|iPhone|iPad|iPod|Mobile|webOS/i.test(navigator.userAgent) || window.innerWidth <= 768;
    if (!esMovil) {
      setMostrar(false);
      return;
    }

    // 3. Si se descartó en esta sesión activa, no molestar durante esta navegación
    const descartadoSesion = sessionStorage.getItem('camplink_pwa_descartada_sesion');
    if (descartadoSesion === 'true') {
      setMostrar(false);
      return;
    }

    // 4. Mostrar el banner tras un breve retardo de entrada
    const timer = setTimeout(() => {
      setMostrar(true);
    }, 800);

    // Escuchar el evento nativo cuando se capture
    const handlePromptAvailable = (e) => {
      const promptEvent = e.detail || e;
      window.__camplink_pwa_prompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setMostrar(true);
    };

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      window.__camplink_pwa_prompt = e;
      setDeferredPrompt(e);
      setMostrar(true);
    };

    const handleAppInstalled = () => {
      localStorage.setItem('camplink_pwa_instalada', 'true');
      setMostrar(false);
      window.dispatchEvent(new Event('camplink:pwa_instalada'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('camplink:pwa_prompt_available', handlePromptAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('camplink:pwa_prompt_available', handlePromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstalar = async () => {
    const promptEvent = deferredPrompt || window.__camplink_pwa_prompt;

    if (promptEvent && typeof promptEvent.prompt === 'function') {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem('camplink_pwa_instalada', 'true');
          setMostrar(false);
          window.dispatchEvent(new Event('camplink:pwa_instalada'));
        }
      } catch (err) {
        console.warn('Error al invocar prompt PWA:', err);
      }
      setDeferredPrompt(null);
      window.__camplink_pwa_prompt = null;
      return;
    }

    // Si es dispositivo iOS (Safari / iPhone / iPad) que no soporta beforeinstallprompt
    const esIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (esIos) {
      setMostrarInstruccionesIos(true);
      return;
    }

    // Si es Android pero el navegador no disparó el prompt nativo aún
    setMostrarInstruccionesAndroid(true);
  };

  const handleDescartar = () => {
    setMostrar(false);
    try {
      sessionStorage.setItem('camplink_pwa_descartada_sesion', 'true');
    } catch (e) {}
  };

  if (!mostrar) return null;

  return (
    <>
      <div className="pwa-banner-overlay" role="dialog" aria-label="Instalar Camplink">
        <img
          src="/camplink-logo.png"
          alt="Camplink"
          className="pwa-banner-icon"
        />
        <div className="pwa-banner-content">
          <div className="pwa-banner-title">Instala Camplink</div>
          <div className="pwa-banner-desc">Acceso rápido a mapas, diario y rutas sin ocupar espacio.</div>
        </div>
        <div className="pwa-banner-actions">
          <button
            type="button"
            onClick={handleInstalar}
            className="pwa-btn-instalar"
          >
            Instalar
          </button>
          <button
            type="button"
            onClick={handleDescartar}
            className="pwa-btn-cerrar"
            title="Descartar"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Modal / Ayuda de instalación para iOS */}
      {mostrarInstruccionesIos && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              Cómo instalar en tu iPhone / iPad 📲
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              1. Pulsa el botón <strong>Compartir</strong> (<Share size={15} style={{ verticalAlign: 'middle' }} />) en la barra inferior de Safari.<br />
              2. Desplázate hacia abajo y elige <strong>"Añadir a la pantalla de inicio"</strong>.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setMostrarInstruccionesIos(false)}
              style={{ width: '100%' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal / Ayuda de instalación para navegadores sin prompt automático */}
      {mostrarInstruccionesAndroid && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              Instalar Camplink en tu Android 🚐
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              1. Abre el menú del navegador pulsando los <strong>3 puntos verticales (⋮)</strong> arriba a la derecha.<br />
              2. Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Añadir a la pantalla de inicio"</strong>.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setMostrarInstruccionesAndroid(false)}
              style={{ width: '100%' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
