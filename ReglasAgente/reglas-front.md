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

## Validaciones

- [x] Validación frontend implementada (formularios reporte, ubicación)
- [x] Mensaje de error implementado
- [x] Submit bloqueado si la regla falla (reporte sin id)
- [x] Error backend manejado (toast)
- [x] Redirección posterior al éxito real (reservas/listados desde API)

---

Reglamento completo: `DoEventsCICD/Reglas/operativas/reglamento-cursor-api.md`
