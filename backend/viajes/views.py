# Aquí implemento los controladores para consultar, crear y editar Viajes,
# añadir paradas planificadas desde la ficha de lugares, obtener estadísticas y vitrina de Trofeos.

from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from .models import Viaje, Trofeo, TrofeoExplorador, InvitacionViaje
from .serializers import ViajeSerializer, TrofeoSerializer, TrofeoExploradorSerializer, InvitacionViajeSerializer
from .services import inicializar_catalogo_trofeos, verificar_y_desbloquear_trofeos, recalcular_viaje
from lugares.models import Lugar
from diario.models import CheckIn
from django.utils import timezone


def tiene_permiso_viaje(viaje, user):
    if not user or not user.is_authenticated:
        return False
    if viaje.explorador == user or getattr(user, 'es_admin', False) or user.is_staff or user.is_superuser:
        return True
    return InvitacionViaje.objects.filter(viaje_origen=viaje, destinatario=user, estado='aceptada').exists()


class ViajeViewSet(viewsets.ModelViewSet):
    # Aquí configuro el ViewSet para gestionar los viajes agrupados y planificados del explorador
    serializer_class = ViajeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Aquí permito ver todos los viajes o filtrar por un explorador concreto o mis viajes + compartidos
        qs = Viaje.objects.all().prefetch_related('checkins_asociados__lugar')
        usuario_id = self.request.query_params.get('usuario_id')
        if usuario_id:
            qs = qs.filter(explorador_id=usuario_id)
        elif self.request.user.is_authenticated and self.request.query_params.get('mis_viajes') == 'true':
            user = self.request.user
            viajes_compartidos_ids = InvitacionViaje.objects.filter(destinatario=user, estado='aceptada').values_list('viaje_origen_id', flat=True)
            qs = qs.filter(Q(explorador=user) | Q(id__in=viajes_compartidos_ids)).distinct()
        return qs

    def perform_create(self, serializer):
        # Aquí asigno automáticamente el explorador autenticado como creador del viaje
        serializer.save(explorador=self.request.user)

    def perform_update(self, serializer):
        # Aquí permito al propietario del viaje, colaboradores o al administrador modificar el viaje
        viaje = self.get_object()
        if tiene_permiso_viaje(viaje, self.request.user):
            serializer.save()
        else:
            raise permissions.PermissionDenied('No tienes permiso para editar este viaje.')

    def perform_destroy(self, instance):
        if tiene_permiso_viaje(instance, self.request.user):
            explorador = instance.explorador
            instance.delete()
            if explorador:
                verificar_y_desbloquear_trofeos(explorador)
        else:
            raise permissions.PermissionDenied('No tienes permiso para eliminar este viaje.')

    @action(detail=True, methods=['post'], url_path='modificar-parada')
    def modificar_parada(self, request, pk=None):
        # Aquí modifico la fecha y los días/noches previstos de una etapa del viaje
        viaje = self.get_object()
        if not tiene_permiso_viaje(viaje, request.user):
            return Response({'error': 'No tienes permiso sobre este viaje.'}, status=status.HTTP_403_FORBIDDEN)

        parada_id = request.data.get('parada_id') or request.data.get('checkin_id')
        nueva_fecha = request.data.get('fecha')
        nuevas_noches = request.data.get('dias_previstos')

        if not parada_id:
            return Response({'error': 'Falta parada_id o checkin_id.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Actualizar en CheckIn si es un ID numérico
        try:
            ch_id_num = int(parada_id) if str(parada_id).isdigit() else None
            if ch_id_num:
                ch = CheckIn.objects.filter(id=ch_id_num, viaje=viaje).first()
                if ch:
                    if nueva_fecha:
                        from viajes.services import normalizar_fecha_llegada
                        ch.fecha_llegada = normalizar_fecha_llegada(nueva_fecha)
                    if nuevas_noches is not None:
                        ch.dias_previstos = max(0, int(nuevas_noches))
                    ch.save()
        except Exception as e:
            print("Error al actualizar CheckIn:", e)

        # 2. Actualizar en resumen_ruta si existe
        if viaje.resumen_ruta:
            for p in viaje.resumen_ruta:
                if str(p.get('id')) == str(parada_id) or str(p.get('checkin_id')) == str(parada_id):
                    if nueva_fecha:
                        p['fecha'] = str(nueva_fecha).split('T')[0]
                        p['fecha_llegada'] = str(nueva_fecha).split('T')[0]
                    if nuevas_noches is not None:
                        p['dias'] = max(0, int(nuevas_noches))
                        p['dias_previstos'] = max(0, int(nuevas_noches))
            viaje.save()

        recalcular_viaje(viaje)
        viaje.refresh_from_db()
        serializer = ViajeSerializer(viaje, context={'request': request})
        return Response({
            'mensaje': 'Etapa modificada correctamente.',
            'viaje': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='lugar-hoy')
    def lugar_hoy(self, request):
        # Aquí verifico si el explorador tiene programada una etapa para la fecha de hoy
        if not request.user.is_authenticated:
            return Response({'lugar': None})

        from django.utils import timezone
        from datetime import datetime, timedelta
        hoy = timezone.now().date()

        viajes_activos = Viaje.objects.filter(explorador=request.user, esta_cerrado=False)
        for viaje in viajes_activos:
            # Comprobar en paradas de resumen_ruta
            if viaje.resumen_ruta:
                for p in viaje.resumen_ruta:
                    if p.get('tipo') not in ['base_salida', 'base_vuelta', 'base'] and p.get('lugar_id'):
                        f_str = p.get('fecha') or p.get('fecha_llegada')
                        dias = int(p.get('dias') or p.get('dias_previstos') or 1)
                        if f_str:
                            try:
                                f_inicio = datetime.strptime(f_str.split('T')[0], '%Y-%m-%d').date()
                                f_fin = f_inicio + timedelta(days=dias)
                                if f_inicio <= hoy <= f_fin:
                                    try:
                                        lug = Lugar.objects.get(id=p['lugar_id'])
                                        # Si ya ha hecho check-in en este lugar hoy, no mostrar notificación
                                        if CheckIn.objects.filter(explorador=request.user, lugar=lug, fecha_creacion__date=hoy).exists():
                                            continue
                                        return Response({
                                            'lugar': {
                                                'id': lug.id,
                                                'nombre': lug.nombre,
                                                'poblacion': lug.poblacion,
                                                'provincia': lug.provincia,
                                                'latitud': float(lug.latitud) if lug.latitud else None,
                                                'longitud': float(lug.longitud) if lug.longitud else None,
                                                'tipo_lugar': lug.tipo_lugar,
                                                'viaje_id': viaje.id,
                                                'viaje_titulo': viaje.titulo,
                                            }
                                        })
                                    except Lugar.DoesNotExist:
                                        pass
                            except Exception:
                                pass

            # Comprobar en checkins asociados
            for ch in viaje.checkins_asociados.all():
                f_ch = ch.fecha_llegada.date()
                if f_ch <= hoy <= f_ch + timedelta(days=ch.dias_previstos):
                    lug = ch.lugar
                    if CheckIn.objects.filter(explorador=request.user, lugar=lug, fecha_creacion__date=hoy).exclude(id=ch.id).exists():
                        continue
                    if ch.fecha_creacion.date() == hoy and (ch.comentario_publico or ch.foto or ch.notas_privadas):
                        continue
                    return Response({
                        'lugar': {
                            'id': lug.id,
                            'nombre': lug.nombre,
                            'poblacion': lug.poblacion,
                            'provincia': lug.provincia,
                            'latitud': float(lug.latitud) if lug.latitud else None,
                            'longitud': float(lug.longitud) if lug.longitud else None,
                            'tipo_lugar': lug.tipo_lugar,
                            'viaje_id': viaje.id,
                            'viaje_titulo': viaje.titulo,
                        }
                    })

        return Response({'lugar': None})

    @action(detail=True, methods=['post'], url_path='anadir-parada')
    def anadir_parada(self, request, pk=None):
        # Aquí añado un lugar o parada planificada al itinerario de este viaje
        viaje = self.get_object()
        if not tiene_permiso_viaje(viaje, request.user):
            return Response({'error': 'No tienes permiso sobre este viaje.'}, status=status.HTTP_403_FORBIDDEN)

        lugar_id = request.data.get('lugar_id')
        if not lugar_id:
            return Response({'error': 'Debes especificar el lugar_id.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lugar = Lugar.objects.get(id=lugar_id)
        except Lugar.DoesNotExist:
            return Response({'error': 'Lugar no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        from viajes.services import normalizar_fecha_llegada
        fecha_raw = request.data.get('fecha') or viaje.fecha_inicio
        fecha = normalizar_fecha_llegada(fecha_raw)
        dias_previstos = max(0, int(request.data.get('dias_previstos') if request.data.get('dias_previstos') is not None else 0))
        notas = request.data.get('notas_privadas', '')

        checkin = CheckIn.objects.create(
            explorador=request.user,
            lugar=lugar,
            fecha_llegada=fecha,
            dias_previstos=dias_previstos,
            notas_privadas=notas,
            viaje=viaje
        )

        recalcular_viaje(viaje)
        viaje.refresh_from_db()
        serializer = ViajeSerializer(viaje, context={'request': request})
        return Response({
            'mensaje': f'{lugar.nombre} ha sido añadido a {viaje.titulo}.',
            'checkin_id': checkin.id,
            'viaje_id': viaje.id,
            'viaje': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='reordenar-paradas')
    def reordenar_paradas(self, request, pk=None):
        # Aquí reordeno las paradas del viaje según el orden indicado por el explorador
        from django.utils import timezone
        from datetime import timedelta
        viaje = self.get_object()
        if not tiene_permiso_viaje(viaje, request.user):
            return Response({'error': 'No tienes permiso sobre este viaje.'}, status=status.HTTP_403_FORBIDDEN)

        nuevo_orden = request.data.get('orden', [])
        if not nuevo_orden:
            return Response({'error': 'Debes enviar la lista de orden de paradas.'}, status=status.HTTP_400_BAD_REQUEST)

        # Si viene una lista de IDs de checkin
        if isinstance(nuevo_orden[0], int) or (isinstance(nuevo_orden[0], str) and str(nuevo_orden[0]).isdigit()):
            checkins_dict = {ch.id: ch for ch in viaje.checkins_asociados.all()}
            fecha_base = viaje.fecha_inicio
            for idx, ch_id in enumerate(nuevo_orden):
                ch_id = int(ch_id)
                if ch_id in checkins_dict:
                    ch = checkins_dict[ch_id]
                    nueva_f = fecha_base + timedelta(days=idx)
                    ch.fecha_llegada = timezone.make_aware(
                        timezone.datetime.combine(nueva_f, timezone.datetime.min.time())
                    ) if timezone.is_naive(nueva_f) else nueva_f
                    ch.save()
            recalcular_viaje(viaje)
        elif isinstance(nuevo_orden[0], dict):
            for p in nuevo_orden:
                lat_val = p.get('lat') if p.get('lat') is not None else p.get('latitud')
                lng_val = p.get('lng') if p.get('lng') is not None else p.get('longitud')
                if lat_val is not None:
                    p['lat'] = float(lat_val)
                    p['latitud'] = float(lat_val)
                if lng_val is not None:
                    p['lng'] = float(lng_val)
                    p['longitud'] = float(lng_val)
            viaje.resumen_ruta = nuevo_orden
            from viajes.services import calcular_distancia_carretera
            coords = []
            for p in nuevo_orden:
                lat = p.get('lat') if p.get('lat') is not None else p.get('latitud')
                lng = p.get('lng') if p.get('lng') is not None else p.get('longitud')
                if lat is not None and lng is not None:
                    try:
                        coords.append((float(lat), float(lng)))
                    except (ValueError, TypeError):
                        pass
            viaje.km_totales = calcular_distancia_carretera(coords)
            viaje.save()

        serializer = ViajeSerializer(viaje, context={'request': request})
        return Response({
            'mensaje': 'Itinerario de paradas reordenado correctamente.',
            'viaje': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='anadir-gasolinera')
    def anadir_gasolinera(self, request, pk=None):
        # Aquí inserto una estación de servicio seleccionada como parada de repostaje en el itinerario
        viaje = self.get_object()
        if not tiene_permiso_viaje(viaje, request.user):
            return Response({'error': 'No tienes permiso sobre este viaje.'}, status=status.HTTP_403_FORBIDDEN)

        nombre = request.data.get('nombre', 'Estación de Servicio')
        lat = request.data.get('lat')
        lng = request.data.get('lng')
        precio = request.data.get('precio')
        direccion = request.data.get('direccion', '')
        tipo_combustible = request.data.get('tipo_combustible', 'Gasóleo')
        despues_de = request.data.get('despues_de_indice', None)

        if lat is None or lng is None:
            return Response({'error': 'Coordenadas requeridas.'}, status=status.HTTP_400_BAD_REQUEST)

        if not viaje.resumen_ruta:
            from viajes.services import recalcular_viaje
            recalcular_viaje(viaje)
            viaje.refresh_from_db()

        ruta = list(viaje.resumen_ruta or [])
        fecha_gas = viaje.fecha_inicio.strftime('%Y-%m-%d') if hasattr(viaje.fecha_inicio, 'strftime') else str(viaje.fecha_inicio)
        if despues_de is not None and 0 <= int(despues_de) < len(ruta):
            fecha_gas = ruta[int(despues_de)].get('fecha') or fecha_gas

        nueva_parada = {
            'nombre': f'⛽ {nombre}',
            'lat': float(lat),
            'lng': float(lng),
            'direccion': direccion,
            'precio': precio,
            'tipo_combustible': tipo_combustible,
            'tipo': 'gasolinera',
            'es_repostaje': True,
            'fecha': fecha_gas
        }

        if despues_de is not None and 0 <= int(despues_de) < len(ruta):
            ruta.insert(int(despues_de) + 1, nueva_parada)
        else:
            if len(ruta) > 0 and ruta[-1].get('tipo') == 'base_vuelta':
                ruta.insert(len(ruta) - 1, nueva_parada)
            else:
                ruta.append(nueva_parada)

        for p in ruta:
            lat_val = p.get('lat') if p.get('lat') is not None else p.get('latitud')
            lng_val = p.get('lng') if p.get('lng') is not None else p.get('longitud')
            if lat_val is not None:
                p['lat'] = float(lat_val)
                p['latitud'] = float(lat_val)
            if lng_val is not None:
                p['lng'] = float(lng_val)
                p['longitud'] = float(lng_val)
        viaje.resumen_ruta = ruta
        from viajes.services import calcular_distancia_carretera
        coords = []
        for p in ruta:
            lat = p.get('lat') if p.get('lat') is not None else p.get('latitud')
            lng = p.get('lng') if p.get('lng') is not None else p.get('longitud')
            if lat is not None and lng is not None:
                try:
                    coords.append((float(lat), float(lng)))
                except (ValueError, TypeError):
                    pass
        viaje.km_totales = calcular_distancia_carretera(coords)
        viaje.save()

        serializer = ViajeSerializer(viaje, context={'request': request})
        return Response({
            'mensaje': f'Gasolinera {nombre} añadida al viaje.',
            'viaje': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='marcar-repostaje')
    def marcar_repostaje(self, request, pk=None):
        # Aquí alterno el estado de repostaje en una parada específica del viaje
        viaje = self.get_object()
        if not tiene_permiso_viaje(viaje, request.user):
            return Response({'error': 'No tienes permiso sobre este viaje.'}, status=status.HTTP_403_FORBIDDEN)

        indice = request.data.get('indice')
        if indice is None:
            return Response({'error': 'Índice requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        if not viaje.resumen_ruta:
            from viajes.services import recalcular_viaje
            recalcular_viaje(viaje)
            viaje.refresh_from_db()

        indice = int(indice)
        ruta = list(viaje.resumen_ruta or [])
        if 0 <= indice < len(ruta):
            actual = ruta[indice].get('es_repostaje', False)
            ruta[indice]['es_repostaje'] = not actual
            viaje.resumen_ruta = ruta
            viaje.save()

        serializer = ViajeSerializer(viaje, context={'request': request})
        return Response({
            'mensaje': 'Estado de repostaje actualizado.',
            'viaje': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='eliminar-parada')
    def eliminar_parada(self, request, pk=None):
        # Aquí elimino una etapa o parada del itinerario de este viaje
        viaje = self.get_object()
        if not tiene_permiso_viaje(viaje, request.user):
            return Response({'error': 'No tienes permiso sobre este viaje.'}, status=status.HTTP_403_FORBIDDEN)

        indice = request.data.get('indice')
        checkin_id = request.data.get('checkin_id')

        # Si viene checkin_id, desvinculamos o eliminamos el checkin asociado
        if checkin_id:
            try:
                ch = CheckIn.objects.get(id=checkin_id, viaje=viaje)
                ch.viaje = None
                ch.save()
            except CheckIn.DoesNotExist:
                pass

        # Si el viaje tiene resumen_ruta personalizado
        ruta = list(viaje.resumen_ruta or [])
        if indice is not None and 0 <= int(indice) < len(ruta):
            ruta.pop(int(indice))
            for p in ruta:
                lat_val = p.get('lat') if p.get('lat') is not None else p.get('latitud')
                lng_val = p.get('lng') if p.get('lng') is not None else p.get('longitud')
                if lat_val is not None:
                    p['lat'] = float(lat_val)
                    p['latitud'] = float(lat_val)
                if lng_val is not None:
                    p['lng'] = float(lng_val)
                    p['longitud'] = float(lng_val)
            viaje.resumen_ruta = ruta
            from viajes.services import calcular_distancia_carretera
            coords = []
            for p in ruta:
                lat = p.get('lat') if p.get('lat') is not None else p.get('latitud')
                lng = p.get('lng') if p.get('lng') is not None else p.get('longitud')
                if lat is not None and lng is not None:
                    try:
                        coords.append((float(lat), float(lng)))
                    except (ValueError, TypeError):
                        pass
            viaje.km_totales = calcular_distancia_carretera(coords)
            viaje.save()
        else:
            recalcular_viaje(viaje)

        if viaje.explorador:
            verificar_y_desbloquear_trofeos(viaje.explorador)

        serializer = ViajeSerializer(viaje, context={'request': request})
        return Response({
            'mensaje': 'Parada eliminada correctamente del viaje.',
            'viaje': serializer.data
        })


    @action(detail=True, methods=['post'], url_path='anadir-parada-libre')
    def anadir_parada_libre(self, request, pk=None):
        # Aqui añado una parada libre (dirección externa, geocodificada o URL de Google Maps)
        # al itinerario sin necesidad de que exista en la base de datos de Lugares.
        viaje = self.get_object()
        if not tiene_permiso_viaje(viaje, request.user):
            return Response({'error': 'No tienes permiso sobre este viaje.'}, status=status.HTTP_403_FORBIDDEN)

        nombre = request.data.get('nombre', '').strip()
        lat = request.data.get('lat')
        lng = request.data.get('lng')
        direccion = request.data.get('direccion', '').strip()
        fecha_raw = request.data.get('fecha') or str(viaje.fecha_inicio)
        dias_previstos = max(0, int(request.data.get('dias_previstos') if request.data.get('dias_previstos') is not None else 0))

        if not nombre:
            nombre = direccion or 'Parada libre'
        if lat is None or lng is None:
            return Response({'error': 'Se requieren coordenadas lat y lng.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lat = float(lat)
            lng = float(lng)
        except (ValueError, TypeError):
            return Response({'error': 'Coordenadas inválidas.'}, status=status.HTTP_400_BAD_REQUEST)

        # Construir el punto de parada libre
        punto = {
            'id': f'libre-{int(lat*10000)}-{int(lng*10000)}',
            'nombre': nombre,
            'lat': lat,
            'lng': lng,
            'latitud': lat,
            'longitud': lng,
            'direccion': direccion,
            'poblacion': direccion,
            'tipo': 'parada_libre',
            'tipo_lugar': 'parada_libre',
            'fecha': str(fecha_raw).split('T')[0] if fecha_raw else None,
            'fecha_llegada': str(fecha_raw).split('T')[0] if fecha_raw else None,
            'dias_previstos': dias_previstos,
            'dias': dias_previstos,
            'lugar_id': None,
            'es_base': False,
            'es_repostaje': False,
        }

        ruta = list(viaje.resumen_ruta or [])
        # Insertar antes de la parada base_vuelta si existe, o al final
        if ruta and ruta[-1].get('tipo') in ('base_vuelta', 'base'):
            ruta.insert(len(ruta) - 1, punto)
        else:
            ruta.append(punto)

        viaje.resumen_ruta = ruta

        from viajes.services import calcular_distancia_carretera
        coords = []
        for p in ruta:
            plat = p.get('lat') if p.get('lat') is not None else p.get('latitud')
            plng = p.get('lng') if p.get('lng') is not None else p.get('longitud')
            if plat is not None and plng is not None:
                try:
                    coords.append((float(plat), float(plng)))
                except (ValueError, TypeError):
                    pass
        viaje.km_totales = calcular_distancia_carretera(coords)
        viaje.save()

        viaje.refresh_from_db()
        serializer = ViajeSerializer(viaje, context={'request': request})
        return Response({
            'mensaje': f'{nombre} ha sido añadido como parada libre a {viaje.titulo}.',
            'viaje': serializer.data
        })



@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def mis_estadisticas_vista(request):
    # Aquí compilo las métricas de viaje del usuario para la vista "Mis Viajes" y la generación del cartel PDF
    # NOTA: los trofeos SOLO se desbloquean al hacer Check-in real (diario/views.py), nunca al consultar estadísticas
    explorador = request.user

    viajes_usuario = list(explorador.viajes.all())
    from .services import recalcular_viaje
    for v in viajes_usuario:
        if (v.km_totales is None or v.km_totales <= 0) and (v.checkins_asociados.exists() or len(v.resumen_ruta or []) >= 2):
            recalcular_viaje(v)
            v.refresh_from_db()

    checkins_usuario = explorador.checkins.all()
    lugares_creados = Lugar.objects.filter(creador=explorador).count()

    km_totales = sum(v.km_totales for v in viajes_usuario)
    dias_totales = sum(v.duracion_dias for v in viajes_usuario)

    comunidades = set()
    paises = set()
    lugares_visitados_set = set(c.lugar_id for c in checkins_usuario if c.lugar_id)
    for v in viajes_usuario:
        for c in v.comunidades_visitadas:
            comunidades.add(c)
        for p in v.paises_visitados:
            paises.add(p)
        for p in (v.resumen_ruta or []):
            if p.get('lugar_id'):
                lugares_visitados_set.add(p.get('lugar_id'))

    trofeos_ganados = TrofeoExplorador.objects.filter(explorador=explorador).count()
    total_trofeos = Trofeo.objects.count()

    from .services import calcular_metricas_usuario
    metricas = calcular_metricas_usuario(explorador)

    datos = {
        'explorador': {
            'username': explorador.username,
            'nombre_completo': f"{explorador.first_name} {explorador.last_name}".strip() or explorador.username,
            'tipo_viajero': explorador.get_tipo_viajero_display(),
            'avatar': explorador.avatar.url if explorador.avatar else None,
            'foto_vehiculo': explorador.foto_vehiculo.url if explorador.foto_vehiculo else None,
            'poblacion': explorador.poblacion,
            'pais': explorador.pais,
        },
        'estadisticas': {
            'km_totales': round(km_totales, 1),
            'dias_totales': dias_totales,
            'total_pernoctas': checkins_usuario.count(),
            'total_lugares_aportados': lugares_creados,
            'total_lugares_visitados': len(lugares_visitados_set) or checkins_usuario.count(),
            'total_publicaciones_diario': metricas.get('pluma_bitacora', 0),
            'total_valoraciones': metricas.get('el_critico', 0),
            'total_fotos': metricas.get('ojo_halcon', 0),
            'total_viajes': len(viajes_usuario),
            'total_comunidades': len(comunidades),
            'comunidades_lista': sorted(list(comunidades)),
            'total_paises': len(paises),
            'paises_lista': sorted(list(paises)),
            'trofeos_desbloqueados': trofeos_ganados,
            'trofeos_totales': total_trofeos,
            'porcentaje_trofeos': round((trofeos_ganados / total_trofeos * 100) if total_trofeos > 0 else 0, 1),
        }
    }
    return Response(datos)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def vitrina_trofeos_vista(request):
    # Aquí devuelvo las 16 categorías temáticas de trofeos agrupadas con progreso interactivo y el Platino supremo
    from .services import CATEGORIAS_TROFEOS, calcular_metricas_usuario, verificar_y_desbloquear_trofeos, inicializar_catalogo_trofeos
    inicializar_catalogo_trofeos()

    usuario = request.user if request.user.is_authenticated else None
    desbloqueados_codigos = set()
    desbloqueados_fechas = {}

    metricas = {}
    if usuario:
        # NOTA: los trofeos SOLO se desbloquean al hacer Check-in real; aquí solo calculamos el progreso para mostrar
        metricas = calcular_metricas_usuario(usuario)
        conseguidos = TrofeoExplorador.objects.filter(explorador=usuario).select_related('trofeo')
        for c in conseguidos:
            desbloqueados_codigos.add(c.trofeo.codigo)
            desbloqueados_fechas[c.trofeo.codigo] = c.fecha_desbloqueo

    # Compilar las 16 tarjetas de categorías
    categorias_resultado = []
    oros_conseguidos_total = 0

    for cat in CATEGORIAS_TROFEOS:
        codigo_cat = cat['codigo']
        val_actual = metricas.get(codigo_cat, 0)
        umbrales = cat['umbrales']  # [('madera', 100), ('bronce', 1000), ('plata', 5000), ('oro', 20000)]

        # Determinar medalla más alta conseguida
        medalla_maxima = None
        siguiente_nivel = None
        umbral_siguiente = None
        nivel_anterior_umbral = 0

        # Verificamos de mayor a menor para encontrar la medalla más alta
        niveles_info = []
        for nivel, umbral in umbrales:
            cod_trofeo = f"{codigo_cat}_{nivel}"
            es_desbloqueado = cod_trofeo in desbloqueados_codigos
            niveles_info.append({
                'nivel': nivel,
                'umbral': umbral,
                'desbloqueado': es_desbloqueado,
                'fecha_desbloqueo': desbloqueados_fechas.get(cod_trofeo)
            })
            if es_desbloqueado:
                medalla_maxima = nivel
                nivel_anterior_umbral = umbral
                if nivel == 'oro':
                    oros_conseguidos_total += 1

        # Determinar siguiente objetivo
        es_oro = (medalla_maxima == 'oro')
        if es_oro:
            porcentaje = 100.0
            texto_progreso = f"Nivel Máximo Completado ({val_actual} / {umbrales[-1][1]} {cat['unidad']})"
        else:
            # Buscamos el primer nivel no desbloqueado
            for nivel, umbral in umbrales:
                if f"{codigo_cat}_{nivel}" not in desbloqueados_codigos:
                    siguiente_nivel = nivel
                    umbral_siguiente = umbral
                    break

            if umbral_siguiente is not None:
                # Progreso relativo entre nivel_anterior_umbral y umbral_siguiente
                rango = umbral_siguiente - nivel_anterior_umbral
                avance = max(0, val_actual - nivel_anterior_umbral)
                porcentaje = min(100.0, round((avance / rango) * 100, 1)) if rango > 0 else 0.0
                texto_progreso = f"{val_actual} / {umbral_siguiente} {cat['unidad']} para conseguir la medalla de {siguiente_nivel.capitalize()}"
            else:
                porcentaje = 100.0
                texto_progreso = "Nivel Máximo Completado"

        categorias_resultado.append({
            'codigo': codigo_cat,
            'nombre': cat['nombre'],
            'descripcion': cat['descripcion'],
            'icono': cat['icono'],
            'unidad': cat['unidad'],
            'valor_actual': val_actual,
            'medalla_maxima': medalla_maxima,
            'siguiente_medalla': siguiente_nivel,
            'umbral_siguiente': umbral_siguiente,
            'porcentaje_progreso': porcentaje,
            'texto_progreso': texto_progreso,
            'es_oro_completado': es_oro,
            'niveles': niveles_info
        })

    # Trofeo Platino Supremo
    platino_desbloqueado = 'platino_nomada' in desbloqueados_codigos
    platino_info = {
        'nombre': 'Leyenda Suprema Nómada',
        'descripcion': 'Consigue las 16 medallas de Oro de Camplink para desbloquear la condecoración legendaria.',
        'icono': 'crown',
        'oros_conseguidos': oros_conseguidos_total,
        'oros_totales': 16,
        'porcentaje_progreso': round((oros_conseguidos_total / 16.0) * 100, 1),
        'desbloqueado': platino_desbloqueado,
        'fecha_desbloqueo': desbloqueados_fechas.get('platino_nomada')
    }

    resumen_niveles = {
        'madera': sum(1 for c in categorias_resultado for n in c.get('niveles', []) if n['nivel'] == 'madera' and n.get('desbloqueado')),
        'bronce': sum(1 for c in categorias_resultado for n in c.get('niveles', []) if n['nivel'] == 'bronce' and n.get('desbloqueado')),
        'plata': sum(1 for c in categorias_resultado for n in c.get('niveles', []) if n['nivel'] == 'plata' and n.get('desbloqueado')),
        'oro': sum(1 for c in categorias_resultado for n in c.get('niveles', []) if n['nivel'] == 'oro' and n.get('desbloqueado')),
    }

    return Response({
        'categorias': categorias_resultado,
        'platino': platino_info,
        'resumen_niveles': resumen_niveles,
        'total_categorias': 16,
        'total_desbloqueados': len(desbloqueados_codigos),
        'porcentaje_global': round((len(desbloqueados_codigos) / 65.0) * 100, 1)
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def destacar_trofeos_vista(request):
    # Aquí permito al explorador seleccionar cuáles de sus trofeos ganados lucir como destacados en su perfil
    trofeo_ids = request.data.get('trofeos_ids', [])
    TrofeoExplorador.objects.filter(explorador=request.user).update(es_destacado=False)
    TrofeoExplorador.objects.filter(explorador=request.user, trofeo_id__in=trofeo_ids).update(es_destacado=True)
    return Response({'mensaje': 'Trofeos destacados actualizados con éxito.'})


# ─────────────────────────────────────────────
# Compartir Viajes: Invitaciones entre exploradores
# ─────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def compartir_viaje(request, viaje_id):
    # Aquí el explorador envía una invitación para compartir su viaje planificado con otro usuario.
    try:
        viaje = Viaje.objects.get(id=viaje_id, explorador=request.user)
    except Viaje.DoesNotExist:
        return Response({'error': 'Viaje no encontrado o no tienes permiso.'}, status=status.HTTP_404_NOT_FOUND)

    destinatario_username = request.data.get('destinatario_username', '').strip()
    mensaje = request.data.get('mensaje', '').strip()

    if not destinatario_username:
        return Response({'error': 'Debes indicar el nombre de usuario del destinatario.'}, status=status.HTTP_400_BAD_REQUEST)

    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        destinatario = User.objects.get(username__iexact=destinatario_username)
    except User.DoesNotExist:
        return Response({'error': f'No se encontró al explorador "{destinatario_username}".'}, status=status.HTTP_404_NOT_FOUND)

    if destinatario == request.user:
        return Response({'error': 'No puedes compartir un viaje contigo mismo.'}, status=status.HTTP_400_BAD_REQUEST)

    remitente_cap = request.user.username.capitalize()
    destinatario_cap = destinatario.username.capitalize()

    # Comprobar si ya existe una invitación previa para este viaje y destinatario
    existente = InvitacionViaje.objects.filter(
        viaje_origen=viaje,
        destinatario=destinatario
    ).first()

    if existente:
        # 1. Si sigue pendiente, avisar
        if existente.estado == 'pendiente':
            return Response({'error': f'Ya existe una invitación pendiente para {destinatario_cap}.'}, status=status.HTTP_409_CONFLICT)

        # 2. Si ya fue aceptada, comprobar si el destinatario todavía conserva el viaje en su cuenta
        if existente.estado == 'aceptada' and existente.viaje_copia_id:
            if Viaje.objects.filter(id=existente.viaje_copia_id).exists():
                return Response({'error': f'{destinatario_cap} ya tiene este viaje en sus viajes planificados.'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Si fue rechazada o el viaje copia fue eliminado por el destinatario, reactivamos la invitación limpiamente
        existente.estado = 'pendiente'
        existente.mensaje = mensaje
        existente.fecha_envio = timezone.now()
        existente.fecha_respuesta = None
        existente.viaje_copia = None
        existente.save()
        invitacion = existente
    else:
        invitacion = InvitacionViaje.objects.create(
            viaje_origen=viaje,
            remitente=request.user,
            destinatario=destinatario,
            mensaje=mensaje,
        )

    # Notificación y correo al usuario invitado
    try:
        from exploradores.models import Notificacion
        Notificacion.objects.create(
            usuario_destino=destinatario,
            usuario_origen=request.user,
            tipo='sistema',
            titulo=f'🚐 {remitente_cap} quiere compartir un viaje contigo',
            mensaje=f'{remitente_cap} te ha invitado a unirte a su viaje "{viaje.titulo}". Puedes revisarlo y aceptarlo en Organizar Viajes.',
            enlace='/organizar',
        )
    except Exception as e:
        print('Error creando notificacion compartir viaje:', e)

    serializer = InvitacionViajeSerializer(invitacion, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def mis_invitaciones_recibidas(request):
    # Aquí devuelvo las invitaciones de viaje pendientes recibidas por el explorador autenticado.
    invitaciones = InvitacionViaje.objects.filter(
        destinatario=request.user,
        estado='pendiente'
    ).select_related('viaje_origen', 'remitente')
    serializer = InvitacionViajeSerializer(invitaciones, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def aceptar_invitacion(request, inv_id):
    # Aquí el explorador acepta la invitación: se crea una copia editable del viaje en su cuenta.
    try:
        inv = InvitacionViaje.objects.get(id=inv_id, destinatario=request.user, estado='pendiente')
    except InvitacionViaje.DoesNotExist:
        return Response({'error': 'Invitación no encontrada o ya procesada.'}, status=status.HTTP_404_NOT_FOUND)

    viaje_orig = inv.viaje_origen
    if not Viaje.objects.filter(id=viaje_orig.id).exists():
        inv.estado = 'rechazada'
        inv.fecha_respuesta = timezone.now()
        inv.save()
        return Response({'error': 'El viaje original ya no existe.'}, status=status.HTTP_404_NOT_FOUND)

    remitente_cap = inv.remitente.username.capitalize() if inv.remitente and inv.remitente.username else 'Explorador'
    destinatario_cap = request.user.username.capitalize() if request.user and request.user.username else 'Explorador'

    # Aceptar la invitación enlazando directamente al viaje original compartido en tiempo real
    inv.estado = 'aceptada'
    inv.fecha_respuesta = timezone.now()
    if inv.viaje_copia:
        copia_vieja = inv.viaje_copia
        inv.viaje_copia = None
        inv.save()
        try:
            copia_vieja.delete()
        except Exception:
            pass
    else:
        inv.save()

    try:
        from exploradores.models import Notificacion
        Notificacion.objects.create(
            usuario_destino=inv.remitente,
            usuario_origen=request.user,
            tipo='sistema',
            titulo=f'🎉 {destinatario_cap} ha aceptado tu viaje compartido',
            mensaje=f'{destinatario_cap} se ha unido al viaje "{viaje_orig.titulo}". Ahora ambos podéis colaborar y sincronizar la ruta en tiempo real.',
            enlace='/organizar',
        )
    except Exception as e:
        print('Error notificando aceptacion:', e)

    serializer = ViajeSerializer(viaje_orig, context={'request': request})
    return Response({
        'mensaje': f'¡Te has unido al viaje "{viaje_orig.titulo}" de {remitente_cap}!',
        'viaje': serializer.data
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def rechazar_invitacion(request, inv_id):
    # Aquí el explorador rechaza la invitación de compartir viaje.
    try:
        inv = InvitacionViaje.objects.get(id=inv_id, destinatario=request.user, estado='pendiente')
    except InvitacionViaje.DoesNotExist:
        return Response({'error': 'Invitación no encontrada o ya procesada.'}, status=status.HTTP_404_NOT_FOUND)

    inv.estado = 'rechazada'
    inv.fecha_respuesta = timezone.now()
    inv.save()
    return Response({'mensaje': 'Invitación rechazada.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def buscar_exploradores(request):
    # Aquí busco exploradores por nombre de usuario para el buscador del modal de compartir.
    q = request.query_params.get('q', '').strip()
    if len(q) < 2:
        return Response([])
    from django.contrib.auth import get_user_model
    User = get_user_model()
    usuarios = User.objects.filter(
        username__icontains=q
    ).exclude(id=request.user.id)[:10]
    return Response([
        {
            'id': u.id,
            'username': u.username,
            'avatar': request.build_absolute_uri(u.avatar.url) if getattr(u, 'avatar', None) and u.avatar else None,
        }
        for u in usuarios
    ])
