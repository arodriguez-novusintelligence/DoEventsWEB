# Impacto Backend

## Resumen

Empalme de 36 componentes/páginas faltantes en rutas mapeadas Lovable. Se añadió `reportPublication` en el cliente shared (endpoint wall feed). KYC completo y company profile requieren contratos backend adicionales.

## ¿Requiere backend?

Sí (parcial)

## Motivo

- **Report post**: cliente `reportPublication` asume `POST /wall/feed/publications/{id}/report` — validar en DoEventsBack DEV.
- **KYC**: `KycCertificationView` documenta flujo sin datos simulados; persistencia KYC no verificada en API actual.
- **Company context**: datos de empresa/organizador dependen de campos en perfil de usuario existentes.

## Contrato actual encontrado

- `fetchUserVenueBookings`, `fetchUserServiceBookings` — reservas usuario.
- `fetchGroupedUserTickets` — tickets comprados.
- `reportPublicationComment` — ya existente; `reportPublication` añadido en cliente.

## Brecha detectada

- Endpoint report publicación: debe existir y aceptar `reason`, `details` en DEV.
- KYC: sin endpoint dedicado confirmado para certificación en DEV.
- Story viewers: lista de viewers por historia si Lovable lo exige (sheet con estado vacío si no hay API).

## Acción realizada

- Cliente `reportPublication` en `packages/shared/src/api/feedService.ts`.
- UI KYC con estado vacío y clasificación BACKEND_REQUIRED en `decision-log.md`.
- No despliegue backend.

## Archivos modificados en DoEventsBack

Ninguno.

## Despliegue

NO DESPLEGADO

## Riesgos

- Si `reportPublication` no existe en API DEV, el diálogo de reporte fallará en runtime (manejo de error en UI).

## Pendientes

- Confirmar endpoint report en `api-dev.doeventsapp.com`.
- Definir contrato KYC con producto/backend antes de activar certificación completa.
