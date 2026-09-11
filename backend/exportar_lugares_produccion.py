import os
import sys
import json
import django

# Aquí configuro el entorno de Django para acceder a los modelos de Lugares
sys.path.insert(0, '/home/eleazar/Master Full Stack/Antigravity/Camplink/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'camplink_project.settings')
django.setup()

from django.core import serializers
from lugares.models import Lugar

def exportar_lugares():
    # Aquí exporto todos los lugares existentes desvinculando creadores de prueba antiguos
    lugares = Lugar.objects.all().order_by('id')
    total = lugares.count()
    print(f"Exportando {total} lugares desde SQLite...")

    serialized = json.loads(serializers.serialize('json', lugares))
    for item in serialized:
        # Pongo creador a null para evitar fallos de integridad referencial al importar en base limpia
        item['fields']['creador'] = None

    destino = os.path.join(os.path.dirname(__file__), 'fixtures', 'lugares_iniciales.json')
    with open(destino, 'w', encoding='utf-8') as f:
        json.dump(serialized, f, ensure_ascii=False, indent=2)

    print(f"¡Éxito! Se han guardado {len(serialized)} lugares en {destino}")

if __name__ == '__main__':
    exportar_lugares()
