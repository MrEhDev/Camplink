# Aquí defino los serializers para el Diario de Ruta (feed social), comentarios
# y los Check-ins de pernocta con protección de privacidad en las notas personales.

from rest_framework import serializers
from .models import Publicacion, ComentarioPublicacion, CheckIn, ReaccionPublicacion
from exploradores.serializers import ExploradorPerfilSerializer
from lugares.serializers import LugarSerializer

class ComentarioPublicacionSerializer(serializers.ModelSerializer):
    # Aquí serializo las respuestas de los exploradores en el feed del Diario de Ruta
    autor_detalle = ExploradorPerfilSerializer(source='autor', read_only=True)

    class Meta:
        model = ComentarioPublicacion
        fields = ['id', 'publicacion', 'autor', 'autor_detalle', 'texto', 'fecha']
        read_only_fields = ['autor', 'fecha']


class PublicacionSerializer(serializers.ModelSerializer):
    # Aquí serializo las publicaciones del Diario de Ruta, incluyendo datos del autor,
    # mención al lugar de pernocta y comentarios de la comunidad.
    autor_detalle = ExploradorPerfilSerializer(source='autor', read_only=True)
    lugar_detalle = LugarSerializer(source='lugar', read_only=True)
    comentarios = ComentarioPublicacionSerializer(many=True, read_only=True)
    total_comentarios = serializers.SerializerMethodField()
    reacciones_resumen = serializers.SerializerMethodField()
    mis_reacciones = serializers.SerializerMethodField()

    class Meta:
        model = Publicacion
        fields = [
            'id', 'autor', 'autor_detalle', 'contenido', 'imagen',
            'lugar', 'lugar_detalle', 'visibilidad', 'grupo_privado',
            'comentarios', 'total_comentarios', 'reacciones_resumen', 'mis_reacciones', 'fecha_creacion'
        ]
        read_only_fields = ['autor', 'fecha_creacion']


    def get_reacciones_resumen(self, obj):
        # Aquí devuelvo el conteo agrupado de reacciones camper (fuego, pino, alerta)
        from django.db.models import Count
        conteos = obj.reacciones.values('tipo').annotate(total=Count('tipo'))
        res = {'fuego': 0, 'pino': 0, 'alerta': 0}
        for c in conteos:
            res[c['tipo']] = c['total']
        return res

    def get_mis_reacciones(self, obj):
        # Aquí devuelvo los tipos de reacción que el usuario conectado ha otorgado
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return list(obj.reacciones.filter(usuario=request.user).values_list('tipo', flat=True))
        return []

    def get_total_comentarios(self, obj):
        # Aquí obtengo el número total de comentarios de esta publicación
        return obj.comentarios.count()


class CheckInSerializer(serializers.ModelSerializer):
    # Aquí serializo el registro de pernocta, protegiendo las notas privadas para que solo
    # el explorador que las redactó pueda verlas en su respuesta.
    explorador_detalle = ExploradorPerfilSerializer(source='explorador', read_only=True)
    lugar_detalle = LugarSerializer(source='lugar', read_only=True)
    notas_privadas = serializers.SerializerMethodField()

    class Meta:
        model = CheckIn
        fields = [
            'id', 'explorador', 'explorador_detalle', 'lugar', 'lugar_detalle',
            'fecha_llegada', 'dias_previstos', 'valoracion_camper',
            'comentario_publico', 'foto', 'notas_privadas', 'viaje', 'fecha_creacion'
        ]
        read_only_fields = ['explorador', 'viaje', 'fecha_creacion']

    def get_notas_privadas(self, obj):
        # Aquí garantizo la privacidad estricta: solo devuelvo las notas si el usuario autenticado es el autor
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated and request.user.id == obj.explorador_id:
            return obj.notas_privadas
        return ''


class CheckInCrearSerializer(serializers.ModelSerializer):
    # Aquí serializo la creación de un nuevo Check-in recibiendo las notas privadas y los días de pernocta
    class Meta:
        model = CheckIn
        fields = [
            'id', 'lugar', 'fecha_llegada', 'dias_previstos',
            'valoracion_camper', 'comentario_publico', 'foto', 'notas_privadas'
        ]