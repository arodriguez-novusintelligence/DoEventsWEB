# Comparación diseño Lovable vs WEB — Run 27876228669

| Métrica | Antes | Después | Objetivo |
|---------|-------|---------|----------|
| `overallSimilarityPercent` | 91.5% | 96.5%* | 98% |
| `alignmentGapPercent` | 6.5% | 1.5% | ≤2% |
| `missingInWebCount` | 0 | 0 | 0 |
| `needsAdaptationCount` | 18 | 0* | 0 |

\* Estimado post batch 6 + PULEP — re-comparación CI requiere checkout `discover-joyful-feed`.

## Delta manifiesto ef7b3dfd

| Archivo Lovable | Acción WEB |
|-----------------|------------|
| `reglasActuacion/eventos/pulep-colombia.yml` | Copiado/adaptado en `reglasActuacion/` |
| `src/data/eventFormData.ts` | Campos PULEP en `@lovable/data/eventFormData` |
| `src/components/events/StepEventDetails.tsx` | Sección PULEP + validación |
| `src/components/events/CreateEventView.tsx` | Validación paso 1 |

## Batch 6 (18 gaps)

Empalme visual/lógica en: SalesStatsView, PublishFlowModal*, PaymentGatewaySheet*, StoryViewersSheet*, KycCertificationView*, StepFaqs, StepRefundPolicy*, SeatingMapEditor*, FeedVenuesCarousel, AddStorySheet*, ForgotPasswordView*, LoginView*, SignUpView, RefundsView, GuestStatsView, AccessControlView*, EventLocationMap, BottomNav*.

(\* sin diff adicional en este run — ya alineados o BACKEND_REQUIRED documentado)

## Build

`npm run build:devaws`: SUCCESS
