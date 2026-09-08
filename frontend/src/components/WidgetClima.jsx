// Aquí implemento el widget interactivo del tiempo meteorológico para la ficha del Lugar y el radar nómada,
// con selección interactiva de días para consultar viento, rachas, amanecer y atardecer de cada jornada.

import React, { useState, useEffect } from 'react';
import { obtenerPrevisionClima } from '../services/clima';
import { Wind, Sunrise, Sunset, AlertTriangle, Sun, Droplets } from 'lucide-react';

export default function WidgetClima({ latitud, longitud, nombreLugar = 'Lugar de Pernocta' }) {
  const [clima, setClima] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [diaSeleccionadoIdx, setDiaSeleccionadoIdx] = useState(0);

  useEffect(() => {
    if (latitud && longitud) {
      setCargando(true);
      obtenerPrevisionClima(latitud, longitud)
        .then((data) => {
          setClima(data);
          setError(null);
          setDiaSeleccionadoIdx(0);
        })
        .catch((err) => {
          setError('No se pudo cargar la previsión del tiempo.');
        })
        .finally(() => setCargando(false));
    }
  }, [latitud, longitud]);

  if (cargando) {
    return (
      <div className="camper-card" style={{ textAlign: 'center', padding: '24px' }}>
        <span style={{ fontSize: '1.8rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>🌀</span>
        <p style={{ marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Consultando sensores meteorológicos de {nombreLugar}...
        </p>
      </div>
    );
  }

  if (error || !clima) {
    return (
      <div className="camper-card" style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        ⚠️ {error || 'Previsión no disponible actualmente.'}
      </div>
    );
  }

  const diaSel = clima.diario[diaSeleccionadoIdx] || clima.diario[0];
  const esHoy = diaSeleccionadoIdx === 0;

  return (
    <div className="camper-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Cabecera del Tiempo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>El Tiempo en Ruta</h4>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {esHoy ? 'Hoy' : new Date(diaSel.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })} • {nombreLugar}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '2.4rem' }}>{esHoy ? clima.actual.icono : diaSel.clima.icono}</span>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 }}>
              {esHoy ? `${clima.actual.temperatura}°C` : `${diaSel.max}° / ${diaSel.min}°C`}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {esHoy ? clima.actual.descripcion : diaSel.clima.texto}
            </div>
          </div>
        </div>
      </div>

      {/* Alertas Camper Dinámicas (Toldo, Viento, Heladas) */}
      {esHoy && clima.alertasCamper.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
          {clima.alertasCamper.map((alerta, idx) => (
            <div
              key={idx}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                background: alerta.nivel === 'critico' ? 'rgba(217, 56, 56, 0.12)' : alerta.nivel === 'aviso' ? 'rgba(217, 119, 54, 0.14)' : 'rgba(46, 139, 87, 0.12)',
                borderLeft: `4px solid ${alerta.nivel === 'critico' ? '#D93838' : alerta.nivel === 'aviso' ? 'var(--accent-earth)' : 'var(--accent-forest)'}`,
              }}
            >
              <AlertTriangle size={18} color={alerta.nivel === 'critico' ? '#D93838' : 'var(--accent-earth)'} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>{alerta.titulo}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{alerta.mensaje}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Métricas camper clave: Viento, Salida/Puesta de Sol del día seleccionado */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        padding: '12px',
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '18px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <Wind size={14} /> Viento
          </div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '3px' }}>
            {esHoy ? `${clima.actual.vientoVelocidad} km/h` : `${diaSel.rachasMax || '--'} km/h`}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {esHoy ? `Rachas: ${clima.actual.vientoRachas} km/h` : 'Rachas máximas'}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <Sunrise size={14} /> Amanecer
          </div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '3px' }}>
            {diaSel.amanecer || '--:--'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Primeras luces</div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <Sunset size={14} /> Atardecer
          </div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '3px' }}>
            {diaSel.atardecer || '--:--'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Puesta de sol</div>
        </div>
      </div>

      {/* Previsión a 5 Días interactiva */}
      <div style={{ marginBottom: '6px', fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
        Selecciona un día para ver sus datos detallados de viento y sol:
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', overflowX: 'auto', padding: '6px 4px 10px 4px' }}>
        {clima.diario.map((dia, idx) => {
          const nombreDia = new Date(dia.fecha).toLocaleDateString('es-ES', { weekday: 'short' });
          const seleccionado = diaSeleccionadoIdx === idx;
          return (
            <button
              type="button"
              key={idx}
              onClick={() => setDiaSeleccionadoIdx(idx)}
              style={{
                flex: 1,
                minWidth: '58px',
                textAlign: 'center',
                padding: '8px 4px',
                borderRadius: 'var(--radius-md)',
                background: seleccionado ? 'rgba(35, 83, 52, 0.25)' : 'rgba(255,255,255,0.03)',
                border: seleccionado ? '2px solid var(--accent-forest)' : '1px solid var(--border-color)',
                outline: seleccionado ? '2px solid rgba(46, 139, 87, 0.35)' : 'none',
                cursor: 'pointer',
                position: 'relative',
                zIndex: seleccionado ? 5 : 1,
                transition: 'all 0.15s ease',
                boxShadow: seleccionado ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
                color: 'inherit',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: seleccionado ? 800 : 600, textTransform: 'capitalize', color: seleccionado ? 'var(--accent-forest)' : 'var(--text-secondary)' }}>
                {idx === 0 ? 'Hoy' : nombreDia}
              </div>
              <div style={{ fontSize: '1.3rem', margin: '4px 0' }}>{dia.clima.icono}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                {dia.max}° <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{dia.min}°</span>
              </div>
              {dia.lluviaProb > 20 && (
                <div style={{ fontSize: '0.68rem', color: 'var(--accent-forest)', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                  <Droplets size={10} /> {dia.lluviaProb}%
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
