# Reglas Frontend — Agente Cursor (DoEventsWEB)

> Copiar este archivo a `DoEventsWEB/ReglasAgente/reglas-front.md` al bootstrap del repo.
> El pipeline **bloquea** la adaptación si este archivo no existe o tiene menos de 500 bytes.

## 1. Propósito

Define reglas obligatorias para el agente Cursor API que adapta cambios de Lovable (`discover-joyful-feed`) a DoEventsWEB sin mocks ni copia literal.

## 2. Regla maestra

```text
Lovable diseña. DoEventsWEB interpreta. DoEventsBack gobierna. El agente adapta. El agente nunca copia.
```

## 3. Flujo obligatorio del agente

1. Leer cambios Lovable y `reglasActuacion/`.
2. Comparar contra DoEventsWEB existente.
3. Clasificar: VISUAL, FRONTEND_LOGIC, BACKEND_REQUIRED, RISKY.
4. Reutilizar `lovable-bridge/` y `@doevents/shared`.
5. Implementar solo lo necesario.
6. Prohibir mocks en runtime.
7. Ejecutar `npm run build:devaws`.
8. Actualizar `ReglasAgente/` (4 archivos).
9. Documentar en `decision-log.md`.

## 4. Prohibición de mocks

No crear ni activar: `mock`, `fake`, `dummy`, `sampleData`, `hardcodedEvents`, `mockTickets`, `mockOrders`.

## 5. Clasificación VISUAL

Solo layout, estilos, copy, responsive. No tocar servicios ni APIs.

## 6. Clasificación FRONTEND_LOGIC

Validaciones, navegación, mensajes de error, estados de formulario. Respetar contratos API.

## 7. Clasificación BACKEND_REQUIRED

Nuevo campo persistente, endpoint, validación servidor. Documentar en `impacto-backend.md`. No desplegar automáticamente.

## 8. Clasificación RISKY

Login, pagos, tickets, órdenes, QR, permisos. Requiere revisión humana antes de merge.

## 9. Arquitectura de capas

| Capa | Ruta |
|------|------|
| UI referencia | `packages/shell/src/lovable/` |
| Integración | `packages/shell/src/lovable-bridge/` |
| Páginas | `packages/shell/src/pages/` |
| API | `packages/shared/src/` |

## 10. Formularios

Toda regla Lovable debe convertirse en validación real: bloqueo de submit, mensaje de error, manejo de error backend.

## 11. Redirecciones

Solo navegar tras respuesta exitosa de API. Nunca `navigate` inmediato sin persistencia.

## 12. Backend (DoEventsBack)

Solo modificar en rama separada si BACKEND_REQUIRED. Nunca deploy prod automático.

## 13. Validaciones de pipeline

- `npm run build:devaws` exitoso
- Sin mocks nuevos en `packages/shell/src/pages`
- Sin secretos en commits
- Artefactos `ReglasAgente/` actualizados

## 14. Reporte final

Generar resumen con: tipo de cambio, archivos WEB/Back, evidencia anti-mock, build/test, riesgos, decisión APPLIED | BLOCKED | REQUIRES_REVIEW.

## 15. Bloqueo

Si no hay certeza, clasificar REQUIRES_REVIEW, no inventar mocks, no copiar Lovable literalmente.

---

## Ejecución 2026-06-19 gap-empalme batch 4 (run 27847959667-b4)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| BankingHub sin métodos hardcodeados | Bloqueo | Sí | `banking/BankingHub.tsx` | `fetchBankAccountsByUser` + `bankingAdapter` |
| ScanQR API real | Integración | Sí | `access/ScanQRSheet.tsx` | `scanTicketFromQr` con `eventId` |
| ReportPostDialog en feed | Integración | Sí | `pages/SocialWallTab.tsx` | Reemplaza toast ficticio |
| ChangeLocationSheet en feed | Integración | Sí | `pages/SocialWallTab.tsx` | Sheet manual + geolocalización |
| FeedHero sin defaultStories prod | Bloqueo | Sí | `feed/FeedHero.tsx` | `showBuiltInStories={false}` |
| Rutas purchases + NotFound | Navegación | Sí | `App.tsx` | `/purchases/*`, `EventPublished`, 404 |
| CompanyProvider montado | Integración | Sí | `lovable-bridge/LovableLayout.tsx` | `fetchUserById` |
| BookingReviewSheet en reserva | FRONTEND_LOGIC | Sí | `services/BookingSheet.tsx` | Paso revisión antes de API |
| StoryViewersSheet | Bloqueo | Parcial | `feed/StoryViewersSheet.tsx` | BACKEND_REQUIRED — sin endpoint viewers |
| PayPal payout / delete cuenta | Bloqueo | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED documentado |
| Batch 4 gaps (20) | Empalme | Sí | ver `decision-log.md` | 18 DONE + 2 BACKEND_REQUIRED |

## Ejecución 2026-06-19 gap-empalme batch 3 (run 27847959667-b3)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| CreatePostSheet sin mockData | Bloqueo | Sí | `feed/CreatePostSheet.tsx` | `mentionOptions` vía props |
| PaymentGateway sin simular éxito | Bloqueo | Parcial | `services/PaymentGatewaySheet.tsx` | BACKEND_REQUIRED sin orderId |
| Tipos feed desde shared | Integración | Sí | `CommentsSheet`, `FavoritesView`, `ProfileView` | `Comment`/`Post` @doevents/shared |
| Empty states iconografía | VISUAL | Sí | tickets, invitations, feed, guests | Patrón batch 1–2 |
| Notifications loading | Integración | Sí | `contexts/NotificationsContext.tsx` | `loading` en contexto |
| KYC statusLabel | Integración | Sí | `contexts/KycContext.tsx` | Desde `fetchUserById` |
| Batch 3 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-19 gap-empalme batch 2 (run 27847959667-b2)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| BookingSheet sin MOCK add-ons | Bloqueo | Sí | `services/BookingSheet.tsx` | Solo `additionalServiceOptions` props/API |
| FollowersSheet API seguimiento | Integración | Sí | `feed/FollowersSheet.tsx` | `followUser` / `unfollowUser` |
| PublishFlowModal sin simular banco | Bloqueo | Parcial | `events/PublishFlowModal.tsx` | BACKEND_REQUIRED persistencia |
| MapView estados vacío/carga | VISUAL | Sí | `feed/MapView.tsx` | Sin datos ficticios en pins |
| PostCard tipos shared | Integración | Sí | `feed/PostCard.tsx` | `FeedUiPost` desde `@doevents/shared` |
| Batch 2 gaps (20) | Empalme | Sí | ver `decision-log.md` | 18 DONE + 2 BACKEND_REQUIRED |

## Ejecución 2026-06-19 gap-empalme batch 1 (run 27847959667-b1)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| SideMenu sin perfil hardcodeado | Bloqueo | Sí | `feed/SideMenu.tsx` | Defaults `Sebastian Motta` eliminados |
| VenueDetailReservation anti-mock | Bloqueo | Sí | `venues/VenueDetailReservation.tsx` | Sin tarjeta 4242 ni host ficticio |
| StepAgenda timeline | VISUAL | Sí | `events/StepAgenda.tsx` | Línea de tiempo entre actividades |
| StepEventLocation header | VISUAL | Sí | `events/StepEventLocation.tsx` | Copy alineado Lovable |
| Password reset BACKEND_REQUIRED | Bloqueo | Sí | `feed/EditProfileView.tsx` | No simula éxito de cambio |
| Notifications empty state | VISUAL | Sí | `feed/NotificationsSheet.tsx` | Icono + copy descriptivo |
| PrivateChatView header | VISUAL | Sí | `chat/PrivateChatView.tsx` | Estado en línea alineado |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 17 DONE + 3 BACKEND_REQUIRED |

## Ejecución 2026-06-19 re-run (agente cloud, 20:54 UTC)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| Manifiesto vacío (38e2c759) | Validación | Sí | — | Sin diff UI; build:devaws OK; sin cambios código |
| Anti-mock pages | Bloqueo | Sí | `packages/shell/src/pages/` | grep sin coincidencias runtime |
| Similitud diseño | Métrica | Parcial | `design-comparison.json` | 59.92% — re-comparación CI pendiente |

## Ejecución 2026-06-19 (agente cloud)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| Manifiesto vacío (38e2c759) | Validación | Sí | — | Sin diff UI; build:devaws OK; empalme b6c89604 ya en rama |
| Reservas usuario vía API real | Integración | Sí | `lovable/components/purchases/*` | `fetchUserVenueBookings` / `fetchUserServiceBookings` |
| Reportar publicación | Integración | Sí | `feed/ReportPostDialog.tsx` | `reportPublication` en shared |
| KYC sin mocks | Bloqueo | Parcial | `feed/KycCertificationView.tsx` | BACKEND_REQUIRED documentado |
| Checkout invitaciones vía ruta real | Navegación | Sí | `InvitationEventDetailView.tsx`, `MyInvitationsPage.tsx` | `/events/:id/checkout` |
| Notificaciones sin fixture local | Integración | Sí | `contexts/NotificationsContext.tsx` | Solo `fetchUserNotifications` |
| Banking validación local | Bloqueo | Parcial | `banking/BankingForm.tsx` | BACKEND_REQUIRED — sin simulación SWIFT |
| Páginas auth mapeadas | Navegación | Sí | `pages/Login.tsx` etc. | Re-export mfe-auth sin duplicar lógica |
| Chat lista → volver al feed | Navegación | Sí | `pages/ChatPage.tsx` | `onBack` en `MessagesListView` navega a `/` (empalme `setActiveTab('wall')` de Lovable) |

## Validaciones

- [x] Validación frontend implementada (formularios reporte, ubicación)
- [x] Mensaje de error implementado
- [x] Submit bloqueado si la regla falla (reporte sin id)
- [x] Error backend manejado (toast)
- [x] Redirección posterior al éxito real (reservas/listados desde API)

---

Reglamento completo: `DoEventsCICD/Reglas/operativas/reglamento-cursor-api.md`
