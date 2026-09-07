from django.contrib import admin
from .models import Lugar, FotoLugar, ValoracionLugar

@admin.register(Lugar)
class LugarAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'poblacion', 'provincia', 'comunidad_autonoma', 'es_gratuito', 'precio', 'valoracion_media', 'fecha_creacion')
    list_filter = ('es_gratuito', 'provincia', 'tiene_agua', 'tiene_vaciado_aguas_grises', 'tiene_electricidad', 'admite_mascotas')
    search_fields = ('nombre', 'descripcion', 'poblacion', 'provincia', 'comunidad_autonoma')

@admin.register(FotoLugar)
class FotoLugarAdmin(admin.ModelAdmin):
    list_display = ('lugar', 'pie_foto', 'fecha_subida')
    search_fields = ('lugar__nombre', 'pie_foto')

@admin.register(ValoracionLugar)
class ValoracionLugarAdmin(admin.ModelAdmin):
    list_display = ('lugar', 'explorador', 'puntuacion_camper', 'fecha')
    list_filter = ('puntuacion_camper', 'fecha')
    search_fields = ('lugar__nombre', 'explorador__username', 'comentario')
