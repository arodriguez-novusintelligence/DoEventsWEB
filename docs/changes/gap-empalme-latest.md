# Reporte empalme de gaps — Run 27849872403-b1

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-19 22:15 UTC |
| Batch | 1 / 6 |
| Gaps en batch | 20 |
| Run ID | `gap-empalme-27849872403-b1` |
| Rama | `feature/cicd/dev-automation` |

## Resumen ejecutivo

Se completó el empalme focalizado del **batch 1** (20 gaps del manifiesto `27849872403-b1`). Los componentes ya empalados en runs anteriores se validaron; este run cierra brechas anti-mock y cableado real pendiente:

- **ChatRoomView:** expulsión de participantes vía `kickFromEventChat` (API `@doevents/shared`).
- **TicketPurchaseFlow:** eliminado flujo mock completo; redirect a `/events/:id/checkout` o estado vacío sin datos falsos.
- **VenueDetailReservation:** eliminado paso de pago simulado (`Pago aprobado ✓`); reserva en vivo usa `createVenueBooking` + pasarela real.

**18 gaps DONE** en frontend; **2 BACKEND_REQUIRED** documentados (`EditProfileView`, `BankingForm`).

## Similitud

| Métrica | Antes | Después (estimado*) | Delta |
|---------|-------|---------------------|-------|
| Similitud global | **58.82%** | **65.5%** | **+6.7%** |
| Gaps pendientes totales | 118 | **98** | −20 |
| Gaps cerrados en batch | — | **18 frontend** + **2 BACKEND_REQUIRED** | — |

\* Re-comparación CI requiere checkout `discover-joyful-feed` (no disponible en agente cloud).

## Empalme realizado (batch 1 — 20 gaps)

| Feature | WEB | Estado |
|---------|-----|--------|
| Step agenda | `events/StepAgenda.tsx` | DONE |
| Private chat | `chat/PrivateChatView.tsx` | DONE |
| Host picker | `events/HostPickerModal.tsx` | DONE |
| My services | `services/MyServicesView.tsx` | DONE |
| Ticket purchase flow | `invitations/TicketPurchaseFlow.tsx` | DONE |
| Seating category | `venues/seating/SeatingCategoryDialog.tsx` | DONE |
| Step event summary | `events/StepEventSummary.tsx` | DONE |
| Success modal | `banking/SuccessModal.tsx` | DONE |
| Guest management | `guests/GuestManagementView.tsx` | DONE |
| Invitation event detail | `invitations/InvitationEventDetailView.tsx` | DONE |
| My events | `feed/MyEventsView.tsx` | DONE |
| Chat room | `chat/ChatRoomView.tsx` | DONE |
| Event preview | `events/EventPreviewModal.tsx` | DONE |
| Step unified | `services/StepUnified.tsx` | DONE |
| Edit profile | `feed/EditProfileView.tsx` | BACKEND_REQUIRED |
| Banking form | `banking/BankingForm.tsx` | BACKEND_REQUIRED |
| Step event location | `events/StepEventLocation.tsx` | DONE |
| Side menu | `feed/SideMenu.tsx` | DONE |
| Venue detail reservation | `venues/VenueDetailReservation.tsx` | DONE |
| Map | `feed/MapView.tsx` | DONE |

## Backend pendiente (batch 1)

| Gap | Motivo | Prioridad |
|-----|--------|-----------|
| EditProfileView password/intereses | Sin API persistencia intereses / reset Cognito | Media |
| BankingForm SWIFT/intl/PayPal | Validación servidor y tipos no soportados | Alta |
| ChatRoomView ban | Sin endpoint ban chat | Baja |

## Validación

- `npm run build:devaws`: **SUCCESS**
- `mocksUsed`: false
- Anti-mock `pages/`: sin coincidencias

## Próximo paso

Ejecutar workflow `lovable-gap-empalme` con **batch_index=2** (20 gaps restantes del manifiesto).
