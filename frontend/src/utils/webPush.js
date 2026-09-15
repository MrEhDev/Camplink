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

export async function suscribirNotificacionesPush(forzarRenovacion = false) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { exito: false, motivo: 'unsupported' };
  }

  try {
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') {
      return { exito: false, motivo: 'denied' };
    }

    // Asegurar registro de SW
    let reg = await navigator.serviceWorker.ready;
    if (!reg) {
      reg = await registrarServiceWorker();
      reg = await navigator.serviceWorker.ready;
    }
    
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

    // Si forzamos renovación o si no existía, crear suscripción con la clave VAPID actual
    if (suscripcion && forzarRenovacion) {
      try {
        await suscripcion.unsubscribe();
        suscripcion = null;
      } catch (e) {
        console.warn('Error al renovar suscripción anterior:', e);
      }
    }

    if (!suscripcion) {
      suscripcion = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    }

    // Enviar suscripción al backend vinculando al usuario actual
    const resBackend = await peticionApi('/api/exploradores/webpush-subscribir/', {
      method: 'POST',
      data: suscripcion.toJSON()
    });

    return { exito: true, suscripcion, backend: resBackend };
  } catch (error) {
    console.error('Error suscribiendo a push:', error);
    return { exito: false, error };
  }
}

export async function sincronizarPushSiPermitido() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return;
  }
  try {
    // Si ya está permitido, aseguramos que la suscripción coincida con la VAPID del backend
    await suscribirNotificacionesPush(false);
  } catch (e) {
    console.debug('Sincronización silenciosa de Push:', e);
  }
}

export async function enviarPushDePrueba() {
  // Renovamos la suscripción asegurando par de claves VAPID frescas
  await suscribirNotificacionesPush(true);
  return await peticionApi('/api/exploradores/webpush-probar/', {
    method: 'POST'
  });
}
