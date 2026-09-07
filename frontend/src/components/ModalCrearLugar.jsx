// Aquí implemento el modal con diseño Glassmorphism para dar de alta un nuevo Lugar de pernocta,
// permitiendo marcar coordenadas GPS, servicios camper y el filtro temático "Ideal para Familias".

import React, { useState } from 'react';
import { peticionApi } from '../services/api';
import { X, MapPin, Navigation, DollarSign, Image } from 'lucide-react';

export default function ModalCrearLugar({ alCerrar, alCompletar }) {
  // Aquí gestiono todos los campos descriptivos y servicios del nuevo punto camper
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [latitud, setLatitud] = useState(40.4168);
  const [longitud, setLongitud] = useState(-3.7038);
  const [poblacion, setPoblacion] = useState('');
  const [provincia, setProvincia] = useState('');
  const [precio, setPrecio] = useState(0);
  const [esGratuito, setEsGratuito] = useState(true);
  const [fotoPrincipal, setFotoPrincipal] = useState(null);

  // Servicios camper
  const [tieneAgua, setTieneAgua] = useState(false);
  const [tieneLavabo, setTieneLavabo] = useState(false);
  const [tieneDuchas, setTieneDuchas] = useState(false);
  const [tieneElectricidad, setTieneElectricidad] = useState(false);
  const [tieneVaciadoGrises, setTieneVaciadoGrises] = useState(false);
  const [tieneVaciadoNegras, setTieneVaciadoNegras] = useState(false);
  const [admiteMascotas, setAdmiteMascotas] = useState(true);
  const [tieneWifi, setTieneWifi] = useState(false);
  const [tienePicnic, setTienePicnic] = useState(false);

  // Filtros temáticos
  const [zonaRecreativa, setZonaRecreativa] = useState(false);
  const [senderos, setSenderos] = useState(false);
  const [idealFamilias, setIdealFamilias] = useState(false);
  const [granAutocaravana, setGranAutocaravana] = useState(true);
  const [permiteToldo, setPermiteToldo] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const usarMiUbicacion = () => {
    // Aquí obtengo las coordenadas GPS en tiempo real y autocompleto población y provincia con geocodificación inversa
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(5));
          const lng = parseFloat(pos.coords.longitude.toFixed(5));
          setLatitud(lat);
          setLongitud(lng);

          try {
            const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.features && data.features.length > 0) {
                const props = data.features[0].properties;
                const pueblo = props.city || props.town || props.village || props.municipality || props.county || '';
                const prov = props.state || props.county || '';
                if (pueblo) setPoblacion(pueblo);
                if (prov) setProvincia(prov);
              }
            }
          } catch (e) {
            console.warn('Geocodificación inversa no completada:', e);
          }
        },
        () => {
          setError('No se pudo obtener la ubicación GPS actual.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('descripcion', descripcion);
      formData.append('latitud', latitud);
      formData.append('longitud', longitud);
      formData.append('poblacion', poblacion);
      formData.append('provincia', provincia);
      formData.append('precio', esGratuito ? 0 : precio);
      formData.append('es_gratuito', esGratuito);

      formData.append('tiene_agua', tieneAgua);
      formData.append('tiene_lavabo', tieneLavabo);
      formData.append('tiene_duchas', tieneDuchas);
      formData.append('tiene_electricidad', tieneElectricidad);
      formData.append('tiene_vaciado_aguas_grises', tieneVaciadoGrises);
      formData.append('tiene_vaciado_aguas_negras', tieneVaciadoNegras);
      formData.append('admite_mascotas', admiteMascotas);
      formData.append('tiene_wifi', tieneWifi);
      formData.append('tiene_mesas_picnic', tienePicnic);

      formData.append('es_zona_recreativa', zonaRecreativa);
      formData.append('tiene_senderos_sencillos', senderos);
      formData.append('ideal_ninos_10_anos', idealFamilias);
      formData.append('apto_grandes_autocaravanas', granAutocaravana);
      formData.append('permite_sacar_toldo', permiteToldo);

      if (fotoPrincipal) {
        formData.append('foto_principal', fotoPrincipal);
      }

      const res = await peticionApi('/api/lugares/puntos/', {
        method: 'POST',
        body: formData
      });

      if (alCompletar) alCompletar(res);
      alCerrar();
    } catch (err) {
      setError(err.message || 'Error al guardar el lugar.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={alCerrar}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>📍</span>
            <h3 style={{ fontSize: '1.2rem' }}>Añadir Punto de Pernocta</h3>
          </div>
          <button className="btn-icon" onClick={alCerrar}><X size={18} /></button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(217, 56, 56, 0.1)', color: '#D93838', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.88rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={manejarEnvio}>
          <div className="form-group">
            <label className="form-label">Nombre del Lugar *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej: Área Camper Mirador del Valle"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Población</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Cangas de Onís"
                value={poblacion}
                onChange={(e) => setPoblacion(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Provincia</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Asturias"
                value={provincia}
                onChange={(e) => setProvincia(e.target.value)}
              />
            </div>
          </div>

          {/* Coordenadas GPS */}
          <div className="form-group" style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} /> Coordenadas GPS *
              </label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={usarMiUbicacion} style={{ fontSize: '0.78rem' }}>
                <Navigation size={13} /> Usar mi GPS
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latitud</span>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={latitud}
                  onChange={(e) => setLatitud(parseFloat(e.target.value))}
                  required
                />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Longitud</span>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={longitud}
                  onChange={(e) => setLongitud(parseFloat(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción Detallada</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Describe el acceso, inclinación del suelo, tranquilidad, sombra, entorno..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
            />
          </div>

          {/* Precio */}
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={esGratuito}
                onChange={(e) => setEsGratuito(e.target.checked)}
              />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Pernocta Gratuita</span>
            </label>
            {!esGratuito && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={16} />
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  style={{ width: '90px' }}
                  className="form-control"
                  value={precio}
                  onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
                />
                <span style={{ fontSize: '0.85rem' }}>€ / noche</span>
              </div>
            )}
          </div>

          {/* Servicios Camper */}
          <div className="form-group">
            <label className="form-label">Servicios Disponibles</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '8px', fontSize: '0.86rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" checked={tieneAgua} onChange={(e) => setTieneAgua(e.target.checked)} /> 💧 Agua Potable</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" checked={tieneLavabo} onChange={(e) => setTieneLavabo(e.target.checked)} /> 🚻 Lavabos / WC</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" checked={tieneDuchas} onChange={(e) => setTieneDuchas(e.target.checked)} /> 🚿 Duchas</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" checked={tieneElectricidad} onChange={(e) => setTieneElectricidad(e.target.checked)} /> ⚡ Electricidad (220V)</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" checked={tieneVaciadoGrises} onChange={(e) => setTieneVaciadoGrises(e.target.checked)} /> 🚰 Vaciado Grises</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" checked={tieneVaciadoNegras} onChange={(e) => setTieneVaciadoNegras(e.target.checked)} /> 🚽 Vaciado Negras (WC)</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" checked={admiteMascotas} onChange={(e) => setAdmiteMascotas(e.target.checked)} /> 🐾 Admite Mascotas</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" checked={tieneWifi} onChange={(e) => setTieneWifi(e.target.checked)} /> 📶 WiFi</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" checked={tienePicnic} onChange={(e) => setTienePicnic(e.target.checked)} /> 🪵 Mesas de Picnic</label>
            </div>
          </div>

          {/* Filtros temáticos */}
          <div className="form-group" style={{ background: 'rgba(35, 83, 52, 0.05)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <label className="form-label" style={{ color: 'var(--accent-forest)' }}>Filtros Temáticos Especiales</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', fontSize: '0.84rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" checked={zonaRecreativa} onChange={(e) => setZonaRecreativa(e.target.checked)} /> 🌲 Zona Recreativa</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" checked={senderos} onChange={(e) => setSenderos(e.target.checked)} /> 🥾 Senderos Sencillos</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-forest)', fontWeight: 600 }}>
                <input type="checkbox" checked={idealFamilias} onChange={(e) => setIdealFamilias(e.target.checked)} /> 👨‍👩‍👧‍👦 Ideal para Familias
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" checked={permiteToldo} onChange={(e) => setPermiteToldo(e.target.checked)} /> ⛱️ Permite toldo y mesas</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" checked={granAutocaravana} onChange={(e) => setGranAutocaravana(e.target.checked)} /> 🚌 Autocaravanas &gt;7m</label>
            </div>
          </div>

          {/* Foto Principal */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Image size={15} /> Foto Principal del Lugar
            </label>
            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={(e) => setFotoPrincipal(e.target.files[0] || null)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={alCerrar}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? 'Guardando...' : 'Publicar Lugar 📍'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}