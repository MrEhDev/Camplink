from django.contrib import admin
from .models import ArticuloGuia, TemaTaller, RespuestaTaller

@admin.register(ArticuloGuia)
class ArticuloGuiaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'categoria', 'fecha_publicacion')
    list_filter = ('categoria', 'fecha_publicacion')
    search_fields = ('titulo', 'resumen', 'contenido')

@admin.register(TemaTaller)
class TemaTallerAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'autor', 'categoria', 'fecha_creacion')
    list_filter = ('categoria', 'fecha_creacion')
    search_fields = ('titulo', 'descripcion', 'autor__username')

@admin.register(RespuestaTaller)
class RespuestaTallerAdmin(admin.ModelAdmin):
    list_display = ('tema', 'autor', 'fecha_creacion')
    list_filter = ('fecha_creacion',)
    search_fields = ('tema__titulo', 'autor__username', 'mensaje')
