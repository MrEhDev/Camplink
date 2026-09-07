// Aquí implemento el servicio meteorológico para la comunidad camper conectando con Open-Meteo,
// calculando previsión por coordenadas y generando alertas camper inteligentes (toldo, viento, heladas).

export async function obtenerPrevisionClima(lat, lng) {
  // Aquí consulto la API pública de Open-Meteo para obtener temperatura, viento y eventos solares
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,wind_gusts_10m_max&timezone=auto`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al conectar con la API de clima');
  const data = await res.json();

  // Mapeo los códigos meteorológicos WMO a descripciones camper en castellano
  const interpretarCodigo = (code) => {
    if (code === 0) return { texto: 'Despejado', icono: '☀️' };
    if (code <= 3) return { texto: 'Parcialmente Nublado', icono: '⛅' };
    if (code <= 48) return { texto: 'Niebla / Bruma', icono: '🌫️' };
    if (code <= 67) return { texto: 'Lluvia', icono: '🌧️' };
    if (code <= 77) return { texto: 'Nieve', icono: '❄️' };
    if (code <= 82) return { texto: 'Chubascos', icono: '🌦️' };
    if (code >= 95) return { texto: 'Tormenta Eléctrica', icono: '⚡' };
    return { texto: 'Nublado', icono: '☁️' };
  };

  const currentInfo = interpretarCodigo(data.current.weather_code);
  const alertasCamper = [];

  // Lógica de alertas camper dinámicas
  const rachaViento = data.current.wind_gusts_10m || data.current.wind_speed_10m;
  if (rachaViento >= 35) {
    alertasCamper.push({
      tipo: 'peligro_viento',
      nivel: 'critico',
      titulo: '¡Alerta de Viento Fuerte!',
      mensaje: `Ráfagas detectadas de ${rachaViento} km/h: Muy recomendable NO desplegar el toldo ni elevar techos tipo seta/elevables.`
    });
  } else if (rachaViento >= 22) {
    alertasCamper.push({
      tipo: 'aviso_viento',
      nivel: 'aviso',
      titulo: 'Viento Moderado',
      mensaje: `Viento de ${rachaViento} km/h: Si tienes el toldo abierto, asegúralo con cinchas o recógelo antes de marcharte.`
    });
  }

  if (data.current.temperature_2m <= 2) {
    alertasCamper.push({
      tipo: 'alerta_helada',
      nivel: 'critico',
      titulo: 'Riesgo de Heladas',
      mensaje: `Temperatura de ${data.current.temperature_2m}°C: Vacía el agua de mangueras exteriores y mantén la calefacción estática encendida.`
    });
  }

  if (data.current.weather_code === 0) {
    alertasCamper.push({
      tipo: 'carga_solar',
      nivel: 'info',
      titulo: 'Cielo Despejado',
      mensaje: 'Rendimiento solar óptimo: ideal para recargar al 100% baterías secundarias con tus placas.'
    });
  }

  return {
    actual: {
      temperatura: Math.round(data.current.temperature_2m),
      humedad: data.current.relative_humidity_2m,
      vientoVelocidad: Math.round(data.current.wind_speed_10m),
      vientoDireccion: data.current.wind_direction_10m,
      vientoRachas: Math.round(data.current.wind_gusts_10m),
      descripcion: currentInfo.texto,
      icono: currentInfo.icono,
    },
    diario: data.daily.time.slice(0, 5).map((fecha, idx) => ({
      fecha,
      max: Math.round(data.daily.temperature_2m_max[idx]),
      min: Math.round(data.daily.temperature_2m_min[idx]),
      amanecer: data.daily.sunrise[idx] ? data.daily.sunrise[idx].split('T')[1].slice(0, 5) : '',
      atardecer: data.daily.sunset[idx] ? data.daily.sunset[idx].split('T')[1].slice(0, 5) : '',
      lluviaProb: data.daily.precipitation_probability_max[idx],
      rachasMax: Math.round(data.daily.wind_gusts_10m_max[idx]),
      clima: interpretarCodigo(data.daily.weather_code[idx]),
    })),
    alertasCamper
  };
}