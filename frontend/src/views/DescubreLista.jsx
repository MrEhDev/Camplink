import { obtenerImagenLugar } from '../utils/lugarImagenes';
// Aquí implemento la vista Descubre Lista: listado completo de lugares y pernoctas camper en formato tarjetas,
// con filtro principal multi-selección por tipo_lugar (Pernocta Libre, Área Autocaravanas, Camping, Parking Urbano, Área Recreativa, Solo Servicios),
// imágenes destacadas por lugar, buscador inteligente de ancho completo, filtros estructurados por categorías,
// botón para alternar a vista mapa, y acciones directas de guardado, añadido a viaje planificado y navegación GPS.

import React, { useState, useEffect } from 'react';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CamperIconRating from '../components/CamperIconRating';
import { 
  Search, Filter, MapPin, Map, Route, Bookmark, 
  Check, Navigation, Sparkles, Plus, X, Star,
  Droplets, Zap, Users, Dog, Sun, ArrowRight, Eye,
  Trash2, SlidersHorizontal, ArrowUpDown
} from 'lucide-react';

export const TIPOS_LUGAR_LISTA = [
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

export const obtenerEtiquetaTipoLugar = (lugar) => {
  if (!lugar) return '🚐 Lugar Camper';
  if (lugar.tipo_lugar_display) return lugar.tipo_lugar_display;
  const emoji = EMOJIS_POR_TIPO[lugar.tipo_lugar] || '🚐';
  const nombre = NOMBRES_TIPO[lugar.tipo_lugar] || 'Lugar Camper';
  return `${emoji} ${nombre}`;
};

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function DescubreLista({ 
  alSeleccionarLugar, 
  alCambiarAMapa, 
  alAbrirNuevoLugar,
  alNavegarOrganizar
}) {
  const { usuario } = useAuth();
  const [lugares, setLugares] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // FILTRO PRINCIPAL: Multi-selección de Tipo de Lugar
  const [tiposLugarSeleccionados, setTiposLugarSeleccionados] = useState([]);

  // FILTROS AVANZADOS
  const [panelFiltrosAbierto, setPanelFiltrosAbierto] = useState(false);
  const [filtros, setFiltros] = useState({
    // 🚰 Servicios
    es_gratuito: false,
    agua_potable: false,
    lavabos: false,
    electricidad: false,
    wifi: false,
    basuras: false,
    duchas: false,
    vaciado_aguas_grises: false,
    vaciado_aguas_negras: false,

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

  const [lugaresGuardados, setLugaresGuardados] = useState([]);
  const [soloGuardados, setSoloGuardados] = useState(false);

  // Modal para añadir a viaje planificado
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

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [ubicacionUsuario, setUbicacionUsuario] = useState(null);
  const [criterioOrden, setCriterioOrden] = useState('recientes');
  const lugaresPorPagina = 12;

  useEffect(() => {
    cargarLugares();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUbicacionUsuario({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          if (usuario?.lat_base && usuario?.lng_base) {
            setUbicacionUsuario({
              lat: parseFloat(usuario.lat_base),
              lng: parseFloat(usuario.lng_base)
            });
          }
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    } else if (usuario?.lat_base && usuario?.lng_base) {
      setUbicacionUsuario({
        lat: parseFloat(usuario.lat_base),
        lng: parseFloat(usuario.lng_base)
      });
    }
    try {
      const guardados = JSON.parse(localStorage.getItem('camplink_lugares_guardados') || '[]');
      setLugaresGuardados(guardados);
    } catch (e) {
      console.warn('Error leyendo lugares guardados:', e);
    }
  }, []);

  const cargarLugares = async () => {
    setCargando(true);
    try {
      const data = await peticionApi('/api/lugares/puntos/');
      setLugares(data.results || data || []);
    } catch (err) {
      console.error('Error al cargar lugares:', err);
    } finally {
      setCargando(false);
    }
  };

  const alternarTipoLugar = (id) => {
    if (id === 'todos') {
      setTiposLugarSeleccionados([]);
      setPaginaActual(1);
      return;
    }
    setTiposLugarSeleccionados(prev => {
      if (prev.includes(id)) {
        return prev.filter(t => t !== id);
      } else {
        return [...prev, id];
      }
    });
    setPaginaActual(1);
  };

  const toggleFiltro = (clave) => {
    setFiltros(prev => ({ ...prev, [clave]: !prev[clave] }));
    setPaginaActual(1);
  };

  const limpiarFiltros = () => {
    setTiposLugarSeleccionados([]);
    setFiltros({
      es_gratuito: false,
      agua_potable: false,
      lavabos: false,
      electricidad: false,
      wifi: false,
      basuras: false,
      duchas: false,
      vaciado_aguas_grises: false,
      vaciado_aguas_negras: false,
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
    setSoloGuardados(false);
    setPaginaActual(1);
  };

  const alternarGuardado = (lugar) => {
    try {
      let favs = JSON.parse(localStorage.getItem('camplink_lugares_guardados') || '[]');
      const existe = favs.some(l => l.id === lugar.id);
      if (existe) {
        favs = favs.filter(l => l.id !== lugar.id);
      } else {
        favs = [{
          id: lugar.id,
          nombre: lugar.nombre,
          poblacion: lugar.poblacion,
          provincia: lugar.provincia,
          latitud: lugar.latitud,
          longitud: lugar.longitud,
          descripcion: lugar.descripcion,
          tipo_lugar: lugar.tipo_lugar,
          tipo_lugar_display: lugar.tipo_lugar_display,
          foto_principal: lugar.foto_principal,
          origen: 'descubre_lista',
          fecha_guardado: new Date().toISOString()
        }, ...favs];
      }
      localStorage.setItem('camplink_lugares_guardados', JSON.stringify(favs));
      setLugaresGuardados(favs);
    } catch (e) {
      console.warn('Error al guardar lugar:', e);
    }
  };

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

  const totalFiltrosActivos = Object.entries(filtros).filter(([k, v]) => k !== 'puntuacion_minima' ? v : v > 0).length + (tiposLugarSeleccionados.length > 0 ? tiposLugarSeleccionados.length : 0);

  // FILTRADO
  const lugaresFiltrados = lugares.filter(l => {
    // 0. Filtro de Solo Guardados
    if (soloGuardados) {
      const idsGuardados = new Set(lugaresGuardados.map(g => g.id));
      if (!idsGuardados.has(l.id)) return false;
    }

    // 1. Tipo de Lugar Principal (Multi-selección)
    if (tiposLugarSeleccionados.length > 0 && !tiposLugarSeleccionados.includes(l.tipo_lugar)) {
      return false;
    }

    // 2. Buscador
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const coincideNombre = l.nombre?.toLowerCase().includes(q);
      const coincidePoblacion = l.poblacion?.toLowerCase().includes(q);
      const coincideProvincia = l.provincia?.toLowerCase().includes(q);
      if (!coincideNombre && !coincidePoblacion && !coincideProvincia) return false;
    }

    // 3. Puntuación
    if (filtros.puntuacion_minima > 0) {
      const val = parseFloat(l.valoracion_media) || 0;
      if (val < filtros.puntuacion_minima) return false;
    }

    // 4. Servicios
    if (filtros.es_gratuito && !l.es_gratuito) return false;
    if (filtros.agua_potable && !l.agua_potable && !l.tiene_agua) return false;
    if (filtros.lavabos && !l.lavabos && !l.tiene_lavabo) return false;
    if (filtros.electricidad && !l.electricidad && !l.tiene_electricidad) return false;
    if (filtros.wifi && !l.wifi && !l.tiene_wifi) return false;
    if (filtros.basuras && !l.basuras && !l.tiene_basuras) return false;
    if (filtros.duchas && !l.duchas && !l.tiene_duchas) return false;
    if (filtros.vaciado_aguas_grises && !l.vaciado_aguas_grises && !l.tiene_vaciado_aguas_grises && !l.vaciado_aguas) return false;
    if (filtros.vaciado_aguas_negras && !l.vaciado_aguas_negras && !l.tiene_vaciado_aguas_negras && !l.vaciado_aguas) return false;

    // 5. Entorno / Ocio
    if (filtros.ideal_ninos_10_anos && !l.ideal_familias && !l.ideal_ninos_10_anos) return false;
    if (filtros.senderismo_cercano && !l.senderismo_cercano && !l.tiene_senderismo && !l.tiene_senderos_sencillos) return false;
    if (filtros.playa_cercana && !l.playa_cercana) return false;
    if (filtros.rutas_bici && !l.rutas_bici && !l.rutas_en_bici) return false;
    if (filtros.admite_mascotas && !l.admite_mascotas && !l.mascotas) return false;

    // 6. Terreno / Acceso
    if (filtros.acceso_asfaltado && !l.acceso_asfaltado) return false;
    if (filtros.mucha_sombra && !l.mucha_sombra) return false;
    if (filtros.muy_soleado_placas && !l.muy_soleado_placas && !l.muy_soleado) return false;
    if (filtros.terreno_nivelado && !l.terreno_nivelado) return false;
    if (filtros.apto_autocaravanas_grandes && !l.apto_autocaravanas_grandes && !l.apto_grandes_autocaravanas) return false;
    if (filtros.permitido_sacar_toldo && !l.permitido_sacar_toldo && !l.permite_sacar_toldo && !l.toldo) return false;

    return true;
  });

  // Ordenación dinámica
  const lugaresOrdenados = [...lugaresFiltrados].sort((a, b) => {
    if (criterioOrden === 'distancia') {
      const distA = ubicacionUsuario && a.latitud != null && a.longitud != null
        ? calcularDistanciaKm(ubicacionUsuario.lat, ubicacionUsuario.lng, a.latitud, a.longitud)
        : 999999;
      const distB = ubicacionUsuario && b.latitud != null && b.longitud != null
        ? calcularDistanciaKm(ubicacionUsuario.lat, ubicacionUsuario.lng, b.latitud, b.longitud)
        : 999999;
      return (distA ?? 999999) - (distB ?? 999999);
    }
    if (criterioOrden === 'valoracion') {
      return (parseFloat(b.valoracion_media) || 0) - (parseFloat(a.valoracion_media) || 0);
    }
    if (criterioOrden === 'alfabetico') {
      return (a.nombre || '').localeCompare(b.nombre || '');
    }
    return (b.id || 0) - (a.id || 0);
  });

  // Paginación
  const totalPaginas = Math.ceil(lugaresOrdenados.length / lugaresPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * lugaresPorPagina;
  const lugaresPaginados = lugaresOrdenados.slice(indiceInicio, indiceInicio + lugaresPorPagina);

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '1240px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      {/* CABECERA PRINCIPAL CON CONTROLES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', width: '100%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Explorar Lugares & Pernoctas</span>
            </h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Encuentra pernoctas libres, áreas de autocaravanas y campings filtrados por servicios y puntuación camper.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Botón Lugares Guardados */}
            <button
              type="button"
              onClick={() => {
                setSoloGuardados(!soloGuardados);
                setPaginaActual(1);
              }}
              className={`btn ${soloGuardados ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.86rem',
                fontWeight: 700,
                background: soloGuardados ? 'var(--accent-earth)' : undefined,
                borderColor: soloGuardados ? 'var(--accent-earth)' : undefined,
                color: soloGuardados ? '#FFFFFF' : undefined
              }}
              title={soloGuardados ? "Ver todos los lugares" : "Ver solo lugares guardados"}
            >
              <Bookmark 
                size={16} 
                fill={soloGuardados ? "#FFFFFF" : (lugaresGuardados.length > 0 ? "var(--accent-earth)" : "none")} 
                color={soloGuardados ? "#FFFFFF" : "var(--accent-earth)"} 
              />
              <span>{soloGuardados ? "Ver Todos" : `Guardados (${lugaresGuardados.length})`}</span>
            </button>

            {alCambiarAMapa && (
              <button
                onClick={alCambiarAMapa}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: 700 }}
              >
                <Map size={16} color="var(--accent-forest)" />
                <span>Ver en Mapa</span>
              </button>
            )}

            {alAbrirNuevoLugar && (
              <button
                onClick={alAbrirNuevoLugar}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: 700 }}
              >
                <Plus size={16} />
                <span>Publicar Lugar</span>
              </button>
            )}
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA CORREGIDA (ANCHO COMPLETO SIN CORTES) Y BOTÓN DE FILTROS */}
        <div style={{ display: 'flex', gap: '10px', width: '100%', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 0, width: '100%' }}>
            <input
              type="text"
              placeholder="Buscar por nombre, población o provincia (ej: Pirineos, Cabo de Gata, Llanes)..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
              className="form-control"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                paddingLeft: '44px',
                paddingRight: busqueda ? '38px' : '16px',
                height: '46px',
                fontSize: '0.90rem',
                borderRadius: 'var(--radius-full)',
                display: 'block'
              }}
            />
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-forest)', pointerEvents: 'none' }} />
            {busqueda && (
              <button
                type="button"
                onClick={() => { setBusqueda(''); setPaginaActual(1); }}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-muted)'
                }}
                title="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => setPanelFiltrosAbierto(true)}
            className={`btn ${totalFiltrosActivos > 0 ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '46px',
              padding: '0 18px',
              fontSize: '0.88rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-full)',
              flexShrink: 0
            }}
          >
            <SlidersHorizontal size={16} />
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
        </div>

        {/* FILTRO PRINCIPAL: TIPOS DE LUGAR (MULTI-SELECCIÓN) */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'thin',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {TIPOS_LUGAR_LISTA.map(tipo => {
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
                onClick={() => alternarTipoLugar(tipo.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: activo ? '2px solid var(--accent-forest)' : '1px solid var(--border-color)',
                  background: activo ? 'var(--accent-forest)' : 'var(--bg-surface)',
                  color: activo ? '#FFFFFF' : 'var(--text-primary)',
                  fontWeight: activo ? 800 : 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: activo ? '0 2px 10px rgba(35,83,52,0.35)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tipo.emoji}</span>
                <span>{tipo.label}</span>
                <span style={{
                  fontSize: '0.72rem',
                  background: activo ? 'rgba(255,255,255,0.28)' : 'var(--bg-secondary)',
                  color: activo ? '#FFFFFF' : 'var(--text-secondary)',
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

      {/* MODAL DE FILTROS AVANZADOS CATEGORIZADOS */}
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
            {/* Cabecera */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={20} color="var(--accent-forest)" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Filtros Categorizados</h3>
              </div>
              <button className="btn-icon" onClick={() => setPanelFiltrosAbierto(false)} style={{ width: '32px', height: '32px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Contenido */}
            <div style={{ overflowY: 'auto', paddingRight: '6px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 1. SELECCIÓN DE TIPOS DE LUGAR */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--accent-forest)' }}>
                    🌲 Tipos de Lugar (Multi-selección)
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
                  {TIPOS_LUGAR_LISTA.filter(t => t.id !== 'todos').map(tipo => {
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

              {/* 5. PUNTUACIÓN */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '10px', color: 'var(--accent-forest)' }}>
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

            {/* Pie */}
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

      {/* LISTA DE LUGARES EN FORMATO TARJETA CON IMÁGENES Y ALTO CONTRASTE */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px auto', width: '36px', height: '36px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-forest)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p>Cargando pernoctas y lugares camper...</p>
        </div>
      ) : lugaresFiltrados.length === 0 ? (
        <div className="camper-card" style={{ textAlign: 'center', padding: '48px 24px', margin: '24px 0' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0' }}>No se encontraron lugares con estos filtros</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 16px 0' }}>
            Prueba a seleccionar otro tipo de lugar o limpiar los servicios requeridos.
          </p>
          <button className="btn btn-primary" onClick={limpiarFiltros}>
            Restablecer todos los filtros
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 12px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap', gap: '10px' }}>
            <span>Mostrando {lugaresPaginados.length} de {lugaresOrdenados.length} lugares</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowUpDown size={14} color="var(--accent-forest)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Ordenar por:</span>
                <select
                  className="form-control"
                  style={{ width: 'auto', padding: '4px 10px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)' }}
                  value={criterioOrden}
                  onChange={(e) => {
                    setCriterioOrden(e.target.value);
                    setPaginaActual(1);
                  }}
                >
                  <option value="recientes">Más recientes</option>
                  <option value="distancia">📍 Distancia: más cercanos</option>
                  <option value="valoracion">⭐ Mejor valorados</option>
                  <option value="alfabetico">🔤 Alfabético (A-Z)</option>
                </select>
              </div>
              <span>Página {paginaActual} de {totalPaginas}</span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '22px',
            marginBottom: '32px'
          }}>
            {lugaresPaginados.map(lugar => {
              const guardado = lugaresGuardados.some(g => g.id === lugar.id);
              const distanciaKm = ubicacionUsuario && lugar.latitud != null && lugar.longitud != null
                ? calcularDistanciaKm(ubicacionUsuario.lat, ubicacionUsuario.lng, lugar.latitud, lugar.longitud)
                : null;
              const imagenLugar = obtenerImagenLugar(lugar);
              const etiquetaTipo = obtenerEtiquetaTipoLugar(lugar);
              const val = parseFloat(lugar.valoracion_media) || 0;

              return (
                <div
                  key={lugar.id}
                  className="camper-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 0,
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* IMAGEN DEL LUGAR O BANNER PAISAJÍSTICO */}
                  <div style={{ position: 'relative', width: '100%', height: '170px', background: '#0D1A12', overflow: 'hidden' }}>
                    {imagenLugar ? (
                      <img loading="lazy" decoding="async" 
                        src={imagenLugar} 
                        alt={lugar.nombre} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #193f28 0%, #0c2014 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{ fontSize: '3.2rem', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))' }}>
                          {EMOJIS_POR_TIPO[lugar.tipo_lugar] || '🚐'}
                        </span>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(17,24,20,0.85) 0%, transparent 60%)'
                    }} />

                    {/* Floating Badges */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      right: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      zIndex: 2
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: 'rgba(20, 32, 24, 0.90)',
                        color: '#6EE7B7',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 'var(--radius-full)',
                        padding: '3px 10px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                      }}>
                        {etiquetaTipo}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '0.76rem',
                          fontWeight: 900,
                          color: lugar.es_gratuito ? '#34D399' : '#FBBF24',
                          background: 'rgba(20, 32, 24, 0.90)',
                          backdropFilter: 'blur(10px)',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          border: lugar.es_gratuito ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(251, 191, 36, 0.4)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                        }}>
                          {lugar.es_gratuito || (!parseFloat(lugar.precio) && !parseFloat(lugar.precio_noche)) ? 'Gratis' : `${parseFloat(lugar.precio || lugar.precio_noche)} €/n`}
                        </span>

                        <button
                          onClick={() => alternarGuardado(lugar)}
                          title={guardado ? 'Quitar de guardados' : 'Guardar lugar para ir'}
                          style={{
                            background: 'rgba(20, 32, 24, 0.90)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: guardado ? '#10B981' : '#FFFFFF',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                          }}
                        >
                          <Bookmark size={16} fill={guardado ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CONTENIDO DE LA TARJETA */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      {/* Nombre y Población */}
                      <h3
                        onClick={() => alSeleccionarLugar(lugar.id)}
                        style={{
                          margin: '0 0 4px 0',
                          fontSize: '1.18rem',
                          fontWeight: 900,
                          cursor: 'pointer',
                          color: 'var(--text-primary)',
                          lineHeight: '1.3'
                        }}
                      >
                        {lugar.nombre}
                      </h3>

                      <p style={{ margin: '0 0 10px 0', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                        <MapPin size={14} color="#10B981" /> 
                        <span>{lugar.poblacion || ''}{lugar.poblacion && lugar.provincia ? ', ' : ''}{lugar.provincia || ''}</span>
                        {distanciaKm != null && (
                          <span style={{ color: '#10B981', fontWeight: 800, background: 'rgba(16, 185, 129, 0.12)', padding: '1px 7px', borderRadius: '4px', fontSize: '0.78rem' }}>
                            • a {distanciaKm} km
                          </span>
                        )}
                      </p>

                      {/* Puntuación Camper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <CamperIconRating rating={val} maxIcons={5} size={15} />
                        <span style={{ fontWeight: 800, fontSize: '0.86rem' }}>
                          {val > 0 ? val.toFixed(1) : 'Sin valoraciones'}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          ({lugar.total_valoraciones || 0} reviews)
                        </span>
                      </div>

                      {/* Descripción breve */}
                      {lugar.descripcion && (
                        <p style={{
                          margin: '0 0 12px 0',
                          fontSize: '0.83rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.45,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {lugar.descripcion}
                        </p>
                      )}

                      {/* Etiquetas y servicios */}
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '0.73rem' }}>
                        {(lugar.agua_potable || lugar.tiene_agua) && <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>💧 Agua</span>}
                        {(lugar.electricidad || lugar.tiene_electricidad) && <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>⚡ Luz</span>}
                        {(lugar.vaciado_aguas_grises || lugar.vaciado_aguas_negras || lugar.vaciado_aguas) && <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>🔘 Vaciado</span>}
                        {(lugar.admite_mascotas || lugar.mascotas) && <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>🐕 Mascotas</span>}
                        {(lugar.ideal_familias || lugar.ideal_ninos_10_anos) && <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>👨‍👩‍👧 Familias</span>}
                        {lugar.mucha_sombra && <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>🌲 Sombra</span>}
                        {(lugar.muy_soleado_placas || lugar.muy_soleado) && <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>☀️ Placas</span>}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <button
                        onClick={() => alSeleccionarLugar(lugar.id)}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 800 }}
                      >
                        <Eye size={14} /> Ver Detalle
                      </button>

                      <button
                        onClick={() => abrirModalAnadirViaje(lugar)}
                        className="btn btn-secondary btn-sm"
                        title="Añadir a ruta o viaje planificado"
                        style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                      >
                        <Plus size={14} /> Viaje
                      </button>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${lugar.latitud},${lugar.longitud}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        title="Navegar con Google Maps"
                        style={{ fontSize: '0.82rem', padding: '6px 10px', display: 'flex', alignItems: 'center' }}
                      >
                        <Navigation size={14} />
                      </a>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* PAGINACIÓN */}
          {totalPaginas > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
              >
                ← Anterior
              </button>

              <span style={{ fontSize: '0.86rem', fontWeight: 700, padding: '0 8px' }}>
                Página {paginaActual} de {totalPaginas}
              </span>

              <button
                className="btn btn-secondary btn-sm"
                disabled={paginaActual === totalPaginas}
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {/* MODAL PARA AÑADIR A VIAJE */}
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
                      className="form-control"
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
                        className="form-control"
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
                        className="form-control"
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
                      className="form-control"
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
                      className="form-control"
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
                    className="form-control"
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
