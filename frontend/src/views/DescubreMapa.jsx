// Aquí implemento la vista Descubre: mapa interactivo a pantalla completa con Leaflet,
// filtro principal obligatorio por tipo_lugar (Pernocta Libre, Área Autocaravanas, Camping, Parking Urbano, Área Recreativa, Solo Servicios),
// cajón modal de filtros categorizados (Servicios, Entorno/Ocio, Terreno/Acceso, Puntuación),
// capas de Relieve Topográfico, Satélite Natural, Radar de Lluvia y Contaminación Lumínica,
// y popup de alto contraste con listado completo de servicios y modal directo para añadir a viaje planificado.

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CamperIconRating from '../components/CamperIconRating';
import { 
  Layers, Filter, Search, MapPin, CloudRain, 
  Moon, Users, Crosshair, Droplets, Zap, 
  Dog, Sparkles, Navigation, Calendar, Plus, X, Check, Route, Shield, 
  TreePine, Home, Tent, Car, Waves, Compass, Trash2, Sun, Eye
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

// Creador de marcadores camper según tipo y valoración
const crearIconoCamperColor = (colorFondo, colorBorde, emojiIcon = '🚐') => {
  return L.divIcon({
    className: 'custom-camper-marker',
    html: `
      <div style="
        position: relative;
        width: 26px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg viewBox="0 0 22 28" width="26" height="32" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.55));">
          <path d="M11 0 C4.92 0 0 4.92 0 11 C0 18 11 28 11 28 C11 28 22 18 22 11 C22 4.92 17.08 0 11 0 Z" 
                fill="${colorFondo}" stroke="${colorBorde}" stroke-width="1.8"/>
          <circle cx="11" cy="10" r="6.5" fill="#FFFFFF"/>
        </svg>
        <div style="
          position: absolute;
          top: 3px;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        ">
          ${emojiIcon}
        </div>
      </div>
    `,
    iconSize: [26, 32],
    iconAnchor: [13, 32],
    popupAnchor: [0, -30]
  });
};

const iconoDorado = (emoji) => crearIconoCamperColor('#F59E0B', '#B45309', emoji);
const iconoPlateado = (emoji) => crearIconoCamperColor('#94A3B8', '#475569', emoji);
const iconoBronce = (emoji) => crearIconoCamperColor('#D97706', '#92400E', emoji);
const iconoVerde = (emoji) => crearIconoCamperColor('#10B981', '#047857', emoji);
const iconoRojo = (emoji) => crearIconoCamperColor('#EF4444', '#B91C1C', emoji);
const iconoGris = (emoji) => crearIconoCamperColor('#64748B', '#334155', emoji);

const obtenerIconoPorLugar = (lugar) => {
  if (!lugar) return iconoGris('⛺');
  const emoji = EMOJIS_POR_TIPO[lugar.tipo_lugar] || '🚐';
  const total = lugar.total_valoraciones !== undefined 
    ? lugar.total_valoraciones 
    : (Array.isArray(lugar.valoraciones) ? lugar.valoraciones.length : 0);

  if (total === 0) {
    return iconoGris(emoji);
  }

  const val = parseFloat(lugar.valoracion_media) || 0;
  if (val > 4.0) return iconoDorado(emoji);     // 4.1 - 5.0 ⭐ (Oro / Top)
  if (val > 3.0) return iconoPlateado(emoji);   // 3.1 - 4.0 ⭐ (Plata)
  if (val > 2.0) return iconoBronce(emoji);     // 2.1 - 3.0 ⭐ (Bronce)
  if (val > 1.0) return iconoVerde(emoji);      // 1.1 - 2.0 ⭐ (Básico / Verde)
  return iconoRojo(emoji);                      // <= 1.0 ⭐ (No recomendado / Rojo)
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

export default function DescubreMapa({ alSeleccionarLugar, alHacerCheckin, alCambiarALista }) {
  const { usuario } = useAuth();
  const [lugares, setLugares] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Ubicación actual
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [obteniendoGps, setObteniendoGps] = useState(false);
  const [centroMapa, setCentroMapa] = useState([40.4168, -3.7038]);

  // FILTRO PRINCIPAL: Tipo de Lugar
  const [tipoLugarSeleccionado, setTipoLugarSeleccionado] = useState('todos');

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

    // ⭐ Puntuación
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
    if ('geolocation' in navigator) {
      setObteniendoGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setMiUbicacion(coords);
          setCentroMapa(coords);
          setObteniendoGps(false);
        },
        (err) => {
          console.warn('Geolocalización GPS no disponible:', err.message);
          setObteniendoGps(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const toggleFiltro = (clave) => {
    setFiltros(prev => ({ ...prev, [clave]: !prev[clave] }));
  };

  const limpiarFiltros = () => {
    setTipoLugarSeleccionado('todos');
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

  const totalFiltrosActivos = Object.entries(filtros).filter(([k, v]) => k !== 'puntuacion_minima' ? v : v > 0).length + (tipoLugarSeleccionado !== 'todos' ? 1 : 0);

  // Filtrado de lugares
  const lugaresFiltrados = lugares.filter(l => {
    // 1. Filtro Principal: Tipo de Lugar
    if (tipoLugarSeleccionado !== 'todos') {
      if (l.tipo_lugar !== tipoLugarSeleccionado) return false;
    }

    // 2. Buscador
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const coincideNombre = l.nombre?.toLowerCase().includes(q);
      const coincidePoblacion = l.poblacion?.toLowerCase().includes(q);
      const coincideProvincia = l.provincia?.toLowerCase().includes(q);
      if (!coincideNombre && !coincidePoblacion && !coincideProvincia) return false;
    }

    // 3. Puntuación mínima
    if (filtros.puntuacion_minima > 0) {
      const val = parseFloat(l.valoracion_media) || 0;
      if (val < filtros.puntuacion_minima) return false;
    }

    // 4. Servicios Básicos
    if (filtros.agua_potable && !l.agua_potable && !l.tiene_agua) return false;
    if (filtros.lavabos && !l.lavabos) return false;
    if (filtros.electricidad && !l.electricidad && !l.tiene_electricidad) return false;
    if (filtros.wifi && !l.wifi) return false;
    if (filtros.basuras && !l.basuras) return false;
    if (filtros.duchas && !l.duchas) return false;
    if (filtros.vaciado_aguas_grises && !l.vaciado_aguas_grises && !l.vaciado_aguas) return false;
    if (filtros.vaciado_aguas_negras && !l.vaciado_aguas_negras && !l.vaciado_aguas) return false;
    if (filtros.es_gratuito && !l.es_gratuito) return false;

    // 5. Entorno y Ocio
    if (filtros.ideal_ninos_10_anos && !l.ideal_ninos_10_anos) return false;
    if (filtros.senderismo_cercano && !l.senderismo_cercano) return false;
    if (filtros.playa_cercana && !l.playa_cercana) return false;
    if (filtros.rutas_bici && !l.rutas_bici) return false;
    if (filtros.admite_mascotas && !l.admite_mascotas && !l.mascotas) return false;

    // 6. Terreno y Acceso
    if (filtros.acceso_asfaltado && !l.acceso_asfaltado) return false;
    if (filtros.mucha_sombra && !l.mucha_sombra) return false;
    if (filtros.muy_soleado_placas && !l.muy_soleado_placas) return false;
    if (filtros.terreno_nivelado && !l.terreno_nivelado) return false;
    if (filtros.apto_autocaravanas_grandes && !l.apto_autocaravanas_grandes) return false;
    if (filtros.permitido_sacar_toldo && !l.permitido_sacar_toldo && !l.toldo) return false;

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
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      
      {/* BARRA SUPERIOR DE BÚSQUEDA Y FILTRO PRINCIPAL (TIPO DE LUGAR) */}
      <div style={{
        position: 'absolute',
        top: '18px',
        left: '12px',
        right: '12px',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '960px',
        width: 'calc(100% - 24px)',
        margin: '0 auto'
      }}>
        {/* BUSCADOR + BOTÓN FILTROS + BOTÓN LISTA */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Buscar pernoctas, áreas, campings, pueblos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                paddingLeft: '38px',
                paddingRight: '12px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(20, 28, 22, 0.92)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(15px)',
                fontSize: '0.86rem',
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)'
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
              padding: '0 14px',
              borderRadius: 'var(--radius-full)',
              background: totalFiltrosActivos > 0 ? 'var(--accent-forest)' : 'rgba(20, 28, 22, 0.92)',
              color: '#FFFFFF',
              border: totalFiltrosActivos > 0 ? '1.5px solid #6EE7B7' : '1px solid rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(15px)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.84rem',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
              cursor: 'pointer'
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
                padding: '0 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(20, 28, 22, 0.92)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(15px)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.84rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                cursor: 'pointer'
              }}
            >
              <span>📋 Ver Lista</span>
            </button>
          )}
        </div>

        {/* FILTRO PRINCIPAL: SELECTOR DE TIPO DE LUGAR (CHIPS GRANDES Y CLAROS) */}
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {TIPOS_LUGAR_MAPA.map((tipo) => {
            const activo = tipoLugarSeleccionado === tipo.id;
            const cantidad = tipo.id === 'todos' 
              ? lugares.length 
              : lugares.filter(l => l.tipo_lugar === tipo.id).length;
            return (
              <button
                key={tipo.id}
                onClick={() => setTipoLugarSeleccionado(tipo.id)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '6px 13px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.79rem',
                  fontWeight: activo ? 800 : 600,
                  cursor: 'pointer',
                  border: activo ? '2px solid #6EE7B7' : '1px solid rgba(255,255,255,0.22)',
                  background: activo ? 'var(--accent-forest)' : 'rgba(20, 28, 22, 0.90)',
                  color: '#FFFFFF',
                  backdropFilter: 'blur(12px)',
                  boxShadow: activo ? '0 3px 12px rgba(35,83,52,0.6)' : '0 2px 8px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{tipo.emoji}</span>
                <span>{tipo.label}</span>
                <span style={{
                  fontSize: '0.70rem',
                  background: activo ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 800
                }}>
                  {cantidad}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LEYENDA FLOTANTE DE PUNTUACIONES / COLORES (EN ESQUINA INFERIOR IZQUIERDA) */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '14px',
        zIndex: 900,
        background: 'rgba(20, 28, 22, 0.90)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        fontSize: '0.74rem',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
      }}>
        <div style={{ fontWeight: 800, fontSize: '0.76rem', color: '#F3F4F6', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={12} color="#F59E0B" /> Puntuación Camper:
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }}></span>
          <span>4.1 - 5.0 ⭐ (Oro / Top)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#94A3B8', display: 'inline-block' }}></span>
          <span>3.1 - 4.0 ⭐ (Plata)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D97706', display: 'inline-block' }}></span>
          <span>2.1 - 3.0 ⭐ (Bronce)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
          <span>1.1 - 2.0 ⭐ (Básico / Verde)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}></span>
          <span>&le; 1.0 ⭐ (No recomendado / Rojo)</span>
        </div>
      </div>

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

      {/* MODAL / CAJÓN DE FILTROS CATEGORIZADOS (CATEGORÍAS ESTRUCTURADAS) */}
      {panelFiltrosAbierto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div className="camper-card" style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            border: '2px solid var(--accent-forest)',
            background: 'var(--bg-surface-elevated)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
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
              
              {/* 1. SELECCIÓN DE TIPO DE LUGAR */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-forest)' }}>
                  🌲 Tipo de Lugar (Filtro Principal)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '8px' }}>
                  {TIPOS_LUGAR_MAPA.map(tipo => {
                    const activo = tipoLugarSeleccionado === tipo.id;
                    return (
                      <button
                        key={tipo.id}
                        type="button"
                        onClick={() => setTipoLugarSeleccionado(tipo.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: activo ? '2px solid var(--accent-forest)' : '1px solid var(--border-color)',
                          background: activo ? 'rgba(35, 83, 52, 0.15)' : 'var(--bg-primary)',
                          color: activo ? 'var(--accent-forest)' : 'var(--text-primary)',
                          fontWeight: activo ? 800 : 500,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{tipo.emoji}</span>
                        <span>{tipo.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. SERVICIOS BÁSICOS Y CAMPER */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-forest)' }}>
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
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-forest)' }}>
                  🌳 Entorno y Ocio
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                  {[
                    { key: 'ideal_ninos_10_anos', label: '👨‍👩‍👧 Familias (Niños ~10a)' },
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
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-forest)' }}>
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
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-forest)' }}>
                  ⭐ Puntuación Camper Mínima
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { valor: 0, label: 'Cualquiera' },
                    { valor: 4.1, label: '4.1+ ⭐ Oro (Top)' },
                    { valor: 3.1, label: '3.1+ ⭐ Plata' },
                    { valor: 2.1, label: '2.1+ ⭐ Bronce' },
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
              attribution='&copy; RainViewer.com'
              url="https://tilecache.rainviewer.com/v2/radar/nowcast_latest/256/{z}/{x}/{y}/2/1_1.png"
              opacity={0.65}
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
                  font-size: 16px;
                ">
                  🚐
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
              popupAnchor: [0, -16]
            })}
          >
            <Popup>
              <div style={{ textAlign: 'center', padding: '4px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>📍 Tu Ubicación Actual</div>
                <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>Furgoneta / Explorador</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcadores de Lugares */}
        {lugaresFiltrados.map((lugar) => {
          const tipoInfo = TIPOS_LUGAR_MAPA.find(t => t.id === lugar.tipo_lugar) || { emoji: '🚐', label: lugar.tipo_lugar_display || 'Lugar Camper' };
          return (
            <Marker
              key={lugar.id}
              position={[parseFloat(lugar.latitud), parseFloat(lugar.longitud)]}
              icon={obtenerIconoPorLugar(lugar)}
            >
              <Popup className="custom-camper-popup" maxWidth={300}>
                <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Tipo de lugar badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(35, 83, 52, 0.12)',
                      color: 'var(--accent-forest)',
                      border: '1px solid var(--accent-forest)',
                      borderRadius: 'var(--radius-full)',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      <span>{tipoInfo.emoji}</span>
                      <span>{lugar.tipo_lugar_display || tipoInfo.label}</span>
                    </span>

                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: lugar.es_gratuito ? '#059669' : '#D97706',
                      background: lugar.es_gratuito ? 'rgba(5,150,105,0.1)' : 'rgba(217,119,6,0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {lugar.es_gratuito ? 'Gratis' : `${lugar.precio_noche || '0'} €/n`}
                    </span>
                  </div>

                  {/* Nombre y ubicación */}
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '0.96rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      {lugar.nombre}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={11} /> {lugar.poblacion || ''}{lugar.poblacion && lugar.provincia ? ', ' : ''}{lugar.provincia || ''}
                    </p>
                  </div>

                  {/* Valoración */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                    <CamperIconRating rating={lugar.valoracion_media} maxIcons={5} size={13} />
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                      {parseFloat(lugar.valoracion_media || 0).toFixed(1)}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.70rem' }}>
                      ({lugar.total_valoraciones || 0} reviews)
                    </span>
                  </div>

                  {/* Servicios destacados */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', fontSize: '0.70rem' }}>
                    {(lugar.agua_potable || lugar.tiene_agua) && <span style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>💧 Agua</span>}
                    {(lugar.electricidad || lugar.tiene_electricidad) && <span style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>⚡ Luz</span>}
                    {(lugar.vaciado_aguas_grises || lugar.vaciado_aguas_negras || lugar.vaciado_aguas) && <span style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>🔘 Vaciado</span>}
                    {(lugar.admite_mascotas || lugar.mascotas) && <span style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>🐕 Mascotas</span>}
                    {lugar.ideal_ninos_10_anos && <span style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>👨‍👩‍👧 Familias</span>}
                  </div>

                  {/* Botones de acción */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <button
                      onClick={() => alSeleccionarLugar(lugar.id)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, fontSize: '0.76rem', padding: '5px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <Eye size={12} /> Ver Ficha
                    </button>

                    <button
                      onClick={() => abrirModalAnadirViaje(lugar)}
                      className="btn btn-secondary btn-sm"
                      title="Añadir a mi viaje planificado"
                      style={{ fontSize: '0.76rem', padding: '5px 8px' }}
                    >
                      <Plus size={13} /> Viaje
                    </button>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lugar.latitud},${lugar.longitud}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      title="Abrir navegación GPS"
                      style={{ fontSize: '0.76rem', padding: '5px 8px' }}
                    >
                      <Navigation size={12} />
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* MODAL PARA AÑADIR LUGAR A VIAJE PLANIFICADO */}
      {modalAnadirViajeAbierto && lugarParaViaje && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
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
