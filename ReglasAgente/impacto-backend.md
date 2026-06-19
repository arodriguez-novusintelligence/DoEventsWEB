# Impacto Backend

## Resumen

Run `gap-empalme-27847959667-b3`: batch 3 (20 gaps) — empalme frontend completado en 19 componentes; 1 gap documentado como BACKEND_REQUIRED (PaymentGatewaySheet).

Run `gap-empalme-27847959667-b2`: batch 2 (20 gaps) — empalme frontend completado en 18 componentes; 2 gaps BACKEND_REQUIRED.

Run `gap-empalme-27847959667-b1`: batch 1 (20 gaps) — empalme frontend completado en 17 componentes; 3 gaps BACKEND_REQUIRED.

## ¿Requiere backend?

Sí (parcial)

## Empalme realizado (última ejecución — gap-empalme-27847959667-b3)

- **MyTicketsView / MyInvitationsView:** estados loading y vacío con iconografía; badges de estado en invitaciones.
- **CreatePostSheet:** eliminado `mockData` (`users`, `bannerEvents`); menciones vía props `mentionOptions`.
- **CommentsSheet / FavoritesView / ProfileView:** tipos `Comment`/`Post` desde `@doevents/shared`.
- **PaymentGatewaySheet:** indicador de progreso por pasos; sin simular éxito cuando falta `orderId`.
- **EventsView / FeedServicesCarousel:** empty states con iconos; skeleton de carga en carrusel.
- **EventInvitationModal:** loading/empty en selección de eventos e invitados.
- **NotificationsContext:** expone `loading` en contexto.
- **KycContext:** `statusLabel` y `KYC_STATUS_LABELS` desde perfil API.
- **ProfileView:** badge Shield solo si `isCertified` (KycContext).
- **AIAssistantView:** chips de sugerencias con iconografía Sparkles; indicador de pensamiento animado.
- **AuthLogo, FAQSection, LocationSection, PreferencesRefundSection, VenueCreator, EventDetailView, SeatLocationModal:** polish visual alineado Lovable.

## Backend pendiente para 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| Payment gateway servicios | `src/components/services/PaymentGatewaySheet.tsx` | `packages/shell/src/lovable/components/services/PaymentGatewaySheet.tsx` | Reserva sin `orderId` no puede completar pago; gateway real requerido | `POST /orders` + gateway pagos existente | Orders | Crear orden antes de checkout; integrar pasarela | Alta |
| Publish flow banking | `src/components/events/PublishFlowModal.tsx` | `packages/shell/src/lovable/components/events/PublishFlowModal.tsx` | Persistencia datos bancarios post-publicación | `POST/GET /users/{id}/payment-methods` (TBD) | `UserPaymentMethods` (TBD) | Implementar en DoEventsBack | Alta |
| Booking add-ons | `src/components/services/BookingSheet.tsx` | `packages/shell/src/lovable/components/services/BookingSheet.tsx` | Servicios adicionales por reserva | `GET /services/{id}/addons` (TBD) | TBD | Exponer catálogo real | Media |
| Banking form | `src/components/banking/BankingForm.tsx` | `packages/shell/src/lovable/components/banking/BankingForm.tsx` | Persistencia métodos de pago | Mismo contrato banking | Mismo | Implementar en DoEventsBack | Alta |
| Banking hub | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Listado métodos guardados | Mismo contrato banking | Mismo | Bridge frontend cuando exista API | Alta |
| KYC certificación | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Flujo submit certificación | KYC endpoint (TBD) | TBD | Documentado run anterior | Alta |
| Chat moderation | `src/components/chat/ChatRoomView.tsx` | `packages/shell/src/lovable/components/chat/ChatRoomView.tsx` | Kick/ban participantes | `POST /chat/rooms/{id}/moderate` (TBD) | TBD | Habilitar `canModerate` con API | Media |
| Edit profile password | `src/components/feed/EditProfileView.tsx` | `packages/shell/src/lovable/components/feed/EditProfileView.tsx` | Reset password vía Cognito/API | Auth endpoints existentes | Users | Conectar flujo UI | Media |
| Edit profile interests | `src/components/feed/EditProfileView.tsx` | `packages/shell/src/lovable/components/feed/EditProfileView.tsx` | Persistir intereses usuario | `PATCH /users/{id}/profile` (TBD) | Users | Backend + bridge | Media |
| Service reviews | `src/components/services/MyServicesView.tsx` | `packages/shell/src/lovable/components/services/MyServicesView.tsx` | Ratings reales por servicio | `GET /services/{id}/reviews` (TBD) | TBD | Ocultar UI hasta API | Media |
| Venue preview payment | `src/components/venues/VenueDetailReservation.tsx` | `packages/shell/src/lovable/components/venues/VenueDetailReservation.tsx` | Pasarela pago preview sin API | Gateway pagos existente | Orders | Integrar checkout real en preview | Alta |

## Contrato actual encontrado

- `confirmTicketPayment`, `createServiceBooking`, `fetchServiceBookingAvailability`
- `fetchUserNotifications`, `markNotificationRead`, `respondFollowRequest`
- `fetchUserById` (KYC status en perfil)
- `fetchAvailableSeats`, `fetchEventDetail`, `getVenueById`, `resolveCheckoutFloors`
- `sendAIAssistantMessage`, `startAIAgentJob`, `pollAIAgentJob`
- Checkout: `useTicketCheckout` + rutas `/events/:id/checkout`

## Acción realizada

- Cliente frontend alineado; **no despliegue backend**.

## Archivos modificados en DoEventsBack

Ninguno.

## Despliegue

NO DESPLEGADO

## Riesgos

- PaymentGatewaySheet bloquea pago sin `orderId` — flujo reserva servicio debe crear orden primero.
- Flujos pago servicios RISKY — revisión humana antes de merge.

## Pendientes

- Re-comparación diseño ≥98% en CI (batches 4–6, ~58 gaps restantes).
- Confirmar contrato orden de pago servicios en producto/backend.
