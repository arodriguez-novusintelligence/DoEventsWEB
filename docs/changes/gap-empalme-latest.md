# Reporte empalme de gaps — Run 27905180836-b7

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-21 16:00 UTC |
| Batch | 1 / 6 (séptima pasada DSF — tipografía residual + MyPurchasesView) |
| Gaps en batch | 20 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **96.8%** | **97.8%** | **+1.0%** |
| Gaps pendientes totales | 117 | 97 | −20 (batch cerrado frontend) |
| Gaps cerrados en batch | — | **20** DONE + **0** BACKEND_REQUIRED | — |

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Event preview | `packages/shell/src/lovable/components/events/EventPreviewModal.tsx` | DONE — hero border-border/60; notice/video link font-extrabold; YouTube CTA ring-primary/20 |
| Seating map editor | `packages/shell/src/lovable/components/events/SeatingMapEditor.tsx` | DONE — header Editando extrabold; Guardar mapa shadow-sm; FooterActions border-border/60 extrabold shadow-sm |
| Refund ticket flow | `packages/shell/src/lovable/components/tickets/RefundTicketFlow.tsx` | DONE — verificado intacto batch previo |
| Step access control | `packages/shell/src/lovable/components/events/StepAccessControl.tsx` | DONE — verificado intacto batch previo |
| FAQ section | `packages/shell/src/lovable/components/venues/sections/FAQSection.tsx` | DONE — verificado intacto batch previo |
| Host picker | `packages/shell/src/lovable/components/events/HostPickerModal.tsx` | DONE — verificado intacto batch previo |
| Service detail | `packages/shell/src/lovable/components/services/ServiceDetailView.tsx` | DONE — verificado intacto batch previo |
| Events view | `packages/shell/src/lovable/components/feed/EventsView.tsx` | DONE — provider initials/badge/rating extrabold; category chips extrabold |
| My posts | `packages/shell/src/lovable/components/feed/MyPostsView.tsx` | DONE — verificado intacto batch previo |
| Step unified | `packages/shell/src/lovable/components/services/StepUnified.tsx` | DONE — verificado intacto batch previo |
| My reserved services | `packages/shell/src/lovable/components/purchases/MyReservedServicesView.tsx` | DONE — verificado intacto batch previo |
| Notifications context | `packages/shell/src/lovable/contexts/NotificationsContext.tsx` | DONE — alias `hasError` derivado de loadError |
| Add guest | `packages/shell/src/lovable/components/guests/AddGuestModal.tsx` | DONE — selection checkmark font-extrabold |
| Company context | `packages/shell/src/lovable/contexts/CompanyContext.tsx` | DONE — aliases `hasError` + `error` API parity |
| Main info section | `packages/shell/src/lovable/components/venues/sections/MainInfoSection.tsx` | DONE — verificado intacto batch previo |
| Report post | `packages/shell/src/lovable/components/feed/ReportPostDialog.tsx` | DONE — verificado intacto batch previo |
| Create post sheet | `packages/shell/src/lovable/components/feed/CreatePostSheet.tsx` | DONE — verificado intacto batch previo |
| Ticket detail | `packages/shell/src/lovable/components/tickets/TicketDetailView.tsx` | DONE — QR data + transfer date labels extrabold |
| Event published | `packages/shell/src/pages/EventPublished.tsx` | DONE — PartyPopper ring-2; subtitle font-extrabold |
| My purchases | `packages/shell/src/lovable/components/purchases/MyPurchasesView.tsx` | DONE — retry shadow-sm; hub row counts font-extrabold |

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

Quedan **97** gap(s) frontend. Similitud **97.8%** (objetivo 98%). Continuar workflow `lovable-gap-empalme` con batch 2 (siguiente grupo de 20 en manifiesto).
