from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Lugar, NotaPersonalLugar
from .serializers import LugarSerializer

User = get_user_model()

class LugaresDetalleYNotasTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='explorador_test',
            email='test@camplink.es',
            password='password123'
        )
        self.lugar = Lugar.objects.create(
            nombre='Acantilados del Norte',
            descripcion='Pernocta increíble frente al mar',
            tipo_lugar='pernocta_libre',
            latitud=43.456,
            longitud=-4.123,
            creador=self.user
        )

    def test_preset_imagen_por_tipo_si_no_tiene_foto(self):
        """Verifica que si no tiene foto_principal, el serializador preestablece la imagen del tipo"""
        serializer = LugarSerializer(self.lugar)
        self.assertIn('/media/lugares/pernocta_libre.jpg', serializer.data['foto_principal'])

    def test_guardar_y_obtener_nota_personal(self):
        """Verifica que un explorador puede guardar y recuperar notas privadas de un lugar"""
        self.client.force_authenticate(user=self.user)
        
        # Guardar nota
        resp = self.client.post(
            f'/api/lugares/puntos/{self.lugar.id}/nota_personal/',
            {'contenido': 'Fuente de agua a 30 metros a la derecha, suelo muy plano.'},
            format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['contenido'], 'Fuente de agua a 30 metros a la derecha, suelo muy plano.')

        # Consultar nota mediante GET
        resp_get = self.client.get(f'/api/lugares/puntos/{self.lugar.id}/nota_personal/')
        self.assertEqual(resp_get.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_get.data['contenido'], 'Fuente de agua a 30 metros a la derecha, suelo muy plano.')

        # Consultar detalle del lugar y comprobar mi_nota_personal
        resp_detalle = self.client.get(f'/api/lugares/puntos/{self.lugar.id}/')
        self.assertEqual(resp_detalle.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_detalle.data['mi_nota_personal'], 'Fuente de agua a 30 metros a la derecha, suelo muy plano.')

    def test_nota_personal_es_privada_para_otro_usuario(self):
        """Verifica que otro usuario no ve la nota personal ajena"""
        NotaPersonalLugar.objects.create(
            lugar=self.lugar,
            explorador=self.user,
            contenido='Clave de candado secreta: 1234'
        )
        otro_user = User.objects.create_user(
            username='otro_viajero',
            email='otro@camplink.es',
            password='password123'
        )
        self.client.force_authenticate(user=otro_user)

        resp_detalle = self.client.get(f'/api/lugares/puntos/{self.lugar.id}/')
        self.assertEqual(resp_detalle.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_detalle.data['mi_nota_personal'], '')

        resp_nota = self.client.get(f'/api/lugares/puntos/{self.lugar.id}/nota_personal/')
        self.assertEqual(resp_nota.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_nota.data['contenido'], '')

    def test_multiples_notas_personales_con_fecha_y_borrado_individual(self):
        """Verifica que un usuario puede añadir múltiples notas con fecha/hora y borrarlas individualmente"""
        self.client.force_authenticate(user=self.user)
        # 1. Crear primera nota
        resp1 = self.client.post(
            f'/api/lugares/puntos/{self.lugar.id}/nota_personal/',
            {'nota': 'Primera nota: Sitio tranquilo'},
            format='json'
        )
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)
        self.assertTrue(resp1.data['fecha_creacion'] is not None)
        nota1_id = resp1.data['id']

        # 2. Crear segunda nota
        resp2 = self.client.post(
            f'/api/lugares/puntos/{self.lugar.id}/nota_personal/',
            {'nota': 'Segunda nota: Hay cobertura 5G excelente'},
            format='json'
        )
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        nota2_id = resp2.data['id']
        self.assertEqual(len(resp2.data['notas']), 2)

        # 3. Consultar detalle del lugar y comprobar mis_notas_personales
        resp_det = self.client.get(f'/api/lugares/puntos/{self.lugar.id}/')
        self.assertEqual(len(resp_det.data['mis_notas_personales']), 2)

        # 4. Eliminar solo la primera nota
        resp_del = self.client.delete(f'/api/lugares/puntos/{self.lugar.id}/nota_personal/?nota_id={nota1_id}')
        self.assertEqual(resp_del.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp_del.data['notas']), 1)
        self.assertEqual(resp_del.data['notas'][0]['id'], nota2_id)
