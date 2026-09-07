# Aquí defino los modelos de datos para los Lugares de pernocta y acampada,
# incluyendo coordenadas GPS, servicios camper, fotos, filtros temáticos y valoraciones comunitarias.

from django.db import models
from django.conf import settings

class Lugar(models.Model):
    # Aquí configuro el modelo principal del Lugar para almacenar los puntos de pernocta,
    # áreas de autocaravanas, campings y zonas libres descubiertas por los exploradores.
    creador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lugares_creados',
        verbose_name='Explorador Creador'
    )
    nombre = models.CharField(max_length=200, verbose_name='Nombre del Lugar')
    descripcion = models.TextField(verbose_name='Descripción Detallada')
    latitud = models.FloatField(verbose_name='Latitud GPS')
    longitud = models.FloatField(verbose_name='Longitud GPS')

    # Ubicación geográfica
    pais = models.CharField(max_length=100, default='España', verbose_name='País')
    comunidad_autonoma = models.CharField(max_length=100, blank=True, default='', verbose_name='Comunidad Autónoma')
    provincia = models.CharField(max_length=100, blank=True, default='', verbose_name='Provincia')
    poblacion = models.CharField(max_length=100, blank=True, default='', verbose_name='Población')

    # Información económica
    precio = models.DecimalField(max_digits=6, decimal_places=2, default=0.0, verbose_name='Precio (€/noche)')
    es_gratuito = models.BooleanField(default=False, verbose_name='¿Es gratuito?')

    # Foto principal
    foto_principal = models.ImageField(upload_to='lugares/', null=True, blank=True, verbose_name='Foto Principal')

    # Servicios camper específicos
    tiene_agua = models.BooleanField(default=False, verbose_name='Punto de Agua Potable')
    tiene_lavabo = models.BooleanField(default=False, verbose_name='Lavabo / WC')
    tiene_duchas = models.BooleanField(default=False, verbose_name='Duchas')
    tiene_electricidad = models.BooleanField(default=False, verbose_name='Toma de Electricidad')
    tiene_vaciado_aguas_grises = models.BooleanField(default=False, verbose_name='Vaciado de Aguas Grises')
    tiene_vaciado_aguas_negras = models.BooleanField(default=False, verbose_name='Vaciado de Aguas Negras (WC químico)')
    admite_mascotas = models.BooleanField(default=True, verbose_name='Admite Mascotas')
    tiene_wifi = models.BooleanField(default=False, verbose_name='Acceso WiFi')
    tiene_mesas_picnic = models.BooleanField(default=False, verbose_name='Mesas de Picnic')

    # Filtros temáticos para búsquedas inteligentes
    es_zona_recreativa = models.BooleanField(default=False, verbose_name='Zona Recreativa')
    tiene_senderos_sencillos = models.BooleanField(default=False, verbose_name='Senderos Sencillos de Paseo')
    ideal_ninos_10_anos = models.BooleanField(default=False, verbose_name='Ideal para Niños de 10 Años')
    apto_grandes_autocaravanas = models.BooleanField(default=True, verbose_name='Apto para Autocaravanas >7m')
    permite_sacar_toldo = models.BooleanField(default=False, verbose_name='Permite Desplegar Toldo / Mesas')

    # Valoración promedio mediante iconos camper (1 a 5)
    valoracion_media = models.FloatField(default=5.0, verbose_name='Valoración Camper Media')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Lugar'
        verbose_name_plural = 'Lugares'

    def __str__(self):
        # Aquí retorno una representación amigable del lugar con su población y puntuación
        return f'{self.nombre} - {self.poblacion} ({self.valoracion_media} 🚐)'

    def actualizar_valoracion(self):
        # Aquí calculo la media de puntuaciones camper acumuladas por los exploradores
        vals = self.valoraciones.all()
        if vals.exists():
            self.valoracion_media = round(sum(v.puntuacion_camper for v in vals) / vals.count(), 1)
            self.save(update_fields=['valoracion_media'])


class FotoLugar(models.Model):
    # Aquí permito almacenar múltiples imágenes adicionales para enriquecer la galería del Lugar
    lugar = models.ForeignKey(Lugar, on_delete=models.CASCADE, related_name='fotos')
    imagen = models.ImageField(upload_to='lugares/galeria/')
    pie_foto = models.CharField(max_length=200, blank=True, default='', verbose_name='Pie de Foto')
    fecha_subida = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # Aquí devuelvo el identificador de la foto asociada al lugar
        return f'Foto de {self.lugar.nombre}'


class ValoracionLugar(models.Model):
    # Aquí registro las opiniones y valoraciones con iconos camper (1 a 5 furgonetas/tiendas)
    # que dejan los exploradores tras visitar un Lugar.
    lugar = models.ForeignKey(Lugar, on_delete=models.CASCADE, related_name='valoraciones')
    explorador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mis_valoraciones_lugares')
    puntuacion_camper = models.IntegerField(default=5, verbose_name='Puntuación Camper (1-5)')
    comentario = models.TextField(verbose_name='Opinión del Explorador')
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        # Aquí resumo la reseña indicando autor, lugar y puntuación
        return f'{self.explorador.username} valoró {self.lugar.nombre} con {self.puntuacion_camper} 🚐'

    def save(self, *args, **kwargs):
        # Aquí guardo la reseña y actualizo automáticamente la media general del Lugar
        super().save(*args, **kwargs)
        self.lugar.actualizar_valoracion()
