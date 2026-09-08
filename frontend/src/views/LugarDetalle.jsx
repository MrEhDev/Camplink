import { comprimirFotoOpinion } from '../utils/imageCompressor';
const formatearUsuario = (u) => {
  if (!u) return '';
  const s = String(u);
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};
// Aquí implemento la vista detallada de un Lugar de pernocta con estética Glassmorphism,
// botón directo de navegación GPS 'Cómo llegar', exportación dual a Google Calendar y Apple Calendar (.ics),
// imagen principal destacada con presets por tipo de lugar, descripción en el Hero banner,
// edición completa para administradores, edición colaborativa de equipamiento para cualquier explorador,
// eliminación de notas personales y widget de clima interactivo.

import React, { useState, useEffect } from 'react';
import { peticionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CamperIconRating from '../components/CamperIconRating';
import WidgetClima from '../components/WidgetClima';
import { 
  ArrowLeft, MapPin, Calendar, CheckCircle2, 
  Send, Sparkles, AlertCircle, Share2, Compass, 
  Lock, Eye, HardDriveDownload, Check, Fuel, 
  AlertTriangle, Navigation, CalendarPlus, Route, X, Plus, Radar,
  Edit3, Image, Camera, Trash2, UploadCloud, Users, BookOpen
} from 'lucide-react';
import { obtenerImagenLugar, tieneImagenPropia, ETIQUETAS_TIPO_LUGAR, IMAGENES_PREESTABLECIDAS_POR_TIPO } from '../utils/lugarImagenes';

const TIPOS_LUGAR_OPCIONES = [
  { valor: 'pernocta_libre', emoji: '🌲', label: 'Pernocta Libre (Naturaleza)' },
  { valor: 'area_autocaravanas', emoji: '🚐', label: 'Área de Autocaravanas' },
  { valor: 'camping', emoji: '⛺', label: 'Camping' },
  { valor: 'parking_urbano', emoji: '🅿️', label: 'Parking Urbano / Mixto' },
  { valor: 'area_recreativa', emoji: '🏞️', label: 'Área Recreativa / Merendero' },
  { valor: 'solo_servicios', emoji: '💧', label: 'Solo Servicios' },
];

export default function LugarDetalle({ lugarId, alVolver, alHacerCheckin, abrirRadar }) {
  // Datos del lugar, check-ins y estados de conexión
  const [lugar, setLugar] = useState(null);
  const [misCheckinsLugar, setMisCheckinsLugar] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [guardadoOffline, setGuardadoOffline] = useState(false);
  const [guardadoParaIr, setGuardadoParaIr] = useState(false);

  // Foto activa para visualización en el Hero
  const [fotoHeroActiva, setFotoHeroActiva] = useState(null);

  // Notas personales exclusivas del explorador (múltiples con fecha, hora y borrado)
  const [notasPersonales, setNotasPersonales] = useState([]);
  const [nuevaNota, setNuevaNota] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [mensajeNota, setMensajeNota] = useState('');

  const { usuario } = useAuth();
  const [puntuacionNueva, setPuntuacionNueva] = useState(5);
  const [comentarioNuevo, setComentarioNuevo] = useState('');
  const [fotoOpinion, setFotoOpinion] = useState(null);
  const [previewFotoOpinion, setPreviewFotoOpinion] = useState(null);

  const manejarFotoOpinion = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    try {
      const archivoComprimido = await comprimirFotoOpinion(archivo);
      setFotoOpinion(archivoComprimido);
      if (previewFotoOpinion) {
        URL.revokeObjectURL(previewFotoOpinion);
      }
      setPreviewFotoOpinion(URL.createObjectURL(archivoComprimido));
    } catch (err) {
      console.error('Error al procesar foto para opinión:', err);
      setFotoOpinion(archivo);
      setPreviewFotoOpinion(URL.createObjectURL(archivo));
    }
  };

  const eliminarFotoOpinion = () => {
    if (previewFotoOpinion) {
      URL.revokeObjectURL(previewFotoOpinion);
    }
    setFotoOpinion(null);
    setPreviewFotoOpinion(null);
  };
  const [publicacionesDiario, setPublicacionesDiario] = useState([]);
  const [cargandoDiario, setCargandoDiario] = useState(false);
  const [fotoAmpliadaModal, setFotoAmpliadaModal] = useState(null);
  // Estados y funciones para editar y eliminar opiniones/valoraciones
  const [editandoValId, setEditandoValId] = useState(null);
  const [textoEditandoVal, setTextoEditandoVal] = useState('');
  const [puntuacionEditandoVal, setPuntuacionEditandoVal] = useState(5);
  const [guardandoEdicionVal, setGuardandoEdicionVal] = useState(false);

  const iniciarEdicionValoracion = (val) => {
    setEditandoValId(val.id);
    setTextoEditandoVal(val.comentario || '');
    setPuntuacionEditandoVal(val.puntuacion_camper || 5);
  };

  const cancelarEdicionValoracion = () => {
    setEditandoValId(null);
    setTextoEditandoVal('');
  };

  const guardarEdicionValoracion = async (valId) => {
    if (!textoEditandoVal.trim()) return;
    setGuardandoEdicionVal(true);
    try {
      await peticionApi(`/api/lugares/valoraciones/${valId}/`, {
        method: 'PATCH',
        body: {
          comentario: textoEditandoVal.trim(),
          puntuacion_camper: puntuacionEditandoVal
        }
      });
      setEditandoValId(null);
      setLugar(prev => {
        if (!prev) return prev;
        const nuevas = (prev.valoraciones || []).map(v => v.id === valId ? { ...v, comentario: textoEditandoVal.trim(), puntuacion_camper: puntuacionEditandoVal } : v);
        return { ...prev, valoraciones: nuevas };
      });
      await cargarDetalle();
    } catch (err) {
      alert(err.message || 'Error al actualizar la opinión.');
    } finally {
      setGuardandoEdicionVal(false);
    }
  };

  const eliminarValoracion = async (valId) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta opinión?')) return;
    try {
      setLugar(prev => {
        if (!prev) return prev;
        const nuevas = (prev.valoraciones || []).filter(v => v.id !== valId);
        return { ...prev, valoraciones: nuevas };
      });
      await peticionApi(`/api/lugares/valoraciones/${valId}/`, {
        method: 'DELETE'
      });
      await cargarDetalle();
    } catch (err) {
      alert(err.message || 'Error al eliminar la opinión.');
    }
  };

  const [enviandoValoracion, setEnviandoValoracion] = useState(false);

  // Estado para Modal de Edición Completa (Admin / Creador)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editTipoLugar, setEditTipoLugar] = useState('pernocta_libre');
  const [editLatitud, setEditLatitud] = useState('');
  const [editLongitud, setEditLongitud] = useState('');
  const [editPoblacion, setEditPoblacion] = useState('');
  const [editProvincia, setEditProvincia] = useState('');
  const [editPrecio, setEditPrecio] = useState('0');
  const [editEsGratuito, setEditEsGratuito] = useState(true);
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editFotoArchivo, setEditFotoArchivo] = useState(null);
  const [editFotoPreview, setEditFotoPreview] = useState(null);
  // Servicios editables admin
  const [editTieneAgua, setEditTieneAgua] = useState(false);
  const [editTieneLavabo, setEditTieneLavabo] = useState(false);
  const [editTieneElectricidad, setEditTieneElectricidad] = useState(false);
  const [editTieneWifi, setEditTieneWifi] = useState(false);
  const [editTieneBasuras, setEditTieneBasuras] = useState(false);
  const [editTieneDuchas, setEditTieneDuchas] = useState(false);
  const [editTieneVaciadoGrises, setEditTieneVaciadoGrises] = useState(false);
  const [editTieneVaciadoNegras, setEditTieneVaciadoNegras] = useState(false);
  const [editIdealFamilias, setEditIdealFamilias] = useState(false);
  const [editTieneSenderismo, setEditTieneSenderismo] = useState(false);
  const [editPlayaCercana, setEditPlayaCercana] = useState(false);
  const [editRutasBici, setEditRutasBici] = useState(false);
  const [editAdmiteMascotas, setEditAdmiteMascotas] = useState(false);
  const [editAccesoAsfaltado, setEditAccesoAsfaltado] = useState(false);
  const [editMuchaSombra, setEditMuchaSombra] = useState(false);
  const [editMuySoleado, setEditMuySoleado] = useState(false);
  const [editTerrenoNivelado, setEditTerrenoNivelado] = useState(false);
  const [editAptoGrandes, setEditAptoGrandes] = useState(false);
  const [editPermiteToldo, setEditPermiteToldo] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Estado para Modal de Edición Colaborativa de Equipamiento (Cualquier Usuario)
  const [modalEquipamientoAbierto, setModalEquipamientoAbierto] = useState(false);
  const [guardandoEquipamiento, setGuardandoEquipamiento] = useState(false);
  const [equipAgua, setEquipAgua] = useState(false);
  const [equipLavabo, setEquipLavabo] = useState(false);
  const [equipElectricidad, setEquipElectricidad] = useState(false);
  const [equipWifi, setEquipWifi] = useState(false);
  const [equipBasuras, setEquipBasuras] = useState(false);
  const [equipDuchas, setEquipDuchas] = useState(false);
  const [equipVaciadoGrises, setEquipVaciadoGrises] = useState(false);
  const [equipVaciadoNegras, setEquipVaciadoNegras] = useState(false);
  const [equipFamilias, setEquipFamilias] = useState(false);
  const [equipSenderismo, setEquipSenderismo] = useState(false);
  const [equipPlaya, setEquipPlaya] = useState(false);
  const [equipBici, setEquipBici] = useState(false);
  const [equipMascotas, setEquipMascotas] = useState(false);
  const [equipAsfaltado, setEquipAsfaltado] = useState(false);
  const [equipSombra, setEquipSombra] = useState(false);
  const [equipSoleado, setEquipSoleado] = useState(false);
  const [equipNivelado, setEquipNivelado] = useState(false);
  const [equipGrandes, setEquipGrandes] = useState(false);
  const [equipToldo, setEquipToldo] = useState(false);

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

      const notasLocales = localStorage.getItem(`camplink_notas_lugar_${lugarId}`);
      if (notasLocales) {
        try {
          const parseadas = JSON.parse(notasLocales);
          if (Array.isArray(parseadas)) setNotasPersonales(parseadas);
        } catch {}
      } else {
        const notaAntigua = localStorage.getItem(`camplink_nota_lugar_${lugarId}`);
        if (notaAntigua) {
          setNotasPersonales([{ id: 'offline-legacy', contenido: notaAntigua, fecha_creacion: new Date().toISOString() }]);
        }
      }
    } catch (e) {
      console.warn('Error leyendo almacenamiento local:', e);
    }
  }, [lugarId]);

  const alternarGuardadoParaIr = () => {
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
          foto_principal: lugar.foto_principal,
          tipo_lugar: lugar.tipo_lugar,
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
    setCargando(true);
    try {
      const data = await peticionApi(`/api/lugares/puntos/${lugarId}/`);
      setLugar(data);
      setFotoHeroActiva(obtenerImagenLugar(data));

      if (Array.isArray(data.mis_notas_personales) && data.mis_notas_personales.length > 0) {
        setNotasPersonales(data.mis_notas_personales);
        try {
          localStorage.setItem(`camplink_notas_lugar_${lugarId}`, JSON.stringify(data.mis_notas_personales));
        } catch {}
      } else if (data.mi_nota_personal) {
        const arr = [{ id: 'legacy', contenido: data.mi_nota_personal, fecha_creacion: new Date().toISOString() }];
        setNotasPersonales(arr);
        try {
          localStorage.setItem(`camplink_notas_lugar_${lugarId}`, JSON.stringify(arr));
        } catch {}
      }

      if (usuario) {
        try {
          const checkins = await peticionApi(`/api/diario/checkins/?lugar_id=${lugarId}&mis_checkins=true`);
          setMisCheckinsLugar(checkins);
        } catch {}
      }

      // Cargar diarios de ruta públicos o de la comunidad relacionados con este lugar
      try {
        setCargandoDiario(true);
        const diarios = await peticionApi(`/api/diario/publicaciones/?lugar=${lugarId}`);
        const listaDiarios = Array.isArray(diarios) ? diarios : Array.isArray(diarios?.results) ? diarios.results : [];
        setPublicacionesDiario(listaDiarios);
      } catch (e) {
        console.warn('Error al cargar diarios del lugar:', e);
      } finally {
        setCargandoDiario(false);
      }
    } catch (err) {
      try {
        const guardados = JSON.parse(localStorage.getItem('camplink_lugares_offline') || '[]');
        const local = guardados.find(l => l.id === lugarId);
        if (local) {
          setLugar(local);
          setFotoHeroActiva(obtenerImagenLugar(local));
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

  const abrirModalEditar = () => {
    if (!lugar) return;
    setEditNombre(lugar.nombre || '');
    setEditTipoLugar(lugar.tipo_lugar || 'pernocta_libre');
    setEditLatitud(lugar.latitud != null ? lugar.latitud : '');
    setEditLongitud(lugar.longitud != null ? lugar.longitud : '');
    setEditPoblacion(lugar.poblacion || '');
    setEditProvincia(lugar.provincia || '');
    setEditPrecio(lugar.precio != null ? lugar.precio : '0');
    setEditEsGratuito(Boolean(lugar.es_gratuito));
    setEditDescripcion(lugar.descripcion || '');
    setEditFotoArchivo(null);
    setEditFotoPreview(lugar.foto_principal || null);

    setEditTieneAgua(Boolean(lugar.tiene_agua || lugar.agua_potable));
    setEditTieneLavabo(Boolean(lugar.tiene_lavabo || lugar.lavabos));
    setEditTieneElectricidad(Boolean(lugar.tiene_electricidad || lugar.electricidad));
    setEditTieneWifi(Boolean(lugar.tiene_wifi || lugar.wifi));
    setEditTieneBasuras(Boolean(lugar.tiene_basuras || lugar.basuras));
    setEditTieneDuchas(Boolean(lugar.tiene_duchas || lugar.duchas));
    setEditTieneVaciadoGrises(Boolean(lugar.tiene_vaciado_aguas_grises || lugar.vaciado_aguas_grises));
    setEditTieneVaciadoNegras(Boolean(lugar.tiene_vaciado_aguas_negras || lugar.vaciado_aguas_negras));

    setEditIdealFamilias(Boolean(lugar.ideal_familias || lugar.ideal_ninos_10_anos));
    setEditTieneSenderismo(Boolean(lugar.tiene_senderismo || lugar.senderismo_cercano));
    setEditPlayaCercana(Boolean(lugar.playa_cercana));
    setEditRutasBici(Boolean(lugar.rutas_en_bici || lugar.rutas_bici));
    setEditAdmiteMascotas(Boolean(lugar.admite_mascotas || lugar.mascotas));

    setEditAccesoAsfaltado(Boolean(lugar.acceso_asfaltado));
    setEditMuchaSombra(Boolean(lugar.mucha_sombra));
    setEditMuySoleado(Boolean(lugar.muy_soleado || lugar.muy_soleado_placas));
    setEditTerrenoNivelado(Boolean(lugar.terreno_nivelado));
    setEditAptoGrandes(Boolean(lugar.apto_grandes_autocaravanas || lugar.apto_autocaravanas_grandes));
    setEditPermiteToldo(Boolean(lugar.permite_sacar_toldo || lugar.permitido_sacar_toldo));

    setModalEditarAbierto(true);
  };

  const guardarEdicionLugar = async (e) => {
    e.preventDefault();
    if (!editNombre.trim() || editLatitud === '' || editLongitud === '') {
      alert('Nombre y coordenadas GPS son obligatorios.');
      return;
    }

    setGuardandoEdicion(true);
    try {
      const formData = new FormData();
      formData.append('nombre', editNombre.trim());
      formData.append('tipo_lugar', editTipoLugar);
      formData.append('latitud', parseFloat(editLatitud));
      formData.append('longitud', parseFloat(editLongitud));
      formData.append('poblacion', editPoblacion.trim());
      formData.append('provincia', editProvincia.trim());
      formData.append('precio', parseFloat(editPrecio || 0));
      formData.append('es_gratuito', editEsGratuito ? 'true' : 'false');
      formData.append('descripcion', editDescripcion.trim());

      if (editFotoArchivo) {
        formData.append('foto_principal', editFotoArchivo);
      }

      formData.append('tiene_agua', editTieneAgua ? 'true' : 'false');
      formData.append('tiene_lavabo', editTieneLavabo ? 'true' : 'false');
      formData.append('tiene_electricidad', editTieneElectricidad ? 'true' : 'false');
      formData.append('tiene_wifi', editTieneWifi ? 'true' : 'false');
      formData.append('tiene_basuras', editTieneBasuras ? 'true' : 'false');
      formData.append('tiene_duchas', editTieneDuchas ? 'true' : 'false');
      formData.append('tiene_vaciado_aguas_grises', editTieneVaciadoGrises ? 'true' : 'false');
      formData.append('tiene_vaciado_aguas_negras', editTieneVaciadoNegras ? 'true' : 'false');

      formData.append('ideal_familias', editIdealFamilias ? 'true' : 'false');
      formData.append('tiene_senderismo', editTieneSenderismo ? 'true' : 'false');
      formData.append('playa_cercana', editPlayaCercana ? 'true' : 'false');
      formData.append('rutas_en_bici', editRutasBici ? 'true' : 'false');
      formData.append('admite_mascotas', editAdmiteMascotas ? 'true' : 'false');

      formData.append('acceso_asfaltado', editAccesoAsfaltado ? 'true' : 'false');
      formData.append('mucha_sombra', editMuchaSombra ? 'true' : 'false');
      formData.append('muy_soleado', editMuySoleado ? 'true' : 'false');
      formData.append('terreno_nivelado', editTerrenoNivelado ? 'true' : 'false');
      formData.append('apto_grandes_autocaravanas', editAptoGrandes ? 'true' : 'false');
      formData.append('permite_sacar_toldo', editPermiteToldo ? 'true' : 'false');

      await peticionApi(`/api/lugares/puntos/${lugar.id}/`, {
        method: 'PATCH',
        body: formData
      });

      alert('¡Lugar actualizado correctamente!');
      setModalEditarAbierto(false);
      cargarDetalle();
    } catch (err) {
      console.error('Error al actualizar lugar:', err);
      alert('Error al guardar los cambios: ' + (err.message || 'Verifica los campos'));
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // Abrir Modal de Edición Colaborativa de Equipamiento (Cualquier Explorador)
  const abrirModalEquipamiento = () => {
    if (!usuario) {
      alert('Debes iniciar sesión para colaborar actualizando el equipamiento de este lugar.');
      return;
    }
    setEquipAgua(Boolean(lugar.tiene_agua || lugar.agua_potable));
    setEquipLavabo(Boolean(lugar.tiene_lavabo || lugar.lavabos));
    setEquipElectricidad(Boolean(lugar.tiene_electricidad || lugar.electricidad));
    setEquipWifi(Boolean(lugar.tiene_wifi || lugar.wifi));
    setEquipBasuras(Boolean(lugar.tiene_basuras || lugar.basuras));
    setEquipDuchas(Boolean(lugar.tiene_duchas || lugar.duchas));
    setEquipVaciadoGrises(Boolean(lugar.tiene_vaciado_aguas_grises || lugar.vaciado_aguas_grises));
    setEquipVaciadoNegras(Boolean(lugar.tiene_vaciado_aguas_negras || lugar.vaciado_aguas_negras));

    setEquipFamilias(Boolean(lugar.ideal_familias || lugar.ideal_ninos_10_anos));
    setEquipSenderismo(Boolean(lugar.tiene_senderismo || lugar.senderismo_cercano));
    setEquipPlaya(Boolean(lugar.playa_cercana));
    setEquipBici(Boolean(lugar.rutas_en_bici || lugar.rutas_bici));
    setEquipMascotas(Boolean(lugar.admite_mascotas || lugar.mascotas));

    setEquipAsfaltado(Boolean(lugar.acceso_asfaltado));
    setEquipSombra(Boolean(lugar.mucha_sombra));
    setEquipSoleado(Boolean(lugar.muy_soleado || lugar.muy_soleado_placas));
    setEquipNivelado(Boolean(lugar.terreno_nivelado));
    setEquipGrandes(Boolean(lugar.apto_grandes_autocaravanas || lugar.apto_autocaravanas_grandes));
    setEquipToldo(Boolean(lugar.permite_sacar_toldo || lugar.permitido_sacar_toldo));

    setModalEquipamientoAbierto(true);
  };

  const guardarEquipamientoColaborativo = async (e) => {
    e.preventDefault();
    setGuardandoEquipamiento(true);
    try {
      await peticionApi(`/api/lugares/puntos/${lugar.id}/actualizar_equipamiento/`, {
        method: 'POST',
        body: {
          tiene_agua: equipAgua,
          tiene_lavabo: equipLavabo,
          tiene_electricidad: equipElectricidad,
          tiene_wifi: equipWifi,
          tiene_basuras: equipBasuras,
          tiene_duchas: equipDuchas,
          tiene_vaciado_aguas_grises: equipVaciadoGrises,
          tiene_vaciado_aguas_negras: equipVaciadoNegras,
          ideal_familias: equipFamilias,
          tiene_senderismo: equipSenderismo,
          playa_cercana: equipPlaya,
          rutas_en_bici: equipBici,
          admite_mascotas: equipMascotas,
          acceso_asfaltado: equipAsfaltado,
          mucha_sombra: equipSombra,
          muy_soleado: equipSoleado,
          terreno_nivelado: equipNivelado,
          apto_grandes_autocaravanas: equipGrandes,
          permite_sacar_toldo: equipToldo,
        }
      });
      alert('¡Equipamiento y servicios actualizados con éxito! Gracias por tu colaboración camper.');
      setModalEquipamientoAbierto(false);
      cargarDetalle();
    } catch (err) {
      console.error('Error al actualizar equipamiento:', err);
      alert('No se pudo guardar la actualización de equipamiento.');
    } finally {
      setGuardandoEquipamiento(false);
    }
  };

  const formatearFechaHoraNota = (fechaStr) => {
    if (!fechaStr) return '';
    try {
      const d = new Date(fechaStr);
      return d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fechaStr;
    }
  };

  const guardarNotaPersonal = async (e) => {
    if (e) e.preventDefault();
    if (!lugar || !nuevaNota.trim()) return;
    setGuardandoNota(true);
    setMensajeNota('');

    const textoNota = nuevaNota.trim();
    const nuevaNotaTemporal = {
      id: 'temp-' + Date.now(),
      contenido: textoNota,
      fecha_creacion: new Date().toISOString()
    };

    if (usuario) {
      try {
        const res = await peticionApi(`/api/lugares/puntos/${lugar.id}/nota_personal/`, {
          method: 'POST',
          body: { contenido: textoNota }
        });
        const listaActualizada = res.notas || [
          {
            id: res.id,
            contenido: res.contenido,
            fecha_creacion: res.fecha_creacion || new Date().toISOString()
          },
          ...notasPersonales
        ];
        setNotasPersonales(listaActualizada);
        try {
          localStorage.setItem(`camplink_notas_lugar_${lugar.id}`, JSON.stringify(listaActualizada));
        } catch {}
        setNuevaNota('');
        setMensajeNota('✅ Nota personal guardada con fecha y hora.');
      } catch (err) {
        console.error('Error al guardar nota en servidor:', err);
        const listaOffline = [nuevaNotaTemporal, ...notasPersonales];
        setNotasPersonales(listaOffline);
        try {
          localStorage.setItem(`camplink_notas_lugar_${lugar.id}`, JSON.stringify(listaOffline));
        } catch {}
        setNuevaNota('');
        setMensajeNota('Guardada localmente (sin conexión al servidor).');
      }
    } else {
      const listaOffline = [nuevaNotaTemporal, ...notasPersonales];
      setNotasPersonales(listaOffline);
      try {
        localStorage.setItem(`camplink_notas_lugar_${lugar.id}`, JSON.stringify(listaOffline));
      } catch {}
      setNuevaNota('');
      setMensajeNota('Guardada localmente en este dispositivo. Inicia sesión para sincronizarla en la nube.');
    }
    setGuardandoNota(false);
    setTimeout(() => setMensajeNota(''), 4500);
  };

  const eliminarNotaPersonal = async (notaId) => {
    if (!confirm('¿Deseas eliminar definitivamente esta nota personal?')) return;
    setGuardandoNota(true);
    setMensajeNota('');

    const listaActualizada = notasPersonales.filter(n => n.id !== notaId);
    setNotasPersonales(listaActualizada);
    try {
      localStorage.setItem(`camplink_notas_lugar_${lugar.id}`, JSON.stringify(listaActualizada));
    } catch {}

    if (usuario && !String(notaId).startsWith('temp-') && !String(notaId).startsWith('offline-')) {
      try {
        const res = await peticionApi(`/api/lugares/puntos/${lugar.id}/nota_personal/?nota_id=${notaId}`, {
          method: 'DELETE'
        });
        if (res && res.notas) {
          setNotasPersonales(res.notas);
          try {
            localStorage.setItem(`camplink_notas_lugar_${lugar.id}`, JSON.stringify(res.notas));
          } catch {}
        }
        setMensajeNota('🗑️ Nota personal eliminada.');
      } catch (err) {
        console.warn('Error al eliminar nota en servidor:', err);
        setMensajeNota('🗑️ Nota eliminada.');
      }
    } else {
      setMensajeNota('🗑️ Nota eliminada.');
    }
    setGuardandoNota(false);
    setTimeout(() => setMensajeNota(''), 4500);
  };

  const enviarValoracion = async (e) => {
    e.preventDefault();
    if (!usuario) {
      alert('Debes iniciar sesión para valorar un lugar.');
      return;
    }

    setEnviandoValoracion(true);
    try {
      const formData = new FormData();
      formData.append('puntuacion_camper', puntuacionNueva);
      formData.append('comentario', comentarioNuevo);
      if (fotoOpinion) {
        formData.append('foto', fotoOpinion);
      }

      await peticionApi(`/api/lugares/puntos/${lugarId}/valorar/`, {
        method: 'POST',
        body: formData
      });
      setComentarioNuevo('');
      setFotoOpinion(null);
      if (previewFotoOpinion) URL.revokeObjectURL(previewFotoOpinion);
      setPreviewFotoOpinion(null);
      cargarDetalle();
    } catch (err) {
      alert(err.message || 'Error al enviar valoración');
    } finally {
      setEnviandoValoracion(false);
    }
  };

  const irAlLugarNavegacionGps = () => {
    if (!lugar) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lugar.latitud},${lugar.longitud}`;
    window.open(url, '_blank');
  };

  const exportarGoogleCalendar = () => {
    if (!lugar) return;
    const titulo = encodeURIComponent(`Pernocta Camper en ${lugar.nombre}`);
    const detalles = encodeURIComponent(`Pernocta en ${lugar.nombre} (${lugar.poblacion}). Coordenadas GPS: ${lugar.latitud}, ${lugar.longitud}`);
    const ubicacion = encodeURIComponent(`${lugar.latitud}, ${lugar.longitud}`);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&details=${detalles}&location=${ubicacion}`;
    window.open(url, '_blank');
  };

  const abrirModalAnadirViaje = async () => {
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
        setNuevoViajeInlineTitulo('');
        setNotasParadaPlanificada('');
      }, 1500);
    } catch (err) {
      console.error('Error al planificar parada:', err);
      alert('Error al guardar la parada en el viaje.');
    } finally {
      setGuardandoEnViaje(false);
    }
  };

  const exportarAppleCalendar = () => {
    if (!lugar) return;
    const ahora = new Date();
    const formatoIcs = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const inicio = formatoIcs(ahora);
    const fin = formatoIcs(new Date(ahora.getTime() + 24 * 60 * 60 * 1000));
    const enlaceGps = `https://www.google.com/maps/dir/?api=1&destination=${lugar.latitud},${lugar.longitud}`;

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

  const etiquetaTipo = ETIQUETAS_TIPO_LUGAR[lugar.tipo_lugar] || { emoji: '🚐', label: lugar.tipo_lugar_display || 'Punto Camper' };
  const tieneFotoPropia = tieneImagenPropia(lugar);
  const esAdminOPermitido = Boolean(
    usuario?.es_admin || 
    usuario?.is_staff || 
    usuario?.is_superuser || 
    usuario?.username === 'admin' || 
    (usuario && lugar.creador && usuario.id === lugar.creador)
  );

  return (
    <div className="camplink-container" style={{ padding: '30px 20px 80px', width: '100%', margin: '0 auto', maxWidth: '1100px' }}>
      {/* Botón de Retorno y Acciones Rápidas de Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <button className="btn btn-secondary btn-sm" onClick={alVolver}>
          <ArrowLeft size={16} /> Volver al Mapa / Exploración
        </button>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Botón Editar Lugar para Administrador o Creador */}
          {esAdminOPermitido && (
            <button
              className="btn btn-primary btn-sm"
              onClick={abrirModalEditar}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent-earth)' }}
              title="Editar datos completos, equipamiento o fotografía de este lugar (Admin)"
            >
              <Edit3 size={15} />
              <span>Editar Lugar</span>
            </button>
          )}

          {/* Botón Radar en este lugar */}
          {abrirRadar && lugar && lugar.latitud != null && lugar.longitud != null && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => abrirRadar({ lat: lugar.latitud, lng: lugar.longitud, nombre: lugar.nombre, poblacion: lugar.poblacion, provincia: lugar.provincia })}
              title="Abrir Radar Nómada en este punto"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Radar size={15} color="var(--accent-earth)" />
              <span>Radar en este Punto</span>
            </button>
          )}

          {/* Botón Planificar Parada en Viaje */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={abrirModalAnadirViaje}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(35, 83, 52, 0.15)', borderColor: 'var(--accent-forest)' }}
          >
            <Route size={15} color="var(--accent-forest)" />
            <span>Planificar en Viaje</span>
          </button>

          {/* Botón Guardar Para Ir */}
          <button
            className={`btn btn-sm ${guardadoParaIr ? 'btn-primary' : 'btn-secondary'}`}
            onClick={alternarGuardadoParaIr}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {guardadoParaIr ? <Check size={15} /> : <Compass size={15} />}
            <span>{guardadoParaIr ? 'Guardado en Mi Ruta' : 'Guardar para ir'}</span>
          </button>

          {/* Botón Guardado Offline */}
          <button
            className={`btn btn-sm ${guardadoOffline ? 'btn-primary' : 'btn-secondary'}`}
            onClick={alternarGuardadoOffline}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Guardar ficha completa en memoria local del navegador para consultarla en zonas sin cobertura"
          >
            <HardDriveDownload size={15} />
            <span>{guardadoOffline ? 'Disponible Offline' : 'Guardar Offline'}</span>
          </button>
        </div>
      </div>

      {/* HERO BANNER: IMAGEN PRINCIPAL, BADGES, TÍTULO, UBICACIÓN Y DESCRIPCIÓN "SOBRE ESTA PERNOCTA" */}
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '360px',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: '26px',
        border: '1px solid var(--border-color)',
        background: '#0D1A12',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '24px'
      }}>
        <img loading="lazy" decoding="async" 
          src={fotoHeroActiva || obtenerImagenLugar(lugar)} 
          alt={lugar.nombre} 
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Degradado para máxima legibilidad */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(13,26,18,0.96) 0%, rgba(13,26,18,0.7) 45%, rgba(0,0,0,0.4) 100%)'
        }} />

        {/* BADGES EN LA ESQUINA SUPERIOR IZQUIERDA */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', zIndex: 2 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(24, 61, 38, 0.92)',
            backdropFilter: 'blur(8px)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-full)',
            padding: '6px 14px',
            fontSize: '0.85rem',
            fontWeight: 800,
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.35)'
          }}>
            <span>{etiquetaTipo.emoji}</span>
            <span>{etiquetaTipo.label}</span>
          </span>

          {lugar.es_gratuito && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(35, 83, 52, 0.92)',
              backdropFilter: 'blur(8px)',
              color: '#A3E635',
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 800,
              border: '1px solid rgba(163,230,53,0.35)'
            }}>
              💸 100% Gratuito
            </span>
          )}
          {!lugar.es_gratuito && lugar.precio > 0 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(200, 140, 60, 0.92)',
              backdropFilter: 'blur(8px)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 800,
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              💶 {lugar.precio} €/noche
            </span>
          )}
        </div>

        {/* INDICADOR DE FOTO EN LA ESQUINA SUPERIOR DERECHA */}
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2 }}>
          <span style={{
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            color: 'rgba(255,255,255,0.9)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            {tieneFotoPropia ? (
              <>📸 Foto de la comunidad</>
            ) : (
              <>🖼️ Imagen preestablecida ({etiquetaTipo.label})</>
            )}
          </span>
        </div>

        {/* CONTENIDO DENTRO DEL HERO: TÍTULO, UBICACIÓN, GPS Y DESCRIPCIÓN "SOBRE ESTA PERNOCTA" */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '920px' }}>
          <h1 style={{
            margin: 0,
            fontSize: '2.1rem',
            fontWeight: 900,
            color: '#FFFFFF',
            textShadow: '0 2px 10px rgba(0,0,0,0.7)',
            lineHeight: 1.2
          }}>
            {lugar.nombre}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={16} color="#A3E635" />
              <span>{lugar.poblacion} {lugar.provincia && `(${lugar.provincia})`} • {lugar.pais}</span>
            </span>
            <span style={{ opacity: 0.6 }}>|</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.88rem' }}>
              <span>Coordenadas GPS:</span>
              <strong style={{ color: '#A3E635' }}>{lugar.latitud?.toFixed(4)}, {lugar.longitud?.toFixed(4)}</strong>
            </span>
          </div>

          {/* CONTENIDO DE "SOBRE ESTA PERNOCTA" INCLUIDO DIRECTAMENTE EN EL HERO */}
          {lugar.descripcion && (
            <div style={{
              marginTop: '12px',
              padding: '12px 16px',
              background: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(8px)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: '0.92rem',
              lineHeight: 1.55,
              textShadow: '0 1px 3px rgba(0,0,0,0.8)'
            }}>
              {lugar.descripcion}
            </div>
          )}
        </div>
      </div>

      {/* MINIATURAS DE LA GALERÍA SI EXISTEN MÁS FOTOS */}
      {lugar.fotos && lugar.fotos.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '6px' }}>
          <button
            type="button"
            onClick={() => setFotoHeroActiva(obtenerImagenLugar(lugar))}
            style={{
              width: '80px',
              height: '56px',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              border: `2px solid ${fotoHeroActiva === obtenerImagenLugar(lugar) ? 'var(--accent-forest)' : 'var(--border-color)'}`,
              padding: 0,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <img loading="lazy" decoding="async" src={obtenerImagenLugar(lugar)} alt="Foto principal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
          {lugar.fotos.map((foto, idx) => (
            <button
              type="button"
              key={foto.id || idx}
              onClick={() => setFotoHeroActiva(foto.imagen)}
              style={{
                width: '80px',
                height: '56px',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: `2px solid ${fotoHeroActiva === foto.imagen ? 'var(--accent-forest)' : 'var(--border-color)'}`,
                padding: 0,
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <img loading="lazy" decoding="async" src={foto.imagen} alt={foto.pie_foto || `Foto ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        {/* COLUMNA IZQUIERDA: VALORACIÓN, BOTONES, NOTAS PERSONALES Y SERVICIOS */}
        <div>
          {/* VALORACIONES PROMEDIO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
            {(lugar.total_valoraciones > 0 || (lugar.valoraciones && lugar.valoraciones.length > 0)) ? (
              <>
                <CamperIconRating valor={lugar.valoracion_media} soloLectura tamaño="grande" />
                <span style={{ fontWeight: 800, fontSize: '1.15rem' }}>{lugar.valoracion_media} / 5</span>
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

          {/* BOTONES PRINCIPALES DE ACCIÓN: CÓMO LLEGAR (GPS), CHECK-IN Y CALENDARIOS */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {/* BOTÓN CÓMO LLEGAR (GPS) */}
            <button
              className="btn btn-primary"
              onClick={irAlLugarNavegacionGps}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-earth)' }}
            >
              <Navigation size={17} /> Cómo llegar
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
                onClick={() => abrirRadar({ lat: lugar.latitud, lng: lugar.longitud, nombre: lugar.nombre, poblacion: lugar.poblacion, provincia: lugar.provincia })}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Abrir Radar Nómada como si estuvieras en este lugar para consultar servicios cercanos y gasolineras"
              >
                <Radar size={15} color="var(--accent-earth)" />
                <span>Radar en este Lugar</span>
              </button>
            )}
          </div>

          {/* MIS NOTAS PERSONALES EN CADA LUGAR (CON FECHA/HORA, MÚLTIPLES NOTAS Y BORRADO TRAS GUARDAR) */}
          <div className="camper-card" style={{
            padding: '22px',
            marginBottom: '24px',
            border: '1.5px solid var(--accent-earth)',
            background: 'var(--bg-surface)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} color="var(--accent-earth)" />
                <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)', fontWeight: 800 }}>
                  Mis Notas Personales {notasPersonales.length > 0 && `(${notasPersonales.length})`}
                </h3>
              </div>
              <span style={{ fontSize: '0.74rem', background: 'rgba(200, 140, 60, 0.15)', color: 'var(--accent-earth)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                🔒 Solo visibles para ti
              </span>
            </div>


            {/* Listado de Notas Guardadas con Fecha y Hora */}
            {notasPersonales.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                {notasPersonales.map((nota, idx) => (
                  <div
                    key={nota.id || idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(200, 140, 60, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '0.76rem', color: 'var(--accent-earth)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        📅 {formatearFechaHoraNota(nota.fecha_creacion || nota.fecha_modificacion) || 'Guardada'}
                      </span>
                      {/* Una vez guardada es cuando se permite eliminarla */}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => eliminarNotaPersonal(nota.id)}
                        disabled={guardandoNota}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          padding: '3px 8px',
                          color: '#EF4444',
                          borderColor: 'rgba(239, 68, 68, 0.35)'
                        }}
                        title="Eliminar esta nota guardada"
                      >
                        <Trash2 size={12} /> Eliminar
                      </button>
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                      {nota.contenido}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario para añadir nueva nota */}
            <form onSubmit={guardarNotaPersonal}>
              <div style={{ marginBottom: '8px' }}>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Escribe una nueva nota u observación (ej: Acceso algo bacheado al final. Cobertura 4G a tope. Noche súper tranquila)..."
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  style={{ resize: 'vertical', minHeight: '65px', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  {mensajeNota && (
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-forest)' }}>
                      {mensajeNota}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={guardandoNota || !nuevaNota.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent-earth)', marginLeft: 'auto' }}
                >
                  <Check size={14} /> {guardandoNota ? 'Guardando...' : 'Añadir Nota'}
                </button>
              </div>
            </form>

            {/* HISTORIAL DE NOTAS EN CHECK-INS PREVIOS SI EXISTEN */}
            {misCheckinsLugar.length > 0 && misCheckinsLugar.some(ck => ck.notas_privadas) && (
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Diario de tus pernoctas anteriores en este lugar:
                </div>
                {misCheckinsLugar.map(ck => ck.notas_privadas ? (
                  <div key={ck.id} style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '6px' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                      📅 Pernocta del {formatearFecha(ck.fecha_llegada)} ({ck.dias_previstos} noche{ck.dias_previstos > 1 ? 's' : ''}):
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                      {ck.notas_privadas}
                    </div>
                  </div>
                ) : null)}
              </div>
            )}
          </div>

          {/* EQUIPAMIENTO, ENTORNO Y ACCESO: CON BOTÓN COLABORATIVO PARA CUALQUIER USUARIO */}
          <div className="camper-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 900, color: 'var(--text-primary)' }}>
                Equipamiento, Entorno y Acceso
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={abrirModalEquipamiento}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', borderColor: 'var(--accent-forest)', color: 'var(--accent-forest)' }}
                title="Cualquier explorador puede colaborar actualizando los servicios de este lugar"
              >
                <Edit3 size={14} /> Colaborar / Editar Equipamiento
              </button>
            </div>

            {/* 1. Servicios Básicos */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-forest)', marginBottom: '8px' }}>
                🚰 Servicios Básicos y Camper
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {lugar.es_gratuito && <span className="badge-camper badge-forest">💸 100% Gratuito</span>}
                {!lugar.es_gratuito && lugar.precio > 0 && (
                  <span className="badge-camper badge-earth">💶 {lugar.precio} €/noche</span>
                )}
                {(lugar.agua_potable || lugar.tiene_agua) && <span className="badge-camper badge-forest">💧 Agua Potable</span>}
                {(lugar.lavabos || lugar.tiene_lavabo) && <span className="badge-camper badge-forest">🚻 Lavabos / WC</span>}
                {(lugar.electricidad || lugar.tiene_electricidad) && <span className="badge-camper badge-forest">⚡ Electricidad</span>}
                {(lugar.wifi || lugar.tiene_wifi) && <span className="badge-camper badge-forest">📶 Wi-Fi</span>}
                {(lugar.basuras || lugar.tiene_basuras) && <span className="badge-camper badge-forest">🗑️ Cubos de Basura</span>}
                {(lugar.duchas || lugar.tiene_duchas) && <span className="badge-camper badge-forest">🚿 Duchas</span>}
                {(lugar.vaciado_aguas_grises || lugar.tiene_vaciado_aguas_grises) && <span className="badge-camper badge-forest">🔘 Vaciado de Grises</span>}
                {(lugar.vaciado_aguas_negras || lugar.tiene_vaciado_aguas_negras) && <span className="badge-camper badge-forest">🚽 Vaciado de Negras (WC)</span>}
              </div>
            </div>

            {/* 2. Entorno y Ocio */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-forest)', marginBottom: '8px' }}>
                🌳 Entorno y Ocio
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(lugar.ideal_familias || lugar.ideal_ninos_10_anos) && <span className="badge-camper badge-forest">👨‍👩‍👧 Ideal Familias</span>}
                {(lugar.senderismo_cercano || lugar.tiene_senderismo) && <span className="badge-camper badge-forest">🥾 Senderismo Cercano</span>}
                {(lugar.playa_cercana) && <span className="badge-camper badge-forest">🏖️ Playa / Lago / Río</span>}
                {(lugar.rutas_bici || lugar.rutas_en_bici) && <span className="badge-camper badge-forest">🚴 Rutas en Bicicleta</span>}
                {(lugar.admite_mascotas || lugar.mascotas) && <span className="badge-camper badge-forest">🐕 Admite Mascotas</span>}
              </div>
            </div>

            {/* 3. Terreno y Acceso */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-forest)', marginBottom: '8px' }}>
                🛣️ Terreno y Acceso
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(lugar.acceso_asfaltado) && <span className="badge-camper badge-forest">🛣️ Acceso Asfaltado</span>}
                {(lugar.mucha_sombra) && <span className="badge-camper badge-forest">🌲 Mucha Sombra</span>}
                {(lugar.muy_soleado) && <span className="badge-camper badge-forest">☀️ Muy Soleado (Placas)</span>}
                {(lugar.terreno_nivelado) && <span className="badge-camper badge-forest">📐 Terreno Nivelado</span>}
                {(lugar.apto_grandes_autocaravanas || lugar.apto_autocaravanas_grandes) && <span className="badge-camper badge-forest">🚍 Apto Autocaravanas &gt;7m</span>}
                {(lugar.permite_sacar_toldo || lugar.permitido_sacar_toldo) && <span className="badge-camper badge-forest">⛱️ Permite Sacar Toldo y Sillas</span>}
              </div>
            </div>
          </div>
          {/* WIDGET DIARIOS DE EXPLORADORES EN ESTE LUGAR */}
          <div className="camper-card" style={{ padding: '24px', marginTop: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                <BookOpen size={20} color="var(--accent-forest)" />
                <span>Diarios de Exploradores ({publicacionesDiario.length})</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Vivencias y relatos en este punto
              </span>
            </div>

            {cargandoDiario ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Cargando relatos del diario de ruta...
              </div>
            ) : publicacionesDiario.length === 0 ? (
              <div style={{
                padding: '24px 16px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                border: '1.5px dashed var(--border-color)'
              }}>
                <BookOpen size={34} color="var(--text-muted)" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <p style={{ margin: '0 0 6px', fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Aún no hay publicaciones del diario en este lugar
                </p>
                <p style={{ margin: '0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  ¿Has pernoctado aquí? Comparte fotos, consejos y anécdotas en tu Diario de Ruta etiquetando este lugar.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {publicacionesDiario.map((pub) => (
                  <div
                    key={pub.id}
                    style={{
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    {/* Cabecera Publicación: Autor, Avatar y Fecha */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'var(--accent-forest)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}>
                          {pub.autor_detalle?.avatar ? (
                            <img src={pub.autor_detalle.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            pub.autor_detalle?.username?.charAt(0).toUpperCase() || 'E'
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            {pub.autor_detalle?.username || 'Explorador Nómada'}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {pub.fecha_creacion ? new Date(pub.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                          </div>
                        </div>
                      </div>

                      {/* Reacciones */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                        {pub.reacciones_resumen?.fuego > 0 && <span title="Fuego">🔥 {pub.reacciones_resumen.fuego}</span>}
                        {pub.reacciones_resumen?.pino > 0 && <span title="Pino">🌲 {pub.reacciones_resumen.pino}</span>}
                        {pub.reacciones_resumen?.alerta > 0 && <span title="Alerta">⚠️ {pub.reacciones_resumen.alerta}</span>}
                      </div>
                    </div>

                    {/* Texto del relato */}
                    {pub.contenido && (
                      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                        {pub.contenido}
                      </p>
                    )}

                    {/* Imagen de la ruta */}
                    {pub.imagen && (
                      <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                        <img
                          loading="lazy"
                          decoding="async"
                          src={pub.imagen}
                          alt="Foto de la ruta"
                          onClick={() => setFotoAmpliadaModal(pub.imagen)}
                          style={{
                            width: '100%',
                            maxHeight: '280px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            display: 'block'
                          }}
                          title="Haz clic para ver la foto ampliada"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: CLIMA EN TIEMPO REAL Y RESEÑAS */}
        <div>
          {/* Widget de Clima interactivo */}
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

              {/* Adjuntar Foto en la Opinión */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <label 
                  className="btn btn-secondary btn-sm" 
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                  title="Añadir fotografía real de tu estancia en este lugar"
                >
                  <Camera size={14} color="var(--accent-forest)" />
                  <span>{fotoOpinion ? 'Cambiar Foto' : '📷 Adjuntar Foto a la Opinión'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={manejarFotoOpinion}
                  />
                </label>

                {previewFotoOpinion && (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={previewFotoOpinion}
                      alt="Vista previa foto opinión"
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: 'var(--radius-sm)',
                        objectFit: 'cover',
                        border: '1.5px solid var(--accent-forest)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={eliminarFotoOpinion}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#EF4444',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        lineHeight: 1
                      }}
                      title="Quitar foto"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary btn-sm" disabled={enviandoValoracion}>
                <Send size={14} /> {enviandoValoracion ? 'Enviando...' : 'Publicar Reseña'}
              </button>
            </form>
          </div>

          {/* Lista de Valoraciones de la Comunidad */}
          <div className="camper-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 16px' }}>
              Opiniones de Exploradores ({lugar.valoraciones?.length || 0})
            </h3>

            {(!lugar.valoraciones || lugar.valoraciones.length === 0) ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                Aún no hay opiniones escritas para este lugar. Sé el primero en compartir tu experiencia nómada.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {lugar.valoraciones.map((val) => {
                  const esAutorVal = Boolean(usuario && (
                    val.explorador === usuario.id || 
                    val.explorador_id === usuario.id || 
                    (usuario.username && val.explorador_username && usuario.username.toLowerCase() === val.explorador_username.toLowerCase())
                  ));
                  const esAdmin = Boolean(usuario && (usuario.es_admin || usuario.is_staff || usuario.is_superuser || usuario.username === 'admin' || (usuario.username && usuario.username.toLowerCase() === 'admin')));
                  const puedeModificarVal = Boolean(esAutorVal || esAdmin);
                  const estaEditandoEste = editandoValId === val.id;

                  return (
                    <div key={val.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                            {formatearUsuario(val.explorador_username || 'Explorador')}
                          </span>
                          {val.fecha && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              • {new Date(val.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {!estaEditandoEste && (
                            <CamperIconRating valor={val.puntuacion_camper} soloLectura tamaño="pequeño" />
                          )}
                          {puedeModificarVal && !estaEditandoEste && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() => iniciarEdicionValoracion(val)}
                                title={esAdmin && !esAutorVal ? "Moderar / Editar opinión (Admin)" : "Editar mi opinión"}
                                style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() => eliminarValoracion(val.id)}
                                title={esAdmin && !esAutorVal ? "Eliminar opinión (Admin)" : "Eliminar mi opinión"}
                                style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {estaEditandoEste ? (
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1.5px solid var(--accent-forest)', borderRadius: 'var(--radius-sm)', padding: '12px', marginTop: '8px' }}>
                          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Puntuación Camper:</span>
                            <CamperIconRating valor={puntuacionEditandoVal} alCambiar={setPuntuacionEditandoVal} tamaño="pequeño" />
                          </div>
                          <textarea
                            className="form-control"
                            rows="3"
                            value={textoEditandoVal}
                            onChange={(e) => setTextoEditandoVal(e.target.value)}
                            style={{ fontSize: '0.88rem', marginBottom: '10px' }}
                            placeholder="Escribe tu opinión actualizada..."
                            autoFocus
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={cancelarEdicionValoracion}
                              disabled={guardandoEdicionVal}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => guardarEdicionValoracion(val.id)}
                              disabled={guardandoEdicionVal || !textoEditandoVal.trim()}
                            >
                              {guardandoEdicionVal ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                          {val.comentario}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    
      {/* Modal Glassmorphism: Editar Ficha Completa (Admin / Creador) */}
      {modalEditarAbierto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '16px'
        }}>
          <div className="camper-card" style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '26px',
            background: 'var(--bg-surface)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="var(--accent-earth)" /> Editar Ficha de Lugar (Admin)
              </h2>
              <button onClick={() => setModalEditarAbierto(false)} className="btn-icon" style={{ cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={guardarEdicionLugar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Tipo de Lugar */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Tipo de Lugar Camper:</label>
                <select 
                  className="form-control"
                  value={editTipoLugar}
                  onChange={(e) => setEditTipoLugar(e.target.value)}
                >
                  {TIPOS_LUGAR_OPCIONES.map(t => (
                    <option key={t.valor} value={t.valor}>{t.emoji} {t.label}</option>
                  ))}
                </select>
              </div>

              {/* Nombre */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Nombre del Lugar *</label>
                <input 
                  type="text" 
                  className="form-control"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                />
              </div>

              {/* Coordenadas GPS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Latitud GPS *</label>
                  <input type="number" step="any" className="form-control" required value={editLatitud} onChange={e => setEditLatitud(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Longitud GPS *</label>
                  <input type="number" step="any" className="form-control" required value={editLongitud} onChange={e => setEditLongitud(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Población</label>
                  <input type="text" className="form-control" value={editPoblacion} onChange={e => setEditPoblacion(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Provincia</label>
                  <input type="text" className="form-control" value={editProvincia} onChange={e => setEditProvincia(e.target.value)} />
                </div>
              </div>

              {/* Precio y Gratuidad */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                  <input type="checkbox" checked={editEsGratuito} onChange={e => setEditEsGratuito(e.target.checked)} /> 💸 Es 100% Gratuito
                </label>
                {!editEsGratuito && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '0.82rem' }}>Precio/noche:</label>
                    <input type="number" step="0.5" min="0" className="form-control" style={{ width: '80px', padding: '4px 8px' }} value={editPrecio} onChange={e => setEditPrecio(e.target.value)} />
                    <span style={{ fontSize: '0.82rem' }}>€</span>
                  </div>
                )}
              </div>

              {/* Foto Principal */}
              <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  <Camera size={15} color="var(--accent-forest)" /> Cambiar o actualizar Foto Principal
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{
                    flex: 1,
                    minWidth: '200px',
                    border: '1.5px dashed var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.02)'
                  }}>
                    <UploadCloud size={20} color="var(--accent-forest)" style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Seleccionar nueva imagen</div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditFotoArchivo(file);
                          setEditFotoPreview(URL.createObjectURL(file));
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {editFotoPreview && (
                    <div style={{ width: '100px', height: '65px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img loading="lazy" decoding="async" src={editFotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Descripción & Consejos</label>
                <textarea 
                  className="form-control"
                  rows="3"
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                />
              </div>

              {/* SERVICIOS */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>🚰 Servicios Disponibles:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '6px', fontSize: '0.78rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editTieneAgua} onChange={e => setEditTieneAgua(e.target.checked)} /> 🚰 Agua
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editTieneLavabo} onChange={e => setEditTieneLavabo(e.target.checked)} /> 🚽 Lavabos
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editTieneElectricidad} onChange={e => setEditTieneElectricidad(e.target.checked)} /> ⚡ Electricidad
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editTieneWifi} onChange={e => setEditTieneWifi(e.target.checked)} /> 🛜 Wi-Fi
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editTieneBasuras} onChange={e => setEditTieneBasuras(e.target.checked)} /> 🗑️ Basuras
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editTieneDuchas} onChange={e => setEditTieneDuchas(e.target.checked)} /> 🚿 Duchas
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editTieneVaciadoGrises} onChange={e => setEditTieneVaciadoGrises(e.target.checked)} /> 🔘 Grises
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editTieneVaciadoNegras} onChange={e => setEditTieneVaciadoNegras(e.target.checked)} /> 🚽 Negras
                  </label>
                </div>
              </div>

              {/* ENTORNO */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>🌳 Entorno y Ocio:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '6px', fontSize: '0.78rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editIdealFamilias} onChange={e => setEditIdealFamilias(e.target.checked)} /> 👨‍👩‍👧 Familias
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editTieneSenderismo} onChange={e => setEditTieneSenderismo(e.target.checked)} /> 🥾 Senderismo
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editPlayaCercana} onChange={e => setEditPlayaCercana(e.target.checked)} /> 🏖️ Playa/Lago
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editRutasBici} onChange={e => setEditRutasBici(e.target.checked)} /> 🚴 Rutas Bici
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editAdmiteMascotas} onChange={e => setEditAdmiteMascotas(e.target.checked)} /> 🐕 Mascotas
                  </label>
                </div>
              </div>

              {/* TERRENO */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>🛣️ Terreno y Acceso:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '6px', fontSize: '0.78rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editAccesoAsfaltado} onChange={e => setEditAccesoAsfaltado(e.target.checked)} /> 🛣️ Asfaltado
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editMuchaSombra} onChange={e => setEditMuchaSombra(e.target.checked)} /> 🌲 Sombra
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editMuySoleado} onChange={e => setEditMuySoleado(e.target.checked)} /> ☀️ Soleado
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editTerrenoNivelado} onChange={e => setEditTerrenoNivelado(e.target.checked)} /> 📐 Nivelado
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editAptoGrandes} onChange={e => setEditAptoGrandes(e.target.checked)} /> 🚐 &gt;7m
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editPermiteToldo} onChange={e => setEditPermiteToldo(e.target.checked)} /> ⛱️ Toldo
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalEditarAbierto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={guardandoEdicion}>
                  {guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Glassmorphism: Edición Colaborativa de Equipamiento (Cualquier Usuario) */}
      {modalEquipamientoAbierto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '16px'
        }}>
          <div className="camper-card" style={{
            maxWidth: '620px',
            width: '100%',
            maxHeight: '88vh',
            overflowY: 'auto',
            padding: '24px',
            background: 'var(--bg-surface)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="var(--accent-forest)" /> Colaborar en Equipamiento y Servicios
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Añade o corrige servicios de <strong>{lugar.nombre}</strong> para ayudar a toda la comunidad camper.
                </p>
              </div>
              <button onClick={() => setModalEquipamientoAbierto(false)} className="btn-icon" style={{ cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={guardarEquipamientoColaborativo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* 1. SERVICIOS */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: 'var(--accent-forest)', marginBottom: '8px' }}>
                  🚰 Servicios Básicos y Camper:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '8px', fontSize: '0.8rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipAgua} onChange={e => setEquipAgua(e.target.checked)} /> 💧 Agua Potable
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipLavabo} onChange={e => setEquipLavabo(e.target.checked)} /> 🚻 Lavabos / WC
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipElectricidad} onChange={e => setEquipElectricidad(e.target.checked)} /> ⚡ Electricidad
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipWifi} onChange={e => setEquipWifi(e.target.checked)} /> 📶 Wi-Fi
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipBasuras} onChange={e => setEquipBasuras(e.target.checked)} /> 🗑️ Cubos Basura
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipDuchas} onChange={e => setEquipDuchas(e.target.checked)} /> 🚿 Duchas
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipVaciadoGrises} onChange={e => setEquipVaciadoGrises(e.target.checked)} /> 🔘 Vaciado Grises
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipVaciadoNegras} onChange={e => setEquipVaciadoNegras(e.target.checked)} /> 🚽 Vaciado Negras
                  </label>
                </div>
              </div>

              {/* 2. ENTORNO */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: 'var(--accent-forest)', marginBottom: '8px' }}>
                  🌳 Entorno y Ocio:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '8px', fontSize: '0.8rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipFamilias} onChange={e => setEquipFamilias(e.target.checked)} /> 👨‍👩‍👧 Ideal Familias
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipSenderismo} onChange={e => setEquipSenderismo(e.target.checked)} /> 🥾 Senderismo
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipPlaya} onChange={e => setEquipPlaya(e.target.checked)} /> 🏖️ Playa / Lago
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipBici} onChange={e => setEquipBici(e.target.checked)} /> 🚴 Rutas Bici
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipMascotas} onChange={e => setEquipMascotas(e.target.checked)} /> 🐕 Admite Mascotas
                  </label>
                </div>
              </div>

              {/* 3. TERRENO */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: 'var(--accent-forest)', marginBottom: '8px' }}>
                  🛣️ Terreno y Acceso:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '8px', fontSize: '0.8rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipAsfaltado} onChange={e => setEquipAsfaltado(e.target.checked)} /> 🛣️ Acceso Asfaltado
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipSombra} onChange={e => setEquipSombra(e.target.checked)} /> 🌲 Mucha Sombra
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipSoleado} onChange={e => setEquipSoleado(e.target.checked)} /> ☀️ Soleado (Placas)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipNivelado} onChange={e => setEquipNivelado(e.target.checked)} /> 📐 Terreno Nivelado
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipGrandes} onChange={e => setEquipGrandes(e.target.checked)} /> 🚐 Apto &gt;7m
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={equipToldo} onChange={e => setEquipToldo(e.target.checked)} /> ⛱️ Permite Toldo
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalEquipamientoAbierto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={guardandoEquipamiento}>
                  {guardandoEquipamiento ? 'Guardando...' : 'Guardar Equipamiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

        {/* MODAL LIGHTBOX FOTO AMPLIADA */}
        {fotoAmpliadaModal && (
          <div
            onClick={() => setFotoAmpliadaModal(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.88)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3000,
              padding: '20px',
              cursor: 'zoom-out'
            }}
          >
            <img
              src={fotoAmpliadaModal}
              alt="Foto ampliada"
              style={{
                maxWidth: '92vw',
                maxHeight: '88vh',
                borderRadius: 'var(--radius-md)',
                objectFit: 'contain',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
              }}
            />
          </div>
        )}
      </div>
  );
}