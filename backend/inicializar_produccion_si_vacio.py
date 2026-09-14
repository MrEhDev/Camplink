import os
import sys
import django
from django.core.management import call_command

# Configuración del entorno Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'camplink_project.settings')
django.setup()

from lugares.models import Lugar
from exploradores.models import Explorador
from viajes.services import inicializar_catalogo_trofeos

def inicializar():
    # Asegurar que el catálogo de trofeos siempre esté sincronizado
    inicializar_catalogo_trofeos()

    # Comprobar si ya existen lugares y usuarios en la base de datos
    hay_lugares = Lugar.objects.exists()
    hay_admin = Explorador.objects.filter(is_superuser=True).exists()

    if hay_lugares and hay_admin:
        print("ℹ️ Base de datos ya contiene datos. Omitiendo recarga de fixtures y posts.")
        return

    print("🚀 Base de datos inicial/vacía detectada. Sembrando datos por primera y única vez...")
    
    # 1. Cargar fixtures de lugares si no existen
    if not hay_lugares:
        try:
            print("Cargando catálogo de lugares...")
            call_command('loaddata', 'fixtures/lugares_iniciales.json')
            print("✔ Lugares cargados.")
        except Exception as e:
            print(f"Error cargando fixtures de lugares: {e}")

    # 2. Cargar fixtures de comunidad si no existen
    try:
        print("Cargando categorías iniciales de comunidad...")
        call_command('loaddata', 'fixtures/comunidad_inicial.json')
        print("✔ Comunidad inicial cargada.")
    except Exception as e:
        print(f"Error cargando fixtures de comunidad: {e}")

    # 3. Crear exploradores y admin si no existen
    if not hay_admin:
        try:
            print("Poblando exploradores de producción y admin...")
            import poblar_exploradores_produccion
            poblar_exploradores_produccion.poblar()
            print("✔ Exploradores creados.")
        except Exception as e:
            print(f"Error poblando exploradores: {e}")

    print("🎉 Inicialización completada exitosamente.")

if __name__ == '__main__':
    inicializar()
