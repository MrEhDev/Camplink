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

  // Si enviamos JSON y no es FormData
  if (opciones.body && !(opciones.body instanceof FormData) && typeof opciones.body === 'object') {
    headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(opciones.body);
  }

  const configuracion = {
    credentials: 'include',
    ...opciones,
    headers,
  };

  const respuesta = await fetch(endpoint, configuracion);

  if (!respuesta.ok) {
    let errorData = {};
    try {
      errorData = await respuesta.json();
    } catch {
      errorData = { error: respuesta.statusText };
    }
    const err = new Error(errorData.error || errorData.detail || 'Error en la petición');
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