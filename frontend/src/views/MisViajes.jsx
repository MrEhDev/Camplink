import { formatearFecha } from '../i18n/LanguageContext';
// Aquí implemento la vista "Mis Viajes": visualización de estadísticas acumuladas,
// agrupación cronológica de viajes en ruta y generación del cartel infográfico en PDF.

import React, { useState, useEffect } from 'react';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PosterViajeModal from '../components/PosterViajeModal';
import ModalViajeDetallePdf from '../components/ModalViajeDetallePdf';
import { BookOpen, FileText } from 'lucide-react';
import { 
  Compass, Calendar, MapPin, Award, 
  Download, Navigation, ChevronRight, CheckCircle 
} from 'lucide-react';

export default function MisViajes({ alSeleccionarLugar }) {
  // Aquí gestiono la información del explorador, viajes agrupados y modal del póster
  const { usuario } = useAuth();
  const [estadisticasData, setEstadisticasData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarPosterModal, setMostrarPosterModal] = useState(false);
  const [viajeSeleccionadoPdf, setViajeSeleccionadoPdf] = useState(null);

  const cargarDatos = async () => {
    // Aquí obtengo simultáneamente las estadísticas consolidadas y el histórico de viajes
    setCargando(true);
    try {
      const [stats, listaViajes] = await Promise.all([
        peticionApi('/api/viajes/estadisticas/'),
        peticionApi('/api/viajes/rutas/?mis_viajes=true'),
      ]);
      setEstadisticasData(stats);
      setViajes(listaViajes);
    } catch (err) {
      console.error('Error al cargar mis viajes:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (usuario) {
      cargarDatos();
    }
  }, [usuario]);

  if (!usuario) {
    return (
      <div className="camplink-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Inicia sesión para consultar tus Viajes y Estadísticas</h2>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="camplink-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: '2rem' }}>🚐</span>
        <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Calculando kilómetros y agrupando rutas...</p>
      </div>
    );
  }

  const { estadisticas } = estadisticasData || {};

  return (
    <div className="camplink-container" style={{ padding: '30px 20px 80px' }}>
      {/* CABECERA Y BOTÓN DE GENERAR CARTEL PDF */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', margin: 0 }}>Mis Viajes y Estadísticas</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Registro cronológico de tus aventuras, kilómetros rodados y lugares visitados.
          </p>
        </div>

        <button
          className="btn btn-accent"
          style={{ padding: '12px 22px', fontSize: '0.95rem' }}
          onClick={() => setMostrarPosterModal(true)}
        >
          <Download size={18} /> Generar Cartel PDF de Mis Viajes 📄
        </button>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS GLOBALES */}
      {estadisticas && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '40px'
        }}>
          <div className="camper-card" style={{ borderLeft: '5px solid var(--accent-forest)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Compass size={18} color="var(--accent-forest)" /> KILÓMETROS EN RUTA
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
              {estadisticas.km_totales} <span style={{ fontSize: '1rem', fontWeight: 500 }}>km</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Calculado desde tu dirección base
            </div>
          </div>

          <div className="camper-card" style={{ borderLeft: '5px solid var(--accent-earth)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Calendar size={18} color="var(--accent-earth)" /> DÍAS DE VIAJE
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
              {estadisticas.dias_totales} <span style={{ fontSize: '1rem', fontWeight: 500 }}>días</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              En {estadisticas.total_pernoctas} lugares registrados
            </div>
          </div>

          <div className="camper-card" style={{ borderLeft: '5px solid #2E8B57' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <MapPin size={18} color="#2E8B57" /> COMUNIDADES Y PAÍSES
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
              {estadisticas.total_comunidades} <span style={{ fontSize: '1rem', fontWeight: 500 }}>CC.AA.</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {estadisticas.total_paises} países visitados
            </div>
          </div>

          <div className="camper-card" style={{ borderLeft: '5px solid var(--accent-gold)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Award size={18} color="var(--accent-gold)" /> LOGROS NÓMADAS
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
              {estadisticas.trofeos_desbloqueados} / {estadisticas.trofeos_totales}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {estadisticas.porcentaje_trofeos}% del catálogo completado
            </div>
          </div>
        </div>
      )}

      {/* LISTADO DE VIAJES AGRUPADOS AUTOMÁTICAMENTE */}
      <div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Historial de Rutas y Viajes Agrupados</h2>

        {viajes.length === 0 ? (
          <div className="camper-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Aún no has registrado lugares.</p>
            <p style={{ fontSize: '0.9rem' }}>
              Haz tu primer Check-in en cualquier Lugar para que el sistema cree automáticamente tu primer Viaje y empiece a sumar kilómetros.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {viajes.map((viaje) => (
              <div key={viaje.id} className="camper-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', margin: 0 }}>
                      {viaje.titulo}
                    </h3>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Del {formatearFecha(viaje.fecha_inicio)} al {viaje.fecha_fin ? formatearFecha(viaje.fecha_fin) : 'En curso'} • {viaje.duracion_dias} días
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span className="badge-camper badge-forest" style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                      {viaje.km_totales} km
                    </span>
                    <span className={`badge-camper ${viaje.esta_cerrado ? 'badge-earth' : 'badge-gold'}`}>
                      {viaje.esta_cerrado ? 'Viaje Finalizado' : 'En Curso (Abierto)'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setViajeSeleccionadoPdf(viaje)}
                      style={{ fontSize: '0.8rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}
                      title="Generar Cuaderno de Bitácora A4 para coleccionar o imprimir"
                    >
                      <FileText size={14} /> Generar PDF A4
                    </button>
                  </div>
                </div>

                {/* Paradas del Viaje */}
                {viaje.checkins_resumen && viaje.checkins_resumen.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      Etapas y Lugares de esta Ruta:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {viaje.checkins_resumen.map((ch, idx) => (
                        <div
                          key={ch.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: 'var(--bg-primary)',
                            borderRadius: 'var(--radius-md)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--accent-forest)', fontSize: '0.85rem' }}>
                              #{idx + 1}
                            </span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{ch.lugar_nombre}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {ch.poblacion} ({ch.provincia}) • {ch.dias_previstos} {ch.dias_previstos === 1 ? 'noche' : 'noches'}
                              </div>
                            </div>
                          </div>

                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                            onClick={() => alSeleccionarLugar(ch.lugar_id)}
                          >
                            Ver Lugar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Crónicas y Diarios de Ruta vinculados a este viaje */}
                {viaje.publicaciones_diario && viaje.publicaciones_diario.length > 0 && (
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-earth)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BookOpen size={16} /> Diarios de Ruta en Travesía ({viaje.publicaciones_diario.length}):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                      {viaje.publicaciones_diario.map(post => (
                        <div key={post.id} style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.84rem' }}>
                          {post.imagen && (
                            <img src={post.imagen} alt="Foto diario" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }} />
                          )}
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {post.lugar_nombre ? `📍 ${post.lugar_nombre}` : 'Diario de ruta'}
                          </div>
                          <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {post.contenido}
                          </p>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{post.fecha_legible}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DEL CARTEL INFOGRÁFICO EN PDF */}
      {mostrarPosterModal && (
        <PosterViajeModal
          estadisticasData={estadisticasData}
          alCerrar={() => setMostrarPosterModal(false)}
        />
      )}

      {/* MODAL DEL CUADERNO DE BITÁCORA EN PDF A4 INDIVIDUAL */}
      {viajeSeleccionadoPdf && (
        <ModalViajeDetallePdf
          viaje={viajeSeleccionadoPdf}
          alCerrar={() => setViajeSeleccionadoPdf(null)}
        />
      )}
    </div>
  );
}