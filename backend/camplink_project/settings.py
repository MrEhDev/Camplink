# Aquí configuro los parámetros globales del backend de Camplink para producción y desarrollo:
# base de datos híbrida (PostgreSQL en Docker / SQLite en local), CORS/CSRF para la SPA React,
# autenticación de exploradores, correo SMTP y optimización de estáticos con WhiteNoise.

import os
from pathlib import Path
from dotenv import load_dotenv

# Ruta base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

# Carga de variables de entorno desde .env si existe localmente
load_dotenv(BASE_DIR / '.env')
load_dotenv(BASE_DIR.parent / '.env')

# Clave secreta criptográfica
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-camplink-super-secret-key-2026')

# Modo de depuración (False en producción)
DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

# Hosts permitidos
hosts_env = os.environ.get('DJANGO_ALLOWED_HOSTS', '')
if hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in hosts_env.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = [
        'camplinkapp.com',
        'www.camplinkapp.com',
        '178.62.57.10',
        'localhost',
        '127.0.0.1',
        'backend',
        '*'
    ]

# Ruta personalizada y segura del panel de administración
ADMIN_URL = os.environ.get('DJANGO_ADMIN_URL', 'panel-camplink-gestion/').strip('/') + '/'

# Aplicaciones instaladas del sistema y módulos camper
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sitemaps',

    # Dependencias de terceros
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',

    # Aplicaciones del dominio de negocio Camplink
    'exploradores.apps.ExploradoresConfig',
    'lugares.apps.LugaresConfig',
    'diario.apps.DiarioConfig',
    'viajes.apps.ViajesConfig',
    'comunidad.apps.ComunidadConfig',
]

# Middlewares de seguridad, sesiones, compresión estática y CORS
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Cabecera de proxy inverso SSL para Cloudflare / Nginx
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

ROOT_URLCONF = 'camplink_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'camplink_project.wsgi.application'

# Configuración de base de datos: PostgreSQL si se definen variables de entorno, o SQLite en local
if os.environ.get('POSTGRES_DB'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('POSTGRES_DB', 'camplink_db'),
            'USER': os.environ.get('POSTGRES_USER', 'camplink_user'),
            'PASSWORD': os.environ.get('POSTGRES_PASSWORD', ''),
            'HOST': os.environ.get('POSTGRES_HOST', 'db'),
            'PORT': os.environ.get('POSTGRES_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Modelo de usuario personalizado: Explorador
AUTH_USER_MODEL = 'exploradores.Explorador'

# Validadores de contraseñas
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 6}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Configuración regional e internacionalización
LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'Europe/Madrid'
USE_I18N = True
USE_TZ = True

# Archivos estáticos y multimedia
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Configuración de Django REST Framework (sin paginación global para servir todos los puntos del mapa y listas completas a la SPA)
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
}

# Configuración de CORS y CSRF para producción y desarrollo local
CORS_ALLOWED_ORIGINS = [
    'https://camplinkapp.com',
    'https://www.camplinkapp.com',
    'http://camplinkapp.com',
    'http://www.camplinkapp.com',
    'http://178.62.57.10',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.localtunnel\.me$",
    r"^https://.*\.trycloudflare\.com$",
    r"^https://.*\.ngrok-free\.app$",
    r"^https://.*\.ngrok\.io$",
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    'https://camplinkapp.com',
    'https://www.camplinkapp.com',
    'http://camplinkapp.com',
    'http://www.camplinkapp.com',
    'http://178.62.57.10',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://*.localtunnel.me',
    'https://*.trycloudflare.com',
    'https://*.ngrok-free.app',
    'https://*.ngrok.io',
]
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SAMESITE = 'Lax'

# Configuración de Envío de Correos Electrónicos (Gmail SMTP)
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_USE_SSL = os.environ.get('EMAIL_USE_SSL', 'False') == 'True'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER or 'Camplink <noreply@camplinkapp.com>')
EMAIL_TIMEOUT = 5

default_backend = 'django.core.mail.backends.smtp.EmailBackend' if (EMAIL_HOST_USER and EMAIL_HOST_PASSWORD) else 'django.core.mail.backends.console.EmailBackend'
EMAIL_BACKEND = os.environ.get('DJANGO_EMAIL_BACKEND', default_backend)
