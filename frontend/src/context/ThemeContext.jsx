// Aquí gestiono los modos de visualización visual: Claro, Oscuro y Puesta de Sol,
// integrando la sincronización solar con la API meteorológica para el modo crepuscular automático.

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Aquí inicializo el tema seleccionado desde el almacenamiento local
  const [tema, setTema] = useState(() => {
    return localStorage.getItem('camplink_theme') || 'claro';
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
    localStorage.setItem('camplink_theme', tema);
  }, [tema, puestaDeSolHora]);

  const cambiarTema = (nuevoTema) => {
    // Aquí cambio manualmente el modo de pantalla seleccionado
    setTema(nuevoTema);
  };

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