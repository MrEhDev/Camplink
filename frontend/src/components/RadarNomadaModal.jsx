// Aquí implemento el Radar Nómada ("Cerca de Mí") en Camplink:
// geocodificación inversa real, clima en tiempo real y Buscador de Gasolineras Baratas
// con precios oficiales de carburante por litro y ordenación económica.

import React, { useState, useEffect } from 'react';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { buscarGasolinerasCercanas } from '../services/gasolineras';
import WidgetClima from './WidgetClima';
import CamperIconRating from './CamperIconRating';
import { obtenerGeolocalizacionRapida } from '../utils/geolocation';
import {
  X, Radar, Navigation, MapPin, Fuel,
  ShoppingBag, Droplet, Sparkles, ShowerHead,
  Trash2, ExternalLink, CheckCircle2, Sliders, ArrowUpDown
} from 'lucide-react';

export default function RadarNomadaModal({ alCerrar, alSeleccionarLugar, alHacerCheckin, ubicacionInicial }) {
  // Aquí controlo las coordenadas GPS, la geocodificación real, los servicios y el buscador de gasolineras baratas
  const { usuario } = useAuth();
  const [gps, setGps] = useState(null);
  const [ubicacionTexto, setUbicacionTexto] = useState('');
  const [cargandoGps, setCargandoGps] = useState(true);
  const [subvista, setSubvista] = useState('servicios'); // 'servicios' | 'gasolineras'

  // Estados de servicios y pernoctas cercanas
  const [lugaresCercanos, setLugaresCercanos] = useState([]);
  const [cargandoLugares, setCargandoLugares] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

  // Estados del Buscador de Gasolineras Baratas
  const [radioGasolinera, setRadioGasolinera] = useState(10);
  const [combustibleSeleccionado, setCombustibleSeleccionado] = useState(usuario?.tipo_combustible || 'gasoleo_a');
  const [gasolineras, setGasolineras] = useState([]);
  const [cargandoGasolineras, setCargandoGasolineras] = useState(false);

  // Cerrar radar si la ventana pierde el foco o se cambia de pestaña/aplicación
  useEffect(() => {
    const manejarPerdidaFoco = () => {
      if (alCerrar) alCerrar();
    };

    const manejarVisibilidad = () => {
      if (document.hidden && alCerrar) {
        alCerrar();
      }
    };

    window.addEventListener('blur', manejarPerdidaFoco);
    document.addEventListener('visibilitychange', manejarVisibilidad);

    return () => {
      window.removeEventListener('blur', manejarPerdidaFoco);
      document.removeEventListener('visibilitychange', manejarVisibilidad);
    };
  }, [alCerrar]);

  const serviciosConfig = [
    { id: 'supermercados', nombre: 'Supermercados', icono: ShoppingBag, color: '#8A63D2', queryMaps: 'supermercados' },
    { id: 'gasolineras', nombre: 'Gasolineras', icono: Fuel, color: 'var(--accent-earth)', queryMaps: 'gasolineras' },
    { id: 'agua', nombre: 'Puntos de Agua', icono: Droplet, color: 'var(--accent-forest)', filtroProp: 'tiene_agua', queryMaps: 'fuentes agua potable' },
    { id: 'vaciado', nombre: 'Vaciado de Aguas', icono: Trash2, color: '#0284C7', filtroProp: 'tiene_vaciado_aguas_grises', queryMaps: 'areas autocaravanas vaciado aguas' },
    { id: 'duchas', nombre: 'Duchas / Lavandería', icono: ShowerHead, color: '#F59E0B', filtroProp: 'tiene_duchas', queryMaps: 'lavanderias autoservicio o duchas' },
  ];

  useEffect(() => {
    // Si se pasa una ubicación inicial (desde parada de itinerario o ficha de lugar), centro el radar allí
    if (ubicacionInicial && ubicacionInicial.lat != null && ubicacionInicial.lng != null) {
      const coords = {
        lat: parseFloat(Number(ubicacionInicial.lat).toFixed(4)),
        lng: parseFloat(Number(ubicacionInicial.lng).toFixed(4)),
      };
      setGps(coords);
      setCargandoGps(false);
      if (ubicacionInicial.nombre) {
        setUbicacionTexto(ubicacionInicial.nombre);
      } else {
        obtenerMunicipioReal(coords.lat, coords.lng);
      }
      buscarCercanos(coords.lat, coords.lng);
      consultarGasolineras(coords.lat, coords.lng, radioGasolinera, combustibleSeleccionado);
      return;
    }

    // Solicito la posición actual por el navegador de forma optimizada
    obtenerGeolocalizacionRapida(
      (pos) => {
        const coords = {
          lat: parseFloat(pos.coords.latitude.toFixed(4)),
          lng: parseFloat(pos.coords.longitude.toFixed(4)),
        };
        setGps(coords);
        setCargandoGps(false);
        obtenerMunicipioReal(coords.lat, coords.lng);
        buscarCercanos(coords.lat, coords.lng);
        consultarGasolineras(coords.lat, coords.lng, radioGasolinera, combustibleSeleccionado);
      },
      () => {
        const fallback = { lat: 41.6523, lng: -0.8814 }; // Zaragoza por defecto
        setGps(fallback);
        setCargandoGps(false);
        obtenerMunicipioReal(fallback.lat, fallback.lng);
        buscarCercanos(fallback.lat, fallback.lng);
        consultarGasolineras(fallback.lat, fallback.lng, radioGasolinera, combustibleSeleccionado);
      }
    );
  }, []);

  const obtenerMunicipioReal = async (lat, lng) => {
    // Aquí realizo la geocodificación inversa para confirmar la población real
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`);
      if (res.ok) {
        const data = await res.json();
        const pueblo = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || data.address?.suburb || 'Ubicación Detectada';
        const provincia = data.address?.province || data.address?.state || '';
        setUbicacionTexto(`${pueblo}${provincia ? ' (' + provincia + ')' : ''}`);
      }
    } catch {
      setUbicacionTexto('Posición GPS Activa');
    }
  };

  const buscarCercanos = async (lat, lng) => {
    // Aquí consulto los lugares de pernocta a menos de 150km ordenados por distancia
    setCargandoLugares(true);
    try {
      const datos = await peticionApi(`/api/lugares/cercanos/?lat=${lat}&lng=${lng}&radio=150`);
      setLugaresCercanos(datos);
    } catch {
      console.warn('Error al recuperar lugares cercanos');
    } finally {
      setCargandoLugares(false);
    }
  };

  const consultarGasolineras = async (lat, lng, radio, comb) => {
    // Aquí consulto las gasolineras con precios oficiales en tiempo real ordenadas por precio
    setCargandoGasolineras(true);
    try {
      const data = await buscarGasolinerasCercanas({ lat, lng, radioKm: radio, tipoCombustible: comb });
      setGasolineras(data);
    } catch (err) {
      console.error('Error al buscar gasolineras:', err);
    } finally {
      setCargandoGasolineras(false);
    }
  };

  const manejarCambioCombustible = (nuevoComb) => {
    setCombustibleSeleccionado(nuevoComb);
    if (gps) {
      consultarGasolineras(gps.lat, gps.lng, radioGasolinera, nuevoComb);
    }
  };

  const manejarCambioRadio = (nuevoRadio) => {
    setRadioGasolinera(nuevoRadio);
    if (gps) {
      consultarGasolineras(gps.lat, gps.lng, nuevoRadio, combustibleSeleccionado);
    }
  };

  const lugaresFiltrados = servicioSeleccionado && servicioSeleccionado.filtroProp
    ? lugaresCercanos.filter(l => l[servicioSeleccionado.filtroProp])
    : lugaresCercanos;

  return (
    <div className="modal-overlay" onClick={alCerrar}>
      <div className="modal-content" style={{ maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera con Ubicación Real y Selector de Subvista */}
        <div className="modal-header" style={{ paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Radar size={26} color="var(--accent-earth)" />
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Radar Nómada (Cerca de Mí)</h3>
              <div style={{ fontSize: '0.84rem', color: 'var(--accent-forest)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                <MapPin size={14} />
                <span>{ubicacionTexto || 'Localizando posición real...'}</span>
                {gps && <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.78rem' }}>• [{gps.lat}, {gps.lng}]</span>}
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={alCerrar} title="Cerrar"><X size={18} /></button>
        </div>

        {/* SELECTOR DE PESTAÑAS DEL RADAR: SERVICIOS VS GASOLINERAS BARATAS */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          <button
            className={`btn btn-sm ${subvista === 'servicios' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSubvista('servicios')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Radar size={15} /> Pernoctas y Servicios
          </button>
          <button
            className={`btn btn-sm ${subvista === 'gasolineras' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSubvista('gasolineras')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Fuel size={15} /> Gasolineras
          </button>
        </div>

        {/* SUBVISTA 1: SERVICIOS, CLIMA Y PERNOCTAS CERCANAS */}
        {subvista === 'servicios' && (
          <div>
            {/* Clima en Tiempo Real */}
            {gps && (
              <div style={{ marginBottom: '20px' }}>
                <WidgetClima latitud={gps.lat} longitud={gps.lng} nombreLugar={ubicacionTexto || "Mi Posición Actual"} />
              </div>
            )}

            {/* Servicios Esenciales Clickeables */}
            <div style={{
              background: 'var(--bg-primary)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px', color: 'var(--text-primary)' }}>
                Buscar Servicios Esenciales en Navegador:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {serviciosConfig.map((s) => {
                  const Icono = s.icono;
                  // Búsqueda limpia en Google Maps: utiliza el municipio/zona o coordenadas exactas sin palabras clave en inglés
                  const zonaBusqueda = (ubicacionInicial?.poblacion || ubicacionInicial?.municipio || ubicacionTexto)
                    ? `${s.queryMaps} en ${ubicacionInicial?.poblacion || ubicacionInicial?.municipio || ubicacionTexto}`
                    : (gps ? `${s.queryMaps} ${gps.lat},${gps.lng}` : s.queryMaps);
                  const enlaceMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zonaBusqueda)}`;

                  return (
                    <a
                      key={s.id}
                      href={enlaceMaps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                      title={`Buscar ${s.nombre.toLowerCase()} en ${ubicacionTexto || 'esta zona'}`}
                    >
                      <Icono size={14} color={s.color} />
                      <span>{s.nombre}</span>
                      <ExternalLink size={11} color="var(--text-muted)" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Pernoctas Cercanas en Radio de 150 km */}
            <div>
              <h4 style={{ fontSize: '1.05rem', margin: '0 0 12px' }}>
                Lugares de Pernocta Cercanos ({lugaresFiltrados.length}):
              </h4>
              {cargandoLugares ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Buscando pernoctas...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                  {lugaresFiltrados.map((lug) => (
                    <div
                      key={lug.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        background: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>{lug.nombre}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          📍 {lug.poblacion} • {lug.distancia_km} km
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.76rem', padding: '4px 8px' }}
                          onClick={() => {
                            alCerrar();
                            if (alSeleccionarLugar) alSeleccionarLugar(lug.id);
                          }}
                        >
                          Ver Ficha
                        </button>
                        <a
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.76rem', padding: '4px 8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                          href={`https://www.google.com/maps/dir/?api=1&destination=${lug.latitud},${lug.longitud}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation size={12} /> Ir
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBVISTA 2: BUSCADOR DE GASOLINERAS BARATAS EN TIEMPO REAL */}
        {subvista === 'gasolineras' && (
          <div>
            {/* Filtros de Distancia y Combustible */}
            <div style={{
              background: 'var(--bg-primary)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '18px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              {/* Selector de Combustible */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Combustible de tu vehículo:
                </label>
                <select
                  className="form-control"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '0.84rem' }}
                  value={combustibleSeleccionado}
                  onChange={(e) => manejarCambioCombustible(e.target.value)}
                >
                  <option value="gasoleo_a">Diésel / Gasóleo A</option>
                  <option value="gasolina_95">Gasolina 95 E5</option>
                  <option value="gasolina_98">Gasolina 98 E5</option>
                  <option value="glp">GLP / Autogás</option>
                </select>
              </div>

              {/* Selector de Radio de Distancia */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Radio de distancia:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[5, 10, 25, 50].map((r) => (
                    <button
                      key={r}
                      onClick={() => manejarCambioRadio(r)}
                      className={`btn btn-sm ${radioGasolinera === r ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUpDown size={14} color="var(--accent-forest)" /> Ordenadas de menor a mayor precio
              </div>
            </div>

            {/* Listado de Gasolineras Baratas en Tiempo Real */}
            {cargandoGasolineras ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                <Fuel size={32} style={{ animation: 'bounce 1s infinite' }} color="var(--accent-forest)" />
                <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>Consultando precios oficiales del Ministerio en tu zona...</p>
              </div>
            ) : gasolineras.length === 0 ? (
              <div className="camper-card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                No se encontraron estaciones de servicio para {combustibleSeleccionado.toUpperCase()} en un radio de {radioGasolinera} km. Prueba a ampliar el radio a 50 km.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '340px', overflowY: 'auto' }}>
                {gasolineras.map((gas, idx) => {
                  const esLaMasBarata = idx === 0;

                  return (
                    <div
                      key={gas.id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 16px',
                        background: esLaMasBarata ? 'rgba(35, 83, 52, 0.12)' : 'var(--bg-primary)',
                        borderRadius: 'var(--radius-md)',
                        border: esLaMasBarata ? '2px solid var(--accent-forest)' : '1px solid var(--border-color)',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          background: esLaMasBarata ? 'var(--accent-forest)' : 'rgba(255,255,255,0.06)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1rem'
                        }}>
                          {esLaMasBarata ? '⭐' : `${idx + 1}º`}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                              {gas.rotulo}
                            </span>
                            {esLaMasBarata && (
                              <span className="badge-camper badge-forest" style={{ fontSize: '0.72rem' }}>
                                ¡La más barata!
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            📍 {gas.direccion} ({gas.municipio}) • A {gas.distanciaKm} km
                          </div>
                        </div>
                      </div>

                      {/* Precio / Litro y Navegación GPS */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: esLaMasBarata ? 'var(--accent-forest)' : 'var(--text-primary)' }}>
                            {gas.precioLitro.toFixed(3)} €
                            <span style={{ fontSize: '0.76rem', fontWeight: 400, color: 'var(--text-muted)' }}>/L</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {gas.tipoCombustibleEtiqueta}
                          </div>
                        </div>

                        <a
                          className="btn btn-primary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', padding: '6px 12px' }}
                          href={`https://www.google.com/maps/dir/?api=1&destination=${gas.lat},${gas.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation size={13} /> Ir
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
