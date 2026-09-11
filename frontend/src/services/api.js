// Aquí centralizo la comunicación HTTP con la API REST de Django,
// gestionando cookies de sesión seguras, protección anti-CSRF y almacenamiento reactivo de tokens.

function obtenerCookie(nombre) {
  // Aquí extraigo el token CSRF de las cookies del navegador
  const valor = `; ${document.cookie}`;
  const partes = valor.split(`; ${nombre}=`);
  if (partes.length === 2) return partes.pop().split(';').shift();
  return null;
}

let csrfTokenCache = null;

export function actualizarCsrfToken(token) {
  // Aquí guardo en memoria el nuevo token CSRF emitido tras login o registro
  if (token) {
    csrfTokenCache = token;
  }
}

export async function asegurarCsrfToken() {
  // Aquí solicito el token CSRF inicial al backend si no lo tenemos aún
  const deCookie = obtenerCookie('csrftoken');
  if (deCookie) {
    csrfTokenCache = deCookie;
    return deCookie;
  }

  try {
    const res = await fetch('/api/exploradores/csrf/', { credentials: 'include' });
    const data = await res.json();
    csrfTokenCache = data.csrftoken || obtenerCookie('csrftoken');
  } catch (e) {
    console.warn('Error al obtener token CSRF:', e);
  }

  return csrfTokenCache;
}

export async function peticionApi(endpoint, opciones = {}) {
  // Aquí realizo una petición fetch inyectando cabeceras de CSRF y credenciales de sesión
  const token = await asegurarCsrfToken();
  const headers = {
    Accept: 'application/json',
    ...(opciones.headers || {}),
  };

  if (token && opciones.method && opciones.method !== 'GET') {
    headers['X-CSRFToken'] = token;
  }

  // Soporte tanto para opciones.body como opciones.data
  if (opciones.data && !opciones.body) {
    opciones.body = opciones.data;
  }

  // Si enviamos cuerpo y no es FormData, asegurar Content-Type application/json
  if (opciones.body && !(opciones.body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    if (typeof opciones.body === 'object') {
      opciones.body = JSON.stringify(opciones.body);
    }
  }

  const configuracion = {
    credentials: 'include',
    ...opciones,
    headers,
  };

  // Normalizar endpoint para garantizar prefijo /api si fue omitido
  let urlFinal = endpoint;
  if (typeof urlFinal === 'string' && urlFinal.startsWith('/') && !urlFinal.startsWith('/api/') && !urlFinal.startsWith('/media/') && !urlFinal.startsWith('/static/')) {
    urlFinal = `/api${urlFinal}`;
  }

  let respuesta = await fetch(urlFinal, configuracion);

  // Si falla por 403 (posible expiración o rotación de CSRF tras login/activar), reintentar con token fresco
  if (respuesta.status === 403 && opciones.method && opciones.method !== 'GET') {
    try {
      const resCsrf = await fetch('/api/exploradores/csrf/', { credentials: 'include' });
      const dataCsrf = await resCsrf.json();
      const nuevoToken = dataCsrf.csrftoken || obtenerCookie('csrftoken');
      if (nuevoToken) {
        csrfTokenCache = nuevoToken;
        configuracion.headers['X-CSRFToken'] = nuevoToken;
        respuesta = await fetch(urlFinal, configuracion);
      }
    } catch {
      // Continuar con la respuesta original
    }
  }

  if (!respuesta.ok) {
    let errorData = {};
    try {
      errorData = await respuesta.json();
    } catch {
      errorData = { error: respuesta.statusText };
    }

    let mensajeError = errorData.error || errorData.detail;
    if (!mensajeError && typeof errorData === 'object' && errorData !== null) {
      const keys = Object.keys(errorData);
      if (keys.length > 0) {
        const field = keys[0];
        const val = errorData[field];
        const valStr = Array.isArray(val) ? val.join(', ') : String(val);
        const fieldNameMap = {
          username: 'Nombre de usuario',
          email: 'Correo electrónico',
          password: 'Contraseña',
          password_confirm: 'Confirmación de contraseña',
          non_field_errors: 'Error',
          detail: 'Detalle'
        };
        const nombreCampo = fieldNameMap[field] || field;
        mensajeError = `${nombreCampo}: ${valStr}`;
      }
    }

    const err = new Error(mensajeError || 'Error en la petición.');
    err.status = respuesta.status;
    err.data = errorData;
    throw err;
  }

  if (respuesta.status === 204) {
    return null;
  }

  const data = await respuesta.json();
  if (data && data.csrftoken) {
    actualizarCsrfToken(data.csrftoken);
  }
  return data;
}