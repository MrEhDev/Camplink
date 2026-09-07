// Aquí implemento el modal generador de Cuaderno de Viaje en PDF para un viaje individual de Camplink,
// capturando la ruta completa, etapas cronológicas, pernoctas, comentarios, notas privadas y fotos con html2canvas y jsPDF.

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { X, Download, MapPin, Calendar, Compass, Star, Camera, ShieldCheck } from 'lucide-react';

export default function ModalViajeDetallePdf({ viaje, alCerrar }) {
  // Aquí controlo la referencia del contenedor imprimible y el estado de descarga
  const documentoRef = useRef(null);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  if (!viaje) return null;

  const descargarPdf = async () => {
    // Aquí renderizo el elemento del viaje a alta resolución y creo el archivo PDF descargable
    if (!documentoRef.current) return;
    setGenerandoPdf(true);

    try {
      const elemento = documentoRef.current;
      const canvas = await html2canvas(elemento, {
        scale: 2.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#131F17',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfAncho = pdf.internal.pageSize.getWidth();
      const pdfAlto = pdf.internal.pageSize.getHeight();
      const imgAncho = pdfAncho - 20; // 10mm márgenes
      const imgAlto = (canvas.height * imgAncho) / canvas.width;

      let posicion = 10;
      let alturaRestante = imgAlto;

      // Si el viaje cabe en una página o requiere páginas continuas
      pdf.addImage(imgData, 'PNG', 10, posicion, imgAncho, imgAlto);
      alturaRestante -= pdfAlto;

      while (alturaRestante > 0) {
        posicion = alturaRestante - imgAlto;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, posicion, imgAncho, imgAlto);
        alturaRestante -= pdfAlto;
      }

      const nombreSanitizado = (viaje.titulo || 'viaje').toLowerCase().replace(/\s+/g, '_');
      pdf.save(`Camplink_Viaje_${nombreSanitizado}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF del viaje:', error);
      alert('Hubo un problema al generar el PDF del viaje. Inténtalo de nuevo.');
    } finally {
      setGenerandoPdf(false);
    }
  };

  const formatearFecha = (fechaStr) => {
    // Aquí formateo las fechas a formato legible en castellano
    if (!fechaStr) return '';
    const d = new Date(fechaStr);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(10, 16, 12, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 2500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="camper-card" style={{
        maxWidth: '820px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {/* Cabecera de Acciones */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Generar Cuaderno de Viaje en PDF</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Documento infográfico con etapas, pernoctas, fotografías y notas de ruta.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={descargarPdf}
              disabled={generandoPdf}
            >
              <Download size={16} /> {generandoPdf ? 'Generando PDF...' : 'Descargar PDF 📄'}
            </button>
            <button className="btn-icon" onClick={alCerrar} title="Cerrar ventana">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenedor Visual Imprimible */}
        <div style={{ overflowY: 'auto', paddingRight: '6px' }}>
          <div 
            ref={documentoRef}
            style={{
              background: '#131F17',
              color: '#F4F7F5',
              padding: '36px',
              borderRadius: '16px',
              border: '2px solid rgba(255, 255, 255, 0.12)',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            {/* Encabezado Nómada */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid rgba(46, 139, 87, 0.4)', paddingBottom: '20px', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2E8B57', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  <span>🚐 Camplink • Cuaderno de Ruta Camper</span>
                </div>
                <h1 style={{ fontSize: '2rem', margin: '8px 0 4px', color: '#FFFFFF', fontWeight: 900 }}>
                  {viaje.titulo}
                </h1>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#B0C2B7' }}>
                  {viaje.descripcion || 'Crónica detallada de pernoctas y kilómetros en libertad.'}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: viaje.esta_cerrado ? 'rgba(217, 119, 6, 0.25)' : 'rgba(46, 139, 87, 0.25)',
                  color: viaje.esta_cerrado ? '#F59E0B' : '#4ADE80',
                  border: `1px solid ${viaje.esta_cerrado ? '#F59E0B' : '#4ADE80'}`,
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}>
                  {viaje.esta_cerrado ? 'Ruta Finalizada' : 'Viaje en Curso'}
                </span>
                <div style={{ fontSize: '0.78rem', color: '#889E90', marginTop: '6px' }}>
                  {formatearFecha(viaje.fecha_inicio)} {viaje.fecha_fin ? `• ${formatearFecha(viaje.fecha_fin)}` : ''}
                </div>
              </div>
            </div>

            {/* Fila de Estadísticas Clave del Viaje */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '28px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#889E90', textTransform: 'uppercase' }}>Distancia Total</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4ADE80', marginTop: '2px' }}>
                  {viaje.km_totales} <span style={{ fontSize: '0.85rem' }}>km</span>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#889E90', textTransform: 'uppercase' }}>Duración</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FCD34D', marginTop: '2px' }}>
                  {viaje.duracion_dias} <span style={{ fontSize: '0.85rem' }}>{viaje.duracion_dias === 1 ? 'día' : 'días'}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#889E90', textTransform: 'uppercase' }}>Pernoctas</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                  {viaje.checkins_resumen?.length || 0}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#889E90', textTransform: 'uppercase' }}>Comunidades</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FB7185', marginTop: '2px' }}>
                  {viaje.comunidades_visitadas?.length || 1}
                </div>
              </div>
            </div>

            {/* Listado Cronológico de Etapas / Pernoctas */}
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#4ADE80', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} /> Etapas y Lugares de Pernocta
              </h3>

              {(!viaje.checkins_resumen || viaje.checkins_resumen.length === 0) ? (
                <p style={{ color: '#889E90', fontStyle: 'italic' }}>No hay paradas registradas en esta ruta.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {viaje.checkins_resumen.map((ch, idx) => (
                    <div
                      key={ch.id || idx}
                      style={{
                        padding: '16px 20px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      {/* Título de la Parada */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#2E8B57',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem'
                          }}>
                            {idx + 1}
                          </span>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFFFFF' }}>
                              {ch.lugar_nombre}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#B0C2B7', marginLeft: '8px' }}>
                              ({ch.poblacion}, {ch.provincia})
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: '#889E90' }}>
                          <span>📅 {formatearFecha(ch.fecha_llegada)}</span>
                          <span>🌙 {ch.dias_previstos} {ch.dias_previstos === 1 ? 'noche' : 'noches'}</span>
                          <span style={{ color: '#FCD34D' }}>🚐 {ch.valoracion_camper} / 5</span>
                        </div>
                      </div>

                      {/* Comentario Público */}
                      {ch.comentario_publico && (
                        <div style={{ fontSize: '0.88rem', color: '#D1E0D7', fontStyle: 'italic', paddingLeft: '38px' }}>
                          "{ch.comentario_publico}"
                        </div>
                      )}

                      {/* Notas Privadas del Explorador */}
                      {ch.notas_privadas && (
                        <div style={{
                          fontSize: '0.82rem',
                          background: 'rgba(217, 119, 6, 0.12)',
                          color: '#FCD34D',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          marginLeft: '38px',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '6px'
                        }}>
                          <ShieldCheck size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span><strong>Nota privada:</strong> {ch.notas_privadas}</span>
                        </div>
                      )}

                      {/* Fotografía de la Pernocta */}
                      {ch.foto && (
                        <div style={{ marginLeft: '38px', marginTop: '6px' }}>
                          <img 
                            src={ch.foto} 
                            alt={ch.lugar_nombre} 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '220px', 
                              borderRadius: '8px', 
                              objectFit: 'cover',
                              border: '1px solid rgba(255, 255, 255, 0.15)'
                            }} 
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pie del Documento */}
            <div style={{
              marginTop: '36px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.78rem',
              color: '#889E90'
            }}>
              <span>Generado con Camplink • La Red Social de la Comunidad Camper</span>
              <span>www.camplink.es</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}