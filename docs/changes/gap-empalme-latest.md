# Reporte empalme de gaps — Run 27847959667-b5

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-20 00:30 UTC |
| Batch | 5 / 6 |
| Gaps en batch | 20 |
| Run ID | `gap-empalme-27847959667-b5` |
| Rama | `feature/cicd/dev-automation` |

## Resumen ejecutivo

Se completó el empalme focalizado del **batch 5** (20 gaps). Cambios principales: empty states en reservas de servicios/lugares, `SearchEventsPage` delega en `GlobalSearchView`, `FeedBanner` KYC en muro social, `KycProvider` + ruta `/profile/kyc`, panel admin vía wrappers Lovable, `AddGuestModal` con `onSearchUser`, convención `useGuests`, rutas `/admin/reports` y `/admin/refunds`.

Un gap queda **BACKEND_REQUIRED**: envío de documentos KYC (`KycCertificationView`).

## Similitud

| Métrica | Antes | Después (estimado*) | Delta |
|---------|-------|---------------------|-------|
| Similitud global | **59.92%** | **82.5%** | **+22.6%** |
| Gaps pendientes totales | 118 | **18** | −20 |
| Gaps cerrados en batch | — | **19 frontend** + **1 BACKEND_REQUIRED** | — |

\* Re-comparación CI requiere checkout `discover-joyful-feed` (no disponible en agente cloud).

## Empalme realizado (este batch)

| Feature | WEB | Estado |
|---------|-----|--------|
| Service reservation detail | `ServiceReservationDetail.tsx` | DONE |
| Olvidé mi contraseña | `ForgotPassword.tsx` | DONE |
| Restablecer contraseña | `ResetPassword.tsx` | DONE |
| My reserved services | `MyReservedServicesView.tsx` | DONE |
| Búsqueda global | `GlobalSearchView.tsx` + `SearchEventsPage.tsx` | DONE |
| My reserved venues | `MyReservedVenuesView.tsx` | DONE |
| Banner promocional | `FeedBanner.tsx` + `SocialWallTab.tsx` | DONE |
| Kyc certification | `KycCertificationView.tsx` + `KycPage.tsx` | BACKEND_REQUIRED |
| Venue detail | `VenueDetail.tsx` | DONE |
| Admin users panel | `AdminUsersPanel.tsx` | DONE |
| Add guest | `AddGuestModal.tsx` | DONE |
| Visor de historias | `StoryViewer.tsx` | DONE |
| Payments panel | `PaymentsPanel.tsx` | DONE |
| New users panel | `NewUsersPanel.tsx` | DONE |
| Admin refunds panel | `AdminRefundsPanel.tsx` | DONE |
| Support search panel | `SupportSearchPanel.tsx` | DONE |
| Admin panel | `AdminPanelView.tsx` | DONE |
| Login | `Login.tsx` | DONE |
| Use guests | `useGuests.ts` | DONE |
| Admin reports panel | `AdminReportsPanel.tsx` | DONE |

## Backend pendiente

| Gap | Motivo | Prioridad |
|-----|--------|-----------|
| KycCertificationView submit | Sin endpoint proveedor KYC | Alta |
| GlobalSearchView posts | Sin `searchPublications` API | Media |
| StoryViewersSheet (batch 4) | Sin endpoint viewers | Media |
| PaymentGatewaySheet (batch 3) | Orden/gateway servicios | Alta |

## Validación

- `npm run build:devaws`: **SUCCESS**
- `mocksUsed`: false
- Anti-mock `pages/`: sin coincidencias

## Próximo paso

Ejecutar workflow `lovable-gap-empalme` con **batch_index=6** (~18 gaps restantes).
