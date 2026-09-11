// Modal para compartir un viaje planificado con otro explorador en Camplink
import React, { useState, useEffect, useRef } from 'react';
import { X, Share2, Search, User, Check, AlertCircle, Loader, Compass, Send } from 'lucide-react';
import { peticionApi } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');

export default function ModalCompartirViaje({ viaje, alCerrar, alCompartirExito }) {
  const { formatearFecha } = useTranslation();
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const q = busqueda.trim();
    if (q.length < 2) {
      setResultados([]);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    setBuscando(true);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await peticionApi(`/api/viajes/exploradores/buscar/?q=${encodeURIComponent(q)}`);
        setResultados(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error buscando exploradores:', err);
        setResultados([]);
      } finally {
        setBuscando(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [busqueda]);

  const manejarEnviar = async (e) => {
    e.preventDefault();
    if (!usuarioSeleccionado) {
      setError('Por favor, selecciona un explorador para compartir el viaje.');
      return;
    }

    setError('');
    setEnviando(true);

    try {
      await peticionApi(`/api/viajes/viajes/${viaje.id}/compartir/`, {
        method: 'POST',
        body: {
          destinatario_username: usuarioSeleccionado.username,
          mensaje: mensaje.trim(),
        }
      });
      setExito(true);
      if (alCompartirExito) {
        alCompartirExito(usuarioSeleccionado.username);
      }
      setTimeout(() => {
        alCerrar();
      }, 1600);
    } catch (err) {
      setError(err.message || 'Error al enviar la invitación. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
        backdropFilter: 'blur(10px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) alCerrar();
      }}
    >
      <div
        className="camper-card"
        style={{
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          border: '1px solid var(--border-color)',
          position: 'relative'
        }}
      >
        {/* Cabecera */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--text-primary)'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(35, 83, 52, 0.15)',
              color: 'var(--accent-forest)'
            }}>
              <Share2 size={19} />
            </span>
            Compartir Viaje Planificado
          </h2>
          <button
            type="button"
            onClick={alCerrar}
            className="btn-icon"
            style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
            title="Cerrar"
          >
            <X size={19} />
          </button>
        </div>

        {/* Resumen del Viaje */}
        <div style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(217, 119, 54, 0.15)',
            border: '1px solid var(--accent-earth)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            flexShrink: 0
          }}>
            🗺️
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {viaje.titulo}
            </h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              <span>📅 Salida: {formatearFecha(viaje.fecha_inicio)}</span>
              {viaje.fecha_fin && <span> &bull; Regreso: {formatearFecha(viaje.fecha_fin)}</span>}
            </div>
          </div>
        </div>

        {exito ? (
          <div style={{
            textAlign: 'center',
            padding: '30px 10px',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              border: '2px solid #10B981'
            }}>
              <Check size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
              ¡Invitación enviada!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Has invitado a <strong>@{cap(usuarioSeleccionado?.username)}</strong>. En cuanto acepte, el viaje aparecerá en sus viajes planificados.
            </p>
          </div>
        ) : (
          <form onSubmit={manejarEnviar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Buscador de exploradores */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Buscar explorador destinatario:
              </label>

              {!usuarioSeleccionado ? (
                <div style={{ position: 'relative' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--bg-primary)',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    gap: '8px'
                  }}>
                    <Search size={17} color="var(--text-secondary)" />
                    <input
                      type="text"
                      placeholder="Escribe el nombre de usuario (ej: CarlosCamper)..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        width: '100%',
                        fontSize: '0.9rem'
                      }}
                      autoFocus
                    />
                    {buscando && (
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: '2px solid rgba(35, 83, 52, 0.2)',
                        borderTopColor: 'var(--accent-forest)',
                        animation: 'spin 0.7s linear infinite'
                      }} />
                    )}
                  </div>

                  {/* Resultados desplegables */}
                  {resultados.length > 0 && (
                    <div style={{
                      marginTop: '6px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      maxHeight: '190px',
                      overflowY: 'auto',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
                    }}>
                      {resultados.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setUsuarioSeleccionado(u);
                            setBusqueda('');
                            setResultados([]);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border-color)',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.username}
                                style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: 'rgba(35, 83, 52, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--accent-forest)'
                              }}>
                                <User size={16} />
                              </div>
                            )}
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              @{cap(u.username)}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--accent-forest)', fontWeight: 700 }}>
                            Elegir &rarr;
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {busqueda.trim().length >= 2 && !buscando && resultados.length === 0 && (
                    <div style={{ padding: '10px 14px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      No se encontraron exploradores con ese nombre.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(35, 83, 52, 0.12)',
                  border: '1.5px solid var(--accent-forest)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {usuarioSeleccionado.avatar ? (
                      <img
                        src={usuarioSeleccionado.avatar}
                        alt={usuarioSeleccionado.username}
                        style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: 'rgba(35, 83, 52, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-forest)'
                      }}>
                        <User size={18} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                        @{cap(usuarioSeleccionado.username)}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--accent-forest)', fontWeight: 600 }}>
                        Explorador seleccionado
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUsuarioSeleccionado(null)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                  >
                    Cambiar
                  </button>
                </div>
              )}
            </div>

            {/* Mensaje opcional */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Mensaje personalizado (opcional):
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Ej: ¡Hola! Te comparto la ruta que estoy preparando para este fin de semana, ¡a ver qué te parece!"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '0.88rem',
                  borderRadius: 'var(--radius-md)',
                  resize: 'none'
                }}
              />
            </div>

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#EF4444',
                fontSize: '0.84rem',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(239, 68, 68, 0.25)'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={alCerrar}
                disabled={enviando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!usuarioSeleccionado || enviando}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700
                }}
              >
                {enviando ? (
                  <>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTopColor: '#FFFFFF',
                      animation: 'spin 0.7s linear infinite'
                    }} />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Enviar Invitación</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
