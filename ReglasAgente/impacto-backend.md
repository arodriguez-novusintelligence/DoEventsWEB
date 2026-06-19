# Impacto Backend

## Resumen

Run `gap-empalme-27847959667-b2`: batch 2 (20 gaps) — empalme frontend completado en 18 componentes; 2 gaps documentados como BACKEND_REQUIRED (PublishFlowModal banking, BookingSheet add-ons).

Run `gap-empalme-27847959667-b1`: batch 1 (20 gaps) — empalme frontend completado en 17 componentes; 3 gaps BACKEND_REQUIRED.

## ¿Requiere backend?

Sí (parcial)

## Empalme realizado (última ejecución — gap-empalme-27847959667-b2)

- **MapView:** estados loading y vacío; filtros y pins sin datos ficticios.
- **TopHeader:** avatar de perfil, badge menú condicional a `unreadMessages`.
- **FollowersSheet:** `followUser`/`unfollowUser` vía `@doevents/shared`; empty states con iconografía.
- **BookingSheet:** eliminado `MOCK_ADDITIONAL_SERVICES`; add-ons solo desde props/API.
- **PublishFlowModal:** stage error de validación; submit bancario no simula persistencia.
- **CreateEventView:** stepper con pasos completados (✓).
- **PostCard:** tipos `FeedUiPost`/`FeedUiUser` desde `@doevents/shared`.
- **TransferTicketFlow / RefundTicketFlow / TicketDetailView:** indicadores de progreso y polish visual; callbacks reales intactos.
- **MessagesListView, MyVenuesView, StatsEventListView, ContactImportModal, ProfileGallery, EditGuestModal, AIAssistantFAB, ServiceDetailView, StepEventDetails:** empty states y headers alineados Lovable.

## Backend pendiente para 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| Publish flow banking | `src/components/events/PublishFlowModal.tsx` | `packages/shell/src/lovable/components/events/PublishFlowModal.tsx` | Persistencia datos bancarios post-publicación | `POST/GET /users/{id}/payment-methods` (TBD) | `UserPaymentMethods` (TBD) | Implementar en DoEventsBack | Alta |
| Booking add-ons | `src/components/services/BookingSheet.tsx` | `packages/shell/src/lovable/components/services/BookingSheet.tsx` | Servicios adicionales por reserva | `GET /services/{id}/addons` (TBD) | TBD | Exponer catálogo real | Media |
| Banking form | `src/components/banking/BankingForm.tsx` | `packages/shell/src/lovable/components/banking/BankingForm.tsx` | Persistencia métodos de pago | Mismo contrato banking | Mismo | Implementar en DoEventsBack | Alta |
| Banking hub | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Listado métodos guardados | Mismo contrato banking | Mismo | Bridge frontend cuando exista API | Alta |
| Chat moderation | `src/components/chat/ChatRoomView.tsx` | `packages/shell/src/lovable/components/chat/ChatRoomView.tsx` | Kick/ban participantes | `POST /chat/rooms/{id}/moderate` (TBD) | TBD | Habilitar `canModerate` con API | Media |
| Edit profile password | `src/components/feed/EditProfileView.tsx` | `packages/shell/src/lovable/components/feed/EditProfileView.tsx` | Reset password vía Cognito/API | Auth endpoints existentes | Users | Conectar flujo UI | Media |
| Edit profile interests | `src/components/feed/EditProfileView.tsx` | `packages/shell/src/lovable/components/feed/EditProfileView.tsx` | Persistir intereses usuario | `PATCH /users/{id}/profile` (TBD) | Users | Backend + bridge | Media |
| Service reviews | `src/components/services/MyServicesView.tsx` | `packages/shell/src/lovable/components/services/MyServicesView.tsx` | Ratings reales por servicio | `GET /services/{id}/reviews` (TBD) | TBD | Ocultar UI hasta API | Media |
| Venue preview payment | `src/components/venues/VenueDetailReservation.tsx` | `packages/shell/src/lovable/components/venues/VenueDetailReservation.tsx` | Pasarela pago preview sin API | Gateway pagos existente | Orders | Integrar checkout real en preview | Alta |
| KYC | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Certificación KYC | KYC endpoint (TBD) | TBD | Documentado run anterior | Alta |

## Contrato actual encontrado

- `followUser`, `unfollowUser`, `fetchFollowersList`, `fetchFollowingList`
- `fetchUserNotifications`, `markNotificationRead`, `respondFollowRequest`
- `searchUsers`, `fetchUserInvitations`, `fetchEventDetail`
- `fetchUserVenueBookings`, `fetchUserServiceBookings`, `fetchGroupedUserTickets`
- `createVenueBooking`, `fetchVenueBookingAvailability`, `createServiceBooking`
- Checkout: `useTicketCheckout` + rutas `/events/:id/checkout`

## Acción realizada

- Cliente frontend alineado; **no despliegue backend**.

## Archivos modificados en DoEventsBack

Ninguno.

## Despliegue

NO DESPLEGADO

## Riesgos

- PublishFlowModal permite publicar sin registrar banco (flujo "Notificarme más tarde").
- Flujos ticket transfer/refund RISKY — revisión humana antes de merge.

## Pendientes

- Re-comparación diseño ≥98% en CI (batches 3–6, ~78 gaps restantes).
- Confirmar contratos banking y add-ons servicios en producto/backend.
