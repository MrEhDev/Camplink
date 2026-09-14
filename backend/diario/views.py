from exploradores.views import crear_notificacion
# Aquí implemento las vistas y controladores del Diario de Ruta (feed social),
# publicación de vivencias nómadas, comentarios y registro de Check-ins (pernoctas).

from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from .models import Publicacion, ComentarioPublicacion, CheckIn, ReaccionPublicacion
from .serializers import (
    PublicacionSerializer,
    ComentarioPublicacionSerializer,
    CheckInSerializer,
    CheckInCrearSerializer
)
from viajes.services import agrupar_checkin_en_viaje
from exploradores.models import RelacionSeguimiento

class PublicacionViewSet(viewsets.ModelViewSet):
    # Aquí configuro el ViewSet para el Diario de Ruta aplicando las restricciones de privacidad
    serializer_class = PublicacionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Aquí filtro las publicaciones según la visibilidad configurada por cada autor
        usuario = self.request.user
        if not usuario.is_authenticated:
            # Usuarios anónimos solo leen lo público
            return Publicacion.objects.filter(visibilidad='publico').select_related('autor', 'lugar')

        # Si el usuario está registrado, obtengo a quiénes sigue con solicitud aceptada
        siguiendo_ids = RelacionSeguimiento.objects.filter(
            seguidor=usuario,
            estado='aceptada'
        ).values_list('seguido_id', flat=True)

        qs = Publicacion.objects.filter(
            Q(visibilidad='publico') |
            Q(autor=usuario) |
            Q(visibilidad='seguidores', autor_id__in=siguiendo_ids) |
            Q(visibilidad='grupo_privado', grupo_privado__miembros=usuario) |
            Q(visibilidad='grupo_privado', grupo_privado__creador=usuario)
        ).distinct().select_related('autor', 'lugar').prefetch_related('comentarios__autor')

        autor_param = self.request.query_params.get('autor')
        if autor_param:
            qs = qs.filter(autor_id=autor_param)

        lugar_param = self.request.query_params.get('lugar')
        if lugar_param:
            try:
                from lugares.models import Lugar
                lug = Lugar.objects.filter(id=lugar_param).first()
                if lug and lug.nombre:
                    qs = qs.filter(Q(lugar_id=lugar_param) | Q(contenido__icontains=lug.nombre))
                else:
                    qs = qs.filter(lugar_id=lugar_param)
            except Exception:
                qs = qs.filter(lugar_id=lugar_param)

        return qs

    def perform_create(self, serializer):
        # Aquí asigno al explorador autenticado como autor del post y vinculo el lugar seleccionado
        lugar_id = self.request.data.get('lugar') or self.request.data.get('lugar_id')
        lugar_obj = None
        if lugar_id:
            try:
                from lugares.models import Lugar
                lugar_obj = Lugar.objects.get(id=lugar_id)
            except Exception:
                pass
        if lugar_obj:
            serializer.save(autor=self.request.user, lugar=lugar_obj)
        else:
            serializer.save(autor=self.request.user)

    def perform_update(self, serializer):
        # Aquí permito al autor de la publicación o a un administrador modificar el post
        pub = self.get_object()
        es_admin = getattr(self.request.user, 'es_admin', False) or getattr(self.request.user, 'is_staff', False) or getattr(self.request.user, 'is_superuser', False) or self.request.user.username == 'admin'
        if pub.autor == self.request.user or es_admin:
            serializer.save()
        else:
            raise permissions.PermissionDenied('Solo el creador o un administrador pueden editar esta publicación.')

    def perform_destroy(self, instance):
        # Aquí permito al autor de la publicación o a un administrador eliminar el post
        es_admin = getattr(self.request.user, 'es_admin', False) or getattr(self.request.user, 'is_staff', False) or getattr(self.request.user, 'is_superuser', False) or self.request.user.username == 'admin'
        if instance.autor == self.request.user or es_admin:
            autor = instance.autor
            instance.delete()
            if autor:
                from viajes.services import verificar_y_desbloquear_trofeos
                verificar_y_desbloquear_trofeos(autor)
        else:
            raise permissions.PermissionDenied('Solo el creador o un administrador pueden eliminar esta publicación.')

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def comentar(self, request, pk=None):
        # Aquí permito a un explorador comentar en una publicación del Diario
        publicacion = self.get_object()
        texto = request.data.get('texto', '').strip()
        if not texto:
            return Response({'error': 'El comentario no puede estar vacío.'}, status=status.HTTP_400_BAD_REQUEST)

        comentario = ComentarioPublicacion.objects.create(
            publicacion=publicacion,
            autor=request.user,
            texto=texto
        )
        serializer = ComentarioPublicacionSerializer(comentario)
        if publicacion.autor:
            crear_notificacion(
                usuario_destino=publicacion.autor,
                usuario_origen=request.user,
                tipo='comentario',
                titulo='¡Nuevo comentario en tu vivencia!',
                mensaje=f'{request.user.username.capitalize()} comentó: "{comentario.texto[:60]}..."',
                enlace=f'/diario?post={publicacion.id}&comentario={comentario.id}'
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reaccionar(self, request, pk=None):
        # Aquí permito alternar una reacción camper rápida (fuego, pino, alerta)
        publicacion = self.get_object()
        tipo = request.data.get('tipo')
        if tipo not in ['fuego', 'pino', 'alerta']:
            return Response({'error': 'Tipo de reacción no válido.'}, status=status.HTTP_400_BAD_REQUEST)

        existente = ReaccionPublicacion.objects.filter(publicacion=publicacion, usuario=request.user, tipo=tipo)
        if existente.exists():
            existente.delete()
            accion = 'eliminada'
        else:
            ReaccionPublicacion.objects.create(publicacion=publicacion, usuario=request.user, tipo=tipo)
            accion = 'agregada'
            if publicacion.autor:
                crear_notificacion(
                    usuario_destino=publicacion.autor,
                    usuario_origen=request.user,
                    tipo='reaccion',
                    titulo='¡Reacción a tu vivencia!',
                    mensaje=f'A {request.user.username.capitalize()} le ha gustado tu publicación en el Diario.',
                    enlace=f'/diario?post={publicacion.id}'
                )

        from django.db.models import Count
        conteos = publicacion.reacciones.values('tipo').annotate(total=Count('tipo'))
        resumen = {'fuego': 0, 'pino': 0, 'alerta': 0}
        for c in conteos:
            resumen[c['tipo']] = c['total']

        mis = list(publicacion.reacciones.filter(usuario=request.user).values_list('tipo', flat=True))
        return Response({'accion': accion, 'reacciones_resumen': resumen, 'mis_reacciones': mis})


class CheckInViewSet(viewsets.ModelViewSet):
    # Aquí gestiono el registro de pernoctas, notas privadas y vinculación al Viaje
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        # Aquí devuelvo el serializer adecuado según si estoy creando o consultando
        if self.action == 'create':
            return CheckInCrearSerializer
        return CheckInSerializer

    def get_queryset(self):
        # Aquí devuelvo el listado de pernoctas permitiendo filtrar por lugar o por usuario
        qs = CheckIn.objects.all().select_related('explorador', 'lugar', 'viaje')
        lugar_id = self.request.query_params.get('lugar_id')
        if lugar_id:
            qs = qs.filter(lugar_id=lugar_id)

        if self.request.query_params.get('mis_checkins') == 'true' and self.request.user.is_authenticated:
            qs = qs.filter(explorador=self.request.user)

        return qs

    def create(self, request, *args, **kwargs):
        # Aquí creo la pernocta, agrupo el viaje y evalúo si se desbloqueó algún trofeo para notificarlo
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        checkin = serializer.save(explorador=self.request.user)
        agrupar_checkin_en_viaje(checkin)
        from viajes.services import verificar_y_desbloquear_trofeos
        nuevos_trofeos = verificar_y_desbloquear_trofeos(self.request.user)

        if checkin.comentario_publico:
            Publicacion.objects.create(
                autor=self.request.user,
                contenido=checkin.comentario_publico,
                imagen=checkin.foto,
                lugar=checkin.lugar,
                visibilidad='publico'
            )

        datos = CheckInSerializer(checkin, context={'request': request}).data
        return Response({
            'checkin': datos,
            'nuevos_trofeos': nuevos_trofeos
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='reciente-24h')
    def reciente_24h(self, request):
        # Aquí consulto el check-in más reciente del explorador en las últimas 24 horas
        from django.utils import timezone
        from datetime import timedelta
        hace_24h = timezone.now() - timedelta(hours=24)
        ultimo = CheckIn.objects.filter(
            explorador=request.user,
            fecha_llegada__gte=hace_24h
        ).order_by('-fecha_llegada').first()
        if ultimo:
            return Response(CheckInSerializer(ultimo, context={'request': request}).data)
        return Response(None)

    def perform_destroy(self, instance):
        es_admin = getattr(self.request.user, 'es_admin', False) or getattr(self.request.user, 'is_staff', False) or getattr(self.request.user, 'is_superuser', False) or self.request.user.username == 'admin'
        if instance.explorador == self.request.user or es_admin:
            explorador = instance.explorador
            viaje = instance.viaje
            instance.delete()
            if viaje:
                from viajes.services import recalcular_viaje
                recalcular_viaje(viaje)
            if explorador:
                from viajes.services import verificar_y_desbloquear_trofeos
                verificar_y_desbloquear_trofeos(explorador)
        else:
            raise permissions.PermissionDenied('No tienes permiso para eliminar esta pernocta/check-in.')

class ComentarioViewSet(viewsets.ModelViewSet):
    # Aquí gestiono la edición y eliminación de comentarios con permisos para autor y administradores
    serializer_class = ComentarioPublicacionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = ComentarioPublicacion.objects.all().select_related('autor', 'publicacion')

    def perform_update(self, serializer):
        comment = self.get_object()
        es_admin = getattr(self.request.user, 'es_admin', False) or getattr(self.request.user, 'is_staff', False) or getattr(self.request.user, 'is_superuser', False)
        if comment.autor == self.request.user or es_admin:
            serializer.save()
        else:
            raise permissions.PermissionDenied('No tienes permiso para editar este comentario.')

    def perform_destroy(self, instance):
        es_admin = getattr(self.request.user, 'es_admin', False) or getattr(self.request.user, 'is_staff', False) or getattr(self.request.user, 'is_superuser', False)
        if instance.autor == self.request.user or es_admin:
            instance.delete()
        else:
            raise permissions.PermissionDenied('No tienes permiso para eliminar este comentario.')
