const formatearUsuario = (u) => {
  if (!u) return '';
  const s = String(u);
  return s.charAt(0).toUpperCase() + s.slice(1);
};
// Aquí implemento la vista del Perfil Público de un Explorador en Camplink,
// mostrando en la cabecera principal sus trofeos destacados junto a su avatar y datos de viajero,
// su biografía nómada, relaciones de seguimiento y publicaciones del Diario de Ruta,
// manteniendo un diseño limpio y sin secciones duplicadas.

import React, { useState, useEffect } from 'react';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, UserPlus, UserCheck, MapPin, 
  Calendar, Award, MessageSquare, Compass, 
  Sparkles, Globe 
} from 'lucide-react';

export default function PerfilPublico({ usuarioId, alVolver, alSeleccionarLugar }) {
  // Aquí controlo los datos del perfil público, las publicaciones del autor y el estado de seguimiento
  const { usuario: usuarioActual } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [siguiendoCargando, setSiguiendoCargando] = useState(false);

  const cargarPerfilYPosts = async () => {
    // Aquí obtengo la ficha del explorador y sus entradas públicas en el Diario de Ruta
    setCargando(true);
    try {
      const [perfilData, postsData] = await Promise.all([
        peticionApi(`/api/exploradores/lista/${usuarioId}/`),
        peticionApi(`/api/diario/publicaciones/?autor=${usuarioId}`),
      ]);
      setPerfil(perfilData);
      setPublicaciones(postsData.results || postsData);
    } catch (err) {
      console.error('Error al cargar perfil público:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (usuarioId) {
      cargarPerfilYPosts();
    }
  }, [usuarioId]);

  const alternarSeguimiento = async () => {
    // Aquí gestiono la acción de seguir o dejar de seguir al explorador
    if (!usuarioActual) {
      alert('Debes iniciar sesión para seguir a otros exploradores.');
      return;
    }
    setSiguiendoCargando(true);
    try {
      const res = await peticionApi(`/api/exploradores/seguir/${usuarioId}/`, {
        method: 'POST'
      });
      setPerfil(prev => ({
        ...prev,
        estado_seguimiento: res.estado,
        total_seguidores: res.estado === 'aceptada' 
          ? (prev.total_seguidores + 1) 
          : Math.max(0, prev.total_seguidores - 1)
      }));
    } catch (err) {
      console.error('Error al seguir usuario:', err);
      alert('No se pudo completar la acción.');
    } finally {
      setSiguiendoCargando(false);
    }
  };

  const obtenerColorNivel = (nivel) => {
    // Aquí asigno los colores de trofeo según su metal
    switch (nivel) {
      case 'madera': return '#8B5A2B';
      case 'bronce': return '#CD7F32';
      case 'plata': return '#A8A9AD';
      case 'oro': return '#F2A900';
      case 'platino': return '#00E5FF';
      default: return 'var(--accent-forest)';
    }
  };

  if (cargando) {
    return (
      <div className="camplink-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: '2.5rem' }}>🚐</span>
        <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Cargando perfil público del explorador...</p>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="camplink-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Explorador no encontrado</h2>
        <button className="btn btn-secondary" onClick={alVolver} style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} /> Volver al Diario de Ruta
        </button>
      </div>
    );
  }

  const esMio = usuarioActual && usuarioActual.id === perfil.id;
  const loSigo = perfil.estado_seguimiento === 'aceptada';

  return (
    <div className="camplink-container" style={{ padding: '30px 20px 80px', maxWidth: '950px' }}>
      {/* Botón de Retorno */}
      <button 
        className="btn btn-secondary btn-sm" 
        onClick={alVolver}
        style={{ marginBottom: '20px' }}
      >
        <ArrowLeft size={15} /> Volver al Diario de Ruta
      </button>

      {/* TARJETA CABECERA DEL PERFIL PÚBLICO CON TROFEOS DESTACADOS */}
      <div className="camper-card" style={{ padding: '32px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: '280px' }}>
            {/* Avatar del Explorador */}
            <div style={{
              width: '84px',
              height: '84px',
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
              flexShrink: 0
            }}>
              {perfil.avatar ? (
                <img src={perfil.avatar} alt={perfil.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                perfil.username?.charAt(0).toUpperCase()
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.9rem', margin: 0, color: 'var(--text-primary)' }}>
                  {perfil.username}
                </h1>
                <span className="badge-camper badge-forest">
                  {perfil.tipo_viajero_display || perfil.tipo_viajero}
                </span>
                {perfil.es_admin && <span className="badge-camper badge-earth">Admin</span>}
              </div>

              {/* INSIGNIAS DE TROFEOS DESTACADOS EN EL HEADER */}
              {perfil.trofeos_destacados && perfil.trofeos_destacados.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Insignias:
                  </span>
                  {perfil.trofeos_destacados.map((tr) => {
                    const colorNivel = obtenerColorNivel(tr.nivel);
                    const esPlatino = tr.nivel === 'platino';
                    return (
                      <div
                        key={tr.id}
                        title={`[${tr.nivel.toUpperCase()}] ${tr.nombre}: ${tr.descripcion}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: `${colorNivel}22`,
                          border: `1.5px solid ${colorNivel}`,
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          boxShadow: esPlatino ? '0 0 10px rgba(0, 229, 255, 0.4)' : undefined,
                        }}
                      >
                        <span>{esPlatino ? '👑' : tr.nivel === 'oro' ? '🥇' : tr.nivel === 'plata' ? '🥈' : tr.nivel === 'bronce' ? '🥉' : '🪵'}</span>
                        <span>{tr.nombre}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                {perfil.poblacion && (
                  <span>📍 {perfil.poblacion}, {perfil.pais}</span>
                )}
                <span>
                  📅 En ruta desde {new Date(perfil.date_joined).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Estadísticas de Seguimiento y Botón Seguir */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '0 8px' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {perfil.total_seguidores}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Seguidores
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '0 8px' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {perfil.total_siguiendo}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Siguiendo
              </div>
            </div>

            {!esMio && usuarioActual && (
              <button
                className={`btn ${loSigo ? 'btn-secondary' : 'btn-primary'}`}
                onClick={alternarSeguimiento}
                disabled={siguiendoCargando}
                style={{ padding: '10px 20px' }}
              >
                {loSigo ? (
                  <>
                    <UserCheck size={16} /> Siguiendo
                  </>
                ) : (
                  <>
                    <UserPlus size={16} /> Seguir Explorador
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Biografía Nómada */}
        {perfil.biografia && (
          <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.96rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0, fontStyle: 'italic' }}>
              "{perfil.biografia}"
            </p>
          </div>
        )}
      </div>

      {/* HISTORIAL PÚBLICO DEL DIARIO DE RUTA (SIN LA VITRINA DUPLICADA INFERIOR) */}
      <div className="camper-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={20} color="var(--accent-forest)" /> Vivencias en el Diario de Ruta
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Publicaciones compartidas con la comunidad camper.
            </p>
          </div>
          <span className="badge-camper badge-forest">
            {publicaciones.length} Publicaciones
          </span>
        </div>

        {publicaciones.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>
            Este explorador aún no ha compartido vivencias públicas en el diario.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {publicaciones.map((pub) => (
              <article
                key={pub.id}
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(pub.fecha_creacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>

                  {pub.lugar_detalle && alSeleccionarLugar && (
                    <button
                      className="badge-camper badge-forest"
                      style={{ cursor: 'pointer', border: 'none' }}
                      onClick={() => alSeleccionarLugar(pub.lugar_detalle.id)}
                    >
                      <MapPin size={12} /> {pub.lugar_detalle.nombre}
                    </button>
                  )}
                </div>

                <p style={{ fontSize: '0.94rem', color: 'var(--text-primary)', lineHeight: '1.5', margin: '0 0 12px' }}>
                  {pub.contenido}
                </p>

                {pub.imagen && (
                  <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '12px' }}>
                    <img src={pub.imagen} alt="Foto de ruta" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover' }} />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  <MessageSquare size={15} />
                  <span>{pub.total_comentarios || pub.comentarios?.length || 0} Comentarios</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
