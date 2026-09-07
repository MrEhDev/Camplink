# Aquí defino los modelos de datos para la gestión de usuarios (Exploradores),
# sus perfiles camper, relaciones de seguimiento y grupos de privacidad para el Diario de Ruta.

from django.db import models
from django.contrib.auth.models import AbstractUser

class Explorador(AbstractUser):
    # Aquí configuro el modelo del Explorador (usuario personalizado) para almacenar sus datos de perfil,
    # el vehículo que conduce, su dirección base para calcular rutas y su rol en la plataforma.
    TIPO_VIAJERO_CHOICES = [
        ('camper', 'Camper'),
        ('acampada', 'Acampada'),
        ('autocaravana', 'Autocaravana'),
    ]

    TIPO_COMBUSTIBLE_CHOICES = [
        ('gasoleo_a', 'Diésel / Gasóleo A'),
        ('gasolina_95', 'Gasolina 95 E5'),
        ('gasolina_98', 'Gasolina 98 E5'),
        ('glp', 'GLP / Autogás'),
    ]

    ROL_CHOICES = [
        ('explorador', 'Explorador'),
        ('administrador', 'Administrador'),
    ]

    fecha_nacimiento = models.DateField(null=True, blank=True, verbose_name='Fecha de Nacimiento')
    pais = models.CharField(max_length=100, default='España', verbose_name='País')
    poblacion = models.CharField(max_length=100, blank=True, default='', verbose_name='Población')
    codigo_postal = models.CharField(max_length=10, blank=True, default='', verbose_name='Código Postal')
    direccion_base = models.CharField(max_length=255, blank=True, default='', verbose_name='Dirección Base')
    lat_base = models.FloatField(null=True, blank=True, verbose_name='Latitud Base')
    lng_base = models.FloatField(null=True, blank=True, verbose_name='Longitud Base')
    tipo_viajero = models.CharField(max_length=20, choices=TIPO_VIAJERO_CHOICES, default='camper', verbose_name='Tipo de Viajero')
    foto_vehiculo = models.ImageField(upload_to='vehiculos/', null=True, blank=True, verbose_name='Foto del Vehículo')
    avatar = models.ImageField(upload_to='avatares/', null=True, blank=True, verbose_name='Foto de Perfil')
    biografia = models.TextField(blank=True, default='', verbose_name='Biografía Camper')
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default='explorador', verbose_name='Rol')

    capacidad_deposito_l = models.FloatField(default=60.0, verbose_name='Capacidad del Depósito (Litros)')
    consumo_medio_l_100km = models.FloatField(default=8.5, verbose_name='Consumo Medio (L/100km)')
    tipo_combustible = models.CharField(max_length=20, choices=TIPO_COMBUSTIBLE_CHOICES, default='gasoleo_a', verbose_name='Tipo de Combustible')

    @property
    def autonomia_estimada_km(self):
        # Aquí calculo la autonomía máxima aproximada con un depósito completo
        if self.consumo_medio_l_100km and self.consumo_medio_l_100km > 0:
            return round((self.capacidad_deposito_l / self.consumo_medio_l_100km) * 100, 1)
        return 0.0

    def __str__(self):
        # Aquí devuelvo el nombre del explorador o su nombre de usuario para identificarlo visualmente
        return f'{self.username} ({self.get_tipo_viajero_display()})'

    @property
    def es_admin(self):
        # Aquí verifico si el explorador tiene permisos de administración o rol de administrador
        return self.is_staff or self.is_superuser or self.rol == 'administrador'


class GrupoPrivacidad(models.Model):
    # Aquí configuro el modelo para que los exploradores creen círculos o grupos privados
    # y así puedan compartir publicaciones del Diario de Ruta solo con ciertas personas.
    creador = models.ForeignKey(Explorador, on_delete=models.CASCADE, related_name='grupos_creados')
    nombre = models.CharField(max_length=100, verbose_name='Nombre del Grupo')
    descripcion = models.CharField(max_length=255, blank=True, default='', verbose_name='Descripción')
    miembros = models.ManyToManyField(Explorador, related_name='grupos_pertenece', blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # Aquí retorno el nombre del grupo junto con el explorador que lo creó
        return f'{self.nombre} (Creado por {self.creador.username})'


class RelacionSeguimiento(models.Model):
    # Aquí gestiono el sistema de seguimiento y amistad entre exploradores con estados
    # de solicitud pendiente, aceptada o rechazada para el Diario de Ruta.
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('aceptada', 'Aceptada'),
        ('rechazada', 'Rechazada'),
    ]

    seguidor = models.ForeignKey(Explorador, on_delete=models.CASCADE, related_name='siguiendo')
    seguido = models.ForeignKey(Explorador, on_delete=models.CASCADE, related_name='seguidores')
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('seguidor', 'seguido')

    def __str__(self):
        # Aquí muestro una descripción legible de la relación entre ambos exploradores
        return f'{self.seguidor.username} -> {self.seguido.username} [{self.estado}]'
