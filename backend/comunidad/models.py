# Aquí defino los modelos para la Guía del Nómada (artículos técnicos del administrador)
# y el Taller Nómada (foro comunitario con categorías de Mantenimiento, Bricolaje y Piezas 3D con archivos .stl).

from django.db import models
from django.conf import settings
from django.utils.text import slugify

class ArticuloGuia(models.Model):
    # Aquí configuro el modelo para los artículos de la Guía del Nómada,
    # donde el Administrador publica guías de supervivencia, servidores multimedia offline, etc.
    CATEGORIAS = [
        ('supervivencia', 'Supervivencia y Acampada'),
        ('tecnologia_offline', 'Servidores Multimedia y Tecnología Offline'),
        ('electricidad', 'Baterías, Placas Solares y Electricidad'),
        ('mantenimiento_pro', 'Mantenimiento Avanzado del Vehículo'),
        ('rutas_secretas', 'Rutas Escondidas y Consejos Nómadas'),
    ]

    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='articulos_guia',
        verbose_name='Autor (Administrador)'
    )
    titulo = models.CharField(max_length=250, verbose_name='Título del Artículo')
    slug = models.SlugField(max_length=260, unique=True, blank=True, verbose_name='Slug URL')
    categoria = models.CharField(max_length=40, choices=CATEGORIAS, default='supervivencia', verbose_name='Categoría')
    resumen = models.TextField(verbose_name='Resumen Corto')
    contenido = models.TextField(verbose_name='Contenido Completo en Markdown o Texto')
    imagen_cabecera = models.ImageField(upload_to='guia/', null=True, blank=True, verbose_name='Imagen Principal')
    destacado = models.BooleanField(default=False, verbose_name='¿Destacado en Portada?')
    fecha_publicacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_publicacion']
        verbose_name = 'Artículo de la Guía del Nómada'
        verbose_name_plural = 'Artículos de la Guía del Nómada'

    def __str__(self):
        # Aquí devuelvo el título del artículo junto a su categoría
        return f'[{self.get_categoria_display()}] {self.titulo}'

    def save(self, *args, **kwargs):
        # Aquí genero el slug automáticamente a partir del título si no existe
        if not self.slug:
            self.slug = slugify(self.titulo)
        super().save(*args, **kwargs)


class TemaTaller(models.Model):
    # Aquí configuro el modelo para los temas de discusión en el Taller Nómada,
    # permitiendo debatir sobre Mantenimiento, Bricolaje y compartir archivos de impresión 3D (.stl).
    CATEGORIAS = [
        ('mantenimiento', 'Mantenimiento'),
        ('bricolaje', 'Bricolaje y Camperización'),
        ('piezas_3d', 'Piezas 3D y Modelos STL'),
    ]

    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='temas_taller',
        verbose_name='Explorador'
    )
    categoria = models.CharField(max_length=30, choices=CATEGORIAS, default='mantenimiento', verbose_name='Sección')
    titulo = models.CharField(max_length=250, verbose_name='Título del Tema')
    descripcion = models.TextField(verbose_name='Explicación Detallada')
    archivo_stl = models.FileField(
        upload_to='taller_3d/',
        null=True,
        blank=True,
        verbose_name='Archivo 3D (.stl para soportes, cierres, adaptadores)'
    )
    imagen_adjunta = models.ImageField(
        upload_to='taller_fotos/',
        null=True,
        blank=True,
        verbose_name='Foto Demostrativa'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Tema del Taller Nómada'
        verbose_name_plural = 'Temas del Taller Nómada'

    def __str__(self):
        # Aquí identifico el tema con su categoría y título
        return f'[{self.get_categoria_display()}] {self.titulo}'


class RespuestaTaller(models.Model):
    # Aquí permito a los exploradores responder y aportar soluciones en los temas del Taller Nómada
    tema = models.ForeignKey(TemaTaller, on_delete=models.CASCADE, related_name='respuestas')
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='respuestas_taller')
    mensaje = models.TextField(verbose_name='Respuesta / Aportación')
    archivo_adjunto = models.FileField(upload_to='taller_respuestas/', null=True, blank=True, verbose_name='Archivo Adjunto')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['fecha_creacion']

    def __str__(self):
        # Aquí represento la respuesta indicando autor y tema
        return f'Respuesta de {self.autor.username} en {self.tema.titulo}'
