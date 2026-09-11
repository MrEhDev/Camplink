import os
import sys
import random
import django

# Aquí configuro el entorno de Django para inicializar la base de datos con 10 exploradores realistas
sys.path.insert(0, '/home/eleazar/Master Full Stack/Antigravity/Camplink/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'camplink_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from lugares.models import Lugar, ValoracionLugar
from diario.models import Publicacion as VivenciaDiario, ComentarioPublicacion as ComentarioDiario, CheckIn
from comunidad.models import PublicacionTaller, CategoriaPublicacion
from viajes.services import verificar_y_desbloquear_trofeos, inicializar_catalogo_trofeos

Explorador = get_user_model()

DATOS_EXPLORADORES = [
    {
        'username': 'laura_camper',
        'email': 'laura.camper@camplinkapp.com',
        'first_name': 'Laura',
        'last_name': 'Martínez',
        'poblacion': 'Madrid',
        'codigo_postal': '28001',
        'tipo_viajero': 'camper',
        'capacidad_deposito_l': 65.0,
        'consumo_medio_l_100km': 8.2,
        'biografia': 'Viajera incansable en mi Gran Volumen camperizada. Amante de la montaña, los senderos solitarios y los atardeceres en pernocta libre.'
    },
    {
        'username': 'marcos_vanlife',
        'email': 'marcos.vanlife@camplinkapp.com',
        'first_name': 'Marcos',
        'last_name': 'Soler',
        'poblacion': 'Barcelona',
        'codigo_postal': '08001',
        'tipo_viajero': 'autocaravana',
        'capacidad_deposito_l': 80.0,
        'consumo_medio_l_100km': 10.5,
        'biografia': 'Recorriendo la península con la familia en nuestra perfilada. Apasionado de la gastronomía local y los pueblos con encanto.'
    },
    {
        'username': 'carlos_nomada',
        'email': 'carlos.nomada@camplinkapp.com',
        'first_name': 'Carlos',
        'last_name': 'Vega',
        'poblacion': 'Oviedo',
        'codigo_postal': '33001',
        'tipo_viajero': 'camper',
        'capacidad_deposito_l': 55.0,
        'consumo_medio_l_100km': 7.1,
        'biografia': 'Viviendo y teletrabajando en ruta desde Asturias. Busco siempre lugares tranquilos con buena cobertura y naturaleza alrededor.'
    },
    {
        'username': 'elena_furgoviajes',
        'email': 'elena.furgoviajes@camplinkapp.com',
        'first_name': 'Elena',
        'last_name': 'Ríos',
        'poblacion': 'Valencia',
        'codigo_postal': '46001',
        'tipo_viajero': 'autocaravana',
        'capacidad_deposito_l': 75.0,
        'consumo_medio_l_100km': 9.8,
        'biografia': 'Rutas por la costa y calas tranquilas. Compartiendo bricos de fontanería camper y recetas fáciles en una sartén.'
    },
    {
        'username': 'david_overland',
        'email': 'david.overland@camplinkapp.com',
        'first_name': 'David',
        'last_name': 'Navarro',
        'poblacion': 'Granada',
        'codigo_postal': '18001',
        'tipo_viajero': 'camper',
        'capacidad_deposito_l': 90.0,
        'consumo_medio_l_100km': 9.5,
        'biografia': 'Aventurero 4x4 camper. Buscador de pistas de tierra en Sierra Nevada y pernoctas bajo cielos estrellados sin contaminación lumínica.'
    },
    {
        'username': 'sofia_ruta',
        'email': 'sofia.ruta@camplinkapp.com',
        'first_name': 'Sofía',
        'last_name': 'Gil',
        'poblacion': 'Santander',
        'codigo_postal': '39001',
        'tipo_viajero': 'camper',
        'capacidad_deposito_l': 60.0,
        'consumo_medio_l_100km': 7.8,
        'biografia': 'Fotógrafa de naturaleza y apasionada del surf camper. Del norte de España al sur siempre buscando olas y acantilados.'
    },
    {
        'username': 'javier_campervan',
        'email': 'javier.campervan@camplinkapp.com',
        'first_name': 'Javier',
        'last_name': 'Blanco',
        'poblacion': 'Sevilla',
        'codigo_postal': '41001',
        'tipo_viajero': 'camper',
        'capacidad_deposito_l': 70.0,
        'consumo_medio_l_100km': 8.4,
        'biografia': 'Gran volumen L2H2 preparada para escapadas de fin de semana e itinerarios largos en primavera y otoño.'
    },
    {
        'username': 'lucia_viajera',
        'email': 'lucia.viajera@camplinkapp.com',
        'first_name': 'Lucía',
        'last_name': 'Ramos',
        'poblacion': 'Zaragoza',
        'codigo_postal': '50001',
        'tipo_viajero': 'camper',
        'capacidad_deposito_l': 50.0,
        'consumo_medio_l_100km': 6.8,
        'biografia': 'Camper compacta y ágil. Si cabe en una plaza de aparcamiento normal, allí nos plantamos para explorar valles y ríos.'
    },
    {
        'username': 'mateo_rutas',
        'email': 'mateo.rutas@camplinkapp.com',
        'first_name': 'Mateo',
        'last_name': 'Morales',
        'poblacion': 'A Coruña',
        'codigo_postal': '15001',
        'tipo_viajero': 'autocaravana',
        'capacidad_deposito_l': 85.0,
        'consumo_medio_l_100km': 10.8,
        'biografia': 'Viajando con dos perros nómadas. Buscamos siempre áreas con zonas verdes y paseos despejados.'
    },
    {
        'username': 'alba_nomad',
        'email': 'alba.nomad@camplinkapp.com',
        'first_name': 'Alba',
        'last_name': 'Castro',
        'poblacion': 'Málaga',
        'codigo_postal': '29001',
        'tipo_viajero': 'camper',
        'capacidad_deposito_l': 65.0,
        'consumo_medio_l_100km': 7.9,
        'biografia': 'Nómada digital entre costa y montaña. Especialista en baterías LiFePO4, placas solares y domótica camper.'
    }
]

COMENTARIOS_LUGARES = [
    ("Sitio muy tranquilo para pasar la noche. Terreno bastante nivelado y sombra agradable por la tarde. Cuidado si vais con gran volumen en la curva de acceso.", 5),
    ("Puntos de agua operativos con rosca estándar de 3/4 y vaciado de grises muy limpio. Por la mañana pasó la policía local y todo muy correcto respetando no sacar toldos.", 5),
    ("Vistas espectaculares al amanecer. Cobertura 4G/5G perfecta para trabajar. Muy recomendable para hacer una parada técnica en ruta.", 4),
    ("Lugar muy limpio y con cubos de basura selectiva. Mesas de picnic al lado del río para desayunar al sol.", 4),
    ("Área asfaltada excelente. Tomas de electricidad funcionando con monedas de 1€. Muy cerca del casco histórico caminando.", 5),
    ("Entorno natural precioso. Silencio absoluto durante la noche. Por favor, dejad el entorno igual de limpio que lo encontráis.", 5),
    ("Buen sitio para vaciar y llenar gratis. El grifo de agua potable tiene buena presión. Gracias al ayuntamiento por este servicio camper.", 4),
    ("Pernoctamos una noche en plena ruta hacia el norte. Zona segura e iluminada pero sin molestias de farolas en la cabina.", 4),
    ("Espacio amplio incluso para autocaravanas de más de 7 metros. Cerca hay panadería y pequeña tienda con productos de la zona.", 5),
    ("Muy buen punto de partida para rutas de senderismo o BTT. Fuentes de agua fresca y contenedores de basura cuidados.", 5)
]

TITULOS_VIVENCIAS = [
    ("Amanecer en las faldas de la montaña", "Noche fresca y despejada. El café recién hecho mirando las cumbres no tiene precio. ¡Recomendadísimo este rincón!"),
    ("Ruta costera y pernocta con sonido de olas", "Encontré este punto tranquilo para pasar dos días. Mucha paz fuera de temporada alta y cielo estrellado sin ruidos."),
    ("Fin de semana de desconexión total", "Primera salida del mes después de instalar la segunda batería. La autonomía eléctrica funcionó perfecta y el lugar fue un diez."),
    ("Parada técnica y paseo por el pueblo", "Aprovechamos para vaciar grises, llenar agua y recorrer las calles medievales. La gente local súper hospitalaria con los campers."),
    ("Encuentro con otros viajeros en ruta", "Coincidimos con dos parejas más que hacían la misma ruta hacia el norte. Intercambiamos consejos de bricos y buenas historias junto a la furgo.")
]

def poblar():
    print("=== Inicializando catálogo oficial de Trofeos ===")
    inicializar_catalogo_trofeos()

    print("=== Creando o verificando Superusuario Admin ===")
    admin_user, _ = Explorador.objects.get_or_create(username='admin')
    admin_user.email = 'camplink.app.info@gmail.com'
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.first_name = 'Admin'
    admin_user.last_name = 'CampLink'
    admin_user.set_password('Camper2026!')
    admin_user.poblacion = 'Madrid'
    admin_user.codigo_postal = '28001'
    admin_user.tipo_viajero = 'camper'
    admin_user.save()
    print("✔ Usuario admin listo (credenciales: admin / Camper2026!)")

    lugares_disponibles = list(Lugar.objects.all())
    print(f"Lugares en base de datos: {len(lugares_disponibles)}")

    exploradores_creados = []
    print("\n=== Creando 10 Exploradores de Producción ===")
    for d in DATOS_EXPLORADORES:
        user, created = Explorador.objects.get_or_create(username=d['username'])
        user.email = d['email']
        user.first_name = d['first_name']
        user.last_name = d['last_name']
        user.poblacion = d['poblacion']
        user.codigo_postal = d['codigo_postal']
        user.tipo_viajero = d['tipo_viajero']
        user.capacidad_deposito_l = d['capacidad_deposito_l']
        user.consumo_medio_l_100km = d['consumo_medio_l_100km']
        user.biografia = d['biografia']
        user.set_password('Camper2026!')
        user.is_active = True
        user.save()
        exploradores_creados.append(user)
        print(f" ✔ Explorador: {user.username} ({user.first_name} {user.last_name}) - 📍 {user.poblacion}")

    print("\n=== Asignando Valoraciones Reales en Lugares ===")
    if lugares_disponibles:
        for user in exploradores_creados:
            # Cada usuario valora entre 2 y 4 lugares distintos
            lugares_muestra = random.sample(lugares_disponibles, min(3, len(lugares_disponibles)))
            for lug in lugares_muestra:
                texto, puntuacion = random.choice(COMENTARIOS_LUGARES)
                val, _ = ValoracionLugar.objects.get_or_create(
                    explorador=user,
                    lugar=lug,
                    defaults={'puntuacion_camper': puntuacion, 'comentario': texto}
                )
                val.puntuacion_camper = puntuacion
                val.comentario = texto
                val.save()

    print("\n=== Publicando Vivencias en el Diario de Ruta ===")
    for i, user in enumerate(exploradores_creados):
        titulo, texto = TITULOS_VIVENCIAS[i % len(TITULOS_VIVENCIAS)]
        lugar_asociado = random.choice(lugares_disponibles) if lugares_disponibles else None
        
        post, _ = VivenciaDiario.objects.get_or_create(
            autor=user,
            titulo=titulo,
            defaults={
                'contenido': texto,
                'lugar': lugar_asociado,
                'privacidad': 'comunidad'
            }
        )
        post.contenido = texto
        post.lugar = lugar_asociado
        post.privacidad = 'comunidad'
        post.save()

        # Añadir un comentario cruzado de otro explorador
        otro_user = exploradores_creados[(i + 1) % len(exploradores_creados)]
        ComentarioDiario.objects.get_or_create(
            publicacion=post,
            autor=otro_user,
            defaults={'contenido': '¡Qué buen rincón! Me lo guardo en la lista para nuestra próxima escapada en furgo 🚐🌲'}
        )

    print("\n=== Verificando Medallas y Trofeos para los Exploradores ===")
    for user in [admin_user] + exploradores_creados:
        verificar_y_desbloquear_trofeos(user)

    print("\n🎉 ¡Base de datos de producción poblada exitosamente!")

if __name__ == '__main__':
    poblar()
