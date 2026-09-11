from django.conf import settings
# Aquí defino los modelos de datos para la gestión de usuarios (Exploradores),
# sus perfiles camper, relaciones de seguimiento y grupos de privacidad para el Diario de Ruta.

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail, EmailMultiAlternatives
from email.mime.image import MIMEImage
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class Explorador(AbstractUser):
    # Aquí configuro el modelo del Explorador (usuario personalizado) para almacenar sus datos de perfil,
    # el vehículo que conduce, su dirección base para calcular rutas y su rol en la plataforma.
    TIPO_VIAJERO_CHOICES = [
        ('camper', 'Camper'),
        ('acampada', 'Acampada'),
        ('autocaravana', 'Autocaravana'),
    ]

    TIPO_COMBUSTIBLE_CHOICES = [
        ('gasoleo_a', 'Diésel / Gasóleo A'),
        ('gasolina_95', 'Gasolina 95 E5'),
        ('gasolina_98', 'Gasolina 98 E5'),
        ('glp', 'GLP / Autogás'),
    ]

    ROL_CHOICES = [
        ('explorador', 'Explorador'),
        ('administrador', 'Administrador'),
    ]

    fecha_nacimiento = models.DateField(null=True, blank=True, verbose_name='Fecha de Nacimiento')
    pais = models.CharField(max_length=100, default='España', verbose_name='País')
    poblacion = models.CharField(max_length=100, blank=True, default='', verbose_name='Población')
    codigo_postal = models.CharField(max_length=10, blank=True, default='', verbose_name='Código Postal')
    direccion_base = models.CharField(max_length=255, blank=True, default='', verbose_name='Dirección Base')
    lat_base = models.FloatField(null=True, blank=True, verbose_name='Latitud Base')
    lng_base = models.FloatField(null=True, blank=True, verbose_name='Longitud Base')
    tipo_viajero = models.CharField(max_length=20, choices=TIPO_VIAJERO_CHOICES, default='camper', verbose_name='Tipo de Viajero')
    foto_vehiculo = models.ImageField(upload_to='vehiculos/', null=True, blank=True, verbose_name='Foto del Vehículo')
    avatar = models.ImageField(upload_to='avatares/', null=True, blank=True, verbose_name='Foto de Perfil')
    biografia = models.TextField(blank=True, default='', verbose_name='Biografía Camper')
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default='explorador', verbose_name='Rol')
    recibio_bienvenida = models.BooleanField(default=False, verbose_name='Recibió Notificaciones de Bienvenida')
    email_verificado = models.BooleanField(default=False, verbose_name='Email Verificado')
    codigo_verificacion = models.CharField(max_length=6, blank=True, null=True, verbose_name='Código de Verificación')
    fecha_codigo_verificacion = models.DateTimeField(null=True, blank=True, verbose_name='Fecha Envío Código')

    # Preferencias de Notificaciones por Correo Electrónico
    notif_email_comentarios = models.BooleanField(default=True, verbose_name='Recibir email en comentarios')
    notif_email_reacciones = models.BooleanField(default=True, verbose_name='Recibir email en reacciones')
    notif_email_taller = models.BooleanField(default=True, verbose_name='Recibir email en aprobaciones/rechazos del taller')

    capacidad_deposito_l = models.FloatField(default=60.0, verbose_name='Capacidad del Depósito (Litros)')
    consumo_medio_l_100km = models.FloatField(default=8.5, verbose_name='Consumo Medio (L/100km)')
    tipo_combustible = models.CharField(max_length=20, choices=TIPO_COMBUSTIBLE_CHOICES, default='gasoleo_a', verbose_name='Tipo de Combustible')

    @property
    def autonomia_estimada_km(self):
        # Aquí calculo la autonomía máxima aproximada con un depósito completo
        if self.consumo_medio_l_100km and self.consumo_medio_l_100km > 0:
            return round((self.capacidad_deposito_l / self.consumo_medio_l_100km) * 100, 1)
        return 0.0

    def __str__(self):
        # Aquí devuelvo el nombre del explorador o su nombre de usuario para identificarlo visualmente
        return f'{self.username} ({self.get_tipo_viajero_display()})'

    @property
    def es_admin(self):
        # Aquí verifico si el explorador tiene permisos de administración o rol de administrador
        return self.is_staff or self.is_superuser or self.rol == 'administrador'


class GrupoPrivacidad(models.Model):
    # Aquí configuro el modelo para que los exploradores creen círculos o grupos privados
    # y así puedan compartir publicaciones del Diario de Ruta solo con ciertas personas.
    creador = models.ForeignKey(Explorador, on_delete=models.CASCADE, related_name='grupos_creados')
    nombre = models.CharField(max_length=100, verbose_name='Nombre del Grupo')
    descripcion = models.CharField(max_length=255, blank=True, default='', verbose_name='Descripción')
    miembros = models.ManyToManyField(Explorador, related_name='grupos_pertenece', blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # Aquí retorno el nombre del grupo junto con el explorador que lo creó
        return f'{self.nombre} (Creado por {self.creador.username})'


class RelacionSeguimiento(models.Model):
    # Aquí gestiono el sistema de seguimiento y amistad entre exploradores con estados
    # de solicitud pendiente, aceptada o rechazada para el Diario de Ruta.
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('aceptada', 'Aceptada'),
        ('rechazada', 'Rechazada'),
    ]

    seguidor = models.ForeignKey(Explorador, on_delete=models.CASCADE, related_name='siguiendo')
    seguido = models.ForeignKey(Explorador, on_delete=models.CASCADE, related_name='seguidores')
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('seguidor', 'seguido')

    def __str__(self):
        # Aquí muestro una descripción legible de la relación entre ambos exploradores
        return f'{self.seguidor.username} -> {self.seguido.username} [{self.estado}]'


class Notificacion(models.Model):
    TIPOS = [
        ('seguimiento', '🤝 Nuevo Compañero de Ruta / Seguidor'),
        ('comentario', '💬 Comentario en tu publicación'),
        ('reaccion', '🔥 Reacción a tu vivencia'),
        ('trofeo', '🏆 Trofeo Desbloqueado'),
        ('grupo', '🏕️ Grupo / Comunidad'),
        ('sistema', 'ℹ️ Notificación del Sistema'),
        ('taller', '🛠️ Taller Camplink'),
    ]

    usuario_destino = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notificaciones_recibidas',
        verbose_name='Destinatario'
    )
    usuario_origen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notificaciones_enviadas',
        verbose_name='Emisor'
    )
    tipo = models.CharField(max_length=30, choices=TIPOS, default='sistema')
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    leida = models.BooleanField(default=False)
    enlace = models.CharField(max_length=255, blank=True, default='')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'

    def __str__(self):
        return f'Notificación [{self.tipo}] para {self.usuario_destino.username}: {self.titulo}'


@receiver(post_save, sender=Notificacion)
def enviar_notificacion_email(sender, instance, created, **kwargs):
    """
    Envía un correo electrónico al usuario destinatario si tiene activada
    la preferencia para ese tipo de notificación y posee una dirección de correo válida.
    """
    if not created:
        return

    destinatario = instance.usuario_destino
    if not destinatario or not destinatario.email:
        return

    enviar = False
    if instance.tipo == 'comentario' and getattr(destinatario, 'notif_email_comentarios', True):
        enviar = True
    elif instance.tipo == 'reaccion' and getattr(destinatario, 'notif_email_reacciones', True):
        enviar = True
    elif instance.tipo in ['sistema', 'taller'] and getattr(destinatario, 'notif_email_taller', True):
        enviar = True

    if enviar:
        try:
            remitente = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Camplink <notificaciones@camplinkapp.com>')
            asunto = instance.titulo
            enlace_completo = f"http://localhost:5173{instance.enlace}" if instance.enlace else "http://localhost:5173"

            texto_boton = "Ver en Camplink"
            if instance.tipo == 'comentario':
                texto_boton = "Ver Comentarios"
            elif instance.tipo == 'reaccion':
                texto_boton = "Ver Publicación"
            elif instance.tipo in ['taller', 'sistema']:
                texto_boton = "Revisar Publicación" if 'revision=' in (instance.enlace or '') else "Ver en el Taller"

            dest_nombre = destinatario.username.capitalize() if destinatario.username else 'Explorador'
            mensaje_limpio = instance.mensaje
            if instance.usuario_origen and instance.usuario_origen.username:
                u_raw = instance.usuario_origen.username
                u_cap = u_raw.capitalize()
                import re
                mensaje_limpio = re.sub(rf'\b{re.escape(u_raw)}\b', u_cap, mensaje_limpio)
            if destinatario.username:
                u_raw_d = destinatario.username
                import re
                mensaje_limpio = re.sub(rf'\b{re.escape(u_raw_d)}\b', dest_nombre, mensaje_limpio)

            mensaje_texto = (
                f"Camplink\n\n"
                f"¡Hola {dest_nombre}!\n\n"
                f"{mensaje_limpio}\n\n"
                f"👉 Haz clic para acceder: [{texto_boton}] ({enlace_completo})\n\n\n"
                f"¡Buenas rutas y feliz acampada!\n"
                f"El equipo de Camplink\n\n\n"
                f"---\n"
                f"Gestiona qué correos recibir desde tu perfil en Camplink."
            )

            mensaje_html = f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px 24px; background-color: #121815; color: #E5E7EB; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
              <div style="text-align: center; margin-bottom: 24px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 10px;">
                      <img src="cid:camplink_logo" alt="Logo" width="28" height="28" style="display: block; border-radius: 50%; width: 28px; height: 28px;" />
                    </td>
                    <td style="vertical-align: middle;">
                      <span style="color: #2D5A27; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Camplink</span>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="background-color: rgba(255,255,255,0.04); padding: 22px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
                <h3 style="margin: 0 0 14px; color: #F9FAFB; font-size: 17px;">¡Hola, {dest_nombre}!</h3>
                <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.65; color: #E5E7EB; font-weight: 500;">{mensaje_limpio}</p>
                <div style="text-align: center; margin: 20px 0 16px;">
                  <a href="{enlace_completo}" style="display: inline-block; background-color: #2D5A27; color: #ffffff; padding: 13px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px;">{texto_boton} &rarr;</a>
                </div>
                <div style="height: 18px; line-height: 18px;">&nbsp;</div>
                <p style="margin: 0; font-size: 13px; color: #9CA3AF; text-align: center;">🌲 Buenas rutas y feliz acampada.</p>
              </div>

              <div style="text-align: center; font-size: 10.5px; color: #6B7280; line-height: 1.5; margin-top: 26px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06);">
                <p style="margin: 0;">Gestiona tus preferencias de notificaciones por email desde tu perfil de usuario en Camplink.</p>
              </div>
            </div>
            """

            msg = EmailMultiAlternatives(
                asunto,
                mensaje_texto,
                remitente,
                [destinatario.email]
            )
            msg.attach_alternative(mensaje_html, "text/html")

            # Adjuntar el logotipo en línea (CID) para que siempre cargue sin depender de URLs externas
            posibles_rutas_logo = [
                Path(settings.BASE_DIR) / 'camplink-logo.png',
                Path(settings.BASE_DIR).parent / 'frontend' / 'public' / 'camplink-logo.png'
            ]
            for ruta in posibles_rutas_logo:
                if ruta.exists():
                    try:
                        with open(ruta, 'rb') as f:
                            logo_img = MIMEImage(f.read())
                            logo_img.add_header('Content-ID', '<camplink_logo>')
                            logo_img.add_header('Content-Disposition', 'inline', filename='camplink-logo.png')
                            msg.attach(logo_img)
                            break
                    except Exception as e_img:
                        logger.warning(f"No se pudo adjuntar imagen de logo: {e_img}")

            msg.send(fail_silently=True)
        except Exception as e:
            logger.warning(f"No se pudo enviar email de notificación a {destinatario.email}: {e}")
