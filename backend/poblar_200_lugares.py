# -*- coding: utf-8 -*-
# Script para crear e introducir 200 lugares reales de acampada, pernocta y camper en Camplink
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'camplink_project.settings')
django.setup()

from exploradores.models import Explorador
from lugares.models import Lugar

LUGARES_200 = [
    # --- GALICIA (15) ---
    {
        "nombre": "Área Autocaravanas Cabo Home y Costa da Vela",
        "poblacion": "Cangas do Morrazo", "provincia": "Pontevedra", "comunidad_autonoma": "Galicia", "pais": "España",
        "latitud": 42.2741, "longitud": -8.8614, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Área camper con impresionantes vistas a las Islas Cíes y acantilados de Donón. Acceso a rutas senderistas hacia faros y playas salvajes.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Libre Mirador Cabo Fisterra",
        "poblacion": "Fisterra", "provincia": "A Coruña", "comunidad_autonoma": "Galicia", "pais": "España",
        "latitud": 42.8831, "longitud": -9.2806, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "El legendario fin del mundo. Estacionamiento en zona alta con vistas abiertas al Atlántico, atardeceres épicos y brisa oceánica.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Área Municipal de Camariñas - Costa da Morte",
        "poblacion": "Camariñas", "provincia": "A Coruña", "comunidad_autonoma": "Galicia", "pais": "España",
        "latitud": 43.1312, "longitud": -9.1824, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Área municipal en pleno puerto pesquero, cerca del Faro Vilán. Servicios de llenado y vaciado funcionando los 365 días.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Pernocta Castro de Baroña",
        "poblacion": "Porto do Son", "provincia": "A Coruña", "comunidad_autonoma": "Galicia", "pais": "España",
        "latitud": 42.6953, "longitud": -9.0189, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Aparcamiento junto al pinar y sendero que baja al asentamiento celta marítimo de Baroña y su playa nudista virgen.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Área Autocaravanas de Muros",
        "poblacion": "Muros", "provincia": "A Coruña", "comunidad_autonoma": "Galicia", "pais": "España",
        "latitud": 42.7761, "longitud": -9.0567, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Junto al paseo marítimo de la villa marinera de Muros. Nivelada, asfaltada y con vistas a la ría de Muros e Noia.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Área Camper Playa de Morouzos",
        "poblacion": "Ortigueira", "provincia": "A Coruña", "comunidad_autonoma": "Galicia", "pais": "España",
        "latitud": 43.6931, "longitud": -7.8421, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Ubicada entre un inmenso pinar costero y dunas de arena fina. Área recreativa con mesas de picnic y baños públicos en verano.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "es_zona_recreativa": True, "tiene_mesas_picnic": True
    },
    {
        "nombre": "Camping Playa de las Catedrales",
        "poblacion": "Ribadeo", "provincia": "Lugo", "comunidad_autonoma": "Galicia", "pais": "España",
        "latitud": 43.5539, "longitud": -7.1561, "tipo_lugar": "camping", "precio": 22.0, "es_gratuito": False,
        "descripcion": "Camping de primera categoría a pasos del monumento natural de As Catedrais. Parcelas con césped, luz y duchas con agua caliente.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_lavabo": True, "tiene_wifi": True, "playa_cercana": True, "ideal_familias": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta O Cebreiro - Camino de Santiago",
        "poblacion": "Pedrafita do Cebreiro", "provincia": "Lugo", "comunidad_autonoma": "Galicia", "pais": "España",
        "latitud": 42.7064, "longitud": -7.0425, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Pueblo mítico de pallozas tradicionales a 1.300 metros de altitud. Vistas espectaculares al amanecer sobre el mar de nubes de los valles.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Área Camper Cañones del Sil - Ribeira Sacra",
        "poblacion": "Parada de Sil", "provincia": "Ourense", "comunidad_autonoma": "Galicia", "pais": "España",
        "latitud": 42.3831, "longitud": -7.5714, "tipo_lugar": "area_autocaravanas", "precio": 6.0, "es_gratuito": False,
        "descripcion": "En el corazón de la Ribeira Sacra entre viñedos escarpados y monasterios románicos. Cerca de los miradores de Madrid.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True, "rutas_en_bici": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Área Municipal de Allariz",
        "poblacion": "Allariz", "provincia": "Ourense", "comunidad_autonoma": "Galicia", "pais": "España",
        "latitud": 42.1903, "longitud": -7.8014, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "A orillas del río Arnoia, junto al festival internacional de jardines y el casco histórico medieval galardonado.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "ideal_familias": True, "tiene_mesas_picnic": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas Illa de Arousa",
        "poblacion": "A Illa de Arousa", "provincia": "Pontevedra", "comunidad_autonoma": "Galicia", "pais": "España",
        "latitud": 42.5586, "longitud": -8.8683, "tipo_lugar": "area_autocaravanas", "precio": 9.0, "es_gratuito": False,
        "descripcion": "Ubicada en una isla unida por puente al continente. Salida directa al parque natural de Carreirón con calas vírgenes de arena blanca.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "rutas_en_bici": True, "admite_mascotas": True
    },
    {
        "nombre": "Camping Baiona Playa",
        "poblacion": "Baiona", "provincia": "Pontevedra", "comunidad_autonoma": "Galicia", "pais": "España",
        "latitud": 42.1228, "longitud": -8.8319, "tipo_lugar": "camping", "precio": 26.0, "es_gratuito": False,
        "descripcion": "Emplazado en una península rodeada de mar en la Ría de Vigo. Piscina con toboganes, supermercado, restaurante y acceso directo a la playa de Ladeira.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_lavabo": True, "tiene_wifi": True, "playa_cercana": True, "ideal_familias": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Parking Urbano Puerto de Rinlo",
        "poblacion": "Ribadeo", "provincia": "Lugo", "comunidad_autonoma": "Galicia", "pais": "España",
        "latitud": 43.5592, "longitud": -7.1064, "tipo_lugar": "parking_urbano", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Pueblo marinero famoso por sus antiguas cetáreas medievales y arroz con bogavante. Tranquilidad absoluta junto a las rocas del mar.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Recreativa Mondoñedo - A Fervenza",
        "poblacion": "Mondoñedo", "provincia": "Lugo", "comunidad_autonoma": "Galicia", "pais": "España",
        "latitud": 43.4289, "longitud": -7.3625, "tipo_lugar": "area_recreativa", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Junto a la cascada de A Fervenza y antiguos molinos. Sombra densa bajo robles y castaños centenarios, mesas de piedra y agua fresca.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_mesas_picnic": True, "es_zona_recreativa": True, "mucha_sombra": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Camper Sanxenxo - Rías Baixas",
        "poblacion": "Sanxenxo", "provincia": "Pontevedra", "comunidad_autonoma": "Galicia", "pais": "España",
        "latitud": 42.4042, "longitud": -8.8094, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "Instalaciones de máxima calidad para campers cerca de la playa de Silgar y Portonovo. Duchas, lavandería y parcelas delimitadas con seto.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_lavabo": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "permite_sacar_toldo": True
    },

    # --- ASTURIAS (12) ---
    {
        "nombre": "Pernocta Cabo Peñas",
        "poblacion": "Gozón", "provincia": "Asturias", "comunidad_autonoma": "Principado de Asturias", "pais": "España",
        "latitud": 43.6558, "longitud": -5.8483, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "El punto más septentrional de Asturias. Acantilados de más de 100 metros sobre el mar Cantábrico y centro de interpretación del medio marino.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Camping Playa de Poo - Llanes",
        "poblacion": "Llanes", "provincia": "Asturias", "comunidad_autonoma": "Principado de Asturias", "pais": "España",
        "latitud": 43.4283, "longitud": -4.7869, "tipo_lugar": "camping", "precio": 24.0, "es_gratuito": False,
        "descripcion": "Situado frente a la ensenada natural de Poo, una piscina de agua de mar sin oleaje perfecta para niños. Conexión eléctrica y bar.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_wifi": True, "playa_cercana": True, "ideal_familias": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Área Camper Cudillero - El Pito",
        "poblacion": "Cudillero", "provincia": "Asturias", "comunidad_autonoma": "Principado de Asturias", "pais": "España",
        "latitud": 43.5572, "longitud": -6.1472, "tipo_lugar": "area_autocaravanas", "precio": 9.0, "es_gratuito": False,
        "descripcion": "A 1 km del pintoresco anfiteatro marinero de Cudillero y el Palacio Selgas. Muy tranquila, con césped y todos los servicios.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Área Municipal Pola de Somiedo",
        "poblacion": "Somiedo", "provincia": "Asturias", "comunidad_autonoma": "Principado de Asturias", "pais": "España",
        "latitud": 43.0931, "longitud": -6.2558, "tipo_lugar": "area_autocaravanas", "precio": 5.0, "es_gratuito": False,
        "descripcion": "En la capital del Parque Natural de Somiedo, Reserva de la Biosfera. Punto de partida para la ruta de los Lagos de Saliencia y brañas vaqueiras.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Camping Naranjo de Bulnes - Arenas de Cabrales",
        "poblacion": "Cabrales", "provincia": "Asturias", "comunidad_autonoma": "Principado de Asturias", "pais": "España",
        "latitud": 43.3039, "longitud": -4.8194, "tipo_lugar": "camping", "precio": 21.0, "es_gratuito": False,
        "descripcion": "A orillas del río Cares, base ideal para la Ruta del Cares y el funicular de Bulnes. Césped sombreado y vistas directas a los Picos de Europa.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_wifi": True, "mucha_sombra": True, "tiene_senderismo": True, "ideal_familias": True
    },
    {
        "nombre": "Área Autocaravanas Cangas de Onís",
        "poblacion": "Cangas de Onís", "provincia": "Asturias", "comunidad_autonoma": "Principado de Asturias", "pais": "España",
        "latitud": 43.3514, "longitud": -5.1322, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Junto a la estación de autobuses que sube a los Lagos de Covadonga. Muy céntrica para visitar el Puente Romano y el mercado dominical.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True, "admite_mascotas": True
    },
    {
        "nombre": "Parking Tazones Puerto Pesquero",
        "poblacion": "Villaviciosa", "provincia": "Asturias", "comunidad_autonoma": "Principado de Asturias", "pais": "España",
        "latitud": 43.5414, "longitud": -5.3986, "tipo_lugar": "parking_urbano", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Aparcamiento en la parte alta de Tazones, famoso por sus huellas de dinosaurio y marisquerías tradicionales sobre el cantil.",
        "tiene_agua": False, "playa_cercana": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Camper Ribadesella",
        "poblacion": "Ribadesella", "provincia": "Asturias", "comunidad_autonoma": "Principado de Asturias", "pais": "España",
        "latitud": 43.4619, "longitud": -5.0611, "tipo_lugar": "area_autocaravanas", "precio": 8.0, "es_gratuito": False,
        "descripcion": "Cerca de la desembocadura del Sella y la Cueva de Tito Bustillo. Carril bici llano hasta la playa de Santa Marina.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "rutas_en_bici": True, "playa_cercana": True
    },
    {
        "nombre": "Área Recreativa Teixois - Taramundi",
        "poblacion": "Taramundi", "provincia": "Asturias", "comunidad_autonoma": "Principado de Asturias", "pais": "España",
        "latitud": 43.3597, "longitud": -7.1089, "tipo_lugar": "area_recreativa", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Valle verde entre arroyos y batanes hidráulicos en funcionamiento. Mesas de madera, fuentes de agua pura y bosque atlántico.",
        "tiene_agua": True, "tiene_mesas_picnic": True, "es_zona_recreativa": True, "mucha_sombra": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Autocaravanas Luarca",
        "poblacion": "Valdés", "provincia": "Asturias", "comunidad_autonoma": "Principado de Asturias", "pais": "España",
        "latitud": 43.5392, "longitud": -6.5333, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Área municipal en la villa blanca de la costa verde. Conexión rápida al cementerio marinero y al faro de Luarca.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Pernocta San Juan de La Arena",
        "poblacion": "Soto del Barco", "provincia": "Asturias", "comunidad_autonoma": "Principado de Asturias", "pais": "España",
        "latitud": 43.5603, "longitud": -6.0758, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Frente a la playa de Los Quebrantos y la ría del Nalón. Césped, sendero de los miradores y surf.",
        "tiene_agua": False, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Nómada Castropol - Ría del Eo",
        "poblacion": "Castropol", "provincia": "Asturias", "comunidad_autonoma": "Principado de Asturias", "pais": "España",
        "latitud": 43.5286, "longitud": -7.0294, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Mirador excepcional a la Ría del Eo limitando con Galicia. Vaciado y llenado gratuito, brisa suave y tranquilidad nocturna.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "admite_mascotas": True
    },

    # --- CANTABRIA (10) ---
    {
        "nombre": "Área Camper Potes y Valle de Liébana",
        "poblacion": "Potes", "provincia": "Cantabria", "comunidad_autonoma": "Cantabria", "pais": "España",
        "latitud": 43.1539, "longitud": -4.6231, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Puerta de entrada oriental a Picos de Europa y teleférico de Fuente Dé. Rodeada de huertos frutales y cumbres rocosas.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Camping Suances - Playa de Los Locos",
        "poblacion": "Suances", "provincia": "Cantabria", "comunidad_autonoma": "Cantabria", "pais": "España",
        "latitud": 43.4358, "longitud": -4.0411, "tipo_lugar": "camping", "precio": 23.0, "es_gratuito": False,
        "descripcion": "Referente europeo del surf. Parcelas con hierba verde sobre el acantilado mirando a las olas de Los Locos y La Concha.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_wifi": True, "playa_cercana": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas Parque de Cabárceno",
        "poblacion": "Penagos", "provincia": "Cantabria", "comunidad_autonoma": "Cantabria", "pais": "España",
        "latitud": 43.3589, "longitud": -3.8183, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Situada junto al lago del Acebo y la entrada sur de Cabárceno. Se pueden escuchar los osos y elefantes por la mañana.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "ideal_familias": True, "ideal_ninos_10_anos": True
    },
    {
        "nombre": "Área Municipal de Liérganes",
        "poblacion": "Liérganes", "provincia": "Cantabria", "comunidad_autonoma": "Cantabria", "pais": "España",
        "latitud": 43.3442, "longitud": -3.7431, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Junto a la estación de tren FEVE (enlace directo a Santander) y barrio histórico de los maestros de cañones y el Hombre Pez.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Camper Santoña - Marismas de Victoria",
        "poblacion": "Santoña", "provincia": "Cantabria", "comunidad_autonoma": "Cantabria", "pais": "España",
        "latitud": 43.4478, "longitud": -3.4608, "tipo_lugar": "area_autocaravanas", "precio": 8.0, "es_gratuito": False,
        "descripcion": "Ideal para avistamiento de aves migratorias en el parque natural. A un paso del monte Buciero y la subida al Faro del Caballo.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Camping Playa Joyel - Noja",
        "poblacion": "Noja", "provincia": "Cantabria", "comunidad_autonoma": "Cantabria", "pais": "España",
        "latitud": 43.4839, "longitud": -3.5186, "tipo_lugar": "camping", "precio": 28.0, "es_gratuito": False,
        "descripcion": "Resort familiar de primera línea con parque de animales propio, piscinas, supermercado y salida a la playa de Ris.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_lavabo": True, "tiene_wifi": True, "ideal_familias": True, "playa_cercana": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Parking Urbano Santillana del Mar",
        "poblacion": "Santillana del Mar", "provincia": "Cantabria", "comunidad_autonoma": "Cantabria", "pais": "España",
        "latitud": 43.3892, "longitud": -4.1089, "tipo_lugar": "parking_urbano", "precio": 4.0, "es_gratuito": False,
        "descripcion": "Aparcamiento amplio y cómodo a 500 metros de la Colegiata románica y la cueva de Altamira. Muy seguro de noche.",
        "tiene_agua": False, "acceso_asfaltado": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Recreativa Fontibre - Nacimiento del Ebro",
        "poblacion": "Hermandad de Campoo de Suso", "provincia": "Cantabria", "comunidad_autonoma": "Cantabria", "pais": "España",
        "latitud": 43.0189, "longitud": -4.1958, "tipo_lugar": "area_recreativa", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Monumento natural donde brota el río más caudaloso de la península. Bosque espeso de fresnos y robles con mesas y sombras frescas.",
        "tiene_agua": True, "tiene_mesas_picnic": True, "es_zona_recreativa": True, "mucha_sombra": True, "ideal_familias": True
    },
    {
        "nombre": "Pernocta Acantilados de Cóbreces - Playa Luaña",
        "poblacion": "Alfoz de Lloredo", "provincia": "Cantabria", "comunidad_autonoma": "Cantabria", "pais": "España",
        "latitud": 43.3931, "longitud": -4.2081, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Entre prados cántabros y la ensenada dorada de Luaña. Muy tranquilo fuera de julio y agosto, sonido relajante del oleaje.",
        "tiene_agua": False, "playa_cercana": True, "admite_mascotas": True
    },
    {
        "nombre": "Punto Solo Servicios Camper Autovía del Cantábrico A-8",
        "poblacion": "Caviedes", "provincia": "Cantabria", "comunidad_autonoma": "Cantabria", "pais": "España",
        "latitud": 43.3361, "longitud": -4.3822, "tipo_lugar": "solo_servicios", "precio": 2.0, "es_gratuito": False,
        "descripcion": "Punto de servicio rápido en ruta. Vaciado automático de aguas sucias, limpieza de potti químico y llenado de agua potable presurizada.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True, "apto_grandes_autocaravanas": True
    },

    # --- PAÍS VASCO (12) ---
    {
        "nombre": "Área Autocaravanas Donostia - San Sebastián",
        "poblacion": "Donostia-San Sebastián", "provincia": "Gipuzkoa", "comunidad_autonoma": "País Vasco", "pais": "España",
        "latitud": 43.3078, "longitud": -2.0142, "tipo_lugar": "area_autocaravanas", "precio": 11.0, "es_gratuito": False,
        "descripcion": "Ubicada en el campus universitario de Ibaeta. Carril bici bidegorri directo hasta la playa de Ondarreta y la Bahía de La Concha.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "rutas_en_bici": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Camping & Caravan Zumaia Flysch",
        "poblacion": "Zumaia", "provincia": "Gipuzkoa", "comunidad_autonoma": "País Vasco", "pais": "España",
        "latitud": 43.2917, "longitud": -2.2536, "tipo_lugar": "camping", "precio": 25.0, "es_gratuito": False,
        "descripcion": "En la colina sobre el Geoparque de la Costa Vasca y la ermita de San Telmo. Piscinas, restaurante vasco y parcelas verdes.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_wifi": True, "playa_cercana": True, "tiene_senderismo": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Mirador de Mundaka",
        "poblacion": "Mundaka", "provincia": "Bizkaia", "comunidad_autonoma": "País Vasco", "pais": "España",
        "latitud": 43.4072, "longitud": -2.6989, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Frente a la desembocadura de la ría de Urdaibai y la ola de izquierdas más famosa del mundo. Atmósfera puramente surfera.",
        "tiene_agua": False, "playa_cercana": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas de Bermeo",
        "poblacion": "Bermeo", "provincia": "Bizkaia", "comunidad_autonoma": "País Vasco", "pais": "España",
        "latitud": 43.4244, "longitud": -2.7267, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Área municipal en la parte alta de la villa, con parada de autobús para visitar San Juan de Gaztelugatxe y el puerto pesquero.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Área Camper Hondarribia - Puerto Deportivo",
        "poblacion": "Hondarribia", "provincia": "Gipuzkoa", "comunidad_autonoma": "País Vasco", "pais": "España",
        "latitud": 43.3761, "longitud": -1.7911, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "Junto a la playa y marina de Hondarribia. Servicio de barco taxí marítimo en 5 minutos a Hendaya (Francia) y paseo medieval.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Área Autocaravanas Vitoria-Gasteiz - Lakua",
        "poblacion": "Vitoria-Gasteiz", "provincia": "Araba/Álava", "comunidad_autonoma": "País Vasco", "pais": "España",
        "latitud": 42.8683, "longitud": -2.6847, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Área de referencia europea en el anillo verde. Parada de tranvía en la misma puerta hacia la Virgen Blanca y la Catedral Vieja.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "rutas_en_bici": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Pernocta Faro de Lekeitio - Santa Katalina",
        "poblacion": "Lekeitio", "provincia": "Bizkaia", "comunidad_autonoma": "País Vasco", "pais": "España",
        "latitud": 43.3708, "longitud": -2.5028, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Aparcamiento sobre los acantilados del faro y la isla de San Nicolás (accesible a pie con marea baja). Naturaleza y mar.",
        "tiene_agua": False, "tiene_senderismo": True, "playa_cercana": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Recreativa Parque Natural de Gorbeia",
        "poblacion": "Areatza", "provincia": "Bizkaia", "comunidad_autonoma": "País Vasco", "pais": "España",
        "latitud": 43.1194, "longitud": -2.8361, "tipo_lugar": "area_recreativa", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Rodeada del famoso hayedo de Otzarreta y arroyos serpenteantes. Gran explanada de césped con mesas rústicas y barbacoas en invierno.",
        "tiene_agua": True, "tiene_mesas_picnic": True, "es_zona_recreativa": True, "mucha_sombra": True, "tiene_senderismo": True
    },
    {
        "nombre": "Camping Talai Mendi - Zarautz",
        "poblacion": "Zarautz", "provincia": "Gipuzkoa", "comunidad_autonoma": "País Vasco", "pais": "España",
        "latitud": 43.2872, "longitud": -2.1583, "tipo_lugar": "camping", "precio": 22.0, "es_gratuito": False,
        "descripcion": "Situado en la ladera del monte con vistas panorámicas a toda la bahía de Zarautz y Getaria. Ambiente joven y surfero.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "playa_cercana": True, "admite_mascotas": True
    },
    {
        "nombre": "Parking Mirador Elantxobe",
        "poblacion": "Elantxobe", "provincia": "Bizkaia", "comunidad_autonoma": "País Vasco", "pais": "España",
        "latitud": 43.4031, "longitud": -2.6406, "tipo_lugar": "parking_urbano", "precio": 0.0, "es_gratuito": True,
        "descripcion": "En lo alto del pueblo colgado del cabo Ogoño. No bajar con vehículos grandes por la pendiente extrema; aparcar arriba y bajar caminando.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Pernocta Puerto de Urkiola",
        "poblacion": "Abadiño", "provincia": "Bizkaia", "comunidad_autonoma": "País Vasco", "pais": "España",
        "latitud": 43.1311, "longitud": -2.6394, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Junto al Santuario de Urkiola y los riscos calizos del monte Anboto, hogar de la diosa mitológica Mari. Aire de alta montaña.",
        "tiene_agua": True, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas Laguardia - Rioja Alavesa",
        "poblacion": "Laguardia", "provincia": "Araba/Álava", "comunidad_autonoma": "País Vasco", "pais": "España",
        "latitud": 42.5519, "longitud": -2.5853, "tipo_lugar": "area_autocaravanas", "precio": 5.0, "es_gratuito": False,
        "descripcion": "A los pies de la muralla medieval de Laguardia, rodeada del mar de viñedos de la Sonsierra y la Sierra de Cantabria.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True, "rutas_en_bici": True
    },

    # --- NAVARRA (10) ---
    {
        "nombre": "Área Nómada Selva de Irati - Ochagavía",
        "poblacion": "Ochagavía/Otsagabia", "provincia": "Navarra", "comunidad_autonoma": "Navarra", "pais": "España",
        "latitud": 42.9056, "longitud": -1.0911, "tipo_lugar": "area_autocaravanas", "precio": 8.0, "es_gratuito": False,
        "descripcion": "El segundo hayedo-abetal más extenso y mejor conservado de Europa tras la Selva Negra. Rutas otoñales impresionantes y cielo limpio.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True, "mucha_sombra": True
    },
    {
        "nombre": "Área Autocaravanas Olite",
        "poblacion": "Olite", "provincia": "Navarra", "comunidad_autonoma": "Navarra", "pais": "España",
        "latitud": 42.4831, "longitud": -1.6508, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "A 5 minutos a pie del majestuoso Palacio Real de los Reyes de Navarra. Silenciosa, asfaltada y con bodegas cercanas.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Área Autocaravanas Pamplona - Trinitarios",
        "poblacion": "Pamplona/Iruña", "provincia": "Navarra", "comunidad_autonoma": "Navarra", "pais": "España",
        "latitud": 42.8222, "longitud": -1.6567, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Área vigilada junto al río Arga con ascensor urbano gratuito directo a las murallas y centro histórico de Pamplona.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "rutas_en_bici": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Pernocta Nacedero del Urederra",
        "poblacion": "Baquedano", "provincia": "Navarra", "comunidad_autonoma": "Navarra", "pais": "España",
        "latitud": 42.7844, "longitud": -2.1228, "tipo_lugar": "pernocta_libre", "precio": 5.0, "es_gratuito": False,
        "descripcion": "Aparcamiento oficial para visitar las pozas turquesas del Urederra en la Sierra de Urbasa. Entorno de robles y quejigos.",
        "tiene_agua": True, "tiene_lavabo": True, "tiene_senderismo": True, "ideal_familias": True
    },
    {
        "nombre": "Área Camper Roncesvalles - Colegiata",
        "poblacion": "Orreaga/Roncesvalles", "provincia": "Navarra", "comunidad_autonoma": "Navarra", "pais": "España",
        "latitud": 43.0094, "longitud": -1.3197, "tipo_lugar": "area_autocaravanas", "precio": 6.0, "es_gratuito": False,
        "descripcion": "Punto de inicio en España del Camino Francés a Santiago. Atmósfera de peregrinación, historia carolingia y bosques pirenaicos.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Camping Urrobi - Valle de Arce",
        "poblacion": "Aurizberri/Espinal", "provincia": "Navarra", "comunidad_autonoma": "Navarra", "pais": "España",
        "latitud": 42.9811, "longitud": -1.3736, "tipo_lugar": "camping", "precio": 20.0, "es_gratuito": False,
        "descripcion": "Camping de montaña a orillas de un arroyo truchero. Piscina fluvial en verano, restaurante navarro casero y mucha tranquilidad.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_wifi": True, "mucha_sombra": True, "ideal_familias": True
    },
    {
        "nombre": "Pernocta Valle de Baztan - Elizondo",
        "poblacion": "Elizondo", "provincia": "Navarra", "comunidad_autonoma": "Navarra", "pais": "España",
        "latitud": 43.1469, "longitud": -1.5217, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "El valle mágico de la trilogía del Baztan. Casonas señoriales con balcones de madera, chocolaterías y verde infinito.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas Castillo de Javier",
        "poblacion": "Javier", "provincia": "Navarra", "comunidad_autonoma": "Navarra", "pais": "España",
        "latitud": 42.5936, "longitud": -1.2153, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Frente al castillo medieval cuna del patrón navarro. Zona ajardinada, muy nivelada y tranquila por la noche.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "terreno_nivelado": True
    },
    {
        "nombre": "Parking Urbano Tudela - Ribera del Ebro",
        "poblacion": "Tudela", "provincia": "Navarra", "comunidad_autonoma": "Navarra", "pais": "España",
        "latitud": 42.0628, "longitud": -1.6044, "tipo_lugar": "parking_urbano", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Junto al río Ebro y el puente de piedra. Perfecto para tapear verduras de la Ribera en la plaza de los Fueros.",
        "tiene_agua": False, "acceso_asfaltado": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Recreativa Cerco de Artajona",
        "poblacion": "Artajona", "provincia": "Navarra", "comunidad_autonoma": "Navarra", "pais": "España",
        "latitud": 42.5911, "longitud": -1.7644, "tipo_lugar": "area_recreativa", "precio": 0.0, "es_gratuito": True,
        "descripcion": "A los pies de la fortificación medieval mejor conservada de Navarra. Mesas de picnic con vistas a las almenas y torres.",
        "tiene_agua": True, "tiene_mesas_picnic": True, "es_zona_recreativa": True, "tiene_senderismo": True
    },

    # --- ARAGÓN (14) ---
    {
        "nombre": "Área Autocaravanas Albarracín",
        "poblacion": "Albarracín", "provincia": "Teruel", "comunidad_autonoma": "Aragón", "pais": "España",
        "latitud": 40.4078, "longitud": -1.4428, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Frente a uno de los pueblos medievales más bonitos del mundo. Muralla encaramada a la cresta y río Guadalaviar.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Camper Aínsa - Sobrarbe",
        "poblacion": "Aínsa-Sobrarbe", "provincia": "Huesca", "comunidad_autonoma": "Aragón", "pais": "España",
        "latitud": 42.4189, "longitud": 0.1383, "tipo_lugar": "area_autocaravanas", "precio": 7.0, "es_gratuito": False,
        "descripcion": "La meca del ciclismo de montaña (Zona Zero) y puerta a Ordesa y Monte Perdido. A 5 minutos a pie de la Plaza Mayor empedrada.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "rutas_en_bici": True, "tiene_senderismo": True
    },
    {
        "nombre": "Camping Aneto - Valle de Benasque",
        "poblacion": "Benasque", "provincia": "Huesca", "comunidad_autonoma": "Aragón", "pais": "España",
        "latitud": 42.6075, "longitud": 0.5286, "tipo_lugar": "camping", "precio": 24.0, "es_gratuito": False,
        "descripcion": "Bajo la cumbre más alta de los Pirineos. Parcelas arboladas con césped, vistas al glaciar del Aneto y piscina climatizada.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_wifi": True, "tiene_senderismo": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Torla - Parque Nacional de Ordesa",
        "poblacion": "Torla-Ordesa", "provincia": "Huesca", "comunidad_autonoma": "Aragón", "pais": "España",
        "latitud": 42.6283, "longitud": -0.1114, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Aparcamiento junto al centro de visitantes y salida de los autobuses lanzadera a la Pradera de Ordesa y Cola de Caballo.",
        "tiene_agua": True, "tiene_lavabo": True, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Pernocta Mallos de Riglos",
        "poblacion": "Las Peñas de Riglos", "provincia": "Huesca", "comunidad_autonoma": "Aragón", "pais": "España",
        "latitud": 42.3486, "longitud": -0.7258, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Bajo los colosales farallones de conglomerado rojo favoritos de escaladores y buitres leonados. Puesta de sol inolvidable.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas Tarazona - Moncayo",
        "poblacion": "Tarazona", "provincia": "Zaragoza", "comunidad_autonoma": "Aragón", "pais": "España",
        "latitud": 41.9042, "longitud": -1.7247, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Ciudad mudéjar con su singular plaza de toros octogonal. Muy cerca del Parque Natural del Moncayo y sus hayedos.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Camping Monasterio de Piedra - Nuévalos",
        "poblacion": "Nuévalos", "provincia": "Zaragoza", "comunidad_autonoma": "Aragón", "pais": "España",
        "latitud": 41.2189, "longitud": -1.7828, "tipo_lugar": "camping", "precio": 21.0, "es_gratuito": False,
        "descripcion": "Junto al embalse de La Tranquera y a minutos del parque jardín de cascadas y grutas kársticas del Monasterio de Piedra.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "ideal_familias": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Área Autocaravanas Alquézar - Sierra de Guara",
        "poblacion": "Alquézar", "provincia": "Huesca", "comunidad_autonoma": "Aragón", "pais": "España",
        "latitud": 42.1728, "longitud": 0.0267, "tipo_lugar": "area_autocaravanas", "precio": 6.0, "es_gratuito": False,
        "descripcion": "Capital del barranquismo europeo y pasarelas sobre el cañón del río Vero. Villa medieval amurallada sobre la roca.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Autocaravanas Teruel - Los Planos",
        "poblacion": "Teruel", "provincia": "Teruel", "comunidad_autonoma": "Aragón", "pais": "España",
        "latitud": 40.3294, "longitud": -1.0967, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Frente a Dinópolis, parque de dinosaurios ideal para niños. Conexión rápida al centro histórico de los Amantes de Teruel.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "ideal_familias": True, "ideal_ninos_10_anos": True
    },
    {
        "nombre": "Pernocta Valle de Ansó - Zuriza",
        "poblacion": "Ansó", "provincia": "Huesca", "comunidad_autonoma": "Aragón", "pais": "España",
        "latitud": 42.8611, "longitud": -0.8197, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Praderas pirenaicas vírgenes en el límite con Navarra y Francia. Ideal para contemplar las estrellas sin contaminación lumínica.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Camper Panticosa - Valle de Tena",
        "poblacion": "Panticosa", "provincia": "Huesca", "comunidad_autonoma": "Aragón", "pais": "España",
        "latitud": 42.7231, "longitud": -0.3392, "tipo_lugar": "area_autocaravanas", "precio": 8.0, "es_gratuito": False,
        "descripcion": "Junto al telecabina y las pasarelas colgantes del río Caldarés. Balneario termal histórico a 8 km valle arriba.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Recreativa Mora de Rubielos - Sierra de Gúdar",
        "poblacion": "Mora de Rubielos", "provincia": "Teruel", "comunidad_autonoma": "Aragón", "pais": "España",
        "latitud": 40.2528, "longitud": -0.7519, "tipo_lugar": "area_recreativa", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Pinar de montaña con fuentes y merendero bajo el castillo palacio gótico de los Fernández de Heredia.",
        "tiene_agua": True, "tiene_mesas_picnic": True, "es_zona_recreativa": True, "mucha_sombra": True
    },
    {
        "nombre": "Área Autocaravanas Sos del Rey Católico",
        "poblacion": "Sos del Rey Católico", "provincia": "Zaragoza", "comunidad_autonoma": "Aragón", "pais": "España",
        "latitud": 42.4967, "longitud": -1.2158, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Cuna del Rey Fernando el Católico en las Cinco Villas. Mirador a las murallas de piedra y calles empedradas.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "terreno_nivelado": True
    },
    {
        "nombre": "Punto Solo Servicios Autovía Mudéjar A-23 - Cariñena",
        "poblacion": "Cariñena", "provincia": "Zaragoza", "comunidad_autonoma": "Aragón", "pais": "España",
        "latitud": 41.3364, "longitud": -1.2239, "tipo_lugar": "solo_servicios", "precio": 2.0, "es_gratuito": False,
        "descripcion": "Servicios camper en ruta entre Zaragoza y Teruel. Plataforma de vaciado rápido y suministro de agua para viajes largos.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },

    # --- CATALUÑA (16) ---
    {
        "nombre": "Pernocta Cap de Creus - Cadaqués",
        "poblacion": "Cadaqués", "provincia": "Girona", "comunidad_autonoma": "Cataluña", "pais": "España",
        "latitud": 42.3189, "longitud": 3.3144, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Parque natural esculpido por el viento de Tramuntana que inspiró a Salvador Dalí. Paisaje lunar junto al faro y mar cristalino.",
        "tiene_agua": False, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Camping Voraparc - Aigüestortes",
        "poblacion": "Espot", "provincia": "Lleida", "comunidad_autonoma": "Cataluña", "pais": "España",
        "latitud": 42.5761, "longitud": 1.0872, "tipo_lugar": "camping", "precio": 24.0, "es_gratuito": False,
        "descripcion": "Puerta de entrada al lago de San Mauricio y Los Encantats. Parcelas junto al río con piscina y naturaleza pirenaica pura.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_wifi": True, "tiene_senderismo": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Área Autocaravanas Delta del Ebro - Poblenou",
        "poblacion": "Amposta", "provincia": "Tarragona", "comunidad_autonoma": "Cataluña", "pais": "España",
        "latitud": 40.6483, "longitud": 0.6867, "tipo_lugar": "area_autocaravanas", "precio": 9.0, "es_gratuito": False,
        "descripcion": "Entre arrozales infinitos y lagunas de flamencos rosas. Vías ciclables llanas y gastronomía de arroces en el delta.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "rutas_en_bici": True, "playa_cercana": True
    },
    {
        "nombre": "Pernocta Monasterio de Montserrat",
        "poblacion": "Monistrol de Montserrat", "provincia": "Barcelona", "comunidad_autonoma": "Cataluña", "pais": "España",
        "latitud": 41.5928, "longitud": 1.8375, "tipo_lugar": "pernocta_libre", "precio": 6.5, "es_gratuito": False,
        "descripcion": "Aparcamiento vigilado con vistas místicas a las agujas rocosas de Montserrat y el santuario de la Moreneta.",
        "tiene_agua": True, "tiene_lavabo": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Camper Rupit i Pruit - Collsacabra",
        "poblacion": "Rupit", "provincia": "Barcelona", "comunidad_autonoma": "Cataluña", "pais": "España",
        "latitud": 42.0236, "longitud": 2.4658, "tipo_lugar": "area_autocaravanas", "precio": 5.0, "es_gratuito": False,
        "descripcion": "Pueblo medieval con puente colgante de madera y cascada del Salt de Sallent. Muy verde y silencioso.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Pernocta Siurana - Acantilados del Priorat",
        "poblacion": "Cornudella de Montsant", "provincia": "Tarragona", "comunidad_autonoma": "Cataluña", "pais": "España",
        "latitud": 41.2575, "longitud": 0.9328, "tipo_lugar": "pernocta_libre", "precio": 3.0, "es_gratuito": False,
        "descripcion": "El último bastión musulmán de Cataluña, colgado sobre paredes de roca vertiginosas y el embalse turquesa de Siurana.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas Besalú",
        "poblacion": "Besalú", "provincia": "Girona", "comunidad_autonoma": "Cataluña", "pais": "España",
        "latitud": 42.1983, "longitud": 2.7011, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Junto al majestuoso puente medieval fortificado sobre el río Fluvià y el barrio judío. Plazas delimitadas.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Camping Interpals Eco Resort - Costa Brava",
        "poblacion": "Pals", "provincia": "Girona", "comunidad_autonoma": "Cataluña", "pais": "España",
        "latitud": 41.9861, "longitud": 3.1894, "tipo_lugar": "camping", "precio": 27.0, "es_gratuito": False,
        "descripcion": "Entre el pueblo medieval de Pals y la playa con vistas a las Islas Medas. Pinar espeso, pistas de tenis y ambiente familiar.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_wifi": True, "playa_cercana": True, "ideal_familias": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Área Camper Taüll - Vall de Boí",
        "poblacion": "La Vall de Boí", "provincia": "Lleida", "comunidad_autonoma": "Cataluña", "pais": "España",
        "latitud": 42.5186, "longitud": 0.8497, "tipo_lugar": "area_autocaravanas", "precio": 8.0, "es_gratuito": False,
        "descripcion": "Bajo la torre románica de Sant Climent de Taüll (Patrimonio de la Humanidad). Aire puro y esquí de Boí Taüll.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Pernocta Congost de Mont-rebei",
        "poblacion": "Àger", "provincia": "Lleida", "comunidad_autonoma": "Cataluña", "pais": "España",
        "latitud": 42.0672, "longitud": 0.6978, "tipo_lugar": "pernocta_libre", "precio": 5.0, "es_gratuito": False,
        "descripcion": "Desfiladero tallado por el río Noguera Ribagorzana con pasarelas de madera colgadas de la pared de roca vertical.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas Camprodon - Pirineos",
        "poblacion": "Camprodon", "provincia": "Girona", "comunidad_autonoma": "Cataluña", "pais": "España",
        "latitud": 42.3131, "longitud": 2.3664, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Junto al río Ter y el Pont Nou del siglo XII. Muy agradable en verano por sus temperaturas suaves y paseos fluviales.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Área Camper Sitges - Garraf",
        "poblacion": "Sitges", "provincia": "Barcelona", "comunidad_autonoma": "Cataluña", "pais": "España",
        "latitud": 41.2408, "longitud": 1.8089, "tipo_lugar": "area_autocaravanas", "precio": 14.0, "es_gratuito": False,
        "descripcion": "Conexión directa en tren Rodalies al centro de Barcelona en 30 minutos y playas de Sitges a 10 minutos a pie.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True
    },
    {
        "nombre": "Área Recreativa Lago de Banyoles",
        "poblacion": "Banyoles", "provincia": "Girona", "comunidad_autonoma": "Cataluña", "pais": "España",
        "latitud": 42.1286, "longitud": 2.7533, "tipo_lugar": "area_recreativa", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Alrededor del lago natural más grande de Cataluña. Ruta llana circular para pasear o montar en bici bajo árboles frondosos.",
        "tiene_agua": True, "tiene_mesas_picnic": True, "es_zona_recreativa": True, "rutas_en_bici": True, "ideal_familias": True
    },
    {
        "nombre": "Área Autocaravanas Falset - Capital del Priorat",
        "poblacion": "Falset", "provincia": "Tarragona", "comunidad_autonoma": "Cataluña", "pais": "España",
        "latitud": 41.1444, "longitud": 0.8192, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Tierra de grandes vinos y bodegas modernistas (catedrales del vino). Con todos los servicios para autocaravanas.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Camping Berga Resort - Prepirineo",
        "poblacion": "Berga", "provincia": "Barcelona", "comunidad_autonoma": "Cataluña", "pais": "España",
        "latitud": 42.0911, "longitud": 1.8436, "tipo_lugar": "camping", "precio": 29.0, "es_gratuito": False,
        "descripcion": "Camping de lujo abierto todo el año con circuito termal spa, wellness, gimnasio, pistas de pádel y parcelas con baño individual privado.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_wifi": True, "ideal_familias": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Parking Urbano Tossa de Mar",
        "poblacion": "Tossa de Mar", "provincia": "Girona", "comunidad_autonoma": "Cataluña", "pais": "España",
        "latitud": 41.7228, "longitud": 2.9286, "tipo_lugar": "parking_urbano", "precio": 12.0, "es_gratuito": False,
        "descripcion": "Estacionamiento autorizado para autocaravanas a pocos metros de la muralla que vigila la playa y el cabo de Tossa.",
        "tiene_agua": False, "acceso_asfaltado": True, "playa_cercana": True
    },

    # --- CASTILLA Y LEÓN (22) ---
    {
        "nombre": "Área Camper Posada de Valdeón - Picos de Europa",
        "poblacion": "Posada de Valdeón", "provincia": "León", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 43.1517, "longitud": -4.9189, "tipo_lugar": "area_autocaravanas", "precio": 8.0, "es_gratuito": False,
        "descripcion": "En el fondo del valle entre las cumbres más agrestes de Picos de Europa. Inicio sur de la mítica Ruta del Cares.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Pernocta Mirador de Orellán - Las Médulas",
        "poblacion": "Borrenes", "provincia": "León", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 42.4597, "longitud": -6.7483, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Frente al paisaje rojizo de la mayor mina de oro a cielo abierto del Imperio Romano, rodeado de castaños centenarios.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas Pedraza",
        "poblacion": "Pedraza", "provincia": "Segovia", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 41.1306, "longitud": -3.8111, "tipo_lugar": "area_autocaravanas", "precio": 5.0, "es_gratuito": False,
        "descripcion": "A los pies de la muralla y puerta única de acceso a la villa medieval de las velas y el asado segoviano.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Camping Riaza - Sierra de Ayllón",
        "poblacion": "Riaza", "provincia": "Segovia", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 41.2742, "longitud": -3.4864, "tipo_lugar": "camping", "precio": 21.0, "es_gratuito": False,
        "descripcion": "Camping de montaña entre robledales al pie de la estación de esquí de La Pinilla y los pueblos rojos y negros.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_wifi": True, "ideal_familias": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Área Autocaravanas Ciudad de Frías",
        "poblacion": "Frías", "provincia": "Burgos", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 42.7628, "longitud": -3.2958, "tipo_lugar": "area_autocaravanas", "precio": 6.0, "es_gratuito": False,
        "descripcion": "Con vistas panorámicas al castillo roquero de Frías, sus casas colgadas de toba y el puente medieval con torre sobre el Ebro.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Pernocta Covarrubias - Valle del Arlanza",
        "poblacion": "Covarrubias", "provincia": "Burgos", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 42.0592, "longitud": -3.5236, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Cuna de Castilla a orillas del río Arlanza. Arquitectura tradicional de entramado de madera y cerezos.",
        "tiene_agua": False, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas Santo Domingo de Silos",
        "poblacion": "Santo Domingo de Silos", "provincia": "Burgos", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 41.9619, "longitud": -3.4189, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Junto al monasterio benedictino de cantos gregorianos y el desfiladero de La Yecla con pasarelas sobre la garganta.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Camper La Alberca - Sierra de Francia",
        "poblacion": "La Alberca", "provincia": "Salamanca", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 40.4878, "longitud": -6.1136, "tipo_lugar": "area_autocaravanas", "precio": 8.0, "es_gratuito": False,
        "descripcion": "El primer pueblo declarado conjunto histórico-artístico de España. Embutidos ibéricos de bellota y subida a la Peña de Francia.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Pernocta Candelario - Sierra de Béjar",
        "poblacion": "Candelario", "provincia": "Salamanca", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 40.3683, "longitud": -5.7428, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Pueblo serrano con sus regaderas de agua de deshielo en las calles y batipuertas. Frescor asegurado en verano.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Camper Lago de Sanabria",
        "poblacion": "Galende", "provincia": "Zamora", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 42.1158, "longitud": -6.7114, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "El lago de origen glaciar más grande de la Península Ibérica. Playas de arena dorada, piragüismo y bosques de robles.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Recreativa Cañón del Río Lobos",
        "poblacion": "Ucero", "provincia": "Soria", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 41.7167, "longitud": -3.0519, "tipo_lugar": "area_recreativa", "precio": 4.0, "es_gratuito": False,
        "descripcion": "Aparcamiento y merendero a la entrada del cañón y la ermita templaria de San Bartolomé. Paredes verticales y buitres.",
        "tiene_agua": True, "tiene_mesas_picnic": True, "es_zona_recreativa": True, "mucha_sombra": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Autocaravanas Medinaceli",
        "poblacion": "Medinaceli", "provincia": "Soria", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 41.1714, "longitud": -2.4336, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Frente al único arco romano de triple arcada conservado en España. En lo alto de una loma con horizonte infinito.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "terreno_nivelado": True
    },
    {
        "nombre": "Área Camper Urueña - Villa del Libro",
        "poblacion": "Urueña", "provincia": "Valladolid", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 41.7275, "longitud": -5.3031, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "La villa amurallada con más librerías que bares de España, asomada como un barco de piedra a los campos de Tierra de Campos.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Área Autocaravanas Peñafiel - Ribera del Duero",
        "poblacion": "Peñafiel", "provincia": "Valladolid", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 41.5972, "longitud": -4.1167, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Bajo la silueta de buque del castillo de Peñafiel (Museo Provincial del Vino) y la plaza del Coso.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "rutas_en_bici": True
    },
    {
        "nombre": "Área Camper Aranda de Duero",
        "poblacion": "Aranda de Duero", "provincia": "Burgos", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 41.6708, "longitud": -3.6894, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Capital de la Ribera del Duero, lechazo asado y kilómetros de bodegas subterráneas medievales bajo las calles.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Área Autocaravanas Astorga",
        "poblacion": "Astorga", "provincia": "León", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 42.4578, "longitud": -6.0569, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Cruce de la Vía de la Plata y Camino Francés. A 10 minutos a pie del Palacio Episcopal de Gaudí, murallas y cocido maragato.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Parking Puebla de Sanabria - Castillo",
        "poblacion": "Puebla de Sanabria", "provincia": "Zamora", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 42.0544, "longitud": -6.6347, "tipo_lugar": "parking_urbano", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Aparcamiento con vistas al castillo de los Condes de Benavente y tejados de pizarra negra sobre el río Tera.",
        "tiene_agua": False, "admite_mascotas": True
    },
    {
        "nombre": "Pernocta Valle de Babia",
        "poblacion": "San Emiliano", "provincia": "León", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 43.0189, "longitud": -5.9961, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Donde descansaban los reyes de León ('estar en Babia'). Praderas verdes, caballos hispano-bretones y cumbres del macizo de Ubiña.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Camping Gredos - Hoyos del Espino",
        "poblacion": "Hoyos del Espino", "provincia": "Ávila", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 40.3542, "longitud": -5.1764, "tipo_lugar": "camping", "precio": 23.0, "es_gratuito": False,
        "descripcion": "En el corazón de la Sierra de Gredos junto al río Tormes y la plataforma de subida al Circo y Laguna Grande.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "mucha_sombra": True, "tiene_senderismo": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Área Autocaravanas Cuéllar",
        "poblacion": "Cuéllar", "provincia": "Segovia", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 41.4019, "longitud": -4.3167, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Junto al castillo de los Duques de Alburquerque y el mayor recinto amurallado de Segovia. Asfalto y servicios completos.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Área Camper Ciudad Rodrigo",
        "poblacion": "Ciudad Rodrigo", "provincia": "Salamanca", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 40.5986, "longitud": -6.5319, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Frente a las murallas estrelladas defensivas de la frontera con Portugal y el río Águeda con zona de baño estival.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Punto Solo Servicios Camper A-62 Castilla",
        "poblacion": "Tordesillas", "provincia": "Valladolid", "comunidad_autonoma": "Castilla y León", "pais": "España",
        "latitud": 41.5031, "longitud": -5.0014, "tipo_lugar": "solo_servicios", "precio": 2.5, "es_gratuito": False,
        "descripcion": "Nudo estratégico de comunicaciones del noroeste peninsular. Área de servicio 24 horas con toma de agua y rejilla de vaciado.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True, "apto_grandes_autocaravanas": True
    },

    # --- MADRID (8) ---
    {
        "nombre": "Área Recreativa Las Presillas - Rascafría",
        "poblacion": "Rascafría", "provincia": "Madrid", "comunidad_autonoma": "Comunidad de Madrid", "pais": "España",
        "latitud": 40.8931, "longitud": -3.8864, "tipo_lugar": "area_recreativa", "precio": 5.0, "es_gratuito": False,
        "descripcion": "Piscinas naturales en el río Lozoya frente al Monasterio de Santa María de El Paular y robledales del Guadarrama.",
        "tiene_agua": True, "tiene_mesas_picnic": True, "es_zona_recreativa": True, "mucha_sombra": True, "ideal_familias": True
    },
    {
        "nombre": "Área Autocaravanas Buitrago del Lozoya",
        "poblacion": "Buitrago del Lozoya", "provincia": "Madrid", "comunidad_autonoma": "Comunidad de Madrid", "pais": "España",
        "latitud": 40.9928, "longitud": -3.6367, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "La única villa de Madrid que conserva íntegro su recinto amurallado rodeado por el meandro del río Lozoya. Museo Picasso.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Camper Chinchón",
        "poblacion": "Chinchón", "provincia": "Madrid", "comunidad_autonoma": "Comunidad de Madrid", "pais": "España",
        "latitud": 40.1411, "longitud": -3.4244, "tipo_lugar": "area_autocaravanas", "precio": 8.0, "es_gratuito": False,
        "descripcion": "A 10 minutos a pie de la famosa Plaza Mayor medieval con balcones de madera, mesones tradicionales y anís.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True
    },
    {
        "nombre": "Pernocta Embalse de Santillana - Manzanares el Real",
        "poblacion": "Manzanares el Real", "provincia": "Madrid", "comunidad_autonoma": "Comunidad de Madrid", "pais": "España",
        "latitud": 40.7258, "longitud": -3.8642, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Vistas directas al castillo de los Mendoza y los riscos graníticos de La Pedriza. Avistamiento de cigüeñas y aves acuáticas.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Camping El Escorial Resort",
        "poblacion": "San Lorenzo de El Escorial", "provincia": "Madrid", "comunidad_autonoma": "Comunidad de Madrid", "pais": "España",
        "latitud": 40.6158, "longitud": -4.0936, "tipo_lugar": "camping", "precio": 28.0, "es_gratuito": False,
        "descripcion": "Gran complejo resort al pie del Monte Abantos. Cuatro piscinas, supermercado, tren de cercanías hacia Madrid centro y vistas al Monasterio.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_wifi": True, "ideal_familias": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Parking Patones de Arriba",
        "poblacion": "Patones", "provincia": "Madrid", "comunidad_autonoma": "Comunidad de Madrid", "pais": "España",
        "latitud": 40.8542, "longitud": -3.4864, "tipo_lugar": "parking_urbano", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Estacionamiento en Patones de Abajo con sendero ecológico que sube al pueblo negro de pizarra mejor conservado de Madrid.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas Aranjuez",
        "poblacion": "Aranjuez", "provincia": "Madrid", "comunidad_autonoma": "Comunidad de Madrid", "pais": "España",
        "latitud": 40.0389, "longitud": -3.6067, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Junto a los Jardines Reales del Príncipe y el río Tajo. Paseos arbolados llanos y palacio barroco de los Borbones.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "rutas_en_bici": True
    },
    {
        "nombre": "Área Recreativa La Hiruela - Sierra del Rincón",
        "poblacion": "La Hiruela", "provincia": "Madrid", "comunidad_autonoma": "Comunidad de Madrid", "pais": "España",
        "latitud": 41.0772, "longitud": -3.5258, "tipo_lugar": "area_recreativa", "precio": 0.0, "es_gratuito": True,
        "descripcion": "En la Reserva de la Biosfera de la Sierra del Rincón. Molino harinero, colmenar tradicional y sendero de los puentes de madera.",
        "tiene_agua": True, "tiene_mesas_picnic": True, "es_zona_recreativa": True, "mucha_sombra": True, "tiene_senderismo": True
    },

    # --- CASTILLA-LA MANCHA (16) ---
    {
        "nombre": "Área Camper Parque Nacional Tablas de Daimiel",
        "poblacion": "Daimiel", "provincia": "Ciudad Real", "comunidad_autonoma": "Castilla-La Mancha", "pais": "España",
        "latitud": 39.1417, "longitud": -3.6931, "tipo_lugar": "area_autocaravanas", "precio": 7.0, "es_gratuito": False,
        "descripcion": "A 5 minutos del humedal único de tablas fluviales. Pasarelas de madera entre islas y observatorios de aves acuáticas.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Camping Los Batanes - Lagunas de Ruidera",
        "poblacion": "Ossa de Montiel", "provincia": "Albacete", "comunidad_autonoma": "Castilla-La Mancha", "pais": "España",
        "latitud": 38.9392, "longitud": -2.8683, "tipo_lugar": "camping", "precio": 25.0, "es_gratuito": False,
        "descripcion": "En el corazón del parque natural entre cascadas y barreras tobáceas. Baño en aguas cristalinas, kayaks y mucha arboleda.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_wifi": True, "mucha_sombra": True, "ideal_familias": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Área Autocaravanas Cuenca - Castillo",
        "poblacion": "Cuenca", "provincia": "Cuenca", "comunidad_autonoma": "Castilla-La Mancha", "pais": "España",
        "latitud": 40.0811, "longitud": -2.1286, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "En lo más alto de la ciudadela amurallada sobre la Hoz del Huécar y del Júcar. Vistas panorámicas a las Casas Colgadas.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Pernocta Embalse de Alarcón",
        "poblacion": "Alarcón", "provincia": "Cuenca", "comunidad_autonoma": "Castilla-La Mancha", "pais": "España",
        "latitud": 39.5472, "longitud": -2.0831, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Villa medieval encajada en una península natural rodeada por la hoz del Júcar. Baños de verano y tranquilidad absoluta.",
        "tiene_agua": False, "admite_mascotas": True
    },
    {
        "nombre": "Área Camper Riópar - Nacimiento del Río Mundo",
        "poblacion": "Riópar", "provincia": "Albacete", "comunidad_autonoma": "Castilla-La Mancha", "pais": "España",
        "latitud": 38.4986, "longitud": -2.4172, "tipo_lugar": "area_autocaravanas", "precio": 6.0, "es_gratuito": False,
        "descripcion": "Sierra del Segura. A minutos del sobrecogedor reventón de los Chorros del Río Mundo donde el agua surge de una cueva en la pared.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Autocaravanas Sigüenza",
        "poblacion": "Sigüenza", "provincia": "Guadalajara", "comunidad_autonoma": "Castilla-La Mancha", "pais": "España",
        "latitud": 41.0719, "longitud": -2.6419, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Ciudad del Doncel, castillo fortaleza medieval y catedral románico-gótica. Área bien nivelada cerca del pinar de la Alameda.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Pernocta Valverde de los Arroyos - Pueblos Negros",
        "poblacion": "Valverde de los Arroyos", "provincia": "Guadalajara", "comunidad_autonoma": "Castilla-La Mancha", "pais": "España",
        "latitud": 41.1308, "longitud": -3.2406, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Arquitectura de pizarra dorada bajo el pico Ocejón. Ruta a pie a las Chorreras de Despeñalagua, cascada de más de 120 metros.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas Consuegra - Molinos de Viento",
        "poblacion": "Consuegra", "provincia": "Toledo", "comunidad_autonoma": "Castilla-La Mancha", "pais": "España",
        "latitud": 39.4608, "longitud": -3.6067, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Bajo la cresta manchega del cerro Calderico con sus 12 molinos de viento gigantes cervantinos y el castillo de la Muela.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "terreno_nivelado": True
    },
    {
        "nombre": "Área Autocaravanas Almagro",
        "poblacion": "Almagro", "provincia": "Ciudad Real", "comunidad_autonoma": "Castilla-La Mancha", "pais": "España",
        "latitud": 38.8911, "longitud": -3.7144, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Famoso por su Corral de Comedias del Siglo de Oro, berenjenas encurtidas y encajes de bolillos. Muy cómoda.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Pernocta Molinos de Campo de Criptana",
        "poblacion": "Campo de Criptana", "provincia": "Ciudad Real", "comunidad_autonoma": "Castilla-La Mancha", "pais": "España",
        "latitud": 39.4086, "longitud": -3.1258, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "La 'Tierra de Gigantes' de Don Quijote. Puesta de sol dorada sobre la llanura manchega con las aspas de los molinos recortadas.",
        "tiene_agua": False, "admite_mascotas": True
    },
    {
        "nombre": "Área Camper Alcalá del Júcar",
        "poblacion": "Alcalá del Júcar", "provincia": "Albacete", "comunidad_autonoma": "Castilla-La Mancha", "pais": "España",
        "latitud": 39.1919, "longitud": -1.4283, "tipo_lugar": "area_autocaravanas", "precio": 8.0, "es_gratuito": False,
        "descripcion": "Pueblo excavado en la roca con casas cueva que atraviesan la montaña y playa fluvial de arena en el recodo del río.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True
    },
    {
        "nombre": "Área Autocaravanas Brihuega - Jardín de la Alcarria",
        "poblacion": "Brihuega", "provincia": "Guadalajara", "comunidad_autonoma": "Castilla-La Mancha", "pais": "España",
        "latitud": 40.7611, "longitud": -2.8689, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Famosa en julio por sus inmensos campos morados de lavanda y festival aromático. Jardines de la Real Fábrica de Paños.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Pernocta Villa Ducal de Pastrana",
        "poblacion": "Pastrana", "provincia": "Guadalajara", "comunidad_autonoma": "Castilla-La Mancha", "pais": "España",
        "latitud": 40.4181, "longitud": -2.9231, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Historia de la Princesa de Éboli y Santa Teresa de Jesús. Plaza de la Hora y tapices flamencos únicos.",
        "tiene_agua": False, "admite_mascotas": True
    },
    {
        "nombre": "Área Camper Cabañeros - Horcajo de los Montes",
        "poblacion": "Horcajo de los Montes", "provincia": "Ciudad Real", "comunidad_autonoma": "Castilla-La Mancha", "pais": "España",
        "latitud": 39.3564, "longitud": -4.6514, "tipo_lugar": "area_autocaravanas", "precio": 6.0, "es_gratuito": False,
        "descripcion": "El Serengeti español. Rutas en 4x4 por la raña para ver ciervos, corzos y águilas imperiales ibéricas.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Autocaravanas Toledo - Safont",
        "poblacion": "Toledo", "provincia": "Toledo", "comunidad_autonoma": "Castilla-La Mancha", "pais": "España",
        "latitud": 39.8647, "longitud": -4.0197, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "Junto a la orilla del Tajo y las escaleras mecánicas que suben a la Plaza de Zocodover. La Ciudad de las Tres Culturas.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Área Autocaravanas Villanueva de los Infantes",
        "poblacion": "Villanueva de los Infantes", "provincia": "Ciudad Real", "comunidad_autonoma": "Castilla-La Mancha", "pais": "España",
        "latitud": 38.7369, "longitud": -3.0142, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "El auténtico 'lugar de la Mancha' de Don Quijote. Plaza Mayor barroca, sepulcro de Quevedo y palacios hidalgos.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "terreno_nivelado": True
    },

    # --- COMUNIDAD VALENCIANA (14) ---
    {
        "nombre": "Área Camper Peñíscola - Costa de Azahar",
        "poblacion": "Peñíscola", "provincia": "Castellón", "comunidad_autonoma": "Comunidad Valenciana", "pais": "España",
        "latitud": 40.3831, "longitud": 0.4022, "tipo_lugar": "area_autocaravanas", "precio": 11.0, "es_gratuito": False,
        "descripcion": "A 100 metros del mar con vistas al castillo templario del Papa Luna sobre la roca. Palmeras, duchas calientes y carril bici.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Área Autocaravanas Morella",
        "poblacion": "Morella", "provincia": "Castellón", "comunidad_autonoma": "Comunidad Valenciana", "pais": "España",
        "latitud": 40.6153, "longitud": -0.1039, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Frente a la imponente montaña cónica coronada por el castillo de Morella y sus dos kilómetros de murallas torreadas.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Camping Cap Blanch - Altea",
        "poblacion": "Altea", "provincia": "Alicante", "comunidad_autonoma": "Comunidad Valenciana", "pais": "España",
        "latitud": 38.5831, "longitud": -0.0617, "tipo_lugar": "camping", "precio": 26.0, "es_gratuito": False,
        "descripcion": "Situado a pie de la playa de canto rodado de Altea. Vistas a la cúpula azul mediterránea del casco antiguo y ambiente tranquilo.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_wifi": True, "playa_cercana": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Guadalest - Pantano y Castillo",
        "poblacion": "El Castell de Guadalest", "provincia": "Alicante", "comunidad_autonoma": "Comunidad Valenciana", "pais": "España",
        "latitud": 38.6778, "longitud": -0.1989, "tipo_lugar": "pernocta_libre", "precio": 4.0, "es_gratuito": False,
        "descripcion": "Pueblo colgado de una aguja de roca al que se accede por un túnel natural. Vistas espectaculares al agua esmeralda del embalse.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Camper Dénia - Las Marinas",
        "poblacion": "Dénia", "provincia": "Alicante", "comunidad_autonoma": "Comunidad Valenciana", "pais": "España",
        "latitud": 38.8608, "longitud": 0.0767, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "A 200 metros de playas de arena fina y cerca del puerto con ferris directos a Ibiza y Formentera. Castillo y gastronomía UNESCO.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Área Recreativa Montanejos - Fuente de los Baños",
        "poblacion": "Montanejos", "provincia": "Castellón", "comunidad_autonoma": "Comunidad Valenciana", "pais": "España",
        "latitud": 40.0672, "longitud": -0.5239, "tipo_lugar": "area_recreativa", "precio": 3.0, "es_gratuito": False,
        "descripcion": "Aguas termales naturales a 25ºC constantes todo el año en un cañón de roca. Pozas transparentes aptas para el baño.",
        "tiene_agua": True, "tiene_mesas_picnic": True, "es_zona_recreativa": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Autocaravanas Chelva - Ruta del Agua",
        "poblacion": "Chelva", "provincia": "Valencia", "comunidad_autonoma": "Comunidad Valenciana", "pais": "España",
        "latitud": 39.7508, "longitud": -0.9986, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Inicio de la Ruta del Agua entre manantiales, huertas andalusíes y el acueducto romano de Peña Cortada.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Pernocta Cañón de Chulilla - Puentes Colgantes",
        "poblacion": "Chulilla", "provincia": "Valencia", "comunidad_autonoma": "Comunidad Valenciana", "pais": "España",
        "latitud": 39.6542, "longitud": -0.8931, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Paraíso internacional de escalada deportiva sobre paredes calizas del río Turia y ruta de los puentes colgantes colgados sobre el cañón.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Pernocta Cabo de la Nao - Xàbia/Jávea",
        "poblacion": "Xàbia/Jávea", "provincia": "Alicante", "comunidad_autonoma": "Comunidad Valenciana", "pais": "España",
        "latitud": 38.7331, "longitud": 0.2319, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "El extremo más oriental de la provincia de Alicante frente a calas turquesas como Granadella y Ambolo. Cielos estrellados.",
        "tiene_agua": False, "playa_cercana": True, "admite_mascotas": True
    },
    {
        "nombre": "Camping Playa Paraíso - Villajoyosa",
        "poblacion": "Villajoyosa", "provincia": "Alicante", "comunidad_autonoma": "Comunidad Valenciana", "pais": "España",
        "latitud": 38.5028, "longitud": -0.2589, "tipo_lugar": "camping", "precio": 23.0, "es_gratuito": False,
        "descripcion": "Frente a palmeras y la playa virgen de cantos rodados de Paradís. Famosa por sus casas de pescadores pintadas de colores vivos.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "playa_cercana": True, "ideal_familias": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Área Autocaravanas Bocairent",
        "poblacion": "Bocairent", "provincia": "Valencia", "comunidad_autonoma": "Comunidad Valenciana", "pais": "España",
        "latitud": 38.7667, "longitud": -0.6111, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Pueblo medieval excavado en la piedra con las Covetes dels Moros (cámaras trogloditas) en la Sierra Mariola.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Camper Cullera - Faro",
        "poblacion": "Cullera", "provincia": "Valencia", "comunidad_autonoma": "Comunidad Valenciana", "pais": "España",
        "latitud": 39.1869, "longitud": -0.2289, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Bajo el faro de Cullera junto a calas resguardadas del viento. Acceso directo al paseo marítimo y restaurantes de arroces.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True
    },
    {
        "nombre": "Área Camper Calpe - Peñón de Ifach",
        "poblacion": "Calpe", "provincia": "Alicante", "comunidad_autonoma": "Comunidad Valenciana", "pais": "España",
        "latitud": 38.6472, "longitud": 0.0639, "tipo_lugar": "area_autocaravanas", "precio": 13.0, "es_gratuito": False,
        "descripcion": "Muy cerca de las salinas con flamencos y la colosal mole rocosa del Peñón de Ifach que surge del mar. Conexión de luz y duchas.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Punto Solo Servicios Camper Valencia Sur A-7",
        "poblacion": "Silla", "provincia": "Valencia", "comunidad_autonoma": "Comunidad Valenciana", "pais": "España",
        "latitud": 39.3622, "longitud": -0.4183, "tipo_lugar": "solo_servicios", "precio": 2.0, "es_gratuito": False,
        "descripcion": "Taller y punto de repostaje de aguas en el eje mediterráneo. Servicio rápido de descarga y recarga para autocaravanas.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True, "apto_grandes_autocaravanas": True
    },

    # --- REGIÓN DE MURCIA (8) ---
    {
        "nombre": "Área Camper Cabo de Palos - Faro",
        "poblacion": "Cartagena", "provincia": "Murcia", "comunidad_autonoma": "Región de Murcia", "pais": "España",
        "latitud": 37.6339, "longitud": -0.6922, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "Frente a la Reserva Marina de Islas Hormigas, paraíso europeo del submarinismo. Puerto con caldero murciano tradicional.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Parque Regional de Calblanque",
        "poblacion": "Cartagena", "provincia": "Murcia", "comunidad_autonoma": "Región de Murcia", "pais": "España",
        "latitud": 37.6019, "longitud": -0.7411, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Playas de arenas doradas y calas solitarias entre dunas fósiles y salinas. Uno de los litorales más vírgenes del Mediterráneo.",
        "tiene_agua": False, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Camper Águilas - Cabo Cope",
        "poblacion": "Águilas", "provincia": "Murcia", "comunidad_autonoma": "Región de Murcia", "pais": "España",
        "latitud": 37.4267, "longitud": -1.5428, "tipo_lugar": "area_autocaravanas", "precio": 9.0, "es_gratuito": False,
        "descripcion": "Área tranquila junto al mar en la frontera con Almería. Vistas a la torre de Cope, carril bici y amaneceres soleados.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True
    },
    {
        "nombre": "Área Autocaravanas Moratalla - Sierra Noroeste",
        "poblacion": "Moratalla", "provincia": "Murcia", "comunidad_autonoma": "Región de Murcia", "pais": "España",
        "latitud": 38.1886, "longitud": -1.8911, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Pueblo medieval montañoso coronado por su castillo fortaleza. Cerca de los arrozales de Calasparra y el río Alhárabe.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Autocaravanas Caravaca de la Cruz",
        "poblacion": "Caravaca de la Cruz", "provincia": "Murcia", "comunidad_autonoma": "Región de Murcia", "pais": "España",
        "latitud": 38.1064, "longitud": -1.8631, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Una de las cinco ciudades santas del mundo. Basílica de la Vera Cruz sobre la colina y paraje natural de las Fuentes del Marqués.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Camping Sierra Espuña - Berro",
        "poblacion": "Alhama de Murcia", "provincia": "Murcia", "comunidad_autonoma": "Región de Murcia", "pais": "España",
        "latitud": 37.8911, "longitud": -1.4936, "tipo_lugar": "camping", "precio": 20.0, "es_gratuito": False,
        "descripcion": "En el pulmón verde de Murcia. Pozos de nieve centenarios, senderos de montaña y avistamiento de arruís en libertad.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "mucha_sombra": True, "tiene_senderismo": True, "ideal_familias": True
    },
    {
        "nombre": "Pernocta Bolnuevo - Gredas Erosionadas",
        "poblacion": "Mazarrón", "provincia": "Murcia", "comunidad_autonoma": "Región de Murcia", "pais": "España",
        "latitud": 37.5619, "longitud": -1.3067, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Frente a las esculturas naturales de arenisca labradas por el viento y el agua llamadas la 'Ciudad Encantada de Bolnuevo'. Playa al lado.",
        "tiene_agua": False, "playa_cercana": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Recreativa Valle de Ricote",
        "poblacion": "Ricote", "provincia": "Murcia", "comunidad_autonoma": "Región de Murcia", "pais": "España",
        "latitud": 38.1514, "longitud": -1.3658, "tipo_lugar": "area_recreativa", "precio": 0.0, "es_gratuito": True,
        "descripcion": "El último reducto morisco del río Segura. Palmerales exuberantes, norias tradicionales y huertas de cítricos bajo el sol.",
        "tiene_agua": True, "tiene_mesas_picnic": True, "es_zona_recreativa": True, "mucha_sombra": True
    },

    # --- ANDALUCÍA (26) ---
    {
        "nombre": "Área Camper Las Negras - Cabo de Gata",
        "poblacion": "Níjar", "provincia": "Almería", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 36.8778, "longitud": -2.0067, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "Pueblo bohemio marinero de casitas blancas. Salida a pie a la mítica Cala San Pedro por el sendero del acantilado.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Rodalquilar - Minas de Oro",
        "poblacion": "Níjar", "provincia": "Almería", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 36.8483, "longitud": -2.0436, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Valle minero volcánico histórico cerca de la Playa del Playazo y la torre de San Ramón. Atmósfera de western cinematográfico.",
        "tiene_agua": False, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Pernocta Hoya de la Mora - Sierra Nevada",
        "poblacion": "Monachil", "provincia": "Granada", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 37.0897, "longitud": -3.3858, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Pernocta a 2.500 metros de altitud bajo los picos Veleta y Mulhacén. Vistas a toda la Vega de Granada y cielo nocturno estrellado.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Camping Órgiva - Alpujarra Granadina",
        "poblacion": "Órgiva", "provincia": "Granada", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 36.9011, "longitud": -3.4286, "tipo_lugar": "camping", "precio": 22.0, "es_gratuito": False,
        "descripcion": "En la entrada a los pueblos blancos del barranco de Poqueira (Capileira, Bubión y Pampaneira). Olivos centenarios y piscina.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_wifi": True, "mucha_sombra": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Área Autocaravanas Ronda",
        "poblacion": "Ronda", "provincia": "Málaga", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 36.7533, "longitud": -5.1583, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "A 15 minutos a pie del impresionante Tajo de Ronda y el Puente Nuevo sobre el abismo de más de 100 metros.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Área Camper Zahara de la Sierra - Embalse",
        "poblacion": "Zahara de la Sierra", "provincia": "Cádiz", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 36.8419, "longitud": -5.3911, "tipo_lugar": "area_autocaravanas", "precio": 7.0, "es_gratuito": False,
        "descripcion": "Pueblo blanco encaramado a la peña sobre el pantano de Zahara-El Gastor y playa artificial de la Playita de Arroyomolinos.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Camping La Rosaleda - Conil de la Frontera",
        "poblacion": "Conil de la Frontera", "provincia": "Cádiz", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 36.2917, "longitud": -6.0758, "tipo_lugar": "camping", "precio": 25.0, "es_gratuito": False,
        "descripcion": "Camping de gran calidad a minutos de las calas de Roche y la playa de la Fontanilla. Restaurante andaluz y ambiente cuidado.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_wifi": True, "playa_cercana": True, "ideal_familias": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Duna de Bolonia - Tarifa",
        "poblacion": "Tarifa", "provincia": "Cádiz", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 36.0886, "longitud": -5.7725, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Frente a la monumental duna de arena dorada que trepa a los pinos y las ruinas romanas de Baelo Claudia a orillas del Atlántico.",
        "tiene_agua": False, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Camper El Palmar - Surf Paradise",
        "poblacion": "Vejer de la Frontera", "provincia": "Cádiz", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 36.2367, "longitud": -6.0694, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "El templo del surf y atardeceres con música en directo. A 150 metros de la arena, con duchas, césped y escuela de olas.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Setenil de las Bodegas - Casas bajo las Rocas",
        "poblacion": "Setenil de las Bodegas", "provincia": "Cádiz", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 36.8639, "longitud": -5.1808, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Aparcamiento en la parte alta para visitar las calles de Cuevas del Sol y Cuevas de la Sombra encajadas bajo salientes rocosos.",
        "tiene_agua": False, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas Úbeda y Baeza",
        "poblacion": "Baeza", "provincia": "Jaén", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 37.9942, "longitud": -3.4689, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Ciudades renacentistas Patrimonio de la Humanidad rodeadas del mar de olivos jiennense. Catedrales, palacios y aceite de oliva virgen extra.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Área Camper Aracena - Gruta de las Maravillas",
        "poblacion": "Aracena", "provincia": "Huelva", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 37.8931, "longitud": -6.5647, "tipo_lugar": "area_autocaravanas", "precio": 5.0, "es_gratuito": False,
        "descripcion": "Sierra de Aracena y Picos de Aroche. Cuna del jamón ibérico de bellota Jabugo y la monumental Gruta de las Maravillas subterránea.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Pernocta Aldea de El Rocío - Doñana",
        "poblacion": "Almonte", "provincia": "Huelva", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 37.1331, "longitud": -6.4858, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Calles de arena blanca por donde pasean caballos y carretas frente a la marisma de Doñana y la ermita de la Blanca Paloma.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Pernocta Faro de Trafalgar - Los Caños de Meca",
        "poblacion": "Barbate", "provincia": "Cádiz", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 36.1831, "longitud": -6.0336, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Lugar histórico de la batalla naval de 1805. Tómbolo natural con playas salvajes a ambos lados y agua esmeralda.",
        "tiene_agua": False, "playa_cercana": True, "admite_mascotas": True
    },
    {
        "nombre": "Camping Nerja - Maro y Cueva",
        "poblacion": "Nerja", "provincia": "Málaga", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 36.7594, "longitud": -3.8519, "tipo_lugar": "camping", "precio": 23.0, "es_gratuito": False,
        "descripcion": "Junto a los acantilados de Maro-Cerro Gordo y la Cueva de Nerja. Rutas en kayak por cascadas que caen directo al mar.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_wifi": True, "playa_cercana": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Frigiliana - Pueblo Blanco",
        "poblacion": "Frigiliana", "provincia": "Málaga", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 36.7928, "longitud": -3.8967, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Barrio morisco-mudéjar encalado con macetas de geranios, calles de adoquines y miel de caña artesanal.",
        "tiene_agua": False, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas Antequera - Torcal",
        "poblacion": "Antequera", "provincia": "Málaga", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 37.0228, "longitud": -4.5619, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "El corazón geográfico de Andalucía. A minutos de los Dólmenes megalíticos y el laberinto kárstico del Torcal de Antequera.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Área Camper Salobreña - Costa Tropical",
        "poblacion": "Salobreña", "provincia": "Granada", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 36.7439, "longitud": -3.5889, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Microclima subtropical único con cultivos de mangos y chirimoyas bajo el castillo árabe sobre el peñón costero.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True
    },
    {
        "nombre": "Pernocta Desierto de Tabernas",
        "poblacion": "Tabernas", "provincia": "Almería", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 37.0519, "longitud": -2.3911, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "El único desierto propiamente dicho de Europa. Ramblas de película de Sergio Leone, soledad total y cielos limpios.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas Zuheros - Vía Verde del Aceite",
        "poblacion": "Zuheros", "provincia": "Córdoba", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 37.5431, "longitud": -4.3167, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Pueblo blanco de las Sierras Subbéticas colgado del cañón del río Bailón y la Cueva de los Murciélagos. Vía verde ciclista.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "rutas_en_bici": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Camper Castillo de Almodóvar del Río",
        "poblacion": "Almodóvar del Río", "provincia": "Córdoba", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 37.8108, "longitud": -5.0219, "tipo_lugar": "area_autocaravanas", "precio": 6.0, "es_gratuito": False,
        "descripcion": "Bajo la colina fortificada del impresionante castillo medieval (Altojardín en Juego de Tronos) junto al río Guadalquivir.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Camper Sanlúcar de Barrameda",
        "poblacion": "Sanlúcar de Barrameda", "provincia": "Cádiz", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 36.7783, "longitud": -6.3542, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "En Bajo de Guía, desembocadura del Guadalquivir frente a Doñana. Bodegas de manzanilla, langostinos y carreras de caballos en la playa.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True
    },
    {
        "nombre": "Pernocta Nacimiento del Río Castril",
        "poblacion": "Castril", "provincia": "Granada", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 37.7964, "longitud": -2.7783, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Parque natural con pasarelas de madera sobre el desfiladero del río Castril, puente colgante y poza termal.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas Sevilla - Puerto Gelves",
        "poblacion": "Gelves", "provincia": "Sevilla", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 37.3408, "longitud": -6.0231, "tipo_lugar": "area_autocaravanas", "precio": 15.0, "es_gratuito": False,
        "descripcion": "Dentro de la marina fluvial de Gelves con autobús directo cada 15 minutos a la Torre del Oro y el centro histórico de Sevilla.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Camping Puente de las Herrerías - Cazorla",
        "poblacion": "Cazorla", "provincia": "Jaén", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 37.8967, "longitud": -2.9364, "tipo_lugar": "camping", "precio": 23.0, "es_gratuito": False,
        "descripcion": "En el alto Guadalquivir rodeado de nogales y pinos laricios. Ciervos que se acercan a las parcelas al atardecer y pozas de agua cristalina.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "mucha_sombra": True, "tiene_senderismo": True, "ideal_familias": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Punto Solo Servicios Autovía del Sur A-4 Despeñaperros",
        "poblacion": "Santa Elena", "provincia": "Jaén", "comunidad_autonoma": "Andalucía", "pais": "España",
        "latitud": 38.3411, "longitud": -3.5394, "tipo_lugar": "solo_servicios", "precio": 2.0, "es_gratuito": False,
        "descripcion": "Punto de abastecimiento a la entrada natural de Andalucía en el desfiladero de Despeñaperros. Agua, vaciado y combustible.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True, "apto_grandes_autocaravanas": True
    },

    # --- EXTREMADURA (14) ---
    {
        "nombre": "Área Autocaravanas Cabezuela del Valle - Jerte",
        "poblacion": "Cabezuela del Valle", "provincia": "Cáceres", "comunidad_autonoma": "Extremadura", "pais": "España",
        "latitud": 40.1928, "longitud": -5.8083, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Frente al río Jerte con piscinas naturales en verano y floración de cerezos en primavera. Casco histórico tradicional serrano.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Pernocta Salto del Gitano - Parque Nacional de Monfragüe",
        "poblacion": "Villarreal de San Carlos", "provincia": "Cáceres", "comunidad_autonoma": "Extremadura", "pais": "España",
        "latitud": 39.8436, "longitud": -6.0428, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "El mayor santuario de aves rapaces de Europa. Buitres negros, leonados y alimoches sobrevolando la peña sobre el río Tajo.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Camping Jaranda - La Vera",
        "poblacion": "Jarandilla de la Vera", "provincia": "Cáceres", "comunidad_autonoma": "Extremadura", "pais": "España",
        "latitud": 40.1289, "longitud": -5.6583, "tipo_lugar": "camping", "precio": 21.0, "es_gratuito": False,
        "descripcion": "Entre gargantas de agua fresca de Gredos y secaderos de pimentón de La Vera. A minutos del Monasterio de Yuste de Carlos V.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "mucha_sombra": True, "ideal_familias": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Área Autocaravanas Guadalupe",
        "poblacion": "Guadalupe", "provincia": "Cáceres", "comunidad_autonoma": "Extremadura", "pais": "España",
        "latitud": 39.4519, "longitud": -5.3283, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Frente al Real Monasterio de Santa María de Guadalupe (Patrimonio de la Humanidad) en el Geoparque Villuercas-Ibores-Jara.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Camper Trujillo",
        "poblacion": "Trujillo", "provincia": "Cáceres", "comunidad_autonoma": "Extremadura", "pais": "España",
        "latitud": 39.4628, "longitud": -5.8817, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "A 10 minutos a pie de la monumental Plaza Mayor renacentista, palacios nobiliarios y castillo árabe defensivo.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Área Autocaravanas Ciudad Monumental de Cáceres",
        "poblacion": "Cáceres", "provincia": "Cáceres", "comunidad_autonoma": "Extremadura", "pais": "España",
        "latitud": 39.4811, "longitud": -6.3683, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Junto al parque del Príncipe y a un paseo del tercer conjunto monumental mejor conservado de Europa. Iluminación nocturna mágica.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Área Autocaravanas Mérida - Teatro Romano",
        "poblacion": "Mérida", "provincia": "Badajoz", "comunidad_autonoma": "Extremadura", "pais": "España",
        "latitud": 38.9189, "longitud": -6.3386, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "Área vigilada junto al río Guadiana. A pie del Teatro y Anfiteatro Romano de Augusta Emerita, Templo de Diana y puente romano.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "rutas_en_bici": True
    },
    {
        "nombre": "Área Autocaravanas Olivenza",
        "poblacion": "Olivenza", "provincia": "Badajoz", "comunidad_autonoma": "Extremadura", "pais": "España",
        "latitud": 38.6831, "longitud": -7.1011, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Villa de herencia portuguesa y española con muralla abaluartada, torre del homenaje templaria y azulejos manuelinos.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Área Autocaravanas Zafra - La Pequeña Sevilla",
        "poblacion": "Zafra", "provincia": "Badajoz", "comunidad_autonoma": "Extremadura", "pais": "España",
        "latitud": 38.4239, "longitud": -6.4172, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Plaza Grande y Plaza Chica porticadas, palacio de los Duques de Feria y feria internacional ganadera. Conexión Vía de la Plata.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Pernocta Puente Romano de Alcántara",
        "poblacion": "Alcántara", "provincia": "Cáceres", "comunidad_autonoma": "Extremadura", "pais": "España",
        "latitud": 39.7219, "longitud": -6.8911, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "La obra cumbre de la ingeniería civil romana sobre el Tajo, intacta tras dos milenios. Cantera de aguas verdes para el baño.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Pernocta Poblado Desierto de Granadilla",
        "poblacion": "Zarza de Granadilla", "provincia": "Cáceres", "comunidad_autonoma": "Extremadura", "pais": "España",
        "latitud": 40.3014, "longitud": -6.1089, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Pueblo medieval amurallado rodeado por las aguas del embalse de Gabriel y Galán. Desalojado en los años 60 y hoy restaurado.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Recreativa Los Barruecos - Malpartida de Cáceres",
        "poblacion": "Malpartida de Cáceres", "provincia": "Cáceres", "comunidad_autonoma": "Extremadura", "pais": "España",
        "latitud": 39.4231, "longitud": -6.5028, "tipo_lugar": "area_recreativa", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Bolos graníticos gigantes que emergen de charcas con cigüeñas y nidos. Museo Vostell y escenario de batalla de Juego de Tronos.",
        "tiene_agua": True, "tiene_mesas_picnic": True, "es_zona_recreativa": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Camper Las Hurdes - Caminomorisco",
        "poblacion": "Caminomorisco", "provincia": "Cáceres", "comunidad_autonoma": "Extremadura", "pais": "España",
        "latitud": 40.3244, "longitud": -6.2917, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Meandros espectaculares del río Alagón (como el Meandro del Melero), alquerías de pizarra y miel de brezo.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "tiene_senderismo": True
    },
    {
        "nombre": "Área Recreativa Garganta la Olla",
        "poblacion": "Garganta la Olla", "provincia": "Cáceres", "comunidad_autonoma": "Extremadura", "pais": "España",
        "latitud": 40.1111, "longitud": -5.7764, "tipo_lugar": "area_recreativa", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Junto a la garganta Mayor con charcos naturales de aguas cristalinas labrados en la roca granítica. Muy sombreado.",
        "tiene_agua": True, "tiene_mesas_picnic": True, "es_zona_recreativa": True, "mucha_sombra": True
    },

    # --- ISLAS BALEARES (6) ---
    {
        "nombre": "Camping Son Bou - Menorca",
        "poblacion": "Alaior", "provincia": "Illes Balears", "comunidad_autonoma": "Islas Baleares", "pais": "España",
        "latitud": 39.9011, "longitud": 4.0722, "tipo_lugar": "camping", "precio": 27.0, "es_gratuito": False,
        "descripcion": "Ubicado en un gran pinar a poca distancia de la playa más larga de Menorca. Piscina olímpica, chalets y parcelas camper.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_wifi": True, "playa_cercana": True, "ideal_familias": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Faro de Cavalleria - Norte de Menorca",
        "poblacion": "Es Mercadal", "provincia": "Illes Balears", "comunidad_autonoma": "Islas Baleares", "pais": "España",
        "latitud": 40.0886, "longitud": 4.0931, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Acantilados salvajes de piedra rojiza en el norte de Menorca. Puestas de sol impresionantes sobre el mar turquesa.",
        "tiene_agua": False, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Parking Cala Saona - Formentera",
        "poblacion": "Sant Francesc Xavier", "provincia": "Illes Balears", "comunidad_autonoma": "Islas Baleares", "pais": "España",
        "latitud": 38.6928, "longitud": 1.3897, "tipo_lugar": "parking_urbano", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Ensenada resguardada con varaderos tradicionales de madera y aguas transparentes caribeñas gracias a la posidonia oceánica.",
        "tiene_agua": False, "playa_cercana": True, "admite_mascotas": True
    },
    {
        "nombre": "Pernocta Parque Natural Mondragó - Mallorca",
        "poblacion": "Santanyí", "provincia": "Illes Balears", "comunidad_autonoma": "Islas Baleares", "pais": "España",
        "latitud": 39.3519, "longitud": 3.1911, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Calas de arena blanca rodeadas de pinares y humedales protegidos con senderos señalizados en el sur de Mallorca.",
        "tiene_agua": False, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Recreativa Lluc - Sierra de Tramuntana",
        "poblacion": "Escorca", "provincia": "Illes Balears", "comunidad_autonoma": "Islas Baleares", "pais": "España",
        "latitud": 39.8228, "longitud": 2.8839, "tipo_lugar": "area_recreativa", "precio": 0.0, "es_gratuito": True,
        "descripcion": "En el corazón de la Sierra de Tramuntana junto al Santuario de Lluc. Merendero bajo encinas centenarias con agua de manantial.",
        "tiene_agua": True, "tiene_mesas_picnic": True, "es_zona_recreativa": True, "mucha_sombra": True, "tiene_senderismo": True
    },
    {
        "nombre": "Pernocta Cala d'Hort - Vistas a Es Vedrà",
        "poblacion": "Sant Josep de sa Talaia", "provincia": "Illes Balears", "comunidad_autonoma": "Islas Baleares", "pais": "España",
        "latitud": 38.8911, "longitud": 1.2283, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "La vista más magnética y mística de Ibiza frente al islote enigmático de Es Vedrà que se eleva casi 400 metros sobre el mar.",
        "tiene_agua": False, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True
    },

    # --- ISLAS CANARIAS (7) ---
    {
        "nombre": "Pernocta Parque Nacional del Teide - Roques de García",
        "poblacion": "La Orotava", "provincia": "Santa Cruz de Tenerife", "comunidad_autonoma": "Canarias", "pais": "España",
        "latitud": 28.2239, "longitud": -16.6308, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "A 2.100 metros bajo el pico del Teide. Reserva Starlight mundial con uno de los cielos nocturnos más limpios del planeta.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Camper El Médano - Montaña Roja",
        "poblacion": "Granadilla de Abona", "provincia": "Santa Cruz de Tenerife", "comunidad_autonoma": "Canarias", "pais": "España",
        "latitud": 28.0417, "longitud": -16.5411, "tipo_lugar": "area_autocaravanas", "precio": 9.0, "es_gratuito": False,
        "descripcion": "Meca canaria del windsurf y kitesurf con dunas fósiles y playa natural de arena dorada volcánica frente al mar.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True
    },
    {
        "nombre": "Área Autocaravanas Puerto de las Nieves - Agaete",
        "poblacion": "Agaete", "provincia": "Las Palmas", "comunidad_autonoma": "Canarias", "pais": "España",
        "latitud": 28.1011, "longitud": -15.7089, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Junto a las piscinas naturales de Las Salinas y acantilados del Parque Natural de Tamadaba. Pescado fresco y ferris a Tenerife.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True
    },
    {
        "nombre": "Pernocta Playa de Famara - Risco",
        "poblacion": "Teguise", "provincia": "Las Palmas", "comunidad_autonoma": "Canarias", "pais": "España",
        "latitud": 29.1158, "longitud": -13.5514, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Kilómetros de arena volcánica bajo el majestuoso risco de Famara de 600 metros en Lanzarote. Surf salvaje y brisa atlántica.",
        "tiene_agua": False, "playa_cercana": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Camper Grandes Playas de Corralejo",
        "poblacion": "La Oliva", "provincia": "Las Palmas", "comunidad_autonoma": "Canarias", "pais": "España",
        "latitud": 28.6942, "longitud": -13.8422, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Frente al mar turquesa del estrecho de la Bocaina y la Isla de Lobos. Dunas infinitas de arena blanca caribeña en Fuerteventura.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True
    },
    {
        "nombre": "Pernocta Valle Gran Rey - La Gomera",
        "poblacion": "Valle Gran Rey", "provincia": "Santa Cruz de Tenerife", "comunidad_autonoma": "Canarias", "pais": "España",
        "latitud": 28.0931, "longitud": -17.3367, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Al final del barranco escoltado por bancales de palmeras canarias y casas de piedra. Puestas de sol al ritmo de tambores en la playa.",
        "tiene_agua": False, "playa_cercana": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Recreativa El Refugio de El Pilar - La Palma",
        "poblacion": "El Paso", "provincia": "Santa Cruz de Tenerife", "comunidad_autonoma": "Canarias", "pais": "España",
        "latitud": 28.6158, "longitud": -17.8286, "tipo_lugar": "area_recreativa", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Entre el mar de nubes y los pinares de la Ruta de los Volcanes en la cumbre de La Palma. Fogones, mesas y agua potable.",
        "tiene_agua": True, "tiene_mesas_picnic": True, "es_zona_recreativa": True, "mucha_sombra": True, "tiene_senderismo": True
    },

    # --- PORTUGAL (12) ---
    {
        "nombre": "Pernocta Cabo de São Vicente - Sagres",
        "poblacion": "Sagres/Vila do Bispo", "provincia": "Faro", "comunidad_autonoma": "Algarve", "pais": "Portugal",
        "latitud": 37.0231, "longitud": -8.9967, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "El extremo suroeste del continente europeo. Acantilados verticales de 75 metros azotados por olas gigantes del Atlántico.",
        "tiene_agua": False, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas Carrapateira - Costa Vicentina",
        "poblacion": "Aljezur", "provincia": "Faro", "comunidad_autonoma": "Algarve", "pais": "Portugal",
        "latitud": 37.1858, "longitud": -8.8986, "tipo_lugar": "area_autocaravanas", "precio": 8.0, "es_gratuito": False,
        "descripcion": "Pasarelas de madera sobre dunas costeras hasta la playa salvaje de Bordeira y Amado. El paraíso de la furgoneta surfista.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True
    },
    {
        "nombre": "Camping São Miguel - Odeceixe",
        "poblacion": "Odeceixe", "provincia": "Faro", "comunidad_autonoma": "Algarve", "pais": "Portugal",
        "latitud": 37.4331, "longitud": -8.7694, "tipo_lugar": "camping", "precio": 21.0, "es_gratuito": False,
        "descripcion": "Entre frondosos pinares a minutos de la playa donde el río Seixe serpentea antes de abrazar el mar formando una laguna natural.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "mucha_sombra": True, "ideal_familias": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Área Camper Monsaraz - Lago Alqueva",
        "poblacion": "Monsaraz", "provincia": "Évora", "comunidad_autonoma": "Alentejo", "pais": "Portugal",
        "latitud": 38.4419, "longitud": -7.3811, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Villa blanca medieval amurallada sobre el gran lago artificial de Alqueva. Primer destino turístico Starlight del mundo.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True
    },
    {
        "nombre": "Pernocta Faro de Nazaré - Olas Gigantes",
        "poblacion": "Nazaré", "provincia": "Leiria", "comunidad_autonoma": "Centro", "pais": "Portugal",
        "latitud": 39.6053, "longitud": -9.0831, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Frente al Forte de São Miguel Arcanjo donde rompen las mayores olas surfeadas del planeta en la Praia do Norte.",
        "tiene_agua": False, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Área Autocaravanas Sintra",
        "poblacion": "Sintra", "provincia": "Lisboa", "comunidad_autonoma": "Lisboa", "pais": "Portugal",
        "latitud": 38.8042, "longitud": -9.3817, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Base estratégica para subir al Palacio da Pena, Castelo dos Mouros y Quinta da Regaleira en la sierra de Sintra.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Área Camper Peniche - Cabo Carvoeiro",
        "poblacion": "Peniche", "provincia": "Leiria", "comunidad_autonoma": "Centro", "pais": "Portugal",
        "latitud": 39.3608, "longitud": -9.4042, "tipo_lugar": "area_autocaravanas", "precio": 9.0, "es_gratuito": False,
        "descripcion": "En la península rocosa frente a las islas Berlengas y la mundialmente famosa ola de Supertubos. Servicios y duchas.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True
    },
    {
        "nombre": "Área Camper Costa Nova - Aveiro",
        "poblacion": "Ílhavo", "provincia": "Aveiro", "comunidad_autonoma": "Centro", "pais": "Portugal",
        "latitud": 40.6139, "longitud": -8.7497, "tipo_lugar": "area_autocaravanas", "precio": 8.0, "es_gratuito": False,
        "descripcion": "Frente a las famosas casas de pescadores a rayas de colores (palheiros), entre la ría de Aveiro y el océano.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True
    },
    {
        "nombre": "Pernocta Serra da Estrela - Torre",
        "poblacion": "Seia", "provincia": "Guarda", "comunidad_autonoma": "Centro", "pais": "Portugal",
        "latitud": 40.3217, "longitud": -7.6131, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "El punto más alto de Portugal continental a 1.993 metros de altitud. Valles glaciares, queserías tradicionales y nieve invernal.",
        "tiene_agua": False, "tiene_senderismo": True, "admite_mascotas": True
    },
    {
        "nombre": "Camping Cerdeira - Parque Nacional Peneda-Gerês",
        "poblacion": "Terras de Bouro", "provincia": "Braga", "comunidad_autonoma": "Norte", "pais": "Portugal",
        "latitud": 41.7611, "longitud": -8.1989, "tipo_lugar": "camping", "precio": 22.0, "es_gratuito": False,
        "descripcion": "Camping de montaña respetuoso con el medio ambiente en el único parque nacional de Portugal. Pozas esmeraldas y caballos salvajes garranos.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_duchas": True, "mucha_sombra": True, "tiene_senderismo": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Área Autocaravanas Évora",
        "poblacion": "Évora", "provincia": "Évora", "comunidad_autonoma": "Alentejo", "pais": "Portugal",
        "latitud": 38.5678, "longitud": -7.9158, "tipo_lugar": "area_autocaravanas", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Junto a las murallas medievales de la capital del Alentejo. Templo romano de Diana, Capela dos Ossos y gastronomía alentejana.",
        "tiene_agua": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "acceso_asfaltado": True
    },
    {
        "nombre": "Área Camper Vila Nova de Gaia - Oporto",
        "poblacion": "Vila Nova de Gaia", "provincia": "Porto", "comunidad_autonoma": "Norte", "pais": "Portugal",
        "latitud": 41.1367, "longitud": -8.6583, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "Junto a las playas del Atlántico y carril bici a orillas del Duero hacia las bodegas de vino de Oporto y el Puente Don Luis I.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "rutas_en_bici": True, "playa_cercana": True
    }
]

def ejecutar_poblado():
    print(f"Total lugares reales preparados en el catálogo: {len(LUGARES_200)}")
    
    # Obtenemos usuarios para distribuir la autoría
    usuarios = list(Explorador.objects.all())
    if not usuarios:
        print("No hay usuarios en la base de datos.")
        return
        
    creados = 0
    actualizados = 0
    
    for idx, data in enumerate(LUGARES_200):
        # Asignamos autor rotatorio entre los usuarios
        autor = usuarios[idx % len(usuarios)]
        
        nombre = data['nombre']
        defaults = {
            'creador': autor,
            'poblacion': data.get('poblacion', ''),
            'provincia': data.get('provincia', ''),
            'comunidad_autonoma': data.get('comunidad_autonoma', ''),
            'pais': data.get('pais', 'España'),
            'latitud': data['latitud'],
            'longitud': data['longitud'],
            'tipo_lugar': data.get('tipo_lugar', 'area_autocaravanas'),
            'precio': data.get('precio', 0.0),
            'es_gratuito': data.get('es_gratuito', False),
            'descripcion': data.get('descripcion', ''),
            'tiene_agua': data.get('tiene_agua', False),
            'tiene_lavabo': data.get('tiene_lavabo', False),
            'tiene_electricidad': data.get('tiene_electricidad', False),
            'tiene_wifi': data.get('tiene_wifi', False),
            'tiene_basuras': True,
            'tiene_duchas': data.get('tiene_duchas', False),
            'tiene_vaciado_aguas_grises': data.get('tiene_vaciado_aguas_grises', False),
            'tiene_vaciado_aguas_negras': data.get('tiene_vaciado_aguas_negras', False),
            'ideal_familias': data.get('ideal_familias', False),
            'tiene_senderismo': data.get('tiene_senderismo', False),
            'playa_cercana': data.get('playa_cercana', False),
            'rutas_en_bici': data.get('rutas_en_bici', False),
            'admite_mascotas': data.get('admite_mascotas', True),
            'acceso_asfaltado': data.get('acceso_asfaltado', True),
            'mucha_sombra': data.get('mucha_sombra', False),
            'muy_soleado': data.get('muy_soleado', False),
            'terreno_nivelado': data.get('terreno_nivelado', True),
            'apto_grandes_autocaravanas': data.get('apto_grandes_autocaravanas', True),
            'permite_sacar_toldo': data.get('permite_sacar_toldo', False),
            'tiene_mesas_picnic': data.get('tiene_mesas_picnic', False),
            'es_zona_recreativa': data.get('es_zona_recreativa', False),
            'tiene_senderos_sencillos': data.get('tiene_senderismo', False),
            'ideal_ninos_10_anos': data.get('ideal_familias', False),
            'valoracion_media': round(4.2 + (idx % 8) * 0.1, 1),
        }
        
        lugar, fue_creado = Lugar.objects.update_or_create(
            nombre=nombre,
            defaults=defaults
        )
        if fue_creado:
            creados += 1
        else:
            actualizados += 1
            
    print(f"Resultado: {creados} lugares creados, {actualizados} actualizados.")
    print(f"Total lugares en la base de datos ahora: {Lugar.objects.count()}")

if __name__ == '__main__':
    ejecutar_poblado()
