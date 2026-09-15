// Aquí gestiono el estado global de autenticación del Explorador en la SPA,
// permitiendo inicio de sesión tradicional, registro, cierre de sesión y carga de perfil.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { peticionApi, asegurarCsrfToken, actualizarCsrfToken } from '../services/api';
import { sincronizarPushSiPermitido } from '../utils/webPush';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Aquí mantengo el estado reactivo del usuario y el estado de carga
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarPerfil = async () => {
    // Aquí compruebo si el usuario ya tiene una sesión activa mediante cookies
    try {
      await asegurarCsrfToken();
      const datos = await peticionApi('/api/exploradores/perfil/');
      setUsuario(datos);
    } catch {
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // Al montar la aplicación verifico la sesión
    cargarPerfil();
  }, []);

  useEffect(() => {
    if (usuario) {
      sincronizarPushSiPermitido();
    }
  }, [usuario]);

  const login = async (username, password) => {
    // Conversión obligatoria de usuario a minúsculas y eliminación total de espacios en blanco
    const usuarioLimpio = String(username || '').replace(/\s+/g, '').toLowerCase();
    const passLimpio = String(password || '').replace(/\s+/g, '');
    const res = await peticionApi('/api/exploradores/login/', {
      method: 'POST',
      body: { username: usuarioLimpio, password: passLimpio }
    });
    if (res && res.csrftoken) {
      actualizarCsrfToken(res.csrftoken);
    }
    setUsuario(res.usuario);
    return res;
  };

  const registro = async (formData) => {
    // Conversión obligatoria de usuario a minúsculas y eliminación total de espacios en blanco
    if (formData instanceof FormData) {
      const u = formData.get('username');
      if (u) formData.set('username', String(u).replace(/\s+/g, '').toLowerCase());
      const p = formData.get('password');
      if (p) formData.set('password', String(p).replace(/\s+/g, ''));
      const pc = formData.get('password_confirm');
      if (pc) formData.set('password_confirm', String(pc).replace(/\s+/g, ''));
    } else if (formData) {
      if (formData.username) formData.username = String(formData.username).replace(/\s+/g, '').toLowerCase();
      if (formData.password) formData.password = String(formData.password).replace(/\s+/g, '');
      if (formData.password_confirm) formData.password_confirm = String(formData.password_confirm).replace(/\s+/g, '');
    }

    const res = await peticionApi('/api/exploradores/registro/', {
      method: 'POST',
      body: formData
    });
    if (res && res.usuario && !res.requiere_verificacion) {
      setUsuario(res.usuario);
    }
    return res;
  };

  const activarCuenta = async ({ email, codigo, uid, token, autoLogin = true }) => {
    const res = await peticionApi('/api/exploradores/activar-cuenta/', {
      method: 'POST',
      body: {
        email: email ? String(email).trim().toLowerCase() : '',
        codigo: codigo ? String(codigo).trim() : '',
        uid: uid ? String(uid).trim() : '',
        token: token ? String(token).trim() : ''
      }
    });
    if (res && res.csrftoken) {
      actualizarCsrfToken(res.csrftoken);
    }
    if (res && res.usuario && autoLogin) {
      setUsuario(res.usuario);
    }
    return res;
  };

  const establecerUsuario = (nuevoUsuario) => {
    setUsuario(nuevoUsuario);
  };

  const reenviarCodigo = async (email) => {
    return await peticionApi('/api/exploradores/reenviar-codigo/', {
      method: 'POST',
      body: { email: String(email || '').trim().toLowerCase() }
    });
  };

  const recuperarPassword = async (emailOUsuario) => {
    return await peticionApi('/api/exploradores/recuperar-password/', {
      method: 'POST',
      body: { email_o_usuario: String(emailOUsuario || '').trim().toLowerCase() }
    });
  };

  const logout = async () => {
    // Aquí cierro la sesión en el servidor y limpio el estado local
    try {
      await peticionApi('/api/exploradores/logout/', { method: 'POST' });
    } finally {
      setUsuario(null);
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, registro, activarCuenta, reenviarCodigo, logout, cargarPerfil, recuperarPassword, establecerUsuario }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  // Aquí expongo el hook para consumir los métodos de autenticación en las vistas
  return useContext(AuthContext);
};