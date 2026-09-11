// Aquí gestiono los modos de visualización visual: Claro, Oscuro y Puesta de Sol,
// integrando la sincronización solar con la API meteorológica para el modo crepuscular automático.

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Aquí inicializo el tema según: localStorage > preferencia del sistema > puesta_de_sol por defecto
  const [temaManual, setTemaManual] = useState(() => {
    // Si el usuario ya eligió un tema explícitamente, respetarlo
    return localStorage.getItem('camplink_theme_manual') || null;
  });

  const detectarTemaDelSistema = () => {
    // Sistema oscuro -> Modo Noche; Sistema claro -> Puesta de Sol (según especificación)
    const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefiereOscuro ? 'oscuro' : 'puesta_de_sol';
  };

  const [tema, setTema] = useState(() => {
    const guardado = localStorage.getItem('camplink_theme_manual');
    if (guardado) return guardado;
    // Retrocompatibilidad: leer el campo antiguo si existe
    const legado = localStorage.getItem('camplink_theme');
    if (legado) {
      // Migrar al nuevo campo y eliminar el viejo
      localStorage.setItem('camplink_theme_manual', legado);
      localStorage.removeItem('camplink_theme');
      return legado;
    }
    return detectarTemaDelSistema();
  });

  const [puestaDeSolHora, setPuestaDeSolHora] = useState(null);

  useEffect(() => {
    // Aquí compruebo periódicamente la hora de puesta de sol si el usuario eligió el modo automático
    const consultarPuestaSol = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.4168&longitude=-3.7038&daily=sunset,sunrise&timezone=auto');
        if (res.ok) {
          const data = await res.json();
          if (data.daily && data.daily.sunset && data.daily.sunset.length > 0) {
            setPuestaDeSolHora(new Date(data.daily.sunset[0]));
          }
        }
      } catch (err) {
        console.warn('No se pudo obtener la hora solar de Open-Meteo:', err);
      }
    };

    consultarPuestaSol();
  }, []);

  useEffect(() => {
    // Aquí aplico la clase correspondiente al elemento raíz HTML
    let temaEfectivo = tema;

    if (tema === 'puesta_de_sol') {
      const ahora = new Date();
      if (puestaDeSolHora && ahora >= puestaDeSolHora) {
        temaEfectivo = 'puesta_de_sol';
      } else {
        const horaActual = ahora.getHours();
        // Si no hay dato de la API pero es tarde (después de las 19:30 o antes de las 7:30)
        if (horaActual >= 19 || horaActual < 8) {
          temaEfectivo = 'puesta_de_sol';
        } else {
          temaEfectivo = 'claro';
        }
      }
    }

    document.documentElement.setAttribute('data-theme', temaEfectivo);
    // El guardado del tema manual ya lo hace cambiarTema(); aquí solo aplicamos data-theme.
  }, [tema, puestaDeSolHora]);

  const cambiarTema = (nuevoTema) => {
    // Aquí cambio manualmente el modo de pantalla seleccionado y lo persisto como preferencia manual
    setTema(nuevoTema);
    setTemaManual(nuevoTema);
    localStorage.setItem('camplink_theme_manual', nuevoTema);
    // Eliminar campo legado si existe
    localStorage.removeItem('camplink_theme');
  };

  // Escuchar cambios de tema del sistema en tiempo real (solo si el usuario no eligió manualmente)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const manejarCambioSistema = (e) => {
      // Solo actualizar si el usuario NO ha elegido un tema manualmente
      const manual = localStorage.getItem('camplink_theme_manual');
      if (!manual) {
        setTema(e.matches ? 'oscuro' : 'puesta_de_sol');
      }
    };
    mq.addEventListener('change', manejarCambioSistema);
    return () => mq.removeEventListener('change', manejarCambioSistema);
  }, []);

  return (
    <ThemeContext.Provider value={{ tema, cambiarTema, puestaDeSolHora }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  // Aquí expongo el hook para consumir el tema en los componentes
  return useContext(ThemeContext);
};