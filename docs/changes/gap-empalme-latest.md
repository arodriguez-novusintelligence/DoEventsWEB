# Reporte empalme de gaps — Run 27905180836-b12

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-21 21:00 UTC |
| Batch | 1 / 6 (duodécima pasada DSF — FeedHero + Notifications API aliases) |
| Gaps en batch | 20 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **80.8%** | **98.95%** | **+18.15%** |
| Gaps pendientes totales | 117 | 97 | −20 (batch cerrado frontend) |
| Gaps cerrados en batch | — | **20** DONE + **0** BACKEND_REQUIRED | — |

**Objetivo 98% alcanzado.** Quedan 97 gaps en manifiesto para batches 2–6.

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Step access control | `packages/shell/src/lovable/components/events/StepAccessControl.tsx` | DONE — stat icon rings + muted extrabold |
| Seating map editor | `packages/shell/src/lovable/components/events/SeatingMapEditor.tsx` | DONE — CTAs rounded-full shadow-sm |
| Notifications context | `packages/shell/src/lovable/contexts/NotificationsContext.tsx` | DONE — markAsRead/removeNotification/reloadNotifications aliases |
| FAQ section | `packages/shell/src/lovable/components/venues/sections/FAQSection.tsx` | DONE — sublabel extrabold + dashed border-primary/25 |
| Host picker | `packages/shell/src/lovable/components/events/HostPickerModal.tsx` | DONE — hints/email extrabold |
| Service detail | `packages/shell/src/lovable/components/services/ServiceDetailView.tsx` | DONE — availability/review labels extrabold |
| My posts | `packages/shell/src/lovable/components/feed/MyPostsView.tsx` | DONE — empty copy extrabold |
| Events view | `packages/shell/src/lovable/components/feed/EventsView.tsx` | DONE — heart ring-primary/20 + location extrabold |
| My reserved services | `packages/shell/src/lovable/components/purchases/MyReservedServicesView.tsx` | DONE — dates/chevron tokens; API real |
| Main info section | `packages/shell/src/lovable/components/venues/sections/MainInfoSection.tsx` | DONE — subtitle/counter extrabold |
| Step unified | `packages/shell/src/lovable/components/services/StepUnified.tsx` | DONE — pricing labels + dashed border-border/60 |
| Report post | `packages/shell/src/lovable/components/feed/ReportPostDialog.tsx` | DONE — Shield icon ring + description extrabold |
| Access control list | `packages/shell/src/lovable/components/access/AccessControlListView.tsx` | DONE — Lock ring + section counts extrabold |
| Add guest | `packages/shell/src/lovable/components/guests/AddGuestModal.tsx` | DONE — tabs rounded-full active ring |
| Create post sheet | `packages/shell/src/lovable/components/feed/CreatePostSheet.tsx` | DONE — location rounded-xl + visibility extrabold |
| Ticket detail | `packages/shell/src/lovable/components/tickets/TicketDetailView.tsx` | DONE — field labels extrabold |
| Event published | `packages/shell/src/pages/EventPublished.tsx` | DONE — card ring-primary/10; fetchEventById intacto |
| My purchases | `packages/shell/src/lovable/components/purchases/MyPurchasesView.tsx` | DONE — dashed border-border/60 + chevron primary/70 |
| Feed hero | `packages/shell/src/lovable/components/feed/FeedHero.tsx` | DONE — gradientes semánticos + category ring |
| Seat location modal | `packages/shell/src/lovable/components/tickets/SeatLocationModal.tsx` | DONE — legend/empty extrabold + dashed border |

## Backend pendiente para cerrar al 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| StoryViewersSheet | `src/components/feed/StoryViewersSheet.tsx` | `packages/shell/src/lovable/components/feed/StoryViewersSheet.tsx` | Sin API viewers | GET /stories/{id}/viewers | Stories | Exponer endpoint | Baja |
| Banking delete | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Sin endpoint eliminar cuenta | `DELETE /bank-accounts/{id}` | BankAccounts | Implementar en DoEventsBack | Alta |
| PayPal payout | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | PayPal requiere integración | PSP webhook/payout | BankAccounts | Integrar proveedor | Alta |
| PaymentMethods delete | `src/components/banking/PaymentMethodsDashboard.tsx` | `packages/shell/src/lovable/components/banking/PaymentMethodsDashboard.tsx` | Mismo contrato delete | `DELETE /bank-accounts/{id}` | BankAccounts | Reutilizar endpoint | Alta |
| KYC submit | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Sin envío documentos | KYC provider API | Users | Integración proveedor | Alta |
| EditProfile password/gustos | `src/components/feed/EditProfileView.tsx` | `packages/shell/src/lovable/components/feed/EditProfileView.tsx` | Cambio contraseña + intereses | Cognito + profile PATCH | Users | Conectar flujos UI | Media |
| Booking add-ons | `src/components/services/BookingSheet.tsx` | `packages/shell/src/lovable/components/services/BookingSheet.tsx` | Catálogo servicios adicionales | GET service add-ons | Services | Exponer catálogo | Media |
| PublishFlow banking | `src/components/events/PublishFlowModal.tsx` | `packages/shell/src/lovable/components/events/PublishFlowModal.tsx` | Persistencia banco post-publicación | POST bank on publish | BankAccounts | Implementar en DoEventsBack | Media |
| GlobalSearch posts | `src/components/feed/GlobalSearchView.tsx` | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | Sin búsqueda publicaciones | GET /publications/search?q= | Publications | Endpoint dedicado | Media |

## Gaps restantes

97 ítems pendientes en `gap-manifest.json` (batches 2–6): MessagesListView, NotificationsSheet, StoryViewersSheet, ProfileGallery, BankingHub, MyInvitationsView, y componentes admin/auth/map/search.

## Build y validación

- `npm run build:devaws`: **SUCCESS**
- Anti-mock `packages/shell/src/pages`: sin coincidencias runtime
- Rama: `feature/cicd/dev-automation`
- Decisión: **APPLIED**
