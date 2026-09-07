// Aquí gestiono el estado global de autenticación del Explorador en la SPA,
// permitiendo inicio de sesión tradicional, registro, cierre de sesión y carga de perfil.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { peticionApi, asegurarCsrfToken } from '../services/api';

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

  const login = async (username, password) => {
    // Conversión obligatoria de usuario a minúsculas
    const usuarioLimpio = String(username || '').trim().toLowerCase();
    const res = await peticionApi('/api/exploradores/login/', {
      method: 'POST',
      body: { username: usuarioLimpio, password }
    });
    setUsuario(res.usuario);
    return res;
  };

  const registro = async (formData) => {
    // Conversión obligatoria de usuario a minúsculas en registro
    if (formData instanceof FormData) {
      const u = formData.get('username');
      if (u) formData.set('username', String(u).trim().toLowerCase());
    } else if (formData && formData.username) {
      formData.username = String(formData.username).trim().toLowerCase();
    }

    const res = await peticionApi('/api/exploradores/registro/', {
      method: 'POST',
      body: formData
    });
    setUsuario(res.usuario);
    return res;
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
    <AuthContext.Provider value={{ usuario, cargando, login, registro, logout, cargarPerfil, recuperarPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  // Aquí expongo el hook para consumir los métodos de autenticación en las vistas
  return useContext(AuthContext);
};