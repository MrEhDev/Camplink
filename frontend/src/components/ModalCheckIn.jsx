// Aquí implemento el modal para registrar un Check-in (pernocta / visita),
// gestionando la estancia prevista (0 por defecto y editable libremente),
// valoración del lugar con comentario de experiencia camper en la ficha,
// entrada diferenciada para el Diario de Ruta con relato y foto,
// notas privadas del explorador y cierre automático al perder foco.

import React, { useState, useEffect } from 'react';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CamperIconRating from './CamperIconRating';
import confetti from 'canvas-confetti';
import { X, Lock, Camera, Calendar, Moon, Star, BookOpen, Compass, Trash2 } from 'lucide-react';
import { obtenerPosicionGps, calcularDistanciaKm } from '../utils/geolocation';

export default function ModalCheckIn({ lugar, alCerrar, alCompletar }) {
  const { usuario } = useAuth();
  const esAdmin = usuario?.es_admin || usuario?.is_staff || usuario?.is_superuser || usuario?.rol === 'admin';

  // 1. Control de estancia: 0 por defecto para visitas/paradas
  const [diasPrevistos, setDiasPrevistos] = useState(0);
  const [fechaLlegada, setFechaLlegada] = useState(() => new Date().toISOString().split('T')[0]);

  // 2. Valoración Camper del Lugar (Camper Card)
  const [valoracionCamper, setValoracionCamper] = useState(5);
  const [comentarioExperienciaCamper, setComentarioExperienciaCamper] = useState('');

  // 3. Entrada en el Diario de Ruta (a parte)
  const [comentarioDiario, setComentarioDiario] = useState('');
  const [foto, setFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);

  // 4. Notas Privadas
  const [notasPrivadas, setNotasPrivadas] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // Estados para controlar si el explorador ya ha visitado este lugar previamente
  const [esPrimeraVez, setEsPrimeraVez] = useState(true);
  const [mostrarNuevaValoracion, setMostrarNuevaValoracion] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);

  // Cerrar la vista si se pierde el foco de la ventana o pestaña
  useEffect(() => {
    const manejarPerdidaFoco = () => {
      if (alCerrar) alCerrar();
    };

    const manejarVisibilidad = () => {
      if (document.hidden && alCerrar) {
        alCerrar();
      }
    };

    window.addEventListener('blur', manejarPerdidaFoco);
    document.addEventListener('visibilitychange', manejarVisibilidad);

    return () => {
      window.removeEventListener('blur', manejarPerdidaFoco);
      document.removeEventListener('visibilitychange', manejarVisibilidad);
    };
  }, [alCerrar]);

  // Manejador para imagen del diario
  const manejarSeleccionFoto = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      setPreviewFoto(URL.createObjectURL(file));
    }
  };

  const eliminarFoto = () => {
    if (previewFoto) URL.revokeObjectURL(previewFoto);
    setFoto(null);
    setPreviewFoto(null);
  };

  useEffect(() => {
    let montado = true;
    const verificarPernoctasPrevias = async () => {
      if (!lugar?.id) {
        setCargandoHistorial(false);
        return;
      }
      try {
        const checkins = await peticionApi(`/api/diario/checkins/?lugar_id=${lugar.id}&mis_checkins=true`);
        const lista = Array.isArray(checkins) ? checkins : Array.isArray(checkins?.results) ? checkins.results : [];
        if (montado) {
          if (lista.length > 0) {
            setEsPrimeraVez(false);
            setValoracionCamper(0); // Opcional por defecto si no es primera vez
          } else {
            setEsPrimeraVez(true);
            setValoracionCamper(5); // Obligatoria/por defecto si es primera vez
          }
        }
      } catch (err) {
        console.warn('Error al verificar visitas anteriores del lugar:', err);
      } finally {
        if (montado) setCargandoHistorial(false);
      }
    };

    verificarPernoctasPrevias();
    return () => { montado = false; };
  }, [lugar?.id]);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    // 1. Restricción de distancia en Check-in: máximo 20 km de cercanía al lugar (administradores exentos)
    if (!esAdmin && lugar?.latitud != null && lugar?.longitud != null) {
      try {
        const pos = await obtenerPosicionGps();
        const distKm = calcularDistanciaKm(
          pos.coords.latitude,
          pos.coords.longitude,
          parseFloat(lugar.latitud),
          parseFloat(lugar.longitud)
        );

        if (distKm == null || distKm > 20) {
          setError('Acércate más al lugar o activa el GPS');
          setEnviando(false);
          return;
        }
      } catch (errGps) {
        console.warn('Fallo al validar GPS durante confirmación de Check-in:', errGps);
        setError('Acércate más al lugar o activa el GPS');
        setEnviando(false);
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append('lugar', lugar.id);
      formData.append('dias_previstos', diasPrevistos === '' ? 0 : Number(diasPrevistos));
      formData.append('fecha_llegada', `${fechaLlegada}T18:00:00Z`);

      const puntajeAEnviar = (esPrimeraVez || mostrarNuevaValoracion) && valoracionCamper > 0 ? valoracionCamper : null;
      if (puntajeAEnviar) {
        formData.append('valoracion_camper', puntajeAEnviar);
      }

      // El comentario del diario de ruta va a la publicación del diario
      if (comentarioDiario.trim()) {
        formData.append('comentario_publico', comentarioDiario.trim());
      } else if (comentarioExperienciaCamper.trim()) {
        formData.append('comentario_publico', comentarioExperienciaCamper.trim());
      }

      if (notasPrivadas.trim()) formData.append('notas_privadas', notasPrivadas.trim());
      if (foto) formData.append('foto', foto);

      const res = await peticionApi('/api/diario/checkins/', {
        method: 'POST',
        body: formData
      });

      // Si el explorador dejó valoración camper y comentario de experiencia, actualizamos la ficha del lugar
      if (puntajeAEnviar || comentarioExperienciaCamper.trim()) {
        try {
          const formVal = new FormData();
          formVal.append('puntuacion_camper', puntajeAEnviar || 5);
          if (comentarioExperienciaCamper.trim()) {
            formVal.append('comentario', comentarioExperienciaCamper.trim());
          }
          await peticionApi(`/api/lugares/puntos/${lugar.id}/valorar/`, {
            method: 'POST',
            body: formVal
          });
        } catch (errVal) {
          console.warn('Nota: valoración camper enviada en checkin, error secundario en valorar:', errVal);
        }
      }

      // Animación de confeti camper para celebrar la llegada
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#235334', '#D97736', '#F2A900']
        });
      } catch { }

      if (alCompletar) alCompletar(res);
      alCerrar();
    } catch (err) {
      setError(err.message || 'Error al registrar el check-in.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={alCerrar}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>🚐</span>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Hacer Check-in</h3>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{lugar.nombre}</span>
            </div>
          </div>
          <button className="btn-icon" onClick={alCerrar} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1.5px solid #EF4444',
            color: '#FCA5A5',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📍</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={manejarEnvio}>
          {/* 1. FECHA Y NOCHES PLANIFICADAS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            marginBottom: '16px'
          }}>
            {/* Fecha de Llegada */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} /> Fecha de llegada
              </label>
              <input
                type="date"
                className="form-control"
                value={fechaLlegada}
                onChange={(e) => setFechaLlegada(e.target.value)}
                required
              />
            </div>

            {/* Días previstos (0 por defecto) */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Moon size={15} /> Noches previstas
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="number"
                  min="0"
                  max="30"
                  className="form-control"
                  style={{ width: '85px', textAlign: 'center', fontWeight: 700 }}
                  value={diasPrevistos === '' ? '' : diasPrevistos}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setDiasPrevistos('');
                    } else {
                      const num = parseInt(val, 10);
                      setDiasPrevistos(isNaN(num) ? 0 : Math.max(0, num));
                    }
                  }}
                  onBlur={() => {
                    if (diasPrevistos === '') setDiasPrevistos(0);
                  }}
                  required
                />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {diasPrevistos === 0
                    ? '0 noches (visita / parada diurna)'
                    : diasPrevistos === 1
                    ? '1 noche planificada'
                    : `${diasPrevistos} noches planificadas`}
                </span>
              </div>
            </div>
          </div>

          {/* 2. VALORACIÓN CAMPER DEL LUGAR (CAMPER CARD) */}
          <div className="form-group" style={{
            background: 'var(--bg-surface)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-color)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={16} color="var(--accent-gold)" />
                <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                  Valoración de Experiencia Camper
                </span>
              </div>
              {!esPrimeraVez && !mostrarNuevaValoracion && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setMostrarNuevaValoracion(true);
                    setValoracionCamper(5);
                  }}
                  style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                >
                  Actualizar valoración
                </button>
              )}
            </div>

            {(esPrimeraVez || mostrarNuevaValoracion) && (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Puntuación general del lugar:
                  </label>
                  <CamperIconRating valor={valoracionCamper} onChange={setValoracionCamper} tamaño="grande" />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Comentario de experiencia camper (Ficha del lugar):
                  </label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Cuéntanos detalles prácticos: nivelación del terreno, tranquilidad, sombras, acceso, cobertura..."
                    value={comentarioExperienciaCamper}
                    onChange={(e) => setComentarioExperienciaCamper(e.target.value)}
                  />
                </div>
              </>
            )}

            {!esPrimeraVez && !mostrarNuevaValoracion && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Ya has valorado este lugar previamente. Tu reseña anterior se mantiene activa.
              </p>
            )}
          </div>

          {/* 3. A PARTE: ENTRADA EN EL DIARIO DE RUTA */}
          <div className="form-group" style={{
            background: 'rgba(35, 83, 52, 0.08)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid rgba(35, 83, 52, 0.35)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Compass size={16} color="var(--accent-forest)" />
              <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--accent-forest)' }}>
                Entrada en el Diario de Ruta (Opcional)
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Publica un relato de tu viaje con anécdotas, reflexiones y fotos para la comunidad de exploradores.
            </p>

            <div style={{ marginBottom: '12px' }}>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Escribe tu relato para el Diario de Ruta: ¿Qué tal la ruta? ¿Qué vistas tienes? Comparte tu vivencia..."
                value={comentarioDiario}
                onChange={(e) => setComentarioDiario(e.target.value)}
              />
            </div>

            {/* Foto para el Diario de Ruta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <label
                className="btn btn-secondary btn-sm"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
              >
                <Camera size={14} color="var(--accent-forest)" />
                <span>{foto ? 'Cambiar Foto' : '📷 Foto de la Pernocta'}</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={manejarSeleccionFoto}
                />
              </label>

              {previewFoto && (
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={previewFoto}
                    alt="Vista previa foto diario"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-sm)',
                      objectFit: 'cover',
                      border: '1.5px solid var(--accent-forest)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={eliminarFoto}
                    className="btn-icon"
                    style={{ color: '#EF4444', padding: '4px' }}
                    title="Quitar foto"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 4. NOTAS PRIVADAS: Exclusivas del usuario */}
          <div className="form-group" style={{
            background: 'rgba(217, 119, 54, 0.07)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed rgba(217, 119, 54, 0.35)',
            marginBottom: '20px'
          }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-earth)' }}>
              <Lock size={15} /> Notas Privadas (Solo visibles para mí)
            </label>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Anota aquí secretos personales: "La manguera necesita adaptador 1/2", "Cuidado con la rama al salir", "Nivelar con calzos de 2 peldaños".
            </p>
            <textarea
              className="form-control"
              rows="2"
              placeholder="Escribe tus anotaciones privadas personales..."
              value={notasPrivadas}
              onChange={(e) => setNotasPrivadas(e.target.value)}
              style={{ background: 'var(--bg-surface)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={alCerrar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? 'Registrando...' : 'Confirmar Check-in 🚐'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}