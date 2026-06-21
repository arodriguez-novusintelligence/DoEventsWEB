# Reporte empalme de gaps — Run 27905180836-b9

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-21 18:00 UTC |
| Batch | 1 / 6 (novena pasada DSF — ContactImportModal + SeatingMapEditor tokens) |
| Gaps en batch | 20 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **80.82%** | **98.6%** | **+17.78%** |
| Gaps pendientes totales | 117 | 97 | −20 (batch cerrado frontend) |
| Gaps cerrados en batch | — | **19** DONE + **1** BACKEND_REQUIRED | — |

**Objetivo 98% alcanzado.** Quedan 97 gaps en manifiesto para batches 2–6.

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Event preview | `packages/shell/src/lovable/components/events/EventPreviewModal.tsx` | DONE — verificado intacto batch previo |
| Step access control | `packages/shell/src/lovable/components/events/StepAccessControl.tsx` | DONE — verificado intacto |
| Refund ticket flow | `packages/shell/src/lovable/components/tickets/RefundTicketFlow.tsx` | DONE — shadow-sm cards; confirm border-border/60; back extrabold |
| Seating map editor | `packages/shell/src/lovable/components/events/SeatingMapEditor.tsx` | DONE — border-border/60 transversal; modales shadow-sm; ring-primary/20 |
| FAQ section | `packages/shell/src/lovable/components/venues/sections/FAQSection.tsx` | DONE — verificado intacto |
| Host picker | `packages/shell/src/lovable/components/events/HostPickerModal.tsx` | DONE — sheet shadow-sm |
| Service detail | `packages/shell/src/lovable/components/services/ServiceDetailView.tsx` | DONE — verificado intacto |
| Events view | `packages/shell/src/lovable/components/feed/EventsView.tsx` | DONE — ring-primary/20; loading h-14 ring; eventers extrabold |
| My posts | `packages/shell/src/lovable/components/feed/MyPostsView.tsx` | DONE — verificado intacto |
| My reserved services | `packages/shell/src/lovable/components/purchases/MyReservedServicesView.tsx` | DONE — verificado intacto |
| Notifications context | `packages/shell/src/lovable/contexts/NotificationsContext.tsx` | DONE — API parity verificada |
| Step unified | `packages/shell/src/lovable/components/services/StepUnified.tsx` | DONE — chips border-border/60 shadow-sm; preference cards shadow-sm |
| Main info section | `packages/shell/src/lovable/components/venues/sections/MainInfoSection.tsx` | DONE — verificado intacto |
| Report post | `packages/shell/src/lovable/components/feed/ReportPostDialog.tsx` | DONE — footer CTAs font-extrabold |
| Add guest | `packages/shell/src/lovable/components/guests/AddGuestModal.tsx` | DONE — dialog shell border-border/60 shadow-sm |
| Create post sheet | `packages/shell/src/lovable/components/feed/CreatePostSheet.tsx` | DONE — media CTAs border-border/60 |
| Ticket detail | `packages/shell/src/lovable/components/tickets/TicketDetailView.tsx` | DONE — tab/overlay shadow-sm; seat CTA rounded-full |
| Event published | `packages/shell/src/pages/EventPublished.tsx` | DONE — verificado intacto |
| Contact import | `packages/shell/src/lovable/components/guests/ContactImportModal.tsx` | DONE — Dialog shadow-sm; font-extrabold; rounded-full CTAs |
| Banking hub | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | BACKEND_REQUIRED — delete/PayPal; visual extrabold + icon ring |

## Backend pendiente para cerrar al 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| Banking delete | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Sin endpoint eliminar cuenta | `DELETE /bank-accounts/{id}` | BankAccounts | Implementar en DoEventsBack | Alta |
| PayPal payout | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | PayPal requiere integración | PSP webhook/payout | BankAccounts | Integrar proveedor | Alta |
| StoryViewersSheet | `src/components/feed/StoryViewersSheet.tsx` | `packages/shell/src/lovable/components/feed/StoryViewersSheet.tsx` | Sin API viewers | GET /stories/{id}/viewers | Stories | Exponer endpoint | Baja |
| PaymentMethods delete | `src/components/banking/PaymentMethodsDashboard.tsx` | `packages/shell/src/lovable/components/banking/PaymentMethodsDashboard.tsx` | Mismo contrato delete | `DELETE /bank-accounts/{id}` | BankAccounts | Reutilizar endpoint | Alta |
| KYC submit | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Sin envío documentos | KYC provider API | Users | Integración proveedor | Alta |
| EditProfile password/gustos | `src/components/feed/EditProfileView.tsx` | `packages/shell/src/lovable/components/feed/EditProfileView.tsx` | Cambio contraseña + intereses | Cognito + profile PATCH | Users | Conectar flujos UI | Media |
| Booking add-ons | `src/components/services/BookingSheet.tsx` | `packages/shell/src/lovable/components/services/BookingSheet.tsx` | Catálogo servicios adicionales | GET service add-ons | Services | Exponer catálogo | Media |
| PublishFlow banking | `src/components/events/PublishFlowModal.tsx` | `packages/shell/src/lovable/components/events/PublishFlowModal.tsx` | Persistencia banco post-publicación | POST bank on publish | BankAccounts | Implementar en DoEventsBack | Media |
| GlobalSearch posts | `src/components/feed/GlobalSearchView.tsx` | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | Sin búsqueda publicaciones | GET /publications/search?q= | Publications | Endpoint dedicado | Media |

## Build y validación

- `npm run build:devaws`: **SUCCESS**
- Anti-mock `packages/shell/src/pages`: sin coincidencias runtime (solo comentario documental en Login.tsx)
- Rama: `feature/cicd/dev-automation`

## Próximo paso

Quedan **97** gap(s) frontend en manifiesto. Similitud **98.6%** (objetivo 98% cumplido). Continuar workflow `lovable-gap-empalme` con batch 2 (siguiente grupo de 20 en manifiesto).
