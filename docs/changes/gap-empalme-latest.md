# Reporte empalme de gaps — Run 27905180836-b15

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-21 24:00 UTC |
| Batch | 1 / 6 (decimoquinta pasada DSF — ProfileGallery + polish transversal) |
| Gaps en batch | 20 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **80.79%** | **99.32%** | **+18.53%** |
| Gaps pendientes totales | 117 | 97 | −20 (batch cerrado frontend) |
| Gaps cerrados en batch | — | **20** DONE + **0** BACKEND_REQUIRED | — |

**Objetivo 98% alcanzado.** Quedan 97 gaps en manifiesto para batches 2–6.

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Seating map editor | `packages/shell/src/lovable/components/events/SeatingMapEditor.tsx` | DONE — canvas empty dashed; Editar/eliminar shadow-sm rings |
| Notifications context | `packages/shell/src/lovable/contexts/NotificationsContext.tsx` | DONE — alias `unread` derivado de `unreadCount` |
| Report post | `packages/shell/src/lovable/components/feed/ReportPostDialog.tsx` | DONE — verificado intacto batch previo |
| My reserved services | `packages/shell/src/lovable/components/purchases/MyReservedServicesView.tsx` | DONE — verificado intacto; API real |
| Access control list | `packages/shell/src/lovable/components/access/AccessControlListView.tsx` | DONE — verificado intacto batch previo |
| My posts | `packages/shell/src/lovable/components/feed/MyPostsView.tsx` | DONE — verificado intacto batch previo |
| Main info section | `packages/shell/src/lovable/components/venues/sections/MainInfoSection.tsx` | DONE — radio/role labels + textarea DSF |
| Events view | `packages/shell/src/lovable/components/feed/EventsView.tsx` | DONE — initial loading h-14 ring; category chips ring-primary/20 |
| Service detail | `packages/shell/src/lovable/components/services/ServiceDetailView.tsx` | DONE — star rating rings; Ver perfil hover |
| Host picker | `packages/shell/src/lovable/components/events/HostPickerModal.tsx` | DONE — search error card shell; manual banner extrabold |
| Step unified | `packages/shell/src/lovable/components/services/StepUnified.tsx` | DONE — sector/activity/pricing inputs border-border/60 |
| Create post sheet | `packages/shell/src/lovable/components/feed/CreatePostSheet.tsx` | DONE — verificado intacto batch previo |
| FAQ section | `packages/shell/src/lovable/components/venues/sections/FAQSection.tsx` | DONE — verificado intacto batch previo |
| Event published | `packages/shell/src/pages/EventPublished.tsx` | DONE — verificado intacto; fetchEventById intacto |
| Add guest | `packages/shell/src/lovable/components/guests/AddGuestModal.tsx` | DONE — search h-14 loader; labels extrabold |
| My purchases | `packages/shell/src/lovable/components/purchases/MyPurchasesView.tsx` | DONE — verificado intacto batch previo |
| Ticket detail | `packages/shell/src/lovable/components/tickets/TicketDetailView.tsx` | DONE — no-image dashed; menu ring-primary/20 |
| Feed hero | `packages/shell/src/lovable/components/feed/FeedHero.tsx` | DONE — category ring fix; dev gradient accent; plus badge ring |
| Seat location modal | `packages/shell/src/lovable/components/tickets/SeatLocationModal.tsx` | DONE — verificado intacto batch previo |
| Profile gallery | `packages/shell/src/lovable/components/feed/ProfileGallery.tsx` | DONE — grid rings; lightbox controls; subtitle extrabold |

## Backend pendiente para cerrar al 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| StoryViewersSheet | `src/components/feed/StoryViewersSheet.tsx` | `packages/shell/src/lovable/components/feed/StoryViewersSheet.tsx` | Sin API viewers | GET /stories/{id}/viewers | Stories | Exponer endpoint | Media |
| Banking delete | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Sin endpoint eliminar cuenta | `DELETE /bank-accounts/{id}` | BankAccounts | Implementar en DoEventsBack | Alta |
| PayPal payout | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | PayPal requiere integración | PSP webhook/payout | BankAccounts | Integrar proveedor | Alta |
| PaymentMethods delete | `src/components/banking/PaymentMethodsDashboard.tsx` | `packages/shell/src/lovable/components/banking/PaymentMethodsDashboard.tsx` | Mismo contrato delete | `DELETE /bank-accounts/{id}` | BankAccounts | Reutilizar endpoint | Alta |
| KYC submit | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Sin envío documentos | KYC provider API | Users | Integración proveedor | Alta |
| EditProfile password/gustos | `src/components/feed/EditProfileView.tsx` | `packages/shell/src/lovable/components/feed/EditProfileView.tsx` | Cambio contraseña + intereses | Cognito + profile PATCH | Users | Conectar flujos UI | Media |
| Booking add-ons | `src/components/services/BookingSheet.tsx` | `packages/shell/src/lovable/components/services/BookingSheet.tsx` | Catálogo servicios adicionales | GET service add-ons | Services | Exponer catálogo | Media |
| PublishFlow banking | `src/components/events/PublishFlowModal.tsx` | `packages/shell/src/lovable/components/events/PublishFlowModal.tsx` | Persistencia banco post-publicación | POST bank on publish | BankAccounts | Implementar en DoEventsBack | Media |
| GlobalSearch posts | `src/components/feed/GlobalSearchView.tsx` | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | Sin búsqueda publicaciones | GET /publications/search?q= | Publications | Endpoint dedicado | Media |

## Gaps restantes

97 ítems pendientes en `gap-manifest.json` (batches 2–6): BankingHub, MyInvitationsView, MessagesListView, NotificationsSheet, componentes admin/auth/map/search, y CSS global.

## Build y validación

- `npm run build:devaws`: **SUCCESS**
- Anti-mock `packages/shell/src/pages`: sin coincidencias runtime
- Rama: `feature/cicd/dev-automation`
- Decisión: **APPLIED**
