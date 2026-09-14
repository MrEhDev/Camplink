# backend/comunidad/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from exploradores.models import Explorador, Notificacion
from .models import (
    CategoriaPublicacion, PublicacionTaller,
    ImagenGaleriaPublicacion, ComentarioPublicacion,
    ArticuloGuia, TemaTaller, RespuestaTaller
)
from .serializers import (
    CategoriaPublicacionSerializer, PublicacionTallerSerializer,
    ImagenGaleriaPublicacionSerializer, ComentarioPublicacionSerializer,
    ArticuloGuiaSerializer, TemaTallerSerializer, RespuestaTallerSerializer
)


class CategoriaPublicacionViewSet(viewsets.ModelViewSet):
    queryset = CategoriaPublicacion.objects.all()
    serializer_class = CategoriaPublicacionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        user = self.request.user
        es_admin = user.is_staff or user.is_superuser or getattr(user, 'rol', '') == 'administrador'
        serializer.save(es_fija=es_admin)


class PublicacionTallerViewSet(viewsets.ModelViewSet):
    queryset = PublicacionTaller.objects.all().select_related(
        'autor', 'categoria'
    ).prefetch_related(
        'galeria',
        'comentarios__autor'
    )
    serializer_class = PublicacionTallerSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        es_admin = user.is_authenticated and (user.is_staff or user.is_superuser or getattr(user, 'rol', '') == 'administrador')
        qs = super().get_queryset()

        estado = self.request.query_params.get('estado')
        if es_admin:
            if estado:
                qs = qs.filter(estado=estado)
        else:
            if user.is_authenticated:
                qs = qs.filter(Q(estado='aprobado') | Q(autor=user))
            else:
                qs = qs.filter(estado='aprobado')

        cat = self.request.query_params.get('categoria')
        if cat and cat != 'todos':
            if str(cat).isdigit():
                qs = qs.filter(categoria_id=int(cat))
            else:
                qs = qs.filter(Q(categoria__slug=cat) | Q(categoria__nombre__iexact=cat))

        if self.request.query_params.get('es_guia') == 'true':
            qs = qs.filter(es_guia_oficial=True)

        if self.request.query_params.get('destacado') == 'true':
            qs = qs.filter(destacado=True)

        if self.request.query_params.get('tiene_stl') == 'true' or self.request.query_params.get('tiene_3d') == 'true':
            qs = qs.exclude(archivo_descargable='').exclude(archivo_descargable=None)

        q = self.request.query_params.get('q')
        if q:
            q_clean = q.strip()
            qs = qs.filter(
                Q(titulo__icontains=q_clean) |
                Q(resumen__icontains=q_clean) |
                Q(contenido__icontains=q_clean) |
                Q(archivo_descargable__icontains=q_clean) |
                Q(autor__username__icontains=q_clean)
            )

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        es_admin = user.is_staff or user.is_superuser or getattr(user, 'rol', '') == 'administrador'
        estado = 'aprobado' if es_admin else 'pendiente'

        nueva_cat = self.request.data.get('nueva_categoria')
        categoria_instancia = None
        if nueva_cat and str(nueva_cat).strip():
            categoria_instancia, _ = CategoriaPublicacion.objects.get_or_create(
                nombre=str(nueva_cat).strip(),
                defaults={'es_fija': False, 'color': '#F97316', 'icono': 'Hammer'}
            )

        if categoria_instancia:
            pub = serializer.save(autor=user, estado=estado, categoria=categoria_instancia)
        else:
            pub = serializer.save(autor=user, estado=estado)

        if estado == 'pendiente':
            admins = Explorador.objects.filter(
                Q(rol='administrador') | Q(is_staff=True) | Q(is_superuser=True)
            ).distinct()
            for admin_user in admins:
                if admin_user != user:
                    Notificacion.objects.create(
                        usuario_destino=admin_user,
                        usuario_origen=user,
                        tipo='taller',
                        titulo=f'🛠️ Nueva publicación pendiente en Taller Camplink',
                        mensaje=f'{user.username.capitalize()} ha redactado "{pub.titulo}". Requiere tu revisión y aprobación para ser pública.',
                        enlace=f'/taller?revision={pub.id}'
                    )

    def perform_update(self, serializer):
        user = self.request.user
        es_admin = user.is_staff or user.is_superuser or getattr(user, 'rol', '') == 'administrador'
        instance = serializer.instance
        if instance.autor != user and not es_admin:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permiso para editar esta publicación.')
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        es_admin = user.is_staff or user.is_superuser or getattr(user, 'rol', '') == 'administrador'
        if not es_admin:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Solo los administradores pueden eliminar publicaciones del taller.')
        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def aprobar(self, request, pk=None):
        user = request.user
        es_admin = user.is_staff or user.is_superuser or getattr(user, 'rol', '') == 'administrador'
        if not es_admin:
            return Response({'error': 'Solo los administradores pueden aprobar publicaciones.'}, status=status.HTTP_403_FORBIDDEN)

        pub = self.get_object()
        pub.estado = 'aprobado'
        pub.save()

        if pub.autor != user:
            Notificacion.objects.create(
                usuario_destino=pub.autor,
                usuario_origen=user,
                tipo='sistema',
                titulo='Tu publicacion en Taller Camplink ha sido aprobada',
                mensaje=f'Tu aportacion "{pub.titulo}" ya es publica en el Taller Camplink.',
                enlace=f'/taller?publicacion={pub.id}'
            )

        serializer = self.get_serializer(pub)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def rechazar(self, request, pk=None):
        user = request.user
        es_admin = user.is_staff or user.is_superuser or getattr(user, 'rol', '') == 'administrador'
        if not es_admin:
            return Response({'error': 'Solo los administradores pueden rechazar publicaciones.'}, status=status.HTTP_403_FORBIDDEN)

        pub = self.get_object()
        pub.estado = 'rechazado'
        motivo = request.data.get('motivo', 'No cumple con las normas del Taller Camplink.')
        pub.motivo_rechazo = motivo
        pub.save()

        if pub.autor != user:
            Notificacion.objects.create(
                usuario_destino=pub.autor,
                usuario_origen=user,
                tipo='sistema',
                titulo='Publicacion rechazada en Taller Camplink',
                mensaje=f'Tu publicacion "{pub.titulo}" no fue aprobada. Motivo: {motivo}',
                enlace='/taller'
            )

        serializer = self.get_serializer(pub)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def pendientes(self, request):
        user = request.user
        es_admin = user.is_staff or user.is_superuser or getattr(user, 'rol', '') == 'administrador'
        if not es_admin:
            return Response({'error': 'Solo los administradores pueden consultar publicaciones pendientes.'}, status=status.HTTP_403_FORBIDDEN)
        qs = PublicacionTaller.objects.filter(estado='pendiente').order_by('-fecha_creacion')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def comentar(self, request, pk=None):
        pub = self.get_object()
        mensaje = request.data.get('mensaje', '').strip()
        if not mensaje:
            return Response({'error': 'El mensaje no puede estar vacio.'}, status=status.HTTP_400_BAD_REQUEST)

        adjunto = request.FILES.get('archivo_adjunto')
        comentario = ComentarioPublicacion.objects.create(
            publicacion=pub,
            autor=request.user,
            mensaje=mensaje,
            archivo_adjunto=adjunto
        )

        if pub.autor != request.user:
            Notificacion.objects.create(
                usuario_destino=pub.autor,
                usuario_origen=request.user,
                tipo='taller',
                titulo=f'💬 Nuevo comentario en tu brico "{pub.titulo}"',
                mensaje=f'{request.user.username.capitalize()} ha comentado en tu publicación del Taller: "{mensaje[:60]}..."',
                enlace=f'/taller?publicacion={pub.id}'
            )

        serializer = ComentarioPublicacionSerializer(comentario)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch', 'put'], permission_classes=[permissions.IsAuthenticated],
            url_path='comentarios/(?P<comentario_id>[^/.]+)')
    def editar_comentario(self, request, pk=None, comentario_id=None):
        pub = self.get_object()
        try:
            comentario = ComentarioPublicacion.objects.get(id=comentario_id, publicacion=pub)
        except ComentarioPublicacion.DoesNotExist:
            return Response({'error': 'Comentario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        es_admin = request.user.is_staff or request.user.is_superuser or getattr(request.user, 'rol', '') == 'administrador'
        if comentario.autor != request.user and not es_admin:
            return Response({'error': 'No tienes permiso para editar este comentario.'}, status=status.HTTP_403_FORBIDDEN)

        mensaje = request.data.get('mensaje', '').strip()
        if not mensaje:
            return Response({'error': 'El mensaje no puede estar vacío.'}, status=status.HTTP_400_BAD_REQUEST)

        comentario.mensaje = mensaje
        comentario.save()
        serializer = ComentarioPublicacionSerializer(comentario)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated],
            url_path='comentarios/(?P<comentario_id>[^/.]+)/eliminar')
    def eliminar_comentario(self, request, pk=None, comentario_id=None):
        pub = self.get_object()
        try:
            comentario = ComentarioPublicacion.objects.get(id=comentario_id, publicacion=pub)
        except ComentarioPublicacion.DoesNotExist:
            return Response({'error': 'Comentario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        es_admin = request.user.is_staff or request.user.is_superuser or getattr(request.user, 'rol', '') == 'administrador'
        if comentario.autor != request.user and pub.autor != request.user and not es_admin:
            return Response({'error': 'No tienes permiso para eliminar este comentario.'}, status=status.HTTP_403_FORBIDDEN)

        comentario.delete()
        return Response({'eliminado': True, 'total': pub.comentarios.count()}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def subir_galeria(self, request, pk=None):
        pub = self.get_object()
        if pub.autor != request.user and not request.user.is_staff:
            return Response({'error': 'No tienes permiso para administrar esta galeria.'}, status=status.HTTP_403_FORBIDDEN)

        fotos = request.FILES.getlist('imagenes') or request.FILES.getlist('imagen')
        creadas = []
        for index, f in enumerate(fotos):
            img_obj = ImagenGaleriaPublicacion.objects.create(
                publicacion=pub,
                imagen=f,
                orden=pub.galeria.count() + index
            )
            creadas.append(ImagenGaleriaPublicacionSerializer(img_obj).data)

        return Response({'creadas': creadas, 'total': pub.galeria.count()}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated],
            url_path='galeria/(?P<imagen_id>[^/.]+)')
    def eliminar_imagen_galeria(self, request, pk=None, imagen_id=None):
        # Aqui permito eliminar una foto concreta de la galeria por su ID, solo al autor o admin
        pub = self.get_object()
        es_admin = request.user.is_staff or request.user.is_superuser or getattr(request.user, 'rol', '') == 'administrador'
        if pub.autor != request.user and not es_admin:
            return Response({'error': 'No tienes permiso para eliminar esta imagen.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            img = ImagenGaleriaPublicacion.objects.get(id=imagen_id, publicacion=pub)
            img.delete()
            return Response({'eliminada': True, 'total': pub.galeria.count()}, status=status.HTTP_200_OK)
        except ImagenGaleriaPublicacion.DoesNotExist:
            return Response({'error': 'Imagen no encontrada.'}, status=status.HTTP_404_NOT_FOUND)


class ComentarioPublicacionViewSet(viewsets.ModelViewSet):
    # Gestión directa de comentarios de publicaciones del Taller
    serializer_class = ComentarioPublicacionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = ComentarioPublicacion.objects.all()

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()
        es_admin = user.is_staff or user.is_superuser or getattr(user, 'rol', '') == 'administrador'
        if instance.autor != user and not es_admin:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permiso para editar este comentario.')
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        es_admin = user.is_staff or user.is_superuser or getattr(user, 'rol', '') == 'administrador'
        if instance.autor != user and instance.publicacion.autor != user and not es_admin:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permiso para eliminar este comentario.')
        instance.delete()


class ImagenGaleriaPublicacionViewSet(viewsets.ModelViewSet):
    # Aqui gestiono el CRUD individual de fotos de galeria de publicaciones del Taller
    serializer_class = ImagenGaleriaPublicacionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = ImagenGaleriaPublicacion.objects.all()

    def perform_create(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        es_admin = user.is_staff or user.is_superuser or getattr(user, 'rol', '') == 'administrador'
        if instance.publicacion.autor != user and not es_admin:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permiso para eliminar esta imagen de galeria.')
        instance.delete()


# Vistas Legacy
class PermisoSoloAdminOReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and (request.user.is_staff or getattr(request.user, 'rol', '') == 'administrador')


class ArticuloGuiaViewSet(viewsets.ModelViewSet):
    queryset = ArticuloGuia.objects.all()
    serializer_class = ArticuloGuiaSerializer
    permission_classes = [PermisoSoloAdminOReadOnly]
    lookup_field = 'slug'

    def get_queryset(self):
        qs = ArticuloGuia.objects.all()
        cat = self.request.query_params.get('categoria')
        if cat:
            qs = qs.filter(categoria=cat)
        if self.request.query_params.get('destacado') == 'true':
            qs = qs.filter(destacado=True)
        return qs

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)


class TemaTallerViewSet(viewsets.ModelViewSet):
    queryset = TemaTaller.objects.all().prefetch_related('respuestas__autor')
    serializer_class = TemaTallerSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = TemaTaller.objects.all()
        cat = self.request.query_params.get('categoria')
        if cat:
            qs = qs.filter(categoria=cat)
        return qs;

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def responder(self, request, pk=None):
        tema = self.get_object()
        mensaje = request.data.get('mensaje', '').strip()
        if not mensaje:
            return Response({'error': 'El mensaje no puede estar vacio.'}, status=status.HTTP_400_BAD_REQUEST)

        archivo = request.FILES.get('archivo_adjunto', None)
        respuesta = RespuestaTaller.objects.create(
            tema=tema,
            autor=request.user,
            mensaje=mensaje,
            archivo_adjunto=archivo
        )
        serializer = RespuestaTallerSerializer(respuesta)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.conf import settings
import uuid
import os


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def subir_imagen_contenido(request):
    """
    Sube una imagen para ser insertada directamente en el cuerpo/texto de una publicación (Markdown).
    Retorna la URL accesible de la imagen guardada.
    """
    archivo = request.FILES.get('imagen')
    if not archivo:
        return Response({'error': 'No se ha adjuntado ninguna imagen.'}, status=status.HTTP_400_BAD_REQUEST)

    ext = os.path.splitext(archivo.name)[1].lower()
    if ext not in ['.jpg', '.jpeg', '.png', '.webp', '.gif']:
        return Response({'error': 'Formato no compatible. Por favor sube JPG, PNG o WebP.'}, status=status.HTTP_400_BAD_REQUEST)

    nombre_archivo = f"taller_contenido/{uuid.uuid4().hex}{ext}"
    ruta_guardada = default_storage.save(nombre_archivo, archivo)
    url_completa = request.build_absolute_uri(settings.MEDIA_URL + ruta_guardada)

    return Response({
        'url': url_completa,
        'ruta': settings.MEDIA_URL + ruta_guardada,
        'nombre_original': archivo.name
    }, status=status.HTTP_201_CREATED)

