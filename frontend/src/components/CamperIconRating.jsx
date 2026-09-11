// Aquí creo el componente reutilizable de valoración con iconos camper (1 a 5 furgonetas o tiendas),
// permitiendo tanto modo interactivo de selección como modo de solo lectura.

import React, { useState } from 'react';

export default function CamperIconRating({ valor = 0, onChange = null, soloLectura = false, tamaño = 'normal' }) {
  // Aquí dibujo los 5 iconos camper y gestiono el evento de selección
  const iconos = [1, 2, 3, 4, 5];
  const estiloTamaño = tamaño === 'grande' ? '1.8rem' : tamaño === 'pequeño' ? '1.1rem' : '1.4rem';
  const [hover, setHover] = useState(0);

  return (
    <div className="camper-rating-selector" style={{ display: 'inline-flex', gap: '4px' }}>
      {iconos.map((num) => {
        const activo = num <= (hover || Math.round(valor));
        return (
          <span
            key={num}
            onClick={() => !soloLectura && onChange && onChange(num)}
            onMouseEnter={() => !soloLectura && setHover(num)}
            onMouseLeave={() => !soloLectura && setHover(0)}
            className={`camper-van-icon ${activo ? 'active' : 'inactive'}`}
            style={{
              fontSize: estiloTamaño,
              cursor: soloLectura ? 'default' : 'pointer',
              opacity: activo ? 1 : 0.28,
              filter: activo ? 'none' : 'grayscale(100%)',
              transition: 'transform 0.15s ease, opacity 0.15s ease, filter 0.15s ease',
              display: 'inline-block',
              transform: hover === num && !soloLectura ? 'scale(1.25)' : 'scale(1)',
            }}
            title={`${num} de 5 furgonetas camper`}
          >
            🚐
          </span>
        );
      })}
    </div>
  );
}