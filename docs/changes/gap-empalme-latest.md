# Reporte empalme de gaps — Run 27904918660

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-21 12:52 UTC |
| Batch | 1 / 6 |
| Gaps en batch | 20 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **80.84%** | **85.6%** | **+4.76%** |
| Gaps pendientes totales | 117 | 97 | -20 |
| Gaps cerrados en frontend | — | **19** / 20 | — |
| BACKEND_REQUIRED | — | **1** (`BankingHub`) | — |

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Banner promocional | `feed/FeedBanner.tsx` | DONE |
| Seating map editor | `events/SeatingMapEditor.tsx` | DONE |
| AI assistant FAB | `ai/AIAssistantFAB.tsx` | DONE |
| Event preview | `events/EventPreviewModal.tsx` | DONE |
| Refund ticket flow | `tickets/RefundTicketFlow.tsx` | DONE |
| FAQ section | `venues/sections/FAQSection.tsx` | DONE |
| Host picker | `events/HostPickerModal.tsx` | DONE |
| Step access control | `events/StepAccessControl.tsx` | DONE |
| Service detail | `services/ServiceDetailView.tsx` | DONE |
| Events view | `feed/EventsView.tsx` | DONE |
| Step unified | `services/StepUnified.tsx` | DONE |
| Company context | `contexts/CompanyContext.tsx` | DONE |
| Add guest | `guests/AddGuestModal.tsx` | DONE |
| Banking hub | `banking/BankingHub.tsx` | BACKEND_REQUIRED |
| My posts | `feed/MyPostsView.tsx` | DONE |
| Seat location | `tickets/SeatLocationModal.tsx` | DONE |
| Main info section | `venues/sections/MainInfoSection.tsx` | DONE |
| My purchases | `purchases/MyPurchasesView.tsx` | DONE |
| My reserved services | `purchases/MyReservedServicesView.tsx` | DONE |
| Ticket detail | `tickets/TicketDetailView.tsx` | DONE |

Patrón DSF aplicado: `border-border/60`, `shadow-sm`, `font-extrabold`, icon wells `ring-primary/20`, loading/error cards con borde, retry `RefreshCw`.

## Backend pendiente para cerrar al 100%

| Gap / Feature | lovablePath | Motivo | Acción | Prioridad |
|---------------|-------------|--------|--------|-----------|
| Banking delete | `src/components/banking/BankingHub.tsx` | Sin endpoint eliminar cuenta | Implementar en DoEventsBack; UI documenta bloqueo | Alta |
| PaymentMethods delete | `src/components/banking/PaymentMethodsDashboard.tsx` | Mismo contrato delete | Reutilizar endpoint delete | Alta |
| KYC submit | `src/components/feed/KycCertificationView.tsx` | Sin envío documentos KYC | Integración proveedor; botón deshabilitado | Alta |
| EditProfile password/gustos | `src/components/feed/EditProfileView.tsx` | Cambio contraseña + intereses persistentes | Conectar flujos UI | Media |
| Booking add-ons | `src/components/services/BookingSheet.tsx` | Catálogo servicios adicionales | Exponer catálogo real | Media |
| PublishFlow banking | `src/components/events/PublishFlowModal.tsx` | Persistencia banco post-publicación | Implementar en DoEventsBack | Media |
| GlobalSearch posts | `src/components/feed/GlobalSearchView.tsx` | Sin búsqueda full-text publicaciones | Endpoint dedicado; UI filtra feed reciente | Media |
| PaymentGateway PSP | `src/components/services/PaymentGatewaySheet.tsx` | Cobro tarjeta/PSE real | PSP webhook + confirm order | Alta |
| Story viewers | `src/components/feed/StoryViewersSheet.tsx` | Sin lista visualizaciones | `GET /stories/{id}/viewers` | Media |
| BankingForm SWIFT/PayPal | `src/components/banking/BankingForm.tsx` | Persistencia cuentas + PayPal | Extender `POST /bank-accounts` | Alta |

## Gaps frontend aún pendientes

Quedan **97 gaps** en el manifiesto global. Próximo batch (2/6) incluye: `NotificationsContext`, `CreatePostSheet`, `StoryViewersSheet`, `ReportPostDialog`, `EventPublished`, `ProfileGallery`, `ContactImportModal`, `FeedHero`, entre otros.

## Validación

- `npm run build:devaws`: **SUCCESS**
- Anti-mock `packages/shell/src/pages`: sin coincidencias runtime
- Rama: `feature/cicd/dev-automation`
- Decisión: **APPLIED** (19 DONE + 1 BACKEND_REQUIRED)
