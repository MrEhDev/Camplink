# Aquí defino los serializers para el modelo Explorador, registro de usuarios,
# perfiles públicos nómadas con trofeos destacados (el de mayor rango de cada tipo) y relaciones de seguimiento.

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Explorador, GrupoPrivacidad, RelacionSeguimiento, Notificacion
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
            'tipo_viajero', 'tipo_combustible', 'capacidad_deposito_l', 'consumo_medio_l_100km', 'foto_vehiculo', 'avatar', 'biografia'
        ]

    def validate_username(self, value):
        return str(value).strip().lower()

    def validate_email(self, value):
        email = str(value).strip().lower()
        if not email:
            raise serializers.ValidationError('El correo electrónico es obligatorio.')
        if Explorador.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('Ya existe una cuenta registrada con este correo electrónico.')
        return email

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Las contraseñas no coinciden.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Valores por defecto requeridos por la especificación si no se proporcionan (50L y 7.0L/100km)
        if not validated_data.get('capacidad_deposito_l'):
            validated_data['capacidad_deposito_l'] = 50.0
        if not validated_data.get('consumo_medio_l_100km'):
            validated_data['consumo_medio_l_100km'] = 7.0

        explorador = Explorador(**validated_data)
        explorador.set_password(password)
        explorador.save()
        return explorador


PROVINCIAS_CODIGO_POSTAL = {
    '01': 'Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería', '05': 'Ávila',
    '06': 'Badajoz', '07': 'Baleares', '08': 'Barcelona', '09': 'Burgos', '10': 'Cáceres',
    '11': 'Cádiz', '12': 'Castellón', '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña',
    '16': 'Cuenca', '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Gipuzkoa',
    '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León', '25': 'Lleida',
    '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid', '29': 'Málaga', '30': 'Murcia',
    '31': 'Navarra', '32': 'Ourense', '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas',
    '36': 'Pontevedra', '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39': 'Cantabria', '40': 'Segovia',
    '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona', '44': 'Teruel', '45': 'Toledo',
    '46': 'Valencia', '47': 'Valladolid', '48': 'Bizkaia', '49': 'Zamora', '50': 'Zaragoza',
    '51': 'Ceuta', '52': 'Melilla'
}

def resolver_provincia_base(obj):
    if not obj:
        return ''
    cp = (getattr(obj, 'codigo_postal', '') or '').strip()
    if len(cp) >= 2:
        pref = cp[:2].zfill(2)
        if pref in PROVINCIAS_CODIGO_POSTAL:
            return PROVINCIAS_CODIGO_POSTAL[pref]
    texto = f"{getattr(obj, 'poblacion', '') or ''} {getattr(obj, 'direccion_base', '') or ''}".lower()
    for prov in PROVINCIAS_CODIGO_POSTAL.values():
        if prov.lower() in texto:
            return prov
    return getattr(obj, 'poblacion', '') or getattr(obj, 'pais', '') or 'España'

class ExploradorPerfilSerializer(serializers.ModelSerializer):
    # Aquí preparo el serializer para consultar el perfil público y privado del Explorador,
    # calculando los trofeos de mayor valor de cada categoría y el estado de seguimiento.
    tipo_viajero_display = serializers.CharField(source='get_tipo_viajero_display', read_only=True)
    es_admin = serializers.BooleanField(read_only=True)
    provincia = serializers.SerializerMethodField()
    trofeos_destacados = serializers.SerializerMethodField()
    estado_seguimiento = serializers.SerializerMethodField()
    total_seguidores = serializers.SerializerMethodField()
    total_siguiendo = serializers.SerializerMethodField()
    companeros_de_ruta = serializers.SerializerMethodField()

    class Meta:
        model = Explorador
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'fecha_nacimiento', 'pais', 'poblacion', 'provincia', 'codigo_postal', 'direccion_base',
            'lat_base', 'lng_base', 'tipo_viajero', 'tipo_viajero_display', 'capacidad_deposito_l', 'consumo_medio_l_100km', 'tipo_combustible', 'autonomia_estimada_km',
            'foto_vehiculo', 'avatar', 'biografia', 'rol', 'es_admin', 'is_staff', 'is_superuser',
            'notif_email_comentarios', 'notif_email_reacciones', 'notif_email_taller', 'notif_email_seguidos', 'notif_push_comentarios', 'notif_push_reacciones', 'notif_push_taller', 'notif_push_seguidos',
            'trofeos_destacados', 'companeros_de_ruta', 'estado_seguimiento', 'total_seguidores',
            'total_siguiendo', 'date_joined'
        ]
        read_only_fields = ['id', 'username', 'rol', 'date_joined', 'autonomia_estimada_km']

    def get_provincia(self, obj):
        return resolver_provincia_base(obj)

    def get_total_seguidores(self, obj):
        # Aquí devuelvo el número de exploradores que siguen a este usuario
        return obj.seguidores.filter(estado='aceptada').count()

    def get_total_siguiendo(self, obj):
        # Aquí devuelvo a cuántos exploradores sigue este usuario
        return obj.siguiendo.filter(estado='aceptada').count()

    def get_estado_seguimiento(self, obj):
        # Aquí verifico si el usuario autenticado sigue a este explorador
        request = self.context.get('request')
        if not request or not hasattr(request, 'user') or not request.user.is_authenticated or request.user.id == obj.id:
            return 'propio'

        rel = RelacionSeguimiento.objects.filter(seguidor=request.user, seguido=obj).first()
        if rel:
            return rel.estado  # 'pendiente', 'aceptada', 'rechazada'
        return 'ninguno'

    def get_companeros_de_ruta(self, obj):
        # Aquí devuelvo la lista de compañeros de ruta mutuos de este explorador
        request = self.context.get('request')
        if not request or not hasattr(request, 'user') or not request.user.is_authenticated or request.user.id != obj.id:
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

class NotificacionSerializer(serializers.ModelSerializer):
    usuario_origen_nombre = serializers.CharField(source='usuario_origen.username', read_only=True)
    usuario_origen_avatar = serializers.ImageField(source='usuario_origen.avatar', read_only=True)

    class Meta:
        model = Notificacion
        fields = [
            'id', 'usuario_destino', 'usuario_origen', 'usuario_origen_nombre', 
            'usuario_origen_avatar', 'tipo', 'titulo', 'mensaje', 'leida', 
            'enlace', 'fecha_creacion'
        ]
