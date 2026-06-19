# Impacto Backend

## Resumen

Run `gap-empalme-27847959667-b1`: batch 1 (20 gaps) — empalme frontend completado en 17 componentes; 3 gaps documentados como BACKEND_REQUIRED (banking, password reset, moderación chat).

Run 38e2c759 (re-run 20:54 UTC): manifiesto sin diff UI — validación únicamente.

Empalme batch 1 previo (27839776030): checkout real tickets, mapa API, notificaciones sin fixture, ratings honestos.

## ¿Requiere backend?

Sí (parcial)

## Empalme realizado (última ejecución — gap-empalme-27847959667-b1)

- **SideMenu:** eliminados defaults hardcodeados (`Sebastian Motta`); perfil desde props/bridge.
- **StepAgenda:** línea de tiempo visual entre actividades del itinerario.
- **StepEventLocation:** header alineado con copy Lovable (título + obligatorio).
- **VenueDetailReservation:** sin tarjeta 4242 ni host ficticio; `createVenueBooking` en modo live; preview sin número de reserva inventado.
- **NotificationsSheet:** empty state con iconografía y copy descriptivo.
- **PrivateChatView:** header y estado en línea alineados al diseño.
- **EditProfileView:** flujo password no simula éxito — documenta BACKEND_REQUIRED.
- **Resto batch:** empalmes previos run 27839776030 (checkout `/events/:id/checkout`, ratings 0 ocultos, moderación gated, etc.).

## Backend pendiente para 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| Banking form | `src/components/banking/BankingForm.tsx` | `packages/shell/src/lovable/components/banking/BankingForm.tsx` | Persistencia métodos de pago y verificación cuenta | `POST/GET /users/{id}/payment-methods` (TBD) | `UserPaymentMethods` (TBD) | Implementar en DoEventsBack | Alta |
| Banking hub | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Listado métodos guardados | Mismo contrato banking | Mismo | Bridge frontend cuando exista API | Alta |
| Chat moderation | `src/components/chat/ChatRoomView.tsx` | `packages/shell/src/lovable/components/chat/ChatRoomView.tsx` | Kick/ban participantes | `POST /chat/rooms/{id}/moderate` (TBD) | TBD | Habilitar `canModerate` con API | Media |
| Edit profile password | `src/components/feed/EditProfileView.tsx` | `packages/shell/src/lovable/components/feed/EditProfileView.tsx` | Reset password vía Cognito/API | Auth endpoints existentes | Users | Conectar flujo UI | Media |
| Edit profile interests | `src/components/feed/EditProfileView.tsx` | `packages/shell/src/lovable/components/feed/EditProfileView.tsx` | Persistir intereses usuario | `PATCH /users/{id}/profile` (TBD) | Users | Backend + bridge | Media |
| Service reviews | `src/components/services/MyServicesView.tsx` | `packages/shell/src/lovable/components/services/MyServicesView.tsx` | Ratings reales por servicio | `GET /services/{id}/reviews` (TBD) | TBD | Ocultar UI hasta API | Media |
| Venue preview payment | `src/components/venues/VenueDetailReservation.tsx` | `packages/shell/src/lovable/components/venues/VenueDetailReservation.tsx` | Pasarela pago preview sin API | Gateway pagos existente | Orders | Integrar checkout real en preview | Alta |
| KYC | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Certificación KYC | KYC endpoint (TBD) | TBD | Documentado run anterior | Alta |

## Contrato actual encontrado

- `fetchUserNotifications`, `markNotificationRead`, `respondFollowRequest`
- `searchUsers`, `fetchUserInvitations`, `fetchEventDetail`
- `fetchUserVenueBookings`, `fetchUserServiceBookings`, `fetchGroupedUserTickets`
- `createVenueBooking`, `fetchVenueBookingAvailability`
- Checkout: `useTicketCheckout` + rutas `/events/:id/checkout`

## Acción realizada

- Cliente frontend alineado; **no despliegue backend**.

## Archivos modificados en DoEventsBack

Ninguno.

## Despliegue

NO DESPLEGADO

## Riesgos

- Preview de reserva venue simula pago local sin gateway — solo modo no-live.
- BankingForm valida formato local; submit sin API puede confundir al usuario.

## Pendientes

- Re-comparación diseño ≥98% en CI (batches 2–6, ~98 gaps restantes).
- Confirmar contratos banking y gateway en producto/backend.
