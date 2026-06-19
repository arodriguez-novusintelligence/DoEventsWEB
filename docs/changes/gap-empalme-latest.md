# Gap empalme — resumen ejecutivo (batch 2)

**Run:** `gap-empalme-27850000711-b2`  
**Fecha:** 2026-06-19  
**Rama:** `feature/cicd/dev-automation`

## Resultado

| Métrica | Valor |
|---------|-------|
| Gaps en batch | 20 |
| DONE (frontend) | 17 |
| BACKEND_REQUIRED | 3 |
| Similitud antes | 72.5% |
| Similitud después (est.) | ~78.0% |
| Objetivo | 98.0% |
| Build `npm run build:devaws` | OK |
| Mocks en runtime | No detectados |

## Empalme realizado (frontend)

- **Invitados:** `EditGuestModal` submit async; `ContactImportModal` parsing de nombres mejorado.
- **Feed:** `PostCard` sin botón Seguir al dueño; `TopHeader` avatar → perfil; `FollowersSheet` solicitudes con Aceptar.
- **Crear evento:** stepper con subtítulo de paso; `StepAccessControl` cache de hosts; `PublishFlowModal` guard anti-simulación bancaria.
- **Servicios:** `ServiceDetailView` CTA login; `BookingSheet` banner vista previa; `PaymentGatewaySheet` confirmación por orderId.
- **Tickets:** transferencia sin self; reembolso con `platformFeeRate`; `MyTicketsView` refresh/explorar.
- **Chat/Stats:** `MessagesListView` indicador de carga; `StatsEventListView` estados loading/error.
- **Venues:** `VenueDetailReservation` precio desde amenities (`parseVenuePrice`).
- **IA:** `AIAssistantFAB` sombra hover alineada Lovable.

## Backend pendiente (3 gaps)

1. **PublishFlowModal** — persistir datos bancarios post-publicación (`createBankAccount` / `onSubmitBank`).
2. **BookingSheet** — catálogo de servicios adicionales (`GET /services/{id}/addons`).
3. **PaymentGatewaySheet** — integración PSP completa (formularios tarjeta/PSE hoy son cosméticos; pago real vía `confirmTicketPayment(orderId)`).

## Gaps restantes

~78 gaps en batches 3–6 del manifiesto. Próximo batch: componentes de invitaciones, feed avanzado, admin y venues.

## Evidencia

- Anti-mock: `grep` en `packages/shell/src/pages` sin coincidencias.
- Build DEV sa-east-1 exitoso.
