// Aquí implemento la vista de la Guía del Nómada (blog oficial), donde el Administrador
// publica artículos técnicos (servidores multimedia offline, placas solares, supervivencia camper).

import React, { useState, useEffect } from 'react';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Shield, Sparkles, PlusCircle, ArrowLeft, Calendar, Tag } from 'lucide-react';

export default function GuiaDelNomada() {
  // Aquí controlo los artículos de la guía, la lectura de artículo seleccionado y el alta admin
  const { usuario } = useAuth();
  const [articulos, setArticulos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);

  // Formulario nuevo artículo para Admin
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('supervivencia');
  const [nuevoResumen, setNuevoResumen] = useState('');
  const [nuevoContenido, setNuevoContenido] = useState('');
  const [esDestacado, setEsDestacado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargarArticulos = async () => {
    // Aquí obtengo todos los artículos publicados en la Guía
    setCargando(true);
    try {
      const data = await peticionApi('/api/comunidad/guia/');
      setArticulos(data);
    } catch (err) {
      console.error('Error al cargar artículos de la guía:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarArticulos();
  }, []);

  const crearArticulo = async (e) => {
    // Aquí guardo el nuevo artículo en Django validando permisos de Administrador
    e.preventDefault();
    setGuardando(true);

    try {
      await peticionApi('/api/comunidad/guia/', {
        method: 'POST',
        body: {
          titulo: nuevoTitulo,
          categoria: nuevaCategoria,
          resumen: nuevoResumen,
          contenido: nuevoContenido,
          destacado: esDestacado
        }
      });
      setMostrarFormNuevo(false);
      setNuevoTitulo('');
      setNuevoResumen('');
      setNuevoContenido('');
      cargarArticulos();
    } catch (err) {
      alert(err.message || 'Error al publicar artículo.');
    } finally {
      setGuardando(false);
    }
  };

  if (articuloSeleccionado) {
    // Vista de Lectura Completa del Artículo
    return (
      <div className="camplink-container" style={{ padding: '30px 20px 80px', maxWidth: '800px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setArticuloSeleccionado(null)} style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Volver a la Guía del Nómada
        </button>

        <article className="camper-card" style={{ padding: '36px' }}>
          <span className="badge-camper badge-forest" style={{ marginBottom: '12px' }}>
            {articuloSeleccionado.categoria_display || articuloSeleccionado.categoria}
          </span>
          <h1 style={{ fontSize: '2.2rem', margin: '10px 0 16px', lineHeight: 1.3 }}>
            {articuloSeleccionado.titulo}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <span>Por {articuloSeleccionado.autor_detalle?.username || 'Administrador'}</span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> {new Date(articuloSeleccionado.fecha_publicacion).toLocaleDateString('es-ES')}
            </span>
          </div>

          <div style={{
            fontSize: '1.05rem',
            lineHeight: 1.8,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-line'
          }}>
            {articuloSeleccionado.contenido}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="camplink-container" style={{ padding: '30px 20px 80px', maxWidth: '1000px' }}>
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', margin: 0 }}>📚 Guía del Nómada</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manuales de supervivencia, instalaciones eléctricas, domótica offline y vida camper.
          </p>
        </div>

        {/* Solo el Administrador puede publicar nuevos artículos */}
        {usuario?.es_admin && (
          <button className="btn btn-primary" onClick={() => setMostrarFormNuevo(!mostrarFormNuevo)}>
            <PlusCircle size={16} /> {mostrarFormNuevo ? 'Cancelar' : 'Nuevo Artículo (Admin)'}
          </button>
        )}
      </div>

      {/* FORMULARIO ADMIN */}
      {mostrarFormNuevo && (
        <div className="camper-card" style={{ marginBottom: '30px', padding: '24px', border: '2px solid var(--accent-forest)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={18} color="var(--accent-forest)" /> Redactar para la Guía del Nómada
          </h3>

          <form onSubmit={crearArticulo}>
            <div className="form-group">
              <label className="form-label">Título del Artículo</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Montar un Servidor Multimedia con Jellyfin para Días de Lluvia"
                value={nuevoTitulo}
                onChange={(e) => setNuevoTitulo(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Categoría Temática</label>
              <select
                className="form-control"
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
              >
                <option value="supervivencia">Supervivencia y Acampada</option>
                <option value="tecnologia_offline">Servidores Multimedia y Tecnología Offline</option>
                <option value="electricidad">Baterías, Placas Solares y Electricidad</option>
                <option value="mantenimiento_pro">Mantenimiento Avanzado del Vehículo</option>
                <option value="rutas_secretas">Rutas Escondidas y Consejos Nómadas</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Resumen Breve (Para portada)</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Breve introducción de 2 líneas..."
                value={nuevoResumen}
                onChange={(e) => setNuevoResumen(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contenido Detallado</label>
              <textarea
                className="form-control"
                rows="8"
                placeholder="Desarrolla paso a paso las instrucciones, materiales, comandos y consejos..."
                value={nuevoContenido}
                onChange={(e) => setNuevoContenido(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={esDestacado}
                  onChange={(e) => setEsDestacado(e.target.checked)}
                />
                <span style={{ fontWeight: 600 }}>Destacar este artículo en la cabecera</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Publicando...' : 'Publicar Artículo Oficial'}
            </button>
          </form>
        </div>
      )}

      {/* LISTADO DE ARTÍCULOS */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Cargando manuales nómadas...
        </div>
      ) : articulos.length === 0 ? (
        <div className="camper-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No hay artículos publicados en la Guía todavía.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {articulos.map((art) => (
            <div key={art.id} className="camper-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="badge-camper badge-forest" style={{ marginBottom: '10px' }}>
                  {art.categoria_display || art.categoria}
                </span>
                <h3 style={{ fontSize: '1.2rem', margin: '8px 0 10px', color: 'var(--text-primary)' }}>
                  {art.titulo}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
                  {art.resumen}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {new Date(art.fecha_publicacion).toLocaleDateString('es-ES')}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={() => setArticuloSeleccionado(art)}>
                  Leer Guía Completa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}