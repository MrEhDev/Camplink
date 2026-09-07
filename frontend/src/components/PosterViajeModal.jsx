// Aquí implemento el generador automático de carteles infográficos en PDF con las estadísticas
// del explorador (km recorridos, días de viaje, comunidades y países visitados) usando html2canvas y jsPDF.

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { X, Download, Share2, Award, Compass, MapPin, Calendar } from 'lucide-react';

export default function PosterViajeModal({ estadisticasData, alCerrar }) {
  // Aquí controlo la generación y renderizado del cartel nómada en formato PDF
  const posterRef = useRef(null);
  const [descargando, setDescargando] = useState(false);

  if (!estadisticasData) return null;

  const { explorador, estadisticas } = estadisticasData;

  const descargarPdf = async () => {
    // Aquí convierto el cartel visual a imagen de alta definición y genero el archivo PDF descargable
    if (!posterRef.current) return;
    setDescargando(true);

    try {
      const elemento = posterRef.current;
      const canvas = await html2canvas(elemento, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#142017'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const anchoPdf = pdf.internal.pageSize.getWidth();
      const altoPdf = (canvas.height * anchoPdf) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, anchoPdf, altoPdf);
      pdf.save(`cartel_nomada_${explorador.username}.pdf`);
    } catch (err) {
      console.error('Error al generar el PDF del cartel:', err);
      alert('Hubo un problema al exportar el PDF.');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={alCerrar}>
      <div className="modal-content" style={{ maxWidth: '620px', padding: '20px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎨</span> Cartel Infográfico de Mis Viajes
          </h3>
          <button className="btn-icon" onClick={alCerrar}><X size={18} /></button>
        </div>

        {/* Contenedor del Cartel para Exportar (Diseño Estilo Parque Natural Nómada) */}
        <div
          ref={posterRef}
          style={{
            background: 'linear-gradient(145deg, #142017 0%, #1D2E21 60%, #29402F 100%)',
            color: '#FFFFFF',
            borderRadius: '16px',
            padding: '36px 28px',
            border: '4px solid #D97736',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            fontFamily: 'var(--font-heading)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Marca de agua decorativa */}
          <div style={{
            position: 'absolute',
            right: '-20px',
            bottom: '-20px',
            fontSize: '12rem',
            opacity: 0.04,
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
            🚐
          </div>

          {/* Cabecera del Cartel */}
          <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px dashed rgba(217, 119, 54, 0.4)', paddingBottom: '20px' }}>
            <div style={{ display: 'inline-block', fontSize: '2.5rem', marginBottom: '6px' }}>🚐🌲</div>
            <h2 style={{ fontSize: '1.8rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#F2A900', margin: 0 }}>
              Cuaderno de Ruta Oficial
            </h2>
            <div style={{ fontSize: '0.88rem', color: '#A0B2A5', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px' }}>
              Camplink • Red Nómada Peninsular
            </div>
            <div style={{ marginTop: '12px', fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
              {explorador.nombre_completo}
            </div>
            <div style={{ display: 'inline-block', background: 'rgba(217, 119, 54, 0.2)', color: '#D97736', padding: '4px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, marginTop: '6px' }}>
              Vehículo: {explorador.tipo_viajero} • Base: {explorador.poblacion || 'España'}
            </div>
          </div>

          {/* Cuadrícula de Métricas de Viaje */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px',
            marginBottom: '24px'
          }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #F2A900' }}>
              <div style={{ fontSize: '0.8rem', color: '#A0B2A5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Compass size={15} color="#F2A900" /> KILÓMETROS EN RUTA
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF', marginTop: '4px' }}>
                {estadisticas.km_totales.toLocaleString('es-ES')} <span style={{ fontSize: '1rem', fontWeight: 600 }}>km</span>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #D97736' }}>
              <div style={{ fontSize: '0.8rem', color: '#A0B2A5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} color="#D97736" /> DÍAS VIVIENDO EL CAMPER
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF', marginTop: '4px' }}>
                {estadisticas.dias_totales} <span style={{ fontSize: '1rem', fontWeight: 600 }}>días</span>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #489A65' }}>
              <div style={{ fontSize: '0.8rem', color: '#A0B2A5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} color="#489A65" /> PERNOCTAS REALIZADAS
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF', marginTop: '4px' }}>
                {estadisticas.total_pernoctas} <span style={{ fontSize: '1rem', fontWeight: 600 }}>noches</span>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #E58645' }}>
              <div style={{ fontSize: '0.8rem', color: '#A0B2A5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={15} color="#E58645" /> TROFEOS CONSEGUIDOS
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF', marginTop: '4px' }}>
                {estadisticas.trofeos_desbloqueados} / {estadisticas.trofeos_totales}
              </div>
            </div>
          </div>

          {/* Comunidades Autónomas y Países */}
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
            <div style={{ fontSize: '0.82rem', color: '#A0B2A5', fontWeight: 600, marginBottom: '8px' }}>
              TERRITORIOS Y COMUNIDADES VISITADAS ({estadisticas.total_comunidades}):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {estadisticas.comunidades_lista.length > 0 ? (
                estadisticas.comunidades_lista.map((c, i) => (
                  <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                    🌲 {c}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.8rem', color: '#A0B2A5' }}>Comenzando las primeras aventuras...</span>
              )}
            </div>
          </div>

          {/* Sello de Autenticidad */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', color: '#839187' }}>
            <div>Certificado por Camplink SPA • ID Explorador #{explorador.username}</div>
            <div style={{ color: '#D97736', fontWeight: 700 }}>¡BUENA RUTA Y CIELOS DESPEJADOS!</div>
          </div>
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
          <button className="btn btn-secondary" onClick={alCerrar}>Cerrar</button>
          <button className="btn btn-primary" onClick={descargarPdf} disabled={descargando}>
            <Download size={16} />
            {descargando ? 'Generando PDF...' : 'Descargar Cartel en PDF 📄'}
          </button>
        </div>
      </div>
    </div>
  );
}