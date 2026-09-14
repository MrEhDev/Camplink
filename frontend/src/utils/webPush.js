// Utilidad para suscripción y gestión de Web Push Notifications en Camplink
import { peticionApi } from '../services/api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registrarServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      return reg;
    } catch (err) {
      console.warn('Error al registrar Service Worker:', err);
      return null;
    }
  }
  return null;
}

export async function suscribirNotificacionesPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { exito: false, motivo: 'unsupported' };
  }

  try {
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') {
      return { exito: false, motivo: 'denied' };
    }

    const reg = await navigator.serviceWorker.ready;
    
    // Obtener la clave pública VAPID del backend
    let vapidPublicKey = '';
    try {
      const resp = await peticionApi('/api/exploradores/webpush-vapid-key/');
      vapidPublicKey = resp?.vapid_public_key;
    } catch (e) {
      console.warn('No se pudo obtener VAPID key del servidor:', e);
    }

    if (!vapidPublicKey) {
      return { exito: false, motivo: 'no_vapid_key' };
    }

    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    let suscripcion = await reg.pushManager.getSubscription();

    if (!suscripcion) {
      suscripcion = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    }

    // Enviar suscripción al backend
    await peticionApi('/api/exploradores/webpush-subscribir/', {
      method: 'POST',
      data: suscripcion.toJSON()
    });

    return { exito: true, suscripcion };
  } catch (error) {
    console.error('Error suscribiendo a push:', error);
    return { exito: false, error };
  }
}
