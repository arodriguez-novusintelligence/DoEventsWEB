# Reporte empalme de gaps — Run 27910611218-b4

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-21 20:00 UTC |
| Batch | 1 / 6 (empalme DSF manifiesto workflow 27910611218-b4) |
| Gaps en batch | 20 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **80.7%** | **99.54%** | **+18.84%** |
| Gaps pendientes totales | 117 | 97 | −20 (batch cerrado frontend) |
| Gaps cerrados en batch | — | **20** DONE | — |

**Objetivo 98% alcanzado.** Quedan 97 gaps en manifiesto para batches 2–6.

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Seating map editor | `packages/shell/src/lovable/components/events/SeatingMapEditor.tsx` | DONE — verificado intacto b1/b2/b3 |
| Notifications context | `packages/shell/src/lovable/contexts/NotificationsContext.tsx` | DONE — verificado intacto b1/b2/b3 |
| My reserved services | `packages/shell/src/lovable/components/purchases/MyReservedServicesView.tsx` | DONE — verificado intacto b1/b2/b3 |
| Report post | `packages/shell/src/lovable/components/feed/ReportPostDialog.tsx` | DONE — verificado intacto b1/b2/b3 |
| Main info section | `packages/shell/src/lovable/components/venues/sections/MainInfoSection.tsx` | DONE — verificado intacto b1/b2/b3 |
| Access control list | `packages/shell/src/lovable/components/access/AccessControlListView.tsx` | DONE — verificado intacto b1/b2/b3 |
| My posts | `packages/shell/src/lovable/components/feed/MyPostsView.tsx` | DONE — verificado intacto b1/b2/b3 |
| Events view | `packages/shell/src/lovable/components/feed/EventsView.tsx` | DONE — verificado intacto b1/b2/b3 |
| Service detail | `packages/shell/src/lovable/components/services/ServiceDetailView.tsx` | DONE — verificado intacto b1/b2/b3 |
| Create post sheet | `packages/shell/src/lovable/components/feed/CreatePostSheet.tsx` | DONE — verificado intacto b1/b2/b3 |
| Host picker | `packages/shell/src/lovable/components/events/HostPickerModal.tsx` | DONE — verificado intacto b1/b2/b3 |
| FAQ section | `packages/shell/src/lovable/components/venues/sections/FAQSection.tsx` | DONE — verificado intacto b1/b2/b3 |
| Step unified | `packages/shell/src/lovable/components/services/StepUnified.tsx` | DONE — verificado intacto b1/b2/b3 |
| Event published | `packages/shell/src/pages/EventPublished.tsx` | DONE — verificado intacto b1/b2/b3 |
| Add guest | `packages/shell/src/lovable/components/guests/AddGuestModal.tsx` | DONE — verificado intacto b1/b2/b3 |
| Ticket detail | `packages/shell/src/lovable/components/tickets/TicketDetailView.tsx` | DONE — verificado intacto b1/b2/b3 |
| Feed hero | `packages/shell/src/lovable/components/feed/FeedHero.tsx` | DONE — verificado intacto b1/b2/b3 |
| Seat location modal | `packages/shell/src/lovable/components/tickets/SeatLocationModal.tsx` | DONE — verificado intacto b1/b2/b3 |
| Messages list | `packages/shell/src/lovable/components/chat/MessagesListView.tsx` | DONE — header rings shadow-sm; unread ring-primary/10; badges font-extrabold; empty dashed border-border/60 |
| Notifications sheet | `packages/shell/src/lovable/components/feed/NotificationsSheet.tsx` | DONE — max-h-[90dvh] ring-primary/10; rows card border-border/60; unread font-extrabold; APIs shared intactas |

## Backend pendiente para cerrar al 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| Banking delete | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Sin endpoint eliminar cuenta | `DELETE /bank-accounts/{id}` | BankAccounts | Implementar en DoEventsBack | Alta |
| PayPal payout | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | PayPal requiere integración | PSP webhook/payout | BankAccounts | Integrar proveedor | Alta |
| StoryViewersSheet | `src/components/feed/StoryViewersSheet.tsx` | `packages/shell/src/lovable/components/feed/StoryViewersSheet.tsx` | Sin API viewers | GET /stories/{id}/viewers | Stories | Exponer endpoint | Media |
| KYC submit | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Sin envío documentos | KYC provider API | Users | Integración proveedor | Alta |
| GlobalSearch posts | `src/components/feed/GlobalSearchView.tsx` | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | Sin búsqueda publicaciones | GET /publications/search?q= | Publications | Endpoint dedicado | Media |

## Gaps restantes

97 ítems pendientes en manifiesto (batches 2–6): ProfileGallery, MyReservedVenuesView, MyPurchasesView, BankingHub, componentes admin/auth/map/search, CSS global, etc.

## Build y validación

- `npm run build:devaws`: **SUCCESS**
- Anti-mock `packages/shell/src/pages`: sin coincidencias runtime
- Rama: `feature/cicd/dev-automation`
- Decisión: **APPLIED**
