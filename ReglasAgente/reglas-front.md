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

## Validaciones

- [x] Validación frontend implementada (formularios reporte, ubicación)
- [x] Mensaje de error implementado
- [x] Submit bloqueado si la regla falla (reporte sin id)
- [x] Error backend manejado (toast)
- [x] Redirección posterior al éxito real (reservas/listados desde API)

---

Reglamento completo: `DoEventsCICD/Reglas/operativas/reglamento-cursor-api.md`
