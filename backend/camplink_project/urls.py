# Aquí configuro el enrutador principal de URLs de Camplink, conectando los endpoints de la API REST,
# el panel de administración, la gestión de archivos multimedia y los archivos sitemap.xml y robots.txt para SEO.

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from django.contrib.sitemaps.views import sitemap
from .sitemaps import LugaresSitemap, GuiaSitemap

# Diccionario con los sitemaps activos para indexación en motores de búsqueda
sitemaps = {
    'lugares': LugaresSitemap,
    'guia': GuiaSitemap,
}

def robots_txt_vista(request):
    # Aquí genero la respuesta dinámica del archivo robots.txt para buenas prácticas SEO
    lineas = [
        "User-agent: *",
        "Disallow: /admin/",
        "Disallow: /api/",
        "Allow: /",
        f"Sitemap: {request.build_absolute_uri('/sitemap.xml')}"
    ]
    return HttpResponse("\n".join(lineas), content_type="text/plain")

urlpatterns = [
    # Panel de administración de Django para el rol Administrador
    path('admin/', admin.site.urls),

    # Endpoints de la API REST de Camplink
    path('api/exploradores/', include('exploradores.urls')),
    path('api/lugares/', include('lugares.urls')),
    path('api/diario/', include('diario.urls')),
    path('api/viajes/', include('viajes.urls')),
    path('api/comunidad/', include('comunidad.urls')),

    # Rutas SEO obligatorias: robots.txt y sitemap.xml
    path('robots.txt', robots_txt_vista, name='robots-txt'),
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),
]

# Servir archivos multimedia subidos (fotos, .stl) durante el desarrollo local
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)