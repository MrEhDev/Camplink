from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from comunidad.models import CategoriaPublicacion, PublicacionTaller
from comunidad.utils import optimizar_imagen
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()

class TallerCamplinkTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='camper_user', password='password123')
        self.admin = User.objects.create_superuser(username='admin_user', password='password123', email='admin@camplink.es')
        
        self.categoria = CategoriaPublicacion.objects.create(
            nombre='Bricolaje & Camperización',
            slug='bricolaje-camperizacion',
            icono='Hammer',
            color='#F97316'
        )

        self.pub_aprobada = PublicacionTaller.objects.create(
            titulo='Aislamiento Kaiflex 20mm',
            categoria=self.categoria,
            autor=self.admin,
            resumen='Guía de aislamiento',
            contenido='Paso a paso para aislar la furgoneta...',
            estado='aprobado',
            es_guia_oficial=True
        )

        self.pub_pendiente = PublicacionTaller.objects.create(
            titulo='Mesa Plegable en Portón',
            categoria=self.categoria,
            autor=self.user,
            resumen='Mesa abatible casera',
            contenido='Materiales: contrachapado de abedul 15mm...',
            estado='pendiente'
        )

    def test_listar_categorias(self):
        res = self.client.get('/api/comunidad/categorias/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        datos = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        self.assertGreaterEqual(len(datos), 1)
        self.assertEqual(datos[0]['slug'], 'bricolaje-camperizacion')

    def test_listar_publicaciones_publicas(self):
        # Usuario no autenticado solo debe ver publicaciones aprobadas
        res = self.client.get('/api/comunidad/publicaciones/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        datos = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        ids = [p['id'] for p in datos]
        self.assertIn(self.pub_aprobada.id, ids)
        self.assertNotIn(self.pub_pendiente.id, ids)

    def test_filtro_pendientes_admin(self):
        # Usuario regular no puede ver pendientes
        self.client.force_authenticate(user=self.user)
        res_user = self.client.get('/api/comunidad/publicaciones/pendientes/')
        self.assertEqual(res_user.status_code, status.HTTP_403_FORBIDDEN)

        # Admin sí puede ver publicaciones pendientes
        self.client.force_authenticate(user=self.admin)
        res_admin = self.client.get('/api/comunidad/publicaciones/pendientes/')
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)
        pendientes_ids = [p['id'] for p in res_admin.data]
        self.assertIn(self.pub_pendiente.id, pendientes_ids)

    def test_aprobar_publicacion_admin(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/comunidad/publicaciones/{self.pub_pendiente.id}/aprobar/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.pub_pendiente.refresh_from_db()
        self.assertEqual(self.pub_pendiente.estado, 'aprobado')

    def test_rechazar_publicacion_admin(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/comunidad/publicaciones/{self.pub_pendiente.id}/rechazar/', {'motivo': 'Falta detalle'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.pub_pendiente.refresh_from_db()
        self.assertEqual(self.pub_pendiente.estado, 'rechazado')
        self.assertEqual(self.pub_pendiente.motivo_rechazo, 'Falta detalle')

    def test_optimizacion_pillow_imagen(self):
        # Generar imagen sintética en memoria de 2000x2000 px
        img = Image.new('RGB', (2000, 2000), color='forestgreen')
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        buffer.seek(0)
        uploaded = SimpleUploadedFile('test_large.jpg', buffer.read(), content_type='image/jpeg')

        optimizada = optimizar_imagen(uploaded, max_dimension=1200, calidad=80)
        self.assertIsNotNone(optimizada)
        
        # Verificar que la imagen resultante fue reescalada y convertida a WebP
        img_res = Image.open(optimizada)
        self.assertLessEqual(max(img_res.size), 1200)
        self.assertEqual(img_res.format, 'WEBP')
