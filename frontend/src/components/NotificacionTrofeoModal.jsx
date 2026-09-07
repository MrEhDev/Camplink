// Aquí implemento el modal festivo de felicitación cuando el explorador desbloquea un nuevo Trofeo Nómada,
// lanzando confeti con canvas-confetti y destacando el logro alcanzado.

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, Sparkles, CheckCircle, X } from 'lucide-react';

export default function NotificacionTrofeoModal({ trofeosNuevos, alCerrar }) {
  // Aquí disparo la animación de confeti festivo al montarse el componente
  useEffect(() => {
    if (trofeosNuevos && trofeosNuevos.length > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.warn('Efecto confeti no soportado:', e);
      }
    }
  }, [trofeosNuevos]);

  if (!trofeosNuevos || trofeosNuevos.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(10, 16, 12, 0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 3000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="camper-card" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '32px 28px',
        textAlign: 'center',
        background: 'var(--bg-surface)',
        border: '2px solid var(--accent-gold)',
        boxShadow: '0 0 35px rgba(242, 169, 0, 0.35)',
        animation: 'popIn 0.3s ease-out'
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>
          🎉🏆✨
        </div>

        <h2 style={{ fontSize: '1.6rem', color: 'var(--accent-gold)', margin: '0 0 8px', fontWeight: 800 }}>
          ¡Enhorabuena, Explorador!
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '20px' }}>
          Tu constancia y espíritu nómada han dado sus frutos. Has desbloqueado una nueva condecoración:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {trofeosNuevos.map((nombreTrofeo, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 18px',
                background: 'rgba(242, 169, 0, 0.12)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(242, 169, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontWeight: 700,
                fontSize: '1.05rem',
                color: 'var(--text-primary)'
              }}
            >
              <Award size={20} color="var(--accent-gold)" />
              <span>{nombreTrofeo}</span>
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px 20px', fontSize: '1rem', background: 'var(--accent-forest)' }}
          onClick={alCerrar}
        >
          ¡A por la siguiente ruta! 🚐💨
        </button>
      </div>
    </div>
  );
}