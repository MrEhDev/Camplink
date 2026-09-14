from django.core.management.base import BaseCommand
from exploradores.models import Explorador
from viajes.models import TrofeoExplorador
from viajes.services import (
    inicializar_catalogo_trofeos,
    verificar_y_desbloquear_trofeos,
    calcular_metricas_usuario
)


class Command(BaseCommand):
    help = 'Pone a 0 los trofeos y recalcula / reasigna únicamente los trofeos ganados por actividad real (entradas, viajes, taller, lugares, fotos, etc.)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--usuario',
            type=str,
            help='Username específico para recalcular (si se omite, se recalcula para todos los usuarios)'
        )
        parser.add_argument(
            '--solo-comprobar',
            action='store_true',
            help='Muestra el estado sin borrar trofeos previamente asignados'
        )

    def handle(self, *args, **options):
        username = options.get('usuario')
        solo_comprobar = options.get('solo_comprobar')

        self.stdout.write(self.style.NOTICE('🏆 Sincronizando catálogo oficial de trofeos...'))
        inicializar_catalogo_trofeos()

        if username:
            usuarios = Explorador.objects.filter(username=username)
            if not usuarios.exists():
                self.stderr.write(self.style.ERROR(f'❌ No se encontró ningún usuario con username "{username}".'))
                return
        else:
            usuarios = Explorador.objects.all()

        if not solo_comprobar:
            if username:
                borrados, _ = TrofeoExplorador.objects.filter(explorador__in=usuarios).delete()
            else:
                borrados, _ = TrofeoExplorador.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'🧹 Se han reseteado {borrados} registros de trofeos asignados.'))

        self.stdout.write(self.style.NOTICE('🔄 Evaluando actividad real y recalculando trofeos...'))

        total_asignados = 0
        for usuario in usuarios:
            metricas = calcular_metricas_usuario(usuario)
            trofeos_ganados = verificar_y_desbloquear_trofeos(usuario)
            conteo_actual = TrofeoExplorador.objects.filter(explorador=usuario).count()
            total_asignados += conteo_actual

            resumen_actividad = (
                f"viajes: {len(usuario.viajes.all())}, "
                f"checkins: {len(usuario.checkins.all())}, "
                f"posts taller: {metricas.get('maker_nomada', 0)}, "
                f"comentarios taller: {metricas.get('mecanico_pista', 0)}, "
                f"diario: {metricas.get('pluma_bitacora', 0)}, "
                f"lugares: {metricas.get('cartografo_nomada', 0)}"
            )

            self.stdout.write(
                f"  👤 {usuario.username} ({usuario.email}) -> "
                f"{conteo_actual} trofeos obtenidos [{resumen_actividad}]"
            )
            if trofeos_ganados:
                for t in trofeos_ganados:
                    self.stdout.write(self.style.SUCCESS(f"     ⭐ Desbloqueado: {t}"))

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Proceso completado exitosamente. Total de trofeos vigentes en la plataforma: {total_asignados}.'
        ))
