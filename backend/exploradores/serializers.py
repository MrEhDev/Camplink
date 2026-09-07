# Aquí defino los serializers para el modelo Explorador, registro de usuarios,
# perfiles públicos nómadas con trofeos destacados (el de mayor rango de cada tipo) y relaciones de seguimiento.

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Explorador, GrupoPrivacidad, RelacionSeguimiento
from viajes.models import TrofeoExplorador, Trofeo

class ExploradorRegistroSerializer(serializers.ModelSerializer):
    # Aquí configuro el serializer para registrar un nuevo Explorador con todos sus datos
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Explorador
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'fecha_nacimiento',
            'pais', 'poblacion', 'codigo_postal', 'direccion_base', 'lat_base', 'lng_base',
            'tipo_viajero', 'tipo_combustible', 'foto_vehiculo', 'avatar', 'biografia'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Las contraseñas no coinciden.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        explorador = Explorador(**validated_data)
        explorador.set_password(password)
        explorador.save()
        return explorador


class ExploradorPerfilSerializer(serializers.ModelSerializer):
    # Aquí preparo el serializer para consultar el perfil público y privado del Explorador,
    # calculando los trofeos de mayor valor de cada categoría y el estado de seguimiento.
    tipo_viajero_display = serializers.CharField(source='get_tipo_viajero_display', read_only=True)
    es_admin = serializers.BooleanField(read_only=True)
    trofeos_destacados = serializers.SerializerMethodField()
    estado_seguimiento = serializers.SerializerMethodField()
    total_seguidores = serializers.SerializerMethodField()
    total_siguiendo = serializers.SerializerMethodField()
    companeros_de_ruta = serializers.SerializerMethodField()

    class Meta:
        model = Explorador
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'fecha_nacimiento', 'pais', 'poblacion', 'codigo_postal', 'direccion_base',
            'lat_base', 'lng_base', 'tipo_viajero', 'tipo_viajero_display', 'capacidad_deposito_l', 'consumo_medio_l_100km', 'tipo_combustible', 'autonomia_estimada_km',
            'foto_vehiculo', 'avatar', 'biografia', 'rol', 'es_admin', 'is_staff', 'is_superuser',
            'trofeos_destacados', 'companeros_de_ruta', 'estado_seguimiento', 'total_seguidores',
            'total_siguiendo', 'date_joined'
        ]
        read_only_fields = ['id', 'username', 'rol', 'date_joined', 'autonomia_estimada_km']

    def get_total_seguidores(self, obj):
        # Aquí devuelvo el número de exploradores que siguen a este usuario
        return obj.seguidores.filter(estado='aceptada').count()

    def get_total_siguiendo(self, obj):
        # Aquí devuelvo a cuántos exploradores sigue este usuario
        return obj.siguiendo.filter(estado='aceptada').count()

    def get_estado_seguimiento(self, obj):
        # Aquí verifico si el usuario autenticado sigue a este explorador
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or request.user.id == obj.id:
            return 'propio'

        rel = RelacionSeguimiento.objects.filter(seguidor=request.user, seguido=obj).first()
        if rel:
            return rel.estado  # 'pendiente', 'aceptada', 'rechazada'
        return 'ninguno'

    def get_companeros_de_ruta(self, obj):
        # Aquí devuelvo la lista de compañeros de ruta mutuos de este explorador
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or request.user.id != obj.id:
            return []
        ids_amigos = RelacionSeguimiento.objects.filter(seguidor=obj, estado='aceptada').values_list('seguido_id', flat=True)
        amigos = Explorador.objects.filter(id__in=ids_amigos)
        return [{'id': a.id, 'username': a.username, 'poblacion': a.poblacion, 'tipo_viajero': a.get_tipo_viajero_display()} for a in amigos]

    def get_trofeos_destacados(self, obj):
        # Aquí obtengo los trofeos destacados personalizados o, por defecto, el de mayor rango de cada categoría
        niveles_peso = {'madera': 1, 'bronce': 2, 'plata': 3, 'oro': 4, 'platino': 5}
        conseguidos = TrofeoExplorador.objects.filter(explorador=obj).select_related('trofeo')
        manuales = conseguidos.filter(es_destacado=True)
        if manuales.exists():
            res_manuales = []
            for m in manuales:
                res_manuales.append({
                    'id': m.trofeo.id,
                    'nombre': m.trofeo.nombre,
                    'descripcion': m.trofeo.descripcion,
                    'nivel': m.trofeo.nivel,
                    'icono': m.trofeo.icono,
                    'requisito_tipo': m.trofeo.requisito_tipo,
                    'fecha_desbloqueo': m.fecha_desbloqueo.strftime('%d/%m/%Y'),
                })
            res_manuales.sort(key=lambda x: niveles_peso.get(x['nivel'], 1), reverse=True)
            return res_manuales

        trofeos_por_tipo = {}
        for c in conseguidos:
            tipo = c.trofeo.requisito_tipo
            peso_actual = niveles_peso.get(c.trofeo.nivel, 1)

            if tipo not in trofeos_por_tipo:
                trofeos_por_tipo[tipo] = (c, peso_actual)
            else:
                if peso_actual > trofeos_por_tipo[tipo][1]:
                    trofeos_por_tipo[tipo] = (c, peso_actual)

        resultado = []
        for tipo, (conseguido, _) in trofeos_por_tipo.items():
            resultado.append({
                'id': conseguido.trofeo.id,
                'nombre': conseguido.trofeo.nombre,
                'descripcion': conseguido.trofeo.descripcion,
                'nivel': conseguido.trofeo.nivel,
                'icono': conseguido.trofeo.icono,
                'requisito_tipo': conseguido.trofeo.requisito_tipo,
                'fecha_desbloqueo': conseguido.fecha_desbloqueo.strftime('%d/%m/%Y'),
            })

        # Ordeno por nivel de mayor a menor
        resultado.sort(key=lambda x: niveles_peso.get(x['nivel'], 1), reverse=True)
        return resultado


class GrupoPrivacidadSerializer(serializers.ModelSerializer):
    creador_username = serializers.CharField(source='creador.username', read_only=True)
    miembros_detalle = ExploradorPerfilSerializer(source='miembros', many=True, read_only=True)

    class Meta:
        model = GrupoPrivacidad
        fields = ['id', 'nombre', 'descripcion', 'creador', 'creador_username', 'miembros', 'miembros_detalle', 'fecha_creacion']
        read_only_fields = ['creador', 'fecha_creacion']


class RelacionSeguimientoSerializer(serializers.ModelSerializer):
    seguidor_info = ExploradorPerfilSerializer(source='seguidor', read_only=True)
    seguido_info = ExploradorPerfilSerializer(source='seguido', read_only=True)

    class Meta:
        model = RelacionSeguimiento
        fields = ['id', 'seguidor', 'seguido', 'seguidor_info', 'seguido_info', 'estado', 'fecha_creacion']
        read_only_fields = ['seguidor', 'fecha_creacion']