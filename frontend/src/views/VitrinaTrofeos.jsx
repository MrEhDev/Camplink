// Aquí implemento la Vitrina de Trofeos de Camplink con 16 tarjetas temáticas optimizadas,
// mostrando la medalla más alta conseguida por categoría, barras de progreso dinámicas hacia el siguiente nivel
// y el panel supremo de la Corona Platino al conseguir los 16 Oros.

import React, { useState, useEffect } from 'react';
import { peticionApi } from '../services/api';
import { 
  Award, Crown, Lock, Sparkles, CheckCircle2, 
  Truck, Moon, MapPin, Camera, Star, Globe, 
  Map, BatteryCharging, Shield, Users, Compass, 
  Wrench, FileText, UserCheck, Calendar
} from 'lucide-react';

export default function VitrinaTrofeos() {
  const [datosTrofeos, setDatosTrofeos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todas'); // 'todas', 'completadas', 'en_progreso'

  const cargarTrofeos = async () => {
    setCargando(true);
    try {
      const data = await peticionApi('/api/viajes/trofeos/');
      setDatosTrofeos(data);
    } catch (err) {
      console.error('Error al cargar vitrina de trofeos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTrofeos();
  }, []);

  const obtenerIconoCategoria = (iconoNombre, color) => {
    const props = { size: 24, color: color || 'currentColor' };
    switch (iconoNombre) {
      case 'truck': return <Truck {...props} />;
      case 'moon': return <Moon {...props} />;
      case 'map-pin': return <MapPin {...props} />;
      case 'camera': return <Camera {...props} />;
      case 'star': return <Star {...props} />;
      case 'globe': return <Globe {...props} />;
      case 'map': return <Map {...props} />;
      case 'battery-charging': return <BatteryCharging {...props} />;
      case 'shield': return <Shield {...props} />;
      case 'users': return <Users {...props} />;
      case 'compass': return <Compass {...props} />;
      case 'tool': return <Wrench {...props} />;
      case 'wrench': return <Wrench {...props} />;
      case 'file-text': return <FileText {...props} />;
      case 'user-check': return <UserCheck {...props} />;
      case 'calendar': return <Calendar {...props} />;
      default: return <Award {...props} />;
    }
  };

  const obtenerEstiloMedalla = (nivel) => {
    switch (nivel) {
      case 'oro':
        return {
          emoji: '🥇',
          color: '#F2A900',
          bg: 'rgba(242, 169, 0, 0.12)',
          border: '#F2A900',
          etiqueta: 'Oro'
        };
      case 'plata':
        return {
          emoji: '🥈',
          color: '#A8A9AD',
          bg: 'rgba(168, 169, 173, 0.12)',
          border: '#A8A9AD',
          etiqueta: 'Plata'
        };
      case 'bronce':
        return {
          emoji: '🥉',
          color: '#CD7F32',
          bg: 'rgba(205, 127, 50, 0.12)',
          border: '#CD7F32',
          etiqueta: 'Bronce'
        };
      case 'madera':
        return {
          emoji: '🪵',
          color: '#8B5A2B',
          bg: 'rgba(139, 90, 43, 0.12)',
          border: '#8B5A2B',
          etiqueta: 'Madera'
        };
      default:
        return {
          emoji: '🔒',
          color: 'var(--text-muted)',
          bg: 'var(--bg-primary)',
          border: 'var(--border-color)',
          etiqueta: 'Bloqueado'
        };
    }
  };

  const categorias = datosTrofeos?.categorias || [];
  const platino = datosTrofeos?.platino || null;

  const categoriasFiltradas = categorias.filter(c => {
    if (filtroEstado === 'completadas') return c.es_oro_completado;
    if (filtroEstado === 'en_progreso') return !c.es_oro_completado;
    return true;
  });

  const resumenNiveles = datosTrofeos?.resumen_niveles || null;
  const trofeosMadera = resumenNiveles?.madera ?? categorias.reduce((acc, c) => acc + (c.niveles?.some(n => n.nivel === 'madera' && n.desbloqueado) ? 1 : 0), 0);
  const trofeosBronce = resumenNiveles?.bronce ?? categorias.reduce((acc, c) => acc + (c.niveles?.some(n => n.nivel === 'bronce' && n.desbloqueado) ? 1 : 0), 0);
  const trofeosPlata = resumenNiveles?.plata ?? categorias.reduce((acc, c) => acc + (c.niveles?.some(n => n.nivel === 'plata' && n.desbloqueado) ? 1 : 0), 0);
  const trofeosOro = resumenNiveles?.oro ?? categorias.reduce((acc, c) => acc + (c.niveles?.some(n => n.nivel === 'oro' && n.desbloqueado) ? 1 : 0), 0);

  return (
    <div className="camplink-container" style={{ padding: '30px 20px 80px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* CABECERA PRINCIPAL */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🏆</div>
        <h1 style={{ fontSize: '2.4rem', margin: '0 0 14px' }}>Vitrina de Logros de explorador</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.86rem',
            fontWeight: 700,
            background: 'rgba(210, 144, 84, 0.15)',
            color: '#D29054',
            border: '1px solid rgba(210, 144, 84, 0.4)'
          }}>
            🪵 {trofeosMadera} de Madera
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.86rem',
            fontWeight: 700,
            background: 'rgba(205, 127, 50, 0.15)',
            color: '#E09248',
            border: '1px solid rgba(205, 127, 50, 0.4)'
          }}>
            🥉 {trofeosBronce} de Bronce
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.86rem',
            fontWeight: 700,
            background: 'rgba(192, 192, 192, 0.15)',
            color: '#E2E8F0',
            border: '1px solid rgba(192, 192, 192, 0.4)'
          }}>
            🥈 {trofeosPlata} de Plata
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.86rem',
            fontWeight: 700,
            background: 'rgba(242, 169, 0, 0.15)',
            color: '#F2A900',
            border: '1px solid rgba(242, 169, 0, 0.4)'
          }}>
            🏆 {trofeosOro} de Oro
          </span>
        </div>
      </div>

      {/* PANEL DESTACADO: TROFEO PLATINO (LEYENDA SUPREMA NÓMADA) */}
      {platino && (
        <div 
          className="camper-card"
          style={{
            padding: '24px 28px',
            marginBottom: '36px',
            background: platino.desbloqueado 
              ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(242, 169, 0, 0.15))' 
              : 'var(--bg-glass)',
            border: platino.desbloqueado 
              ? '2px solid #00E5FF' 
              : '1px solid var(--border-color)',
            boxShadow: platino.desbloqueado ? '0 0 30px rgba(0, 229, 255, 0.3)' : 'var(--shadow-glass)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: '280px' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: platino.desbloqueado ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: `2px solid ${platino.desbloqueado ? '#00E5FF' : 'var(--border-color)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.4rem',
              flexShrink: 0
            }}>
              👑
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: platino.desbloqueado ? '#00E5FF' : 'var(--text-primary)' }}>
                  {platino.nombre}
                </h2>
                <span 
                  className="badge-camper"
                  style={{
                    background: platino.desbloqueado ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: platino.desbloqueado ? '#00E5FF' : 'var(--text-muted)',
                    border: `1px solid ${platino.desbloqueado ? '#00E5FF' : 'var(--border-color)'}`,
                    fontWeight: 800
                  }}
                >
                  {platino.desbloqueado ? 'DESBLOQUEADO' : 'MEDALLA PLATINO'}
                </span>
              </div>
              <p style={{ margin: '4px 0 10px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {platino.descripcion}
              </p>

              {/* Barra de progreso de Oros hacia el Platino */}
              <div style={{ maxWidth: '420px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                  <span>Progreso de Oros: {platino.oros_conseguidos} / {platino.oros_totales}</span>
                  <span>{platino.porcentaje_progreso}%</span>
                </div>
                <div style={{ height: '10px', background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${platino.porcentaje_progreso}%`,
                    background: 'linear-gradient(90deg, #F2A900, #00E5FF)',
                    borderRadius: '999px',
                    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTROS DE ESTADO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
          Categorías de Logros ({categorias.length})
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${filtroEstado === 'todas' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltroEstado('todas')}
          >
            Todas (16)
          </button>
          <button
            className={`btn btn-sm ${filtroEstado === 'en_progreso' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltroEstado('en_progreso')}
          >
            En Progreso ({categorias.filter(c => !c.es_oro_completado).length})
          </button>
          <button
            className={`btn btn-sm ${filtroEstado === 'completadas' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltroEstado('completadas')}
          >
            Oro Completado ({categorias.filter(c => c.es_oro_completado).length})
          </button>
        </div>
      </div>

      {/* CUADRÍCULA OPTIMIZADA: EXACTAMENTE 1 TARJETA POR CATEGORÍA */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Award size={36} style={{ animation: 'pulse 1.5s infinite' }} />
          <p style={{ marginTop: '10px' }}>Cargando logros camper...</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {categoriasFiltradas.map((cat) => {
            const estilo = obtenerEstiloMedalla(cat.medalla_maxima);
            const tieneAlgunaMedalla = !!cat.medalla_maxima;

            return (
              <div
                key={cat.codigo}
                className="camper-card"
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  background: tieneAlgunaMedalla ? 'var(--bg-glass)' : 'rgba(255, 255, 255, 0.02)',
                  border: cat.es_oro_completado 
                    ? '2px solid #F2A900' 
                    : tieneAlgunaMedalla 
                      ? `1px solid ${estilo.border}` 
                      : '1px dashed var(--border-color)',
                  opacity: tieneAlgunaMedalla ? 1 : 0.75,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: cat.es_oro_completado ? '0 4px 18px rgba(242, 169, 0, 0.2)' : undefined,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div>
                  {/* Cabecera de la tarjeta: Icono de Medalla Máxima y Distintivo */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '14px',
                        background: estilo.bg,
                        border: `1px solid ${estilo.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.6rem',
                        flexShrink: 0
                      }}>
                        {estilo.emoji}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                          {cat.nombre}
                        </h3>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {cat.descripcion}
                        </span>
                      </div>
                    </div>

                    <span
                      className="badge-camper"
                      style={{
                        background: estilo.bg,
                        color: estilo.color,
                        border: `1px solid ${estilo.border}`,
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      {cat.es_oro_completado ? 'Oro Máximo' : tieneAlgunaMedalla ? estilo.etiqueta : 'Bloqueado'}
                    </span>
                  </div>

                  {/* Niveles secuenciales (mini hitos) */}
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
                    {cat.niveles.map((niv) => {
                      const estNiv = obtenerEstiloMedalla(niv.nivel);
                      return (
                        <div
                          key={niv.nivel}
                          title={`${niv.nivel.toUpperCase()}: ${niv.umbral} ${cat.unidad} (${niv.desbloqueado ? 'Conseguido' : 'Pendiente'})`}
                          style={{
                            flex: 1,
                            height: '6px',
                            borderRadius: '3px',
                            background: niv.desbloqueado ? estNiv.color : 'var(--border-color)',
                            opacity: niv.desbloqueado ? 1 : 0.35,
                            transition: 'all 0.3s ease'
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Barra de Progreso Visual Interactiva */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    marginBottom: '6px',
                    fontWeight: 700
                  }}>
                    <span style={{ color: cat.es_oro_completado ? '#F2A900' : 'var(--text-primary)' }}>
                      {cat.es_oro_completado ? '🌟 Nivel Máximo Completado' : `Progreso hacia ${cat.siguiente_medalla?.toUpperCase() || 'Siguiente'}`}
                    </span>
                    <span>{cat.porcentaje_progreso}%</span>
                  </div>

                  <div style={{
                    height: '8px',
                    background: 'var(--border-color)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${cat.porcentaje_progreso}%`,
                      background: cat.es_oro_completado 
                        ? '#F2A900' 
                        : 'linear-gradient(90deg, var(--accent-forest), var(--accent-earth))',
                      borderRadius: '999px',
                      transition: 'width 0.6s ease'
                    }} />
                  </div>

                  {/* Texto Explicativo Debajo del Progreso */}
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {cat.texto_progreso}
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
