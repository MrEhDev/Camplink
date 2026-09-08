# Aquí defino los serializers para el modelo Viaje (agrupación inteligente de pernoctas),
# las rutas punto a punto, las estadísticas globales y la vitrina de Trofeos camper.

from rest_framework import serializers
from .models import Viaje, Trofeo, TrofeoExplorador
from exploradores.serializers import ExploradorPerfilSerializer

class TrofeoSerializer(serializers.ModelSerializer):
    # Aquí serializo la información y condecoración de cada trofeo del catálogo nómada
    class Meta:
        model = Trofeo
        fields = ['id', 'codigo', 'nombre', 'descripcion', 'nivel', 'icono', 'requisito_tipo', 'requisito_cantidad']


class TrofeoExploradorSerializer(serializers.ModelSerializer):
    # Aquí serializo los trofeos desbloqueados por el explorador con su fecha de consecución
    trofeo = TrofeoSerializer(read_only=True)

    class Meta:
        model = TrofeoExplorador
        fields = ['id', 'trofeo', 'fecha_desbloqueo', 'es_destacado']


class ViajeSerializer(serializers.ModelSerializer):
    # Aquí serializo los datos del viaje, sus paradas cronológicas, kilómetros y duración en días
    explorador_detalle = ExploradorPerfilSerializer(source='explorador', read_only=True)
    duracion_dias = serializers.IntegerField(read_only=True)
    checkins_resumen = serializers.SerializerMethodField()
    tipo_estado = serializers.SerializerMethodField()
    siguiente_pernocta = serializers.SerializerMethodField()

    class Meta:
        model = Viaje
        fields = [
            'id', 'explorador', 'explorador_detalle', 'titulo', 'descripcion',
            'fecha_inicio', 'fecha_fin', 'esta_cerrado', 'km_totales',
            'comunidades_visitadas', 'paises_visitados', 'resumen_ruta',
            'duracion_dias', 'checkins_resumen', 'tipo_estado', 'siguiente_pernocta', 'fecha_creacion'
        ]
        read_only_fields = ['explorador', 'fecha_creacion']

    def get_tipo_estado(self, obj):
        # Aquí determino si el viaje está finalizado, en curso o planificado para el futuro
        from django.utils import timezone
        if obj.esta_cerrado:
            return 'finalizado'
        elif obj.fecha_inicio > timezone.now().date():
            return 'futuro'
        return 'en_curso'

    def get_siguiente_pernocta(self, obj):
        # Aquí obtengo la próxima parada planificada del viaje con coordenadas y botón para ir
        from django.utils import timezone
        hoy = timezone.now().date()
        proxima = obj.checkins_asociados.filter(fecha_llegada__date__gte=hoy).order_by('fecha_llegada').first()
        if not proxima and not obj.esta_cerrado:
            proxima = obj.checkins_asociados.order_by('fecha_llegada').last()
        if proxima:
            return {
                'id': proxima.id,
                'lugar_id': proxima.lugar.id,
                'nombre': proxima.lugar.nombre,
                'poblacion': proxima.lugar.poblacion,
                'provincia': proxima.lugar.provincia,
                'latitud': proxima.lugar.latitud,
                'longitud': proxima.lugar.longitud,
                'fecha_llegada': proxima.fecha_llegada,
                'dias_previstos': proxima.dias_previstos,
            }
        return None

    def get_checkins_resumen(self, obj):
        # Aquí obtengo una lista detallada de los check-ins vinculados a este viaje (etapas, fotos, notas privadas si es dueño)
        request = self.context.get('request')
        es_dueno = request and hasattr(request, 'user') and request.user.is_authenticated and (request.user == obj.explorador or request.user.id == obj.explorador_id)
        return [
            {
                'id': ch.id,
                'lugar_id': ch.lugar.id,
                'lugar_nombre': ch.lugar.nombre,
                'poblacion': ch.lugar.poblacion,
                'provincia': ch.lugar.provincia,
                'latitud': ch.lugar.latitud,
                'longitud': ch.lugar.longitud,
                'fecha_llegada': ch.fecha_llegada,
                'dias_previstos': ch.dias_previstos,
                'valoracion_camper': ch.valoracion_camper,
                'comentario_publico': ch.comentario_publico,
                'notas_privadas': ch.notas_privadas if es_dueno else '',
                'foto': ch.foto.url if ch.foto else None,
            }
            for ch in obj.checkins_asociados.all().order_by('fecha_llegada')
        ]