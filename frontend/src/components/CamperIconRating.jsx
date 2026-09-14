// Aquí creo el componente reutilizable de valoración con iconos camper (1 a 5 furgonetas o tiendas),
// permitiendo tanto modo interactivo de selección como modo de solo lectura.

import React, { useState } from 'react';

export default function CamperIconRating({ 
  valor = null, 
  rating = null, 
  onChange = null, 
  alCambiar = null, 
  soloLectura = false, 
  tamaño = 'normal',
  size = null,
  maxIcons = 5
}) {
  const valorEfectivo = Number(valor != null ? valor : (rating != null ? rating : 0)) || 0;
  const manejadorCambio = onChange || alCambiar;
  const tamañoEfectivo = size 
    ? (typeof size === 'number' ? `${size}px` : size) 
    : (tamaño === 'grande' ? '1.8rem' : tamaño === 'pequeño' ? '1.1rem' : '1.4rem');

  const iconos = Array.from({ length: maxIcons }, (_, i) => i + 1);
  const [hover, setHover] = useState(0);

  return (
    <div className="camper-rating-selector" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
      {iconos.map((num) => {
        const activo = num <= (hover || Math.round(valorEfectivo));
        return (
          <span
            key={num}
            onClick={() => !soloLectura && manejadorCambio && manejadorCambio(num)}
            onMouseEnter={() => !soloLectura && setHover(num)}
            onMouseLeave={() => !soloLectura && setHover(0)}
            className={`camper-van-icon ${activo ? 'active' : 'inactive'}`}
            style={{
              fontSize: tamañoEfectivo,
              lineHeight: 1,
              cursor: soloLectura ? 'default' : 'pointer',
              opacity: activo ? 1 : 0.28,
              filter: activo ? 'none' : 'grayscale(100%)',
              transition: 'transform 0.15s ease, opacity 0.15s ease, filter 0.15s ease',
              display: 'inline-block',
              transform: hover === num && !soloLectura ? 'scale(1.25)' : 'scale(1)',
            }}
            title={`${num} de ${maxIcons} furgonetas camper`}
          >
            🚐
          </span>
        );
      })}
    </div>
  );
}