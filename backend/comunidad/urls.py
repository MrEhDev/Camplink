# backend/comunidad/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoriaPublicacionViewSet,
    PublicacionTallerViewSet,
    ImagenGaleriaPublicacionViewSet,
    ArticuloGuiaViewSet,
    TemaTallerViewSet,
    subir_imagen_contenido
)

router = DefaultRouter()
router.register(r'categorias', CategoriaPublicacionViewSet, basename='comunidad-categorias')
router.register(r'publicaciones', PublicacionTallerViewSet, basename='comunidad-publicaciones')
router.register(r'fotos-galeria', ImagenGaleriaPublicacionViewSet, basename='comunidad-fotos-galeria')
# Retrocompatibilidad
router.register(r'guia', ArticuloGuiaViewSet, basename='guia-nomada')
router.register(r'taller', TemaTallerViewSet, basename='taller-nomada')

urlpatterns = [
    path('subir-imagen/', subir_imagen_contenido, name='comunidad-subir-imagen'),
    path('', include(router.urls)),
]
