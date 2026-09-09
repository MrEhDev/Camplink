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

    def get_permissions(self):
        if self.action in ['extraer_maps']:
            return [permissions.AllowAny()]
        return super().get_permissions()

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
        lugar = serializer.save(creador=usuario)

        # Si se proporcionó una URL externa de imagen y no hay archivo directo
        url_foto = self.request.data.get('url_foto') or self.request.data.get('foto_url')
        if url_foto and not lugar.foto_principal:
            try:
                import requests
                from django.core.files.base import ContentFile
                clean_url = str(url_foto).strip()
                resp = requests.get(clean_url, timeout=12, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
                ctype = resp.headers.get('Content-Type', '').lower()
                if resp.status_code == 200 and ('image' in ctype or any(clean_url.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp'])):
                    ext = 'jpg'
                    if 'png' in ctype or clean_url.lower().endswith('.png'):
                        ext = 'png'
                    elif 'webp' in ctype or clean_url.lower().endswith('.webp'):
                        ext = 'webp'
                    nombre_archivo = f"lugar_{lugar.id}_web.{ext}"
                    lugar.foto_principal.save(nombre_archivo, ContentFile(resp.content), save=True)
            except Exception as e:
                print("Error al descargar foto externa:", e)

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


    @action(detail=False, methods=['get', 'post'], url_path='extraer-maps', permission_classes=[permissions.AllowAny])
    def extraer_maps(self, request):
        # Aquí extraigo automáticamente las coordenadas, población, provincia y nombre a partir de una URL de Google Maps
        url_recibida = request.data.get('url') if request.method == 'POST' else request.query_params.get('url')
        if not url_recibida:
            return Response({'exito': False, 'error': 'Debes proporcionar una URL de Google Maps.'}, status=status.HTTP_400_BAD_REQUEST)

        import requests
        import re
        import urllib.parse

        entrada_url = str(url_recibida).strip()

        # 1. Si son coordenadas directas (ej: "41.653176, 2.221018")
        m_direct = re.match(r"^\s*(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)\s*$", entrada_url)
        lat, lng = None, None
        nombre_extraido = None

        if m_direct:
            lat = float(m_direct.group(1))
            lng = float(m_direct.group(2))
        else:
            # Petición con requests siguiendo redirecciones
            s = requests.Session()
            s.headers.update({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
            })
            # Consent cookie para evitar la pantalla de consentimiento de Google en Europa
            s.cookies.set("SOCS", "CAESHAgBEhJnd3NfMjAyNDA2MTAtMF9SQzEaAmVuIAEaBgiA_L20Bg", domain=".google.com")

            try:
                r = s.get(entrada_url, allow_redirects=True, timeout=12)
                url_final = urllib.parse.unquote(r.url)
            except Exception as e:
                return Response({'exito': False, 'error': f'Error al consultar el enlace: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

            # Extraer nombre si viene en la ruta /maps/place/NOMBRE/
            m_place = re.search(r"/maps/place/([^/@?]+)", url_final)
            if m_place:
                nombre_extraido = m_place.group(1).replace("+", " ").strip()

            # Extraer coordenadas de la URL final
            # 1. /search/41.653176,+2.221018 o /search/41.653176,2.221018
            m_search = re.search(r"/search/(-?\d+\.\d+),[\+\s]*(-?\d+\.\d+)", url_final)
            if m_search:
                lat = float(m_search.group(1))
                lng = float(m_search.group(2))

            # 2. /@41.653176,2.221018
            if lat is None:
                m_at = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", url_final)
                if m_at:
                    lat = float(m_at.group(1))
                    lng = float(m_at.group(2))

            # 3. !3d41.653176!4d2.221018
            if lat is None:
                m_3d = re.search(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)", url_final)
                if m_3d:
                    lat = float(m_3d.group(1))
                    lng = float(m_3d.group(2))

            # 4. q=41.653176,2.221018 o ll=41.653176,2.221018
            if lat is None:
                m_q = re.search(r"[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)", url_final)
                if m_q:
                    lat = float(m_q.group(1))
                    lng = float(m_q.group(2))

            # 5. HTML fallback
            if lat is None and r.text:
                m_html = re.search(r"\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]", r.text)
                if m_html:
                    lat = float(m_html.group(1))
                    lng = float(m_html.group(2))

        if lat is None or lng is None:
            return Response({'exito': False, 'error': 'No se pudieron extraer coordenadas válidas del enlace de Google Maps.'}, status=status.HTTP_400_BAD_REQUEST)

        # Geocodificación inversa vía Nominatim / Photon
        poblacion = ""
        provincia = ""
        comunidad = ""
        pais = ""
        direccion = ""
        nombre_geo = ""

        try:
            headers_nom = {"User-Agent": "CamplinkApp/1.0 (contact@camplink.com)"}
            r_geo = requests.get(
                f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json&addressdetails=1",
                headers=headers_nom,
                timeout=6
            )
            if r_geo.status_code == 200:
                geo_data = r_geo.json()
                addr = geo_data.get("address", {})
                poblacion = addr.get("village") or addr.get("town") or addr.get("city") or addr.get("municipality") or addr.get("hamlet") or ""
                provincia = addr.get("province") or addr.get("state_district") or addr.get("county") or ""
                comunidad = addr.get("state") or ""
                pais = addr.get("country") or "España"
                direccion = addr.get("road") or addr.get("pedestrian") or ""
                nombre_geo = geo_data.get("name") or ""
        except Exception:
            pass

        if not poblacion:
            try:
                r_ph = requests.get(f"https://photon.komoot.io/reverse?lat={lat}&lon={lng}", timeout=5)
                if r_ph.status_code == 200:
                    ph_data = r_ph.json()
                    if ph_data.get("features"):
                        props = ph_data["features"][0].get("properties", {})
                        poblacion = props.get("city") or props.get("locality") or props.get("district") or poblacion
                        provincia = props.get("county") or props.get("state") or provincia
                        pais = props.get("country") or pais
                        direccion = props.get("street") or direccion
                        if not nombre_geo:
                            nombre_geo = props.get("name") or ""
            except Exception:
                pass

        # Sugerencia de tipo de lugar si se detectan palabras clave
        tipo_sugerido = 'pernocta_libre'
        nombre_check = (nombre_extraido or nombre_geo or '').lower()
        if 'camping' in nombre_check:
            tipo_sugerido = 'camping'
        elif any(w in nombre_check for w in ['área', 'area', 'autocaravana', 'camper']):
            tipo_sugerido = 'area_autocaravanas'
        elif any(w in nombre_check for w in ['parking', 'aparcamiento']):
            tipo_sugerido = 'parking_urbano'
        elif any(w in nombre_check for w in ['recreativa', 'merendero', 'picnic']):
            tipo_sugerido = 'area_recreativa'

        nombre_final = nombre_extraido or nombre_geo
        if not nombre_final:
            if direccion and poblacion:
                nombre_final = f"Pernocta en {direccion} ({poblacion})"
            elif poblacion:
                nombre_final = f"Pernocta en {poblacion}"
            else:
                nombre_final = f"Punto Camper {round(lat, 4)}, {round(lng, 4)}"

        return Response({
            'exito': True,
            'nombre': nombre_final,
            'latitud': round(lat, 6),
            'longitud': round(lng, 6),
            'poblacion': poblacion,
            'provincia': provincia,
            'comunidad_autonoma': comunidad,
            'pais': pais,
            'direccion': direccion,
            'tipo_lugar_sugerido': tipo_sugerido,
            'descripcion_sugerida': f"Lugar importado desde Google Maps en {poblacion or 'entorno natural'}{f' ({provincia})' if provincia else ''}."
        })


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
