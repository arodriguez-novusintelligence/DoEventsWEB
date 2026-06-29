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

---

---

---

---

---

---

---

---

---

---

---

---

---

---

---

---

---

---

---

## Ejecución 2026-06-29 gap-empalme escalado Cursor (run 28393924506-cursor-escalation)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| SeatingMapEditor arco SVG | VISUAL | Sí | `events/SeatingMapEditor.tsx` | ArcFigureShape + getArcGeometry seat bands; horseshoe transparent bg |
| SeatingMapEditor header Lovable | VISUAL | Sí | `events/SeatingMapEditor.tsx` | rounded-full border-border; font-bold; Piso {currentFloor} |
| SeatingMapEditor empty canvas | VISUAL | Sí | `events/SeatingMapEditor.tsx` | copy Lovable sin LayoutGrid DSF extra |
| SeatingMapEditor SeatsGrid API | FRONTEND_LOGIC | Sí | `events/SeatingMapEditor.tsx` | selectedLabels/takenLabels/onSeatToggle Lovable |
| StepEventLocation bridge adapter | Integración | Sí | `events/StepEventLocation.tsx` | seatStatesToLovableSets; LovableVenueMap intacto |
| Batch escalado (1 gap) | Empalme | Sí | ver `decision-log.md` | 1 DONE + 0 BACKEND_REQUIRED; similitud 98.62% |

## Ejecución 2026-06-29 gap-empalme escalado Cursor (run 28393924241-cursor-escalation)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| SeatingMapEditor arco SVG | VISUAL | Sí | `events/SeatingMapEditor.tsx` | ArcFigureShape + getArcGeometry seat bands; horseshoe transparent bg |
| SeatingMapEditor header Lovable | VISUAL | Sí | `events/SeatingMapEditor.tsx` | rounded-full border-border; font-bold; Piso {currentFloor} |
| SeatingMapEditor empty canvas | VISUAL | Sí | `events/SeatingMapEditor.tsx` | copy Lovable sin LayoutGrid DSF extra |
| SeatingMapEditor SeatsGrid API | FRONTEND_LOGIC | Sí | `events/SeatingMapEditor.tsx` | selectedLabels/takenLabels/onSeatToggle Lovable |
| StepEventLocation bridge adapter | Integración | Sí | `events/StepEventLocation.tsx` | seatStatesToLovableSets; LovableVenueMap intacto |
| Batch escalado (1 gap) | Empalme | Sí | ver `decision-log.md` | 1 DONE + 0 BACKEND_REQUIRED; similitud 98.62% |

## Ejecución 2026-06-29 gap-empalme escalado Cursor (run 28392876508-cursor-escalation)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| FeedHero categorías overlapping | VISUAL | Sí | `feed/FeedHero.tsx` | CATEGORY_CHIP_STYLES; card border-border/60 ring-primary/10; chips ring-primary/20 |
| FeedHero filtro categorías | FRONTEND_LOGIC | Sí | `feed/FeedHero.tsx` | selectedCategories/onSelectCategory/onViewAllCategories vía SocialWallTab |
| FeedHero historias API | Integración | Sí | `feed/FeedHero.tsx` | feedStories API; gradientes primary/accent/destructive; LIVE destructive token |
| FeedHero anti-mock prod | Bloqueo | Sí | `feed/FeedHero.tsx` | showBuiltInStories=false; defaultStories solo import.meta.env.DEV |
| FeedHero loading/empty DSF | VISUAL | Sí | `feed/FeedHero.tsx` | h-14 ring-primary/20 loading; Sparkles empty dashed border-primary/25 |
| Batch escalado (1 gap) | Empalme | Sí | ver `decision-log.md` | 1 DONE + 0 BACKEND_REQUIRED; similitud 98.85% |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27910611218-b6)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| MessagesListView back/past/search | VISUAL | Sí | `chat/MessagesListView.tsx` | back pill ring; past unread shadow-sm ring; search cards border-border/60; EmptyState layout |
| NotificationsSheet badge/retry | VISUAL | Sí | `feed/NotificationsSheet.tsx` | header unread pill ring; retry ring-primary/20; fetchUserNotifications intacto |
| NotificationsContext loadingState | Integración | Sí | `contexts/NotificationsContext.tsx` | loadingState derivado; NOTIFICATIONS_UPDATED_EVENT re-export |
| EventPublished card/ghost CTAs | VISUAL | Sí | `pages/EventPublished.tsx` | ring-1 ring-primary/10 card; ghost flat; outline ring; fetchEventById intacto |
| SeatingMapEditor / MyReservedServices | Empalme | Sí | ver batch b1/b2/b3/b4/b5 | Verificados intactos |
| ReportPostDialog / MainInfoSection | Empalme | Sí | ver batch b1/b2/b3/b4/b5 | Verificados intactos |
| AccessControlListView / MyPostsView | Empalme | Sí | ver batch b1/b2/b3/b4/b5 | Verificados intactos |
| EventsView / ServiceDetailView | Empalme | Sí | ver batch b1/b2/b3/b4/b5 | Verificados intactos |
| CreatePostSheet / HostPickerModal | Empalme | Sí | ver batch b1/b2/b3/b4/b5 | Verificados intactos |
| FAQSection / StepUnified | Empalme | Sí | ver batch b1/b2/b3/b4/b5 | Verificados intactos |
| AddGuestModal / TicketDetailView | Empalme | Sí | ver batch b1/b2/b3/b4/b5 | Verificados intactos |
| FeedHero / SeatLocationModal | Empalme | Sí | ver batch b1/b2/b3/b4/b5 | Verificados intactos |
| Batch 1 gaps b6 (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27910611218-b5)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| ProfileGallery card/progress | VISUAL | Sí | `feed/ProfileGallery.tsx` | ring-primary/10 card; progress label extrabold + ring; save footer border-t; lightbox ring shadow-sm |
| ProfileGalleryPage onRetry | Integración | Sí | `pages/ProfileGalleryPage.tsx` | onRetry → fetchProfileGallery API real sin mocks |
| NotificationsSheet cards | VISUAL | Sí | `feed/NotificationsSheet.tsx` | verificado intacto b4; fetchUserNotifications intacto |
| SeatingMapEditor / NotificationsContext | Empalme | Sí | ver batch b1/b2/b3/b4 | Verificados intactos |
| MyReservedServices / ReportPostDialog | Empalme | Sí | ver batch b1/b2/b3/b4 | Verificados intactos |
| MainInfoSection / AccessControlListView | Empalme | Sí | ver batch b1/b2/b3/b4 | Verificados intactos |
| MyPostsView / EventsView / ServiceDetailView | Empalme | Sí | ver batch b1/b2/b3/b4 | Verificados intactos |
| CreatePostSheet / HostPickerModal / FAQSection | Empalme | Sí | ver batch b1/b2/b3/b4 | Verificados intactos |
| StepUnified / EventPublished / AddGuestModal | Empalme | Sí | ver batch b1/b2/b3/b4 | Verificados intactos |
| TicketDetailView / FeedHero / SeatLocationModal | Empalme | Sí | ver batch b1/b2/b3/b4 | Verificados intactos |
| Batch 1 gaps b5 (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27910611218-b4)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| MessagesListView DSF | VISUAL | Sí | `chat/MessagesListView.tsx` | header rings shadow-sm; unread ring-primary/10; badges font-extrabold; empty dashed border-border/60; searchUsers API |
| NotificationsSheet cards | VISUAL | Sí | `feed/NotificationsSheet.tsx` | max-h-[90dvh] ring-primary/10; rows card border-border/60; unread font-extrabold; fetchUserNotifications intacto |
| SeatingMapEditor / NotificationsContext | Empalme | Sí | ver batch b1/b2/b3 | Verificados intactos |
| MyReservedServices / ReportPostDialog | Empalme | Sí | ver batch b1/b2/b3 | Verificados intactos |
| MainInfoSection / AccessControlListView | Empalme | Sí | ver batch b1/b2/b3 | Verificados intactos |
| MyPostsView / EventsView / ServiceDetailView | Empalme | Sí | ver batch b1/b2/b3 | Verificados intactos |
| CreatePostSheet / HostPickerModal / FAQSection | Empalme | Sí | ver batch b1/b2/b3 | Verificados intactos |
| StepUnified / EventPublished / AddGuestModal | Empalme | Sí | ver batch b1/b2/b3 | Verificados intactos |
| TicketDetailView / FeedHero / SeatLocationModal | Empalme | Sí | ver batch b1/b2/b3 | Verificados intactos |
| Batch 1 gaps b4 (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27910611218-b3)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| ContactImportModal DSF | VISUAL | Sí | `guests/ContactImportModal.tsx` | search border-border/60; selected ring-primary/20; empty dashed; footer border-t; device pick API real |
| BankingHub delete/PayPal | Bloqueo | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED; ring-primary/10 banners; dashboard wrapper; fetchBankAccountsByUser intacto |
| SeatingMapEditor / NotificationsContext | Empalme | Sí | ver batch b1/b2 | Verificados intactos |
| MyReservedServices / ReportPostDialog | Empalme | Sí | ver batch b1/b2 | Verificados intactos |
| MainInfoSection / AccessControlListView | Empalme | Sí | ver batch b1/b2 | Verificados intactos |
| MyPostsView / EventsView / ServiceDetailView | Empalme | Sí | ver batch b1/b2 | Verificados intactos |
| CreatePostSheet / HostPickerModal / FAQSection | Empalme | Sí | ver batch b1/b2 | Verificados intactos |
| StepUnified / EventPublished / AddGuestModal | Empalme | Sí | ver batch b1/b2 | Verificados intactos |
| TicketDetailView / FeedHero / SeatLocationModal | Empalme | Sí | ver batch b1/b2 | Verificados intactos |
| Batch 1 gaps b3 (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27910611218-b2)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| MyInvitationsView cards | VISUAL | Sí | `invitations/MyInvitationsView.tsx` | loading h-14 ring; cards border-border/60 ring-primary/10; status extrabold |
| EventLocationMap shell | VISUAL | Sí | `events/EventLocationMap.tsx` | border-border/60 ring-primary/10; MapPin h-14 loading; error dashed |
| SeatingMapEditor / NotificationsContext | Empalme | Sí | ver batch b1 | Verificados intactos |
| ReportPost / MyReservedServices / MainInfo | Empalme | Sí | ver batch b1 | Verificados intactos |
| AccessControl / MyPosts / EventsView | Empalme | Sí | ver batch b1 | Verificados intactos |
| ServiceDetail / CreatePost / HostPicker | Empalme | Sí | ver batch b1 | Verificados intactos |
| FAQSection / StepUnified / EventPublished | Empalme | Sí | ver batch b1 | Verificados intactos |
| AddGuest / TicketDetail / FeedHero / SeatLocation | Empalme | Sí | ver batch b1 | Verificados intactos |
| Batch 1 gaps b2 (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27910611218-b1)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| SeatingMapEditor seating section | VISUAL | Sí | `events/SeatingMapEditor.tsx` | border-border/60 shadow-sm en sección mapa; APIs guardado intactas |
| NotificationsContext unread list | Integración | Sí | `contexts/NotificationsContext.tsx` | alias `unreadNotifications` filtrado; fetchUserNotifications sin mocks |
| ReportPostDialog footer | VISUAL | Sí | `feed/ReportPostDialog.tsx` | border-t border-border/60; reportPublication API intacta |
| MyReservedServices chevron | VISUAL | Sí | `purchases/MyReservedServicesView.tsx` | chevron ring-primary/20; fetchUserServiceBookings intacto |
| MainInfoSection card ring | VISUAL | Sí | `venues/sections/MainInfoSection.tsx` | ring-1 ring-primary/10 card principal |
| AccessControlListView tabs | VISUAL | Sí | `access/AccessControlListView.tsx` | tab activo ring-primary/20; banner info card |
| MyPostsView empty ring | VISUAL | Sí | `feed/MyPostsView.tsx` | empty ring-1 ring-primary/10 |
| EventsView EmptyHint ring | VISUAL | Sí | `feed/EventsView.tsx` | EmptyHint ring-1 ring-primary/10 |
| ServiceDetailView hire bar | VISUAL | Sí | `services/ServiceDetailView.tsx` | sticky CTA ring-2 ring-primary/20 |
| HostPickerModal sheet ring | VISUAL | Sí | `events/HostPickerModal.tsx` | ring-1 ring-primary/10 shell |
| CreatePostSheet drawer ring | VISUAL | Sí | `feed/CreatePostSheet.tsx` | ring-1 ring-primary/10 drawer |
| FAQSection card ring | VISUAL | Sí | `venues/sections/FAQSection.tsx` | FAQ rows ring-1 ring-primary/10 |
| StepUnified progress ring | VISUAL | Sí | `services/StepUnified.tsx` | progress card ring-1 ring-primary/10 |
| EventPublished share CTA | VISUAL | Sí | `pages/EventPublished.tsx` | Compartir outline border-border/60; fetchEventById intacto |
| MyPurchasesView chevron rings | VISUAL | Sí | `purchases/MyPurchasesView.tsx` | hub rows chevron ring-primary/20; APIs reales |
| AddGuestModal dialog ring | VISUAL | Sí | `guests/AddGuestModal.tsx` | ring-1 ring-primary/10; searchUsers API |
| TicketDetailView card ring | VISUAL | Sí | `tickets/TicketDetailView.tsx` | card ring-1 ring-primary/10 |
| SeatLocationModal header copy | VISUAL | Sí | `tickets/SeatLocationModal.tsx` | DialogDescription font-extrabold; mapa API real |
| FeedHero categories ring | VISUAL | Sí | `feed/FeedHero.tsx` | categorías ring-1 ring-primary/10 |
| BankingHub delete/PayPal | Bloqueo | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED; PayPal banner extrabold; fetchBankAccountsByUser intacto |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27905180836-b15)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| ProfileGallery grid/lightbox | VISUAL | Sí | `feed/ProfileGallery.tsx` | grid ring-primary/20; lightbox controls shadow-sm; subtitle extrabold; API real |
| EventsView initial loading | VISUAL | Sí | `feed/EventsView.tsx` | h-14 ring loading; category chips ring-primary/20 transversal |
| SeatingMapEditor canvas empty | VISUAL | Sí | `events/SeatingMapEditor.tsx` | border-dashed border-primary/25; Editar/eliminar shadow-sm rings |
| NotificationsContext unread | Integración | Sí | `contexts/NotificationsContext.tsx` | alias `unread` = unreadCount |
| MainInfoSection labels | VISUAL | Sí | `venues/sections/MainInfoSection.tsx` | radio/role/capacity extrabold; textarea DSF |
| HostPickerModal search error | VISUAL | Sí | `events/HostPickerModal.tsx` | error card shell shadow-sm; manual banner extrabold |
| StepUnified form inputs | VISUAL | Sí | `services/StepUnified.tsx` | sector/activity/pricing inputs border-border/60 extrabold |
| AddGuestModal search loader | VISUAL | Sí | `guests/AddGuestModal.tsx` | h-14 loader block; Grupo/favorito labels extrabold |
| FeedHero category/dev stories | VISUAL | Sí | `feed/FeedHero.tsx` | ring fix; gradient to-accent; plus badge ring |
| ServiceDetailView rating | VISUAL | Sí | `services/ServiceDetailView.tsx` | star rings; Ver perfil hover rounded-full |
| TicketDetailView fallback/menu | VISUAL | Sí | `tickets/TicketDetailView.tsx` | no-image dashed; menu ring-primary/20 |
| ReportPost / MyReserved / AccessControl | Empalme | Sí | ver batch previo | Verificados intactos |
| MyPosts / CreatePost / FAQ / EventPublished | Empalme | Sí | ver batch previo | Verificados intactos |
| MyPurchases / SeatLocation | Empalme | Sí | ver batch previo | Verificados intactos |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27905180836-b14)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| EventsView EmptyHint dashed | VISUAL | Sí | `feed/EventsView.tsx` | border-dashed border-primary/25; FavoriteHeart rings en rows/fallback |
| FeedHero stories loading | VISUAL | Sí | `feed/FeedHero.tsx` | h-14 ring-primary/20 en carga historias |
| StoryViewersSheet DSF | Bloqueo | Parcial | `feed/StoryViewersSheet.tsx` | BACKEND_REQUIRED viewers API; loading/empty DSF |
| ReportPostDialog error ring | VISUAL | Sí | `feed/ReportPostDialog.tsx` | AlertCircle well ring-destructive/20; textarea focus ring |
| MyReservedServices login | VISUAL | Sí | `purchases/MyReservedServicesView.tsx` | login dashed + subtitle extrabold; API real |
| ServiceDetailView labels | VISUAL | Sí | `services/ServiceDetailView.tsx` | activity/schedule/refund font-extrabold |
| FAQSection inputs | VISUAL | Sí | `venues/sections/FAQSection.tsx` | Input/Textarea border-border/60; delete ring |
| AccessControlListView icons | VISUAL | Sí | `access/AccessControlListView.tsx` | Calendar/MapPin icon wells ring-primary/20 |
| MainInfoSection forms | VISUAL | Sí | `venues/sections/MainInfoSection.tsx` | Input/Select border-border/60 font-extrabold |
| StepUnified helpers | VISUAL | Sí | `services/StepUnified.tsx` | helper copy extrabold; photo preview border |
| AddGuestModal manual tab | VISUAL | Sí | `guests/AddGuestModal.tsx` | Labels/Inputs DSF; UserCheck ring |
| SeatingMapEditor legend | VISUAL | Sí | `events/SeatingMapEditor.tsx` | legend close/icon rings; descriptions extrabold |
| TicketDetailView icons | VISUAL | Sí | `tickets/TicketDetailView.tsx` | Calendar/Clock/MapPin icon wells |
| NotificationsContext hasNotifications | Integración | Sí | `contexts/NotificationsContext.tsx` | alias `hasNotifications` derivado |
| MyPostsView / HostPicker / CreatePost | Empalme | Sí | ver batch previo | Verificados intactos |
| EventPublished / MyPurchases / SeatLocation | Empalme | Sí | ver batch previo | Verificados intactos |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27905180836-b13)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| MessagesListView cards | VISUAL | Sí | `chat/MessagesListView.tsx` | border-border/60; font-extrabold transversal; h-14 loading rings |
| MessagesListView filters | VISUAL | Sí | `chat/MessagesListView.tsx` | FilterChip extrabold + shadow-sm active; search border-border/60 |
| NotificationsSheet loading | VISUAL | Sí | `feed/NotificationsSheet.tsx` | h-14 ring loading; empty dashed border-primary/25 |
| NotificationsSheet actions | VISUAL | Sí | `feed/NotificationsSheet.tsx` | links extrabold; Aceptar/Rechazar rounded-full shadow-sm |
| NotificationsContext clear | Integración | Sí | `contexts/NotificationsContext.tsx` | alias `clearNotifications` = clearAll |
| HostPickerModal empty | VISUAL | Sí | `events/HostPickerModal.tsx` | dashed cards search/empty; retry extrabold |
| MyPostsView empty dashed | VISUAL | Sí | `feed/MyPostsView.tsx` | border-dashed border-primary/25 |
| MyReservedServices empty | VISUAL | Sí | `purchases/MyReservedServicesView.tsx` | dashed empty; fetchUserServiceBookings intacto |
| EventPublished ring | VISUAL | Sí | `pages/EventPublished.tsx` | ring-2 ring-primary/20; fetchEventById intacto |
| EventsView provider heart | VISUAL | Sí | `feed/EventsView.tsx` | FavoriteHeart ring-primary/20 en card proveedor |
| AddGuestModal search | VISUAL | Sí | `guests/AddGuestModal.tsx` | Input border-border/60; Button rounded-full extrabold |
| SeatingMapEditor / FAQ / StepUnified | Empalme | Sí | ver batch previo | Verificados intactos |
| ReportPostDialog / ServiceDetailView | Empalme | Sí | ver batch previo | Verificados intactos |
| AccessControlListView / MainInfoSection | Empalme | Sí | ver batch previo | Verificados intactos |
| CreatePostSheet / TicketDetailView / FeedHero | Empalme | Sí | ver batch previo | Verificados intactos |
| MyPurchasesView | Empalme | Sí | ver batch previo | Verificado intacto |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27905180836-b12)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| FeedHero gradients DSF | VISUAL | Sí | `feed/FeedHero.tsx` | gradientes primary/accent/destructive; category ring-primary/20; subtitle extrabold |
| NotificationsContext API | Integración | Sí | `contexts/NotificationsContext.tsx` | markAsRead/removeNotification/reloadNotifications/fetchNotifications aliases |
| StepAccessControl stats | VISUAL | Sí | `events/StepAccessControl.tsx` | stat icon wells ring-primary/20; muted extrabold |
| SeatingMapEditor CTAs | VISUAL | Sí | `events/SeatingMapEditor.tsx` | convert/image/save rounded-full shadow-sm |
| EventsView heart ring | VISUAL | Sí | `feed/EventsView.tsx` | FavoriteHeart ring-primary/20; location extrabold |
| AddGuestModal tabs | VISUAL | Sí | `guests/AddGuestModal.tsx` | TabsTrigger rounded-full active ring-primary/20 |
| ReportPostDialog Shield | VISUAL | Sí | `feed/ReportPostDialog.tsx` | Shield icon ring; DialogDescription extrabold |
| AccessControlListView Lock | VISUAL | Sí | `access/AccessControlListView.tsx` | Lock ring; section counts extrabold |
| CreatePostSheet location | VISUAL | Sí | `feed/CreatePostSheet.tsx` | input rounded-xl font-extrabold; visibility helper |
| TicketDetailView labels | VISUAL | Sí | `tickets/TicketDetailView.tsx` | categoría/puerta/fecha extrabold |
| EventPublished card ring | VISUAL | Sí | `pages/EventPublished.tsx` | ring-primary/10; outline border-border/60; fetchEventById intacto |
| MyPurchasesView chevron | VISUAL | Sí | `purchases/MyPurchasesView.tsx` | dashed border-border/60; ChevronRight primary/70 |
| SeatLocationModal legend | VISUAL | Sí | `tickets/SeatLocationModal.tsx` | legend/empty extrabold; dashed border-border/60 |
| FAQSection / HostPicker / ServiceDetail | Empalme | Sí | ver batch previo | sublabel/hints extrabold |
| MyPostsView / MyReservedServices / StepUnified / MainInfoSection | Empalme | Sí | ver batch previo | polish extrabold transversal |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27905180836-b11)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| AccessControlListView DSF | VISUAL | Sí | `access/AccessControlListView.tsx` | font-extrabold transversal; border-border/60; rounded-full CTAs; stat icon rings |
| SeatingMapEditor border fix | VISUAL | Sí | `events/SeatingMapEditor.tsx` | border-border/60/60→/60 ×31; seat ring-primary/20; footer rounded-full |
| NotificationsContext count | Integración | Sí | `contexts/NotificationsContext.tsx` | aliases count/notificationCount/totalCount |
| MyPurchasesView empty | VISUAL | Sí | `purchases/MyPurchasesView.tsx` | dashed border-primary/25; retry gap-1.5; API real |
| SeatLocationModal dashed | VISUAL | Sí | `tickets/SeatLocationModal.tsx` | empty/error border-dashed border-primary/25 |
| EventPreviewModal fields | VISUAL | Sí | `events/EventPreviewModal.tsx` | Field values + refund label font-extrabold |
| StepUnified preferences | VISUAL | Sí | `services/StepUnified.tsx` | selected cards ring-primary/20; refund labels extrabold |
| MyPostsView delete ring | VISUAL | Sí | `feed/MyPostsView.tsx` | delete FAB ring-destructive/20 |
| AddGuestModal selection | VISUAL | Sí | `guests/AddGuestModal.tsx` | selected row ring-primary/20; retry extrabold |
| ReportPostDialog textarea | VISUAL | Sí | `feed/ReportPostDialog.tsx` | Textarea + error font-extrabold |
| MainInfoSection stepper | VISUAL | Sí | `venues/sections/MainInfoSection.tsx` | minus ring-primary/20; parking label extrabold |
| EventPublished body | VISUAL | Sí | `pages/EventPublished.tsx` | body copy font-extrabold; fetchEventById intacto |
| StepAccessControl / FAQ / HostPicker | Empalme | Sí | ver batch previo | Verificados intactos |
| ServiceDetailView / EventsView | Empalme | Sí | ver batch previo | Verificados intactos |
| MyReservedServices / CreatePost / TicketDetail | Empalme | Sí | ver batch previo | Verificados intactos |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27905180836-b10)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| FeedHero typography DSF | VISUAL | Sí | `feed/FeedHero.tsx` | font-extrabold transversal; category card border-border/60; Cambiar shadow-sm |
| StoryViewersSheet shell | Bloqueo | Parcial | `feed/StoryViewersSheet.tsx` | BACKEND_REQUIRED viewers API; SheetContent border-border/60 shadow-sm |
| CompanyContext aliases | Integración | Sí | `contexts/CompanyContext.tsx` | organizationName/displayName/isCompany + JSDoc API parity |
| NotificationsContext refresh | Integración | Sí | `contexts/NotificationsContext.tsx` | alias `refresh` derivado reloadFromApi |
| EventPublished body copy | VISUAL | Sí | `pages/EventPublished.tsx` | subtitle sin extrabold; fetchEventById + share intacto |
| EventPreviewModal / StepAccessControl | Empalme | Sí | ver batch previo | Verificados intactos |
| SeatingMapEditor / FAQSection | Empalme | Sí | ver batch previo | Verificados intactos |
| HostPickerModal / ServiceDetailView | Empalme | Sí | ver batch previo | Verificados intactos |
| MyPostsView / EventsView | Empalme | Sí | ver batch previo | Verificados intactos |
| MyReservedServicesView | Integración | Sí | `purchases/MyReservedServicesView.tsx` | API real verificada intacta |
| StepUnified / MainInfoSection | Empalme | Sí | ver batch previo | Verificados intactos |
| ReportPostDialog / AddGuestModal | Empalme | Sí | ver batch previo | Verificados intactos |
| CreatePostSheet / TicketDetailView | Empalme | Sí | ver batch previo | Verificados intactos |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27905180836-b9)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| ContactImportModal DSF | VISUAL | Sí | `guests/ContactImportModal.tsx` | Dialog shadow-sm; font-extrabold; rounded-full CTAs; device pick ring |
| SeatingMapEditor borders | VISUAL | Sí | `events/SeatingMapEditor.tsx` | border-border/60 transversal; modales shadow-sm; ring-primary/20 |
| RefundTicketFlow cards | VISUAL | Sí | `tickets/RefundTicketFlow.tsx` | shadow-sm selected; confirm border-border/60; back extrabold |
| TicketDetailView tabs | VISUAL | Sí | `tickets/TicketDetailView.tsx` | shadow-sm tabs/overlays; seat CTA rounded-full |
| EventsView loading | VISUAL | Sí | `feed/EventsView.tsx` | ring-primary/20; providers h-14 ring; eventers extrabold |
| HostPickerModal shell | VISUAL | Sí | `events/HostPickerModal.tsx` | sheet shadow-sm |
| StepUnified chips | VISUAL | Sí | `services/StepUnified.tsx` | inactive chips border-border/60 shadow-sm; preference cards shadow-sm |
| AddGuestModal shell | VISUAL | Sí | `guests/AddGuestModal.tsx` | dialog border-border/60 shadow-sm; empty dashed border-border/60 |
| CreatePostSheet media | VISUAL | Sí | `feed/CreatePostSheet.tsx` | dashed CTAs border-border/60 |
| ReportPostDialog footer | VISUAL | Sí | `feed/ReportPostDialog.tsx` | footer CTAs font-extrabold |
| BankingHub delete/PayPal | Bloqueo | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED; back/retry extrabold; PayPal icon ring |
| EventPreviewModal / StepAccessControl | Empalme | Sí | ver batch previo | Verificados intactos |
| FAQSection / ServiceDetailView | Empalme | Sí | ver batch previo | Verificados intactos |
| MyPostsView / MyReservedServices | Empalme | Sí | ver batch previo | Verificados intactos |
| NotificationsContext API | Integración | Sí | `contexts/NotificationsContext.tsx` | API parity verificada |
| MainInfoSection / EventPublished | Empalme | Sí | ver batch previo | Verificados intactos |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27905180836-b8)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| ProfileGallery typography | VISUAL | Sí | `feed/ProfileGallery.tsx` | font-extrabold transversal; loading h-14 ring; card border-border/60 |
| SeatingMapEditor typography | VISUAL | Sí | `events/SeatingMapEditor.tsx` | font-bold/semibold→extrabold transversal (~37) |
| NotificationsContext error | Integración | Sí | `contexts/NotificationsContext.tsx` | alias `error` derivado loadError |
| SeatLocationModal badges | VISUAL | Sí | `tickets/SeatLocationModal.tsx` | border-border/60 shadow-sm; retry extrabold |
| EventPublished loading | VISUAL | Sí | `pages/EventPublished.tsx` | loading name h-14 ring-primary/20 |
| AddGuestModal tabs/CTAs | VISUAL | Sí | `guests/AddGuestModal.tsx` | TabsList border-border/60; CTAs extrabold rounded-full |
| RefundTicketFlow cards | VISUAL | Sí | `tickets/RefundTicketFlow.tsx` | destructive/confirm border-border/60 shadow-sm |
| StepAccessControl gates | VISUAL | Sí | `events/StepAccessControl.tsx` | empty shadow-sm; delete rounded-full |
| FAQSection CTAs | VISUAL | Sí | `venues/sections/FAQSection.tsx` | add FAQ font-extrabold rounded-full |
| HostPickerModal chrome | VISUAL | Sí | `events/HostPickerModal.tsx` | close/clear ring-primary/20 shadow-sm |
| ServiceDetailView hero | VISUAL | Sí | `services/ServiceDetailView.tsx` | badge shadow-sm; thumbs ring-primary/20 |
| EventsView EmptyHint | VISUAL | Sí | `feed/EventsView.tsx` | Sin imagen + EmptyHint extrabold |
| StepUnified geo/prerequisite | VISUAL | Sí | `services/StepUnified.tsx` | Sin foto extrabold; geo buttons rounded-full |
| TicketDetailView cards | VISUAL | Sí | `tickets/TicketDetailView.tsx` | shadow-sm; Sin imagen extrabold |
| CreatePostSheet drawer | VISUAL | Sí | `feed/CreatePostSheet.tsx` | DrawerContent shadow-sm; visibility pills shadow-sm |
| ReportPostDialog reasons | VISUAL | Sí | `feed/ReportPostDialog.tsx` | selected ring-2 ring-primary/20 |
| MainInfoSection stepper | VISUAL | Sí | `venues/sections/MainInfoSection.tsx` | chips/stepper shadow-sm extrabold |
| MyPostsView retry | VISUAL | Sí | `feed/MyPostsView.tsx` | retry font-extrabold rounded-full |
| MyReservedServices CTAs | VISUAL | Sí | `purchases/MyReservedServicesView.tsx` | login/retry font-extrabold |
| EventPreviewModal gallery | VISUAL | Sí | `events/EventPreviewModal.tsx` | hero/thumbs border-border/60 shadow-sm |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27905180836-b7)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| EventPreviewModal hero/notice | VISUAL | Sí | `events/EventPreviewModal.tsx` | border-border/60; notice/video link extrabold; YouTube ring-primary/20 |
| SeatingMapEditor header/footer | VISUAL | Sí | `events/SeatingMapEditor.tsx` | Editando extrabold; Guardar shadow-sm; FooterActions border-border/60 |
| EventsView provider cards | VISUAL | Sí | `feed/EventsView.tsx` | initials/badge/rating extrabold; category chips extrabold |
| TicketDetailView labels | VISUAL | Sí | `tickets/TicketDetailView.tsx` | QR data + transfer date extrabold |
| MyPurchasesView hub | VISUAL | Sí | `purchases/MyPurchasesView.tsx` | retry shadow-sm; row counts extrabold; API real |
| EventPublished ring/subtitle | VISUAL | Sí | `pages/EventPublished.tsx` | PartyPopper ring-2; subtitle extrabold |
| AddGuestModal checkmark | VISUAL | Sí | `guests/AddGuestModal.tsx` | selection ✓ font-extrabold |
| NotificationsContext hasError | Integración | Sí | `contexts/NotificationsContext.tsx` | alias hasError derivado loadError |
| CompanyContext error aliases | Integración | Sí | `contexts/CompanyContext.tsx` | hasError + error API parity |
| RefundTicketFlow / StepAccessControl | Empalme | Sí | ver batch previo | Verificados intactos |
| FAQSection / HostPickerModal | Empalme | Sí | ver batch previo | Verificados intactos |
| ServiceDetailView / MyPostsView | Empalme | Sí | ver batch previo | Verificados intactos |
| StepUnified / MyReservedServices | Empalme | Sí | ver batch previo | Verificados intactos |
| MainInfoSection / ReportPostDialog | Empalme | Sí | ver batch previo | Verificados intactos |
| CreatePostSheet | Empalme | Sí | ver batch previo | Verificado intacto |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27905180836-b6)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| SeatingMapEditor delete modal | VISUAL | Sí | `events/SeatingMapEditor.tsx` | font-extrabold; preview border-border/60; footer shadow-sm |
| RefundTicketFlow cards/nav | VISUAL | Sí | `tickets/RefundTicketFlow.tsx` | back extrabold; cards border-border/60; cancel shadow-sm |
| EventPreviewModal agenda | VISUAL | Sí | `events/EventPreviewModal.tsx` | rows border-border/60; time/refund extrabold |
| HostPickerModal tabs/CTA | VISUAL | Sí | `events/HostPickerModal.tsx` | Agregar shadow-sm; close ring-primary/20 |
| ServiceDetailView back | VISUAL | Sí | `services/ServiceDetailView.tsx` | back link font-extrabold |
| EventsView badges/CTAs | VISUAL | Sí | `feed/EventsView.tsx` | badges extrabold; Reservar/Crear shadow-sm |
| StepUnified section cards | VISUAL | Sí | `services/StepUnified.tsx` | border-border/60; chips extrabold; FAQ CTA shadow-sm |
| CreatePostSheet typography | VISUAL | Sí | `feed/CreatePostSheet.tsx` | avatar/visibility/media font-extrabold |
| ReportPostDialog reasons | VISUAL | Sí | `feed/ReportPostDialog.tsx` | unselected rows font-extrabold |
| TicketDetailView labels | VISUAL | Sí | `tickets/TicketDetailView.tsx` | menu/boleta/overlay extrabold |
| AddGuestModal match banners | VISUAL | Sí | `guests/AddGuestModal.tsx` | border-border/60; labels extrabold; retry shadow-sm |
| EventPublished Mis eventos | VISUAL | Sí | `pages/EventPublished.tsx` | CTA shadow-sm |
| BankingHub delete/PayPal | Bloqueo | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED; banner icon ring |
| StepAccessControl / FAQ / contexts | Empalme | Sí | ver batch previo | Verificados intactos |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27905180836-b5)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| EventPublished card | VISUAL | Sí | `pages/EventPublished.tsx` | border-border/60; CTAs extrabold rounded-full shadow-sm |
| RefundTicketFlow typography | VISUAL | Sí | `tickets/RefundTicketFlow.tsx` | font-extrabold transversal CTAs/summary |
| StepAccessControl typography | VISUAL | Sí | `events/StepAccessControl.tsx` | gate/user labels font-extrabold |
| HostPickerModal typography | VISUAL | Sí | `events/HostPickerModal.tsx` | avatar/CTA font-extrabold |
| StepUnified headings | VISUAL | Sí | `services/StepUnified.tsx` | section headings font-extrabold |
| TicketDetailView chips | VISUAL | Sí | `tickets/TicketDetailView.tsx` | status/order font-extrabold; CTA shadow-sm |
| ServiceDetailView CTA | VISUAL | Sí | `services/ServiceDetailView.tsx` | hire CTA font-extrabold shadow-sm |
| CreatePostSheet drawer | VISUAL | Sí | `feed/CreatePostSheet.tsx` | border-t border-border/60; title extrabold |
| ReportPostDialog textarea | VISUAL | Sí | `feed/ReportPostDialog.tsx` | border-border/60 shadow-sm |
| SeatingMapEditor footer | VISUAL | Sí | `events/SeatingMapEditor.tsx` | footer borders border-border/60 |
| EventsView filters | VISUAL | Sí | `feed/EventsView.tsx` | filter chips font-extrabold |
| CompanyContext companyName | Integración | Sí | `contexts/CompanyContext.tsx` | alias `companyName` derivado |
| AddGuestModal search | VISUAL | Sí | `guests/AddGuestModal.tsx` | avatar initials font-extrabold |
| BankingHub delete/PayPal | Bloqueo | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED banner intacto |
| EventPreviewModal sections | VISUAL | Sí | `events/EventPreviewModal.tsx` | verificado intacto batch previo |
| FAQSection empty | VISUAL | Sí | `venues/sections/FAQSection.tsx` | verificado intacto batch previo |
| MyPostsView loading | VISUAL | Sí | `feed/MyPostsView.tsx` | verificado intacto batch previo |
| MyReservedServicesView | Integración | Sí | `purchases/MyReservedServicesView.tsx` | verificado intacto batch previo |
| MainInfoSection cards | VISUAL | Sí | `venues/sections/MainInfoSection.tsx` | verificado intacto batch previo |
| NotificationsContext API | Integración | Sí | `contexts/NotificationsContext.tsx` | API parity verificada |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27905180836-b4)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| SeatLocationModal shell | VISUAL | Sí | `tickets/SeatLocationModal.tsx` | Dialog border-border/60 shadow-sm; badges extrabold; retry rounded-full |
| HostPickerModal loading | VISUAL | Sí | `events/HostPickerModal.tsx` | h-14 ring loading; tabs extrabold; submit shadow-sm |
| TicketDetailView chips | VISUAL | Sí | `tickets/TicketDetailView.tsx` | border-border/60; countdown shadow-sm extrabold |
| EventPreviewModal toggles | VISUAL | Sí | `events/EventPreviewModal.tsx` | font-extrabold; refund CTA rounded-full |
| StepAccessControl headings | VISUAL | Sí | `events/StepAccessControl.tsx` | extrabold summary; assign CTA shadow-sm |
| RefundTicketFlow summary | VISUAL | Sí | `tickets/RefundTicketFlow.tsx` | labels extrabold; CTAs shadow-sm |
| FAQSection CTAs | VISUAL | Sí | `venues/sections/FAQSection.tsx` | rounded-full shadow-sm; respuesta label extrabold |
| ServiceDetailView chips | VISUAL | Sí | `services/ServiceDetailView.tsx` | servicio/precio font-extrabold |
| EventsView dates | VISUAL | Sí | `feed/EventsView.tsx` | card dates + Ver más font-extrabold |
| StepUnified CTAs | VISUAL | Sí | `services/StepUnified.tsx` | Guardar extrabold shadow-sm; photo border-border/60 |
| MyPostsView retry | VISUAL | Sí | `feed/MyPostsView.tsx` | retry rounded-full shadow-sm |
| MyReservedServices rows | VISUAL | Sí | `purchases/MyReservedServicesView.tsx` | status/price extrabold; retry shadow-sm |
| MainInfoSection labels | VISUAL | Sí | `venues/sections/MainInfoSection.tsx` | field labels font-extrabold |
| CreatePostSheet publish | VISUAL | Sí | `feed/CreatePostSheet.tsx` | publish CTA extrabold shadow-sm |
| ReportPostDialog footer | VISUAL | Sí | `feed/ReportPostDialog.tsx` | footer pills shadow-sm; reason extrabold selected |
| AddGuestModal CTAs | VISUAL | Sí | `guests/AddGuestModal.tsx` | rounded-full shadow-sm; search result extrabold |
| SeatingMapEditor toolbar | VISUAL | Sí | `events/SeatingMapEditor.tsx` | border-border/60 shadow-sm; shape labels extrabold |
| NotificationsContext API | Integración | Sí | `contexts/NotificationsContext.tsx` | isLoading/refreshNotifications verificados |
| CompanyContext alias | Integración | Sí | `contexts/CompanyContext.tsx` | isLoading/refreshCompany verificados |
| BankingHub delete/PayPal | Bloqueo | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED banner intacto |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27905180836-b3)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| CreatePostSheet drawer | VISUAL | Sí | `feed/CreatePostSheet.tsx` | max-h-[90dvh]; PenLine ring; avatar ring-primary/20 |
| ReportPostDialog header | VISUAL | Sí | `feed/ReportPostDialog.tsx` | Flag destructive ring; font-extrabold; border-border/60 |
| TicketDetailView order | VISUAL | Sí | `tickets/TicketDetailView.tsx` | order extrabold; tabs shadow-sm; seat CTA border-border/60 |
| StoryViewersSheet skeleton | Bloqueo | Parcial | `feed/StoryViewersSheet.tsx` | BACKEND_REQUIRED viewers API; empty border-primary/25 |
| RefundTicketFlow order | VISUAL | Sí | `tickets/RefundTicketFlow.tsx` | order card border-border/60 shadow-sm |
| SeatingMapEditor capacity | VISUAL | Sí | `events/SeatingMapEditor.tsx` | mapa silletería font-extrabold |
| EventsView chips | VISUAL | Sí | `feed/EventsView.tsx` | categoría activa font-extrabold |
| NotificationsContext isLoading | Integración | Sí | `contexts/NotificationsContext.tsx` | JSDoc alias = loading |
| EventPreviewModal sections | VISUAL | Sí | `events/EventPreviewModal.tsx` | verificado intacto batch previo |
| StepAccessControl gates | VISUAL | Sí | `events/StepAccessControl.tsx` | verificado intacto batch previo |
| FAQSection empty | VISUAL | Sí | `venues/sections/FAQSection.tsx` | verificado intacto batch previo |
| HostPickerModal shell | VISUAL | Sí | `events/HostPickerModal.tsx` | verificado intacto batch previo |
| ServiceDetailView hero | VISUAL | Sí | `services/ServiceDetailView.tsx` | verificado intacto batch previo |
| StepUnified headers | VISUAL | Sí | `services/StepUnified.tsx` | verificado intacto batch previo |
| MyPostsView loading | VISUAL | Sí | `feed/MyPostsView.tsx` | verificado intacto batch previo |
| MyReservedServicesView | Integración | Sí | `purchases/MyReservedServicesView.tsx` | verificado intacto batch previo |
| AddGuestModal search | VISUAL | Sí | `guests/AddGuestModal.tsx` | verificado intacto batch previo |
| CompanyContext alias | Integración | Sí | `contexts/CompanyContext.tsx` | verificado intacto batch previo |
| MainInfoSection cards | VISUAL | Sí | `venues/sections/MainInfoSection.tsx` | verificado intacto batch previo |
| BankingHub delete/PayPal | Bloqueo | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED banner intacto |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 18 DONE + 2 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27904918660)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| FeedBanner title | VISUAL | Sí | `feed/FeedBanner.tsx` | verificado intacto; font-extrabold; dismiss ring-border/60 |
| SeatingMapEditor canvas | VISUAL | Sí | `events/SeatingMapEditor.tsx` | empty card border-border/60; zoom border-border/60 |
| AIAssistantFAB polish | VISUAL | Sí | `ai/AIAssistantFAB.tsx` | verificado ring-primary/20; shadow-xl PRO |
| EventPreviewModal sections | VISUAL | Sí | `events/EventPreviewModal.tsx` | notice/FAQ/refund border-border/60; font-extrabold |
| RefundTicketFlow cards | VISUAL | Sí | `tickets/RefundTicketFlow.tsx` | counter border-border/60; footer border-border/60 |
| FAQSection empty | VISUAL | Sí | `venues/sections/FAQSection.tsx` | empty title font-extrabold |
| HostPickerModal shell | VISUAL | Sí | `events/HostPickerModal.tsx` | sheet border-border/60; inputs border-border/60 |
| StepAccessControl gates | VISUAL | Sí | `events/StepAccessControl.tsx` | empty/stat tiles border-border/60 shadow-sm |
| ServiceDetailView hero | VISUAL | Sí | `services/ServiceDetailView.tsx` | hero border-border/60; empty font-extrabold |
| EventsView EmptyHint | VISUAL | Sí | `feed/EventsView.tsx` | EmptyHint border-border/60 |
| StepUnified headers | VISUAL | Sí | `services/StepUnified.tsx` | SectionHeader/progress border-border/60; font-extrabold |
| CompanyContext alias | Integración | Sí | `contexts/CompanyContext.tsx` | useCompanyContext verificado |
| AddGuestModal search | VISUAL | Sí | `guests/AddGuestModal.tsx` | empty font-extrabold |
| BankingHub delete/PayPal | Bloqueo | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED; error card border-border/60 |
| MyPostsView empty | VISUAL | Sí | `feed/MyPostsView.tsx` | empty border-border/60; font-extrabold |
| SeatLocationModal loading | VISUAL | Sí | `tickets/SeatLocationModal.tsx` | DialogTitle extrabold; loading border-border/60 |
| MainInfoSection cards | VISUAL | Sí | `venues/sections/MainInfoSection.tsx` | verificado border-border/60 |
| MyPurchasesView empty | VISUAL | Sí | `purchases/MyPurchasesView.tsx` | aggregate empty border-border/60 |
| MyReservedServicesView | Integración | Sí | `purchases/MyReservedServicesView.tsx` | cards border-border/60; rows font-extrabold; API real |
| TicketDetailView order | VISUAL | Sí | `tickets/TicketDetailView.tsx` | single-order border-border/60 shadow-sm |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27904436890)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| AIAssistantFAB hover | VISUAL | Sí | `ai/AIAssistantFAB.tsx` | ring-primary/30 hover; PRO badge shadow-sm |
| SeatingMapEditor header | VISUAL | Sí | `events/SeatingMapEditor.tsx` | border-border/60; piso font-extrabold |
| FeedBanner title | VISUAL | Sí | `feed/FeedBanner.tsx` | font-extrabold; dismiss ring-border/60 |
| FAQSection label | VISUAL | Sí | `venues/sections/FAQSection.tsx` | font-extrabold section title |
| RefundTicketFlow cards | VISUAL | Sí | `tickets/RefundTicketFlow.tsx` | border-border/60 shadow-sm rows/summary |
| EventPreviewModal sections | VISUAL | Sí | `events/EventPreviewModal.tsx` | cards border-border/60; h3 extrabold; avatar rings |
| HostPickerModal rows | VISUAL | Sí | `events/HostPickerModal.tsx` | extrabold title; UserRow border-border/60 |
| ServiceDetailView cards | VISUAL | Sí | `services/ServiceDetailView.tsx` | border-border/60; h3 extrabold |
| StepAccessControl gates | VISUAL | Sí | `events/StepAccessControl.tsx` | extrabold h2; cards border-border/60 |
| EventsView discover cards | VISUAL | Sí | `feed/EventsView.tsx` | border-border/60 en cards/chips |
| CompanyContext alias | Integración | Sí | `contexts/CompanyContext.tsx` | `useCompanyContext` alias export |
| StepUnified nested cards | VISUAL | Sí | `services/StepUnified.tsx` | border-border/60; extrabold headers |
| BankingHub delete/PayPal | Bloqueo | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED banner intacto; loading card |
| SeatLocationModal empty | VISUAL | Sí | `tickets/SeatLocationModal.tsx` | card shells border-border/60 shadow-sm |
| AddGuestModal search | VISUAL | Sí | `guests/AddGuestModal.tsx` | rows border-border/60; avatar rings |
| MyPostsView loading | VISUAL | Sí | `feed/MyPostsView.tsx` | loading card border-border/60 |
| MyPurchasesView rows | VISUAL | Sí | `purchases/MyPurchasesView.tsx` | nav border-border/60; labels extrabold |
| MainInfoSection cards | VISUAL | Sí | `venues/sections/MainInfoSection.tsx` | border-border/60 main/parking |
| ContactImportModal header | VISUAL | Sí | `guests/ContactImportModal.tsx` | UserPlus pill ring; extrabold title |
| TicketDetailView chrome | VISUAL | Sí | `tickets/TicketDetailView.tsx` | menu ring-primary/20; tabs border-border/60 |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 6 (run 27903532486-b6)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| RepostSheet header | VISUAL | Sí | `feed/RepostSheet.tsx` | Repeat2 pill ring; max-h-[90dvh]; cards border-border/60 |
| ServiceReservationDetail | VISUAL | Sí | `purchases/ServiceReservationDetail.tsx` | RefreshCw retry; header ring; cards border-border/60 |
| ImageCarousel frame | VISUAL | Sí | `feed/ImageCarousel.tsx` | shadow-sm en frame ring-primary/20 |
| GroupDropZone shell | VISUAL | Sí | `guests/GroupDropZone.tsx` | títulos extrabold; drop target border-primary/25 |
| UserProfileView hero | VISUAL | Sí | `feed/UserProfileView.tsx` | hero border-border/60; avatar ring; name extrabold |
| InvitationEventDetail hero | VISUAL | Sí | `invitations/InvitationEventDetailView.tsx` | carousel ring; action buttons ring shadow-sm |
| VenueReservationDetail | VISUAL | Sí | `purchases/VenueReservationDetail.tsx` | empty Building2 ring; cards border-border/60 |
| EditGuestModal header | VISUAL | Sí | `guests/EditGuestModal.tsx` | UserRound h-10 ring pill; título extrabold |
| TopHeader chrome | VISUAL | Sí | `feed/TopHeader.tsx` | menu/search/bell ring-primary/20 shadow-sm |
| PreferencesRefundSection | VISUAL | Sí | `venues/sections/PreferencesRefundSection.tsx` | RotateCcw pill ring; cards border-border/60 |
| VenueDetailReservation | VISUAL | Sí | `venues/VenueDetailReservation.tsx` | sections border-border/60; back button ring |
| StatsEventListView | VISUAL | Sí | `stats/StatsEventListView.tsx` | event cards border-border/60; h2 extrabold |
| FAQSection empty | VISUAL | Sí | `venues/sections/FAQSection.tsx` | HelpCircle pill ring; dashed border-primary/25 |
| GuestManagementView header | VISUAL | Sí | `guests/GuestManagementView.tsx` | Users ring header; loading card shadow-sm |
| AccessControlView shell | VISUAL | Sí | `stats/AccessControlView.tsx` | ShieldCheck pill header; summary cards shadow-sm |
| VenueCreator header | VISUAL | Sí | `venues/VenueCreator.tsx` | border-border/60; FAB menu shadow-xl |
| AIAssistantFAB polish | VISUAL | Sí | `ai/AIAssistantFAB.tsx` | shadow-xl hover ring-primary/20 |
| Batch 6 gaps (17) | Empalme | Sí | ver `decision-log.md` | 17 DONE + 0 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 5 (run 27903532486-b5)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| PostCard ring | VISUAL | Sí | `feed/PostCard.tsx` | ring-2 ring-primary/20; repost border-border/60 |
| MyVenuesView CTA | VISUAL | Sí | `venues/MyVenuesView.tsx` | CTA dashed shadow-sm; grid border-border/60 |
| CreateEventView header | VISUAL | Sí | `events/CreateEventView.tsx` | border-b border-border/60; stepper border; CTA shadow-sm |
| BookingSheet cards | VISUAL | Sí | `services/BookingSheet.tsx` | SheetTitle extrabold; cards border-border/60 |
| StepAgenda timeline | VISUAL | Sí | `events/StepAgenda.tsx` | Título extrabold; days card border-border/60 |
| PaymentMethodsDashboard | VISUAL | Parcial | `banking/PaymentMethodsDashboard.tsx` | extrabold title; delete BACKEND_REQUIRED intacto |
| StepEventSummary cards | VISUAL | Sí | `events/StepEventSummary.tsx` | Accordion/cards border-border/60 |
| StepEventDetails form | VISUAL | Sí | `events/StepEventDetails.tsx` | Título extrabold; host cards border-border/60 |
| CategoryBuyerList rows | VISUAL | Sí | `stats/CategoryBuyerList.tsx` | Row cards shadow-sm border-border/60 |
| PaymentGatewaySheet | VISUAL | Parcial | `services/PaymentGatewaySheet.tsx` | extrabold title; PSP BACKEND_REQUIRED intacto |
| SeatingCategoryDialog | VISUAL | Sí | `venues/seating/SeatingCategoryDialog.tsx` | Dialog shadow-sm; preview border-border/60 |
| ChatRoomView shell | VISUAL | Sí | `chat/ChatRoomView.tsx` | Event card border-border/60; empty shadow-sm |
| GuestStatsView cards | VISUAL | Sí | `stats/GuestStatsView.tsx` | Header extrabold; funnel cards border-border/60 |
| EditProfileView header | VISUAL | Parcial | `feed/EditProfileView.tsx` | extrabold title; password/gustos BACKEND_REQUIRED |
| MyServicesView grid | VISUAL | Sí | `services/MyServicesView.tsx` | Grid border-border/60; wizard sticky shadow-sm |
| ProfileView hero | VISUAL | Sí | `feed/ProfileView.tsx` | Hero border-border/60; name extrabold |
| StepFaqs cards | VISUAL | Sí | `events/StepFaqs.tsx` | Título extrabold; FAQ cards border-border/60 |
| ImageCarousel frame | VISUAL | Sí | `feed/ImageCarousel.tsx` | ring-primary/20 border-border/60; dots primary/30 |
| FavoritesView retry | VISUAL | Sí | `feed/FavoritesView.tsx` | Cards border-border/60; RefreshCw retry |
| MyEventsView grid | VISUAL | Sí | `feed/MyEventsView.tsx` | Grid border-border/60; empty border-primary/25 |
| Batch 5 gaps (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED nuevos |

## Ejecución 2026-06-21 gap-empalme batch 4 (run 27903532486-b4)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| AdminUsersPanel shell | Navegación | Sí | `admin/AdminUsersPanel.tsx` | AdminPanelSection + info bar; card overflow-hidden |
| PaymentsPanel shell | Navegación | Sí | `admin/PaymentsPanel.tsx` | Badge Finanzas; tab pagos API real |
| NewUsersPanel shell | Navegación | Sí | `admin/NewUsersPanel.tsx` | Badge Recientes; card shadow-sm |
| SupportSearchPanel shell | Navegación | Sí | `admin/SupportSearchPanel.tsx` | Búsqueda soporte API real |
| StoriesContext API | Integración | Sí | `contexts/StoriesContext.tsx` | Export `StoriesContextValue`; alias `useStoriesContext` |
| AddStorySheet Sheet | FRONTEND_LOGIC | Sí | `feed/AddStorySheet.tsx` | Wrapper CreateStorySheet; createStory API |
| useGuests bridge | Integración | Sí | `hooks/useGuests.ts` | Dual export useApiGuests documentado |
| EventSalesDetail stats | Integración | Sí | `admin/EventSalesDetail.tsx` | Delega SalesStatsView API real |
| index.css port-map | VISUAL | Sí | `index.css`, `lovable/index.css` | DSF v2.1; animate-fade-in-up; story-progress |
| StepEventLocation empty | VISUAL | Sí | `events/StepEventLocation.tsx` | Home h-14 ring; empty shadow-sm |
| CreateFAB rings | VISUAL | Sí | `feed/CreateFAB.tsx` | ring-primary/20 iconos; shadow-xl options |
| MentionText hover | VISUAL | Sí | `feed/MentionText.tsx` | text-primary/90 transition-colors |
| StepRefundPolicy cards | VISUAL | Sí | `events/StepRefundPolicy.tsx` | border-border/60 shadow-sm; extrabold title |
| SalesStatsView header | VISUAL | Sí | `stats/SalesStatsView.tsx` | Gradiente shadow-sm top bar |
| DraggableGuestCard ring | VISUAL | Sí | `guests/DraggableGuestCard.tsx` | ring-2 ring-border/40 card |
| SuccessModal shadow | VISUAL | Sí | `banking/SuccessModal.tsx` | DialogContent border shadow-sm |
| PrivateChatView header | VISUAL | Sí | `chat/PrivateChatView.tsx` | Avatar ring-primary/20; empty MessageSquare |
| ChatSettings header | VISUAL | Sí | `chat/ChatSettingsSheet.tsx` | Settings h-10 ring; rows shadow-sm |
| CategoryBuyerList tokens | VISUAL | Sí | `stats/CategoryBuyerList.tsx` | success/warning tokens; empty Users ring |
| BankingForm cards | VISUAL | Parcial | `banking/BankingForm.tsx` | BACKEND_REQUIRED persistencia; border-border/60 |
| Batch 4 gaps (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED nuevos |

## Ejecución 2026-06-21 gap-empalme batch 3 (run 27903532486-b3)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| ScanQRSheet title pill | VISUAL | Sí | `access/ScanQRSheet.tsx` | ScanLine h-10 ring; success/error h-10 rings |
| LocationSection map overlay | VISUAL | Sí | `venues/sections/LocationSection.tsx` | Loader2 geolocalizando; map shadow-sm |
| NotFound card shell | VISUAL | Sí | `pages/NotFound.tsx` | Card shadow-sm MapPinOff h-14 ring |
| AuthLogo shadow | VISUAL | Sí | `auth/AuthLogo.tsx` | shadow-sm gradient ring-primary/20 |
| TermsDialog title | VISUAL | Sí | `auth/TermsDialog.tsx` | ScrollText pill; font-extrabold title |
| KycContext export | Integración | Sí | `contexts/KycContext.tsx` | KycContextValue statusLabel/refresh API real |
| EventsPage discover header | Navegación | Sí | `pages/EventsPage.tsx` | Sticky Compass gradiente shadow-sm |
| AIAssistantView suggestions | VISUAL | Sí | `ai/AIAssistantView.tsx` | Chips shadow-sm border-border/60 |
| ChangeLocationSheet scroll | VISUAL | Sí | `feed/ChangeLocationSheet.tsx` | max-h-[90dvh]; ubicación card shadow-sm |
| PublishFlowModal banking | Bloqueo | Parcial | `events/PublishFlowModal.tsx` | BACKEND_REQUIRED; Megaphone bankForm pill |
| StoryViewer media failed | VISUAL | Sí | `feed/StoryViewer.tsx` | Sparkles h-14 ring empty/failed |
| KYC certification submit | Bloqueo | Parcial | `feed/KycCertificationView.tsx` | BACKEND_REQUIRED envío; pasos rings |
| MapPage shell | Navegación | Sí | `pages/MapPage.tsx` | bg-secondary; loading card ring |
| ProfileComments states | VISUAL | Sí | `feed/ProfileCommentsView.tsx` | h-14 rings loading/error/empty |
| EventDetailView retry | Integración | Sí | `events/EventDetailView.tsx` | Button rounded-full RefreshCw API |
| AdminRefundsPanel card | Navegación | Sí | `admin/AdminRefundsPanel.tsx` | Card shadow-sm AdminPaymentsTab |
| TicketPurchaseFlow hero | FRONTEND_LOGIC | Sí | `invitations/TicketPurchaseFlow.tsx` | Hero imagen; step 1→2; checkout RISKY |
| AdminReportsPanel card | Navegación | Sí | `admin/AdminReportsPanel.tsx` | Loading card shadow-sm; KPI wrapper |
| AdminPanelView shell | Navegación | Sí | `admin/AdminPanelView.tsx` | Card shadow-sm sobre AdminPanelPage |
| GlobalSearch posts | Bloqueo | Parcial | `feed/GlobalSearchView.tsx`, `SearchEventsPage.tsx` | BACKEND_REQUIRED tab posts; events empty ring |
| Batch 3 gaps (20) | Empalme | Sí | ver `decision-log.md` | 17 DONE + 3 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 2 (run 27903532486-b2)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| CreatePostSheet media | VISUAL | Sí | `feed/CreatePostSheet.tsx` | Drawer max-h; preview ring shadow-sm |
| EventPublished card | VISUAL | Sí | `pages/EventPublished.tsx` | Card shadow-sm PartyPopper h-14 ring |
| MyReservedServices loading | VISUAL | Sí | `purchases/MyReservedServicesView.tsx` | Card loading; retry rounded-full; row ring |
| ProfileGallery CTA | VISUAL | Sí | `feed/ProfileGallery.tsx` | shadow-sm overlays/save; ImagePlus pill |
| FeedHero stories dashed | VISUAL | Sí | `feed/FeedHero.tsx` | border-primary/25 loading/empty; Cambiar ring |
| NotificationsSheet cards | VISUAL | Sí | `feed/NotificationsSheet.tsx` | Error/empty card shells; outline retry |
| ReportPostDialog CTAs | VISUAL | Sí | `feed/ReportPostDialog.tsx` | font-bold title; rounded-full buttons |
| MessagesListView polish | VISUAL | Sí | `chat/MessagesListView.tsx` | h-10 header; private chat shadow-sm |
| EventLocationMap overlay | VISUAL | Sí | `events/EventLocationMap.tsx` | shadow-sm; Loader2 h-8; error card |
| MyInvitationsView fallback | VISUAL | Sí | `invitations/MyInvitationsView.tsx` | Image ring; heart ring; retry rounded-full |
| AccessControlListView stats | VISUAL | Sí | `access/AccessControlListView.tsx` | Loading card; stat tiles shadow-sm |
| FeedServicesCarousel skeleton | VISUAL | Sí | `feed/FeedServicesCarousel.tsx` | Skeleton row; empty border-primary/25 |
| FollowersSheet tabs | VISUAL | Sí | `feed/FollowersSheet.tsx` | max-w-lg; TabsList p-1 active shadow-sm |
| MyReservedVenues rows | VISUAL | Sí | `purchases/MyReservedVenuesView.tsx` | Loading card; border rows; icon ring |
| CommentsSheet drawer | VISUAL | Sí | `feed/CommentsSheet.tsx` | max-h; avatar primary/10; retry rounded-full |
| BookingReviewSheet terms | VISUAL | Sí | `services/BookingReviewSheet.tsx` | bg-secondary/40; terms shadow-sm |
| MyTicketsView tabs | VISUAL | Sí | `tickets/MyTicketsView.tsx` | max-w-lg; shadow-sm tabs/cards; Button explore |
| MediaUpload add tiles | VISUAL | Sí | `venues/MediaUpload.tsx` | border-primary/30; destructive remove chip |
| LocationSection header | VISUAL | Sí | `venues/sections/LocationSection.tsx` | extrabold+subtitle; empty border-primary/30 |
| EventInvitationModal send | VISUAL | Sí | `guests/EventInvitationModal.tsx` | CalendarDays fallback; Mail pill; rounded-full CTA |
| Batch 2 gaps (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27903532486-b1)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| FeedHero tokens DSF | VISUAL | Sí | `feed/FeedHero.tsx` | CATEGORY_CHIP_STYLES semánticos; Loader2 stories; MapPin h-10 ring |
| EventsView media fallback | VISUAL | Sí | `feed/EventsView.tsx` | CalendarDays h-14 ring sin imagen |
| FeedServicesCarousel error | FRONTEND_LOGIC | Sí | `feed/FeedServicesCarousel.tsx` | loadError/onRetry AlertCircle + RefreshCw |
| SeatingMapEditor header | VISUAL | Sí | `events/SeatingMapEditor.tsx` | Header pills ring; canvas vacío LayoutGrid h-14 |
| VenueCreator header | VISUAL | Sí | `venues/VenueCreator.tsx` | MapPinPlus pill ring-primary/20 |
| ServiceDetail sections | VISUAL | Sí | `services/ServiceDetailView.tsx` | SectionIcon ring en cards resumen |
| StepUnified empty/pricing | VISUAL | Sí | `services/StepUnified.tsx` | SectionHeader ring; cover/pricing h-14 empty |
| StepAccessControl gates | VISUAL | Sí | `events/StepAccessControl.tsx` | Gate card DoorOpen ring-primary/20 |
| RefundTicketFlow confirm | VISUAL | Sí | `tickets/RefundTicketFlow.tsx` | Confirm hero h-14 ring-primary/20 |
| EventPreviewModal shell | VISUAL | Sí | `events/EventPreviewModal.tsx` | Top bar pills; venue HomeIcon ring |
| AddGuestModal search UX | FRONTEND_LOGIC | Sí | `guests/AddGuestModal.tsx` | Empty Search h-14 ring; error AlertCircle + RefreshCw |
| MyPostsView rings | VISUAL | Sí | `feed/MyPostsView.tsx` | Error ring-2; empty FileText ring-primary/20 |
| ProfileGallery header/error | VISUAL | Sí | `feed/ProfileGallery.tsx` | ImagePlus pill; error block h-14 centrado |
| MyPurchasesView rows | VISUAL | Sí | `purchases/MyPurchasesView.tsx` | List row icons ring-primary/20 |
| MainInfoSection header | VISUAL | Sí | `venues/sections/MainInfoSection.tsx` | FileText rounded-xl ring pill |
| SeatLocationModal header | VISUAL | Sí | `tickets/SeatLocationModal.tsx` | MapPin pill en DialogTitle gradiente |
| CompanyContext export | Integración | Sí | `contexts/CompanyContext.tsx` | Export type CompanyContextValue |
| BankingHub delete/PayPal | Bloqueo | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED banner explícito dashboard |
| FeedBanner / HostPickerModal | Empalme | Sí | ver empalmes previos | Verificados alineados batch previo |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 5 (run 27902063419-b5)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| BankingForm cards | VISUAL | Sí | `banking/BankingForm.tsx` | Banner ring; method cards shadow-sm |
| PostCard ring | VISUAL | Sí | `feed/PostCard.tsx` | ring-primary/10; repost shadow-sm |
| SideMenu elevation | VISUAL | Sí | `feed/SideMenu.tsx` | shadow-xl drawer; perfil shadow-sm |
| CreateEventView header | VISUAL | Sí | `events/CreateEventView.tsx` | CalendarDays pill ring; sticky shadow-sm |
| MyVenuesView cards | VISUAL | Sí | `venues/MyVenuesView.tsx` | border-border/60 venue grid |
| BookingSheet header | VISUAL | Sí | `services/BookingSheet.tsx` | CalendarDays pill; AlertCircle preview |
| PaymentMethodsDashboard | VISUAL | Sí | `banking/PaymentMethodsDashboard.tsx` | Wallet h-12 ring header; rounded-full CTA |
| StepEventSummary accordion | VISUAL | Sí | `events/StepEventSummary.tsx` | FileText title; section icons ring |
| StepEventDetails header | VISUAL | Sí | `events/StepEventDetails.tsx` | CalendarDays pill ring header |
| StepAgenda timeline | VISUAL | Sí | `events/StepAgenda.tsx` | Header pill; dashed empty border-primary/25 |
| StepFaqs duplicate fix | FRONTEND_LOGIC | Sí | `events/StepFaqs.tsx` | HelpCircle pill; removed duplicate subheading |
| PaymentGatewaySheet title | VISUAL | Sí | `services/PaymentGatewaySheet.tsx` | CreditCard pill ring |
| ChatRoomView read-only | VISUAL | Sí | `chat/ChatRoomView.tsx` | AlertCircle banner; Megaphone fallback ring |
| GuestStatsView polish | VISUAL | Sí | `stats/GuestStatsView.tsx` | Header shadow-sm; channel rings |
| SeatingCategoryDialog | VISUAL | Sí | `venues/seating/SeatingCategoryDialog.tsx` | Preview shadow-sm; swatch ring-primary/20 |
| MyServicesView wizard | VISUAL | Sí | `services/MyServicesView.tsx` | Briefcase header pill |
| EditProfileView header | VISUAL | Sí | `feed/EditProfileView.tsx` | Settings2 ring; Loader2 company; primary CTA |
| GroupDropZone shell | VISUAL | Sí | `guests/GroupDropZone.tsx` | Card border shadow-sm; Users pill |
| ProfileView uploading | FRONTEND_LOGIC | Sí | `feed/ProfileView.tsx` | Loader2 overlay uploadingMedia; grid pills |
| TransferTicketFlow success | VISUAL | Sí | `tickets/TransferTicketFlow.tsx` | Ticket title pill; success ring-primary/20 |
| Batch 5 gaps (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED nuevos |

## Ejecución 2026-06-21 gap-empalme batch 4 (run 27902063419-b4)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| StoryViewer fullscreen | Integración | Sí | `feed/StoryViewer.tsx` | Loader2; progress animate-story-progress; APIs shared |
| AdminUsersPanel shell | Navegación | Sí | `admin/AdminUsersPanel.tsx` | AdminPanelSection + card shadow-sm |
| PaymentsPanel shell | Navegación | Sí | `admin/PaymentsPanel.tsx` | Badge Finanzas; card shadow-sm |
| StoriesContext API | Integración | Sí | `contexts/StoriesContext.tsx` | Export `StoriesContextValue`; sin mocks |
| NewUsersPanel shell | Navegación | Sí | `admin/NewUsersPanel.tsx` | Card shadow-sm verificado |
| SupportSearchPanel shell | Navegación | Sí | `admin/SupportSearchPanel.tsx` | Card shadow-sm verificado |
| AddStorySheet Sheet | FRONTEND_LOGIC | Sí | `CreateStorySheet.tsx`, `feed/AddStorySheet.tsx` | Sheet bottom Lovable; createStory API |
| EventSalesDetail stats | Integración | Sí | `admin/EventSalesDetail.tsx` | Delega SalesStatsView API real |
| useGuests bridge | Integración | Sí | `hooks/useGuests.ts` | Dual export useApiGuests documentado |
| index.css port-map | VISUAL | Sí | `index.css`, `lovable/index.css` | animate-fade-in-up; story-progress |
| VenueDetails map card | VISUAL | Sí | `venues/detail/VenueDetails.tsx` | shadow-sm ubicación |
| ChatSettings header | VISUAL | Sí | `chat/ChatSettingsSheet.tsx` | Settings h-10 ring header |
| MentionText hover | VISUAL | Sí | `feed/MentionText.tsx` | text-primary/90 hover |
| CreateFAB rings | VISUAL | Sí | `feed/CreateFAB.tsx` | ring-primary/20 iconos |
| StepEventLocation empty | VISUAL | Sí | `events/StepEventLocation.tsx` | Home h-14 ring verificado batch previo |
| StepRefundPolicy cards | VISUAL | Sí | `events/StepRefundPolicy.tsx` | border-border/60 shadow-sm |
| DraggableGuestCard ring | VISUAL | Sí | `guests/DraggableGuestCard.tsx` | ring-border/40 card |
| GroupDropZone empty | VISUAL | Sí | `guests/GroupDropZone.tsx` | Users/Plus h-14 ring empty |
| SalesStatsView header | VISUAL | Sí | `stats/SalesStatsView.tsx` | Gradiente shadow-sm top bar |
| SuccessModal shadow | VISUAL | Sí | `banking/SuccessModal.tsx` | DialogContent shadow-sm |
| Batch 4 gaps (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 3 (run 27902063419-b3)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| EventInvitationModal header | VISUAL | Sí | `guests/EventInvitationModal.tsx` | CalendarDays h-10 ring; RefreshCw retry; Users empty h-14 |
| VenueDetail shell | Navegación | Sí | `pages/VenueDetail.tsx` | Sticky Building2 gradiente shadow-sm + PlaceDetailPage |
| ScanQR feedback | Integración | Sí | `access/ScanQRSheet.tsx` | shadow-sm; rings success/error; scanTicketFromQr |
| NotFound 404 | VISUAL | Sí | `pages/NotFound.tsx` | MapPinOff h-14 ring verificado intacto |
| AuthLogo gradient | VISUAL | Sí | `auth/AuthLogo.tsx` | Sparkles ring-primary/20 verificado |
| TermsDialog header | VISUAL | Sí | `auth/TermsDialog.tsx` | ScrollText h-10 ring verificado |
| KycContext flags | Integración | Sí | `contexts/KycContext.tsx` | refreshKyc; canSubmitDocuments false |
| EventsPage discover | Navegación | Sí | `pages/EventsPage.tsx` | Loading card shadow-sm; bg-secondary pb-24 |
| AIAssistantView header | VISUAL | Sí | `ai/AIAssistantView.tsx` | Sparkles h-10 ring header |
| ChangeLocation header | VISUAL | Sí | `feed/ChangeLocationSheet.tsx` | MapPin h-10 ring verificado |
| PublishFlow banking | Bloqueo | Parcial | `events/PublishFlowModal.tsx` | BACKEND_REQUIRED onSubmitBank banner |
| KYC certification submit | Bloqueo | Parcial | `feed/KycCertificationView.tsx` | BACKEND_REQUIRED envío; pasos rings RefreshCw |
| ProfileComments error | VISUAL | Sí | `feed/ProfileCommentsView.tsx` | h-14 rings + RefreshCw verificado |
| EventDetailView retry | Integración | Sí | `events/EventDetailView.tsx` | fetchEventDetail + RefreshCw verificado |
| MapPage loading | Integración | Sí | `pages/MapPage.tsx`, `feed/MapView.tsx` | Loader2 h-14 ring card; empty/error rings |
| AdminRefundsPanel shell | Navegación | Sí | `admin/AdminRefundsPanel.tsx` | Header gradiente shadow-sm |
| TicketPurchaseFlow checkout | FRONTEND_LOGIC | Sí | `invitations/TicketPurchaseFlow.tsx` | ShieldCheck; redirect checkout RISKY |
| AdminReportsPanel shell | Navegación | Sí | `admin/AdminReportsPanel.tsx` | Loader2 + gradiente shadow-sm |
| AdminPanelView shell | Navegación | Sí | `admin/AdminPanelView.tsx` | Shield header pb-24 shadow-sm |
| GlobalSearch posts | Bloqueo | Parcial | `feed/GlobalSearchView.tsx`, `SearchEventsPage.tsx` | BACKEND_REQUIRED tab posts; Search header ring |
| Batch 3 gaps (20) | Empalme | Sí | ver `decision-log.md` | 17 DONE + 3 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 2 (run 27902063419-b2)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| ContactImportModal empty | VISUAL | Sí | `guests/ContactImportModal.tsx` | UserPlus h-14 ring-primary/20 |
| TicketDetailView order card | VISUAL | Sí | `tickets/TicketDetailView.tsx` | shadow-sm orden única |
| NotificationsSheet badge | VISUAL | Sí | `feed/NotificationsSheet.tsx` | Bell h-10 ring + contador unread |
| EventLocationMap loading | VISUAL | Sí | `events/EventLocationMap.tsx` | MapPin ring + Loader2 overlay |
| StoryViewersSheet viewers | Bloqueo | Parcial | `feed/StoryViewersSheet.tsx` | BACKEND_REQUIRED viewers API |
| NotificationsContext hasUnread | Integración | Sí | `contexts/NotificationsContext.tsx` | Alias `hasUnread` derivado |
| EventPublished share API | Integración | Sí | `pages/EventPublished.tsx` | fetchEventById + share intacto |
| MyReservedServicesView | Integración | Sí | `purchases/MyReservedServicesView.tsx` | Loader2 + rings error/empty verificados |
| CreatePostSheet location | VISUAL | Sí | `feed/CreatePostSheet.tsx` | MapPin Lucide sin emoji |
| ReportPostDialog shadow | VISUAL | Sí | `feed/ReportPostDialog.tsx` | DialogContent shadow-sm |
| MyInvitationsView retry | VISUAL | Sí | `invitations/MyInvitationsView.tsx` | RefreshCw Reintentar |
| MessagesListView cards | VISUAL | Sí | `chat/MessagesListView.tsx` | shadow-sm cards conversación |
| AccessControlListView | Integración | Sí | `access/AccessControlListView.tsx` | Verificado intacto batch previo |
| FollowersSheet header | VISUAL | Sí | `feed/FollowersSheet.tsx` | Users h-10 ring-primary/20 |
| MyReservedVenuesView | Integración | Sí | `purchases/MyReservedVenuesView.tsx` | Verificado intacto batch previo |
| CommentsSheet retry | VISUAL | Sí | `feed/CommentsSheet.tsx` | RefreshCw Reintentar |
| BookingReviewSheet | VISUAL | Sí | `services/BookingReviewSheet.tsx` | Calendar header ring verificado |
| MyTicketsView fallback | VISUAL | Sí | `tickets/MyTicketsView.tsx` | Ticket h-14 ring sin media |
| LocationSection header | VISUAL | Sí | `venues/sections/LocationSection.tsx` | MapPin h-10 ring header |
| MediaUpload header | VISUAL | Sí | `venues/MediaUpload.tsx` | ImageIcon h-10 ring verificado |
| Batch 2 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27902063419-b1)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| ResetPassword routing | RISKY | Sí | `App.tsx`, `pages/ResetPassword.tsx`, `ResetPasswordView.tsx` | `/auth/reset-password` → Lovable; Cognito/shared |
| SignUp embedded | RISKY | Sí | `SignUpView.tsx`, `CreateAccountPage.tsx`, `SignUpPage.tsx` | embedded sin chrome duplicado mfe-auth |
| index.css port-map | VISUAL | Sí | `packages/shell/src/index.css`, `lovable/index.css` | Re-export DSF + floating-action-button |
| SeatingMapEditor shapes | VISUAL | Sí | `events/SeatingMapEditor.tsx` | ImageIcon Lucide en picker |
| FeedBanner | VISUAL | Sí | `feed/FeedBanner.tsx` | Megaphone ring verificado intacto |
| BankingHub delete | Bloqueo | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED delete/PayPal |
| VenueCreator FAB | VISUAL | Sí | `venues/VenueCreator.tsx` | floating-action-button CSS definido |
| ServiceDetailView | VISUAL | Sí | `services/ServiceDetailView.tsx` | Briefcase ring verificado |
| RefundTicketFlow | VISUAL | Sí | `tickets/RefundTicketFlow.tsx` | h-14 rings verificado |
| HostPickerModal header | VISUAL | Sí | `events/HostPickerModal.tsx` | UserPlus ring-primary/20 |
| StepUnified | VISUAL | Sí | `services/StepUnified.tsx` | Briefcase empty ring verificado |
| FeedServicesCarousel | VISUAL | Sí | `feed/FeedServicesCarousel.tsx` | Loader2 + empty ring verificado |
| EventsView chips | VISUAL | Sí | `feed/EventsView.tsx` | Tokens semánticos DSF |
| AddGuestModal search | VISUAL | Sí | `guests/AddGuestModal.tsx` | Loader2 búsqueda |
| EventPreviewModal | VISUAL | Sí | `events/EventPreviewModal.tsx` | Eye ring verificado |
| StepAccessControl MapPin | VISUAL | Sí | `events/StepAccessControl.tsx` | MapPin Lucide sin emoji |
| CompanyContext | Integración | Sí | `contexts/CompanyContext.tsx` | accountTypeLabel verificado |
| SeatLocationModal | VISUAL | Sí | `tickets/SeatLocationModal.tsx` | Loader2 + rings verificado |
| MyPurchasesView | Integración | Sí | `purchases/MyPurchasesView.tsx` | Retry + empty ring verificado |
| MainInfoSection | VISUAL | Sí | `venues/sections/MainInfoSection.tsx` | FileText ring verificado |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-21 agent-27903532486 (prepare cb27c830)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| Manifiesto sin UI | Validación | Sí | — | changedFiles reglasDiseno only; hasUiChanges false |
| ReglasDiseno tokens | VISUAL | Sí | `lovable/index.css` | DSF v2.1 --primary/--success/--warning referencia |
| ReglasDiseno breakpoints | VISUAL | Sí | `tailwind.config.ts` | container 2xl 1400px; sin copy YAML |
| Batch 6 reconciliación | Empalme | Sí | ver `gap-empalme-27902063419-b6` | 17 DONE + 3 BACKEND_REQUIRED; similitud ~98% |
| Build devaws | Validación | Sí | — | npm run build:devaws SUCCESS |
| Anti-mock pages | Bloqueo | Sí | `packages/shell/src/pages/` | grep sin coincidencias runtime |

## Ejecución 2026-06-21 gap-empalme batch 6 (run 27902063419-b6)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| SalesStatsView empty | VISUAL | Sí | `stats/SalesStatsView.tsx` | Ticket h-14 ring-primary/20 verificado |
| FeedVenuesCarousel empty | VISUAL | Sí | `feed/FeedVenuesCarousel.tsx` | Building2 ring-primary/20 verificado |
| StepFaqs empty | VISUAL | Sí | `events/StepFaqs.tsx` | HelpCircle h-14 ring verificado |
| AdminRefundsPanel shell | Navegación | Sí | `admin/AdminRefundsPanel.tsx` | Header gradiente Lovable verificado |
| AdminReportsPanel shell | Navegación | Sí | `admin/AdminReportsPanel.tsx` | Loader2 + gradiente verificado |
| RefundsView tokens | VISUAL | Sí | `stats/RefundsView.tsx` | pending secondary; empty ring verificado |
| AccessControlView loading | Integración | Sí | `stats/AccessControlView.tsx` | Loader2; ShieldCheck; empty verificado |
| PublishFlowModal icon | VISUAL | Sí | `events/PublishFlowModal.tsx` | Megaphone ring-primary/20 verificado |
| FeedServicesCarousel empty | VISUAL | Sí | `feed/FeedServicesCarousel.tsx` | Briefcase ring-primary/20 verificado |
| GuestStatsView empty | VISUAL | Sí | `stats/GuestStatsView.tsx` | Users ring-primary/20 verificado |
| StepRefundPolicy header | VISUAL | Sí | `events/StepRefundPolicy.tsx` | ShieldCheck h-10 ring header polish |
| PaymentGateway PSP | Bloqueo | Parcial | `services/PaymentGatewaySheet.tsx` | BACKEND_REQUIRED AlertCircle |
| EventsPage discover shell | Navegación | Sí | `pages/EventsPage.tsx` | pb-24 + Loader2 lucide verificado |
| StoryViewersSheet API | Bloqueo | Parcial | `feed/StoryViewersSheet.tsx` | BACKEND_REQUIRED viewers |
| KYC submit | Bloqueo | Parcial | `feed/KycCertificationView.tsx` | BACKEND_REQUIRED documentado |
| Batch 6 gaps (20) | Empalme | Sí | ver `decision-log.md` | 17 DONE + 3 BACKEND_REQUIRED; similitud ~98% |

## Ejecución 2026-06-21 gap-empalme batch 5 (run 27901296255-b5)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| StoriesContext loadError | Integración | Sí | `contexts/StoriesContext.tsx` | `useStories` alias; loadErrorMessage/isEmpty/authorCount |
| VenueReservationDetail badge | VISUAL | Sí | `purchases/VenueReservationDetail.tsx` | Loader2 card; error h-14 ring + RefreshCw |
| KYC certification submit | Bloqueo | Parcial | `feed/KycCertificationView.tsx` | BACKEND_REQUIRED envío documentos; status rings h-14 |
| EventPublished share API | Integración | Sí | `pages/EventPublished.tsx` | fetchEventById + PartyPopper h-14 ring |
| NotFound 404 icon | VISUAL | Sí | `pages/NotFound.tsx` | MapPinOff h-14 ring-primary/20 |
| ForgotPassword APIs | RISKY | Sí | `auth/ForgotPasswordView.tsx`, `pages/ForgotPassword.tsx` | Loader2; CheckCircle2 ring éxito; APIs shared |
| ResetPassword Cognito | RISKY | Sí | `auth/ResetPasswordView.tsx`, `pages/ResetPassword.tsx` | ShieldAlert/CheckCircle2 rings; token real shared |
| FeedBanner dismissible | VISUAL | Sí | `feed/FeedBanner.tsx` | Megaphone h-10 ring-primary/20 |
| AdminPanelView shell | Navegación | Sí | `admin/AdminPanelView.tsx` | Shield header gradiente + AdminPanelPage |
| MyPosts loading/retry | Integración | Sí | `feed/MyPostsView.tsx` | Loader2 + error h-14 ring + RefreshCw |
| StoryViewer fullscreen | VISUAL | Sí | `components/StoryViewer.tsx` | Sparkles empty h-14 ring + barras progreso |
| AddGuestModal tabs | VISUAL | Sí | `guests/AddGuestModal.tsx` | UserPlus header h-10 ring; TabsList rounded-xl |
| useGuests bridge | Integración | Sí | `hooks/useGuests.ts` | Re-export useApiGuests dual export documentado |
| LoginView Cognito | RISKY | Sí | `auth/LoginView.tsx`, `pages/Login.tsx` | Lock header ring; APIs shared sin mocks |
| TicketPurchaseFlow checkout | FRONTEND_LOGIC | Sí | `invitations/TicketPurchaseFlow.tsx` | Redirect checkout + Ticket ring + Loader2 |
| Admin panels badges | VISUAL | Sí | `admin/*Panel.tsx`, `AdminPanelSection.tsx` | Headers h-10 ring-primary/20 |
| SignUpView shell | Navegación | Sí | `auth/SignUpView.tsx`, `pages/SignUp.tsx` | UserPlus ring + card mfe-auth + link login |
| VenueDetail shell | Navegación | Sí | `pages/VenueDetail.tsx` | Sticky Building2 header + pb-24 PlaceDetailPage |
| Batch 5 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 4 (run 27901296255-b4)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| MainInfoSection header | VISUAL | Sí | `venues/sections/MainInfoSection.tsx` | FileText h-10 ring; parking shadow-sm card |
| StoryViewersSheet skeleton | Bloqueo | Parcial | `feed/StoryViewersSheet.tsx` | BACKEND_REQUIRED viewers API; skeleton shadow-sm |
| PaymentMethodsDashboard cards | VISUAL | Parcial | `banking/PaymentMethodsDashboard.tsx` | BACKEND_REQUIRED delete; Clock/AlertCircle h-14 rings |
| MediaUpload header | VISUAL | Sí | `venues/MediaUpload.tsx` | ImageIcon h-10 ring-primary/20 |
| ScanQR feedback | Integración | Sí | `access/ScanQRSheet.tsx` | Success/error h-10 ring primary/destructive |
| ReportPostDialog header | VISUAL | Sí | `feed/ReportPostDialog.tsx` | Flag h-10 ring-destructive/20 |
| BookingReviewSheet header | VISUAL | Sí | `services/BookingReviewSheet.tsx` | Calendar h-10 ring-primary/20 |
| BankingHub error retry | Integración | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED delete/PayPal; RefreshCw retry |
| FeedHero location ring | VISUAL | Sí | `feed/FeedHero.tsx` | MapPin ring-primary-foreground/20 |
| AccessControlListView error | Integración | Sí | `access/AccessControlListView.tsx` | h-14 ring-destructive/20 + RefreshCw |
| MyPurchases retry | Integración | Sí | `purchases/MyPurchasesView.tsx` | h-14 ring-destructive/20 + RefreshCw |
| MyReservedServices error | Integración | Sí | `purchases/MyReservedServicesView.tsx` | h-14 ring-destructive/20 + RefreshCw |
| KycContext flags | Integración | Sí | `contexts/KycContext.tsx` | isInReview/isRejected derivados API |
| TermsDialog header | VISUAL | Sí | `auth/TermsDialog.tsx` | ScrollText h-10 ring-primary/20 |
| MyReservedVenues error | Integración | Sí | `purchases/MyReservedVenuesView.tsx` | h-14 ring-destructive/20 + RefreshCw |
| ChangeLocation header | VISUAL | Sí | `feed/ChangeLocationSheet.tsx` | MapPin h-10 ring-primary/20 |
| ProfileComments error | VISUAL | Sí | `feed/ProfileCommentsView.tsx` | h-14 ring-destructive/20 + RefreshCw |
| ServiceReservationDetail loading | VISUAL | Sí | `purchases/ServiceReservationDetail.tsx` | Loading card shadow-sm |
| CompanyContext label | Integración | Sí | `contexts/CompanyContext.tsx` | accountTypeLabel Personal/Empresa |
| GlobalSearch posts | Bloqueo | Parcial | `feed/GlobalSearchView.tsx` | BACKEND_REQUIRED tab posts; error ring + RefreshCw |
| Batch 4 gaps (20) | Empalme | Sí | ver `decision-log.md` | 16 DONE + 4 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 3 (run 27901296255-b3)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| LocationSection empty map | VISUAL | Sí | `venues/sections/LocationSection.tsx` | bg-card shadow-sm; MapPin h-14 ring |
| MyTicketsView empty/error | VISUAL | Sí | `tickets/MyTicketsView.tsx` | ring-primary/20 y ring-destructive/20 |
| StepAccessControl gate empty | VISUAL | Sí | `events/StepAccessControl.tsx` | UserPlus h-14 ring por puerta |
| MessagesListView search UX | VISUAL | Sí | `chat/MessagesListView.tsx` | Loader2/AlertCircle/Search rings; loading card |
| CommentsSheet empty/error | VISUAL | Sí | `feed/CommentsSheet.tsx` | MessageSquare/AlertCircle h-14 ring |
| ProfileView experience bar | VISUAL | Sí | `feed/ProfileView.tsx` | Verificado gradiente primary intacto |
| EventsView EmptyHint | VISUAL | Sí | `feed/EventsView.tsx` | h-14 ring-primary/20 + shadow-sm |
| TicketDetailView media fallback | VISUAL | Sí | `tickets/TicketDetailView.tsx` | Ticket h-14 ring sin imagen |
| AuthLogo gradient ring | VISUAL | Sí | `auth/AuthLogo.tsx` | ring-primary/20 |
| NotificationsContext isEmpty | Integración | Sí | `contexts/NotificationsContext.tsx` | Verificado loadErrorMessage + isEmpty |
| SuccessModal icon | VISUAL | Sí | `banking/SuccessModal.tsx` | Verificado CheckCircle2 h-14 ring |
| CreatePostSheet header | VISUAL | Sí | `feed/CreatePostSheet.tsx` | Verificado PenLine h-10 ring |
| PreferencesRefundSection cards | VISUAL | Sí | `venues/sections/PreferencesRefundSection.tsx` | Verificado shadow-sm cards |
| FavoritesView empty/error | VISUAL | Sí | `feed/FavoritesView.tsx` | EmptyTab rings; Places primary tokens |
| VenueCreator publish | VISUAL | Sí | `venues/VenueCreator.tsx` | Loader2 en publicar |
| MyInvitationsView empty | VISUAL | Sí | `invitations/MyInvitationsView.tsx` | Ticket/AlertCircle h-14 ring |
| SeatLocationModal loading | VISUAL | Sí | `tickets/SeatLocationModal.tsx` | Loader2 h-8 card shadow-sm |
| FeedServicesCarousel loading | VISUAL | Sí | `feed/FeedServicesCarousel.tsx` | Loader2; shadow-sm cards |
| AIAssistantView entity card | VISUAL | Sí | `ai/AIAssistantView.tsx` | CheckCircle2 ring-success/20 |
| EventDetailView retry | Integración | Sí | `events/EventDetailView.tsx` | Cards shadow-sm; CalendarDays/AlertCircle rings |
| Batch 3 gaps (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 2 (run 27901296255-b2)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| NotificationsSheet empty/error | VISUAL | Sí | `feed/NotificationsSheet.tsx` | Bell h-14 ring; AlertCircle + RefreshCw |
| ServiceDetailView empty | VISUAL | Sí | `services/ServiceDetailView.tsx` | Briefcase ring-primary/20 |
| CreateEventView publish | VISUAL | Sí | `events/CreateEventView.tsx` | Loader2 header publicación |
| TransferTicketFlow UX | VISUAL | Sí | `tickets/TransferTicketFlow.tsx` | Ticket empty ring; Loader2 search/submit |
| EditProfileView password | Bloqueo | Parcial | `feed/EditProfileView.tsx` | BACKEND_REQUIRED; Loader2 guardar |
| ProfileGallery empty | VISUAL | Sí | `feed/ProfileGallery.tsx` | ImagePlus h-14 ring-primary/20 |
| StepEventSummary empties | VISUAL | Sí | `events/StepEventSummary.tsx` | access/FAQ/agenda h-14 ring; Loader2 publish |
| VenueDetailReservation addons | VISUAL | Sí | `venues/VenueDetailReservation.tsx` | Briefcase empty ring-primary/20 |
| RefundTicketFlow tokens | VISUAL | Sí | `tickets/RefundTicketFlow.tsx` | h-14 ring ineligible/success/policy; Loader2 |
| TopHeader avatar | VISUAL | Sí | `feed/TopHeader.tsx` | Verificado ring-primary/20 intacto |
| BookingSheet add-ons | Bloqueo | Parcial | `services/BookingSheet.tsx` | BACKEND_REQUIRED catálogo; empty ring |
| FollowersSheet empty | VISUAL | Sí | `feed/FollowersSheet.tsx` | Users h-14 ring-primary/20 tabs |
| AIAssistantFAB PRO | VISUAL | Sí | `ai/AIAssistantFAB.tsx` | Verificado ring-primary/20 intacto |
| ContactImportModal empty | VISUAL | Sí | `guests/ContactImportModal.tsx` | UserPlus h-14 ring-primary/20 |
| MessagesListView empty | VISUAL | Sí | `chat/MessagesListView.tsx` | MessageSquare h-14 ring-primary/20 |
| PublishFlowModal banking | Bloqueo | Parcial | `events/PublishFlowModal.tsx` | BACKEND_REQUIRED; error/success ring |
| StepEventDetails loading | Integración | Sí | `events/StepEventDetails.tsx` | Loader2 catálogos API real |
| StatsEventListView empty | VISUAL | Sí | `stats/StatsEventListView.tsx` | h-14 ring empty/error |
| PaymentGatewaySheet PSP | Bloqueo | Parcial | `services/PaymentGatewaySheet.tsx` | BACKEND_REQUIRED; success h-14 ring |
| FAQSection empty | VISUAL | Sí | `venues/sections/FAQSection.tsx` | Verificado canonical ring intacto |
| Batch 2 gaps (20) | Empalme | Sí | ver `decision-log.md` | 16 DONE + 4 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27901296255-b1)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| StepAgenda empty ring | VISUAL | Sí | `events/StepAgenda.tsx` | CalendarDays h-14 ring-primary/20 |
| MyServicesView tokens | VISUAL | Sí | `services/MyServicesView.tsx` | warning tokens; empty h-14 ring |
| GuestStatsView error ring | VISUAL | Sí | `stats/GuestStatsView.tsx` | AlertCircle ring-destructive/20 |
| SeatingCategoryDialog header | VISUAL | Sí | `venues/seating/SeatingCategoryDialog.tsx` | Armchair ring-primary/20 |
| EventLocationMap error | VISUAL | Sí | `events/EventLocationMap.tsx` | h-14 ring-destructive/20 |
| GuestManagementView empty | VISUAL | Sí | `guests/GuestManagementView.tsx` | Users h-14 ring-primary/20 |
| HostPickerModal search UX | VISUAL | Sí | `events/HostPickerModal.tsx` | h-14 ring; error destructive |
| MyEventsView tokens | VISUAL | Sí | `feed/MyEventsView.tsx` | warning borrador; empty ring |
| BankingForm persistencia | Bloqueo | Parcial | `banking/BankingForm.tsx` | BACKEND_REQUIRED SWIFT/PayPal |
| SuccessModal icon | VISUAL | Sí | `banking/SuccessModal.tsx` | CheckCircle2 h-14 ring |
| PrivateChatView empty | VISUAL | Sí | `chat/PrivateChatView.tsx` | MessageSquare ring-primary/20 |
| InvitationEventDetail hero | VISUAL | Sí | `invitations/InvitationEventDetailView.tsx` | ring; bg-card/90 play |
| StepUnified prerequisite | VISUAL | Sí | `services/StepUnified.tsx` | Briefcase ring-primary/20 |
| StepEventLocation venues | VISUAL | Sí | `events/StepEventLocation.tsx` | Home empty ring |
| EventPreviewModal preview | VISUAL | Sí | `events/EventPreviewModal.tsx` | ring; bg-card/90 play |
| SideMenu profile ring | VISUAL | Sí | `feed/SideMenu.tsx` | Verificado intacto |
| ChatRoomView empty | VISUAL | Sí | `chat/ChatRoomView.tsx` | MessageSquare h-14 ring |
| PostCard card ring | VISUAL | Sí | `feed/PostCard.tsx` | ring-border/40 verificado |
| MyVenuesView tokens | VISUAL | Sí | `venues/MyVenuesView.tsx` | warning; empty ring |
| MapView pins/error | VISUAL | Sí | `feed/MapView.tsx` | ring empty; error h-14 |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 6 (run 27901296255-b6)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| SalesStatsView empty | VISUAL | Sí | `stats/SalesStatsView.tsx` | Ticket h-14 ring-primary/20 |
| FeedVenuesCarousel empty | VISUAL | Sí | `feed/FeedVenuesCarousel.tsx` | Building2 ring-primary/20 |
| StepFaqs empty | VISUAL | Sí | `events/StepFaqs.tsx` | HelpCircle h-14 ring |
| AdminRefundsPanel shell | Navegación | Sí | `admin/AdminRefundsPanel.tsx` | Header gradiente Lovable |
| AdminReportsPanel shell | Navegación | Sí | `admin/AdminReportsPanel.tsx` | Loader2 + gradiente |
| RefundsView tokens | VISUAL | Sí | `stats/RefundsView.tsx` | pending secondary; empty ring |
| AccessControlView loading | Integración | Sí | `stats/AccessControlView.tsx` | Loader2; ShieldCheck; empty |
| PublishFlowModal icon | VISUAL | Sí | `events/PublishFlowModal.tsx` | Megaphone ring-primary/20 |
| FeedServicesCarousel empty | VISUAL | Sí | `feed/FeedServicesCarousel.tsx` | Briefcase ring-primary/20 |
| GuestStatsView empty | VISUAL | Sí | `stats/GuestStatsView.tsx` | Users ring-primary/20 |
| StepRefundPolicy header | VISUAL | Sí | `events/StepRefundPolicy.tsx` | ShieldCheck título |
| PaymentGateway PSP | Bloqueo | Parcial | `services/PaymentGatewaySheet.tsx` | BACKEND_REQUIRED AlertCircle |
| EventsPage discover shell | Navegación | Sí | `pages/EventsPage.tsx` | pb-24 + Loader2 lucide |
| StoryViewersSheet API | Bloqueo | Parcial | `feed/StoryViewersSheet.tsx` | BACKEND_REQUIRED viewers |
| KYC submit | Bloqueo | Parcial | `feed/KycCertificationView.tsx` | BACKEND_REQUIRED documentado |
| Batch 6 gaps (20) | Empalme | Sí | ver `decision-log.md` | 17 DONE + 3 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 5 (run 27883333029-b5)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| StoriesContext loadError | Integración | Sí | `contexts/StoriesContext.tsx` | loadErrorMessage, isEmpty, authorCount |
| VenueReservationDetail badge | VISUAL | Sí | `purchases/VenueReservationDetail.tsx` | Chip status + AlertCircle retry |
| KYC certification submit | Bloqueo | Parcial | `feed/KycCertificationView.tsx` | BACKEND_REQUIRED envío documentos |
| EventPublished share API | Integración | Sí | `pages/EventPublished.tsx` | fetchEventById + share intacto |
| NotFound 404 icon | VISUAL | Sí | `pages/NotFound.tsx` | MapPinOff + anillo primary/20 |
| ForgotPassword APIs | RISKY | Sí | `auth/ForgotPasswordView.tsx`, `pages/ForgotPassword.tsx` | Loader2; APIs shared |
| ResetPassword Cognito | RISKY | Sí | `auth/ResetPasswordView.tsx`, `pages/ResetPassword.tsx` | Loader2; token real shared |
| FeedBanner dismissible | VISUAL | Sí | `feed/FeedBanner.tsx` | CTA KYC en SocialWallTab |
| AdminPanelView shell | Navegación | Sí | `admin/AdminPanelView.tsx` | Header gradiente + AdminPanelPage |
| MyPosts loading/retry | Integración | Sí | `feed/MyPostsView.tsx` | Loader2 + AlertCircle + empty primary |
| StoryViewer fullscreen | VISUAL | Sí | `components/StoryViewer.tsx` | Sparkles empty + barras progreso |
| AddGuestModal tabs | VISUAL | Sí | `guests/AddGuestModal.tsx` | TabsList rounded-xl + UserPlus |
| useGuests bridge | Integración | Sí | `hooks/useGuests.ts` | Re-export useApiGuests documentado |
| LoginView Cognito | RISKY | Sí | `auth/LoginView.tsx`, `pages/Login.tsx` | Loader2; APIs shared sin mocks |
| TicketPurchaseFlow checkout | FRONTEND_LOGIC | Sí | `invitations/TicketPurchaseFlow.tsx` | Redirect checkout + Loader2 |
| Admin panels badges | VISUAL | Sí | `admin/*Panel.tsx`, `AdminPanelSection.tsx` | Headers Lovable con badge |
| SignUpView shell | Navegación | Sí | `auth/SignUpView.tsx`, `pages/SignUp.tsx` | Título + card mfe-auth + link login |
| VenueDetail shell | Navegación | Sí | `pages/VenueDetail.tsx` | pb-24 aria-label sobre PlaceDetailPage |
| Batch 5 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-20 gap-empalme batch 4 (run 27883333029-b4)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| PaymentMethodsDashboard cards | VISUAL | Parcial | `banking/PaymentMethodsDashboard.tsx` | BACKEND_REQUIRED delete; empty ring-primary/20 |
| MediaUpload empty | VISUAL | Sí | `venues/MediaUpload.tsx` | FileUp h-14 ring-primary/20 |
| FAQSection empty | VISUAL | Sí | `venues/sections/FAQSection.tsx` | HelpCircle h-14 ring |
| ScanQR feedback | Integración | Sí | `access/ScanQRSheet.tsx` | AlertCircle cámara; rounded-2xl; Reintentar |
| StoryViewersSheet skeleton | Bloqueo | Parcial | `feed/StoryViewersSheet.tsx` | BACKEND_REQUIRED viewers API |
| BookingReviewSheet términos | VISUAL | Sí | `services/BookingReviewSheet.tsx` | Loader2; AlertCircle; shadow-sm |
| BankingHub banner | VISUAL | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED PayPal/delete |
| FeedHero stories | VISUAL | Sí | `feed/FeedHero.tsx` | shadow-sm categorías; Sparkles ring |
| ReportPostDialog destructive | VISUAL | Sí | `feed/ReportPostDialog.tsx` | Loader2; rounded-2xl; shadow-sm radios |
| AccessControlListView empty | VISUAL | Sí | `access/AccessControlListView.tsx` | shadow-sm cards; Shield ring |
| MyPurchases retry | Integración | Sí | `purchases/MyPurchasesView.tsx` | Loader2; empty Ticket ring |
| MyReservedServices | Integración | Sí | `purchases/MyReservedServicesView.tsx` | Loader2; login/empty ring |
| MyReservedVenues | Integración | Sí | `purchases/MyReservedVenuesView.tsx` | Loader2; login/empty ring |
| KycContext isEmpty | Integración | Sí | `contexts/KycContext.tsx` | needsCertification derivado |
| TermsDialog privacidad | VISUAL | Sí | `auth/TermsDialog.tsx` | rounded-2xl shadow-sm |
| GlobalSearch posts | Bloqueo | Parcial | `feed/GlobalSearchView.tsx` | BACKEND_REQUIRED tab posts |
| VenueDetail shell | Navegación | Sí | `pages/VenueDetail.tsx` | pb-24 aria-label intacto |
| ChangeLocation inline | VISUAL | Sí | `feed/ChangeLocationSheet.tsx` | shadow-sm card ubicación |
| ProfileComments banner | VISUAL | Sí | `feed/ProfileCommentsView.tsx` | MessageSquare ring empty |
| ServiceReservationDetail | VISUAL | Sí | `purchases/ServiceReservationDetail.tsx` | Loader2; rings error/empty |
| Batch 4 gaps (20) | Empalme | Sí | ver `decision-log.md` | 16 DONE + 4 BACKEND_REQUIRED |

## Ejecución 2026-06-20 gap-empalme batch 3 (run 27883333029-b3)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| EventInvitationModal tokens | VISUAL | Sí | `guests/EventInvitationModal.tsx` | AlertCircle error; accent en correos; badge Nuevo success |
| LocationSection shadow | VISUAL | Sí | `venues/sections/LocationSection.tsx` | shadow-sm card; empty MapPin ring |
| MyTicketsView tabs | VISUAL | Sí | `tickets/MyTicketsView.tsx` | Verificado intacto batch previo |
| StepAccessControl ring | VISUAL | Sí | `events/StepAccessControl.tsx` | DoorOpen h-14 ring-primary/20 |
| EventsView CTA/stars | VISUAL | Sí | `feed/EventsView.tsx` | CTA h-14; estrellas primary; bg-background/90 |
| CommentsSheet header | VISUAL | Sí | `feed/CommentsSheet.tsx` | MessageSquare h-10 ring-primary/20 |
| ProfileView experience | VISUAL | Sí | `feed/ProfileView.tsx` | Barra gradiente primary |
| TicketDetailView chips | VISUAL | Sí | `tickets/TicketDetailView.tsx` | Verificado intacto |
| AuthLogo gradient | VISUAL | Sí | `auth/AuthLogo.tsx` | Verificado intacto |
| NotificationsContext isEmpty | Integración | Sí | `contexts/NotificationsContext.tsx` | loadErrorMessage + isEmpty |
| CreatePostSheet header | VISUAL | Sí | `feed/CreatePostSheet.tsx` | PenLine h-10 ring-primary/20 |
| PreferencesRefundSection | VISUAL | Sí | `venues/sections/PreferencesRefundSection.tsx` | Verificado shadow-sm cards |
| FavoritesView status | VISUAL | Sí | `feed/FavoritesView.tsx` | Verificado ProfileSectionBanner |
| MyInvitationsView empty | VISUAL | Sí | `invitations/MyInvitationsView.tsx` | Ticket icon empty state |
| VenueCreator header | VISUAL | Sí | `venues/VenueCreator.tsx` | MapPinPlus en título sticky |
| SeatLocationModal error | VISUAL | Sí | `tickets/SeatLocationModal.tsx` | AlertCircle h-14; empty Armchair ring |
| FeedServicesCarousel tokens | VISUAL | Sí | `feed/FeedServicesCarousel.tsx` | bg-background/90 heart button |
| AIAssistantView entity | VISUAL | Sí | `ai/AIAssistantView.tsx` | CheckCircle2; Loader2; Button shadcn |
| EventDetailView API | Integración | Sí | `events/EventDetailView.tsx` | Verificado retry API intacto |
| MainInfoSection card | VISUAL | Sí | `venues/sections/MainInfoSection.tsx` | shadow-sm; stepper primary |
| Batch 3 gaps (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED |

## Ejecución 2026-06-20 gap-empalme batch 2 (run 27883333029-b2)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| ProfileGallery error/retry | Integración | Sí | `feed/ProfileGallery.tsx` | AlertCircle + Loader2 carga |
| EditGuestModal header | VISUAL | Sí | `guests/EditGuestModal.tsx` | UserRound + rounded-2xl shadow-sm |
| ServiceDetailView empty/CTA | VISUAL | Sí | `services/ServiceDetailView.tsx` | Círculo primary; bg-primary-foreground |
| NotificationsSheet title | VISUAL | Sí | `feed/NotificationsSheet.tsx` | Bell en DrawerTitle |
| EditProfileView password/gustos | Bloqueo | Parcial | `feed/EditProfileView.tsx` | BACKEND_REQUIRED banners |
| StepAccessControl empty gates | VISUAL | Sí | `events/StepAccessControl.tsx` | DoorOpen h-14 primary |
| TransferTicketFlow empty | VISUAL | Sí | `tickets/TransferTicketFlow.tsx` | AlertCircle círculo primary |
| CreateEventView wizard title | VISUAL | Sí | `events/CreateEventView.tsx` | font-extrabold + CalendarDays |
| StepEventSummary | Empalme | Sí | `events/StepEventSummary.tsx` | Intacto prepare 77da574b |
| VenueDetailReservation calendar | VISUAL | Sí | `venues/VenueDetailReservation.tsx` | Loader2 disponibilidad |
| RefundTicketFlow tokens | VISUAL | Sí | `tickets/RefundTicketFlow.tsx` | Verificado batch previo |
| TopHeader search/avatar | VISUAL | Sí | `feed/TopHeader.tsx` | Verificado intacto |
| BookingSheet add-ons | Bloqueo | Parcial | `services/BookingSheet.tsx` | BACKEND_REQUIRED catálogo |
| FollowersSheet tabs | VISUAL | Sí | `feed/FollowersSheet.tsx` | TabsList rounded-xl |
| ContactImportModal device | FRONTEND_LOGIC | Sí | `guests/ContactImportModal.tsx` | Disabled sin soporte |
| AIAssistantFAB PRO | VISUAL | Sí | `ai/AIAssistantFAB.tsx` | Verificado intacto |
| MessagesListView loading | VISUAL | Sí | `chat/MessagesListView.tsx` | Verificado Loader2 |
| PublishFlowModal banking | Bloqueo | Parcial | `events/PublishFlowModal.tsx` | BACKEND_REQUIRED onSubmitBank |
| StepEventDetails header | VISUAL | Sí | `events/StepEventDetails.tsx` | CalendarDays intacto |
| StatsEventListView error | VISUAL | Sí | `stats/StatsEventListView.tsx` | AlertCircle + Loader2 |
| Batch 2 gaps (20) | Empalme | Sí | ver `decision-log.md` | 17 DONE + 3 BACKEND_REQUIRED |

## Ejecución 2026-06-20 gap-empalme batch 1 (run 27883333029-b1)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| GuestStatsView error/retry | Integración | Sí | `stats/GuestStatsView.tsx`, `useLiveEventStats.ts` | loadError + AlertCircle |
| GuestStatsView channel icons | VISUAL | Sí | `stats/GuestStatsView.tsx` | Círculo primary en canales |
| StepAgenda empty h-14 | VISUAL | Sí | `events/StepAgenda.tsx` | CalendarDays círculo primary |
| MyServicesView reviews empty | VISUAL | Sí | `services/MyServicesView.tsx` | Star círculo primary |
| SeatingCategoryDialog rounded | VISUAL | Sí | `venues/seating/SeatingCategoryDialog.tsx` | Dialog rounded-2xl |
| EventLocationMap AlertCircle | VISUAL | Sí | `events/EventLocationMap.tsx` | Error parity Lovable |
| HostPickerModal reference | Integración | Sí | `events/HostPickerModal.tsx` | Intacto batch previo |
| GuestManagementView Loader2 | VISUAL | Sí | `guests/GuestManagementView.tsx` | Carga centrada |
| MyEventsView reviews empty | VISUAL | Sí | `feed/MyEventsView.tsx` | MessageSquare primary |
| SuccessModal primary | VISUAL | Sí | `banking/SuccessModal.tsx` | CheckCircle2 primary |
| InvitationEventDetail hero | VISUAL | Sí | `invitations/InvitationEventDetailView.tsx` | CalendarDays círculo |
| StepUnified geo Loader2 | VISUAL | Sí | `services/StepUnified.tsx` | Spinner en botones geo |
| StepEventLocation venues | VISUAL | Sí | `events/StepEventLocation.tsx` | Loader2 + Home empty |
| EventPreviewModal preview | VISUAL | Sí | `events/EventPreviewModal.tsx` | Mapa no interactivo |
| SideMenu profile ring | VISUAL | Sí | `feed/SideMenu.tsx` | Ring primary-foreground/15 |
| ChatRoomView empty border | VISUAL | Sí | `chat/ChatRoomView.tsx` | Dashed primary/25 |
| BankingForm persistencia | Bloqueo | Parcial | `banking/BankingForm.tsx` | BACKEND_REQUIRED banner |
| MyVenuesView reviews empty | VISUAL | Sí | `venues/MyVenuesView.tsx` | MessageSquare primary |
| PostCard card ring | VISUAL | Sí | `feed/PostCard.tsx` | ring-border/40 |
| MapView Loader2/AlertCircle | VISUAL | Sí | `feed/MapView.tsx` | Empty MapPin círculo |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-20 prepare-77da574b (run 27883333029)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| StepEventSummary FAQ empty | VISUAL | Sí | `events/StepEventSummary.tsx` | HelpCircle círculo primary + copy |
| StepEventSummary agenda empty | VISUAL | Sí | `events/StepEventSummary.tsx` | Clock círculo primary + copy wizard |
| StepEventSummary access empty | VISUAL | Sí | `events/StepEventSummary.tsx` | ShieldCheck círculo primary |
| StepEventSummary acordeón border | VISUAL | Sí | `events/StepEventSummary.tsx` | `border-border` paridad cards Lovable |
| Manifiesto vacío 38e2c759 | Validación | Sí | — | Sin diff UI; build:devaws OK |
| Prepare 77da574b (1 gap) | Empalme | Sí | ver `decision-log.md` | 1 DONE + 0 BACKEND_REQUIRED |

## Ejecución 2026-06-20 gap-empalme batch 5 (run 27876831237-b5)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| ProfileCommentsView banner | VISUAL | Sí | `feed/ProfileCommentsView.tsx` | ProfileSectionBanner + empty primary |
| StoriesContext loadError | Integración | Sí | `contexts/StoriesContext.tsx` | `loadErrorMessage`, `isEmpty`, `authorCount` |
| VenueReservationDetail badge | VISUAL | Sí | `purchases/VenueReservationDetail.tsx` | Chip status + AlertCircle retry |
| KYC certification submit | Bloqueo | Parcial | `feed/KycCertificationView.tsx` | BACKEND_REQUIRED envío documentos |
| EventPublished share API | Integración | Sí | `pages/EventPublished.tsx` | `fetchEventById` + share intacto |
| NotFound 404 icon | VISUAL | Sí | `pages/NotFound.tsx` | MapPinOff + anillo primary/20 |
| ForgotPassword APIs | RISKY | Sí | `auth/ForgotPasswordView.tsx`, `pages/ForgotPassword.tsx` | Re-export vista Lovable |
| ResetPassword Cognito | RISKY | Sí | `auth/ResetPasswordView.tsx`, `pages/ResetPassword.tsx` | Token real shared |
| FeedBanner dismissible | VISUAL | Sí | `feed/FeedBanner.tsx` | CTA KYC en SocialWallTab |
| AdminPanelView shell | Navegación | Sí | `admin/AdminPanelView.tsx` | Header gradiente + AdminPanelPage |
| MyPosts loading/retry | Integración | Sí | `feed/MyPostsView.tsx` | Loader2 + AlertCircle + empty primary |
| StoryViewer fullscreen | VISUAL | Sí | `components/StoryViewer.tsx` | Sparkles empty + barras progreso |
| AddGuestModal tabs | VISUAL | Sí | `guests/AddGuestModal.tsx` | TabsList rounded-xl + UserPlus |
| useGuests bridge | Integración | Sí | `hooks/useGuests.ts` | Re-export useApiGuests documentado |
| LoginView Cognito | RISKY | Sí | `auth/LoginView.tsx`, `pages/Login.tsx` | APIs shared sin mocks |
| TicketPurchaseFlow checkout | FRONTEND_LOGIC | Sí | `invitations/TicketPurchaseFlow.tsx` | Redirect checkout + loading |
| Admin panels badges | VISUAL | Sí | `admin/*Panel.tsx`, `AdminPanelSection.tsx` | Headers Lovable con badge |
| SignUpView shell | Navegación | Sí | `auth/SignUpView.tsx`, `pages/SignUp.tsx` | Título + card mfe-auth + link login |
| Batch 5 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-20 gap-empalme batch 4 (run 27876831237-b4)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| PaymentMethodsDashboard cards | VISUAL | Parcial | `banking/PaymentMethodsDashboard.tsx` | BACKEND_REQUIRED delete; empty primary circle |
| BookingReviewSheet términos | VISUAL | Sí | `services/BookingReviewSheet.tsx` | ShieldCheck card secondary |
| FAQSection / MediaUpload | VISUAL | Sí | `venues/sections/*`, `MediaUpload.tsx` | shadow-sm cards |
| ScanQR feedback | Integración | Sí | `access/ScanQRSheet.tsx` | Tokens primary/destructive + Reintentar |
| BankingHub banner | VISUAL | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED delete; conteo métodos |
| ReportPostDialog destructive | VISUAL | Sí | `feed/ReportPostDialog.tsx` | Shield descripción + variant destructive |
| KycContext isEmpty | Integración | Sí | `contexts/KycContext.tsx` | Flag derivado expuesto |
| FeedHero stories | VISUAL | Sí | `feed/FeedHero.tsx` | Primary pulse + Ver todas historias |
| GlobalSearch empty/error | VISUAL | Parcial | `feed/GlobalSearchView.tsx` | BACKEND_REQUIRED tab posts |
| MyReserved* / MyPurchases | Integración | Sí | `purchases/*View.tsx` | Empty círculo primary + AlertCircle retry |
| TermsDialog privacidad | VISUAL | Sí | `auth/TermsDialog.tsx` | CheckCircle2 CTA |
| ChangeLocation Navigation2 | VISUAL | Sí | `feed/ChangeLocationSheet.tsx` | Icono Localízame |
| StoryViewersSheet skeleton | Bloqueo | Parcial | `feed/StoryViewersSheet.tsx` | BACKEND_REQUIRED viewers API |
| VenueDetail shell | Navegación | Sí | `pages/VenueDetail.tsx` | pb-24 Lovable intacto |
| CompanyContext isEmpty | Integración | Sí | `contexts/CompanyContext.tsx` | hasCompany + isEmpty |
| ServiceReservationDetail error | VISUAL | Sí | `purchases/ServiceReservationDetail.tsx` | AlertCircle + empty primary |
| AccessControlListView empty | VISUAL | Sí | `access/AccessControlListView.tsx` | Shield círculo primary |
| Batch 4 gaps (20) | Empalme | Sí | ver `decision-log.md` | 16 DONE + 4 BACKEND_REQUIRED |

## Ejecución 2026-06-20 gap-empalme batch 3 (run 27876831237-b3)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| RefundTicketFlow tokens | VISUAL | Sí | `tickets/RefundTicketFlow.tsx` | Badge primary; check primary-foreground |
| EventInvitationModal success | VISUAL | Sí | `guests/EventInvitationModal.tsx` | Banner primary; badge Nuevo success |
| MyTicketsView tabs | VISUAL | Sí | `tickets/MyTicketsView.tsx` | Dot success/secondary; countdown secondary |
| MyInvitationsView cards | VISUAL | Sí | `invitations/MyInvitationsView.tsx` | Border Lovable; empty Ticket icon |
| CommentsSheet header | VISUAL | Sí | `feed/CommentsSheet.tsx` | MessageSquare en círculo primary |
| EventsView filter pills | VISUAL | Sí | `feed/EventsView.tsx` | Dots primary/accent/success |
| ProfileView experience bar | VISUAL | Sí | `feed/ProfileView.tsx` | Gradiente primary; iconos menú tokens |
| CreatePostSheet header | VISUAL | Sí | `feed/CreatePostSheet.tsx` | PenLine icon header |
| TicketDetailView chips | VISUAL | Sí | `tickets/TicketDetailView.tsx` | Pendiente secondary; check primary-foreground |
| NotificationsContext loadErrorMessage | Integración | Sí | `contexts/NotificationsContext.tsx` | Alias expuesto en contexto |
| FavoritesView status | VISUAL | Sí | `feed/FavoritesView.tsx` | Próximamente secondary |
| VenueCreator header | VISUAL | Sí | `venues/VenueCreator.tsx` | font-extrabold + shadow sticky |
| AuthLogo gradient | VISUAL | Sí | `auth/AuthLogo.tsx` | Sparkles + ring primary |
| SeatLocationModal empty | VISUAL | Sí | `tickets/SeatLocationModal.tsx` | Círculo primary sin asiento |
| FeedServicesCarousel tokens | VISUAL | Sí | `feed/FeedServicesCarousel.tsx` | Distancia y estrellas primary |
| AIAssistantView entity card | VISUAL | Sí | `ai/AIAssistantView.tsx` | CreatedEntityCard success tokens |
| LocationSection empty | VISUAL | Sí | `venues/sections/LocationSection.tsx` | MapPin ring primary |
| MainInfoSection stepper | VISUAL | Sí | `venues/sections/MainInfoSection.tsx` | Botones aforo primary |
| PreferencesRefundSection cards | VISUAL | Sí | `venues/sections/PreferencesRefundSection.tsx` | shadow-sm cards |
| EventDetailView API | Integración | Sí | `events/EventDetailView.tsx` | Verificado intacto retry API |
| Batch 3 gaps (20) | Empalme | Sí | ver `decision-log.md` | 20 DONE + 0 BACKEND_REQUIRED |

## Ejecución 2026-06-20 gap-empalme batch 2 (run 27876831237-b2)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| PostCard repost StoryAvatar | VISUAL | Sí | `feed/PostCard.tsx` | Anillos historia en repost embebido |
| ProfileGallery viewer tokens | VISUAL | Sí | `feed/ProfileGallery.tsx` | Controles `background/20` fullscreen |
| ServiceDetailView MapPin | VISUAL | Sí | `services/ServiceDetailView.tsx` | Ubicación sin emoji |
| NotificationsSheet tokens | VISUAL | Sí | `feed/NotificationsSheet.tsx` | Secondary en lugar de amber; «Ver lugar» |
| TransferTicketFlow success | VISUAL | Sí | `tickets/TransferTicketFlow.tsx` | `text-primary-foreground` en check |
| FollowersSheet respond API | Integración | Sí | `feed/FollowersSheet.tsx` | `respondFollowRequest` aceptar |
| PublishFlowModal anti-sim | Bloqueo | Parcial | `events/PublishFlowModal.tsx` | BACKEND_REQUIRED onSubmitBank |
| PaymentGateway PSP banner | Bloqueo | Parcial | `services/PaymentGatewaySheet.tsx` | BACKEND_REQUIRED PSP |
| ContactImportModal disabled | FRONTEND_LOGIC | Sí | `guests/ContactImportModal.tsx` | Sin contactos si no soportado |
| StatsEventListView badge | VISUAL | Sí | `stats/StatsEventListView.tsx` | Status chip rounded-full |
| EditProfileView password | Bloqueo | Parcial | `feed/EditProfileView.tsx` | BACKEND_REQUIRED |
| BookingSheet add-ons | Bloqueo | Parcial | `services/BookingSheet.tsx` | BACKEND_REQUIRED catálogo |
| Batch 2 gaps (20) | Empalme | Sí | ver `decision-log.md` | 16 DONE + 4 BACKEND_REQUIRED |

## Ejecución 2026-06-20 gap-empalme batch 1 (run 27876831237-b1)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| GuestStatsView empty primary | VISUAL | Sí | `stats/GuestStatsView.tsx` | Icono Users en círculo primary |
| EventLocationMap retry | Integración | Sí | `events/EventLocationMap.tsx` | Reintentar carga Google Maps |
| MapView retry | Integración | Sí | `feed/MapView.tsx` | Banner error + Reintentar |
| HostPickerModal retry | Integración | Sí | `events/HostPickerModal.tsx` | AlertCircle + Reintentar búsqueda |
| MyVenuesView tokens | VISUAL | Sí | `venues/MyVenuesView.tsx` | amber-500/15 + Loader2 opiniones |
| BankingForm persistencia | Bloqueo | Parcial | `banking/BankingForm.tsx` | BACKEND_REQUIRED SWIFT/PayPal |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-20 prepare-a8b70853 (run 27876831237)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| StepEventSummary PULEP | VISUAL | Sí | `events/StepEventSummary.tsx` | Card resumen Ley 1493 |
| StepEventSummary categorías | VISUAL | Sí | `events/StepEventSummary.tsx` | Precios desde seatingMap |
| TicketDetailView header | VISUAL | Sí | `tickets/TicketDetailView.tsx` | Título + chip status + fecha compra |
| TicketDetailView countdown | FRONTEND_LOGIC | Sí | `tickets/TicketDetailView.tsx` | `useReservationTimer` API real |
| ticketsData anti-mock | Bloqueo | Sí | `data/ticketsData.ts` | Solo tipos; sin store mock |
| TicketDetailPage wiring | Integración | Sí | `pages/TicketDetailPage.tsx` | `resolveOrderExpiresAtTs` + precio |

## Ejecución 2026-06-20 gap-empalme batch 5 (run 27876228669-b5)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| StoriesContext loadError | Integración | Sí | `contexts/StoriesContext.tsx` | `loadErrorMessage`, `isEmpty`, `authorCount` |
| VenueReservationDetail badge | VISUAL | Sí | `purchases/VenueReservationDetail.tsx` | Chip status en header gradiente |
| NotFound 404 icon | VISUAL | Sí | `pages/NotFound.tsx` | MapPinOff + anillo primary |
| KYC certification submit | Bloqueo | Parcial | `feed/KycCertificationView.tsx` | BACKEND_REQUIRED envío documentos |
| EventPublished share API | Integración | Sí | `pages/EventPublished.tsx` | `fetchEventById` + share (batch previo intacto) |
| ResetPassword Lovable shell | RISKY | Sí | `auth/ResetPasswordView.tsx`, `pages/ResetPassword.tsx` | Cognito/shared sin mfe-auth CSS legacy |
| ServiceReservationDetail badge | VISUAL | Sí | `purchases/ServiceReservationDetail.tsx` | Paridad con venue detail |
| ForgotPassword APIs | RISKY | Sí | `auth/ForgotPasswordView.tsx`, `pages/ForgotPassword.tsx` | Re-export vista Lovable |
| FeedBanner dismissible | VISUAL | Sí | `feed/FeedBanner.tsx` | CTA KYC (batch previo intacto) |
| MyPosts loading/retry | Integración | Sí | `feed/MyPostsView.tsx`, `ProfilePublicationsPage.tsx` | Loader2 + AlertCircle |
| StoryViewer fullscreen | VISUAL | Sí | `components/StoryViewer.tsx` | Sparkles empty + barras progreso |
| AddGuestModal tabs | VISUAL | Sí | `guests/AddGuestModal.tsx` | TabsList rounded-xl |
| AdminPanelView shell | Navegación | Sí | `admin/AdminPanelView.tsx` | Wrapper Lovable sobre AdminPanelPage |
| useGuests bridge | Integración | Sí | `hooks/useGuests.ts` | Re-export `useApiGuests` documentado |
| LoginView Cognito | RISKY | Sí | `auth/LoginView.tsx`, `pages/Login.tsx` | APIs shared sin mocks |
| TicketPurchaseFlow checkout | FRONTEND_LOGIC | Sí | `invitations/TicketPurchaseFlow.tsx` | Redirect checkout + loading |
| Admin panels badges | VISUAL | Sí | `admin/*Panel.tsx`, `AdminPanelSection.tsx` | Headers Lovable con badge |
| SignUpView shell | Navegación | Sí | `auth/SignUpView.tsx`, `pages/SignUp.tsx` | Título + card mfe-auth |
| Batch 5 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-20 gap-empalme batch 4 (run 27876228669-b4)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| AccessControlListView banner | VISUAL | Sí | `access/AccessControlListView.tsx`, `AccessControlPage.tsx` | ProfileSectionBanner + error/retry |
| PaymentMethodsDashboard CTA | VISUAL | Parcial | `banking/PaymentMethodsDashboard.tsx` | BACKEND_REQUIRED delete |
| BookingReviewSheet cancel | VISUAL | Sí | `services/BookingReviewSheet.tsx` | Cancelar + confirmError |
| FAQSection / MediaUpload | VISUAL | Sí | `venues/sections/*`, `MediaUpload.tsx` | Empty primary + límite 12 |
| ScanQR retry | Integración | Sí | `access/ScanQRSheet.tsx` | Input shadcn + Reintentar |
| BankingHub banner | VISUAL | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED delete |
| ReportPostDialog destructive | VISUAL | Sí | `feed/ReportPostDialog.tsx` | Error inline + variant destructive |
| KycContext loadErrorMessage | Integración | Sí | `contexts/KycContext.tsx` | Mensaje error expuesto |
| FeedHero stories empty | VISUAL | Sí | `feed/FeedHero.tsx` | Card Sparkles |
| GlobalSearch empty/error | VISUAL | Parcial | `feed/GlobalSearchView.tsx` | BACKEND_REQUIRED tab posts |
| MyReserved* / MyPurchases | Integración | Sí | `purchases/*View.tsx` | Tokens primary + AlertCircle retry |
| TermsDialog privacidad | VISUAL | Sí | `auth/TermsDialog.tsx` | Sección §7 |
| ChangeLocation inline error | VISUAL | Sí | `feed/ChangeLocationSheet.tsx` | Loader2 + error persistente |
| StoryViewersSheet skeleton | Bloqueo | Parcial | `feed/StoryViewersSheet.tsx` | BACKEND_REQUIRED viewers API |
| KycCertificationView banner | Bloqueo | Parcial | `feed/KycCertificationView.tsx` | BACKEND_REQUIRED submit |
| VenueDetail shell | Navegación | Sí | `pages/VenueDetail.tsx` | pb-24 Lovable |
| CompanyContext loadErrorMessage | Integración | Sí | `contexts/CompanyContext.tsx` | Mensaje error expuesto |
| Batch 4 gaps (20) | Empalme | Sí | ver `decision-log.md` | 16 DONE + 4 BACKEND_REQUIRED |

## Ejecución 2026-06-20 gap-empalme batch 3 (run 27876228669-b3)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| MyTickets error/retry | Integración | Sí | `tickets/MyTicketsView.tsx`, `TicketsPage.tsx` | loadError inline + Reintentar |
| MyInvitations wire | Integración | Sí | `MyInvitationsPage.tsx` | loadError/onRetry sin loader full-page |
| TicketDetail tokens | VISUAL | Sí | `tickets/TicketDetailView.tsx` | Overlay reembolso destructive |
| LocationSection empty | VISUAL | Sí | `venues/sections/LocationSection.tsx` | Icono primary en círculo |
| EventsView Ver más | Navegación | Sí | `feed/EventsView.tsx`, `EventsPage.tsx` | Lugares y proveedores |
| FavoritesView banner | VISUAL | Sí | `feed/FavoritesView.tsx` | ProfileSectionBanner + error/retry |
| CommentsSheet error | VISUAL | Sí | `feed/CommentsSheet.tsx` | AlertCircle + Button |
| NotificationsSheet tokens | VISUAL | Sí | `feed/NotificationsSheet.tsx` | Sin green/emerald hardcoded |
| FeedServicesCarousel empty | VISUAL | Sí | `feed/FeedServicesCarousel.tsx` | Icono Briefcase en círculo |
| BankingHub header | VISUAL | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED delete |
| SeatLocationModal badges | VISUAL | Sí | `tickets/SeatLocationModal.tsx` | Tokens primary/secondary |
| Batch 3 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-20 gap-empalme batch 2 (run 27876228669-b2)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| ProfileGallery retry | Integración | Sí | `feed/ProfileGallery.tsx` | onRetry + RefreshCw |
| PostCard badge primary | VISUAL | Sí | `feed/PostCard.tsx` | bg-primary/10 + borde card |
| ServiceDetailView empty | VISUAL | Sí | `services/ServiceDetailView.tsx` | Briefcase + estrellas primary |
| StepAccessControl tokens | VISUAL | Sí | `events/StepAccessControl.tsx` | success/primary; empty UserPlus |
| EditGuestModal header | VISUAL | Sí | `guests/EditGuestModal.tsx` | UserRound icon |
| CreateEventView title | VISUAL | Sí | `events/CreateEventView.tsx` | CalendarDays + modo crear/editar |
| EditProfileView plan | Bloqueo | Parcial | `feed/EditProfileView.tsx` | BACKEND_REQUIRED password/gustos |
| TransferTicketFlow tokens | VISUAL | Sí | `tickets/TransferTicketFlow.tsx` | Sin emerald/amber |
| AIAssistantFAB PRO badge | VISUAL | Sí | `ai/AIAssistantFAB.tsx` | Token primary |
| VenueDetailReservation calendar | VISUAL | Sí | `venues/VenueDetailReservation.tsx` | primary/destructive |
| TopHeader search card | VISUAL | Sí | `feed/TopHeader.tsx` | Botón búsqueda card |
| BookingSheet add-ons | Bloqueo | Parcial | `services/BookingSheet.tsx` | BACKEND_REQUIRED catálogo |
| FollowersSheet loading | VISUAL | Sí | `feed/FollowersSheet.tsx` | Users header + Loader2 |
| PublishFlowModal banking | Bloqueo | Parcial | `events/PublishFlowModal.tsx` | BACKEND_REQUIRED onSubmitBank |
| TicketDetailView badges | VISUAL | Sí | `tickets/TicketDetailView.tsx` | Tokens primary |
| ContactImportModal header | VISUAL | Sí | `guests/ContactImportModal.tsx` | UserPlus icon |
| StatsEventListView tokens | VISUAL | Sí | `stats/StatsEventListView.tsx` | Status + opciones primary |
| MessagesListView loading | VISUAL | Sí | `chat/MessagesListView.tsx` | Loader2 + status tokens |
| RefundTicketFlow tokens | VISUAL | Sí | `tickets/RefundTicketFlow.tsx` | Sin amber/emerald |
| StepEventDetails header | VISUAL | Sí | `events/StepEventDetails.tsx` | CalendarDays icon |
| Batch 2 gaps (20) | Empalme | Sí | ver `decision-log.md` | 17 DONE + 3 BACKEND_REQUIRED |

## Ejecución 2026-06-20 gap-empalme batch 1 (run 27876228669-b1)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| GuestStatsView tokens | VISUAL | Sí | `stats/GuestStatsView.tsx` | Header + chart primary + skeleton |
| PrivateChatView online | VISUAL | Sí | `chat/PrivateChatView.tsx` | bg-success + empty MessageSquare |
| EventLocationMap rounded | VISUAL | Sí | `events/EventLocationMap.tsx` | rounded-2xl + pulse |
| StepAgenda empty icon | VISUAL | Sí | `events/StepAgenda.tsx` | CalendarDays empty state |
| MyServicesView badges | VISUAL | Sí | `services/MyServicesView.tsx` | Tokens primary/amber |
| SeatingCategoryDialog header | VISUAL | Sí | `venues/seating/SeatingCategoryDialog.tsx` | Armchair + preview card |
| StepEventSummary FAQ/agenda empty | VISUAL | Sí | `events/StepEventSummary.tsx` | HelpCircle/Clock icons |
| HostPickerModal search UX | VISUAL | Sí | `events/HostPickerModal.tsx` | Loader2 + empty icons |
| GuestManagementView login | VISUAL | Sí | `guests/GuestManagementView.tsx` | Empty login con CTA |
| MyEventsView status chips | VISUAL | Sí | `feed/MyEventsView.tsx` | amber-500/15 tokens |
| SuccessModal rounded | VISUAL | Sí | `banking/SuccessModal.tsx` | rounded-2xl + rounded-full CTA |
| InvitationEventDetail hero | VISUAL | Sí | `invitations/InvitationEventDetailView.tsx` | CalendarDays fallback |
| StepUnified prerequisite | VISUAL | Sí | `services/StepUnified.tsx` | Briefcase empty card |
| EventPreviewModal ES copy | VISUAL | Sí | `events/EventPreviewModal.tsx` | Público/Privado + Eye header |
| StepEventLocation skeleton | VISUAL | Sí | `events/StepEventLocation.tsx` | Pulse venues + Home empty |
| SideMenu soporte active | VISUAL | Sí | `feed/SideMenu.tsx` | Imports limpios |
| EditProfileView header | Bloqueo | Parcial | `feed/EditProfileView.tsx` | BACKEND_REQUIRED password/gustos |
| BankingForm primary CTAs | Bloqueo | Parcial | `banking/BankingForm.tsx` | BACKEND_REQUIRED SWIFT/PayPal |
| ChatRoomView empty messages | VISUAL | Sí | `chat/ChatRoomView.tsx` | MessageSquare empty |
| MapView pin tokens | VISUAL | Sí | `feed/MapView.tsx` | CSS vars + pulse load |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 18 DONE + 2 BACKEND_REQUIRED |

## Ejecución 2026-06-20 agent-ef7b3dfd + batch 6 (run 27876228669)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| PULEP Colombia YAML | FRONTEND_LOGIC | Sí | `reglasActuacion/eventos/pulep-colombia.yml` | Ley 1493 artes escénicas |
| PULEP campos formulario | FRONTEND_LOGIC | Sí | `eventFormData.ts`, `pulepColombia.ts` | Validación UI sin mocks |
| PULEP StepEventDetails | VISUAL | Sí | `events/StepEventDetails.tsx` | Card + campos obligatorios |
| PULEP CreateEventView | FRONTEND_LOGIC | Sí | `events/CreateEventView.tsx` | Bloqueo paso 1 + fechas |
| PULEP persistencia | Bloqueo | Parcial | DoEventsBack | BACKEND_REQUIRED |
| SalesStatsView empty | VISUAL | Sí | `stats/SalesStatsView.tsx` | Empty + tokens primary |
| FeedVenuesCarousel | VISUAL | Sí | `feed/FeedVenuesCarousel.tsx` | Skeleton + empty |
| StepFaqs empty | VISUAL | Sí | `events/StepFaqs.tsx` | Icono HelpCircle |
| EventLocationMap | VISUAL | Sí | `events/EventLocationMap.tsx` | Loading/error overlay |
| SignUpView layout | VISUAL | Sí | `auth/SignUpView.tsx` | AuthLogo + card mfe-auth |
| GuestStatsView empty | VISUAL | Sí | `stats/GuestStatsView.tsx` | Sin canales |
| RefundsView tokens | VISUAL | Sí | `stats/RefundsView.tsx` | Sin emerald hardcoded |
| Batch 6 gaps (18) | Empalme | Sí | ver `decision-log.md` | 18 DONE + PULEP BACKEND_REQUIRED |

## Ejecución 2026-06-20 gap-empalme batch 5 (run 27850000711-b5)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| LoginView Lovable + APIs | RISKY | Sí | `auth/LoginView.tsx`, `App.tsx` | Cognito/shared sin mocks |
| SignUpView shell | Navegación | Sí | `auth/SignUpView.tsx`, `pages/SignUp.tsx` | Formulario real mfe-auth |
| TicketPurchaseFlow resumen | FRONTEND_LOGIC | Sí | `invitations/TicketPurchaseFlow.tsx` | Checkout tras confirmación |
| KYC pasos upload | Bloqueo | Parcial | `feed/KycCertificationView.tsx` | BACKEND_REQUIRED envío |
| AdminPanelSection headers | VISUAL | Sí | `admin/*Panel.tsx` | Headers Lovable |
| FeedBanner dismissible | VISUAL | Sí | `feed/FeedBanner.tsx`, `SocialWallTab.tsx` | CTA KYC sin mocks |
| MyPosts ProfileSectionBanner | VISUAL | Sí | `feed/MyPostsView.tsx` | Banner + empty state |
| MyReserved* tokens primary | VISUAL | Sí | `purchases/MyReserved*View.tsx` | Sin colores hardcoded |
| Index / VenueDetail shell | Navegación | Sí | `pages/Index.tsx`, `VenueDetail.tsx` | Layout Lovable |
| EventPublished badge | VISUAL | Sí | `pages/EventPublished.tsx` | Anillo éxito + share API |
| useGuests bridge docs | Integración | Sí | `hooks/useGuests.ts` | Re-export useApiGuests |
| AddGuestModal título | VISUAL | Sí | `guests/AddGuestModal.tsx` | Icono UserPlus |
| Batch 5 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-20 gap-empalme batch 4 (run 27850000711-b4)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| PaymentMethodsDashboard cards | VISUAL | Parcial | `banking/PaymentMethodsDashboard.tsx` | BACKEND_REQUIRED delete |
| BookingReviewSheet términos | VISUAL | Sí | `services/BookingReviewSheet.tsx` | Copy + total Lovable |
| FAQSection / MediaUpload headers | VISUAL | Sí | `venues/sections/*`, `MediaUpload.tsx` | Iconos + empty states |
| ReportPostDialog selección | VISUAL | Sí | `feed/ReportPostDialog.tsx` | Radio activo con borde primary |
| ScanQR feedback tokens | VISUAL | Sí | `access/ScanQRSheet.tsx` | Sin emerald hardcoded |
| FeedHero story skeleton | VISUAL | Sí | `feed/FeedHero.tsx` | Avatares pulse en carga |
| KycContext loadError | Integración | Sí | `contexts/KycContext.tsx` | Estado error expuesto |
| TermsDialog secciones | VISUAL | Sí | `auth/TermsDialog.tsx` | Pagos + PI; scroll gradiente |
| MyPurchases retry | Integración | Sí | `purchases/MyPurchasesView.tsx` | Reintento en error |
| ChangeLocation card | VISUAL | Sí | `feed/ChangeLocationSheet.tsx` | Ubicación actual visible |
| StoryViewersSheet | Bloqueo | Parcial | `feed/StoryViewersSheet.tsx` | BACKEND_REQUIRED viewers API |
| CompanyContext loadError | Integración | Sí | `contexts/CompanyContext.tsx` | Flag derivado de fetch |
| EventPublished nombre API | Integración | Sí | `pages/EventPublished.tsx` | `fetchEventById` + share |
| ProfileComments Loader | VISUAL | Sí | `feed/ProfileCommentsView.tsx` | Loader + reintento |
| Reservation detail fix | Bloqueo | Sí | `purchases/*ReservationDetail.tsx` | Import Button + retry |
| StoriesContext loadError | Integración | Sí | `contexts/StoriesContext.tsx` | Error en fetch rings |
| NotFound 404 ring | VISUAL | Sí | `pages/NotFound.tsx` | Anillo primary |
| GlobalSearch posts | Bloqueo | Parcial | `feed/GlobalSearchView.tsx` | BACKEND_REQUIRED tab posts |
| Batch 4 gaps (20) | Empalme | Sí | ver `decision-log.md` | 17 DONE + 3 BACKEND_REQUIRED |

## Ejecución 2026-06-20 gap-empalme batch 3 (run 27850000711-b3)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| EventInvitationModal retry | Integración | Sí | `guests/EventInvitationModal.tsx` | `loadEvents` + reintento |
| LocationSection empty map | VISUAL | Sí | `venues/sections/LocationSection.tsx` | Sin coords → empty state |
| MyInvitationsView error | Integración | Sí | `invitations/MyInvitationsView.tsx` | `loadError`/`onRetry` |
| EventsView skeleton | VISUAL | Sí | `feed/EventsView.tsx` | Carga inicial + empty publicados |
| CommentsSheet total/loading | Integración | Sí | `feed/CommentsSheet.tsx` | Contador + avatares API |
| ProfileView comments badge | VISUAL | Sí | `feed/ProfileView.tsx` | Badge en botón comentarios |
| FavoritesView loading | VISUAL | Sí | `feed/FavoritesView.tsx` | Spinner + copy perfiles |
| NotificationsContext isEmpty | Integración | Sí | `contexts/NotificationsContext.tsx` | Flag derivado |
| CreatePostSheet async publish | FRONTEND_LOGIC | Sí | `feed/CreatePostSheet.tsx` | Reset post-éxito API |
| Venue sections cards | VISUAL | Sí | `venues/sections/*` | Cards borde Lovable |
| SeatLocationModal retry | Integración | Sí | `tickets/SeatLocationModal.tsx` | Reintento mapa |
| EventDetailView retry | Integración | Sí | `events/EventDetailView.tsx` | Reintento fetch |
| AuthLogo hero | VISUAL | Sí | `auth/AuthLogo.tsx` | Gradiente + copy |
| AIAssistantView back | VISUAL | Sí | `ai/AIAssistantView.tsx` | ChevronLeft |
| Banking delete | Bloqueo | Parcial | `banking/BankingHub.tsx`, `PaymentMethodsDashboard.tsx` | BACKEND_REQUIRED |
| Batch 3 gaps (20) | Empalme | Sí | ver `decision-log.md` | 18 DONE + 2 BACKEND_REQUIRED |

## Ejecución 2026-06-19 gap-empalme batch 2 (run 27850000711-b2)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| EditGuestModal async | FRONTEND_LOGIC | Sí | `guests/EditGuestModal.tsx` | Loading + await API |
| PostCard owner follow | VISUAL | Sí | `feed/PostCard.tsx` | Sin botón Seguir al dueño |
| TopHeader perfil | Navegación | Sí | `feed/TopHeader.tsx`, `LovableLayout.tsx` | Avatar + deep-link user |
| StepAccessControl hosts | Integración | Sí | `events/StepAccessControl.tsx` | Cache desde formData.hosts |
| FollowersSheet solicitudes | Integración | Sí | `feed/FollowersSheet.tsx` | RequestRow Aceptar |
| TransferTicketFlow self | FRONTEND_LOGIC | Sí | `tickets/TransferTicketFlow.tsx` | Filtra currentUserId |
| PublishFlow banking | Bloqueo | Parcial | `events/PublishFlowModal.tsx` | BACKEND_REQUIRED onSubmitBank |
| BookingSheet add-ons | Bloqueo | Parcial | `services/BookingSheet.tsx` | BACKEND_REQUIRED catálogo |
| PaymentGateway PSP | Bloqueo | Parcial | `services/PaymentGatewaySheet.tsx` | BACKEND_REQUIRED confirm orderId only |
| MyTickets refresh | VISUAL | Sí | `tickets/MyTicketsView.tsx` | onRefresh + explore |
| Stats loading/error | VISUAL | Sí | `stats/StatsEventListView.tsx` | Props loading/loadError |
| VenueDetail precio | Integración | Sí | `venues/VenueDetailReservation.tsx` | parseVenuePrice amenities |
| Batch 2 gaps (20) | Empalme | Sí | ver `decision-log.md` | 17 DONE + 3 BACKEND_REQUIRED |

## Ejecución 2026-06-19 gap-empalme batch 1 (run 27850000711-b1)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| StepAgenda timeline/validación | VISUAL | Sí | `events/StepAgenda.tsx` | Horarios + empty state día |
| BankingForm anti-simulación | Bloqueo | Parcial | `banking/BankingForm.tsx` | BACKEND_REQUIRED — delega API |
| EditProfileView intereses | Bloqueo | Parcial | `feed/EditProfileView.tsx` | BACKEND_REQUIRED — sin toast éxito |
| ChatRoomView sin stubs | Integración | Sí | `chat/ChatRoomView.tsx` | Eliminado «Ocultar evento» ficticio |
| SideMenu mis-eventos | Navegación | Sí | `feed/SideMenu.tsx` | Ítem menú lateral |
| EventPreviewModal preview-only | VISUAL | Sí | `events/EventPreviewModal.tsx` | Sin botones sociales muertos |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 18 DONE + 2 BACKEND_REQUIRED |

## Ejecución 2026-06-19 validación agente (run 27850000711)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| Manifiesto vacío (38e2c759) | Validación | Sí | — | Sin diff UI; build:devaws OK |
| Anti-mock pages | Bloqueo | Sí | `packages/shell/src/pages/` | grep sin coincidencias runtime |
| Similitud diseño | Métrica | Parcial | `design-comparison.json` | 86.5% estable; batch 6 pendiente (~18 gaps) |
| Empalmes batch 1–5 | Integración | Sí | rama `feature/cicd/dev-automation` | Intactos; sin regresión build |
| SideMenu prepare-28d62d5e | Bloqueo | Parcial | `feed/SideMenu.tsx` | discover-joyful-feed privado; empalme batch 1 previo intacto |

## Ejecución 2026-06-19 gap-empalme batch 5 (run 27849872403-b5)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| ForgotPassword ruta Lovable | Navegación | Sí | `App.tsx`, `ForgotPasswordView.tsx` | `/auth/forgot-password` prioriza shell |
| MyReserved* status labels | VISUAL | Sí | `purchases/MyReserved*View.tsx` | `formatBookingStatus` + error/reintento |
| GlobalSearch initialQuery | FRONTEND_LOGIC | Sí | `GlobalSearchView.tsx`, `SearchEventsPage.tsx` | `location.state.q` desde TopHeader |
| Admin refunds/reports panels | Navegación | Sí | `admin/AdminRefundsPanel.tsx`, `AdminReportsPanel.tsx` | Paneles reales sin stub Navigate |
| StoryViewer Tailwind | VISUAL | Sí | `components/StoryViewer.tsx` | Fullscreen Lovable; viewers BACKEND_REQUIRED |
| MyPosts onOpenDetail | Navegación | Sí | `feed/ProfileView.tsx` | Inline path con `post.detailPath` |
| KYC submit | Bloqueo | Parcial | `feed/KycCertificationView.tsx` | BACKEND_REQUIRED documentado |
| Login mfe-auth re-export | RISKY | Sí | `pages/Login.tsx` | Sin duplicar lógica auth |
| Batch 5 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-19 gap-empalme batch 4 (run 27849872403-b4)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| AccessControlListView navegación | Navegación | Sí | `access/AccessControlListView.tsx`, `AccessControlPage.tsx` | Configurar → evento; asignar → crear |
| ScanQR BarcodeDetector | Integración | Sí | `access/ScanQRSheet.tsx` | Detección nativa + fallback manual |
| FeedHero Ver todas | Navegación | Sí | `feed/FeedHero.tsx`, `SocialWallTab.tsx` | `/events`; mock stories solo DEV |
| ForgotPassword Lovable UI | VISUAL | Sí | `auth/ForgotPasswordView.tsx`, `pages/ForgotPassword.tsx` | APIs reales shared |
| EventPublished routing | Navegación | Sí | `CreateEventPage.tsx` | Post-publicación → `/events/published` |
| StoryViewersSheet wire | Bloqueo | Parcial | `StoryViewer.tsx`, `StoryViewersSheet.tsx` | BACKEND_REQUIRED viewers API |
| CompanyContext consumer | Integración | Sí | `EditProfileView.tsx` | Datos empresa desde `fetchUserById` |
| Booking status labels | VISUAL | Sí | `purchases/*ReservationDetail.tsx` | `formatBookingStatus` |
| Batch 4 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-19 gap-empalme batch 3 (run 27849872403-b3)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| EventDetailView API real | Integración | Sí | `events/EventDetailView.tsx` | `fetchEventDetail` + adapter |
| ProfileView showComments | Bloqueo | Sí | `feed/ProfileView.tsx` | Fix useState runtime |
| CreatePostSheet authorId | Bloqueo | Sí | `feed/CreatePostSheet.tsx` | Sin `user.id: 'me'` |
| Notifications load/error | Integración | Sí | `contexts/NotificationsContext.tsx`, `feed/NotificationsSheet.tsx` | reload + reintento |
| FeedServicesCarousel empty | VISUAL | Sí | `feed/FeedServicesCarousel.tsx` | Empty state visible |
| Favorites unlike API | Integración | Sí | `feed/FavoritesView.tsx`, `pages/ProfilePage.tsx` | `toggleEventLike` |
| Venue sections headers | VISUAL | Sí | `venues/sections/*` | Iconos + copy Lovable |
| Banking delete | Bloqueo | Parcial | `banking/BankingHub.tsx`, `PaymentMethodsDashboard.tsx` | BACKEND_REQUIRED |
| Batch 3 gaps (20) | Empalme | Sí | ver `decision-log.md` | 18 DONE + 2 BACKEND_REQUIRED |

## Ejecución 2026-06-19 gap-empalme batch 2 (run 27849872403-b2)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| VenueDetailReservation hire sheets | Integración | Sí | `venues/VenueDetailReservation.tsx` | BookingSheet + PaymentGatewaySheet montados |
| FollowersSheet solicitudes | Integración | Sí | `feed/FollowersSheet.tsx` | Tab Solicitudes vía `fetchPendingFollowRequests` |
| PaymentGateway sin orderId | Bloqueo | Parcial | `services/PaymentGatewaySheet.tsx` | BACKEND_REQUIRED — panel inline + botón disabled |
| PublishFlow banking | Bloqueo | Parcial | `events/PublishFlowModal.tsx` | BACKEND_REQUIRED — banner pendiente en éxito |
| BookingSheet add-ons | Bloqueo | Parcial | `services/BookingSheet.tsx` | BACKEND_REQUIRED — empty state sin mock |
| TransferTicketFlow empty | VISUAL | Sí | `tickets/TransferTicketFlow.tsx` | Sin entradas → estado vacío |
| StatsEventListView tokens | VISUAL | Sí | `stats/StatsEventListView.tsx` | `bg-secondary` + ProfileSectionBanner |
| Batch 2 gaps (20) | Empalme | Sí | ver `decision-log.md` | 17 DONE + 3 BACKEND_REQUIRED |

## Ejecución 2026-06-19 gap-empalme batch 1 (run 27849872403-b1)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| TicketPurchaseFlow anti-mock | Bloqueo | Sí | `invitations/TicketPurchaseFlow.tsx` | Redirect checkout; sin CATEGORIES/4242 |
| VenueDetailReservation pago real | Bloqueo | Sí | `venues/VenueDetailReservation.tsx` | Eliminado paso pago simulado |
| ChatRoomView kick API | Integración | Sí | `chat/ChatRoomView.tsx`, `LovableChatThread.tsx`, `ChatPage.tsx` | `kickFromEventChat` |
| EditProfileView password | Bloqueo | Parcial | `feed/EditProfileView.tsx` | BACKEND_REQUIRED |
| BankingForm SWIFT | Bloqueo | Parcial | `banking/BankingForm.tsx` | BACKEND_REQUIRED |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 18 DONE + 2 BACKEND_REQUIRED |

## Ejecución 2026-06-19 validación agente (run 27849872403)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| Manifiesto vacío (38e2c759) | Validación | Sí | — | Sin diff UI; build:devaws OK |
| Anti-mock pages | Bloqueo | Sí | `packages/shell/src/pages/` | grep sin coincidencias runtime |
| Similitud diseño | Métrica | Parcial | `design-comparison.json` | 82.5% estable; batch 6 pendiente |
| Empalmes batch 1–5 | Integración | Sí | rama `feature/cicd/dev-automation` | Intactos; sin regresión build |

## Ejecución 2026-06-20 gap-empalme batch 5 (run 27847959667-b5)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| ServiceReservationDetail empty state | VISUAL | Sí | `purchases/ServiceReservationDetail.tsx` | Paridad con VenueReservationDetail |
| MyReserved* empty states | VISUAL | Sí | `purchases/MyReservedServicesView.tsx`, `MyReservedVenuesView.tsx` | Icono + copy descriptivo |
| GlobalSearchView cableado | Navegación | Sí | `SearchEventsPage.tsx` | Delega en componente Lovable |
| FeedBanner KYC en feed | Integración | Sí | `SocialWallTab.tsx` | CTA `/profile/kyc` sin mocks |
| KycProvider montado | Integración | Sí | `LovableLayout.tsx`, `KycPage.tsx` | Estado real `fetchUserById` |
| KYC submit BACKEND_REQUIRED | Bloqueo | Parcial | `feed/KycCertificationView.tsx` | Sin simulación de envío |
| Admin panels Lovable | Navegación | Sí | `AdminPanelPage.tsx`, `App.tsx` | Wrappers + rutas legacy |
| AddGuestModal onSearchUser | FRONTEND_LOGIC | Sí | `guests/AddGuestModal.tsx` | Matching vía hook bridge |
| useGuests convención | Integración | Sí | `GuestsHubPage.tsx` | `@lovable/hooks/useGuests` |
| Auth re-export mfe-auth | Navegación | Sí | `Login.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx` | Sin duplicar lógica RISKY |
| Batch 5 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

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

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27905180836-b2)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| FeedBanner ring DSF | VISUAL | Sí | `feed/FeedBanner.tsx` | ring-2 ring-primary/20; border-border/60 |
| AIAssistantFAB flat | VISUAL | Sí | `ai/AIAssistantFAB.tsx` | bg-primary shadow-sm hover ring-primary/30 |
| SeatingMapEditor capacity | VISUAL | Sí | `events/SeatingMapEditor.tsx` | success/destructive tokens; header border-border/60 |
| EventPreviewModal labels | VISUAL | Sí | `events/EventPreviewModal.tsx` | font-extrabold Field; border-border/60 |
| RefundTicketFlow confirm | VISUAL | Sí | `tickets/RefundTicketFlow.tsx` | h-14 ring; rows border-border/60 |
| StepAccessControl alerts | VISUAL | Sí | `events/StepAccessControl.tsx` | gate empty extrabold; alerts border-border/60 |
| HostPickerModal tabs | VISUAL | Sí | `events/HostPickerModal.tsx` | border-border/60; focus ring-primary/20 |
| EventsView titles | VISUAL | Sí | `feed/EventsView.tsx` | font-extrabold cards; CTA border-primary/25 |
| ServiceDetailView sticky | VISUAL | Sí | `services/ServiceDetailView.tsx` | shadow-sm; price extrabold |
| StepUnified preferences | VISUAL | Sí | `services/StepUnified.tsx` | inactive border-border/60 |
| CompanyContext aliases | Integración | Sí | `contexts/CompanyContext.tsx` | isLoading; refreshCompany |
| NotificationsContext isLoading | Integración | Sí | `contexts/NotificationsContext.tsx` | alias isLoading en provider |
| MyPostsView loading | VISUAL | Sí | `feed/MyPostsView.tsx` | h-14 ring loading/error extrabold |
| AddGuestModal foundUser | VISUAL | Sí | `guests/AddGuestModal.tsx` | dashed border-primary/25; avatar ring |
| MainInfoSection stepper | VISUAL | Sí | `venues/sections/MainInfoSection.tsx` | border-border/60 capacity |
| FAQSection index | VISUAL | Sí | `venues/sections/FAQSection.tsx` | pregunta font-extrabold |
| SeatLocationModal loading | VISUAL | Sí | `tickets/SeatLocationModal.tsx` | h-14 ring; no-seat title extrabold |
| MyPurchasesView hub | VISUAL | Sí | `purchases/MyPurchasesView.tsx` | icons h-10; loading h-14 ring |
| MyReservedServices loading | VISUAL | Sí | `purchases/MyReservedServicesView.tsx` | loading h-14 ring; error extrabold |
| BankingHub delete/PayPal | Bloqueo | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED; loading h-14 ring |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-21 gap-empalme batch 1 (run 27905180836-b1)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| NotificationsContext API | Integración | Sí | `contexts/NotificationsContext.tsx` | NotificationsContextValue; useNotificationsContext; refreshNotifications; hasUnread/isEmpty |
| NotificationsSheet states | VISUAL | Sí | `feed/NotificationsSheet.tsx` | isEmpty; loadErrorMessage; loading border-border/60; font-extrabold |
| TopHeader badge | VISUAL | Sí | `feed/TopHeader.tsx` | hasUnread badge notificaciones |
| FeedBanner ring | VISUAL | Sí | `feed/FeedBanner.tsx` | ring-1 ring-primary/10 gradiente promo |
| SeatingMapEditor canvas | VISUAL | Sí | `events/SeatingMapEditor.tsx` | verificado intacto batch previo |
| EventPreviewModal sections | VISUAL | Sí | `events/EventPreviewModal.tsx` | verificado intacto batch previo |
| AIAssistantFAB polish | VISUAL | Sí | `ai/AIAssistantFAB.tsx` | verificado intacto batch previo |
| RefundTicketFlow cards | VISUAL | Sí | `tickets/RefundTicketFlow.tsx` | verificado intacto batch previo |
| FAQSection empty | VISUAL | Sí | `venues/sections/FAQSection.tsx` | verificado intacto batch previo |
| StepAccessControl gates | VISUAL | Sí | `events/StepAccessControl.tsx` | verificado intacto batch previo |
| HostPickerModal shell | VISUAL | Sí | `events/HostPickerModal.tsx` | verificado intacto batch previo |
| ServiceDetailView hero | VISUAL | Sí | `services/ServiceDetailView.tsx` | verificado intacto batch previo |
| EventsView EmptyHint | VISUAL | Sí | `feed/EventsView.tsx` | verificado intacto batch previo |
| StepUnified headers | VISUAL | Sí | `services/StepUnified.tsx` | verificado intacto batch previo |
| CompanyContext alias | Integración | Sí | `contexts/CompanyContext.tsx` | useCompanyContext verificado |
| MyPostsView empty | VISUAL | Sí | `feed/MyPostsView.tsx` | verificado intacto batch previo |
| AddGuestModal search | VISUAL | Sí | `guests/AddGuestModal.tsx` | verificado intacto batch previo |
| MainInfoSection cards | VISUAL | Sí | `venues/sections/MainInfoSection.tsx` | verificado intacto batch previo |
| SeatLocationModal loading | VISUAL | Sí | `tickets/SeatLocationModal.tsx` | verificado intacto batch previo |
| MyPurchasesView empty | VISUAL | Sí | `purchases/MyPurchasesView.tsx` | verificado intacto batch previo |
| MyReservedServicesView | Integración | Sí | `purchases/MyReservedServicesView.tsx` | verificado intacto batch previo |
| BankingHub delete/PayPal | Bloqueo | Parcial | `banking/BankingHub.tsx` | BACKEND_REQUIRED; banner intacto |
| Batch 1 gaps (20) | Empalme | Sí | ver `decision-log.md` | 19 DONE + 1 BACKEND_REQUIRED |

## Ejecución 2026-06-21 agent-27910611218 (prepare 53a73964)

| Regla | Tipo | Implementada | Archivo | Observación |
|---|---|---|---|---|
| Manifiesto sin UI | Validación | Sí | — | changedFiles []; hasUiChanges false |
| ReglasDiseno design-token-map | VISUAL | Sí | referencia DSF | tokens.yml; sin copy YAML a runtime |
| Empalmes batch b15 intactos | Validación | Sí | ver `gap-empalme-27905180836-b15` | similitud 99.32%; objetivo 98% alcanzado |
| Build devaws | Validación | Sí | — | npm run build:devaws SUCCESS |
| Anti-mock pages | Bloqueo | Sí | `packages/shell/src/pages/` | grep sin coincidencias runtime |

## Validaciones

- [x] Validación frontend implementada (formularios reporte, ubicación)
- [x] Mensaje de error implementado
- [x] Submit bloqueado si la regla falla (reporte sin id)
- [x] Error backend manejado (toast)
- [x] Redirección posterior al éxito real (reservas/listados desde API)

---

Reglamento completo: `DoEventsCICD/Reglas/operativas/reglamento-cursor-api.md`
