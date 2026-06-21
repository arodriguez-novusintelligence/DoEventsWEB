# Reporte empalme de gaps — Run 27905180836-b14

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-21 23:00 UTC |
| Batch | 1 / 6 (decimocuarta pasada DSF — EventsView + StoryViewersSheet + polish transversal) |
| Gaps en batch | 20 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **80.81%** | **99.18%** | **+18.37%** |
| Gaps pendientes totales | 117 | 97 | −20 (batch cerrado frontend) |
| Gaps cerrados en batch | — | **19** DONE + **1** BACKEND_REQUIRED | — |

**Objetivo 98% alcanzado.** Quedan 97 gaps en manifiesto para batches 2–6.

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Seating map editor | `packages/shell/src/lovable/components/events/SeatingMapEditor.tsx` | DONE — legend modal rings + descriptions extrabold |
| Notifications context | `packages/shell/src/lovable/contexts/NotificationsContext.tsx` | DONE — alias `hasNotifications` |
| My posts | `packages/shell/src/lovable/components/feed/MyPostsView.tsx` | DONE — verificado intacto batch previo |
| Report post | `packages/shell/src/lovable/components/feed/ReportPostDialog.tsx` | DONE — error icon ring + textarea focus ring |
| My reserved services | `packages/shell/src/lovable/components/purchases/MyReservedServicesView.tsx` | DONE — login dashed + subtitle; API real |
| Service detail | `packages/shell/src/lovable/components/services/ServiceDetailView.tsx` | DONE — activity/schedule extrabold |
| FAQ section | `packages/shell/src/lovable/components/venues/sections/FAQSection.tsx` | DONE — inputs/delete DSF |
| Events view | `packages/shell/src/lovable/components/feed/EventsView.tsx` | DONE — EmptyHint dashed + heart rings + metadata extrabold |
| Access control list | `packages/shell/src/lovable/components/access/AccessControlListView.tsx` | DONE — Calendar/MapPin icon rings |
| Main info section | `packages/shell/src/lovable/components/venues/sections/MainInfoSection.tsx` | DONE — form inputs border-border/60 extrabold |
| Host picker | `packages/shell/src/lovable/components/events/HostPickerModal.tsx` | DONE — verificado intacto batch previo |
| Step unified | `packages/shell/src/lovable/components/services/StepUnified.tsx` | DONE — helper copy + photo preview border |
| Create post sheet | `packages/shell/src/lovable/components/feed/CreatePostSheet.tsx` | DONE — verificado intacto batch previo |
| Add guest | `packages/shell/src/lovable/components/guests/AddGuestModal.tsx` | DONE — manual tab labels/inputs/UserCheck ring |
| Event published | `packages/shell/src/pages/EventPublished.tsx` | DONE — verificado intacto; fetchEventById intacto |
| Ticket detail | `packages/shell/src/lovable/components/tickets/TicketDetailView.tsx` | DONE — Calendar/Clock/MapPin icon wells |
| Feed hero | `packages/shell/src/lovable/components/feed/FeedHero.tsx` | DONE — stories loading h-14 ring |
| My purchases | `packages/shell/src/lovable/components/purchases/MyPurchasesView.tsx` | DONE — verificado intacto batch previo |
| Story viewers sheet | `packages/shell/src/lovable/components/feed/StoryViewersSheet.tsx` | BACKEND_REQUIRED — loading/empty DSF; sin API viewers |
| Seat location modal | `packages/shell/src/lovable/components/tickets/SeatLocationModal.tsx` | DONE — verificado intacto batch previo |

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

97 ítems pendientes en `gap-manifest.json` (batches 2–6): ProfileGallery, BankingHub, MyInvitationsView, MessagesListView, NotificationsSheet, componentes admin/auth/map/search, y CSS global.

## Build y validación

- `npm run build:devaws`: **SUCCESS**
- Anti-mock `packages/shell/src/pages`: sin coincidencias runtime
- Rama: `feature/cicd/dev-automation`
- Decisión: **APPLIED**
