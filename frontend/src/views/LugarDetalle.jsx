// Aquí implemento la vista detallada de un Lugar de pernocta con estética Glassmorphism,
// botón directo de navegación GPS 'Cómo llegar / Ir al lugar', exportación dual a Google Calendar y Apple Calendar (.ics),
// widget de clima en ruta con alertas camper, soporte de guardado offline y notas privadas.

import React, { useState, useEffect } from 'react';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CamperIconRating from '../components/CamperIconRating';
import WidgetClima from '../components/WidgetClima';
import { 
  ArrowLeft, MapPin, Calendar, CheckCircle2, 
  Send, Sparkles, AlertCircle, Share2, Compass, 
  Lock, Eye, HardDriveDownload, Check, Fuel, 
  AlertTriangle, Navigation, CalendarPlus, Route, X, Plus, Radar
} from 'lucide-react';

export default function LugarDetalle({ lugarId, alVolver, alHacerCheckin, abrirRadar }) {
  // Aquí controlo los datos del lugar, las notas privadas, el guardado offline y la alerta de combustible
  const [lugar, setLugar] = useState(null);
  const [misCheckinsLugar, setMisCheckinsLugar] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [guardadoOffline, setGuardadoOffline] = useState(false);
  const [guardadoParaIr, setGuardadoParaIr] = useState(false);

  const { usuario } = useAuth();
  const [puntuacionNueva, setPuntuacionNueva] = useState(5);
  const [comentarioNuevo, setComentarioNuevo] = useState('');
  const [enviandoValoracion, setEnviandoValoracion] = useState(false);

  // Estados para añadir este lugar a un viaje planificado
  const [modalAnadirViajeAbierto, setModalAnadirViajeAbierto] = useState(false);
  const [misViajesPlanificados, setMisViajesPlanificados] = useState([]);
  const [viajeSeleccionadoId, setViajeSeleccionadoId] = useState('');
  const [fechaParadaPlanificada, setFechaParadaPlanificada] = useState(new Date().toISOString().split('T')[0]);
  const [diasParadaPlanificada, setDiasParadaPlanificada] = useState(1);
  const [notasParadaPlanificada, setNotasParadaPlanificada] = useState('');
  const [creandoNuevoViajeInline, setCreandoNuevoViajeInline] = useState(false);
  const [nuevoViajeInlineTitulo, setNuevoViajeInlineTitulo] = useState('');
  const [nuevoViajeInlineFecha, setNuevoViajeInlineFecha] = useState(new Date().toISOString().split('T')[0]);
  const [guardandoEnViaje, setGuardandoEnViaje] = useState(false);
  const [mensajeExitoViaje, setMensajeExitoViaje] = useState('');

  // Comprobar estado offline al cargar
  useEffect(() => {
    try {
      const guardados = JSON.parse(localStorage.getItem('camplink_lugares_offline') || '[]');
      const existe = guardados.some(l => l.id === lugarId);
      setGuardadoOffline(existe);

      const favs = JSON.parse(localStorage.getItem('camplink_lugares_guardados') || '[]');
      setGuardadoParaIr(favs.some(l => l.id === lugarId));
    } catch (e) {
      console.warn('Error leyendo almacenamiento local:', e);
    }
  }, [lugarId]);


  const alternarGuardadoParaIr = () => {
    // Aquí guardo o retiro el lugar de mi lista de 'Lugares Guardados para ir'
    if (!lugar) return;
    try {
      let favs = JSON.parse(localStorage.getItem('camplink_lugares_guardados') || '[]');
      if (guardadoParaIr) {
        favs = favs.filter(l => l.id !== lugar.id);
        setGuardadoParaIr(false);
      } else {
        const item = {
          id: lugar.id,
          nombre: lugar.nombre,
          poblacion: lugar.poblacion,
          provincia: lugar.provincia,
          latitud: lugar.latitud,
          longitud: lugar.longitud,
          descripcion: lugar.descripcion,
          origen: 'ficha',
          fecha_guardado: new Date().toISOString()
        };
        favs = [item, ...favs.filter(l => l.id !== lugar.id)];
        setGuardadoParaIr(true);
      }
      localStorage.setItem('camplink_lugares_guardados', JSON.stringify(favs));
    } catch (e) {
      console.warn('Error al guardar para ir:', e);
    }
  };

  const alternarGuardadoOffline = () => {
    // Aquí almaceno o descarto la ficha del lugar en localStorage para consultarla sin datos móviles
    if (!lugar) return;
    try {
      let guardados = JSON.parse(localStorage.getItem('camplink_lugares_offline') || '[]');
      if (guardadoOffline) {
        guardados = guardados.filter(l => l.id !== lugar.id);
        setGuardadoOffline(false);
      } else {
        const copiaOffline = {
          id: lugar.id,
          nombre: lugar.nombre,
          poblacion: lugar.poblacion,
          provincia: lugar.provincia,
          latitud: lugar.latitud,
          longitud: lugar.longitud,
          descripcion: lugar.descripcion,
          servicios: lugar.servicios,
          es_gratuito: lugar.es_gratuito,
          precio_noche: lugar.precio_noche,
          ideal_ninos_10_anos: lugar.ideal_ninos_10_anos,
          fecha_guardado: new Date().toISOString()
        };
        guardados = [copiaOffline, ...guardados.filter(l => l.id !== lugar.id)];
        setGuardadoOffline(true);
      }
      localStorage.setItem('camplink_lugares_offline', JSON.stringify(guardados));
    } catch (err) {
      console.error('Error al guardar offline:', err);
      alert('No se pudo guardar la información en memoria local.');
    }
  };

  const cargarDetalle = async () => {
    // Aquí cargo la ficha del lugar desde el servidor o desde el respaldo offline si falla la conexión
    setCargando(true);
    try {
      const data = await peticionApi(`/api/lugares/puntos/${lugarId}/`);
      setLugar(data);

      if (usuario) {
        try {
          const checkins = await peticionApi(`/api/diario/checkins/?lugar_id=${lugarId}&mis_checkins=true`);
          setMisCheckinsLugar(checkins);
        } catch {}
      }
    } catch (err) {
      // Intento recuperar del modo offline
      try {
        const guardados = JSON.parse(localStorage.getItem('camplink_lugares_offline') || '[]');
        const local = guardados.find(l => l.id === lugarId);
        if (local) {
          setLugar(local);
          setError(null);
        } else {
          setError('No se pudo encontrar el lugar solicitado.');
        }
      } catch {
        setError('No se pudo encontrar el lugar solicitado.');
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDetalle();
  }, [lugarId, usuario]);

  // Cálculo de distancia y estimación de repostaje
  let distanciaEstimadaKm = null;
  let avisoCombustible = false;
  let autonomiaEstimada = 600;

  if (lugar && usuario) {
    const latOrigen = usuario.lat_base;
    const lngOrigen = usuario.lng_base;
    if (latOrigen && lngOrigen && lugar.latitud && lugar.longitud) {
      const R = 6371;
      const dLat = ((lugar.latitud - latOrigen) * Math.PI) / 180;
      const dLon = ((lugar.longitud - lngOrigen) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((latOrigen * Math.PI) / 180) *
          Math.cos((lugar.latitud * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanciaEstimadaKm = Math.round(R * c * 1.25);

      const cap = usuario.capacidad_deposito_l || 60;
      const con = usuario.consumo_medio_l_100km || 8.5;
      autonomiaEstimada = Math.round((cap / con) * 100);

      if (distanciaEstimadaKm * 2 >= autonomiaEstimada * 0.75) {
        avisoCombustible = true;
      }
    }
  }

  const enviarValoracion = async (e) => {
    e.preventDefault();
    if (!usuario) {
      alert('Debes iniciar sesión para valorar un lugar.');
      return;
    }

    setEnviandoValoracion(true);
    try {
      await peticionApi(`/api/lugares/puntos/${lugarId}/valorar/`, {
        method: 'POST',
        body: {
          puntuacion_camper: puntuacionNueva,
          comentario: comentarioNuevo
        }
      });
      setComentarioNuevo('');
      cargarDetalle();
    } catch (err) {
      alert(err.message || 'Error al enviar valoración');
    } finally {
      setEnviandoValoracion(false);
    }
  };

  const irAlLugarNavegacionGps = () => {
    // Aquí abro directamente Google Maps o el GPS preferido del dispositivo con la ruta guiada
    if (!lugar) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lugar.latitud},${lugar.longitud}`;
    window.open(url, '_blank');
  };

  const exportarGoogleCalendar = () => {
    // Aquí genero el enlace a Google Calendar pegando exclusivamente las coordenadas GPS en la ubicación
    if (!lugar) return;
    const titulo = encodeURIComponent(`Pernocta Camper en ${lugar.nombre}`);
    const detalles = encodeURIComponent(`Pernocta en ${lugar.nombre} (${lugar.poblacion}). Coordenadas GPS: ${lugar.latitud}, ${lugar.longitud}`);
    const ubicacion = encodeURIComponent(`${lugar.latitud}, ${lugar.longitud}`);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&details=${detalles}&location=${ubicacion}`;
    window.open(url, '_blank');
  };

  const abrirModalAnadirViaje = async () => {
    // Aquí cargo los viajes del explorador para seleccionar a cuál vincular este lugar
    if (!usuario) {
      alert('Inicia sesión para planificar paradas en tus viajes.');
      return;
    }
    setModalAnadirViajeAbierto(true);
    setMensajeExitoViaje('');
    try {
      const data = await peticionApi('/api/viajes/viajes/?mis_viajes=true');
      const lista = data.results || data || [];
      const noCerrados = lista.filter(v => !v.esta_cerrado);
      setMisViajesPlanificados(noCerrados);
      if (noCerrados.length > 0) {
        setViajeSeleccionadoId(noCerrados[0].id);
        setFechaParadaPlanificada(noCerrados[0].fecha_inicio || new Date().toISOString().split('T')[0]);
      } else {
        setCreandoNuevoViajeInline(true);
      }
    } catch (e) {
      console.error('Error al cargar viajes para planificar:', e);
    }
  };

  const guardarParadaEnViaje = async (e) => {
    e.preventDefault();
    if (!lugar) return;
    setGuardandoEnViaje(true);
    setMensajeExitoViaje('');

    try {
      let targetViajeId = viajeSeleccionadoId;

      if (creandoNuevoViajeInline) {
        if (!nuevoViajeInlineTitulo.trim()) {
          alert('Introduce un título para el nuevo viaje.');
          setGuardandoEnViaje(false);
          return;
        }
        const viajeCreado = await peticionApi('/api/viajes/viajes/', {
          method: 'POST',
          body: {
            titulo: nuevoViajeInlineTitulo.trim(),
            fecha_inicio: nuevoViajeInlineFecha,
            esta_cerrado: false
          }
        });
        targetViajeId = viajeCreado.id;
      }

      if (!targetViajeId) {
        alert('Selecciona o crea un viaje.');
        setGuardandoEnViaje(false);
        return;
      }

      await peticionApi(`/api/viajes/viajes/${targetViajeId}/anadir-parada/`, {
        method: 'POST',
        body: {
          lugar_id: lugar.id,
          fecha: fechaParadaPlanificada,
          dias_previstos: diasParadaPlanificada,
          notas_privadas: notasParadaPlanificada
        }
      });

      setMensajeExitoViaje(`¡${lugar.nombre} se ha añadido correctamente a tu viaje!`);
      setTimeout(() => {
        setModalAnadirViajeAbierto(false);
        setMensajeExitoViaje('');
        setCreandoNuevoViajeInline(false);
        setNotasParadaPlanificada('');
      }, 1600);
    } catch (err) {
      alert(err.message || 'No se pudo añadir el lugar al viaje planificado.');
    } finally {
      setGuardandoEnViaje(false);
    }
  };

  const exportarAppleCalendar = () => {
    // Aquí genero un archivo estándar .ics compatible con Apple Calendar (iPhone/Mac) y Outlook
    if (!lugar) return;
    const ahora = new Date();
    const formatoFecha = (d) => d.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
    const inicio = formatoFecha(ahora);
    const fin = formatoFecha(new Date(ahora.getTime() + 24 * 60 * 60 * 1000));
    const enlaceGps = `https://www.google.com/maps/search/?api=1&query=${lugar.latitud},${lugar.longitud}`;

    const contenidoIcs = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Camplink//Pernocta Camper//ES',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `SUMMARY:Pernocta Camper en ${lugar.nombre}`,
      `DESCRIPTION:Pernocta en ${lugar.nombre} (${lugar.poblacion}). Coordenadas GPS: ${lugar.latitud}, ${lugar.longitud}. Enlace: ${enlaceGps}`,
      `LOCATION:${lugar.latitud}, ${lugar.longitud}`,
      `GEO:${lugar.latitud};${lugar.longitud}`,
      `DTSTART:${inicio}`,
      `DTEND:${fin}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([contenidoIcs], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pernocta-${lugar.nombre.toLowerCase().replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (cargando) {
    return (
      <div className="camplink-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: '2rem' }}>🚐</span>
        <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Cargando ficha del lugar...</p>
      </div>
    );
  }

  if (error || !lugar) {
    return (
      <div className="camplink-container" style={{ padding: '40px 20px' }}>
        <button className="btn btn-secondary btn-sm" onClick={alVolver} style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="camper-card" style={{ color: '#D93838' }}>⚠️ {error || 'Lugar no disponible.'}</div>
      </div>
    );
  }

  return (
    <div className="camplink-container" style={{ padding: '30px 20px 80px', width: '100%', margin: '0 auto', maxWidth: '1100px' }}>
      {/* Botón de Retorno y Acciones Rápidas de Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <button className="btn btn-secondary btn-sm" onClick={alVolver}>
          <ArrowLeft size={16} /> Volver al Mapa / Exploración
        </button>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Botón Radar en este lugar */}
          {abrirRadar && lugar && lugar.latitud != null && lugar.longitud != null && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => abrirRadar({ lat: lugar.latitud, lng: lugar.longitud, nombre: lugar.nombre })}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Abrir Radar Nómada como si estuvieras en este lugar (gasolineras baratas, clima y servicios)"
            >
              <Radar size={15} color="var(--accent-earth)" />
              <span>Radar Aquí</span>
            </button>
          )}

          {/* Botón: Añadir a Viaje Planificado */}
          {usuario && (
            <button
              className="btn btn-accent btn-sm"
              onClick={abrirModalAnadirViaje}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Añadir esta pernocta como etapa de un viaje planificado o futuro"
            >
              <Route size={15} />
              <span>Añadir a Viaje Planificado</span>
            </button>
          )}

          {/* Botón 1: Guardar Lugar / Para ir */}
          <button
            className={`btn ${guardadoParaIr ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={alternarGuardadoParaIr}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Añadir a Lugares Guardados e Inspiración en tu perfil"
          >
            {guardadoParaIr ? <Check size={16} /> : <span>🌲</span>}
            <span>{guardadoParaIr ? 'Guardado para ir ✔' : 'Guardar Lugar (Para ir)'}</span>
          </button>

          {/* Botón 2: Modo Offline (Sin Cobertura) */}
          <button
            className={`btn ${guardadoOffline ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={alternarGuardadoOffline}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Guarda los datos del lugar en tu móvil para consultarlos en plena montaña sin cobertura"
          >
            {guardadoOffline ? <Check size={16} /> : <HardDriveDownload size={16} />}
            <span>{guardadoOffline ? 'Descargado Offline' : 'Modo Offline (Sin Cobertura)'}</span>
          </button>
        </div>
      </div>

      {/* ADVERTENCIA DE COMBUSTIBLE Y REPOSTAJE SEGÚN AUTONOMÍA */}
      {avisoCombustible && distanciaEstimadaKm && (
        <div
          className="camper-card"
          style={{
            padding: '16px 20px',
            marginBottom: '24px',
            background: 'rgba(217, 119, 6, 0.1)',
            border: '2px solid #D97706',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>⚠️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Fuel size={17} /> Advertencia de Combustible en Ruta
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: '1.4' }}>
              Este destino está a aprox. <strong>{distanciaEstimadaKm} km</strong> de tu base ({distanciaEstimadaKm * 2} km ida y vuelta). 
              Con tu depósito de <strong>{usuario.capacidad_deposito_l || 60}L</strong> y consumo medio de <strong>{usuario.consumo_medio_l_100km || 8.5} L/100km</strong>, 
              tu autonomía máxima ronda los <strong>~{autonomiaEstimada} km</strong>. Es muy recomendable que planifiques paradas de repostaje antes de quedarte en reserva.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        {/* COLUMNA IZQUIERDA: INFORMACIÓN, NOTAS PRIVADAS Y SERVICIOS */}
        <div>
          {/* BADGE TIPO DE LUGAR */}
          <div style={{ marginBottom: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(35, 83, 52, 0.12)',
              color: 'var(--accent-forest)',
              border: '1.5px solid var(--accent-forest)',
              borderRadius: 'var(--radius-full)',
              padding: '4px 12px',
              fontSize: '0.84rem',
              fontWeight: 800
            }}>
              <span>{lugar.tipo_lugar_display || (lugar.tipo_lugar === 'pernocta_libre' ? '🌲 Pernocta Libre (Naturaleza)' : lugar.tipo_lugar === 'area_autocaravanas' ? '🚐 Área de Autocaravanas' : lugar.tipo_lugar === 'camping' ? '⛺ Camping' : lugar.tipo_lugar === 'parking_urbano' ? '🅿️ Parking Urbano / Mixto' : lugar.tipo_lugar === 'area_recreativa' ? '🏞️ Área Recreativa / Merendero' : '💧 Solo Servicios')}</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '2.2rem' }}>📍</span>
            <div>
              <h1 style={{ fontSize: '1.9rem', color: 'var(--text-primary)', margin: 0 }}>{lugar.nombre}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
                <MapPin size={15} color="var(--accent-forest)" />
                <span>{lugar.poblacion} {lugar.provincia && `(${lugar.provincia})`} • {lugar.pais}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0 20px', flexWrap: 'wrap' }}>
            {(lugar.total_valoraciones > 0 || (lugar.valoraciones && lugar.valoraciones.length > 0)) ? (
              <>
                <CamperIconRating valor={lugar.valoracion_media} soloLectura tamaño="grande" />
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{lugar.valoracion_media} / 5</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  ({lugar.total_valoraciones || lugar.valoraciones?.length || 0} {(lugar.total_valoraciones === 1 || lugar.valoraciones?.length === 1) ? 'explorador ha puntuado' : 'exploradores han puntuado'})
                </span>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                <span>⛺</span>
                <span>Este lugar aún no ha sido puntuado (0 exploradores). ¡Sé el primero en valorarlo abajo!</span>
              </div>
            )}
          </div>

          {/* ACTIVIDAD RECIENTE: EXPLORADORES QUE HAN HECHO CHECK-IN EL ÚLTIMO MES */}
          <div style={{
            background: 'rgba(54, 121, 77, 0.09)',
            border: '1px solid rgba(54, 121, 77, 0.28)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'var(--accent-forest)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                flexShrink: 0
              }}>
                🚐
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {lugar.checkins_ultimo_mes > 0 ? (
                    <span><strong>{lugar.checkins_ultimo_mes} explorador{lugar.checkins_ultimo_mes === 1 ? '' : 'es'}</strong> han hecho check-in el último mes</span>
                  ) : (
                    <span>Sin pernoctas registradas en los últimos 30 días</span>
                  )}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {lugar.checkins_ultimo_mes > 0 
                    ? 'Comunidad nómada activa: punto visitado y comprobado recientemente.'
                    : 'Pernocta tranquila: sé el primer explorador en registrar su estancia este mes.'}
                </div>
              </div>
            </div>


          </div>

          {/* BOTONES PRINCIPALES DE ACCIÓN: IR AL LUGAR, CHECK-IN Y CALENDARIOS */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {/* BOTÓN IR AL LUGAR / CÓMO LLEGAR (GPS) */}
            <button
              className="btn btn-primary"
              onClick={irAlLugarNavegacionGps}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-earth)' }}
            >
              <Navigation size={17} /> 🚗 Cómo llegar / Ir al Lugar
            </button>

            {/* BOTÓN HACER CHECK-IN */}
            <button className="btn btn-primary" onClick={() => alHacerCheckin(lugar)}>
              🌙 Hacer Check-in Aquí
            </button>

            {/* BOTÓN GOOGLE CALENDAR */}
            <button className="btn btn-secondary btn-sm" onClick={exportarGoogleCalendar} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} /> Google Calendar
            </button>

            {/* BOTÓN APPLE CALENDAR (.ICS) */}
            <button className="btn btn-secondary btn-sm" onClick={exportarAppleCalendar} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarPlus size={15} /> Apple Calendar (.ics)
            </button>

            {/* BOTÓN RADAR EN EL LUGAR */}
            {abrirRadar && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => abrirRadar({ lat: lugar.latitud, lng: lugar.longitud, nombre: lugar.nombre })}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Abrir Radar Nómada como si estuvieras en este lugar para consultar servicios cercanos y gasolineras"
              >
                <Radar size={15} color="var(--accent-earth)" />
                <span>Radar en este Lugar</span>
              </button>
            )}
          </div>

          {/* Servicios, Entorno y Terreno Categorizados */}
          <div className="camper-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 900, color: 'var(--text-primary)' }}>
              Equipamiento, Entorno y Acceso
            </h3>

            {/* 1. Servicios Básicos */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-forest)', marginBottom: '8px' }}>
                🚰 Servicios Básicos y Camper
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {lugar.es_gratuito && <span className="badge-camper badge-forest">💸 100% Gratuito</span>}
                {!lugar.es_gratuito && lugar.precio_noche && (
                  <span className="badge-camper badge-earth">💶 {lugar.precio_noche} €/noche</span>
                )}
                {(lugar.agua_potable || lugar.tiene_agua) && <span className="badge-camper badge-forest">💧 Agua Potable</span>}
                {lugar.lavabos && <span className="badge-camper badge-forest">🚻 Lavabos / WC</span>}
                {(lugar.electricidad || lugar.tiene_electricidad) && <span className="badge-camper badge-forest">⚡ Electricidad</span>}
                {lugar.wifi && <span className="badge-camper badge-forest">📶 Wi-Fi</span>}
                {lugar.basuras && <span className="badge-camper badge-forest">🗑️ Cubos de Basura</span>}
                {lugar.duchas && <span className="badge-camper badge-forest">🚿 Duchas</span>}
                {(lugar.vaciado_aguas_grises || lugar.vaciado_aguas) && <span className="badge-camper badge-forest">🔘 Vaciado de Grises</span>}
                {(lugar.vaciado_aguas_negras || lugar.vaciado_aguas) && <span className="badge-camper badge-forest">🚽 Vaciado de Negras (WC)</span>}
              </div>
            </div>

            {/* 2. Entorno y Ocio */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-forest)', marginBottom: '8px' }}>
                🌳 Entorno y Ocio
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {lugar.ideal_ninos_10_anos && <span className="badge-camper badge-forest">👨‍👩‍👧 Ideal Familias</span>}
                {lugar.senderismo_cercano && <span className="badge-camper badge-forest">🥾 Senderismo Cercano</span>}
                {lugar.playa_cercana && <span className="badge-camper badge-forest">🏖️ Playa / Lago / Río</span>}
                {lugar.rutas_bici && <span className="badge-camper badge-forest">🚴 Rutas en Bicicleta</span>}
                {(lugar.admite_mascotas || lugar.mascotas) && <span className="badge-camper badge-forest">🐕 Admite Mascotas</span>}
              </div>
            </div>

            {/* 3. Terreno y Acceso */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-forest)', marginBottom: '8px' }}>
                🛣️ Terreno y Acceso
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {lugar.acceso_asfaltado && <span className="badge-camper badge-forest">🛣️ Acceso Asfaltado</span>}
                {lugar.mucha_sombra && <span className="badge-camper badge-forest">🌲 Mucha Sombra</span>}
                {lugar.muy_soleado_placas && <span className="badge-camper badge-forest">☀️ Muy Soleado (Placas)</span>}
                {lugar.terreno_nivelado && <span className="badge-camper badge-forest">📐 Terreno Nivelado</span>}
                {lugar.apto_autocaravanas_grandes && <span className="badge-camper badge-forest">🚍 Apto Autocaravanas &gt;7m</span>}
                {(lugar.permitido_sacar_toldo || lugar.permite_sacar_toldo || lugar.toldo) && <span className="badge-camper badge-forest">⛱️ Permite Sacar Toldo y Sillas</span>}
              </div>
            </div>

          </div>

          {/* Descripción del Lugar */}
          {lugar.descripcion && (
            <div className="camper-card" style={{ padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px' }}>Sobre esta pernocta</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0, fontSize: '0.92rem' }}>
                {lugar.descripcion}
              </p>
            </div>
          )}

          {/* MIS NOTAS PRIVADAS EN ESTE LUGAR */}
          {usuario && misCheckinsLugar.length > 0 && (
            <div className="camper-card" style={{ padding: '20px', marginBottom: '24px', border: '2px solid var(--accent-earth)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Lock size={18} color="var(--accent-earth)" />
                <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                  Tus Notas Privadas sobre este Lugar
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 10px' }}>
                Solo tú puedes ver este diario de ruta personal:
              </p>
              {misCheckinsLugar.map((ck) => (
                ck.notas_privadas ? (
                  <div key={ck.id} style={{ background: 'var(--bg-primary)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Pernocta del {new Date(ck.fecha_llegada).toLocaleDateString('es-ES')} ({ck.dias_previstos} noche{ck.dias_previstos > 1 ? 's' : ''}):
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                      {ck.notas_privadas}
                    </div>
                  </div>
                ) : null
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: CLIMA EN TIEMPO REAL (PROPS CORREGIDAS) Y RESEÑAS */}
        <div>
          {/* Widget de Clima con props exactas latitud y longitud */}
          {lugar.latitud && lugar.longitud && (
            <div style={{ marginBottom: '24px' }}>
              <WidgetClima 
                latitud={lugar.latitud} 
                longitud={lugar.longitud} 
                nombreLugar={lugar.nombre} 
              />
            </div>
          )}

          {/* Dejar Valoración */}
          <div className="camper-card" style={{ padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 12px' }}>Deja tu experiencia camper</h3>
            <form onSubmit={enviarValoracion}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Puntuación camper:
                </label>
                <CamperIconRating valor={puntuacionNueva} alCambiar={setPuntuacionNueva} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Comparte detalles del terreno, nivelación, cobertura móvil..."
                  value={comentarioNuevo}
                  onChange={(e) => setComentarioNuevo(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm" disabled={enviandoValoracion}>
                <Send size={14} /> {enviandoValoracion ? 'Enviando...' : 'Publicar Reseña'}
              </button>
            </form>
          </div>
        </div>
      </div>
    
      {/* Modal Glassmorphism: Planificar Parada en Viaje */}
      {modalAnadirViajeAbierto && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div className="camper-card" style={{
            maxWidth: '520px',
            width: '100%',
            padding: '26px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-glass)',
            boxShadow: 'var(--shadow-glass-lg)',
            border: '1px solid var(--border-color)',
            animation: 'fadeIn 0.25s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Route size={22} color="var(--color-camper)" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Planificar en Viaje</h3>
              </div>
              <button 
                type="button"
                className="btn-icon"
                onClick={() => setModalAnadirViajeAbierto(false)}
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Añade <strong>{lugar?.nombre}</strong> como punto o pernocta en tu itinerario de ruta:
            </p>

            {mensajeExitoViaje ? (
              <div style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(35, 83, 52, 0.15)',
                border: '1px solid var(--color-camper)',
                color: 'var(--color-camper)',
                fontWeight: 700,
                textAlign: 'center'
              }}>
                {mensajeExitoViaje}
              </div>
            ) : (
              <form onSubmit={guardarParadaEnViaje} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {misViajesPlanificados.length > 0 && !creandoNuevoViajeInline ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Selecciona viaje:</label>
                      <button 
                        type="button" 
                        onClick={() => setCreandoNuevoViajeInline(true)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-camper)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700 }}
                      >
                        + Crear nuevo viaje
                      </button>
                    </div>
                    <select
                      className="form-control"
                      value={viajeSeleccionadoId}
                      onChange={(e) => setViajeSeleccionadoId(e.target.value)}
                      required
                    >
                      {misViajesPlanificados.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.titulo} ({v.fecha_inicio || 'Sin fecha'})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Nuevo viaje en el que incluir la parada:</label>
                      {misViajesPlanificados.length > 0 && (
                        <button 
                          type="button" 
                          onClick={() => setCreandoNuevoViajeInline(false)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Usar viaje existente
                        </button>
                      )}
                    </div>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Ej: Ruta Costa Cantábrica"
                      value={nuevoViajeInlineTitulo}
                      onChange={(e) => setNuevoViajeInlineTitulo(e.target.value)}
                      style={{ marginBottom: '10px' }}
                      required={creandoNuevoViajeInline}
                    />
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Fecha de inicio:</label>
                    <input 
                      type="date"
                      className="form-control"
                      value={nuevoViajeInlineFecha}
                      onChange={(e) => setNuevoViajeInlineFecha(e.target.value)}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '4px', fontWeight: 600 }}>
                      Fecha prevista parada:
                    </label>
                    <input 
                      type="date"
                      className="form-control"
                      value={fechaParadaPlanificada}
                      onChange={(e) => setFechaParadaPlanificada(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '4px', fontWeight: 600 }}>
                      Días / Noches:
                    </label>
                    <input 
                      type="number"
                      min="1"
                      max="30"
                      className="form-control"
                      value={diasParadaPlanificada}
                      onChange={(e) => setDiasParadaPlanificada(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '4px', fontWeight: 600 }}>
                    Notas privadas o preparativos:
                  </label>
                  <textarea 
                    className="form-control"
                    rows="2"
                    placeholder="Ej: Llegar antes del atardecer, rellenar depósito de agua..."
                    value={notasParadaPlanificada}
                    onChange={(e) => setNotasParadaPlanificada(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setModalAnadirViajeAbierto(false)}
                    disabled={guardandoEnViaje}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-sm"
                    disabled={guardandoEnViaje}
                  >
                    {guardandoEnViaje ? 'Guardando...' : 'Añadir a mi viaje'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
