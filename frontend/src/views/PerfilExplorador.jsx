const formatearUsuario = (u) => {
  if (!u) return '';
  const s = String(u);
  return s.charAt(0).toUpperCase() + s.slice(1);
};
// Aquí implemento el Perfil del Explorador en Camplink con todas las herramientas camper:
// bitácoras de viaje expandibles con mini mapa de ruta interactivo, avisos de combustible situados en paradas recomendadas para viajes futuros,
// gestión de compañeros con perfiles clicables, administración de grupos de privacidad con asignación de miembros,
// lugares guardados sincronizados con el diario y modal de configuración de furgo, combustible y avatar.

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ModalViajeDetallePdf from '../components/ModalViajeDetallePdf';
import { 
  Compass, Award, Truck, MapPin, Calendar, Route, 
  Sparkles, Camera, Plus, Trash2, Edit3, 
  Check, X, FileText, Download, Shield, 
  Users, Fuel, AlertTriangle, UserCheck, 
  UserMinus, Globe, Copy, CheckCheck, Bookmark,
  Navigation, Search, ExternalLink, Sliders, 
  ChevronDown, ChevronUp, UserPlus, Save, User, Bell
} from 'lucide-react';

// Icono pequeño de pernocta para el mini mapa de ruta
const miniIconoCamper = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -26],
  shadowSize: [32, 32]
});

export default function PerfilExplorador({ alSeleccionarLugar, alVerPerfilUsuario, alNavegarOrganizar, abrirRadar }) {
  // Aquí gestiono todos los módulos del perfil: viajes, compañeros, grupos, guardados y trofeos
  const { usuario, cargarPerfil } = useAuth();
  const [pestañaActiva, setPestañaActiva] = useState('viajes'); // 'viajes' | 'comunidad' | 'guardados' | 'trofeos'

  // Estados de datos
  const [estadisticasData, setEstadisticasData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [trofeos, setTrofeos] = useState([]);
  const [platinoData, setPlatinoData] = useState(null);
  const [companeros, setCompaneros] = useState([]);
  const [seguidores, setSeguidores] = useState([]);
  const [siguiendo, setSiguiendo] = useState([]);
  const [tabComunidad, setTabComunidad] = useState('seguidores'); // 'seguidores', 'siguiendo', 'descubrir', 'grupos', 'notificaciones'
  const [todosLosExploradores, setTodosLosExploradores] = useState([]);
  const [busquedaNomada, setBusquedaNomada] = useState('');
  const [cargandoNomadas, setCargandoNomadas] = useState(false);
  const [notificacionesPerfil, setNotificacionesPerfil] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [lugaresGuardados, setLugaresGuardados] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estado de viajes expandidos y edición de títulos
  const [viajesExpandidos, setViajesExpandidos] = useState({});
  const [paginaViajes, setPaginaViajes] = useState(1);
  const viajesPorPagina = 10;
  const [editandoTituloViajeId, setEditandoTituloViajeId] = useState(null);
  const [nuevoTituloViaje, setNuevoTituloViaje] = useState('');
  const [repostajesManuales, setRepostajesManuales] = useState({}); // { [viajeId]: paradaIndex }

  // Estados del modal de configuración camper
  const [modalConfigAbierto, setModalConfigAbierto] = useState(false);
  const [tipoViajero, setTipoViajero] = useState('camper');
  const [tipoCombustible, setTipoCombustible] = useState('gasoleo_a');
  const [poblacion, setPoblacion] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [direccionBase, setDireccionBase] = useState('');
  const [latBase, setLatBase] = useState(null);
  const [lngBase, setLngBase] = useState(null);
  const [biografia, setBiografia] = useState('');
  const [capacidadDeposito, setCapacidadDeposito] = useState(60);
  const [consumoMedio, setConsumoMedio] = useState(8.5);
  const [archivoAvatar, setArchivoAvatar] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  // Estados de autocompletado de dirección
  const [sugerenciasDireccion, setSugerenciasDireccion] = useState([]);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  const timerDireccion = useRef(null);

  // Estados de gestión de grupos (crear, editar y gestionar miembros)
  const [nombreNuevoGrupo, setNombreNuevoGrupo] = useState('');
  const [descNuevoGrupo, setDescNuevoGrupo] = useState('');
  const [creandoGrupo, setCreandoGrupo] = useState(false);
  const [grupoEditando, setGrupoEditando] = useState(null); // Grupo actual a editar
  const [modalMiembrosGrupo, setModalMiembrosGrupo] = useState(null); // Grupo para asignar miembros
  const [miembrosSeleccionados, setMiembrosSeleccionados] = useState([]);

  // Estados para modal de PDF y copiado GPS
  const [viajeSeleccionadoParaPdf, setViajeSeleccionadoParaPdf] = useState(null);
  const [copiadoId, setCopiadoId] = useState(null);

  const cargarDatos = async () => {
    // Aquí obtengo de forma segura todas las secciones del perfil
    setCargando(true);
    try {
      // 1. Estadísticas
      try {
        const estats = await peticionApi('/api/viajes/estadisticas/').catch(() => peticionApi('/api/viajes/mis-estadisticas/'));
        setEstadisticasData(estats);
      } catch (e) {
        console.warn('Estadísticas no disponibles:', e);
      }

      // 2. Viajes
      try {
        const viajesRes = await peticionApi('/api/viajes/viajes/?mis_viajes=true').catch(() => peticionApi('/api/viajes/rutas/?mis_viajes=true'));
        setViajes(viajesRes.results || viajesRes || []);
      } catch (e) {
        console.warn('Viajes no disponibles:', e);
      }

      // 3. Trofeos
      try {
        const trofeosRes = await peticionApi('/api/viajes/trofeos/');
        if (trofeosRes && trofeosRes.categorias) {
          setTrofeos(trofeosRes.categorias);
          setPlatinoData(trofeosRes.platino || null);
        } else if (Array.isArray(trofeosRes)) {
          setTrofeos(trofeosRes);
        } else {
          setTrofeos(trofeosRes?.results || []);
        }
      } catch (e) {
        console.warn('Trofeos no disponibles:', e);
      }

      // 4. Compañeros, Seguidores y Siguiendo
      try {
        const segRes = await peticionApi('/api/exploradores/seguidores-siguiendo/');
        if (segRes) {
          setSeguidores(segRes.seguidores || []);
          setSiguiendo(segRes.siguiendo || []);
          setCompaneros(segRes.siguiendo || []);
        } else {
          const companerosRes = await peticionApi('/api/exploradores/companeros/');
          setCompaneros(companerosRes.results || companerosRes || []);
        }
        cargarTodosLosExploradores();
        cargarNotificacionesPerfil();
      } catch (e) {
        console.warn('Compañeros no disponibles:', e);
      }

      // 5. Grupos
      try {
        const gruposRes = await peticionApi('/api/exploradores/grupos/');
        setGrupos(gruposRes.results || gruposRes || []);
      } catch (e) {
        console.warn('Grupos no disponibles:', e);
      }

      // 6. Lugares y Vivencias Guardadas
      try {
        const guardadosFicha = JSON.parse(localStorage.getItem('camplink_lugares_guardados') || '[]');
        const guardadosOffline = JSON.parse(localStorage.getItem('camplink_lugares_offline') || '[]');
        // Unir evitando duplicados por ID
        const mapa = new Map();
        [...guardadosFicha, ...guardadosOffline].forEach(item => {
          if (item && item.id && !mapa.has(item.id)) {
            mapa.set(item.id, item);
          }
        });
        setLugaresGuardados(Array.from(mapa.values()));
      } catch (e) {
        console.warn('Guardados no disponibles:', e);
      }

      if (usuario) {
        setTipoViajero(usuario.tipo_viajero || 'camper');
        setTipoCombustible(usuario.tipo_combustible || 'gasoleo_a');
        setPoblacion(usuario.poblacion || '');
        setCodigoPostal(usuario.codigo_postal || '');
        setDireccionBase(usuario.direccion_base || usuario.poblacion || '');
        setLatBase(usuario.lat_base || null);
        setLngBase(usuario.lng_base || null);
        setBiografia(usuario.biografia || '');
        setCapacidadDeposito(usuario.capacidad_deposito_l || 60);
        setConsumoMedio(usuario.consumo_medio_l_100km || 8.5);
        setPreviewAvatar(usuario.avatar || null);
      }
    } catch (err) {
      console.error('Error al inicializar perfil:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  // Autocompletado geográfico enriquecido estilo Google Maps y resolución de Código Postal
  const manejarCambioCodigoPostal = async (cp) => {
    // Aquí calculo la población base y coordenadas automáticamente a partir del código postal español
    setCodigoPostal(cp);
    if (/^\d{5}$/.test(cp)) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${cp}&country=Spain&format=json&addressdetails=1&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          const addr = item.address || {};
          const ciudad = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
          if (ciudad) setPoblacion(ciudad);
          if (item.lat && item.lon) {
            setLatBase(parseFloat(item.lat));
            setLngBase(parseFloat(item.lon));
          }
        }
      } catch (err) {
        console.warn('Error resolviendo código postal:', err);
      }
    }
  };

  const buscarSugerenciasDireccion = (texto) => {
    // Aquí muestro sugerencias precisas mientras el usuario escribe su dirección
    setDireccionBase(texto);
    if (timerDireccion.current) clearTimeout(timerDireccion.current);

    if (!texto || texto.length < 3) {
      setSugerenciasDireccion([]);
      return;
    }

    timerDireccion.current = setTimeout(async () => {
      setBuscandoDireccion(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(texto)}&countrycodes=es&format=json&addressdetails=1&limit=6`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && Array.isArray(data)) {
          const formateadas = data.map(item => {
            const addr = item.address || {};
            const ciudad = addr.city || addr.town || addr.village || addr.municipality || '';
            const cp = addr.postcode || '';
            const provincia = addr.state || addr.province || addr.county || '';
            return {
              etiqueta: item.display_name,
              ciudad: ciudad,
              codigo_postal: cp,
              provincia: provincia,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            };
          });
          setSugerenciasDireccion(formateadas);
        }
      } catch (e) {
        console.warn('Error en sugerencias:', e);
      } finally {
        setBuscandoDireccion(false);
      }
    }, 350);
  };

  const seleccionarSugerencia = (sug) => {
    // Al seleccionar la sugerencia, autocompleto dirección, código postal, población y coordenadas GPS base
    setDireccionBase(sug.etiqueta);
    if (sug.ciudad) setPoblacion(sug.ciudad);
    if (sug.codigo_postal) setCodigoPostal(sug.codigo_postal);
    setLatBase(sug.lat);
    setLngBase(sug.lng);
    setSugerenciasDireccion([]);
  };

  const manejarCambioAvatar = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivoAvatar(file);
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const guardarCambiosPerfil = async (e) => {
    e.preventDefault();
    setGuardandoPerfil(true);
    try {
      let body;
      if (archivoAvatar) {
        body = new FormData();
        body.append('tipo_viajero', tipoViajero);
        body.append('tipo_combustible', tipoCombustible);
        body.append('poblacion', poblacion);
        body.append('codigo_postal', codigoPostal);
        body.append('direccion_base', direccionBase);
        if (latBase) body.append('lat_base', latBase);
        if (lngBase) body.append('lng_base', lngBase);
        body.append('biografia', biografia);
        body.append('capacidad_deposito_l', parseFloat(capacidadDeposito) || 60);
        body.append('consumo_medio_l_100km', parseFloat(consumoMedio) || 8.5);
        body.append('avatar', archivoAvatar);
      } else {
        body = {
          tipo_viajero: tipoViajero,
          tipo_combustible: tipoCombustible,
          poblacion: poblacion,
          codigo_postal: codigoPostal,
          direccion_base: direccionBase,
          ...(latBase ? { lat_base: latBase } : {}),
          ...(lngBase ? { lng_base: lngBase } : {}),
          biografia: biografia,
          capacidad_deposito_l: parseFloat(capacidadDeposito) || 60,
          consumo_medio_l_100km: parseFloat(consumoMedio) || 8.5,
        };
      }

      await peticionApi('/api/exploradores/perfil/', {
        method: 'PATCH',
        body
      });

      if (cargarPerfil) {
        await cargarPerfil();
      }

      setModalConfigAbierto(false);
      alert('¡Configuración camper guardada con éxito!');
      await cargarDatos();
    } catch (err) {
      console.error('Error al guardar perfil:', err);
      alert(err.message || 'No se pudieron guardar los cambios.');
    } finally {
      setGuardandoPerfil(false);
    }
  };

  // Gestión de viajes
  const toggleExpandirViaje = (viajeId) => {
    setViajesExpandidos(prev => ({ ...prev, [viajeId]: !prev[viajeId] }));
  };

  const guardarTituloViaje = async (viajeId) => {
    if (!nuevoTituloViaje.trim()) return;
    try {
      await peticionApi(`/api/viajes/viajes/${viajeId}/`, {
        method: 'PATCH',
        body: { titulo: nuevoTituloViaje.trim() }
      });
      setViajes(viajes.map(v => v.id === viajeId ? { ...v, titulo: nuevoTituloViaje.trim() } : v));
      setEditandoTituloViajeId(null);
    } catch (err) {
      alert('No se pudo actualizar el nombre del viaje.');
    }
  };

  const marcarRepostajeEnParada = async (viajeId, paradaIdx) => {
    // Aquí alterno el repostaje en esta parada permitiendo múltiples repostajes en un mismo viaje
    setRepostajesManuales(prev => {
      const actuales = Array.isArray(prev[viajeId]) ? prev[viajeId] : (prev[viajeId] !== undefined ? [prev[viajeId]] : []);
      const existe = actuales.includes(paradaIdx);
      const nuevos = existe ? actuales.filter(i => i !== paradaIdx) : [...actuales, paradaIdx];
      return { ...prev, [viajeId]: nuevos };
    });

    try {
      await peticionApi(`/api/viajes/viajes/${viajeId}/marcar-repostaje/`, {
        method: 'POST',
        body: { indice: paradaIdx }
      });
    } catch (err) {
      console.warn('Aviso guardando repostaje en backend:', err);
    }
  };

  // Gestión de grupos
  const crearGrupo = async (e) => {
    e.preventDefault();
    if (!nombreNuevoGrupo.trim()) return;
    setCreandoGrupo(true);
    try {
      const nuevo = await peticionApi('/api/exploradores/grupos/', {
        method: 'POST',
        body: { nombre: nombreNuevoGrupo.trim(), descripcion: descNuevoGrupo.trim() }
      });
      setGrupos([nuevo, ...grupos]);
      setNombreNuevoGrupo('');
      setDescNuevoGrupo('');
      alert(`Grupo "${nuevo.nombre}" creado exitosamente.`);
    } catch {
      alert('No se pudo crear el grupo.');
    } finally {
      setCreandoGrupo(false);
    }
  };

  const guardarEdicionGrupo = async (e) => {
    e.preventDefault();
    if (!grupoEditando) return;
    try {
      const actualizado = await peticionApi(`/api/exploradores/grupos/${grupoEditando.id}/`, {
        method: 'PATCH',
        body: { nombre: grupoEditando.nombre, descripcion: grupoEditando.descripcion }
      });
      setGrupos(grupos.map(g => g.id === actualizado.id ? actualizado : g));
      setGrupoEditando(null);
      alert('Grupo actualizado con éxito.');
    } catch {
      alert('No se pudo actualizar el grupo.');
    }
  };

  const abrirModalMiembros = (grupo) => {
    setModalMiembrosGrupo(grupo);
    // IDs de miembros actuales
    const ids = (grupo.miembros || []).map(m => typeof m === 'object' ? m.id : m);
    setMiembrosSeleccionados(ids);
  };

  const guardarMiembrosGrupo = async () => {
    if (!modalMiembrosGrupo) return;
    try {
      const actualizado = await peticionApi(`/api/exploradores/grupos/${modalMiembrosGrupo.id}/`, {
        method: 'PATCH',
        body: { miembros: miembrosSeleccionados }
      });
      setGrupos(grupos.map(g => g.id === actualizado.id ? actualizado : g));
      setModalMiembrosGrupo(null);
      alert('Miembros del grupo actualizados con éxito.');
    } catch {
      alert('No se pudieron actualizar los miembros del grupo.');
    }
  };

  const alternarMiembroSeleccionado = (compagnonId) => {
    if (miembrosSeleccionados.includes(compagnonId)) {
      setMiembrosSeleccionados(miembrosSeleccionados.filter(id => id !== compagnonId));
    } else {
      setMiembrosSeleccionados([...miembrosSeleccionados, compagnonId]);
    }
  };

  const eliminarGrupo = async (grupoId) => {
    if (!confirm('¿Seguro que deseas eliminar este grupo?')) return;
    try {
      await peticionApi(`/api/exploradores/grupos/${grupoId}/`, { method: 'DELETE' });
      setGrupos(grupos.filter(g => g.id !== grupoId));
    } catch {
      alert('No se pudo eliminar el grupo.');
    }
  };

    const cargarTodosLosExploradores = async (query = '') => {
    try {
      setCargandoNomadas(true);
      const url = query ? `/api/exploradores/lista/?q=${encodeURIComponent(query)}` : '/api/exploradores/lista/';
      const res = await peticionApi(url);
      const lista = res.results || res || [];
      setTodosLosExploradores(lista.filter(u => u.id !== usuario?.id));
    } catch (e) {
      console.warn('Error al cargar exploradores:', e);
    } finally {
      setCargandoNomadas(false);
    }
  };

    const forzarNotificacionPerfil = async (tipo) => {
    try {
      const res = await peticionApi('/api/exploradores/notificaciones/probar/', {
        method: 'POST',
        data: { tipo }
      });
      if (res?.notificacion) {
        alert(`¡Notificación (${res.notificacion.titulo}) generada con éxito!`);
        cargarNotificacionesPerfil();
      }
    } catch (e) {
      alert('Error al generar notificación de prueba.');
    }
  };

  const cargarNotificacionesPerfil = async () => {
    try {
      const res = await peticionApi('/api/exploradores/notificaciones/');
      if (res) {
        setNotificacionesPerfil(res.notificaciones || []);
      }
    } catch (e) {
      console.warn('Error al cargar notificaciones en perfil:', e);
    }
  };

  const alternarSeguirCompanero = async (companeroId) => {
    try {
      const res = await peticionApi(`/api/exploradores/seguir/${companeroId}/`, { method: 'POST' });
      if (res?.mensaje) alert(res.mensaje);
      // Recargar seguidores y siguiendo
      const segRes = await peticionApi('/api/exploradores/seguidores-siguiendo/');
      if (segRes) {
        setSeguidores(segRes.seguidores || []);
        setSiguiendo(segRes.siguiendo || []);
        setCompaneros(segRes.siguiendo || []);
      }
    } catch (e) {
      alert('Error al gestionar el seguimiento.');
    }
  };

  const dejarDeSeguir = async (companeroId) => {
    if (!confirm('¿Deseas desvincularte de este compañero de ruta?')) return;
    try {
      await peticionApi(`/api/exploradores/seguir/${companeroId}/`, { method: 'POST' });
      setCompaneros(companeros.filter(c => c.id !== companeroId));
    } catch (err) {
      console.error('Error al dejar de seguir:', err);
    }
  };

  const copiarCoordenadas = (lat, lng, id) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const eliminarLugarGuardado = (lugarId) => {
    const actualizados = lugaresGuardados.filter(l => l.id !== lugarId);
    setLugaresGuardados(actualizados);
    localStorage.setItem('camplink_lugares_guardados', JSON.stringify(actualizados));
    localStorage.setItem('camplink_lugares_offline', JSON.stringify(actualizados));
  };

  const irAlPerfilCompanero = (compagnonId) => {
    // Aquí abro directamente el perfil público del compañero
    if (alVerPerfilUsuario && compagnonId) {
      alVerPerfilUsuario(compagnonId);
    }
  };

  // Cálculo de autonomía máxima estimada
  const autonomiaEstimada = Math.round(((parseFloat(usuario?.capacidad_deposito_l || capacidadDeposito) || 60) / (parseFloat(usuario?.consumo_medio_l_100km || consumoMedio) || 6.5)) * 100);

  if (cargando) {
    return (
      <div className="camplink-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: '2.5rem' }}>🚐</span>
        <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Cargando perfil de explorador...</p>
      </div>
    );
  }

  return (
    <div className="camplink-container" style={{ padding: '30px 20px 80px', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
      {/* CABECERA DEL EXPLORADOR: AVATAR, DATOS Y BOTÓN DE CONFIGURACIÓN */}
      <div className="camper-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Avatar Clickeable para editar */}
            <div
              onClick={() => setModalConfigAbierto(true)}
              title="Haz clic para cambiar tu avatar de explorador"
              style={{
                position: 'relative',
                width: '82px',
                height: '82px',
                borderRadius: '50%',
                background: 'var(--accent-forest)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.4rem',
                fontWeight: 800,
                boxShadow: '0 6px 18px rgba(35, 83, 52, 0.35)',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
            >
              {usuario?.avatar ? (
                <img src={usuario.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                usuario?.username?.charAt(0).toUpperCase() || 'E'
              )}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(0,0,0,0.6)',
                padding: '2px 0',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <Camera size={13} color="#fff" />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.85rem', margin: 0, color: 'var(--text-primary)' }}>
                  {formatearUsuario(usuario?.username)}
                </h1>
                <span className="badge-camper badge-forest">
                  {usuario?.tipo_viajero_display || usuario?.tipo_viajero || 'Camper'}
                </span>
                {usuario?.es_admin && <span className="badge-camper badge-earth">Admin</span>}
              </div>

              <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                {usuario?.poblacion && <span>📍 {usuario.poblacion}</span>}
                <span>⛽ {usuario?.capacidad_deposito_l || capacidadDeposito || 60}L ({usuario?.tipo_combustible?.toUpperCase() || 'DIÉSEL'} • ~{autonomiaEstimada} km)</span>
                <span>📅 Miembro desde {new Date(usuario?.date_joined || Date.now()).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => setModalConfigAbierto(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px' }}
          >
            <Sliders size={16} /> Configurar Furgo y Perfil
          </button>
        </div>
      </div>

      {/* BARRA DE PESTAÑAS COMPACTAS (SIN SCROLLBAR LATERAL) */}
      <div style={{
        display: 'flex',
        gap: '6px',
        borderBottom: '2px solid var(--border-color)',
        marginBottom: '26px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setPestañaActiva('viajes')}
          style={{
            padding: '10px 16px',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: pestañaActiva === 'viajes' ? 'var(--accent-forest)' : 'var(--text-secondary)',
            borderBottom: pestañaActiva === 'viajes' ? '3px solid var(--accent-forest)' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Compass size={17} /> Mis Viajes
          <span className="badge-camper badge-forest" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
            {viajes.length}
          </span>
        </button>

        <button
          onClick={() => setPestañaActiva('comunidad')}
          style={{
            padding: '10px 16px',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: pestañaActiva === 'comunidad' ? 'var(--accent-forest)' : 'var(--text-secondary)',
            borderBottom: pestañaActiva === 'comunidad' ? '3px solid var(--accent-forest)' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Users size={17} /> Compañeros y Grupos
          <span className="badge-camper badge-earth" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
            {companeros.length}
          </span>
        </button>

        <button
          onClick={() => setPestañaActiva('guardados')}
          style={{
            padding: '10px 16px',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: pestañaActiva === 'guardados' ? 'var(--accent-forest)' : 'var(--text-secondary)',
            borderBottom: pestañaActiva === 'guardados' ? '3px solid var(--accent-forest)' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Bookmark size={17} /> Lugares Guardados
          <span className="badge-camper badge-forest" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
            {lugaresGuardados.length}
          </span>
        </button>

        <button
          onClick={() => setPestañaActiva('trofeos')}
          style={{
            padding: '10px 16px',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: pestañaActiva === 'trofeos' ? 'var(--accent-forest)' : 'var(--text-secondary)',
            borderBottom: pestañaActiva === 'trofeos' ? '3px solid var(--accent-forest)' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Award size={17} /> Vitrina de Trofeos
          <span className="badge-camper badge-gold" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
            {(Array.isArray(trofeos) ? trofeos : []).filter(c => c.es_oro_completado).length} / 16 Oros
          </span>
        </button>
      </div>

      {/* PESTAÑA 1: MIS VIAJES Y RUTAS (EXPANDIBLES, CON MAPA Y AVISO REPOSTAJE INTELIGENTE) */}
      {pestañaActiva === 'viajes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Historial de rutas y bitácoras de tus pernoctas en furgo o autocaravana.
            </div>
            {alNavegarOrganizar && (
              <button
                className="btn btn-primary btn-sm"
                onClick={alNavegarOrganizar}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Planificar próximas escapadas e itinerarios futuros"
              >
                <Route size={15} /> <span>🗓️ Organizar Viaje Futuro</span>
              </button>
            )}
          </div>

          {viajes.length === 0 ? (
            <div className="camper-card" style={{ padding: '40px', textAlign: 'center' }}>
              <Compass size={40} color="var(--accent-forest)" style={{ marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px' }}>Aún no has registrado viajes</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px', fontSize: '0.9rem' }}>
                Haz check-in en tus lugares de pernocta y el sistema agrupará tus paradas en itinerarios y calculará tu ruta.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(() => {
                const totalPagsViajes = Math.ceil(viajes.length / viajesPorPagina) || 1;
                const viajesPaginados = viajes.slice((paginaViajes - 1) * viajesPorPagina, paginaViajes * viajesPorPagina);

                return (
                  <>
                    {viajesPaginados.map((viaje) => {
                const expandido = !!viajesExpandidos[viaje.id];
                const esPasado = viaje.fecha_fin ? new Date(viaje.fecha_fin) < new Date() : false;
                const paradas = viaje.resumen_ruta || [];
                const puntosMapa = paradas.map(p => [p.lat, p.lng]).filter(coords => coords[0] && coords[1]);
                const centroMiniMapa = puntosMapa.length > 0 ? puntosMapa[0] : [40.4168, -3.7038];

                // Parada de repostaje seleccionada o recomendada
                const paradaRepostajeManual = repostajesManuales[viaje.id];

                return (
                  <div key={viaje.id} className="camper-card" style={{ padding: '24px' }}>
                    {/* Cabecera del Viaje */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        {editandoTituloViajeId === viaje.id ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="text"
                              className="form-control"
                              style={{ maxWidth: '320px', padding: '6px 10px', fontSize: '1.1rem' }}
                              value={nuevoTituloViaje}
                              onChange={(e) => setNuevoTituloViaje(e.target.value)}
                            />
                            <button className="btn btn-primary btn-sm" onClick={() => guardarTituloViaje(viaje.id)}>
                              <Save size={14} /> Guardar
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditandoTituloViajeId(null)}>
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>
                              {viaje.titulo}
                            </h3>
                            <button
                              onClick={() => {
                                setEditandoTituloViajeId(viaje.id);
                                setNuevoTituloViaje(viaje.titulo);
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                              title="Editar nombre del viaje"
                            >
                              <Edit3 size={15} />
                            </button>
                          </div>
                        )}

                        <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          📅 {new Date(viaje.fecha_inicio).toLocaleDateString('es-ES')} 
                          {viaje.fecha_fin && ` - ${new Date(viaje.fecha_fin).toLocaleDateString('es-ES')}`} 
                          {' • '} <strong>{viaje.km_totales} km</strong>
                          {esPasado && <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>(Viaje pasado)</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setViajeSeleccionadoParaPdf(viaje)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <FileText size={15} /> Generar PDF
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => toggleExpandirViaje(viaje.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span>{expandido ? 'Ocultar Detalle' : 'Ver Detalle'}</span>
                          {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* VISTA DETALLADA EXPANDIDA CON MAPA E ITINERARIO */}
                    {expandido && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                        {/* Mini Mapa de la Ruta Trazada */}
                        {puntosMapa.length > 0 && (
                          <div style={{ height: '220px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                            <MapContainer
                              center={centroMiniMapa}
                              zoom={puntosMapa.length === 1 ? 11 : 7}
                              scrollWheelZoom={false}
                              style={{ height: '100%', width: '100%' }}
                            >
                              <TileLayer
                                attribution='&copy; OSM'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              {puntosMapa.length > 1 && (
                                <Polyline positions={puntosMapa} color="var(--accent-forest)" weight={4} dashArray="6, 8" />
                              )}
                              {paradas.map((p, idx) => (
                                <Marker key={idx} position={[p.lat, p.lng]} icon={miniIconoCamper}>
                                  <Popup>
                                    <strong>{idx + 1}. {p.nombre}</strong><br />
                                    {p.poblacion}
                                  </Popup>
                                </Marker>
                              ))}
                            </MapContainer>
                          </div>
                        )}

                        {/* Itinerario con Avisos de Repostaje Inteligentes */}
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                          Itinerario de Paradas:
                        </div>

                        {paradas.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay coordenadas registradas en este itinerario.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(() => {
                              const repostajesViaje = Array.isArray(repostajesManuales[viaje.id]) 
                                ? repostajesManuales[viaje.id] 
                                : (repostajesManuales[viaje.id] !== undefined ? [repostajesManuales[viaje.id]] : []);

                              let kmAcumulados = 0;
                              const distTramo = paradas.length > 1 ? (viaje.km_totales / (paradas.length - 1)) : 0;

                              return paradas.map((p, idx) => {
                                if (idx > 0) kmAcumulados += distTramo;
                                const esRepostadoAqui = repostajesViaje.includes(idx) || p.es_repostaje || p.tipo === 'gasolinera';
                                if (esRepostadoAqui) kmAcumulados = 0;

                                const tocaAvisoAqui = !esPasado && kmAcumulados >= (autonomiaEstimada * 0.75) && idx < paradas.length - 1;

                                return (
                                  <React.Fragment key={idx}>
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 14px',
                                        background: 'var(--bg-primary)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.86rem',
                                        flexWrap: 'wrap',
                                        gap: '8px'
                                      }}
                                    >
                                      <div>
                                        <strong>{idx + 1}. {p.nombre}</strong>
                                        {p.poblacion && <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({p.poblacion})</span>}
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '8px' }}>
                                          [{p.lat != null ? Number(p.lat).toFixed(3) : ''}, {p.lng != null ? Number(p.lng).toFixed(3) : ''}]
                                        </span>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {!esPasado && (
                                          <button
                                            className={`btn ${esRepostadoAqui ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                            style={{ padding: '2px 8px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            onClick={() => marcarRepostajeEnParada(viaje.id, idx)}
                                            title="Indicar que has repostado en este punto para reiniciar el cálculo de autonomía"
                                          >
                                            <Fuel size={12} /> {esRepostadoAqui ? 'Repostado aquí ✔' : 'Marcar repostaje'}
                                          </button>
                                        )}

                                        <button
                                          className="btn btn-secondary btn-sm"
                                          style={{ padding: '2px 8px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                          onClick={() => copiarCoordenadas(p.lat, p.lng, `${viaje.id}-${idx}`)}
                                        >
                                          {copiadoId === `${viaje.id}-${idx}` ? <CheckCheck size={12} color="var(--accent-forest)" /> : <Copy size={12} />}
                                          <span>{copiadoId === `${viaje.id}-${idx}` ? '¡Copiado!' : 'GPS'}</span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* AVISO DE COMBUSTIBLE SITUADO DEBAJO DE LA PARADA RECOMENDADA (SOLO EN VIAJES FUTUROS/EN CURSO) */}
                                    {tocaAvisoAqui && (
                                      <div
                                        style={{
                                          background: 'rgba(217, 119, 6, 0.12)',
                                          borderLeft: '4px solid #D97706',
                                          padding: '10px 14px',
                                          borderRadius: 'var(--radius-sm)',
                                          fontSize: '0.82rem',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          gap: '10px',
                                          color: 'var(--text-secondary)'
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <Fuel size={18} color="#F59E0B" />
                                          <span>
                                            <strong>Parada recomendada para repostar:</strong> Llevas ~{Math.round(kmAcumulados)} km desde la salida/último repostaje (Autonomía estimada: ~{autonomiaEstimada} km). Conviene repostar antes del siguiente tramo.
                                          </span>
                                        </div>

                                        <button
                                          className="btn btn-secondary btn-sm"
                                          style={{ fontSize: '0.72rem', padding: '3px 8px', whiteSpace: 'nowrap' }}
                                          onClick={() => marcarRepostajeEnParada(viaje.id, idx + 1)}
                                        >
                                          Mover al siguiente punto ➡
                                        </button>
                                      </div>
                                    )}
                                  </React.Fragment>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Controles de Paginación de Viajes (10 por página) */}
              {Math.ceil(viajes.length / viajesPorPagina) > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  background: 'var(--bg-glass)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  marginTop: '12px',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setPaginaViajes(prev => Math.max(1, prev - 1)); }}
                    disabled={paginaViajes === 1}
                    style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                  >
                    ◀ Anteriores
                  </button>

                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Página {paginaViajes} de {Math.ceil(viajes.length / viajesPorPagina)} ({viajes.length} viajes registrados)
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setPaginaViajes(prev => Math.min(Math.ceil(viajes.length / viajesPorPagina), prev + 1)); }}
                    disabled={paginaViajes >= Math.ceil(viajes.length / viajesPorPagina)}
                    style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                  >
                    Siguientes ▶
                  </button>
                </div>
              )}
            </>
          );
        })()}
      </div>
    )}
  </div>
)}

      {/* PESTAÑA 2: COMPAÑEROS, SEGUIDORES, SIGUIENDO Y GRUPOS */}
      {pestañaActiva === 'comunidad' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
          
          {/* BANNER DE ADMINISTRACIÓN DJANGO (Solo Administradores) */}
          {(usuario?.es_admin || usuario?.is_staff || usuario?.is_superuser || usuario?.username === 'admin') && (
            <div className="camper-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(35, 83, 52, 0.25) 0%, rgba(15, 23, 42, 0.4) 100%)', border: '1px solid var(--accent-forest)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-forest)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                    🛡️
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700, color: '#FFFFFF' }}>
                      Panel de Administración Django & Base de Datos
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)', margin: '4px 0 0' }}>
                      Gestión avanzada de Usuarios, Grupos, Lugares, Pernoctas, Comentarios, Trofeos y Moderación activa.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a
                    href="http://localhost:8000/admin/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 700, textDecoration: 'none' }}
                  >
                    Abrir Django Admin ↗
                  </a>
                  <a
                    href="http://localhost:8000/admin/exploradores/explorador/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 14px', textDecoration: 'none' }}
                  >
                    Gestionar Usuarios
                  </a>
                  <a
                    href="http://localhost:8000/admin/lugares/lugar/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 14px', textDecoration: 'none' }}
                  >
                    Gestionar Lugares
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Subnavegación de Comunidad: Seguidores | Siguiendo | Descubrir Nómadas | Grupos | Notificaciones */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${tabComunidad === 'seguidores' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTabComunidad('seguidores')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
            >
              <Users size={16} /> Te Siguen ({seguidores.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${tabComunidad === 'siguiendo' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTabComunidad('siguiendo')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
            >
              <UserCheck size={16} /> Sigues ({siguiendo.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${tabComunidad === 'descubrir' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setTabComunidad('descubrir'); cargarTodosLosExploradores(); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
            >
              <Search size={16} /> Descubrir Nómadas ({todosLosExploradores.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${tabComunidad === 'grupos' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTabComunidad('grupos')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
            >
              <Shield size={16} /> Grupos ({grupos.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${tabComunidad === 'notificaciones' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setTabComunidad('notificaciones'); cargarNotificacionesPerfil(); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
            >
              <Bell size={16} /> Centro de Notificaciones ({notificacionesPerfil.length})
            </button>
          </div>

          {/* SECCIÓN 1: EXPLORADORES QUE TE SIGUEN (SEGUIDORES) */}
          {tabComunidad === 'seguidores' && (
            <div className="camper-card" style={{ padding: '26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} color="var(--accent-forest)" /> Exploradores que te Siguen
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    Nómadas que reciben tus vivencias en su feed del Diario de Ruta.
                  </p>
                </div>
                <span className="badge-camper badge-forest">
                  {seguidores.length} Seguidores
                </span>
              </div>

              {seguidores.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)' }}>
                  <Users size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.6 }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
                    Aún no tienes seguidores. Comparte vivencias en el Diario de Ruta y descubre nuevos lugares para conectar con la comunidad.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {seguidores.map((comp) => {
                    const loSigo = siguiendo.some(s => s.id === comp.id);
                    return (
                      <div
                        key={comp.id}
                        className="camper-explorer-card"
                        style={{
                          padding: '18px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '14px',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                      >
                        {/* Parte superior: Avatar, Nombre completo y Detalles */}
                        <div 
                          onClick={() => irAlPerfilCompanero(comp.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                          title={`Ver perfil completo de ${comp.username}`}
                        >
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '50%',
                              background: 'var(--accent-forest)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '1.1rem',
                              flexShrink: 0,
                              boxShadow: '0 2px 8px rgba(35, 83, 52, 0.3)'
                            }}
                          >
                            {comp.username?.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'capitalize', wordBreak: 'break-word', lineHeight: '1.3' }}>
                              {comp.username}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {comp.tipo_viajero_display || comp.tipo_viajero || 'Explorador'} {comp.poblacion ? `• ${comp.poblacion}` : ''}
                            </div>
                          </div>
                        </div>

                        {/* Parte inferior: Botones de Acción Debajo del Nombre */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', padding: '7px 8px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            onClick={() => irAlPerfilCompanero(comp.id)}
                            title="Ver perfil"
                          >
                            <User size={14} /> Ver Perfil
                          </button>
                          <button
                            className={`btn btn-sm ${loSigo ? 'btn-secondary' : 'btn-primary'}`}
                            style={{ width: '100%', padding: '7px 8px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            onClick={() => alternarSeguirCompanero(comp.id)}
                            title={loSigo ? "Compañero de Ruta Mutuo" : "Seguir también"}
                          >
                            {loSigo ? <UserCheck size={14} color="var(--accent-forest)" /> : <UserPlus size={14} />}
                            <span>{loSigo ? 'Siguiendo' : 'Seguir'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECCIÓN 2: EXPLORADORES A LOS QUE SIGUES (SIGUIENDO) */}
          {tabComunidad === 'siguiendo' && (
            <div className="camper-card" style={{ padding: '26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserCheck size={18} color="var(--accent-forest)" /> Exploradores a los que Sigues
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    Tus Compañeros de Ruta con quienes compartes el lore y publicaciones del Diario.
                  </p>
                </div>
                <span className="badge-camper badge-forest">
                  {siguiendo.length} Siguiendo
                </span>
              </div>

              {siguiendo.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)' }}>
                  <UserCheck size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.6 }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
                    Aún no sigues a ningún explorador. Puedes explorar el Diario de Ruta o buscar nómadas por su vehículo y zona.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {siguiendo.map((comp) => (
                    <div
                      key={comp.id}
                      className="camper-explorer-card"
                      style={{
                        padding: '18px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                    >
                      {/* Parte superior: Avatar, Nombre completo y Detalles */}
                      <div 
                        onClick={() => irAlPerfilCompanero(comp.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                        title={`Ver perfil completo de ${comp.username}`}
                      >
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            background: 'var(--accent-forest)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1.1rem',
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(35, 83, 52, 0.3)'
                          }}
                        >
                          {comp.username?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'capitalize', wordBreak: 'break-word', lineHeight: '1.3' }}>
                            {comp.username}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {comp.tipo_viajero_display || comp.tipo_viajero || 'Explorador'} {comp.poblacion ? `• ${comp.poblacion}` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Parte inferior: Botones de Acción Debajo del Nombre */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ width: '100%', padding: '7px 8px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                          onClick={() => irAlPerfilCompanero(comp.id)}
                          title="Ver perfil"
                        >
                          <User size={14} /> Ver Perfil
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ width: '100%', padding: '7px 8px', fontSize: '0.8rem', fontWeight: 600, color: '#D93838', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                          onClick={() => dejarDeSeguir(comp.id)}
                          title="Dejar de seguir"
                        >
                          <UserMinus size={14} /> <span>Dejar de seguir</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

                    {/* SECCIÓN DESCUBRIR Y CONECTAR CON OTROS NÓMADAS */}
          {tabComunidad === 'descubrir' && (
            <div className="camper-card" style={{ padding: '26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={20} color="var(--accent-forest)" /> Descubrir y Conectar con Otros Nómadas
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    Explora toda la comunidad de Camplink, busca por vehículo, ciudad o nombre y conecta en ruta.
                  </p>
                </div>
              </div>

              {/* Barra de Búsqueda y Filtros de Nómadas */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '40px' }}
                    placeholder="Buscar por nombre, usuario, ciudad o provincia..."
                    value={busquedaNomada}
                    onChange={(e) => {
                      setBusquedaNomada(e.target.value);
                      cargarTodosLosExploradores(e.target.value);
                    }}
                  />
                </div>
              </div>

              {cargandoNomadas ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Cargando exploradores nómadas...</div>
              ) : todosLosExploradores.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)' }}>
                  <Users size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.6 }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
                    No se encontraron exploradores con ese criterio de búsqueda.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {todosLosExploradores.map((nomada) => {
                    const loSigo = siguiendo.some(s => s.id === nomada.id);
                    return (
                      <div
                        key={nomada.id}
                        className="camper-explorer-card"
                        style={{
                          padding: '18px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '14px',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                      >
                        <div 
                          onClick={() => irAlPerfilCompanero(nomada.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                          title={`Ver perfil completo de ${nomada.username}`}
                        >
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              background: 'var(--accent-forest)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '1.15rem',
                              flexShrink: 0
                            }}
                          >
                            {nomada.username?.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'capitalize', wordBreak: 'break-word' }}>
                              {nomada.username}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {nomada.tipo_viajero_display || nomada.tipo_viajero || 'Explorador Nómada'} {nomada.poblacion ? `• ${nomada.poblacion}` : ''}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', padding: '7px 8px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            onClick={() => irAlPerfilCompanero(nomada.id)}
                            title="Ver perfil"
                          >
                            <User size={14} /> Ver Perfil
                          </button>
                          <button
                            className={`btn btn-sm ${loSigo ? 'btn-secondary' : 'btn-primary'}`}
                            style={{ width: '100%', padding: '7px 8px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            onClick={() => alternarSeguirCompanero(nomada.id)}
                            title={loSigo ? "Dejar de seguir" : "Seguir"}
                          >
                            {loSigo ? <UserCheck size={14} color="var(--accent-forest)" /> : <UserPlus size={14} />}
                            <span>{loSigo ? 'Siguiendo' : 'Conectar'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECCIÓN CENTRO DE NOTIFICACIONES EN PERFIL */}
          {tabComunidad === 'notificaciones' && (
            <div className="camper-card" style={{ padding: '26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bell size={20} color="var(--accent-forest)" /> Historial de Notificaciones
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    Avisos en vivo de seguidores, comentarios en tus vivencias del Diario, likes y trofeos.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => forzarNotificacionPerfil('reaccion')} style={{ fontSize: '0.76rem' }}>
                    🔥 Probar Like
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => forzarNotificacionPerfil('comentario')} style={{ fontSize: '0.76rem' }}>
                    💬 Probar Comentario
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => forzarNotificacionPerfil('seguimiento')} style={{ fontSize: '0.76rem' }}>
                    🤝 Probar Seguidor
                  </button>
                </div>
              </div>

              {notificacionesPerfil.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)' }}>
                  <Bell size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.6 }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
                    No tienes notificaciones registradas todavía.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {notificacionesPerfil.map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-sm)',
                        background: notif.leida ? 'var(--bg-primary)' : 'rgba(35, 83, 52, 0.12)',
                        border: notif.leida ? '1px solid var(--border-color)' : '1.5px solid var(--accent-forest)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-forest)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                          {notif.tipo === 'seguimiento' ? '🤝' : notif.tipo === 'comentario' ? '💬' : notif.tipo === 'reaccion' ? '🔥' : notif.tipo === 'trofeo' ? '🏆' : 'ℹ️'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                            {notif.titulo}
                          </div>
                          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {notif.mensaje}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {new Date(notif.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* SECCIÓN 3: GRUPOS DE PRIVACIDAD */}
          {tabComunidad === 'grupos' && (
            <div className="camper-card" style={{ padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={18} color="var(--accent-forest)" /> Grupos de Privacidad
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Crea círculos y añade o quita compañeros para compartir vivencias y viajes exclusivos.
                </p>
              </div>
              <span className="badge-camper badge-earth">
                {grupos.length} Grupos
              </span>
            </div>

            {/* Formulario Crear Grupo */}
            <form onSubmit={crearGrupo} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '4px', fontWeight: 600 }}>
                    Nombre del Grupo:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Familia, Amigos 4x4, Montaña..."
                    value={nombreNuevoGrupo}
                    onChange={(e) => setNombreNuevoGrupo(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '4px', fontWeight: 600 }}>
                    Descripción (opcional):
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Salidas camper de fin de semana"
                    value={descNuevoGrupo}
                    onChange={(e) => setDescNuevoGrupo(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-sm" disabled={creandoGrupo}>
                <Plus size={14} /> {creandoGrupo ? 'Creando...' : 'Crear Grupo'}
              </button>
            </form>

            {/* Lista de Grupos con Edición y Gestión de Miembros */}
            {grupos.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>
                Aún no has creado grupos personalizados.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {grupos.map((g) => {
                  const numMiembros = (g.miembros || []).length;

                  return (
                    <div
                      key={g.id}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          👥 {g.nombre}
                          <span className="badge-camper badge-forest" style={{ fontSize: '0.72rem', padding: '1px 6px' }}>
                            {numMiembros} miembro{numMiembros !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {g.descripcion && (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                            {g.descripcion}
                          </div>
                        )}

                        {/* Visualización de nombres de usuario de miembros del grupo */}
                        {g.miembros_detalle && g.miembros_detalle.length > 0 ? (
                          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Miembros:</span>
                            {g.miembros_detalle.map((m) => (
                              <span
                                key={m.id}
                                style={{
                                  fontSize: '0.74rem',
                                  padding: '2px 8px',
                                  borderRadius: 'var(--radius-full)',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-primary)',
                                  fontWeight: 600
                                }}
                              >
                                @{m.username}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                            Sin miembros aún (invita a tus compañeros de ruta).
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => abrirModalMiembros(g)}
                        >
                          <UserPlus size={13} /> Añadir/Quitar Miembros
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setGrupoEditando(g)}
                          title="Editar nombre y descripción"
                        >
                          <Edit3 size={13} /> Editar
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#D93838', padding: '4px 8px' }}
                          onClick={() => eliminarGrupo(g.id)}
                          title="Eliminar grupo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 3: LUGARES GUARDADOS E INSPIRACIÓN (SINCRONIZADO CON DIARIO Y FICHA) */}
      {pestañaActiva === 'guardados' && (
        <div className="camper-card" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bookmark size={18} color="var(--accent-forest)" /> Lugares Guardados e Inspiración
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Pernoctas marcadas con 🌲 Guardado para ir en el Diario de Ruta y guardadas desde las fichas.
              </p>
            </div>
            <span className="badge-camper badge-forest">
              {lugaresGuardados.length} Guardados
            </span>
          </div>

          {lugaresGuardados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '2.5rem' }}>🌲</span>
              <p style={{ marginTop: '10px' }}>
                Aún no tienes lugares guardados. Pulsa <strong>"🌲 Guardado para ir"</strong> en las publicaciones del Diario de Ruta o <strong>"Guardar Lugar (Para ir)"</strong> en cualquier ficha para tenerlos siempre a mano.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {lugaresGuardados.map((lug) => (
                <div
                  key={lug.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {lug.nombre}
                      </h4>
                      <button
                        onClick={() => eliminarLugarGuardado(lug.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        title="Quitar de guardados"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      📍 {lug.poblacion || 'Ruta camper'} {lug.provincia ? `(${lug.provincia})` : ''}
                    </div>

                    {lug.descripcion && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: '1.4', maxHeight: '48px', overflow: 'hidden' }}>
                        {lug.descripcion}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    {lug.id && typeof lug.id === 'number' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: '0.78rem' }}
                        onClick={() => alSeleccionarLugar && alSeleccionarLugar(lug.id)}
                      >
                        Ver Ficha
                      </button>
                    )}
                    {lug.latitud && lug.longitud && (
                      <a
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', textDecoration: 'none' }}
                        href={`https://www.google.com/maps/dir/?api=1&destination=${lug.latitud},${lug.longitud}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation size={12} /> Ir
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 4: VITRINA DE TROFEOS OPTIMIZADA (1 TARJETA POR CATEGORÍA + PLATINO) */}
      {pestañaActiva === 'trofeos' && (
        <div className="camper-card" style={{ padding: '28px' }}>
          {/* Cabecera de Vitrina */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={22} color="var(--accent-gold)" /> Vitrina de Logros Nómadas
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                16 categorías temáticas. Avanza de Madera a Oro para conquistar el Trofeo Platino.
              </p>
            </div>
            <span className="badge-camper badge-gold">
              {(Array.isArray(trofeos) ? trofeos : []).filter(c => c.es_oro_completado).length} de 16 Oros Completados
            </span>
          </div>

          {/* Panel Destacado Platino */}
          {platinoData && (
            <div style={{
              padding: '20px 24px',
              borderRadius: 'var(--radius-md)',
              background: platinoData.desbloqueado ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(242, 169, 0, 0.15))' : 'rgba(255, 255, 255, 0.02)',
              border: platinoData.desbloqueado ? '2px solid #00E5FF' : '1px solid var(--border-color)',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '260px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: platinoData.desbloqueado ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${platinoData.desbloqueado ? '#00E5FF' : 'var(--border-color)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  flexShrink: 0
                }}>
                  👑
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: platinoData.desbloqueado ? '#00E5FF' : 'var(--text-primary)' }}>
                      {platinoData.nombre}
                    </h3>
                    <span className="badge-camper" style={{ fontSize: '0.7rem' }}>
                      {platinoData.desbloqueado ? 'CONSEGUIDO' : 'TROFEO PLATINO'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '3px 0 8px' }}>
                    {platinoData.descripcion}
                  </p>
                  <div style={{ maxWidth: '360px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 700, marginBottom: '3px' }}>
                      <span>Oros requeridos: {platinoData.oros_conseguidos} / {platinoData.oros_totales}</span>
                      <span>{platinoData.porcentaje_progreso}%</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${platinoData.porcentaje_progreso}%`,
                        background: 'linear-gradient(90deg, #F2A900, #00E5FF)',
                        borderRadius: '999px'
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 16 Tarjetas de Categorías */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {(Array.isArray(trofeos) ? trofeos : []).map((cat) => {
              const medalla = cat.medalla_maxima;
              const tieneAlguna = !!medalla;
              const emojiMedalla = medalla === 'oro' ? '🥇' : medalla === 'plata' ? '🥈' : medalla === 'bronce' ? '🥉' : medalla === 'madera' ? '🪵' : '🔒';
              const colorMedalla = medalla === 'oro' ? '#F2A900' : medalla === 'plata' ? '#A8A9AD' : medalla === 'bronce' ? '#CD7F32' : medalla === 'madera' ? '#8B5A2B' : 'var(--text-muted)';
              const bgMedalla = tieneAlguna ? `${colorMedalla}22` : 'rgba(255, 255, 255, 0.02)';

              return (
                <div
                  key={cat.codigo}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: tieneAlguna ? 'var(--bg-glass)' : 'rgba(255, 255, 255, 0.02)',
                    border: cat.es_oro_completado ? '2px solid #F2A900' : tieneAlguna ? `1px solid ${colorMedalla}` : '1px dashed var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    opacity: tieneAlguna ? 1 : 0.7
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: bgMedalla,
                          border: `1px solid ${colorMedalla}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                          flexShrink: 0
                        }}>
                          {emojiMedalla}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800 }}>{cat.nombre}</h4>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{cat.descripcion}</span>
                        </div>
                      </div>
                      <span className="badge-camper" style={{ background: bgMedalla, color: colorMedalla, fontSize: '0.72rem', fontWeight: 700 }}>
                        {cat.es_oro_completado ? 'Oro Máximo' : tieneAlguna ? medalla.toUpperCase() : 'Bloqueado'}
                      </span>
                    </div>

                    {/* Mini barra de 4 niveles */}
                    {cat.niveles && (
                      <div style={{ display: 'flex', gap: '3px', marginBottom: '12px' }}>
                        {cat.niveles.map(niv => (
                          <div
                            key={niv.nivel}
                            title={`${niv.nivel.toUpperCase()}: ${niv.umbral} ${cat.unidad} (${niv.desbloqueado ? 'Conseguido' : 'Pendiente'})`}
                            style={{
                              flex: 1,
                              height: '5px',
                              borderRadius: '2px',
                              background: niv.desbloqueado ? colorMedalla : 'var(--border-color)',
                              opacity: niv.desbloqueado ? 1 : 0.3
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 700, marginBottom: '4px' }}>
                      <span style={{ color: cat.es_oro_completado ? '#F2A900' : 'var(--text-primary)' }}>
                        {cat.es_oro_completado ? 'Nivel Máximo Completado' : `Hacia ${cat.siguiente_medalla?.toUpperCase()}`}
                      </span>
                      <span>{cat.porcentaje_progreso}%</span>
                    </div>
                    <div style={{ height: '7px', background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden', marginBottom: '6px' }}>
                      <div style={{
                        height: '100%',
                        width: `${cat.porcentaje_progreso}%`,
                        background: cat.es_oro_completado ? '#F2A900' : 'linear-gradient(90deg, var(--accent-forest), var(--accent-earth))',
                        borderRadius: '999px'
                      }} />
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      {cat.texto_progreso}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: CONFIGURAR FURGO, COMBUSTIBLE, AVATAR Y DIRECCIÓN */}
      {modalConfigAbierto && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div className="camper-card" style={{
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            position: 'relative'
          }}>
            <button
              onClick={() => setModalConfigAbierto(false)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.35rem', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={20} color="var(--accent-forest)" /> Configurar Furgo y Perfil
            </h2>

            <form onSubmit={guardarCambiosPerfil}>
              {/* SECCIÓN 1: AVATAR */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '18px'
              }}>
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'var(--accent-forest)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 800,
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {previewAvatar ? (
                    <img src={previewAvatar} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    usuario?.username?.charAt(0).toUpperCase() || 'E'
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>
                    Foto de Perfil / Avatar:
                  </label>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Camera size={14} /> Subir Foto de Perfil
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={manejarCambioAvatar} />
                  </label>
                </div>
              </div>

              {/* SECCIÓN 2: VEHÍCULO Y COMBUSTIBLE */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
                    Tipo de Vehículo:
                  </label>
                  <select
                    className="form-control"
                    value={tipoViajero}
                    onChange={(e) => setTipoViajero(e.target.value)}
                  >
                    <option value="camper">Furgoneta Camper</option>
                    <option value="autocaravana">Autocaravana</option>
                    <option value="acampada">Tienda / 4x4 Overlanding</option>
                  </select>
                </div>

                {/* SELECTOR DE TIPO DE COMBUSTIBLE */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
                    ⛽ Tipo de Carburante:
                  </label>
                  <select
                    className="form-control"
                    value={tipoCombustible}
                    onChange={(e) => setTipoCombustible(e.target.value)}
                  >
                    <option value="gasoleo_a">Diésel / Gasóleo A</option>
                    <option value="gasolina_95">Gasolina 95 E5</option>
                    <option value="gasolina_98">Gasolina 98 E5</option>
                    <option value="glp">GLP / Autogás</option>
                  </select>
                </div>

                {/* CÓDIGO POSTAL Y POBLACIÓN BASE */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
                      Código Postal:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: 28001"
                      maxLength="5"
                      value={codigoPostal}
                      onChange={(e) => manejarCambioCodigoPostal(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
                      Población Base:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Población o Municipio..."
                      value={poblacion}
                      onChange={(e) => setPoblacion(e.target.value)}
                    />
                  </div>
                </div>

                {/* DIRECCIÓN CON AUTOCOMPLETADO Y COORDENADAS VÁLIDAS */}
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
                    Dirección Base Completa (Opcional si indicas CP):
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Escribe ciudad, calle o pueblo..."
                    value={direccionBase}
                    onChange={(e) => buscarSugerenciasDireccion(e.target.value)}
                  />
                  {buscandoDireccion && (
                    <span style={{ position: 'absolute', right: '12px', top: '34px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Buscando...
                    </span>
                  )}

                  {sugerenciasDireccion.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%', left: 0, right: 0,
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 1200,
                      maxHeight: '180px',
                      overflowY: 'auto'
                    }}>
                      {sugerenciasDireccion.map((sug, idx) => (
                        <div
                          key={idx}
                          onClick={() => seleccionarSugerencia(sug)}
                          style={{
                            padding: '8px 12px',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border-color)',
                            color: 'var(--text-primary)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          📍 {sug.etiqueta}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
                    Capacidad Depósito (L):
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="20"
                    max="300"
                    className="form-control"
                    value={capacidadDeposito}
                    onChange={(e) => setCapacidadDeposito(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
                    Consumo Medio (L/100km):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="30"
                    className="form-control"
                    value={consumoMedio}
                    onChange={(e) => setConsumoMedio(e.target.value)}
                  />
                </div>
              </div>

              {/* Previsualización de Autonomía */}
              <div style={{
                background: 'rgba(35, 83, 52, 0.08)',
                border: '1px solid var(--accent-forest)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.84rem'
              }}>
                <div>
                  <strong>Autonomía Estimada:</strong> ~{autonomiaEstimada} km ({(tipoCombustible || 'gasoleo_a').toUpperCase().replace('_', ' ')})
                </div>
                <span className="badge-camper badge-forest">
                  Aviso repostaje en viajes &gt; {Math.round(autonomiaEstimada * 0.75)} km
                </span>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
                  Biografía Camper:
                </label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Cuéntanos sobre tus rutas favoritas, equipamiento..."
                  value={biografia}
                  onChange={(e) => setBiografia(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setModalConfigAbierto(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={guardandoPerfil}
                >
                  {guardandoPerfil ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GESTIONAR MIEMBROS DE UN GRUPO */}
      {modalMiembrosGrupo && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1150,
          padding: '20px'
        }}>
          <div className="camper-card" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                👥 Miembros de "{modalMiembrosGrupo.nombre}"
              </h3>
              <button className="btn-icon" onClick={() => setModalMiembrosGrupo(null)}><X size={18} /></button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 14px' }}>
              Selecciona los compañeros de ruta que pertenecerán a este grupo:
            </p>

            {companeros.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', fontStyle: 'italic' }}>
                Aún no tienes compañeros de ruta para añadir.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', marginBottom: '18px' }}>
                {companeros.map((comp) => {
                  const seleccionado = miembrosSeleccionados.includes(comp.id);

                  return (
                    <label
                      key={comp.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: seleccionado ? 'rgba(35, 83, 52, 0.15)' : 'var(--bg-primary)',
                        border: seleccionado ? '1px solid var(--accent-forest)' : '1px solid var(--border-color)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={seleccionado}
                          onChange={() => alternarMiembroSeleccionado(comp.id)}
                        />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{comp.username}</span>
                        {comp.poblacion && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({comp.poblacion})</span>}
                      </div>

                      <span style={{ fontSize: '0.78rem', color: 'var(--accent-forest)' }}>
                        {seleccionado ? '✔ Miembro' : 'Añadir'}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalMiembrosGrupo(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary btn-sm" onClick={guardarMiembrosGrupo}>
                Guardar Miembros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDITAR NOMBRE Y DESCRIPCIÓN DE GRUPO */}
      {grupoEditando && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1150,
          padding: '20px'
        }}>
          <div className="camper-card" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Editar Grupo</h3>
              <button className="btn-icon" onClick={() => setGrupoEditando(null)}><X size={18} /></button>
            </div>

            <form onSubmit={guardarEdicionGrupo}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
                  Nombre del Grupo:
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={grupoEditando.nombre}
                  onChange={(e) => setGrupoEditando({ ...grupoEditando, nombre: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
                  Descripción:
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={grupoEditando.descripcion || ''}
                  onChange={(e) => setGrupoEditando({ ...grupoEditando, descripcion: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setGrupoEditando(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: VIAJE PARA PDF */}
      {viajeSeleccionadoParaPdf && (
        <ModalViajeDetallePdf
          viaje={viajeSeleccionadoParaPdf}
          alCerrar={() => setViajeSeleccionadoParaPdf(null)}
          alSeleccionarLugar={alSeleccionarLugar}
        />
      )}
    </div>
  );
}
