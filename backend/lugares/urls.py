# Aquí configuro las rutas URL para la gestión de Lugares de pernocta,
# valoraciones camper, descargas .ics y radar geográfico de proximidad.

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LugarViewSet, lugares_cercanos_vista

router = DefaultRouter()
router.register(r'puntos', LugarViewSet, basename='lugares')

urlpatterns = [
    path('cercanos/', lugares_cercanos_vista, name='lugares-cercanos'),
    path('', include(router.urls)),
]