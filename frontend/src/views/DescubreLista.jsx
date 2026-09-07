// Aquí implemento la vista Descubre Lista: listado completo de lugares y pernoctas camper en formato tarjetas,
// con buscador inteligente por ubicación, filtros por servicios y rango de puntuación camper,
// botón para alternar a vista mapa, y acciones directas de guardado, añadido a viaje planificado y navegación GPS.

import React, { useState, useEffect } from 'react';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CamperIconRating from '../components/CamperIconRating';
import { 
  Search, Filter, MapPin, Map, Route, Bookmark, 
  Check, Navigation, Sparkles, Plus, X, Star,
  Droplets, Zap, Users, Dog, Sun, ArrowRight, Eye
} from 'lucide-react';

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
  const [filtroPuntuacion, setFiltroPuntuacion] = useState('todos');
  const [filtroTipoLugar, setFiltroTipoLugar] = useState('todos'); // 'todos' | 'oro' | 'plata' | 'bronce' | 'verde' | 'rojo' | 'sin_puntuacion'
  const [lugaresGuardados, setLugaresGuardados] = useState([]);

  // Filtros de servicios
  const [filtros, setFiltros] = useState({
    gratuito: false,
    agua: false,
    electricidad: false,
    vaciado_aguas: false,
    mascotas: false,
    familias: false,
    toldo: false,
    zona_recreativa: false,
    senderos: false,
  });

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
          fecha_guardado: new Date().toISOString()
        }, ...favs];
      }
      setLugaresGuardados(favs);
      localStorage.setItem('camplink_lugares_guardados', JSON.stringify(favs));
    } catch (e) {
      console.warn('Error actualizando favoritos:', e);
    }
  };

  const abrirModalAnadirViaje = async (lugar) => {
    if (!usuario) {
      alert('Debes iniciar sesión para añadir lugares a tus viajes planificados.');
      return;
    }
    setLugarParaViaje(lugar);
    setMensajeExitoViaje('');
    setModalAnadirViajeAbierto(true);
    try {
      const data = await peticionApi('/api/viajes/viajes/?mis_viajes=true');
      const lista = data.results || data || [];
      const noCerrados = lista.filter(v => !v.esta_cerrado);
      setMisViajesPlanificados(noCerrados);
      if (noCerrados.length > 0) {
        setViajeSeleccionadoId(noCerrados[0].id);
        setFechaParada(noCerrados[0].fecha_inicio || new Date().toISOString().split('T')[0]);
      } else {
        setCreandoNuevoViajeInline(true);
      }
    } catch (e) {
      console.error('Error cargando viajes:', e);
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
          alert('Por favor ingresa un título para el nuevo viaje.');
          setGuardandoEnViaje(false);
          return;
        }
        const nuevoViaje = await peticionApi('/api/viajes/viajes/', {
          method: 'POST',
          body: {
            titulo: nuevoViajeTitulo.trim(),
            fecha_inicio: nuevoViajeFecha
          }
        });
        targetViajeId = nuevoViaje.id;
      }

      await peticionApi(`/api/viajes/viajes/${targetViajeId}/anadir-parada/`, {
        method: 'POST',
        body: {
          lugar_id: lugarParaViaje.id,
          fecha_llegada: fechaParada,
          dias_estancia: parseInt(diasParada, 10) || 1,
          notas: notasParada.trim()
        }
      });

      setMensajeExitoViaje(`¡"${lugarParaViaje.nombre}" añadido a tu viaje planificado con éxito!`);
      setTimeout(() => {
        setModalAnadirViajeAbierto(false);
        setLugarParaViaje(null);
        setCreandoNuevoViajeInline(false);
        setNuevoViajeTitulo('');
      }, 1500);
    } catch (err) {
      alert(err.message || 'No se pudo añadir la parada al viaje.');
    } finally {
      setGuardandoEnViaje(false);
    }
  };

  // Filtrado de lugares
  const lugaresFiltrados = lugares.filter(l => {
    // 1. Filtro de búsqueda por texto
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      const match = (
        (l.nombre && l.nombre.toLowerCase().includes(q)) ||
        (l.poblacion && l.poblacion.toLowerCase().includes(q)) ||
        (l.provincia && l.provincia.toLowerCase().includes(q)) ||
        (l.pais && l.pais.toLowerCase().includes(q)) ||
        (l.descripcion && l.descripcion.toLowerCase().includes(q))
      );
      if (!match) return false;
    }

    // 2. Filtro de puntuación con los nuevos umbrales exactos
    const totalVals = l.total_valoraciones !== undefined ? l.total_valoraciones : (l.valoraciones?.length || 0);
    const val = parseFloat(l.valoracion_media) || 0;

    if (filtroPuntuacion === 'oro' && (totalVals === 0 || val <= 4.0)) return false; // 4.1 - 5.0
    if (filtroPuntuacion === 'plata' && (totalVals === 0 || val <= 3.0 || val > 4.0)) return false; // 3.1 - 4.0
    if (filtroPuntuacion === 'bronce' && (totalVals === 0 || val <= 2.0 || val > 3.0)) return false; // 2.1 - 3.0
    if (filtroPuntuacion === 'verde' && (totalVals === 0 || val <= 1.0 || val > 2.0)) return false; // 1.1 - 2.0
    if (filtroPuntuacion === 'rojo' && (totalVals === 0 || val > 1.0)) return false; // <= 1.0
    if (filtroPuntuacion === 'sin_puntuacion' && totalVals > 0) return false;

    // 3. Filtros booleanos de servicios
    if (filtros.gratuito && !l.es_gratuito) return false;
    if (filtros.agua && !l.tiene_agua && !l.agua_potable) return false;
    if (filtros.electricidad && !l.tiene_electricidad && !l.electricidad) return false;
    if (filtros.vaciado_aguas && !l.vaciado_aguas && !l.vaciado_aguas_negras && !l.vaciado_aguas_grises) return false;
    if (filtros.mascotas && !l.admite_mascotas && !l.mascotas) return false;
    if (filtros.familias && !l.ideal_ninos_10_anos) return false;
    if (filtros.toldo && !l.permitido_sacar_toldo && !l.toldo) return false;
    if (filtros.zona_recreativa && !l.es_zona_recreativa) return false;
    if (filtros.senderos && !l.tiene_senderos_sencillos) return false;

    return true;
  });

  const totalPaginas = Math.ceil(lugaresFiltrados.length / lugaresPorPagina) || 1;
  const lugaresPaginados = lugaresFiltrados.slice((paginaActual - 1) * lugaresPorPagina, paginaActual * lugaresPorPagina);

  const chipsRapidos = [
    { clave: 'gratuito', etiqueta: '💸 Gratuito' },
    { clave: 'agua', etiqueta: '💧 Agua Potable' },
    { clave: 'electricidad', etiqueta: '⚡ Electricidad' },
    { clave: 'vaciado_aguas', etiqueta: '♻️ Vaciado Aguas' },
    { clave: 'mascotas', etiqueta: '🐕 Mascotas' },
    { clave: 'familias', etiqueta: '👨‍👩‍👧 Familias' },
    { clave: 'toldo', etiqueta: '⛱️ Toldo' },
    { clave: 'zona_recreativa', etiqueta: '🏞️ Recreativa' },
    { clave: 'senderos', etiqueta: '🥾 Senderos' }
  ];

  // Helper para badge de color según puntuación
  const renderBadgePuntuacion = (lugar) => {
    const total = lugar.total_valoraciones !== undefined ? lugar.total_valoraciones : (lugar.valoraciones?.length || 0);
    if (total === 0) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(100, 116, 139, 0.18)',
          color: '#94A3B8',
          border: '1px solid #64748B',
          borderRadius: 'var(--radius-full)',
          padding: '3px 10px',
          fontSize: '0.78rem',
          fontWeight: 700
        }}>
          ⛺ Sin puntuar (0 exp.)
        </span>
      );
    }

    const val = parseFloat(lugar.valoracion_media) || 0;
    let bg = '#10B981';
    let text = '#FFFFFF';
    let label = `${val.toFixed(1)} / 5`;

    if (val > 4.0) { bg = '#F59E0B'; label += ' ⭐ Oro'; }
    else if (val > 3.0) { bg = '#94A3B8'; label += ' ⭐ Plata'; }
    else if (val > 2.0) { bg = '#D97706'; label += ' ⭐ Bronce'; }
    else if (val > 1.0) { bg = '#10B981'; label += ' ⭐ Verde'; }
    else { bg = '#EF4444'; label += ' ⚠️ No recomendado'; }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: bg,
        color: text,
        borderRadius: 'var(--radius-full)',
        padding: '3px 10px',
        fontSize: '0.78rem',
        fontWeight: 800,
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
      }}>
        {label} ({total})
      </span>
    );
  };

  return (
    <div className="camplink-container" style={{ padding: '24px 16px 80px', maxWidth: '1150px', margin: '0 auto', width: '100%' }}>
      
      {/* CABECERA CON CONMUTADOR MAPA / LISTA */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📋</span> Descubre Lugares (Vista Lista)
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Explora {lugares.length} áreas de pernocta, campings y puntos camper con filtros detallados.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* BOTÓN CONMUTAR A MAPA */}
          <button
            className="btn btn-secondary"
            onClick={alCambiarAMapa}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
          >
            <Map size={16} color="var(--accent-forest)" /> <span>🗺️ Ver en Mapa</span>
          </button>

          {alAbrirNuevoLugar && (
            <button
              className="btn btn-primary"
              onClick={alAbrirNuevoLugar}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <Plus size={16} /> <span>Añadir Lugar</span>
            </button>
          )}
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="camper-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre, población, provincia o país..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
              style={{ paddingLeft: '38px', height: '42px', borderRadius: 'var(--radius-full)' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {/* SELECTOR DE PUNTUACIÓN */}
          <select
            className="form-control"
            value={filtroPuntuacion}
            onChange={(e) => { setFiltroPuntuacion(e.target.value); setPaginaActual(1); }}
            style={{ width: 'auto', minWidth: '190px', height: '42px', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '0.86rem' }}
          >
            <option value="todos">⭐ Todas las puntuaciones</option>
            <option value="oro">⭐ 4.1 - 5.0 (Oro / Top)</option>
            <option value="plata">⭐ 3.1 - 4.0 (Plata)</option>
            <option value="bronce">⭐ 2.1 - 3.0 (Bronce)</option>
            <option value="verde">⭐ 1.1 - 2.0 (Básico / Verde)</option>
            <option value="rojo">⚠️ ≤ 1.0 (No recomendado)</option>
            <option value="sin_puntuacion">⛺ Sin puntuación aún (0 exp.)</option>
          </select>
        </div>

        {/* CHIPS RÁPIDOS DE SERVICIOS */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '4px' }}>Servicios:</span>
          {chipsRapidos.map((chip) => {
            const activo = filtros[chip.clave];
            return (
              <button
                key={chip.clave}
                type="button"
                onClick={() => toggleFiltro(chip.clave)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: activo ? '1.5px solid var(--accent-forest)' : '1px solid var(--border-color)',
                  background: activo ? 'var(--accent-forest)' : 'var(--bg-glass)',
                  color: activo ? '#FFFFFF' : 'var(--text-primary)',
                  transition: 'all 0.2s ease'
                }}
              >
                {chip.etiqueta}
              </button>
            );
          })}
        </div>
      </div>

      {/* LISTADO DE TARJETAS */}
      {cargando ? (
        <div className="camper-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem' }}>🚐</span>
          <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Cargando catálogo de lugares...</p>
        </div>
      ) : lugaresPaginados.length === 0 ? (
        <div className="camper-card" style={{ padding: '50px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem' }}>🔍</span>
          <h3 style={{ margin: '14px 0 6px' }}>No se encontraron lugares con estos filtros</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Prueba ajustando el texto de búsqueda o desactivando algunos servicios.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '22px'
        }}>
          {lugaresPaginados.map((lugar) => {
            const esGuardado = lugaresGuardados.some(g => g.id === lugar.id);
            const total = lugar.total_valoraciones !== undefined ? lugar.total_valoraciones : (lugar.valoraciones?.length || 0);

            return (
              <div key={lugar.id} className="camper-card" style={{ display: 'flex', flexDirection: 'column', padding: '18px', gap: '12px' }}>
                
                {/* FOTO O BANNER PANORÁMICO */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
                  {lugar.foto_principal ? (
                    <img 
                      src={lugar.foto_principal} 
                      alt={lugar.nombre} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, rgba(35,83,52,0.3) 0%, rgba(20,28,22,0.8) 100%)', color: '#FFFFFF', fontSize: '2.5rem' }}>
                      🌲
                    </div>
                  )}

                  {/* PRECIO / GRATUITO BADGE */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                    {lugar.es_gratuito ? (
                      <span className="badge-camper badge-forest" style={{ fontSize: '0.74rem', padding: '3px 8px' }}>💸 Gratuito</span>
                    ) : (
                      <span className="badge-camper badge-earth" style={{ fontSize: '0.74rem', padding: '3px 8px' }}>{lugar.precio ? `${lugar.precio} €/noche` : 'De pago'}</span>
                    )}
                  </div>

                  {/* BOTÓN GUARDAR FAVORITO */}
                  <button
                    type="button"
                    onClick={() => alternarGuardado(lugar)}
                    title={esGuardado ? "Guardado en mis lugares para ir" : "Guardar para ir"}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: esGuardado ? 'var(--accent-forest)' : 'rgba(0,0,0,0.6)',
                      color: '#FFFFFF',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backdropFilter: 'blur(6px)'
                    }}
                  >
                    <Bookmark size={16} fill={esGuardado ? '#FFFFFF' : 'none'} />
                  </button>
                </div>

                {/* CONTENIDO DE LA TARJETA */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                    <h3 
                      onClick={() => alSeleccionarLugar(lugar.id)}
                      style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', cursor: 'pointer', lineHeight: '1.3' }}
                    >
                      {lugar.nombre}
                    </h3>
                  </div>

                  {/* PUNTUACIÓN Y CONTADOR */}
                  <div style={{ marginBottom: '8px' }}>
                    {renderBadgePuntuacion(lugar)}
                  </div>

                  {/* UBICACIÓN */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <MapPin size={14} color="var(--accent-forest)" style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lugar.poblacion} {lugar.provincia ? `(${lugar.provincia})` : ''} • {lugar.pais || 'España'}
                    </span>
                  </div>

                  {/* DESCRIPCIÓN BREVE */}
                  <p style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.45',
                    margin: '0 0 12px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {lugar.descripcion || 'Punto de pernocta verificado por la comunidad nómada.'}
                  </p>

                  {/* CHIPS DE SERVICIOS */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {lugar.tiene_agua && <span className="badge-camper" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>💧 Agua</span>}
                    {lugar.tiene_electricidad && <span className="badge-camper" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>⚡ Luz</span>}
                    {(lugar.tiene_vaciado_aguas_grises || lugar.tiene_vaciado_aguas_negras) && <span className="badge-camper" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>♻️ Vaciado</span>}
                    {lugar.admite_mascotas && <span className="badge-camper" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>🐕 Mascotas</span>}
                    {lugar.ideal_ninos_10_anos && <span className="badge-camper" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>👨‍👩‍👧 Familias</span>}
                  </div>
                </div>

                {/* ACCIONES DE LA TARJETA */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginTop: 'auto',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '12px'
                }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => alSeleccionarLugar(lugar.id)}
                    style={{ fontSize: '0.8rem', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Eye size={14} /> <span>Ver Ficha</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => abrirModalAnadirViaje(lugar)}
                    style={{ fontSize: '0.8rem', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Route size={14} /> <span>Añadir a Viaje</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINACIÓN DE LISTADO */}
      {totalPaginas > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 18px',
          background: 'var(--bg-glass)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          marginTop: '28px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => { setPaginaActual(prev => Math.max(1, prev - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={paginaActual === 1}
          >
            ◀ Anteriores
          </button>

          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Página {paginaActual} de {totalPaginas} ({lugaresFiltrados.length} lugares encontrados)
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => { setPaginaActual(prev => Math.min(totalPaginas, prev + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={paginaActual === totalPaginas}
          >
            Siguientes ▶
          </button>
        </div>
      )}

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
          <div className="camper-card" style={{ maxWidth: '460px', width: '100%', padding: '24px', border: '2px solid var(--accent-forest)' }}>
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
                    <label style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>Nombre del nuevo viaje:</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: Ruta Pirineos 2026"
                      value={nuevoViajeTitulo}
                      onChange={(e) => setNuevoViajeTitulo(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>Fecha:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={fechaParada}
                      onChange={(e) => setFechaParada(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>Días prevista:</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={diasParada}
                      onChange={(e) => setDiasParada(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>Notas (opcional):</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Llegar antes de anochecer"
                    value={notasParada}
                    onChange={(e) => setNotasParada(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setModalAnadirViajeAbierto(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={guardandoEnViaje}>
                    {guardandoEnViaje ? 'Guardando...' : 'Confirmar Parada'}
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
