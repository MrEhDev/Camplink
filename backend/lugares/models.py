# Aquí defino los modelos de datos para los Lugares de pernocta y acampada,
# incluyendo coordenadas GPS, clasificación exacta por tipo_lugar, servicios_y_etiquetas,
# fotos y valoraciones comunitarias.

from django.db import models
from django.conf import settings

class Lugar(models.Model):
    # Clasificación exacta por tipo de lugar
    TIPOS_LUGAR = [
        ('pernocta_libre', '🌲 Pernocta Libre (Naturaleza)'),
        ('area_autocaravanas', '🚐 Área de Autocaravanas'),
        ('camping', '⛺ Camping'),
        ('parking_urbano', '🅿️ Parking Urbano / Mixto'),
        ('area_recreativa', '🏞️ Área Recreativa / Merendero'),
        ('solo_servicios', '💧 Solo Servicios'),
    ]

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
    tipo_lugar = models.CharField(
        max_length=40,
        choices=TIPOS_LUGAR,
        default='pernocta_libre',
        verbose_name='Tipo de Lugar'
    )
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

    # --- SERVICIOS ---
    tiene_agua = models.BooleanField(default=False, verbose_name='🚰 Agua Potable')
    tiene_lavabo = models.BooleanField(default=False, verbose_name='🚽 Lavabos')
    tiene_electricidad = models.BooleanField(default=False, verbose_name='⚡ Electricidad')
    tiene_wifi = models.BooleanField(default=False, verbose_name='🛜 Wi-Fi')
    tiene_basuras = models.BooleanField(default=False, verbose_name='🗑️ Basuras')
    tiene_duchas = models.BooleanField(default=False, verbose_name='🚿 Duchas')
    tiene_vaciado_aguas_grises = models.BooleanField(default=False, verbose_name='🔄 Vaciado de Aguas Grises')
    tiene_vaciado_aguas_negras = models.BooleanField(default=False, verbose_name='🚽 Vaciado de Aguas Negras (WC químico)')

    # --- ENTORNO Y OCIO ---
    ideal_familias = models.BooleanField(default=False, verbose_name='👨‍👩‍👧‍👦 Ideal Familias (niños ~10 años)')
    tiene_senderismo = models.BooleanField(default=False, verbose_name='🥾 Senderismo')
    playa_cercana = models.BooleanField(default=False, verbose_name='🏖️ Playa Cercana')
    rutas_en_bici = models.BooleanField(default=False, verbose_name='🚴 Rutas en Bici')
    admite_mascotas = models.BooleanField(default=True, verbose_name='🐕 Admite Mascotas')

    # --- TERRENO Y ACCESO ---
    acceso_asfaltado = models.BooleanField(default=True, verbose_name='🛣️ Acceso Asfaltado')
    mucha_sombra = models.BooleanField(default=False, verbose_name='🌲 Mucha Sombra')
    muy_soleado = models.BooleanField(default=False, verbose_name='☀️ Muy Soleado (Placas Solares)')
    terreno_nivelado = models.BooleanField(default=True, verbose_name='📐 Terreno Nivelado')
    apto_grandes_autocaravanas = models.BooleanField(default=True, verbose_name='🚐 Apto para Autocaravanas >7m')
    permite_sacar_toldo = models.BooleanField(default=False, verbose_name='🪑 Permite Desplegar Toldo / Mesas')

    # Campos de compatibilidad anteriores
    tiene_mesas_picnic = models.BooleanField(default=False, verbose_name='Mesas de Picnic')
    es_zona_recreativa = models.BooleanField(default=False, verbose_name='Zona Recreativa')
    tiene_senderos_sencillos = models.BooleanField(default=False, verbose_name='Senderos Sencillos de Paseo')
    ideal_ninos_10_anos = models.BooleanField(default=False, verbose_name='Ideal para Niños de 10 Años')

    # Valoración promedio mediante iconos camper (1 a 5)
    valoracion_media = models.FloatField(default=5.0, verbose_name='Valoración Camper Media')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Lugar'
        verbose_name_plural = 'Lugares'

    def __str__(self):
        return f'{self.nombre} - {self.poblacion} ({self.get_tipo_lugar_display()})'

    def actualizar_valoracion(self):
        vals = self.valoraciones.all()
        if vals.exists():
            self.valoracion_media = round(sum(v.puntuacion_camper for v in vals) / vals.count(), 1)
            self.save(update_fields=['valoracion_media'])


class FotoLugar(models.Model):
    lugar = models.ForeignKey(Lugar, on_delete=models.CASCADE, related_name='fotos')
    imagen = models.ImageField(upload_to='lugares/galeria/')
    pie_foto = models.CharField(max_length=200, blank=True, default='', verbose_name='Pie de Foto')
    fecha_subida = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Foto de {self.lugar.nombre}'


class ValoracionLugar(models.Model):
    lugar = models.ForeignKey(Lugar, on_delete=models.CASCADE, related_name='valoraciones')
    explorador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mis_valoraciones_lugares')
    puntuacion_camper = models.IntegerField(default=5, verbose_name='Puntuación Camper (1-5)')
    comentario = models.TextField(verbose_name='Opinión del Explorador')
    foto = models.ImageField(upload_to='valoraciones/', null=True, blank=True, verbose_name='Foto de la Opinión')
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f'{self.explorador.username} valoró {self.lugar.nombre} con {self.puntuacion_camper} 🚐'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.lugar.actualizar_valoracion()

class NotaPersonalLugar(models.Model):
    lugar = models.ForeignKey(Lugar, on_delete=models.CASCADE, related_name='notas_personales', verbose_name='Lugar')
    explorador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notas_lugares', verbose_name='Explorador')
    contenido = models.TextField(blank=True, default='', verbose_name='Nota Personal y Privada')
    fecha_modificacion = models.DateTimeField(auto_now=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Nota Personal de Lugar'
        verbose_name_plural = 'Notas Personales de Lugares'

    def __str__(self):
        return f'Nota de {self.explorador.username} en {self.lugar.nombre}'
