# Aquí configuro las rutas URL de viajes, estadísticas acumuladas y vitrina de trofeos.

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ViajeViewSet, mis_estadisticas_vista, vitrina_trofeos_vista, destacar_trofeos_vista,
    compartir_viaje, mis_invitaciones_recibidas, aceptar_invitacion, rechazar_invitacion, buscar_exploradores
)

router = DefaultRouter()
router.register(r'rutas', ViajeViewSet, basename='rutas')
router.register(r'viajes', ViajeViewSet, basename='viajes')

urlpatterns = [
    path('estadisticas/', mis_estadisticas_vista, name='mis-estadisticas'),
    path('mis-estadisticas/', mis_estadisticas_vista, name='mis-estadisticas-alias'),
    path('trofeos/', vitrina_trofeos_vista, name='vitrina-trofeos'),
    path('trofeos/destacar/', destacar_trofeos_vista, name='destacar-trofeos'),
    
    # Compartir viajes e invitaciones
    path('invitaciones/', mis_invitaciones_recibidas, name='mis-invitaciones'),
    path('invitaciones/<int:inv_id>/aceptar/', aceptar_invitacion, name='aceptar-invitacion'),
    path('invitaciones/<int:inv_id>/rechazar/', rechazar_invitacion, name='rechazar-invitacion'),
    path('viajes/<int:viaje_id>/compartir/', compartir_viaje, name='compartir-viaje'),
    path('rutas/<int:viaje_id>/compartir/', compartir_viaje, name='compartir-ruta'),
    path('exploradores/buscar/', buscar_exploradores, name='buscar-exploradores'),
    
    path('', include(router.urls)),
]
