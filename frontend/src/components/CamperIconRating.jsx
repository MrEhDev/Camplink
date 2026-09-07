// Aquí creo el componente reutilizable de valoración con iconos camper (1 a 5 furgonetas o tiendas),
// permitiendo tanto modo interactivo de selección como modo de solo lectura.

import React from 'react';

export default function CamperIconRating({ valor = 5, onChange = null, soloLectura = false, tamaño = 'normal' }) {
  // Aquí dibujo los 5 iconos camper y gestiono el evento de selección
  const iconos = [1, 2, 3, 4, 5];
  const estiloTamaño = tamaño === 'grande' ? '1.8rem' : tamaño === 'pequeño' ? '1.1rem' : '1.4rem';

  return (
    <div className="camper-rating-selector" style={{ display: 'inline-flex', gap: '4px' }}>
      {iconos.map((num) => {
        const activo = num <= Math.round(valor);
        return (
          <span
            key={num}
            onClick={() => !soloLectura && onChange && onChange(num)}
            className={`camper-van-icon ${activo ? 'active' : 'inactive'}`}
            style={{
              fontSize: estiloTamaño,
              cursor: soloLectura ? 'default' : 'pointer',
              opacity: activo ? 1 : 0.35,
              transition: 'transform 0.15s ease',
              display: 'inline-block',
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