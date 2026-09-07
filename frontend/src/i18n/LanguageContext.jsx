// Aquí configuro el contexto de internacionalización (i18n) para permitir cambiar
// dinámicamente entre español e inglés en toda la plataforma Camplink.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { es } from './es';
import { en } from './en';

const LanguageContext = createContext();

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

  return (
    <LanguageContext.Provider value={{ idioma, cambiarIdioma, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  // Aquí expongo el hook personalizado para acceder a las traducciones en cualquier componente
  return useContext(LanguageContext);
};