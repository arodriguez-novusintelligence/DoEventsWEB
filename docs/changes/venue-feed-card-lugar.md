# Tarjeta de lugar en feed — paridad Lovable

| Campo | Valor |
|-------|-------|
| Fecha | 2026-07-01 |
| Entorno | [dev.doeventsapp.com](https://dev.doeventsapp.com) |
| API wall | `sa-east-1` — `aws-lambda-wall-social-media-dev` |

## Problema

Las publicaciones de tipo **lugar** en el feed se renderizaban con el cuerpo genérico (`EntityPostBody`), mostrando cabecera duplicada en reposts, ubicación repetida y sin calendario, servicios adicionales ni totales de reserva.

## Cambios frontend

| Archivo | Descripción |
|---------|-------------|
| `EntityFeedBody.tsx` | Layout unificado Lovable para **lugar**, **servicio** y **evento** |
| `entityFeedTheme.ts` | Tokens de color/borde por tipo (naranja, verde, morado) |
| `resolveFeedPublicationImages.ts` | Resuelve todas las imágenes/multimedia del lugar, servicio o evento |
| `PostCard.tsx` | Rama `lugar` directa y repost sin cabecera anidada rota |
| `feedAdapter.ts` | Mapeo `venueFeed`, ubicación limpia vía metadata |
| `feedUi.ts` | Tipos `VenueFeedData`, `VenueFeedAddonService` |

## Cambios backend

| Archivo | Descripción |
|---------|-------------|
| `feedCommon.js` | `formatVenuePublication` enriquecido: `buildVenueFeedLocationLabel`, `buildVenueScheduleLabel`, `buildVenueFeedTags`, metadata (`addonServices`, `availability`, `pricing`, etc.) |

## Deploy DEV

- Backend: `npx serverless deploy --config serverless.dev.yml --stage dev --region sa-east-1`
- Frontend: `npm run deploy:devaws`
- CloudFront invalidation: `E1AIDTCT83PAW5` (InProgress al desplegar)

## Verificación sugerida

1. Abrir feed en dev con publicación de lugar (ej. Auditorio Nacional).
2. Confirmar badge LUGARES, horario, ubicación sin repetición, descripción y tags.
3. Repost de lugar: sin cabecera duplicada del autor original.
4. El feed **no** debe mostrar calendario, servicios ni totales de pago (eso va en detalle del lugar).
