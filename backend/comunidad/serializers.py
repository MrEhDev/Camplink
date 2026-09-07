# Aquí defino los serializers para la Guía del Nómada (artículos técnicos del administrador)
# y el Taller Nómada (foro comunitario con soporte de archivos 3D .stl).

from rest_framework import serializers
from .models import ArticuloGuia, TemaTaller, RespuestaTaller
from exploradores.serializers import ExploradorPerfilSerializer

class ArticuloGuiaSerializer(serializers.ModelSerializer):
    # Aquí serializo los artículos oficiales de la Guía del Nómada escritos por los administradores
    autor_detalle = ExploradorPerfilSerializer(source='autor', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)

    class Meta:
        model = ArticuloGuia
        fields = [
            'id', 'autor', 'autor_detalle', 'titulo', 'slug', 'categoria',
            'categoria_display', 'resumen', 'contenido', 'imagen_cabecera',
            'destacado', 'fecha_publicacion'
        ]
        read_only_fields = ['autor', 'slug', 'fecha_publicacion']


class RespuestaTallerSerializer(serializers.ModelSerializer):
    # Aquí serializo las respuestas de los exploradores en los hilos del Taller Nómada
    autor_detalle = ExploradorPerfilSerializer(source='autor', read_only=True)

    class Meta:
        model = RespuestaTaller
        fields = ['id', 'tema', 'autor', 'autor_detalle', 'mensaje', 'archivo_adjunto', 'fecha_creacion']
        read_only_fields = ['autor', 'fecha_creacion']


class TemaTallerSerializer(serializers.ModelSerializer):
    # Aquí serializo los hilos del foro del Taller, incluyendo el archivo .stl y respuestas
    autor_detalle = ExploradorPerfilSerializer(source='autor', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    respuestas = RespuestaTallerSerializer(many=True, read_only=True)
    total_respuestas = serializers.SerializerMethodField()

    class Meta:
        model = TemaTaller
        fields = [
            'id', 'autor', 'autor_detalle', 'categoria', 'categoria_display',
            'titulo', 'descripcion', 'archivo_stl', 'imagen_adjunta',
            'respuestas', 'total_respuestas', 'fecha_creacion'
        ]
        read_only_fields = ['autor', 'fecha_creacion']

    def get_total_respuestas(self, obj):
        # Aquí calculo la cantidad de intervenciones en este hilo del taller
        return obj.respuestas.count()