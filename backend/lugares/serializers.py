# Aquí defino los serializers para el modelo Lugar, sus valoraciones con iconos camper
# y las fotos complementarias de los puntos de pernocta.

from rest_framework import serializers
from .models import Lugar, FotoLugar, ValoracionLugar
from exploradores.serializers import ExploradorPerfilSerializer

class FotoLugarSerializer(serializers.ModelSerializer):
    # Aquí serializo las fotos complementarias de la galería de cada Lugar
    class Meta:
        model = FotoLugar
        fields = ['id', 'imagen', 'pie_foto', 'fecha_subida']


class ValoracionLugarSerializer(serializers.ModelSerializer):
    # Aquí serializo las opiniones y valoraciones camper (1 a 5 furgonetas/tiendas) de los exploradores
    explorador_detalle = ExploradorPerfilSerializer(source='explorador', read_only=True)

    class Meta:
        model = ValoracionLugar
        fields = ['id', 'lugar', 'explorador', 'explorador_detalle', 'puntuacion_camper', 'comentario', 'fecha']
        read_only_fields = ['explorador', 'fecha']


class LugarSerializer(serializers.ModelSerializer):
    # Aquí serializo la información completa del Lugar, incluyendo servicios camper,
    # coordenadas GPS, filtros temáticos, autor y reseñas asociadas.
    creador_detalle = ExploradorPerfilSerializer(source='creador', read_only=True)
    fotos = FotoLugarSerializer(many=True, read_only=True)
    valoraciones = ValoracionLugarSerializer(many=True, read_only=True)
    total_valoraciones = serializers.SerializerMethodField()
    checkins_ultimo_mes = serializers.SerializerMethodField()

    class Meta:
        model = Lugar
        fields = [
            'id', 'nombre', 'descripcion', 'latitud', 'longitud',
            'pais', 'comunidad_autonoma', 'provincia', 'poblacion',
            'precio', 'es_gratuito', 'foto_principal',
            'tiene_agua', 'tiene_lavabo', 'tiene_duchas', 'tiene_electricidad',
            'tiene_vaciado_aguas_grises', 'tiene_vaciado_aguas_negras',
            'admite_mascotas', 'tiene_wifi', 'tiene_mesas_picnic',
            'es_zona_recreativa', 'tiene_senderos_sencillos', 'ideal_ninos_10_anos',
            'apto_grandes_autocaravanas', 'permite_sacar_toldo',
            'valoracion_media', 'total_valoraciones', 'checkins_ultimo_mes', 'creador', 'creador_detalle',
            'fotos', 'valoraciones', 'fecha_creacion'
        ]
        read_only_fields = ['creador', 'valoracion_media', 'fecha_creacion']

    def get_total_valoraciones(self, obj):
        # Aquí cuento el total de reseñas registradas para este lugar
        return obj.valoraciones.count()

    def get_checkins_ultimo_mes(self, obj):
        # Aquí calculo cuántos exploradores únicos han hecho check-in en este lugar durante el último mes
        from datetime import timedelta
        from django.utils import timezone
        hace_un_mes = timezone.now() - timedelta(days=30)
        return obj.checkins.filter(fecha_llegada__gte=hace_un_mes).values('explorador').distinct().count()
