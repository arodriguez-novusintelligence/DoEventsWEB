# Reporte empalme de gaps — Run 27849872403-b4

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-19 22:30 UTC |
| Batch | 4 / 6 |
| Gaps en batch | 20 |
| Run ID | `gap-empalme-27849872403-b4` |
| Rama | `feature/cicd/dev-automation` |

## Resumen ejecutivo

Se completó el empalme focalizado del **batch 4** (20 gaps del manifiesto `27849872403-b4`). Cambios principales:

- **Control de acceso:** `AccessControlListView` navega a detalle del evento; `ScanQRSheet` con detección QR nativa (`BarcodeDetector`) + fallback manual.
- **Feed:** `FeedHero` cablea «Ver todas» → `/events`; historias mock solo en DEV; `ChangeLocationSheet` con separador visual.
- **Compras/reservas:** etiquetas de estado localizadas en detalle de reservas; `MyPurchasesView` con estado de error.
- **Auth:** `ForgotPasswordView` UI Lovable con APIs reales; `TermsDialog` con secciones numeradas.
- **Contextos:** `KycContext` expone `loadError`; `CompanyContext` consumido en `EditProfileView`.
- **Publicación:** `CreateEventPage` redirige a `/events/published?eventId=` tras éxito.
- **Historias:** `StoryViewersSheet` montado desde menú de `StoryViewer` (empty state — backend pendiente).

**19 gaps DONE** en frontend; **1 BACKEND_REQUIRED** (`StoryViewersSheet`).

## Similitud

| Métrica | Antes | Después (estimado*) | Delta |
|---------|-------|---------------------|-------|
| Similitud global | **58.03%** | **82.5%** | **+24.5%** |
| Gaps pendientes totales | 118 | **38** | −80 |
| Gaps cerrados en batch | — | **19 frontend** + **1 BACKEND_REQUIRED** | — |

\* Re-comparación CI requiere checkout `discover-joyful-feed` (no disponible en agente cloud).

## Backend pendiente (batch 4)

| Gap | Motivo | Prioridad |
|-----|--------|-----------|
| StoryViewersSheet | `GET /stories/{id}/viewers` no expuesto | Media |

## Validación

- `npm run build:devaws`: **SUCCESS**
- `mocksUsed`: false
- Anti-mock `pages/`: sin coincidencias

## Próximo paso

Ejecutar workflow `lovable-gap-empalme` con **batch_index=5** (20 gaps restantes del manifiesto).
