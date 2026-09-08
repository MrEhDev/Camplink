// Aquí defino las imágenes preestablecidas para cada tipo de lugar camper
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

export function tieneImagenPropia(lugar) {
  if (!lugar) return false;
  if (lugar.foto_principal) {
    const fp = String(lugar.foto_principal).split('?')[0];
    const esDefaultMedia = Object.keys(IMAGENES_PREESTABLECIDAS_POR_TIPO).some(tipo => 
      fp.endsWith(`/${tipo}.jpg`) || fp.includes(`/lugares/${tipo}.jpg`) || fp.includes(`/img/tipos/${tipo}.jpg`)
    );
    if (esDefaultMedia) {
      return false;
    }
    return true;
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
    return lugar.foto_principal || (lugar.fotos && lugar.fotos[0]?.imagen);
  }
  if (lugar.fotos && lugar.fotos.length > 0 && lugar.fotos[0]?.imagen) {
    return lugar.fotos[0].imagen;
  }
  // En cualquier otro caso, resolver dinámicamente según el tipo de lugar con cache-buster para evitar imágenes cacheadas
  const tipo = lugar.tipo_lugar || 'pernocta_libre';
  const imgPath = IMAGENES_PREESTABLECIDAS_POR_TIPO[tipo] || IMAGENES_PREESTABLECIDAS_POR_TIPO.pernocta_libre;
  return `${imgPath}?v=5`;
}
