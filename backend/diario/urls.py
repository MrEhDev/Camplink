# Aquí configuro las rutas URL del Diario de Ruta (publicaciones, comentarios y check-ins).

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicacionViewSet, CheckInViewSet, ComentarioViewSet

router = DefaultRouter()
router.register(r'publicaciones', PublicacionViewSet, basename='publicaciones')
router.register(r'comentarios', ComentarioViewSet, basename='comentarios')
router.register(r'checkins', CheckInViewSet, basename='checkins')

urlpatterns = [
    path('', include(router.urls)),
]
