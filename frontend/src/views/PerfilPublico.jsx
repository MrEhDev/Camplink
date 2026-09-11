const formatearUsuario = (u) => {
  if (!u) return '';
  const s = String(u);
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const limpiarNombreMedalla = (nombre) => {
  if (!nombre) return '';
  return nombre
    .replace(/\s*[-–—]\s*(madera|bronce|plata|oro|platino)/gi, '')
    .replace(/\s*\((madera|bronce|plata|oro|platino)\)/gi, '')
    .replace(/\s+de\s+(madera|bronce|plata|oro|platino)/gi, '')
    .trim();
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
  Sparkles, Globe, ChevronDown, ChevronUp 
} from 'lucide-react';

export default function PerfilPublico({ usuarioId, alVolver, alSeleccionarLugar, origenVista }) {
  // Aquí controlo los datos del perfil público, las publicaciones del autor y el estado de seguimiento
  const { usuario: usuarioActual } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [siguiendoCargando, setSiguiendoCargando] = useState(false);
  const [mostrarTodasMedallas, setMostrarTodasMedallas] = useState(false);

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
    if (!usuarioActual || !perfil) return;
    setSiguiendoCargando(true);
    try {
      const res = await peticionApi(`/api/exploradores/amigos/alternar_seguimiento/`, {
        method: 'POST',
        body: JSON.stringify({ usuario_id: perfil.id }),
      });
      setPerfil((prev) => ({
        ...prev,
        lo_sigo: res.siguiendo,
        total_seguidores: res.total_seguidores_destino,
      }));
    } catch (err) {
      console.error('Error al cambiar seguimiento:', err);
    } finally {
      setSiguiendoCargando(false);
    }
  };

  const obtenerColorNivel = (nivel) => {
    // Aquí asigno los colores de trofeo según su metal
    switch (nivel) {
      case 'platino': return '#00E5FF';
      case 'oro': return '#F2A900';
      case 'plata': return '#A8A9AD';
      case 'bronce': return '#CD7F32';
      case 'madera': return '#8B5A2B';
      default: return 'var(--accent-forest)';
    }
  };

  if (cargando) {
    return (
      <div className="camplink-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Compass className="animate-spin" size={48} color="var(--accent-forest)" />
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Cargando perfil del explorador...</p>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="camplink-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2>Explorador no encontrado</h2>
        <p style={{ color: 'var(--text-muted)' }}>El perfil que buscas no existe o ha dejado la ruta.</p>
        <button className="btn btn-primary" onClick={alVolver} style={{ marginTop: '16px' }}>
          Volver
        </button>
      </div>
    );
  }

  const esMio = usuarioActual && usuarioActual.id === perfil.id;
  const loSigo = perfil.lo_sigo;

  const textoRetorno = origenVista === 'perfil'
    ? 'Volver a Mi Perfil'
    : origenVista === 'taller'
    ? 'Volver al Taller'
    : origenVista === 'diario'
    ? 'Volver al Diario de Ruta'
    : 'Volver atrás';

  return (
    <div className="camplink-container" style={{ padding: '30px 20px 80px', maxWidth: '950px' }}>
      {/* Botón de Retorno contextual según de dónde viene el explorador */}
      <button 
        type="button" 
        className="btn btn-secondary btn-sm" 
        onClick={alVolver}
        style={{ marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      >
        <ArrowLeft size={15} /> {textoRetorno}
      </button>

      {/* TARJETA CABECERA DEL PERFIL PÚBLICO */}
      <div className="camper-card" style={{ padding: '32px', marginBottom: '28px' }}>
        {/* Fila Principal: Avatar y Datos de Usuario a la izquierda | Estadísticas y Seguir a la derecha */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
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
                <img loading="lazy" decoding="async" src={perfil.avatar} alt={perfil.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                perfil.username?.charAt(0).toUpperCase()
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.9rem', margin: 0, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {formatearUsuario(perfil.username)}
                </h1>
                <span className="badge-camper badge-forest">
                  {perfil.tipo_viajero_display || perfil.tipo_viajero}
                </span>
                {perfil.es_admin && <span className="badge-camper badge-earth">Admin</span>}
              </div>

              <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                {(perfil.provincia || perfil.poblacion) && (
                  <span>📍 {perfil.provincia || perfil.poblacion}{perfil.pais ? `, ${perfil.pais}` : ''}</span>
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

        {/* BANDA DE MEDALLAS DESTACADAS A TODO EL ANCHO DE LA TARJETA (2 FILAS INICIALES + VER MÁS) */}
        {perfil.trofeos_destacados && perfil.trofeos_destacados.length > 0 && (() => {
          const LIMITE_INICIAL = 8;
          const medallasVisibles = mostrarTodasMedallas 
            ? perfil.trofeos_destacados 
            : perfil.trofeos_destacados.slice(0, LIMITE_INICIAL);
          const hayMas = perfil.trofeos_destacados.length > LIMITE_INICIAL;

          return (
            <div style={{
              width: '100%',
              marginTop: '22px',
              paddingTop: '18px',
              borderTop: '1px solid var(--border-color)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                width: '100%'
              }}>
                {medallasVisibles.map((tr) => {
                  const nivel = (tr.nivel || '').toLowerCase();
                  const esPlatino = nivel === 'platino';
                  const esOro = nivel === 'oro';
                  const esPlata = nivel === 'plata';
                  const esBronce = nivel === 'bronce';

                  // Colores temáticos y gradientes metálicos realistas
                  const colorBorde = esPlatino 
                    ? '#00E5FF' 
                    : esOro 
                    ? '#F2A900' 
                    : esPlata 
                    ? '#C5CCD6' 
                    : esBronce 
                    ? '#CD7F32' 
                    : '#A06A3B';

                  const gradienteBg = esPlatino
                    ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.22), rgba(0, 229, 255, 0.06))'
                    : esOro
                    ? 'linear-gradient(135deg, rgba(242, 169, 0, 0.24), rgba(242, 169, 0, 0.07))'
                    : esPlata
                    ? 'linear-gradient(135deg, rgba(200, 208, 218, 0.22), rgba(200, 208, 218, 0.07))'
                    : esBronce
                    ? 'linear-gradient(135deg, rgba(205, 127, 50, 0.24), rgba(205, 127, 50, 0.07))'
                    : 'linear-gradient(135deg, rgba(160, 106, 59, 0.22), rgba(160, 106, 59, 0.06))';

                  const sombraMedalla = esPlatino
                    ? '0 2px 10px rgba(0, 229, 255, 0.35)'
                    : esOro
                    ? '0 2px 8px rgba(242, 169, 0, 0.3)'
                    : esPlata
                    ? '0 2px 7px rgba(197, 204, 214, 0.22)'
                    : esBronce
                    ? '0 2px 7px rgba(205, 127, 50, 0.22)'
                    : '0 2px 5px rgba(0, 0, 0, 0.2)';

                  const iconoMedalla = esPlatino ? '👑' : esOro ? '🥇' : esPlata ? '🥈' : esBronce ? '🥉' : '🪵';
                  const nombreLimpio = limpiarNombreMedalla(tr.nombre);

                  return (
                    <div
                      key={tr.id}
                      title={`${nombreLimpio}: ${tr.descripcion || ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: gradienteBg,
                        border: `1.5px solid ${colorBorde}`,
                        boxShadow: sombraMedalla,
                        color: 'var(--text-primary)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                      }}
                    >
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: `1.5px solid ${colorBorde}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)'
                      }}>
                        {iconoMedalla}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontSize: '0.86rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {nombreLimpio}
                        </div>
                        {tr.descripcion && (
                          <div style={{
                            fontSize: '0.74rem',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginTop: '2px'
                          }}>
                            {tr.descripcion}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hayMas && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setMostrarTodasMedallas(!mostrarTodasMedallas)}
                    style={{
                      fontSize: '0.82rem',
                      padding: '6px 18px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    {mostrarTodasMedallas ? (
                      <>
                        <span>Mostrar menos</span>
                        <ChevronUp size={14} />
                      </>
                    ) : (
                      <>
                        <span>Ver más medallas ({perfil.trofeos_destacados.length - LIMITE_INICIAL} más)</span>
                        <ChevronDown size={14} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })()}

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
                    <img loading="lazy" decoding="async" src={pub.imagen} alt="Foto de ruta" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover' }} />
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
