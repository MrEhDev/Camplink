# Memoria Técnica del Proyecto: Camplink

**Plataforma Web Integral (SPA) y Red Social para la Comunidad Camper, Autocaravanista y Nómada**  
**Dominio Oficial:** [https://camplinkapp.com](https://camplinkapp.com)  
**Contacto Oficial:** Camplink.app.info@gmail.com  
**Documento de Defensa de Proyecto Final de Máster Full Stack**  
**Autor:** Eleazar  
**Versión:** 2.5 (Edición Completa - Isotipo Oficial, Glassmorphism, 5 Capas de Mapa, Autonomía Inteligente y Vitrina de Trofeos)  
**Fecha:** Septiembre de 2026  

---

## 1. Introducción y Definición del Problema

El auge del turismo itinerante, el caravaning y la vida nómada en furgonetas camperizadas ha experimentado una revolución global en los últimos años. Cada vez más personas eligen viajar con su casa a cuestas, buscando libertad, contacto directo con la naturaleza y autonomía. Sin embargo, este estilo de vida se enfrenta a una serie de retos críticos:

1. **Incertidumbre en la Pernocta y Acampada Legal:** La dispersión y ambigüedad de las normativas municipales y autonómicas, unidas a la falta de información verificada sobre gálibos, alturas y servicios (agua potable, electricidad, vaciado de aguas grises y negras), provocan inseguridad y riesgo de sanciones.
2. **Carencia de Herramientas de Navegación Adaptadas al Vehículo Recreativo:** Los navegadores convencionales ignoran las dimensiones y la autonomía real del vehículo. Quedarse sin combustible en parajes aislados o puertos de montaña es un riesgo real si no se calculan las etapas considerando el volumen del depósito y el consumo medio.
3. **Aislamiento Social y Falta de Información en Tiempo Real:** Las alertas sobre cortes de pistas, masificación, meteorología extrema o cierres temporales de áreas suelen transmitirse de forma fragmentada. No existía una red social vertical creada exclusivamente por y para nómadas.
4. **Barrera de Entrada en la Camperización Técnica:** El proceso de aislar, cablear e instalar fontanería en una furgoneta requiere conocimientos multidisciplinares. Faltaban herramientas interactivas y visuales en 3D que facilitaran el aprendizaje y la homologación.

### Objetivos del Proyecto Camplink

- **Centralizar el descubrimiento de pernoctas:** Proporcionar un mapa interactivo multi-capa de alto rendimiento con marcadores coloreados según valoración de la comunidad, capas de relieve, satélite, radar meteorológico en tiempo real y contaminación lumínica (cielos oscuros).
- **Planificación de viajes con alerta inteligente de combustible:** Algoritmo que calcula distancias viales reales, contabiliza kilometraje y avisa preventivamente antes del tramo que supere el 80% de la autonomía del vehículo.
- **Crear una comunidad viva y participativa (Diario de Ruta):** Red social con publicaciones geolocalizadas, fotografías en alta definición que respetan proporciones panorámicas (16:9), reacciones camper y moderación.
- **Democratizar la camperización con el Taller Nómada 3D:** Maqueta interactiva tridimensional por capas (aislamiento térmico, electricidad solar, fontanería y mobiliario) y calculadoras técnicas.
- **Gamificación y Fidelización:** Vitrina de 16 trofeos estructurados en 4 categorías temáticas (Ruta, Pernocta, Comunidad, Taller) con el Trofeo Platino "Leyenda Nómada".
- **Experiencia de Usuario Excepcional (Mobile-First & Glassmorphism):** Diseño moderno, adaptable a cualquier dispositivo (optimizado para iPhone 12 Pro 390px, tablets y pantallas panorámicas de PC), con temas Claro, Oscuro y Crepuscular (sincronizado con la puesta de sol real vía Open-Meteo).

---

## 2. Arquitectura Tecnológica y Stack

Camplink ha sido diseñado como una arquitectura desacoplada y moderna, compuesta por una **Single Page Application (SPA)** reactiva en el frontend y una **API RESTful** en el backend.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CAMPLINK FRONTEND                             │
│       React 18 + Vite 5 + Vanilla CSS (Glassmorphism Design System)     │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ Leaflet Maps │ Three.js 3D │ Theme Engine │ i18n │ Auth Context │   │
│   └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │  JSON / REST API / HTTPS
┌────────────────────────────────────▼────────────────────────────────────┐
│                           CAMPLINK BACKEND                              │
│         Python 3.12 + Django 5.x + Django REST Framework (DRF)          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ Exploradores │ Lugares & Reseñas │ Viajes & Etapas │ Diario Feed│   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                     ┌──────────────┴──────────────┐                     │
│                     ▼                             ▼                     │
│           Base de Datos Relacional         Almacenamiento Media         │
│          (SQLite / PostgreSQL)          (Fotos, Avatares, Galería)      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.1. Frontend
- **Framework & Build Tool:** React 18 con Vite 5 para compilación ultra-rápida y HMR (Hot Module Replacement).
- **Estilizado & Diseño:** Vanilla CSS estructurado con variables CSS de diseño atómico (Tokens), Glassmorphism con fondos translúcidos `backdrop-filter: blur()`, sombras multicapa y animaciones fluidas.
- **Cartografía Interactiva:** Leaflet 1.9.4 y React-Leaflet con renderizado dinámico de capas (OpenStreetMap Carto, ESRI World Topo Map, ESRI World Imagery Satellite, NASA VIIRS Night Lights y RainViewer Weather Radar).
- **Iconografía & Assets:** Lucide React para iconografía vectorial escalable y el isotipo oficial circular de Camplink como identidad de marca y favicon.
- **Internacionalización:** Motor ligero `LanguageContext` con soporte bidireccional Español / Inglés (`ES` / `EN`).
- **Gestión del Tema:** `ThemeContext` con modos Claro, Oscuro y Puesta de Sol (crepuscular automático).

### 2.2. Backend
- **Lenguaje & Framework:** Python 3.12 con Django 5.x y Django REST Framework (DRF).
- **Autenticación & Seguridad:** Autenticación por sesiones y tokens con cookies seguras `HttpOnly`, protección CSRF y sanitización de entradas HTML con DOMPurify.
- **Gestión de Permisos:** Clases de permisos personalizadas para asegurar que solo los creadores o administradores puedan editar o eliminar publicaciones, viajes o reseñas.
- **Serializadores Anidados:** Métricas calculadas en tiempo de consulta (`SerializerMethodField`) para conteo de valoraciones comunitarias y exploradores activos en el último mes.

### 2.3. APIs y Servicios Externos Integrados
- **OpenStreetMap & Nominatim API:** Geocodificación directa e inversa y resolución automática de población y coordenadas GPS a partir de códigos postales españoles de 5 dígitos.
- **Open-Meteo API:** Datos meteorológicos en tiempo real, alertas de viento/nieve para pernocta y cálculo de la hora solar exacta de puesta de sol según la posición del usuario.
- **ArcGIS REST MapServer (ESRI):** Capas de relieve topográfico de alta precisión y ortofotos satelitales globales.
- **NASA Earthdata / VIIRS:** Capa de luces nocturnas para localización de cielos oscuros sin contaminación lumínica.
- **RainViewer API:** Radar meteorológico de precipitación en tiempo real.

---

## 3. Modelo de Datos y Esquema de Base de Datos

El backend organiza la persistencia de datos a través de cuatro aplicaciones Django desacopladas:

```
                  ┌──────────────────────┐
                  │      Explorador      │ (Custom User)
                  │──────────────────────│
                  │ username, email      │
                  │ tipo_viajero, avatar │
                  │ capacidad_deposito_l │
                  │ consumo_medio_l_100km│
                  │ lat_base, lng_base   │
                  └──────────┬───────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       │ 1:N                 │ 1:N                 │ 1:N
       ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│    Lugar     │      │ Publicacion  │      │    Viaje     │
│──────────────│      │──────────────│      │──────────────│
│ nombre, gps  │      │ autor_id     │      │ explorador_id│
│ servicios    │      │ contenido    │      │ titulo       │
│ valoracion   │      │ imagen       │      │ fecha_inicio │
│ filtros      │      │ lugar_id     │      │ repostajes   │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │ 1:N                 │ 1:N                 │ 1:N
       ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ValoracionLug │      │ComentarioPub │      │ ParadaViaje  │
│FotoLugar     │      │ReaccionPub   │      │ (orden, dias)│
│CheckinLugar  │      └──────────────┘      └──────────────┘
└──────────────┘
```

### 3.1. Detalle de Modelos Principales

1. **`Explorador` (App `exploradores`):**
   - Extiende `AbstractUser` de Django.
   - Campos camper: `tipo_viajero` (camper, autocaravana, acampada), `tipo_combustible` (diésel, gasolina, glp, eléctrico), `capacidad_deposito_l` (por defecto 60L), `consumo_medio_l_100km` (por defecto 6.5 L/100km), `direccion_base`, `codigo_postal`, `poblacion`, `latitud_base`, `longitud_base`, `avatar`, `biografia`, `es_admin`.
   - Métodos: `autonomia_maxima_km` (calculada como `(depósito / consumo) * 100`).

2. **`Lugar` (App `lugares`):**
   - Atributos geográficos: `nombre`, `descripcion`, `latitud`, `longitud`, `pais`, `comunidad_autonoma`, `provincia`, `poblacion`.
   - Servicios camper booleanos: `tiene_agua`, `tiene_lavabo`, `tiene_duchas`, `tiene_electricidad`, `tiene_vaciado_aguas_grises`, `tiene_vaciado_aguas_negras`, `admite_mascotas`, `tiene_wifi`, `tiene_mesas_picnic`.
   - Filtros temáticos: `es_zona_recreativa`, `tiene_senderos_sencillos`, `ideal_ninos_10_anos`, `apto_grandes_autocaravanas`, `permite_sacar_toldo`.
   - Métricas: `valoracion_media` (calculada automáticamente al guardar una `ValoracionLugar`).

3. **`Publicacion` & Interacciones (App `diario`):**
   - `autor`, `contenido`, `imagen`, `lugar_referenciado`, `fecha_creacion`.
   - `ReaccionPublicacion`: `publicacion`, `explorador`, `tipo` (`'fuego'` para Buena ruta, `'alerta'` para Precaución).
   - `ComentarioPublicacion`: `publicacion`, `autor`, `contenido`, `fecha_creacion`.

4. **`Viaje` & `ParadaViaje` (App `viajes`):**
   - `Viaje`: `explorador`, `titulo`, `descripcion`, `fecha_inicio`, `fecha_fin`, `esta_cerrado`, `repostajes_manuales` (JSON con índices de paradas donde se rellena depósito).
   - `ParadaViaje`: `viaje`, `lugar`, `orden`, `dias_estancia`, `notas_parada`.

5. **`GrupoExplorador` & `CompaneroRuta` (App `exploradores`):**
   - Permite la creación de grupos de viaje y el seguimiento directo entre exploradores.

---

## 4. Módulos y Funcionalidades del Sistema

### 4.1. Módulo Descubre: Cartografía Avanzada y Filtros Rápidos
- **Punteros Cromáticos por Puntuación:**
  - **4.1 - 5.0 ⭐ (Oro / Top):** Lugares de máxima excelencia camper.
  - **3.1 - 4.0 ⭐ (Plata):** Muy recomendados por la comunidad.
  - **2.1 - 3.0 ⭐ (Bronce):** Aceptables con servicios estándar.
  - **1.1 - 2.0 ⭐ (Básico / Verde):** Pernoctas básicas o de paso.
  - **≤ 1.0 ⭐ (No recomendado / Rojo):** Mal valorados o con restricciones severas.
  - **⛺ Gris (Sin puntuación aún):** Lugares recién descubiertos con 0 exploradores.
- **Control de 5 Capas:** Alternancia instantánea entre Carto Base, Relieve Topográfico ArcGIS, Satélite HD ArcGIS, Radar de Lluvia y Contaminación Lumínica (NASA VIIRS).
- **Buscador Inteligente & 9 Filtros Temáticos:** Búsqueda en tiempo real por texto o provincia y filtrado instantáneo por Agua, Luz, Gratuito, Vaciado, Mascotas, Familias, Toldo, Recreativa y Senderos.
- **Acceso Directo a Viaje:** Botón en el popup del mapa para añadir el lugar a cualquier viaje planificado sin cambiar de vista.

### 4.2. Módulo Descubre Lista (Catálogo de Pernoctas)
- **Vista Dual Mapa / Lista:** Conmutador instantáneo que permite alternar entre la cartografía espacial interactiva y una vista estructurada en tarjetas panorámicas (16:9).
- **Filtrado Avanzado:** Búsqueda textual por nombre o población y filtros independientes por rangos exactos de valoración camper (Oro, Plata, Bronce, Verde, Rojo, Sin puntuar) y servicios camper (Agua, Luz, Vaciado, Mascotas, Familias, Toldo, Recreativa, Senderos, Gratuito).
- **Acciones Rápidas en Tarjeta:** Acceso directo a ficha detallada, guardado en lista de inspiración personal y modal de inclusión en viajes planificados.

### 4.3. Módulo Ficha de Detalle y Navegación
- **Navegación GPS Guiada:** Botón directo a Google Maps con las coordenadas del punto de pernocta.
- **Exportación Dual a Calendarios:**
  - **Google Calendar:** Generación de plantilla de evento con coordenadas GPS.
  - **Apple Calendar (.ics):** Generación de archivo `.ics` estándar RFC-5545 para iPhone, iPad, Mac y Outlook.
- **Modo Offline:** Persistencia local de lugares para consulta en zonas de alta montaña sin conexión móvil.
- **Métricas Comunitarias:** Conteo de exploradores únicos que han visitado el lugar en los últimos 30 días.

### 4.4. Módulo Diario de Ruta Social
- **Feed Social Glassmorphic:** Publicaciones comunitarias en tiempo real con soporte de imágenes panorámicas proporcionales.
- **Reacciones Nómadas Diferenciadas:** Sistema de "¡Buena ruta!" (❤️) y "Alerta en carretera" (⚠️).
- **Hilos de Comentarios & Moderación Avanzada:** Interacción social con edición y eliminación protegida tanto para el autor del comentario como para administradores/staff (`es_admin`). Paginación automática a 20 comentarios por publicación con navegación entre páginas.
- **Visualización de Nombres Capitalizados:** Formateo visual elegante respetando el identificador único del usuario en base de datos.

### 4.5. Módulo Organiza tu Viaje: Planificador con Autonomía Inteligente
- **Cálculo de Distancias Viales Reales:** Algoritmo trigonométrico de Haversine enriquecido con un coeficiente de sinuosidad vial (`1.28`) para estimar fielmente el kilometraje por carretera.
- **Alerta Preventiva de Combustible al 80%:** El sistema calcula el kilometraje acumulado desde el último repostaje. Si el tramo hacia la siguiente parada supera el 80% de la autonomía real del vehículo (ej: 738 km para un depósito de 60L y 6.5 L/100km = 923 km totales), se despliega una advertencia preventiva **antes** de dicho tramo, indicando la necesidad de repostar.
- **Puntos Fijos de Salida y Regreso a Base:** El punto de partida y retorno utilizan la dirección base del explorador y no se computan como paradas intermedias desordenables.
- **Reordenación de Etapas & Paginación a 10 Viajes:** Control de flechas agrupadas a la izquierda para ordenar paradas, y paginación de los viajes del explorador a 10 por página con controles de navegación.
- **Múltiples Repostajes:** Posibilidad de marcar paradas intermedias como estaciones de servicio para reiniciar el contador de autonomía.
- **Exportación a PDF:** Generación de hoja de ruta lista para imprimir o guardar en PDF.

### 4.6. Módulo Taller Nómada 3D & Guías de Acampada
- **Visualizador 3D con Three.js:** Modelo tridimensional de furgoneta camperizada con órbita 360°, zoom y alternancia de capas técnicas:
  1. Capa de Aislamiento (Kaiflex / Lana de roca).
  2. Capa Eléctrica (Batería LiFePO4, placa solar, inversor 230V y tomas 12V).
  3. Capa de Fontanería (Depósitos de aguas limpias y grises, bomba de agua y boiler).
  4. Capa de Mobiliario y Acondicionamiento.
- **Calculadoras Nómadas:** Estimación de consumo eléctrico diario en Amperios-hora (Ah) y dimensionamiento de sección de cables.
- **Guía de Normativa e ITV:** Resumen visual de la directiva de homologación de vehículos vivienda en España.

### 4.7. Módulo Perfil del Explorador, Radar y Vitrina de Trofeos
- **Identidad Nómada:** Tarjeta de explorador con avatar proporcional 1:1, datos de consumo y depósito, y resolución de CP por OpenStreetMap.
- **Radar Nómada de Cercanía:** Búsqueda en radio de 50 km de gasolineras, áreas de pernocta y compañeros de ruta.
- **Vitrina de 16 Trofeos + Platino:**
  - **Categoría Ruta:** 4 medallas progresivas por kilómetros acumulados.
  - **Categoría Pernocta:** 4 medallas por pernoctas y check-ins registrados.
  - **Categoría Comunidad:** 4 medallas por publicaciones, valoraciones y fotos compartidas.
  - **Categoría Taller:** 4 medallas por consultas y herramientas técnicas utilizadas.
  - **Trofeo Platino 'Leyenda Nómada':** Condecoración especial desbloqueada automáticamente al conseguir el 100% de los trofeos.

### 4.8. Módulo Landing Page & Identidad Corporativa
- **Isotipo Oficial de Camplink:** Logotipo circular estilizado integrado como icono central de la landing, cabecera de la aplicación y favicon del navegador.
- **Presentación Rica para Usuarios no Autenticados:** Bloque Hero, Cifras en Vivo (+1.400 pernoctas, +4.800 exploradores), Los 4 Pilares Nómadas, Beneficios y Registro Rápido en 2 Pasos.
- **Header Móvil Optimizado de 80px:** Barra de navegación móvil con menú hamburguesa que despliega sobre un panel esmerilado con fondo opaco y selector de temas Claro, Oscuro y Crepuscular.

---

## 5. Diseño de Interfaz y Sistema de Diseño (Design System)

Camplink implementa un sistema de diseño visual de vanguardia basado en **Glassmorphism**, contrastes cromáticos de la naturaleza y una filosofía estricta de **Mobile-First**.

### 5.1. Paleta de Colores y Tokens Semánticos
```css
:root {
  /* Naturaleza y Bosque */
  --accent-forest: #235334;
  --accent-forest-hover: #193e26;
  --accent-earth: #D97706;
  --accent-lake: #0284C7;
  --accent-sunset: #EA580C;

  /* Superficies Glassmorphism */
  --bg-primary: #F8FAFC;
  --bg-surface: rgba(255, 255, 255, 0.82);
  --bg-glass: rgba(255, 255, 255, 0.65);
  --border-color: rgba(0, 0, 0, 0.08);

  /* Sombras y Elevaciones */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 6px 20px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 16px 36px rgba(0, 0, 0, 0.16);

  /* Radios */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-full: 9999px;
}
```

### 5.2. Adaptabilidad Móvil (Mobile-First)
- Optimizado exhaustivamente para anchos de pantalla desde **375px / 390px (iPhone 12/13/14 Pro)** hasta pantallas panorámicas 4K.
- Altura del header fijada en **80px** en móvil para acomodar cómodamente el menú hamburguesa, el isotipo y los selectores de idioma y tema.
- Menú desplegable con fondo opaco y desenfoque `-webkit-backdrop-filter: blur(25px)` para garantizar legibilidad completa sobre cualquier contenido.
- Todas las imágenes en tarjetas respetan una relación de aspecto panorámica `aspect-ratio: 16 / 9; object-fit: cover;`, eliminando distorsiones o estiramientos visuales.

---

## 6. Seguridad, Calidad de Código y Pruebas

1. **Protección XSS & Inyección:** Sanitización de contenidos ingresados por los usuarios antes del renderizado en el DOM mediante DOMPurify y escape automático de plantillas Django.
2. **Gestión de Credenciales Insensibles a Mayúsculas y Persistencia Local:** Conversión forzada de nombres de usuario a minúsculas en registro y autenticación insensible a mayúsculas para evitar errores tipográficos al iniciar sesión en móviles. Soporte de recordatorio seguro de usuario en `localStorage` y formulario de recuperación de contraseña.
2. **Control de Acceso Basado en Roles (RBAC):** Restricción de operaciones destructivas (borrado de lugares, eliminación de posts o grupos) únicamente a usuarios propietarios o con flag `es_admin`.
3. **Optimización de Carga y Assets:** Compilación mediante Vite con minificación Gzip y compresión de chunks.
4. **Verificación de Compilación:** Compilación nativa con 0 errores de sintaxis y 0 advertencias de imports en los más de 20 componentes y vistas de la aplicación.

---

## 7. Conclusiones y Trabajo Futuro

El proyecto **Camplink** representa una solución integral, funcional y estéticamente superior para el sector del caravaning y los viajes al aire libre. Unifica en un único ecosistema la búsqueda de pernoctas, la navegación adaptada a la autonomía del vehículo, la red social comunitaria y el taller técnico interactivo.

### Líneas de Desarrollo Futuro
- **Telemetría IoT y Conexión OBD-II:** Integración con adaptadores Bluetooth en la furgoneta para leer el nivel de combustible y consumo real directamente en la aplicación.
- **Aplicación Móvil Nativa:** Empaquetado multiplataforma mediante Capacitor / React Native para publicación en Google Play Store y Apple App Store.
- **Reservas Directas en Áreas Privadas:** Pasarela de pago (Stripe) para reservar parcelas en campings y fincas agrícolas privadas.
- **Integración con Sistemas de Información Meteorológica en Tiempo Real (AEMET / DGT):** Alertas push geolocalizadas de puertos cerrados por nieve o alertas por viento racheado lateral.

---
**Camplink © 2026 • Conectando la Comunidad al Aire Libre**
