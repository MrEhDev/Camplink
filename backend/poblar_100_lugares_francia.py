# -*- coding: utf-8 -*-
# Script para poblar 100 lugares reales en Francia con coordenadas verificadas, servicios camper y precios
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'camplink_project.settings')
django.setup()

from exploradores.models import Explorador
from lugares.models import Lugar

LUGARES_FRANCIA = [
    # ================= NORMANDÍA (10) =================
    {
        "nombre": "Aire Camping-Car Park Mont Saint-Michel - Beauvoir",
        "poblacion": "Beauvoir", "provincia": "Manche", "comunidad_autonoma": "Normandía", "pais": "Francia",
        "latitud": 48.5976, "longitud": -1.5098, "tipo_lugar": "area_autocaravanas", "precio": 14.5, "es_gratuito": False,
        "descripcion": "Área oficial situada a escasos 4 km de la abadía del Mont Saint-Michel, conectada por carril bici llano y lanzaderas. Parcelas amplias con césped y electricidad.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale Falaises d'Étretat",
        "poblacion": "Étretat", "provincia": "Seine-Maritime", "comunidad_autonoma": "Normandía", "pais": "Francia",
        "latitud": 49.7022, "longitud": 0.2131, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "Área municipal perfecta para visitar a pie los sobrecogedores acantilados de caliza de Étretat y la aguja hueca. Entorno costero inigualable.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire du Bassin de Honfleur",
        "poblacion": "Honfleur", "provincia": "Calvados", "comunidad_autonoma": "Normandía", "pais": "Francia",
        "latitud": 49.4182, "longitud": 0.2415, "tipo_lugar": "area_autocaravanas", "precio": 14.0, "es_gratuito": False,
        "descripcion": "Situada junto a la cuenca este del histórico puerto de Honfleur. A solo 5 minutos a pie de las casas de fachada de pizarra y restaurantes de marisco.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Municipale Arromanches - D-Day Gold Beach",
        "poblacion": "Arromanches-les-Bains", "provincia": "Calvados", "comunidad_autonoma": "Normandía", "pais": "Francia",
        "latitud": 49.3364, "longitud": -0.6208, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Área en lo alto de los acantilados con vistas directas a los restos del puerto artificial Mulberry del Desembarco de Normandía de 1944. Museo y playa a pie.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Libre Faro de Gatteville - Barfleur",
        "poblacion": "Gatteville-le-Phare", "provincia": "Manche", "comunidad_autonoma": "Normandía", "pais": "Francia",
        "latitud": 49.6912, "longitud": -1.2678, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Estacionamiento costero junto al segundo faro más alto de Francia. Vistas salvajes al canal de la Mancha, noche muy tranquila con sonido de las olas.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Camping Municipal Sainte-Mère-Église",
        "poblacion": "Sainte-Mère-Église", "provincia": "Manche", "comunidad_autonoma": "Normandía", "pais": "Francia",
        "latitud": 49.4088, "longitud": -1.3142, "tipo_lugar": "camping", "precio": 16.0, "es_gratuito": False,
        "descripcion": "Camping tranquilo rodeado de setos normandos en el pueblo histórico donde aterrizaron los paracaidistas estadounidenses de la 82ª División.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire du Port de Granville",
        "poblacion": "Granville", "provincia": "Manche", "comunidad_autonoma": "Normandía", "pais": "Francia",
        "latitud": 48.8315, "longitud": -1.5975, "tipo_lugar": "area_autocaravanas", "precio": 11.0, "es_gratuito": False,
        "descripcion": "Estacionamiento habilitado en el puerto pesquero de Granville, con vistas a la alta ciudad amurallada y ferrys a las islas Chausey.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Falaise d'Amont - Fécamp",
        "poblacion": "Fécamp", "provincia": "Seine-Maritime", "comunidad_autonoma": "Normandía", "pais": "Francia",
        "latitud": 49.7618, "longitud": 0.3751, "tipo_lugar": "parking_urbano", "precio": 8.0, "es_gratuito": False,
        "descripcion": "Aparcamiento panorámico sobre el acantilado frente al puerto de Fécamp y el Palacio Bénédictine. Vistas puestas de sol atlánticas.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Camping-Car Park Cherbourg - Querqueville",
        "poblacion": "Querqueville", "provincia": "Manche", "comunidad_autonoma": "Normandía", "pais": "Francia",
        "latitud": 49.6645, "longitud": -1.6923, "tipo_lugar": "area_autocaravanas", "precio": 12.5, "es_gratuito": False,
        "descripcion": "Frente a la playa de arena de Querqueville en la rada de Cherbourg. Servicios completos y acceso directo al GR223 (sendero de aduaneros).",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale de Dieppe Plage",
        "poblacion": "Dieppe", "provincia": "Seine-Maritime", "comunidad_autonoma": "Normandía", "pais": "Francia",
        "latitud": 49.9298, "longitud": 1.0924, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "Área pegada al paseo marítimo y al puerto deportivo de Dieppe. Cerca de las históricas fortalezas y el mercado de pescado fresco.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },

    # ================= BRETAÑA (12) =================
    {
        "nombre": "Aire Féval Saint-Malo Intra-Muros",
        "poblacion": "Saint-Malo", "provincia": "Ille-et-Vilaine", "comunidad_autonoma": "Bretaña", "pais": "Francia",
        "latitud": 48.6419, "longitud": -2.0018, "tipo_lugar": "area_autocaravanas", "precio": 9.5, "es_gratuito": False,
        "descripcion": "Área oficial de Saint-Malo que incluye billete de autobús lanzadera directo a la ciudad corsaria amurallada intramuros. Servicios completos.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Municipale de Cancale - La Pointe du Grouin",
        "poblacion": "Cancale", "provincia": "Ille-et-Vilaine", "comunidad_autonoma": "Bretaña", "pais": "Francia",
        "latitud": 48.6754, "longitud": -1.8592, "tipo_lugar": "area_autocaravanas", "precio": 11.0, "es_gratuito": False,
        "descripcion": "Capital de las ostras bretonas. Área situada en la parte alta con vistas al mar y senderos hacia la espectacular Pointe du Grouin.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire de Camping-Car Quiberon - Côte Sauvage",
        "poblacion": "Quiberon", "provincia": "Morbihan", "comunidad_autonoma": "Bretaña", "pais": "Francia",
        "latitud": 47.4912, "longitud": -3.1258, "tipo_lugar": "area_autocaravanas", "precio": 13.0, "es_gratuito": False,
        "descripcion": "En plena península de Quiberon, junto a la agreste Costa Salvaje. Olas rompiendo contra acantilados graníticos y salidas en barco a Belle-Île.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Libre Pointe du Raz - Cap Sizun",
        "poblacion": "Plogoff", "provincia": "Finistère", "comunidad_autonoma": "Bretaña", "pais": "Francia",
        "latitud": 48.0375, "longitud": -4.7186, "tipo_lugar": "pernocta_libre", "precio": 8.0, "es_gratuito": False,
        "descripcion": "Aparcamiento del Grand Site de France Pointe du Raz. Extremo occidental de Bretaña frente al faro de La Vieille y el temible estrecho de Raz de Sein.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Municipale de Dinan - Port de la Rance",
        "poblacion": "Dinan", "provincia": "Côtes-d'Armor", "comunidad_autonoma": "Bretaña", "pais": "Francia",
        "latitud": 48.4552, "longitud": -2.0396, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Junto al río Rance y el puente medieval de Dinan. Acceso directo subiendo por la empinada e histórica Rue du Jerzual repleta de artesanos.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Camaret-sur-Mer - Pointe de Pen-Hir",
        "poblacion": "Camaret-sur-Mer", "provincia": "Finistère", "comunidad_autonoma": "Bretaña", "pais": "Francia",
        "latitud": 48.2721, "longitud": -4.5982, "tipo_lugar": "area_autocaravanas", "precio": 11.5, "es_gratuito": False,
        "descripcion": "En la península de Crozon, próxima a la Torre Vauban patrimonio UNESCO y los acantilados monumentales de Pen-Hir con los islotes Tas de Pois.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Carnac Alineamientos Megalíticos",
        "poblacion": "Carnac", "provincia": "Morbihan", "comunidad_autonoma": "Bretaña", "pais": "Francia",
        "latitud": 47.5921, "longitud": -3.0784, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "A 500 metros de los alineamientos prehistóricos de menhires de Kermario y Ménec. Entorno arbolado muy agradable con carril bici.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Camping Municipal Perros-Guirec - Côte de Granit Rose",
        "poblacion": "Perros-Guirec", "provincia": "Côtes-d'Armor", "comunidad_autonoma": "Bretaña", "pais": "Francia",
        "latitud": 48.8184, "longitud": -3.4475, "tipo_lugar": "camping", "precio": 17.5, "es_gratuito": False,
        "descripcion": "Ubicado en el corazón de la fabulosa Costa de Granito Rosa. Acceso al faro de Men Ruz y formaciones rocosas escultóricas de Ploumanac'h.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire de Concarneau - Ville Close",
        "poblacion": "Concarneau", "provincia": "Finistère", "comunidad_autonoma": "Bretaña", "pais": "Francia",
        "latitud": 47.8762, "longitud": -3.9184, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Estacionamiento cercano a la histórica Ville Close de Concarneau, fortaleza insular en medio del puerto unida por un puente de piedra.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Cap Fréhel et Fort La Latte",
        "poblacion": "Plévenon", "provincia": "Côtes-d'Armor", "comunidad_autonoma": "Bretaña", "pais": "Francia",
        "latitud": 48.6678, "longitud": -2.3164, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Pernocta en paraje salvaje entre brezos y acantilados de arenisca roja de 70 metros. A poca distancia a pie del imponente castillo Fort La Latte.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Municipale de Vannes - Golfe du Morbihan",
        "poblacion": "Vannes", "provincia": "Morbihan", "comunidad_autonoma": "Bretaña", "pais": "Francia",
        "latitud": 47.6432, "longitud": -2.7681, "tipo_lugar": "area_autocaravanas", "precio": 11.0, "es_gratuito": False,
        "descripcion": "Base ideal para explorar las islas del Golfo de Morbihan y el casco histórico medieval con murallas y jardines de flores de Vannes.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Portuaire de Roscoff - Île de Batz",
        "poblacion": "Roscoff", "provincia": "Finistère", "comunidad_autonoma": "Bretaña", "pais": "Francia",
        "latitud": 48.7214, "longitud": -3.9852, "tipo_lugar": "area_autocaravanas", "precio": 10.5, "es_gratuito": False,
        "descripcion": "Pueblo marinero con casas de armadores de granito. Barcos hacia la isla de Batz y jardín exótico a 10 minutos a pie.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },

    # ================= VALLE DEL LOIRA (10) =================
    {
        "nombre": "Aire Camping-Car Park Château de Chambord",
        "poblacion": "Chambord", "provincia": "Loir-et-Cher", "comunidad_autonoma": "Centro-Valle de Loira", "pais": "Francia",
        "latitud": 47.6162, "longitud": 1.5175, "tipo_lugar": "area_autocaravanas", "precio": 13.5, "es_gratuito": False,
        "descripcion": "Situada dentro del inmenso dominio forestal real de Chambord. Vista hacia el castillo renacentista más grandioso del Loira. Tranquilidad absoluta.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale de Chenonceaux - Château des Dames",
        "poblacion": "Chenonceaux", "provincia": "Indre-et-Loire", "comunidad_autonoma": "Centro-Valle de Loira", "pais": "Francia",
        "latitud": 47.3312, "longitud": 1.0682, "tipo_lugar": "area_autocaravanas", "precio": 11.0, "es_gratuito": False,
        "descripcion": "A 800 metros del castillo-puente que cruza el río Cher. Paseo arbolado llano para llegar a pie o en bicicleta.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Camping Municipal Île d'Or Amboise",
        "poblacion": "Amboise", "provincia": "Indre-et-Loire", "comunidad_autonoma": "Centro-Valle de Loira", "pais": "Francia",
        "latitud": 47.4175, "longitud": 0.9856, "tipo_lugar": "camping", "precio": 16.0, "es_gratuito": False,
        "descripcion": "En una isla fluvial en medio del río Loira con vistas directas al Castillo Real de Amboise y cerca de Clos Lucé, última morada de Leonardo da Vinci.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale Saumur - Château et Caves",
        "poblacion": "Saumur", "provincia": "Maine-et-Loire", "comunidad_autonoma": "Países del Loira", "pais": "Francia",
        "latitud": 47.2612, "longitud": -0.0728, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Situada en la orilla norte del Loira, con vistas nocturnas iluminadas al castillo de Saumur y acceso a bodegas subterráneas de vino espumoso.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Camping-Car Blois - Bords de Loire",
        "poblacion": "Blois", "provincia": "Loir-et-Cher", "comunidad_autonoma": "Centro-Valle de Loira", "pais": "Francia",
        "latitud": 47.5854, "longitud": 1.3392, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "Estacionamiento arbolado a 15 minutos a pie del Castillo Real de Blois y la Casa de la Magia. Servicios automatizados 24 horas.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Libre Château de Montsoreau",
        "poblacion": "Montsoreau", "provincia": "Maine-et-Loire", "comunidad_autonoma": "Países del Loira", "pais": "Francia",
        "latitud": 47.2178, "longitud": 0.0574, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "En la confluencia del río Vienne y el Loira, en uno de los pueblos más bellos de Francia. Casas de toba blanca y viviendas trogloditas.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Municipale de Villandry - Jardins Remarquables",
        "poblacion": "Villandry", "provincia": "Indre-et-Loire", "comunidad_autonoma": "Centro-Valle de Loira", "pais": "Francia",
        "latitud": 47.3415, "longitud": 0.5126, "tipo_lugar": "area_autocaravanas", "precio": 9.0, "es_gratuito": False,
        "descripcion": "A 300 metros de los jardines renacentistas en terrazas más famosos de Francia. Conexión directa a la ruta cicloturista La Loire à Vélo.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Camping-Car Chinon - Forteresse Royale",
        "poblacion": "Chinon", "provincia": "Indre-et-Loire", "comunidad_autonoma": "Centro-Valle de Loira", "pais": "Francia",
        "latitud": 47.1685, "longitud": 0.2394, "tipo_lugar": "area_autocaravanas", "precio": 11.5, "es_gratuito": False,
        "descripcion": "Al pie de la inmensa fortaleza medieval de Chinon sobre el río Vienne. Célebre por sus vinos tintos de Cabernet Franc y su gastronomía rabelaisiana.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale Cheverny - Domaine de Tintin",
        "poblacion": "Cheverny", "provincia": "Loir-et-Cher", "comunidad_autonoma": "Centro-Valle de Loira", "pais": "Francia",
        "latitud": 47.4984, "longitud": 1.4589, "tipo_lugar": "area_autocaravanas", "precio": 8.0, "es_gratuito": False,
        "descripcion": "Área tranquila junto al castillo de Cheverny, el que inspiró el palacio de Moulinsart de las aventuras de Tintín. Césped y sombra de tilos.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Camping-Car Park Azay-le-Rideau",
        "poblacion": "Azay-le-Rideau", "provincia": "Indre-et-Loire", "comunidad_autonoma": "Centro-Valle de Loira", "pais": "Francia",
        "latitud": 47.2625, "longitud": 0.4682, "tipo_lugar": "area_autocaravanas", "precio": 12.5, "es_gratuito": False,
        "descripcion": "Junto al río Indre y a poca distancia del delicado castillo renacentista rodeado de agua. Parcelas amplias delimitadas con setos naturales.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },

    # ================= ALPES FRANCESES Y SABOYA (12) =================
    {
        "nombre": "Aire Camping-Car Chamonix-Mont-Blanc - Les Bossons",
        "poblacion": "Chamonix-Mont-Blanc", "provincia": "Haute-Savoie", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 45.9056, "longitud": 6.8423, "tipo_lugar": "area_autocaravanas", "precio": 16.0, "es_gratuito": False,
        "descripcion": "Vistas frontales al glaciar de Bossons y la cumbre del Mont Blanc (4.807m). Conexión en tren de montaña o autobús al centro y al teleférico Aiguille du Midi.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale Annecy - Lac d'Annecy",
        "poblacion": "Annecy", "provincia": "Haute-Savoie", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 45.8894, "longitud": 6.1415, "tipo_lugar": "area_autocaravanas", "precio": 15.0, "es_gratuito": False,
        "descripcion": "A 100 metros de las aguas turquesas y transparentes del lago de Annecy. Carril bici ribereño y paseo hasta los canales de la Venecia de los Alpes.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire du Col du Lautaret - Parc National des Écrins",
        "poblacion": "Le Monêtier-les-Bains", "provincia": "Hautes-Alpes", "comunidad_autonoma": "Provenza-Alpes-Costa Azul", "pais": "Francia",
        "latitud": 45.0352, "longitud": 6.4068, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "A más de 2.050 metros de altitud, con vistas grandiosas al glaciar de la Meije y el macizo de Écrins. Noche estrellada de montaña insuperable.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Municipale Briançon - Cité Vauban",
        "poblacion": "Briançon", "provincia": "Hautes-Alpes", "comunidad_autonoma": "Provenza-Alpes-Costa Azul", "pais": "Francia",
        "latitud": 44.8965, "longitud": 6.6432, "tipo_lugar": "area_autocaravanas", "precio": 11.0, "es_gratuito": False,
        "descripcion": "La ciudad más alta de Francia (1.326 m). Área junto al teleférico Prorel y murallas Vauban patrimonio de la humanidad UNESCO.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Camping-Car Val d'Isère - La Daille",
        "poblacion": "Val-d'Isère", "provincia": "Savoie", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 45.4523, "longitud": 6.9684, "tipo_lugar": "area_autocaravanas", "precio": 18.0, "es_gratuito": False,
        "descripcion": "Área de alta montaña adaptada para invierno y verano en el valle de Tarentaise. Lanzaderas gratuitas por todo el resort alpino.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire du Lac du Bourget - Aix-les-Bains",
        "poblacion": "Aix-les-Bains", "provincia": "Savoie", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 45.7012, "longitud": 5.8895, "tipo_lugar": "area_autocaravanas", "precio": 13.0, "es_gratuito": False,
        "descripcion": "Frente al mayor lago natural de origen glaciar de Francia. Excursiones en barco a la abadía real de Hautecombe y aguas termales.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Alpe d'Huez - Virage 21",
        "poblacion": "Huez", "provincia": "Isère", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 45.0612, "longitud": 6.0684, "tipo_lugar": "area_autocaravanas", "precio": 14.0, "es_gratuito": False,
        "descripcion": "En la mítica subida del Tour de Francia. 1.860 metros de altitud, con panorama alpino sobre el macizo de Grandes Rousses y Oisans.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Cirque du Fer-à-Cheval - Sixt",
        "poblacion": "Sixt-Fer-à-Cheval", "provincia": "Haute-Savoie", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 46.0785, "longitud": 6.8394, "tipo_lugar": "pernocta_libre", "precio": 7.0, "es_gratuito": False,
        "descripcion": "Un gigantesco anfiteatro natural de caliza con más de 30 cascadas brotando de paredes verticales de 500 metros en primavera. Sobrecogedor.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Camping-Car Morzine-Avoriaz",
        "poblacion": "Morzine", "provincia": "Haute-Savoie", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 46.1754, "longitud": 6.7082, "tipo_lugar": "area_autocaravanas", "precio": 13.5, "es_gratuito": False,
        "descripcion": "En el dominio ciclista y de esquí Portes du Soleil. Chalets de madera tradicionales, ríos de montaña y telecabinas abiertas en verano.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire de La Clusaz - Col des Aravis",
        "poblacion": "La Clusaz", "provincia": "Haute-Savoie", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 45.9015, "longitud": 6.4258, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "Corazón del queso Reblochon artesano. Prados alpinos verdes salpicados de chalets de madera y vistas al macizo de los Aravis.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire du Lac d'Aiguebelette",
        "poblacion": "Nances", "provincia": "Savoie", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 45.5896, "longitud": 5.8012, "tipo_lugar": "camping", "precio": 17.0, "es_gratuito": False,
        "descripcion": "Uno de los lagos más cálidos y preservados de Europa (prohibidos barcos a motor). Agua color esmeralda ideal para paddle surf y kayak.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Bourg-Saint-Maurice - Porte de la Vanoise",
        "poblacion": "Bourg-Saint-Maurice", "provincia": "Savoie", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 45.6184, "longitud": 6.7725, "tipo_lugar": "area_autocaravanas", "precio": 11.0, "es_gratuito": False,
        "descripcion": "Acceso al puerto del Pequeño San Bernardo hacia Italia y al funicular de Les Arcs. Servicios completos con agua y electricidad.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },

    # ================= PROVENZA Y COSTA AZUL (12) =================
    {
        "nombre": "Aire Camping-Car Park Castellane - Gorges du Verdon",
        "poblacion": "Castellane", "provincia": "Alpes-de-Haute-Provence", "comunidad_autonoma": "Provenza-Alpes-Costa Azul", "pais": "Francia",
        "latitud": 43.8462, "longitud": 6.5123, "tipo_lugar": "area_autocaravanas", "precio": 13.0, "es_gratuito": False,
        "descripcion": "Puerta de entrada oriental al mayor cañón de Europa. Rutas de aguas bravas, escalada y excursión al roquedal de Notre Dame du Roc.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Moustiers-Sainte-Marie - Lac de Sainte-Croix",
        "poblacion": "Moustiers-Sainte-Marie", "provincia": "Alpes-de-Haute-Provence", "comunidad_autonoma": "Provenza-Alpes-Costa Azul", "pais": "Francia",
        "latitud": 43.8431, "longitud": 6.2238, "tipo_lugar": "area_autocaravanas", "precio": 12.5, "es_gratuito": False,
        "descripcion": "Al pie de los acantilados donde cuelga la mítica estrella dorada de Moustiers, célebre por su cerámica y a 5 km del lago esmeralda de Sainte-Croix.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale Roussillon - Le Sentier des Ocres",
        "poblacion": "Roussillon", "provincia": "Vaucluse", "comunidad_autonoma": "Provenza-Alpes-Costa Azul", "pais": "Francia",
        "latitud": 43.9012, "longitud": 5.2934, "tipo_lugar": "area_autocaravanas", "precio": 11.0, "es_gratuito": False,
        "descripcion": "En pleno Parque Natural del Luberon. Tierras y farallones teñidos en 17 tonalidades de ocre rojo y dorado bajo pinos piñoneros provenzales.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Camping-Car Cassis - Calanques",
        "poblacion": "Cassis", "provincia": "Bouches-du-Rhône", "comunidad_autonoma": "Provenza-Alpes-Costa Azul", "pais": "Francia",
        "latitud": 43.2215, "longitud": 5.5412, "tipo_lugar": "area_autocaravanas", "precio": 15.0, "es_gratuito": False,
        "descripcion": "Acceso privilegiado al Parque Nacional de Calanques (Port-Miou, Port-Pin, En-Vau). Puerto mediterráneo con viñedos de vino blanco AOC Cassis.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Bormes-les-Mimosas - Plage de la Favière",
        "poblacion": "Bormes-les-Mimosas", "provincia": "Var", "comunidad_autonoma": "Provenza-Alpes-Costa Azul", "pais": "Francia",
        "latitud": 43.1312, "longitud": 6.3684, "tipo_lugar": "area_autocaravanas", "precio": 14.0, "es_gratuito": False,
        "descripcion": "A 400 metros de la playa de arena fina y cerca del pueblo medieval colgado de buganvillas y mimosas frente a las islas de Hyères (Porquerolles).",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Ramatuelle - Plage de Pampelonne",
        "poblacion": "Ramatuelle", "provincia": "Var", "comunidad_autonoma": "Provenza-Alpes-Costa Azul", "pais": "Francia",
        "latitud": 43.2245, "longitud": 6.6612, "tipo_lugar": "area_autocaravanas", "precio": 18.0, "es_gratuito": False,
        "descripcion": "A 5 minutos a pie de los 4,5 km de arena blanca de la mítica playa de Pampelonne en la península de Saint-Tropez. Parcelas bajo pinos mediterráneos.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Fontaine-de-Vaucluse - La Sorgue",
        "poblacion": "Fontaine-de-Vaucluse", "provincia": "Vaucluse", "comunidad_autonoma": "Provenza-Alpes-Costa Azul", "pais": "Francia",
        "latitud": 43.9214, "longitud": 5.1235, "tipo_lugar": "area_autocaravanas", "precio": 10.5, "es_gratuito": False,
        "descripcion": "Junto al manantial resurgente más caudaloso de Francia, origen del río Sorgue con aguas color esmeralda y bosques de plátanos de sombra.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Saint-Rémy-de-Provence - Glanum",
        "poblacion": "Saint-Rémy-de-Provence", "provincia": "Bouches-du-Rhône", "comunidad_autonoma": "Provenza-Alpes-Costa Azul", "pais": "Francia",
        "latitud": 43.7845, "longitud": 4.8312, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "Al pie de los cerros calcáreos de Les Alpilles y la ciudad greco-romana de Glanum. Paisajes de olivos y cipreses pintados por Vincent van Gogh.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Libre Les Baux-de-Provence",
        "poblacion": "Les Baux-de-Provence", "provincia": "Bouches-du-Rhône", "comunidad_autonoma": "Provenza-Alpes-Costa Azul", "pais": "Francia",
        "latitud": 43.7431, "longitud": 4.7956, "tipo_lugar": "parking_urbano", "precio": 6.0, "es_gratuito": False,
        "descripcion": "Estacionamiento a los pies del espolón rocoso coronado por el castillo medieval y las famosas Carrières des Lumières (canteras multimedia).",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Sainte-Maxime - Golfe de Saint-Tropez",
        "poblacion": "Sainte-Maxime", "provincia": "Var", "comunidad_autonoma": "Provenza-Alpes-Costa Azul", "pais": "Francia",
        "latitud": 43.3085, "longitud": 6.6345, "tipo_lugar": "area_autocaravanas", "precio": 14.5, "es_gratuito": False,
        "descripcion": "Orientada al sur con vistas panorámicas al golfo de Saint-Tropez. Lanzaderas marítimas directas al puerto viejo de Saint-Tropez sin atascos de tráfico.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Camping-Car Park Vence - Pays des Baous",
        "poblacion": "Vence", "provincia": "Alpes-Maritimes", "comunidad_autonoma": "Provenza-Alpes-Costa Azul", "pais": "Francia",
        "latitud": 43.7218, "longitud": 7.1124, "tipo_lugar": "area_autocaravanas", "precio": 13.0, "es_gratuito": False,
        "descripcion": "Entre el mar y las montañas de Niza, junto a la ciudad de artistas medieval y la Capilla del Rosario decorada por Henri Matisse.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale Menton - Plateau Saint-Michel",
        "poblacion": "Menton", "provincia": "Alpes-Maritimes", "comunidad_autonoma": "Provenza-Alpes-Costa Azul", "pais": "Francia",
        "latitud": 43.7785, "longitud": 7.4984, "tipo_lugar": "area_autocaravanas", "precio": 15.0, "es_gratuito": False,
        "descripcion": "La perla de la Riviera Francesa fronteriza con Italia. Microclima subtropical, campos de limoneros y vistas deslumbrantes al mar Tirreno.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },

    # ================= PIRINEOS FRANCESES (10) =================
    {
        "nombre": "Aire Municipale Cirque de Gavarnie",
        "poblacion": "Gavarnie-Gèdre", "provincia": "Hautes-Pyrénées", "comunidad_autonoma": "Occitania", "pais": "Francia",
        "latitud": 42.7356, "longitud": -0.0095, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "Al pie del anfiteatro glaciar de Gavarnie, muralla de 1.500 metros coronada por la Gran Cascada de 422 metros. Patrimonio Mundial de la UNESCO.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Cauterets - Pont d'Espagne",
        "poblacion": "Cauterets", "provincia": "Hautes-Pyrénées", "comunidad_autonoma": "Occitania", "pais": "Francia",
        "latitud": 42.8872, "longitud": -0.1165, "tipo_lugar": "area_autocaravanas", "precio": 11.5, "es_gratuito": False,
        "descripcion": "Acceso directo a las cascadas torrenciales de Pont d'Espagne y la subida al majestuoso lago de Gaube bajo la cara norte del pico Vignemale.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Col du Tourmalet - La Mongie",
        "poblacion": "Bagnères-de-Bigorre", "provincia": "Hautes-Pyrénées", "comunidad_autonoma": "Occitania", "pais": "Francia",
        "latitud": 42.9085, "longitud": 0.1456, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Paso de montaña legendario a 2.115 m. Base para subir en teleférico al observatorio astronómico del Pic du Midi de Bigorre sobre el mar de nubes.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Saint-Lary-Soulan - Vallée d'Aure",
        "poblacion": "Saint-Lary-Soulan", "provincia": "Hautes-Pyrénées", "comunidad_autonoma": "Occitania", "pais": "Francia",
        "latitud": 42.8164, "longitud": 0.3218, "tipo_lugar": "area_autocaravanas", "precio": 11.0, "es_gratuito": False,
        "descripcion": "Pueblo pirenaico tradicional de piedra y pizarra con baños termales. Acceso al Parque Nacional de Neouvielle y su constelación de lagos.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Laruns - Vallée d'Ossau",
        "poblacion": "Laruns", "provincia": "Pyrénées-Atlantiques", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 42.9865, "longitud": -0.4258, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "En el corazón del Valle de Ossau hacia el Col du Pourtalet y el Midi d'Ossau. Pueblo pastoril productor del auténtico queso Ossau-Iraty.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire de Gourette - Cirque de Gourette",
        "poblacion": "Eaux-Bonnes", "provincia": "Pyrénées-Atlantiques", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 42.9584, "longitud": -0.3325, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "A 1.400 metros en la vertiente del Col d'Aubisque. Salidas senderistas a los lagos de Anglas y vistas al circo rocoso de Gourette.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Municipale Argelès-Gazost - Val d'Azun",
        "poblacion": "Argelès-Gazost", "provincia": "Hautes-Pyrénées", "comunidad_autonoma": "Occitania", "pais": "Francia",
        "latitud": 43.0042, "longitud": -0.0984, "tipo_lugar": "area_autocaravanas", "precio": 9.5, "es_gratuito": False,
        "descripcion": "Encrucijada pirenaica perfecta como base para atacar Tourmalet, Aubisque y Hautacam. Parque animal de los Pirineos a poca distancia.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Camping-Car Bagnères-de-Luchon",
        "poblacion": "Bagnères-de-Luchon", "provincia": "Haute-Garonne", "comunidad_autonoma": "Occitania", "pais": "Francia",
        "latitud": 42.7915, "longitud": 0.5984, "tipo_lugar": "area_autocaravanas", "precio": 10.5, "es_gratuito": False,
        "descripcion": "Reina de los Pirineos con sus termas de vapor de azufre natural (vaporarium). Telecabina a Superbagnères y senderismo al Lac d'Oo.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Font-Romeu - Pyrénées Catalanes",
        "poblacion": "Font-Romeu-Odeillo-Via", "provincia": "Pyrénées-Orientales", "comunidad_autonoma": "Occitania", "pais": "Francia",
        "latitud": 42.5012, "longitud": 2.0384, "tipo_lugar": "area_autocaravanas", "precio": 11.0, "es_gratuito": False,
        "descripcion": "En la meseta soleada de la Cerdaña francesa. Célebre por su horno solar gigante de Odeillo y el tren amarillo que serpentea por los cañones.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Libre Col d'Aspin",
        "poblacion": "Aspin-Aure", "provincia": "Hautes-Pyrénées", "comunidad_autonoma": "Occitania", "pais": "Francia",
        "latitud": 42.9412, "longitud": 0.3298, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Paso de 1.489 metros entre los valles de Campan y Aure. Prados de pastoreo con vacas pirenaicas y panorámica total hacia el Pic du Midi.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },

    # ================= COSTA ATLÁNTICA Y LAS LANDAS (12) =================
    {
        "nombre": "Aire Camping-Car Park Dune du Pilat",
        "poblacion": "La Teste-de-Buch", "provincia": "Gironde", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 44.5984, "longitud": -1.1985, "tipo_lugar": "area_autocaravanas", "precio": 15.0, "es_gratuito": False,
        "descripcion": "Al pie de la duna de arena más alta de Europa (106 metros). Ascenso por escaleras a la cresta con vistas a la bahía de Arcachon y el banco de Arguin.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale Biscarrosse-Plage - Vivier",
        "poblacion": "Biscarrosse", "provincia": "Landes", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 44.4612, "longitud": -1.2485, "tipo_lugar": "area_autocaravanas", "precio": 14.0, "es_gratuito": False,
        "descripcion": "Inmersa en el bosque de pinos de Las Landas con acceso directo a pie a la playa virgen de Le Vivier, paraíso del surf atlántico.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire de Capbreton - Plage des Océanides",
        "poblacion": "Capbreton", "provincia": "Landes", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 43.6325, "longitud": -1.4423, "tipo_lugar": "area_autocaravanas", "precio": 13.5, "es_gratuito": False,
        "descripcion": "Frente a las dunas y los búnkeres de la Segunda Guerra Mundial sobre la arena. Acceso al puerto deportivo de Capbreton y su estacada de madera.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Camping-Car Hossegor - Lac Marin",
        "poblacion": "Soorts-Hossegor", "provincia": "Landes", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 43.6685, "longitud": -1.4285, "tipo_lugar": "area_autocaravanas", "precio": 14.0, "es_gratuito": False,
        "descripcion": "Junto al lago marino de Hossegor y sus villas vasco-landesas de estilo neo-regional. Degustación de ostras a pie en las cabañas del lago.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Saint-Martin-de-Ré - Île de Ré",
        "poblacion": "Saint-Martin-de-Ré", "provincia": "Charente-Maritime", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 46.2015, "longitud": -1.3684, "tipo_lugar": "area_autocaravanas", "precio": 15.5, "es_gratuito": False,
        "descripcion": "En la capital de la isla de Ré, junto a la ciudadela y murallas Vauban. Kilómetros de carriles bici llanos entre marismas saladas y rosas trepadoras.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Saint-Denis-d'Oléron - Phare de Chassiron",
        "poblacion": "Saint-Denis-d'Oléron", "provincia": "Charente-Maritime", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 46.0354, "longitud": -1.3785, "tipo_lugar": "area_autocaravanas", "precio": 12.5, "es_gratuito": False,
        "descripcion": "En el extremo norte de la isla de Oléron, a unos pasos del faro rayado en blanco y negro de Chassiron y las esclusas de peces tradicionales.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale de Vieux-Boucau - Lac Marin",
        "poblacion": "Vieux-Boucau-les-Bains", "provincia": "Landes", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 43.7845, "longitud": -1.4056, "tipo_lugar": "area_autocaravanas", "precio": 13.0, "es_gratuito": False,
        "descripcion": "Muy arbolada y tranquila, junto al lago de Port d'Albret y las dunas salvajes. Carriles bici de la Vélodyssée a la puerta del área.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Mimizan-Plage - Les Ailes",
        "poblacion": "Mimizan", "provincia": "Landes", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 44.2098, "longitud": -1.2894, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "Entre el lago de Aureilhan y el océano. Sombra densa de pinos marítimos landeses y olas interminables de costa abierta.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Camping-Car Lacanau-Océan",
        "poblacion": "Lacanau", "provincia": "Gironde", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 44.9785, "longitud": -1.1924, "tipo_lugar": "area_autocaravanas", "precio": 14.0, "es_gratuito": False,
        "descripcion": "Mecca del surf internacional cerca de Burdeos. Rodeada de pinares protegidos con acceso rápido a las olas y al lago de Lacanau.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Saint-Jean-de-Luz - Acotz Plage",
        "poblacion": "Saint-Jean-de-Luz", "provincia": "Pyrénées-Atlantiques", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 43.4185, "longitud": -1.6198, "tipo_lugar": "area_autocaravanas", "precio": 14.5, "es_gratuito": False,
        "descripcion": "En la costa vasco-francesa, sobre los acantilados de las playas de Lafitenia y Cenitz. Cerca de la bahía protegida de San Juan de Luz.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale Hendaye - Plage et Baie de Chingoudy",
        "poblacion": "Hendaye", "provincia": "Pyrénées-Atlantiques", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 43.3725, "longitud": -1.7756, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "Frente a Hondarribia y la desembocadura del Bidasoa. Castillo de Abbadia sobre los acantilados de la Corniche Basque a poca distancia.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire du Port d'Arcachon",
        "poblacion": "Arcachon", "provincia": "Gironde", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 44.6612, "longitud": -1.1485, "tipo_lugar": "area_autocaravanas", "precio": 13.0, "es_gratuito": False,
        "descripcion": "En el muelle este del puerto de Arcachon. Paseos en barco por la cuenca hacia las cabañas tchanquées y la Ville d'Hiver del siglo XIX.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },

    # ================= ALSACIA Y VOSGOS (12) =================
    {
        "nombre": "Aire Camping-Car Park Colmar - Bords de Lauch",
        "poblacion": "Colmar", "provincia": "Haut-Rhin", "comunidad_autonoma": "Gran Este", "pais": "Francia",
        "latitud": 48.0825, "longitud": 7.3756, "tipo_lugar": "area_autocaravanas", "precio": 15.0, "es_gratuito": False,
        "descripcion": "A 15 minutos a pie del barrio de cuento de la Pequeña Venecia (Petite Venise), casas de entramado de madera policromadas y canales con flores.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale Riquewihr - Route des Vins d'Alsace",
        "poblacion": "Riquewihr", "provincia": "Haut-Rhin", "comunidad_autonoma": "Gran Este", "pais": "Francia",
        "latitud": 48.1654, "longitud": 7.3012, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "En plena Ruta de los Vinos de Alsacia, a 200 m de las murallas medievales de Riquewihr. Rodeada de laderas de viñedos de Riesling y Gewurztraminer.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Kaysersberg - Château Fort",
        "poblacion": "Kaysersberg Vignoble", "provincia": "Haut-Rhin", "comunidad_autonoma": "Gran Este", "pais": "Francia",
        "latitud": 48.1378, "longitud": 7.2645, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Una de las áreas más populares de Alsacia, junto al río Weiss y coronada por la torre del castillo imperial. Votado pueblo preferido de Francia.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Eguisheim - Cité Médiévale Circulaire",
        "poblacion": "Eguisheim", "provincia": "Haut-Rhin", "comunidad_autonoma": "Gran Este", "pais": "Francia",
        "latitud": 48.0412, "longitud": 7.3125, "tipo_lugar": "area_autocaravanas", "precio": 11.0, "es_gratuito": False,
        "descripcion": "Pueblo edificado en círculos concéntricos alrededor del castillo papal. Famoso por sus cigüeñas alsacianas anidando en tejados y flores en cada rincón.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Ribeauvillé - Les Trois Châteaux",
        "poblacion": "Ribeauvillé", "provincia": "Haut-Rhin", "comunidad_autonoma": "Gran Este", "pais": "Francia",
        "latitud": 48.1925, "longitud": 7.3245, "tipo_lugar": "area_autocaravanas", "precio": 11.0, "es_gratuito": False,
        "descripcion": "Al pie de los tres castillos medievales en la cresta rocosa de Saint-Ulrich. Tiendas gourmet de kougelhopf y pan de especias alsaciano.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire de Gérardmer - Perle des Vosges",
        "poblacion": "Gérardmer", "provincia": "Vosges", "comunidad_autonoma": "Gran Este", "pais": "Francia",
        "latitud": 48.0712, "longitud": 6.8725, "tipo_lugar": "area_autocaravanas", "precio": 12.5, "es_gratuito": False,
        "descripcion": "A orillas del lago glaciar de Gérardmer en los montes Vosgos. Bosques densos de abetos, pistas de esquí y fábricas de lino y mantelería.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Route des Crêtes - Hohneck",
        "poblacion": "La Bresse", "provincia": "Vosges", "comunidad_autonoma": "Gran Este", "pais": "Francia",
        "latitud": 48.0375, "longitud": 7.0164, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "A 1.360 metros de altitud en la cima del Hohneck. Vistas panorámicas hacia la llanura de Alsacia, la Selva Negra alemana y en días claros los Alpes berneses.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Obernai - Pied du Mont Sainte-Odile",
        "poblacion": "Obernai", "provincia": "Bas-Rhin", "comunidad_autonoma": "Gran Este", "pais": "Francia",
        "latitud": 48.4612, "longitud": 7.4856, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Segunda ciudad más turística del Bajo Rin. Casas señoriales de piedra y madera, plaza del mercado con campanario medieval y subida a Sainte-Odile.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale de Munster - Vallée de Munster",
        "poblacion": "Munster", "provincia": "Haut-Rhin", "comunidad_autonoma": "Gran Este", "pais": "Francia",
        "latitud": 48.0415, "longitud": 7.1354, "tipo_lugar": "area_autocaravanas", "precio": 9.5, "es_gratuito": False,
        "descripcion": "Cuna del famoso queso aromático de Munster. Rutas senderistas por granjas-albergue vosguianas (Fermes-Auberges) con platos campesinos.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Camping-Car Turckheim - Porte de France",
        "poblacion": "Turckheim", "provincia": "Haut-Rhin", "comunidad_autonoma": "Gran Este", "pais": "Francia",
        "latitud": 48.0875, "longitud": 7.2798, "tipo_lugar": "area_autocaravanas", "precio": 10.5, "es_gratuito": False,
        "descripcion": "Pueblo vinícola donde aún sale cada noche el sereno tradicional con alabarda y linterna cantando en alsaciano. Estacionamiento tranquilo junto a la estación.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire du Château du Haut-Kœnigsbourg",
        "poblacion": "Orschwiller", "provincia": "Bas-Rhin", "comunidad_autonoma": "Gran Este", "pais": "Francia",
        "latitud": 48.2498, "longitud": 7.3456, "tipo_lugar": "parking_urbano", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Aparcamiento en la ladera del impresionante castillo fortaleza de Haut-Kœnigsbourg a 757 m de altura sobre la llanura del Rin. Muy concurrido de día, pacífico de noche.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Camping-Car Park La Bresse - Hohneck",
        "poblacion": "La Bresse", "provincia": "Vosges", "comunidad_autonoma": "Gran Este", "pais": "Francia",
        "latitud": 48.0062, "longitud": 6.8795, "tipo_lugar": "area_autocaravanas", "precio": 13.0, "es_gratuito": False,
        "descripcion": "Excelente área abierta todo el año con bornas eléctricas reforzadas para invierno. Rodeada de lagos de montaña (Lac des Corbeaux, Lac de Blanchemer).",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },

    # ================= DORDOÑA Y VALLE DEL LOT (12) =================
    {
        "nombre": "Aire Camping-Car Rocamadour - Cité Religieuse",
        "poblacion": "Rocamadour", "provincia": "Lot", "comunidad_autonoma": "Occitania", "pais": "Francia",
        "latitud": 44.7995, "longitud": 1.6184, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "En la parte alta junto al castillo de Rocamadour. Vistas verticales a los santuarios de la Virgen Negra y casas colgadas sobre el cañón del río Alzou.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale Sarlat-la-Canéda - Cité Médiévale",
        "poblacion": "Sarlat-la-Canéda", "provincia": "Dordogne", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 44.8912, "longitud": 1.2184, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "A 10 minutos a pie del conjunto urbano medieval y renacentista más denso de Europa. Famoso mercado de trufas negras, foie gras y nueces del Périgord.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire de Beynac-et-Cazenac - Bords de Dordogne",
        "poblacion": "Beynac-et-Cazenac", "provincia": "Dordogne", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 44.8415, "longitud": 1.1456, "tipo_lugar": "area_autocaravanas", "precio": 11.0, "es_gratuito": False,
        "descripcion": "Al pie del acantilado coronado por el castillo de Beynac. Alquiler de canoas en el río Dordoña y paseos en gabarras tradicionales de madera.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire La Roque-Gageac - Village Troglodytique",
        "poblacion": "La Roque-Gageac", "provincia": "Dordogne", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 44.8256, "longitud": 1.1823, "tipo_lugar": "area_autocaravanas", "precio": 11.5, "es_gratuito": False,
        "descripcion": "Pueblo empotrado en un acantilado de piedra caliza con microclima cálido que acoge un jardín exótico de plataneros, palmeras y bambús.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Saint-Cirq-Lapopie - Bords du Lot",
        "poblacion": "Saint-Cirq-Lapopie", "provincia": "Lot", "comunidad_autonoma": "Occitania", "pais": "Francia",
        "latitud": 44.4712, "longitud": 1.6784, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "Colgado a 100 metros sobre los meandros del río Lot. Calles empedradas medievales que enamoraron al poeta surrealista André Breton.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Castelnaud-la-Chapelle - Musée de la Guerre",
        "poblacion": "Castelnaud-la-Chapelle", "provincia": "Dordogne", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 44.8054, "longitud": 1.1498, "tipo_lugar": "area_autocaravanas", "precio": 9.0, "es_gratuito": False,
        "descripcion": "Frente al castillo medieval de Castelnaud con sus catapultas y trabucos a escala real con vistas al meandro del río Céou.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale Domme - Bastide Royale",
        "poblacion": "Domme", "provincia": "Dordogne", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 44.8015, "longitud": 1.2164, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Bastida fortificada sobre el 'balcón de la Dordoña'. Grutas subterráneas prehistóricas bajo la plaza mayor y vistas espectaculares al valle fluvial.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Brantôme - La Venise du Périgord",
        "poblacion": "Brantôme en Périgord", "provincia": "Dordogne", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 45.3612, "longitud": 0.6512, "tipo_lugar": "area_autocaravanas", "precio": 10.5, "es_gratuito": False,
        "descripcion": "En una isla rodeada por el río Dronne, al pie de la abadía benedictina troglodita fundada por Carlomagno con el campanario más antiguo de Francia.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Gouffre de Padirac - Sous la Terre",
        "poblacion": "Padirac", "provincia": "Lot", "comunidad_autonoma": "Occitania", "pais": "Francia",
        "latitud": 44.8584, "longitud": 1.7512, "tipo_lugar": "area_autocaravanas", "precio": 9.0, "es_gratuito": False,
        "descripcion": "Junto a la famosa sima natural de 103 m de profundidad que da paso a una navegación subterránea en barca por el río negro a 100 metros bajo tierra.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Collonges-la-Rouge - Pierres Rouges",
        "poblacion": "Collonges-la-Rouge", "provincia": "Corrèze", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 45.0615, "longitud": 1.6542, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Cuna de la asociación de 'Pueblos más bellos de Francia'. Construido enteramente en arenisca roja brillante, con torrecillas de cuento y tejados de pizarra.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Camping-Car Cahors - Pont Valentré",
        "poblacion": "Cahors", "provincia": "Lot", "comunidad_autonoma": "Occitania", "pais": "Francia",
        "latitud": 44.4456, "longitud": 1.4315, "tipo_lugar": "area_autocaravanas", "precio": 11.0, "es_gratuito": False,
        "descripcion": "Vistas directas al icónico Puente Valentré, joya militar medieval del siglo XIV con tres torres fortificadas sobre el río Lot. Vino tinto Malbec de Cahors.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire de Montignac - Lascaux IV",
        "poblacion": "Montignac", "provincia": "Dordogne", "comunidad_autonoma": "Nueva Aquitania", "pais": "Francia",
        "latitud": 45.0654, "longitud": 1.1685, "tipo_lugar": "area_autocaravanas", "precio": 10.5, "es_gratuito": False,
        "descripcion": "A 1 km del Centro Internacional de Arte Rupestre Lascaux IV, la 'Capilla Sixtina de la Prehistoria'. Orilla del río Vézère con zonas sombreadas.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },

    # ================= MACIZO CENTRAL Y AUVERNIA (10) =================
    {
        "nombre": "Aire Camping-Car Puy de Dôme - Panoramique des Dômes",
        "poblacion": "Orcines", "provincia": "Puy-de-Dôme", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 45.7723, "longitud": 2.9865, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Al pie del tren cremallera que corona el volcán Puy de Dôme (1.465m). Panorama 360 sobre los 80 volcanes dormidos de la Chaîne des Puys UNESCO.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale Le Mont-Dore - Sancy",
        "poblacion": "Le Mont-Dore", "provincia": "Puy-de-Dôme", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 45.5712, "longitud": 2.8124, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "A los pies del pico más alto del Macizo Central, el Puy de Sancy (1.886 m). Manantiales termales, cascadas de montaña y teleférico.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale Salers - Pays de Cantal",
        "poblacion": "Salers", "provincia": "Cantal", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 45.1385, "longitud": 2.4956, "tipo_lugar": "area_autocaravanas", "precio": 9.0, "es_gratuito": False,
        "descripcion": "Construido en piedra volcánica negra de lava basáltica con tejados de lajas de pizarra (lauzes). Tierra de la emblemática vaca de Salers y quesos Cantal.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire du Lac Chambon - Murol",
        "poblacion": "Murol", "provincia": "Puy-de-Dôme", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 45.5784, "longitud": 2.9356, "tipo_lugar": "camping", "precio": 15.0, "es_gratuito": False,
        "descripcion": "Junto al lago de origen volcánico de Chambon y frente al castillo medieval de Murol. Playas de arena, baño vigilado en verano y sendero botánico.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Besse-et-Saint-Anastaise - Lac Pavin",
        "poblacion": "Besse-et-Saint-Anastaise", "provincia": "Puy-de-Dôme", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 45.5115, "longitud": 2.9325, "tipo_lugar": "area_autocaravanas", "precio": 10.5, "es_gratuito": False,
        "descripcion": "Pueblo renacentista montañés a 3 km del misterioso cráter circular del lago Pavin (92 metros de profundidad de aguas azul oscuro).",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Libre Pas de Peyrol - Puy Mary",
        "poblacion": "Le Claux", "provincia": "Cantal", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 45.1156, "longitud": 2.7095, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "En el paso de carretera más alto del Macizo Central (1.589 m), bajo la pirámide volcánica del Puy Mary (Grand Site de France). Vistas sobrecogedoras.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Saint-Nectaire - Église Romane",
        "poblacion": "Saint-Nectaire", "provincia": "Puy-de-Dôme", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 45.5895, "longitud": 2.9924, "tipo_lugar": "area_autocaravanas", "precio": 9.0, "es_gratuito": False,
        "descripcion": "Bajo la iglesia románica auvernesa del siglo XII encaramada en la roca. Célebre por el queso Saint-Nectaire madurado en bodegas de toba volcánica.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Chaudes-Aigues - Source du Par",
        "poblacion": "Chaudes-Aigues", "provincia": "Cantal", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 44.8542, "longitud": 3.0045, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "La estación termal con el agua natural más caliente de Europa (82 °C en la fuente du Par). Pueblo encajado entre colinas verdes del Aubrac.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Vulcania - Parc des Volcans d'Auvergne",
        "poblacion": "Saint-Ours", "provincia": "Puy-de-Dôme", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 45.8132, "longitud": 2.9412, "tipo_lugar": "area_autocaravanas", "precio": 11.0, "es_gratuito": False,
        "descripcion": "Área espaciosa dentro del Parque Natural Regional de los Volcanes de Auvernia, ideal para familias que visitan el centro de vulcanología Vulcania.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Viaduc de Garabit - Gustave Eiffel",
        "poblacion": "Ruynes-en-Margeride", "provincia": "Cantal", "comunidad_autonoma": "Auvernia-Ródano-Alpes", "pais": "Francia",
        "latitud": 44.9754, "longitud": 3.1785, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Aparcamiento ribereño sobre las gargantas del río Truyère con vista monumental al viaducto de hierro rojo construido por Gustave Eiffel en 1884.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },

    # ================= BORGONYA Y FRANCO CONDADO (12) =================
    {
        "nombre": "Aire Beaune - Hospices de Beaune",
        "poblacion": "Beaune", "provincia": "Côte-d'Or", "comunidad_autonoma": "Borgoña-Franco Condado", "pais": "Francia",
        "latitud": 47.0215, "longitud": 4.8395, "tipo_lugar": "area_autocaravanas", "precio": 12.5, "es_gratuito": False,
        "descripcion": "Capital vitivinícola de Borgoña. A 10 minutos a pie del célebre Hôtel-Dieu del siglo XV con tejados de tejas policromadas esmaltadas.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Vézelay - Basilique Sainte-Madeleine",
        "poblacion": "Vézelay", "provincia": "Yonne", "comunidad_autonoma": "Borgoña-Franco Condado", "pais": "Francia",
        "latitud": 47.4612, "longitud": 3.7485, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "En la colina inspirada de Vézelay, punto de partida histórico del Camino de Santiago y joya de la basílica románica de María Magdalena UNESCO.",
        "tiene_agua": True, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Camping-Car Dijon - Lac Kir",
        "poblacion": "Dijon", "provincia": "Côte-d'Or", "comunidad_autonoma": "Borgoña-Franco Condado", "pais": "Francia",
        "latitud": 47.3245, "longitud": 5.0084, "tipo_lugar": "area_autocaravanas", "precio": 13.0, "es_gratuito": False,
        "descripcion": "A orillas del lago Kir, con carril bici directo a la capital de los Duques de Borgoña, el Palacio de los Estados y la fábrica de mostaza.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Municipale Cluny - Abbaye Millénaire",
        "poblacion": "Cluny", "provincia": "Saône-et-Loire", "comunidad_autonoma": "Borgoña-Franco Condado", "pais": "Francia",
        "latitud": 46.4356, "longitud": 4.6584, "tipo_lugar": "area_autocaravanas", "precio": 10.5, "es_gratuito": False,
        "descripcion": "Junto al centro ecuestre nacional y las ruinas de la mayor basílica monástica de la cristiandad medieval hasta la construcción de San Pedro en Roma.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Chalon-sur-Saône - Bords de Saône",
        "poblacion": "Chalon-sur-Saône", "provincia": "Saône-et-Loire", "comunidad_autonoma": "Borgoña-Franco Condado", "pais": "Francia",
        "latitud": 46.7812, "longitud": 4.8584, "tipo_lugar": "area_autocaravanas", "precio": 9.5, "es_gratuito": False,
        "descripcion": "Cuna de la fotografía (Nicéphore Niépce). Área a orillas del río Saona con paseos fluviales y restaurantes de cocina borgoñona.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Camping-Car Park Besançon - Citadelle",
        "poblacion": "Besançon", "provincia": "Doubs", "comunidad_autonoma": "Borgoña-Franco Condado", "pais": "Francia",
        "latitud": 47.2345, "longitud": 6.0284, "tipo_lugar": "area_autocaravanas", "precio": 12.0, "es_gratuito": False,
        "descripcion": "En la curva del río Doubs dominada por la imponente ciudadela de Vauban. Ciudad de relojeros y casas de piedra caliza azulada y ocre.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire du Lac de Saint-Point - Malbuisson",
        "poblacion": "Malbuisson", "provincia": "Doubs", "comunidad_autonoma": "Borgoña-Franco Condado", "pais": "Francia",
        "latitud": 46.8012, "longitud": 6.3095, "tipo_lugar": "area_autocaravanas", "precio": 11.5, "es_gratuito": False,
        "descripcion": "En el tercer lago natural más grande de Francia en las montañas del Jura. Queserías artesanales de Comté y destilerías de ajenjo (absenta).",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Pernocta Cascade du Hérisson - Jura",
        "poblacion": "Menétrux-en-Joux", "provincia": "Jura", "comunidad_autonoma": "Borgoña-Franco Condado", "pais": "Francia",
        "latitud": 46.6025, "longitud": 5.8612, "tipo_lugar": "pernocta_libre", "precio": 0.0, "es_gratuito": True,
        "descripcion": "Entorno agreste junto a una serie de 31 cascadas y saltos de agua naturales en un cañón boscoso. Espectáculo natural de hayas y agua.",
        "tiene_agua": False, "tiene_electricidad": False, "tiene_vaciado_aguas_grises": False, "tiene_vaciado_aguas_negras": False, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": False
    },
    {
        "nombre": "Aire Municipale de Salins-les-Bains - Grande Saline",
        "poblacion": "Salins-les-Bains", "provincia": "Jura", "comunidad_autonoma": "Borgoña-Franco Condado", "pais": "Francia",
        "latitud": 46.9385, "longitud": 5.8756, "tipo_lugar": "area_autocaravanas", "precio": 9.0, "es_gratuito": False,
        "descripcion": "Pueblo termal con las históricas salinas reales subterráneas UNESCO. Galerías medievales de extracción de salmuera intactas.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Camping-Car Semur-en-Auxois",
        "poblacion": "Semur-en-Auxois", "provincia": "Côte-d'Or", "comunidad_autonoma": "Borgoña-Franco Condado", "pais": "Francia",
        "latitud": 47.4912, "longitud": 4.3312, "tipo_lugar": "area_autocaravanas", "precio": 10.0, "es_gratuito": False,
        "descripcion": "Ciudadela medieval sobre un peñón de granito rosa en el bucle del río Armançon, protegida por cuatro imponentes torres cilíndricas.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire du Port d'Auxerre - Canal du Nivernais",
        "poblacion": "Auxerre", "provincia": "Yonne", "comunidad_autonoma": "Borgoña-Franco Condado", "pais": "Francia",
        "latitud": 47.7945, "longitud": 3.5784, "tipo_lugar": "area_autocaravanas", "precio": 11.0, "es_gratuito": False,
        "descripcion": "Junto al río Yonne y la abadía de Saint-Germain con criptas carolingias del siglo IX. Inicio del bucólico Canal de Nivernais.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": False, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    },
    {
        "nombre": "Aire Camping-Car Ornans - Vallée de la Loue",
        "poblacion": "Ornans", "provincia": "Doubs", "comunidad_autonoma": "Borgoña-Franco Condado", "pais": "Francia",
        "latitud": 47.1056, "longitud": 6.1423, "tipo_lugar": "area_autocaravanas", "precio": 10.5, "es_gratuito": False,
        "descripcion": "La 'Pequeña Venecia del Franco Condado', con casas construidas sobre pilares sobre el río Loue. Cuna del pintor realista Gustave Courbet.",
        "tiene_agua": True, "tiene_electricidad": True, "tiene_vaciado_aguas_grises": True, "tiene_vaciado_aguas_negras": True, "playa_cercana": True, "tiene_senderismo": True, "admite_mascotas": True, "permite_sacar_toldo": True
    }
]

def poblar():
    admin = Explorador.objects.filter(is_superuser=True).first() or Explorador.objects.first()
    print(f"Usando explorador creador: {admin.username if admin else 'None'}")
    
    creados = 0
    actualizados = 0

    for datos in LUGARES_FRANCIA:
        lugar, creado = Lugar.objects.update_or_create(
            nombre=datos["nombre"],
            defaults={
                "creador": admin,
                "poblacion": datos["poblacion"],
                "provincia": datos["provincia"],
                "comunidad_autonoma": datos["comunidad_autonoma"],
                "pais": datos["pais"],
                "latitud": datos["latitud"],
                "longitud": datos["longitud"],
                "tipo_lugar": datos["tipo_lugar"],
                "precio": datos["precio"],
                "es_gratuito": datos["es_gratuito"],
                "descripcion": datos["descripcion"],
                "tiene_agua": datos.get("tiene_agua", False),
                "tiene_electricidad": datos.get("tiene_electricidad", False),
                "tiene_vaciado_aguas_grises": datos.get("tiene_vaciado_aguas_grises", False),
                "tiene_vaciado_aguas_negras": datos.get("tiene_vaciado_aguas_negras", False),
                "playa_cercana": datos.get("playa_cercana", False),
                "tiene_senderismo": datos.get("tiene_senderismo", False),
                "admite_mascotas": datos.get("admite_mascotas", True),
                "permite_sacar_toldo": datos.get("permite_sacar_toldo", False),
            }
        )
        if creado:
            creados += 1
        else:
            actualizados += 1

    total_francia = Lugar.objects.filter(pais="Francia").count()
    total_lugares = Lugar.objects.count()
    print(f"Proceso finalizado con exito:")
    print(f"  - Lugares nuevos creados: {creados}")
    print(f"  - Lugares actualizados: {actualizados}")
    print(f"  - Total lugares en Francia: {total_francia}")
    print(f"  - Total lugares en Camplink: {total_lugares}")

if __name__ == '__main__':
    poblar()
