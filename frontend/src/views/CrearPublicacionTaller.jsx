import React, { useState, useEffect, useRef } from 'react';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Upload, Image, Video, Box, PlusCircle,
  Sparkles, Shield, CheckCircle, X, FileCode, AlertCircle, Info,
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote,
  Code, Link2, ExternalLink, Eye, Edit3, Trash2, Check, Paperclip,
  ImageIcon
} from 'lucide-react';

const ICONOS_DISPONIBLES = [
  { id: 'Hammer', nombre: 'Martillo / Brico', emoji: '🔨' },
  { id: 'Wrench', nombre: 'Mantenimiento', emoji: '🔧' },
  { id: 'Zap', nombre: 'Electricidad', emoji: '⚡' },
  { id: 'Cpu', nombre: 'Electrónica', emoji: '💻' },
  { id: 'Sun', nombre: 'Energía Solar', emoji: '☀️' },
  { id: 'Box', nombre: 'Pieza 3D (.STL)', emoji: '📦' },
  { id: 'Shield', nombre: 'Seguridad', emoji: '🩹' },
  { id: 'Flame', nombre: 'Calefacción / Gas', emoji: '🔥' },
  { id: 'Droplet', nombre: 'Depósitos / Agua', emoji: '💧' },
  { id: 'Layers', nombre: 'Aislamiento', emoji: '🧱' },
  { id: 'Compass', nombre: 'Rutas / Nómada', emoji: '🧭' },
  { id: 'Settings', nombre: 'Mecánica', emoji: '⚙️' },
  { id: 'Wifi', nombre: 'Conectividad', emoji: '📡' },
  { id: 'Sparkles', nombre: 'Especial', emoji: '✨' },
];

export default function CrearPublicacionTaller({ alVolver, alPublicarExitoso, publicacionAEditar }) {
  const { usuario } = useAuth();
  const textareaRef = useRef(null);
  const filePortadaRef = useRef(null);
  const fileGaleriaRef = useRef(null);
  const fileDescargaRef = useRef(null);
  const fileImagenTextoRef = useRef(null);

  const esAdmin = Boolean(usuario?.is_staff || usuario?.is_superuser || usuario?.rol === 'administrador');
  const esEdicion = Boolean(publicacionAEditar && publicacionAEditar.id);

  const [categorias, setCategorias] = useState([]);
  const [titulo, setTitulo] = useState(publicacionAEditar?.titulo || '');
  const [categoriaId, setCategoriaId] = useState(
    publicacionAEditar?.categoria?.id || publicacionAEditar?.categoria || ''
  );
  const [mostrarNuevaCatModal, setMostrarNuevaCatModal] = useState(false);
  const [nuevaCatNombre, setNuevaCatNombre] = useState('');
  const [nuevaCatIcono, setNuevaCatIcono] = useState('Hammer');
  const [nuevaCatColor, setNuevaCatColor] = useState('#F97316');
  const [resumen, setResumen] = useState(publicacionAEditar?.resumen || '');
  const [contenido, setContenido] = useState(publicacionAEditar?.contenido || '');

  // Adjuntos
  const [imagenPrincipal, setImagenPrincipal] = useState(null);
  const [previewPrincipal, setPreviewPrincipal] = useState(publicacionAEditar?.imagen_principal || null);
  const [imagenesGaleria, setImagenesGaleria] = useState([]);
  const [previewsGaleria, setPreviewsGaleria] = useState(
    publicacionAEditar?.fotos_galeria?.map(f => ({ url: f.foto, esExistente: true })) || []
  );
  const [videoUrl, setVideoUrl] = useState(publicacionAEditar?.video_url || '');
  const [mostrarPanelVideo, setMostrarPanelVideo] = useState(Boolean(publicacionAEditar?.video_url));
  const [videoEmbed, setVideoEmbed] = useState(null);

  const [archivoDescargable, setArchivoDescargable] = useState(null);
  const [nombreArchivoExistente, setNombreArchivoExistente] = useState(
    publicacionAEditar?.archivo_descargable ? 'Archivo adjunto existente' : ''
  );

  const [enlaceExterno, setEnlaceExterno] = useState(publicacionAEditar?.enlace_externo || '');
  const [enlaceExternoTexto, setEnlaceExternoTexto] = useState(publicacionAEditar?.enlace_externo_texto || '');
  const [mostrarPanelEnlace, setMostrarPanelEnlace] = useState(Boolean(publicacionAEditar?.enlace_externo));

  const [esGuiaOficial, setEsGuiaOficial] = useState(Boolean(publicacionAEditar?.es_guia_oficial));
  const [destacado, setDestacado] = useState(Boolean(publicacionAEditar?.destacado));

  // Pestaña activa: 'editor' o 'vistaPrevia'
  const [pestañaActiva, setPestañaActiva] = useState('editor');
  const [subiendoImagenTexto, setSubiendoImagenTexto] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exitoMensaje, setExitoMensaje] = useState('');

  useEffect(() => {
    peticionApi('/api/comunidad/categorias/')
      .then(data => {
        setCategorias(data || []);
        if (data && data.length > 0 && !categoriaId) {
          setCategoriaId(data[0].id);
        }
      })
      .catch(err => console.error('Error cargando categorías:', err));
  }, []);

  // Procesador de vídeo en tiempo real
  useEffect(() => {
    if (!videoUrl || !videoUrl.trim()) {
      setVideoEmbed(null);
      return;
    }
    const url = videoUrl.trim();
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      setVideoEmbed({ tipo: 'youtube', embedUrl: 'https://www.youtube-nocookie.com/embed/' + ytMatch[1] });
      return;
    }
    const ttMatch = url.match(/tiktok\.com\/.+video\/([0-9]+)/);
    if (ttMatch) {
      setVideoEmbed({ tipo: 'tiktok', embedUrl: 'https://www.tiktok.com/embed/v2/' + ttMatch[1] });
      return;
    }
    setVideoEmbed(null);
  }, [videoUrl]);

  // Manejo de Fotos
  const manejarImagenPrincipal = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenPrincipal(file);
      setPreviewPrincipal(URL.createObjectURL(file));
    }
  };

  const manejarImagenesGaleria = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImagenesGaleria(prev => [...prev, ...files]);
      setPreviewsGaleria(prev => [...prev, ...files.map(f => ({ file: f, url: URL.createObjectURL(f) }))]);
    }
  };

  const eliminarFotoGaleria = (idx) => {
    setImagenesGaleria(prev => prev.filter((_, i) => i !== idx));
    setPreviewsGaleria(prev => prev.filter((_, i) => i !== idx));
  };

  // Creación rápida de categoría con icono personalizable
  const crearCategoriaRapida = async (e) => {
    e.preventDefault();
    if (!nuevaCatNombre.trim()) return;
    try {
      const res = await peticionApi('/api/comunidad/categorias/', {
        method: 'POST',
        body: { nombre: nuevaCatNombre.trim(), icono: nuevaCatIcono, color: nuevaCatColor }
      });
      if (res && res.id) {
        setCategorias(prev => [...prev, res]);
        setCategoriaId(res.id);
        setNuevaCatNombre('');
        setNuevaCatIcono('Hammer');
        setMostrarNuevaCatModal(false);
      }
    } catch (err) {
      alert('Error al crear categoría: ' + (err.message || ''));
    }
  };

  // Inserción de formato en el editor
  const insertarFormato = (inicio, fin = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textoPrevio = textarea.value;
    const seleccion = textoPrevio.substring(start, end);
    const textoAInsertar = seleccion.length > 0 ? seleccion : placeholder;

    const nuevoTexto = textoPrevio.substring(0, start) + inicio + textoAInsertar + fin + textoPrevio.substring(end);
    setContenido(nuevoTexto);

    setTimeout(() => {
      textarea.focus();
      const posCursor = start + inicio.length + textoAInsertar.length + fin.length;
      textarea.setSelectionRange(posCursor, posCursor);
    }, 10);
  };

  // Subir e insertar imagen directamente en el texto
  const manejarSubirImagenTexto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubiendoImagenTexto(true);
    try {
      const formData = new FormData();
      formData.append('imagen', file);
      const res = await peticionApi('/api/comunidad/subir-imagen/', {
        method: 'POST',
        body: formData
      });
      if (res?.url) {
        const pieFoto = prompt('Título o descripción del paso con esta foto (opcional):', file.name.replace(/\.[^/.]+$/, '')) || 'Foto explicativa';
        insertarFormato(`\n\n![${pieFoto}](${res.url})\n\n`);
      }
    } catch (err) {
      console.error('Error subiendo imagen al texto:', err);
      alert('No se pudo subir la foto. Intenta de nuevo.');
    } finally {
      setSubiendoImagenTexto(false);
      if (fileImagenTextoRef.current) fileImagenTextoRef.current.value = '';
    }
  };

  // Enviar / Guardar
  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !resumen.trim() || !contenido.trim()) {
      return setError('Completa los campos obligatorios (*).');
    }
    setEnviando(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('titulo', titulo.trim());
      formData.append('categoria', categoriaId);
      formData.append('resumen', resumen.trim());
      formData.append('contenido', contenido.trim());

      if (imagenPrincipal) {
        formData.append('imagen_principal', imagenPrincipal);
      }
      if (videoUrl.trim()) {
        formData.append('video_url', videoUrl.trim());
      } else if (esEdicion) {
        formData.append('video_url', '');
      }

      if (archivoDescargable) {
        formData.append('archivo_descargable', archivoDescargable);
      }

      if (enlaceExterno.trim()) {
        formData.append('enlace_externo', enlaceExterno.trim());
        formData.append('enlace_externo_texto', enlaceExternoTexto.trim() || 'Ver Recurso');
      } else if (esEdicion) {
        formData.append('enlace_externo', '');
        formData.append('enlace_externo_texto', '');
      }

      if (esAdmin) {
        formData.append('es_guia_oficial', esGuiaOficial ? 'true' : 'false');
        formData.append('destacado', destacado ? 'true' : 'false');
        if (!esEdicion) {
          formData.append('estado', 'aprobado');
        }
      }

      // Enviar a la API
      const url = esEdicion
        ? `/api/comunidad/publicaciones/${publicacionAEditar.id}/`
        : '/api/comunidad/publicaciones/';
      const metodo = esEdicion ? 'PATCH' : 'POST';

      const respuesta = await peticionApi(url, {
        method: metodo,
        body: formData
      });

      // Subir fotos adicionales de galería si hay nuevas
      const nuevasFotos = imagenesGaleria.filter(f => f instanceof File);
      if (nuevasFotos.length > 0 && respuesta?.id) {
        for (const foto of nuevasFotos) {
          const fData = new FormData();
          fData.append('publicacion', respuesta.id);
          fData.append('foto', foto);
          try {
            await peticionApi('/api/comunidad/fotos-galeria/', {
              method: 'POST',
              body: fData
            });
          } catch (errFoto) {
            console.error('Error subiendo foto de galería:', errFoto);
          }
        }
      }

      setExitoMensaje(
        esEdicion
          ? '¡Publicación actualizada correctamente!'
          : (esAdmin ? '¡Publicación lanzada con éxito!' : '¡Publicación enviada! Quedará visible al ser aprobada.')
      );

      setTimeout(() => {
        if (alPublicarExitoso) alPublicarExitoso(respuesta);
        else alVolver();
      }, 900);

    } catch (err) {
      console.error('Error al guardar publicación:', err);
      setError(err.message || 'Error al guardar la publicación.');
      setEnviando(false);
    }
  };

  // Renderizador simplificado y limpio para la vista previa con soporte de fotos en texto
  const renderizarMarkdown = (texto) => {
    if (!texto) return <p style={{ color: 'var(--text-muted)' }}>Escribe algo en el editor para previsualizarlo aquí...</p>;

    const lineas = texto.split('\n');
    return lineas.map((linea, idx) => {
      // Imagen en texto ![alt](url)
      const imgMatch = linea.match(/!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        const alt = imgMatch[1];
        const url = imgMatch[2];
        return (
          <div key={idx} style={{ margin: '18px 0', textAlign: 'center' }}>
            <img
              src={url}
              alt={alt || 'Foto paso a paso'}
              style={{
                maxWidth: '100%',
                maxHeight: '420px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                objectFit: 'contain'
              }}
            />
            {alt && alt !== 'Foto' && alt !== 'Foto explicativa' && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                📷 {alt}
              </div>
            )}
          </div>
        );
      }

      // H2
      if (linea.startsWith('## ')) {
        return (
          <h3 key={idx} style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '22px', marginBottom: '10px', color: 'var(--text-primary)' }}>
            {linea.replace('## ', '')}
          </h3>
        );
      }
      // H3
      if (linea.startsWith('### ')) {
        return (
          <h4 key={idx} style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '18px', marginBottom: '8px', color: 'var(--accent-forest)' }}>
            {linea.replace('### ', '')}
          </h4>
        );
      }
      // Cita
      if (linea.startsWith('> ')) {
        return (
          <blockquote key={idx} style={{ margin: '14px 0', padding: '10px 16px', borderLeft: '4px solid var(--accent-forest)', background: 'rgba(255,255,255,0.03)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', fontStyle: 'italic', color: 'var(--text-muted)' }}>
            {linea.replace('> ', '')}
          </blockquote>
        );
      }
      // Lista no ordenada
      if (linea.startsWith('- ') || linea.startsWith('* ')) {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0 4px 12px' }}>
            <span style={{ color: 'var(--accent-forest)', fontWeight: 'bold' }}>•</span>
            <span>{linea.substring(2)}</span>
          </div>
        );
      }
      // Línea vacía
      if (!linea.trim()) {
        return <div key={idx} style={{ height: '12px' }} />;
      }
      // Párrafo con soporte básico de **negrita**
      const partes = linea.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} style={{ lineHeight: 1.7, margin: '6px 0', color: 'var(--text-primary)' }}>
          {partes.map((parte, pIdx) => {
            if (parte.startsWith('**') && parte.endsWith('**')) {
              return <strong key={pIdx}>{parte.slice(2, -2)}</strong>;
            }
            return parte;
          })}
        </p>
      );
    });
  };

  return (
    <div className="camplink-container" style={{ padding: '24px 20px 24px', maxWidth: '920px' }}>
      {/* Botón de Retorno */}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={alVolver}
        style={{ marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      >
        <ArrowLeft size={16} /> Volver al Taller
      </button>

      {/* Título de la Vista */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {esEdicion ? <Edit3 size={28} color="var(--accent-forest)" /> : <Sparkles size={28} color="var(--accent-forest)" />}
          {esEdicion ? 'Editar Publicación' : 'Publicar en el Taller'}
        </h1>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '20px', color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {exitoMensaje && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '20px', color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={20} />
          <span>{exitoMensaje}</span>
        </div>
      )}

      <form onSubmit={manejarEnvio}>
        {/* TARJETA: DATOS PRINCIPALES (SIN PREFIJO 1.) */}
        <div className="camper-card" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCode size={18} color="var(--accent-forest)" /> Datos Principales
          </h2>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Título del Post o Brico *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej: Instalación de placa solar flexible 150W en techo elevable"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Categoría *</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setMostrarNuevaCatModal(!mostrarNuevaCatModal)}
                style={{ fontSize: '0.78rem', padding: '2px 8px' }}
              >
                + Nueva Categoría
              </button>
            </div>

            {mostrarNuevaCatModal && (
              <div style={{
                marginBottom: '14px',
                background: 'rgba(255,255,255,0.03)',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>Nueva Categoría</span>
                  <button
                    type="button"
                    onClick={() => setMostrarNuevaCatModal(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Nombre de la nueva categoría..."
                    value={nuevaCatNombre}
                    onChange={e => setNuevaCatNombre(e.target.value)}
                  />
                </div>

                {/* Selector de Icono */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Selecciona el Icono del tema:
                  </label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {ICONOS_DISPONIBLES.map(ic => (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => setNuevaCatIcono(ic.id)}
                        title={ic.nombre}
                        style={{
                          background: nuevaCatIcono === ic.id ? 'var(--accent-forest)' : 'rgba(255,255,255,0.05)',
                          border: nuevaCatIcono === ic.id ? '1.5px solid #22C55E' : '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-xs)',
                          padding: '5px 9px',
                          cursor: 'pointer',
                          fontSize: '1.05rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>{ic.emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setMostrarNuevaCatModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={crearCategoriaRapida}
                    disabled={!nuevaCatNombre.trim()}
                  >
                    Crear Categoría
                  </button>
                </div>
              </div>
            )}

            <select
              className="form-control"
              value={categoriaId}
              onChange={e => setCategoriaId(e.target.value)}
              required
            >
              {categorias.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Resumen Corto (Portada) *</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Breve resumen en 2 ó 3 líneas que enganche a los exploradores..."
              value={resumen}
              onChange={e => setResumen(e.target.value)}
              required
            />
          </div>

          {/* FOTO DE PORTADA EN DATOS PRINCIPALES (NO OBLIGATORIA) */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Image size={16} color="var(--accent-forest)" /> Foto de Portada (Opcional)
            </label>

            {previewPrincipal ? (
              <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <img src={previewPrincipal} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => { setImagenPrincipal(null); setPreviewPrincipal(null); }}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Eliminar foto de portada"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => filePortadaRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Upload size={22} style={{ margin: '0 auto 6px', color: 'var(--accent-forest)', display: 'block' }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Seleccionar Foto de Portada</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>JPG, PNG o WebP (opcional)</div>
              </div>
            )}
          </div>

          {esAdmin && (
            <div style={{ display: 'flex', gap: '20px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={esGuiaOficial} onChange={e => setEsGuiaOficial(e.target.checked)} />
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Marcar como Guía Oficial Camplink</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={destacado} onChange={e => setDestacado(e.target.checked)} />
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Destacar en Portada</span>
              </label>
            </div>
          )}
        </div>

        {/* INPUTS DE ARCHIVOS OCULTOS ACTIVADOS POR BOTONES */}
        <input
          ref={filePortadaRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={manejarImagenPrincipal}
        />
        <input
          ref={fileGaleriaRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={manejarImagenesGaleria}
        />
        <input
          ref={fileDescargaRef}
          type="file"
          accept=".stl,.pdf,.zip,.step,.dwg,.obj"
          style={{ display: 'none' }}
          onChange={e => setArchivoDescargable(e.target.files[0] || null)}
        />
        <input
          ref={fileImagenTextoRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={manejarSubirImagenTexto}
        />

        {/* TARJETA: REDACCIÓN Y RECURSOS MULTIMEDIA (SIN PREFIJO 2.) */}
        <div className="camper-card" style={{ padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={18} color="var(--accent-forest)" /> Redacción y Recursos Multimedia
            </h2>

            {/* Pestañas Editor / Vista Previa */}
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', padding: '3px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setPestañaActiva('editor')}
                style={{
                  border: 'none',
                  background: pestañaActiva === 'editor' ? 'var(--accent-forest)' : 'transparent',
                  color: pestañaActiva === 'editor' ? '#fff' : 'var(--text-muted)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Edit3 size={14} /> Escribir
              </button>
              <button
                type="button"
                onClick={() => setPestañaActiva('vistaPrevia')}
                style={{
                  border: 'none',
                  background: pestañaActiva === 'vistaPrevia' ? 'var(--accent-forest)' : 'transparent',
                  color: pestañaActiva === 'vistaPrevia' ? '#fff' : 'var(--text-muted)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Eye size={14} /> Vista Previa
              </button>
            </div>
          </div>

          {/* BARRA DE HERRAMIENTAS ENRIQUECIDA (FORMATO Y ADJUNTOS) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            borderBottom: 'none'
          }}>
            {/* Formato de Texto */}
            <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', borderRight: '1px solid var(--border-color)', paddingRight: '8px', marginRight: '4px' }}>
              <button
                type="button"
                title="Negrita (**texto**)"
                onClick={() => insertarFormato('**', '**', 'texto en negrita')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 8px', height: '32px' }}
              >
                <Bold size={15} />
              </button>
              <button
                type="button"
                title="Cursiva (*texto*)"
                onClick={() => insertarFormato('*', '*', 'texto en cursiva')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 8px', height: '32px' }}
              >
                <Italic size={15} />
              </button>
              <button
                type="button"
                title="Título de sección (## Título)"
                onClick={() => insertarFormato('\n## ', '\n', 'Título de la Sección')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 8px', height: '32px' }}
              >
                <Heading2 size={15} />
              </button>
              <button
                type="button"
                title="Subtítulo (### Subsección)"
                onClick={() => insertarFormato('\n### ', '\n', 'Subsección')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 8px', height: '32px' }}
              >
                <Heading3 size={15} />
              </button>
            </div>

            {/* Listas y Estructura */}
            <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', borderRight: '1px solid var(--border-color)', paddingRight: '8px', marginRight: '4px' }}>
              <button
                type="button"
                title="Lista con viñetas"
                onClick={() => insertarFormato('\n- ', '\n', 'Elemento clave')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 8px', height: '32px' }}
              >
                <List size={15} />
              </button>
              <button
                type="button"
                title="Lista numerada (pasos)"
                onClick={() => insertarFormato('\n1. ', '\n', 'Paso 1')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 8px', height: '32px' }}
              >
                <ListOrdered size={15} />
              </button>
              <button
                type="button"
                title="Cita o advertencia"
                onClick={() => insertarFormato('\n> ', '\n', 'Consejo o advertencia importante')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 8px', height: '32px' }}
              >
                <Quote size={15} />
              </button>
              <button
                type="button"
                title="Bloque de código o medidas"
                onClick={() => insertarFormato('\n```\n', '\n```\n', 'Medidas o código')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 8px', height: '32px' }}
              >
                <Code size={15} />
              </button>
            </div>

            {/* Botones de Adjuntos Multimedia */}
            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Insertar Foto en Texto (Paso a paso) */}
              <button
                type="button"
                onClick={() => fileImagenTextoRef.current?.click()}
                disabled={subiendoImagenTexto}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '6px 10px',
                  height: '32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderColor: 'var(--accent-forest)'
                }}
                title="Insertar foto explicativa entre el texto (ideal para paso a paso)"
              >
                <ImageIcon size={15} color="var(--accent-forest)" />
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                  {subiendoImagenTexto ? 'Subiendo...' : '+ Foto en Texto'}
                </span>
              </button>

              {/* Galería */}
              <button
                type="button"
                onClick={() => fileGaleriaRef.current?.click()}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '6px 10px',
                  height: '32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: previewsGaleria.length > 0 ? 'rgba(34, 197, 94, 0.15)' : undefined,
                  borderColor: previewsGaleria.length > 0 ? '#22C55E' : undefined
                }}
                title="Añadir fotos a la Galería Interior"
              >
                <Upload size={15} color={previewsGaleria.length > 0 ? '#22C55E' : undefined} />
                <span style={{ fontSize: '0.78rem' }}>
                  Galería {previewsGaleria.length > 0 ? `(${previewsGaleria.length})` : ''}
                </span>
              </button>

              {/* Vídeo */}
              <button
                type="button"
                onClick={() => setMostrarPanelVideo(!mostrarPanelVideo)}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '6px 10px',
                  height: '32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: videoUrl ? 'rgba(239, 68, 68, 0.15)' : undefined,
                  borderColor: videoUrl ? '#EF4444' : undefined
                }}
                title="Insertar Vídeo de YouTube o TikTok"
              >
                <Video size={15} color={videoUrl ? '#EF4444' : undefined} />
                <span style={{ fontSize: '0.78rem' }}>{videoUrl ? 'Vídeo ✓' : 'Vídeo'}</span>
              </button>

              {/* STL / Archivo 3D */}
              <button
                type="button"
                onClick={() => fileDescargaRef.current?.click()}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '6px 10px',
                  height: '32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: (archivoDescargable || nombreArchivoExistente) ? 'rgba(59, 130, 246, 0.15)' : undefined,
                  borderColor: (archivoDescargable || nombreArchivoExistente) ? '#3B82F6' : undefined
                }}
                title="Adjuntar modelo 3D (.STL), esquemas o planos"
              >
                <Box size={15} color={(archivoDescargable || nombreArchivoExistente) ? '#3B82F6' : undefined} />
                <span style={{ fontSize: '0.78rem' }}>
                  {archivoDescargable ? 'Archivo 3D ✓' : (nombreArchivoExistente ? 'Archivo 3D ✓' : 'Archivo 3D (.STL)')}
                </span>
              </button>

              {/* Enlace Externo */}
              <button
                type="button"
                onClick={() => setMostrarPanelEnlace(!mostrarPanelEnlace)}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '6px 10px',
                  height: '32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: enlaceExterno ? 'rgba(168, 85, 247, 0.15)' : undefined,
                  borderColor: enlaceExterno ? '#A855F7' : undefined
                }}
                title="Añadir botón de enlace externo"
              >
                <Link2 size={15} color={enlaceExterno ? '#A855F7' : undefined} />
                <span style={{ fontSize: '0.78rem' }}>{enlaceExterno ? 'Enlace ✓' : 'Enlace'}</span>
              </button>
            </div>
          </div>

          {/* PANELES DESPLEGABLES DE CONFIGURACIÓN RÁPIDA DE ADJUNTOS */}

          {/* Panel de Vídeo */}
          {mostrarPanelVideo && (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              borderTop: 'none',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Video size={14} color="#EF4444" /> Enlace de Vídeo (YouTube o TikTok)
                </span>
                <button
                  type="button"
                  onClick={() => setMostrarPanelVideo(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="url"
                  className="form-control form-control-sm"
                  placeholder="Ej: https://www.youtube.com/watch?v=LXb3EKWsInQ"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                />
                {videoUrl && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setVideoUrl('')}
                    title="Quitar vídeo"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {videoEmbed && (
                <div style={{ marginTop: '8px', maxWidth: '380px', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <iframe src={videoEmbed.embedUrl} title="preview video" style={{ width: '100%', height: '190px', border: 'none' }} allowFullScreen />
                </div>
              )}
            </div>
          )}

          {/* Panel de Enlace Externo */}
          {mostrarPanelEnlace && (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              borderTop: 'none',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ExternalLink size={14} color="#A855F7" /> Botón de Enlace Externo (Web de compra, plano, etc.)
                </span>
                <button
                  type="button"
                  onClick={() => setMostrarPanelEnlace(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '8px' }}>
                <input
                  type="url"
                  className="form-control form-control-sm"
                  placeholder="https://..."
                  value={enlaceExterno}
                  onChange={e => setEnlaceExterno(e.target.value)}
                />
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Texto del botón (ej: Comprar relé)"
                  value={enlaceExternoTexto}
                  onChange={e => setEnlaceExternoTexto(e.target.value)}
                />
                {enlaceExterno && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setEnlaceExterno(''); setEnlaceExternoTexto(''); }}
                    title="Quitar enlace"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* AREA PRINCIPAL: EDITOR O VISTA PREVIA */}
          {pestañaActiva === 'editor' ? (
            <div style={{ position: 'relative' }}>
              <textarea
                ref={textareaRef}
                className="form-control"
                rows={14}
                placeholder="Escribe el contenido de tu publicación... Puedes utilizar las herramientas de arriba para dar formato, títulos, listas o insertar fotos entre los pasos y archivos."
                value={contenido}
                onChange={e => setContenido(e.target.value)}
                required
                style={{
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  lineHeight: 1.7,
                  fontFamily: 'inherit',
                  fontSize: '0.96rem',
                  resize: 'vertical'
                }}
              />
            </div>
          ) : (
            <div style={{
              minHeight: '320px',
              padding: '24px',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border-color)',
              borderRadius: '0 0 var(--radius-sm) var(--radius-sm)'
            }}>
              {/* Vista Previa Portada si existe */}
              {previewPrincipal && (
                <div style={{ marginBottom: '20px', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '260px' }}>
                  <img src={previewPrincipal} alt="Portada" style={{ width: '100%', height: '260px', objectFit: 'cover' }} />
                </div>
              )}

              {/* Render de Markdown con soporte de fotos en texto */}
              {renderizarMarkdown(contenido)}

              {/* Galería interior en preview */}
              {previewsGaleria.length > 0 && (
                <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Galería fotográfica interior</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                    {previewsGaleria.map((p, i) => (
                      <div key={i} style={{ height: '90px', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                        <img src={p.url} alt="galeria" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video en preview */}
              {videoEmbed && (
                <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Vídeo explicativo</h4>
                  <div style={{ maxWidth: '480px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <iframe src={videoEmbed.embedUrl} title="video" style={{ width: '100%', height: '250px', border: 'none' }} allowFullScreen />
                  </div>
                </div>
              )}

              {/* Archivo 3D en preview */}
              {(archivoDescargable || nombreArchivoExistente) && (
                <div style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3B82F6', borderRadius: 'var(--radius-sm)' }}>
                  <Box size={20} color="#3B82F6" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Archivo 3D / Plano descargable adjunto</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{archivoDescargable ? archivoDescargable.name : nombreArchivoExistente}</div>
                  </div>
                </div>
              )}

              {/* Botón externo en preview */}
              {enlaceExterno && (
                <div style={{ marginTop: '20px' }}>
                  <a href={enlaceExterno} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ExternalLink size={14} /> {enlaceExternoTexto || 'Abrir Enlace Externo'}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* BARRA DE ARCHIVOS Y MULTIMEDIA ADJUNTOS CON OPCIÓN DE ELIMINAR */}
          {(previewPrincipal || previewsGaleria.length > 0 || archivoDescargable || nombreArchivoExistente) && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Archivos Adjuntos a la Publicación:
              </span>

              {/* Portada Miniatura */}
              {previewPrincipal && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-xs)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={previewPrincipal} alt="Portada" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Foto de Portada Principal</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setImagenPrincipal(null); setPreviewPrincipal(null); }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '2px 8px', color: '#EF4444' }}
                    title="Quitar foto de portada"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}

              {/* Galería Miniaturas */}
              {previewsGaleria.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Fotos de Galería ({previewsGaleria.length}):</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {previewsGaleria.map((p, idx) => (
                      <div key={idx} style={{ position: 'relative', width: 48, height: 48, borderRadius: 4, overflow: 'hidden' }}>
                        <img src={p.url} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => eliminarFotoGaleria(idx)}
                          style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            background: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '50%',
                            width: 16,
                            height: 16,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Archivo 3D */}
              {(archivoDescargable || nombreArchivoExistente) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-xs)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box size={16} color="#3B82F6" />
                    <span style={{ fontSize: '0.85rem' }}>
                      {archivoDescargable ? archivoDescargable.name : nombreArchivoExistente}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setArchivoDescargable(null); setNombreArchivoExistente(''); }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '2px 8px', color: '#EF4444' }}
                    title="Quitar archivo adjunto"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ACCIONES FINALES */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
          <button type="button" className="btn btn-secondary" onClick={alVolver} disabled={enviando}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={enviando}
            style={{ padding: '10px 28px', fontWeight: 700, fontSize: '0.95rem' }}
          >
            {enviando
              ? 'Guardando...'
              : esEdicion
                ? 'Guardar Cambios'
                : esAdmin
                  ? 'Publicar Ahora'
                  : 'Enviar para Revisión'}
          </button>
        </div>
      </form>
    </div>
  );
}