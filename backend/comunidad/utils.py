# Aquí implemento utilidades de optimización y compresión de imágenes con Pillow
# i postriormente para reducir disco en servidor.

import io
import os
from PIL import Image, ImageOps
from django.core.files.base import ContentFile

def optimizar_imagen(archivo_imagen, max_dimension=1600, calidad=82, formato='WEBP'):
    """
    Toma un archivo de imagen subido (UploadedFile o ImageField),
    lo reorienta según EXIF, lo redimensiona si supera max_dimension
    y lo comprime en formato WEBP o JPEG para ahorrar espacio.
    """
    if not archivo_imagen:
        return archivo_imagen

    try:
        nombre_original = getattr(archivo_imagen, 'name', '')
        if not nombre_original:
            return archivo_imagen

        img = Image.open(archivo_imagen)
        img = ImageOps.exif_transpose(img)

        formato_up = formato.upper()
        if formato_up in ['JPEG', 'JPG'] and img.mode in ('RGBAE', 'LA', 'P'):
            img = img.convert('RGB')
        elif formato_up == 'WEBP' and img.mode in ('LA', 'P'):
            img = img.convert('RGBA')

        ancho, alto = img.size
        if ancho > max_dimension or alto > max_dimension:
            if ancho >= alto:
                nuevo_ancho = max_dimension
                nuevo_alto = int(alto * (max_dimension / ancho))
            else:
                nuevo_alto = max_dimension
                nuevo_ancho = int(ancho * (max_dimension / alto))
            img = img.resize((nuevo_ancho, nuevo_alto), Image.Resampling.LANCZOS)

        buffer = io.BytesIO()
        nombre_base, _ = os.path.splitext(os.path.basename(nombre_original))
        
        formato_guardado = 'JPEG' if formato_up in ['JPG', 'JPEG'] else 'WEBP'
        img.save(buffer, format=formato_guardado, quality=calidad, optimize=True)
        buffer.seek(0)

        extension = '.webp' if formato_guardado == 'WEBP' else '.jpg'
        nuevo_nombre = f"{nombre_base}{extension}"

        return ContentFile(buffer.read(), name=nuevo_nombre)
    except Exception as e:
        print("Aviso al optimizar imagen:", e)
        return archivo_imagen
