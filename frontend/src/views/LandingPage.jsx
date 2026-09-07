// Aquí implemento la Landing Page de Camplink con el isotipo oficial centrado,
// 6 pilares nómadas equitativos en grid 3x2, y formularios de login/registro rápido.

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { 
  Compass, Map, Shield, Wrench, Sparkles, CheckCircle, 
  ArrowRight, UserCheck, Fuel, Calendar, Moon, Radio, 
  Droplets, Zap, Heart, MessageSquare, Star, Navigation,
  HelpCircle, ChevronRight, Lock, User, Eye, Award
} from 'lucide-react';

export default function LandingPage({ setVistaActiva, abrirNuevoLugar }) {
  const { usuario, login, registro, recuperarPassword } = useAuth();
  const { t } = useTranslation();

  const [modoAuth, setModoAuth] = useState('login'); // 'login' o 'registro'
  const [pasoRegistro, setPasoRegistro] = useState(1);

  // Formulario Login
  const [loginUsername, setLoginUsername] = useState(() => localStorage.getItem('camplink_saved_username') || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [recordarUsuario, setRecordarUsuario] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(false);

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
    biografia: '',
  });
  const [fotoVehiculo, setFotoVehiculo] = useState(null);

  const manejarLogin = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setCargandoAuth(true);
    const userMinusculas = loginUsername.trim().toLowerCase();

    try {
      if (recordarUsuario) {
        localStorage.setItem('camplink_saved_username', userMinusculas);
      } else {
        localStorage.removeItem('camplink_saved_username');
      }

      await login(userMinusculas, loginPassword);
      setVistaActiva('diario');
    } catch (err) {
      setAuthError(err.message || 'Error en las credenciales.');
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
      const formData = new FormData();
      Object.keys(regData).forEach((k) => {
        if (regData[k]) formData.append(k, regData[k]);
      });
      if (fotoVehiculo) formData.append('foto_vehiculo', fotoVehiculo);

      await registro(formData);
      setVistaActiva('diario');
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
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            <img 
              src="/camplink-logo.png" 
              alt="Camplink - Conectando Comunidad al Aire Libre" 
              style={{
                width: '130px',
                height: '130px',
                objectFit: 'contain',
                borderRadius: '50%',
                boxShadow: '0 12px 35px rgba(35, 83, 52, 0.45)',
                border: '3px solid rgba(255, 255, 255, 0.15)',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06) rotate(3deg)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
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
            comparte tu diario de ruta y domina la camperización con nuestro taller interactivo en 3D.
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
              <img 
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
                    onChange={(e) => setLoginUsername(e.target.value.toLowerCase())}
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
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
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
                      ¿Dudas? Escríbenos a <a href="mailto:Camplink.app.info@gmail.com" style={{ color: 'var(--accent-forest)', fontWeight: 700 }}>Camplink.app.info@gmail.com</a>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* 3. FORMULARIO REGISTRO POR PASOS */}
            {modoAuth === 'registro' && (
              /* FORMULARIO REGISTRO POR PASOS */
              <form onSubmit={manejarRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {pasoRegistro === 1 ? (
                  <>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 700 }}>
                      Paso 1 de 2: Credenciales de Acceso
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nombre de Usuario *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: rutero_norte"
                        value={regData.username}
                        onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Correo Electrónico *</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="tu@email.com"
                        value={regData.email}
                        onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label className="form-label">Contraseña *</label>
                        <input
                          type="password"
                          className="form-control"
                          value={regData.password}
                          onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Confirmar *</label>
                        <input
                          type="password"
                          className="form-control"
                          value={regData.password_confirm}
                          onChange={(e) => setRegData({ ...regData, password_confirm: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%', height: '44px', fontWeight: 800, marginTop: '8px' }}
                      onClick={() => {
                        if (!regData.username || !regData.email || !regData.password) {
                          setAuthError('Por favor completa usuario, correo y contraseña.');
                          return;
                        }
                        setAuthError(null);
                        setPasoRegistro(2);
                      }}
                    >
                      Continuar: Datos de tu Vehículo <ArrowRight size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 700 }}>
                      Paso 2 de 2: Vehículo y Punto de Partida
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tipo de Viajero Nómada</label>
                      <select
                        className="form-control"
                        value={regData.tipo_viajero}
                        onChange={(e) => setRegData({ ...regData, tipo_viajero: e.target.value })}
                      >
                        <option value="camper">Furgoneta Camper</option>
                        <option value="autocaravana">Autocaravana</option>
                        <option value="acampada">Tienda / Acampada</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label className="form-label">Población / Ciudad</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ej: Santander"
                          value={regData.poblacion}
                          onChange={(e) => setRegData({ ...regData, poblacion: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Código Postal</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ej: 39001"
                          value={regData.codigo_postal}
                          onChange={(e) => setRegData({ ...regData, codigo_postal: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Dirección Base (Para cálculo de etapas)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: Calle Alta 12"
                        value={regData.direccion_base}
                        onChange={(e) => setRegData({ ...regData, direccion_base: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setPasoRegistro(1)}
                      >
                        Atrás
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ flex: 1, fontWeight: 800 }}
                        disabled={cargandoAuth}
                      >
                        {cargandoAuth ? 'Creando cuenta...' : 'Finalizar y Entrar 🚐'}
                      </button>
                    </div>
                  </>
                )}
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
    </div>
  );
}
