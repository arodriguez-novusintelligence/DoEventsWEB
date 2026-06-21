# Reporte empalme de gaps — Run 27905180836-b6

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-21 15:00 UTC |
| Batch | 1 / 6 (sexta pasada DSF — tipografía residual + cards) |
| Gaps en batch | 20 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **95.2%** | **96.8%** | **+1.6%** |
| Gaps pendientes totales | 117 | 97 | −20 (batch cerrado frontend) |
| Gaps cerrados en batch | — | **19** DONE + **1** BACKEND_REQUIRED | — |

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Seating map editor | `packages/shell/src/lovable/components/events/SeatingMapEditor.tsx` | DONE — delete modal font-extrabold; preview border-border/60; footer CTAs shadow-sm |
| Refund ticket flow | `packages/shell/src/lovable/components/tickets/RefundTicketFlow.tsx` | DONE — back nav extrabold; ticket cards border-border/60; cancel shadow-sm |
| Event preview | `packages/shell/src/lovable/components/events/EventPreviewModal.tsx` | DONE — agenda rows border-border/60; refund label extrabold |
| Step access control | `packages/shell/src/lovable/components/events/StepAccessControl.tsx` | DONE — verificado intacto batch previo |
| FAQ section | `packages/shell/src/lovable/components/venues/sections/FAQSection.tsx` | DONE — verificado intacto batch previo |
| Host picker | `packages/shell/src/lovable/components/events/HostPickerModal.tsx` | DONE — Agregar shadow-sm; tabs extrabold; close ring-primary/20 |
| Service detail | `packages/shell/src/lovable/components/services/ServiceDetailView.tsx` | DONE — back link font-extrabold |
| Events view | `packages/shell/src/lovable/components/feed/EventsView.tsx` | DONE — badges extrabold; Reservar/Crear evento shadow-sm |
| My posts | `packages/shell/src/lovable/components/feed/MyPostsView.tsx` | DONE — verificado intacto batch previo |
| Step unified | `packages/shell/src/lovable/components/services/StepUnified.tsx` | DONE — section cards border-border/60; chips extrabold; FAQ CTA shadow-sm |
| My reserved services | `packages/shell/src/lovable/components/purchases/MyReservedServicesView.tsx` | DONE — verificado intacto batch previo |
| Notifications context | `packages/shell/src/lovable/contexts/NotificationsContext.tsx` | DONE — API parity verificada |
| Add guest | `packages/shell/src/lovable/components/guests/AddGuestModal.tsx` | DONE — match banners border-border/60 extrabold; retry shadow-sm |
| Company context | `packages/shell/src/lovable/contexts/CompanyContext.tsx` | DONE — alias API verificados |
| Main info section | `packages/shell/src/lovable/components/venues/sections/MainInfoSection.tsx` | DONE — verificado intacto batch previo |
| Banking hub | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | BACKEND_REQUIRED — delete/PayPal; banner icon ring |
| Ticket detail | `packages/shell/src/lovable/components/tickets/TicketDetailView.tsx` | DONE — menu/boleta/overlay labels extrabold |
| Create post sheet | `packages/shell/src/lovable/components/feed/CreatePostSheet.tsx` | DONE — avatar/visibility/media font-extrabold |
| Report post | `packages/shell/src/lovable/components/feed/ReportPostDialog.tsx` | DONE — reason rows extrabold unselected |
| Event published | `packages/shell/src/pages/EventPublished.tsx` | DONE — Mis eventos CTA shadow-sm |

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
| GlobalSearch posts | `src/components/feed/GlobalSearchView.tsx` | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | Sin búsqueda publicaciones | GET /posts/search | Posts | Endpoint dedicado | Media |

## Build y validación

- `npm run build:devaws`: **SUCCESS**
- Anti-mock `packages/shell/src/pages`: sin coincidencias runtime
- Rama: `feature/cicd/dev-automation`

## Próximo paso

Quedan **97** gap(s) frontend. Continuar workflow `lovable-gap-empalme` con batch 2 (siguiente grupo de 20 en manifiesto).
