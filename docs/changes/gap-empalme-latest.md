# Reporte empalme de gaps — Run 28395199438-cursor-escalation

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-29 UTC |
| Batch | Escalado único Cursor (1 gap) |
| Gaps en batch | 1 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud `SeatingMapEditor` | **91.33%** | **98.62%** | **+7.29%** |
| Gaps pendientes manifiesto | 1 | **0** | −1 (batch cerrado frontend) |
| Gaps cerrados en batch | — | **1** DONE | — |

**Objetivo 98% alcanzado.** Manifiesto `28395199438-cursor-escalation` sin gaps pendientes.

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Seating map editor | `packages/shell/src/lovable/components/events/SeatingMapEditor.tsx` | DONE — geometría SVG arco, header/toolbar Lovable, SeatsGrid API |
| Preview bridge | `packages/shell/src/lovable/components/events/StepEventLocation.tsx` | DONE — adaptador seatStates → selectedLabels/takenLabels |

### Detalle SeatingMapEditor

- Empalme estructural desde diseño Lovable (`prepare-1da1010a`, commit `98ba5ee`), no copy-paste literal.
- Geometría horseshoe/semicircle con `ArcFigureShape` SVG y bandas de asientos (`seatOuterR`/`seatInnerR`).
- Header con botones `rounded-full border-border`; título `Piso {currentFloor}` (integración multi-piso WEB).
- Canvas vacío alineado con copy Lovable; modales legend/text con `shadow-2xl`.
- `SeatsGrid` expone API Lovable (`selectedLabels`, `takenLabels`, `onSeatToggle`).
- `StepEventLocation` adapta `SeatVisualState` del bridge sin mocks; `LovableVenueMap` sin cambio de contrato.

## Backend pendiente para cerrar al 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| Banking delete | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Sin endpoint eliminar cuenta | `DELETE /bank-accounts/{id}` | BankAccounts | Implementar en DoEventsBack | Alta |
| PayPal payout | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | PayPal requiere integración | PSP webhook/payout | BankAccounts | Integrar proveedor | Alta |
| Story viewers | `src/components/feed/StoryViewersSheet.tsx` | `packages/shell/src/lovable/components/feed/StoryViewersSheet.tsx` | Sin lista viewers | `GET /stories/{id}/viewers` | StoryViews | BACKEND_REQUIRED | Media |
| KYC submit | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Sin envío documentos | `POST /users/{id}/kyc` | Users | Integrar proveedor | Alta |
| GlobalSearch posts | `src/components/feed/GlobalSearchView.tsx` | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | Sin búsqueda posts | `GET /publications/search?q=` | Publications | Endpoint dedicado | Media |

## Gaps restantes

**0** ítems en manifiesto `28395199438-cursor-escalation`. Brechas backend acumuladas documentadas arriba (sin cambio en este run).

## Validación

- `npm run build:devaws`: **SUCCESS**
- Anti-mock `pages/`: sin coincidencias runtime
- `mocksUsed`: false
- Rama: `feature/cicd/dev-automation`
