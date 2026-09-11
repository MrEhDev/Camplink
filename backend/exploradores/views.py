import os
import threading
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import EmailMultiAlternatives
import secrets
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
    RelacionSeguimientoSerializer,
    NotificacionSerializer
)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def csrf_token_vista(request):
    token = get_token(request)
    return Response({'csrftoken': token})



def enviar_email_transaccional(destinatario, asunto, mensaje_texto, mensaje_html=None):
    """
    Envía un correo transaccional utilizando primero la API HTTPS de Brevo (o Resend)
    si están configuradas en las variables de entorno, o fallback mediante Django SMTP.
    """
    brevo_key = os.environ.get('BREVO_API_KEY', '').strip()
    resend_key = os.environ.get('RESEND_API_KEY', '').strip()

    if brevo_key:
        try:
            import urllib.request, json
            from_email = os.environ.get('BREVO_SENDER_EMAIL', 'hola@camplinkapp.com').strip()
            from_name = os.environ.get('BREVO_SENDER_NAME', 'Camplink').strip()
            reply_to_email = os.environ.get('BREVO_REPLY_TO', 'hola@camplinkapp.com').strip()
            payload = {
                'sender': {'name': from_name, 'email': from_email},
                'replyTo': {'name': 'Camplink Soporte', 'email': reply_to_email},
                'to': [{'email': destinatario}],
                'subject': asunto,
                'textContent': mensaje_texto
            }
            if mensaje_html:
                payload['htmlContent'] = mensaje_html

            req = urllib.request.Request(
                'https://api.brevo.com/v3/smtp/email',
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'api-key': brevo_key,
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            )
            with urllib.request.urlopen(req, timeout=5) as r:
                if r.status in (200, 201):
                    print(f"[BREVO OK] Correo '{asunto}' enviado con éxito a {destinatario}")
                    return True
        except Exception as br_err:
            print(f"[ERROR BREVO] No se pudo enviar por Brevo a {destinatario}: {br_err}")

    if resend_key:
        try:
            import urllib.request, json
            payload = {
                'from': settings.DEFAULT_FROM_EMAIL,
                'to': [destinatario],
                'subject': asunto,
                'text': mensaje_texto
            }
            if mensaje_html:
                payload['html'] = mensaje_html

            req = urllib.request.Request(
                'https://api.resend.com/emails',
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'Authorization': f'Bearer {resend_key}',
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            )
            with urllib.request.urlopen(req, timeout=5) as r:
                if r.status in (200, 201):
                    print(f"[RESEND OK] Correo '{asunto}' enviado a {destinatario}")
                    return True
        except Exception as re_err:
            print(f"[ERROR RESEND] {re_err}")

    # Fallback clásico a SMTP de Django
    try:
        if mensaje_html:
            email_msg = EmailMultiAlternatives(
                subject=asunto,
                body=mensaje_texto,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[destinatario],
                reply_to=['hola@camplinkapp.com']
            )
            email_msg.attach_alternative(mensaje_html, "text/html")
            email_msg.send(fail_silently=False)
        else:
            send_mail(
                asunto,
                mensaje_texto,
                settings.DEFAULT_FROM_EMAIL,
                [destinatario],
                fail_silently=False
            )
        print(f"[SMTP OK] Correo '{asunto}' enviado con éxito a {destinatario}")
        return True
    except Exception as e:
        print(f"[ERROR SMTP] No se pudo enviar correo a {destinatario}: {e}")
        return False


def enviar_correo_verificacion(request, explorador, codigo, uid, token):
    host = request.get_host()
    scheme = 'https' if request.is_secure() or 'trycloudflare.com' in host or 'localtunnel.me' in host or 'camplinkapp.com' in host else 'http'
    enlace = f"{scheme}://{host}/?activar_token={token}&uid={uid}&email={explorador.email}"
    
    asunto = "🚐 ¡Confirma tu cuenta en Camplink!"
    dest_saludo = (explorador.first_name or explorador.username).capitalize()
    mensaje_texto = f"""¡Hola, {dest_saludo}!

Te damos la bienvenida a Camplink, la comunidad y red social de los amantes del mundo camper, caravaning y naturaleza.

Para activar tu cuenta, puedes usar tu código de confirmación de 6 dígitos:
👉 {codigo}

O si lo prefieres, pulsa en el siguiente enlace de activación directa:
{enlace}

¡Nos vemos en la ruta!
El equipo de Camplink
https://camplinkapp.com
"""
    mensaje_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #EDECE6; padding: 24px; border-radius: 16px;">
        <div style="background: #235334; color: white; padding: 24px; border-radius: 12px; text-align: center;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 12px auto; text-align: center;">
                <tr>
                    <td align="center" style="text-align: center; vertical-align: middle; background-color: #ffffff; border-radius: 50%; padding: 4px; width: 68px; height: 68px; box-shadow: 0 4px 10px rgba(0,0,0,0.18);">
                        <img src="https://camplinkapp.com/camplink-logo-mail.png?v=3" alt="Camplink" width="68" height="68" border="0" style="display: block; margin: 0 auto; width: 68px; height: 68px; max-width: 68px; max-height: 68px; border-radius: 50%; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;" />
                    </td>
                </tr>
            </table>
            <h1 style="margin: 0; font-size: 24px;">🚐 ¡Bienvenido a Camplink!</h1>
            <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">La Red Social de la Comunidad Camper</p>
        </div>
        <div style="background: white; padding: 24px; border-radius: 12px; margin-top: 16px; border: 1px solid #ddd;">
            <h2 style="color: #17241A; font-size: 18px; margin-top: 0;">Hola, {dest_saludo}:</h2>
            <p style="color: #4A5B4F; line-height: 1.5;">
                Estás a un paso de comenzar tus rutas y descubrir los mejores lugares de pernocta. Confirma tu correo para activar tu cuenta:
            </p>
            <div style="text-align: center; margin: 24px 0;">
                <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; background: #F3F4F6; color: #235334; padding: 12px 28px; border-radius: 8px; border: 2px dashed #235334;">
                    {codigo}
                </span>
                <p style="font-size: 13px; color: #6B7280; margin-top: 8px;">Introduce este código de 6 dígitos en la pantalla de registro</p>
            </div>
            <div style="text-align: center; margin: 20px 0;">
                <a href="{enlace}" style="display: inline-block; background: #235334; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 15px;">
                    O Activar Cuenta Directamente Aquí
                </a>
            </div>
        </div>
        <div style="text-align: center; margin-top: 16px; color: #7E9183; font-size: 12px;">
            © 2026 Camplink • <a href="https://camplinkapp.com" style="color: #235334; text-decoration: none;">www.camplinkapp.com</a>
        </div>
    </div>
    """

    threading.Thread(
        target=enviar_email_transaccional,
        args=(explorador.email, asunto, mensaje_texto, mensaje_html),
        daemon=True
    ).start()

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def registro_vista(request):
    email = request.data.get('email', '')
    if email:
        email = str(email).strip().lower()
        if Explorador.objects.filter(email__iexact=email).exists():
            return Response({
                'error': 'Ya existe una cuenta registrada con este correo electrónico.',
                'email': ['Ya existe una cuenta registrada con este correo electrónico.']
            }, status=status.HTTP_400_BAD_REQUEST)

    serializer = ExploradorRegistroSerializer(data=request.data)
    if serializer.is_valid():
        explorador = serializer.save()
        explorador.is_active = False
        explorador.email_verificado = False
        
        # Generar código de 6 dígitos
        codigo = f"{secrets.randbelow(900000) + 100000}"
        explorador.codigo_verificacion = codigo
        explorador.fecha_codigo_verificacion = timezone.now()
        explorador.save()

        # Generar token y uid para enlace directo
        token = default_token_generator.make_token(explorador)
        uid = urlsafe_base64_encode(force_bytes(explorador.pk))
        
        # Enviar correo de confirmación
        enviar_correo_verificacion(request, explorador, codigo, uid, token)
        
        resp_data = {
            'mensaje': '¡Cuenta creada! Te hemos enviado un correo de confirmación para activarla.',
            'requiere_verificacion': True,
            'email': explorador.email,
            'uid': uid,
        }
        if settings.DEBUG:
            resp_data['codigo_dev'] = codigo
        return Response(resp_data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def activar_cuenta_vista(request):
    email = request.data.get('email', '').strip().lower()
    codigo = request.data.get('codigo', '').strip()
    uid = request.data.get('uid', '').strip()
    token = request.data.get('token', '').strip()
    
    explorador = None
    
    # 1. Intento por enlace de verificación (uid + token)
    if uid and token:
        try:
            uid_decoded = force_str(urlsafe_base64_decode(uid))
            user = Explorador.objects.filter(pk=uid_decoded).first()
            if user and default_token_generator.check_token(user, token):
                explorador = user
        except Exception:
            explorador = None

    # 2. Intento por código numérico de 6 dígitos y email/username
    if not explorador and email and codigo:
        explorador = Explorador.objects.filter(Q(email__iexact=email) | Q(username__iexact=email), codigo_verificacion=codigo).first()

    if not explorador:
        return Response({'error': 'El código de activación o enlace es incorrecto o ha caducado.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Activar cuenta
    explorador.is_active = True
    explorador.email_verificado = True
    explorador.codigo_verificacion = ''
    explorador.save()
    
    # Iniciar sesión automáticamente
    login(request, explorador)
    token_csrf = get_token(request)
    perfil_serializer = ExploradorPerfilSerializer(explorador, context={'request': request})
    
    return Response({
        'mensaje': f'¡Cuenta activada con éxito! Bienvenido a Camplink, {explorador.username.capitalize()}.',
        'usuario': perfil_serializer.data,
        'csrftoken': token_csrf
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def reenviar_codigo_vista(request):
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'error': 'Introduce tu correo electrónico.'}, status=status.HTTP_400_BAD_REQUEST)
    
    explorador = Explorador.objects.filter(Q(email__iexact=email) | Q(username__iexact=email)).first()
    if not explorador:
        return Response({'error': 'No encontramos ninguna cuenta con ese correo o usuario.'}, status=status.HTTP_404_NOT_FOUND)
        
    codigo = f"{secrets.randbelow(900000) + 100000}"
    explorador.codigo_verificacion = codigo
    explorador.fecha_codigo_verificacion = timezone.now()
    explorador.save()
    
    token = default_token_generator.make_token(explorador)
    uid = urlsafe_base64_encode(force_bytes(explorador.pk))
    
    enviar_correo_verificacion(request, explorador, codigo, uid, token)
    
    return Response({
        'mensaje': 'Te hemos enviado un nuevo código de activación.',
        'email': explorador.email,
        'codigo_dev': codigo if settings.DEBUG else None
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def login_vista(request):
    username = request.data.get('username', '')
    password = request.data.get('password', '')

    if not username or not password:
        return Response({'error': 'Debes ingresar usuario y contraseña.'}, status=status.HTTP_400_BAD_REQUEST)

    # Conversión obligatoria a minúsculas y eliminación total de espacios en blanco
    username_limpio = "".join(str(username).split()).lower()
    password_limpio = str(password).strip()
    password_sin_espacios = "".join(str(password).split())

    # Intento 1: Autenticación directa
    usuario = authenticate(request, username=username_limpio, password=password_limpio)

    # Intento 1b: Autenticación con password sin ningún espacio
    if usuario is None and password_sin_espacios != password_limpio:
        usuario = authenticate(request, username=username_limpio, password=password_sin_espacios)

    # Intento 2: Búsqueda insensible a mayúsculas por username o email
    if usuario is None:
        try:
            user_obj = Explorador.objects.filter(username__iexact=username_limpio).first()
            if not user_obj and ('@' in username_limpio or '.' in username_limpio):
                user_obj = Explorador.objects.filter(email__iexact=username_limpio).first()
            if user_obj:
                if user_obj.check_password(password_limpio):
                    usuario = user_obj
                elif password_sin_espacios != password_limpio and user_obj.check_password(password_sin_espacios):
                    usuario = user_obj
        except Exception:
            pass

    if usuario is not None:
        if not getattr(usuario, 'email_verificado', True) or not usuario.is_active:
            return Response({
                'error': 'Debes confirmar tu correo electrónico antes de entrar.',
                'requiere_verificacion': True,
                'email': usuario.email,
                'username': usuario.username
            }, status=status.HTTP_403_FORBIDDEN)
        login(request, usuario)
        token = get_token(request)
        serializer = ExploradorPerfilSerializer(usuario, context={'request': request})
        return Response({
            'mensaje': f'Ruta iniciada. ¡Hola de nuevo, {usuario.username.capitalize()}!',
            'usuario': serializer.data,
            'csrftoken': token
        })
    return Response({'error': 'Credenciales incorrectas. Comprueba tu usuario y contraseña.'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def recuperar_password_vista(request):
    # Aquí permito solicitar la recuperación de contraseña generando una clave temporal y enviándola por correo SMTP
    email_o_usuario = request.data.get('email_o_usuario', '').strip().lower()
    if not email_o_usuario:
        return Response({'error': 'Ingresa tu correo electrónico o nombre de usuario.'}, status=status.HTTP_400_BAD_REQUEST)

    user = Explorador.objects.filter(Q(email__iexact=email_o_usuario) | Q(username__iexact=email_o_usuario)).first()
    if user:
        # Generar contraseña temporal segura de 8 caracteres
        import random, string
        sufijo = ''.join(random.choices(string.digits, k=4))
        clave_temporal = f"camper{sufijo}"
        user.set_password(clave_temporal)
        user.save()

        # Enviar correo electrónico de recuperación transaccional
        if user.email:
            asunto_rec = "🚐 Camplink • Restablecimiento de Contraseña"
            mensaje_rec_texto = (
                f"¡Hola, {user.username.capitalize()}!\n\n"
                f"Hemos recibido una solicitud para restablecer el acceso a tu cuenta en Camplink.\n\n"
                f"Tu nueva contraseña temporal es:\n"
                f"👉 {clave_temporal}\n\n"
                f"Puedes iniciar sesión con ella y cambiarla posteriormente desde tu perfil.\n\n"
                f"¡Buenas rutas nómadas!\n"
                f"El equipo de Camplink\n"
                f"https://camplinkapp.com"
            )
            mensaje_rec_html = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #EDECE6; padding: 24px; border-radius: 16px;">
                <div style="background: #235334; color: white; padding: 24px; border-radius: 12px; text-align: center;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 12px auto; text-align: center;">
                <tr>
                    <td align="center" style="text-align: center; vertical-align: middle; background-color: #ffffff; border-radius: 50%; padding: 4px; width: 68px; height: 68px; box-shadow: 0 4px 10px rgba(0,0,0,0.18);">
                        <img src="https://camplinkapp.com/camplink-logo-mail.png?v=3" alt="Camplink" width="68" height="68" border="0" style="display: block; margin: 0 auto; width: 68px; height: 68px; max-width: 68px; max-height: 68px; border-radius: 50%; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;" />
                    </td>
                </tr>
            </table>
                    <h1 style="margin: 0; font-size: 22px;">🚐 Restablecimiento de Contraseña</h1>
                </div>
                <div style="background: white; padding: 24px; border-radius: 12px; margin-top: 16px; border: 1px solid #ddd;">
                    <h2 style="color: #17241A; font-size: 18px; margin-top: 0;">Hola, {user.username.capitalize()}:</h2>
                    <p style="color: #4A5B4F; line-height: 1.5;">
                        Hemos recibido una solicitud para acceder a tu cuenta de Camplink. Tu nueva clave temporal de acceso es:
                    </p>
                    <div style="text-align: center; margin: 24px 0;">
                        <span style="display: inline-block; font-size: 28px; font-weight: bold; letter-spacing: 4px; background: #F3F4F6; color: #235334; padding: 12px 28px; border-radius: 8px; border: 2px dashed #235334;">
                            {clave_temporal}
                        </span>
                        <p style="font-size: 13px; color: #6B7280; margin-top: 8px;">Inicia sesión con esta clave y cámbiala desde tu perfil.</p>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 16px; color: #7E9183; font-size: 12px;">
                    © 2026 Camplink • <a href="https://camplinkapp.com" style="color: #235334; text-decoration: none;">www.camplinkapp.com</a>
                </div>
            </div>
            """
            threading.Thread(
                target=enviar_email_transaccional,
                args=(user.email, asunto_rec, mensaje_rec_texto, mensaje_rec_html),
                daemon=True
            ).start()

        resp_data = {
            'mensaje': f'Hemos localizado tu cuenta ({user.username.capitalize()}). Te hemos enviado tu nueva contraseña temporal a {user.email}. Revisa tu bandeja de entrada o spam.',
        }
        if settings.DEBUG:
            resp_data['clave_dev'] = clave_temporal
        return Response(resp_data)
    return Response({'error': 'No se encontró ningún explorador registrado con ese usuario o correo electrónico.'}, status=status.HTTP_404_NOT_FOUND)


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
        return Response({'mensaje': f'{seguido.username.capitalize()} y tú ya no sois Compañeros de Ruta.', 'estado': 'ninguno'})

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
    return Response({'mensaje': f'¡Ahora {seguido.username.capitalize()} y tú sois Compañeros de Ruta! 🤝', 'estado': 'aceptada'})


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
        return Response({'mensaje': f'¡Ahora {relacion.seguidor.username.capitalize()} sigue tu Diario de Ruta!'})
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


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def notificaciones_vista(request):
    usuario = request.user
    if request.method == 'GET':
        notifs_qs = Notificacion.objects.filter(usuario_destino=usuario)
        # Solo crear las notificaciones de bienvenida una única vez si el usuario nunca las ha recibido
        if not usuario.recibio_bienvenida:
            if not notifs_qs.exists():
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
            usuario.recibio_bienvenida = True
            usuario.save(update_fields=['recibio_bienvenida'])

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
    elif request.method == 'DELETE':
        # Marcar que el usuario ya las conoció para que nunca vuelvan a reaparecer si borra todo
        if not usuario.recibio_bienvenida:
            usuario.recibio_bienvenida = True
            usuario.save(update_fields=['recibio_bienvenida'])

        notif_id = request.data.get('notificacion_id') or request.query_params.get('notificacion_id')
        if notif_id:
            Notificacion.objects.filter(id=notif_id, usuario_destino=usuario).delete()
        else:
            Notificacion.objects.filter(usuario_destino=usuario).delete()
        return Response({'mensaje': 'Notificación eliminada con éxito.'}, status=status.HTTP_200_OK)


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


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@csrf_exempt
def cambiar_password_vista(request):
    """
    Permite al usuario autenticado cambiar su contraseña dentro de la configuración de su perfil.
    """
    usuario = request.user
    password_actual = request.data.get('password_actual', '')
    password_nueva = request.data.get('password_nueva', '')
    password_confirmar = request.data.get('password_confirmar', '')

    if not password_actual or not password_nueva:
        return Response({'error': 'Debes ingresar la contraseña actual y la nueva contraseña.'}, status=status.HTTP_400_BAD_REQUEST)

    if not usuario.check_password(password_actual):
        return Response({'error': 'La contraseña actual introducida no es correcta.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(password_nueva) < 6:
        return Response({'error': 'La nueva contraseña debe contener al menos 6 caracteres.'}, status=status.HTTP_400_BAD_REQUEST)

    if password_confirmar and password_nueva != password_confirmar:
        return Response({'error': 'La confirmación no coincide con la nueva contraseña.'}, status=status.HTTP_400_BAD_REQUEST)

    usuario.set_password(password_nueva)
    usuario.save()

    from django.contrib.auth import update_session_auth_hash
    update_session_auth_hash(request, usuario)

    return Response({'mensaje': '¡Contraseña actualizada con éxito!'})
