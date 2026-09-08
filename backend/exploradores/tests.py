from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Notificacion

User = get_user_model()

class ExploradoresNotificacionesTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='maria_camper',
            email='maria@camplink.es',
            password='password123'
        )
        self.client.force_authenticate(user=self.user)

    def test_obtener_y_eliminar_notificacion(self):
        # 1. Crear notificación
        notif = Notificacion.objects.create(
            usuario_destino=self.user,
            tipo='sistema',
            titulo='Prueba de Notificación',
            mensaje='Mensaje de prueba para eliminar'
        )
        self.assertEqual(Notificacion.objects.filter(usuario_destino=self.user).count(), 1)

        # 2. Consultar lista
        res_get = self.client.get('/api/exploradores/notificaciones/')
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res_get.data['notificaciones']) >= 1)

        # 3. Eliminar la notificación
        res_del = self.client.delete(f'/api/exploradores/notificaciones/?notificacion_id={notif.id}')
        self.assertEqual(res_del.status_code, status.HTTP_200_OK)
        self.assertEqual(Notificacion.objects.filter(id=notif.id).count(), 0)

    def test_es_admin_property(self):
        self.assertFalse(self.user.es_admin)
        self.user.rol = 'administrador'
        self.user.save()
        self.assertTrue(self.user.es_admin)
