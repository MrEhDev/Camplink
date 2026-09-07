from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from exploradores.models import Explorador
from lugares.models import Lugar
from diario.models import CheckIn
from viajes.models import Viaje, Trofeo, TrofeoExplorador
from viajes.services import agrupar_checkin_en_viaje, verificar_y_desbloquear_trofeos

class ViajesYTrofeosTests(TestCase):
    def setUp(self):
        self.explorador = Explorador.objects.create_user(
            username='test_nomada',
            password='Password123!',
            direccion_base='Madrid',
            lat_base=40.4168,
            lng_base=-3.7038
        )
        self.lugar1 = Lugar.objects.create(
            nombre='Lugar Uno',
            descripcion='Área de prueba 1',
            latitud=40.5,
            longitud=-3.6,
            creador=self.explorador
        )
        self.lugar2 = Lugar.objects.create(
            nombre='Lugar Dos',
            descripcion='Área de prueba 2',
            latitud=41.0,
            longitud=-3.5,
            creador=self.explorador
        )

    def test_agrupacion_de_viajes_menos_de_5_dias(self):
        ch1 = CheckIn.objects.create(
            explorador=self.explorador,
            lugar=self.lugar1,
            fecha_llegada=timezone.now() - timedelta(days=2),
            dias_previstos=1
        )
        agrupar_checkin_en_viaje(ch1)

        ch2 = CheckIn.objects.create(
            explorador=self.explorador,
            lugar=self.lugar2,
            fecha_llegada=timezone.now(),
            dias_previstos=1
        )
        agrupar_checkin_en_viaje(ch2)

        viajes = Viaje.objects.filter(explorador=self.explorador)
        self.assertEqual(viajes.count(), 1)
        viaje = viajes.first()
        self.assertEqual(viaje.checkins_asociados.count(), 2)
        self.assertFalse(viaje.esta_cerrado)
        self.assertGreater(viaje.km_totales, 0)

    def test_desbloqueo_trofeo_primer_checkin(self):
        ch1 = CheckIn.objects.create(
            explorador=self.explorador,
            lugar=self.lugar1,
            fecha_llegada=timezone.now(),
            dias_previstos=1
        )
        agrupar_checkin_en_viaje(ch1)
        desbloqueados = verificar_y_desbloquear_trofeos(self.explorador)

        trofeos = TrofeoExplorador.objects.filter(explorador=self.explorador)
        self.assertGreaterEqual(trofeos.count(), 1)
        codigos = [t.trofeo.codigo for t in trofeos]
        self.assertIn('nomada_nocturno_madera', codigos)
