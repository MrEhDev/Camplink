// Utilidad universal para compresión de imágenes del lado del cliente en Camplink
// Reduce fotos tomadas con móviles (de 5MB-15MB a unos ~150KB-350KB) antes de subirlas al servidor,
// acelerando la transferencia y ahorrando ancho de banda sin pérdida visible de calidad.

export async function comprimirImagen(archivo, opciones = {}) {
  if (!archivo || !archivo.type.startsWith('image/')) {
    return archivo;
  }

  const {
    maxAncho = 1600,
    maxAlto = 1600,
    calidad = 0.82,
    tipoSalida = 'image/jpeg'
  } = opciones;

  // Si el archivo ya es muy pequeño (<150KB), no es necesario recomprimir
  if (archivo.size < 150 * 1024) {
    return archivo;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(archivo);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let ancho = img.width;
        let alto = img.height;

        // Calcular nuevas dimensiones manteniendo la relación de aspecto
        if (ancho > maxAncho || alto > maxAlto) {
          if (ancho / maxAncho > alto / maxAlto) {
            alto = Math.round((alto * maxAncho) / ancho);
            ancho = maxAncho;
          } else {
            ancho = Math.round((ancho * maxAlto) / alto);
            alto = maxAlto;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = ancho;
        canvas.height = alto;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve(archivo);
        }

        // Calidad alta de interpolación
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, ancho, alto);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(archivo);
            }
            // Crear nuevo objeto File con el nombre original o extensión adaptada
            const nombreBase = archivo.name.replace(/\.[^/.]+$/, '');
            const extension = tipoSalida === 'image/webp' ? '.webp' : '.jpg';
            const nuevoArchivo = new File([blob], `${nombreBase}${extension}`, {
              type: tipoSalida,
              lastModified: Date.now()
            });

            // Si la compresión resultó ser más pesada que el original, devolver el original
            if (nuevoArchivo.size >= archivo.size) {
              resolve(archivo);
            } else {
              resolve(nuevoArchivo);
            }
          },
          tipoSalida,
          calidad
        );
      };
      img.onerror = () => resolve(archivo);
    };
    reader.onerror = () => resolve(archivo);
  });
}

// Compresor específico para fotos de opiniones y reseñas (máximo 1200px)
export async function comprimirFotoOpinion(archivo) {
  return comprimirImagen(archivo, {
    maxAncho: 1200,
    maxAlto: 1200,
    calidad: 0.80,
    tipoSalida: 'image/jpeg'
  });
}

// Compresor específico para foto de perfil (1:1 500x500)
export async function comprimirFotoPerfil(blobOArchivo) {
  return comprimirImagen(blobOArchivo, {
    maxAncho: 500,
    maxAlto: 500,
    calidad: 0.85,
    tipoSalida: 'image/jpeg'
  });
}
