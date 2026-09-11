# Aquí defino la imagen Docker del backend de Camplink basada en Python 3.12 y Debian Slim
FROM python:3.12-slim

# Aquí configuro variables de entorno para evitar buffering en logs y no generar archivos .pyc
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Aquí establezco el directorio de trabajo dentro del contenedor
WORKDIR /app

# Aquí instalo dependencias del sistema necesarias para PostgreSQL (libpq-dev) y compresión de imágenes (Pillow)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Aquí copio los requerimientos e instalo las dependencias de Python
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Aquí copio todo el código fuente del backend
COPY . /app/

# Aquí compilo los archivos estáticos de Django y de la administración con WhiteNoise
RUN python manage.py collectstatic --noinput || true

# Aquí expongo el puerto 8000 para Gunicorn
EXPOSE 8000

# Aquí ejecuto las migraciones, importo el catálogo de lugares y arranco el servidor de aplicaciones
CMD ["sh", "-c", "python manage.py migrate && python manage.py loaddata fixtures/lugares_iniciales.json || true && python manage.py loaddata fixtures/comunidad_inicial.json || true && python poblar_exploradores_produccion.py || true && gunicorn camplink_project.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120"]
