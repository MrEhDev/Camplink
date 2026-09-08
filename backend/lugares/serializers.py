from rest_framework import serializers
from .models import Lugar, FotoLugar, ValoracionLugar, NotaPersonalLugar

class FotoLugarSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoLugar
        fields = ['id', 'imagen', 'pie_foto', 'fecha_subida']


class ValoracionLugarSerializer(serializers.ModelSerializer):
    explorador_username = serializers.CharField(source='explorador.username', read_only=True)
    explorador_avatar = serializers.ImageField(source='explorador.avatar', read_only=True)

    class Meta:
        model = ValoracionLugar
        fields = ['id', 'explorador', 'explorador_username', 'explorador_avatar', 'puntuacion_camper', 'comentario', 'foto', 'fecha']
        read_only_fields = ['explorador', 'fecha']


class NotaPersonalLugarSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotaPersonalLugar
        fields = ['id', 'lugar', 'explorador', 'contenido', 'fecha_modificacion', 'fecha_creacion']
        read_only_fields = ['lugar', 'explorador', 'fecha_modificacion', 'fecha_creacion']


class LugarSerializer(serializers.ModelSerializer):
    creador_username = serializers.CharField(source='creador.username', read_only=True)
    tipo_lugar_display = serializers.CharField(source='get_tipo_lugar_display', read_only=True)
    fotos = FotoLugarSerializer(many=True, read_only=True)
    valoraciones = ValoracionLugarSerializer(many=True, read_only=True)
    total_valoraciones = serializers.SerializerMethodField()
    checkins_ultimo_mes = serializers.SerializerMethodField()
    mi_nota_personal = serializers.SerializerMethodField()
    mis_notas_personales = serializers.SerializerMethodField()

    class Meta:
        model = Lugar
        fields = [
            'id', 'creador', 'creador_username', 'nombre', 'descripcion', 
            'tipo_lugar', 'tipo_lugar_display',
            'latitud', 'longitud', 'pais', 'comunidad_autonoma', 'provincia', 'poblacion',
            'precio', 'es_gratuito', 'foto_principal', 'valoracion_media',
            # Servicios
            'tiene_agua', 'tiene_lavabo', 'tiene_electricidad', 'tiene_wifi', 
            'tiene_basuras', 'tiene_duchas', 'tiene_vaciado_aguas_grises', 'tiene_vaciado_aguas_negras',
            # Entorno y Ocio
            'ideal_familias', 'tiene_senderismo', 'playa_cercana', 'rutas_en_bici', 'admite_mascotas',
            # Terreno y Acceso
            'acceso_asfaltado', 'mucha_sombra', 'muy_soleado', 'terreno_nivelado', 
            'apto_grandes_autocaravanas', 'permite_sacar_toldo',
            # Campos legacy
            'tiene_mesas_picnic', 'es_zona_recreativa', 'tiene_senderos_sencillos', 'ideal_ninos_10_anos',
            'total_valoraciones', 'checkins_ultimo_mes',
            'fotos', 'valoraciones', 'mi_nota_personal', 'mis_notas_personales', 'fecha_creacion'
        ]
        read_only_fields = ['creador', 'valoracion_media', 'fecha_creacion']

    def get_total_valoraciones(self, obj):
        return obj.valoraciones.count()

    def get_checkins_ultimo_mes(self, obj):
        from datetime import timedelta
        from django.utils import timezone
        hace_un_mes = timezone.now() - timedelta(days=30)
        return obj.checkins.filter(fecha_llegada__gte=hace_un_mes).values('explorador').distinct().count()

    def get_mi_nota_personal(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            nota = obj.notas_personales.filter(explorador=request.user).order_by('-fecha_creacion').first()
            return nota.contenido if nota else ''
        return ''

    def get_mis_notas_personales(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            notas = obj.notas_personales.filter(explorador=request.user).order_by('-fecha_creacion')
            return [
                {
                    'id': n.id,
                    'contenido': n.contenido,
                    'fecha_creacion': n.fecha_creacion.isoformat(),
                    'fecha_modificacion': n.fecha_modificacion.isoformat(),
                }
                for n in notas
            ]
        return []

    def to_representation(self, instance):
        data = super().to_representation(instance)
        fp = str(data.get('foto_principal') or '').split('?')[0]
        presets = ['pernocta_libre', 'area_autocaravanas', 'camping', 'parking_urbano', 'area_recreativa', 'solo_servicios']
        es_preset = any(fp.endswith(f'/{tipo}.jpg') or f'/lugares/{tipo}.jpg' in fp or f'/img/tipos/{tipo}.jpg' in fp for tipo in presets)
        if not fp or es_preset:
            request = self.context.get('request')
            preset = f'/media/lugares/{instance.tipo_lugar}.jpg?v=5'
            data['foto_principal'] = request.build_absolute_uri(preset) if request else preset
        return data
