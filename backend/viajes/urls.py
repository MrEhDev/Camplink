# Aquí configuro las rutas URL de viajes, estadísticas acumuladas y vitrina de trofeos.

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ViajeViewSet, mis_estadisticas_vista, vitrina_trofeos_vista, destacar_trofeos_vista

router = DefaultRouter()
router.register(r'rutas', ViajeViewSet, basename='rutas')
router.register(r'viajes', ViajeViewSet, basename='viajes')

urlpatterns = [
    path('estadisticas/', mis_estadisticas_vista, name='mis-estadisticas'),
    path('mis-estadisticas/', mis_estadisticas_vista, name='mis-estadisticas-alias'),
    path('trofeos/', vitrina_trofeos_vista, name='vitrina-trofeos'),
    path('trofeos/destacar/', destacar_trofeos_vista, name='destacar-trofeos'),
    path('', include(router.urls)),
]
