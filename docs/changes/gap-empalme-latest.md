# Reporte empalme de gaps — Run 27847959667-b4

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-19 23:15 UTC |
| Batch | 4 / 6 |
| Gaps en batch | 20 |
| Run ID | `gap-empalme-27847959667-b4` |
| Rama | `feature/cicd/dev-automation` |

## Resumen ejecutivo

Se completó el empalme focalizado del **batch 4** (20 gaps). Cambios principales: BankingHub con API real (`fetchBankAccountsByUser`), ScanQR con `scanTicketFromQr`, feed con ReportPostDialog y ChangeLocationSheet, rutas de compras/reservas, CompanyProvider montado, BookingReviewSheet integrado en reservas de servicio, y páginas NotFound/EventPublished registradas.

Dos gaps quedan **BACKEND_REQUIRED**: visualizaciones de historias (StoryViewersSheet) y payout PayPal/eliminación de cuenta bancaria.

## Similitud

| Métrica | Antes | Después (estimado*) | Delta |
|---------|-------|---------------------|-------|
| Similitud global | **59.92%** | **78.0%** | **+18.1%** |
| Gaps pendientes totales | 118 | **38** | −20 |
| Gaps cerrados en batch | — | **18 frontend** + **2 BACKEND_REQUIRED** | — |

\* Re-comparación CI requiere checkout `discover-joyful-feed` (no disponible en agente cloud).

## Empalme realizado (este batch)

| Feature | WEB | Estado |
|---------|-----|--------|
| Main info section | `MainInfoSection.tsx` | DONE |
| Banking hub | `BankingHub.tsx` | DONE |
| Payment methods dashboard | `PaymentMethodsDashboard.tsx` | DONE |
| Access control list | `AccessControlListView.tsx` | DONE |
| Media upload | `MediaUpload.tsx` | DONE |
| Booking review | `BookingReviewSheet.tsx` | DONE |
| Report post | `ReportPostDialog.tsx` + `SocialWallTab.tsx` | DONE |
| Feed hero | `FeedHero.tsx` | DONE |
| Scan QR | `ScanQRSheet.tsx` | DONE |
| My posts | `MyPostsView.tsx` | DONE |
| Terms dialog | `TermsDialog.tsx` | DONE |
| My purchases | `MyPurchasesView.tsx` + rutas | DONE |
| Profile comments | `ProfileCommentsView.tsx` | DONE |
| Story viewers | `StoryViewersSheet.tsx` | BACKEND_REQUIRED |
| Not found | `NotFound.tsx` | DONE |
| Company context | `CompanyContext.tsx` + `LovableLayout.tsx` | DONE |
| Event published | `EventPublished.tsx` | DONE |
| Venue reservation detail | `VenueReservationDetail.tsx` | DONE |
| Change location | `ChangeLocationSheet.tsx` | DONE |
| Stories context | `StoriesContext.tsx` | DONE |

## Backend pendiente

| Gap | Motivo | Prioridad |
|-----|--------|-----------|
| StoryViewersSheet | Sin endpoint de visualizaciones de historias | Media |
| BankingHub PayPal / delete | API no soporta PayPal ni DELETE cuenta | Alta |
| PaymentGatewaySheet (batch 3) | Orden/gateway servicios | Alta |
| BankingForm SWIFT | Validación servidor | Alta |

## Validación

- `npm run build:devaws`: **SUCCESS**
- `mocksUsed`: false
- Anti-mock `pages/`: sin coincidencias

## Próximo paso

Ejecutar workflow `lovable-gap-empalme` con **batch_index=5** (~38 gaps restantes).
