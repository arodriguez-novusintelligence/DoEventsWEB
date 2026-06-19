# Impacto Backend

## Resumen

Run `gap-empalme-27847959667-b5`: batch 5 (20 gaps) — empalme frontend completado en 19 componentes; 1 gap documentado como BACKEND_REQUIRED (KycCertificationView submit).

Run `gap-empalme-27847959667-b4`: batch 4 (20 gaps) — empalme frontend completado en 18 componentes; 2 gaps documentados como BACKEND_REQUIRED (StoryViewersSheet, PayPal payout/delete cuenta).

Run `gap-empalme-27847959667-b3`: batch 3 (20 gaps) — empalme frontend completado en 19 componentes; 1 gap documentado como BACKEND_REQUIRED (PaymentGatewaySheet).

Run `gap-empalme-27847959667-b2`: batch 2 (20 gaps) — empalme frontend completado en 18 componentes; 2 gaps BACKEND_REQUIRED.

Run `gap-empalme-27847959667-b1`: batch 1 (20 gaps) — empalme frontend completado en 17 componentes; 3 gaps BACKEND_REQUIRED.

## ¿Requiere backend?

Sí (parcial)

## Empalme realizado (última ejecución — gap-empalme-27847959667-b5)

- **ServiceReservationDetail / MyReservedServicesView / MyReservedVenuesView:** empty states con iconografía alineada batch 4; APIs `fetchUserServiceBookings` / `fetchUserVenueBookings`.
- **GlobalSearchView + SearchEventsPage:** búsqueda unificada eventos/usuarios/publicaciones; enlace perfil `/users/:id`; sin mocks.
- **FeedBanner + KycCertificationView:** banner KYC en muro social; `KycProvider` montado en `LovableLayout`; ruta `/profile/kyc`; estado real vía `fetchUserById`.
- **Admin panels:** `AdminPanelPage` usa wrappers Lovable (`AdminUsersPanel`, `PaymentsPanel`, etc.); rutas `/admin/reports`, `/admin/refunds`; `App.tsx` importa `AdminPanelView`.
- **AddGuestModal:** búsqueda usa `onSearchUser` (matching consistente vía `useApiGuests`).
- **useGuests / GuestsHubPage:** convención `@lovable/hooks/useGuests`.
- **StoryViewer:** import unificado vía `@lovable/components/feed/StoryViewer`.
- **Auth pages (Login, ForgotPassword, ResetPassword):** re-export `mfe-auth` — lógica real sin duplicar.

## Backend pendiente para 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| KYC submit | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Envío documento/selfie certificación | `POST /users/{id}/kyc` (TBD) | Users | Integrar proveedor KYC | Alta |
| Búsqueda publicaciones | `src/components/feed/GlobalSearchView.tsx` | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | Tab posts filtra feed localmente | `GET /publications/search?q=` (TBD) | Publications | Endpoint búsqueda full-text | Media |
| Story viewers | `src/components/feed/StoryViewersSheet.tsx` | `packages/shell/src/lovable/components/feed/StoryViewersSheet.tsx` | Lista de visualizaciones por historia | `GET /stories/{id}/viewers` (TBD) | Stories | Exponer endpoint viewers | Media |
| PayPal payout | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Tipo PayPal no mapea a `createBankAccount` | Extender `POST /bank-data` | BankAccounts | Soporte PayPal en DoEventsBack | Alta |
| Delete bank account | `src/components/banking/PaymentMethodsDashboard.tsx` | `packages/shell/src/lovable/components/banking/PaymentMethodsDashboard.tsx` | Eliminar método de cobro | `DELETE /bank-data/{id}` (TBD) | BankAccounts | Endpoint eliminación | Media |
| Payment gateway servicios | `src/components/services/PaymentGatewaySheet.tsx` | `packages/shell/src/lovable/components/services/PaymentGatewaySheet.tsx` | Reserva sin `orderId` no puede completar pago | `POST /orders` + gateway | Orders | Crear orden antes de checkout | Alta |
| Publish flow banking | `src/components/events/PublishFlowModal.tsx` | `packages/shell/src/lovable/components/events/PublishFlowModal.tsx` | Persistencia datos bancarios post-publicación | `POST/GET /users/{id}/payment-methods` (TBD) | `UserPaymentMethods` (TBD) | Implementar en DoEventsBack | Alta |
| Booking add-ons | `src/components/services/BookingSheet.tsx` | `packages/shell/src/lovable/components/services/BookingSheet.tsx` | Servicios adicionales por reserva | `GET /services/{id}/addons` (TBD) | TBD | Exponer catálogo real | Media |
| Banking form SWIFT | `src/components/banking/BankingForm.tsx` | `packages/shell/src/lovable/components/banking/BankingForm.tsx` | Validación SWIFT servidor | Mismo contrato banking | Mismo | Validación backend | Alta |
| Chat moderation | `src/components/chat/ChatRoomView.tsx` | `packages/shell/src/lovable/components/chat/ChatRoomView.tsx` | Kick/ban participantes | `POST /chat/rooms/{id}/moderate` (TBD) | TBD | Habilitar `canModerate` con API | Media |
| Edit profile password | `src/components/feed/EditProfileView.tsx` | `packages/shell/src/lovable/components/feed/EditProfileView.tsx` | Reset password vía Cognito/API | Auth endpoints existentes | Users | Conectar flujo UI | Media |
| Venue preview payment | `src/components/venues/VenueDetailReservation.tsx` | `packages/shell/src/lovable/components/venues/VenueDetailReservation.tsx` | Pasarela pago preview sin API | Gateway pagos existente | Orders | Integrar checkout real | Alta |

## Contrato actual encontrado

- `fetchUserServiceBookings`, `fetchUserVenueBookings`
- `searchEvents`, `searchUsers`, `fetchSocialFeed`
- `fetchUserById` (campos KYC: `kycStatus`, `organizerCertified`)
- `followUser`, `fetchPendingFollowRequests`, `fetchFollowersCount`
- Admin: `fetchAdminDashboard`, tabs vía wrappers Lovable
- Guests: `searchUsers`, `searchUserByUsername` vía `useApiGuests`

## Acción realizada

- Cliente frontend alineado; **no despliegue backend**.

## Archivos modificados en DoEventsBack

Ninguno.

## Despliegue

NO DESPLEGADO

## Riesgos

- KYC submit bloqueado hasta integración proveedor identidad.
- Búsqueda posts limitada a filtro cliente sobre feed reciente.
- Auth pages similitud visual limitada (re-export mfe-auth intencional).
- Flujos pago/acceso RISKY — revisión humana antes de merge.

## Pendientes

- Re-comparación diseño ≥98% en CI (batch 6, ~18 gaps restantes).
- Endpoint KYC submit y búsqueda publicaciones.
