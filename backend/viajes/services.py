# Aquí implemento los servicios de lógica de negocio para Camplink:
# cálculo de rutas y distancias, agrupación inteligente de viajes y catálogo definitivo de trofeos agrupados en 16 categorías temáticas.

import math
import os
import requests
from datetime import timedelta
from django.utils import timezone
from django.db.models import Q
from .models import Viaje, Trofeo, TrofeoExplorador
from lugares.models import Lugar
from diario.models import Publicacion, CheckIn
from comunidad.models import TemaTaller, RespuestaTaller
from exploradores.models import RelacionSeguimiento

def calcular_distancia_haversine(lat1, lon1, lat2, lon2):
    radio_tierra_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radio_tierra_km * c


def calcular_distancia_carretera(coordenadas):
    if len(coordenadas) < 2:
        return 0.0

    google_key = os.environ.get('GOOGLE_MAPS_API_KEY')
    if google_key:
        try:
            origen = f"{coordenadas[0][0]},{coordenadas[0][1]}"
            destino = f"{coordenadas[-1][0]},{coordenadas[-1][1]}"
            waypoints = '|'.join([f"{p[0]},{p[1]}" for p in coordenadas[1:-1]])
            url = f"https://maps.googleapis.com/maps/api/directions/json?origin={origen}&destination={destino}&waypoints={waypoints}&key={google_key}"
            res = requests.get(url, timeout=3)
            if res.status_code == 200:
                data = res.json()
                if data.get('routes'):
                    total_metros = sum(leg['distance']['value'] for leg in data['routes'][0]['legs'])
                    return round(total_metros / 1000.0, 1)
        except Exception:
            pass

    try:
        coords_str = ';'.join([f"{p[1]},{p[0]}" for p in coordenadas])
        osrm_url = f"https://router.project-osrm.org/route/v1/driving/{coords_str}?overview=false"
        res = requests.get(osrm_url, timeout=3)
        if res.status_code == 200:
            data = res.json()
            if data.get('routes'):
                total_metros = data['routes'][0]['distance']
                return round(total_metros / 1000.0, 1)
    except Exception:
        pass

    total_km = 0.0
    for i in range(len(coordenadas) - 1):
        p1 = coordenadas[i]
        p2 = coordenadas[i + 1]
        dist_directa = calcular_distancia_haversine(p1[0], p1[1], p2[0], p2[1])
        total_km += dist_directa * 1.25

    return round(total_km, 1)


def _extraer_detalles_lugar(lug):
    if not lug:
        return {'equipamiento': [], 'entorno': [], 'acceso': [], 'tipo_lugar': 'pernocta_libre'}
    equip = []
    if getattr(lug, 'tiene_agua', False): equip.append('Agua potable')
    if getattr(lug, 'tiene_electricidad', False): equip.append('Electricidad')
    if getattr(lug, 'tiene_vaciado_aguas_grises', False): equip.append('Vaciado aguas grises')
    if getattr(lug, 'tiene_vaciado_aguas_negras', False): equip.append('Vaciado aguas negras (WC)')
    if getattr(lug, 'tiene_duchas', False): equip.append('Duchas')
    if getattr(lug, 'tiene_lavabo', False): equip.append('Lavabos')
    if getattr(lug, 'tiene_wifi', False): equip.append('Wi-Fi')
    if getattr(lug, 'tiene_basuras', False): equip.append('Basuras')

    ent = []
    if getattr(lug, 'admite_mascotas', False): ent.append('Admite mascotas')
    if getattr(lug, 'tiene_senderismo', False): ent.append('Senderismo')
    if getattr(lug, 'playa_cercana', False): ent.append('Playa cercana')
    if getattr(lug, 'rutas_en_bici', False): ent.append('Rutas en bici')
    if getattr(lug, 'ideal_familias', False): ent.append('Ideal familias')

    acc = []
    if getattr(lug, 'acceso_asfaltado', False): acc.append('Acceso asfaltado')
    if getattr(lug, 'terreno_nivelado', False): acc.append('Terreno nivelado')
    if getattr(lug, 'apto_grandes_autocaravanas', False): acc.append('Apto autocaravanas >7m')
    if getattr(lug, 'permite_sacar_toldo', False): acc.append('Permite toldo/mesas')
    if getattr(lug, 'mucha_sombra', False): acc.append('Mucha sombra')
    if getattr(lug, 'muy_soleado', False): acc.append('Muy soleado')

    return {
        'equipamiento': equip,
        'entorno': ent,
        'acceso': acc,
        'tipo_lugar': getattr(lug, 'tipo_lugar', 'pernocta_libre')
    }

def recalcular_viaje(viaje):
    # Aquí calculo la ruta integral con salida desde el lugar base y vuelta al mismo para el kilometraje total
    checkins = viaje.checkins_asociados.all().order_by('fecha_llegada')
    if not checkins.exists() and not viaje.resumen_ruta:
        return

    puntos_ruta = []
    explorador = viaje.explorador
    lugar_base_nombre = explorador.poblacion or explorador.direccion_base or "Lugar Base"
    lat_base = explorador.lat_base
    lng_base = explorador.lng_base

    if (lat_base is None or lng_base is None) and explorador.poblacion:
        from lugares.models import Lugar
        lug_pob = Lugar.objects.filter(poblacion__iexact=explorador.poblacion, latitud__isnull=False).first()
        if lug_pob:
            lat_base = float(lug_pob.latitud)
            lng_base = float(lug_pob.longitud)

    comunidades = set()
    paises = set()
    puntos_intermedios = []

    # Si ya tiene un resumen_ruta personalizado (con gasolineras reordenadas), conservamos las etapas intermedias
    if viaje.resumen_ruta:
        ids_presentes = set()
        for p in viaje.resumen_ruta:
            if p.get('tipo') not in ['base', 'base_salida', 'base_vuelta']:
                puntos_intermedios.append(p)
                if p.get('provincia'):
                    comunidades.add(p.get('provincia'))
                if p.get('id'):
                    ids_presentes.add(p.get('id'))
                if p.get('checkin_id'):
                    ids_presentes.add(p.get('checkin_id'))
        # Incorporar checkins que aún no estén en la ruta guardada
        for ch in checkins:
            if ch.id not in ids_presentes:
                lug = ch.lugar
                det = _extraer_detalles_lugar(lug)
                puntos_intermedios.append({
                    'nombre': lug.nombre if lug else 'Parada',
                    'lat': float(lug.latitud) if (lug and lug.latitud is not None) else None,
                    'lng': float(lug.longitud) if (lug and lug.longitud is not None) else None,
                    'poblacion': lug.poblacion if lug else '',
                    'provincia': lug.provincia if lug else '',
                    'fecha': ch.fecha_llegada.strftime('%Y-%m-%d') if ch.fecha_llegada else '',
                    'dias': ch.dias_previstos,
                    'tipo': 'parada',
                    'tipo_lugar': det['tipo_lugar'],
                    'equipamiento': det['equipamiento'],
                    'entorno': det['entorno'],
                    'acceso': det['acceso'],
                    'lugar_id': lug.id if lug else None,
                    'id': ch.id,
                    'checkin_id': ch.id,
                    'notas_privadas': ch.notas_privadas or '',
                    'es_repostaje': False,
                    'es_base': False
                })
                if lug and lug.comunidad_autonoma:
                    comunidades.add(lug.comunidad_autonoma)
                if lug and lug.pais:
                    paises.add(lug.pais)
    else:
        for ch in checkins:
            lug = ch.lugar
            det = _extraer_detalles_lugar(lug)
            puntos_intermedios.append({
                'nombre': lug.nombre if lug else 'Parada',
                'lat': float(lug.latitud) if (lug and lug.latitud is not None) else None,
                'lng': float(lug.longitud) if (lug and lug.longitud is not None) else None,
                'poblacion': lug.poblacion if lug else '',
                'provincia': lug.provincia if lug else '',
                'fecha': ch.fecha_llegada.strftime('%Y-%m-%d') if ch.fecha_llegada else '',
                'dias': ch.dias_previstos,
                'tipo': 'parada',
                'tipo_lugar': det['tipo_lugar'],
                'equipamiento': det['equipamiento'],
                'entorno': det['entorno'],
                'acceso': det['acceso'],
                'lugar_id': lug.id if lug else None,
                'id': ch.id,
                'checkin_id': ch.id,
                'notas_privadas': ch.notas_privadas or '',
                'es_repostaje': False,
                'es_base': False
            })
            if lug and lug.comunidad_autonoma:
                comunidades.add(lug.comunidad_autonoma)
            if lug and lug.pais:
                paises.add(lug.pais)

    # Ordenar las paradas intermedias respetando estrictamente el orden cronológico de fechas
    puntos_intermedios.sort(key=lambda x: str(x.get('fecha') or x.get('fecha_llegada') or '9999-99-99'))

    puntos_ruta = []
    if lat_base and lng_base:
        puntos_ruta.append({
            'nombre': f'Salida: {lugar_base_nombre}',
            'lat': lat_base,
            'lng': lng_base,
            'tipo': 'base_salida',
            'es_base': True
        })

    puntos_ruta.extend(puntos_intermedios)

    # Añadimos el retorno final a la base camper para cerrar la ruta y contabilizar la vuelta
    if lat_base and lng_base and len(puntos_intermedios) > 0:
        puntos_ruta.append({
            'nombre': f'Vuelta: {lugar_base_nombre}',
            'lat': lat_base,
            'lng': lng_base,
            'tipo': 'base_vuelta',
            'es_base': True
        })

    coords = [(p['lat'], p['lng']) for p in puntos_ruta if 'lat' in p and 'lng' in p]
    km_totales = calcular_distancia_carretera(coords)

    if checkins.exists():
        primera_fecha = checkins.first().fecha_llegada.date()
        ultimo_checkin = checkins.last()
        ultima_fecha = ultimo_checkin.fecha_llegada.date() + timedelta(days=ultimo_checkin.dias_previstos)
        viaje.fecha_inicio = primera_fecha
        viaje.fecha_fin = ultima_fecha

    viaje.km_totales = km_totales
    viaje.comunidades_visitadas = list(comunidades)
    viaje.paises_visitados = list(paises)
    viaje.resumen_ruta = puntos_ruta
    viaje.save()


# DEFINICIÓN OFICIAL DE LAS 16 CATEGORÍAS TEMÁTICAS
# Cada categoría tiene 4 niveles secuenciales: Madera, Bronce, Plata y Oro
CATEGORIAS_TROFEOS = [
    {
        'codigo': 'tragamillas',
        'nombre': 'El Tragamillas',
        'descripcion': 'Kilómetros totales recorridos',
        'icono': 'truck',
        'unidad': 'km',
        'umbrales': [('madera', 100), ('bronce', 1000), ('plata', 5000), ('oro', 20000)]
    },
    {
        'codigo': 'nomada_nocturno',
        'nombre': 'Nómada Nocturno',
        'descripcion': 'Noches de pernocta registradas',
        'icono': 'moon',
        'unidad': 'noches',
        'umbrales': [('madera', 1), ('bronce', 10), ('plata', 30), ('oro', 100)]
    },
    {
        'codigo': 'cartografo_nomada',
        'nombre': 'Cartógrafo Nómada',
        'descripcion': 'Nuevos Lugares aportados a la comunidad',
        'icono': 'map-pin',
        'unidad': 'lugares',
        'umbrales': [('madera', 1), ('bronce', 5), ('plata', 20), ('oro', 50)]
    },
    {
        'codigo': 'ojo_halcon',
        'nombre': 'Ojo de Halcón',
        'descripcion': 'Fotografías subidas a Lugares o Diario',
        'icono': 'camera',
        'unidad': 'fotos',
        'umbrales': [('madera', 1), ('bronce', 20), ('plata', 100), ('oro', 300)]
    },
    {
        'codigo': 'el_critico',
        'nombre': 'El Crítico',
        'descripcion': 'Valoraciones y reseñas camper publicadas',
        'icono': 'star',
        'unidad': 'reseñas',
        'umbrales': [('madera', 1), ('bronce', 10), ('plata', 50), ('oro', 150)]
    },
    {
        'codigo': 'trotamundos',
        'nombre': 'Trotamundos',
        'descripcion': 'Países diferentes visitados',
        'icono': 'globe',
        'unidad': 'países',
        'umbrales': [('madera', 1), ('bronce', 2), ('plata', 4), ('oro', 7)]
    },
    {
        'codigo': 'conquistador',
        'nombre': 'Conquistador',
        'descripcion': 'Comunidades Autónomas visitadas',
        'icono': 'map',
        'unidad': 'CC.AA.',
        'umbrales': [('madera', 2), ('bronce', 5), ('plata', 10), ('oro', 15)]
    },
    {
        'codigo': 'autosuficiencia',
        'nombre': 'Autosuficiencia',
        'descripcion': 'Pernoctas en lugares libres / sin servicios',
        'icono': 'battery-charging',
        'unidad': 'noches',
        'umbrales': [('madera', 1), ('bronce', 10), ('plata', 30), ('oro', 100)]
    },
    {
        'codigo': 'resistencia_nomada',
        'nombre': 'Resistencia Nómada',
        'descripcion': 'Días consecutivos en un mismo viaje',
        'icono': 'shield',
        'unidad': 'días',
        'umbrales': [('madera', 2), ('bronce', 3), ('plata', 7), ('oro', 15)]
    },
    {
        'codigo': 'ruta_familiar',
        'nombre': 'Ruta Familiar',
        'descripcion': 'Pernoctas en lugares con ocio/aptos niños',
        'icono': 'users',
        'unidad': 'lugares',
        'umbrales': [('madera', 1), ('bronce', 3), ('plata', 8), ('oro', 20)]
    },
    {
        'codigo': 'explorador_activo',
        'nombre': 'Explorador Activo',
        'descripcion': 'Actividades registradas: senderos, playas, etc.',
        'icono': 'compass',
        'unidad': 'actividades',
        'umbrales': [('madera', 1), ('bronce', 5), ('plata', 15), ('oro', 30)]
    },
    {
        'codigo': 'maker_nomada',
        'nombre': 'Maker Nómada',
        'descripcion': 'Archivos 3D .stl o bricos aportados al taller',
        'icono': 'tool',
        'unidad': 'aportes',
        'umbrales': [('madera', 1), ('bronce', 3), ('plata', 8), ('oro', 20)]
    },
    {
        'codigo': 'mecanico_pista',
        'nombre': 'Mecánico de Pista',
        'descripcion': 'Soluciones y respuestas en el Taller Nómada',
        'icono': 'wrench',
        'unidad': 'respuestas',
        'umbrales': [('madera', 1), ('bronce', 5), ('plata', 20), ('oro', 50)]
    },
    {
        'codigo': 'pluma_bitacora',
        'nombre': 'Pluma de Bitácora',
        'descripcion': 'Publicaciones en el Diario de Ruta',
        'icono': 'file-text',
        'unidad': 'posts',
        'umbrales': [('madera', 1), ('bronce', 10), ('plata', 30), ('oro', 100)]
    },
    {
        'codigo': 'espiritu_comunidad',
        'nombre': 'Espíritu de Comunidad',
        'descripcion': 'Conexiones / amigos aceptados',
        'icono': 'user-check',
        'unidad': 'conexiones',
        'umbrales': [('madera', 1), ('bronce', 10), ('plata', 50), ('oro', 150)]
    },
    {
        'codigo': 'planificador_nomada',
        'nombre': 'Planificador Nómada',
        'descripcion': 'Lugares guardados en favoritos o exportados',
        'icono': 'calendar',
        'unidad': 'planificaciones',
        'umbrales': [('madera', 1), ('bronce', 5), ('plata', 15), ('oro', 30)]
    }
]


def inicializar_catalogo_trofeos():
    # Optimización de alto rendimiento: Si el catálogo ya existe en la base de datos, no repetir 65 queries
    if Trofeo.objects.count() >= 65:
        return
    # Aquí creo o actualizo el catálogo formal de 64 trofeos (16 categorías x 4 niveles) + Platino supremo
    for cat in CATEGORIAS_TROFEOS:
        for nivel, umbral in cat['umbrales']:
            codigo = f"{cat['codigo']}_{nivel}"
            nombre = f"{cat['nombre']} ({nivel.capitalize()})"
            desc = f"{cat['descripcion']}: {umbral} {cat['unidad']}."
            Trofeo.objects.update_or_create(
                codigo=codigo,
                defaults={
                    'nombre': nombre,
                    'descripcion': desc,
                    'nivel': nivel,
                    'icono': cat['icono'],
                    'categoria': cat['codigo'],
                    'categoria_nombre': cat['nombre'],
                    'unidad': cat['unidad'],
                    'requisito_tipo': cat['codigo'],
                    'requisito_cantidad': umbral
                }
            )

    # Trofeo Platino Supremo (se desbloquea exclusivamente con 16 medallas de Oro)
    Trofeo.objects.update_or_create(
        codigo='platino_nomada',
        defaults={
            'nombre': 'Leyenda Suprema Nómada',
            'descripcion': 'Consigue las 16 medallas de Oro de Camplink.',
            'nivel': 'platino',
            'icono': 'crown',
            'categoria': 'platino',
            'categoria_nombre': 'Leyenda Suprema Nómada',
            'unidad': 'medallas de oro',
            'requisito_tipo': 'platino',
            'requisito_cantidad': 16
        }
    )


def calcular_metricas_usuario(explorador):
    # Aquí compilo en tiempo real los valores numéricos actuales de las 16 categorías
    viajes = list(explorador.viajes.all())
    checkins = list(explorador.checkins.select_related('lugar').all())
    posts = list(explorador.publicaciones.all())

    # 1. Tragamillas: km totales
    km_totales = sum(v.km_totales for v in viajes)

    # 2. Nómada Nocturno: noches de pernocta
    total_noches = sum(c.dias_previstos for c in checkins) if checkins else 0

    # 3. Cartógrafo: lugares aportados
    lugares_creados = Lugar.objects.filter(creador=explorador).count()

    # 4. Ojo de Halcón: fotos en checkins + fotos en publicaciones
    fotos_checkins = sum(1 for c in checkins if bool(c.foto))
    fotos_posts = sum(1 for p in posts if bool(p.imagen))
    total_fotos = fotos_checkins + fotos_posts

    # 5. El Crítico: reseñas con comentario o puntuación
    total_resenas = sum(1 for c in checkins if bool(c.comentario_publico) or c.valoracion_camper > 0)

    # 6. Trotamundos: países diferentes visitados
    paises = set()
    for v in viajes:
        for p in v.paises_visitados:
            paises.add(p)
    for c in checkins:
        if c.lugar and c.lugar.pais:
            paises.add(c.lugar.pais)
    total_paises = len(paises)

    # 7. Conquistador: Comunidades Autónomas visitadas
    comunidades = set()
    for v in viajes:
        for com in v.comunidades_visitadas:
            comunidades.add(com)
    for c in checkins:
        if c.lugar and c.lugar.comunidad_autonoma:
            comunidades.add(c.lugar.comunidad_autonoma)
    total_comunidades = len(comunidades)

    # 8. Autosuficiencia: pernoctas libres o sin servicios
    noches_libres = sum(c.dias_previstos for c in checkins if c.lugar and (c.lugar.es_gratuito or not c.lugar.permite_sacar_toldo))

    # 9. Resistencia Nómada: días consecutivos en un mismo viaje
    max_dias_viaje = max([v.duracion_dias for v in viajes] or [0])

    # 10. Ruta Familiar: pernoctas en lugares aptos niños u ocio
    lugares_familiares = sum(1 for c in checkins if c.lugar and (c.lugar.ideal_ninos_10_anos or c.lugar.es_zona_recreativa))

    # 11. Explorador Activo: actividades registradas o check-ins con rutas
    actividades = sum(1 for c in checkins if c.lugar and bool(c.lugar.descripcion and ('sendero' in c.lugar.descripcion.lower() or 'playa' in c.lugar.descripcion.lower() or 'ruta' in c.lugar.descripcion.lower())))
    if actividades == 0 and checkins:
        actividades = len(checkins)

    # 12. Maker Nómada: temas bricos / archivos .stl
    maker_aportes = TemaTaller.objects.filter(autor=explorador).count()

    # 13. Mecánico de Pista: respuestas en el taller
    taller_respuestas = RespuestaTaller.objects.filter(autor=explorador).count()

    # 14. Pluma de Bitácora: publicaciones en el diario
    total_posts = len(posts)

    # 15. Espíritu de Comunidad: compañeros de ruta conectados
    conexiones = RelacionSeguimiento.objects.filter(
        Q(seguidor=explorador) | Q(seguido=explorador),
        estado='aceptada'
    ).distinct().count()

    # 16. Planificador Nómada: viajes planificados o paradas asociadas
    viajes_planificados = sum(1 for v in viajes if not v.esta_cerrado) + len([c for c in checkins if c.viaje_id])

    return {
        'tragamillas': round(km_totales, 1),
        'nomada_nocturno': total_noches,
        'cartografo_nomada': lugares_creados,
        'ojo_halcon': total_fotos,
        'el_critico': total_resenas,
        'trotamundos': total_paises,
        'conquistador': total_comunidades,
        'autosuficiencia': noches_libres,
        'resistencia_nomada': max_dias_viaje,
        'ruta_familiar': lugares_familiares,
        'explorador_activo': actividades,
        'maker_nomada': maker_aportes,
        'mecanico_pista': taller_respuestas,
        'pluma_bitacora': total_posts,
        'espiritu_comunidad': conexiones,
        'planificador_nomada': viajes_planificados
    }


def verificar_y_desbloquear_trofeos(explorador):
    inicializar_catalogo_trofeos()
    metricas = calcular_metricas_usuario(explorador)
    trofeos_desbloqueados = []

    # Evaluar trofeos de las 16 categorías regulares
    for cat in CATEGORIAS_TROFEOS:
        val_actual = metricas.get(cat['codigo'], 0)
        for nivel, umbral in cat['umbrales']:
            codigo = f"{cat['codigo']}_{nivel}"
            try:
                trofeo = Trofeo.objects.get(codigo=codigo)
                if val_actual >= umbral:
                    obj, creado = TrofeoExplorador.objects.get_or_create(explorador=explorador, trofeo=trofeo)
                    if creado:
                        trofeos_desbloqueados.append(trofeo.nombre)
            except Trofeo.DoesNotExist:
                continue

    # Verificación estricta del Trofeo Platino:
    # Únicamente se desbloquea si el usuario tiene las 16 medallas de Oro
    trofeos_oro = Trofeo.objects.filter(nivel='oro')
    total_oros = trofeos_oro.count()
    oros_conseguidos = TrofeoExplorador.objects.filter(explorador=explorador, trofeo__in=trofeos_oro).count()

    if total_oros == 16 and oros_conseguidos >= 16:
        trofeo_platino = Trofeo.objects.filter(codigo='platino_nomada').first()
        if trofeo_platino:
            p_obj, p_creado = TrofeoExplorador.objects.get_or_create(explorador=explorador, trofeo=trofeo_platino)
            if p_creado:
                trofeos_desbloqueados.append(trofeo_platino.nombre)

    return trofeos_desbloqueados


def agrupar_checkin_en_viaje(checkin):
    # Aquí vinculo automáticamente el checkin a un viaje en curso o creo uno nuevo
    explorador = checkin.explorador
    fecha_ch = checkin.fecha_llegada.date()

    viaje_candidato = explorador.viajes.filter(
        esta_cerrado=False,
        fecha_inicio__lte=fecha_ch + timedelta(days=5),
        fecha_inicio__gte=fecha_ch - timedelta(days=30)
    ).first()

    if viaje_candidato:
        checkin.viaje = viaje_candidato
        checkin.save()
        recalcular_viaje(viaje_candidato)
    else:
        nuevo_viaje = Viaje.objects.create(
            explorador=explorador,
            titulo=f"Ruta por {checkin.lugar.nombre}",
            fecha_inicio=fecha_ch,
            fecha_fin=fecha_ch + timedelta(days=checkin.dias_previstos)
        )
        checkin.viaje = nuevo_viaje
        checkin.save()
        recalcular_viaje(nuevo_viaje)
