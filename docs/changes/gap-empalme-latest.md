# Gap empalme — resumen ejecutivo (batch 1)

**Run:** `27904436890` / `gap-empalme-27904436890`  
**Fecha:** 2026-06-21  
**Rama:** `feature/cicd/dev-automation`

## Resultado

Manifiesto batch 1 (20 gaps, similitud baseline **80.86%**). Tras empalme focalizado, similitud estimada **83.8%**. **19 gaps DONE** frontend; **1 BACKEND_REQUIRED** (`BankingHub` delete/PayPal). **97 gaps** restantes en manifiesto.

## Empalme batch 1

| Área | Componentes |
|------|-------------|
| **IA / Feed** | AIAssistantFAB, FeedBanner, EventsView, MyPostsView |
| **Eventos / Wizard** | SeatingMapEditor, EventPreviewModal, HostPickerModal, StepAccessControl |
| **Servicios** | ServiceDetailView, StepUnified |
| **Tickets / Compras** | RefundTicketFlow, SeatLocationModal, TicketDetailView, MyPurchasesView |
| **Invitados** | AddGuestModal, ContactImportModal |
| **Lugares** | FAQSection, MainInfoSection |
| **Integración** | CompanyContext (`useCompanyContext` alias) |
| **Banca** | BankingHub (BACKEND_REQUIRED banner intacto) |

Patrón aplicado: `ring-2 ring-primary/20`, `border-border/60`, `shadow-sm`, títulos `font-extrabold`, loading cards con borde, retry `RefreshCw`. APIs `@doevents/shared` intactas; sin mocks en runtime de `pages/`.

## Backend pendiente (acumulado)

| Gap | Motivo |
|-----|--------|
| **BankingHub** | Delete cuenta + PayPal payout — endpoints pendientes |
| **PaymentMethodsDashboard** | Delete método — `DELETE /bank-accounts/{id}` |
| **PaymentGatewaySheet** | PSP tarjeta/PSE — `POST /payments/confirm` |
| **EditProfileView** | Password/gustos — Cognito + `PATCH /users/{id}` |
| **BookingSheet** | Catálogo add-ons — `GET /services/{id}/addons` |
| **BankingForm** | Persistencia SWIFT/PayPal |
| **KycCertificationView** | Envío documentos KYC |
| **PublishFlowModal** | Persistencia banco post-publicación |
| **GlobalSearchView posts** | Búsqueda full-text publicaciones |
| **StoryViewersSheet** | Lista visualizaciones |

Ver tabla completa en `ReglasAgente/impacto-backend.md`.

## Gaps restantes

**97** en manifiesto (batches 2–6 pendientes). Obetivo similitud ≥98% requiere continuar empalme.

## Validación

- `npm run build:devaws`: **OK**
- Anti-mock en `packages/shell/src/pages`: **sin coincidencias runtime**
- `mocksUsed`: **false**
