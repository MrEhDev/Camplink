import React, { useState, useEffect } from 'react';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { construirUrlImagen } from '../utils/lugarImagenes';
import { renderizarMarkdownHtml } from '../utils/markdown';
import {
  Wrench, Hammer, Box, BookOpen, Shield, PlusCircle, ArrowLeft,
  Calendar, Tag, User, MessageSquare, Download, Send, ExternalLink,
  Play, CheckCircle, XCircle, AlertTriangle, Eye, Sparkles,
  ChevronRight, Layers, Share2, ZoomIn, X, Check, FileCode, Edit3, Trash2, Search
} from 'lucide-react';

const obtenerIconoCategoria = (iconoNombre) => {
  if (!iconoNombre) return '🛠️';
  const ic = String(iconoNombre).toLowerCase().trim();
  if (ic.includes('wrench') || ic.includes('manten')) return '🔧';
  if (ic.includes('hammer') || ic.includes('brico') || ic.includes('craft')) return '🔨';
  if (ic.includes('box') || ic.includes('3d') || ic.includes('stl') || ic.includes('3mf') || ic.includes('pieza')) return '📦';
  if (ic.includes('zap') || ic.includes('elect') || ic.includes('solar') || ic.includes('bater')) return '⚡';
  if (ic.includes('cpu') || ic.includes('chip')) return '💻';
  if (ic.includes('shield') || ic.includes('auxilio') || ic.includes('segur') || ic.includes('salud')) return '🩹';
  if (ic.includes('wifi') || ic.includes('domot') || ic.includes('offline') || ic.includes('red')) return '📡';
  if (ic.includes('flame') || ic.includes('fuego') || ic.includes('calef') || ic.includes('gas')) return '🔥';
  if (ic.includes('droplet') || ic.includes('agua') || ic.includes('fontan')) return '💧';
  if (ic.includes('sun') || ic.includes('sol')) return '☀️';
  if (ic.includes('compass') || ic.includes('brujula') || ic.includes('ruta')) return '🧭';
  if (ic.includes('layers') || ic.includes('aisla')) return '🧱';
  if (ic.includes('settings') || ic.includes('motor') || ic.includes('mecanic')) return '⚙️';
  if (ic.includes('sparkles')) return '✨';
  return iconoNombre;
};

const formatearUsuario = (u) => {
  if (!u) return 'Explorador';
  const str = String(u);
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function TallerCamplink({ alCrearPublicacion, alEditarPublicacion, alVerPerfilUsuario }) {
  const { usuario } = useAuth();
  const { t } = useTranslation();

  const [publicaciones, setPublicaciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [soloRevision, setSoloRevision] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtro3D, setFiltro3D] = useState(false);
  const [conteoPendientes, setConteoPendientes] = useState(0);

  // Detalle de Publicación
  const [publicacionSeleccionada, setPublicacionSeleccionada] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [lightboxImagen, setLightboxImagen] = useState(null);
  const [copiado, setCopiado] = useState(false);

  // Comentarios
  const [mensajeComentario, setMensajeComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  // Moderación Admin
  const [modalRechazo, setModalRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [moderando, setModerando] = useState(false);

  const esAdmin = Boolean(usuario?.is_staff || usuario?.is_superuser || usuario?.rol === 'administrador');

  // Cargar Categorías dinámicamente desde la base de datos
  useEffect(() => {
    peticionApi('/api/comunidad/categorias/')
      .then(res => {
        const lista = Array.isArray(res) ? res : (res?.results || []);
        setCategorias(lista);
      })
      .catch(err => {
        console.error('Error cargando categorias:', err);
        setCategorias([]);
      });
  }, []);

  // Comprobar publicaciones pendientes para badge de Admin
  const cargarConteoPendientes = async () => {
    if (!esAdmin) return;
    try {
      const res = await peticionApi('/api/comunidad/publicaciones/pendientes/');
      setConteoPendientes(Array.isArray(res) ? res.length : 0);
    } catch (err) {
      console.warn('Error al verificar publicaciones pendientes:', err);
    }
  };

  useEffect(() => {
    cargarConteoPendientes();
  }, [esAdmin]);

  // Cargar Publicaciones según filtros activos
  const cargarPublicaciones = async () => {
    setCargando(true);
    try {
      if (soloRevision && esAdmin) {
        const res = await peticionApi('/api/comunidad/publicaciones/pendientes/');
        const lista = Array.isArray(res) ? res : (res?.results || []);
        setPublicaciones(lista);
      } else {
        let url = '/api/comunidad/publicaciones/?';
        if (categoriaActiva !== 'todos') {
          url += `categoria=${encodeURIComponent(categoriaActiva)}&`;
        }
        if (filtro3D) {
          url += `tiene_3d=true&`;
        }
        if (terminoBusqueda.trim()) {
          url += `q=${encodeURIComponent(terminoBusqueda.trim())}&`;
        }
        const res = await peticionApi(url);
        const lista = Array.isArray(res) ? res : (res?.results || []);
        setPublicaciones(lista);
      }
    } catch (err) {
      console.error('Error cargando publicaciones:', err);
      setPublicaciones([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarPublicaciones();
    }, 200);
    return () => clearTimeout(timer);
  }, [categoriaActiva, soloRevision, filtro3D, terminoBusqueda]);

  // Detectar enlaces profundos (?id=ID o ?publicacion=ID o ?revision=ID)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pubId = params.get('id') || params.get('publicacion');
    const revId = params.get('revision');

    if (revId && esAdmin) {
      setSoloRevision(true);
      cargarDetallePublicacion(revId, false);
    } else if (pubId) {
      cargarDetallePublicacion(pubId, false);
    }
  }, [esAdmin]);

  // Sincronizar título de pestaña
  useEffect(() => {
    if (publicacionSeleccionada) {
      document.title = `${publicacionSeleccionada.titulo} • Taller Camplink`;
    } else {
      document.title = 'Taller Camplink • Camplink';
    }
  }, [publicacionSeleccionada]);

  // Manejar el botón de atrás/adelante del navegador (popstate)
  useEffect(() => {
    const manejarPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pubId = params.get('id') || params.get('publicacion');
      const revId = params.get('revision');
      if (revId && esAdmin) {
        setSoloRevision(true);
        cargarDetallePublicacion(revId, false);
      } else if (pubId) {
        cargarDetallePublicacion(pubId, false);
      } else {
        setPublicacionSeleccionada(null);
      }
    };
    window.addEventListener('popstate', manejarPopState);
    return () => window.removeEventListener('popstate', manejarPopState);
  }, [esAdmin]);

  const cargarDetallePublicacion = async (id, actualizarUrl = true) => {
    setCargandoDetalle(true);
    try {
      const data = await peticionApi(`/api/comunidad/publicaciones/${id}/`);
      setPublicacionSeleccionada(data);
      if (actualizarUrl) {
        window.history.pushState({ tallerPostId: id }, '', `/taller?id=${id}`);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error cargando detalle:', err);
      alert('No se pudo cargar la publicación o aún no está aprobada.');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const enviarComentario = async (e) => {
    e.preventDefault();
    if (!mensajeComentario.trim() || !publicacionSeleccionada) return;
    if (!usuario) return alert('Debes iniciar sesión para comentar.');

    setEnviandoComentario(true);
    try {
      const res = await peticionApi(`/api/comunidad/publicaciones/${publicacionSeleccionada.id}/comentar/`, {
        method: 'POST',
        body: { mensaje: mensajeComentario.trim() }
      });
      setPublicacionSeleccionada(prev => ({
        ...prev,
        comentarios: [...(prev.comentarios || []), res],
        comentarios_count: (prev.comentarios_count || 0) + 1
      }));
      setMensajeComentario('');
    } catch (err) {
      alert(err.message || 'Error al enviar el comentario.');
    } finally {
      setEnviandoComentario(false);
    }
  };

  // Acciones de Moderación Admin
  const aprobarPublicacion = async (id) => {
    if (!window.confirm('¿Aprobar y publicar esta entrada en el Taller?')) return;
    setModerando(true);
    try {
      await peticionApi(`/api/comunidad/publicaciones/${id}/aprobar/`, {
        method: 'POST'
      });
      alert('✅ Publicación aprobada y visible para toda la comunidad.');
      if (publicacionSeleccionada?.id === id) {
        setPublicacionSeleccionada(prev => ({ ...prev, estado: 'aprobado' }));
      }
      cargarPublicaciones();
      cargarConteoPendientes();
    } catch (err) {
      alert(err.message || 'Error al aprobar la publicación.');
    } finally {
      setModerando(false);
    }
  };

  const rechazarPublicacion = async (e) => {
    e.preventDefault();
    if (!publicacionSeleccionada) return;
    setModerando(true);
    try {
      await peticionApi(`/api/comunidad/publicaciones/${publicacionSeleccionada.id}/rechazar/`, {
        method: 'POST',
        body: { motivo: motivoRechazo }
      });
      alert('ℹ️ Publicación rechazada. Se ha notificado al autor con el motivo indicado.');
      setModalRechazo(false);
      setMotivoRechazo('');
      setPublicacionSeleccionada(null);
      cargarPublicaciones();
      cargarConteoPendientes();
    } catch (err) {
      alert(err.message || 'Error al rechazar publicación.');
    } finally {
      setModerando(false);
    }
  };

  const copiarEnlaceCompartir = () => {
    if (!publicacionSeleccionada) return;
    const url = `${window.location.origin}/taller?publicacion=${publicacionSeleccionada.id}`;
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  // Helper para renderizar vídeo incrustado seguro (YouTube o TikTok)
  const renderizarVideo = (embedInfo, videoUrl) => {
    let embedUrl = embedInfo?.embed_url;

    if (!embedUrl && videoUrl) {
      const url = String(videoUrl).trim();
      const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/);
      if (ytMatch) {
        embedUrl = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
      } else {
        const ttMatch = url.match(/tiktok\.com\/.+video\/([0-9]+)/);
        if (ttMatch) {
          embedUrl = `https://www.tiktok.com/embed/v2/${ttMatch[1]}`;
        }
      }
    }

    if (!embedUrl && !videoUrl) return null;

    return (
      <div style={{ marginBottom: '28px' }}>
        {embedUrl && (
          <div style={{
            position: 'relative',
            paddingBottom: '56.25%',
            height: 0,
            overflow: 'hidden',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
            background: '#000000'
          }}>
            <iframe
              src={embedUrl}
              title="Reproductor de Vídeo"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 0
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        )}

        {videoUrl && (
          <div style={{ marginTop: embedUrl ? '10px' : '0', display: 'flex', justifyContent: 'flex-end' }}>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
            >
              <ExternalLink size={13} /> Abrir vídeo en YouTube / pestaña nueva
            </a>
          </div>
        )}
      </div>
    );
  };

  // Renderizador de contenido con soporte de formato Markdown completo (marked GFM)
  const renderizarContenido = (texto) => {
    if (!texto) return null;
    return (
      <div
        className="markdown-taller-body"
        dangerouslySetInnerHTML={{ __html: renderizarMarkdownHtml(texto) }}
      />
    );
  };

  // Eliminar publicación (para administradores y autor)
  const manejarEliminarPublicacion = async () => {
    if (!publicacionSeleccionada) return;
    const seguro = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente "${publicacionSeleccionada.titulo}"? Esta acción no se puede deshacer.`);
    if (!seguro) return;

    try {
      await peticionApi(`/api/comunidad/publicaciones/${publicacionSeleccionada.id}/`, {
        method: 'DELETE'
      });
      setPublicaciones(prev => prev.filter(p => p.id !== publicacionSeleccionada.id));
      setPublicacionSeleccionada(null);
      window.history.pushState({}, '', '/taller');
      alert('Publicación eliminada correctamente.');
    } catch (err) {
      console.error('Error al eliminar publicación:', err);
      alert('No se pudo eliminar la publicación: ' + (err.message || 'Error del servidor'));
    }
  };

  // RENDER DETALLE DE LA PUBLICACIÓN
  if (publicacionSeleccionada) {
    const pub = publicacionSeleccionada;
    const esPendiente = pub.estado === 'pendiente';
    const esRechazado = pub.estado === 'rechazado';

    return (
      <div className="camplink-container" style={{ padding: '24px 20px 24px', maxWidth: '880px' }}>
        {/* Barra superior de navegación interna */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setPublicacionSeleccionada(null);
              window.history.pushState({}, '', '/taller');
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} /> Volver al Taller
          </button>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(esAdmin || usuario?.id === pub.autor_detalle?.id || usuario?.username === pub.autor_detalle?.username) && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (alEditarPublicacion) alEditarPublicacion(pub);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Editar esta publicación"
              >
                <Edit3 size={14} color="var(--accent-forest)" /> Editar Publicación
              </button>
            )}

            {esAdmin && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={manejarEliminarPublicacion}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                title="Eliminar permanentemente esta publicación (Solo administradores)"
              >
                <Trash2 size={14} color="#EF4444" /> Eliminar Publicación
              </button>
            )}

            <button
              className="btn btn-secondary btn-sm"
              onClick={copiarEnlaceCompartir}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Copiar enlace a esta guía"
            >
              {copiado ? <Check size={14} color="#10B981" /> : <Share2 size={14} />}
              {copiado ? '¡Enlace copiado!' : 'Compartir'}
            </button>
          </div>
        </div>

        {/* ALERTA DE ESTADO PARA MODERACIÓN */}
        {esPendiente && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1.5px solid rgba(245, 158, 11, 0.5)',
            color: '#F59E0B',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={22} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.96rem' }}>Entrada en Revisión de Moderación</strong>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {esAdmin
                    ? 'Esta publicación está pendiente de validación antes de ser visible públicamente.'
                    : 'Tu publicación ha sido enviada al equipo de moderación. Estará visible en cuanto sea validada.'}
                </span>
              </div>
            </div>

            {esAdmin && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => aprobarPublicacion(pub.id)}
                  disabled={moderando}
                  style={{ background: '#10B981', borderColor: '#10B981' }}
                >
                  <CheckCircle size={15} /> Aprobar
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setModalRechazo(true)}
                  disabled={moderando}
                  style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.4)' }}
                >
                  <XCircle size={15} /> Rechazar
                </button>
              </div>
            )}
          </div>
        )}

        {esRechazado && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1.5px solid rgba(239, 68, 68, 0.4)',
            color: '#EF4444',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Publicación Rechazada</strong>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
              Motivo: {pub.motivo_rechazo || 'No especificado por el moderador.'}
            </p>
          </div>
        )}

        {/* TARJETA PRINCIPAL DEL ARTÍCULO / GUÍA */}
        <article className="camper-card" style={{ padding: '36px', marginBottom: '30px' }}>
          {/* Categoría y Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <span className="badge-camper badge-forest" style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
              {obtenerIconoCategoria(pub.categoria_detalle?.icono || pub.categoria_icono)} {pub.categoria_detalle?.nombre || pub.categoria_nombre || 'General'}
            </span>

            {pub.es_guia_oficial && (
              <span className="badge-camper badge-earth" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} /> Guía Oficial
              </span>
            )}

            {pub.archivo_descargable && (
              <span className="badge-camper" style={{ background: 'rgba(217, 119, 54, 0.2)', color: 'var(--accent-earth)', border: '1px solid rgba(217, 119, 54, 0.3)' }}>
                📦 Archivo 3D .STL
              </span>
            )}

            {pub.video_url && (
              <span className="badge-camper" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                🎬 Vídeo
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '2.3rem', lineHeight: 1.25, margin: '0 0 16px', color: 'var(--text-primary)' }}>
            {pub.titulo}
          </h1>

          {/* Metadatos: autor, fecha, vistas */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            paddingBottom: '20px',
            marginBottom: '26px',
            borderBottom: '1px solid var(--border-color)',
            flexWrap: 'wrap'
          }}>
            <span
              onClick={(e) => {
                const autorId = pub.autor_detalle?.id || (typeof pub.autor === 'number' ? pub.autor : null);
                if (autorId && alVerPerfilUsuario) {
                  e.stopPropagation();
                  alVerPerfilUsuario(autorId);
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: (pub.autor_detalle?.id || typeof pub.autor === 'number') && alVerPerfilUsuario ? 'pointer' : 'default'
              }}
              title={pub.autor_detalle?.username ? `Ver perfil de ${formatearUsuario(pub.autor_detalle.username)}` : undefined}
            >
              <User size={15} color="var(--accent-forest)" />
              {formatearUsuario(pub.autor_detalle?.username || pub.autor?.username || 'Comunidad')}
              {pub.autor_detalle?.es_admin && (
                <Shield size={13} color="var(--accent-earth)" title="Administrador" />
              )}
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={14} />
              {new Date(pub.fecha_publicacion || pub.fecha_creacion).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <MessageSquare size={14} /> {pub.comentarios_count || (pub.comentarios ? pub.comentarios.length : 0)} respuestas
            </span>
          </div>

          {/* IMAGEN DE PORTADA OPTIMIZADA */}
          {(() => {
            const imgPortada = pub.imagen_principal_efectiva || pub.imagen_principal_url || pub.imagen_principal;
            if (!imgPortada) return null;
            const srcUrl = construirUrlImagen(imgPortada);
            return (
              <div
                style={{
                  width: '100%',
                  maxHeight: '460px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  marginBottom: '28px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => setLightboxImagen(srcUrl)}
                title="Clic para ampliar imagen"
              >
                <img
                  src={srcUrl}
                  alt={pub.titulo}
                  style={{ width: '100%', height: '100%', maxHeight: '460px', objectFit: 'cover', display: 'block' }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(0,0,0,0.65)',
                  color: '#FFFFFF',
                  borderRadius: '50px',
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backdropFilter: 'blur(6px)'
                }}>
                  <ZoomIn size={13} /> Ampliar
                </div>
              </div>
            );
          })()}

          {/* REPRODUCTOR DE VÍDEO (YOUTUBE / TIKTOK) */}
          {renderizarVideo(pub.video_embed_info || pub.video_embed, pub.video_url)}

          {/* RESUMEN DESTACADO */}
          {pub.resumen && (
            <div style={{
              fontSize: '1.1rem',
              fontWeight: 500,
              lineHeight: 1.65,
              color: 'var(--text-secondary)',
              padding: '16px 20px',
              borderLeft: '4px solid var(--accent-forest)',
              background: 'rgba(35, 83, 52, 0.08)',
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
              marginBottom: '26px'
            }}>
              {pub.resumen}
            </div>
          )}

          {/* CONTENIDO PRINCIPAL CON RENDERIZADO DE FOTOS EN TEXTO Y FORMATO */}
          <div style={{
            fontSize: '1.05rem',
            lineHeight: 1.85,
            color: 'var(--text-primary)',
            marginBottom: '32px'
          }}>
            {renderizarContenido(pub.contenido)}
          </div>

          {/* GALERÍA INTERIOR DE IMÁGENES */}
          {pub.galeria && pub.galeria.length > 0 && (
            <div style={{ marginTop: '30px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="var(--accent-forest)" /> Galería de Detalles ({pub.galeria.length})
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '14px'
              }}>
                {pub.galeria.map((imgItem) => {
                  const srcItem = construirUrlImagen(imgItem.imagen);
                  return (
                    <div
                      key={imgItem.id}
                      onClick={() => setLightboxImagen(srcItem)}
                      style={{
                        position: 'relative',
                        aspectRatio: '4/3',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                      title={imgItem.pie_de_foto || 'Clic para ampliar'}
                    >
                      <img
                        src={srcItem}
                        alt={imgItem.pie_de_foto || 'Detalle'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                      {imgItem.pie_de_foto && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                          color: '#FFFFFF',
                          fontSize: '0.72rem',
                          padding: '12px 8px 4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {imgItem.pie_de_foto}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ARCHIVO 3D (.STL / .3MF / FABRICACIÓN) DESCARGABLE */}
          {pub.archivo_descargable && (() => {
            const extArchivo = (pub.archivo_descargable.split('?')[0].split('.').pop() || '3D').toUpperCase();
            return (
              <div style={{
                marginTop: '32px',
                padding: '18px 22px',
                background: 'rgba(217, 119, 54, 0.1)',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid rgba(217, 119, 54, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-earth)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    flexShrink: 0
                  }}>
                    <Box size={26} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      Archivo Imprimible 3D (.{extArchivo} / Fabricación)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {pub.archivo_nombre || `Modelo listo para laminar con Bambu Studio, PrusaSlicer, OrcaSlicer o Cura (.${extArchivo})`}
                    </div>
                  </div>
                </div>

                <a
                  href={pub.archivo_descargable}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ background: 'var(--accent-earth)', borderColor: 'var(--accent-earth)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={16} /> Descargar .{extArchivo}
                </a>
              </div>
            );
          })()}

          {/* ENLACE EXTERNO DE INTERÉS */}
          {pub.enlace_externo && (
            <div style={{ marginTop: '20px' }}>
              <a
                href={pub.enlace_externo}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={14} /> {pub.enlace_externo_texto || 'Ver Enlace de Referencia / Tienda'}
              </a>
            </div>
          )}
        </article>

        {/* MODAL LIGHTBOX PARA AMPLIAR IMÁGENES */}
        {lightboxImagen && (
          <div
            onClick={() => setLightboxImagen(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.88)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <button
              onClick={() => setLightboxImagen(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={24} />
            </button>
            <img
              src={lightboxImagen}
              alt="Detalle ampliado"
              style={{ maxWidth: '95%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* MODAL RECHAZO CON MOTIVO (ADMIN) */}
        {modalRechazo && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div className="camper-card" style={{ maxWidth: '500px', width: '100%', padding: '28px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={20} /> Rechazar Publicación
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Indica el motivo por el cual la publicación no cumple las normas comunitarias o técnicas para notificar al autor.
              </p>
              <form onSubmit={rechazarPublicacion}>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Ej: Faltan detalles de seguridad o el modelo 3D no incluye descripción de impresión..."
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  required
                  style={{ marginBottom: '18px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setModalRechazo(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    style={{ background: '#EF4444', borderColor: '#EF4444' }}
                    disabled={moderando}
                  >
                    {moderando ? 'Rechazando...' : 'Confirmar Rechazo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SECCIÓN DE COMENTARIOS */}
        <div className="camper-card" style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="var(--accent-forest)" />
            Comentarios ({pub.comentarios ? pub.comentarios.length : 0})
          </h3>

          {/* Formulario nuevo comentario */}
          {usuario ? (
            <form onSubmit={enviarComentario} style={{ marginBottom: '30px' }}>
              <div className="form-group">
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Escribe tu comentario, consejo técnico o duda sobre este proyecto..."
                  value={mensajeComentario}
                  onChange={(e) => setMensajeComentario(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={enviandoComentario}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={14} /> {enviandoComentario ? 'Enviando...' : 'Publicar Comentario'}
              </button>
            </form>
          ) : (
            <div style={{
              padding: '14px 18px',
              background: 'rgba(35, 83, 52, 0.08)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              marginBottom: '26px'
            }}>
              Inicia sesión para participar en el debate técnico y responder a esta guía.
            </div>
          )}

          {/* Lista de comentarios */}
          {pub.comentarios && pub.comentarios.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {pub.comentarios.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: 'var(--bg-primary)',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span
                      onClick={() => {
                        const cAutorId = c.autor_detalle?.id || (typeof c.autor === 'number' ? c.autor : null);
                        if (cAutorId && alVerPerfilUsuario) alVerPerfilUsuario(cAutorId);
                      }}
                      style={{
                        fontWeight: 700,
                        color: 'var(--accent-forest)',
                        fontSize: '0.88rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: (c.autor_detalle?.id || typeof c.autor === 'number') && alVerPerfilUsuario ? 'pointer' : 'default'
                      }}
                      title={c.autor_detalle?.username ? `Ver perfil de ${formatearUsuario(c.autor_detalle.username)}` : undefined}
                    >
                      <User size={13} /> {formatearUsuario(c.autor_detalle?.username || 'Explorador')}
                      {c.autor_detalle?.es_admin && <Shield size={12} color="var(--accent-earth)" />}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(c.fecha_creacion).toLocaleDateString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                    {c.mensaje}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '24px' }}>
              Todavía no hay respuestas en este proyecto. ¡Sé el primero en aportar tu experiencia!
            </div>
          )}
        </div>
      </div>
    );
  }

  // RENDER PRINCIPAL: CATÁLOGO / HUB UNIFICADO DEL TALLER
  return (
    <div className="camplink-container" style={{ padding: '24px 20px 24px', maxWidth: '1120px' }}>
      {/* CABECERA HERO */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', margin: '0 0 6px', color: 'var(--text-primary)', fontWeight: 800 }}>
            🛠️ Taller Camplink
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.98rem', maxWidth: '650px' }}>
            Mantenimiento preventivo, bricolaje & camperización, piezas imprimibles en 3D y guías de la comunidad.
          </p>
        </div>

        {/* Botón para crear nueva publicación */}
        <div>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (alCrearPublicacion) alCrearPublicacion();
            }}
            style={{
              padding: '10px 20px',
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(35, 83, 52, 0.35)'
            }}
          >
            <PlusCircle size={18} /> Publicar en el Taller
          </button>
        </div>
      </div>

      {/* CHIPS DE CATEGORÍAS */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px', alignItems: 'center' }}>
        <button
          className={`btn btn-sm ${categoriaActiva === 'todos' && !soloRevision ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setCategoriaActiva('todos');
            setSoloRevision(false);
          }}
          style={{ borderRadius: '50px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span>✨</span>
          <span>Todas</span>
        </button>

        {(Array.isArray(categorias) ? categorias : []).map((cat) => (
          <button
            key={cat.id}
            className={`btn btn-sm ${categoriaActiva === cat.slug && !soloRevision ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setCategoriaActiva(cat.slug);
              setSoloRevision(false);
            }}
            style={{
              borderRadius: '50px',
              fontSize: '0.84rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{obtenerIconoCategoria(cat.icono || cat.nombre)}</span>
            <span>{cat.nombre}</span>
            {cat.total_publicaciones > 0 && (
              <span style={{ opacity: 0.7, fontSize: '0.72rem' }}>({cat.total_publicaciones})</span>
            )}
          </button>
        ))}

        {esAdmin && (
          <button
            className={`btn btn-sm ${soloRevision ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setSoloRevision(!soloRevision);
            }}
            style={{
              borderRadius: '50px',
              fontSize: '0.84rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginLeft: 'auto',
              background: soloRevision ? '#D97706' : undefined,
              borderColor: '#D97706',
              color: soloRevision ? '#FFFFFF' : '#D97706',
              fontWeight: 700
            }}
          >
            <Shield size={14} />
            <span>Revisión</span>
            {conteoPendientes > 0 && (
              <span style={{
                background: '#EF4444',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '1px 6px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                {conteoPendientes}
              </span>
            )}
          </button>
        )}
      </div>

      {/* BARRA DE BÚSQUEDA POR PALABRAS CLAVE Y FILTRO 3D */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: '24px'
      }}>
        {/* Input Buscador */}
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por palabra clave, brico, tornillo, relé, 3mf, stl..."
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
            style={{
              paddingLeft: '40px',
              paddingRight: terminoBusqueda ? '36px' : '14px',
              height: '42px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-surface)',
              border: '1.5px solid var(--border-color)',
              fontSize: '0.92rem'
            }}
          />
          {terminoBusqueda && (
            <button
              type="button"
              onClick={() => setTerminoBusqueda('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Borrar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* AVISO EN PESTAÑA DE REVISIÓN ADMIN */}
      {soloRevision && (
        <div style={{
          background: 'rgba(217, 119, 54, 0.12)',
          border: '1px solid rgba(217, 119, 54, 0.4)',
          color: 'var(--text-primary)',
          padding: '14px 20px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '26px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Shield size={22} color="#D97706" />
          <div style={{ fontSize: '0.88rem' }}>
            <strong>Panel de Moderación</strong>: Mostrando las publicaciones de usuarios que están a la espera de aprobación para ser públicas.
          </div>
        </div>
      )}

      {/* GRID DE PUBLICACIONES (ESTILO GUÍA DEL NÓMADA MEJORADO) */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>🛠️</div>
          <div>Cargando publicaciones del Taller...</div>
        </div>
      ) : publicaciones.length === 0 ? (
        <div className="camper-card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🌿</div>
          <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>
            {soloRevision ? '¡Todo al día! No hay publicaciones pendientes' : 'No hay publicaciones en esta sección'}
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '0.9rem' }}>
            {soloRevision
              ? 'Todas las publicaciones de la comunidad han sido revisadas.'
              : 'Sé el primero en compartir un tutorial, arreglo mecánico o archivo 3D con la comunidad.'}
          </p>
          {!soloRevision && (
            <button className="btn btn-primary btn-sm" onClick={() => alCrearPublicacion && alCrearPublicacion()}>
              <PlusCircle size={15} /> Crear la Primera Entrada
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '24px'
        }}>
          {publicaciones.map((pub) => {
            const tieneStl = Boolean(pub.archivo_descargable);
            const tieneVideo = Boolean(pub.video_url);

            return (
              <div
                key={pub.id}
                className="camper-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  padding: 0,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => cargarDetallePublicacion(pub.id)}
              >
                {/* CABECERA VISUAL / IMAGEN DE PORTADA */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '190px',
                  background: 'linear-gradient(135deg, #1B3826 0%, #2A543A 60%, #15291C 100%)',
                  overflow: 'hidden'
                }}>
                  {(pub.imagen_principal_efectiva || pub.imagen_principal_url || pub.imagen_principal) ? (
                    <img
                      src={construirUrlImagen(pub.imagen_principal_efectiva || pub.imagen_principal_url || pub.imagen_principal)}
                      alt={pub.titulo}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: '8px',
                      color: 'rgba(255,255,255,0.7)'
                    }}>
                      <span style={{ fontSize: '2.5rem' }}>{obtenerIconoCategoria(pub.categoria_detalle?.icono || pub.categoria_icono)}</span>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.3px', textAlign: 'center', padding: '0 12px' }}>
                        {pub.categoria_detalle?.nombre || pub.categoria_nombre || 'Taller Camplink'}
                      </span>
                    </div>
                  )}

                  {/* Badges Flotantes sobre la Imagen */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    right: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}>
                    <span className="badge-camper badge-forest" style={{
                      backdropFilter: 'blur(8px)',
                      background: 'rgba(35, 83, 52, 0.85)',
                      color: '#FFFFFF',
                      fontSize: '0.74rem'
                    }}>
                      {obtenerIconoCategoria(pub.categoria_detalle?.icono || pub.categoria_icono)} {pub.categoria_detalle?.nombre || pub.categoria_nombre || 'General'}
                    </span>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      {pub.es_guia_oficial && (
                        <span className="badge-camper badge-earth" style={{
                          fontSize: '0.7rem',
                          background: 'rgba(217, 119, 54, 0.95)',
                          color: '#FFFFFF'
                        }}>
                          ⭐ Oficial
                        </span>
                      )}
                      {tieneStl && (
                        <span className="badge-camper" style={{
                          fontSize: '0.7rem',
                          background: 'rgba(0,0,0,0.75)',
                          color: '#FBBF24',
                          border: '1px solid rgba(251, 191, 36, 0.4)'
                        }}>
                          📦 .STL
                        </span>
                      )}
                      {tieneVideo && (
                        <span className="badge-camper" style={{
                          fontSize: '0.7rem',
                          background: 'rgba(0,0,0,0.75)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.4)'
                        }}>
                          🎬 Vídeo
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* CUERPO DE LA TARJETA (ESTILO GUÍA DEL NÓMADA) */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.18rem',
                      margin: '0 0 10px',
                      color: 'var(--text-primary)',
                      lineHeight: 1.35,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {pub.titulo}
                    </h3>

                    <p style={{
                      fontSize: '0.88rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      margin: '0 0 16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {pub.resumen || pub.contenido}
                    </p>
                  </div>

                  {/* FOOTER DE LA TARJETA */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span
                      onClick={(e) => {
                        const aId = pub.autor_detalle?.id || (typeof pub.autor === 'number' ? pub.autor : null);
                        if (aId && alVerPerfilUsuario) {
                          e.stopPropagation();
                          alVerPerfilUsuario(aId);
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: (pub.autor_detalle?.id || typeof pub.autor === 'number') && alVerPerfilUsuario ? 'pointer' : 'default',
                        fontWeight: 600,
                        color: (pub.autor_detalle?.id || typeof pub.autor === 'number') && alVerPerfilUsuario ? 'var(--accent-forest)' : 'inherit'
                      }}
                      title={pub.autor_detalle?.username ? `Ver perfil de ${formatearUsuario(pub.autor_detalle.username)}` : undefined}
                    >
                      <User size={13} color="var(--accent-forest)" />
                      {formatearUsuario(pub.autor_detalle?.username || pub.autor?.username || 'Comunidad')}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MessageSquare size={13} />
                        {pub.comentarios_count || (pub.comentarios ? pub.comentarios.length : 0)}
                      </span>

                      <span style={{
                        color: 'var(--accent-forest)',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        {pub.es_guia_oficial ? 'Leer Guía' : 'Ver Proyecto'} <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
