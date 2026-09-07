# Aquí implemento el script de poblado de datos y seeding para Camplink,
# generando exploradores activos con fotos de vehículos, compañeros de ruta mutuos,
# grupos familiares, lugares verificados y un viaje futuro planificado.

import os
import django
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'camplink_project.settings')
django.setup()

from exploradores.models import Explorador, RelacionSeguimiento, GrupoPrivacidad
from lugares.models import Lugar
from diario.models import Publicacion, CheckIn
from viajes.models import Viaje
from viajes.services import verificar_y_desbloquear_trofeos, agrupar_checkin_en_viaje

def poblar_comunidad():
    # Aquí creo los nuevos exploradores nómadas con perfiles y vehículos completos
    usuarios_data = [
        {
            'username': 'laura_camper',
            'email': 'laura@camplink.es',
            'first_name': 'Laura',
            'last_name': 'Sánchez',
            'poblacion': 'Zaragoza',
            'pais': 'España',
            'direccion_base': 'Paseo Independencia, Zaragoza',
            'lat_base': 41.6523,
            'lng_base': -0.8814,
            'tipo_viajero': 'camper',
            'biografia': 'Viajando en Fiat Ducato L3H2 con Oliver. Amantes de la escalada, el senderismo y las puestas de sol en calma.',
        },
        {
            'username': 'carlos_ruta',
            'email': 'carlos@camplink.es',
            'first_name': 'Carlos',
            'last_name': 'Martín',
            'poblacion': 'Barcelona',
            'pais': 'España',
            'direccion_base': 'Passeig de Gràcia, Barcelona',
            'lat_base': 41.3917,
            'lng_base': 2.1649,
            'tipo_viajero': 'camper',
            'biografia': 'Rutas de fin de semana en Volkswagen California T6. Buscador incansable de calas tranquilas y cielos estrellados.',
        },
        {
            'username': 'familia_nomada',
            'email': 'familia@camplink.es',
            'first_name': 'David y Rocío',
            'last_name': 'Gómez',
            'poblacion': 'Valencia',
            'pais': 'España',
            'direccion_base': 'Plaza del Ayuntamiento, Valencia',
            'lat_base': 39.4699,
            'lng_base': -0.3763,
            'tipo_viajero': 'autocaravana',
            'biografia': 'Familia de 4 viajando en autocaravana capuchina de 7 plazas. Especialistas en áreas con zonas recreativas e ideales para niños.',
        },
        {
            'username': 'marcos_vanlife',
            'email': 'marcos@camplink.es',
            'first_name': 'Marcos',
            'last_name': 'Pérez',
            'poblacion': 'Granada',
            'pais': 'España',
            'direccion_base': 'Gran Vía de Colón, Granada',
            'lat_base': 37.1773,
            'lng_base': -3.5986,
            'tipo_viajero': 'camper',
            'biografia': 'Fotógrafo de naturaleza y astrofotografía en furgoneta 4x4 off-road. Cazador de cielos oscuros sin contaminación lumínica.',
        },
        {
            'username': 'elena_astur',
            'email': 'elena@camplink.es',
            'first_name': 'Elena',
            'last_name': 'Álvarez',
            'poblacion': 'Gijón',
            'pais': 'España',
            'direccion_base': 'Playa de San Lorenzo, Gijón',
            'lat_base': 43.5357,
            'lng_base': -5.6615,
            'tipo_viajero': 'camper',
            'biografia': 'Camperizando mi propia furgoneta paso a paso. Compartiendo bricos de fontanería, placas solares y piezas 3D en el Taller.',
        },
    ]

    usuarios_creados = {}
    for u in usuarios_data:
        usuario, creado = Explorador.objects.get_or_create(
            username=u['username'],
            defaults={
                'email': u['email'],
                'first_name': u['first_name'],
                'last_name': u['last_name'],
                'poblacion': u['poblacion'],
                'pais': u['pais'],
                'direccion_base': u['direccion_base'],
                'lat_base': u['lat_base'],
                'lng_base': u['lng_base'],
                'tipo_viajero': u['tipo_viajero'],
                'biografia': u['biografia'],
            }
        )
        if creado:
            usuario.set_password('camper1234')
            usuario.save()
        usuarios_creados[u['username']] = usuario

    # Obtengo el usuario principal alex_nomada
    alex = Explorador.objects.filter(username='alex_nomada').first()
    if alex:
        # Creo relaciones mutuas de Compañeros de Ruta
        for u in [usuarios_creados['laura_camper'], usuarios_creados['familia_nomada'], usuarios_creados['carlos_ruta']]:
            RelacionSeguimiento.objects.update_or_create(seguidor=alex, seguido=u, defaults={'estado': 'aceptada'})
            RelacionSeguimiento.objects.update_or_create(seguidor=u, seguido=alex, defaults={'estado': 'aceptada'})

        # Creo Grupos de Confianza en el perfil de Alex
        grupo_familia, _ = GrupoPrivacidad.objects.get_or_create(
            creador=alex,
            nombre='Grupo Familia Camper',
            defaults={'descripcion': 'Círculo íntimo para compartir pernoctas con los peques y planes familiares.'}
        )
        grupo_familia.miembros.set([usuarios_creados['familia_nomada']])

        grupo_amigos, _ = GrupoPrivacidad.objects.get_or_create(
            creador=alex,
            nombre='Amigos de Ruta',
            defaults={'descripcion': 'Cuadrilla nómada para quedadas de fin de semana y brico-taller.'}
        )
        grupo_amigos.miembros.set([usuarios_creados['laura_camper'], usuarios_creados['carlos_ruta']])

    # Aquí creo nuevos Lugares verificados en distintas comunidades autónomas
    admin_user = Explorador.objects.filter(is_staff=True).first() or alex

    lugares_data = [
        {
            'nombre': 'Área Autocaravanas Sierra de Guadarrama',
            'poblacion': 'Cercedilla',
            'provincia': 'Madrid',
            'comunidad_autonoma': 'Comunidad de Madrid',
            'latitud': 40.7392,
            'longitud': -4.0583,
                        'descripcion': 'Excelente área municipal a pie de senderos y pinares. Noches frescas en verano y muy bien nivelada.',
            'precio': 5.0,
            'es_gratuito': False,
            'tiene_agua': True,
            'tiene_electricidad': True,
            'tiene_vaciado_aguas_grises': True,
            'tiene_vaciado_aguas_negras': True,
            'ideal_ninos_10_anos': True,
            'es_zona_recreativa': True,
            'permite_sacar_toldo': True,
            'valoracion_media': 4.7,
        },
        {
            'nombre': 'Furgoperfecto Cala Pola',
            'poblacion': 'Tossa de Mar',
            'provincia': 'Girona',
            'comunidad_autonoma': 'Cataluña',
            'latitud': 41.7314,
            'longitud': 2.9467,
                        'descripcion': 'Entorno costero protegido entre pinos y acantilados. Ideal para madrugar y bajar a nadar o hacer paddle surf.',
            'precio': 0.0,
            'es_gratuito': True,
            'tiene_agua': False,
            'tiene_electricidad': False,
            'tiene_vaciado_aguas_grises': False,
            'tiene_vaciado_aguas_negras': False,
            'ideal_ninos_10_anos': False,
            'es_zona_recreativa': False,
            'permite_sacar_toldo': False,
            'valoracion_media': 4.5,
        },
        {
            'nombre': 'Área Nómada Parque Natural de Cazorla',
            'poblacion': 'Cazorla',
            'provincia': 'Jaén',
            'comunidad_autonoma': 'Andalucía',
            'latitud': 37.9125,
            'longitud': -2.9983,
                        'descripcion': 'Pernocta en plena naturaleza junto al río y cascadas. Sombra abundante, supermercado a 5 minutos y agua de manantial.',
            'precio': 8.0,
            'es_gratuito': False,
            'tiene_agua': True,
            'tiene_electricidad': True,
            'tiene_vaciado_aguas_grises': True,
            'tiene_vaciado_aguas_negras': True,
            'ideal_ninos_10_anos': True,
            'es_zona_recreativa': True,
            'permite_sacar_toldo': True,
            'valoracion_media': 4.9,
        },
        {
            'nombre': 'Eco-Área Camper Cabo de Gata',
            'poblacion': 'San José',
            'provincia': 'Almería',
            'comunidad_autonoma': 'Andalucía',
            'latitud': 36.7628,
            'longitud': -2.1094,
                        'descripcion': 'Área respetuosa con el medio ambiente, placas solares, lavandería y vistas vírgenes al atardecer en el desierto marino.',
            'precio': 12.0,
            'es_gratuito': False,
            'tiene_agua': True,
            'tiene_electricidad': True,
            'tiene_vaciado_aguas_grises': True,
            'tiene_vaciado_aguas_negras': True,
            'ideal_ninos_10_anos': True,
            'es_zona_recreativa': True,
            'permite_sacar_toldo': True,
            'valoracion_media': 4.8,
        },
        {
            'nombre': 'Área Autocaravanas San Vicente de la Barquera',
            'poblacion': 'San Vicente de la Barquera',
            'provincia': 'Cantabria',
            'comunidad_autonoma': 'Cantabria',
            'latitud': 43.3847,
            'longitud': -4.3986,
                        'descripcion': 'Vistas increíbles a la ría y a los Picos de Europa nevados de fondo. Vaciado de aguas impecable y paseo marítimo iluminado.',
            'precio': 9.0,
            'es_gratuito': False,
            'tiene_agua': True,
            'tiene_electricidad': True,
            'tiene_vaciado_aguas_grises': True,
            'tiene_vaciado_aguas_negras': True,
            'ideal_ninos_10_anos': True,
            'es_zona_recreativa': False,
            'permite_sacar_toldo': False,
            'valoracion_media': 4.6,
        },
        {
            'nombre': 'Pernocta Mirador del Fitu',
            'poblacion': 'Caravia',
            'provincia': 'Asturias',
            'comunidad_autonoma': 'Principado de Asturias',
            'latitud': 43.4419,
            'longitud': -5.1964,
                        'descripcion': 'Mirador panorámico de 360 grados mar y montaña. Despertar viendo el mar Cantábrico por un lado y la cordillera por el otro.',
            'precio': 0.0,
            'es_gratuito': True,
            'tiene_agua': False,
            'tiene_electricidad': False,
            'tiene_vaciado_aguas_grises': False,
            'tiene_vaciado_aguas_negras': False,
            'ideal_ninos_10_anos': False,
            'es_zona_recreativa': True,
            'permite_sacar_toldo': False,
            'valoracion_media': 4.9,
        },
        {
            'nombre': 'Área Camper Candanchú - Valle de Canfranc',
            'poblacion': 'Aisa',
            'provincia': 'Huesca',
            'comunidad_autonoma': 'Aragón',
            'latitud': 42.7886,
            'longitud': -0.5283,
                        'descripcion': 'Pernocta pirenaica de alta montaña a 1.600 metros. Paisaje alpino sobrecogedor, rutas de senderismo y aire puro.',
            'precio': 6.0,
            'es_gratuito': False,
            'tiene_agua': True,
            'tiene_electricidad': True,
            'tiene_vaciado_aguas_grises': True,
            'tiene_vaciado_aguas_negras': True,
            'ideal_ninos_10_anos': True,
            'es_zona_recreativa': True,
            'permite_sacar_toldo': True,
            'valoracion_media': 4.9,
        },
        {
            'nombre': 'Área de Pernocta Las Bardenas Reales',
            'poblacion': 'Arguedas',
            'provincia': 'Navarra',
            'comunidad_autonoma': 'Navarra',
            'latitud': 42.1764,
            'longitud': -1.5975,
                        'descripcion': 'Frente a las famosas casas cueva de Arguedas. Puerta de entrada al desierto de Bardenas Reales para rutas en bici y furgoneta.',
            'precio': 0.0,
            'es_gratuito': True,
            'tiene_agua': True,
            'tiene_electricidad': False,
            'tiene_vaciado_aguas_grises': True,
            'tiene_vaciado_aguas_negras': True,
            'ideal_ninos_10_anos': True,
            'es_zona_recreativa': True,
            'permite_sacar_toldo': False,
            'valoracion_media': 4.7,
        },
    ]

    lugares_creados = {}
    for lug in lugares_data:
        obj, _ = Lugar.objects.update_or_create(
            nombre=lug['nombre'],
            defaults={
                'creador': admin_user,
                'poblacion': lug['poblacion'],
                'provincia': lug['provincia'],
                'comunidad_autonoma': lug['comunidad_autonoma'],
                'latitud': lug['latitud'],
                'longitud': lug['longitud'],
                                'descripcion': lug['descripcion'],
                'precio': lug['precio'],
                'es_gratuito': lug['es_gratuito'],
                'tiene_agua': lug['tiene_agua'],
                'tiene_electricidad': lug['tiene_electricidad'],
                'tiene_vaciado_aguas_grises': lug['tiene_vaciado_aguas_grises'],
                'tiene_vaciado_aguas_negras': lug['tiene_vaciado_aguas_negras'],
                'ideal_ninos_10_anos': lug['ideal_ninos_10_anos'],
                'es_zona_recreativa': lug['es_zona_recreativa'],
                'permite_sacar_toldo': lug['permite_sacar_toldo'],
                'valoracion_media': lug['valoracion_media'],
            }
        )
        lugares_creados[lug['nombre']] = obj

    # Creo un viaje futuro planificado para alex_nomada
    if alex:
        fecha_futura_1 = timezone.now().date() + timedelta(days=14)
        lugar_huesca = lugares_creados.get('Área Camper Candanchú - Valle de Canfranc')
        if lugar_huesca:
            ch_futuro, _ = CheckIn.objects.get_or_create(
                explorador=alex,
                lugar=lugar_huesca,
                fecha_llegada=timezone.now() + timedelta(days=14),
                defaults={
                    'dias_previstos': 3,
                    'valoracion_camper': 5,
                    'comentario_publico': 'Planificada subida a los Pirineos para ruta de alta montaña.',
                    'notas_privadas': 'Llevar cadenas por si refresca y ropa térmica para la noche.'
                }
            )
            agrupar_checkin_en_viaje(ch_futuro)

    # Creo publicaciones en el Diario de Ruta de los nuevos usuarios
    Publicacion.objects.get_or_create(
        autor=usuarios_creados['laura_camper'],
        contenido='¡Fin de semana espectacular recorriendo la Sierra de Guadarrama! El área de Cercedilla tiene todos los servicios impecables y muchísima sombra bajo los pinos. Muy recomendable para desconectar 🌲🚐',
        defaults={'visibilidad': 'publico', 'lugar': lugares_creados['Área Autocaravanas Sierra de Guadarrama']}
    )

    Publicacion.objects.get_or_create(
        autor=usuarios_creados['familia_nomada'],
        contenido='Primera salida del mes en familia hacia las Bardenas Reales. Las niñas han disfrutado muchísimo visitando las cuevas de Arguedas al atardecer. Muy seguro y tranquilo para dormir.',
        defaults={'visibilidad': 'publico', 'lugar': lugares_creados['Área de Pernocta Las Bardenas Reales']}
    )

    # Desbloqueo y calculo trofeos para todos
    for u in Explorador.objects.all():
        verificar_y_desbloquear_trofeos(u)

    print("Seeding completado con éxito: 5 exploradores, compañeros de ruta mutuos, 8 lugares verificados y viaje futuro planificado.")

if __name__ == '__main__':
    poblar_comunidad()