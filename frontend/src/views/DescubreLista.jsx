// Aquí implemento la vista Descubre Lista: listado completo de lugares y pernoctas camper en formato tarjetas,
// con filtro principal obligatorio por tipo_lugar (Pernocta Libre, Área Autocaravanas, Camping, Parking Urbano, Área Recreativa, Solo Servicios),
// buscador inteligente por ubicación, filtros estructurados por categorías (Servicios, Entorno/Ocio, Terreno/Acceso, Puntuación),
// botón para alternar a vista mapa, y acciones directas de guardado, añadido a viaje planificado y navegación GPS.

import React, { useState, useEffect } from 'react';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CamperIconRating from '../components/CamperIconRating';
import { 
  Search, Filter, MapPin, Map, Route, Bookmark, 
  Check, Navigation, Sparkles, Plus, X, Star,
  Droplets, Zap, Users, Dog, Sun, ArrowRight, Eye,
  Trash2, SlidersHorizontal
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
  
  // FILTRO PRINCIPAL: Tipo de Lugar
  const [filtroTipoLugar, setFiltroTipoLugar] = useState('todos');

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
  const lugaresPorPagina = 12;

  useEffect(() => {
    cargarLugares();
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

  const toggleFiltro = (clave) => {
    setFiltros(prev => ({ ...prev, [clave]: !prev[clave] }));
    setPaginaActual(1);
  };

  const limpiarFiltros = () => {
    setFiltroTipoLugar('todos');
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

  const totalFiltrosActivos = Object.entries(filtros).filter(([k, v]) => k !== 'puntuacion_minima' ? v : v > 0).length + (filtroTipoLugar !== 'todos' ? 1 : 0);

  // FILTRADO
  const lugaresFiltrados = lugares.filter(l => {
    // 1. Tipo de Lugar Principal
    if (filtroTipoLugar !== 'todos' && l.tipo_lugar !== filtroTipoLugar) return false;

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
    if (filtros.lavabos && !l.lavabos) return false;
    if (filtros.electricidad && !l.electricidad && !l.tiene_electricidad) return false;
    if (filtros.wifi && !l.wifi) return false;
    if (filtros.basuras && !l.basuras) return false;
    if (filtros.duchas && !l.duchas) return false;
    if (filtros.vaciado_aguas_grises && !l.vaciado_aguas_grises && !l.vaciado_aguas) return false;
    if (filtros.vaciado_aguas_negras && !l.vaciado_aguas_negras && !l.vaciado_aguas) return false;

    // 5. Entorno / Ocio
    if (filtros.ideal_ninos_10_anos && !l.ideal_ninos_10_anos) return false;
    if (filtros.senderismo_cercano && !l.senderismo_cercano) return false;
    if (filtros.playa_cercana && !l.playa_cercana) return false;
    if (filtros.rutas_bici && !l.rutas_bici) return false;
    if (filtros.admite_mascotas && !l.admite_mascotas && !l.mascotas) return false;

    // 6. Terreno / Acceso
    if (filtros.acceso_asfaltado && !l.acceso_asfaltado) return false;
    if (filtros.mucha_sombra && !l.mucha_sombra) return false;
    if (filtros.muy_soleado_placas && !l.muy_soleado_placas) return false;
    if (filtros.terreno_nivelado && !l.terreno_nivelado) return false;
    if (filtros.apto_autocaravanas_grandes && !l.apto_autocaravanas_grandes) return false;
    if (filtros.permitido_sacar_toldo && !l.permitido_sacar_toldo && !l.toldo) return false;

    return true;
  });

  // Paginación
  const totalPaginas = Math.ceil(lugaresFiltrados.length / lugaresPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * lugaresPorPagina;
  const lugaresPaginados = lugaresFiltrados.slice(indiceInicio, indiceInicio + lugaresPorPagina);

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '1240px', margin: '0 auto' }}>
      
      {/* CABECERA PRINCIPAL CON CONTROLES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Explorar Lugares & Pernoctas</span>
            </h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Encuentra pernoctas libres, áreas de autocaravanas y campings filtrados por servicios y puntuación camper.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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

        {/* BARRA DE BÚSQUEDA Y BOTÓN DE FILTROS AVANZADOS */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Buscar por nombre, población o provincia (ej: Pirineos, Cabo de Gata, Llanes)..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
              className="input"
              style={{ paddingLeft: '40px', height: '44px', fontSize: '0.90rem' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          </div>

          <button
            onClick={() => setPanelFiltrosAbierto(true)}
            className={`btn ${totalFiltrosActivos > 0 ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '44px', padding: '0 16px', fontSize: '0.88rem', fontWeight: 700 }}
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

        {/* FILTRO PRINCIPAL: TIPO DE LUGAR (PESTAÑAS GRANDES) */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'thin'
        }}>
          {TIPOS_LUGAR_LISTA.map(tipo => {
            const activo = filtroTipoLugar === tipo.id;
            const cantidad = tipo.id === 'todos'
              ? lugares.length
              : lugares.filter(l => l.tipo_lugar === tipo.id).length;
            return (
              <button
                key={tipo.id}
                onClick={() => { setFiltroTipoLugar(tipo.id); setPaginaActual(1); }}
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
                  boxShadow: activo ? '0 2px 10px rgba(35,83,52,0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tipo.emoji}</span>
                <span>{tipo.label}</span>
                <span style={{
                  fontSize: '0.72rem',
                  background: activo ? 'rgba(255,255,255,0.25)' : 'var(--bg-secondary)',
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
              
              {/* 1. SERVICIOS BÁSICOS Y CAMPER */}
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

              {/* 2. ENTORNO Y OCIO */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '10px', color: 'var(--accent-forest)' }}>
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

              {/* 3. TERRENO Y ACCESO */}
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

              {/* 4. PUNTUACIÓN */}
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

      {/* LISTA DE LUGARES */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 12px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>Mostrando {lugaresPaginados.length} de {lugaresFiltrados.length} lugares</span>
            <span>Página {paginaActual} de {totalPaginas}</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            {lugaresPaginados.map(lugar => {
              const guardado = lugaresGuardados.some(g => g.id === lugar.id);
              const tipoInfo = TIPOS_LUGAR_LISTA.find(t => t.id === lugar.tipo_lugar) || { emoji: '🚐', label: lugar.tipo_lugar_display || 'Lugar Camper' };
              const val = parseFloat(lugar.valoracion_media) || 0;

              return (
                <div
                  key={lugar.id}
                  className="camper-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '18px',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)'
                  }}
                >
                  <div>
                    {/* Fila superior: Tipo de Lugar + Precio + Favorito */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'rgba(35, 83, 52, 0.12)',
                        color: 'var(--accent-forest)',
                        border: '1px solid var(--accent-forest)',
                        borderRadius: 'var(--radius-full)',
                        padding: '3px 10px',
                        fontSize: '0.74rem',
                        fontWeight: 800
                      }}>
                        <span>{tipoInfo.emoji}</span>
                        <span>{lugar.tipo_lugar_display || tipoInfo.label}</span>
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          color: lugar.es_gratuito ? '#059669' : '#D97706',
                          background: lugar.es_gratuito ? 'rgba(5,150,105,0.1)' : 'rgba(217,119,6,0.1)',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}>
                          {lugar.es_gratuito ? 'Gratis' : `${lugar.precio_noche || '0'} €/n`}
                        </span>

                        <button
                          onClick={() => alternarGuardado(lugar)}
                          title={guardado ? 'Quitar de guardados' : 'Guardar lugar para ir'}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: guardado ? 'var(--accent-forest)' : 'var(--text-secondary)',
                            padding: '4px'
                          }}
                        >
                          <Bookmark size={18} fill={guardado ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>

                    {/* Nombre y Población */}
                    <h3
                      onClick={() => alSeleccionarLugar(lugar.id)}
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {lugar.nombre}
                    </h3>

                    <p style={{ margin: '0 0 10px 0', fontSize: '0.80rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} /> {lugar.poblacion || ''}{lugar.poblacion && lugar.provincia ? ', ' : ''}{lugar.provincia || ''}
                    </p>

                    {/* Puntuación Camper */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <CamperIconRating rating={val} maxIcons={5} size={15} />
                      <span style={{ fontWeight: 800, fontSize: '0.84rem' }}>
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
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {lugar.descripcion}
                      </p>
                    )}

                    {/* Etiquetas y servicios */}
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '0.72rem' }}>
                      {(lugar.agua_potable || lugar.tiene_agua) && <span style={{ background: 'var(--bg-secondary)', padding: '2px 7px', borderRadius: '4px' }}>💧 Agua</span>}
                      {(lugar.electricidad || lugar.tiene_electricidad) && <span style={{ background: 'var(--bg-secondary)', padding: '2px 7px', borderRadius: '4px' }}>⚡ Luz</span>}
                      {(lugar.vaciado_aguas_grises || lugar.vaciado_aguas_negras || lugar.vaciado_aguas) && <span style={{ background: 'var(--bg-secondary)', padding: '2px 7px', borderRadius: '4px' }}>🔘 Vaciado</span>}
                      {(lugar.admite_mascotas || lugar.mascotas) && <span style={{ background: 'var(--bg-secondary)', padding: '2px 7px', borderRadius: '4px' }}>🐕 Mascotas</span>}
                      {lugar.ideal_ninos_10_anos && <span style={{ background: 'var(--bg-secondary)', padding: '2px 7px', borderRadius: '4px' }}>👨‍👩‍👧 Familias</span>}
                      {lugar.mucha_sombra && <span style={{ background: 'var(--bg-secondary)', padding: '2px 7px', borderRadius: '4px' }}>🌲 Sombra</span>}
                      {lugar.muy_soleado_placas && <span style={{ background: 'var(--bg-secondary)', padding: '2px 7px', borderRadius: '4px' }}>☀️ Placas</span>}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <button
                      onClick={() => alSeleccionarLugar(lugar.id)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.80rem' }}
                    >
                      <Eye size={13} /> Ver Detalle
                    </button>

                    <button
                      onClick={() => abrirModalAnadirViaje(lugar)}
                      className="btn btn-secondary btn-sm"
                      title="Añadir a ruta o viaje planificado"
                      style={{ fontSize: '0.80rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={13} /> Viaje
                    </button>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lugar.latitud},${lugar.longitud}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      title="Navegar con Google Maps"
                      style={{ fontSize: '0.80rem', padding: '6px 10px', display: 'flex', alignItems: 'center' }}
                    >
                      <Navigation size={13} />
                    </a>
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
