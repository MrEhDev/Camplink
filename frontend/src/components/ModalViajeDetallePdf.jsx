// Aquí implemento el modal generador de Cuaderno de Viaje en PDF para un viaje individual de Camplink,
// formateado con proporciones estándar A4 coleccionable, pasaporte nómada, etapas, bitácora del diario de ruta y fotos.

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { X, Download, MapPin, Calendar, Compass, Star, Camera, ShieldCheck, Award, BookOpen } from 'lucide-react';

export default function ModalViajeDetallePdf({ viaje, alCerrar }) {
  const documentoRef = useRef(null);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  if (!viaje) return null;

  const descargarPdf = async () => {
    if (!documentoRef.current) return;
    setGenerandoPdf(true);

    try {
      const elemento = documentoRef.current;
      const canvas = await html2canvas(elemento, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#111A14',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfAncho = pdf.internal.pageSize.getWidth();
      const pdfAlto = pdf.internal.pageSize.getHeight();
      const imgAncho = pdfAncho;
      const imgAlto = (canvas.height * imgAncho) / canvas.width;

      let posicion = 0;
      let alturaRestante = imgAlto;

      pdf.addImage(imgData, 'JPEG', 0, posicion, imgAncho, imgAlto, undefined, 'FAST');
      alturaRestante -= pdfAlto;

      while (alturaRestante > 0) {
        posicion = alturaRestante - imgAlto;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, posicion, imgAncho, imgAlto, undefined, 'FAST');
        alturaRestante -= pdfAlto;
      }

      const nombreSanitizado = (viaje.titulo || 'cuaderno_viaje').toLowerCase().replace(/\s+/g, '_');
      pdf.save(`Camplink_Recuerdo_A4_${nombreSanitizado}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF del viaje:', error);
      alert('Hubo un problema al generar el PDF coleccionable. Inténtalo de nuevo.');
    } finally {
      setGenerandoPdf(false);
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const d = new Date(fechaStr);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const diarios = viaje.publicaciones_diario || [];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(8, 14, 10, 0.88)',
      backdropFilter: 'blur(10px)',
      zIndex: 2500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="camper-card" style={{
        maxWidth: '860px',
        width: '100%',
        maxHeight: '92vh',
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
            <h2 style={{ fontSize: '1.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📄 Recuerdo Coleccionable A4 • Cuaderno de Bitácora</span>
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Listo para descargar, imprimir en tamaño A4 y coleccionar en tu cuaderno nómada.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={descargarPdf}
              disabled={generandoPdf}
              style={{ fontWeight: 700, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={16} /> {generandoPdf ? 'Maquetando PDF A4...' : 'Descargar Recuerdo A4 📄'}
            </button>
            <button className="btn-icon" onClick={alCerrar} title="Cerrar ventana">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenedor Visual Imprimible con dimensiones proporcionales A4 (794px ancho estándar) */}
        <div style={{ overflowY: 'auto', paddingRight: '8px' }}>
          <div 
            ref={documentoRef}
            style={{
              width: '100%',
              maxWidth: '794px',
              margin: '0 auto',
              background: '#111A14',
              color: '#F0F5F2',
              padding: '42px 38px',
              borderRadius: '8px',
              border: '2px solid rgba(255, 255, 255, 0.14)',
              boxSizing: 'border-box',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            {/* Cabecera Estilo Pasaporte Nómada */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2.5px solid #2E8B57',
              paddingBottom: '22px',
              marginBottom: '26px'
            }}>
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(46, 139, 87, 0.25)',
                  border: '1px solid #2E8B57',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  color: '#4ADE80',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '10px'
                }}>
                  <Award size={13} />
                  <span>Certificado Nómada • Colección Oficial Camplink</span>
                </div>
                <h1 style={{ fontSize: '2.2rem', margin: '0 0 6px', color: '#FFFFFF', fontWeight: 900, lineHeight: 1.15 }}>
                  {viaje.titulo}
                </h1>
                <p style={{ margin: 0, fontSize: '0.94rem', color: '#B5C9BE', maxWidth: '520px', lineHeight: 1.4 }}>
                  {viaje.descripcion || 'Crónica de ruta, paradas memorables y kilómetros en libertad.'}
                </p>
                {viaje.explorador_detalle?.username && (
                  <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#889E90' }}>
                    Explorador: <strong>@{viaje.explorador_detalle.username}</strong>
                  </div>
                )}
              </div>

              {/* Sello Coleccionable */}
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-block',
                  border: '2px dashed #D97706',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: 'rgba(217, 119, 6, 0.1)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#F59E0B', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {viaje.esta_cerrado ? '★ RUTA SELLADA ★' : '★ EN TRAVESÍA ★'}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                    {viaje.duracion_dias} {viaje.duracion_dias === 1 ? 'DÍA' : 'DÍAS'} DE RUTA
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#889E90', marginTop: '8px' }}>
                  📅 {formatearFecha(viaje.fecha_inicio)} {viaje.fecha_fin ? `al ${formatearFecha(viaje.fecha_fin)}` : ''}
                </div>
              </div>
            </div>

            {/* Fila de Estadísticas Clave del Viaje */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '30px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#889E90', textTransform: 'uppercase', fontWeight: 700 }}>Distancia Ida y Vuelta</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#4ADE80', marginTop: '3px' }}>
                  {viaje.km_totales} <span style={{ fontSize: '0.82rem' }}>km</span>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#889E90', textTransform: 'uppercase', fontWeight: 700 }}>Duración Total</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FCD34D', marginTop: '3px' }}>
                  {viaje.duracion_dias} <span style={{ fontSize: '0.82rem' }}>{viaje.duracion_dias === 1 ? 'día' : 'días'}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#889E90', textTransform: 'uppercase', fontWeight: 700 }}>Lugares Visitados</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#38BDF8', marginTop: '3px' }}>
                  {viaje.checkins_resumen?.length || 0}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#889E90', textTransform: 'uppercase', fontWeight: 700 }}>CC.AA. & Países</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FB7185', marginTop: '3px' }}>
                  {viaje.comunidades_visitadas?.length || 1}
                </div>
              </div>
            </div>

            {/* Listado Cronológico de Etapas / Lugares */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.18rem', color: '#4ADE80', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} /> Etapas y Lugares de la Ruta
              </h3>

              {(!viaje.checkins_resumen || viaje.checkins_resumen.length === 0) ? (
                <p style={{ color: '#889E90', fontStyle: 'italic' }}>No hay paradas registradas en esta ruta.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                        gap: '8px'
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
                            fontSize: '0.85rem',
                            flexShrink: 0
                          }}>
                            {idx + 1}
                          </span>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFFFFF' }}>
                              {ch.lugar_nombre}
                            </span>
                            <span style={{ fontSize: '0.84rem', color: '#B0C2B7', marginLeft: '8px' }}>
                              ({ch.poblacion || ''}{ch.provincia ? `, ${ch.provincia}` : ''})
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: '#889E90' }}>
                          <span>📅 {formatearFecha(ch.fecha_llegada)}</span>
                          <span>🌙 {ch.dias_previstos} {ch.dias_previstos === 1 ? 'noche' : 'noches'}</span>
                          {ch.valoracion_camper && (
                            <span style={{ color: '#FCD34D' }}>🚐 {ch.valoracion_camper} / 5</span>
                          )}
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
                          <span><strong>Nota de ruta:</strong> {ch.notas_privadas}</span>
                        </div>
                      )}

                      {/* Fotografía del Lugar */}
                      {ch.foto && (
                        <div style={{ marginLeft: '38px', marginTop: '6px' }}>
                          <img 
                            src={ch.foto} 
                            alt={ch.lugar_nombre} 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '200px', 
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

            {/* SECCIÓN BITÁCORA / DIARIOS DE RUTA DURANTE ESTE VIAJE */}
            {diarios.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.18rem', color: '#FCD34D', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={18} /> Crónicas y Diarios de Ruta en Travesía ({diarios.length})
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: diarios.length > 1 ? 'repeat(2, 1fr)' : '1fr', gap: '14px' }}>
                  {diarios.map(d => (
                    <div 
                      key={d.id}
                      style={{
                        padding: '14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      {d.imagen && (
                        <img 
                          src={d.imagen} 
                          alt="Foto del diario"
                          style={{
                            width: '100%',
                            height: '140px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#FFFFFF' }}>
                          {d.lugar_nombre ? `📍 ${d.lugar_nombre}` : 'Vivencia de ruta'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#889E90' }}>
                          {d.fecha_legible}
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#D1E0D7', lineHeight: 1.4 }}>
                        {d.contenido}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pie del Documento Coleccionable */}
            <div style={{
              marginTop: '38px',
              paddingTop: '18px',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.78rem',
              color: '#889E90'
            }}>
              <span>Camplink • Cuaderno de Bitácora Nómada A4</span>
              <span>Colección Digital de Rutas • www.camplinkapp.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
