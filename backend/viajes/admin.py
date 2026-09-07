from django.contrib import admin
from .models import Viaje, Trofeo, TrofeoExplorador

@admin.register(Viaje)
class ViajeAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'explorador', 'fecha_inicio', 'fecha_fin', 'esta_cerrado', 'km_totales', 'fecha_creacion')
    list_filter = ('esta_cerrado', 'fecha_inicio')
    search_fields = ('titulo', 'explorador__username', 'descripcion')

@admin.register(Trofeo)
class TrofeoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'nivel', 'categoria_nombre', 'requisito_tipo', 'requisito_cantidad', 'unidad')
    list_filter = ('nivel', 'categoria', 'requisito_tipo')
    search_fields = ('codigo', 'nombre', 'descripcion')

@admin.register(TrofeoExplorador)
class TrofeoExploradorAdmin(admin.ModelAdmin):
    list_display = ('explorador', 'trofeo', 'es_destacado', 'fecha_desbloqueo')
    list_filter = ('es_destacado', 'trofeo__nivel', 'fecha_desbloqueo')
    search_fields = ('explorador__username', 'trofeo__nombre')
