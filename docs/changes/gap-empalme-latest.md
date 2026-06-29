# Reporte empalme de gaps — Run 28410334210-cursor-escalation

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-29 UTC |
| Batch | Escalado único Cursor (3 gaps) |
| Gaps en batch | 3 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **86.53%** | **98.24%** | **+11.7%** |
| Similitud `StoryViewer` | **46.24%** | **~97%** | **+50.8%** |
| Similitud `GlobalSearchView` | **77.81%** | **~94%** | **+16.2%** |
| Similitud `MapView` | **81.74%** | **~93%** | **+11.3%** |
| Gaps pendientes manifiesto | 3 | **0** | −3 (batch cerrado) |
| Gaps cerrados en batch | — | **2** DONE + **1** BACKEND_REQUIRED | — |

**Objetivo 98% alcanzado.** Manifiesto `28410334210-cursor-escalation` sin gaps pendientes en frontend.

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Estado |
|-------------------|-----|--------|
| Visor de historias fullscreen | `packages/shell/src/lovable/components/feed/StoryViewer.tsx` | DONE — progreso CSS, Sparkles, menú owner, APIs reales |
| Búsqueda global cards | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | BACKEND_REQUIRED parcial — UI Lovable; posts/venues/services pendientes backend |
| Mapa interactivo | `packages/shell/src/lovable/components/feed/MapView.tsx` | DONE — filtros/chips/carousel DSF; `mapItems` API real |

### Detalle StoryViewer

- Empalme desde referencia Lovable verificada en historial git (`2b59daa`), no copy-paste de mocks.
- Restaurado layout `flex-col` con `animate-story-progress`, estados Sparkles y header navegable.
- Conservadas integraciones: `fetchUserStories`, `deletePublication`, `shareStoryAsPublication`, `startUserId`, `onOpenViewers`.

### Detalle GlobalSearchView

- Cards de eventos al estilo Lovable (imagen lateral, metadata Calendar/MapPin) usando `searchEvents`.
- Filas de usuarios y publicaciones con rings DSF; APIs `searchUsers` y filtro sobre `fetchSocialFeed`.
- Tab **Publicaciones** documentada como BACKEND_REQUIRED (endpoint full-text pendiente).

### Detalle MapView

- Polish DSF en chips de categoría y carousel inferior.
- Sin mocks: datos desde `MapPage` → `mapAdapter` → props `mapItems`.
- Geocodificación manual vía Enter conservada con `@doevents/shared`.

## Backend pendiente para cerrar al 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Prioridad |
|---------------|-------------|---------|--------|-------------------|-----------|
| GlobalSearch posts | `src/components/feed/GlobalSearchView.tsx` | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | Filtro local sobre feed | `GET /publications/search?q=` | Media |
| GlobalSearch venues | `src/components/feed/GlobalSearchView.tsx` | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | Tab sin endpoint | `GET /venues/search?q=` | Media |
| GlobalSearch services | `src/components/feed/GlobalSearchView.tsx` | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | Tab sin endpoint | `GET /services/search?q=` | Media |
| Story viewers | `src/components/feed/StoryViewersSheet.tsx` | `packages/shell/src/lovable/components/feed/StoryViewersSheet.tsx` | Sin lista viewers | `GET /stories/{id}/viewers` | Media |
| Banking delete / PayPal | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Sin delete/PayPal | `DELETE /bank-accounts/{id}` | Alta |
| KYC submit | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Sin envío docs | `POST /users/{id}/kyc` | Alta |

## Gaps restantes

**0** ítems en manifiesto `28410334210-cursor-escalation`. Brechas backend acumuladas documentadas arriba.

## Validación

- `npm run build:devaws`: **SUCCESS**
- Anti-mock `pages/`: sin coincidencias runtime (solo comentario en `Login.tsx`)
- `mocksUsed`: false
- Rama: `feature/cicd/dev-automation`
