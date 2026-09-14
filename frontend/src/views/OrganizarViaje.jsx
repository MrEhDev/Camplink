// Aquí implemento la vista Organizar Viaje en Camplink:
// gestión de viajes futuros y planificados con reordenación táctil y Drag & Drop a la izquierda,
// cálculo de distancias reales por tramo por carretera, trazado OSRM real en el mapa,
// diferenciación visual de Salida y Vuelta a Base, y aviso de repostaje al 80% de autonomía.

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { buscarGasolinerasCercanas } from '../services/gasolineras';
import ModalCompartirViaje from '../components/ModalCompartirViaje';
import CamperIconRating from '../components/CamperIconRating';
import { obtenerImagenLugar } from '../utils/lugarImagenes';
import { obtenerEtiquetaTipoLugar } from './DescubreMapa';
import {
  Calendar, MapPin, Plus, Route,
  Map, Compass, Trash2, Edit2, Edit3,
  Check, X, ChevronDown, ChevronUp,
  Sparkles, Fuel, ArrowRight, Eye,
  ArrowUp, ArrowDown, GripVertical, Search, AlertTriangle, Radar, Home, Flag, Navigation, Info,
  Share2, CheckCircle, Mail, UserCheck, Maximize2, Minimize2, Link, MapPinned
} from 'lucide-react';

// Icono de pernocta para el trazado de paradas en el mapa
const miniIconoPlan = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [22, 34],
  iconAnchor: [11, 34],
  popupAnchor: [1, -28],
  shadowSize: [32, 32]
});

const CONFIG_POR_TIPO = {
  camping: {
    emoji: '⛺',
    nombre: 'Camping',
    colorFondo: '#10B981', // Verde Esmeralda
    colorBorde: '#047857',
    svgVector: `
      <g transform="translate(5, 3.5)">
        <path d="M7 1.5 L1.5 11.5 L12.5 11.5 Z M7 1.5 L7 11.5 M4.2 11.5 L7 7.2 L9.8 11.5" stroke="#10B981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
    `
  },
  area_autocaravanas: {
    emoji: '🚐',
    nombre: 'Área de Autocaravanas',
    colorFondo: '#3B82F6', // Azul Nómada
    colorBorde: '#1D4ED8',
    svgVector: `
      <g transform="translate(5, 4)">
        <path d="M1.5 3 H9.5 V10 H1.5 Z M9.5 5.5 H12 L13.5 8 V10 H9.5 Z" fill="#3B82F6"/>
        <circle cx="3.8" cy="10.2" r="1.3" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1"/>
        <circle cx="11.2" cy="10.2" r="1.3" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1"/>
      </g>
    `
  },
  pernocta_libre: {
    emoji: '🌲',
    nombre: 'Pernocta Libre (Naturaleza)',
    colorFondo: '#059669', // Verde Bosque Naturaleza
    colorBorde: '#064E3B',
    svgVector: `
      <g transform="translate(5, 3.5)">
        <path d="M7 1 L2.5 6 H4.5 L2 10 H5.5 V13 H8.5 V10 H12 L9.5 6 H11.5 Z" fill="#059669"/>
      </g>
    `
  },
  parking_urbano: {
    emoji: '🅿️',
    nombre: 'Parking Urbano / Mixto',
    colorFondo: '#6366F1', // Indigo Parking
    colorBorde: '#4338CA',
    svgVector: `
      <text x="12" y="14.5" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="11" fill="#6366F1">P</text>
    `
  },
  solo_servicios: {
    emoji: '💧',
    nombre: 'Solo Servicios',
    colorFondo: '#06B6D4', // Cian Agua / Servicios
    colorBorde: '#0E7490',
    svgVector: `
      <g transform="translate(5, 3.5)">
        <path d="M7 1.5 C7 1.5 2.5 7 2.5 9.8 C2.5 12.3 4.5 13.5 7 13.5 C9.5 13.5 11.5 12.3 11.5 9.8 C11.5 7 7 1.5 7 1.5 Z" fill="#06B6D4"/>
      </g>
    `
  },
  area_recreativa: {
    emoji: '🏞️',
    nombre: 'Área Recreativa / Merendero',
    colorFondo: '#F59E0B', // Ámbar Merendero
    colorBorde: '#B45309',
    svgVector: `
      <g transform="translate(5, 4)">
        <path d="M1 4.5 H13 M7 4.5 V11 M3.5 11 L5.5 4.5 M10.5 11 L8.5 4.5 M1 8 H13" stroke="#F59E0B" stroke-width="1.4" stroke-linecap="round" fill="none"/>
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

const ICON_CACHE = {};

const obtenerIconoPorLugar = (lugar) => {
  const tipo = lugar?.tipo_lugar || 'pernocta_libre';
  const val = parseFloat(lugar?.valoracion_media) || 0;
  const total = lugar?.total_valoraciones !== undefined
    ? lugar.total_valoraciones
    : (Array.isArray(lugar?.valoraciones) ? lugar.valoraciones.length : 0);
  const hasStar = (val >= 4.0 && total > 0) ? '1' : '0';
  const cacheKey = `${tipo}_${hasStar}`;

  if (ICON_CACHE[cacheKey]) {
    return ICON_CACHE[cacheKey];
  }

  const cfg = CONFIG_POR_TIPO[tipo] || CONFIG_POR_TIPO.pernocta_libre;
  const starBadge = hasStar === '1'
    ? `<div style="position: absolute; top: -3px; right: -3px; background: #F59E0B; border: 1.5px solid #FFFFFF; border-radius: 50%; width: 11px; height: 11px; display: flex; align-items: center; justify-content: center; font-size: 7px; color: #FFFFFF; font-weight: 900; box-shadow: 0 1px 3px rgba(0,0,0,0.4);">★</div>`
    : '';

  const icon = L.divIcon({
    className: 'custom-camper-marker',
    html: `
      <div class="marker-pin-inner" style="
        position: relative;
        width: 24px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.45));
        cursor: pointer;
      ">
        <svg viewBox="0 0 24 28" width="24" height="28" style="display: block;">
          <path d="M12 1 C6.48 1 2 5.48 2 11 C2 18.5 12 27.5 12 27.5 C12 27.5 22 18.5 22 11 C22 5.48 17.52 1 12 1 Z" 
                fill="${cfg.colorFondo}" stroke="${cfg.colorBorde}" stroke-width="1.5"/>
          <circle cx="12" cy="10.5" r="7.2" fill="#FFFFFF"/>
          ${cfg.svgVector}
        </svg>
        ${starBadge}
      </div>
    `,
    iconSize: [24, 28],
    iconAnchor: [12, 28],
    popupAnchor: [0, -26]
  });

  ICON_CACHE[cacheKey] = icon;
  return icon;
};

// Controlador de zoom y centrado automático cuando se buscan gasolineras
function ActualizadorVistaMapa({ panelGasolineras }) {
  const map = useMap();

  useEffect(() => {
    if (panelGasolineras && panelGasolineras.lat != null && panelGasolineras.lng != null) {
      if (panelGasolineras.lista && panelGasolineras.lista.length > 0) {
        const puntosValidos = [
          [panelGasolineras.lat, panelGasolineras.lng],
          ...panelGasolineras.lista
            .filter(g => g.lat != null && g.lng != null)
            .map(g => [g.lat, g.lng])
        ];
        const bounds = L.latLngBounds(puntosValidos);
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 13, animate: true });
      } else {
        map.flyTo([panelGasolineras.lat, panelGasolineras.lng], 12, { animate: true, duration: 1.2 });
      }
    }
  }, [panelGasolineras?.widgetKey, panelGasolineras?.lista, map]);

  return null;
}

// PASO 4: Componente para capturar clicks en el mapa del modo ampliado
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      try {
        const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&limit=1&lang=es`);
        const data = await res.json();
        const feat = data.features && data.features[0];
        let nombre = 'Ubicación seleccionada';
        if (feat) {
          const p = feat.properties;
          nombre = [p.name, p.city || p.county, p.country].filter(Boolean).join(', ') || nombre;
        }
        onMapClick({ lat, lng, nombre });
      } catch {
        onMapClick({ lat, lng, nombre: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      }
    }
  });
  return null;
}

// Función para calcular la escala cromática de gasolineras (Verde = más barata -> Rojo = más cara)
// Funciones para generación de enlaces y exportación a Google Calendar
function generarUrlGoogleCalendarParada(parada, viaje, fechaEstimada) {
  let icono = '🏕️';
  if (parada.es_base) {
    icono = (parada.tipo === 'base_salida' || parada.id === 'base-salida') ? '🏠' : '🏁';
  } else if (parada.tipo === 'gasolinera' || parada.es_repostaje) {
    icono = '⛽';
  } else {
    const iconMap = {
      pernocta_libre: '🌲',
      area_autocaravanas: '🚐',
      camping: '⛺',
      parking_urbano: '🅿️',
      area_recreativa: '🏞️',
      solo_servicios: '💧'
    };
    icono = iconMap[parada.tipo_lugar] || '🏕️';
  }
  const titulo = `${icono} ${parada.nombre}`;

  const fStr = (parada.fecha_llegada || fechaEstimada || viaje.fecha_inicio || new Date().toISOString().split('T')[0]).split('T')[0];
  const fechaLimpia = fStr.replace(/-/g, '');
  const dias = (parada.dias_previstos !== '' && parada.dias_previstos !== null && parada.dias_previstos !== undefined)
    ? parseInt(parada.dias_previstos, 10)
    : 0;

  const dStart = new Date(fStr);
  const dEnd = new Date(dStart);
  dEnd.setDate(dEnd.getDate() + (dias > 0 ? dias : 1));
  const yyyyEnd = dEnd.getFullYear();
  const mmEnd = String(dEnd.getMonth() + 1).padStart(2, '0');
  const ddEnd = String(dEnd.getDate()).padStart(2, '0');
  const fechaFinStr = `${yyyyEnd}${mmEnd}${ddEnd}`;

  const dates = `${fechaLimpia}/${fechaFinStr}`;

  const ubicacion = (parada.latitud != null && parada.longitud != null)
    ? `${parada.latitud},${parada.longitud}`
    : (parada.direccion || parada.poblacion || '');

  const lineasDesc = [];
  if (parada.lugar_id) {
    const urlLugar = `${window.location.origin}/?lugar=${parada.lugar_id}`;
    lineasDesc.push(`🔗 Enlace al lugar: <a href="${urlLugar}">${urlLugar}</a>`);
  }
  if (parada.notas_privadas) {
    lineasDesc.push(`📝 Mis notas personales: ${parada.notas_privadas}`);
  }
  if (parada.tipo === 'gasolinera' && parada.precio) {
    lineasDesc.push(`⛽ Precio combustible: ${parada.precio} €/L`);
    if (parada.tipo_combustible) lineasDesc.push(`Tipo: ${parada.tipo_combustible}`);
  }
  if (parada.equipamiento && parada.equipamiento.length > 0) {
    lineasDesc.push(`🛠️ Equipamiento: ${parada.equipamiento.join(', ')}`);
  }
  if (parada.entorno && parada.entorno.length > 0) {
    lineasDesc.push(`🌲 Entorno: ${parada.entorno.join(', ')}`);
  }
  if (parada.acceso && parada.acceso.length > 0) {
    lineasDesc.push(`🛣️ Acceso y terreno: ${parada.acceso.join(', ')}`);
  }
  if (parada.latitud != null && parada.longitud != null) {
    const urlGps = `https://www.google.com/maps/dir/?api=1&destination=${parada.latitud},${parada.longitud}`;
    lineasDesc.push(`📍 Navegación GPS: <a href="${urlGps}">${urlGps}</a>`);
  }
  lineasDesc.push(`🚐 Itinerario: ${viaje.titulo} (Camplink)`);

  const details = lineasDesc.join('\n\n');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titulo)}&dates=${dates}&location=${encodeURIComponent(ubicacion)}&details=${encodeURIComponent(details)}`;
}

function parseFechaLocal(str, fallback) {
  if (!str) return fallback ? new Date(fallback) : new Date();
  const partes = String(str).split('T')[0].split('-');
  if (partes.length === 3) {
    return new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
  }
  return new Date(str);
}

function formatFechaICS(d) {
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${anio}${mes}${dia}`;
}

function exportarItinerarioGoogleCalendar(viaje, paradas) {
  const lineasIcs = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Camplink//Itinerario Nomada//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH"
  ];
  let fechaCursor = viaje.fecha_inicio ? parseFechaLocal(viaje.fecha_inicio) : new Date();

  paradas.forEach((p, idx) => {
    let fInicio = p.fecha_llegada ? parseFechaLocal(p.fecha_llegada) : new Date(fechaCursor);
    const dias = (p.dias_previstos !== '' && p.dias_previstos !== null && p.dias_previstos !== undefined)
      ? parseInt(p.dias_previstos, 10)
      : 0;
    let fFin = new Date(fInicio);
    fFin.setDate(fFin.getDate() + (dias > 0 ? dias : 1));

    const fInicioStr = formatFechaICS(fInicio);
    const fFinStr = formatFechaICS(fFin);

    let icono = '🏕️';
    if (p.es_base) icono = (p.tipo === 'base_salida' || p.id === 'base-salida') ? '🏠' : '🏁';
    else if (p.tipo === 'gasolinera' || (p.nombre && p.nombre.startsWith('⛽'))) icono = '⛽';

    const summary = `${icono} ${p.nombre}`.replace(/,/g, '\,').replace(/;/g, '\;');
    const rawLoc = (p.latitud != null && p.longitud != null)
      ? `https://www.google.com/maps/search/?api=1&query=${p.latitud},${p.longitud}`
      : (p.direccion || p.poblacion || '');
    const location = rawLoc.replace(/,/g, '\,').replace(/;/g, '\;');

    const lineas = [];
    if (p.lugar_id) lineas.push(`Enlace: ${window.location.origin}/?lugar=${p.lugar_id}`);
    if (p.notas_privadas) lineas.push(`Notas personales: ${p.notas_privadas}`);
    if (p.tipo === 'gasolinera' && p.precio) lineas.push(`Precio: ${p.precio} €/L`);
    if (p.equipamiento?.length) lineas.push(`Equipamiento: ${p.equipamiento.join(', ')}`);
    if (p.entorno?.length) lineas.push(`Entorno: ${p.entorno.join(', ')}`);
    if (p.acceso?.length) lineas.push(`Acceso: ${p.acceso.join(', ')}`);

    const desc = lineas.join('\n\n');

    lineasIcs.push(
      "BEGIN:VEVENT",
      `UID:camplink-${viaje.id}-${idx}-${Date.now()}@camplinkapp.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;VALUE=DATE:${fInicioStr}`,
      `DTEND;VALUE=DATE:${fFinStr}`,
      `SUMMARY:${summary}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${desc}`,
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );

    if (!p.fecha_llegada) {
      fechaCursor = new Date(fFin);
    }
  });

  lineasIcs.push("END:VCALENDAR");

  const icsContent = lineasIcs.join(String.fromCharCode(13, 10)) + String.fromCharCode(13, 10);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const nombreLimpio = (viaje.titulo || viaje.nombre || 'itinerario').replace(/[^a-zA-Z0-9_À-ſ-]/g, '_');
  a.setAttribute('download', `${nombreLimpio}_camplink.ics`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

function calcularColorGasolinera(precio, minPrecio, maxPrecio) {
  if (precio == null || minPrecio == null || maxPrecio == null || minPrecio >= maxPrecio) {
    return '#10B981'; // Verde por defecto si tienen el mismo coste
  }
  const t = Math.max(0, Math.min(1, (precio - minPrecio) / (maxPrecio - minPrecio)));
  const hue = Math.round((1 - t) * 135);
  return `hsl(${hue}, 88%, 42%)`;
}

// Creador dinámico de icono con el color según el coste de la gasolina
function crearIconoGasolineraColor(color, esMasBarata = false) {
  return L.divIcon({
    className: 'custom-gas-colored-pin',
    html: `<div style="
      background: ${color};
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 8px rgba(0,0,0,0.45);
      border: 2px solid white;
      position: relative;
    ">
      <div style="transform: rotate(45deg); font-size: 13px; line-height: 1;">⛽</div>
      ${esMasBarata ? `
        <span style="
          position: absolute;
          top: -7px;
          right: -7px;
          transform: rotate(45deg);
          background: #10B981;
          color: white;
          font-size: 8px;
          font-weight: 900;
          padding: 1px 3px;
          border-radius: 3px;
          border: 1px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        ">TOP</span>
      ` : ''}
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
}

// Icono de gasolinera fija en la ruta
const miniIconoGasolinera = L.divIcon({
  className: 'custom-gas-pin',
  html: `<div style="
    background: #D97706;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    border: 2px solid white;
  ">
    <div style="transform: rotate(45deg); font-size: 14px; line-height: 1;">⛽</div>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// Icono de gasolineras sugeridas en la búsqueda interactiva
const miniIconoGasolineraSugerida = L.divIcon({
  className: 'custom-gas-suggested-pin',
  html: `<div style="
    background: #F59E0B;
    color: white;
    width: 26px;
    height: 26px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.35);
    border: 2px solid white;
  ">
    <div style="transform: rotate(45deg); font-size: 12px; line-height: 1;">⛽</div>
  </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -26]
});

// Icono del punto crítico donde se supera el 80% de combustible
const miniIconoPuntoCritico = L.divIcon({
  className: 'custom-critical-pin',
  html: `<div style="
    background: #EF4444;
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.35), 0 2px 6px rgba(0,0,0,0.4);
    border: 2px solid white;
  ">
    <span style="font-size: 13px; line-height: 1;">⚠️</span>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

// Icono de base camper para inicio y fin
const miniIconoBase = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [22, 34],
  iconAnchor: [11, 34],
  popupAnchor: [1, -28],
  shadowSize: [32, 32]
});

// Función matemática de cálculo de distancia real por carretera (Haversine + 22% de sinuosidad media en España/Europa)
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1.22);
}

export default function OrganizarViaje({ alSeleccionarLugar, alExplorarMapa, abrirRadar }) {
  const { usuario } = useAuth();
  const { idioma, formatearFecha } = useTranslation();
  const [viajes, setViajes] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados del modal de creación de viaje
  const [modalNuevoViajeAbierto, setModalNuevoViajeAbierto] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaFechaInicio, setNuevaFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [nuevaFechaFin, setNuevaFechaFin] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [guardandoViaje, setGuardandoViaje] = useState(false);
  const [infoAlertasAbiertas, setInfoAlertasAbiertas] = useState({});
  const toggleInfoAlerta = (key) => setInfoAlertasAbiertas(prev => ({ ...prev, [key]: !prev[key] }));

  // Estados de expansión y edición en línea — persistidos en localStorage para sobrevivir recargas
  const [viajesExpandidos, setViajesExpandidos] = useState(() => {
    try {
      const saved = localStorage.getItem('camplink_viajes_expandidos');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [editandoFechaParadaId, setEditandoFechaParadaId] = useState(null);
  const [formEdicionParada, setFormEdicionParada] = useState({ fecha: '', dias_previstos: 0 });
  const [lugarParaAnadirConfig, setLugarParaAnadirConfig] = useState(null);
  const [coordsPoblacionBase, setCoordsPoblacionBase] = useState(null);

  // Si el explorador no tiene coordenadas de lat_base pero sí población, obtener coordenadas de la localidad
  useEffect(() => {
    if (!usuario?.lat_base && usuario?.poblacion) {
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(usuario.poblacion)}&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (data?.features?.length > 0) {
            const [lng, lat] = data.features[0].geometry.coordinates;
            setCoordsPoblacionBase({ lat, lng });
          }
        })
        .catch(err => console.warn('Geocodificación población base:', err));
    }
  }, [usuario?.lat_base, usuario?.poblacion]);
  const [editandoId, setEditandoId] = useState(null);
  const [tituloEditado, setTituloEditado] = useState('');

  // Reordenación y gasolineras
  const [arrastrandoIdx, setArrastrandoIdx] = useState(null);
  const [panelGasolineras, setPanelGasolineras] = useState(null);

  // Estados de compartir viaje e invitaciones
  const [viajeACompartir, setViajeACompartir] = useState(null);
  const [invitacionesRecibidas, setInvitacionesRecibidas] = useState([]);
  const [procesandoInvId, setProcesandoInvId] = useState(null);
  const [notificacionExito, setNotificacionExito] = useState('');

  // Buscador integrado de lugares para añadir paradas a la ruta
  const [buscadorLugarAbierto, setBuscadorLugarAbierto] = useState({});
  const [textoBusquedaLugar, setTextoBusquedaLugar] = useState({});
  const [resultadosLugar, setResultadosLugar] = useState({});
  const [buscandoLugar, setBuscandoLugar] = useState({});
  const [anadiendoLugarId, setAnadiendoLugarId] = useState(null);
  const timerBusquedaLugar = useRef({});

  // Lugares completos de Camplink para clustering en mapa expandido
  const [lugaresCamplink, setLugaresCamplink] = useState([]);

  // Estado y persistencia en localStorage para alertas de combustible cerradas
  const [alertasCombustibleOcultas, setAlertasCombustibleOcultas] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('camplink_alertas_combustible_ocultas') || '{}');
    } catch {
      return {};
    }
  });

  const ocultarAlertaCombustible = (alertaKey) => {
    setAlertasCombustibleOcultas(prev => {
      const next = { ...prev, [alertaKey]: true };
      try {
        localStorage.setItem('camplink_alertas_combustible_ocultas', JSON.stringify(next));
      } catch (e) { }
      return next;
    });
  };

  useEffect(() => {
    peticionApi('/api/lugares/puntos/')
      .then(res => {
        const lista = Array.isArray(res) ? res : (res?.results || []);
        setLugaresCamplink(lista);
      })
      .catch(err => console.warn('Error cargando spots para mapa de organizador:', err));
  }, []);

  // PASO 3: Estados para dirección externa (geocodificación libre / URL Google Maps)
  const [modoAnadir, setModoAnadir] = useState({}); // 'camplink' | 'libre' por viajeId
  const [textoDireccion, setTextoDireccion] = useState({});
  const [sugerenciasGeo, setSugerenciasGeo] = useState({});
  const [buscandoGeo, setBuscandoGeo] = useState({});
  const [puntoExternoConfig, setPuntoExternoConfig] = useState(null);
  const timerGeo = useRef({});

  // PASO 4: Estado para el mapa expandido a pantalla completa
  const [mapaExpandidoViaje, setMapaExpandidoViaje] = useState(null);
  const [clickMapaInfo, setClickMapaInfo] = useState(null); // { lat, lng, nombre, viajeId }

  const manejarBusquedaLugar = (viajeId, texto) => {
    setTextoBusquedaLugar(prev => ({ ...prev, [viajeId]: texto }));
    if (timerBusquedaLugar.current[viajeId]) {
      clearTimeout(timerBusquedaLugar.current[viajeId]);
    }
    const termLimpio = texto.trim();
    if (!termLimpio) {
      setResultadosLugar(prev => ({ ...prev, [viajeId]: [] }));
      return;
    }
    setBuscandoLugar(prev => ({ ...prev, [viajeId]: true }));
    timerBusquedaLugar.current[viajeId] = setTimeout(async () => {
      try {
        const res = await peticionApi(`/api/lugares/puntos/?q=${encodeURIComponent(termLimpio)}`);
        const lista = Array.isArray(res) ? res : (res?.results || []);
        setResultadosLugar(prev => ({ ...prev, [viajeId]: lista }));
      } catch (err) {
        console.error('Error buscando lugares para viaje:', err);
        setResultadosLugar(prev => ({ ...prev, [viajeId]: [] }));
      } finally {
        setBuscandoLugar(prev => ({ ...prev, [viajeId]: false }));
      }
    }, 300);
  };

  // PASO 3: Parsear URL de Google Maps o coordenadas directas para extraer datos
  const parsearUrlGoogleMaps = (url) => {
    if (!url || typeof url !== 'string') return null;
    let decoded = url;
    try {
      decoded = decodeURIComponent(url);
    } catch {
      decoded = url;
    }

    // 1. Extraer coordenadas numéricas directas en URL o texto "lat, lng"
    const coordPatterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&]daddr=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&]saddr=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
      /\/dir\/[^\/]*\/(-?\d+\.\d+),(-?\d+\.\d+)/,
      /\/search\/(-?\d+\.\d+),(-?\d+\.\d+)/,
      /^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/
    ];

    let coords = null;
    for (const pat of coordPatterns) {
      const m = decoded.match(pat);
      if (m) {
        coords = { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
        break;
      }
    }

    // 2. Extraer nombre del lugar de la URL si viene
    let nombreLugar = 'Ubicación en Google Maps';
    const placeMatch = decoded.match(/\/place\/([^/@\?]+)/);
    if (placeMatch && placeMatch[1]) {
      nombreLugar = placeMatch[1].replace(/\+/g, ' ').replace(/_/g, ' ');
    } else {
      const qTextMatch = decoded.match(/[?&]q=([^&]+)/);
      if (qTextMatch && qTextMatch[1] && !coords) {
        nombreLugar = qTextMatch[1].replace(/\+/g, ' ');
      }
    }

    if (coords && !isNaN(coords.lat) && !isNaN(coords.lng)) {
      return {
        lat: coords.lat,
        lng: coords.lng,
        nombre: nombreLugar,
        direccion: `${nombreLugar} (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`,
        esUrl: true
      };
    }

    if (nombreLugar && nombreLugar !== 'Ubicación en Google Maps') {
      return { buscarTexto: nombreLugar };
    }

    return null;
  };

  // PASO 3: Buscar dirección con Nominatim OpenStreetMap (misma lógica que el Registro) y fallback inteligente
  const buscarDireccionPhoton = (viajeId, texto) => {
    setTextoDireccion(prev => ({ ...prev, [viajeId]: texto }));
    if (timerGeo.current[viajeId]) clearTimeout(timerGeo.current[viajeId]);

    const str = (texto || '').trim();
    if (!str) {
      setSugerenciasGeo(prev => ({ ...prev, [viajeId]: [] }));
      setBuscandoGeo(prev => ({ ...prev, [viajeId]: false }));
      return;
    }

    // Detectar si es URL de Google Maps o coordenadas directas
    if (str.includes('google.com/maps') || str.includes('goo.gl/maps') || str.includes('maps.app.goo.gl') || /^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/.test(str)) {
      const parsed = parsearUrlGoogleMaps(str);
      if (parsed && parsed.lat && parsed.lng) {
        setSugerenciasGeo(prev => ({
          ...prev,
          [viajeId]: [{
            lat: parsed.lat,
            lng: parsed.lng,
            nombre: parsed.nombre,
            direccion: parsed.direccion,
            esUrl: true
          }]
        }));
        setBuscandoGeo(prev => ({ ...prev, [viajeId]: false }));
        return;
      }

      // Si es una URL de Google Maps sin coordenadas explícitas en el texto (ej: enlaces cortos maps.app.goo.gl), resolver en backend
      if (str.includes('maps.app.goo.gl') || str.includes('goo.gl/maps') || str.includes('google.com/maps')) {
        setBuscandoGeo(prev => ({ ...prev, [viajeId]: true }));
        peticionApi('/api/lugares/lugares/extraer-maps/', {
          method: 'POST',
          body: { url: str }
        }).then(res => {
          if (res && res.lat != null && res.lng != null) {
            const nombre = res.nombre || res.poblacion || res.nombre_extraido || 'Ubicación en Google Maps';
            const direccion = res.direccion_completa || res.direccion || `${res.poblacion || ''}, ${res.provincia || ''}`.trim() || `${parseFloat(res.lat).toFixed(5)}, ${parseFloat(res.lng).toFixed(5)}`;
            setSugerenciasGeo(prev => ({
              ...prev,
              [viajeId]: [{
                lat: parseFloat(res.lat),
                lng: parseFloat(res.lng),
                nombre: nombre,
                direccion: direccion,
                esUrl: true
              }]
            }));
          } else {
            setSugerenciasGeo(prev => ({ ...prev, [viajeId]: [] }));
          }
        }).catch(err => {
          console.warn('Error resolviendo URL de Google Maps en backend:', err);
          setSugerenciasGeo(prev => ({ ...prev, [viajeId]: [] }));
        }).finally(() => {
          setBuscandoGeo(prev => ({ ...prev, [viajeId]: false }));
        });
        return;
      }
    }

    if (str.length < 3) {
      setSugerenciasGeo(prev => ({ ...prev, [viajeId]: [] }));
      setBuscandoGeo(prev => ({ ...prev, [viajeId]: false }));
      return;
    }

    setBuscandoGeo(prev => ({ ...prev, [viajeId]: true }));
    timerGeo.current[viajeId] = setTimeout(async () => {
      try {
        const queryTerm = encodeURIComponent(str);
        // 1. Nominatim OSM (idéntica a la vista de Registro)
        const urlNominatim = `https://nominatim.openstreetmap.org/search?q=${queryTerm}&format=json&addressdetails=1&limit=6`;
        const res = await fetch(urlNominatim, { headers: { 'Accept-Language': 'es' } });
        const data = await res.json();

        if (data && Array.isArray(data) && data.length > 0) {
          const sugerencias = data.map(item => {
            const addr = item.address || {};
            const ciudad = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
            const provincia = addr.state || addr.province || '';
            const nombrePrincipal = item.name || ciudad || (item.display_name ? item.display_name.split(',')[0] : 'Ubicación');
            return {
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              nombre: nombrePrincipal,
              direccion: item.display_name || nombrePrincipal,
              ciudad,
              provincia
            };
          });
          setSugerenciasGeo(prev => ({ ...prev, [viajeId]: sugerencias }));
        } else {
          // 2. Fallback a Photon Komoot si Nominatim no devuelve resultados
          try {
            const resPhoton = await fetch(`https://photon.komoot.io/api/?q=${queryTerm}&limit=5&lang=es`);
            const dataPhoton = await resPhoton.json();
            const sugerencias = (dataPhoton.features || []).map(f => {
              const p = f.properties;
              const nombre = [p.name, p.city || p.county, p.country].filter(Boolean).join(', ');
              return {
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0],
                nombre: p.name || nombre || 'Ubicación',
                direccion: nombre || 'Dirección encontrada'
              };
            });
            setSugerenciasGeo(prev => ({ ...prev, [viajeId]: sugerencias }));
          } catch {
            setSugerenciasGeo(prev => ({ ...prev, [viajeId]: [] }));
          }
        }
      } catch (err) {
        console.warn('Error geocodificación:', err);
        setSugerenciasGeo(prev => ({ ...prev, [viajeId]: [] }));
      } finally {
        setBuscandoGeo(prev => ({ ...prev, [viajeId]: false }));
      }
    }, 300);
  };

  // PASO 3: Añadir una parada libre (dirección externa) al viaje via nuevo endpoint
  const anadirDireccionExternaAViaje = async (viajeId, punto, fecha, noches) => {
    setAnadiendoLugarId('externo');
    try {
      const res = await peticionApi(`/api/viajes/viajes/${viajeId}/anadir-parada-libre/`, {
        method: 'POST',
        body: {
          nombre: punto.nombre,
          lat: punto.lat,
          lng: punto.lng,
          direccion: punto.direccion || punto.nombre,
          fecha: fecha || null,
          dias_previstos: parseInt(noches ?? 0, 10)
        }
      });
      setGeometriasRutas(prev => { const copy = { ...prev }; delete copy[viajeId]; return copy; });
      if (res?.viaje) setViajes(prev => prev.map(v => v.id === viajeId ? res.viaje : v));
      await cargarViajes();
      setTextoDireccion(prev => ({ ...prev, [viajeId]: '' }));
      setSugerenciasGeo(prev => ({ ...prev, [viajeId]: [] }));
      setPuntoExternoConfig(null);
      setBuscadorLugarAbierto(prev => ({ ...prev, [viajeId]: false }));
    } catch (err) {
      alert(err.message || 'Error al añadir la dirección al itinerario.');
    } finally {
      setAnadiendoLugarId(null);
    }
  };

  const anadirLugarAViaje = async (viajeId, lugar, fecha = null, noches = 0) => {
    setAnadiendoLugarId(lugar.id);
    try {
      const res = await peticionApi(`/api/viajes/viajes/${viajeId}/anadir-parada/`, {
        method: 'POST',
        body: {
          lugar_id: lugar.id,
          fecha: fecha || null,
          dias_previstos: parseInt(noches != null && noches !== '' ? noches : 0, 10)
        }
      });
      // Limpiar cache OSRM para que recalcule con la nueva parada
      setGeometriasRutas(prev => {
        const copy = { ...prev };
        delete copy[viajeId];
        return copy;
      });
      if (res?.viaje) {
        setViajes(prev => prev.map(v => v.id === viajeId ? res.viaje : v));
      }
      await cargarViajes();
      setTextoBusquedaLugar(prev => ({ ...prev, [viajeId]: '' }));
      setResultadosLugar(prev => ({ ...prev, [viajeId]: [] }));
      setLugarParaAnadirConfig(null);
    } catch (err) {
      alert(err.message || 'Error al añadir lugar al itinerario.');
    } finally {
      setAnadiendoLugarId(null);
    }
  };

  const guardarModificacionParada = async (viajeId, paradaId) => {
    try {
      const res = await peticionApi(`/api/viajes/viajes/${viajeId}/modificar-parada/`, {
        method: 'POST',
        body: {
          parada_id: paradaId,
          fecha: formEdicionParada.fecha || null,
          dias_previstos: parseInt(formEdicionParada.dias_previstos != null && formEdicionParada.dias_previstos !== '' ? formEdicionParada.dias_previstos : 0, 10)
        }
      });
      // Limpiar cache OSRM
      setGeometriasRutas(prev => {
        const copy = { ...prev };
        delete copy[viajeId];
        return copy;
      });
      if (res?.viaje) {
        setViajes(prev => prev.map(v => v.id === viajeId ? res.viaje : v));
      }
      await cargarViajes();
      setEditandoFechaParadaId(null);
    } catch (err) {
      alert('Error al modificar la fecha o noches de la etapa.');
    }
  };


  // Geometría de carreteras OSRM en tiempo real para mapa
  const [geometriasRutas, setGeometriasRutas] = useState({});

  const cargarViajes = async () => {
    setCargando(true);
    try {
      const data = await peticionApi('/api/viajes/viajes/?mis_viajes=true');
      const lista = data.results || data || [];
      setViajes(lista);
      // No resetear el estado de expansión — se preserva de localStorage
    } catch (err) {
      console.error('Error al cargar viajes en organizador:', err);
    } finally {
      setCargando(false);
    }
  };

  const cargarViajesSilencioso = async () => {
    try {
      const data = await peticionApi('/api/viajes/viajes/?mis_viajes=true');
      const lista = data.results || data || [];
      setViajes(lista);
    } catch (err) {
      console.warn('Error en sincronización silenciosa de viajes:', err);
    }
  };

  const cargarInvitaciones = async () => {
    if (!usuario) return;
    try {
      const data = await peticionApi('/api/viajes/invitaciones/');
      setInvitacionesRecibidas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error al cargar invitaciones de viaje:', err);
    }
  };

  const aceptarInvitacion = async (invId) => {
    setProcesandoInvId(invId);
    try {
      const res = await peticionApi(`/api/viajes/invitaciones/${invId}/aceptar/`, { method: 'POST' });
      setInvitacionesRecibidas(prev => prev.filter(inv => inv.id !== invId));
      setNotificacionExito(res?.mensaje || '¡Viaje añadido a tus viajes planificados!');
      await cargarViajes();
      setTimeout(() => setNotificacionExito(''), 4500);
    } catch (err) {
      alert(err.message || 'Error al aceptar la invitación.');
    } finally {
      setProcesandoInvId(null);
    }
  };

  const rechazarInvitacion = async (invId) => {
    setProcesandoInvId(invId);
    try {
      await peticionApi(`/api/viajes/invitaciones/${invId}/rechazar/`, { method: 'POST' });
      setInvitacionesRecibidas(prev => prev.filter(inv => inv.id !== invId));
    } catch (err) {
      alert(err.message || 'Error al rechazar la invitación.');
    } finally {
      setProcesandoInvId(null);
    }
  };

  useEffect(() => {
    cargarViajes();
    cargarInvitaciones();
  }, [usuario]);

  // Polling silencioso cada 15 segundos para sincronizar viajes compartidos en tiempo real sin interrumpir al usuario
  useEffect(() => {
    if (!usuario) return;
    const interval = setInterval(() => {
      cargarViajesSilencioso();
    }, 15000);
    return () => clearInterval(interval);
  }, [usuario]);

  // Carga el trazado real por carretera desde OSRM cuando hay paradas con coordenadas
  useEffect(() => {
    viajes.forEach(v => {
      const paradas = obtenerParadasViaje(v).filter(p => p.latitud != null && p.longitud != null);
      if (paradas.length >= 2 && !geometriasRutas[v.id]) {
        const coordStr = paradas.map(p => `${p.longitud},${p.latitud}`).join(';');
        fetch(`https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&steps=true`)
          .then(res => res.json())
          .then(data => {
            if (data.routes && data.routes[0] && data.routes[0].geometry) {
              const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
              const distanceKm = Math.round(data.routes[0].distance / 1000);
              const legs = (data.routes[0].legs || []).map(leg => {
                const legCoords = (leg.steps || []).flatMap(s => (s.geometry?.coordinates || []).map(c => [c[1], c[0]]));
                return {
                  distanceKm: Math.round((leg.distance || 0) / 1000),
                  durationMin: Math.round((leg.duration || 0) / 60),
                  coords: legCoords.length > 0 ? legCoords : []
                };
              });
              setGeometriasRutas(prev => ({ ...prev, [v.id]: { coords, distanceKm, legs } }));
            }
          })
          .catch(err => console.warn('OSRM fallback to straight line:', err));
      }
    });
  }, [viajes]);

  const toggleExpansion = (id) => {
    setViajesExpandidos(prev => {
      const siguiente = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem('camplink_viajes_expandidos', JSON.stringify(siguiente)); } catch { }
      return siguiente;
    });
  };

  const crearNuevoViaje = async (e) => {
    e.preventDefault();
    if (!nuevoTitulo.trim()) return;
    setGuardandoViaje(true);
    try {
      const nuevoViaje = await peticionApi('/api/viajes/viajes/', {
        method: 'POST',
        body: {
          titulo: nuevoTitulo.trim(),
          fecha_inicio: nuevaFechaInicio,
          fecha_fin: nuevaFechaFin || null,
          descripcion: nuevaDescripcion,
          esta_cerrado: false
        }
      });
      setModalNuevoViajeAbierto(false);
      setNuevoTitulo('');
      setNuevaDescripcion('');
      setNuevaFechaFin('');
      if (nuevoViaje && nuevoViaje.id) {
        setViajesExpandidos(prev => {
          const siguiente = { ...prev, [nuevoViaje.id]: true };
          try { localStorage.setItem('camplink_viajes_expandidos', JSON.stringify(siguiente)); } catch { }
          return siguiente;
        });
      }
      await cargarViajes();
    } catch (err) {
      alert(err.message || 'No se pudo crear el viaje planificado.');
    } finally {
      setGuardandoViaje(false);
    }
  };

  const guardarEdicionTitulo = async (viajeId) => {
    if (!tituloEditado.trim()) return;
    try {
      await peticionApi(`/api/viajes/viajes/${viajeId}/`, {
        method: 'PATCH',
        body: { titulo: tituloEditado.trim() }
      });
      setViajes(prev => prev.map(v => v.id === viajeId ? { ...v, titulo: tituloEditado.trim() } : v));
      setEditandoId(null);
    } catch (err) {
      alert('Error al actualizar el nombre del viaje.');
    }
  };

  const eliminarViaje = async (viajeId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este viaje planificado?')) return;
    try {
      await peticionApi(`/api/viajes/viajes/${viajeId}/`, { method: 'DELETE' });
      setViajes(prev => prev.filter(v => v.id !== viajeId));
    } catch (err) {
      alert('No se pudo eliminar el viaje.');
    }
  };

  const archivarViaje = async (viajeId) => {
    if (!window.confirm('¿Marcar este viaje como finalizado? Pasará a "Mis Viajes" en tu perfil.')) return;
    try {
      await peticionApi(`/api/viajes/viajes/${viajeId}/`, {
        method: 'PATCH',
        body: { esta_cerrado: true }
      });
      setViajes(prev => prev.filter(v => v.id !== viajeId));
    } catch (err) {
      alert('No se pudo archivar el viaje. Inténtalo de nuevo.');
    }
  };

  // REORDENACIÓN DE PARADAS (solo paradas intermedias, la base de salida y vuelta quedan fijas)
  const moverParada = async (viajeId, desdeIdx, haciaIdx) => {
    if (desdeIdx === haciaIdx || desdeIdx === null) return;
    const viaje = viajes.find(v => v.id === viajeId);
    if (!viaje) return;

    const listaActual = obtenerParadasViaje(viaje);
    if (desdeIdx < 0 || desdeIdx >= listaActual.length || haciaIdx < 0 || haciaIdx >= listaActual.length) return;

    // No permitir mover los puntos base
    if (listaActual[desdeIdx]?.es_base || listaActual[haciaIdx]?.es_base) return;

    const nuevaLista = [...listaActual];
    const elemento = nuevaLista.splice(desdeIdx, 1)[0];
    nuevaLista.splice(haciaIdx, 0, elemento);

    // Actualización optimista
    setViajes(prev => prev.map(v => v.id === viajeId ? { ...v, resumen_ruta: nuevaLista } : v));
    // Limpiar caché OSRM para que recalcule con el nuevo orden
    setGeometriasRutas(prev => {
      const copy = { ...prev };
      delete copy[viajeId];
      return copy;
    });

    try {
      const res = await peticionApi(`/api/viajes/viajes/${viajeId}/reordenar-paradas/`, {
        method: 'POST',
        body: { orden: nuevaLista }
      });
      if (res.viaje) {
        setViajes(prev => prev.map(v => v.id === viajeId ? res.viaje : v));
      }
    } catch (err) {
      console.error('Error al guardar el nuevo orden de paradas:', err);
    }
  };

  // BUSCADOR DE GASOLINERAS EN RUTA
  const abrirBuscadorGasolineras = async (viajeId, tramoIdx, lat, lng, paradaNombre, widgetKey = `parada-${tramoIdx}`) => {
    if (!lat || !lng) {
      alert('Coordenadas no disponibles en este punto para buscar gasolineras.');
      return;
    }
    if (panelGasolineras && panelGasolineras.viajeId === viajeId && panelGasolineras.widgetKey === widgetKey) {
      setPanelGasolineras(null);
      return;
    }
    setPanelGasolineras({
      viajeId,
      tramoIdx,
      lat,
      lng,
      paradaNombre,
      widgetKey,
      cargando: true,
      lista: []
    });

    try {
      const resultados = await buscarGasolinerasCercanas({
        lat,
        lng,
        radioKm: 25,
        tipoCombustible: usuario?.tipo_combustible || 'gasoleo_a'
      });
      setPanelGasolineras(prev => (prev && prev.widgetKey === widgetKey) ? { ...prev, cargando: false, lista: resultados } : prev);
    } catch (err) {
      console.error('Error buscando gasolineras en tramo:', err);
      setPanelGasolineras(prev => (prev && prev.widgetKey === widgetKey) ? { ...prev, cargando: false, lista: [] } : prev);
    }
  };

  const anadirGasolineraARuta = async (viajeId, gasolinera, tramoIdx) => {
    try {
      const res = await peticionApi(`/api/viajes/viajes/${viajeId}/anadir-gasolinera/`, {
        method: 'POST',
        body: {
          nombre: gasolinera.rotulo || 'Gasolinera',
          lat: gasolinera.lat,
          lng: gasolinera.lng,
          precio: gasolinera.precioLitro,
          direccion: gasolinera.direccion || `${gasolinera.municipio || ''}`,
          tipo_combustible: usuario?.tipo_combustible || 'gasoleo_a',
          despues_de_indice: tramoIdx
        }
      });
      // Limpiar cache OSRM para que recalcule el nuevo trazado por carretera incluyendo la gasolinera
      setGeometriasRutas(prev => {
        const copy = { ...prev };
        delete copy[viajeId];
        return copy;
      });
      if (res.viaje) {
        setViajes(prev => prev.map(v => v.id === viajeId ? res.viaje : v));
      }
      setPanelGasolineras(null);
    } catch (err) {
      alert(err.message || 'No se pudo añadir la gasolinera al itinerario.');
    }
  };

  const eliminarParada = async (viajeId, idx, parada) => {
    if (parada.es_base) return;
    if (!window.confirm(`¿Seguro que deseas eliminar la parada "${parada.nombre}" de este viaje?`)) return;
    try {
      const res = await peticionApi(`/api/viajes/viajes/${viajeId}/eliminar-parada/`, {
        method: 'POST',
        body: {
          indice: idx,
          checkin_id: parada.id && typeof parada.id === 'number' ? parada.id : null
        }
      });
      if (res.viaje) {
        setViajes(prev => prev.map(v => v.id === viajeId ? res.viaje : v));
      }
    } catch (err) {
      alert('No se pudo eliminar la parada del viaje.');
    }
  };

  // Normalización de paradas con anclaje de Salida desde base y Vuelta a base
  const obtenerParadasViaje = (viaje) => {
    let lista = [];
    if (viaje.resumen_ruta && viaje.resumen_ruta.length > 0) {
      lista = viaje.resumen_ruta.map((p, i) => {
        const esGas = p.tipo === 'gasolinera' || p.tipo_lugar === 'gasolinera' || (p.nombre && (p.nombre.startsWith('⛽') || p.nombre.includes('Gasolinera') || p.nombre.includes('Estación de Servicio')));
        const latVal = p.lat ?? p.latitud;
        const lngVal = p.lng ?? p.longitud;
        const diasVal = (p.dias_previstos !== '' && p.dias_previstos !== null && p.dias_previstos !== undefined)
          ? parseInt(p.dias_previstos, 10)
          : ((p.dias !== '' && p.dias !== null && p.dias !== undefined) ? parseInt(p.dias, 10) : 0);
        return {
          id: p.id || `r-${i}`,
          lugar_id: p.lugar_id,
          nombre: p.nombre || p.lugar_nombre || 'Parada',
          lat: latVal,
          lng: lngVal,
          latitud: latVal,
          longitud: lngVal,
          poblacion: p.poblacion || '',
          provincia: p.provincia || '',
          fecha_llegada: p.fecha || p.fecha_llegada || '',
          dias_previstos: diasVal,
          notas_privadas: p.notas_privadas || '',
          tipo: esGas ? 'gasolinera' : (p.tipo || 'parada'),
          tipo_lugar: p.tipo_lugar || (esGas ? 'gasolinera' : 'pernocta_libre'),
          equipamiento: p.equipamiento || [],
          entorno: p.entorno || [],
          acceso: p.acceso || [],
          es_repostaje: Boolean(p.es_repostaje || esGas),
          es_base: p.es_base || p.tipo === 'base' || p.tipo === 'base_salida' || p.tipo === 'base_vuelta',
          precio: p.precio,
          direccion: p.direccion
        };
      });
    } else {
      lista = (viaje.checkins_resumen || []).map((ch, i) => {
        const latVal = ch.latitud;
        const lngVal = ch.longitud;
        const diasVal = (ch.dias_previstos !== '' && ch.dias_previstos !== null && ch.dias_previstos !== undefined)
          ? parseInt(ch.dias_previstos, 10)
          : 0;
        return {
          id: ch.id || `ch-${i}`,
          lugar_id: ch.lugar_id,
          nombre: ch.lugar_nombre || 'Punto de Pernocta',
          lat: latVal,
          lng: lngVal,
          latitud: latVal,
          longitud: lngVal,
          poblacion: ch.poblacion || '',
          provincia: ch.provincia || '',
          fecha_llegada: ch.fecha_llegada || '',
          dias_previstos: diasVal,
          notas_privadas: ch.notas_privadas || '',
          tipo: 'parada',
          tipo_lugar: ch.tipo_lugar || 'pernocta_libre',
          equipamiento: ch.equipamiento || [],
          entorno: ch.entorno || [],
          acceso: ch.acceso || [],
          es_repostaje: false,
          es_base: false
        };
      });
    }

    const basePoblacion = usuario?.poblacion || (usuario?.direccion_base ? usuario.direccion_base.split(',')[0].trim() : 'Tu Base Camper');
    const baseLat = usuario?.lat_base || coordsPoblacionBase?.lat || (lista.length > 0 && lista[0].es_base && (lista[0].lat != null || lista[0].latitud != null) ? (lista[0].lat ?? lista[0].latitud) : null);
    const baseLng = usuario?.lng_base || coordsPoblacionBase?.lng || (lista.length > 0 && lista[0].es_base && (lista[0].lng != null || lista[0].longitud != null) ? (lista[0].lng ?? lista[0].longitud) : null);

    const tieneSalida = lista.length > 0 && (lista[0].es_base || lista[0].tipo === 'base_salida' || lista[0].tipo === 'base');
    const tieneVuelta = lista.length > 1 && (lista[lista.length - 1].es_base || lista[lista.length - 1].tipo === 'base_vuelta');

    if (baseLat != null && baseLng != null && lista.length > 0) {
      if (!tieneSalida) {
        lista.unshift({
          id: 'base-salida',
          nombre: `Salida: ${basePoblacion}`,
          lat: baseLat,
          lng: baseLng,
          latitud: baseLat,
          longitud: baseLng,
          poblacion: basePoblacion,
          tipo: 'base_salida',
          es_base: true
        });
      }
      if (!tieneVuelta && lista.length > 1) {
        lista.push({
          id: 'base-vuelta',
          nombre: `Vuelta: ${basePoblacion}`,
          lat: baseLat,
          lng: baseLng,
          latitud: baseLat,
          longitud: baseLng,
          poblacion: basePoblacion,
          tipo: 'base_vuelta',
          es_base: true
        });
      }
    }

    return lista;
  };

  const hoyStr = new Date().toISOString().split('T')[0];
  const viajesFuturos = viajes.filter(v => !v.esta_cerrado && (v.tipo_estado === 'futuro' || v.fecha_inicio >= hoyStr));
  const otrosViajesAbiertos = viajes.filter(v => !v.esta_cerrado && !viajesFuturos.some(f => f.id === v.id));

  return (
    <div className="camplink-container" style={{ padding: '30px 20px 80px', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
      {/* CABECERA PRINCIPAL */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Route size={28} color="var(--accent-earth)" />
            <span>Organizar Viaje</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.92rem' }}>
            Planifica tus rutas futuras, reordena tus paradas, visualiza la carretera en mapa y controla las paradas de combustible.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Badge de sincronización automática */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '0.74rem', color: '#10B981', fontWeight: 600,
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 'var(--radius-full)', padding: '3px 10px'
          }}>
            <span style={{
              display: 'inline-block', width: '7px', height: '7px',
              borderRadius: '50%', background: '#10B981',
              animation: 'pulse 2s infinite'
            }} />
            Auto-sync 30s
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setModalNuevoViajeAbierto(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(35, 83, 52, 0.35)' }}
          >
            <Plus size={18} />
            <span>Crear Nuevo Viaje</span>
          </button>
        </div>
      </div>

      {/* NOTIFICACIÓN TOAST DE ÉXITO */}
      {notificacionExito && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1.5px solid #10B981',
          color: '#10B981',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          fontWeight: 700,
          fontSize: '0.92rem',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <CheckCircle size={20} />
          <span>{notificacionExito}</span>
        </div>
      )}

      {/* BANNER DE INVITACIONES PARA COMPARTIR VIAJES RECIBIDAS */}
      {invitacionesRecibidas.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(35, 83, 52, 0.25) 0%, rgba(217, 119, 54, 0.18) 100%)',
          border: '1.5px solid var(--accent-forest)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.6rem' }}>📬</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Invitaciones para compartir viaje ({invitacionesRecibidas.length})
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Otros exploradores quieren viajar contigo. Al aceptar, el viaje se copiará a tus viajes planificados.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {invitacionesRecibidas.map((inv) => (
              <div
                key={inv.id}
                className="camper-card"
                style={{
                  padding: '16px 20px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
                  {inv.remitente_avatar ? (
                    <img
                      src={inv.remitente_avatar}
                      alt={inv.remitente_username}
                      style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-forest)' }}
                    />
                  ) : (
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'rgba(35, 83, 52, 0.2)',
                      border: '2px solid var(--accent-forest)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem'
                    }}>
                      🚐
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      <strong>@{inv.remitente_username ? (inv.remitente_username.charAt(0).toUpperCase() + inv.remitente_username.slice(1)) : ''}</strong> te invita a compartir:
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {inv.viaje_titulo}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', flexWrap: 'wrap' }}>
                      {inv.viaje_fecha_inicio && <span>📅 Salida: {formatearFecha(inv.viaje_fecha_inicio)}</span>}
                      {inv.viaje_fecha_fin && <span>🏁 Fin: {formatearFecha(inv.viaje_fecha_fin)}</span>}
                      {inv.viaje_paradas && inv.viaje_paradas.length > 0 && (
                        <span>🏕️ {inv.viaje_paradas.length} parada(s) planificada(s)</span>
                      )}
                    </div>

                    {/* Mensaje remitente */}
                    {inv.mensaje && (
                      <div style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        background: 'var(--bg-glass)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.84rem',
                        fontStyle: 'italic',
                        color: 'var(--text-primary)',
                        borderLeft: '3px solid var(--accent-earth)'
                      }}>
                        "{inv.mensaje}"
                      </div>
                    )}

                    {/* Chips de paradas si existen */}
                    {inv.viaje_paradas && inv.viaje_paradas.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {inv.viaje_paradas.map((p, pIdx) => (
                          <span
                            key={pIdx}
                            style={{
                              fontSize: '0.74rem',
                              padding: '2px 8px',
                              background: 'rgba(35, 83, 52, 0.12)',
                              color: 'var(--accent-forest)',
                              borderRadius: '12px',
                              fontWeight: 600
                            }}
                          >
                            📍 {p.lugar_nombre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones Aceptar / Rechazar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => rechazarInvitacion(inv.id)}
                    disabled={procesandoInvId === inv.id}
                    style={{ fontSize: '0.82rem', padding: '7px 14px' }}
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => aceptarInvitacion(inv.id)}
                    disabled={procesandoInvId === inv.id}
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      padding: '7px 16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {procesandoInvId === inv.id ? (
                      <span>Añadiendo...</span>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Aceptar Viaje</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL PARA CREAR NUEVO VIAJE */}
      {modalNuevoViajeAbierto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div className="camper-card" style={{ maxWidth: '520px', width: '100%', padding: '28px', border: '2px solid var(--accent-forest)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={20} color="var(--accent-forest)" />
                <span>Nuevo Viaje Planificado</span>
              </h2>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setModalNuevoViajeAbierto(false)}
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={crearNuevoViaje} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Título del Viaje *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Ruta Picos de Europa y Costa Cantábrica"
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Fecha de Salida *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={nuevaFechaInicio}
                    onChange={(e) => setNuevaFechaInicio(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Fecha de Regreso (Opcional)</label>
                  <input
                    type="date"
                    className="form-control"
                    value={nuevaFechaFin}
                    min={nuevaFechaInicio}
                    onChange={(e) => setNuevaFechaFin(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Notas o Propósito del Viaje</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Ej: Pernoctas libres en montaña, paradas gastronómicas y deportes de aventura..."
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalNuevoViajeAbierto(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardandoViaje}
                >
                  {guardandoViaje ? 'Creando...' : 'Crear Viaje y Empezar Itinerario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* LISTADO DE VIAJES FUTUROS Y PLANIFICADOS */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '2rem' }}>🚐</span>
          <p style={{ marginTop: '10px' }}>Cargando viajes planificados...</p>
        </div>
      ) : viajesFuturos.length === 0 && otrosViajesAbiertos.length === 0 ? (
        <div className="camper-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '14px' }}>🗺️</div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>No tienes viajes futuros planificados</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 20px', fontSize: '0.92rem' }}>
            Empieza a planificar tu próxima aventura sobre ruedas creando tu primer viaje nómada.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setModalNuevoViajeAbierto(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={17} /> Planificar mi primer viaje
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[...viajesFuturos, ...otrosViajesAbiertos].map((viaje) => {
            const expandido = Boolean(viajesExpandidos[viaje.id]);
            const paradas = obtenerParadasViaje(viaje);

            const renderPanelGasolineras = (widgetKey) => {
              if (!panelGasolineras || panelGasolineras.viajeId !== viaje.id || panelGasolineras.widgetKey !== widgetKey) {
                return null;
              }
              return (
                <div className="camper-card" style={{
                  margin: '10px 0',
                  padding: '16px',
                  border: '2px solid #D97706',
                  background: 'var(--bg-glass)',
                  boxShadow: 'var(--shadow-glass)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.94rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#D97706' }}>
                      <Fuel size={17} />
                      <span>Gasolineras baratas cerca de: <strong>{panelGasolineras.paradaNombre}</strong></span>
                    </div>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPanelGasolineras(null);
                      }}
                      style={{ width: '28px', height: '28px', cursor: 'pointer' }}
                      title="Cerrar panel de gasolineras"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {panelGasolineras.cargando ? (
                    <div style={{ textAlign: 'center', padding: '18px', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                      Buscando precios de gasolineras en tiempo real...
                    </div>
                  ) : panelGasolineras.lista.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '18px', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                      No se encontraron gasolineras cercanas a este punto.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                      {(() => {
                        const precios = panelGasolineras.lista
                          .map(g => g.precioLitro)
                          .filter(p => typeof p === 'number' && !isNaN(p) && p > 0);
                        const minPrecio = precios.length > 0 ? Math.min(...precios) : null;
                        const maxPrecio = precios.length > 0 ? Math.max(...precios) : null;

                        return panelGasolineras.lista.slice(0, 8).map((gas, gIdx) => {
                          const colorGas = calcularColorGasolinera(gas.precioLitro, minPrecio, maxPrecio);
                          const esMasBarata = minPrecio != null && gas.precioLitro != null && gas.precioLitro === minPrecio;
                          const esMasCara = maxPrecio != null && gas.precioLitro != null && gas.precioLitro === maxPrecio && minPrecio !== maxPrecio;

                          return (
                            <div
                              key={gas.id || gIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                borderRadius: 'var(--radius-sm)',
                                border: `1.5px solid ${esMasBarata ? 'rgba(16, 185, 129, 0.5)' : 'var(--border-color)'}`,
                                gap: '10px'
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>{gas.rotulo}</span>
                                  {esMasBarata && (
                                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', background: 'rgba(16, 185, 129, 0.18)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
                                      Más barata
                                    </span>
                                  )}
                                  {esMasCara && (
                                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
                                      Más cara
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                  {gas.direccion} • {gas.distanciaKm != null ? `${gas.distanciaKm.toFixed(1)} km` : ''}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: colorGas }}>
                                  {gas.precioLitro ? `${gas.precioLitro.toFixed(3)} €/L` : 'Consultar'}
                                </span>

                                {gas.lat != null && gas.lng != null && (
                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${gas.lat},${gas.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary btn-sm"
                                    onClick={(e) => e.stopPropagation()}
                                    title={`Abrir navegación GPS hasta ${gas.rotulo}`}
                                    style={{ fontSize: '0.74rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none', color: 'var(--text-primary)' }}
                                  >
                                    <Navigation size={12} color="var(--accent-forest)" />
                                    <span>Ir</span>
                                  </a>
                                )}

                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.74rem', padding: '4px 10px', background: '#D97706', borderColor: '#D97706' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    anadirGasolineraARuta(viaje.id, gas, panelGasolineras.tramoIdx);
                                  }}
                                >
                                  ➕ Añadir al viaje
                                </button>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              );
            };
            const coordsRuta = paradas
              .filter(p => p.latitud != null && p.longitud != null)
              .map(p => [p.latitud, p.longitud]);

            const centroMapa = coordsRuta.length > 0 ? coordsRuta[0] : [40.4168, -3.7038];

            // Trazado de carretera OSRM si está disponible, o coordenadas de paradas
            const coordsTrazadoOSRM = geometriasRutas[viaje.id]?.coords || coordsRuta;

            // Cálculo de distancias reales acumuladas por carretera OSRM
            const legsOSRM = geometriasRutas[viaje.id]?.legs || [];
            let distanciaTotalCalculada = 0;
            const distanciasPorTramo = [];
            for (let i = 0; i < paradas.length; i++) {
              if (i === 0) {
                distanciasPorTramo.push(0);
              } else {
                const distRealLeg = legsOSRM[i - 1]?.distanceKm;
                const dist = (distRealLeg != null && distRealLeg > 0)
                  ? distRealLeg
                  : calcularDistanciaKm(
                    paradas[i - 1].latitud, paradas[i - 1].longitud,
                    paradas[i].latitud, paradas[i].longitud
                  );
                distanciasPorTramo.push(dist);
                distanciaTotalCalculada += dist;
              }
            }

            // Distancia total OSRM o estimada
            const kmTotalesViaje = geometriasRutas[viaje.id]?.distanceKm || distanciaTotalCalculada || viaje.km_totales || 0;

            // Autonomía y combustible según datos del vehículo del usuario (L / 100km)
            const capDeposito = parseFloat(usuario?.capacidad_deposito_l || usuario?.capacidad_deposito || 60);
            const consMedio = parseFloat(usuario?.consumo_medio_l_100km || usuario?.consumo_medio || usuario?.consumo_medio_l_km || 6.5);
            const autonomiaEstimada = Math.round((capDeposito / consMedio) * 100);

            // Coste aproximado en combustible para este viaje
            const litrosEstimados = (kmTotalesViaje * consMedio) / 100;
            const preciosGas = paradas.filter(p => p.tipo === 'gasolinera' && p.precio).map(p => parseFloat(p.precio));
            const precioMedioLitro = preciosGas.length > 0
              ? (preciosGas.reduce((a, b) => a + b, 0) / preciosGas.length)
              : (usuario?.tipo_combustible === 'gasolina_95' ? 1.54 : usuario?.tipo_combustible === 'gasolina_98' ? 1.68 : usuario?.tipo_combustible === 'glp' ? 0.94 : 1.39);
            const costeCombustibleEstimado = Math.round(litrosEstimados * precioMedioLitro);

            // Identificar índices de inicio y fin para bloquear reordenación fuera de límites
            const primerIndiceMovible = paradas.findIndex(p => !p.es_base);
            const ultimoIndiceMovible = paradas.length - 1 - [...paradas].reverse().findIndex(p => !p.es_base);

            // Contador de etapas intermedias regulares (excluyendo bases)
            let contadorEtapas = 0;

            return (
              <div key={viaje.id} className="camper-card viaje-card-responsive" style={{ padding: '24px', position: 'relative' }}>

                {/* 1. BOTÓN ARCHIVAR FLOTANTE */}
                {viaje.fecha_fin && new Date(viaje.fecha_fin) < new Date() && (
                  <button
                    type="button"
                    className="btn btn-sm btn-archivar-flotante"
                    onClick={(e) => { e.stopPropagation(); archivarViaje(viaje.id); }}
                  >
                    <CheckCircle size={14} />
                    <span>Viaje finalizado - Archivar</span>
                  </button>
                )}

                {/* 2. CABECERA DEL VIAJE */}
                <div className="viaje-header-layout" style={{ marginBottom: expandido ? '18px' : '0' }}>

                  <div className="viaje-info-principal">
                    {/* Fila del icono centrada en móvil, con papelera absoluta a la derecha */}
                    <div className="viaje-icono-mobile-row">
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(217, 119, 54, 0.15)',
                        border: '1px solid var(--accent-earth)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0
                      }}>🗺️</div>
                      <button className="btn-eliminar-viaje hide-on-pc" onClick={() => eliminarViaje(viaje.id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div style={{ flex: 1, minWidth: '240px' }}>
                      {editandoId === viaje.id ? (
                        <div className="viaje-titulo-container">
                          <input type="text" className="form-control" value={tituloEditado} onChange={(e) => setTituloEditado(e.target.value)} style={{ padding: '4px 10px', fontSize: '1.05rem', fontWeight: 700, textAlign: 'center' }} autoFocus />
                          <button className="btn btn-primary btn-sm" onClick={() => guardarEdicionTitulo(viaje.id)} style={{ padding: '6px 10px' }}><Check size={15} /></button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditandoId(null)} style={{ padding: '6px 10px' }}><X size={15} /></button>
                        </div>
                      ) : (
                        <div className="viaje-titulo-container">
                          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{viaje.titulo}</h3>
                          <button onClick={() => { setEditandoId(viaje.id); setTituloEditado(viaje.titulo); }} style={{ opacity: 0.7, padding: '2px', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Edit3 size={15} color="var(--accent-forest)" />
                          </button>
                        </div>
                      )}

                      <div className="viaje-datos-secundarios">
                        <span className="viaje-dato-linea">
                          <span>📅 Salida: {formatearFecha(viaje.fecha_inicio)}</span>
                          {viaje.fecha_fin && <span>🏁 Regreso: {formatearFecha(viaje.fecha_fin)}</span>}
                        </span>
                        <span className="viaje-dato-linea">
                          <span style={{ fontWeight: 700, color: 'var(--accent-forest)' }}>🛣️ {kmTotalesViaje} km</span>
                          <span style={{ fontWeight: 700, color: '#D97706' }}>⛽ ~{costeCombustibleEstimado} €</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="viaje-botones-accion">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); setViajeACompartir(viaje); }}>
                      <Share2 size={15} color="var(--accent-forest)" />
                      <span>Compartir</span>
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); exportarItinerarioGoogleCalendar(viaje, paradas); }}>
                      <Calendar size={15} color="var(--accent-earth)" />
                      <span className="desktop-only-action">Calendario</span>
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => toggleExpansion(viaje.id)}>
                      {expandido ? <><span>Ocultar</span> <ChevronUp size={15} /></> : <><span>Ver Detalle</span> <ChevronDown size={15} /></>}
                    </button>
                    {/* Botón de borrar para PC */}
                    <button className="btn-eliminar-viaje hide-on-mobile" onClick={() => eliminarViaje(viaje.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* 3. CONTENIDO EXPANDIDO: ITINERARIO, MAPA POR CARRETERA Y REPOSTAJES */}
                {expandido && (
                  <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    {viaje.descripcion && (
                      <div style={{
                        background: 'var(--bg-glass)',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.88rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '16px',
                        fontStyle: 'italic'
                      }}>
                        "{viaje.descripcion}"
                      </div>
                    )}

                    {/* MINI MAPA INTERACTIVO DE LA RUTA PLANIFICADA */}
                    {coordsRuta.length > 0 && (
                      <div style={{ position: 'relative', marginBottom: '20px' }}>
                        {/* Botón ampliar mapa a pantalla completa */}
                        <button
                          type="button"
                          onClick={() => setMapaExpandidoViaje(viaje)}
                          style={{
                            position: 'absolute', top: '8px', right: '8px', zIndex: 1000,
                            background: 'var(--bg-surface)', border: '1.5px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)', padding: '5px 8px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem',
                            fontWeight: 700, color: 'var(--text-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                            transition: 'all 0.2s ease'
                          }}
                          title="Ampliar mapa a pantalla completa"
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,83,52,0.15)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                        >
                          <Maximize2 size={14} />
                          <span>Ampliar</span>
                        </button>
                        <div style={{
                          height: '260px',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          border: '1px solid var(--border-color)',
                          boxShadow: 'var(--shadow-sm)'
                        }}>
                          <MapContainer
                            center={centroMapa}
                            zoom={coordsRuta.length > 1 ? 7 : 10}
                            scrollWheelZoom={true}
                            style={{ height: '100%', width: '100%' }}
                          >
                            <ActualizadorVistaMapa panelGasolineras={panelGasolineras && panelGasolineras.viajeId === viaje.id ? panelGasolineras : null} />
                            <TileLayer
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              attribution="&copy; OpenStreetMap"
                            />
                            {coordsTrazadoOSRM.length > 1 && (
                              <Polyline
                                positions={coordsTrazadoOSRM}
                                color="#10B981"
                                weight={5}
                                opacity={0.85}
                              />
                            )}
                            {/* Marcadores de paradas fijas del viaje (lugares, bases y gasolineras añadidas) */}
                            {paradas.map((p, idx) => (
                              p.latitud != null && p.longitud != null && (
                                <Marker
                                  key={p.id || idx}
                                  position={[p.latitud, p.longitud]}
                                  icon={p.es_base ? miniIconoBase : (p.tipo === 'gasolinera' || p.es_repostaje ? miniIconoGasolinera : miniIconoPlan)}
                                >
                                  <Popup>
                                    <div style={{ padding: '6px', textAlign: 'center', minWidth: '160px' }}>
                                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {p.es_base ? (p.tipo === 'base_salida' ? '🏠 Salida Base' : '🏁 Vuelta Base') : (p.tipo === 'gasolinera' ? `⛽ ${p.nombre}` : p.nombre)}
                                      </div>
                                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        {p.poblacion || p.direccion}
                                      </div>
                                      {p.precio && (
                                        <div style={{ fontWeight: 800, color: 'var(--accent-forest)', fontSize: '0.85rem', marginTop: '3px' }}>
                                          {p.precio} €/L
                                        </div>
                                      )}
                                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
                                        <a
                                          href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitud},${p.longitud}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="btn btn-secondary btn-sm"
                                          style={{ fontSize: '0.74rem', padding: '3px 8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                                        >
                                          <Navigation size={12} color="var(--accent-forest)" /> Ir (GPS)
                                        </a>
                                        {alSeleccionarLugar && p.lugar_id && (
                                          <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => alSeleccionarLugar(p.lugar_id)}
                                            style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                                          >
                                            Ver Ficha
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </Popup>
                                </Marker>
                              )
                            ))}

                            {/* Marcador del punto crítico donde se supera el 80% en la búsqueda activa */}
                            {panelGasolineras && panelGasolineras.viajeId === viaje.id && panelGasolineras.lat != null && panelGasolineras.lng != null && (
                              <Marker
                                position={[panelGasolineras.lat, panelGasolineras.lng]}
                                icon={miniIconoPuntoCritico}
                              >
                                <Popup>
                                  <div style={{ padding: '6px', textAlign: 'center' }}>
                                    <div style={{ fontWeight: 800, color: '#EF4444', fontSize: '0.88rem' }}>⚠️ Zona 80% Combustible</div>
                                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{panelGasolineras.paradaNombre}</div>
                                  </div>
                                </Popup>
                              </Marker>
                            )}

                            {/* Gasolineras sugeridas en tiempo real mostradas en el mapa con escala cromática (verde más barata -> rojo más cara) */}
                            {(() => {
                              if (!panelGasolineras || panelGasolineras.viajeId !== viaje.id || !panelGasolineras.lista || panelGasolineras.lista.length === 0) {
                                return null;
                              }
                              const precios = panelGasolineras.lista
                                .map(g => g.precioLitro)
                                .filter(p => typeof p === 'number' && !isNaN(p) && p > 0);
                              const minPrecio = precios.length > 0 ? Math.min(...precios) : null;
                              const maxPrecio = precios.length > 0 ? Math.max(...precios) : null;

                              return panelGasolineras.lista.map((gas, gIdx) => {
                                if (gas.lat == null || gas.lng == null) return null;
                                const colorGas = calcularColorGasolinera(gas.precioLitro, minPrecio, maxPrecio);
                                const esMasBarata = minPrecio != null && gas.precioLitro != null && gas.precioLitro === minPrecio;
                                const icono = crearIconoGasolineraColor(colorGas, esMasBarata);

                                return (
                                  <Marker
                                    key={`sug-gas-${gIdx}`}
                                    position={[gas.lat, gas.lng]}
                                    icon={icono}
                                  >
                                    <Popup>
                                      <div style={{ padding: '6px', textAlign: 'center', minWidth: '170px' }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: colorGas }}>
                                          ⛽ {gas.rotulo}
                                        </div>
                                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                                          {gas.direccion} {gas.distanciaKm != null ? `• ${gas.distanciaKm.toFixed(1)} km` : ''}
                                        </div>
                                        {gas.precioLitro && (
                                          <div style={{ fontWeight: 800, color: colorGas, fontSize: '0.92rem', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <span>{gas.precioLitro.toFixed(3)} €/L</span>
                                            {esMasBarata && (
                                              <span style={{ fontSize: '0.68rem', background: 'rgba(16, 185, 129, 0.18)', color: '#10B981', padding: '1px 5px', borderRadius: 'var(--radius-full)', border: '1px solid #10B981' }}>
                                                ¡Más barata!
                                              </span>
                                            )}
                                          </div>
                                        )}
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '8px' }}>
                                          <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${gas.lat},${gas.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-secondary btn-sm"
                                            style={{ fontSize: '0.72rem', padding: '3px 8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                                          >
                                            <Navigation size={12} color="var(--accent-forest)" /> Ir (GPS)
                                          </a>
                                          <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            style={{ fontSize: '0.72rem', padding: '3px 8px', background: '#D97706', borderColor: '#D97706' }}
                                            onClick={() => anadirGasolineraARuta(viaje.id, gas, panelGasolineras.tramoIdx)}
                                          >
                                            ➕ Añadir
                                          </button>
                                        </div>
                                      </div>
                                    </Popup>
                                  </Marker>
                                );
                              });
                            })()}
                          </MapContainer>
                        </div>
                      </div>
                    )}

                    {/* LISTA DE PARADAS E ITINERARIO CON REORDENACIÓN A LA IZQUIERDA Y CÁLCULO DE KM */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Route size={16} color="var(--accent-earth)" />
                          <span>Itinerario de Etapas ({paradas.filter(p => !p.es_base).length} paradas planificadas):</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setBuscadorLugarAbierto(prev => ({ ...prev, [viaje.id]: !prev[viaje.id] }));
                              setModoAnadir(prev => ({ ...prev, [viaje.id]: 'camplink' }));
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.82rem',
                              padding: '5px 12px',
                              borderRadius: 'var(--radius-full)',
                              boxShadow: '0 2px 8px rgba(35,83,52,0.3)',
                              fontWeight: 700
                            }}
                            title="Buscar spots, áreas camper y pueblos para añadirlos a este viaje"
                          >
                            <Plus size={14} />
                            <span>{buscadorLugarAbierto[viaje.id] ? 'Cerrar Buscador' : 'Añadir Parada'}</span>
                          </button>

                          {alExplorarMapa && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={alExplorarMapa}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.82rem',
                                padding: '5px 12px',
                                borderRadius: 'var(--radius-full)',
                                fontWeight: 700
                              }}
                              title="Ir al mapa para explorar lugares"
                            >
                              <Map size={14} />
                              <span>Ver Mapa</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* BUSCADOR INTEGRADO DE LUGARES */}
                      {buscadorLugarAbierto[viaje.id] && (
                        <div className="camper-card" style={{
                          padding: '16px',
                          marginBottom: '16px',
                          border: '1.5px solid var(--accent-forest)',
                          background: 'var(--bg-surface-elevated)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
                        }}>
                          {/* Cabecera del buscador con cierre */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-forest)' }}>
                              <Search size={16} />
                              <span>Añadir parada al viaje</span>
                            </div>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => setBuscadorLugarAbierto(prev => ({ ...prev, [viaje.id]: false }))}
                              style={{ width: '28px', height: '28px' }}
                            >
                              <X size={15} />
                            </button>
                          </div>

                          {/* PESTAÑAS: Buscar en Camplink vs Dirección libre */}
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                            <button
                              type="button"
                              onClick={() => setModoAnadir(prev => ({ ...prev, [viaje.id]: 'camplink' }))}
                              style={{
                                flex: 1, padding: '7px 12px', borderRadius: 'var(--radius-md)',
                                border: `1.5px solid ${(!modoAnadir[viaje.id] || modoAnadir[viaje.id] === 'camplink') ? 'var(--accent-forest)' : 'var(--border-color)'}`,
                                background: (!modoAnadir[viaje.id] || modoAnadir[viaje.id] === 'camplink') ? 'rgba(35,83,52,0.15)' : 'var(--bg-glass)',
                                color: (!modoAnadir[viaje.id] || modoAnadir[viaje.id] === 'camplink') ? 'var(--accent-forest)' : 'var(--text-secondary)',
                                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                              }}
                            >
                              <Search size={13} /> Spots Camplink
                            </button>
                            <button
                              type="button"
                              onClick={() => setModoAnadir(prev => ({ ...prev, [viaje.id]: 'libre' }))}
                              style={{
                                flex: 1, padding: '7px 12px', borderRadius: 'var(--radius-md)',
                                border: `1.5px solid ${modoAnadir[viaje.id] === 'libre' ? '#3B82F6' : 'var(--border-color)'}`,
                                background: modoAnadir[viaje.id] === 'libre' ? 'rgba(59,130,246,0.12)' : 'var(--bg-glass)',
                                color: modoAnadir[viaje.id] === 'libre' ? '#3B82F6' : 'var(--text-secondary)',
                                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                              }}
                            >
                              <MapPinned size={13} /> Dirección / URL Maps
                            </button>
                          </div>

                          {/* MODO CAMPLINK: búsqueda en BD interna */}
                          {(!modoAnadir[viaje.id] || modoAnadir[viaje.id] === 'camplink') && (<>
                            <div style={{ position: 'relative', marginBottom: '10px' }}>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Escribe el nombre del lugar, pueblo o provincia (ej: Santander, Potes, Cangas de Onís, Ordesa)..."
                                value={textoBusquedaLugar[viaje.id] || ''}
                                onChange={(e) => manejarBusquedaLugar(viaje.id, e.target.value)}
                                autoFocus
                                style={{ paddingLeft: '36px', height: '40px' }}
                              />
                              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            </div>

                            {buscandoLugar[viaje.id] && (
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>Buscando spots en Camplink...</span>
                              </div>
                            )}
                          </>)}

                          {/* MODO LIBRE: geocodificación Photon o URL Google Maps */}
                          {modoAnadir[viaje.id] === 'libre' && (
                            <div>
                              <div style={{ position: 'relative', marginBottom: '8px' }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Escribe una dirección, ciudad o pega una URL de Google Maps..."
                                  value={textoDireccion[viaje.id] || ''}
                                  onChange={(e) => buscarDireccionPhoton(viaje.id, e.target.value)}
                                  autoFocus
                                  style={{ paddingLeft: '36px', paddingRight: '36px', height: '40px' }}
                                />
                                <MapPinned size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#3B82F6' }} />
                                {textoDireccion[viaje.id] && (
                                  <button type="button" onClick={() => { setTextoDireccion(prev => ({ ...prev, [viaje.id]: '' })); setSugerenciasGeo(prev => ({ ...prev, [viaje.id]: [] })); setPuntoExternoConfig(null); }}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Link size={11} /> También puedes pegar una URL de Google Maps directamente
                              </p>
                              {buscandoGeo[viaje.id] && <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '4px 0' }}>Buscando ubicación...</div>}
                              {sugerenciasGeo[viaje.id] && sugerenciasGeo[viaje.id].length > 0 && !puntoExternoConfig && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                                  {sugerenciasGeo[viaje.id].map((sug, si) => (
                                    <button
                                      key={si}
                                      type="button"
                                      onClick={() => setPuntoExternoConfig({
                                        viajeId: viaje.id,
                                        punto: sug,
                                        fecha: viaje.fecha_inicio || new Date().toISOString().split('T')[0],
                                        noches: 0
                                      })}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                                        background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-color)', cursor: 'pointer',
                                        textAlign: 'left', transition: 'all 0.2s ease', width: '100%'
                                      }}
                                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
                                      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-primary)'}
                                    >
                                      <MapPin size={16} color="#3B82F6" style={{ flexShrink: 0 }} />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sug.nombre}</div>
                                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sug.direccion || `${sug.lat.toFixed(5)}, ${sug.lng.toFixed(5)}`}</div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                              {/* Formulario de confirmación una vez seleccionada la ubicación */}
                              {puntoExternoConfig && puntoExternoConfig.viajeId === viaje.id && (
                                <div style={{ padding: '12px', background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.3)', borderRadius: 'var(--radius-md)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                    <MapPin size={16} color="#3B82F6" />
                                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{puntoExternoConfig.punto.nombre}</span>
                                    <button type="button" onClick={() => setPuntoExternoConfig(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                      <X size={13} />
                                    </button>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Llegada:</span>
                                      <input type="date" className="form-control" style={{ padding: '2px 6px', fontSize: '0.78rem', width: '130px' }}
                                        value={puntoExternoConfig.fecha}
                                        onChange={(e) => setPuntoExternoConfig(prev => ({ ...prev, fecha: e.target.value }))}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Noches:</span>
                                      <input type="number" min="0" max="60" className="form-control" style={{ padding: '2px 6px', fontSize: '0.78rem', width: '55px' }}
                                        value={puntoExternoConfig.noches}
                                        onChange={(e) => setPuntoExternoConfig(prev => ({ ...prev, noches: e.target.value }))}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      disabled={anadiendoLugarId === 'externo'}
                                      onClick={() => anadirDireccionExternaAViaje(viaje.id, puntoExternoConfig.punto, puntoExternoConfig.fecha, puntoExternoConfig.noches)}
                                      style={{ padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700, marginTop: '14px', background: '#3B82F6', borderColor: '#3B82F6' }}
                                    >
                                      {anadiendoLugarId === 'externo' ? '...' : '+ Añadir parada'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {resultadosLugar[viaje.id] && resultadosLugar[viaje.id].length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', marginTop: '6px' }}>
                              {resultadosLugar[viaje.id].slice(0, 10).map((lugar) => (
                                <div
                                  key={lugar.id}
                                  onClick={() => alSeleccionarLugar && alSeleccionarLugar(lugar.id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-color)',
                                    gap: '12px',
                                    flexWrap: 'wrap',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  title="Ver ficha detallada del lugar"
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(35, 83, 52, 0.14)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '200px' }}>
                                    {lugar.fotos && lugar.fotos.length > 0 ? (
                                      <img
                                        src={lugar.fotos[0].foto || lugar.fotos[0]}
                                        alt={lugar.nombre}
                                        style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                                      />
                                    ) : (
                                      <div style={{ width: '44px', height: '44px', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.2rem' }}>
                                        📍
                                      </div>
                                    )}

                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                        {lugar.nombre}
                                      </div>
                                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                                        {lugar.poblacion && <span>📍 {lugar.poblacion}</span>}
                                        {lugar.provincia && <span>({lugar.provincia})</span>}
                                        <span className="badge-camper badge-forest" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                                          {lugar.tipo_lugar_display || lugar.tipo_lugar || 'Punto Camper'}
                                        </span>
                                        {lugar.es_gratuito ? (
                                          <span style={{ color: 'var(--accent-forest)', fontWeight: 600 }}>Gratis</span>
                                        ) : lugar.precio_noche ? (
                                          <span style={{ color: 'var(--accent-earth)', fontWeight: 600 }}>{lugar.precio_noche}€/n</span>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {lugar.latitud != null && lugar.longitud != null && (
                                      <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${lugar.latitud},${lugar.longitud}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary btn-sm"
                                        onClick={(e) => e.stopPropagation()}
                                        title={`Abrir navegación GPS hasta ${lugar.nombre}`}
                                        style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--text-primary)' }}
                                      >
                                        <Navigation size={13} color="var(--accent-forest)" />
                                        <span>Ir</span>
                                      </a>
                                    )}
                                    {lugarParaAnadirConfig?.lugar?.id === lugar.id && lugarParaAnadirConfig?.viajeId === viaje.id ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Llegada:</span>
                                          <input
                                            type="date"
                                            className="form-control"
                                            style={{ padding: '2px 6px', fontSize: '0.78rem', width: '130px' }}
                                            value={lugarParaAnadirConfig.fecha}
                                            onChange={(e) => setLugarParaAnadirConfig(prev => ({ ...prev, fecha: e.target.value }))}
                                          />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Noches:</span>
                                          <input
                                            type="number"
                                            min="0"
                                            max="60"
                                            className="form-control"
                                            style={{ padding: '2px 6px', fontSize: '0.78rem', width: '55px' }}
                                            value={lugarParaAnadirConfig.noches}
                                            onChange={(e) => setLugarParaAnadirConfig(prev => ({ ...prev, noches: e.target.value }))}
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          className="btn btn-primary btn-sm"
                                          disabled={anadiendoLugarId === lugar.id}
                                          onClick={() => anadirLugarAViaje(viaje.id, lugar, lugarParaAnadirConfig.fecha, lugarParaAnadirConfig.noches)}
                                          style={{ padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700, marginTop: '14px' }}
                                        >
                                          {anadiendoLugarId === lugar.id ? '...' : 'Añadir'}
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-secondary btn-sm"
                                          onClick={() => setLugarParaAnadirConfig(null)}
                                          style={{ padding: '4px 8px', fontSize: '0.78rem', marginTop: '14px' }}
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        disabled={anadiendoLugarId === lugar.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLugarParaAnadirConfig({
                                            viajeId: viaje.id,
                                            lugar,
                                            fecha: viaje.fecha_inicio || new Date().toISOString().split('T')[0],
                                            noches: 0
                                          });
                                        }}
                                        style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                                      >
                                        <Plus size={14} />
                                        <span>Añadir a la Ruta</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {textoBusquedaLugar[viaje.id] && textoBusquedaLugar[viaje.id].trim().length >= 2 && !buscandoLugar[viaje.id] && (!resultadosLugar[viaje.id] || resultadosLugar[viaje.id].length === 0) && (
                            <div style={{ textAlign: 'center', padding: '14px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                              No se encontraron spots registrados con "{textoBusquedaLugar[viaje.id]}". Intenta buscar por localidad o provincia.
                            </div>
                          )}
                        </div>
                      )}

                      {paradas.length === 0 ? (
                        <div style={{
                          padding: '16px',
                          background: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-md)',
                          textAlign: 'center',
                          border: '1px dashed var(--border-color)'
                        }}>
                          <p style={{ margin: '0 0 10px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                            Este viaje todavía no tiene paradas registradas.
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setBuscadorLugarAbierto(prev => ({ ...prev, [viaje.id]: true }));
                                setModoAnadir(prev => ({ ...prev, [viaje.id]: 'camplink' }));
                              }}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Search size={14} /> Buscar y añadir lugares a la ruta
                            </button>
                            {alExplorarMapa && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={alExplorarMapa}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              >
                                <MapPin size={14} /> Explorar mapa
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {(() => {
                            let kmAcumulados = 0;
                            const umbral80 = Math.round(autonomiaEstimada * 0.8);

                            return paradas.map((parada, idx) => {
                              const distTramo = distanciasPorTramo[idx] || 0;
                              const kmHastaEstaParada = kmAcumulados + distTramo;
                              const esGasolinera = parada.tipo === 'gasolinera' || parada.tipo_lugar === 'gasolinera' || (parada.nombre && (parada.nombre.startsWith('⛽') || parada.nombre.includes('Gasolinera')));
                              // La advertencia se evalúa y muestra ÚNICAMENTE en la etapa exacta donde se supera por primera vez el 80% de autonomía.
                              // Si esta etapa es una gasolinera (añadida para repostar), no se muestra alerta antes de ella.
                              const supera80 = idx > 0 && kmHastaEstaParada >= umbral80 && kmAcumulados < umbral80 && !esGasolinera;

                              // Calcular el punto exacto y posterior al 80% de combustible en la ruta entre punto y punto
                              let latPunto80 = paradas[idx - 1]?.latitud;
                              let lngPunto80 = paradas[idx - 1]?.longitud;
                              let kmPunto80 = kmAcumulados;

                              if (supera80 && paradas[idx - 1]?.latitud != null && parada.latitud != null) {
                                const kmRestantesPara80 = Math.max(0, umbral80 - kmAcumulados);
                                const fraccion80 = distTramo > 0 ? Math.min(0.92, Math.max(0.08, kmRestantesPara80 / distTramo)) : 0.5;
                                // Para buscar DESPUÉS del punto donde se supera el 80% en el tramo entre punto y punto:
                                const fraccionBusqueda = Math.min(0.96, fraccion80 + 0.05);
                                const tramoCoords = legsOSRM[idx - 1]?.coords;
                                if (tramoCoords && tramoCoords.length > 5) {
                                  const coordIdx = Math.min(tramoCoords.length - 1, Math.max(0, Math.floor(fraccionBusqueda * (tramoCoords.length - 1))));
                                  latPunto80 = tramoCoords[coordIdx][0];
                                  lngPunto80 = tramoCoords[coordIdx][1];
                                } else {
                                  latPunto80 = paradas[idx - 1].latitud + fraccionBusqueda * (parada.latitud - paradas[idx - 1].latitud);
                                  lngPunto80 = paradas[idx - 1].longitud + fraccionBusqueda * (parada.longitud - paradas[idx - 1].longitud);
                                }
                                kmPunto80 = kmAcumulados + Math.round(fraccionBusqueda * distTramo);
                              }

                              // Actualizamos km acumulados para el siguiente tramo:
                              // Al llegar a una gasolinera seleccionada, se reposta y se restaura el contador interno a 0 km
                              if (esGasolinera) {
                                kmAcumulados = 0;
                              } else {
                                kmAcumulados = kmHastaEstaParada;
                              }

                              // Distinción visual para Salida Base y Vuelta Base
                              if (parada.es_base) {
                                const esSalida = parada.tipo === 'base_salida' || idx === 0;
                                return (
                                  <div key={parada.id || `base-${idx}`}>
                                    {/* Advertencia antes del punto de retorno a base si supera el 80% */}
                                    {supera80 && !alertasCombustibleOcultas[`alerta-${viaje.id}-${idx}`] && (
                                      <>
                                        <div style={{
                                          margin: '0 0 10px 0',
                                          padding: '10px 16px',
                                          background: 'rgba(239, 68, 68, 0.12)',
                                          border: '1.5px solid #EF4444',
                                          borderRadius: 'var(--radius-md)',
                                          fontSize: '0.86rem',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '8px',
                                          position: 'relative'
                                        }}>
                                          <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '10px',
                                            width: '100%'
                                          }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444' }}>
                                              <AlertTriangle size={18} />
                                              <strong style={{ fontSize: '0.94rem' }}>¡Atención Combustible!</strong>
                                              <button
                                                type="button"
                                                onClick={() => toggleInfoAlerta(`alerta-${idx}`)}
                                                title={infoAlertasAbiertas[`alerta-${idx}`] ? 'Ocultar información detallada' : 'Ver información detallada sobre este tramo'}
                                                style={{
                                                  width: '22px',
                                                  height: '22px',
                                                  borderRadius: '50%',
                                                  background: infoAlertasAbiertas[`alerta-${idx}`] ? '#EF4444' : 'rgba(239, 68, 68, 0.18)',
                                                  color: infoAlertasAbiertas[`alerta-${idx}`] ? '#fff' : '#EF4444',
                                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  cursor: 'pointer',
                                                  padding: 0,
                                                  fontWeight: 800,
                                                  fontSize: '0.78rem',
                                                  transition: 'all 0.2s ease'
                                                }}
                                              >
                                                <Info size={13} strokeWidth={2.5} />
                                              </button>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <button
                                                type="button"
                                                className="btn btn-primary btn-sm"
                                                style={{
                                                  fontSize: '0.8rem',
                                                  padding: '6px 14px',
                                                  background: '#D97706',
                                                  borderColor: '#D97706',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '6px',
                                                  fontWeight: 700
                                                }}
                                                onClick={() => abrirBuscadorGasolineras(viaje.id, idx - 1, latPunto80, lngPunto80, `Km ${kmPunto80} (Tramo ${paradas[idx - 1]?.nombre} ➔ ${parada.nombre})`, `alerta-${idx}`)}
                                              >
                                                <Fuel size={14} /> Buscar gasolineras
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => ocultarAlertaCombustible(`alerta-${viaje.id}-${idx}`)}
                                                title="Ocultar aviso de combustible"
                                                style={{
                                                  background: 'none',
                                                  border: 'none',
                                                  color: '#EF4444',
                                                  cursor: 'pointer',
                                                  padding: '4px',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  opacity: 0.8
                                                }}
                                              >
                                                <X size={16} />
                                              </button>
                                            </div>
                                          </div>

                                          {infoAlertasAbiertas[`alerta-${idx}`] && (
                                            <div style={{
                                              paddingTop: '8px',
                                              borderTop: '1px dashed rgba(239, 68, 68, 0.3)',
                                              color: 'var(--text-primary)',
                                              fontSize: '0.84rem',
                                              lineHeight: 1.45
                                            }}>
                                              Para completar el regreso a base acumularás <strong>{kmHastaEstaParada} km</strong> sin repostar (superando el 80% de tu autonomía de {autonomiaEstimada} km). Reposta antes de este tramo.
                                            </div>
                                          )}
                                        </div>
                                        {renderPanelGasolineras(`alerta-${idx}`)}
                                      </>
                                    )}

                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '12px 16px',
                                      borderRadius: 'var(--radius-md)',
                                      background: 'rgba(35, 83, 52, 0.08)',
                                      border: '1.5px dashed var(--accent-forest)',
                                      gap: '12px',
                                      flexWrap: 'wrap'
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                          width: '36px',
                                          height: '36px',
                                          borderRadius: '50%',
                                          background: 'var(--accent-forest)',
                                          color: '#fff',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontWeight: 800
                                        }}>
                                          {esSalida ? <Home size={18} /> : <Flag size={18} />}
                                        </div>
                                        <div>
                                          <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>{parada.nombre}</span>
                                            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'rgba(35,83,52,0.18)', color: 'var(--accent-forest)' }}>
                                              {esSalida ? 'Punto de Partida' : 'Retorno a Base'}
                                            </span>
                                          </div>
                                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                            {esSalida ? 'Inicio de ruta (0 km)' : `Tramo final de regreso (+ ${distTramo} km)`}
                                            {parada.poblacion && ` • ${parada.poblacion}`}
                                          </div>
                                        </div>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {/* Radar */}
                                        {parada.latitud != null && parada.longitud != null && (
                                          <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => abrirRadar && abrirRadar({ lat: parada.latitud, lng: parada.longitud, nombre: parada.nombre })}
                                            style={{
                                              fontSize: '0.84rem',
                                              fontWeight: 700,
                                              padding: '6px 12px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '6px',
                                              borderRadius: 'var(--radius-sm)'
                                            }}
                                            title={`Abrir Radar Nómada en ${parada.nombre}`}
                                          >
                                            <Radar size={15} color="var(--accent-earth)" />
                                            <span>Radar</span>
                                          </button>
                                        )}



                                        {/* Ir */}
                                        {parada.latitud != null && parada.longitud != null && (
                                          <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${parada.latitud},${parada.longitud}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-secondary btn-sm"
                                            onClick={(e) => e.stopPropagation()}
                                            title={`Abrir navegación GPS hasta ${parada.nombre}`}
                                            style={{
                                              fontSize: '0.84rem',
                                              fontWeight: 700,
                                              padding: '6px 12px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '6px',
                                              textDecoration: 'none',
                                              color: 'var(--text-primary)',
                                              borderRadius: 'var(--radius-sm)'
                                            }}
                                          >
                                            <Navigation size={15} color="var(--accent-forest)" />
                                            <span>Ir</span>
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                    {renderPanelGasolineras(`parada-${idx}`)}
                                  </div>
                                );
                              }

                              // Etapa intermedia regular
                              contadorEtapas += 1;
                              const numEtapa = contadorEtapas;
                              const puedeSubir = idx > primerIndiceMovible;
                              const puedeBajar = idx < ultimoIndiceMovible;

                              return (
                                <div key={parada.id || `parada-${idx}`}>
                                  {/* ADVERTENCIA DE COMBUSTIBLE */}
                                  {supera80 && !alertasCombustibleOcultas[`alerta-${viaje.id}-${idx}`] && (
                                    <>
                                      <div style={{
                                        margin: '0 0 10px 0',
                                        padding: '10px 16px',
                                        background: 'rgba(239, 68, 68, 0.12)',
                                        border: '1.5px solid #EF4444',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.86rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        position: 'relative'
                                      }}>
                                        <div style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          flexWrap: 'wrap',
                                          gap: '10px',
                                          width: '100%'
                                        }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444' }}>
                                            <AlertTriangle size={18} />
                                            <strong style={{ fontSize: '0.94rem' }}>¡Atención Combustible!</strong>
                                            <button
                                              type="button"
                                              onClick={() => toggleInfoAlerta(`alerta-${idx}`)}
                                              title={infoAlertasAbiertas[`alerta-${idx}`] ? 'Ocultar información detallada' : 'Ver información detallada sobre este tramo'}
                                              style={{
                                                width: '22px',
                                                height: '22px',
                                                borderRadius: '50%',
                                                background: infoAlertasAbiertas[`alerta-${idx}`] ? '#EF4444' : 'rgba(239, 68, 68, 0.18)',
                                                color: infoAlertasAbiertas[`alerta-${idx}`] ? '#fff' : '#EF4444',
                                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                padding: 0,
                                                fontWeight: 800,
                                                fontSize: '0.78rem',
                                                transition: 'all 0.2s ease'
                                              }}
                                            >
                                              <Info size={13} strokeWidth={2.5} />
                                            </button>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button
                                              type="button"
                                              className="btn btn-primary btn-sm"
                                              style={{
                                                fontSize: '0.8rem',
                                                padding: '6px 14px',
                                                background: '#D97706',
                                                borderColor: '#D97706',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontWeight: 700
                                              }}
                                              onClick={() => abrirBuscadorGasolineras(viaje.id, idx - 1, latPunto80, lngPunto80, `Km ${kmPunto80} (Tramo ${paradas[idx - 1]?.nombre} ➔ ${parada.nombre})`, `alerta-${idx}`)}
                                            >
                                              <Fuel size={14} /> Buscar gasolineras
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => ocultarAlertaCombustible(`alerta-${viaje.id}-${idx}`)}
                                              title="Ocultar aviso de combustible"
                                              style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#EF4444',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                opacity: 0.8
                                              }}
                                            >
                                              <X size={16} />
                                            </button>
                                          </div>
                                        </div>

                                        {infoAlertasAbiertas[`alerta-${idx}`] && (
                                          <div style={{
                                            paddingTop: '8px',
                                            borderTop: '1px dashed rgba(239, 68, 68, 0.3)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.84rem',
                                            lineHeight: 1.45
                                          }}>
                                            Para completar esta etapa acumularás <strong>{kmHastaEstaParada} km</strong> sin repostar (superando el 80% de tu autonomía de {autonomiaEstimada} km). Reposta antes de este tramo.
                                          </div>
                                        )}
                                      </div>
                                      {renderPanelGasolineras(`alerta-${idx}`)}
                                    </>
                                  )}

                                  <div
                                    draggable
                                    onDragStart={() => setArrastrandoIdx(idx)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => { if (arrastrandoIdx !== null && arrastrandoIdx !== idx) { moverParada(viaje.id, arrastrandoIdx, idx); setArrastrandoIdx(null); } }}
                                    className={`etapa-card-nuevo ${esGasolinera ? 'etapa-gas' : ''}`}
                                  >
                                    {/* 1. Drag & Drop (Izquierda) */}
                                    <div className="etapa-drag">
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', padding: '2px' }}>
                                        <button type="button" disabled={!puedeSubir} onClick={() => moverParada(viaje.id, idx, idx - 1)} style={{ background: 'none', border: 'none', cursor: puedeSubir ? 'pointer' : 'not-allowed', color: puedeSubir ? 'var(--text-primary)' : 'var(--text-muted)' }}><ArrowUp size={13} /></button>
                                        <button type="button" disabled={!puedeBajar} onClick={() => moverParada(viaje.id, idx, idx + 1)} style={{ background: 'none', border: 'none', cursor: puedeBajar ? 'pointer' : 'not-allowed', color: puedeBajar ? 'var(--text-primary)' : 'var(--text-muted)' }}><ArrowDown size={13} /></button>
                                      </div>
                                      <GripVertical size={16} style={{ color: 'var(--text-muted)', cursor: 'grab' }} />
                                    </div>

                                    {/* 2. Info Principal (Centro) */}
                                    <div className="etapa-info" onClick={() => { if (parada.lugar_id && alSeleccionarLugar) alSeleccionarLugar(parada.lugar_id); }}>
                                      <div className="etapa-icono">{esGasolinera ? '⛽' : numEtapa}</div>

                                      <div className="etapa-detalles">
                                        <div className="etapa-titulo-km">
                                          <span style={{ color: parada.lugar_id ? 'var(--accent-forest)' : 'inherit', textDecoration: parada.lugar_id ? 'underline' : 'none' }}>
                                            {parada.nombre}
                                          </span>
                                          <span style={{ fontSize: '0.74rem', background: 'rgba(37, 99, 235, 0.12)', color: '#3B82F6', border: '1px solid rgba(37, 99, 235, 0.3)', padding: '1px 7px', borderRadius: 'var(--radius-full)' }}>
                                            + {distTramo} km
                                          </span>
                                          {esGasolinera && <span style={{ fontSize: '0.74rem', background: 'rgba(16, 185, 129, 0.14)', color: '#10B981', padding: '1px 7px', borderRadius: 'var(--radius-full)' }}>⛽ Repostado</span>}
                                        </div>

                                        {editandoFechaParadaId === parada.id ? (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }} onClick={(e) => e.stopPropagation()}>
                                            <input type="date" className="form-control" style={{ padding: '2px 8px', fontSize: '0.78rem', width: '135px' }} value={formEdicionParada.fecha} onChange={(e) => setFormEdicionParada(prev => ({ ...prev, fecha: e.target.value }))} />
                                            <input type="number" min="0" max="60" className="form-control" style={{ padding: '2px 6px', fontSize: '0.78rem', width: '55px' }} value={formEdicionParada.dias_previstos} onChange={(e) => setFormEdicionParada(prev => ({ ...prev, dias_previstos: e.target.value }))} />
                                            <button className="btn btn-primary btn-sm" style={{ padding: '3px 8px', fontSize: '0.76rem' }} onClick={() => guardarModificacionParada(viaje.id, parada.id)}>Guardar</button>
                                            <button className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '0.76rem' }} onClick={() => setEditandoFechaParadaId(null)}>Cancelar</button>
                                          </div>
                                        ) : (
                                          <div
                                            style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}
                                            onClick={(e) => { if (!esGasolinera) { e.stopPropagation(); setEditandoFechaParadaId(parada.id); setFormEdicionParada({ fecha: (parada.fecha_llegada || viaje.fecha_inicio || '').split('T')[0], dias_previstos: parada.dias_previstos ?? 0 }); } }}
                                          >
                                            <span>{parada.poblacion || parada.direccion} • {parada.fecha_llegada ? formatearFecha(parada.fecha_llegada) : 'Sin fecha'}</span>
                                            {!esGasolinera && <span style={{ color: parada.dias_previstos === 0 ? 'var(--accent-earth)' : 'var(--accent-forest)', fontWeight: 600 }}>{parada.dias_previstos === 0 ? 'Día de paso' : `(${parada.dias_previstos} ${parada.dias_previstos === 1 ? 'noche' : 'noches'})`}</span>}
                                            {parada.precio && <span> • ⛽ {parada.precio} €/L</span>}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* 3. Acciones & Borrar (Derecha) */}
                                    <div className="etapa-acciones" onClick={(e) => e.stopPropagation()}>
                                      {parada.latitud != null && parada.longitud != null && (
                                        <button className="btn btn-secondary btn-sm" onClick={() => abrirRadar && abrirRadar({ lat: parada.latitud, lng: parada.longitud, nombre: parada.nombre })} style={{ padding: '6px 10px' }}><Radar size={15} color="var(--accent-earth)" /><span className="hide-on-mobile">Radar</span></button>
                                      )}
                                      <a href={generarUrlGoogleCalendarParada(parada, viaje)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '6px 10px', color: 'var(--text-primary)' }}><Calendar size={15} color="var(--accent-earth)" /></a>
                                      {parada.latitud != null && parada.longitud != null && (
                                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${parada.latitud},${parada.longitud}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '6px 10px', color: 'var(--text-primary)' }}><Navigation size={15} color="var(--accent-forest)" /><span className="hide-on-mobile">Ir</span></a>
                                      )}
                                      <button className="etapa-btn-borrar-inline" onClick={(e) => { e.stopPropagation(); eliminarParada(viaje.id, idx, parada); }}>
                                        <X size={14} />
                                      </button>
                                    </div>
                                  </div>
                                  {renderPanelGasolineras(`parada-${idx}`)}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* PASO 4: MODAL DE MAPA A PANTALLA COMPLETA */}
      {mapaExpandidoViaje && (() => {
        const viajeModal = mapaExpandidoViaje;
        const paradasModal = obtenerParadasViaje(viajeModal);
        const geoModal = geometriasRutas[viajeModal.id];
        const coordsTrazadoModal = geoModal?.coords || [];
        const coordsRutaModal = paradasModal.filter(p => p.latitud != null && p.longitud != null).map(p => [p.latitud, p.longitud]);
        const centroModal = coordsRutaModal.length > 0 ? coordsRutaModal[Math.floor(coordsRutaModal.length / 2)] : [40.4168, -3.7038];
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'var(--bg-primary)',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Cabecera del modal fullscreen */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 18px', background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-color)', flexShrink: 0, gap: '12px', flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Route size={20} color="var(--accent-earth)" />
                <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{viajeModal.titulo}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  · {paradasModal.filter(p => !p.es_base).length} paradas · {Math.round(viajeModal.km_totales || 0)} km
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Buscador de dirección libre dentro del mapa */}
                <div style={{ position: 'relative', minWidth: '260px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Añadir ubicación (dirección o URL Maps)..."
                    value={textoDireccion[`modal-${viajeModal.id}`] || ''}
                    onChange={(e) => buscarDireccionPhoton(`modal-${viajeModal.id}`, e.target.value)}
                    style={{ paddingLeft: '32px', height: '36px', fontSize: '0.84rem', background: 'var(--bg-glass)', borderColor: 'var(--border-color)' }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  {sugerenciasGeo[`modal-${viajeModal.id}`] && sugerenciasGeo[`modal-${viajeModal.id}`].length > 0 && !puntoExternoConfig && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10010,
                      background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      maxHeight: '200px', overflowY: 'auto'
                    }}>
                      {sugerenciasGeo[`modal-${viajeModal.id}`].map((sug, si) => (
                        <button key={si} type="button"
                          onClick={() => setPuntoExternoConfig({ viajeId: viajeModal.id, punto: sug, fecha: viajeModal.fecha_inicio || new Date().toISOString().split('T')[0], noches: 0 })}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', color: 'var(--text-primary)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <MapPin size={14} color="#3B82F6" style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sug.nombre}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sug.direccion || `${sug.lat.toFixed(5)}, ${sug.lng.toFixed(5)}`}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setMapaExpandidoViaje(null); setClickMapaInfo(null); setPuntoExternoConfig(null); setTextoDireccion(prev => ({ ...prev, [`modal-${viajeModal.id}`]: '' })); setSugerenciasGeo(prev => ({ ...prev, [`modal-${viajeModal.id}`]: [] })); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px' }}
                >
                  <Minimize2 size={15} />
                  <span>Cerrar</span>
                </button>
              </div>
            </div>

            {/* Mapa fullscreen */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <MapContainer
                center={centroModal}
                zoom={coordsRutaModal.length > 1 ? 7 : 10}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                {coordsTrazadoModal.length > 1 && (
                  <Polyline positions={coordsTrazadoModal} color="#10B981" weight={5} opacity={0.85} />
                )}

                {/* Marcadores de Lugares Camplink agrupados en Cluster en mapa a pantalla completa */}
                {lugaresCamplink && lugaresCamplink.length > 0 && (
                  <MarkerClusterGroup chunkedLoading maxClusterRadius={100}>
                    {lugaresCamplink.map((lugar) => {
                      const imagenLugar = obtenerImagenLugar(lugar);
                      const etiquetaTipo = obtenerEtiquetaTipoLugar(lugar);

                      return (
                        lugar.latitud != null && lugar.longitud != null && (
                          <Marker
                            key={`spot-cluster-${lugar.id}`}
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

                                  {/* Fila: Tipo de Lugar + Precio */}
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
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.80rem' }}>
                                    <CamperIconRating rating={lugar.valoracion_media} maxIcons={5} size={14} />
                                    <span style={{ fontWeight: 800, color: '#F3F4F6' }}>
                                      {parseFloat(lugar.valoracion_media || 0).toFixed(1)}
                                    </span>
                                    <span style={{ color: '#9CA3AF', fontSize: '0.72rem' }}>
                                      ({lugar.total_valoraciones || 0} valoraciones)
                                    </span>
                                  </div>

                                  {/* Servicios destacados */}
                                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', fontSize: '0.71rem' }}>
                                    {(lugar.agua_potable || lugar.tiene_agua) && <span style={{ background: 'rgba(255,255,255,0.08)', color: '#D1D5DB', padding: '2px 6px', borderRadius: '4px' }}>💧 Agua</span>}
                                    {(lugar.electricidad || lugar.tiene_electricidad) && <span style={{ background: 'rgba(255,255,255,0.08)', color: '#D1D5DB', padding: '2px 6px', borderRadius: '4px' }}>⚡ Luz</span>}
                                    {(lugar.vaciado_aguas_grises || lugar.vaciado_aguas_negras || lugar.vaciado_aguas) && <span style={{ background: 'rgba(255,255,255,0.08)', color: '#D1D5DB', padding: '2px 6px', borderRadius: '4px' }}>🔘 Vaciado</span>}
                                    {(lugar.admite_mascotas || lugar.mascotas) && <span style={{ background: 'rgba(255,255,255,0.08)', color: '#D1D5DB', padding: '2px 6px', borderRadius: '4px' }}>🐕 Mascotas</span>}
                                    {(lugar.ideal_familias || lugar.ideal_ninos_10_anos) && <span style={{ background: 'rgba(255,255,255,0.08)', color: '#D1D5DB', padding: '2px 6px', borderRadius: '4px' }}>👨‍👩‍👧 Familias</span>}
                                  </div>

                                  {/* Botón de acción: Añadir al viaje */}
                                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <button
                                      type="button"
                                      onClick={() => anadirLugarAViaje(viajeModal.id, lugar, viajeModal.fecha_inicio || new Date().toISOString().split('T')[0], 0)}
                                      className="btn btn-primary btn-sm"
                                      style={{
                                        flex: 1,
                                        fontSize: '0.78rem',
                                        fontWeight: 800,
                                        padding: '7px 10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '5px',
                                        background: 'var(--accent-forest)',
                                        color: '#FFFFFF',
                                        borderRadius: '8px'
                                      }}
                                    >
                                      <Plus size={14} /> Añadir al itinerario
                                    </button>
                                  </div>

                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        )
                      );
                    })}
                  </MarkerClusterGroup>
                )}

                {paradasModal.map((p, idx) => (
                  p.latitud != null && p.longitud != null && (
                    <Marker key={p.id || idx} position={[p.latitud, p.longitud]}
                      icon={p.es_base ? miniIconoBase : (p.tipo === 'gasolinera' || p.es_repostaje ? miniIconoGasolinera : miniIconoPlan)}>
                      <Popup>
                        <div style={{ padding: '6px', textAlign: 'center', minWidth: '140px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.nombre}</div>
                          <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '2px' }}>{p.poblacion || p.direccion}</div>
                          {p.dias_previstos === 0 ? (
                            <div style={{ fontSize: '0.76rem', color: '#D97706', fontWeight: 600, marginTop: '2px' }}>Día de paso</div>
                          ) : p.dias_previstos > 0 ? (
                            <div style={{ fontSize: '0.76rem', color: '#10B981', fontWeight: 600, marginTop: '2px' }}>{p.dias_previstos} {p.dias_previstos === 1 ? 'noche' : 'noches'}</div>
                          ) : null}
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
                {/* Marcador del click en el mapa */}
                {clickMapaInfo && clickMapaInfo.viajeId === viajeModal.id && (
                  <Marker position={[clickMapaInfo.lat, clickMapaInfo.lng]} icon={miniIconoPlan}>
                    <Popup>
                      <div style={{ padding: '4px', textAlign: 'center', minWidth: '160px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>📍 {clickMapaInfo.nombre}</div>
                        <button type="button" className="btn btn-primary btn-sm"
                          onClick={() => { setPuntoExternoConfig({ viajeId: viajeModal.id, punto: clickMapaInfo, fecha: viajeModal.fecha_inicio || new Date().toISOString().split('T')[0], noches: 0 }); }}
                          style={{ fontSize: '0.75rem', padding: '4px 10px', width: '100%' }}>
                          + Añadir al viaje
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )}
                <MapClickHandler onMapClick={(info) => setClickMapaInfo({ ...info, viajeId: viajeModal.id })} />
              </MapContainer>

              {/* Instrucción de uso */}
              <div style={{
                position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 'var(--radius-full)',
                padding: '6px 16px', fontSize: '0.76rem', fontWeight: 600, zIndex: 1000,
                pointerEvents: 'none', backdropFilter: 'blur(4px)'
              }}>
                Haz clic en el mapa para añadir una nueva parada
              </div>

              {/* Panel de confirmación al hacer click o seleccionar desde buscador */}
              {puntoExternoConfig && puntoExternoConfig.viajeId === viajeModal.id && (
                <div style={{
                  position: 'absolute', top: '12px', left: '12px', zIndex: 2000,
                  background: 'var(--bg-surface)', border: '1.5px solid rgba(59,130,246,0.5)',
                  borderRadius: 'var(--radius-lg)', padding: '16px 18px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: '260px', maxWidth: '320px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <MapPin size={18} color="#3B82F6" />
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', flex: 1, color: 'var(--text-primary)' }}>{puntoExternoConfig.punto.nombre}</span>
                    <button type="button" onClick={() => setPuntoExternoConfig(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                      <X size={15} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Fecha llegada</div>
                        <input type="date" className="form-control" style={{ padding: '4px 8px', fontSize: '0.8rem', width: '100%' }}
                          value={puntoExternoConfig.fecha}
                          onChange={(e) => setPuntoExternoConfig(prev => ({ ...prev, fecha: e.target.value }))} />
                      </div>
                      <div style={{ width: '68px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Noches</div>
                        <input type="number" min="0" max="60" className="form-control" style={{ padding: '4px 6px', fontSize: '0.8rem', width: '100%' }}
                          value={puntoExternoConfig.noches}
                          onChange={(e) => setPuntoExternoConfig(prev => ({ ...prev, noches: e.target.value }))} />
                      </div>
                    </div>
                    <button type="button" className="btn btn-primary"
                      disabled={anadiendoLugarId === 'externo'}
                      onClick={() => anadirDireccionExternaAViaje(viajeModal.id, puntoExternoConfig.punto, puntoExternoConfig.fecha, puntoExternoConfig.noches)}
                      style={{ width: '100%', fontWeight: 700, background: '#3B82F6', borderColor: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      {anadiendoLugarId === 'externo' ? 'Añadiendo...' : <><Plus size={15} /> Añadir parada al viaje</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* MODAL PARA COMPARTIR VIAJE */}
      {viajeACompartir && (
        <ModalCompartirViaje
          viaje={viajeACompartir}
          alCerrar={() => setViajeACompartir(null)}
          alCompartirExito={(destinatario) => {
            setNotificacionExito(`¡Invitación enviada a @${destinatario}! En cuanto acepte se le verá en sus viajes planificados.`);
            setTimeout(() => setNotificacionExito(''), 5000);
          }}
        />
      )}
    </div>
  );
}

