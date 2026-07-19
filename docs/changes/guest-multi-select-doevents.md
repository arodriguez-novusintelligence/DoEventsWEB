# Agregar invitados DoEvents — selección múltiple

| Campo | Valor |
|-------|-------|
| Fecha | 2026-07-19 |
| Entorno | [dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Problema

En **Gestión de invitados → Agregar invitado → DoEvents**, el contador podía mostrar N seleccionados pero al agregar solo usaba los resultados de la búsqueda actual. La selección no persistía como objetos de usuario entre búsquedas y el alta era uno-a-uno con reload intermedio.

## Cambios

| Archivo | Descripción |
|---------|-------------|
| `AddGuestModal.tsx` | Selección con `Map<id, Guest>`, chips de seleccionados, agregar todos los marcados |
| `guestsService.ts` | `addRegisteredUsersToFavorites` (batch `targetUserIds`) |
| `useApiGuests.ts` | `registerUsersAsGuests` — una llamada + un reload |
| `GuestManagementView.tsx` | Conecta `onRegisterFoundUsers` |

## Deploy DEV

- `npm run deploy:devaws`

## Verificación

1. Abrir Agregar invitado → DoEvents.
2. Buscar y marcar varios usuarios (incluso de búsquedas distintas).
3. Ver chips «Seleccionados (N)» y botón coherente.
4. Agregar → deben entrar todos a la lista.
