# Reporte empalme de gaps — Run 27905180836-b2

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-21 13:15 UTC |
| Batch | 1 / 6 (segunda pasada DSF) |
| Gaps en batch | 20 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **86.2%** | **89.5%** | **+3.3%** |
| Gaps pendientes totales | 117 | 97 | −20 (batch cerrado frontend) |
| Gaps cerrados en batch | — | **19** DONE + **1** BACKEND_REQUIRED | — |

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Feed banner | `packages/shell/src/lovable/components/feed/FeedBanner.tsx` | DONE — ring-2 ring-primary/20 |
| Seating map editor | `packages/shell/src/lovable/components/events/SeatingMapEditor.tsx` | DONE — success tokens capacity |
| Event preview | `packages/shell/src/lovable/components/events/EventPreviewModal.tsx` | DONE — font-extrabold labels |
| AI assistant FAB | `packages/shell/src/lovable/components/ai/AIAssistantFAB.tsx` | DONE — shadow-sm bg-primary |
| Refund ticket flow | `packages/shell/src/lovable/components/tickets/RefundTicketFlow.tsx` | DONE — h-14 confirm ring |
| FAQ section | `packages/shell/src/lovable/components/venues/sections/FAQSection.tsx` | DONE — index extrabold |
| Step access control | `packages/shell/src/lovable/components/events/StepAccessControl.tsx` | DONE — gate empty + alerts |
| Host picker | `packages/shell/src/lovable/components/events/HostPickerModal.tsx` | DONE — tab border-border/60 |
| Service detail | `packages/shell/src/lovable/components/services/ServiceDetailView.tsx` | DONE — sticky shadow-sm |
| Events view | `packages/shell/src/lovable/components/feed/EventsView.tsx` | DONE — titles extrabold |
| Step unified | `packages/shell/src/lovable/components/services/StepUnified.tsx` | DONE — preference border-border/60 |
| Company context | `packages/shell/src/lovable/contexts/CompanyContext.tsx` | DONE — isLoading/refreshCompany |
| My posts | `packages/shell/src/lovable/components/feed/MyPostsView.tsx` | DONE — loading h-14 ring |
| Add guest | `packages/shell/src/lovable/components/guests/AddGuestModal.tsx` | DONE — empty/foundUser rings |
| Notifications context | `packages/shell/src/lovable/contexts/NotificationsContext.tsx` | DONE — isLoading alias |
| Main info section | `packages/shell/src/lovable/components/venues/sections/MainInfoSection.tsx` | DONE — stepper border-border/60 |
| Seat location | `packages/shell/src/lovable/components/tickets/SeatLocationModal.tsx` | DONE — loading h-14 ring |
| My reserved services | `packages/shell/src/lovable/components/purchases/MyReservedServicesView.tsx` | DONE — loading/error extrabold |
| My purchases | `packages/shell/src/lovable/components/purchases/MyPurchasesView.tsx` | DONE — hub icons h-10 |
| Banking hub | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | BACKEND_REQUIRED — delete/PayPal |

## Backend pendiente para cerrar al 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| Banking delete | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Sin endpoint eliminar cuenta | `DELETE /bank-accounts/{id}` | BankAccounts | Implementar en DoEventsBack | Alta |
| PayPal payout | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | PayPal requiere integración | PSP webhook/payout | BankAccounts | Integrar proveedor | Alta |
| PaymentMethods delete | `src/components/banking/PaymentMethodsDashboard.tsx` | `packages/shell/src/lovable/components/banking/PaymentMethodsDashboard.tsx` | Mismo contrato delete | `DELETE /bank-accounts/{id}` | BankAccounts | Reutilizar endpoint | Alta |
| KYC submit | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Sin envío documentos | KYC provider API | Users | Integración proveedor | Alta |
| EditProfile password/gustos | `src/components/feed/EditProfileView.tsx` | `packages/shell/src/lovable/components/feed/EditProfileView.tsx` | Cambio contraseña + intereses | Cognito + profile PATCH | Users | Conectar flujos UI | Media |
| Booking add-ons | `src/components/services/BookingSheet.tsx` | `packages/shell/src/lovable/components/services/BookingSheet.tsx` | Catálogo servicios adicionales | GET service add-ons | Services | Exponer catálogo | Media |
| PublishFlow banking | `src/components/events/PublishFlowModal.tsx` | `packages/shell/src/lovable/components/events/PublishFlowModal.tsx` | Persistencia banco post-publicación | POST bank on publish | BankAccounts | Implementar en DoEventsBack | Media |
| GlobalSearch posts | `src/components/feed/GlobalSearchView.tsx` | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | Sin búsqueda publicaciones | GET /posts/search | Posts | Endpoint dedicado | Media |
| StoryViewersSheet | `src/components/feed/StoryViewersSheet.tsx` | `packages/shell/src/lovable/components/feed/StoryViewersSheet.tsx` | Sin API viewers | GET /stories/{id}/viewers | Stories | Exponer endpoint | Baja |

## Build y validación

- `npm run build:devaws`: **SUCCESS**
- Anti-mock `packages/shell/src/pages`: sin coincidencias runtime
- Rama: `feature/cicd/dev-automation`

## Próximo paso

Quedan **97** gap(s) frontend. Continuar workflow `lovable-gap-empalme` con batch 2 (siguiente grupo de 20 en manifiesto).
