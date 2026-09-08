// Aquí configuro el contexto de internacionalización (i18n) para permitir cambiar
// dinámicamente entre español e inglés en toda la plataforma Camplink.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { es } from './es';
import { en } from './en';

const LanguageContext = createContext();

export const formatearFecha = (fecha, idioma = null) => {
  if (!fecha) return '';
  const langActivo = idioma || localStorage.getItem('camplink_lang') || 'es';
  if (typeof fecha === 'string') {
    const soloFecha = fecha.split('T')[0];
    const partes = soloFecha.split('-');
    if (partes.length === 3) {
      const [yyyy, mm, dd] = partes;
      return langActivo === 'en' ? `${yyyy}-${mm}-${dd}` : `${dd}-${mm}-${yyyy}`;
    }
  }
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return String(fecha);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return langActivo === 'en' ? `${yyyy}-${mm}-${dd}` : `${dd}-${mm}-${yyyy}`;
};

export const LanguageProvider = ({ children }) => {
  // Aquí gestiono el idioma activo guardado en localStorage o detectado del navegador
  const [idioma, setIdioma] = useState(() => {
    return localStorage.getItem('camplink_lang') || 'es';
  });

  const traducciones = idioma === 'en' ? en : es;

  const cambiarIdioma = (nuevoIdioma) => {
    // Aquí actualizo el idioma activo y lo persisto para próximas visitas
    setIdioma(nuevoIdioma);
    localStorage.setItem('camplink_lang', nuevoIdioma);
  };

  const t = (clave, fallback = '') => {
    // Aquí busco la clave de traducción solicitada o devuelvo un texto de reserva
    return traducciones[clave] || fallback || clave;
  };

  const formatearFechaActual = (fecha) => formatearFecha(fecha, idioma);

  return (
    <LanguageContext.Provider value={{ idioma, cambiarIdioma, t, formatearFecha: formatearFechaActual }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  // Aquí expongo el hook personalizado para acceder a las traducciones en cualquier componente
  return useContext(LanguageContext);
};
