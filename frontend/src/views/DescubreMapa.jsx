// Aquí implemento la vista Descubre: mapa interactivo a pantalla completa con Leaflet,
// marcadores coloreados por puntuación camper (Dorado, Plateado, Bronce, Verde, Rojo),
// capas de Relieve Topográfico, Satélite Natural, Radar de Lluvia y Contaminación Lumínica (Cielos Oscuros),
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
  Dog, Sparkles, Navigation, Calendar, Plus, X, Check, Route, Shield
} from 'lucide-react';

// Creador de iconos camper estilizados de alta resolución y alto contraste según valoración
const crearIconoCamperColor = (colorFondo, colorBorde, emojiIcon = '🚐') => {
  return L.divIcon({
    className: 'custom-camper-marker',
    html: `
      <div style="
        position: relative;
        width: 22px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg viewBox="0 0 22 28" width="22" height="28" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.45));">
          <path d="M11 0 C4.92 0 0 4.92 0 11 C0 18 11 28 11 28 C11 28 22 18 22 11 C22 4.92 17.08 0 11 0 Z" 
                fill="${colorFondo}" stroke="${colorBorde}" stroke-width="1.5"/>
          <circle cx="11" cy="10" r="6" fill="#FFFFFF"/>
        </svg>
        <div style="
          position: absolute;
          top: 3px;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
        ">
          ${emojiIcon}
        </div>
      </div>
    `,
    iconSize: [22, 28],
    iconAnchor: [11, 28],
    popupAnchor: [0, -26]
  });
};

// 1. DORADO (4.0 a 5.0 campers / estrellas - Excelente)
const iconoDorado = crearIconoCamperColor('#F59E0B', '#B45309', '⭐');

// 2. PLATEADO (3.0 a 3.99 campers - Muy Bueno)
const iconoPlateado = crearIconoCamperColor('#94A3B8', '#475569', '🚐');

// 3. BRONCE (2.0 a 2.99 campers - Aceptable)
const iconoBronce = crearIconoCamperColor('#D97706', '#92400E', '🚐');

// 4. VERDE (1.01 a 1.99)
const iconoVerde = crearIconoCamperColor('#10B981', '#047857', '🚐');

// 5. ROJO (1.0 o menos - Mal valorado / Atención)
const iconoRojo = crearIconoCamperColor('#EF4444', '#B91C1C', '⚠️');

// 6. GRIS (Sin valoraciones aún / 0 exploradores)
const iconoGris = crearIconoCamperColor('#64748B', '#334155', '⛺');

// Función que selecciona el icono según los nuevos umbrales exactos de puntuación
const obtenerIconoPorLugar = (lugar) => {
  if (!lugar) return iconoGris;
  const total = lugar.total_valoraciones !== undefined 
    ? lugar.total_valoraciones 
    : (Array.isArray(lugar.valoraciones) ? lugar.valoraciones.length : 0);

  // Si no se ha puntuado aún, aparece en gris
  if (total === 0) {
    return iconoGris;
  }

  const val = parseFloat(lugar.valoracion_media) || 0;
  if (val > 4.0) return iconoDorado;     // 4.1 - 5.0 ⭐ (Oro / Top)
  if (val > 3.0) return iconoPlateado;   // 3.1 - 4.0 ⭐ (Plata)
  if (val > 2.0) return iconoBronce;     // 2.1 - 3.0 ⭐ (Bronce)
  if (val > 1.0) return iconoVerde;      // 1.1 - 2.0 ⭐ (Básico / Verde)
  return iconoRojo;                      // <= 1.0 ⭐ (No recomendado / Rojo)
};

// Alias de compatibilidad
const obtenerIconoPorValoracion = (valoracion) => {
  const val = parseFloat(valoracion) || 0;
  if (val >= 4.0) return iconoDorado;
  if (val >= 3.0) return iconoPlateado;
  if (val >= 2.0) return iconoBronce;
  if (val > 1.0) return iconoVerde;
  return iconoRojo;
};

// Icono animado para la furgoneta / ubicación actual del usuario
const iconoMiFurgo = L.divIcon({
  className: 'custom-furgo-marker',
  html: `
    <div style="
      position: relative;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #235334;
      border: 2px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 3px 10px rgba(0,0,0,0.45);
      font-size: 15px;
      animation: pulse-furgo 2s infinite;
    ">
      🚐
    </div>
    <style>
      @keyframes pulse-furgo {
        0% { box-shadow: 0 0 0 0 rgba(35, 83, 52, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(35, 83, 52, 0); }
        100% { box-shadow: 0 0 0 0 rgba(35, 83, 52, 0); }
      }
    </style>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

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

  // Filtros
  const [filtros, setFiltros] = useState({
    agua: false,
    electricidad: false,
    gratuito: false,
    vaciado_aguas: false,
    mascotas: false,
    familias: false,
    toldo: false,
    zona_recreativa: false,
    senderos: false,
  });

  const [panelFiltrosAbierto, setPanelFiltrosAbierto] = useState(false);

  // Estados para Modal "Añadir a Viaje Planificado" directo desde mapa
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

  // Filtrado de lugares
  const lugaresFiltrados = lugares.filter(l => {
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const coincideNombre = l.nombre?.toLowerCase().includes(q);
      const coincidePoblacion = l.poblacion?.toLowerCase().includes(q);
      const coincideProvincia = l.provincia?.toLowerCase().includes(q);
      if (!coincideNombre && !coincidePoblacion && !coincideProvincia) return false;
    }
    if (filtros.agua && !l.tiene_agua && !l.agua_potable) return false;
    if (filtros.electricidad && !l.tiene_electricidad && !l.electricidad) return false;
    if (filtros.gratuito && !l.es_gratuito) return false;
    if (filtros.vaciado_aguas && !l.vaciado_aguas && !l.vaciado_aguas_negras && !l.vaciado_aguas_grises) return false;
    if (filtros.mascotas && !l.admite_mascotas && !l.mascotas) return false;
    if (filtros.familias && !l.ideal_ninos_10_anos) return false;
    if (filtros.toldo && !l.permitido_sacar_toldo && !l.toldo) return false;
    return true;
  });

  const chipsRapidos = [
    { clave: 'gratuito', etiqueta: '💸 Gratuito' },
    { clave: 'agua', etiqueta: '💧 Agua Potable' },
    { clave: 'electricidad', etiqueta: '⚡ Electricidad' },
    { clave: 'vaciado_aguas', etiqueta: '♻️ Vaciado Aguas' },
    { clave: 'mascotas', etiqueta: '🐕 Mascotas' },
    { clave: 'familias', etiqueta: '👨‍👩‍👧 Familias' },
    { clave: 'toldo', etiqueta: '⛱️ Toldo' }
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      
      {/* BARRA SUPERIOR DE BÚSQUEDA Y FILTROS RÁPIDOS */}
      <div style={{
        position: 'absolute',
        top: '24px',
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
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por lugar, ciudad, provincia (ej: pirineos, caborredondo)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                height: '40px',
                paddingLeft: '38px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(20, 28, 22, 0.9)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(15px)',
                fontSize: '0.86rem'
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.7)' }} />
          </div>

          <button
            onClick={() => setPanelFiltrosAbierto(!panelFiltrosAbierto)}
            className="btn btn-secondary"
            style={{
              height: '40px',
              padding: '0 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(20, 28, 22, 0.9)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(15px)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem'
            }}
          >
            <Filter size={15} /> <span>Filtros</span>
          </button>

          {alCambiarALista && (
            <button
              onClick={alCambiarALista}
              className="btn btn-secondary"
              title="Ver lugares en formato lista y tarjetas"
              style={{
                height: '40px',
                padding: '0 12px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(20, 28, 22, 0.9)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(15px)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                whiteSpace: 'nowrap'
              }}
            >
              <span>📋 Ver Lista</span>
            </button>
          )}
        </div>

        {/* CHIPS HORIZONTALES */}
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          flexWrap: 'wrap',
          paddingBottom: '4px',
          scrollbarWidth: 'thin'
        }}>
          {chipsRapidos.map((chip) => {
            const activo = filtros[chip.clave];
            return (
              <button
                key={chip.clave}
                onClick={() => toggleFiltro(chip.clave)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: activo ? '1.5px solid var(--accent-forest)' : '1px solid rgba(255,255,255,0.2)',
                  background: activo ? 'var(--accent-forest)' : 'rgba(20, 28, 22, 0.88)',
                  color: '#FFFFFF',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                {chip.etiqueta}
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
        zIndex: 1000,
        background: 'rgba(20, 28, 22, 0.88)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 12px',
        fontSize: '0.74rem',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.35)'
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#64748B', display: 'inline-block' }}></span>
          <span>Sin puntuación (0 exploradores)</span>
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
          zIndex: 1000,
          background: 'var(--accent-forest)',
          color: '#FFFFFF',
          border: '2px solid #FFFFFF',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          cursor: 'pointer'
        }}
      >
        <Crosshair size={20} className={obteniendoGps ? 'spin-anim' : ''} />
      </button>

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
          zIndex: 10000,
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

            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Parada: <strong style={{ color: 'var(--text-primary)' }}>{lugarParaViaje.nombre}</strong> {lugarParaViaje.poblacion ? `(${lugarParaViaje.poblacion})` : ''}
            </div>

            {mensajeExitoViaje ? (
              <div style={{ padding: '14px', background: 'rgba(35, 83, 52, 0.2)', border: '1px solid var(--accent-forest)', color: 'var(--accent-forest)', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontWeight: 700 }}>
                {mensajeExitoViaje}
              </div>
            ) : (
              <form onSubmit={guardarLugarEnViaje} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {misViajesPlanificados.length > 0 && !creandoNuevoViajeInline ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.84rem', fontWeight: 700 }}>Selecciona tu viaje:</label>
                      <span onClick={() => setCreandoNuevoViajeInline(true)} style={{ fontSize: '0.78rem', color: 'var(--accent-forest)', cursor: 'pointer', textDecoration: 'underline' }}>
                        + Crear viaje nuevo
                      </span>
                    </div>
                    <select
                      className="form-control"
                      value={viajeSeleccionadoId}
                      onChange={(e) => setViajeSeleccionadoId(e.target.value)}
                    >
                      {misViajesPlanificados.map(v => (
                        <option key={v.id} value={v.id}>{v.titulo} ({v.fecha_inicio})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.84rem', fontWeight: 700 }}>Nombre del nuevo viaje:</label>
                      {misViajesPlanificados.length > 0 && (
                        <span onClick={() => setCreandoNuevoViajeInline(false)} style={{ fontSize: '0.78rem', color: 'var(--accent-forest)', cursor: 'pointer', textDecoration: 'underline' }}>
                          Usar existente
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: Vacaciones Asturias y Cantabria"
                      value={nuevoViajeTitulo}
                      onChange={(e) => setNuevoViajeTitulo(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Fecha prevista:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={fechaParada}
                      onChange={(e) => setFechaParada(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Noches previstas:</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={diasParada}
                      onChange={(e) => setDiasParada(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Notas de la parada (opcional):</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Llegar antes de las 18h para coger sitio..."
                    value={notasParada}
                    onChange={(e) => setNotasParada(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalAnadirViajeAbierto(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={guardandoEnViaje}>
                    {guardandoEnViaje ? 'Guardando...' : '➕ Añadir a mi Viaje'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MAPA LEAFLET A PANTALLA COMPLETA */}
      <MapContainer
        center={centroMapa}
        zoom={miUbicacion ? 13 : 6}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <ControladorCentroMapa coords={miUbicacion} />

        <LayersControl position="topright">
          {/* Capa Base 1: OpenStreetMap Estándar */}
          <LayersControl.BaseLayer checked name="🗺️ Callejero Estándar (OSM)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          {/* Capa Base 2: ESRI Topográfico Oficial ({z}/{y}/{x} corregido) */}
          <LayersControl.BaseLayer name="🏔️ Relieve Topográfico Nómada">
            <TileLayer
              attribution='Topografía &copy; ESRI World Topo'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          </LayersControl.BaseLayer>

          {/* Capa Base 3: Satélite Natural de Alta Resolución ({z}/{y}/{x} corregido) */}
          <LayersControl.BaseLayer name="🛰️ Satélite Natural">
            <TileLayer
              attribution='Satélite &copy; ESRI World Imagery'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          {/* CAPA TEMÁTICA 1: Radar de Lluvia en Tiempo Real */}
          <LayersControl.Overlay name="🌧️ Radar de Lluvia en Tiempo Real">
            <TileLayer
              attribution='Precipitaciones &copy; RainViewer'
              url="https://tilecache.rainviewer.com/v2/radar/nowcast_latest/256/{z}/{x}/{y}/2/1_1.png"
              opacity={0.7}
              maxNativeZoom={12}
              maxZoom={18}
              minZoom={3}
            />
          </LayersControl.Overlay>

          {/* CAPA TEMÁTICA 2: Contaminación Lumínica / Cielos Oscuros (NASA) */}
          <LayersControl.Overlay name="🌌 Contaminación Lumínica / Cielos Oscuros">
            <TileLayer
              attribution='Luces Nocturnas &copy; NASA Earth Observatory'
              url="https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg"
              opacity={0.65}
              maxNativeZoom={8}
              maxZoom={18}
            />
          </LayersControl.Overlay>
        </LayersControl>

        {/* MARCADOR DE MI FURGONETA */}
        {miUbicacion && (
          <Marker position={miUbicacion} icon={iconoMiFurgo}>
            <Popup>
              <div style={{ textAlign: 'center', padding: '6px', color: '#17241A' }}>
                <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#235334' }}>
                  📍 Tu Furgoneta / Tu Posición
                </div>
                <div style={{ fontSize: '0.8rem', color: '#444', marginTop: '2px' }}>
                  ¡Aquí estás ahora! Explora las pernoctas a tu alrededor.
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* MARCADORES DE LUGARES CON COLORES SEGÚN VALORACIÓN (Dorado, Plata, Bronce, Verde, Rojo) */}
        {lugaresFiltrados.map((lugar) => {
          // Icono dinámico según valoración
          const iconoMarcador = obtenerIconoPorLugar(lugar);

          // Extraer características y servicios disponibles
          const servicios = [];
          if (lugar.tiene_agua || lugar.agua_potable) servicios.push({ icon: '💧', label: 'Agua Potable' });
          if (lugar.tiene_electricidad || lugar.electricidad) servicios.push({ icon: '⚡', label: 'Electricidad' });
          if (lugar.vaciado_aguas || lugar.vaciado_aguas_negras || lugar.vaciado_aguas_grises) servicios.push({ icon: '♻️', label: 'Vaciado Aguas' });
          if (lugar.tiene_wc || lugar.wc) servicios.push({ icon: '🚽', label: 'WC / Baños' });
          if (lugar.tiene_duchas || lugar.duchas) servicios.push({ icon: '🚿', label: 'Duchas' });
          if (lugar.admite_mascotas || lugar.mascotas) servicios.push({ icon: '🐕', label: 'Mascotas' });
          if (lugar.tiene_wifi || lugar.wifi) servicios.push({ icon: '📶', label: 'WiFi' });
          if (lugar.permitido_sacar_toldo || lugar.toldo) servicios.push({ icon: '⛱️', label: 'Toldo Permitido' });
          if (lugar.ideal_ninos_10_anos) servicios.push({ icon: '👨‍👩‍👧', label: 'Familias' });

          const valNum = parseFloat(lugar.valoracion_media) || 0;

          return (
            <Marker
              key={lugar.id}
              position={[lugar.latitud, lugar.longitud]}
              icon={iconoMarcador}
            >
              <Popup>
                <div style={{
                  minWidth: '240px',
                  maxWidth: '280px',
                  padding: '6px',
                  color: '#17241A',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {/* Título y Población */}
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800, color: '#17241A' }}>
                    {lugar.nombre}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#4B5563', marginBottom: '8px' }}>
                    <MapPin size={13} color="#235334" />
                    <span>{lugar.poblacion} {lugar.provincia ? `(${lugar.provincia})` : ''}</span>
                  </div>

                  {/* Valoración y Precio */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CamperIconRating valor={lugar.valoracion_media} soloLectura tamaño="pequeño" />
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: valNum >= 4 ? '#B45309' : valNum >= 3 ? '#475569' : valNum >= 2 ? '#92400E' : '#047857'
                      }}>
                        {valNum > 0 ? `${valNum.toFixed(1)}` : 'Nuevo'}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: lugar.es_gratuito ? 'rgba(35, 83, 52, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                      color: lugar.es_gratuito ? '#235334' : '#D97706'
                    }}>
                      {lugar.es_gratuito ? 'Gratuito' : 'De pago'}
                    </span>
                  </div>

                  {/* CARACTERÍSTICAS Y SERVICIOS EN CHIPS DE ALTO CONTRASTE */}
                  {servicios.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Servicios disponibles:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {servicios.map((s, sIdx) => (
                          <span
                            key={sIdx}
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              background: '#F3F4F6',
                              color: '#1F2937',
                              border: '1px solid #E5E7EB',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <span>{s.icon}</span> <span>{s.label}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BOTONES DE ACCIÓN: VER FICHA + CHECKIN + AÑADIR A VIAJE */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: '0.76rem', padding: '5px 8px', justifyContent: 'center' }}
                        onClick={() => alSeleccionarLugar(lugar.id)}
                      >
                        Ver Ficha Completa
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, fontSize: '0.76rem', padding: '5px 8px', justifyContent: 'center' }}
                        onClick={() => alHacerCheckin(lugar)}
                      >
                        Check-in
                      </button>
                    </div>

                    {/* BOTÓN DIRECTO: AÑADIR A VIAJE PLANIFICADO */}
                    <button
                      type="button"
                      onClick={() => abrirModalAnadirViaje(lugar)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: '#D97706',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)'
                      }}
                      title="Añadir esta pernocta como parada en un viaje planificado"
                    >
                      <Route size={14} /> <span>➕ Añadir a Viaje Planificado</span>
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
