# Memoria Técnica del Proyecto: Camplink
## Plataforma Web Integral (SPA/PWA) y Red Social para la Comunidad Camper, Autocaravanista y Nómada

* **Dominio Oficial de Producción:** [https://camplinkapp.com](https://camplinkapp.com)
* **Correo de Soporte y Comunicaciones Oficiales:** hola@camplinkapp.com (enrutado a camplink.app.info@gmail.com)
* **Documento para Defensa de Proyecto Final de Máster Full Stack**
* **Autor y Desarrollador:** Eleazar
* **Versión de la Memoria:** 5.0 (Edición Definitiva con Soporte PWA, Web Push y UX Móvil Avanzada)
* **Fecha:** Septiembre de 2026

---

## 1. Resumen Ejecutivo y Guion de Presentación (Pitch)

### 1.1. El Ascensor / Elevator Pitch
> *"Camplink es el primer ecosistema digital integral (SPA/PWA instalable) que unifica cartografía geoespacial especializada en turismo itinerante, cálculo de autonomía vial predictiva según el depósito y consumo del vehículo, red social vertical georreferenciada con compresión multimedia en el cliente, herramientas 3D interactivas para camperización, notificaciones Web Push nativas en segundo plano y un radar nómada en tiempo real con precios oficiales de combustible y servicios esenciales. Todo desarrollado bajo una arquitectura desacoplada, Mobile-First y con un diseño Glassmorphism de alto contraste optimizado para cualquier dispositivo."*

### 1.2. Planteamiento del Problema en el Mercado Actual
El sector del turismo itinerante (furgonetas camper, autocaravanas, caravanas y vehículos overland) ha experimentado un crecimiento superior al 120% en Europa en el último lustro. No obstante, el usuario se encuentra con un escenario fragmentado y deficiente:
1. **Dispersión de la Información:** Las aplicaciones convencionales de mapas (Google Maps, Waze) asumen turismos ligeros: ignoran gálibos, dimensiones de acceso, desniveles y la compleja normativa municipal sobre qué constituye *pernocta legal* frente a *acampada ilegal*.
2. **Inseguridad en Autonomía y Servicios Esenciales:** Viajar a zonas montañosas o rurales remotas con un vehículo pesado de gran consumo acarrea el riesgo continuo de quedarse sin combustible o llegar a áreas sin agua potable, vaciado de aguas residuales o electricidad.
3. **Desconexión Comunitaria y Alertas en Ruta:** La comunidad camper requiere compartir avisos en tiempo real sobre accesos bloqueados, cierres temporales o masificación sin depender de foros obsoletos o grupos dispersos.
4. **Falta de Recursos Técnicos para la Camperización:** Diseñar una instalación eléctrica solar de 12V/230V o aislar térmicamente un vehículo exige cálculos de sección de cable, caída de tensión y balances energéticos que hasta hoy no contaban con simuladores visuales didácticos.

### 1.3. Propuesta de Valor y Solución de Camplink
Camplink soluciona esta fragmentación mediante un centro de operaciones digital único:
* **Cartografía Inteligente con 6 Tipologías Normalizadas:** Pernocta Libre, Áreas de Autocaravanas, Campings, Parkings Urbanos, Áreas Recreativas y Puntos Solo Servicios; apoyada por 5 capas temáticas (Relieve, Satélite, OpenStreetMap, Lluvia en tiempo real y Contaminación Lumínica).
* **Radar Nómada en Vivo:** Conexión directa a la API del Ministerio para la Transición Ecológica y el Reto Demográfico (MITECO) para consultar las gasolineras más baratas en un radio personalizable (5 a 50 km) y deep-linking inteligente a servicios esenciales en navegador sin fricción lingüística.
* **Algoritmo de Autonomía Vial:** Cálculo del kilometraje vial acumulado y alerta preventiva cuando un tramo supere el 80% de la capacidad del depósito con reinicio automático de consumo en paradas de repostaje.
* **Red Social Vertical (Diario de Ruta):** Feed social con compresión de imágenes en el cliente (reducción del 95% de peso), reacciones nómadas, moderación y vinculación bidireccional entre relatos y fichas de lugares.
* **Taller Nómada 3D:** Maqueta interactiva en Three.js con capas desmontables de aislamiento, electricidad, fontanería y mobiliario, junto a calculadoras de Amperios-hora y sección de cable.
* **PWA Instalable y Notificaciones Web Push (VAPID):** Capacidad de instalación nativa en escritorio y móvil, con Service Worker y avisos push para interacciones comunitarias y alertas.
* **Tour Guiado Interactivo:** Sistema de bienvenida integrado para familiarizar a nuevos exploradores con las herramientas clave de la plataforma.
* **Gamificación y Vitrina de Trofeos:** Más de 65 hitos desbloqueables que reconocen la actividad del explorador en ruta, comunidad y taller.

---

## 2. Arquitectura Global del Sistema

El proyecto está diseñado bajo un modelo de **Arquitectura Desacoplada (Decoupled Client-Server)**, garantizando independencia absoluta entre la interfaz reactiva del usuario y la lógica de negocio del servidor.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CAPA CLIENTE (FRONTEND)                           │
│   React 18 + Vite 5 + PWA Service Worker + Vanilla CSS (Glassmorphism)      │
│                                                                             │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────┐  │
│  │    Cartografía Web    │ │    Gráficos 3D WebGL  │ │  Multimedia/Canvas│  │
│  │   Leaflet + OpenTopo  │ │  Three.js + OrbitCtrl │ │ Client Compressor │  │
│  │  OpenWeather + NASA   │ │  Shaders + Luces PBR  │ │  1:1 Avatar Crop  │  │
│  └───────────────────────┘ └───────────────────────┘ └───────────────────┘  │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────┐  │
│  │   Service Worker PWA  │ │  Web Push Client API  │ │ Onboarding Tour   │  │
│  │   Offline Caching     │ │  VAPID Subscription   │ │ Tutorial Modal    │  │
│  └───────────────────────┘ └───────────────────────┘ └───────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Gestión de Estado Global (React Context API):                          │  │
│  │ - AuthContext: Sesión, Tokens JWT/DRF, Roles, Datos Vehículo          │  │
│  │ - ThemeContext: Modos Claro, Oscuro y Puesta de Sol Solar             │  │
│  │ - LanguageContext: Motor i18n reactivo (Español / English)            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Peticiones HTTPS Asíncronas (REST API)
                                       │ Autenticación por Token en Cabeceras
                                       │ Serialización JSON + Multipart/Form-Data
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                           CAPA SERVIDOR (BACKEND)                           │
│        Python 3.12 + Django 5.1 + Django REST Framework (DRF 3.17)          │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Módulos / Aplicaciones Django Modulares:                              │  │
│  │ - exploradores: Usuarios, Vehículos, Privacidad, Web Push VAPID       │  │
│  │ - lugares: 1.200+ Pernoctas (España, Francia, Portugal, Italia...),   │  │
│  │   Fotos, Reseñas, Notas Personales y Servicios                        │  │
│  │ - viajes: Planificación, Algoritmo Autonomía, Catálogo 65 Trofeos     │  │
│  │ - diario: Feed Social, Comentarios, Reacciones, Check-ins             │  │
│  │ - comunidad: Foro Taller Nómada, Guías de Ruta y Recursos STL         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Servicios Auxiliares Backend:                                         │  │
│  │ - pywebpush: Cifrado y despacho de notificaciones push VAPID          │  │
│  │ - Pillow Engine: Normalización y compresión de imágenes               │  │
│  │ - Brevo / Gmail SMTP Gateway: Correos transaccionales y recuperación  │  │
│  │ - CORS Headers Middleware: Seguridad de origen cruzado estricta      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ ORM Django / QuerySets Optimizados
                                       │ Transacciones ACID
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                           CAPA DE PERSISTENCIA                              │
│  Base de Datos Relacional SQLite 3 (Desarrollo/Testing) / PostgreSQL (Prod) │
│  Fixtures JSON normalizados + Almacenamiento Media Persistente              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Stack Tecnológico Detallado y Justificación

### 3.1. Frontend
| Tecnología | Versión | Rol en el Proyecto | Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **React** | `18.3.1` | Librería Base UI | Modelo de componentes declarativos, hooks avanzados (`useMemo`, `useCallback`, `useRef`), renderizado concurrente y Virtual DOM de alto rendimiento. |
| **Vite** | `5.4.8` | Entorno de Compilación y Bundler | Sustituto moderno de Webpack basado en Rollup y esbuild. Tiempos de arranque en milisegundos y Hot Module Replacement (HMR) instantáneo. |
| **PWA & Service Worker** | W3C Standard | Instalabilidad y Background Tasks | Manifiesto web (`manifest.webmanifest`) y Service Worker (`sw.js`) con soporte de instalación PWA en escritorio y smartphone, y gestión de eventos `push` y `notificationclick`. |
| **Leaflet** | `1.9.4` | Motor Cartográfico | Librería ligera, open-source y adaptable para mapas interactivos móviles sin sobrecostes por uso de API propietaria. |
| **Three.js** | `0.160.0` | Gráficos 3D WebGL | Motor de aceleración por hardware para renderizar la camper tridimensional interactiva con materiales MeshStandardMaterial y sombras dinámicas. |
| **Lucide React** | `0.344.0` | Iconografía Vectorial | Más de 50 iconos SVG coherentes, limpios y con soporte para colores temáticos CSS. |
| **jsPDF** | `2.5.1` | Generación Documental | Creación en tiempo de ejecución del Cuaderno de Bitácora y Hoja de Ruta en PDF descargable sin requerir procesamiento en backend. |
| **Canvas Confetti** | `1.9.4` | Microinteracciones | Efectos visuales de celebración al desbloquear trofeos o completar itinerarios de viaje. |
| **Vanilla CSS** | W3C Native | Sistema de Diseño | Máximo rendimiento sin sobrecargas de frameworks externos. Empleo de variables CSS, Flexbox, CSS Grid y efectos de cristal esmerilado (`backdrop-filter: blur()`). |

### 3.2. Backend
| Tecnología | Versión | Rol en el Proyecto | Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **Python** | `3.12.3` | Lenguaje de Programación | Robustez, sintaxis limpia, amplia disponibilidad de librerías científicas y matemáticas y tipado seguro. |
| **Django** | `5.1.0` | Framework Web de Alto Nivel | Arquitectura batteries-included: ORM potente, panel de administración nativo, gestión de migraciones automática y altos estándares de seguridad contra inyecciones SQL y XSS. |
| **Django REST Framework** | `3.17.0` | Construcción de APIs RESTful | Serializadores declarativos con validación multinivel, permisos basados en clases (`IsAuthenticatedOrReadOnly`), paginación y negociación de contenidos JSON. |
| **pywebpush** | `1.14.0` | Notificaciones Web Push | Cifrado y envío de notificaciones push estándar según RFC 8291 y RFC 8292 mediante protocolo VAPID. |
| **Pillow** | `10.4.0` | Procesamiento de Imágenes | Manipulación de imágenes subidas en el servidor, validación de formatos MIME y optimización de ficheros binarios. |
| **Django CORS Headers**| `4.4.0` | Seguridad de Peticiones | Control exhaustivo de cabeceras Cross-Origin Resource Sharing para permitir conexiones controladas desde el frontend y túneles de prueba. |
| **Python-Dotenv** | `1.0.1` | Variables de Entorno | Segregación segura de credenciales, contraseñas de app SMTP y claves secretas del código fuente. |

---

## 4. Servicios Externos y APIs Integradas

1. **API de Precios de Hidrocarburos (MITECO - Gobierno de España):**
   * *Endpoint:* `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/`
   * *Funcionalidad:* Camplink consulta en tiempo real todas las gasolineras del país, filtrando por distancia euclidiana/Haversine y ordenando por precio según el combustible seleccionado (Gasóleo A, Gasolina 95, 98 o GLP).
2. **Open-Meteo API (Meteorología Abierta):**
   * *Endpoint:* `https://api.open-meteo.com/v1/forecast`
   * *Funcionalidad:* Información meteorológica precisa a 7 días en cada ficha de lugar sin requerir API key ni cuotas de pago: temperaturas mínimas y máximas, probabilidad de precipitación y velocidad máxima del viento (racha en km/h), vital para la seguridad en vehículos de gran superficie lateral.
3. **Nominatim OpenStreetMap (Geocodificación Inversa):**
   * *Endpoint:* `https://nominatim.openstreetmap.org/reverse`
   * *Funcionalidad:* Detección del municipio, provincia y código postal real a partir de las coordenadas GPS del explorador o del lugar seleccionado.
4. **Google Maps Universal URLs & Navigation Intent:**
   * *Sintaxis:* `https://www.google.com/maps/dir/?api=1&destination=lat,lng` y búsquedas zonales sanitizadas `https://www.google.com/maps/search/?api=1&query=servicio+en+municipio`.
   * *Funcionalidad:* Apertura con un solo toque del navegador GPS nativo del dispositivo del usuario (Google Maps en Android o iOS).
5. **Web Push API (VAPID / RFC 8291 & RFC 8292):**
   * *Protocolo:* Envío de notificaciones push firmadas criptográficamente desde el backend de Django hacia los servidores de mensajería (FCM / Mozilla Push Service / Apple Push Notification Service).
   * *Suscripciones:* Almacenadas en la base de datos mediante el modelo `SuscripcionWebPush`, asociadas al explorador y su User-Agent.
6. **Generador Dual de Eventos de Calendario (RFC 5545):**
   * *Google Calendar URL API:* Enlace de reserva directa con título, coordenadas y descripción.
   * *Apple / Outlook Calendar (.ics):* Creación dinámica en JavaScript de blobs MIME `text/calendar` siguiendo el estándar iCalendar para importar fechas de pernocta en el calendario nativo de iPhone, Mac o Windows.
7. **Brevo REST API (Mensajería Transaccional Segura sobre HTTPS):**
   * *Endpoint:* `https://api.brevo.com/v3/smtp/email`
   * *Funcionalidad:* Entrega instantánea (< 1 segundo) de correos transaccionales de alta prioridad: códigos de confirmación de 6 dígitos al registrarse, enlaces de activación y claves temporales de recuperación de acceso.
   * *Infraestructura:* Conexión directa cifrada por el puerto web 443 (HTTPS), inmune a los bloqueos de puertos SMTP tradicionales (25/465/587).
   * *Autenticación y Reputación:* Dominio oficial `camplinkapp.com` firmado criptográficamente con **DKIM (claves RSA de 2048 bits)** y registros **SPF** en Cloudflare.

---

## 5. Módulos del Sistema y Experiencia de Usuario

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ECOSISTEMA DE MÓDULOS CAMPLINK                        │
├───────────────────┬───────────────────┬───────────────────┬─────────────────┤
│  1. DESCUBRE MAPA │ 2. DESCUBRE LISTA │ 3. FICHA DE LUGAR │ 4. RADAR NÓMADA │
│  - 5 Capas GIS    │ - Grid Panorámico │ - Hero Interactivo│ - Precios MITECO│
│  - 6 Tipos iconos │ - Filtros Píldora │ - Widget Clima    │ - Servicios GPS │
│  - Leyenda Táctil │ - Input Glass     │ - Notas Privadas  │ - Radio 5-50 km │
├───────────────────┼───────────────────┼───────────────────┼─────────────────┤
│  5. ORGANIZA VIAJE│ 6. DIARIO DE RUTA │ 7. TALLER 3D      │ 8. PERFIL & PWA │
│  - Autonomía 80%  │ - Feed Social     │ - Maqueta WebGL   │ - 1:1 Cropper   │
│  - Reset Consumo  │ - Client Compresor│ - Simulador Ah    │ - 65 Trofeos    │
│  - jsPDF Export   │ - Mención Lugares │ - Caída Tensión   │ - Web Push/PWA  │
└───────────────────┴───────────────────┴───────────────────┴─────────────────┘
```

### 5.1. Módulo 1: Descubre Mapa (Cartografía Geoespacial Reactiva)
* **Objetivo:** Ofrecer una exploración inmersiva del territorio con información relevante para la vida camper.
* **Aspectos Técnicos Implementados:**
  - Marcadores SVG personalizados coloreados según la puntuación camper comunitaria (oro $>4.0$, plata $>3.0$, bronce $>2.0$, verde $>1.0$, rojo $\le 1.0$, gris sin votos).
  - Selector dinámico de 5 capas de mapa base (Estándar, Relieve OpenTopoMap, Satelital Esri, Lluvia OpenWeather, Contaminación Lumínica NASA VIIRS).
  - Selector táctil horizontal de 6 tipologías de pernocta con badges distintivos: Pernocta Libre, Área Autocaravanas, Camping, Parking Urbano, Área Recreativa y Solo Servicios.
  - **Leyenda Colapsable Táctil:** Cuadro informativo de puntuaciones desplegable/cerrable con un solo toque y fijado en posición ergonómica móvil (`bottom: 74px, left: 2px`).
  - **Calificación Camper Protegida:** Iconos de caravana en popups en modo de solo lectura (evitando clics involuntarios al explorar el mapa), reservando la interacción para la ficha de detalle o el check-in.

### 5.2. Módulo 2: Descubre Lista (Catálogo Panorámico Glassmorphism)
* **Objetivo:** Permitir una búsqueda rápida, estructurada y accesible de lugares con filtros combinados.
* **Aspectos Técnicos Implementados:**
  - Buscador inteligente en tiempo real sobre nombre, población y provincia con debounce y resplandor de foco (`focus ring`).
  - Botón de limpieza rápida (`X`) y contador numérico de filtros activos.
  - Tarjetas panorámicas (16:9) con badges de servicios destacados (Agua potable, Electricidad, Vaciado de aguas grises y negras, Mascotas, Mucha sombra, Gratuito o Precio por noche).
  - Paginación dinámica y acceso directo a guardar en favoritos, planificar en viaje o navegar por GPS.

### 5.3. Módulo 3: Ficha Detallada del Lugar
* **Objetivo:** Centralizar toda la información técnica, comunitaria y privada de un punto de pernocta.
* **Aspectos Técnicos Implementados:**
  - **Hero Banner:** Fotografía principal con selector de presets automáticos por tipología si el lugar no tiene fotos aportadas.
  - **Widget Meteorológico Open-Meteo:** Pronóstico semanal con temperaturas máximas y mínimas, probabilidad de lluvia y avisos de racha de viento lateral.
  - **Diarios de Exploradores Vinculados:** Widget social bidireccional que recopila automáticamente las entradas del Diario de Ruta donde los usuarios hayan pernoctado o mencionado el lugar.
  - **Mis Notas Personales Privadas:** Sistema de notas privadas exclusivas para el explorador autenticado (estado del acceso, fuentes ocultas, cobertura 4G), guardadas en base de datos (`NotaPersonalLugar`) y respaldo en `localStorage`.
  - **Exportación Dual de Calendarios:** Botón de exportación a Google Calendar y descarga de archivo `.ics` estándar RFC 5545 para Apple Calendar / Outlook.
  - **Opiniones de la Comunidad con Fotografía:** Formulario de valoración (1 a 5 iconos camper de caravana) con subida de foto real comprimida y moderación de autor/administrador.

### 5.4. Módulo 4: Radar Nómada en Tiempo Real (Cerca de Mí)
* **Objetivo:** Resolver emergencias y necesidades operativas sobre la marcha mientras el explorador conduce.
* **Aspectos Técnicos Implementados:**
  - Geocodificación inversa mediante Nominatim para identificar la localidad exacta sin exponer coordenadas crudas al usuario.
  - **Comparador Oficial de Precios de Gasolineras (MITECO):** Descarga el catálogo del Ministerio, computa distancias reales y ordena las estaciones de más barata a más cara según el combustible configurado en el vehículo, con radios de 5, 10, 25 y 50 km.
  - **Servicios Esenciales en Navegador:** Accesos rápidos en un clic para gasolineras, supermercados, farmacias, talleres mecánicos, veterinarios, lavanderías, fuentes de agua potable y vaciado.
  - **Acceso Rápido Móvil:** Botón Radar accesible desde la barra flotante superior móvil con sincronización visual de tamaño con las notificaciones.

### 5.5. Módulo 5: Organiza tu Viaje y Cálculo de Autonomía Vial
* **Objetivo:** Diseñar itinerarios de viaje garantizando la seguridad en el consumo de combustible.
* **Aspectos Técnicos Implementados:**
  - **Algoritmo de Distancia Vial y Autonomía:** Cálculo de distancia vial estimada con factor de corrección de sinuosidad vial.
  - **Alerta Preventiva de Combustible (80% Autonomía):** Aviso cuando un tramo supere el 80% de la capacidad del depósito con botón directo a estaciones MITECO en ruta.
  - **Reinicio Automático de Consumo:** Al agregar una gasolinera al itinerario, el sistema la marca como parada de repostaje, restableciendo el odómetro acumulado a 0 km para los tramos subsiguientes.
  - **Exportación a Calendarios (.ics RFC 5545) y PDF:** Descarga de cuaderno de bitácora completo y sincronización con agendas móviles.

### 5.6. Módulo 6: Diario de Ruta Social y Check-In Georreferenciado
* **Objetivo:** Fomentar la comunidad, el registro de pernoctas y el intercambio de vivencias reales.
* **Aspectos Técnicos Implementados:**
  - Publicaciones sociales con texto enriquecido, fotografías panorámicas (16:9) y vinculación a lugares del catálogo.
  - Compresión de imágenes en el cliente mediante Canvas HTML5: fotos de 8 a 15 MB se reducen a $\sim 180 - 250\text{ KB}$ sin degradación visual perceptible.
  - Reacciones temáticas (*Fuego*, *Pino*, *Alerta*) e hilos de comentarios con URLs canónicas compartibles (`/diario?post=ID`).
  - **Modal de Check-in Avanzado (`ModalCheckIn.jsx`):**
    - Validación de radio GPS de 20 km (con bypass administrativo para auditorías).
    - Valoración en tarjeta camper con input de experiencia.
    - Opción de publicación simultánea en el Diario de Ruta con texto y fotografía adjunta.
    - Control de cierre por desenfoque y predeterminación de noches planificadas a 0.

### 5.7. Módulo 7: Taller Nómada 3D y Calculadoras Técnicas
* **Objetivo:** Educar y asistir técnicamente a los usuarios en los procesos de camperización y homologación.
* **Aspectos Técnicos Implementados:**
  - **Maqueta 3D Interactiva con Three.js:** Modelo tridimensional de furgoneta gran volumen con órbita 360º, zoom y selector de capas técnicas desmontables (Aislamiento, Electricidad Solar, Fontanería, Mobiliario).
  - **Calculadora de Consumo Eléctrico Diario (Ah):** Estimación de capacidad de batería recomendada con margen de descarga de seguridad del 20%.
  - **Calculadora de Sección de Cable (mm²):** Fórmula de caída de tensión en corriente continua de 12V con límite del 3% para seguridad contra sobrecalentamiento.

### 5.8. Módulo 8: Perfil del Explorador, PWA y Gamificación
* **Objetivo:** Personalización, fidelización, gestión de vehículo e instalación PWA.
* **Aspectos Técnicos Implementados:**
  - **Editor de Avatar 1:1 (`ModalRecortarFotoPerfil.jsx`):** Arrastre táctil, zoom fluido de 0.5x a 3.0x y compresión JPEG ligera (<120 KB).
  - **Instalación PWA y Web Push:** Botón de instalación integrado en el perfil junto al acceso del tutorial, y banner emergente no intrusivo con soporte para `beforeinstallprompt`.
  - **Tour Guiado Onboarding (`TutorialBienvenidaModal.jsx`):** Modal interactivo de 6 pasos con barra de progreso, iconos representativos y botones de navegación directa a las diferentes secciones.
  - **Vitrina de 65 Trofeos Nómadas:** Gamificación por niveles (Madera, Bronce, Plata, Oro, Platino) y categorías (*Ruta, Pernocta, Comunidad, Taller*).

---

## 6. Sistema de Diseño Visual y Ergonomía Móvil

El diseño de Camplink sigue una arquitectura **Mobile-First** con estética Glassmorphism de alto contraste:
* **Barras Flotantes Superiores Dinámicas:** Barra flotante en vista móvil con reducción de opacidad a `0.5` al hacer scroll descendente para maximizar el área visible.
* **Safe Areas para iOS/Android:** Integración de `env(safe-area-inset-top)` y `env(safe-area-inset-bottom)` para respetar notches y barras de navegación del sistema operativo.
* **Footer de Aplicación Móvil:** Adaptación del pie de página en dispositivos móviles a un formato ultrarreducido estilo app nativa.
* **Tarjetas Dashboard Proporcionadas:** Dimensionado ergonómico del grid de bienvenida para visibilidad completa sin necesidad de scroll excesivo en terminales compactos.

---

## 7. Seguridad, Autenticación y Control de Accesos

1. **Gestión Criptográfica de Contraseñas:** Hashing mediante **PBKDF2 con SHA-256** con salt aleatorio por usuario.
2. **Autenticación REST Basada en Tokens:** Sesión stateless mediante `rest_framework.authtoken.models.Token` transmitido en `Authorization: Token <key>`.
3. **Rutas Protegidas:** Acceso libre únicamente a Landing Page (`/`) y visor de mapa (`/mapa`). Todas las demás rutas redirigen a la autenticación.
4. **Bypass GPS en Check-in para Administradores:** Exención del radio de 20 km para cuentas con rol de administración (`es_admin`, `is_staff`, `is_superuser`) para auditorías.
5. **Permisos de Autor y Moderación:** Validación de propiedad en endpoints destructivos (edición y borrado de opiniones, publicaciones y fotos).

---

## 8. Base de Datos: Catálogo Geoespacial y Siembra de Producción

La base de datos relacional cuenta con más de **1.200 lugares verificados** y datos de comunidad normalizados:
* **Fixtures JSON Oficiales:**
  - `fixtures/lugares_iniciales.json`: Catálogo completo de puntos de pernocta en España, Francia, Portugal, Italia y enclaves alpinos con coordenadas precisas y tipología normalizada.
  - `fixtures/comunidad_inicial.json`: Categorías fijas del Taller Nómada, guías de ruta, artículos de mantenimiento y recursos STL descargables.
* **Script de Inicialización de Producción (`poblar_exploradores_produccion.py`):**
  - Inicialización del catálogo de 65 trofeos nómadas.
  - Creación del superusuario administrador (`admin`).
  - Generación de 10 perfiles de exploradores representativos con consumos, depósitos y localidades reales.
  - Inserción de valoraciones auténticas, vivencias en el diario de ruta y comentarios cruzados.
  - Ejecución automatizada en el arranque del contenedor Docker de backend.

---

## 9. Infraestructura, Despliegue en Producción y DevOps

### 9.1. Servidor y Entorno en la Nube
* **Proveedor Cloud:** DigitalOcean Droplet en región europea (Ubuntu 24.04 LTS x86_64).
* **Memoria de Intercambio (SWAP):** Archivo de 2.0 GB (`vm.swappiness=10`) para prevenir bloqueos por memoria al compilar contenedores.
* **Dominio y SSL:** `camplinkapp.com` gestionado por **Cloudflare** con certificado SSL/TLS y mitigación DDoS. Servidor Nginx interno preparado para modos flexible y strict.
* **Directiva de Idioma:** Cabecera HTTP `Content-Language: es` y etiqueta `<html lang="es" class="notranslate">` para evitar traducciones erróneas por heurísticas de navegadores.

### 9.2. Orquestación con Docker Compose
1. **Base de Datos (camplink_db):** PostgreSQL 16 Alpine con volumen persistente (`postgres_data`) y healthcheck `pg_isready`.
2. **Servidor Backend (camplink_backend):** Python 3.12 Slim, Gunicorn (3 workers), WhiteNoise para estáticos y volumen persistente `./media:/app/media`.
3. **Servidor Frontend (camplink_frontend):** Compilación multi-stage con Node 20 y Vite, servida mediante Nginx Alpine con compresión gzip, fallback SPA y proxy hacia el backend.

### 9.3. Pipeline CI/CD con GitHub Actions
* **Flujo Automatizado (`.github/workflows/deploy.yml`):** Conexión SSH por clave Ed25519 ante cada `git push` a `main`, sincronización de código, rebuild de contenedores (`docker compose up -d --build`) y limpieza de imágenes huérfanas (`docker image prune -f`) sin pérdida de datos.

---

## 10. Conclusiones y Roadmap

### 10.1. Conclusiones
Camplink consolida una solución vertical completa, de alto rendimiento y bajo coste de mantenimiento para el turismo nómada, demostrando la potencia de una arquitectura desacoplada moderna complementada con PWA, notificaciones push, Three.js y APIs públicas oficiales.

### 10.2. Roadmap Futuro
1. **Soporte Offline Total de Mapas:** Descarga de paquetes de teselas cartográficas por regiones para navegación 100% desconectada en zonas sin cobertura.
2. **Sensorización IoT Camper (Camplink Box):** Conexión con microcontroladores ESP32 mediante WebSockets para telemetría de depósitos, baterías LiFePO4 y temperatura en tiempo real.
3. **Navegación Turn-by-Turn Integrada:** Avisos de ruta por voz considerando altura y anchura del vehículo.
