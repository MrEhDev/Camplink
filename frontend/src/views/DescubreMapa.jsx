import { obtenerImagenLugar } from '../utils/lugarImagenes';
// Aquí implemento la vista Descubre: mapa interactivo a pantalla completa con Leaflet,
// filtro principal multi-selección por tipo_lugar (Pernocta Libre, Área Autocaravanas, Camping, Parking Urbano, Área Recreativa, Solo Servicios),
// cajón modal de filtros categorizados (Servicios, Entorno/Ocio, Terreno/Acceso, Puntuación),
// tarjetas popup premium con soporte de imagen, estética camper de alto contraste,
// capas de Relieve Topográfico, Satélite Natural, Radar de Lluvia y Contaminación Lumínica,
// y modal directo para añadir a viaje planificado.

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CamperIconRating from '../components/CamperIconRating';
import { obtenerGeolocalizacionRapida } from '../utils/geolocation';
import {
  Layers, Filter, Search, MapPin, CloudRain,
  Moon, Users, Crosshair, Droplets, Zap,
  Dog, Sparkles, Navigation, Calendar, Plus, X, Check, Route, Shield,
  TreePine, Home, Tent, Car, Waves, Compass, Trash2, Sun, Eye, ChevronLeft, ChevronRight, ChevronUp, ChevronDown
} from 'lucide-react';

export const TIPOS_LUGAR_MAPA = [
  { id: 'todos', label: 'Todos', emoji: '🌍' },
  { id: 'pernocta_libre', label: 'Pernocta Libre', emoji: '🌲' },
  { id: 'area_autocaravanas', label: 'Área Autocaravanas', emoji: '🚐' },
  { id: 'camping', label: 'Camping', emoji: '⛺' },
  { id: 'parking_urbano', label: 'Parking Urbano', emoji: '🅿️' },
  { id: 'area_recreativa', label: 'Área Recreativa', emoji: '🏞️' },
  { id: 'solo_servicios', label: 'Solo Servicios', emoji: '💧' },
];

export const CONFIG_POR_TIPO = {
  camping: {
    emoji: '⛺',
    nombre: 'Camping',
    colorFondo: '#059669', // Verde Camping
    colorBorde: '#047857',
    svgVector: `
      <g transform="translate(6, 4.5)">
        <path d="M7 1.5 L1.5 11.5 L12.5 11.5 Z M7 1.5 L7 11.5 M4.2 11.5 L7 7.2 L9.8 11.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
    `
  },
  area_autocaravanas: {
    emoji: '🚐',
    nombre: 'Área de Autocaravanas',
    colorFondo: '#2563EB', // Azul Área
    colorBorde: '#1D4ED8',
    svgVector: `
      <g transform="translate(6, 5)">
        <path d="M1.5 3 H9.5 V10 H1.5 Z M9.5 5.5 H12 L13.5 8 V10 H9.5 Z" fill="#FFFFFF"/>
        <circle cx="3.8" cy="10.2" r="1.3" fill="#2563EB" stroke="#FFFFFF" stroke-width="0.9"/>
        <circle cx="11.2" cy="10.2" r="1.3" fill="#2563EB" stroke="#FFFFFF" stroke-width="0.9"/>
      </g>
    `
  },
  pernocta_libre: {
    emoji: '🌲',
    nombre: 'Pernocta Libre (Naturaleza)',
    colorFondo: '#15803D', // Verde Naturaleza
    colorBorde: '#166534',
    svgVector: `
      <g transform="translate(6, 4.5)">
        <path d="M7 1 L2.5 6 H4.5 L2 10 H5.5 V13 H8.5 V10 H12 L9.5 6 H11.5 Z" fill="#FFFFFF"/>
      </g>
    `
  },
  parking_urbano: {
    emoji: '🅿️',
    nombre: 'Parking Urbano / Mixto',
    colorFondo: '#4F46E5', // Indigo Parking
    colorBorde: '#3730A3',
    svgVector: `
      <text x="13" y="15.5" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF">P</text>
    `
  },
  solo_servicios: {
    emoji: '💧',
    nombre: 'Solo Servicios',
    colorFondo: '#0891B2', // Cian Agua
    colorBorde: '#0E7490',
    svgVector: `
      <g transform="translate(6, 4.5)">
        <path d="M7 1.5 C7 1.5 2.5 7 2.5 9.8 C2.5 12.3 4.5 13.5 7 13.5 C9.5 13.5 11.5 12.3 11.5 9.8 C11.5 7 7 1.5 7 1.5 Z" fill="#FFFFFF"/>
      </g>
    `
  },
  area_recreativa: {
    emoji: '🏞️',
    nombre: 'Área Recreativa / Merendero',
    colorFondo: '#D97706', // Ámbar Merendero
    colorBorde: '#B45309',
    svgVector: `
      <g transform="translate(6, 5)">
        <path d="M1 4.5 H13 M7 4.5 V11 M3.5 11 L5.5 4.5 M10.5 11 L8.5 4.5 M1 8 H13" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      </g>
    `
  }
};

const EMOJIS_POR_TIPO = {
  pernocta_libre: '🌲',
  area_autocaravanas: '🚐',
  camping: '⛺',
  parking_urbano: '🅿️',
  area_recreativa: '🏞️',
  solo_servicios: '💧'
};

const NOMBRES_TIPO = {
  pernocta_libre: 'Pernocta Libre (Naturaleza)',
  area_autocaravanas: 'Área de Autocaravanas',
  camping: 'Camping',
  parking_urbano: 'Parking Urbano / Mixto',
  area_recreativa: 'Área Recreativa / Merendero',
  solo_servicios: 'Solo Servicios'
};

// Helper para obtener etiqueta de tipo sin duplicar emojis
export const obtenerEtiquetaTipoLugar = (lugar) => {
  if (!lugar) return '🚐 Lugar Camper';
  if (lugar.tipo_lugar_display) return lugar.tipo_lugar_display;
  const emoji = EMOJIS_POR_TIPO[lugar.tipo_lugar] || '🚐';
  const nombre = NOMBRES_TIPO[lugar.tipo_lugar] || 'Lugar Camper';
  return `${emoji} ${nombre}`;
};

// Helper para obtener color y propiedades visuales según el rating
export const obtenerColorRating = (valoracion, totalValoraciones) => {
  const total = totalValoraciones !== undefined
    ? totalValoraciones
    : (Array.isArray(valoracion) ? valoracion.length : (valoracion ? 1 : 0));
  const val = parseFloat(typeof valoracion === 'object' ? valoracion?.valoracion_media : valoracion) || 0;

  if (val <= 0 || total === 0) {
    return {
      color: '#94A3B8', // Gris pizarra (sin valoraciones)
      bgBadge: 'rgba(148, 163, 184, 0.2)',
      label: 'Sin valoraciones',
      bordeGrosor: 2.6
    };
  }
  if (val >= 4.5) {
    return {
      color: '#F59E0B', // Oro Radiante / 4.5 a 5.0
      bgBadge: 'rgba(245, 158, 11, 0.25)',
      label: 'Sobresaliente (4.5 - 5.0)',
      bordeGrosor: 3.2
    };
  }
  if (val >= 3.8) {
    return {
      color: '#10B981', // Verde Esmeralda / 3.8 a 4.4
      bgBadge: 'rgba(16, 185, 129, 0.25)',
      label: 'Muy bueno (3.8 - 4.4)',
      bordeGrosor: 3.0
    };
  }
  if (val >= 2.8) {
    return {
      color: '#38BDF8', // Azul Cielo Brillante / 2.8 a 3.7
      bgBadge: 'rgba(56, 189, 248, 0.25)',
      label: 'Bueno (2.8 - 3.7)',
      bordeGrosor: 2.8
    };
  }
  if (val >= 2.0) {
    return {
      color: '#FB923C', // Naranja / 2.0 a 2.7
      bgBadge: 'rgba(251, 146, 60, 0.25)',
      label: 'Regular (2.0 - 2.7)',
      bordeGrosor: 2.8
    };
  }
  return {
    color: '#EF4444', // Rojo Coral / < 2.0
    bgBadge: 'rgba(239, 68, 68, 0.25)',
    label: 'Mejorable (< 2.0)',
    bordeGrosor: 2.8
  };
};

// Cache de instancias de L.divIcon para rendimiento óptimo
const ICON_CACHE = {};

// Creador de marcadores camper según tipo de lugar con borde coloreado según rating
export const obtenerIconoPorLugar = (lugar) => {
  const tipo = lugar?.tipo_lugar || 'pernocta_libre';
  const val = parseFloat(lugar?.valoracion_media) || 0;
  const total = lugar?.total_valoraciones !== undefined
    ? lugar.total_valoraciones
    : (Array.isArray(lugar?.valoraciones) ? lugar.valoraciones.length : 0);

  const ratingTier = (val <= 0 || total === 0) ? '0'
    : (val >= 4.5 ? '5'
      : (val >= 3.8 ? '4'
        : (val >= 2.8 ? '3'
          : (val >= 2.0 ? '2' : '1'))));

  const cacheKey = `${tipo}_${ratingTier}`;

  if (ICON_CACHE[cacheKey]) {
    return ICON_CACHE[cacheKey];
  }

  const cfg = CONFIG_POR_TIPO[tipo] || CONFIG_POR_TIPO.pernocta_libre;
  const ratingInfo = obtenerColorRating(val, total);
  const hasStar = (val >= 4.0 && total > 0);

  const starBadge = hasStar
    ? `<div style="position: absolute; top: -3px; right: -3px; background: #F59E0B; border: 1.5px solid #FFFFFF; border-radius: 50%; width: 11px; height: 11px; display: flex; align-items: center; justify-content: center; font-size: 7px; color: #FFFFFF; font-weight: 900; box-shadow: 0 1px 3px rgba(0,0,0,0.4);">★</div>`
    : '';

  const icon = L.divIcon({
    className: 'custom-camper-marker',
    html: `
      <div class="marker-pin-inner" style="
        position: relative;
        width: 26px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 2px 5px rgba(0,0,0,0.55));
        cursor: pointer;
      ">
        <svg viewBox="0 0 26 30" width="26" height="30" style="display: block;">
          <path d="M13 1.5 C7.2 1.5 2.5 6.2 2.5 12 C2.5 19.8 13 28.5 13 28.5 C13 28.5 23.5 19.8 23.5 12 C23.5 6.2 18.8 1.5 13 1.5 Z" 
                fill="${cfg.colorFondo}" stroke="${ratingInfo.color}" stroke-width="${ratingInfo.bordeGrosor}" stroke-linejoin="round"/>
          ${cfg.svgVector}
        </svg>
        ${starBadge}
      </div>
    `,
    iconSize: [26, 30],
    iconAnchor: [13, 30],
    popupAnchor: [0, -28]
  });

  ICON_CACHE[cacheKey] = icon;
  return icon;
};

// Componente auxiliar para centrar mapa
function ControladorCentroMapa({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] && coords[1]) {
      map.flyTo(coords, 13, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

// Umbral de zoom mínimo para mostrar marcadores de lugares
const ZOOM_MOSTRAR_LUGARES = 9;

// Componente que sincroniza el nivel de zoom actual con el estado del padre
function MonitorZoom({ onZoomChange }) {
  useMapEvents({
    zoomend: (e) => {
      onZoomChange(e.target.getZoom());
    },
  });
  return null;
}

export default function DescubreMapa({ alSeleccionarLugar, alCambiarALista }) {
  const { usuario } = useAuth();
  const [lugares, setLugares] = useState([]);
  const [leyendaAbierta, setLeyendaAbierta] = useState(false);

  // Radar de lluvia en vivo dinámico desde RainViewer
  const [radarLluviaUrl, setRadarLluviaUrl] = useState(null);

  useEffect(() => {
    const cargarRadarLluvia = () => {
      fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(res => res.json())
        .then(data => {
          if (data?.radar?.past?.length > 0) {
            const ultimo = data.radar.past[data.radar.past.length - 1];
            const host = data.host || 'https://tilecache.rainviewer.com';
            setRadarLluviaUrl(`${host}${ultimo.path}/256/{z}/{x}/{y}/2/1_1.png`);
          }
        })
        .catch(err => console.warn('Error al cargar radar de lluvia:', err));
    };

    cargarRadarLluvia();
    const interval = setInterval(cargarRadarLluvia, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Estado de chips de tipo de lugar y navegación scroll para PC
  const chipsRef = useRef(null);
  const [puedeScrollIzquierda, setPuedeScrollIzquierda] = useState(false);
  const [puedeScrollDerecha, setPuedeScrollDerecha] = useState(true);
  const [arrastrandoChips, setArrastrandoChips] = useState(false);
  const [startXChips, setStartXChips] = useState(0);
  const [scrollLeftChips, setScrollLeftChips] = useState(0);

  const comprobarScrollChips = () => {
    if (chipsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = chipsRef.current;
      setPuedeScrollIzquierda(scrollLeft > 6);
      setPuedeScrollDerecha(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scrollChips = (direccion) => {
    if (chipsRef.current) {
      chipsRef.current.scrollBy({ left: direccion * 220, behavior: 'smooth' });
      setTimeout(comprobarScrollChips, 300);
    }
  };

  useEffect(() => {
    const el = chipsRef.current;
    if (el) {
      comprobarScrollChips();
      el.addEventListener('scroll', comprobarScrollChips, { passive: true });
      window.addEventListener('resize', comprobarScrollChips);
      return () => {
        el.removeEventListener('scroll', comprobarScrollChips);
        window.removeEventListener('resize', comprobarScrollChips);
      };
    }
  }, [lugares]);

  const alIniciarArrastreChips = (e) => {
    if (!chipsRef.current) return;
    setArrastrandoChips(true);
    setStartXChips(e.pageX - chipsRef.current.offsetLeft);
    setScrollLeftChips(chipsRef.current.scrollLeft);
  };

  const alMoverArrastreChips = (e) => {
    if (!arrastrandoChips || !chipsRef.current) return;
    e.preventDefault();
    const x = e.pageX - chipsRef.current.offsetLeft;
    const recorrido = (x - startXChips) * 1.5;
    chipsRef.current.scrollLeft = scrollLeftChips - recorrido;
    comprobarScrollChips();
  };

  const alFinalizarArrastreChips = () => {
    setArrastrandoChips(false);
  };
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  // Zoom actual del mapa (para carga condicional de marcadores)
  const [zoomActual, setZoomActual] = useState(6);

  // Ubicación actual
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [obteniendoGps, setObteniendoGps] = useState(false);
  const [centroMapa, setCentroMapa] = useState([40.4168, -3.7038]);

  // FILTRO PRINCIPAL: Multi-selección de Tipo de Lugar
  const [tiposLugarSeleccionados, setTiposLugarSeleccionados] = useState([]);

  // FILTROS AVANZADOS POR CATEGORÍA
  const [panelFiltrosAbierto, setPanelFiltrosAbierto] = useState(false);
  const [filtros, setFiltros] = useState({
    // 🚰 Servicios
    agua_potable: false,
    lavabos: false,
    electricidad: false,
    wifi: false,
    basuras: false,
    duchas: false,
    vaciado_aguas_grises: false,
    vaciado_aguas_negras: false,
    es_gratuito: false,

    // 🌳 Entorno y Ocio
    ideal_ninos_10_anos: false,
    senderismo_cercano: false,
    playa_cercana: false,
    rutas_bici: false,
    admite_mascotas: false,

    // 🛣️ Terreno y Acceso
    acceso_asfaltado: false,
    mucha_sombra: false,
    muy_soleado_placas: false,
    terreno_nivelado: false,
    apto_autocaravanas_grandes: false,
    permitido_sacar_toldo: false,

    // Puntuación
    puntuacion_minima: 0,
  });

  // Modal Añadir a Viaje Planificado
  const [modalAnadirViajeAbierto, setModalAnadirViajeAbierto] = useState(false);
  const [lugarParaViaje, setLugarParaViaje] = useState(null);
  const [misViajesPlanificados, setMisViajesPlanificados] = useState([]);
  const [viajeSeleccionadoId, setViajeSeleccionadoId] = useState('');
  const [fechaParada, setFechaParada] = useState(new Date().toISOString().split('T')[0]);
  const [diasParada, setDiasParada] = useState(1);
  const [notasParada, setNotasParada] = useState('');
  const [creandoNuevoViajeInline, setCreandoNuevoViajeInline] = useState(false);
  const [nuevoViajeTitulo, setNuevoViajeTitulo] = useState('');
  const [nuevoViajeFecha, setNuevoViajeFecha] = useState(new Date().toISOString().split('T')[0]);
  const [guardandoEnViaje, setGuardandoEnViaje] = useState(false);
  const [mensajeExitoViaje, setMensajeExitoViaje] = useState('');

  const cargarLugares = async () => {
    setCargando(true);
    try {
      const data = await peticionApi('/api/lugares/puntos/');
      setLugares(data.results || data || []);
    } catch (err) {
      console.error('Error al cargar lugares en mapa:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarLugares();
    obtenerUbicacionActual();
  }, []);

  const obtenerUbicacionActual = () => {
    setObteniendoGps(true);
    obtenerGeolocalizacionRapida(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setMiUbicacion(coords);
        setCentroMapa(coords);
        setObteniendoGps(false);
      },
      (err) => {
        console.warn('Geolocalización GPS no disponible:', err.message);
        setObteniendoGps(false);
      }
    );
  };

  // Alternar selección múltiple de tipos de lugar
  const alternarTipoLugar = (id) => {
    if (id === 'todos') {
      setTiposLugarSeleccionados([]);
      return;
    }
    setTiposLugarSeleccionados(prev => {
      if (prev.includes(id)) {
        return prev.filter(t => t !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleFiltro = (clave) => {
    setFiltros(prev => ({ ...prev, [clave]: !prev[clave] }));
  };

  const limpiarFiltros = () => {
    setTiposLugarSeleccionados([]);
    setFiltros({
      agua_potable: false,
      lavabos: false,
      electricidad: false,
      wifi: false,
      basuras: false,
      duchas: false,
      vaciado_aguas_grises: false,
      vaciado_aguas_negras: false,
      es_gratuito: false,
      ideal_ninos_10_anos: false,
      senderismo_cercano: false,
      playa_cercana: false,
      rutas_bici: false,
      admite_mascotas: false,
      acceso_asfaltado: false,
      mucha_sombra: false,
      muy_soleado_placas: false,
      terreno_nivelado: false,
      apto_autocaravanas_grandes: false,
      permitido_sacar_toldo: false,
      puntuacion_minima: 0,
    });
    setBusqueda('');
  };

  const totalFiltrosActivos = Object.entries(filtros).filter(([k, v]) => k !== 'puntuacion_minima' ? v : v > 0).length + (tiposLugarSeleccionados.length > 0 ? tiposLugarSeleccionados.length : 0);

  // Filtrado de lugares
  const lugaresFiltrados = lugares.filter(l => {
    // 1. Filtro Principal: Multi-selección de Tipo de Lugar
    if (tiposLugarSeleccionados.length > 0) {
      if (!tiposLugarSeleccionados.includes(l.tipo_lugar)) return false;
    }

    // 2. Buscador
    if (busqueda.trim()) {
      const normalizar = (s) => (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
      const q = normalizar(busqueda);
      const coincideNombre = normalizar(l.nombre).includes(q);
      const coincidePoblacion = normalizar(l.poblacion).includes(q);
      const coincideProvincia = normalizar(l.provincia).includes(q);
      if (!coincideNombre && !coincidePoblacion && !coincideProvincia) return false;
    }

    // 3. Puntuación mínima
    if (filtros.puntuacion_minima > 0) {
      const val = parseFloat(l.valoracion_media) || 0;
      if (val < filtros.puntuacion_minima) return false;
    }

    // 4. Servicios Básicos
    if (filtros.agua_potable && !l.agua_potable && !l.tiene_agua) return false;
    if (filtros.lavabos && !l.lavabos && !l.tiene_lavabo) return false;
    if (filtros.electricidad && !l.electricidad && !l.tiene_electricidad) return false;
    if (filtros.wifi && !l.wifi && !l.tiene_wifi) return false;
    if (filtros.basuras && !l.basuras && !l.tiene_basuras) return false;
    if (filtros.duchas && !l.duchas && !l.tiene_duchas) return false;
    if (filtros.vaciado_aguas_grises && !l.vaciado_aguas_grises && !l.tiene_vaciado_aguas_grises && !l.vaciado_aguas) return false;
    if (filtros.vaciado_aguas_negras && !l.vaciado_aguas_negras && !l.tiene_vaciado_aguas_negras && !l.vaciado_aguas) return false;
    if (filtros.es_gratuito && !l.es_gratuito) return false;

    // 5. Entorno y Ocio
    if (filtros.ideal_ninos_10_anos && !l.ideal_familias && !l.ideal_ninos_10_anos) return false;
    if (filtros.senderismo_cercano && !l.senderismo_cercano && !l.tiene_senderismo && !l.tiene_senderos_sencillos) return false;
    if (filtros.playa_cercana && !l.playa_cercana) return false;
    if (filtros.rutas_bici && !l.rutas_bici && !l.rutas_en_bici) return false;
    if (filtros.admite_mascotas && !l.admite_mascotas && !l.mascotas) return false;

    // 6. Terreno y Acceso
    if (filtros.acceso_asfaltado && !l.acceso_asfaltado) return false;
    if (filtros.mucha_sombra && !l.mucha_sombra) return false;
    if (filtros.muy_soleado_placas && !l.muy_soleado_placas && !l.muy_soleado) return false;
    if (filtros.terreno_nivelado && !l.terreno_nivelado) return false;
    if (filtros.apto_autocaravanas_grandes && !l.apto_autocaravanas_grandes && !l.apto_grandes_autocaravanas) return false;
    if (filtros.permitido_sacar_toldo && !l.permitido_sacar_toldo && !l.permite_sacar_toldo && !l.toldo) return false;

    return true;
  });

  // Abrir modal de añadir a viaje desde el popup del lugar
  const abrirModalAnadirViaje = async (lugar) => {
    if (!usuario) {
      alert('Inicia sesión para añadir lugares a tus viajes planificados.');
      return;
    }
    setLugarParaViaje(lugar);
    setMensajeExitoViaje('');
    setModalAnadirViajeAbierto(true);

    try {
      const data = await peticionApi('/api/viajes/viajes/?mis_viajes=true');
      const lista = (data.results || data || []).filter(v => !v.esta_cerrado);
      setMisViajesPlanificados(lista);
      if (lista.length > 0) {
        setViajeSeleccionadoId(lista[0].id);
        setFechaParada(lista[0].fecha_inicio || new Date().toISOString().split('T')[0]);
      } else {
        setCreandoNuevoViajeInline(true);
      }
    } catch (e) {
      console.error('Error al cargar viajes:', e);
    }
  };

  const guardarLugarEnViaje = async (e) => {
    e.preventDefault();
    if (!lugarParaViaje) return;
    setGuardandoEnViaje(true);
    setMensajeExitoViaje('');

    try {
      let targetViajeId = viajeSeleccionadoId;

      if (creandoNuevoViajeInline) {
        if (!nuevoViajeTitulo.trim()) {
          alert('Introduce un título para el viaje.');
          setGuardandoEnViaje(false);
          return;
        }
        const viajeCreado = await peticionApi('/api/viajes/viajes/', {
          method: 'POST',
          body: {
            titulo: nuevoViajeTitulo.trim(),
            fecha_inicio: nuevoViajeFecha,
            esta_cerrado: false
          }
        });
        targetViajeId = viajeCreado.id;
      }

      await peticionApi(`/api/viajes/viajes/${targetViajeId}/anadir-parada/`, {
        method: 'POST',
        body: {
          lugar_id: lugarParaViaje.id,
          fecha: fechaParada,
          dias_previstos: diasParada,
          notas_privadas: notasParada
        }
      });

      setMensajeExitoViaje(`¡${lugarParaViaje.nombre} añadido a tu viaje!`);
      setTimeout(() => {
        setModalAnadirViajeAbierto(false);
        setMensajeExitoViaje('');
        setCreandoNuevoViajeInline(false);
      }, 1500);
    } catch (err) {
      alert(err.message || 'No se pudo añadir al viaje.');
    } finally {
      setGuardandoEnViaje(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100dvh - 56px)', overflow: 'hidden' }}>

      {/* Estilo para asegurar que los controles de Leaflet (+/- y capas) no tapen el buscador y filtros */}
      <style>{`
        .leaflet-top.leaflet-left {
          top: 142px !important;
          left: 14px !important;
          z-index: 990 !important;
        }
        .leaflet-top.leaflet-right {
          top: 142px !important;
          right: 14px !important;
          z-index: 990 !important;
        }
        .chips-scroll-container {
          overflow-x: auto !important;
          overflow-y: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          touch-action: pan-x !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          pointer-events: auto !important;
        }
        .chips-scroll-container::-webkit-scrollbar {
          display: none !important;
        }
      `}</style>

      {/* BARRA SUPERIOR DE BÚSQUEDA Y FILTRO PRINCIPAL (TIPO DE LUGAR) */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '12px',
        right: '12px',
        zIndex: 1050,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '1000px',
        width: 'calc(100% - 24px)',
        margin: '0 auto'
      }}>
        {/* BUSCADOR + BOTÓN FILTROS + BOTÓN LISTA */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <input
              type="text"
              placeholder="Buscar Lugares"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                height: '42px',
                paddingLeft: '38px',
                paddingRight: '12px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(18, 28, 22, 0.95)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(16px)',
                fontSize: '0.86rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.7)' }} />
          </div>

          <button
            onClick={() => setPanelFiltrosAbierto(true)}
            className="btn btn-secondary"
            title="Abrir panel de filtros categorizados"
            style={{
              height: '42px',
              padding: '0 15px',
              borderRadius: 'var(--radius-full)',
              background: totalFiltrosActivos > 0 ? 'var(--accent-forest)' : 'rgba(18, 28, 22, 0.95)',
              color: '#FFFFFF',
              border: totalFiltrosActivos > 0 ? '1.5px solid #6EE7B7' : '1px solid rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.84rem',
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <Filter size={16} />
            <span>Filtros</span>
            {totalFiltrosActivos > 0 && (
              <span style={{
                background: '#FFFFFF',
                color: 'var(--accent-forest)',
                fontSize: '0.72rem',
                fontWeight: 900,
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {totalFiltrosActivos}
              </span>
            )}
          </button>

          {alCambiarALista && (
            <button
              onClick={alCambiarALista}
              className="btn btn-secondary"
              title="Ver lugares en formato lista y tarjetas"
              style={{
                height: '42px',
                padding: '0 15px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(18, 28, 22, 0.95)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.84rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <span>📋 Ver Lista</span>
            </button>
          )}
        </div>

        {/* FILTRO PRINCIPAL: SELECTOR MULTI-SELECCIÓN DE TIPO DE LUGAR CON BOTONES Y NAVEGACIÓN PC */}
        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
          {puedeScrollIzquierda && (
            <button
              type="button"
              onClick={() => scrollChips(-1)}
              className="chips-nav-arrow-btn"
              title="Desplazar filtros a la izquierda"
              style={{
                position: 'absolute',
                left: '-8px',
                zIndex: 1300,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(18, 28, 22, 0.96)',
                color: '#FFFFFF',
                border: '1.5px solid #6EE7B7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.15s ease'
              }}
            >
              <ChevronLeft size={18} />
            </button>
          )}

          <div
            ref={chipsRef}
            className="chips-scroll-container"
            onMouseDown={(e) => {
              e.stopPropagation();
              alIniciarArrastreChips(e);
            }}
            onMouseMove={alMoverArrastreChips}
            onMouseUp={alFinalizarArrastreChips}
            onMouseLeave={alFinalizarArrastreChips}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onWheel={(e) => {
              e.stopPropagation();
              if (e.deltaY !== 0 && chipsRef.current) {
                chipsRef.current.scrollLeft += e.deltaY;
                comprobarScrollChips();
              }
            }}
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              overflowY: 'hidden',
              padding: '6px 4px 10px 4px',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              width: '100%',
              boxSizing: 'border-box',
              pointerEvents: 'auto',
              cursor: arrastrandoChips ? 'grabbing' : 'default',
              userSelect: 'none'
            }}
          >
            {TIPOS_LUGAR_MAPA.map((tipo) => {
              const esTodos = tipo.id === 'todos';
              const activo = esTodos
                ? tiposLugarSeleccionados.length === 0
                : tiposLugarSeleccionados.includes(tipo.id);

              const cantidad = esTodos
                ? lugares.length
                : lugares.filter(l => l.tipo_lugar === tipo.id).length;

              return (
                <button
                  key={tipo.id}
                  type="button"
                  onClick={() => alternarTipoLugar(tipo.id)}
                  style={{
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    padding: '7px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.81rem',
                    fontWeight: activo ? 800 : 600,
                    cursor: 'pointer',
                    border: activo ? '2px solid #6EE7B7' : '1px solid rgba(255,255,255,0.22)',
                    background: activo ? 'var(--accent-forest)' : 'rgba(18, 28, 22, 0.92)',
                    color: '#FFFFFF',
                    backdropFilter: 'blur(16px)',
                    boxShadow: activo ? '0 3px 14px rgba(35,83,52,0.65)' : '0 2px 8px rgba(0,0,0,0.3)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{tipo.emoji}</span>
                  <span>{tipo.label}</span>
                  <span style={{
                    fontSize: '0.70rem',
                    background: activo ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontWeight: 800
                  }}>
                    {cantidad}
                  </span>
                </button>
              );
            })}
            {/* Espacio derecho de resguardo */}
            <div style={{ minWidth: '24px', flexShrink: 0 }} />
          </div>

          {puedeScrollDerecha && (
            <button
              type="button"
              onClick={() => scrollChips(1)}
              className="chips-nav-arrow-btn"
              title="Ver más filtros de tipo de lugar (Área Recreativa, Solo Servicios...)"
              style={{
                position: 'absolute',
                right: '-8px',
                zIndex: 1300,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(18, 28, 22, 0.96)',
                color: '#FFFFFF',
                border: '1.5px solid #6EE7B7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.15s ease'
              }}
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>

      {/* LEYENDA FLOTANTE DE PUNTUACIONES / COLORES (EN ESQUINA INFERIOR IZQUIERDA, PLEGABLE) */}
      <div className="mapa-leyenda-flotante" style={{
        position: 'absolute',
        zIndex: 900,
        background: 'rgba(18, 28, 22, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(255, 255, 255, 0.22)',
        borderRadius: 'var(--radius-md)',
        padding: leyendaAbierta ? '10px 14px' : '7px 12px',
        fontSize: '0.74rem',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none',
        maxWidth: 'calc(100vw - 32px)'
      }}>
        {/* Cabecera / Botón interactivo para abrir/cerrar */}
        <div
          onClick={() => setLeyendaAbierta(!leyendaAbierta)}
          style={{
            fontWeight: 800,
            fontSize: '0.76rem',
            color: '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            cursor: 'pointer'
          }}
          title={leyendaAbierta ? 'Plegar leyenda de puntuación' : 'Desplegar leyenda de puntuación camper'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} color="#F59E0B" />
            <span>Puntuación Camper</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', marginLeft: '4px' }}>
            {leyendaAbierta ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </span>
        </div>

        {/* Contenido desplegable con la escala de colores y ratings */}
        {leyendaAbierta && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.14)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block', flexShrink: 0 }}></span>
              <span>4.1 - 5.0 🚐 (Oro / Top)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#94A3B8', display: 'inline-block', flexShrink: 0 }}></span>
              <span>3.1 - 4.0 🚐 (Plata)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D97706', display: 'inline-block', flexShrink: 0 }}></span>
              <span>2.1 - 3.0 🚐 (Bronce)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', display: 'inline-block', flexShrink: 0 }}></span>
              <span>1.1 - 2.0 🚐 (Básico / Verde)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444', display: 'inline-block', flexShrink: 0 }}></span>
              <span>&le; 1.0 🚐 (No recomendado / Rojo)</span>
            </div>
          </div>
        )}
      </div>

      {/* OVERLAY: Mensaje de zoom desactivado temporalmente para permitir clustering desde cualquier distancia */}
      {/* zoomActual < ZOOM_MOSTRAR_LUGARES && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 950,
          background: 'rgba(18, 28, 22, 0.92)',
          backdropFilter: 'blur(14px)',
          border: '1.5px solid rgba(110, 231, 183, 0.45)',
          borderRadius: 'var(--radius-full)',
          padding: '10px 20px',
          color: '#FFFFFF',
          fontSize: '0.86rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.45)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '1.1rem' }}>🔍</span>
          Acércate para buscar lugares
        </div>
      ) */}

      {/* BOTÓN FLOTANTE PARA CENTRAR GPS */}
      <button
        onClick={obtenerUbicacionActual}
        disabled={obteniendoGps}
        title="Centrar en mi furgoneta / ubicación actual"
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '16px',
          zIndex: 900,
          background: 'var(--accent-forest)',
          color: '#FFFFFF',
          border: '2px solid #FFFFFF',
          borderRadius: '50%',
          width: '46px',
          height: '46px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          cursor: 'pointer'
        }}
      >
        <Crosshair size={22} className={obteniendoGps ? 'spin-anim' : ''} />
      </button>

      {/* MODAL / CAJÓN DE FILTROS CATEGORIZADOS */}
      {panelFiltrosAbierto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div className="camper-card" style={{
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            border: '2px solid var(--accent-forest)',
            background: 'var(--bg-surface-elevated)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            borderRadius: 'var(--radius-lg)'
          }}>
            {/* Cabecera modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={20} color="var(--accent-forest)" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Filtros de Lugares & Pernoctas</h3>
              </div>
              <button className="btn-icon" onClick={() => setPanelFiltrosAbierto(false)} style={{ width: '32px', height: '32px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Cuerpo con scroll */}
            <div style={{ overflowY: 'auto', paddingRight: '6px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* 1. SELECCIÓN DE TIPOS DE LUGAR (MULTI-SELECCIÓN) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--accent-forest)' }}>
                    🌲 Tipos de Lugar (Selección Múltiple)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setTiposLugarSeleccionados([])}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-forest)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    Marcar todos
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                  {TIPOS_LUGAR_MAPA.filter(t => t.id !== 'todos').map(tipo => {
                    const activo = tiposLugarSeleccionados.includes(tipo.id);
                    return (
                      <button
                        key={tipo.id}
                        type="button"
                        onClick={() => alternarTipoLugar(tipo.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: activo ? '2px solid var(--accent-forest)' : '1px solid var(--border-color)',
                          background: activo ? 'rgba(35, 83, 52, 0.18)' : 'var(--bg-primary)',
                          color: activo ? 'var(--accent-forest)' : 'var(--text-primary)',
                          fontWeight: activo ? 800 : 500,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{tipo.emoji}</span>
                        <span style={{ flex: 1 }}>{tipo.label}</span>
                        {activo && <Check size={14} color="var(--accent-forest)" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. SERVICIOS BÁSICOS Y CAMPER */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '10px', color: 'var(--accent-forest)' }}>
                  🚰 Servicios Básicos y Camper
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                  {[
                    { key: 'es_gratuito', label: '💸 100% Gratuito' },
                    { key: 'agua_potable', label: '💧 Agua Potable' },
                    { key: 'lavabos', label: '🚻 Lavabos / WC' },
                    { key: 'electricidad', label: '⚡ Electricidad' },
                    { key: 'wifi', label: '📶 Wi-Fi' },
                    { key: 'basuras', label: '🗑️ Cubos de Basura' },
                    { key: 'duchas', label: '🚿 Duchas' },
                    { key: 'vaciado_aguas_grises', label: '🔘 Vaciado Grises' },
                    { key: 'vaciado_aguas_negras', label: '🚽 Vaciado Negras (WC)' },
                  ].map(s => (
                    <label
                      key={s.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        background: filtros[s.key] ? 'rgba(35, 83, 52, 0.12)' : 'var(--bg-primary)',
                        border: filtros[s.key] ? '1.5px solid var(--accent-forest)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: filtros[s.key] ? 700 : 500
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={filtros[s.key]}
                        onChange={() => toggleFiltro(s.key)}
                        style={{ accentColor: 'var(--accent-forest)' }}
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. ENTORNO Y OCIO */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '10px', color: 'var(--accent-forest)' }}>
                  🌳 Entorno y Ocio
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                  {[
                    { key: 'ideal_ninos_10_anos', label: '👨‍👩‍👧 Ideal Familias' },
                    { key: 'senderismo_cercano', label: '🥾 Senderismo Cercano' },
                    { key: 'playa_cercana', label: '🏖️ Playa / Lago / Río' },
                    { key: 'rutas_bici', label: '🚴 Rutas en Bicicleta' },
                    { key: 'admite_mascotas', label: '🐕 Admite Mascotas' },
                  ].map(s => (
                    <label
                      key={s.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        background: filtros[s.key] ? 'rgba(35, 83, 52, 0.12)' : 'var(--bg-primary)',
                        border: filtros[s.key] ? '1.5px solid var(--accent-forest)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: filtros[s.key] ? 700 : 500
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={filtros[s.key]}
                        onChange={() => toggleFiltro(s.key)}
                        style={{ accentColor: 'var(--accent-forest)' }}
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 4. TERRENO Y ACCESO */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '10px', color: 'var(--accent-forest)' }}>
                  🛣️ Terreno y Acceso
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                  {[
                    { key: 'acceso_asfaltado', label: '🛣️ Acceso Asfaltado' },
                    { key: 'mucha_sombra', label: '🌲 Mucha Sombra' },
                    { key: 'muy_soleado_placas', label: '☀️ Soleado (Placas)' },
                    { key: 'terreno_nivelado', label: '📐 Terreno Nivelado' },
                    { key: 'apto_autocaravanas_grandes', label: '🚍 Apto >7 metros' },
                    { key: 'permitido_sacar_toldo', label: '⛱️ Permite Toldo / Mesas' },
                  ].map(s => (
                    <label
                      key={s.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        background: filtros[s.key] ? 'rgba(35, 83, 52, 0.12)' : 'var(--bg-primary)',
                        border: filtros[s.key] ? '1.5px solid var(--accent-forest)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: filtros[s.key] ? 700 : 500
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={filtros[s.key]}
                        onChange={() => toggleFiltro(s.key)}
                        style={{ accentColor: 'var(--accent-forest)' }}
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 5. PUNTUACIÓN CAMPER MÍNIMA */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '10px', color: 'var(--accent-forest)' }}>
                  🚐 Puntuación Camper Mínima
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { valor: 0, label: 'Cualquiera' },
                    { valor: 4.1, label: '4.1+ 🚐 Oro (Top)' },
                    { valor: 3.1, label: '3.1+ 🚐 Plata' },
                    { valor: 2.1, label: '2.1+ 🚐 Bronce' },
                  ].map(p => (
                    <button
                      key={p.valor}
                      type="button"
                      onClick={() => setFiltros(prev => ({ ...prev, puntuacion_minima: p.valor }))}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.80rem',
                        fontWeight: filtros.puntuacion_minima === p.valor ? 800 : 500,
                        border: filtros.puntuacion_minima === p.valor ? '2px solid var(--accent-forest)' : '1px solid var(--border-color)',
                        background: filtros.puntuacion_minima === p.valor ? 'var(--accent-forest)' : 'var(--bg-primary)',
                        color: filtros.puntuacion_minima === p.valor ? '#FFFFFF' : 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Pie de modal con acciones */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={limpiarFiltros}
                style={{ fontSize: '0.84rem' }}
              >
                <Trash2 size={14} /> Restablecer
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {lugaresFiltrados.length} lugares encontrados
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setPanelFiltrosAbierto(false)}
                  style={{ fontSize: '0.86rem', padding: '8px 18px' }}
                >
                  <Check size={16} /> Aplicar Filtros
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MAPA LEAFLET A PANTALLA COMPLETA */}
      <MapContainer
        center={centroMapa}
        zoom={6}
        style={{ width: '100%', height: '100%', background: '#111827' }}
      >
        <ControladorCentroMapa coords={miUbicacion} />
        <MonitorZoom onZoomChange={setZoomActual} />

        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="🗺️ Callejero OSM">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🛰️ Satélite Natural">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="⛰️ Relieve Topográfico">
            <TileLayer
              attribution='&copy; OpenTopoMap (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay name="🌧️ Radar de Lluvia en Vivo">
            <TileLayer
              key={radarLluviaUrl || 'radar-init'}
              attribution='&copy; <a href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">RainViewer</a>'
              url={radarLluviaUrl || "https://tilecache.rainviewer.com/v2/radar/nowcast_latest/256/{z}/{x}/{y}/2/1_1.png"}
              opacity={0.65}
              zIndex={400}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="🌌 Cielos Oscuros (Contaminación Lumínica)">
            <TileLayer
              attribution='&copy; NASA Earth Observatory - Night Lights'
              url="https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg"
              opacity={0.55}
            />
          </LayersControl.Overlay>
        </LayersControl>

        {/* Marcador de mi ubicación */}
        {miUbicacion && (
          <Marker
            position={miUbicacion}
            icon={L.divIcon({
              className: 'custom-furgo-marker',
              html: `
                <div style="
                  width: 32px;
                  height: 32px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background: #235334;
                  border: 2px solid #FFFFFF;
                  border-radius: 50%;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                ">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <path d="M2.5 5 H14 V14 H2.5 Z" fill="#6EE7B7"/>
                    <path d="M14 8 H17.5 L20 11 V14 H14 Z" fill="#6EE7B7"/>
                    <circle cx="5.5" cy="14.5" r="2" fill="#111827" stroke="#6EE7B7" stroke-width="1.2"/>
                    <circle cx="16.5" cy="14.5" r="2" fill="#111827" stroke="#6EE7B7" stroke-width="1.2"/>
                  </svg>
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
              popupAnchor: [0, -16]
            })}
          >
            <Popup>
              <div style={{ textAlign: 'center', padding: '6px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>📍 Tu Ubicación Actual</div>
                <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>Furgoneta / Explorador</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcadores de Lugares agrupados en Cluster */}
        <MarkerClusterGroup chunkedLoading maxClusterRadius={100}>
          {lugaresFiltrados.map((lugar) => {
            const imagenLugar = obtenerImagenLugar(lugar);
            const etiquetaTipo = obtenerEtiquetaTipoLugar(lugar);

            return (
              <Marker
                key={lugar.id}
                position={[parseFloat(lugar.latitud), parseFloat(lugar.longitud)]}
                icon={obtenerIconoPorLugar(lugar)}
              >
                <Popup className="custom-camper-popup" maxWidth={310}>
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>

                    {/* FOTO DEL LUGAR O BANNER PAISAJÍSTICO */}
                    {imagenLugar ? (
                      <div style={{ position: 'relative', width: '100%', height: '135px', overflow: 'hidden', background: '#0D1A12' }}>
                        <img loading="lazy" decoding="async"
                          src={imagenLugar}
                          alt={lugar.nombre}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(17,28,22,0.95) 0%, transparent 60%)'
                        }} />
                      </div>
                    ) : (
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '80px',
                        background: 'linear-gradient(135deg, #183d26 0%, #0d2115 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <span style={{ fontSize: '2.4rem', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }}>
                          {EMOJIS_POR_TIPO[lugar.tipo_lugar] || '🚐'}
                        </span>
                      </div>
                    )}

                    {/* CUERPO DE LA TARJETA */}
                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

                      {/* Fila: Tipo de Lugar (1 solo icono) + Precio */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: 'rgba(35, 83, 52, 0.25)',
                          color: '#6EE7B7',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          borderRadius: 'var(--radius-full)',
                          padding: '2px 8px',
                          fontSize: '0.73rem',
                          fontWeight: 800
                        }}>
                          {etiquetaTipo}
                        </span>

                        <span style={{
                          fontSize: '0.74rem',
                          fontWeight: 900,
                          color: lugar.es_gratuito ? '#34D399' : '#FBBF24',
                          background: lugar.es_gratuito ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: lugar.es_gratuito ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(251, 191, 36, 0.3)'
                        }}>
                          {lugar.es_gratuito || (!parseFloat(lugar.precio) && !parseFloat(lugar.precio_noche)) ? 'Gratis' : `${parseFloat(lugar.precio || lugar.precio_noche)} €/n`}
                        </span>
                      </div>

                      {/* Nombre y Ubicación */}
                      <div>
                        <h4 style={{ margin: '0 0 3px 0', fontSize: '1.02rem', fontWeight: 900, color: '#FFFFFF', lineHeight: '1.25' }}>
                          {lugar.nombre}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.76rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="#10B981" />
                          <span>{lugar.poblacion || ''}{lugar.poblacion && lugar.provincia ? ', ' : ''}{lugar.provincia || ''}</span>
                        </p>
                      </div>

                      {/* Puntuación Camper */}
                      {(() => {
                        const rInfo = obtenerColorRating(lugar.valoracion_media, lugar.total_valoraciones);
                        const valNum = parseFloat(lugar.valoracion_media || 0);
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.80rem' }}>
                            <CamperIconRating rating={lugar.valoracion_media} maxIcons={5} size={14} soloLectura />
                            <span style={{
                              fontWeight: 900,
                              color: rInfo.color,
                              background: rInfo.bgBadge,
                              padding: '1px 7px',
                              borderRadius: '4px',
                              border: `1px solid ${rInfo.color}50`
                            }}>
                              {valNum > 0 ? valNum.toFixed(1) : 'Nuevo'}
                            </span>
                            <span style={{ color: '#9CA3AF', fontSize: '0.72rem' }}>
                              ({lugar.total_valoraciones || 0} valoraciones)
                            </span>
                          </div>
                        );
                      })()}

                      {/* Servicios destacados */}
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', fontSize: '0.71rem' }}>
                        {(lugar.agua_potable || lugar.tiene_agua) && <span style={{ background: 'rgba(255,255,255,0.08)', color: '#D1D5DB', padding: '2px 6px', borderRadius: '4px' }}>💧 Agua</span>}
                        {(lugar.electricidad || lugar.tiene_electricidad) && <span style={{ background: 'rgba(255,255,255,0.08)', color: '#D1D5DB', padding: '2px 6px', borderRadius: '4px' }}>⚡ Luz</span>}
                        {(lugar.vaciado_aguas_grises || lugar.vaciado_aguas_negras || lugar.vaciado_aguas) && <span style={{ background: 'rgba(255,255,255,0.08)', color: '#D1D5DB', padding: '2px 6px', borderRadius: '4px' }}>🔘 Vaciado</span>}
                        {(lugar.admite_mascotas || lugar.mascotas) && <span style={{ background: 'rgba(255,255,255,0.08)', color: '#D1D5DB', padding: '2px 6px', borderRadius: '4px' }}>🐕 Mascotas</span>}
                        {(lugar.ideal_familias || lugar.ideal_ninos_10_anos) && <span style={{ background: 'rgba(255,255,255,0.08)', color: '#D1D5DB', padding: '2px 6px', borderRadius: '4px' }}>👨‍👩‍👧 Familias</span>}
                      </div>

                      {/* Botones de acción con alto contraste */}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <button
                          onClick={() => alSeleccionarLugar(lugar.id)}
                          className="btn btn-primary btn-sm"
                          style={{
                            flex: 1,
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            padding: '6px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            background: 'var(--accent-forest)',
                            color: '#FFFFFF',
                            borderRadius: '8px'
                          }}
                        >
                          <Eye size={13} /> Ver Ficha
                        </button>

                        <button
                          onClick={() => abrirModalAnadirViaje(lugar)}
                          className="btn btn-secondary btn-sm"
                          title="Añadir a mi viaje planificado"
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '6px 10px',
                            background: 'rgba(255,255,255,0.1)',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px'
                          }}
                        >
                          <Plus size={14} /> Viaje
                        </button>

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${lugar.latitud},${lugar.longitud}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="Abrir navegación GPS"
                          style={{
                            fontSize: '0.78rem',
                            padding: '6px 10px',
                            background: 'rgba(255,255,255,0.1)',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Navigation size={13} />
                        </a>
                      </div>

                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* MODAL PARA AÑADIR LUGAR A VIAJE PLANIFICADO */}
      {modalAnadirViajeAbierto && lugarParaViaje && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          padding: '16px'
        }}>
          <div className="camper-card" style={{ maxWidth: '460px', width: '100%', padding: '24px', border: '2px solid var(--accent-forest)', background: 'var(--bg-surface-elevated)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Route size={18} color="var(--accent-forest)" />
                <span>Añadir a Viaje Planificado</span>
              </h3>
              <button className="btn-icon" onClick={() => setModalAnadirViajeAbierto(false)} style={{ width: '30px', height: '30px' }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Añade <strong>{lugarParaViaje.nombre}</strong> a una de tus rutas camper en curso o crea una nueva.
            </p>

            {mensajeExitoViaje ? (
              <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Check size={20} />
                <span>{mensajeExitoViaje}</span>
              </div>
            ) : (
              <form onSubmit={guardarLugarEnViaje} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {!creandoNuevoViajeInline && misViajesPlanificados.length > 0 ? (
                  <div>
                    <label style={{ fontSize: '0.80rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Selecciona tu viaje:</label>
                    <select
                      className="input"
                      value={viajeSeleccionadoId}
                      onChange={(e) => setViajeSeleccionadoId(e.target.value)}
                      required
                    >
                      {misViajesPlanificados.map(v => (
                        <option key={v.id} value={v.id}>{v.titulo} ({v.fecha_inicio})</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setCreandoNuevoViajeInline(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-forest)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', marginTop: '6px', padding: 0 }}
                    >
                      + Crear un nuevo viaje en su lugar
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.80rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Título del nuevo viaje:</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Ej: Ruta Costa Norte en Camper"
                        value={nuevoViajeTitulo}
                        onChange={(e) => setNuevoViajeTitulo(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.80rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Fecha de inicio:</label>
                      <input
                        type="date"
                        className="input"
                        value={nuevoViajeFecha}
                        onChange={(e) => setNuevoViajeFecha(e.target.value)}
                        required
                      />
                    </div>
                    {misViajesPlanificados.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCreandoNuevoViajeInline(false)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                      >
                        ← Volver a elegir viaje existente
                      </button>
                    )}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.80rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Fecha parada:</label>
                    <input
                      type="date"
                      className="input"
                      value={fechaParada}
                      onChange={(e) => setFechaParada(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.80rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Noches / Días:</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      className="input"
                      value={diasParada}
                      onChange={(e) => setDiasParada(parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.80rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Notas de la parada (opcional):</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej: Cargar agua limpia y dormir bajo los pinos"
                    value={notasParada}
                    onChange={(e) => setNotasParada(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setModalAnadirViajeAbierto(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={guardandoEnViaje}>
                    {guardandoEnViaje ? 'Guardando...' : 'Añadir al Viaje'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
