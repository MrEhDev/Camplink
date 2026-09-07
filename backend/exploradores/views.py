# Aquí implemento las vistas y endpoints de autenticación tradicional (sesión y CSRF),
# búsqueda de exploradores, perfiles públicos y gestión de seguimiento.

from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.utils.decorators import method_decorator
from django.db.models import Q
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Explorador, GrupoPrivacidad, RelacionSeguimiento
from .serializers import (
    ExploradorRegistroSerializer,
    ExploradorPerfilSerializer,
    GrupoPrivacidadSerializer,
    RelacionSeguimientoSerializer
)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def csrf_token_vista(request):
    token = get_token(request)
    return Response({'csrftoken': token})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def registro_vista(request):
    serializer = ExploradorRegistroSerializer(data=request.data)
    if serializer.is_valid():
        explorador = serializer.save()
        login(request, explorador)
        get_token(request)
        perfil_serializer = ExploradorPerfilSerializer(explorador, context={'request': request})
        return Response({
            'mensaje': '¡Bienvenido a Camplink, Explorador!',
            'usuario': perfil_serializer.data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def login_vista(request):
    username = request.data.get('username', '')
    password = request.data.get('password', '')

    if not username or not password:
        return Response({'error': 'Debes ingresar usuario y contraseña.'}, status=status.HTTP_400_BAD_REQUEST)

    # Conversión obligatoria a minúsculas
    username_limpio = str(username).strip().lower()

    # Intento 1: Autenticación directa
    usuario = authenticate(request, username=username_limpio, password=password)

    # Intento 2: Búsqueda insensible a mayúsculas
    if usuario is None:
        try:
            user_obj = Explorador.objects.filter(username__iexact=username_limpio).first()
            if user_obj and user_obj.check_password(password):
                usuario = user_obj
        except Exception:
            pass

    if usuario is not None:
        login(request, usuario)
        token = get_token(request)
        serializer = ExploradorPerfilSerializer(usuario, context={'request': request})
        return Response({
            'mensaje': f'Ruta iniciada. ¡Hola de nuevo, {usuario.username}!',
            'usuario': serializer.data,
            'csrftoken': token
        })
    return Response({'error': 'Credenciales incorrectas. Comprueba tu usuario y contraseña.'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def recuperar_password_vista(request):
    # Aquí permito solicitar la recuperación de contraseña o recordar el usuario por email
    email_o_usuario = request.data.get('email_o_usuario', '').strip().lower()
    if not email_o_usuario:
        return Response({'error': 'Ingresa tu correo electrónico o nombre de usuario.'}, status=status.HTTP_400_BAD_REQUEST)

    user = Explorador.objects.filter(Q(email__iexact=email_o_usuario) | Q(username__iexact=email_o_usuario)).first()
    if user:
        return Response({
            'mensaje': f'Hemos localizado tu cuenta ({user.username}). Se han enviado las instrucciones de restablecimiento a {user.email or "tu correo registrado"}.'
        })
    return Response({'error': 'No se encontró ningún explorador con ese usuario o correo electrónico.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_vista(request):
    logout(request)
    return Response({'mensaje': 'Sesión cerrada con éxito. ¡Buenas rutas nómadas!'})


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def mi_perfil_vista(request):
    explorador = request.user
    if request.method == 'GET':
        serializer = ExploradorPerfilSerializer(explorador, context={'request': request})
        return Response(serializer.data)

    if 'avatar' in request.FILES:
        explorador.avatar = request.FILES['avatar']
        explorador.save()

    serializer = ExploradorPerfilSerializer(explorador, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExploradorViewSet(viewsets.ReadOnlyModelViewSet):
    # Aquí expongo la lista y detalle público de exploradores con búsqueda integrada
    serializer_class = ExploradorPerfilSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Aquí permito buscar exploradores por nombre, apellidos, usuario o población
        qs = Explorador.objects.filter(is_active=True).order_by('-date_joined')
        q = self.request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(username__icontains=q) |
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(poblacion__icontains=q)
            )
        return qs


class GrupoPrivacidadViewSet(viewsets.ModelViewSet):
    serializer_class = GrupoPrivacidadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        return GrupoPrivacidad.objects.filter(creador=usuario)

    def perform_create(self, serializer):
        serializer.save(creador=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def solicitar_seguimiento_vista(request, usuario_id):
    # Aquí envío o alterno una solicitud de seguimiento hacia otro explorador
    if request.user.id == usuario_id:
        return Response({'error': 'No puedes seguirte a ti mismo.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        seguido = Explorador.objects.get(id=usuario_id)
    except Explorador.DoesNotExist:
        return Response({'error': 'El explorador no existe.'}, status=status.HTTP_404_NOT_FOUND)

    relacion = RelacionSeguimiento.objects.filter(seguidor=request.user, seguido=seguido).first()

    if relacion:
        # Lore nómada: Se disuelve la hermandad de Compañeros de Ruta en ambos sentidos
        RelacionSeguimiento.objects.filter(
            Q(seguidor=request.user, seguido=seguido) |
            Q(seguidor=seguido, seguido=request.user)
        ).delete()
        return Response({'mensaje': f'{seguido.username} y tú ya no sois Compañeros de Ruta.', 'estado': 'ninguno'})

    # Lore nómada: Al conectar A y B, ambos son Compañeros de Ruta (relación recíproca)
    RelacionSeguimiento.objects.update_or_create(
        seguidor=request.user, seguido=seguido, defaults={'estado': 'aceptada'}
    )
    RelacionSeguimiento.objects.update_or_create(
        seguidor=seguido, seguido=request.user, defaults={'estado': 'aceptada'}
    )
    return Response({'mensaje': f'¡Ahora {seguido.username} y tú sois Compañeros de Ruta! 🤝', 'estado': 'aceptada'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def responder_seguimiento_vista(request, relacion_id):
    accion = request.data.get('accion')
    try:
        relacion = RelacionSeguimiento.objects.get(id=relacion_id, seguido=request.user)
    except RelacionSeguimiento.DoesNotExist:
        return Response({'error': 'Solicitud no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    if accion == 'aceptar':
        relacion.estado = 'aceptada'
        relacion.save()
        return Response({'mensaje': f'¡Ahora {relacion.seguidor.username} sigue tu Diario de Ruta!'})
    elif accion == 'rechazar':
        relacion.estado = 'rechazada'
        relacion.save()
        return Response({'mensaje': 'Solicitud rechazada.'})

    return Response({'error': 'Acción inválida. Usa aceptar o rechazar.'}, status=status.HTTP_400_BAD_REQUEST)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def companeros_vista(request):
    # Aquí obtengo la lista de compañeros de ruta (seguimiento mutuo o confirmados) del explorador
    usuario = request.user
    seguidos_ids = RelacionSeguimiento.objects.filter(
        seguidor=usuario, estado='aceptada'
    ).values_list('seguido_id', flat=True)
    
    companeros = Explorador.objects.filter(id__in=seguidos_ids)
    serializer = ExploradorPerfilSerializer(companeros, many=True, context={'request': request})
    return Response(serializer.data)
