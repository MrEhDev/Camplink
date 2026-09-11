# Aquí configuro el enrutador principal de URLs de Camplink para conectar endpoints de la API REST,
# el panel de administración seguro con ruta ofuscada, soporte de archivos multimedia y rutas SEO.

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from django.contrib.sitemaps.views import sitemap
from .sitemaps import LugaresSitemap, GuiaSitemap

sitemaps = {
    'lugares': LugaresSitemap,
    'guia': GuiaSitemap,
}

def robots_txt_vista(request):
    # Aquí genero la respuesta dinámica del archivo robots.txt para buenas prácticas SEO
    admin_url = getattr(settings, 'ADMIN_URL', 'panel-camplink-gestion/')
    lineas = [
        "User-agent: *",
        f"Disallow: /{admin_url}",
        "Disallow: /admin/",
        "Disallow: /api/",
        "Allow: /",
        "Sitemap: https://camplinkapp.com/sitemap.xml"
    ]
    return HttpResponse("\n".join(lineas), content_type="text/plain")

from django.shortcuts import redirect

admin_ruta = getattr(settings, 'ADMIN_URL', 'panel-camplink-gestion/')

def redirigir_admin(request, subpath=""):
    destino = f"/{admin_ruta}{subpath}"
    if request.META.get('QUERY_STRING'):
        destino += f"?{request.META['QUERY_STRING']}"
    return redirect(destino)

urlpatterns = [
    # Redirección automática de rutas /admin/... hacia el panel seguro configurado
    path('admin/', redirigir_admin, {'subpath': ''}),
    path('admin/<path:subpath>', redirigir_admin),

    # Panel de administración de Django con ruta segura configurable
    path(admin_ruta, admin.site.urls),

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

# Servir archivos multimedia subidos (fotos de perfil, vehículos, lugares)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
