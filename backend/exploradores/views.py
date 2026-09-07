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
from .models import Explorador, GrupoPrivacidad, RelacionSeguimiento, Notificacion
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
    crear_notificacion(
        usuario_destino=seguido,
        usuario_origen=request.user,
        tipo='seguimiento',
        titulo='¡Nuevo Compañero de Ruta!',
        mensaje=f'{request.user.username.capitalize()} ha comenzado a seguirte y ahora sois compañeros de ruta.',
        enlace=f'/explorador/{request.user.id}'
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


def crear_notificacion(usuario_destino, usuario_origen, tipo, titulo, mensaje, enlace=''):
    try:
        if usuario_destino and (not usuario_origen or usuario_destino.id != usuario_origen.id):
            return Notificacion.objects.create(
                usuario_destino=usuario_destino,
                usuario_origen=usuario_origen,
                tipo=tipo,
                titulo=titulo,
                mensaje=mensaje,
                enlace=enlace
            )
    except Exception as e:
        print(f"Error creando notificacion: {e}")
    return None


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def seguidores_y_siguiendo_vista(request):
    usuario = request.user
    
    # Seguidores: quién sigue a este usuario
    seguidores_ids = RelacionSeguimiento.objects.filter(seguido=usuario, estado='aceptada').values_list('seguidor_id', flat=True)
    seguidores = Explorador.objects.filter(id__in=seguidores_ids)
    
    # Siguiendo: a quién sigue este usuario
    siguiendo_ids = RelacionSeguimiento.objects.filter(seguidor=usuario, estado='aceptada').values_list('seguido_id', flat=True)
    siguiendo = Explorador.objects.filter(id__in=siguiendo_ids)
    
    context = {'request': request}
    return Response({
        'seguidores': ExploradorPerfilSerializer(seguidores, many=True, context=context).data,
        'siguiendo': ExploradorPerfilSerializer(siguiendo, many=True, context=context).data,
        'total_seguidores': seguidores.count(),
        'total_siguiendo': siguiendo.count(),
    })


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def notificaciones_vista(request):
    usuario = request.user
    if request.method == 'GET':
        notifs_qs = Notificacion.objects.filter(usuario_destino=usuario)
        if not notifs_qs.exists():
            # Crear notificaciones de bienvenida del sistema para nuevos o existentes usuarios
            Notificacion.objects.create(
                usuario_destino=usuario,
                tipo='sistema',
                titulo='¡Bienvenido a Camplink! 🚐✨',
                mensaje='Tu plataforma camper & autocaravanista está lista. Descubre lugares de pernocta, comparte vivencias en el Diario y conecta con otros nómadas.',
                enlace='/descubre'
            )
            Notificacion.objects.create(
                usuario_destino=usuario,
                tipo='trofeo',
                titulo='🏆 Vitrina de Trofeos Activada',
                mensaje='¡Empieza a registrar pernoctas y planificar rutas para desbloquear medallas desde Madera hasta Platino!',
                enlace='/perfil'
            )
        notifs = Notificacion.objects.filter(usuario_destino=usuario).order_by('-fecha_creacion')[:50]
        no_leidas = Notificacion.objects.filter(usuario_destino=usuario, leida=False).count()
        serializer = NotificacionSerializer(notifs, many=True, context={'request': request})
        return Response({
            'notificaciones': serializer.data,
            'no_leidas': no_leidas
        })
    elif request.method == 'POST':
        notif_id = request.data.get('notificacion_id')
        if notif_id:
            Notificacion.objects.filter(id=notif_id, usuario_destino=usuario).update(leida=True)
        else:
            Notificacion.objects.filter(usuario_destino=usuario, leida=False).update(leida=True)
        return Response({'mensaje': 'Notificaciones actualizadas con éxito.', 'no_leidas': 0})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def forzar_notificacion_prueba_vista(request):
    usuario = request.user
    tipo = request.data.get('tipo', 'reaccion')
    
    ejemplos = {
        'reaccion': ('¡Reacción a tu vivencia!', 'A Marta le ha gustado (🔥 Buena ruta) tu publicación en el Diario de Ruta.', '/diario'),
        'comentario': ('¡Nuevo comentario en tu vivencia!', 'Carlos comentó: "¡Qué rincón tan increíble para ver las estrellas! ⛺"', '/diario'),
        'seguimiento': ('¡Nuevo Compañero de Ruta!', 'Elena ha comenzado a seguirte y ahora sois compañeros de ruta.', f'/explorador/{usuario.id}'),
        'trofeo': ('🏆 ¡Trofeo Desbloqueado!', '¡Has conseguido la medalla de Madera: Primer Paso Nómada!', '/perfil')
    }
    
    titulo, mensaje, enlace = ejemplos.get(tipo, ejemplos['reaccion'])
    
    notif = Notificacion.objects.create(
        usuario_destino=usuario,
        tipo=tipo,
        titulo=titulo,
        mensaje=mensaje,
        enlace=enlace
    )
    
    no_leidas = Notificacion.objects.filter(usuario_destino=usuario, leida=False).count()
    serializer = NotificacionSerializer(notif, context={'request': request})
    return Response({
        'mensaje': 'Notificación de prueba enviada con éxito.',
        'notificacion': serializer.data,
        'no_leidas': no_leidas
    }, status=status.HTTP_201_CREATED)
