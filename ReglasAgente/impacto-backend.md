# Impacto Backend

## Resumen

Run b6c89604: navegación `onBack` en lista de mensajes — solo frontend (`ChatPage` → `/`). Sin cambios backend.

Empalme batch 1 (20 gaps): checkout real para tickets, mapa con horarios API, notificaciones sin fixture local. Banking, reseñas de servicios, moderación chat e intereses/perfil requieren contratos backend.

## ¿Requiere backend?

Sí (parcial)

## Empalme realizado (última ejecución — gap-empalme-27839776030)

- **Checkout tickets:** `InvitationEventDetailView` + `MyInvitationsPage` navegan a `/events/:id/checkout`; `TicketPurchaseFlow` redirige si hay `event.id`.
- **Mapa:** `mapAdapter` expone `timeRange` desde `horaIni`/`horaFin`; `MapView` abre Google Maps directions.
- **Notificaciones:** `NotificationsContext` solo API (`fetchUserNotifications`); fixture `initialNotifications` eliminado.
- **Invitados:** conteos de invitación solo en sesión (sin localStorage ficticio).
- **Reseñas servicios/eventos:** UI oculta ratings 0.0 cuando no hay datos API.

## Backend pendiente para 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| Banking form | `src/components/banking/BankingForm.tsx` | `packages/shell/src/lovable/components/banking/BankingForm.tsx` | Persistencia métodos de pago y verificación cuenta | `POST/GET /users/{id}/payment-methods` (TBD) | `UserPaymentMethods` (TBD) | Implementar en DoEventsBack | Alta |
| Banking hub | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Listado métodos guardados | Mismo contrato banking | Mismo | Bridge frontend cuando exista API | Alta |
| Service reviews | `src/components/services/MyServicesView.tsx` | `packages/shell/src/lovable/components/services/MyServicesView.tsx` | Ratings reales por servicio | `GET /services/{id}/reviews` (TBD) | TBD | Ocultar UI hasta API | Media |
| Chat moderation | `src/components/chat/ChatRoomView.tsx` | `packages/shell/src/lovable/components/chat/ChatRoomView.tsx` | Kick/ban participantes | `POST /chat/rooms/{id}/moderate` (TBD) | TBD | Habilitar `canModerate` con API | Media |
| Edit profile interests | `src/components/feed/EditProfileView.tsx` | `packages/shell/src/lovable/components/feed/EditProfileView.tsx` | Intereses y password reset | Auth/profile endpoints existentes | Users | Conectar flujos UI-only | Media |
| KYC | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Certificación KYC | KYC endpoint (TBD) | TBD | Documentado run anterior | Alta |

## Contrato actual encontrado

- `fetchUserNotifications`, `markNotificationRead`, `respondFollowRequest`
- `searchUsers`, `fetchUserInvitations`, `fetchEventDetail`
- `fetchUserVenueBookings`, `fetchUserServiceBookings`, `fetchGroupedUserTickets`
- Checkout: `useTicketCheckout` + rutas `/events/:id/checkout`

## Acción realizada

- Cliente frontend alineado; **no despliegue backend**.

## Archivos modificados en DoEventsBack

Ninguno.

## Despliegue

NO DESPLEGADO

## Riesgos

- BankingForm compila y valida formato local; submit sin API puede confundir al usuario hasta integrar backend.

## Pendientes

- Confirmar contratos banking en producto/backend.
- Re-comparación diseño ≥98% en CI (batches 2–6).
