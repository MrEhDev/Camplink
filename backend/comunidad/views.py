# Aquí implemento las vistas para la Guía del Nómada (exclusiva de administradores para redactar)
# y el Taller Nómada (foro comunitario con intercambio de conocimientos y piezas 3D .stl).

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ArticuloGuia, TemaTaller, RespuestaTaller
from .serializers import ArticuloGuiaSerializer, TemaTallerSerializer, RespuestaTallerSerializer

class PermisoSoloAdminOReadOnly(permissions.BasePermission):
    # Aquí garantizo que solo los administradores puedan crear o modificar artículos de la Guía del Nómada
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and (request.user.is_staff or request.user.rol == 'administrador')


class ArticuloGuiaViewSet(viewsets.ModelViewSet):
    # Aquí expongo la Guía del Nómada con filtros por categoría o artículos destacados
    queryset = ArticuloGuia.objects.all()
    serializer_class = ArticuloGuiaSerializer
    permission_classes = [PermisoSoloAdminOReadOnly]
    lookup_field = 'slug'

    def get_queryset(self):
        # Aquí permito filtrar artículos por temática o relevancia en portada
        qs = ArticuloGuia.objects.all()
        cat = self.request.query_params.get('categoria')
        if cat:
            qs = qs.filter(categoria=cat)
        if self.request.query_params.get('destacado') == 'true':
            qs = qs.filter(destacado=True)
        return qs

    def perform_create(self, serializer):
        # Aquí guardo al administrador autenticado como autor del artículo
        serializer.save(autor=self.request.user)


class TemaTallerViewSet(viewsets.ModelViewSet):
    # Aquí gestiono los temas del Taller Nómada, permitiendo filtrar por Mantenimiento, Bricolaje o Piezas 3D
    queryset = TemaTaller.objects.all().prefetch_related('respuestas__autor')
    serializer_class = TemaTallerSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Aquí aplico los filtros según la categoría del foro seleccionada
        qs = TemaTaller.objects.all()
        cat = self.request.query_params.get('categoria')
        if cat:
            qs = qs.filter(categoria=cat)
        return qs

    def perform_create(self, serializer):
        # Aquí guardo al explorador autenticado como creador del hilo
        serializer.save(autor=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def responder(self, request, pk=None):
        # Aquí permito a un explorador enviar una respuesta o aportar soluciones al hilo
        tema = self.get_object()
        mensaje = request.data.get('mensaje', '').strip()
        if not mensaje:
            return Response({'error': 'El mensaje no puede estar vacío.'}, status=status.HTTP_400_BAD_REQUEST)

        archivo = request.FILES.get('archivo_adjunto', None)

        respuesta = RespuestaTaller.objects.create(
            tema=tema,
            autor=request.user,
            mensaje=mensaje,
            archivo_adjunto=archivo
        )
        serializer = RespuestaTallerSerializer(respuesta)
        return Response(serializer.data, status=status.HTTP_201_CREATED)