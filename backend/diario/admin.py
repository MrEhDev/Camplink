from django.contrib import admin
from .models import Publicacion, ComentarioPublicacion, CheckIn, ReaccionPublicacion

@admin.register(Publicacion)
class PublicacionAdmin(admin.ModelAdmin):
    list_display = ('id', 'autor', 'visibilidad', 'lugar', 'fecha_creacion')
    list_filter = ('visibilidad', 'fecha_creacion')
    search_fields = ('autor__username', 'contenido', 'lugar__nombre')

@admin.register(ComentarioPublicacion)
class ComentarioPublicacionAdmin(admin.ModelAdmin):
    list_display = ('id', 'publicacion', 'autor', 'texto', 'fecha')
    list_filter = ('fecha',)
    search_fields = ('autor__username', 'texto')

@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = ('explorador', 'lugar', 'fecha_llegada', 'dias_previstos', 'valoracion_camper', 'viaje')
    list_filter = ('valoracion_camper', 'fecha_llegada')
    search_fields = ('explorador__username', 'lugar__nombre', 'comentario_publico')

@admin.register(ReaccionPublicacion)
class ReaccionPublicacionAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'publicacion', 'tipo', 'fecha_creacion')
    list_filter = ('tipo', 'fecha_creacion')
    search_fields = ('usuario__username',)
