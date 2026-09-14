# Aquí configuro las rutas URL de la app exploradores para autenticación,
# perfiles, solicitudes de seguimiento y grupos de privacidad.

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    recuperar_password_vista,
    csrf_token_vista,
    registro_vista,
    activar_cuenta_vista,
    reenviar_codigo_vista,
    login_vista,
    logout_vista,
    mi_perfil_vista,
    ExploradorViewSet,
    GrupoPrivacidadViewSet,
    solicitar_seguimiento_vista,
    responder_seguimiento_vista,
    companeros_vista,
    seguidores_y_siguiendo_vista,
    notificaciones_vista,
    forzar_notificacion_prueba_vista,
    cambiar_password_vista,
    webpush_vapid_key_vista,
    webpush_subscribir_vista
)

# Enrutador REST para exploradores y grupos
router = DefaultRouter()
router.register(r'lista', ExploradorViewSet, basename='exploradores')
router.register(r'grupos', GrupoPrivacidadViewSet, basename='grupos-privacidad')

urlpatterns = [
    # Endpoints de autenticación y sesión tradicional
    path('csrf/', csrf_token_vista, name='csrf-token'),
    path('recuperar-password/', recuperar_password_vista, name='recuperar-password'),
    path('registro/', registro_vista, name='explorador-registro'),
    path('activar-cuenta/', activar_cuenta_vista, name='activar-cuenta'),
    path('reenviar-codigo/', reenviar_codigo_vista, name='reenviar-codigo'),
    path('login/', login_vista, name='explorador-login'),
    path('logout/', logout_vista, name='explorador-logout'),
    path('perfil/', mi_perfil_vista, name='explorador-perfil'),
    path('cambiar-password/', cambiar_password_vista, name='cambiar-password'),
    path('companeros/', companeros_vista, name='explorador-companeros'),
    path('seguidores-siguiendo/', seguidores_y_siguiendo_vista, name='explorador-seguidores-siguiendo'),
    path('notificaciones/', notificaciones_vista, name='explorador-notificaciones'),
    path('notificaciones/probar/', forzar_notificacion_prueba_vista, name='explorador-notificaciones-probar'),
    path('webpush-vapid-key/', webpush_vapid_key_vista, name='webpush-vapid-key'),
    path('webpush-subscribir/', webpush_subscribir_vista, name='webpush-subscribir'),

    # Seguimiento y amistades entre exploradores
    path('seguir/<int:usuario_id>/', solicitar_seguimiento_vista, name='solicitar-seguimiento'),
    path('seguimiento/<int:relacion_id>/responder/', responder_seguimiento_vista, name='responder-seguimiento'),

    # Rutas del router DRF
    path('', include(router.urls)),
]
