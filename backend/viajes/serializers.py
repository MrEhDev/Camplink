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
        def _get_equipamiento(lug):
            if not lug: return []
            items = []
            if getattr(lug, 'tiene_agua', False): items.append('Agua potable')
            if getattr(lug, 'tiene_electricidad', False): items.append('Electricidad')
            if getattr(lug, 'tiene_vaciado_aguas_grises', False): items.append('Vaciado aguas grises')
            if getattr(lug, 'tiene_vaciado_aguas_negras', False): items.append('Vaciado aguas negras (WC)')
            if getattr(lug, 'tiene_duchas', False): items.append('Duchas')
            if getattr(lug, 'tiene_lavabo', False): items.append('Lavabos')
            if getattr(lug, 'tiene_wifi', False): items.append('Wi-Fi')
            if getattr(lug, 'tiene_basuras', False): items.append('Basuras')
            return items

        def _get_entorno(lug):
            if not lug: return []
            items = []
            if getattr(lug, 'admite_mascotas', False): items.append('Admite mascotas')
            if getattr(lug, 'tiene_senderismo', False): items.append('Senderismo')
            if getattr(lug, 'playa_cercana', False): items.append('Playa cercana')
            if getattr(lug, 'rutas_en_bici', False): items.append('Rutas en bici')
            if getattr(lug, 'ideal_familias', False): items.append('Ideal familias')
            return items

        def _get_acceso(lug):
            if not lug: return []
            items = []
            if getattr(lug, 'acceso_asfaltado', False): items.append('Acceso asfaltado')
            if getattr(lug, 'terreno_nivelado', False): items.append('Terreno nivelado')
            if getattr(lug, 'apto_grandes_autocaravanas', False): items.append('Apto autocaravanas >7m')
            if getattr(lug, 'permite_sacar_toldo', False): items.append('Permite toldo/mesas')
            if getattr(lug, 'mucha_sombra', False): items.append('Mucha sombra')
            if getattr(lug, 'muy_soleado', False): items.append('Muy soleado')
            return items

        return [
            {
                'id': ch.id,
                'lugar_id': ch.lugar.id,
                'lugar_nombre': ch.lugar.nombre,
                'tipo_lugar': ch.lugar.tipo_lugar,
                'tipo_lugar_display': ch.lugar.get_tipo_lugar_display(),
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
                'equipamiento': _get_equipamiento(ch.lugar),
                'entorno': _get_entorno(ch.lugar),
                'acceso': _get_acceso(ch.lugar),
            }
            for ch in obj.checkins_asociados.all().order_by('fecha_llegada')
        ]