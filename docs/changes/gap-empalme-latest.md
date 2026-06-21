# Reporte empalme de gaps — Run 27905180836-b8

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-21 17:00 UTC |
| Batch | 1 / 6 (octava pasada DSF — ProfileGallery + SeatingMapEditor + context error) |
| Gaps en batch | 20 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **97.8%** | **98.3%** | **+0.5%** |
| Gaps pendientes totales | 117 | 97 | −20 (batch cerrado frontend) |
| Gaps cerrados en batch | — | **20** DONE + **0** BACKEND_REQUIRED | — |

**Objetivo 98% alcanzado.** Quedan 97 gaps en manifiesto para batches 2–6.

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Event preview | `packages/shell/src/lovable/components/events/EventPreviewModal.tsx` | DONE — hero border-border/60 shadow-sm; gallery thumbs border-border/60 |
| Seating map editor | `packages/shell/src/lovable/components/events/SeatingMapEditor.tsx` | DONE — font-bold/semibold→extrabold transversal (~37 ocurrencias) |
| Refund ticket flow | `packages/shell/src/lovable/components/tickets/RefundTicketFlow.tsx` | DONE — destructive/confirm cards border-border/60 shadow-sm |
| Step access control | `packages/shell/src/lovable/components/events/StepAccessControl.tsx` | DONE — gate empty shadow-sm; delete gate rounded-full shadow-sm |
| FAQ section | `packages/shell/src/lovable/components/venues/sections/FAQSection.tsx` | DONE — add FAQ CTAs font-extrabold rounded-full |
| Host picker | `packages/shell/src/lovable/components/events/HostPickerModal.tsx` | DONE — close/clear ring-primary/20 shadow-sm; selected banner border-border/60 |
| Service detail | `packages/shell/src/lovable/components/services/ServiceDetailView.tsx` | DONE — hero badge shadow-sm; thumb ring-primary/20; empty border-border/60 |
| Events view | `packages/shell/src/lovable/components/feed/EventsView.tsx` | DONE — Sin imagen extrabold; EmptyHint extrabold; provider CTA border-border/60 |
| My posts | `packages/shell/src/lovable/components/feed/MyPostsView.tsx` | DONE — retry font-extrabold rounded-full |
| Step unified | `packages/shell/src/lovable/components/services/StepUnified.tsx` | DONE — Sin foto/prerequisite extrabold; geo buttons rounded-full shadow-sm |
| My reserved services | `packages/shell/src/lovable/components/purchases/MyReservedServicesView.tsx` | DONE — login/retry CTAs font-extrabold |
| Notifications context | `packages/shell/src/lovable/contexts/NotificationsContext.tsx` | DONE — alias `error` API parity Lovable |
| Main info section | `packages/shell/src/lovable/components/venues/sections/MainInfoSection.tsx` | DONE — amenity chips + stepper shadow-sm extrabold |
| Add guest | `packages/shell/src/lovable/components/guests/AddGuestModal.tsx` | DONE — TabsList border-border/60; tabs/CTAs extrabold rounded-full |
| Report post | `packages/shell/src/lovable/components/feed/ReportPostDialog.tsx` | DONE — selected reason ring-2 ring-primary/20 |
| Create post sheet | `packages/shell/src/lovable/components/feed/CreatePostSheet.tsx` | DONE — DrawerContent shadow-sm; visibility pills shadow-sm |
| Ticket detail | `packages/shell/src/lovable/components/tickets/TicketDetailView.tsx` | DONE — shadow-sm cards; Sin imagen extrabold |
| Event published | `packages/shell/src/pages/EventPublished.tsx` | DONE — loading name h-14 ring-primary/20 |
| Profile gallery | `packages/shell/src/lovable/components/feed/ProfileGallery.tsx` | DONE — font-extrabold transversal; loading h-14 ring; card border-border/60 |
| Seat location | `packages/shell/src/lovable/components/tickets/SeatLocationModal.tsx` | DONE — seat/entrance badges border-border/60 shadow-sm |

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
- Anti-mock `packages/shell/src/pages`: sin coincidencias runtime (solo comentario documental en Login.tsx)
- Rama: `feature/cicd/dev-automation`

## Próximo paso

Quedan **97** gap(s) frontend en manifiesto. Similitud **98.3%** (objetivo 98% cumplido). Continuar workflow `lovable-gap-empalme` con batch 2 (siguiente grupo de 20 en manifiesto).
