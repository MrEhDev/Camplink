# Aquí defino los modelos para el Diario de Ruta (feed social), publicaciones, comentarios,
# y los Check-ins (pernoctas) con notas privadas exclusivas del explorador.

from django.db import models
from django.conf import settings
from django.utils import timezone
from lugares.models import Lugar
from exploradores.models import GrupoPrivacidad
from viajes.models import Viaje

class Publicacion(models.Model):
    # Aquí configuro el modelo para las publicaciones sociales del Diario de Ruta,
    # con soporte para imágenes, mención de lugares y filtros de privacidad.
    OPCIONES_PRIVACIDAD = [
        ('publico', 'Público (Toda la Comunidad)'),
        ('seguidores', 'Solo Exploradores Seguidos'),
        ('grupo_privado', 'Grupo Privado'),
    ]

    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='publicaciones',
        verbose_name='Explorador'
    )
    contenido = models.TextField(verbose_name='Texto del Diario')
    imagen = models.ImageField(upload_to='diario/', null=True, blank=True, verbose_name='Foto de la Ruta')
    lugar = models.ForeignKey(
        Lugar,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='publicaciones_mencionan',
        verbose_name='Lugar Relacionado'
    )
    visibilidad = models.CharField(
        max_length=20,
        choices=OPCIONES_PRIVACIDAD,
        default='publico',
        verbose_name='Nivel de Privacidad'
    )
    grupo_privado = models.ForeignKey(
        GrupoPrivacidad,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='publicaciones_grupo',
        verbose_name='Grupo Seleccionado'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Publicación de Ruta'
        verbose_name_plural = 'Publicaciones de Ruta'

    def __str__(self):
        # Aquí retorno una vista previa corta de la publicación junto a su autor
        return f'{self.autor.username}: {self.contenido[:40]}...'


class ComentarioPublicacion(models.Model):
    # Aquí gestiono los comentarios e interacción comunitaria en cada entrada del Diario de Ruta
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, related_name='comentarios')
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comentarios_realizados')
    texto = models.TextField(verbose_name='Comentario')
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['fecha']

    def __str__(self):
        # Aquí muestro quién comentó y en qué publicación
        return f'{self.autor.username} en publicación #{self.publicacion_id}'


class CheckIn(models.Model):
    # Aquí registro el Check-in (pernocta) de un explorador en un Lugar específico,
    # guardando cuántos días tiene pensado quedarse, fotos, valoración y notas secretas.
    explorador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='checkins',
        verbose_name='Explorador'
    )
    lugar = models.ForeignKey(
        Lugar,
        on_delete=models.CASCADE,
        related_name='checkins',
        verbose_name='Lugar de Pernocta'
    )
    fecha_llegada = models.DateTimeField(default=timezone.now, verbose_name='Fecha de Llegada / Pernocta')
    dias_previstos = models.IntegerField(default=1, verbose_name='¿Cuántos días tienes pensado quedarte?')
    valoracion_camper = models.IntegerField(default=5, verbose_name='Valoración Camper (1-5 🚐)')
    comentario_publico = models.TextField(blank=True, default='', verbose_name='Comentario Público para el Diario')
    foto = models.ImageField(upload_to='checkins/', null=True, blank=True, verbose_name='Foto de la Pernocta')

    # NOTAS PRIVADAS: Solo accesibles para el autor
    notas_privadas = models.TextField(
        blank=True,
        default='',
        verbose_name='Notas Privadas (solo visibles para mí: estado del terreno, ruido, etc.)'
    )

    # Asociación automática al Viaje en curso
    viaje = models.ForeignKey(
        Viaje,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='checkins_asociados',
        verbose_name='Viaje Vinculado'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_llegada']
        verbose_name = 'Check-in de Pernocta'
        verbose_name_plural = 'Check-ins de Pernocta'

    def __str__(self):
        # Aquí represento la pernocta indicando el usuario, el lugar y la fecha
        fecha_str = self.fecha_llegada.strftime('%d/%m/%Y')
        return f'Pernocta de {self.explorador.username} en {self.lugar.nombre} ({fecha_str})'

class ReaccionPublicacion(models.Model):
    # Aquí gestiono las reacciones camper rápidas a las publicaciones del Diario de Ruta:
    # fuego (Buena ruta), pino (Guardado para ir), alerta (Ojo con el acceso)
    TIPOS_REACCION = [
        ('fuego', '🔥 Buena ruta'),
        ('pino', '🌲 Guardado para ir'),
        ('alerta', '⚠️ Ojo con el acceso'),
    ]

    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, related_name='reacciones')
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reacciones_diario')
    tipo = models.CharField(max_length=20, choices=TIPOS_REACCION)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('publicacion', 'usuario', 'tipo')
        verbose_name = 'Reacción de Publicación'
        verbose_name_plural = 'Reacciones de Publicaciones'

    def __str__(self):
        return f'{self.usuario.username} -> {self.tipo} en post {self.publicacion.id}'

