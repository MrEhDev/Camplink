# backend/comunidad/models.py
# Modelos del Taller Camplink (Guáas, Bricolaje, Impresión 3D y Recursos de la Comunidad)
# con soporte para posts enriquecidos, compresión de imágenes, flujo de moderación y categosías dinđmicas.

from django.db import models
from django.conf import settings
from django.utils.text import slugify
import uuid
from .utils import optimizar_imagen


class CategoriaPublicacion(models.Model):
    nombre = models.CharField(max_length=80, unique=True, verbose_name='Nombre de la Categoría')
    slug = models.SlugField(max_length=90, unique=True, blank=True, verbose_name='Slug')
    icono = models.CharField(max_length=50, default='Wrench', verbose_name='Icono')
    color = models.CharField(max_length=30, default='#3B82F6', verbose_name='Color Badge')
    descripcion = models.CharField(max_length=250, blank=True, default='', verbose_name='Descripción')
    es_fija = models.BooleanField(default=False, verbose_name='¿Es Fija del Sistema?')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Categosía de Publicación'
        verbose_name_plural = 'Categorías de Publicaciones'

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.nombre)
            if not base_slug:
                base_slug = f'cat-{uuid.uuid4().hex[:6]}'
            slug = base_slug
            c = 1
            while CategoriaPublicacion.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{c}'
                c += 1
            self.slug = slug
        super().save(*args, **kwargs)


class PublicacionTaller(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente de Aprobación'),
        ('aprobado', 'Aprobado y Público'),
        ('rechazado', 'Rechazado'),
    ]

    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='publicaciones_taller',
        verbose_name='Autor'
    )
    titulo = models.CharField(max_length=250, verbose_name='Título de la Publicación')
    slug = models.SlugField(max_length=260, unique=True, blank=True, verbose_name='Slug')
    categoria = models.ForeignKey(
        CategoriaPublicacion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='publicaciones',
        verbose_name='Categoría'
    )
    resumen = models.TextField(verbose_name='Resumen Corto')
    contenido = models.TextField(verbose_name='Contenido Detallado')
    imagen_principal = models.ImageField(
        upload_to='taller_portadas/',
        null=True,
        blank=True,
        verbose_name='Imagen Principal'
    )
    video_url = models.URLField(
        max_length=500,
        null=True,
        blank=True,
        verbose_name='Enlace de Video (YouTube / TikTok)'
    )
    archivo_descargable = models.FileField(
        upload_to='taller_archivos/',
        null=True,
        blank=True,
        verbose_name='Archivo Descargable (.STL, PDF, planos)'
    )
    enlace_externo = models.URLField(
        max_length=500,
        null=True,
        blank=True,
        verbose_name='Enlace Externo de Referencia'
    )
    enlace_externo_texto = models.CharField(
        max_length=120,
        blank=True,
        default='',
        verbose_name='Texto del Enlace'
    )
    es_guia_oficial = models.BooleanField(
        default=False,
        verbose_name='¿Es Guía Oficial?'
    )
    destacado = models.BooleanField(
        default=False,
        verbose_name='»Destacado en Portada?'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default='pendiente',
        verbose_name='Estado'
    )
    motivo_rechazo = models.TextField(
        blank=True,
        default='',
        verbose_name='Motivo de Rechazo'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Publicación del Taller Camplink'
        verbose_name_plural = 'Publicaciones del Taller Camplink'

    def __str__(self):
        cat_nom = self.categoria.nombre if self.categoria else 'General'
        return f"[{cat_nom}] {self.titulo} ({self.get_estado_display()})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.titulo)
            if not base_slug:
                base_slug = f'post-{uuid.uuid4().hex[:8]}'
            slug = base_slug
            c = 1
            while PublicacionTaller.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{c}'
                c += 1
            self.slug = slug

        if self.imagen_principal and hasattr(self.imagen_principal, 'file'):
            try:
                if not str(self.imagen_principal.name).endswith('.webp'):
                    self.imagen_principal = optimizar_imagen(self.imagen_principal)
            except Exception as e:
                print('Aviso compresión imagen_principal:', e)

        super().save(*args, **kwargs)


class ImagenGaleriaPublicacion(models.Model):
    publicacion = models.ForeignKey(
        PublicacionTaller,
        on_delete=models.CASCADE,
        related_name='galeria',
        verbose_name='Publicación'
    )
    imagen = models.ImageField(upload_to='taller_galeria/', verbose_name='Foto Galería')
    pie_de_foto = models.CharField(max_length=200, blank=True, default='', verbose_name='Pie de foto')
    orden = models.PositiveIntegerField(default=0)
    fecha_subida = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['orden', 'fecha_subida']

    def save(self, *args, **kwargs):
        if self.imagen and hasattr(self.imagen, 'file'):
            try:
                if not str(self.imagen.name).endswith('.webp'):
                    self.imagen = optimizar_imagen(self.imagen)
            except Exception as e:
                print('Aviso compresión foto galería:', e)
        super().save(*args, **kwargs)


class ComentarioPublicacion(models.Model):
    publicacion = models.ForeignKey(
        PublicacionTaller,
        on_delete=models.CASCADE,
        related_name='comentarios',
        verbose_name='Publicación'
    )
    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comentarios_taller',
        verbose_name='Autor'
    )
    mensaje = models.TextField(verbose_name='Mensaje')
    archivo_adjunto = models.FileField(upload_to='taller_comentarios_adjuntos/', null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['fecha_creacion']

    def __str__(self):
        return f'Comentario de {self.autor.username} en {self.publicacion.titulo}'


# Modelos Legacy para no alterar histórico
class ArticuloGuia(models.Model):
    CATEGORIAS = [
        ('supervivencia', 'Supervivencia y Acampada'),
        ('tecnologia_offline', 'Servidores Multimedia y Tecnología Offline'),
        ('electricidad', 'Baterías, Placas Solares y Electricidad'),
        ('mantenimiento_pro', 'Mantenimiento Avanzado del Vehículo'),
        ('rutas_secretas', 'Rutas Escondidas y Consejos Nómadas'),
    ]
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='articulos_guia')
    titulo = models.CharField(max_length=250)
    slug = models.SlugField(max_length=260, unique=True, blank=True)
    categoria = models.CharField(max_length=40, choices=CATEGORIAS, default='supervivencia')
    resumen = models.TextField()
    contenido = models.TextField()
    imagen_cabecera = models.ImageField(upload_to='guia/', null=True, blank=True)
    destacado = models.BooleanField(default=False)
    fecha_publicacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_publicacion']

    def __str__(self):
        return self.titulo


class TemaTaller(models.Model):
    CATEGORIAS = [
        ('mantenimiento', 'Mantenimiento'),
        ('bircolaje', 'Bricolaje y Camperización'),
        ('piezas_3d', 'Piezas 3D y Modelos STL'),
    ]
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='temas_taller')
    categoria = models.CharField(max_length=30, choices=CATEGORIAS, default='mantenimiento')
    titulo = models.CharField(max_length=250)
    descripcion = models.TextField()
    archivo_stl = models.FileField(upload_to='taller_3d/', null=True, blank=True)
    imagen_adjunta = models.ImageField(upload_to='taller_fotos/', null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_creacion']

    def __str__(self):
        return self.titulo


class RespuestaTaller(models.Model):
    tema = models.ForeignKey(TemaTaller, on_delete=models.CASCADE, related_name='resppestas')
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='respuestas_taller')
    mensaje = models.TextField()
    archivo_adjunto = models.FileField(upload_to='taller_respuestas/', null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['fecha_creacion']
