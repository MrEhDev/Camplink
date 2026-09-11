# backend/comunidad/serializers.py
from rest_framework import serializers
from .models import (
    CategoriaPublicacion, PublicacionTaller,
    ImagenGaleriaPublicacion, ComentarioPublicacion,
    ArticuloGuia, TemaTaller, RespuestaTaller
)
from exploradores.serializers import ExploradorPerfilSerializer
import re


class CategoriaPublicacionSerializer(serializers.ModelSerializer):
    total_publicaciones = serializers.SerializerMethodField()

    class Meta:
        model = CategoriaPublicacion
        fields = ['id', 'nombre', 'slug', 'icono', 'color', 'descripcion', 'es_fija', 'total_publicaciones', 'fecha_creacion']
        read_only_fields = ['slug', 'fecha_creacion']

    def get_total_publicaciones(self, obj):
        return obj.publicaciones.filter(estado='aprobado').count()


class ImagenGaleriaPublicacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagenGaleriaPublicacion
        fields = ['id', 'publicacion', 'imagen', 'pie_de_foto', 'orden', 'fecha_subida']
        read_only_fields = ['fecha_subida']


class ComentarioPublicacionSerializer(serializers.ModelSerializer):
    autor_detalle = ExploradorPerfilSerializer(source='autor', read_only=True)

    class Meta:
        model = ComentarioPublicacion
        fields = ['id', 'publicacion', 'autor', 'autor_detalle', 'mensaje', 'archivo_adjunto', 'fecha_creacion']
        read_only_fields = ['autor', 'fecha_creacion']


class PublicacionTallerSerializer(serializers.ModelSerializer):
    autor_detalle = ExploradorPerfilSerializer(source='autor', read_only=True)
    categoria_detalle = CategoriaPublicacionSerializer(source='categoria', read_only=True)
    galeria = ImagenGaleriaPublicacionSerializer(many=True, read_only=True)
    comentarios = ComentarioPublicacionSerializer(many=True, read_only=True)
    total_comentarios = serializers.SerializerMethodField()
    video_embed_info = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = PublicacionTaller
        fields = [
            'id', 'autor', 'autor_detalle', 'titulo', 'slug', 'categoria',
            'categoria_detalle', 'resumen', 'contenido', 'imagen_principal',
            'video_url', 'video_embed_info', 'archivo_descargable',
            'enlace_externo', 'enlace_externo_texto', 'es_guia_oficial',
            'destacado', 'estado', 'estado_display', 'motivo_rechazo',
            'galeria', 'comentarios', 'total_comentarios',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ['autor', 'slug', 'fecha_creacion', 'fecha_actualizacion']

    def get_total_comentarios(self, obj):
        return obj.comentarios.count()

    def get_video_embed_info(self, obj):
        url = obj.video_url
        if not url:
            return None

        url_str = str(url).strip()

        # YouTube detection
        yt_match = re.search(r'(?:youtu\.be/|youtube\.com/(?:watch\?v=|shorts/|embed/))([a-zA-Z0-9_-]{11})', url_str)
        if yt_match:
            video_id = yt_match.group(1)
            return {
                'tipo': 'youtube',
                'id': video_id,
                'embed_url': f"https://www.youtube-nocookie.com/embed/{video_id}",
                'url': url_str
            }

        # TikTok detection
        tt_match = re.search(r'tiktok.com/.*+video/([0-9]+)/t?', url_str)
        if tt_match:
            video_id = tt_match.group(1)
            return {
                'tipo': 'tiktok',
                'id': video_id,
                'embed_url': f"https://www.tiktok.com/embed/{video_id}",
                'url': url_str
            }

        return {
            'tipo': 'otro',
            'id': None,
            'embed_url': None,
            'url': url_str
        }


# Serializadores legacy con retrocompatibilidad
class ArticuloGuiaSerializer(serializers.ModelSerializer):
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
    autor_detalle = ExploradorPerfilSerializer(source='autor', read_only=True)

    class Meta:
        model = RespuestaTaller
        fields = ['id', 'tema', 'autor', 'autor_detalle', 'mensaje', 'archivo_adjunto', 'fecha_creacion']
        read_only_fields = ['autor', 'fecha_creacion']


class TemaTallerSerializer(serializers.ModelSerializer):
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
        return obj.respuestas.count()
