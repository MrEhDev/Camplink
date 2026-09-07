# Aquí implemento el script para poblar la base de datos con exploradores de prueba,
# lugares camper reales en España, artículos de la Guía del Nómada y temas del Taller.

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'camplink_project.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
from exploradores.models import Explorador
from lugares.models import Lugar, ValoracionLugar
from diario.models import Publicacion, CheckIn
from comunidad.models import ArticuloGuia, TemaTaller
from viajes.services import inicializar_catalogo_trofeos, agrupar_checkin_en_viaje

def poblar_datos():
    # Aquí inicializo los trofeos y creo los usuarios básicos
    print("Iniciando catálogo de trofeos...")
    inicializar_catalogo_trofeos()

    print("Creando usuarios iniciales...")
    # Administrador
    admin, _ = Explorador.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@camplink.es',
            'first_name': 'Carlos',
            'last_name': 'Administrador',
            'rol': 'administrador',
            'is_staff': True,
            'is_superuser': True,
            'poblacion': 'Madrid',
            'pais': 'España',
            'direccion_base': 'Paseo de la Castellana 100, Madrid',
            'lat_base': 40.453054,
            'lng_base': -3.688344,
            'tipo_viajero': 'autocaravana',
            'biografia': 'Fundador de Camplink y viajero nómada desde 2012.'
        }
    )
    admin.set_password('camper1234')
    admin.save()

    # Explorador habitual
    explorador, _ = Explorador.objects.get_or_create(
        username='alex_nomada',
        defaults={
            'email': 'alex@camplink.es',
            'first_name': 'Álex',
            'last_name': 'Sánchez',
            'rol': 'explorador',
            'poblacion': 'Zaragoza',
            'pais': 'España',
            'direccion_base': 'Plaza del Pilar, Zaragoza',
            'lat_base': 41.656064,
            'lng_base': -0.878347,
            'tipo_viajero': 'camper',
            'biografia': 'Recorriendo la península en mi furgoneta camperizada L2H2.'
        }
    )
    explorador.set_password('camper1234')
    explorador.save()

    print("Creando Lugares de pernocta emblemáticos...")
    lugares_info = [
        {
            'nombre': 'Área Camper Cabo de Gata',
            'descripcion': 'Espectacular área rodeada de naturaleza volcánica y calas salvajes. Suelo nivelado, brisa marina y atardeceres mágicos.',
            'latitud': 36.7828,
            'longitud': -2.2417,
            'pais': 'España',
            'comunidad_autonoma': 'Andalucía',
            'provincia': 'Almería',
            'poblacion': 'San José',
            'precio': 12.0,
            'es_gratuito': False,
            'tiene_agua': True,
            'tiene_lavabo': True,
            'tiene_duchas': True,
            'tiene_electricidad': True,
            'tiene_vaciado_aguas_grises': True,
            'tiene_vaciado_aguas_negras': True,
            'admite_mascotas': True,
            'tiene_wifi': True,
            'tiene_mesas_picnic': True,
            'es_zona_recreativa': True,
            'tiene_senderos_sencillos': True,
            'ideal_ninos_10_anos': True,
            'apto_grandes_autocaravanas': True,
            'permite_sacar_toldo': True,
        },
        {
            'nombre': 'Pernocta Mirador Picos de Europa',
            'descripcion': 'Zona tranquila en plena cordillera cantábrica. Ideal para senderismo de montaña y observación de estrellas.',
            'latitud': 43.1812,
            'longitud': -4.8322,
            'pais': 'España',
            'comunidad_autonoma': 'Asturias',
            'provincia': 'Asturias',
            'poblacion': 'Cangas de Onís',
            'precio': 0.0,
            'es_gratuito': True,
            'tiene_agua': True,
            'tiene_lavabo': False,
            'tiene_duchas': False,
            'tiene_electricidad': False,
            'tiene_vaciado_aguas_grises': True,
            'tiene_vaciado_aguas_negras': False,
            'admite_mascotas': True,
            'tiene_wifi': False,
            'tiene_mesas_picnic': True,
            'es_zona_recreativa': True,
            'tiene_senderos_sencillos': True,
            'ideal_ninos_10_anos': True,
            'apto_grandes_autocaravanas': False,
            'permite_sacar_toldo': False,
        },
        {
            'nombre': 'Eco-Camping Costa Brava Calella',
            'descripcion': 'Acceso directo a calas cristalinas y al camino de ronda. Sombra de pinos centenarios y servicios limpios.',
            'latitud': 41.8906,
            'longitud': 3.1834,
            'pais': 'España',
            'comunidad_autonoma': 'Cataluña',
            'provincia': 'Girona',
            'poblacion': 'Palafrugell',
            'precio': 22.0,
            'es_gratuito': False,
            'tiene_agua': True,
            'tiene_lavabo': True,
            'tiene_duchas': True,
            'tiene_electricidad': True,
            'tiene_vaciado_aguas_grises': True,
            'tiene_vaciado_aguas_negras': True,
            'admite_mascotas': True,
            'tiene_wifi': True,
            'tiene_mesas_picnic': True,
            'es_zona_recreativa': True,
            'tiene_senderos_sencillos': True,
            'ideal_ninos_10_anos': True,
            'apto_grandes_autocaravanas': True,
            'permite_sacar_toldo': True,
        },
        {
            'nombre': 'Área Municipal Valle de Benasque',
            'descripcion': 'Ubicada a los pies del Aneto. Todos los servicios de vaciado y llenado disponibles todo el año.',
            'latitud': 42.6041,
            'longitud': 0.5228,
            'pais': 'España',
            'comunidad_autonoma': 'Aragón',
            'provincia': 'Huesca',
            'poblacion': 'Benasque',
            'precio': 8.0,
            'es_gratuito': False,
            'tiene_agua': True,
            'tiene_lavabo': True,
            'tiene_duchas': False,
            'tiene_electricidad': True,
            'tiene_vaciado_aguas_grises': True,
            'tiene_vaciado_aguas_negras': True,
            'admite_mascotas': True,
            'tiene_wifi': False,
            'tiene_mesas_picnic': False,
            'es_zona_recreativa': False,
            'tiene_senderos_sencillos': True,
            'ideal_ninos_10_anos': True,
            'apto_grandes_autocaravanas': True,
            'permite_sacar_toldo': False,
        }
    ]

    lugares_creados = []
    for info in lugares_info:
        lugar, _ = Lugar.objects.get_or_create(
            nombre=info['nombre'],
            defaults={**info, 'creador': admin}
        )
        lugares_creados.append(lugar)

    print("Registrando Check-ins iniciales y agrupando viajes...")
    # Registro de check-in para Álex en Benasque
    ch1, _ = CheckIn.objects.get_or_create(
        explorador=explorador,
        lugar=lugares_creados[3],
        defaults={
            'fecha_llegada': timezone.now() - timedelta(days=2),
            'dias_previstos': 2,
            'valoracion_camper': 5,
            'comentario_publico': 'Nieve en las cumbres y el área muy cómoda y limpia.',
            'notas_privadas': 'La toma de agua tiene rosca de 3/4. Hay panadería a 5 minutos andando.'
        }
    )
    agrupar_checkin_en_viaje(ch1)

    print("Creando publicaciones en el Diario de Ruta...")
    Publicacion.objects.get_or_create(
        autor=explorador,
        contenido='¡Comenzando la temporada de montaña en el Pirineo Aragonés! El aire fresco revitaliza el alma.',
        lugar=lugares_creados[3],
        defaults={'visibilidad': 'publico'}
    )

    print("Creando artículos en la Guía del Nómada...")
    articulos_data = [
        {
            'titulo': 'Servidores Multimedia Offline para Días de Lluvia en la Furgo',
            'slug': 'servidores-multimedia-offline-furgo',
            'categoria': 'tecnologia_offline',
            'resumen': 'Aprende a configurar una Raspberry Pi con Jellyfin o Plex y un disco SSD para ver cine y series sin consumir datos móviles.',
            'contenido': 'Cuando las tormentas azotan la costa o la montaña y estás dentro de tu camper, contar con entretenimiento sin conexión es oro puro. En esta guía paso a paso te explico cómo instalar un servidor multimedia portátil alimentado por USB de 5V y cómo conectar tus tablets o teléfonos a la red WiFi local sin gastar gigas.',
            'destacado': True
        },
        {
            'titulo': 'Guía Completa de Baterías LiFePO4 vs Baterías AGM',
            'slug': 'baterias-lifepo4-vs-agm',
            'categoria': 'electricidad',
            'resumen': 'Todo lo que necesitas saber sobre ciclos de carga, peso, profundidad de descarga (DOD) y boosters para tu instalación eléctrica.',
            'contenido': 'La transición a litio ferrofosfato (LiFePO4) es una de las mejores inversiones para cualquier viajero que pase semanas desconectado de la red eléctrica. Analizamos curvas de voltaje y configuraciones seguras con relés y BMS.',
            'destacado': True
        }
    ]

    for a in articulos_data:
        ArticuloGuia.objects.get_or_create(
            slug=a['slug'],
            defaults={**a, 'autor': admin}
        )

    print("Creando temas en el Taller Nómada...")
    taller_data = [
        {
            'titulo': 'Soporte articulado 3D para grifo extensible de fregadero',
            'categoria': 'piezas_3d',
            'descripcion': 'He diseñado en Fusion 360 este soporte para que el grifo no vibre durante la conducción por pistas forestales. Incluyo recomendaciones de impresión en PETG resistente a altas temperaturas en el habitáculo.',
        },
        {
            'titulo': 'Mantenimiento preventivo de la bomba Shurflo / Fiamma',
            'categoria': 'mantenimiento',
            'descripcion': 'Guía rápida para purgar y descalcificar los filtros del vaso de expansión antes del invierno para evitar roturas por heladas.',
        }
    ]

    for t in taller_data:
        TemaTaller.objects.get_or_create(
            titulo=t['titulo'],
            defaults={**t, 'autor': explorador}
        )

    print("¡Base de datos poblada con éxito con datos iniciales camper!")

if __name__ == '__main__':
    poblar_datos()