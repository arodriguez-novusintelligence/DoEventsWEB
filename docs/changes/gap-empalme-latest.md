# Reporte empalme de gaps — Run 27910611218-b6

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-21 22:00 UTC |
| Batch | 1 / 6 (empalme DSF manifiesto workflow 27910611218-b6) |
| Gaps en batch | 20 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **80.68%** | **99.70%** | **+19.02%** |
| Gaps pendientes totales | 117 | 97 | −20 (batch cerrado frontend) |
| Gaps cerrados en batch | — | **20** DONE | — |

**Objetivo 98% alcanzado.** Quedan 97 gaps en manifiesto para batches 2–6.

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Seating map editor | `packages/shell/src/lovable/components/events/SeatingMapEditor.tsx` | DONE — verificado intacto b1–b5 |
| Notifications context | `packages/shell/src/lovable/contexts/NotificationsContext.tsx` | DONE — loadingState + NOTIFICATIONS_UPDATED_EVENT export |
| My reserved services | `packages/shell/src/lovable/components/purchases/MyReservedServicesView.tsx` | DONE — verificado intacto b1–b5 |
| Report post | `packages/shell/src/lovable/components/feed/ReportPostDialog.tsx` | DONE — verificado intacto b1–b5 |
| Main info section | `packages/shell/src/lovable/components/venues/sections/MainInfoSection.tsx` | DONE — verificado intacto b1–b5 |
| Access control list | `packages/shell/src/lovable/components/access/AccessControlListView.tsx` | DONE — verificado intacto b1–b5 |
| My posts | `packages/shell/src/lovable/components/feed/MyPostsView.tsx` | DONE — verificado intacto b1–b5 |
| Events view | `packages/shell/src/lovable/components/feed/EventsView.tsx` | DONE — verificado intacto b1–b5 |
| Service detail | `packages/shell/src/lovable/components/services/ServiceDetailView.tsx` | DONE — verificado intacto b1–b5 |
| Create post sheet | `packages/shell/src/lovable/components/feed/CreatePostSheet.tsx` | DONE — verificado intacto b1–b5 |
| Host picker | `packages/shell/src/lovable/components/events/HostPickerModal.tsx` | DONE — verificado intacto b1–b5 |
| FAQ section | `packages/shell/src/lovable/components/venues/sections/FAQSection.tsx` | DONE — verificado intacto b1–b5 |
| Step unified | `packages/shell/src/lovable/components/services/StepUnified.tsx` | DONE — verificado intacto b1–b5 |
| Event published | `packages/shell/src/pages/EventPublished.tsx` | DONE — ring-primary/10 card; ghost flat; outline ring |
| Add guest | `packages/shell/src/lovable/components/guests/AddGuestModal.tsx` | DONE — verificado intacto b1–b5 |
| Ticket detail | `packages/shell/src/lovable/components/tickets/TicketDetailView.tsx` | DONE — verificado intacto b1–b5 |
| Feed hero | `packages/shell/src/lovable/components/feed/FeedHero.tsx` | DONE — verificado intacto b1–b5 |
| Seat location modal | `packages/shell/src/lovable/components/tickets/SeatLocationModal.tsx` | DONE — verificado intacto b1–b5 |
| Notifications sheet | `packages/shell/src/lovable/components/feed/NotificationsSheet.tsx` | DONE — header badge ring; retry ring-primary/20 |
| Messages list | `packages/shell/src/lovable/components/chat/MessagesListView.tsx` | DONE — back pill; past unread; search cards; EmptyState |

## Backend pendiente para cerrar al 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| Banking delete | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Sin endpoint eliminar cuenta | `DELETE /bank-accounts/{id}` | BankAccounts | Implementar en DoEventsBack | Alta |
| PayPal payout | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | PayPal requiere integración | PSP webhook/payout | BankAccounts | Integrar proveedor | Alta |
| Story viewers | `src/components/feed/StoryViewersSheet.tsx` | `packages/shell/src/lovable/components/feed/StoryViewersSheet.tsx` | Sin lista viewers | `GET /stories/{id}/viewers` | StoryViews | Batch 2 BACKEND_REQUIRED | Media |
| KYC submit | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Sin envío documentos | `POST /users/{id}/kyc` | Users | Integrar proveedor | Alta |
| GlobalSearch posts | `src/components/feed/GlobalSearchView.tsx` | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | Sin búsqueda posts | `GET /publications/search?q=` | Publications | Endpoint dedicado | Media |

## Gaps restantes

97 ítems pendientes en manifiesto (batches 2–6): reservas, chat, admin, auth, venues, stats, banking, etc.

## Validación

- `npm run build:devaws`: **SUCCESS**
- Anti-mock `pages/`: sin coincidencias runtime
- `mocksUsed`: false
- Rama: `feature/cicd/dev-automation`
