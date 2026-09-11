// Aquí implemento la Landing Page de Camplink con el isotipo oficial centrado,
// 6 pilares nómadas equitativos en grid 3x2, y formularios de login/registro rápido.

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { peticionApi } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';
import { 
  Compass, Map, Shield, Wrench, Sparkles, CheckCircle, 
  ArrowRight, UserCheck, Fuel, Calendar, Moon, Radio, 
  Droplets, Zap, Heart, MessageSquare, Star, Navigation,
  HelpCircle, ChevronRight, Lock, User, Eye, EyeOff, Award, Camera
} from 'lucide-react';

const PROVINCIAS_CP = {
  '01': 'Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería', '05': 'Ávila',
  '06': 'Badajoz', '07': 'Baleares', '08': 'Barcelona', '09': 'Burgos', '10': 'Cáceres',
  '11': 'Cádiz', '12': 'Castellón', '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña',
  '16': 'Cuenca', '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Gipuzkoa',
  '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León', '25': 'Lleida',
  '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid', '29': 'Málaga', '30': 'Murcia',
  '31': 'Navarra', '32': 'Ourense', '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas',
  '36': 'Pontevedra', '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39': 'Cantabria',
  '40': 'Segovia', '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona', '44': 'Teruel',
  '45': 'Toledo', '46': 'Valencia', '47': 'Valladolid', '48': 'Bizkaia', '49': 'Zamora',
  '50': 'Zaragoza', '51': 'Ceuta', '52': 'Melilla'
};

const formatearInputUsuario = (val) => {
  if (!val) return '';
  const limpio = String(val).replace(/\s+/g, '');
  if (limpio.includes('@')) return limpio.toLowerCase();
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
};

export default function LandingPage({ setVistaActiva, abrirNuevoLugar }) {
  const { usuario, login, registro, activarCuenta, reenviarCodigo, recuperarPassword, establecerUsuario, cargarPerfil } = useAuth();
  const { t } = useTranslation();

  const [modoAuth, setModoAuth] = useState('login'); // 'login' o 'registro'
  const [pasoRegistro, setPasoRegistro] = useState(1);

  // Formulario Login
  const [loginUsername, setLoginUsername] = useState(() => {
    const guardado = localStorage.getItem('camplink_saved_username') || '';
    if (!guardado) return '';
    return formatearInputUsuario(guardado);
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [recordarUsuario, setRecordarUsuario] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(false);
  const [mostrarLoginPassword, setMostrarLoginPassword] = useState(false);
  const [mostrarRegPassword, setMostrarRegPassword] = useState(false);
  const [mostrarRegConfirmPassword, setMostrarRegConfirmPassword] = useState(false);

  // Estados de Recuperación de Contraseña / Usuario
  const [modalRecuperarAbierto, setModalRecuperarAbierto] = useState(false);
  const [recuperarInput, setRecuperarInput] = useState('');
  const [mensajeRecuperacion, setMensajeRecuperacion] = useState('');
  const [errorRecuperacion, setErrorRecuperacion] = useState('');
  const [cargandoRecuperacion, setCargandoRecuperacion] = useState(false);

  // Formulario Registro completo
  const [regData, setRegData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    fecha_nacimiento: '',
    pais: 'España',
    poblacion: '',
    codigo_postal: '',
    direccion_base: '',
    tipo_viajero: 'camper',
    tipo_combustible: 'gasoleo_a',
    capacidad_deposito_l: '50',
    consumo_medio_l_100km: '7.0',
    biografia: '',
    lat_base: null,
    lng_base: null,
  });
  const [fotoVehiculo, setFotoVehiculo] = useState(null);

  // Estados de Autocompletado de Dirección y Código Postal
  const [sugerenciasDireccion, setSugerenciasDireccion] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  const [buscandoCp, setBuscandoCp] = useState(false);
  const timerDireccion = useRef(null);
  const timerCp = useRef(null);

  // Estados de Verificación de Cuenta por Correo
  const [modalVerificacionAbierto, setModalVerificacionAbierto] = useState(false);
  const [emailVerificacion, setEmailVerificacion] = useState('');
  const [codigoVerificacionInput, setCodigoVerificacionInput] = useState('');
  const [mensajeVerificacion, setMensajeVerificacion] = useState('');
  const [errorVerificacion, setErrorVerificacion] = useState('');
  const [cargandoVerificacion, setCargandoVerificacion] = useState(false);
  const [modalConfigurarVehiculoAbierto, setModalConfigurarVehiculoAbierto] = useState(false);
  const [fotoAvatar, setFotoAvatar] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const fileInputAvatarRef = useRef(null);

  // Estados dedicados e independientes para el Modal de Configuración de Vehículo
  const [tipoViajeroModal, setTipoViajeroModal] = useState('camper');
  const [tipoCombustibleModal, setTipoCombustibleModal] = useState('gasoleo_a');
  const [capacidadModal, setCapacidadModal] = useState('50');
  const [consumoModal, setConsumoModal] = useState('7.0');
  const [codigoPostalModal, setCodigoPostalModal] = useState('');
  const [poblacionModal, setPoblacionModal] = useState('');
  const [direccionModal, setDireccionModal] = useState('');
  const [latBaseModal, setLatBaseModal] = useState(null);
  const [lngBaseModal, setLngBaseModal] = useState(null);
  const [biografiaModal, setBiografiaModal] = useState('');

  const inicializarModalVehiculo = (usr) => {
    if (usr) {
      setUsuarioPendienteVehiculo(usr);
      setTipoViajeroModal(usr.tipo_viajero || 'camper');
      setTipoCombustibleModal(usr.tipo_combustible || 'gasoleo_a');
      setCapacidadModal(usr.capacidad_deposito_l ? String(usr.capacidad_deposito_l) : '50');
      setConsumoModal(usr.consumo_medio_l_100km ? String(usr.consumo_medio_l_100km) : '7.0');
      setCodigoPostalModal(usr.codigo_postal || '');
      setPoblacionModal(usr.poblacion || '');
      setDireccionModal(usr.direccion_base || '');
      setBiografiaModal(usr.biografia || '');
      setLatBaseModal(typeof usr.lat_base === 'number' ? usr.lat_base : null);
      setLngBaseModal(typeof usr.lng_base === 'number' ? usr.lng_base : null);
    }
    setModalConfigurarVehiculoAbierto(true);
  };

  const manejarSeleccionarAvatar = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      setFotoAvatar(f);
      setPreviewAvatar(URL.createObjectURL(f));
    }
  };
  const [usuarioPendienteVehiculo, setUsuarioPendienteVehiculo] = useState(null);
  const [guardandoVehiculo, setGuardandoVehiculo] = useState(false);
  const [codigoDev, setCodigoDev] = useState('');

  // Verificación automática por enlace en URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('activar_token');
    const uid = params.get('uid');
    const emailParam = params.get('email');
    if (token && uid) {
      setCargandoAuth(true);
      activarCuenta({ uid, token, email: emailParam, autoLogin: false })
        .then((res) => {
          inicializarModalVehiculo(res.usuario);
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((err) => {
          setAuthError(err.message || 'El enlace de activación es inválido o ha caducado.');
        })
        .finally(() => setCargandoAuth(false));
    }
  }, []);

  const manejarCambioCodigoPostal = (cp) => {
    const cpLimpio = String(cp || '').replace(/\D/g, '').slice(0, 5);
    let provAuto = '';
    if (cpLimpio.length >= 2) {
      const pref = cpLimpio.slice(0, 2);
      provAuto = PROVINCIAS_CP[pref] || '';
    }

    setCodigoPostalModal(cpLimpio);
    if (!poblacionModal && provAuto) {
      setPoblacionModal(provAuto);
    }

    if (timerCp.current) clearTimeout(timerCp.current);

    if (cpLimpio.length >= 4) {
      setBuscandoCp(true);
      timerCp.current = setTimeout(async () => {
        try {
          const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(cpLimpio)}&countrycodes=es&format=json&addressdetails=1&limit=1`;
          const res = await fetch(url);
          const data = await res.json();
          if (data && data.length > 0) {
            const addr = data[0].address || {};
            const ciudad = addr.city || addr.town || addr.village || addr.municipality || addr.state_district || addr.county || provAuto || '';
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            if (ciudad) {
              setPoblacionModal(ciudad);
            }
            if (!isNaN(lat) && !isNaN(lng)) {
              setLatBaseModal(lat);
              setLngBaseModal(lng);
            }
          }
        } catch (e) {
          console.warn('Error al autocompletar código postal:', e);
        } finally {
          setBuscandoCp(false);
        }
      }, 250);
    }
  };

  const manejarCambioDireccion = (texto) => {
    setDireccionModal(texto);
    if (timerDireccion.current) clearTimeout(timerDireccion.current);

    if (!texto || texto.trim().length < 3) {
      setSugerenciasDireccion([]);
      setMostrarSugerencias(false);
      return;
    }

    timerDireccion.current = setTimeout(async () => {
      setBuscandoDireccion(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(texto)}&countrycodes=es&format=json&addressdetails=1&limit=6`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) {
          const formateadas = data.map(item => {
            const addr = item.address || {};
            const ciudad = addr.city || addr.town || addr.village || addr.municipality || '';
            const cp = addr.postcode || '';
            const provincia = addr.state || addr.province || addr.county || '';
            return {
              etiqueta: item.display_name,
              ciudad: ciudad,
              codigo_postal: cp,
              provincia: provincia,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            };
          });
          setSugerenciasDireccion(formateadas);
          setMostrarSugerencias(true);
        } else {
          setSugerenciasDireccion([]);
          setMostrarSugerencias(false);
        }
      } catch (e) {
        console.warn('Error en sugerencias de dirección:', e);
      } finally {
        setBuscandoDireccion(false);
      }
    }, 350);
  };

  const seleccionarSugerencia = (sug) => {
    setDireccionModal(sug.etiqueta);
    if (sug.ciudad) setPoblacionModal(sug.ciudad);
    if (sug.codigo_postal) setCodigoPostalModal(String(sug.codigo_postal).replace(/\D/g, '').slice(0, 5));
    if (typeof sug.lat === 'number') setLatBaseModal(sug.lat);
    if (typeof sug.lng === 'number') setLngBaseModal(sug.lng);
    setSugerenciasDireccion([]);
    setMostrarSugerencias(false);
  };

  const manejarVerificarCodigo = async (e) => {
    e.preventDefault();
    if (!codigoVerificacionInput.trim()) return;
    setErrorVerificacion('');
    setMensajeVerificacion('');
    setCargandoVerificacion(true);

    try {
      const res = await activarCuenta({
        email: emailVerificacion,
        codigo: codigoVerificacionInput.trim(),
        autoLogin: false
      });
      setModalVerificacionAbierto(false);
      inicializarModalVehiculo(res.usuario);
    } catch (err) {
      setErrorVerificacion(err.message || 'Código incorrecto. Comprueba e inténtalo de nuevo.');
    } finally {
      setCargandoVerificacion(false);
    }
  };

  const manejarGuardarVehiculo = async (e) => {
    e.preventDefault();
    if (!tipoViajeroModal) {
      alert('Por favor selecciona el tipo de vehículo.');
      return;
    }
    if (!codigoPostalModal || String(codigoPostalModal).trim().length < 4) {
      alert('Por favor introduce tu código postal.');
      return;
    }

    setGuardandoVehiculo(true);
    try {
      const capFinal = parseFloat(capacidadModal) > 0 ? parseFloat(capacidadModal) : 50.0;
      const consFinal = parseFloat(consumoModal) > 0 ? parseFloat(consumoModal) : 7.0;
      const cpFinal = String(codigoPostalModal || '').trim();
      let pobFinal = String(poblacionModal || '').trim();
      if (!pobFinal && cpFinal.length >= 2) {
        pobFinal = PROVINCIAS_CP[cpFinal.slice(0, 2)] || '';
      }
      const dirFinal = String(direccionModal || '').trim();
      const bioFinal = String(biografiaModal || '').trim();

      let bodyData;
      if (fotoAvatar) {
        bodyData = new FormData();
        bodyData.append('avatar', fotoAvatar);
        bodyData.append('tipo_viajero', tipoViajeroModal || 'camper');
        bodyData.append('tipo_combustible', tipoCombustibleModal || 'gasoleo_a');
        bodyData.append('capacidad_deposito_l', capFinal);
        bodyData.append('consumo_medio_l_100km', consFinal);
        bodyData.append('codigo_postal', cpFinal);
        bodyData.append('poblacion', pobFinal);
        bodyData.append('direccion_base', dirFinal);
        bodyData.append('biografia', bioFinal);
        if (typeof latBaseModal === 'number' && !isNaN(latBaseModal)) {
          bodyData.append('lat_base', latBaseModal);
        }
        if (typeof lngBaseModal === 'number' && !isNaN(lngBaseModal)) {
          bodyData.append('lng_base', lngBaseModal);
        }
      } else {
        bodyData = {
          tipo_viajero: tipoViajeroModal || 'camper',
          tipo_combustible: tipoCombustibleModal || 'gasoleo_a',
          capacidad_deposito_l: capFinal,
          consumo_medio_l_100km: consFinal,
          codigo_postal: cpFinal,
          poblacion: pobFinal,
          direccion_base: dirFinal,
          biografia: bioFinal,
          lat_base: typeof latBaseModal === 'number' && !isNaN(latBaseModal) ? latBaseModal : null,
          lng_base: typeof lngBaseModal === 'number' && !isNaN(lngBaseModal) ? lngBaseModal : null
        };
      }

      const usuarioActualizado = await peticionApi('/api/exploradores/perfil/', {
        method: 'PATCH',
        body: bodyData
      });

      setModalConfigurarVehiculoAbierto(false);
      const userFinal = usuarioActualizado || usuarioPendienteVehiculo;
      if (typeof establecerUsuario === 'function') {
        establecerUsuario(userFinal);
      }
      if (typeof cargarPerfil === 'function') {
        cargarPerfil();
      }
      window.history.pushState({ vista: 'diario' }, '', '/diario');
      setVistaActiva('diario');
    } catch (err) {
      console.error('Error al guardar datos del vehículo:', err);
      alert('Error al guardar datos: ' + (err.message || 'Comprueba los campos e inténtalo de nuevo.'));
    } finally {
      setGuardandoVehiculo(false);
    }
  };

  const manejarOmitirVehiculo = () => {
    setModalConfigurarVehiculoAbierto(false);
    if (typeof establecerUsuario === 'function' && usuarioPendienteVehiculo) {
      establecerUsuario(usuarioPendienteVehiculo);
    }
    if (typeof cargarPerfil === 'function') {
      cargarPerfil();
    }
    setVistaActiva('diario');
  };

  const manejarReenviarCodigo = async () => {
    setErrorVerificacion('');
    setMensajeVerificacion('');
    try {
      const res = await reenviarCodigo(emailVerificacion);
      setMensajeVerificacion(res.mensaje || 'Nuevo código enviado.');
      if (res.codigo_dev) setCodigoDev(res.codigo_dev);
    } catch (err) {
      setErrorVerificacion(err.message || 'Error al reenviar el código.');
    }
  };

  const manejarLogin = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setCargandoAuth(true);
    const userMinusculas = loginUsername.replace(/\s+/g, '').toLowerCase();
    const passLimpio = loginPassword.replace(/\s+/g, '');

    try {
      if (recordarUsuario) {
        localStorage.setItem('camplink_saved_username', userMinusculas);
      } else {
        localStorage.removeItem('camplink_saved_username');
      }

      await login(userMinusculas, passLimpio);
      setVistaActiva('diario');
    } catch (err) {
      if (err.data && err.data.requiere_verificacion) {
        setEmailVerificacion(err.data.email || userMinusculas);
        if (err.data.codigo_dev) setCodigoDev(err.data.codigo_dev);
        setModalVerificacionAbierto(true);
        setErrorVerificacion(err.message || 'Debes verificar tu código de 6 dígitos antes de entrar.');
      } else {
        setAuthError(err.message || 'Error en las credenciales.');
      }
    } finally {
      setCargandoAuth(false);
    }
  };

  const manejarRecuperarPassword = async (e) => {
    e.preventDefault();
    if (!recuperarInput.trim()) return;
    setErrorRecuperacion('');
    setMensajeRecuperacion('');
    setCargandoRecuperacion(true);

    try {
      if (recuperarPassword) {
        const res = await recuperarPassword(recuperarInput.trim().toLowerCase());
        setMensajeRecuperacion(res.mensaje || 'Instrucciones enviadas con éxito.');
      } else {
        setMensajeRecuperacion('Si el usuario o correo existe en camplinkapp.com, recibirás un enlace de restablecimiento.');
      }
    } catch (err) {
      setErrorRecuperacion(err.message || 'No se pudo procesar la solicitud.');
    } finally {
      setCargandoRecuperacion(false);
    }
  };

  const manejarRegistro = async (e) => {
    e.preventDefault();
    setAuthError(null);

    if (regData.password !== regData.password_confirm) {
      setAuthError('Las contraseñas no coinciden.');
      return;
    }

    setCargandoAuth(true);
    try {
      const res = await registro({
        username: regData.username.trim().toLowerCase(),
        email: regData.email.trim().toLowerCase(),
        password: regData.password,
        password_confirm: regData.password_confirm
      });
      if (res && res.requiere_verificacion) {
        setEmailVerificacion(res.email || regData.email);
        setCodigoDev(res.codigo_dev || '');
        setModalVerificacionAbierto(true);
      } else {
        setVistaActiva('diario');
      }
    } catch (err) {
      setAuthError(err.message || 'Error al completar el registro.');
    } finally {
      setCargandoAuth(false);
    }
  };

  return (
    <div className="landing-container" style={{ width: '100%', overflowX: 'hidden' }}>
      
      {/* 1. HERO SECTION CON LOGO ISOTIPO CENTRADO */}
      <section style={{
        padding: '60px 20px 70px',
        background: 'radial-gradient(circle at 50% 15%, rgba(35, 83, 52, 0.22) 0%, rgba(13, 20, 16, 0.02) 75%)',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="camplink-container" style={{ maxWidth: '880px', margin: '0 auto' }}>
          
          {/* LOGO ISOTIPO OFICIAL EN EL CENTRO */}
          <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'center' }}>
            <img loading="lazy" decoding="async" 
              src="/camplink-logo.png" 
              alt="Camplink - Conectando Comunidad al Aire Libre" 
              className="landing-hero-logo"
            />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 18px',
            borderRadius: '999px',
            background: 'rgba(35, 83, 52, 0.15)',
            border: '1px solid rgba(54, 121, 77, 0.35)',
            color: 'var(--accent-forest)',
            fontWeight: 800,
            fontSize: '0.86rem',
            marginBottom: '18px',
            letterSpacing: '0.5px'
          }}>
            <Sparkles size={16} /> RED SOCIAL & PLATAFORMA INTEGRAL CAMPER
          </div>

          <h1 style={{
            fontSize: 'clamp(2.1rem, 5vw, 3.4rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-1px',
            margin: '0 auto 18px',
            color: 'var(--text-primary)'
          }}>
            Tu Hogar sobre Ruedas, <br />
            <span style={{ color: 'var(--accent-forest)' }}>Conectado al Aire Libre</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '680px',
            margin: '0 auto 32px'
          }}>
            Descubre lugares de pernocta verificados, planifica tus viajes con cálculo de combustible inteligente,
            comparte tu diario de ruta y conecta con una auténtica comunidad camper al aire libre.
          </p>

          {/* BOTONES DE ACCIÓN RÁPIDA */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '36px' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                const el = document.getElementById('seccion-auth');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                setModoAuth('registro');
              }}
              style={{ padding: '14px 28px', fontSize: '1rem', fontWeight: 800, boxShadow: '0 8px 24px rgba(35, 83, 52, 0.35)' }}
            >
              Unirme Gratis a la Comunidad <ArrowRight size={18} />
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => setVistaActiva('descubre')}
              style={{ padding: '14px 24px', fontSize: '0.98rem', fontWeight: 700 }}
            >
              <Map size={18} /> Explorar Mapa de Pernoctas
            </button>
          </div>

          {/* BADGES DESTACADOS */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            color: 'var(--text-muted)',
            fontSize: '0.86rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={16} color="var(--accent-forest)" /> 100% Gratuito y Libre
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={16} color="var(--accent-forest)" /> Pernoctas Offline
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={16} color="var(--accent-forest)" /> Cálculo de Combustible
            </div>
          </div>
        </div>
      </section>

      {/* 2. TODO LO QUE NECESITAS PARA TU AVENTURA (6 TARJETAS EQUITATIVAS EN GRID 3x2) */}
      <section style={{ padding: '60px 20px 70px' }}>
        <div className="camplink-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Todo lo que Necesitas para tu Aventura
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '640px', margin: '0 auto' }}>
              Una suite integral diseñada exclusivamente para amantes de las furgonetas camper, autocaravanas y la acampada libre.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {/* TARJETA 1: DESCUBRE & PERNOCTA */}
            <div className="camper-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(35, 83, 52, 0.15)',
                color: 'var(--accent-forest)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem'
              }}>
                🗺️
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Descubre & Pernocta
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, margin: 0 }}>
                Mapa interactivo con capas de relieve topográfico, satélite en alta resolución, radar de lluvia y mapa de contaminación lumínica para disfrutar de las estrellas.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-forest)' }}>
                <span>Servicios camper verificados</span> <ChevronRight size={14} />
              </div>
            </div>

            {/* TARJETA 2: DIARIO DE RUTA SOCIAL */}
            <div className="camper-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(217, 119, 6, 0.15)',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem'
              }}>
                🧭
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Diario de Ruta Social
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, margin: 0 }}>
                Comparte tus vivencias, fotografías en proporción 16:9 y alertas en carretera en tiempo real. Interactúa con 'Buena ruta' y 'Alerta', y descubre otros viajeros.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#D97706' }}>
                <span>Comunidad nómada en vivo</span> <ChevronRight size={14} />
              </div>
            </div>

            {/* TARJETA 3: PLANIFICADOR & AUTONOMÍA */}
            <div className="camper-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--accent-lake)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem'
              }}>
                ⛽
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Planificador & Autonomía
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, margin: 0 }}>
                Organiza tus etapas sumando distancias kilométricas reales y recibe avisos preventivos cuando un tramo supere el 80% de tu autonomía para repostar a tiempo.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-lake)' }}>
                <span>Alertas antes de reserva</span> <ChevronRight size={14} />
              </div>
            </div>

            {/* TARJETA 4: TALLER NÓMADA 3D */}
            <div className="camper-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#A855F7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem'
              }}>
                🛠️
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Taller Nómada 3D
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, margin: 0 }}>
                Visualizador interactivo 3D con capas de aislamiento térmico, instalación eléctrica solar 12V/230V, fontanería y guías paso a paso de homologación e ITV.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#A855F7' }}>
                <span>Aprende a camperizar</span> <ChevronRight size={14} />
              </div>
            </div>

            {/* TARJETA 5: RADAR NÓMADA & CLIMA */}
            <div className="camper-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem'
              }}>
                📡
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Radar Nómada & Clima
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, margin: 0 }}>
                Localiza gasolineras, áreas de pernocta y compañeros de ruta a menos de 50 km con datos meteorológicos y alertas de viento o nieve en tiempo real.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#F59E0B' }}>
                <span>Radio de 50 km</span> <ChevronRight size={14} />
              </div>
            </div>

            {/* TARJETA 6: VITRINA DE TROFEOS & OFFLINE */}
            <div className="camper-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(234, 88, 12, 0.15)',
                color: 'var(--accent-sunset)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem'
              }}>
                🏆
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Vitrina de Trofeos & Offline
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, margin: 0 }}>
                Desbloquea 16 medallas camper y el trofeo Platino mientras viajas, y guarda tus pernoctas para consultarlas sin cobertura en plena montaña.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-sunset)' }}>
                <span>Logros y modo offline</span> <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FORMULARIOS DE LOGIN / REGISTRO INTEGRADOS */}
      <section id="seccion-auth" style={{ padding: '60px 20px 80px', background: 'radial-gradient(circle at 50% 0%, rgba(35, 83, 52, 0.12) 0%, transparent 60%)' }}>
        <div className="camplink-container" style={{ maxWidth: '520px', margin: '0 auto' }}>
          
          <div className="camper-card" style={{ padding: '32px 24px', boxShadow: '0 16px 40px rgba(0,0,0,0.3)' }}>
            
            {/* CABECERA FORMULARIO */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <img loading="lazy" decoding="async" 
                src="/camplink-logo.png" 
                alt="Camplink" 
                style={{ width: '64px', height: '64px', borderRadius: '50%', marginBottom: '12px' }} 
              />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                {modoAuth === 'login' ? 'Iniciar Sesión en Camplink' : 'Crear Cuenta de Explorador'}
              </h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
                {modoAuth === 'login' ? 'Accede a tu diario, rutas y lugares guardados' : 'Únete a miles de nómadas y comparte tus aventuras'}
              </p>
            </div>

            {/* SELECTOR LOGIN / REGISTRO / RECUPERAR */}
            {modoAuth !== 'recuperar' ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                background: 'var(--bg-glass)',
                padding: '4px',
                borderRadius: 'var(--radius-full)',
                marginBottom: '20px',
                border: '1px solid var(--border-color)'
              }}>
                <button
                  type="button"
                  className={`btn btn-sm ${modoAuth === 'login' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setModoAuth('login'); setAuthError(null); }}
                  style={{ borderRadius: 'var(--radius-full)', border: 'none' }}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${modoAuth === 'registro' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setModoAuth('registro'); setAuthError(null); }}
                  style={{ borderRadius: 'var(--radius-full)', border: 'none' }}
                >
                  Registrarme
                </button>
              </div>
            ) : (
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setModoAuth('login'); setErrorRecuperacion(''); setMensajeRecuperacion(''); }}
                  style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                >
                  ← Volver a Iniciar Sesión
                </button>
              </div>
            )}

            {/* MENSAJE DE ERROR LOGIN/REGISTRO */}
            {authError && modoAuth !== 'recuperar' && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid #EF4444',
                color: '#EF4444',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                marginBottom: '16px',
                fontWeight: 600
              }}>
                ⚠️ {authError}
              </div>
            )}

            {/* 1. FORMULARIO LOGIN */}
            {modoAuth === 'login' && (
              <form onSubmit={manejarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Usuario o Email</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tu nombre de usuario o email"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(formatearInputUsuario(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Contraseña</label>
                    <button
                      type="button"
                      onClick={() => {
                        setModoAuth('recuperar');
                        setRecuperarInput(loginUsername);
                        setMensajeRecuperacion('');
                        setErrorRecuperacion('');
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-forest)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={mostrarLoginPassword ? 'text' : 'password'}
                      className="form-control"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value.replace(/\s+/g, ''))}
                      style={{ paddingRight: '42px' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarLoginPassword(!mostrarLoginPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px'
                      }}
                      title={mostrarLoginPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {mostrarLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* RECORDAR USUARIO */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0 4px' }}>
                  <input
                    type="checkbox"
                    id="chk-recordar"
                    checked={recordarUsuario}
                    onChange={(e) => setRecordarUsuario(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="chk-recordar" style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', cursor: 'pointer', margin: 0 }}>
                    Recordar mi usuario en este navegador
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', height: '44px', fontWeight: 800, marginTop: '6px' }}
                  disabled={cargandoAuth}
                >
                  {cargandoAuth ? 'Verificando...' : 'Entrar a Camplink 🚐'}
                </button>
              </form>
            )}

            {/* 2. FORMULARIO RECUPERAR CONTRASEÑA */}
            {modoAuth === 'recuperar' && (
              <div>
                <div style={{ textAlign: 'left', marginBottom: '16px' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Recuperación de Acceso
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Ingresa tu usuario o correo registrado en <strong>camplinkapp.com</strong> para restablecer tus credenciales.
                  </p>
                </div>

                {errorRecuperacion && (
                  <div style={{ padding: '10px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#EF4444', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: 600, marginBottom: '14px' }}>
                    ⚠️ {errorRecuperacion}
                  </div>
                )}

                {mensajeRecuperacion ? (
                  <div style={{ padding: '16px', background: 'rgba(35, 83, 52, 0.18)', border: '1.5px solid var(--accent-forest)', color: 'var(--accent-forest)', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.88rem', textAlign: 'center', lineHeight: 1.5 }}>
                    ✅ {mensajeRecuperacion}
                    <div style={{ marginTop: '12px' }}>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setModoAuth('login')}>
                        Volver a Iniciar Sesión
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={manejarRecuperarPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Nombre de Usuario o Email</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: rutero_norte o tu@email.com"
                        value={recuperarInput}
                        onChange={(e) => setRecuperarInput(e.target.value.toLowerCase())}
                        required
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: '100%', height: '44px', fontWeight: 800 }}
                      disabled={cargandoRecuperacion}
                    >
                      {cargandoRecuperacion ? 'Buscando cuenta...' : 'Enviar Instrucciones 📧'}
                    </button>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
                      ¿Dudas? Escríbenos a <a href="mailto:hola@camplinkapp.com" style={{ color: 'var(--accent-forest)', fontWeight: 700 }}>hola@camplinkapp.com</a>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* 3. FORMULARIO REGISTRO INICIAL (CREDENCIALES) */}
            {modoAuth === 'registro' && (
              <form onSubmit={manejarRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  fontSize: '0.80rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginBottom: '4px',
                  fontWeight: 600
                }}>
                  <strong style={{ color: '#EF4444', fontSize: '1rem', lineHeight: 1 }}>*</strong>
                  <span>: obligatorio</span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Nombre de Usuario</span>
                    <strong style={{ color: '#EF4444' }}>*</strong>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Rutero_norte"
                    value={regData.username}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\s+/g, '');
                      const formatted = val ? val.charAt(0).toUpperCase() + val.slice(1) : '';
                      setRegData({ ...regData, username: formatted });
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Correo Electrónico</span>
                    <strong style={{ color: '#EF4444' }}>*</strong>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="tu@email.com"
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value.replace(/\s+/g, '').toLowerCase() })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Contraseña</span>
                      <strong style={{ color: '#EF4444' }}>*</strong>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={mostrarRegPassword ? 'text' : 'password'}
                        className="form-control"
                        value={regData.password}
                        onChange={(e) => setRegData({ ...regData, password: e.target.value.replace(/\s+/g, '') })}
                        style={{ paddingRight: '36px' }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarRegPassword(!mostrarRegPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px'
                        }}
                        title={mostrarRegPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {mostrarRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Confirmar</span>
                      <strong style={{ color: '#EF4444' }}>*</strong>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={mostrarRegConfirmPassword ? 'text' : 'password'}
                        className="form-control"
                        value={regData.password_confirm}
                        onChange={(e) => setRegData({ ...regData, password_confirm: e.target.value.replace(/\s+/g, '') })}
                        style={{ paddingRight: '36px' }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarRegConfirmPassword(!mostrarRegConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px'
                        }}
                        title={mostrarRegConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {mostrarRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', height: '44px', fontWeight: 800, marginTop: '8px' }}
                  disabled={cargandoAuth}
                >
                  {cargandoAuth ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
      {/* MODAL DE RECUPERACIÓN DE CONTRASEÑA / USUARIO */}
      {modalRecuperarAbierto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div className="camper-card" style={{ maxWidth: '440px', width: '100%', padding: '26px', border: '2px solid var(--accent-forest)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} color="var(--accent-forest)" />
                <span>Recuperar Acceso</span>
              </h3>
              <button className="btn-icon" onClick={() => setModalRecuperarAbierto(false)} style={{ width: '30px', height: '30px' }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px' }}>
              Ingresa tu nombre de usuario o correo electrónico registrado en <strong>camplinkapp.com</strong> para restablecer tu contraseña.
            </p>

            {mensajeRecuperacion ? (
              <div style={{ padding: '14px', background: 'rgba(35, 83, 52, 0.18)', border: '1px solid var(--accent-forest)', color: 'var(--accent-forest)', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.86rem', textAlign: 'center', marginBottom: '16px' }}>
                {mensajeRecuperacion}
              </div>
            ) : (
              <form onSubmit={manejarRecuperarPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {errorRecuperacion && (
                  <div style={{ padding: '10px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#EF4444', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: 600 }}>
                    ⚠️ {errorRecuperacion}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Nombre de Usuario o Email</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: rutero_norte o tu@email.com"
                    value={recuperarInput}
                    onChange={(e) => setRecuperarInput(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setModalRecuperarAbierto(false)}>
                    Cerrar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={cargandoRecuperacion}>
                    {cargandoRecuperacion ? 'Buscando...' : 'Enviar Instrucciones 📧'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}


      {/* MODAL DE VERIFICACIÓN DE CUENTA POR CORREO */}
      {modalVerificacionAbierto && (
        <div className="modal-overlay">
          <div className="camper-card" style={{ maxWidth: '460px', width: '100%', padding: '30px', border: '2px solid var(--accent-forest)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(35,83,52,0.15)', color: 'var(--accent-forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
              📩
            </div>
            
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 10px', color: 'var(--text-primary)' }}>
              Confirma tu Correo
            </h2>
            
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 20px' }}>
              Hemos enviado un enlace y un código de 6 dígitos a:
              <br />
              <strong style={{ color: 'var(--text-primary)' }}>{emailVerificacion}</strong>
            </p>

            {codigoDev && (
              <div style={{ background: 'rgba(245,158,11,0.15)', border: '1px dashed #F59E0B', color: '#D97706', padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', marginBottom: '16px' }}>
                🔑 Código de prueba (modo local): <strong>{codigoDev}</strong>
              </div>
            )}

            {errorVerificacion && (
              <div style={{ color: 'var(--accent-danger)', background: 'rgba(217,56,56,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.84rem' }}>
                {errorVerificacion}
              </div>
            )}

            {mensajeVerificacion && (
              <div style={{ color: 'var(--accent-success)', background: 'rgba(46,139,87,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.84rem' }}>
                {mensajeVerificacion}
              </div>
            )}

            <form onSubmit={manejarVerificarCodigo}>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ textAlign: 'center', display: 'block', fontSize: '0.80rem' }}>
                  Introduce el Código de 6 Dígitos
                </label>
                <input
                  type="text"
                  className="form-control"
                  maxLength={6}
                  placeholder="Ej: 123456"
                  value={codigoVerificacionInput}
                  onChange={(e) => setCodigoVerificacionInput(e.target.value.replace(/\D/g, ''))}
                  style={{
                    fontSize: '1.5rem',
                    letterSpacing: '8px',
                    textAlign: 'center',
                    fontWeight: 900,
                    height: '52px',
                    background: 'var(--bg-surface)'
                  }}
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', height: '46px', fontWeight: 800 }}
                  disabled={cargandoVerificacion || codigoVerificacionInput.length < 6}
                >
                  {cargandoVerificacion ? 'Verificando...' : 'Verificar y Entrar 🚐'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.82rem' }}>
                  <button
                    type="button"
                    onClick={manejarReenviarCodigo}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-forest)', cursor: 'pointer', fontWeight: 700, padding: 0 }}
                  >
                    ¿No te llegó? Reenviar
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalVerificacionAbierto(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    Volver
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    
      {/* MODAL CONFIGURACIÓN DE VEHÍCULO Y PUNTO DE PARTIDA TRAS CONFIRMAR CORREO */}
      {modalConfigurarVehiculoAbierto && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content camper-card" style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', border: '1.5px solid var(--accent-forest)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '6px' }}>🎉</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ¡Bienvenido a Camplink{usuarioPendienteVehiculo?.username || regData?.username ? `, ${((usuarioPendienteVehiculo?.username || regData?.username).charAt(0).toUpperCase() + (usuarioPendienteVehiculo?.username || regData?.username).slice(1))}` : ''}!
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Configura ahora los datos de tu vehículo y punto de partida para calcular consumos, autonomías e itinerarios precisos en Camplink.
              </p>
            </div>

            <form onSubmit={manejarGuardarVehiculo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* SUBIDA DE FOTO DE PERFIL / AVATAR */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px' }}>
                <div 
                  onClick={() => fileInputAvatarRef.current && fileInputAvatarRef.current.click()}
                  style={{
                    width: '82px',
                    height: '82px',
                    borderRadius: '50%',
                    background: 'var(--bg-surface-elevated)',
                    border: '2px dashed var(--accent-forest)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                  }}
                  title="Subir foto de perfil"
                >
                  {previewAvatar ? (
                    <img src={previewAvatar} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Camera size={26} color="var(--accent-forest)" />
                      <span style={{ display: 'block', fontSize: '0.64rem', marginTop: '2px', fontWeight: 600 }}>Foto</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputAvatarRef} 
                  onChange={manejarSeleccionarAvatar} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
                <button
                  type="button"
                  onClick={() => fileInputAvatarRef.current && fileInputAvatarRef.current.click()}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-forest)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    marginTop: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {previewAvatar ? '✓ Cambiar foto de perfil' : '📷 Añadir foto de perfil (opcional)'}
                </button>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tipo de Vehículo / Viajero <strong style={{ color: '#EF4444' }}>*</strong></span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--accent-forest)', fontWeight: 600 }}>Obligatorio</span>
                </label>
                <select
                  className="form-control"
                  required
                  value={tipoViajeroModal}
                  onChange={(e) => setTipoViajeroModal(e.target.value)}
                >
                  <option value="camper">🚐 Furgoneta Camper</option>
                  <option value="autocaravana">🚍 Autocaravana</option>
                  <option value="acampada">⛺ Tienda / Acampada</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Combustible del Vehículo</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>(Opcional)</span>
                </label>
                <select
                  className="form-control"
                  value={tipoCombustibleModal}
                  onChange={(e) => setTipoCombustibleModal(e.target.value)}
                >
                  <option value="gasoleo_a">⛽ Diésel / Gasóleo A</option>
                  <option value="gasolina_95">⛽ Gasolina 95 E5</option>
                  <option value="gasolina_98">⛽ Gasolina 98 E5</option>
                  <option value="glp">⛽ GLP / Autogás</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Capacidad Depósito</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-forest)', fontWeight: 600 }}>50L por defecto</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="50 L"
                      min="10"
                      max="300"
                      value={capacidadModal}
                      onChange={(e) => setCapacidadModal(e.target.value)}
                      style={{ paddingRight: '36px' }}
                    />
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                      L
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Consumo Medio</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-forest)', fontWeight: 600 }}>7.0L por defecto</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      placeholder="7.0 L/100"
                      min="2"
                      max="30"
                      value={consumoModal}
                      onChange={(e) => setConsumoModal(e.target.value)}
                      style={{ paddingRight: '48px' }}
                    />
                    <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.72rem', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                      L/100
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Código Postal <strong style={{ color: '#EF4444' }}>*</strong></span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-forest)', fontWeight: 600 }}>Obligatorio</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="Ej: 39001"
                    maxLength={5}
                    value={codigoPostalModal}
                    onChange={(e) => manejarCambioCodigoPostal(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Población / Ciudad</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-forest)', fontWeight: 600 }}>
                      {buscandoCp ? '• Buscando...' : poblacionModal ? '✓ Autocompletada' : 'Auto con CP'}
                    </span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Se autocompleta con el CP (ej: Santander)"
                    value={poblacionModal}
                    onChange={(e) => setPoblacionModal(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Dirección Base (Punto de partida)</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{buscandoDireccion ? 'Buscando...' : '(Opcional)'}</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Escribe calle, barrio o punto de partida..."
                  value={direccionModal}
                  onChange={(e) => manejarCambioDireccion(e.target.value)}
                  onFocus={() => {
                    if (sugerenciasDireccion.length > 0) setMostrarSugerencias(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setMostrarSugerencias(false), 250);
                  }}
                  autoComplete="off"
                />

                {mostrarSugerencias && sugerenciasDireccion.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1500,
                    background: 'var(--bg-surface-elevated)',
                    border: '1.5px solid var(--accent-forest)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(20px)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    marginTop: '4px'
                  }}>
                    {sugerenciasDireccion.map((sug, idx) => (
                      <div
                        key={idx}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          seleccionarSugerencia(sug);
                        }}
                        onClick={() => seleccionarSugerencia(sug)}
                        style={{
                          padding: '10px 14px',
                          borderBottom: idx < sugerenciasDireccion.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          color: 'var(--text-primary)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(35,83,52,0.12)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        📍 {sug.etiqueta}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BIOGRAFÍA CAMPER */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Biografía Camper</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(Opcional)</span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Breve descripción, ej: Amante de las escapadas de fin de semana en furgo, la escalada, la naturaleza y pernoctar bajo las estrellas..."
                  value={biografiaModal}
                  onChange={(e) => setBiografiaModal(e.target.value)}
                  style={{ resize: 'vertical', fontSize: '0.86rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={manejarOmitirVehiculo}
                  style={{ padding: '10px 18px' }}
                >
                  Omitir por ahora
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, fontWeight: 800 }}
                  disabled={guardandoVehiculo}
                >
                  {guardandoVehiculo ? 'Guardando...' : 'Guardar y Empezar a Explorar 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
</div>
  );
}
