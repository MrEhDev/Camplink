# Aquí configuro las rutas URL para la Guía del Nómada (artículos) y el Taller Nómada (foro comunitario).

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ArticuloGuiaViewSet, TemaTallerViewSet

router = DefaultRouter()
router.register(r'guia', ArticuloGuiaViewSet, basename='guia-nomada')
router.register(r'taller', TemaTallerViewSet, basename='taller-nomada')

urlpatterns = [
    path('', include(router.urls)),
]