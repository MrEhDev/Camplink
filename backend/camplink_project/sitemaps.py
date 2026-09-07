# Aquí defino los sitemaps automáticos para SEO en Django, exponiendo los Lugares y Artículos
# de la Guía del Nómada para indexación en buscadores.

from django.contrib.sitemaps import Sitemap
from lugares.models import Lugar
from comunidad.models import ArticuloGuia

class LugaresSitemap(Sitemap):
    # Aquí configuro el sitemap para los puntos de pernocta
    changefreq = 'weekly'
    priority = 0.8

    def items(self):
        # Devuelvo todos los lugares ordenados
        return Lugar.objects.all().order_by('-fecha_creacion')

    def lastmod(self, obj):
        # Última fecha de modificación / creación
        return obj.fecha_creacion

    def location(self, obj):
        # URL de la SPA donde se visualiza el detalle del lugar
        return f'/lugares/{obj.id}'


class GuiaSitemap(Sitemap):
    # Aquí configuro el sitemap para los artículos de la Guía del Nómada
    changefreq = 'monthly'
    priority = 0.9

    def items(self):
        # Devuelvo los artículos publicados
        return ArticuloGuia.objects.all().order_by('-fecha_publicacion')

    def lastmod(self, obj):
        return obj.fecha_publicacion

    def location(self, obj):
        return f'/guia/{obj.slug}'