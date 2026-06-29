# Reporte empalme de gaps — Run 28392876508-cursor-escalation

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-29 18:30 UTC |
| Batch | Escalado único Cursor (1 gap) |
| Gaps en batch | 1 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud `FeedHero` | **73.89%** | **98.85%** | **+24.96%** |
| Gaps pendientes manifiesto | 1 | **0** | −1 (batch cerrado frontend) |
| Gaps cerrados en batch | — | **1** DONE | — |

**Objetivo 98% alcanzado.** Manifiesto `28392876508-cursor-escalation` sin gaps pendientes.

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Feed hero | `packages/shell/src/lovable/components/feed/FeedHero.tsx` | DONE — categorías overlapping, chips DSF, historias API, tokens semánticos |

### Detalle FeedHero

- Restaurada sección **Categorías** con card overlapping (`-mt-12`, `pb-16` en hero).
- Props `selectedCategories`, `onSelectCategory`, `onViewAllCategories` alineados con `SocialWallTab`.
- MapPin h-10 con anillo; botón Cambiar con `shadow-sm` y `font-extrabold`.
- Historias desde API real (`feedStories`); estados loading/empty con anillos DSF.
- Gradientes de story ring semánticos (`primary/accent/destructive`); badge LIVE con token `destructive`.
- Sin mocks en producción: `showBuiltInStories={false}`; assets dev solo bajo `import.meta.env.DEV`.

## Backend pendiente para cerrar al 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| Banking delete | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Sin endpoint eliminar cuenta | `DELETE /bank-accounts/{id}` | BankAccounts | Implementar en DoEventsBack | Alta |
| PayPal payout | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | PayPal requiere integración | PSP webhook/payout | BankAccounts | Integrar proveedor | Alta |
| Story viewers | `src/components/feed/StoryViewersSheet.tsx` | `packages/shell/src/lovable/components/feed/StoryViewersSheet.tsx` | Sin lista viewers | `GET /stories/{id}/viewers` | StoryViews | BACKEND_REQUIRED | Media |
| KYC submit | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Sin envío documentos | `POST /users/{id}/kyc` | Users | Integrar proveedor | Alta |
| GlobalSearch posts | `src/components/feed/GlobalSearchView.tsx` | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | Sin búsqueda posts | `GET /publications/search?q=` | Publications | Endpoint dedicado | Media |

## Gaps restantes

**0** ítems en manifiesto `28392876508-cursor-escalation`. Brechas backend acumuladas documentadas arriba (sin cambio en este run).

## Validación

- `npm run build:devaws`: **SUCCESS**
- Anti-mock `pages/`: sin coincidencias runtime
- `mocksUsed`: false
- Rama: `feature/cicd/dev-automation`
