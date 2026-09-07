// Aquí implemento el Modal de Creación de Lugar Camper con clasificación oficial por tipo_lugar
// y categorías completas de servicios, entorno/ocio y terreno/acceso.

import React, { useState } from 'react';
import { X, MapPin, Plus, Sparkles, Check, Info } from 'lucide-react';
import { peticionApi } from '../services/api';

const TIPOS_LUGAR_OPCIONES = [
  { valor: 'pernocta_libre', emoji: '🌲', label: 'Pernocta Libre (Naturaleza)', desc: 'Montaña, bosque, playa o acantilados sin servicios. Cielos oscuros y sin contaminación lumínica.' },
  { valor: 'area_autocaravanas', emoji: '🚐', label: 'Área de Autocaravanas', desc: 'Espacios habilitados específicamente para vehículos vivienda, con servicios de agua y vaciado.' },
  { valor: 'camping', emoji: '⛺', label: 'Camping', desc: 'Establecimientos de pago con todos los servicios, piscinas y ocio familiar para niños ~10 años.' },
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

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !latitud || !longitud) {
      alert('Por favor completa el nombre y las coordenadas GPS.');
      return;
    }

    try {
      setGuardando(true);
      const datos = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        tipo_lugar: tipoLugar,
        latitud: parseFloat(latitud),
        longitud: parseFloat(longitud),
        provincia: provincia.trim(),
        poblacion: poblacion.trim(),
        precio: parseFloat(precio || 0),
        es_gratuito: esGratuito,
        // Servicios
        tiene_agua: tieneAgua,
        tiene_lavabo: tieneLavabo,
        tiene_electricidad: tieneElectricidad,
        tiene_wifi: tieneWifi,
        tiene_basuras: tieneBasuras,
        tiene_duchas: tieneDuchas,
        tiene_vaciado_aguas_grises: tieneVaciadoGrises,
        tiene_vaciado_aguas_negras: tieneVaciadoNegras,
        // Entorno y Ocio
        ideal_familias: idealFamilias,
        tiene_senderismo: tieneSenderismo,
        playa_cercana: playaCercana,
        rutas_en_bici: rutasEnBici,
        admite_mascotas: admiteMascotas,
        // Terreno y Acceso
        acceso_asfaltado: accesoAsfaltado,
        mucha_sombra: muchaSombra,
        muy_soleado: muySoleado,
        terreno_nivelado: terrenoNivelado,
        apto_grandes_autocaravanas: aptoGrandes,
        permite_sacar_toldo: permiteToldo,
      };

      const creado = await peticionApi('/api/lugares/lista/', {
        method: 'POST',
        data: datos
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
          {/* Clasificación Tipo de Lugar */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '8px' }}>
              📍 Clasificación del Lugar:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '8px' }}>
              {TIPOS_LUGAR_OPCIONES.map((tipo) => (
                <div
                  key={tipo.valor}
                  onClick={() => setTipoLugar(tipo.valor)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: tipoLugar === tipo.valor ? '2px solid var(--accent-forest)' : '1px solid var(--border-color)',
                    background: tipoLugar === tipo.valor ? 'rgba(35, 83, 52, 0.15)' : 'var(--bg-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{tipo.emoji}</span> <span>{tipo.label}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.3' }}>
                    {tipo.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nombre y Población */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Nombre del Lugar *</label>
              <input type="text" className="form-control" required placeholder="Ej: Mirador de las Estrellas" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Población / Municipio</label>
              <input type="text" className="form-control" placeholder="Ej: Potes, Cazorla, etc." value={poblacion} onChange={e => setPoblacion(e.target.value)} />
            </div>
          </div>

          {/* Coordenadas GPS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Latitud GPS *</label>
              <input type="number" step="any" className="form-control" required placeholder="43.1234" value={latitud} onChange={e => setLatitud(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Longitud GPS *</label>
              <input type="number" step="any" className="form-control" required placeholder="-4.5678" value={longitud} onChange={e => setLongitud(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Provincia</label>
              <input type="text" className="form-control" placeholder="Ej: Cantabria" value={provincia} onChange={e => setProvincia(e.target.value)} />
            </div>
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
