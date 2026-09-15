import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { suscribirNotificacionesPush } from '../utils/webPush';

export default function BannerActivarPush() {
  const { usuario } = useAuth();
  const [mostrar, setMostrar] = useState(false);
  const [activando, setActivando] = useState(false);

  useEffect(() => {
    const evaluarVisibilidad = () => {
      // 1. Si no hay usuario autenticado o el navegador no soporta Push
      if (!usuario || typeof Notification === 'undefined') {
        setMostrar(false);
        return;
      }

      // 2. Si ya tiene permisos concedidos o denegados, no mostrar
      if (Notification.permission === 'granted' || Notification.permission === 'denied') {
        setMostrar(false);
        return;
      }

      // 3. Si el usuario ya lo descartó previamente en este dispositivo
      if (localStorage.getItem('camplink_push_banner_cerrado') === 'true') {
        setMostrar(false);
        return;
      }

      // 4. SECUENCIA OBLIGATORIA: Primero se recomienda instalar la App.
      // Solo cuando la App esté instalada (modo standalone o instalada flag) se ofrece activar notificaciones Push.
      const esStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           window.navigator.standalone === true ||
                           document.referrer.includes('android-app://');
      const yaInstaladaFlag = localStorage.getItem('camplink_pwa_instalada') === 'true';
      const esMovil = /Android|iPhone|iPad|iPod|Mobile|webOS/i.test(navigator.userAgent) || window.innerWidth <= 768;

      // En dispositivos móviles no instalados, NO mostrar aún (esperar a que se instale)
      if (esMovil && !esStandalone && !yaInstaladaFlag) {
        setMostrar(false);
        return;
      }

      // Si ya está instalada o es escritorio, mostrar el banner de activación
      const timer = setTimeout(() => {
        setMostrar(true);
      }, 1200);

      return timer;
    };

    const timer = evaluarVisibilidad();

    // Escuchar si la app se instala en la sesión activa para mostrar el aviso inmediatamente después
    const handleInstalada = () => {
      setTimeout(() => {
        evaluarVisibilidad();
      }, 800);
    };

    window.addEventListener('camplink:pwa_instalada', handleInstalada);
    window.addEventListener('appinstalled', handleInstalada);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('camplink:pwa_instalada', handleInstalada);
      window.removeEventListener('appinstalled', handleInstalada);
    };
  }, [usuario]);

  const handleActivar = async () => {
    setActivando(true);
    try {
      const res = await suscribirNotificacionesPush(true);
      if (res?.exito) {
        setMostrar(false);
      } else if (res?.motivo === 'denied') {
        setMostrar(false);
      }
    } catch (e) {
      console.warn('Error activando notificaciones push:', e);
    } finally {
      setActivando(false);
      setMostrar(false);
    }
  };

  const handleDescartar = () => {
    setMostrar(false);
    try {
      localStorage.setItem('camplink_push_banner_cerrado', 'true');
    } catch (e) {}
  };

  if (!mostrar) return null;

  return (
    <div className="pwa-banner-overlay push-banner-overlay" role="dialog" aria-label="Activar Notificaciones">
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: 'rgba(35, 83, 52, 0.25)',
        border: '1.5px solid var(--accent-forest)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}>
        <Bell size={22} color="var(--accent-forest)" />
      </div>
      <div className="pwa-banner-content">
        <div className="pwa-banner-title">Activa las Notificaciones</div>
        <div className="pwa-banner-desc">Recibe avisos al instante en tu móvil de comentarios, rutas y bricos.</div>
      </div>
      <div className="pwa-banner-actions">
        <button
          type="button"
          onClick={handleActivar}
          disabled={activando}
          className="pwa-btn-instalar"
          style={{ background: 'var(--accent-forest)', color: '#fff' }}
        >
          {activando ? '...' : 'Activar'}
        </button>
        <button
          type="button"
          onClick={handleDescartar}
          className="pwa-btn-cerrar"
          title="Más tarde"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
