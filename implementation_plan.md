# Plan – Compartir Viajes Planificados entre Exploradores

## Descripción

Permite que un usuario comparta su viaje planificado con otro explorador. El destinatario recibe una invitación, puede **Aceptar** (el viaje aparece en sus "Mis Viajes" como copia vinculada) o **Rechazar**. Las invitaciones pendientes se muestran en una sección de notificaciones dentro de la vista Organizar Viaje.

---

## Propuesta de flujo

```
Usuario A → [Compartir Viaje] → busca usuario → envía invitación
Usuario B → recibe notificación en "Mis Viajes" → Acepta / Rechaza
Si Acepta → se crea una copia del viaje en la cuenta de B (con todas sus paradas)
```

> [!IMPORTANT]
> El viaje compartido es una **copia independiente**, no un viaje colaborativo en tiempo real. Cada explorador puede editar su propia copia libremente.

---

## Cambios Propuestos

---

### Backend

#### [MODIFY] `viajes/models.py`

Añadir modelo `InvitacionViaje`:

```python
class InvitacionViaje(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('aceptada', 'Aceptada'),
        ('rechazada', 'Rechazada'),
    ]
    viaje_origen    # FK → Viaje (el viaje que se comparte)
    remitente       # FK → User (quien comparte)
    destinatario    # FK → User (quien recibe)
    estado          # CharField: pendiente / aceptada / rechazada
    mensaje         # TextField opcional
    fecha_envio     # DateTimeField auto_now_add
    fecha_respuesta # DateTimeField null=True
    viaje_copia     # FK → Viaje null=True (viaje creado al aceptar)
```

#### [NEW] Migración correspondiente

#### [MODIFY] `viajes/serializers.py`
- `InvitacionViajeSerializer` con datos del remitente, viaje origen y estado

#### [MODIFY] `viajes/views.py`
Nuevos endpoints en `ViajeViewSet` + funciones independientes:

| Endpoint | Método | Descripción |
|---|---|---|
| `POST /api/viajes/rutas/{id}/compartir/` | POST | Enviar invitación a otro usuario |
| `GET /api/viajes/invitaciones/` | GET | Listar invitaciones recibidas (pendientes) |
| `POST /api/viajes/invitaciones/{id}/aceptar/` | POST | Aceptar → crea copia del viaje |
| `POST /api/viajes/invitaciones/{id}/rechazar/` | POST | Rechazar invitación |

#### [MODIFY] `viajes/urls.py`
Registrar las nuevas rutas.

---

### Frontend

#### [MODIFY] `OrganizarViaje.jsx`

1. **Botón "Compartir"** en la cabecera de cada viaje → abre modal con buscador de usuarios.
2. **Sección "Invitaciones recibidas"** al inicio de la vista (banner colapsable) si hay pendientes.
3. **Modal de compartir**: búsqueda por nombre de usuario + campo de mensaje opcional + botón enviar.
4. **Modal de aceptar/rechazar**: muestra el remitente, nombre del viaje, paradas y botones de acción.

---

## Open Questions

> [!NOTE]
> ¿Quieres que el explorador que acepta vea el viaje como **solo lectura** (no puede editar) o como **copia editable** propia?
> El plan actual propone copia editable. Dímelo si prefieres solo lectura.

---

## Verificación

- Crear viaje como Usuario A → compartir con Usuario B → B recibe invitación → B acepta → el viaje aparece en sus Mis Viajes.
- Rechazar invitación → no se crea ningún viaje.
- Si el viaje original se elimina antes de aceptar → la invitación queda inválida (se comprueba en el endpoint aceptar).
