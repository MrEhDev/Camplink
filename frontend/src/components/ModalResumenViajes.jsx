import React, { useRef, useState } from 'react';
import { Award, Download, X, Compass, MapPin, Calendar, BookOpen, Star, Fuel, Flame } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function ModalResumenViajes({ viajes = [], estadisticas = {}, explorador = {}, alCerrar }) {
  const documentoRef = useRef(null);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  // Formatear fechas en formato estricto DD-MM-YYYY
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const partes = String(fechaStr).split('T')[0].split('-');
    if (partes.length === 3) {
      return `${partes[2].padStart(2, '0')}-${partes[1].padStart(2, '0')}-${partes[0]}`;
    }
    return fechaStr;
  };

  // Métricas acumuladas
  const kmTotales = estadisticas.km_totales != null
    ? Number(estadisticas.km_totales)
    : Math.round(viajes.reduce((acc, v) => acc + (parseFloat(v.km_totales) || 0), 0) * 10) / 10;

  const diasTotales = estadisticas.dias_totales != null
    ? Number(estadisticas.dias_totales)
    : viajes.reduce((acc, v) => acc + (v.duracion_dias || 1), 0);

  const lugaresVisitados = estadisticas.total_lugares_visitados || estadisticas.total_pernoctas || viajes.reduce((acc, v) => acc + (v.resumen_ruta?.filter(p => p.tipo === 'parada')?.length || v.checkins_resumen?.length || 0), 0);
  const publicacionesDiario = estadisticas.total_publicaciones_diario || 0;
  const lugaresValorados = estadisticas.total_valoraciones || 0;
  const totalComunidades = estadisticas.total_comunidades || 1;
  const totalPaises = estadisticas.total_paises || 1;
  const totalViajes = viajes.length || estadisticas.total_viajes || 1;

  // Generador de datos curiosos y comparativas dinámicas
  const generarCuriosidades = () => {
    const lista = [];

    // 1. Comparativa de Distancia
    if (kmTotales < 300) {
      lista.push(`Tus ${kmTotales} km equivalen a recorrer el Camino de Santiago francés desde Roncesvalles hasta Burgos.`);
    } else if (kmTotales < 700) {
      lista.push(`Tus ${kmTotales} km equivalen a recorrer toda la costa mediterránea desde Barcelona hasta Alicante.`);
    } else if (kmTotales < 1300) {
      lista.push(`Tus ${kmTotales} km equivalen a cruzar España de sur a norte, desde las playas de Tarifa hasta Finisterre en Galicia (~1.050 km).`);
    } else if (kmTotales < 2500) {
      lista.push(`¡Tus ${kmTotales} km equivalen a una travesía directa en furgo desde Madrid hasta París o Bruselas cruzando los Pirineos!`);
    } else if (kmTotales < 4500) {
      lista.push(`Tus ${kmTotales} km equivalen a recorrer Europa de extremo a extremo: desde el estrecho de Gibraltar hasta Berlín o Roma y regresar.`);
    } else if (kmTotales < 8000) {
      lista.push(`¡Gran expedición! Tus ${kmTotales} km equivalen a llegar por carretera desde España hasta el mítico Cabo Norte (Nordkapp) en Noruega, desafiando el Círculo Polar Ártico.`);
    } else {
      const porcentajeTierra = Math.round((kmTotales / 40075) * 100);
      lista.push(`¡Espíritu de leyenda! Tus ${kmTotales} km equivalen al ${porcentajeTierra}% de una vuelta completa a la circunferencia de la Tierra (40.075 km).`);
    }

    // 2. Días bajo las estrellas
    if (diasTotales > 0) {
      const pctAno = Math.min(100, Math.round((diasTotales / 365) * 100));
      lista.push(`Has vivido ${diasTotales} días de libertad sobre ruedas, lo que representa el ${pctAno}% del año pernoctando en la naturaleza y despertando con horizontes nuevos.`);
    }

    // 3. Lugares explorados
    if (lugaresVisitados > 0) {
      lista.push(`Con ${lugaresVisitados} lugares y pernoctas registradas, has tejido una red de paradas inolvidables a lo largo de ${totalViajes} ${totalViajes === 1 ? 'viaje planificado' : 'viajes planificados'}.`);
    }

    // 4. Comunidad y diario
    if (publicacionesDiario > 0 || lugaresValorados > 0) {
      lista.push(`Tu huella nómada suma ${publicacionesDiario} relatos en el diario de ruta y ${lugaresValorados} valoraciones de lugares, guiando y enriqueciendo a toda la comunidad camper.`);
    }

    // 5. Geografía
    if (totalComunidades > 1 || totalPaises > 1) {
      lista.push(`Has rodado por ${totalComunidades} CC.AA. y ${totalPaises} países diferentes. ¡La geografía no se aprende en mapas, se siente al volante!`);
    }

    return lista;
  };

  const curiosidades = generarCuriosidades();

  // Exportar a PDF
  const descargarPdf = async () => {
    if (!documentoRef.current) return;
    setGenerandoPdf(true);
    try {
      const canvas = await html2canvas(documentoRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#111A14',
        windowWidth: 1024
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`Camplink_Resumen_Mis_Viajes.pdf`);
    } catch (err) {
      console.error('Error al generar PDF del resumen:', err);
      alert('Hubo un error al maquetar el PDF.');
    } finally {
      setGenerandoPdf(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '850px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '24px',
        boxSizing: 'border-box'
      }}>
        {/* Barra superior de controles */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Cuaderno de Bitácora</span>
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Listo para descargar
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={descargarPdf}
              disabled={generandoPdf}
              style={{ fontWeight: 700, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={16} /> {generandoPdf ? 'Maquetando PDF...' : 'Descargar'}
            </button>
            <button className="btn-icon" onClick={alCerrar} title="Cerrar ventana">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenedor Visual Imprimible con dimensiones proporcionales A4 */}
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
                  <span>Certificado de explorador</span>
                </div>
                <h1 style={{ fontSize: '2.1rem', margin: '0 0 6px', color: '#FFFFFF', fontWeight: 900, lineHeight: 1.15 }}>
                  Resumen de mis viajes
                </h1>
                <div style={{ fontSize: '0.9rem', color: '#A0B5A7', marginTop: '4px' }}>
                  Compendio oficial de rutas y kilómetros en carretera
                </div>
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
                    ★ EXPEDICIÓN GLOBAL ★
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                    {totalViajes} {totalViajes === 1 ? 'VIAJE' : 'VIAJES REGISTRADOS'}
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#889E90', marginTop: '8px' }}>
                  {explorador.username ? `@${explorador.username}` : 'Explorador Camplink'}
                </div>
              </div>
            </div>

            {/* Fila de Estadísticas Clave Acumuladas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '26px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.72rem', color: '#889E90', textTransform: 'uppercase', fontWeight: 700 }}>Distancia en Rutas</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#4ADE80', marginTop: '3px' }}>
                  {kmTotales} km
                </div>
              </div>

              <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.72rem', color: '#889E90', textTransform: 'uppercase', fontWeight: 700 }}>Días Totales</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FCD34D', marginTop: '3px' }}>
                  {diasTotales} días
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#889E90', textTransform: 'uppercase', fontWeight: 700 }}>Lugares Visitados</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#60A5FA', marginTop: '3px' }}>
                  {lugaresVisitados}
                </div>
              </div>

              <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.08)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.72rem', color: '#889E90', textTransform: 'uppercase', fontWeight: 700 }}>Publicaciones Diario</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#A78BFA', marginTop: '3px' }}>
                  {publicacionesDiario}
                </div>
              </div>

              <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.08)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.72rem', color: '#889E90', textTransform: 'uppercase', fontWeight: 700 }}>Lugares Valorados</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F472B6', marginTop: '3px' }}>
                  {lugaresValorados}
                </div>
              </div>

              <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.72rem', color: '#889E90', textTransform: 'uppercase', fontWeight: 700 }}>CC.AA. Visitadas</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#38BDF8', marginTop: '3px' }}>
                  {totalComunidades}
                </div>
              </div>
            </div>

            {/* SECCIÓN DE DATOS CURIOSOS Y COMPARATIVAS DINÁMICAS */}
            <div style={{
              marginBottom: '26px',
              padding: '20px 22px',
              background: 'linear-gradient(135deg, rgba(46, 139, 87, 0.12) 0%, rgba(217, 119, 6, 0.10) 100%)',
              borderRadius: '12px',
              border: '1.5px solid rgba(46, 139, 87, 0.35)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#4ADE80',
                fontSize: '0.86rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: '12px'
              }}>
                <Compass size={16} color="#4ADE80" />
                <span>Datos Curiosos de tus Rutas</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {curiosidades.map((curiosidad, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '0.88rem',
                      lineHeight: 1.45,
                      color: '#E0EDE5'
                    }}
                  >
                    <span style={{ color: '#F59E0B', fontWeight: 900, marginTop: '1px' }}>✦</span>
                    <span>{curiosidad}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Listado de Viajes Realizados */}
            {viajes && viajes.length > 0 && (
              <div style={{ marginBottom: '26px' }}>
                <div style={{
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#889E90',
                  marginBottom: '12px'
                }}>
                  Historial de Viajes Registrados ({viajes.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {viajes.map((v, i) => (
                    <div 
                      key={v.id || i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        fontSize: '0.86rem'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{v.titulo}</div>
                        <div style={{ fontSize: '0.78rem', color: '#889E90', marginTop: '2px' }}>
                          📅 {formatearFecha(v.fecha_inicio)} {v.fecha_fin ? `al ${formatearFecha(v.fecha_fin)}` : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, color: '#4ADE80' }}>
                          {v.km_totales} km
                        </span>
                        <div style={{ fontSize: '0.74rem', color: '#889E90' }}>
                          {v.duracion_dias} {v.duracion_dias === 1 ? 'día' : 'días'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pie de página oficial */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '16px',
              marginTop: '20px',
              fontSize: '0.78rem',
              color: '#889E90'
            }}>
              <span>Camplink</span>
              <span>Colección Digital de Rutas • www.camplinkapp.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
