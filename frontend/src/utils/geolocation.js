// Utilidad universal para geolocalización rápida en móvil con fallback automático a baja precisión
// y aprovechamiento de caché GPS reciente (maximumAge) para evitar hardware locks con Google Maps.

export function obtenerPosicionGps(opcionesPersonalizadas = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      return reject(new Error('Geolocalización no soportada en este navegador.'));
    }

    const opcionesAltaPrecision = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 10000,
      ...opcionesPersonalizadas
    };

    const opcionesBajaPrecision = {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 30000,
      ...opcionesPersonalizadas
    };

    // 1. Intentar con alta precisión
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => {
        console.warn('Fallo GPS alta precisión o timeout, activando fallback a baja precisión/caché...', err.message);
        // 2. Fallback automático a baja precisión
        navigator.geolocation.getCurrentPosition(
          (posFallback) => resolve(posFallback),
          (errFallback) => {
            console.warn('Error definitivo al obtener geolocalización:', errFallback.message);
            reject(errFallback);
          },
          opcionesBajaPrecision
        );
      },
      opcionesAltaPrecision
    );
  });
}

// Helper síncrono con callbacks para compatibilidad directa
export function obtenerGeolocalizacionRapida(onExito, onError, opciones = {}) {
  obtenerPosicionGps(opciones)
    .then((pos) => onExito && onExito(pos))
    .catch((err) => onError && onError(err));
}

// Cálculo de distancia precisa en kilómetros mediante la fórmula de Haversine
export function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Radio de la Tierra en km
  const dLat = (Number(lat2) - Number(lat1)) * (Math.PI / 180);
  const dLon = (Number(lon2) - Number(lon1)) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(Number(lat1) * (Math.PI / 180)) *
    Math.cos(Number(lat2) * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

