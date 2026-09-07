# Aquí configuro las rutas URL de la app exploradores para autenticación,
# perfiles, solicitudes de seguimiento y grupos de privacidad.

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    recuperar_password_vista,
    csrf_token_vista,
    registro_vista,
    login_vista,
    logout_vista,
    mi_perfil_vista,
    ExploradorViewSet,
    GrupoPrivacidadViewSet,
    solicitar_seguimiento_vista,
    responder_seguimiento_vista,
    companeros_vista
)

# Enrutador REST para exploradores y grupos
router = DefaultRouter()
router.register(r'lista', ExploradorViewSet, basename='exploradores')
router.register(r'grupos', GrupoPrivacidadViewSet, basename='grupos-privacidad')

urlpatterns = [
    # Endpoints de autenticación y sesión tradicional
    path('csrf/', csrf_token_vista, name='csrf-token'),
    path('registro/', registro_vista, name='explorador-registro'),
    path('login/', login_vista, name='explorador-login'),
    path('logout/', logout_vista, name='explorador-logout'),
    path('perfil/', mi_perfil_vista, name='explorador-perfil'),
    path('companeros/', companeros_vista, name='explorador-companeros'),

    # Seguimiento y amistades entre exploradores
    path('seguir/<int:usuario_id>/', solicitar_seguimiento_vista, name='solicitar-seguimiento'),
    path('seguimiento/<int:relacion_id>/responder/', responder_seguimiento_vista, name='responder-seguimiento'),

    # Rutas del router DRF
    path('', include(router.urls)),
]
