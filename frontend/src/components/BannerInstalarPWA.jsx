import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function BannerInstalarPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    // Si ya está instalada como Web App, NUNCA mostrar
    const yaInstalada = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true ||
                        localStorage.getItem('camplink_pwa_instalada') === 'true';
    if (yaInstalada) {
      setMostrar(false);
      return;
    }

    // Solo mostrar el prompt de instalación en dispositivos móviles (smartphones/tablets)
    const esMovil = /Android|iPhone|iPad|iPod|Mobile|webOS/i.test(navigator.userAgent) || window.innerWidth <= 768;
    if (!esMovil) return;

    // Si ya lo descartó en esta sesión o recientemente, no molestar
    const descartado = localStorage.getItem('camplink_pwa_descartada');
    if (descartado) return;

    const handler = (e) => {
      // Guardar evento globalmente para el botón de instalar en perfil
      window.__camplink_pwa_prompt = e;

      // Doble verificación: solo móviles y si no está instalada
      const esMovilActual = /Android|iPhone|iPad|iPod|Mobile|webOS/i.test(navigator.userAgent) || window.innerWidth <= 768;
      const instalada = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true ||
                        localStorage.getItem('camplink_pwa_instalada') === 'true';
      if (!esMovilActual || instalada) return;

      e.preventDefault();
      setDeferredPrompt(e);
      setMostrar(true);
    };

    const handleAppInstalled = () => {
      localStorage.setItem('camplink_pwa_instalada', 'true');
      setMostrar(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstalar = async () => {
    const promptEvent = deferredPrompt || window.__camplink_pwa_prompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('camplink_pwa_instalada', 'true');
      setMostrar(false);
    }
    setDeferredPrompt(null);
    window.__camplink_pwa_prompt = null;
  };

  const handleDescartar = () => {
    setMostrar(false);
    try {
      localStorage.setItem('camplink_pwa_descartada', 'true');
    } catch (e) {}
  };

  if (!mostrar) return null;

  return (
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
  );
}
