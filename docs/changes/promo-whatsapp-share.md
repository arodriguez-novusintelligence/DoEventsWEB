# Promo share — WhatsApp no llegaba

| Campo | Valor |
|-------|-------|
| Fecha | 2026-07-19 |
| Entorno | [dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Problema

Al compartir un código promocional (Mail + WhatsApp + Campana), Mail y Campana llegaban pero WhatsApp no.

CloudWatch (`notifications-dev-triggerNotification`):
- Meta API `#132001`: plantilla `promo_code_shared` **no existe** en español.
- Algunos destinatarios tienen `phone: "n/a"` en Client (pasa validación truthy y falla después en silencio).

## Cambios

| Componente | Cambio |
|---|---|
| `whatsapp/promo_code_shared.js` | Builder alineado a plantilla Meta activa `evento_compartido` (incluye código en el texto) |
| `templates/index.js` | `templateName: "evento_compartido"` |
| `promoCodeNotifications.js` | Sanitiza teléfonos (`n/a`), omite WA si no hay número válido, verifica que WA haya quedado en `results` |
| `getClientByUserId.js` / `whatsappNotification.js` | Ignora teléfonos placeholder |
| WEB `PromoCodesStatsView` | Envía `recipient_phone` y muestra warning si WA se omitió |

## Deploy DEV

- `npx serverless deploy function -f triggerNotification --config serverless.dev.yml --stage dev --region sa-east-1` (notifications)
- `npx serverless deploy function -f shareEventPromoCode --config serverless.dev.yml --stage dev --region sa-east-1` (manageevents)
- `npm run deploy:devaws` (WEB)

## Verificación

1. Destinatario **con teléfono real** en perfil → debe llegar WhatsApp con el código.
2. Destinatario con `phone: n/a` → Mail/Campana OK + toast de warning (WhatsApp omitido).
