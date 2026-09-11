import { comprimirImagen } from '../utils/imageCompressor';
import React, { useState, useEffect } from 'react';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Send, Image, MessageSquare, MapPin,
  Globe, Users, Lock, Search, UserPlus,
  UserCheck, User, Compass, Sparkles, Shield,
  X, Filter, Flame, AlertTriangle, Heart, Share2, Check, Edit3, Trash2
} from 'lucide-react';

const formatearUsuario = (u) => {
  if (!u) return '';
  const s = String(u);
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

export default function DiarioDeRuta({ alSeleccionarLugar, alVerPerfilUsuario, abrirTutorial }) {
  const { usuario } = useAuth();
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [nuevoTexto, setNuevoTexto] = useState('');
  const [foto, setFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [opcionPrivacidad, setOpcionPrivacidad] = useState('publico');
  const [gruposUsuario, setGruposUsuario] = useState([]);
  const [publicando, setPublicando] = useState(false);

  const [editandoPostId, setEditandoPostId] = useState(null);
  const [textoEditadoPost, setTextoEditadoPost] = useState('');
  const [guardandoEdicionPost, setGuardandoEdicionPost] = useState(false);

  const [checkinReciente, setCheckinReciente] = useState(null);
  const [lugarSeleccionado, setLugarSeleccionado] = useState(null);
  const [lugaresDisponibles, setLugaresDisponibles] = useState([]);
  const [mostrarSelectorLugar, setMostrarSelectorLugar] = useState(false);
  const [busquedaLugar, setBusquedaLugar] = useState('');
  const [compartidoId, setCompartidoId] = useState(null);

  const [filtroFeed, setFiltroFeed] = useState('todos');
  const [toastCopiado, setToastCopiado] = useState(null);

  const copiarAlPortapapeles = (url, mensaje) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setToastCopiado(mensaje);
        setTimeout(() => setToastCopiado(null), 3000);
      }).catch(() => {
        prompt('Copia este enlace directo:', url);
      });
    } else {
      prompt('Copia este enlace directo:', url);
    }
  };

  const compartirPublicacion = (pubId) => {
    const url = `${window.location.origin}/diario?post=${pubId}`;
    copiarAlPortapapeles(url, '¡Enlace a la publicación copiado al portapapeles! 📋');
  };

  const compartirComentario = (pubId, comId) => {
    const url = `${window.location.origin}/diario?post=${pubId}&comentario=${comId}`;
    copiarAlPortapapeles(url, '¡Enlace al comentario copiado al portapapeles! 📋');
  };

  // Efecto para saltar directamente a la publicación o comentario compartido mediante la URL
  const saltarAPostOComentario = () => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('post');
    const comId = params.get('comentario');

    if (!postId && !comId) return;

    // Asegurar que el filtro muestre todas las publicaciones
    setFiltroFeed('todos');

    if (postId && comId) {
      setComentariosAbiertos(prev => ({ ...prev, [postId]: true }));
      // Calcular página del comentario en caso de existir paginación
      const pubObj = publicaciones.find(p => String(p.id) === String(postId));
      if (pubObj && pubObj.comentarios) {
        const idx = pubObj.comentarios.findIndex(c => String(c.id) === String(comId));
        if (idx !== -1) {
          const paginaDestino = Math.floor(idx / 20) + 1;
          setPaginaComentarios(prev => ({ ...prev, [postId]: paginaDestino }));
        }
      }

      let intentos = 0;
      const intervalo = setInterval(() => {
        intentos++;
        const el = document.getElementById(`comentario-${comId}`);
        if (el) {
          clearInterval(intervalo);
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('comentario-resaltado');
          setTimeout(() => el.classList.remove('comentario-resaltado'), 4000);
        } else if (intentos >= 15) {
          clearInterval(intervalo);
          const postEl = document.getElementById(`post-${postId}`);
          if (postEl) postEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    } else if (postId) {
      let intentos = 0;
      const intervalo = setInterval(() => {
        intentos++;
        const el = document.getElementById(`post-${postId}`);
        if (el) {
          clearInterval(intervalo);
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('post-resaltado');
          setTimeout(() => el.classList.remove('post-resaltado'), 4000);
        } else if (intentos >= 15) {
          clearInterval(intervalo);
        }
      }, 150);
    }
  };

  useEffect(() => {
    if (!cargando && publicaciones.length > 0) {
      saltarAPostOComentario();
    }
  }, [cargando, publicaciones]);

  useEffect(() => {
    window.addEventListener('popstate', saltarAPostOComentario);
    return () => window.removeEventListener('popstate', saltarAPostOComentario);
  }, [publicaciones]);


  const [comentariosAbiertos, setComentariosAbiertos] = useState({});
  const [textoComentario, setTextoComentario] = useState({});
  const [paginaComentarios, setPaginaComentarios] = useState({}); // { [pubId]: pageNumber }
  const [editandoComentarioId, setEditandoComentarioId] = useState(null);
  const [textoEditandoComentario, setTextoEditandoComentario] = useState('');

  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscandoExploradores, setBuscandoExploradores] = useState(false);
  const [mostrarBuscador, setMostrarBuscador] = useState(false);

  const cargarPublicaciones = async () => {
    setCargando(true);
    try {
      const data = await peticionApi('/api/diario/publicaciones/');
      const lista = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      setPublicaciones(lista);
    } catch (err) {
      console.error('Error al cargar publicaciones del diario:', err);
    } finally {
      setCargando(false);
    }
  };

  const cargarGrupos = async () => {
    if (!usuario) return;
    try {
      const data = await peticionApi('/api/exploradores/grupos/');
      const lista = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      setGruposUsuario(lista);
    } catch (err) {
      console.error('Error al cargar grupos:', err);
    }
  };

  const cargarCheckinReciente = async () => {
    if (!usuario) return;
    try {
      const data = await peticionApi('/api/diario/checkins/reciente-24h/');
      if (data && data.lugar_detalle) {
        setCheckinReciente(data);
        setLugarSeleccionado(data.lugar_detalle);
      }
    } catch (e) {
      console.warn('No hay check‑in reciente <24h:', e);
    }
  };

  const cargarLugaresDisponibles = async () => {
    try {
      const data = await peticionApi('/api/lugares/puntos/');
      const lista = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      setLugaresDisponibles(lista);
    } catch (e) {
      console.error('Error al cargar lugares disponibles:', e);
    }
  };

  useEffect(() => {
    cargarPublicaciones();
    cargarLugaresDisponibles();
    if (usuario) {
      cargarGrupos();
      cargarCheckinReciente();
    }
  }, [usuario]);

  const manejarSeleccionFoto = async (archivo) => {
    if (archivo) {
      const archivoComprimido = await comprimirImagen(archivo, { maxAncho: 1600, maxAlto: 1600, calidad: 0.82 });
      setFoto(archivoComprimido);
      setPreviewFoto(URL.createObjectURL(archivoComprimido));
    } else {
      setFoto(null);
      setPreviewFoto(null);
    }
  };

  const descartarFoto = () => {
    if (previewFoto) URL.revokeObjectURL(previewFoto);
    setFoto(null);
    setPreviewFoto(null);
  };

  const buscarExploradores = async (query) => {
    setTerminoBusqueda(query);
    if (!query.trim()) {
      setResultadosBusqueda([]);
      return;
    }
    setBuscandoExploradores(true);
    try {
      const data = await peticionApi(`/api/exploradores/lista/?q=${encodeURIComponent(query)}`);
      const lista = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      setResultadosBusqueda(lista);
    } catch (err) {
      console.error('Error al buscar exploradores:', err);
    } finally {
      setBuscandoExploradores(false);
    }
  };

  // ---------- EDIT / DELETE LOGIC ----------
  const iniciarEdicionPost = (pub) => {
    setEditandoPostId(pub.id);
    setTextoEditadoPost(pub.contenido);
  };

  const guardarEdicionPost = async (pubId) => {
    if (!textoEditadoPost.trim()) return;
    setGuardandoEdicionPost(true);
    try {
      const res = await peticionApi(`/api/diario/publicaciones/${pubId}/`, {
        method: 'PATCH',
        body: { contenido: textoEditadoPost.trim() }
      });
      setPublicaciones(prev => prev.map(p => p.id === pubId ? { ...p, contenido: res.contenido || textoEditadoPost.trim() } : p));
      setEditandoPostId(null);
    } catch (err) {
      alert('No se pudo actualizar la publicación.');
    } finally {
      setGuardandoEdicionPost(false);
    }
  };

  const eliminarPost = async (pubId) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta publicación del Diario?')) return;
    try {
      await peticionApi(`/api/diario/publicaciones/${pubId}/`, { method: 'DELETE' });
      setPublicaciones(prev => prev.filter(p => p.id !== pubId));
    } catch (err) {
      alert('No se pudo eliminar la publicación.');
    }
  };
  // ------------------------------------------

  const alternarSeguirUsuarioEnBusqueda = async (userId) => {
    if (!usuario) {
      alert('Inicia sesión para conectar con compañeros de ruta.');
      return;
    }
    try {
      const res = await peticionApi(`/api/exploradores/seguir/${userId}/`, { method: 'POST' });
      setResultadosBusqueda(prev =>
        prev.map(u => u.id === userId ? { ...u, estado_seguimiento: res.estado } : u)
      );
    } catch (err) {
      console.error('Error al conectar compañero:', err);
    }
  };

  const manejarPublicar = async (e) => {
    e.preventDefault();
    if (!nuevoTexto.trim() && !foto) return;
    setPublicando(true);
    try {
      let visibilidad = opcionPrivacidad;
      let grupoPrivadoId = null;
      if (opcionPrivacidad.startsWith('grupo_')) {
        visibilidad = 'grupo_privado';
        grupoPrivadoId = opcionPrivacidad.replace('grupo_', '');
      }
      let body;
      if (foto) {
        body = new FormData();
        body.append('contenido', nuevoTexto);
        body.append('visibilidad', visibilidad);
        if (grupoPrivadoId) body.append('grupo_privado', grupoPrivadoId);
        if (lugarSeleccionado) body.append('lugar', lugarSeleccionado.id);
        body.append('imagen', foto);
      } else {
        body = {
          contenido: nuevoTexto,
          visibilidad,
          ...(grupoPrivadoId ? { grupo_privado: grupoPrivadoId } : {}),
          ...(lugarSeleccionado ? { lugar: lugarSeleccionado.id } : {})
        };
      }
      await peticionApi('/api/diario/publicaciones/', { method: 'POST', body });
      setNuevoTexto('');
      descartarFoto();
      await cargarPublicaciones();
    } catch (err) {
      console.error('Error al publicar:', err);
      alert('No se pudo compartir la publicación.');
    } finally {
      setPublicando(false);
    }
  };

  const reaccionarAPublicacion = async (pubId, tipo) => {
    if (!usuario) {
      alert('Inicia sesión para reaccionar a las vivencias del diario.');
      return;
    }
    try {
      const respuesta = await peticionApi(`/api/diario/publicaciones/${pubId}/reaccionar/`, { method: 'POST', body: { tipo } });
      setPublicaciones(prev =>
        prev.map(p => p.id === pubId ? { ...p, reacciones_resumen: respuesta.reacciones_resumen, mis_reacciones: respuesta.mis_reacciones } : p)
      );
    } catch (err) {
      console.error('Error al reaccionar:', err);
    }
  };

  const enviarComentario = async (pubId) => {
    const texto = textoComentario[pubId];
    if (!texto || !texto.trim()) return;
    try {
      const comentarioCreado = await peticionApi(`/api/diario/publicaciones/${pubId}/comentar/`, { method: 'POST', body: { texto: texto.trim() } });
      setPublicaciones(prev => prev.map(p => {
        if (p.id === pubId) {
          return { ...p, total_comentarios: (p.total_comentarios || 0) + 1, comentarios: [...(p.comentarios || []), comentarioCreado] };
        }
        return p;
      }));
      setTextoComentario(prev => ({ ...prev, [pubId]: '' }));
    } catch (err) {
      console.error('Error al comentar:', err);
      alert('Error al enviar el comentario.');
    }
  };

    const eliminarComentario = async (pubId, comId) => {
    if (!confirm('¿Seguro que deseas eliminar este comentario?')) return;
    try {
      await peticionApi(`/api/diario/comentarios/${comId}/`, { method: 'DELETE' });
      setPublicaciones(prev => prev.map(p => {
        if (p.id === pubId) {
          const actualizados = (p.comentarios || []).filter(c => c.id !== comId);
          return {
            ...p,
            comentarios: actualizados,
            total_comentarios: Math.max(0, (p.total_comentarios || 1) - 1)
          };
        }
        return p;
      }));
    } catch (err) {
      console.error('Error al eliminar comentario:', err);
      alert('No se pudo eliminar el comentario.');
    }
  };

  const iniciarEdicionComentario = (com) => {
    setEditandoComentarioId(com.id);
    setTextoEditandoComentario(com.texto || '');
  };

  const guardarEdicionComentario = async (pubId, comId) => {
    if (!textoEditandoComentario.trim()) return;
    try {
      const resp = await peticionApi(`/api/diario/comentarios/${comId}/`, {
        method: 'PATCH',
        body: { texto: textoEditandoComentario.trim() }
      });
      setPublicaciones(prev => prev.map(p => {
        if (p.id === pubId) {
          const actualizados = (p.comentarios || []).map(c => c.id === comId ? { ...c, texto: resp.texto || textoEditandoComentario.trim() } : c);
          return { ...p, comentarios: actualizados };
        }
        return p;
      }));
      setEditandoComentarioId(null);
      setTextoEditandoComentario('');
    } catch (err) {
      console.error('Error al editar comentario:', err);
      alert('No se pudo guardar la edición del comentario.');
    }
  };

  const cambiarPaginaComentarios = (pubId, nuevaPag) => {
    setPaginaComentarios(prev => ({ ...prev, [pubId]: nuevaPag }));
  };

  const toggleComentarios = (pubId) => {
    setComentariosAbiertos(prev => ({ ...prev, [pubId]: !prev[pubId] }));
  };

  const irAlPerfil = (autorId) => {
    if (alVerPerfilUsuario && autorId) alVerPerfilUsuario(autorId);
  };

  const listaPubs = Array.isArray(publicaciones) ? publicaciones : [];
  const publicacionesFiltradas = listaPubs.filter(pub => {
    if (!pub) return false;
    const autorId = pub.autor_detalle?.id || pub.autor;
    if (filtroFeed === 'mis_posts') return usuario && autorId === usuario.id;
    if (filtroFeed === 'companeros') return pub.visibilidad === 'seguidores' || pub.visibilidad === 'grupo_privado';
    return true;
  });

  return (
    <div className="camplink-container" style={{ padding: '30px 20px 80px', maxWidth: '780px', width: '100%', margin: '0 auto' }}>
      {/* Cabecera y buscador */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', margin: 0 }}>Diario de Ruta</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.92rem' }}>
            Vivencias camper, rutas compartidas y consejos de la comunidad en tiempo real.
          </p>
        </div>
        <button className={`btn ${mostrarBuscador ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setMostrarBuscador(!mostrarBuscador)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={15} />
            <span>{mostrarBuscador ? 'Ocultar Buscador' : 'Buscar Compañeros de Ruta'}</span>
          </button>
      </div>

      {/* Buscador de exploradores */}
      {mostrarBuscador && (
        <div className="camper-card" style={{ padding: '20px', marginBottom: '28px', border: '2px solid var(--accent-forest)' }}>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--accent-forest)" /> Descubrir y Conectar con otros Nómadas
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 14px' }}>
            Encuentra compañeros de ruta por apodo, nombre o población para ver sus perfiles públicos y trofeos.
          </p>
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <input type="text" className="form-control"
                   placeholder="Buscar por usuario, nombre o población (ej: laura, carlos, zaragoza)..."
                   value={terminoBusqueda}
                   onChange={e => buscarExploradores(e.target.value)}
                   style={{ paddingLeft: '38px' }} />
            <Search size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          {buscandoExploradores && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>Buscando exploradores en el mapa...</div>
          )}
          {!buscandoExploradores && terminoBusqueda && resultadosBusqueda.length === 0 && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>No se encontraron exploradores para "{terminoBusqueda}".</div>
          )}
          {resultadosBusqueda.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
              {resultadosBusqueda.map(exp => {
                const esYo = usuario && usuario.id === exp.id;
                const loSigo = exp.estado_seguimiento === 'aceptada';
                return (
                  <div key={exp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--accent-forest)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>{exp.username ? exp.username.charAt(0).toUpperCase() : 'E'}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{formatearUsuario(exp.username)}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{exp.tipo_viajero_display || exp.tipo_viajero}{exp.poblacion ? ` • ${exp.poblacion}` : ''}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => irAlPerfil(exp.id)}>Ver Perfil</button>
                      {!esYo && usuario && (
                        <button className={`btn ${loSigo ? 'btn-secondary' : 'btn-primary'} btn-sm`} style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => alternarSeguirUsuarioEnBusqueda(exp.id)}>
                          {loSigo ? <UserCheck size={13} /> : <UserPlus size={13} />}
                          <span>{loSigo ? 'Compañero' : 'Conectar'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Formulario de publicación */}
      {usuario ? (
        <div className="camper-card" style={{ padding: '24px', marginBottom: '28px' }}>
          <form onSubmit={manejarPublicar}>
            <textarea className="form-control" rows="3"
                      placeholder={`¿Qué ruta estás recorriendo hoy, ${formatearUsuario(usuario.username)}? Comparte recomendaciones, fotos o trucos con la comunidad...`}
                      value={nuevoTexto}
                      onChange={e => setNuevoTexto(e.target.value)}
                      required />
            {previewFoto && (
              <div style={{ position: 'relative', marginTop: '12px', display: 'inline-block', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <img loading="lazy" decoding="async" src={previewFoto} alt="Vista previa de foto" style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'cover', display: 'block' }} />
                <button type="button" onClick={descartarFoto}
                        style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Eliminar foto"><X size={16} /></button>
              </div>
            )}
            <div style={{ marginTop: '12px' }}>
              {lugarSeleccionado ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: checkinReciente && checkinReciente.lugar_detalle?.id === lugarSeleccionado.id ? 'rgba(35, 83, 52, 0.15)' : 'var(--bg-surface)', border: '1px solid var(--border-color)', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} color="var(--accent-forest)" />
                    <span>Publicando desde: <strong>{lugarSeleccionado.nombre}</strong>{lugarSeleccionado.poblacion && ` (${lugarSeleccionado.poblacion})`}{checkinReciente && checkinReciente.lugar_detalle?.id === lugarSeleccionado.id && (
                      <span style={{ marginLeft: '6px', fontSize: '0.72rem', background: 'var(--accent-forest)', color: '#fff', padding: '2px 6px', borderRadius: 'var(--radius-full)' }}>Pernocta &lt; 24h</span>
                    )}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" onClick={() => setMostrarSelectorLugar(!mostrarSelectorLugar)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-forest)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}>Cambiar</button>
                    <button type="button" onClick={() => setLugarSeleccionado(null)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }} title="Quitar ubicación"><X size={14} /></button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setMostrarSelectorLugar(!mostrarSelectorLugar)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.82rem', cursor: 'pointer' }}><MapPin size={14} /> <span>📍 Añadir ubicación o pernocta a este post</span></button>
              )}
              {mostrarSelectorLugar && (
                <div style={{ marginTop: '8px', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-glass)' }}>
                  <input type="text" className="form-control" placeholder="Buscar lugar de pernocta cercano..."
                         value={busquedaLugar} onChange={e => setBusquedaLugar(e.target.value)}
                         style={{ marginBottom: '8px', fontSize: '0.82rem', padding: '6px 10px' }} />
                  <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {lugaresDisponibles.filter(l => !busquedaLugar.trim() || (l.nombre && l.nombre.toLowerCase().includes(busquedaLugar.toLowerCase())) || (l.poblacion && l.poblacion.toLowerCase().includes(busquedaLugar.toLowerCase()))).slice(0,15).map(l => (
                      <div key={l.id} onClick={() => { setLugarSeleccionado(l); setMostrarSelectorLugar(false); setBusquedaLugar(''); }}
                           style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: lugarSeleccionado?.id === l.id ? 'rgba(35, 83, 52, 0.15)' : 'transparent' }}>
                        <span><strong>{l.nombre}</strong> {l.poblacion ? `(${l.poblacion})` : ''}</span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{l.provincia || ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <Image size={15} /> {foto ? 'Cambiar Foto' : 'Añadir Foto'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => manejarSeleccionFoto(e.target.files[0] || null)} />
                </label>
                <select className="form-control" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.84rem' }} value={opcionPrivacidad} onChange={e => setOpcionPrivacidad(e.target.value)}>
                  <option value="publico">🌍 Público (Toda la Comunidad)</option>
                  <option value="seguidores">🤝 Solo Compañeros de Ruta</option>
                  <option value="privado">🔒 Privado (Solo para mí)</option>
                  {gruposUsuario.map(g => (<option key={g.id} value={`grupo_${g.id}`}>👥 Grupo: {g.nombre}</option>))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={publicando}>
                <Send size={15} /> {publicando ? 'Publicando...' : 'Publicar en el Diario'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="camper-card" style={{ textAlign: 'center', padding: '24px', marginBottom: '30px' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Inicia sesión para compartir tus rutas, subir fotos y comentar con la comunidad de exploradores.</p>
        </div>
      )}

      {/* Filtros rápidos */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button className={`btn btn-sm ${filtroFeed === 'todos' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.82rem', padding: '6px 14px' }} onClick={() => setFiltroFeed('todos')}>🌍 Todo el Diario</button>
        {usuario && (
          <>
            <button className={`btn btn-sm ${filtroFeed === 'companeros' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.82rem', padding: '6px 14px' }} onClick={() => setFiltroFeed('companeros')}>🤝 Compañeros de Ruta</button>
            <button className={`btn btn-sm ${filtroFeed === 'mis_posts' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.82rem', padding: '6px 14px' }} onClick={() => setFiltroFeed('mis_posts')}>🚐 Mis Publicaciones</button>
          </>
        )}
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando vivencias del Diario de Ruta...</div>
      ) : publicacionesFiltradas.length === 0 ? (
        <div className="camper-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          {filtroFeed === 'mis_posts' ? 'Aún no has compartido publicaciones en tu diario. ¡Anímate a contar tu última ruta!' : filtroFeed === 'companeros' ? 'No hay publicaciones de tus compañeros de ruta todavía.' : 'No hay publicaciones todavía. ¡Sé el primero en compartir tu aventura!'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {publicacionesFiltradas.map(pub => {
            const autorId = pub.autor_detalle?.id || pub.autor;
            const autorNombre = pub.autor_detalle?.username || 'Explorador';
            const resumen = pub.reacciones_resumen || { fuego: 0, pino: 0, alerta: 0 };
            const misReacciones = pub.mis_reacciones || [];
            return (
              <article id={`post-${pub.id}`} key={pub.id} className="camper-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="clickable-user" onClick={() => irAlPerfil(autorId)} title={`Ver perfil público de ${formatearUsuario(autorNombre)}`}
                         style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'var(--accent-forest)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem', boxShadow: '0 3px 10px rgba(35,83,52,0.3)' }}>{(autorNombre || 'E').charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="clickable-user" onClick={() => irAlPerfil(autorId)} title={`Ver perfil público de ${formatearUsuario(autorNombre)}`}
                           style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{formatearUsuario(autorNombre)}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span>{new Date(pub.fecha_creacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        {pub.visibilidad === 'publico' && <Globe size={13} title="Público" />}
                        {pub.visibilidad === 'seguidores' && <Users size={13} title="Solo Compañeros de Ruta" />}
                        {pub.visibilidad === 'privado' && <Lock size={13} title="Privado" />}
                        {pub.visibilidad === 'grupo_privado' && <Shield size={13} title="Grupo Privado" />}
                      </div>
                    </div>
                  </div>
                  {/* Badge de lugar único */}
                  {pub.lugar_detalle && alSeleccionarLugar && (
                    <button className="badge-camper badge-forest" style={{ cursor: 'pointer', border: 'none', background: 'rgba(35,83,52,0.1)' }} onClick={() => alSeleccionarLugar(pub.lugar_detalle.id)}>
                      <MapPin size={13} /> {pub.lugar_detalle.nombre}
                    </button>
                  )}
                </div>
                {/* Contenido o edición */}
                {editandoPostId === pub.id ? (
                  <div style={{ marginBottom: '14px' }}>
                    <textarea className="form-control" rows="3" value={textoEditadoPost} onChange={e => setTextoEditadoPost(e.target.value)} />
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => guardarEdicionPost(pub.id)} disabled={guardandoEdicionPost}>Guardar</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditandoPostId(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.96rem', color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: '14px', whiteSpace: 'pre-line' }}>{pub.contenido}</p>
                )}
                {/* Imagen */}
                {pub.imagen && (
                  <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '16px' }}>
                    <img loading="lazy" decoding="async" src={pub.imagen} alt="Foto de ruta" style={{ width: '100%', maxHeight: '420px', objectFit: 'cover' }} />
                  </div>
                )}
                {/* Reacciones y acciones */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => reaccionarAPublicacion(pub.id, 'fuego')} className={`btn btn-sm ${misReacciones.includes('fuego') ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '5px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: 'var(--radius-full)' }} title="Me gusta / ¡Buena ruta!">
                      <Heart size={15} fill={misReacciones.includes('fuego') ? '#E11D48' : 'none'} color={misReacciones.includes('fuego') ? '#E11D48' : 'currentColor'} />
                      <span style={{ fontWeight: 600 }}>{resumen.fuego || 0}</span>
                    </button>
                    <button onClick={() => reaccionarAPublicacion(pub.id, 'alerta')} className={`btn btn-sm ${misReacciones.includes('alerta') ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '5px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: 'var(--radius-full)' }} title="Ojo con el acceso / Advertencia en ruta">
                      <AlertTriangle size={15} color="#F59E0B" />
                      <span>{resumen.alerta || 0}</span>
                    </button>
                    

                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Botón Comentarios con alto contraste garantizado */}
                    <button
                      type="button"
                      onClick={() => toggleComentarios(pub.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-full)',
                        padding: '6px 14px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Ver o escribir comentarios"
                    >
                      <MessageSquare size={15} color="var(--accent-forest)" />
                      <span style={{ color: 'var(--text-primary)' }}>
                        {pub.total_comentarios || pub.comentarios?.length || 0} Comentarios
                      </span>
                    </button>

                    {/* Botón Compartir Publicación */}
                    <button
                      type="button"
                      onClick={() => compartirPublicacion(pub.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-full)',
                        padding: '6px 14px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Compartir enlace directo a esta publicación"
                    >
                      {compartidoId === pub.id ? <Check size={15} color="var(--accent-forest)" /> : <Share2 size={15} color="var(--accent-forest)" />}
                      <span>{compartidoId === pub.id ? '¡Copiado!' : 'Compartir'}</span>
                    </button>

                    {/* Botones de Editar y Eliminar para autor o admin/staff */}
                    {(() => {
                      const esAdminPub = Boolean(usuario && (usuario.es_admin || usuario.is_staff || usuario.is_superuser || usuario.username === 'admin' || (usuario.username && usuario.username.toLowerCase() === 'admin')));
                      const puedeModificarPub = Boolean(usuario && (autorId === usuario.id || esAdminPub));
                      if (!puedeModificarPub) return null;
                      const esModeracionAdmin = esAdminPub && autorId !== usuario.id;
                      return (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => iniciarEdicionPost(pub)}
                            title={esModeracionAdmin ? "Moderar / Editar publicación de usuario (Admin)" : "Editar publicación"}
                            style={{
                              padding: '6px 10px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-color)',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => eliminarPost(pub.id)}
                            title={esModeracionAdmin ? "Eliminar publicación de usuario (Admin)" : "Eliminar publicación"}
                            style={{
                              padding: '6px 10px',
                              background: 'rgba(239, 68, 68, 0.22)',
                              color: '#F87171',
                              border: '1px solid rgba(239, 68, 68, 0.5)',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            <Trash2 size={14} color="#F87171" />
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                {/* Comentarios con Paginación de 20 y Edición/Eliminación para Autor y Admin */}
                {comentariosAbiertos[pub.id] && (() => {
                  const todosComs = pub.comentarios || [];
                  const comsPorPag = 20;
                  const pagActual = paginaComentarios[pub.id] || 1;
                  const totalPagsComs = Math.ceil(todosComs.length / comsPorPag) || 1;
                  const comsPaginados = todosComs.slice((pagActual - 1) * comsPorPag, pagActual * comsPorPag);

                  return (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
                      {todosComs.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                          {comsPaginados.map(c => {
                            const comAutorId = c.autor_detalle?.id || c.autor;
                            const comAutorNombre = c.autor_detalle?.username || 'Explorador';
                            const esMiComentario = usuario && (comAutorId === usuario.id);
                            const esAdmin = usuario && (usuario.es_admin || usuario.is_staff || usuario.is_superuser);
                            const puedeModificar = esMiComentario || esAdmin;
                            const estaEditandoEste = editandoComentarioId === c.id;

                            return (
                              <div id={`comentario-${c.id}`} key={c.id} style={{
                                background: 'var(--bg-primary)',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-sm)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '10px',
                                transition: 'all 0.3s ease'
                              }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                                    <span 
                                      className="clickable-user" 
                                      onClick={() => irAlPerfil(comAutorId)}
                                      style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--accent-forest)' }}
                                    >
                                      {formatearUsuario(comAutorNombre)}
                                    </span>
                                    {c.fecha && (
                                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                        • {new Date(c.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                      </span>
                                    )}
                                  </div>

                                  {estaEditandoEste ? (
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={textoEditandoComentario}
                                        onChange={(e) => setTextoEditandoComentario(e.target.value)}
                                        style={{ fontSize: '0.84rem', padding: '4px 8px' }}
                                        onKeyDown={(e) => e.key === 'Enter' && guardarEdicionComentario(pub.id, c.id)}
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={() => guardarEdicionComentario(pub.id, c.id)}
                                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                                      >
                                        Guardar
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setEditandoComentarioId(null)}
                                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  ) : (
                                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.45' }}>
                                      {c.texto}
                                    </p>
                                  )}
                                </div>

                                {/* Acciones de Comentario (Compartir, Editar, Eliminar) */}
                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0, alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    className="btn-icon"
                                    onClick={() => compartirComentario(pub.id, c.id)}
                                    title="Compartir enlace directo a este comentario"
                                    style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }}
                                  >
                                    <Share2 size={13} />
                                  </button>
                                  {puedeModificar && !estaEditandoEste && (
                                    <>
                                      <button
                                        type="button"
                                        className="btn-icon"
                                        onClick={() => iniciarEdicionComentario(c)}
                                        title={esAdmin && !esMiComentario ? "Moderar / Editar comentario (Admin)" : "Editar comentario"}
                                        style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                      >
                                        <Edit3 size={13} />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-icon"
                                        onClick={() => eliminarComentario(pub.id, c.id)}
                                        title={esAdmin && !esMiComentario ? "Eliminar comentario (Admin)" : "Eliminar comentario"}
                                        style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Paginación de Comentarios (20 por página) */}
                      {totalPagsComs > 1 && (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: 'var(--bg-glass)',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '12px',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)'
                        }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => cambiarPaginaComentarios(pub.id, Math.max(1, pagActual - 1))}
                            disabled={pagActual === 1}
                            style={{ padding: '3px 10px', fontSize: '0.76rem' }}
                          >
                            ◀ Anteriores
                          </button>
                          <span>Página {pagActual} de {totalPagsComs} ({todosComs.length} comentarios)</span>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => cambiarPaginaComentarios(pub.id, Math.min(totalPagsComs, pagActual + 1))}
                            disabled={pagActual === totalPagsComs}
                            style={{ padding: '3px 10px', fontSize: '0.76rem' }}
                          >
                            Siguientes ▶
                          </button>
                        </div>
                      )}

                      {usuario && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Escribe un comentario..."
                            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                            value={textoComentario[pub.id] || ''}
                            onChange={e => setTextoComentario({ ...textoComentario, [pub.id]: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && enviarComentario(pub.id)}
                          />
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => enviarComentario(pub.id)}
                            style={{ padding: '0 14px' }}
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </article>
            );
          })}
        </div>
      )}
      {/* TOAST FLOTANTE DE ENLACE COPIADO */}
      {toastCopiado && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'var(--accent-forest)',
          color: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: 'var(--radius-full)',
          fontWeight: 800,
          fontSize: '0.88rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={18} />
          <span>{toastCopiado}</span>
        </div>
      )}
    </div>
  );
}
