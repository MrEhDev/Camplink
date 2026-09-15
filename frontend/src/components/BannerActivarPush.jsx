import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { suscribirNotificacionesPush } from '../utils/webPush';

export default function BannerActivarPush() {
  const { usuario } = useAuth();
  const [mostrar, setMostrar] = useState(false);
  const [activando, setActivando] = useState(false);

  useEffect(() => {
    // Si no hay usuario logueado o el navegador no soporta notificaciones, no mostrar
    if (!usuario || typeof Notification === 'undefined') {
      setMostrar(false);
      return;
    }

    // Si ya tiene permisos concedidos o denegados, no mostrar el banner de solicitud inicial
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      setMostrar(false);
      return;
    }

    // Si el usuario ya lo descartó en este navegador, no molestar
    const descartado = localStorage.getItem('camplink_push_banner_cerrado');
    if (descartado === 'true') {
      setMostrar(false);
      return;
    }

    // Pequeño retardo para una entrada suave al iniciar la app
    const timer = setTimeout(() => {
      setMostrar(true);
    }, 1200);

    return () => clearTimeout(timer);
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
        <div className="pwa-banner-desc">Recibe avisos al instante cuando comenten tus viajes, rutas o bricos.</div>
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
