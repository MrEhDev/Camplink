import math
from datetime import datetime, timedelta
from django.http import HttpResponse
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from .models import Lugar, FotoLugar, ValoracionLugar, NotaPersonalLugar
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

    def update(self, request, *args, **kwargs):
        lugar = self.get_object()
        es_admin = request.user.is_staff or request.user.is_superuser or getattr(request.user, 'es_admin', False) or getattr(request.user, 'es_administrador', False) or request.user.username == 'admin'
        es_creador = lugar.creador_id == request.user.id
        if not (es_admin or es_creador):
            # Si no es admin ni autor, cualquier usuario autenticado puede colaborar editando equipamiento y entorno
            return self.actualizar_equipamiento(request, pk=lugar.pk)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        lugar = self.get_object()
        es_admin = request.user.is_staff or request.user.is_superuser or getattr(request.user, 'es_admin', False) or getattr(request.user, 'es_administrador', False) or request.user.username == 'admin'
        es_creador = lugar.creador_id == request.user.id
        if not (es_admin or es_creador):
            return Response({'error': 'Solo los administradores o el creador del lugar pueden eliminarlo.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['patch', 'post'], permission_classes=[permissions.IsAuthenticated])
    def actualizar_equipamiento(self, request, pk=None):
        lugar = self.get_object()
        campos_permitidos = [
            'tiene_agua', 'tiene_lavabo', 'tiene_electricidad', 'tiene_wifi',
            'tiene_basuras', 'tiene_duchas', 'tiene_vaciado_aguas_grises', 'tiene_vaciado_aguas_negras',
            'ideal_familias', 'tiene_senderismo', 'playa_cercana', 'rutas_en_bici', 'admite_mascotas',
            'acceso_asfaltado', 'mucha_sombra', 'muy_soleado', 'terreno_nivelado',
            'apto_grandes_autocaravanas', 'permite_sacar_toldo',
            'tiene_mesas_picnic', 'es_zona_recreativa', 'tiene_senderos_sencillos', 'ideal_ninos_10_anos'
        ]
        for campo in campos_permitidos:
            if campo in request.data:
                setattr(lugar, campo, bool(request.data[campo]))
        lugar.save()
        return Response(LugarSerializer(lugar, context={'request': request}).data)

    @action(detail=True, methods=['get', 'post', 'delete'], permission_classes=[permissions.IsAuthenticated])
    def nota_personal(self, request, pk=None):
        lugar = self.get_object()
        if request.method == 'POST':
            contenido = request.data.get('contenido', request.data.get('nota', '')).strip()
            nota_id = request.data.get('id')
            if nota_id:
                nota_obj = NotaPersonalLugar.objects.filter(id=nota_id, lugar=lugar, explorador=request.user).first()
                if nota_obj:
                    nota_obj.contenido = contenido
                    nota_obj.save()
                else:
                    nota_obj = NotaPersonalLugar.objects.create(
                        lugar=lugar,
                        explorador=request.user,
                        contenido=contenido
                    )
            else:
                nota_obj = NotaPersonalLugar.objects.create(
                    lugar=lugar,
                    explorador=request.user,
                    contenido=contenido
                )
            notas = NotaPersonalLugar.objects.filter(lugar=lugar, explorador=request.user).order_by('-fecha_creacion')
            return Response({
                'id': nota_obj.id,
                'contenido': nota_obj.contenido,
                'fecha_creacion': nota_obj.fecha_creacion.isoformat() if nota_obj.fecha_creacion else None,
                'fecha_modificacion': nota_obj.fecha_modificacion.isoformat() if nota_obj.fecha_modificacion else None,
                'notas': [
                    {
                        'id': n.id,
                        'contenido': n.contenido,
                        'fecha_creacion': n.fecha_creacion.isoformat(),
                        'fecha_modificacion': n.fecha_modificacion.isoformat()
                    } for n in notas
                ]
            }, status=status.HTTP_200_OK)
        elif request.method == 'DELETE':
            nota_id = request.query_params.get('nota_id') or request.data.get('nota_id') or request.data.get('id')
            if nota_id:
                NotaPersonalLugar.objects.filter(id=nota_id, lugar=lugar, explorador=request.user).delete()
            else:
                NotaPersonalLugar.objects.filter(lugar=lugar, explorador=request.user).delete()
            notas = NotaPersonalLugar.objects.filter(lugar=lugar, explorador=request.user).order_by('-fecha_creacion')
            return Response({
                'mensaje': 'Nota personal eliminada.',
                'notas': [
                    {
                        'id': n.id,
                        'contenido': n.contenido,
                        'fecha_creacion': n.fecha_creacion.isoformat(),
                        'fecha_modificacion': n.fecha_modificacion.isoformat()
                    } for n in notas
                ]
            }, status=status.HTTP_200_OK)
        else:
            notas = NotaPersonalLugar.objects.filter(lugar=lugar, explorador=request.user).order_by('-fecha_creacion')
            nota_obj = notas.first()
            return Response({
                'contenido': nota_obj.contenido if nota_obj else '',
                'fecha_creacion': nota_obj.fecha_creacion.isoformat() if nota_obj and nota_obj.fecha_creacion else None,
                'fecha_modificacion': nota_obj.fecha_modificacion.isoformat() if nota_obj and nota_obj.fecha_modificacion else None,
                'notas': [
                    {
                        'id': n.id,
                        'contenido': n.contenido,
                        'fecha_creacion': n.fecha_creacion.isoformat(),
                        'fecha_modificacion': n.fecha_modificacion.isoformat()
                    } for n in notas
                ]
            }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def valorar(self, request, pk=None):
        lugar = self.get_object()
        puntuacion = int(request.data.get('puntuacion_camper', 5))
        comentario = request.data.get('comentario', '')

        if not (1 <= puntuacion <= 5):
            return Response({'error': 'La puntuación camper debe estar entre 1 y 5.'}, status=status.HTTP_400_BAD_REQUEST)

        defaults_data = {
            'puntuacion_camper': puntuacion,
            'comentario': comentario,
        }
        if 'foto' in request.FILES:
            defaults_data['foto'] = request.FILES['foto']

        valoracion, creada = ValoracionLugar.objects.update_or_create(
            lugar=lugar,
            explorador=request.user,
            defaults=defaults_data
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
            f'UID:camplink-lugar-{lugar.id}-{dtstamp}@camplinkapp.com',
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


@api_view(['PUT', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def gestionar_valoracion_vista(request, val_id):
    """
    Permite al autor de la opinión o a un administrador editar o eliminar una valoración.
    """
    try:
        val = ValoracionLugar.objects.select_related('lugar', 'explorador').get(id=val_id)
    except ValoracionLugar.DoesNotExist:
        return Response({'error': 'La opinión solicitada no existe.'}, status=status.HTTP_404_NOT_FOUND)

    es_autor = request.user.id == val.explorador_id
    es_admin = bool(
        getattr(request.user, 'es_admin', False) or
        request.user.is_staff or
        request.user.is_superuser or
        request.user.username == 'admin' or
        (request.user.username and request.user.username.lower() == 'admin')
    )

    if not (es_autor or es_admin):
        return Response({'error': 'No tienes permisos para modificar o eliminar esta opinión.'}, status=status.HTTP_403_FORBIDDEN)

    lugar = val.lugar

    if request.method == 'DELETE':
        val.delete()
        lugar.actualizar_valoracion()
        return Response({'mensaje': 'Opinión eliminada con éxito.'}, status=status.HTTP_200_OK)

    # PUT / PATCH: Editar comentario y/o puntuación
    comentario = request.data.get('comentario', None)
    puntuacion = request.data.get('puntuacion_camper', None)

    if comentario is not None:
        val.comentario = str(comentario).strip()
    if puntuacion is not None:
        try:
            p_val = int(puntuacion)
            if 1 <= p_val <= 5:
                val.puntuacion_camper = p_val
        except (ValueError, TypeError):
            pass

    val.save()
    lugar.actualizar_valoracion()
    serializer = ValoracionLugarSerializer(val, context={'request': request})
    return Response({'mensaje': 'Opinión actualizada con éxito.', 'valoracion': serializer.data}, status=status.HTTP_200_OK)
