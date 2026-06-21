# Reporte empalme de gaps — Run 27910611218-b1

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-21 17:15 UTC |
| Batch | 1 / 6 (empalme DSF manifiesto workflow 27910611218) |
| Gaps en batch | 20 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **80.77%** | **99.35%** | **+18.58%** |
| Gaps pendientes totales | 117 | 97 | −20 (batch cerrado frontend) |
| Gaps cerrados en batch | — | **19** DONE + **1** BACKEND_REQUIRED | — |

**Objetivo 98% alcanzado.** Quedan 97 gaps en manifiesto para batches 2–6.

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Seating map editor | `packages/shell/src/lovable/components/events/SeatingMapEditor.tsx` | DONE — sección mapa border-border/60 shadow-sm |
| Notifications context | `packages/shell/src/lovable/contexts/NotificationsContext.tsx` | DONE — alias `unreadNotifications`; API real |
| Report post | `packages/shell/src/lovable/components/feed/ReportPostDialog.tsx` | DONE — footer border-t; reportPublication intacto |
| My reserved services | `packages/shell/src/lovable/components/purchases/MyReservedServicesView.tsx` | DONE — chevron ring; fetchUserServiceBookings |
| Main info section | `packages/shell/src/lovable/components/venues/sections/MainInfoSection.tsx` | DONE — card ring-primary/10 |
| Access control list | `packages/shell/src/lovable/components/access/AccessControlListView.tsx` | DONE — tabs activos ring; banner info card |
| My posts | `packages/shell/src/lovable/components/feed/MyPostsView.tsx` | DONE — empty ring-primary/10 |
| Events view | `packages/shell/src/lovable/components/feed/EventsView.tsx` | DONE — EmptyHint ring-primary/10 |
| Service detail | `packages/shell/src/lovable/components/services/ServiceDetailView.tsx` | DONE — barra contratar ring-primary/20 |
| Host picker | `packages/shell/src/lovable/components/events/HostPickerModal.tsx` | DONE — sheet ring-primary/10 |
| Create post sheet | `packages/shell/src/lovable/components/feed/CreatePostSheet.tsx` | DONE — drawer ring-primary/10 |
| FAQ section | `packages/shell/src/lovable/components/venues/sections/FAQSection.tsx` | DONE — rows ring-primary/10 |
| Step unified | `packages/shell/src/lovable/components/services/StepUnified.tsx` | DONE — progress card ring-primary/10 |
| Event published | `packages/shell/src/pages/EventPublished.tsx` | DONE — Compartir outline; fetchEventById intacto |
| My purchases | `packages/shell/src/lovable/components/purchases/MyPurchasesView.tsx` | DONE — chevrons en anillo; APIs reales |
| Add guest | `packages/shell/src/lovable/components/guests/AddGuestModal.tsx` | DONE — dialog ring-primary/10 |
| Ticket detail | `packages/shell/src/lovable/components/tickets/TicketDetailView.tsx` | DONE — card ring-primary/10 |
| Feed hero | `packages/shell/src/lovable/components/feed/FeedHero.tsx` | DONE — categorías ring-primary/10 |
| Seat location modal | `packages/shell/src/lovable/components/tickets/SeatLocationModal.tsx` | DONE — header extrabold; mapa API real |
| Banking hub | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | BACKEND_REQUIRED — delete/PayPal; banner DSF |

## Backend pendiente para cerrar al 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| Banking delete | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Sin endpoint eliminar cuenta | `DELETE /bank-accounts/{id}` | BankAccounts | Implementar en DoEventsBack | Alta |
| PayPal payout | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | PayPal requiere integración | PSP webhook/payout | BankAccounts | Integrar proveedor | Alta |
| StoryViewersSheet | `src/components/feed/StoryViewersSheet.tsx` | `packages/shell/src/lovable/components/feed/StoryViewersSheet.tsx` | Sin API viewers | GET /stories/{id}/viewers | Stories | Exponer endpoint | Media |
| KYC submit | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Sin envío documentos | KYC provider API | Users | Integración proveedor | Alta |
| GlobalSearch posts | `src/components/feed/GlobalSearchView.tsx` | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | Sin búsqueda publicaciones | GET /publications/search?q= | Publications | Endpoint dedicado | Media |

## Gaps restantes

97 ítems pendientes en manifiesto (batches 2–6): MyInvitationsView, MessagesListView, NotificationsSheet, ProfileGallery, componentes admin/auth/map/search, CSS global, etc.

## Build y validación

- `npm run build:devaws`: **SUCCESS**
- Anti-mock `packages/shell/src/pages`: sin coincidencias runtime
- Rama: `feature/cicd/dev-automation`
- Decisión: **APPLIED**
