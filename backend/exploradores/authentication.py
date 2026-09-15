from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Autenticación de sesión estándar para DRF que no bloquea peticiones de la SPA
    por token CSRF en entornos híbridos / cross-origin / túneles móviles.
    """
    def enforce_csrf(self, request):
        return  # No forzar la validación estricta de CSRF en llamadas de API de sesión
