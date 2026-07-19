# Notificaciones — nombre real en lugar de «Usuario»

| Campo | Valor |
|-------|-------|
| Fecha | 2026-07-19 |
| Entorno | [dev.doeventsapp.com](https://dev.doeventsapp.com) |
| Rama | `feature/arodriguezCursor` |

## Problema

En la campana / hoja de notificaciones, mensajes de sistema (compra aprobada, reserva, ventas) se mostraban con el prefijo genérico **Usuario** en negrita, porque el adaptador no tenía `senderName` / `userName` en metadata y caía al fallback literal.

## Cambios frontend

| Archivo | Descripción |
|---------|-------------|
| `notificationsAdapter.ts` | Resuelve el nombre del viewer (OAuth + cache de perfil) para notificaciones de sistema; actores sociales siguen usando el nombre del actor o «Alguien»; parsea timestamps con sufijo `#inApp#…` |
| `NotificationsSheet.tsx` | Evita duplicar el nombre del evento en el texto si ya viene en el mensaje |

## Deploy DEV

- Frontend: `npm run deploy:devaws`

## Verificación sugerida

1. Abrir campana en https://dev.doeventsapp.com (sesión con nombre de perfil).
2. Confirmar que compra / reserva / ventas muestran **tu nombre** y no «Usuario».
3. Notificaciones sociales (like, follow) siguen mostrando el nombre del otro usuario.
