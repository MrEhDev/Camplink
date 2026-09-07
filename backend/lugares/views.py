import math
from datetime import datetime, timedelta
from django.http import HttpResponse
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from .models import Lugar, FotoLugar, ValoracionLugar
from .serializers import LugarSerializer, ValoracionLugarSerializer, FotoLugarSerializer

class LugarViewSet(viewsets.ModelViewSet):
    queryset = Lugar.objects.all()
    serializer_class = LugarSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Lugar.objects.all()
        q = self.request.query_params.get('q', None)
        if q:
            qs = qs.filter(
                Q(nombre__icontains=q) |
                Q(poblacion__icontains=q) |
                Q(provincia__icontains=q) |
                Q(descripcion__icontains=q)
            )

        # Filtro por tipo_lugar
        tipo_lugar = self.request.query_params.get('tipo_lugar', None)
        if tipo_lugar:
            qs = qs.filter(tipo_lugar=tipo_lugar)

        # Filtros de Servicios
        if self.request.query_params.get('agua') == 'true':
            qs = qs.filter(tiene_agua=True)
        if self.request.query_params.get('lavabo') == 'true':
            qs = qs.filter(tiene_lavabo=True)
        if self.request.query_params.get('electricidad') == 'true':
            qs = qs.filter(tiene_electricidad=True)
        if self.request.query_params.get('wifi') == 'true':
            qs = qs.filter(tiene_wifi=True)
        if self.request.query_params.get('basuras') == 'true':
            qs = qs.filter(tiene_basuras=True)
        if self.request.query_params.get('duchas') == 'true':
            qs = qs.filter(tiene_duchas=True)
        if self.request.query_params.get('vaciado_grises') == 'true':
            qs = qs.filter(tiene_vaciado_aguas_grises=True)
        if self.request.query_params.get('vaciado_negras') == 'true':
            qs = qs.filter(tiene_vaciado_aguas_negras=True)
        if self.request.query_params.get('gratuito') == 'true':
            qs = qs.filter(es_gratuito=True)

        # Filtros de Entorno y Ocio
        if self.request.query_params.get('familias') == 'true' or self.request.query_params.get('ninos') == 'true':
            qs = qs.filter(Q(ideal_familias=True) | Q(ideal_ninos_10_anos=True))
        if self.request.query_params.get('senderismo') == 'true' or self.request.query_params.get('senderos') == 'true':
            qs = qs.filter(Q(tiene_senderismo=True) | Q(tiene_senderos_sencillos=True))
        if self.request.query_params.get('playa') == 'true':
            qs = qs.filter(playa_cercana=True)
        if self.request.query_params.get('bici') == 'true':
            qs = qs.filter(rutas_en_bici=True)
        if self.request.query_params.get('mascotas') == 'true':
            qs = qs.filter(admite_mascotas=True)
        if self.request.query_params.get('zona_recreativa') == 'true':
            qs = qs.filter(Q(tipo_lugar='area_recreativa') | Q(es_zona_recreativa=True))

        # Filtros de Terreno y Acceso
        if self.request.query_params.get('asfaltado') == 'true':
            qs = qs.filter(acceso_asfaltado=True)
        if self.request.query_params.get('sombra') == 'true':
            qs = qs.filter(mucha_sombra=True)
        if self.request.query_params.get('soleado') == 'true':
            qs = qs.filter(muy_soleado=True)
        if self.request.query_params.get('nivelado') == 'true':
            qs = qs.filter(terreno_nivelado=True)
        if self.request.query_params.get('toldo') == 'true':
            qs = qs.filter(permite_sacar_toldo=True)
        if self.request.query_params.get('gran_autocaravana') == 'true':
            qs = qs.filter(apto_grandes_autocaravanas=True)

        return qs

    def perform_create(self, serializer):
        usuario = self.request.user if self.request.user.is_authenticated else None
        serializer.save(creador=usuario)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def valorar(self, request, pk=None):
        lugar = self.get_object()
        puntuacion = int(request.data.get('puntuacion_camper', 5))
        comentario = request.data.get('comentario', '')

        if not (1 <= puntuacion <= 5):
            return Response({'error': 'La puntuación camper debe estar entre 1 y 5.'}, status=status.HTTP_400_BAD_REQUEST)

        valoracion, creada = ValoracionLugar.objects.update_or_create(
            lugar=lugar,
            explorador=request.user,
            defaults={
                'puntuacion_camper': puntuacion,
                'comentario': comentario,
            }
        )
        serializer = ValoracionLugarSerializer(valoracion)
        return Response(serializer.data, status=status.HTTP_201_CREATED if creada else status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def exportar_calendario(self, request, pk=None):
        lugar = self.get_object()
        fecha_str = request.query_params.get('fecha', datetime.now().strftime('%Y-%m-%d'))
        dias = int(request.query_params.get('dias', 1))

        try:
            inicio = datetime.strptime(fecha_str, '%Y-%m-%d')
        except ValueError:
            inicio = datetime.now()

        fin = inicio + timedelta(days=dias)

        dtstart = inicio.strftime('%Y%m%dT120000Z')
        dtend = fin.strftime('%Y%m%dT120000Z')
        dtstamp = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')

        enlace_maps = f"https://www.google.com/maps/search/?api=1&query={lugar.latitud},{lugar.longitud}"
        ubicacion_limpia = f"{lugar.latitud},{lugar.longitud}"

        ics_lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Camplink//Pernocta Camper//ES',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            f'UID:camplink-lugar-{lugar.id}-{dtstamp}@camplink.es',
            f'DTSTAMP:{dtstamp}',
            f'DTSTART:{dtstart}',
            f'DTEND:{dtend}',
            f'SUMMARY:Pernocta Camper en {lugar.nombre}',
            f'DESCRIPTION:Pernocta planificada en {lugar.nombre} ({lugar.get_tipo_lugar_display()}). Pulsa en la ubicacion para iniciar la ruta GPS directa: {enlace_maps}',
            f'LOCATION:{ubicacion_limpia}',
            f'GEO:{lugar.latitud};{lugar.longitud}',
            f'URL:{enlace_maps}',
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR'
        ]
        ics_content = '\r\n'.join(ics_lines)

        response = HttpResponse(ics_content, content_type='text/calendar; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="pernocta_{lugar.id}.ics"'
        return response


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def lugares_cercanos_vista(request):
    try:
        lat = float(request.query_params.get('lat'))
        lng = float(request.query_params.get('lng'))
    except (TypeError, ValueError):
        return Response({'error': 'Debes proporcionar parámetros lat y lng válidos.'}, status=status.HTTP_400_BAD_REQUEST)

    radio_km = float(request.query_params.get('radio', 100))
    todos_los_lugares = Lugar.objects.all()
    cercanos = []

    def haversine(lat1, lon1, lat2, lon2):
        r = 6371.0
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = math.sin(d_lat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return r * c

    for lug in todos_los_lugares:
        dist = haversine(lat, lng, lug.latitud, lug.longitud)
        if dist <= radio_km:
            data = LugarSerializer(lug, context={'request': request}).data
            data['distancia_km'] = round(dist, 1)
            cercanos.append(data)

    cercanos.sort(key=lambda x: x['distancia_km'])
    return Response(cercanos)
