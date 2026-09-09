import { comprimirImagen } from '../utils/imageCompressor';
// Aquí implemento el Modal de Creación de Lugar Camper con subida de imagen principal,
// clasificación oficial por tipo_lugar y categorías completas de servicios, entorno y terreno.

import React, { useState } from 'react';
import { X, MapPin, Plus, Sparkles, Check, Info, Camera, Image, UploadCloud, Trash2 } from 'lucide-react';
import { peticionApi } from '../services/api';
import { IMAGENES_PREESTABLECIDAS_POR_TIPO } from '../utils/lugarImagenes';

const TIPOS_LUGAR_OPCIONES = [
  { valor: 'pernocta_libre', emoji: '🌲', label: 'Pernocta Libre (Naturaleza)', desc: 'Montaña, bosque, playa o acantilados sin servicios. Cielos oscuros y sin contaminación lumínica.' },
  { valor: 'area_autocaravanas', emoji: '🚐', label: 'Área de Autocaravanas', desc: 'Espacios habilitados específicamente para vehículos vivienda, con servicios de agua y vaciado.' },
  { valor: 'camping', emoji: '⛺', label: 'Camping', desc: 'Establecimientos de pago con todos los servicios, piscinas y ocio familiar.' },
  { valor: 'parking_urbano', emoji: '🅿️', label: 'Parking Urbano / Mixto', desc: 'Aparcamientos en pueblos/ciudades. Solo dormir dentro del vehículo (sin desplegar toldos).' },
  { valor: 'area_recreativa', emoji: '🏞️', label: 'Área Recreativa / Merendero', desc: 'Zonas de picnic con mesas de madera, fuentes, barbacoas y senderos.' },
  { valor: 'solo_servicios', emoji: '💧', label: 'Solo Servicios', desc: 'Punto de logística para vaciado de aguas grises/negras y carga de agua limpia (no pernocta).' },
];

export default function ModalCrearLugar({ cerrado, alGuardarLugar, coordenadasIniciales = null }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoLugar, setTipoLugar] = useState('pernocta_libre');
  const [latitud, setLatitud] = useState(coordenadasIniciales?.lat || '');
  const [longitud, setLongitud] = useState(coordenadasIniciales?.lng || '');
  const [provincia, setProvincia] = useState('');
  const [poblacion, setPoblacion] = useState('');
  const [precio, setPrecio] = useState('0');
  const [esGratuito, setEsGratuito] = useState(true);

  // Foto principal
  const [fotoPrincipal, setFotoPrincipal] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  // Servicios
  const [tieneAgua, setTieneAgua] = useState(false);
  const [tieneLavabo, setTieneLavabo] = useState(false);
  const [tieneElectricidad, setTieneElectricidad] = useState(false);
  const [tieneWifi, setTieneWifi] = useState(false);
  const [tieneBasuras, setTieneBasuras] = useState(true);
  const [tieneDuchas, setTieneDuchas] = useState(false);
  const [tieneVaciadoGrises, setTieneVaciadoGrises] = useState(false);
  const [tieneVaciadoNegras, setTieneVaciadoNegras] = useState(false);

  // Entorno y Ocio
  const [idealFamilias, setIdealFamilias] = useState(false);
  const [tieneSenderismo, setTieneSenderismo] = useState(false);
  const [playaCercana, setPlayaCercana] = useState(false);
  const [rutasEnBici, setRutasEnBici] = useState(false);
  const [admiteMascotas, setAdmiteMascotas] = useState(true);

  // Terreno y Acceso
  const [accesoAsfaltado, setAccesoAsfaltado] = useState(true);
  const [muchaSombra, setMuchaSombra] = useState(false);
  const [muySoleado, setMuySoleado] = useState(false);
  const [terrenoNivelado, setTerrenoNivelado] = useState(true);
  const [aptoGrandes, setAptoGrandes] = useState(true);
  const [permiteToldo, setPermiteToldo] = useState(false);

  const [guardando, setGuardando] = useState(false);

  // Estados para importar automáticamente desde Google Maps
  const [urlMaps, setUrlMaps] = useState('');
  const [extrayendoMaps, setExtrayendoMaps] = useState(false);
  const [mensajeMapsExito, setMensajeMapsExito] = useState('');
  const [errorMaps, setErrorMaps] = useState('');

  const extraerDatosMaps = async (urlAProcesar) => {
    const url = (urlAProcesar || urlMaps || '').trim();
    if (!url) return;
    setExtrayendoMaps(true);
    setErrorMaps('');
    setMensajeMapsExito('');

    try {
      const res = await peticionApi('/api/lugares/puntos/extraer-maps/', {
        method: 'POST',
        body: { url }
      });

      if (res?.exito) {
        if (res.nombre) setNombre(res.nombre);
        if (res.latitud != null) setLatitud(res.latitud);
        if (res.longitud != null) setLongitud(res.longitud);
        if (res.poblacion) setPoblacion(res.poblacion);
        if (res.provincia) setProvincia(res.provincia);
        if (res.tipo_lugar_sugerido) setTipoLugar(res.tipo_lugar_sugerido);
        if (res.descripcion_sugerida && (!descripcion || descripcion.trim() === '')) {
          setDescripcion(res.descripcion_sugerida);
        }
        setMensajeMapsExito(`¡Datos extraídos con éxito! Coordenadas: ${res.latitud}, ${res.longitud} • ${res.poblacion || ''}`);
      } else {
        setErrorMaps(res?.error || 'No se pudieron extraer datos de la URL proporcionada.');
      }
    } catch (err) {
      console.error('Error al extraer datos de Google Maps:', err);
      setErrorMaps(err.message || 'Error al conectar con el servicio de extracción.');
    } finally {
      setExtrayendoMaps(false);
    }
  };

    const manejarCambioFoto = async (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
      const archivoComprimido = await comprimirImagen(archivo, { maxAncho: 1600, maxAlto: 1600, calidad: 0.82 });
      setFotoPrincipal(archivoComprimido);
      setFotoPreview(URL.createObjectURL(archivoComprimido));
    }
  };

  const quitarFoto = () => {
    setFotoPrincipal(null);
    if (fotoPreview) {
      URL.revokeObjectURL(fotoPreview);
    }
    setFotoPreview(null);
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !latitud || !longitud) {
      alert('Por favor completa el nombre y las coordenadas GPS.');
      return;
    }

    try {
      setGuardando(true);
      const formData = new FormData();
      formData.append('nombre', nombre.trim());
      formData.append('descripcion', descripcion.trim());
      formData.append('tipo_lugar', tipoLugar);
      formData.append('latitud', parseFloat(latitud));
      formData.append('longitud', parseFloat(longitud));
      formData.append('provincia', provincia.trim());
      formData.append('poblacion', poblacion.trim());
      formData.append('precio', parseFloat(precio || 0));
      formData.append('es_gratuito', esGratuito);

      if (fotoPrincipal) {
        formData.append('foto_principal', fotoPrincipal);
      }

      // Servicios
      formData.append('tiene_agua', tieneAgua ? 'true' : 'false');
      formData.append('tiene_lavabo', tieneLavabo ? 'true' : 'false');
      formData.append('tiene_electricidad', tieneElectricidad ? 'true' : 'false');
      formData.append('tiene_wifi', tieneWifi ? 'true' : 'false');
      formData.append('tiene_basuras', tieneBasuras ? 'true' : 'false');
      formData.append('tiene_duchas', tieneDuchas ? 'true' : 'false');
      formData.append('tiene_vaciado_aguas_grises', tieneVaciadoGrises ? 'true' : 'false');
      formData.append('tiene_vaciado_aguas_negras', tieneVaciadoNegras ? 'true' : 'false');

      // Entorno y Ocio
      formData.append('ideal_familias', idealFamilias ? 'true' : 'false');
      formData.append('tiene_senderismo', tieneSenderismo ? 'true' : 'false');
      formData.append('playa_cercana', playaCercana ? 'true' : 'false');
      formData.append('rutas_en_bici', rutasEnBici ? 'true' : 'false');
      formData.append('admite_mascotas', admiteMascotas ? 'true' : 'false');

      // Terreno y Acceso
      formData.append('acceso_asfaltado', accesoAsfaltado ? 'true' : 'false');
      formData.append('mucha_sombra', muchaSombra ? 'true' : 'false');
      formData.append('muy_soleado', muySoleado ? 'true' : 'false');
      formData.append('terreno_nivelado', terrenoNivelado ? 'true' : 'false');
      formData.append('apto_grandes_autocaravanas', aptoGrandes ? 'true' : 'false');
      formData.append('permite_sacar_toldo', permiteToldo ? 'true' : 'false');

      const creado = await peticionApi('/api/lugares/puntos/', {
        method: 'POST',
        body: formData
      });

      if (alGuardarLugar) alGuardarLugar(creado);
      if (cerrado) cerrado();
    } catch (err) {
      console.error('Error al crear lugar:', err);
      alert('Error al registrar el lugar. Verifica los campos requeridos.');
    } finally {
      setGuardando(false);
    }
  };

  const tipoSeleccionadoObj = TIPOS_LUGAR_OPCIONES.find(t => t.valor === tipoLugar) || TIPOS_LUGAR_OPCIONES[0];

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px', backdropFilter: 'blur(10px)' }}>
      <div className="camper-card" style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '26px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} color="var(--accent-forest)" /> Publicar Nuevo Lugar de Pernocta
          </h2>
          <button onClick={cerrado} className="btn-icon" style={{ cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* AUTO-COMPLETAR DESDE GOOGLE MAPS */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(46, 139, 87, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)',
            border: '1.5px solid var(--accent-forest)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                <Sparkles size={16} color="var(--accent-forest)" />
                <span>Rellenar automáticamente desde Google Maps</span>
              </label>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Soporta enlaces cortos, lugares y coordenadas
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Pega aquí la URL (ej: https://maps.app.goo.gl/CDHyovNjceX89hqy6)"
                value={urlMaps}
                onChange={(e) => {
                  const val = e.target.value;
                  setUrlMaps(val);
                  if (val.includes('maps.app.goo.gl') || val.includes('google.com/maps') || val.includes('goo.gl/maps')) {
                    extraerDatosMaps(val);
                  }
                }}
                onPaste={(e) => {
                  const textoPegado = e.clipboardData?.getData('text') || '';
                  if (textoPegado.includes('maps.app.goo.gl') || textoPegado.includes('google.com/maps') || textoPegado.includes('goo.gl/maps')) {
                    setTimeout(() => extraerDatosMaps(textoPegado), 50);
                  }
                }}
                style={{ fontSize: '0.82rem', padding: '7px 12px', flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={extrayendoMaps || !urlMaps.trim()}
                onClick={() => extraerDatosMaps(urlMaps)}
                style={{ whiteSpace: 'nowrap', fontWeight: 700, padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {extrayendoMaps ? (
                  <>
                    <span className="spinner-border spinner-border-sm" style={{ width: '13px', height: '13px' }} />
                    <span>Extrayendo...</span>
                  </>
                ) : (
                  <>
                    <MapPin size={14} />
                    <span>Extraer datos</span>
                  </>
                )}
              </button>
            </div>

            {mensajeMapsExito && (
              <div style={{
                marginTop: '8px',
                fontSize: '0.78rem',
                color: '#4ADE80',
                background: 'rgba(46, 139, 87, 0.2)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Check size={14} />
                <span>{mensajeMapsExito}</span>
              </div>
            )}

            {errorMaps && (
              <div style={{
                marginTop: '8px',
                fontSize: '0.78rem',
                color: '#F87171',
                background: 'rgba(239, 68, 68, 0.15)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)'
              }}>
                ⚠️ {errorMaps}
              </div>
            )}
          </div>

          {/* TIPO DE LUGAR */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
              Tipo de Lugar Camper *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              {TIPOS_LUGAR_OPCIONES.map(tipo => {
                const seleccionado = tipoLugar === tipo.valor;
                return (
                  <button
                    type="button"
                    key={tipo.valor}
                    onClick={() => setTipoLugar(tipo.valor)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: seleccionado ? 'rgba(40, 167, 69, 0.15)' : 'var(--bg-primary)',
                      border: `1.5px solid ${seleccionado ? 'var(--accent-forest)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{tipo.emoji}</span>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: seleccionado ? 'var(--accent-forest)' : 'var(--text-primary)' }}>
                        {tipo.label}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.25 }}>
                        {tipo.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FOTO PRINCIPAL DEL LUGAR */}
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            border: '1px solid var(--border-color)'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>
              <Camera size={16} color="var(--accent-forest)" /> Foto Principal del Lugar
            </label>

            {fotoPreview ? (
              <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <img loading="lazy" decoding="async" 
                  src={fotoPreview} 
                  alt="Vista previa" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={quitarFoto}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(217, 56, 56, 0.85)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }}
                  title="Quitar foto"
                >
                  <Trash2 size={16} />
                </button>
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  background: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  ✅ Foto seleccionada lista para subir
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{
                  flex: '1',
                  minWidth: '220px',
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.02)',
                  transition: 'border-color 0.2s ease'
                }}>
                  <UploadCloud size={24} color="var(--accent-forest)" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Subir foto desde tu dispositivo
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    JPG, PNG o WebP
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={manejarCambioFoto}
                    style={{ display: 'none' }}
                  />
                </label>

                {/* Previsualización de la imagen por defecto representativa */}
                <div style={{
                  width: '140px',
                  height: '90px',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid var(--border-color)',
                  flexShrink: 0
                }}>
                  <img loading="lazy" decoding="async" 
                    src={IMAGENES_PREESTABLECIDAS_POR_TIPO[tipoLugar] || '/img/tipos/pernocta_libre.jpg'}
                    alt="Por defecto"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '4px 6px'
                  }}>
                    <span style={{ fontSize: '0.68rem', color: '#fff', fontWeight: 600, lineHeight: 1.1 }}>
                      Imagen preestablecida ({tipoSeleccionadoObj.emoji})
                    </span>
                  </div>
                </div>
              </div>
            )}
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '8px 0 0' }}>
              💡 Si no adjuntas una foto propia, se asignará automáticamente la imagen preestablecida para <strong>{tipoSeleccionadoObj.label}</strong>.
            </p>
          </div>

          {/* Nombre */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Nombre del Lugar *</label>
            <input 
              type="text" 
              className="form-control" 
              required 
              placeholder="Ej: Mirador de los Acantilados" 
              value={nombre} 
              onChange={e => {
                const val = e.target.value;
                if (val.includes('maps.app.goo.gl') || val.includes('google.com/maps') || val.includes('goo.gl/maps')) {
                  setUrlMaps(val);
                  extraerDatosMaps(val);
                } else {
                  setNombre(val);
                }
              }} 
            />
          </div>

          {/* Coordenadas GPS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Latitud GPS *</label>
              <input type="number" step="any" className="form-control" required placeholder="43.1234" value={latitud} onChange={e => setLatitud(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Longitud GPS *</label>
              <input type="number" step="any" className="form-control" required placeholder="-4.5678" value={longitud} onChange={e => setLongitud(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Población</label>
              <input type="text" className="form-control" placeholder="Ej: San Vicente" value={poblacion} onChange={e => setPoblacion(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Provincia</label>
              <input type="text" className="form-control" placeholder="Ej: Cantabria" value={provincia} onChange={e => setProvincia(e.target.value)} />
            </div>
          </div>

          {/* Precio y gratuidad */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
              <input type="checkbox" checked={esGratuito} onChange={e => setEsGratuito(e.target.checked)} /> 💸 Es 100% Gratuito
            </label>
            {!esGratuito && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem' }}>Precio/noche:</label>
                <input type="number" step="0.5" min="0" className="form-control" style={{ width: '80px', padding: '4px 8px' }} value={precio} onChange={e => setPrecio(e.target.value)} />
                <span style={{ fontSize: '0.82rem' }}>€</span>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Descripción & Consejos de Pernocta</label>
            <textarea className="form-control" rows="3" placeholder="Acceso, tipo de suelo, sombras, vistas y recomendaciones para la comunidad..." value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          </div>

          {/* SERVICIOS */}
          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px' }}>🚰 Servicios Disponibles:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={tieneAgua} onChange={e => setTieneAgua(e.target.checked)} /> 🚰 Agua potable
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={tieneLavabo} onChange={e => setTieneLavabo(e.target.checked)} /> 🚽 Lavabos
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={tieneElectricidad} onChange={e => setTieneElectricidad(e.target.checked)} /> ⚡ Electricidad
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={tieneWifi} onChange={e => setTieneWifi(e.target.checked)} /> 🛜 Wi-Fi
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={tieneBasuras} onChange={e => setTieneBasuras(e.target.checked)} /> 🗑️ Basuras
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={tieneDuchas} onChange={e => setTieneDuchas(e.target.checked)} /> 🚿 Duchas
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={tieneVaciadoGrises} onChange={e => setTieneVaciadoGrises(e.target.checked)} /> 🔄 Aguas Grises
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={tieneVaciadoNegras} onChange={e => setTieneVaciadoNegras(e.target.checked)} /> 🚽 Aguas Negras
              </label>
            </div>
          </div>

          {/* ENTORNO Y OCIO */}
          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px' }}>🌳 Entorno y Ocio:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={idealFamilias} onChange={e => setIdealFamilias(e.target.checked)} /> 👨‍👩‍👧‍👦 Ideal Familias
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={tieneSenderismo} onChange={e => setTieneSenderismo(e.target.checked)} /> 🥾 Senderismo
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={playaCercana} onChange={e => setPlayaCercana(e.target.checked)} /> 🏖️ Playa cercana
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={rutasEnBici} onChange={e => setRutasEnBici(e.target.checked)} /> 🚴 Rutas en bici
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={admiteMascotas} onChange={e => setAdmiteMascotas(e.target.checked)} /> 🐕 Admite mascotas
              </label>
            </div>
          </div>

          {/* TERRENO Y ACCESO */}
          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px' }}>🛣️ Terreno y Acceso:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={accesoAsfaltado} onChange={e => setAccesoAsfaltado(e.target.checked)} /> 🛣️ Acceso asfaltado
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={muchaSombra} onChange={e => setMuchaSombra(e.target.checked)} /> 🌲 Mucha sombra
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={muySoleado} onChange={e => setMuySoleado(e.target.checked)} /> ☀️ Muy soleado
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={terrenoNivelado} onChange={e => setTerrenoNivelado(e.target.checked)} /> 📐 Terreno nivelado
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={aptoGrandes} onChange={e => setAptoGrandes(e.target.checked)} /> 🚐 Apto &gt;7m
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={permiteToldo} onChange={e => setPermiteToldo(e.target.checked)} /> 🪑 Permite toldo
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={cerrado} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Publicando...' : 'Publicar Lugar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
