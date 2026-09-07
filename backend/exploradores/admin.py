from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Explorador, RelacionSeguimiento, GrupoPrivacidad, Notificacion

@admin.register(Explorador)
class ExploradorAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'poblacion', 'is_staff', 'is_superuser')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'tipo_combustible')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'poblacion', 'vehiculo_marca', 'vehiculo_modelo')
    ordering = ('username',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Datos Camper & Vehículo', {
            'fields': ('biografia', 'avatar', 'poblacion', 'codigo_postal', 'vehiculo_marca', 'vehiculo_modelo', 
                       'consumo_medio_100km', 'capacidad_deposito_l', 'autonomia_km', 'tipo_combustible')
        }),
    )

@admin.register(RelacionSeguimiento)
class RelacionSeguimientoAdmin(admin.ModelAdmin):
    list_display = ('seguidor', 'seguido', 'estado', 'fecha_creacion')
    list_filter = ('estado', 'fecha_creacion')
    search_fields = ('seguidor__username', 'seguido__username')

@admin.register(GrupoPrivacidad)
class GrupoPrivacidadAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'creador', 'fecha_creacion')
    search_fields = ('nombre', 'creador__username')

@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ('usuario_destino', 'usuario_origen', 'tipo', 'titulo', 'leida', 'fecha_creacion')
    list_filter = ('tipo', 'leida', 'fecha_creacion')
    search_fields = ('usuario_destino__username', 'usuario_origen__username', 'titulo', 'mensaje')
