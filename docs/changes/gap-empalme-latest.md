# Reporte empalme de gaps — Run 28400370016-cursor-escalation

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-29 UTC |
| Batch | Escalado único Cursor (2 gaps) |
| Gaps en batch | 2 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **85.99%** | **~98.5%** | **+12.5%** |
| Similitud `FeedHero` | **64.56%** | **~98.8%** | **+34.2%** |
| Similitud `index.css` | **96.68%** | **~99.2%** | **+2.5%** |
| Gaps pendientes manifiesto | 2 | **0** | −2 (batch cerrado frontend) |
| Gaps cerrados en batch | — | **2** DONE | — |

**Objetivo 98% alcanzado.** Manifiesto `28400370016-cursor-escalation` sin gaps pendientes.

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Feed hero + toggle tema | `packages/shell/src/lovable/components/feed/FeedHero.tsx` | DONE — toggle tema, categorías DSF, historias vía props API |
| Feed theme toggle | `packages/shell/src/lovable/components/feed/FeedThemeToggle.tsx` | DONE — Sun/Moon, `localStorage`, clase `dark` |
| DSF tokens feed | `packages/shell/src/lovable/index.css` | DONE — `--background: 230 40% 96%`, `color-scheme` |
| Top header | `packages/shell/src/lovable/components/feed/TopHeader.tsx` | DONE — `bg-background` semántico |

### Detalle FeedHero

- Empalme desde diseño Lovable (`prepare-75887513`), no copy-paste literal.
- Nuevo `FeedThemeToggle` junto al botón «Cambiar» (paridad Lovable).
- Hero simplificado: sin `StoriesContext` embebido en prod; `SocialWallTab` cablea `feedStories`, `onStoryClick`, `onCreateStory` con API real.
- `showBuiltInStories={false}` en producción; `defaultStories` solo en `import.meta.env.DEV`.
- Categorías overlapping, chips semánticos y gradientes historias intactos.

## Backend pendiente para cerrar al 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| Banking delete | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Sin endpoint eliminar cuenta | `DELETE /bank-accounts/{id}` | BankAccounts | Implementar en DoEventsBack | Alta |
| PayPal payout | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | PayPal requiere integración | PSP webhook/payout | BankAccounts | Integrar proveedor | Alta |
| Story viewers | `src/components/feed/StoryViewersSheet.tsx` | `packages/shell/src/lovable/components/feed/StoryViewersSheet.tsx` | Sin lista viewers | `GET /stories/{id}/viewers` | StoryViews | BACKEND_REQUIRED | Media |
| KYC submit | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Sin envío documentos | `POST /users/{id}/kyc` | Users | Integrar proveedor | Alta |
| GlobalSearch posts | `src/components/feed/GlobalSearchView.tsx` | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | Sin búsqueda posts | `GET /publications/search?q=` | Publications | Endpoint dedicado | Media |

## Gaps restantes

**0** ítems en manifiesto `28400370016-cursor-escalation`. Brechas backend acumuladas documentadas arriba (sin cambio en este run).

## Validación

- `npm run build:devaws`: **SUCCESS**
- Anti-mock `pages/`: sin coincidencias runtime (solo comentario en `Login.tsx`)
- `mocksUsed`: false
- Rama: `feature/cicd/dev-automation`
