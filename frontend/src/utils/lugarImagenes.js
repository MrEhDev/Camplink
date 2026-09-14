// Aquí defino las imágenes preestablecidas para cada tipo de lugar camper,
// la función universal construirUrlImagen para normalizar medios locales y remotos,
// y la función de resolución para obtener la foto principal o su fallback representativo por categoría.

export const IMAGENES_PREESTABLECIDAS_POR_TIPO = {
  pernocta_libre: '/img/tipos/pernocta_libre.jpg',
  area_autocaravanas: '/img/tipos/area_autocaravanas.jpg',
  camping: '/img/tipos/camping.jpg',
  parking_urbano: '/img/tipos/parking_urbano.jpg',
  area_recreativa: '/img/tipos/area_recreativa.jpg',
  solo_servicios: '/img/tipos/solo_servicios.jpg',
};

export const ETIQUETAS_TIPO_LUGAR = {
  pernocta_libre: { emoji: '🌲', label: 'Pernocta Libre (Naturaleza)' },
  area_autocaravanas: { emoji: '🚐', label: 'Área de Autocaravanas' },
  camping: { emoji: '⛺', label: 'Camping' },
  parking_urbano: { emoji: '🅿️', label: 'Parking Urbano / Mixto' },
  area_recreativa: { emoji: '🏞️', label: 'Área Recreativa / Merendero' },
  solo_servicios: { emoji: '💧', label: 'Solo Servicios' },
};

/**
 * Normaliza cualquier URL de imagen del proyecto (local, relativa, media, blob, o remota).
 * Evita fallos en móvil o diferentes hosts al eliminar dominios hardcodeados 127.0.0.1:8000
 * y anteponer /media/ si la ruta es relativa devuelta por Django.
 */
export function construirUrlImagen(url) {
  if (!url) return '';
  if (typeof url !== 'string') return '';
  const limpia = url.trim();
  if (!limpia) return '';

  // 1. Vistas previas en cliente (Blob o Base64 Data URL)
  if (limpia.startsWith('blob:') || limpia.startsWith('data:')) {
    return limpia;
  }

  // 2. Si viene con host local (127.0.0.1:8000 o localhost:8000), quitarlo para usar proxy relativo de Vite
  const sinHost = limpia.replace(/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/, '');

  // 3. URLs externas completas (http://... o https://...)
  if (sinHost.startsWith('http://') || sinHost.startsWith('https://')) {
    return sinHost;
  }

  // 4. Si ya empieza por barra (/media/, /img/, /static/, etc.)
  if (sinHost.startsWith('/')) {
    return sinHost;
  }

  // 5. Ruta relativa de Django media ("lugares/...", "checkins/...", "diario/...", "avatares/...", etc.)
  return `/media/${sinHost}`;
}

export function tieneImagenPropia(lugar) {
  if (!lugar) return false;
  const fp = lugar.foto_principal ? String(lugar.foto_principal).split('?')[0] : '';
  if (fp) {
    const esDefaultMedia = Object.keys(IMAGENES_PREESTABLECIDAS_POR_TIPO).some(tipo => 
      fp.endsWith(`/${tipo}.jpg`) || 
      fp.includes(`/lugares/${tipo}.jpg`) || 
      fp.includes(`lugares/${tipo}.jpg`) || 
      fp.includes(`/img/tipos/${tipo}.jpg`)
    );
    if (!esDefaultMedia) {
      return true;
    }
  }
  if (lugar.fotos && lugar.fotos.length > 0 && lugar.fotos[0]?.imagen) {
    return true;
  }
  return false;
}

export function obtenerImagenLugar(lugar) {
  if (!lugar) return '/img/tipos/pernocta_libre.jpg?v=5';

  // Si el lugar tiene una foto auténtica propia subida por un usuario
  if (tieneImagenPropia(lugar)) {
    const raw = lugar.foto_principal || (lugar.fotos && lugar.fotos[0]?.imagen);
    if (raw) {
      return construirUrlImagen(raw);
    }
  }

  if (lugar.fotos && lugar.fotos.length > 0 && lugar.fotos[0]?.imagen) {
    return construirUrlImagen(lugar.fotos[0].imagen);
  }

  // En cualquier otro caso, resolver dinámicamente según el tipo de lugar con cache-buster para evitar imágenes cacheadas
  const tipo = lugar.tipo_lugar || 'pernocta_libre';
  const imgPath = IMAGENES_PREESTABLECIDAS_POR_TIPO[tipo] || IMAGENES_PREESTABLECIDAS_POR_TIPO.pernocta_libre;
  return `${imgPath}?v=5`;
}
