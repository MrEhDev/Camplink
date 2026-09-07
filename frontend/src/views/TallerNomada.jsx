// Aquí implemento la vista del Taller Nómada (foro comunitario de mantenimiento, bricolaje y piezas 3D),
// con soporte para adjuntar, debatir y compartir archivos de impresión 3D (.stl) para vehículos camper.

import React, { useState, useEffect } from 'react';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Wrench, Box, Hammer, PlusCircle, ArrowLeft, MessageSquare, Download, Send, FileCode } from 'lucide-react';

export default function TallerNomada() {
  // Aquí controlo los temas del foro, categorías activas y respuestas
  const { usuario } = useAuth();
  const [temas, setTemas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [temaSeleccionado, setTemaSeleccionado] = useState(null);

  // Formulario nuevo tema
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('mantenimiento');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [archivoStl, setArchivoStl] = useState(null);
  const [creando, setCreando] = useState(false);

  // Respuesta al tema
  const [mensajeRespuesta, setMensajeRespuesta] = useState('');
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

  const cargarTemas = async () => {
    // Aquí obtengo los hilos de debate del Taller Nómada
    setCargando(true);
    try {
      const url = categoriaActiva === 'todos'
        ? '/api/comunidad/taller/'
        : `/api/comunidad/taller/?categoria=${categoriaActiva}`;
      const data = await peticionApi(url);
      setTemas(data);
    } catch (err) {
      console.error('Error al cargar temas del taller:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTemas();
  }, [categoriaActiva]);

  const crearTema = async (e) => {
    // Aquí creo un nuevo hilo en el foro con soporte para subida de archivo .stl
    e.preventDefault();
    if (!usuario) return alert('Debes iniciar sesión para publicar un tema.');

    setCreando(true);
    try {
      const formData = new FormData();
      formData.append('titulo', nuevoTitulo);
      formData.append('categoria', nuevaCategoria);
      formData.append('descripcion', nuevaDescripcion);
      if (archivoStl) formData.append('archivo_stl', archivoStl);

      await peticionApi('/api/comunidad/taller/', {
        method: 'POST',
        body: formData
      });

      setMostrarFormNuevo(false);
      setNuevoTitulo('');
      setNuevaDescripcion('');
      setArchivoStl(null);
      cargarTemas();
    } catch (err) {
      alert(err.message || 'Error al publicar tema');
    } finally {
      setCreando(false);
    }
  };

  const enviarRespuesta = async (e) => {
    // Aquí envío una respuesta al hilo activo
    e.preventDefault();
    if (!mensajeRespuesta.trim()) return;

    setEnviandoRespuesta(true);
    try {
      await peticionApi(`/api/comunidad/taller/${temaSeleccionado.id}/responder/`, {
        method: 'POST',
        body: { mensaje: mensajeRespuesta }
      });
      setMensajeRespuesta('');
      // Recargo el tema seleccionado
      const actualizado = await peticionApi(`/api/comunidad/taller/${temaSeleccionado.id}/`);
      setTemaSeleccionado(actualizado);
    } catch (err) {
      alert('Error al enviar la respuesta.');
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  if (temaSeleccionado) {
    // Vista de Hilo Completo con Respuestas
    return (
      <div className="camplink-container" style={{ padding: '30px 20px 80px', maxWidth: '850px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setTemaSeleccionado(null)} style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Volver al Taller Nómada
        </button>

        <div className="camper-card" style={{ padding: '30px', marginBottom: '24px' }}>
          <span className="badge-camper badge-earth" style={{ marginBottom: '10px' }}>
            {temaSeleccionado.categoria_display || temaSeleccionado.categoria}
          </span>
          <h1 style={{ fontSize: '1.8rem', margin: '8px 0 14px' }}>{temaSeleccionado.titulo}</h1>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Iniciado por <strong>{temaSeleccionado.autor_detalle?.username}</strong> el {new Date(temaSeleccionado.fecha_creacion).toLocaleDateString('es-ES')}
          </div>

          <p style={{ fontSize: '0.98rem', lineHeight: '1.7', color: 'var(--text-primary)', whiteSpace: 'pre-line', marginBottom: '24px' }}>
            {temaSeleccionado.descripcion}
          </p>

          {/* Archivo 3D .STL adjunto */}
          {temaSeleccionado.archivo_stl && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              background: 'rgba(217, 119, 54, 0.1)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(217, 119, 54, 0.3)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileCode size={24} color="var(--accent-earth)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Modelo 3D Imprimible (.STL)</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Compatible con Cura, PrusaSlicer, Bambu Studio</div>
                </div>
              </div>
              <a
                href={temaSeleccionado.archivo_stl}
                className="btn btn-accent btn-sm"
                download
                target="_blank"
                rel="noreferrer"
              >
                <Download size={15} /> Descargar .STL
              </a>
            </div>
          )}
        </div>

        {/* Listado de Respuestas */}
        <div className="camper-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '18px' }}>
            Respuestas de la Comunidad ({temaSeleccionado.respuestas?.length || 0})
          </h3>

          {temaSeleccionado.respuestas && temaSeleccionado.respuestas.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {temaSeleccionado.respuestas.map((r) => (
                <div key={r.id} style={{ background: 'var(--bg-primary)', padding: '14px 18px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-forest)' }}>{r.autor_detalle?.username}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{new Date(r.fecha_creacion).toLocaleDateString('es-ES')}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                    {r.mensaje}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Aún no hay respuestas en este hilo. ¡Aporta tu experiencia!
            </div>
          )}

          {/* Formulario de Respuesta */}
          {usuario ? (
            <form onSubmit={enviarRespuesta}>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Escribe tu consejo, alternativa o solución mecánica..."
                value={mensajeRespuesta}
                onChange={(e) => setMensajeRespuesta(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '10px' }} disabled={enviandoRespuesta}>
                <Send size={14} /> {enviandoRespuesta ? 'Enviando...' : 'Responder al Hilo'}
              </button>
            </form>
          ) : (
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Inicia sesión para responder en el taller nómada.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="camplink-container" style={{ padding: '30px 20px 80px', maxWidth: '1000px' }}>
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', margin: 0 }}>🔧 Taller Nómada</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Mantenimiento preventivo, camperizaciones caseras y piezas 3D imprimibles (.stl).
          </p>
        </div>

        {usuario && (
          <button className="btn btn-primary" onClick={() => setMostrarFormNuevo(!mostrarFormNuevo)}>
            <PlusCircle size={16} /> {mostrarFormNuevo ? 'Cancelar' : 'Nuevo Tema'}
          </button>
        )}
      </div>

      {/* FILTROS POR SECCIÓN */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button
          className={`btn btn-sm ${categoriaActiva === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCategoriaActiva('todos')}
        >
          Todo el Taller
        </button>
        <button
          className={`btn btn-sm ${categoriaActiva === 'mantenimiento' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCategoriaActiva('mantenimiento')}
        >
          <Wrench size={14} /> Mantenimiento
        </button>
        <button
          className={`btn btn-sm ${categoriaActiva === 'bricolaje' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCategoriaActiva('bricolaje')}
        >
          <Hammer size={14} /> Bricolaje & Camperización
        </button>
        <button
          className={`btn btn-sm ${categoriaActiva === 'piezas_3d' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCategoriaActiva('piezas_3d')}
        >
          <Box size={14} /> Piezas 3D (.STL)
        </button>
      </div>

      {/* FORMULARIO NUEVO TEMA */}
      {mostrarFormNuevo && (
        <div className="camper-card" style={{ marginBottom: '30px', padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Abrir Nuevo Hilo en el Taller</h3>
          <form onSubmit={crearTema}>
            <div className="form-group">
              <label className="form-label">Título del Tema</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Clip para oscurecedores Remis en 3D o Duda purga circuito de gas"
                value={nuevoTitulo}
                onChange={(e) => setNuevoTitulo(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sección del Taller</label>
              <select
                className="form-control"
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
              >
                <option value="mantenimiento">Mantenimiento de Vehículo y Accesorios</option>
                <option value="bricolaje">Bricolaje y Camperización</option>
                <option value="piezas_3d">Piezas 3D y Modelos STL</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Explicación Detallada</label>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Describe el problema, solución, medidas o consejos..."
                value={nuevaDescripcion}
                onChange={(e) => setNuevaDescripcion(e.target.value)}
                required
              />
            </div>

            {/* Subida de archivo .stl */}
            <div className="form-group">
              <label className="form-label">Archivo de Impresión 3D (.STL opcional)</label>
              <input
                type="file"
                accept=".stl"
                className="form-control"
                onChange={(e) => setArchivoStl(e.target.files[0] || null)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Sube tus diseños 3D (soportes, bisagras, pestañas) para que la comunidad los imprima.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" disabled={creando}>
              {creando ? 'Publicando...' : 'Crear Hilo de Debate'}
            </button>
          </form>
        </div>
      )}

      {/* LISTADO DE HILOS */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Cargando debates del taller...
        </div>
      ) : temas.length === 0 ? (
        <div className="camper-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No hay temas registrados en esta sección del taller. ¡Inicia el primero!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {temas.map((tema) => (
            <div
              key={tema.id}
              className="camper-card"
              style={{
                cursor: 'pointer',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px'
              }}
              onClick={() => setTemaSeleccionado(tema)}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge-camper badge-earth">
                    {tema.categoria_display || tema.categoria}
                  </span>
                  {tema.archivo_stl && (
                    <span className="badge-camper badge-forest" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Box size={12} /> Incluye .STL
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0 0 6px' }}>
                  {tema.titulo}
                </h3>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Por <strong>{tema.autor_detalle?.username}</strong> • {new Date(tema.fecha_creacion).toLocaleDateString('es-ES')}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                <MessageSquare size={16} />
                <span>{tema.total_respuestas}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}