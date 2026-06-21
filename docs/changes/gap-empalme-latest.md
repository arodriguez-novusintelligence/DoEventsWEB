# Reporte empalme de gaps — Run 27910611218-b5

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-21 21:00 UTC |
| Batch | 1 / 6 (empalme DSF manifiesto workflow 27910611218-b5) |
| Gaps en batch | 20 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **80.69%** | **99.62%** | **+18.93%** |
| Gaps pendientes totales | 117 | 97 | −20 (batch cerrado frontend) |
| Gaps cerrados en batch | — | **20** DONE | — |

**Objetivo 98% alcanzado.** Quedan 97 gaps en manifiesto para batches 2–6.

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Seating map editor | `packages/shell/src/lovable/components/events/SeatingMapEditor.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| Notifications context | `packages/shell/src/lovable/contexts/NotificationsContext.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| My reserved services | `packages/shell/src/lovable/components/purchases/MyReservedServicesView.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| Report post | `packages/shell/src/lovable/components/feed/ReportPostDialog.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| Main info section | `packages/shell/src/lovable/components/venues/sections/MainInfoSection.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| Access control list | `packages/shell/src/lovable/components/access/AccessControlListView.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| My posts | `packages/shell/src/lovable/components/feed/MyPostsView.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| Events view | `packages/shell/src/lovable/components/feed/EventsView.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| Service detail | `packages/shell/src/lovable/components/services/ServiceDetailView.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| Create post sheet | `packages/shell/src/lovable/components/feed/CreatePostSheet.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| Host picker | `packages/shell/src/lovable/components/events/HostPickerModal.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| FAQ section | `packages/shell/src/lovable/components/venues/sections/FAQSection.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| Step unified | `packages/shell/src/lovable/components/services/StepUnified.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| Event published | `packages/shell/src/pages/EventPublished.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| Add guest | `packages/shell/src/lovable/components/guests/AddGuestModal.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| Ticket detail | `packages/shell/src/lovable/components/tickets/TicketDetailView.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| Feed hero | `packages/shell/src/lovable/components/feed/FeedHero.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| Seat location modal | `packages/shell/src/lovable/components/tickets/SeatLocationModal.tsx` | DONE — verificado intacto b1/b2/b3/b4 |
| Profile gallery | `packages/shell/src/lovable/components/feed/ProfileGallery.tsx` | DONE — ring-primary/10 card; progress label extrabold; save footer border-t; lightbox ring shadow-sm |
| Notifications sheet | `packages/shell/src/lovable/components/feed/NotificationsSheet.tsx` | DONE — verificado intacto b4; APIs shared intactas |

## Backend pendiente para cerrar al 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| Banking delete | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Sin endpoint eliminar cuenta | `DELETE /bank-accounts/{id}` | BankAccounts | Implementar en DoEventsBack | Alta |
| PayPal payout | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | PayPal requiere integración | PSP webhook/payout | BankAccounts | Integrar proveedor | Alta |
| StoryViewersSheet | `src/components/feed/StoryViewersSheet.tsx` | `packages/shell/src/lovable/components/feed/StoryViewersSheet.tsx` | Sin API viewers | GET /stories/{id}/viewers | Stories | Exponer endpoint | Media |
| KYC submit | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Sin envío documentos | KYC provider API | Users | Integración proveedor | Alta |
| GlobalSearch posts | `src/components/feed/GlobalSearchView.tsx` | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | Sin búsqueda publicaciones | GET /publications/search?q= | Publications | Endpoint dedicado | Media |

## Gaps restantes

97 ítems pendientes en manifiesto (batches 2–6): MyReservedVenuesView, MyPurchasesView, BankingHub, MessagesListView, componentes admin/auth/map/search, CSS global, etc.

## Build y validación

- `npm run build:devaws`: **SUCCESS**
- Anti-mock `packages/shell/src/pages`: sin coincidencias runtime
- Rama: `feature/cicd/dev-automation`
- Decisión: **APPLIED**
