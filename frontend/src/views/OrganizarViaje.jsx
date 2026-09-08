// Aquí implemento la vista Organizar Viaje en Camplink:
// gestión de viajes futuros y planificados con reordenación táctil y Drag & Drop a la izquierda,
// cálculo de distancias reales por tramo por carretera, trazado OSRM real en el mapa,
// diferenciación visual de Salida y Vuelta a Base, y aviso de repostaje al 80% de autonomía.

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { buscarGasolinerasCercanas } from '../services/gasolineras';
import { 
  Calendar, MapPin, Plus, Route, 
  Map, Compass, Trash2, Edit3, 
  Check, X, ChevronDown, ChevronUp, 
  Sparkles, Fuel, ArrowRight, Eye,
  ArrowUp, ArrowDown, GripVertical, Search, AlertTriangle, Radar, Home, Flag, Navigation, Info
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

// Función para calcular la escala cromática de gasolineras (Verde = más barata -> Rojo = más cara)
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
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 1.22);
}

export default function OrganizarViaje({ alSeleccionarLugar, alExplorarMapa, abrirRadar }) {
  const { usuario } = useAuth();
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

  // Estados de expansión y edición en línea
  const [viajesExpandidos, setViajesExpandidos] = useState({});
  const [editandoId, setEditandoId] = useState(null);
  const [tituloEditado, setTituloEditado] = useState('');

  // Reordenación y gasolineras
  const [arrastrandoIdx, setArrastrandoIdx] = useState(null);
  const [panelGasolineras, setPanelGasolineras] = useState(null);

  // Buscador integrado de lugares para añadir paradas a la ruta
  const [buscadorLugarAbierto, setBuscadorLugarAbierto] = useState({});
  const [textoBusquedaLugar, setTextoBusquedaLugar] = useState({});
  const [resultadosLugar, setResultadosLugar] = useState({});
  const [buscandoLugar, setBuscandoLugar] = useState({});
  const [anadiendoLugarId, setAnadiendoLugarId] = useState(null);
  const timerBusquedaLugar = useRef({});

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

  const anadirLugarAViaje = async (viajeId, lugar) => {
    setAnadiendoLugarId(lugar.id);
    try {
      const res = await peticionApi(`/api/viajes/viajes/${viajeId}/anadir-parada/`, {
        method: 'POST',
        body: { lugar_id: lugar.id }
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
    } catch (err) {
      alert(err.message || 'Error al añadir lugar al itinerario.');
    } finally {
      setAnadiendoLugarId(null);
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
      const exp = {};
      lista.forEach(v => { exp[v.id] = true; });
      setViajesExpandidos(exp);
    } catch (err) {
      console.error('Error al cargar viajes en organizador:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarViajes();
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
    setViajesExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const crearNuevoViaje = async (e) => {
    e.preventDefault();
    if (!nuevoTitulo.trim()) return;
    setGuardandoViaje(true);
    try {
      await peticionApi('/api/viajes/viajes/', {
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

  const alternarRepostaje = async (viajeId, idx) => {
    try {
      const res = await peticionApi(`/api/viajes/viajes/${viajeId}/marcar-repostaje/`, {
        method: 'POST',
        body: { indice: idx }
      });
      if (res.viaje) {
        setViajes(prev => prev.map(v => v.id === viajeId ? res.viaje : v));
      }
    } catch (err) {
      console.error('Error al alternar repostaje:', err);
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
      lista = viaje.resumen_ruta.map((p, i) => ({
        id: p.id || `r-${i}`,
        lugar_id: p.lugar_id,
        nombre: p.nombre || p.lugar_nombre || 'Parada',
        latitud: p.lat != null ? p.lat : p.latitud,
        longitud: p.lng != null ? p.lng : p.longitud,
        poblacion: p.poblacion || '',
        provincia: p.provincia || '',
        fecha_llegada: p.fecha || p.fecha_llegada || '',
        dias_previstos: p.dias || p.dias_previstos || 1,
        notas_privadas: p.notas_privadas || '',
        tipo: p.tipo || 'parada',
        es_repostaje: p.es_repostaje || false,
        es_base: p.es_base || p.tipo === 'base' || p.tipo === 'base_salida' || p.tipo === 'base_vuelta',
        precio: p.precio,
        direccion: p.direccion
      }));
    } else {
      lista = (viaje.checkins_resumen || []).map((ch, i) => ({
        id: ch.id || `ch-${i}`,
        lugar_id: ch.lugar_id,
        nombre: ch.lugar_nombre || 'Punto de Pernocta',
        latitud: ch.latitud,
        longitud: ch.longitud,
        poblacion: ch.poblacion || '',
        provincia: ch.provincia || '',
        fecha_llegada: ch.fecha_llegada || '',
        dias_previstos: ch.dias_previstos || 1,
        notas_privadas: ch.notas_privadas || '',
        tipo: 'parada',
        es_repostaje: false,
        es_base: false
      }));
    }

    const baseTexto = usuario?.direccion_base || usuario?.poblacion || 'Tu Base Camper';
    const baseLat = usuario?.lat_base || (lista.length > 0 && lista[0].es_base && lista[0].latitud != null ? lista[0].latitud : null);
    const baseLng = usuario?.lng_base || (lista.length > 0 && lista[0].es_base && lista[0].longitud != null ? lista[0].longitud : null);

    const tieneSalida = lista.length > 0 && (lista[0].es_base || lista[0].tipo === 'base_salida' || lista[0].tipo === 'base');
    const tieneVuelta = lista.length > 1 && (lista[lista.length - 1].es_base || lista[lista.length - 1].tipo === 'base_vuelta');

    if (baseLat != null && baseLng != null && lista.length > 0) {
      if (!tieneSalida) {
        lista.unshift({
          id: 'base-salida',
          nombre: `Salida: ${baseTexto}`,
          latitud: baseLat,
          longitud: baseLng,
          poblacion: usuario?.poblacion || '',
          tipo: 'base_salida',
          es_base: true
        });
      }
      if (!tieneVuelta && lista.length > 1) {
        lista.push({
          id: 'base-vuelta',
          nombre: `Vuelta: ${baseTexto}`,
          latitud: baseLat,
          longitud: baseLng,
          poblacion: usuario?.poblacion || '',
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

        <button
          className="btn btn-primary"
          onClick={() => setModalNuevoViajeAbierto(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(35, 83, 52, 0.35)' }}
        >
          <Plus size={18} />
          <span>Crear Nuevo Viaje</span>
        </button>
      </div>

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
            const expandido = viajesExpandidos[viaje.id] !== false;
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
                      paradas[i-1].latitud, paradas[i-1].longitud,
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

            // Identificar índices de inicio y fin para bloquear reordenación fuera de límites
            const primerIndiceMovible = paradas.findIndex(p => !p.es_base);
            const ultimoIndiceMovible = paradas.length - 1 - [...paradas].reverse().findIndex(p => !p.es_base);

            // Contador de etapas intermedias regulares (excluyendo bases)
            let contadorEtapas = 0;

            return (
              <div key={viaje.id} className="camper-card" style={{ padding: '24px' }}>
                {/* Cabecera del Viaje */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: expandido ? '18px' : '0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'rgba(217, 119, 54, 0.15)',
                      border: '1px solid var(--accent-earth)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      flexShrink: 0
                    }}>
                      🗺️
                    </div>

                    <div style={{ flex: 1 }}>
                      {editandoId === viaje.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="text"
                            className="form-control"
                            value={tituloEditado}
                            onChange={(e) => setTituloEditado(e.target.value)}
                            style={{ padding: '4px 10px', fontSize: '1.05rem', fontWeight: 700 }}
                            autoFocus
                          />
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => guardarEdicionTitulo(viaje.id)}
                            title="Guardar título"
                            style={{ padding: '6px 10px' }}
                          >
                            <Check size={15} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditandoId(null)}
                            title="Cancelar"
                            style={{ padding: '6px 10px' }}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{viaje.titulo}</h3>
                          <button
                            onClick={() => { setEditandoId(viaje.id); setTituloEditado(viaje.titulo); }}
                            style={{ opacity: 0.7, padding: '2px', background: 'none', border: 'none', cursor: 'pointer' }}
                            title="Editar nombre del viaje"
                          >
                            <Edit3 size={15} color="var(--accent-forest)" />
                          </button>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span>📅 Salida: {new Date(viaje.fecha_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {viaje.fecha_fin && (
                          <span>🏁 Regreso: {new Date(viaje.fecha_fin).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        )}
                        <span style={{ fontWeight: 700, color: 'var(--accent-forest)' }}>
                          🛣️ {kmTotalesViaje} km de ruta estimados
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => toggleExpansion(viaje.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}
                    >
                      {expandido ? (
                        <><span>Ocultar Mapa e Itinerario</span> <ChevronUp size={15} /></>
                      ) : (
                        <><span>Ver Mapa e Itinerario</span> <ChevronDown size={15} /></>
                      )}
                    </button>

                    <button
                      className="btn-icon"
                      onClick={() => eliminarViaje(viaje.id)}
                      title="Eliminar este viaje planificado"
                      style={{ width: '34px', height: '34px', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* CONTENIDO EXPANDIDO: ITINERARIO, MAPA POR CARRETERA Y REPOSTAJES */}
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
                      <div style={{
                        height: '260px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        marginBottom: '20px',
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
                    )}

                    {/* LISTA DE PARADAS E ITINERARIO CON REORDENACIÓN A LA IZQUIERDA Y CÁLCULO DE KM */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Route size={16} color="var(--accent-earth)" />
                          <span>Itinerario de Etapas ({paradas.filter(p => !p.es_base).length} paradas planificadas):</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            Usa las flechas ⬆⬇ para ordenar tu ruta
                          </span>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setBuscadorLugarAbierto(prev => ({ ...prev, [viaje.id]: !prev[viaje.id] }))}
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
                            <span>{buscadorLugarAbierto[viaje.id] ? 'Cerrar Buscador' : 'Añadir Parada (Buscar Lugar)'}</span>
                          </button>
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-forest)' }}>
                              <Search size={16} />
                              <span>Buscar lugares camper para añadir al viaje:</span>
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
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      disabled={anadiendoLugarId === lugar.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        anadirLugarAViaje(viaje.id, lugar);
                                      }}
                                      style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                      <Plus size={14} />
                                      <span>{anadiendoLugarId === lugar.id ? 'Añadiendo...' : 'Añadir a la Ruta'}</span>
                                    </button>
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
                              onClick={() => setBuscadorLugarAbierto(prev => ({ ...prev, [viaje.id]: true }))}
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
                              
                              // La advertencia se evalúa y muestra ANTES de la etapa donde se supera el 80% de autonomía
                              const supera80 = idx > 0 && kmHastaEstaParada >= umbral80 && !parada.es_repostaje;

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

                              // Actualizamos km acumulados para el siguiente tramo
                              if (parada.es_repostaje) {
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
                                    {supera80 && (
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
                                          gap: '8px'
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
                                              onClick={() => abrirBuscadorGasolineras(viaje.id, idx - 1, latPunto80, lngPunto80, `Km ${kmPunto80} (Tramo ${paradas[idx-1]?.nombre} ➔ ${parada.nombre})`, `alerta-${idx}`)}
                                            >
                                              <Fuel size={14} /> Buscar gasolineras
                                            </button>
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
                                      background: esSalida ? 'rgba(35, 83, 52, 0.08)' : 'rgba(217, 119, 6, 0.08)',
                                      border: `1.5px dashed ${esSalida ? 'var(--accent-forest)' : 'var(--accent-gold)'}`,
                                      gap: '12px',
                                      flexWrap: 'wrap'
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                          width: '36px',
                                          height: '36px',
                                          borderRadius: '50%',
                                          background: esSalida ? 'var(--accent-forest)' : 'var(--accent-gold)',
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
                                            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: esSalida ? 'rgba(35,83,52,0.18)' : 'rgba(217,119,6,0.18)', color: esSalida ? 'var(--accent-forest)' : 'var(--accent-gold)' }}>
                                              {esSalida ? 'Punto de Partida' : 'Retorno a Base'}
                                            </span>
                                          </div>
                                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                            {esSalida ? 'Inicio de ruta (0 km)' : `Tramo final de regreso (+ ${distTramo} km)`}
                                            {parada.poblacion && ` • ${parada.poblacion}`}
                                          </div>
                                        </div>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {/* Abrir en GPS */}
                                        {parada.latitud != null && parada.longitud != null && (
                                          <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${parada.latitud},${parada.longitud}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-secondary btn-sm"
                                            onClick={(e) => e.stopPropagation()}
                                            title={`Abrir navegación GPS hasta ${parada.nombre}`}
                                            style={{ fontSize: '0.76rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--text-primary)' }}
                                          >
                                            <Navigation size={13} color="var(--accent-forest)" />
                                            <span>Ir</span>
                                          </a>
                                        )}

                                        {/* Radar centrado en Base */}
                                        {parada.latitud != null && parada.longitud != null && (
                                          <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => abrirRadar && abrirRadar({ lat: parada.latitud, lng: parada.longitud, nombre: parada.nombre })}
                                            style={{ fontSize: '0.76rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                          >
                                            <Radar size={13} color="var(--accent-earth)" />
                                            <span>Radar Base</span>
                                          </button>
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
                                  {/* ADVERTENCIA DE COMBUSTIBLE ANTES DE LA PARADA DONDE SE SUPERA EL 80% */}
                                  {supera80 && (
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
                                        gap: '8px'
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
                                            onClick={() => abrirBuscadorGasolineras(viaje.id, idx - 1, latPunto80, lngPunto80, `Km ${kmPunto80} (Tramo ${paradas[idx-1]?.nombre} ➔ ${parada.nombre})`, `alerta-${idx}`)}
                                          >
                                            <Fuel size={14} /> Buscar gasolineras
                                          </button>
                                        </div>

                                        {infoAlertasAbiertas[`alerta-${idx}`] && (
                                          <div style={{
                                            paddingTop: '8px',
                                            borderTop: '1px dashed rgba(239, 68, 68, 0.3)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.84rem',
                                            lineHeight: 1.45
                                          }}>
                                            Para llegar a <strong>{parada.nombre}</strong> acumularás <strong>{kmHastaEstaParada} km</strong> sin repostar (superando el 80% de tu previsión de {autonomiaEstimada} km). Recomendamos hacer una parada de repostaje aquí.
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
                                    onDrop={() => {
                                      if (arrastrandoIdx !== null && arrastrandoIdx !== idx) {
                                        moverParada(viaje.id, arrastrandoIdx, idx);
                                        setArrastrandoIdx(null);
                                      }
                                    }}
                                    style={{
                                      position: 'relative',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '14px 16px',
                                      paddingRight: '44px',
                                      borderRadius: 'var(--radius-md)',
                                      background: parada.tipo === 'gasolinera' ? 'rgba(217, 119, 6, 0.08)' : 'var(--bg-surface)',
                                      border: parada.es_repostaje ? '1.5px solid #D97706' : '1px solid var(--border-color)',
                                      gap: '14px',
                                      flexWrap: 'wrap',
                                      transition: 'background 0.2s'
                                    }}
                                  >
                                    {/* 1. Botón borrar en esquina superior derecha (como la X de cerrar) */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        eliminarParada(viaje.id, idx, parada);
                                      }}
                                      title="Eliminar esta parada del viaje"
                                      style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'rgba(239, 68, 68, 0.12)',
                                        color: '#EF4444',
                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                        cursor: 'pointer',
                                        padding: 0,
                                        transition: 'all 0.2s ease',
                                        zIndex: 2
                                      }}
                                    >
                                      <X size={14} />
                                    </button>
                                    {/* CONTROLES DE REORDENACIÓN A LA IZQUIERDA DEL TODO (FLECHAS ARRIBA / ABAJO) */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '2px',
                                        background: 'var(--bg-glass)',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-color)',
                                        padding: '2px'
                                      }}>
                                        <button
                                          type="button"
                                          disabled={!puedeSubir}
                                          onClick={() => moverParada(viaje.id, idx, idx - 1)}
                                          title="Mover etapa arriba (adelantar parada)"
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: puedeSubir ? 'pointer' : 'not-allowed',
                                            padding: '2px 4px',
                                            color: puedeSubir ? 'var(--text-primary)' : 'var(--text-muted)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            borderRadius: '2px'
                                          }}
                                        >
                                          <ArrowUp size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={!puedeBajar}
                                          onClick={() => moverParada(viaje.id, idx, idx + 1)}
                                          title="Mover etapa abajo (retrasar parada)"
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: puedeBajar ? 'pointer' : 'not-allowed',
                                            padding: '2px 4px',
                                            color: puedeBajar ? 'var(--text-primary)' : 'var(--text-muted)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            borderRadius: '2px'
                                          }}
                                        >
                                          <ArrowDown size={13} />
                                        </button>
                                      </div>

                                      <div style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }} title="Arrastrar para ordenar">
                                        <GripVertical size={16} />
                                      </div>
                                    </div>

                                    {/* INFORMACIÓN DE LA ETAPA (WIDGET CLICABLE PARA IR AL DETALLE) */}
                                    <div
                                      onClick={() => {
                                        if (parada.lugar_id && alSeleccionarLugar) {
                                          alSeleccionarLugar(parada.lugar_id);
                                        }
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        flex: 1,
                                        minWidth: '220px',
                                        cursor: parada.lugar_id ? 'pointer' : 'default',
                                        padding: '4px 8px',
                                        borderRadius: 'var(--radius-sm)',
                                        transition: 'background 0.2s ease'
                                      }}
                                      title={parada.lugar_id ? `Ver ficha completa de ${parada.nombre}` : parada.nombre}
                                      onMouseEnter={(e) => {
                                        if (parada.lugar_id) e.currentTarget.style.background = 'rgba(35, 83, 52, 0.12)';
                                      }}
                                      onMouseLeave={(e) => {
                                        if (parada.lugar_id) e.currentTarget.style.background = 'transparent';
                                      }}
                                    >
                                      <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: parada.tipo === 'gasolinera' ? '#D97706' : 'var(--accent-forest)',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                        fontSize: '0.85rem',
                                        flexShrink: 0
                                      }}>
                                        {parada.tipo === 'gasolinera' ? '⛽' : numEtapa}
                                      </div>

                                      <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                          <span
                                            style={{
                                              color: parada.lugar_id ? 'var(--accent-forest)' : 'inherit',
                                              textDecoration: parada.lugar_id ? 'underline' : 'none'
                                            }}
                                          >
                                            {parada.nombre}
                                          </span>

                                          {/* Distancia contabilizada de este tramo */}
                                          <span style={{ fontSize: '0.74rem', background: 'rgba(37, 99, 235, 0.12)', color: '#3B82F6', border: '1px solid rgba(37, 99, 235, 0.3)', padding: '1px 7px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                                            + {distTramo} km
                                          </span>


                                        </div>

                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                          {parada.poblacion || parada.direccion} • {parada.fecha_llegada ? parada.fecha_llegada.split('T')[0] : 'Sin fecha'}
                                          {parada.tipo !== 'gasolinera' && ` (${parada.dias_previstos} ${parada.dias_previstos === 1 ? 'noche' : 'noches'})`}
                                          {parada.precio && ` • ${parada.precio} €/L`}
                                        </div>
                                      </div>
                                    </div>

                                    {/* CONTENEDOR DE ACCIONES DE LA ETAPA */}
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {/* Radar */}
                                      {parada.latitud != null && parada.longitud != null && (
                                        <button
                                          type="button"
                                          className="btn btn-secondary btn-sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            abrirRadar && abrirRadar({ lat: parada.latitud, lng: parada.longitud, nombre: parada.nombre });
                                          }}
                                          title={`Abrir Radar Nómada como si estuvieras en ${parada.nombre}`}
                                          style={{
                                            fontSize: '0.84rem',
                                            fontWeight: 700,
                                            padding: '6px 12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            borderRadius: 'var(--radius-sm)'
                                          }}
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
    </div>
  );
}
