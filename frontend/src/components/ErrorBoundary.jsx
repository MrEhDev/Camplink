// Aquí implemento el Error Boundary de React para Camplink,
// evitando pantallas en blanco ante cualquier excepción no controlada en la UI,
// mostrando una interfaz recuperable, moderna y amigable para el explorador nómada.

import React from 'react';
import { Compass, RefreshCw, AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Camplink ErrorBoundary capturó un fallo:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-primary)'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            border: '2px solid rgba(239, 68, 68, 0.3)'
          }}>
            <Compass size={36} color="#EF4444" />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 10px 0' }}>
            Un pequeño bache en la ruta 🚐💨
          </h2>

          <p style={{
            fontSize: '0.94rem',
            color: 'var(--text-secondary)',
            maxWidth: '520px',
            lineHeight: 1.6,
            margin: '0 0 24px 0'
          }}>
            La vista ha tenido una interrupción momentánea. Puedes recargar la aplicación o volver al inicio de ruta sin perder tus datos guardados.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleReload}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px' }}
            >
              <RefreshCw size={16} />
              <span>Recargar Página</span>
            </button>

            <button
              onClick={this.handleReset}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px' }}
            >
              <AlertTriangle size={16} />
              <span>Reintentar Vista</span>
            </button>
          </div>

          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <details style={{
              marginTop: '30px',
              maxWidth: '650px',
              width: '100%',
              textAlign: 'left',
              background: 'rgba(0,0,0,0.3)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '0.78rem',
              color: '#F87171',
              fontFamily: 'monospace',
              overflowX: 'auto'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700, marginBottom: '6px' }}>
                Ver detalles técnicos del error
              </summary>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {this.state.error.toString()}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
