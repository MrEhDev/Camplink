from django.contrib import admin
from .models import (
    CategoriaPublicacion, PublicacionTaller,
    ImagenGaleriaPublicacion, ComentarioPublicacion,
    ArticuloGuia, TemaTaller, RespuestaTaller
)


class ImagenGaleriaInline(admin.TabularInline):
    model = ImagenGaleriaPublicacion
    extra = 1


class ComentarioInline(admin.StackedInline):
    model = ComentarioPublicacion
    extra = 0
    readonly_fields = ('fecha_creacion',)


@admin.register(CategoriaPublicacion)
class CategoriaPublicacionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'slug', 'icono', 'color', 'es_fija', 'fecha_creacion')
    list_filter = ('es_fija', 'fecha_creacion')
    search_fields = ('nombre', 'descripcion')


@admin.register(PublicacionTaller)
class PublicacionTallerAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'autor', 'categoria', 'estado', 'es_guia_oficial', 'destacado', 'fecha_creacion')
    list_filter = ('estado', 'categoria', 'es_guia_oficial', 'destacado', 'fecha_creacion')
    search_fields = ('titulo', 'resumen', 'contenido', 'autor__username')
    inlines = [ImagenGaleriaInline, ComentarioInline]


@admin.register(ArticuloGuia)
class ArticuloGuiaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'categoria', 'fecha_publicacion')
    list_filter = ('categoria', 'fecha_publicacion')
    search_fields = ('titulo', 'resumen', 'contenido')

@admin.register(TemaTaller)
class TemaTallerAdmin0(admin.ModelAdmin):
    list_display = ('titulo', 'autor', 'categoria', 'fecha_creacion')
    list_filter = ('categoria', 'fecha_creacion')
    search_fields = ('titulo', 'descripcion', 'autor__username')

@admin.register(RespuestaTaller)
class RespuestaTallerAdmin(admin.ModelAdmin):
    list_display = ('tema', 'autor', 'fecha_creacion')
    list_filter = ('fecha_creacion',)
    search_fields = ('tema__titulo', 'autor__username', 'mensaje')
