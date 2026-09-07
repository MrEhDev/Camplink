# Aquí defino la imagen Docker del backend de Camplink basada en Python y Linux Ubuntu/Debian
FROM python:3.12-slim

# Aquí configuro variables de entorno para evitar buffering en logs y no generar archivos .pyc
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Aquí establezco el directorio de trabajo dentro del contenedor
WORKDIR /app

# Aquí instalo dependencias del sistema necesarias para compilar Pillow y paquetes de red
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

# Aquí copio los requerimientos e instalo las dependencias de Python
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Aquí copio todo el código fuente del backend
COPY . /app/

# Aquí expongo el puerto 8000
EXPOSE 8000

# Aquí ejecuto las migraciones y levanto el servidor con Gunicorn
CMD ["sh", "-c", "python manage.py migrate && gunicorn camplink_project.wsgi:application --bind 0.0.0.0:8000 --workers 3"]