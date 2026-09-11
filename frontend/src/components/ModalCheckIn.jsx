// Aquí implemento el modal para registrar un Check-in (pernocta),
// gestionando la estancia prevista, valoración camper y notas privadas exclusivas del explorador.

import React, { useState } from 'react';
import { peticionApi } from '../services/api';
import CamperIconRating from './CamperIconRating';
import confetti from 'canvas-confetti';
import { X, Lock, Camera, Calendar, Moon } from 'lucide-react';

export default function ModalCheckIn({ lugar, alCerrar, alCompletar }) {
  // Aquí controlo el estado del formulario de pernocta
  const [diasPrevistos, setDiasPrevistos] = useState(1);
  const [fechaLlegada, setFechaLlegada] = useState(() => new Date().toISOString().split('T')[0]);
  const [valoracionCamper, setValoracionCamper] = useState(0);
  const [comentarioPublico, setComentarioPublico] = useState('');
  const [notasPrivadas, setNotasPrivadas] = useState('');
  const [foto, setFoto] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const manejarEnvio = async (e) => {
    // Aquí proceso el registro de la pernocta y disparo la animación de celebración
    e.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('lugar', lugar.id);
      formData.append('dias_previstos', diasPrevistos);
      formData.append('fecha_llegada', `${fechaLlegada}T18:00:00Z`);
      formData.append('valoracion_camper', valoracionCamper);
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
          <div style={{ padding: '10px 14px', background: 'rgba(217, 56, 56, 0.1)', color: '#D93838', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.88rem' }}>
            ⚠️ {error}
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

          {/* Valoración con iconos Camper */}
          <div className="form-group">
            <label className="form-label">Valoración Camper del Lugar</label>
            <CamperIconRating valor={valoracionCamper} onChange={setValoracionCamper} tamaño="grande" />
          </div>

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