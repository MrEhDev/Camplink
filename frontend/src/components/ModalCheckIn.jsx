// Aquí implemento el modal para registrar un Check-in (pernocta),
// gestionando la estancia prevista, restricción GPS de 20 km, valoración opcional en visitas recurrentes
// y notas privadas exclusivas del explorador.

import React, { useState, useEffect } from 'react';
import { peticionApi } from '../services/api';
import CamperIconRating from './CamperIconRating';
import confetti from 'canvas-confetti';
import { X, Lock, Camera, Calendar, Moon, Star } from 'lucide-react';
import { obtenerPosicionGps, calcularDistanciaKm } from '../utils/geolocation';

export default function ModalCheckIn({ lugar, alCerrar, alCompletar }) {
  // Aquí controlo el estado del formulario de pernocta
  const [diasPrevistos, setDiasPrevistos] = useState(1);
  const [fechaLlegada, setFechaLlegada] = useState(() => new Date().toISOString().split('T')[0]);
  const [valoracionCamper, setValoracionCamper] = useState(5);
  const [comentarioPublico, setComentarioPublico] = useState('');
  const [notasPrivadas, setNotasPrivadas] = useState('');
  const [foto, setFoto] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // Estados para controlar si el explorador ya ha visitado este lugar previamente
  const [esPrimeraVez, setEsPrimeraVez] = useState(true);
  const [mostrarNuevaValoracion, setMostrarNuevaValoracion] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);

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

    // 1. Restricción de distancia en Check-in: máximo 20 km de cercanía al lugar
    if (lugar?.latitud != null && lugar?.longitud != null) {
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
      formData.append('dias_previstos', diasPrevistos);
      formData.append('fecha_llegada', `${fechaLlegada}T18:00:00Z`);

      // La valoración se envía si es la primera vez o si el usuario decidió actualizarla
      if (esPrimeraVez && valoracionCamper > 0) {
        formData.append('valoracion_camper', valoracionCamper);
      } else if (!esPrimeraVez && mostrarNuevaValoracion && valoracionCamper > 0) {
        formData.append('valoracion_camper', valoracionCamper);
      }

      if (comentarioPublico) formData.append('comentario_publico', comentarioPublico);
      if (notasPrivadas) formData.append('notas_privadas', notasPrivadas);
      if (foto) formData.append('foto', foto);

      const res = await peticionApi('/api/diario/checkins/', {
        method: 'POST',
        body: formData
      });

      // Animación de confeti camper para celebrar la pernocta
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🌙</span>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Hacer Check-in</h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{lugar.nombre}</span>
            </div>
          </div>
          <button className="btn-icon" onClick={alCerrar}>
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
          {/* Fecha de Llegada */}
          <div className="form-group">
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

          {/* Días previstos */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Moon size={15} /> ¿Cuántos días tienes pensado quedarte?
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="number"
                min="1"
                max="30"
                className="form-control"
                style={{ width: '100px' }}
                value={diasPrevistos}
                onChange={(e) => setDiasPrevistos(Math.max(1, parseInt(e.target.value) || 1))}
                required
              />
              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {diasPrevistos === 1 ? 'noche planificada' : 'noches planificadas'}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              (Si te quedas varios días o registras otra parada en &lt; 5 días, se agrupará en el mismo Viaje).
            </span>
          </div>

          {/* VALORACIÓN CAMPER: Obligatoria en primera visita, opcional y plegable si ya visitó antes */}
          {esPrimeraVez ? (
            <div className="form-group">
              <label className="form-label">Valoración Camper del Lugar</label>
              <CamperIconRating valor={valoracionCamper} onChange={setValoracionCamper} tamaño="grande" />
            </div>
          ) : (
            <div className="form-group" style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Star size={15} color="#F59E0B" /> Valoración del lugar (Opcional)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Ya has pernoctado aquí antes. Tu valoración anterior se mantiene activa.
                  </div>
                </div>
                {!mostrarNuevaValoracion && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setMostrarNuevaValoracion(true);
                      setValoracionCamper(5);
                    }}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    Dejar nueva valoración
                  </button>
                )}
              </div>

              {mostrarNuevaValoracion && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '6px' }}>
                    Nueva Puntuación Camper:
                  </label>
                  <CamperIconRating valor={valoracionCamper} onChange={setValoracionCamper} tamaño="grande" />
                </div>
              )}
            </div>
          )}

          {/* Comentario Público */}
          <div className="form-group">
            <label className="form-label">Comentario Público (Para el Diario de Ruta)</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="¿Qué tal las vistas? ¿Hay cobertura? Comparte con otros exploradores..."
              value={comentarioPublico}
              onChange={(e) => setComentarioPublico(e.target.value)}
            />
          </div>

          {/* Foto de la Pernocta */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Camera size={15} /> Foto de la Noche / Amanecer (Opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={(e) => setFoto(e.target.files[0] || null)}
            />
          </div>

          {/* NOTAS PRIVADAS: Exclusivas del usuario */}
          <div className="form-group" style={{
            background: 'rgba(217, 119, 54, 0.07)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed rgba(217, 119, 54, 0.3)'
          }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-earth)' }}>
              <Lock size={15} /> Notas Privadas (Solo visibles para mí)
            </label>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Anota aquí secretos que solo tú necesitas recordar: "La manguera requiere adaptador hembra de 1/2", "Cuidado con la rama baja al salir", "Nivelar con calzos de 2 peldaños".
            </p>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Escribe tus anotaciones privadas personales..."
              value={notasPrivadas}
              onChange={(e) => setNotasPrivadas(e.target.value)}
              style={{ background: 'var(--bg-surface)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
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