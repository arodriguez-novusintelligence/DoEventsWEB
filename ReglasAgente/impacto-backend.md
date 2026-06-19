# Impacto Backend

## Resumen

Run `gap-empalme-27847959667-b4`: batch 4 (20 gaps) — empalme frontend completado en 18 componentes; 2 gaps documentados como BACKEND_REQUIRED (StoryViewersSheet, PayPal payout/delete cuenta).

Run `gap-empalme-27847959667-b3`: batch 3 (20 gaps) — empalme frontend completado en 19 componentes; 1 gap documentado como BACKEND_REQUIRED (PaymentGatewaySheet).

Run `gap-empalme-27847959667-b2`: batch 2 (20 gaps) — empalme frontend completado en 18 componentes; 2 gaps BACKEND_REQUIRED.

Run `gap-empalme-27847959667-b1`: batch 1 (20 gaps) — empalme frontend completado en 17 componentes; 3 gaps BACKEND_REQUIRED.

## ¿Requiere backend?

Sí (parcial)

## Empalme realizado (última ejecución — gap-empalme-27847959667-b4)

- **BankingHub / PaymentMethodsDashboard:** carga real vía `fetchBankAccountsByUser`; persistencia local/internacional con `createBankAccount` y `setDefaultBankAccount`; adapter `bankingAdapter.ts`.
- **ScanQRSheet / AccessControlListView:** validación QR con `scanTicketFromQr(code, eventId)`; empty states con iconografía.
- **SocialWallTab:** `ReportPostDialog` con `reportPublication`; `ChangeLocationSheet` con `resolveUserLocation` / `resolveManualUserLocation`.
- **FeedHero:** sin historias mock en producción (`showBuiltInStories={false}`); empty state historias API.
- **BookingSheet + BookingReviewSheet:** paso de revisión antes de `createServiceBooking`.
- **MyPostsView / MyPurchasesView / VenueReservationDetail:** tipos shared, empty states, rutas `/purchases/*`.
- **CompanyContext:** montado en `LovableLayout` con `fetchUserById`.
- **StoriesContext:** expone `loading` en contexto.
- **NotFound / EventPublished:** rutas registradas en `App.tsx`.
- **MainInfoSection / MediaUpload / TermsDialog:** polish visual alineado Lovable.

## Backend pendiente para 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| Story viewers | `src/components/feed/StoryViewersSheet.tsx` | `packages/shell/src/lovable/components/feed/StoryViewersSheet.tsx` | Lista de visualizaciones por historia | `GET /stories/{id}/viewers` (TBD) | Stories | Exponer endpoint viewers | Media |
| PayPal payout | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Tipo PayPal no mapea a `createBankAccount` | Extender `POST /bank-data` | BankAccounts | Soporte PayPal en DoEventsBack | Alta |
| Delete bank account | `src/components/banking/PaymentMethodsDashboard.tsx` | `packages/shell/src/lovable/components/banking/PaymentMethodsDashboard.tsx` | Eliminar método de cobro | `DELETE /bank-data/{id}` (TBD) | BankAccounts | Endpoint eliminación | Media |
| Payment gateway servicios | `src/components/services/PaymentGatewaySheet.tsx` | `packages/shell/src/lovable/components/services/PaymentGatewaySheet.tsx` | Reserva sin `orderId` no puede completar pago | `POST /orders` + gateway | Orders | Crear orden antes de checkout | Alta |
| Publish flow banking | `src/components/events/PublishFlowModal.tsx` | `packages/shell/src/lovable/components/events/PublishFlowModal.tsx` | Persistencia datos bancarios post-publicación | `POST/GET /users/{id}/payment-methods` (TBD) | `UserPaymentMethods` (TBD) | Implementar en DoEventsBack | Alta |
| Booking add-ons | `src/components/services/BookingSheet.tsx` | `packages/shell/src/lovable/components/services/BookingSheet.tsx` | Servicios adicionales por reserva | `GET /services/{id}/addons` (TBD) | TBD | Exponer catálogo real | Media |
| Banking form SWIFT | `src/components/banking/BankingForm.tsx` | `packages/shell/src/lovable/components/banking/BankingForm.tsx` | Validación SWIFT servidor | Mismo contrato banking | Mismo | Validación backend | Alta |
| KYC certificación | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Flujo submit certificación | KYC endpoint (TBD) | TBD | Documentado run anterior | Alta |
| Chat moderation | `src/components/chat/ChatRoomView.tsx` | `packages/shell/src/lovable/components/chat/ChatRoomView.tsx` | Kick/ban participantes | `POST /chat/rooms/{id}/moderate` (TBD) | TBD | Habilitar `canModerate` con API | Media |
| Edit profile password | `src/components/feed/EditProfileView.tsx` | `packages/shell/src/lovable/components/feed/EditProfileView.tsx` | Reset password vía Cognito/API | Auth endpoints existentes | Users | Conectar flujo UI | Media |
| Venue preview payment | `src/components/venues/VenueDetailReservation.tsx` | `packages/shell/src/lovable/components/venues/VenueDetailReservation.tsx` | Pasarela pago preview sin API | Gateway pagos existente | Orders | Integrar checkout real | Alta |

## Contrato actual encontrado

- `fetchBankAccountsByUser`, `createBankAccount`, `setDefaultBankAccount`
- `scanTicketFromQr`, `validateTicketQr`, `scanTicketAccess`
- `reportPublication`, `resolveUserLocation`, `resolveManualUserLocation`
- `fetchNearbyStories`, `fetchUserStories`
- `fetchUserVenueBookings`, `fetchUserServiceBookings`, `createServiceBooking`
- `fetchUserById` (company fields en perfil)

## Acción realizada

- Cliente frontend alineado; **no despliegue backend**.

## Archivos modificados en DoEventsBack

Ninguno.

## Despliegue

NO DESPLEGADO

## Riesgos

- Scan QR manual funciona; decodificación cámara requiere librería QR (mejora futura).
- PayPal payout bloqueado hasta extensión API bancaria.
- Flujos pago/acceso RISKY — revisión humana antes de merge.

## Pendientes

- Re-comparación diseño ≥98% en CI (batches 5–6, ~38 gaps restantes).
- Endpoint story viewers y delete bank account.
