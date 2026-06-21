# Reporte empalme de gaps — Run 27905180836-b4

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-21 14:00 UTC |
| Batch | 1 / 6 (cuarta pasada DSF — tickets/venues/wizard) |
| Gaps en batch | 20 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **91.8%** | **93.5%** | **+1.7%** |
| Gaps pendientes totales | 117 | 97 | −20 (batch cerrado frontend) |
| Gaps cerrados en batch | — | **19** DONE + **1** BACKEND_REQUIRED | — |

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Seating map editor | `packages/shell/src/lovable/components/events/SeatingMapEditor.tsx` | DONE — toolbar border-border/60 shadow-sm |
| Event preview | `packages/shell/src/lovable/components/events/EventPreviewModal.tsx` | DONE — toggles font-extrabold; refund CTA rounded-full |
| Step access control | `packages/shell/src/lovable/components/events/StepAccessControl.tsx` | DONE — headings extrabold; assign CTA shadow-sm |
| Refund ticket flow | `packages/shell/src/lovable/components/tickets/RefundTicketFlow.tsx` | DONE — summary extrabold; CTAs shadow-sm |
| FAQ section | `packages/shell/src/lovable/components/venues/sections/FAQSection.tsx` | DONE — CTAs rounded-full shadow-sm |
| Host picker | `packages/shell/src/lovable/components/events/HostPickerModal.tsx` | DONE — loading h-14 ring; tabs extrabold |
| Service detail | `packages/shell/src/lovable/components/services/ServiceDetailView.tsx` | DONE — chip/price font-extrabold |
| Events view | `packages/shell/src/lovable/components/feed/EventsView.tsx` | DONE — dates/Ver más font-extrabold |
| Step unified | `packages/shell/src/lovable/components/services/StepUnified.tsx` | DONE — CTAs extrabold shadow-sm |
| My posts | `packages/shell/src/lovable/components/feed/MyPostsView.tsx` | DONE — retry shadow-sm |
| My reserved services | `packages/shell/src/lovable/components/purchases/MyReservedServicesView.tsx` | DONE — status/price extrabold |
| Notifications context | `packages/shell/src/lovable/contexts/NotificationsContext.tsx` | DONE — API parity verificada |
| Add guest | `packages/shell/src/lovable/components/guests/AddGuestModal.tsx` | DONE — CTAs rounded-full shadow-sm |
| Company context | `packages/shell/src/lovable/contexts/CompanyContext.tsx` | DONE — API parity verificada |
| Main info section | `packages/shell/src/lovable/components/venues/sections/MainInfoSection.tsx` | DONE — labels font-extrabold |
| Banking hub | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | BACKEND_REQUIRED — delete/PayPal |
| Ticket detail | `packages/shell/src/lovable/components/tickets/TicketDetailView.tsx` | DONE — chips border-border/60 extrabold |
| Create post sheet | `packages/shell/src/lovable/components/feed/CreatePostSheet.tsx` | DONE — publish CTA extrabold shadow-sm |
| Report post | `packages/shell/src/lovable/components/feed/ReportPostDialog.tsx` | DONE — footer pills shadow-sm |
| Seat location | `packages/shell/src/lovable/components/tickets/SeatLocationModal.tsx` | DONE — dialog shell + badges extrabold |

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
