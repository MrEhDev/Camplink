# Aquí defino los modelos para la gestión de Viajes agrupados, el cálculo de rutas y distancias,
# estadísticas acumuladas y el sistema de gamificación con vitrina de trofeos.

from django.db import models
from django.conf import settings
from django.utils import timezone

class Viaje(models.Model):
    # Aquí configuro el modelo del Viaje para agrupar pernoctas y check-ins consecutivos
    # cuando la diferencia entre paradas sea menor a 5 días o según los días previstos por el explorador.
    explorador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='viajes',
        verbose_name='Explorador'
    )
    titulo = models.CharField(max_length=200, default='Ruta Nómada', verbose_name='Título del Viaje')
    descripcion = models.TextField(blank=True, default='', verbose_name='Diario del Viaje')
    fecha_inicio = models.DateField(default=timezone.now, verbose_name='Fecha de Inicio')
    fecha_fin = models.DateField(null=True, blank=True, verbose_name='Fecha de Fin')
    esta_cerrado = models.BooleanField(default=False, verbose_name='¿Viaje Finalizado?')
    km_totales = models.FloatField(default=0.0, verbose_name='Kilómetros Totales Recorridos')
    comunidades_visitadas = models.JSONField(default=list, blank=True, verbose_name='Comunidades Autónomas')
    paises_visitados = models.JSONField(default=list, blank=True, verbose_name='Países Visitados')
    resumen_ruta = models.JSONField(default=list, blank=True, verbose_name='Resumen de Puntos y Coordenadas')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_inicio']
        verbose_name = 'Viaje'
        verbose_name_plural = 'Viajes'

    def __str__(self):
        # Aquí muestro el título del viaje y a qué explorador pertenece
        return f'{self.titulo} de {self.explorador.username} ({self.km_totales} km)'

    @property
    def duracion_dias(self):
        # Aquí calculo la duración total en días del viaje
        if self.fecha_fin and self.fecha_inicio:
            delta = (self.fecha_fin - self.fecha_inicio).days + 1
            return max(1, delta)
        return 1


class Trofeo(models.Model):
    # Aquí configuro el catálogo de logros y medallas que los exploradores pueden desbloquear
    # con niveles: Madera, Bronce, Plata, Oro y el Trofeo Platino absoluto.
    NIVELES = [
        ('madera', 'Madera'),
        ('bronce', 'Bronce'),
        ('plata', 'Plata'),
        ('oro', 'Oro'),
        ('platino', 'Platino'),
    ]

    TIPO_REQUISITO = [
        ('checkins', 'Número de Pernoctas / Check-ins'),
        ('km', 'Kilómetros Recorridos'),
        ('lugares', 'Lugares Creados'),
        ('platino', '100% de Todos los Trofeos'),
    ]

    codigo = models.CharField(max_length=50, unique=True, verbose_name='Código Único')
    nombre = models.CharField(max_length=100, verbose_name='Nombre del Trofeo')
    descripcion = models.TextField(verbose_name='Descripción del Logro')
    nivel = models.CharField(max_length=20, choices=NIVELES, default='madera', verbose_name='Nivel')
    icono = models.CharField(max_length=50, default='camp-trophy', verbose_name='Icono Identificador')
    requisito_tipo = models.CharField(max_length=30, default='', blank=True, verbose_name='Tipo de Requisito')
    requisito_cantidad = models.IntegerField(default=1, verbose_name='Cantidad Necesaria')
    categoria = models.CharField(max_length=50, default='general', verbose_name='Código de Categoría')
    categoria_nombre = models.CharField(max_length=100, default='', verbose_name='Nombre de la Categoría')
    unidad = models.CharField(max_length=30, default='', verbose_name='Unidad de Medida')

    class Meta:
        ordering = ['requisito_cantidad']

    def __str__(self):
        # Aquí retorno el nombre con su nivel de condecoración
        return f'[{self.nivel.upper()}] {self.nombre}'


class TrofeoExplorador(models.Model):
    # Aquí guardo los trofeos efectivamente ganados por cada explorador en su vitrina personal
    explorador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='trofeos_conseguidos')
    trofeo = models.ForeignKey(Trofeo, on_delete=models.CASCADE, related_name='conseguido_por')
    fecha_desbloqueo = models.DateTimeField(auto_now_add=True)
    es_destacado = models.BooleanField(default=False, verbose_name='¿Mostrar destacado en el perfil?')

    class Meta:
        unique_together = ('explorador', 'trofeo')

    def __str__(self):
        # Aquí indico el explorador que obtuvo el trofeo
        return f'{self.explorador.username} desbloqueó {self.trofeo.nombre}'


class InvitacionViaje(models.Model):
    # Aquí gestiono las invitaciones para compartir un viaje planificado entre exploradores.
    # Cuando el destinatario acepta, se crea una copia editable del viaje en su cuenta.
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('aceptada', 'Aceptada'),
        ('rechazada', 'Rechazada'),
    ]

    viaje_origen = models.ForeignKey(
        'Viaje',
        on_delete=models.CASCADE,
        related_name='invitaciones_enviadas',
        verbose_name='Viaje compartido'
    )
    remitente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='invitaciones_enviadas_viaje',
        verbose_name='Explorador que comparte'
    )
    destinatario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='invitaciones_recibidas_viaje',
        verbose_name='Explorador destinatario'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default='pendiente',
        verbose_name='Estado de la invitación'
    )
    mensaje = models.TextField(
        blank=True,
        default='',
        verbose_name='Mensaje opcional'
    )
    fecha_envio = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de envío')
    fecha_respuesta = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de respuesta')
    viaje_copia = models.ForeignKey(
        'Viaje',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='origen_invitacion',
        verbose_name='Viaje creado al aceptar'
    )

    class Meta:
        ordering = ['-fecha_envio']
        verbose_name = 'Invitación de Viaje'
        verbose_name_plural = 'Invitaciones de Viaje'
        unique_together = ('viaje_origen', 'destinatario')

    def __str__(self):
        return f'{self.remitente.username} → {self.destinatario.username}: {self.viaje_origen.titulo} [{self.estado}]'
