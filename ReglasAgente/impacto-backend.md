# Impacto Backend

## Resumen

Run `gap-empalme-27876228669-b1`: batch 1 (20 gaps) — 18 DONE frontend; 2 BACKEND_REQUIRED (`EditProfileView`, `BankingForm`).

Run `agent-ef7b3dfd-27876228669`: prepare PULEP Colombia + batch 6 — 18 gaps DONE frontend; 1 BACKEND_REQUIRED (persistencia campos PULEP en evento).

Run `gap-empalme-27850000711-b5`: batch 5 (20 gaps) — 19 DONE frontend; 1 BACKEND_REQUIRED (`KycCertificationView` envío documentos).

Run `gap-empalme-27850000711-b4`: batch 4 (20 gaps) — 17 DONE frontend; 3 BACKEND_REQUIRED (`PaymentMethodsDashboard` delete, `StoryViewersSheet`, `GlobalSearchView` posts).

Run `gap-empalme-27850000711-b3`: batch 3 (20 gaps) — 18 DONE frontend; 2 BACKEND_REQUIRED (`BankingHub` delete, `PaymentMethodsDashboard` delete).

Run `gap-empalme-27850000711-b2`: batch 2 (20 gaps) — 17 DONE frontend; 3 BACKEND_REQUIRED (`PublishFlowModal`, `BookingSheet`, `PaymentGatewaySheet`).

Run `gap-empalme-27850000711-b1`: batch 1 (20 gaps) — 18 DONE frontend; 2 BACKEND_REQUIRED (`EditProfileView`, `BankingForm`).

Run `agent-38e2c759-27850000711`: validación sin diff UI; build:devaws OK; sin cambios backend ni frontend de lógica; batch 6 (~18 gaps) pendiente.

Run `gap-empalme-27849872403-b5`: batch 5 (20 gaps) — 19 DONE frontend; 1 BACKEND_REQUIRED (`KycCertificationView` submit).

Run `gap-empalme-27849872403-b4`: batch 4 (20 gaps) — 19 DONE frontend; 1 BACKEND_REQUIRED (`StoryViewersSheet`).

Run `gap-empalme-27849872403-b3`: batch 3 (20 gaps) — 18 DONE frontend; 2 BACKEND_REQUIRED (`BankingHub` delete, `PaymentMethodsDashboard` delete).

Run `gap-empalme-27849872403-b2`: batch 2 (20 gaps) — 17 DONE frontend; 3 BACKEND_REQUIRED (`PublishFlowModal`, `BookingSheet` add-ons, `PaymentGatewaySheet`).

Run `gap-empalme-27849872403-b1`: batch 1 (20 gaps) — 18 DONE frontend; 2 BACKEND_REQUIRED (`EditProfileView`, `BankingForm`). Anti-mock: TicketPurchaseFlow, VenueDetailReservation. Kick chat vía `kickFromEventChat`.

Run `agent-38e2c759-27849872403`: validación sin diff UI; build:devaws OK; sin cambios backend ni frontend de lógica.

Run `gap-empalme-27847959667-b5`: batch 5 (20 gaps) — empalme frontend completado en 19 componentes; 1 gap documentado como BACKEND_REQUIRED (KycCertificationView submit).

Run `gap-empalme-27847959667-b4`: batch 4 (20 gaps) — empalme frontend completado en 18 componentes; 2 gaps documentados como BACKEND_REQUIRED (StoryViewersSheet, PayPal payout/delete cuenta).

Run `gap-empalme-27847959667-b3`: batch 3 (20 gaps) — empalme frontend completado en 19 componentes; 1 gap documentado como BACKEND_REQUIRED (PaymentGatewaySheet).

Run `gap-empalme-27847959667-b2`: batch 2 (20 gaps) — empalme frontend completado en 18 componentes; 2 gaps BACKEND_REQUIRED.

Run `gap-empalme-27847959667-b1`: batch 1 (20 gaps) — empalme frontend completado en 17 componentes; 3 gaps BACKEND_REQUIRED.

## ¿Requiere backend?

Sí (parcial)

## Empalme realizado (última ejecución — gap-empalme-27876228669-b1)

- **GuestStatsView:** header BarChart3 + Excel primary; chart tokens CSS; skeleton carga.
- **PrivateChatView / ChatRoomView:** online `bg-success`; empty MessageSquare; admin badge primary.
- **EventLocationMap / StepAgenda / StepEventSummary / StepEventLocation:** empty states iconografía; skeleton venues; rounded-2xl mapa.
- **HostPickerModal:** header UserPlus; Loader2 búsqueda; empty states icono.
- **GuestManagementView:** login required con icono Users + botón volver.
- **MyEventsView / MyServicesView:** status badges token; reviews empty con icono.
- **SuccessModal / BankingForm:** rounded-2xl; header Wallet; CTAs `bg-primary` (persistencia BACKEND_REQUIRED).
- **InvitationEventDetailView / EventPreviewModal:** hero fallback; copy ES «Atrás»/«Público»; badge primary.
- **StepUnified:** prerequisite empty Briefcase.
- **SideMenu:** imports limpios; active state soporte.
- **EditProfileView:** header Settings2; tokens success/primary (password/gustos BACKEND_REQUIRED).
- **MapView:** pins `hsl(var(--primary))`; pulse loading overlay.
- **SeatingCategoryDialog:** header Armchair; preview card Lovable.

## Empalme realizado (ejecución anterior — gap-empalme-27850000711-b5)

- **LoginView / SignUpView:** UI Lovable Tailwind con APIs reales (`loginUser`, OAuth); rutas shell `/auth/login` y `/auth/register`.
- **TicketPurchaseFlow:** resumen evento + botón «Continuar al checkout» antes de redirect real.
- **KycCertificationView:** pasos documento/selfie/envío; botón submit deshabilitado (BACKEND_REQUIRED).
- **Admin panels:** `AdminPanelSection` con headers Lovable en usuarios, pagos, nuevos usuarios, soporte.
- **FeedBanner:** dismissible en muro social; CTA KYC sin mocks.
- **MyPostsView:** `ProfileSectionBanner` + empty state card.
- **MyReservedServices/Venues:** iconos con tokens `primary`; error/reintento API intactos.
- **Index / VenueDetail:** wrappers shell `bg-secondary` alineados Lovable.
- **EventPublished:** badge éxito + anillo primary; nombre vía `fetchEventById`.
- **AddGuestModal:** título con icono; **useGuests:** documentación bridge API.

## Empalme realizado (ejecución anterior — gap-empalme-27850000711-b4)

- **PaymentMethodsDashboard / BankingHub:** cards con borde Lovable; enlace estado fiscal con toast; delete deshabilitado (BACKEND_REQUIRED).
- **BookingReviewSheet:** copy términos reserva; total con tokens diseño.
- **FAQSection / MediaUpload:** headers con icono Lovable; empty states alineados.
- **ReportPostDialog:** radio seleccionado con borde primary.
- **ScanQRSheet:** feedback éxito con tokens `primary` (sin colores hardcoded).
- **FeedHero:** skeleton avatars en carga de historias.
- **KycContext:** `loadError` + `refresh` intactos para consumidores.
- **TermsDialog:** secciones ampliadas (pagos, PI); scroll con gradiente.
- **MyPurchasesView:** botón reintentar en error de carga.
- **ChangeLocationSheet:** card ubicación actual antes de acciones.
- **CompanyContext / StoriesContext:** `loadError` expuesto en contexto.
- **EventPublished:** nombre evento vía `fetchEventById`; copiar/compartir enlace.
- **ProfileCommentsView / ProfileView / ProfilePage:** Loader, reintento, empty state enriquecido.
- **VenueReservationDetail / ServiceReservationDetail:** fix import `Button`; error/reintento API.
- **NotFound:** anillo visual 404 alineado Lovable.
- **GlobalSearchView:** empty states por tab; banner posts BACKEND_REQUIRED; reintento inline.
- **StoryViewersSheet:** placeholder documentado con badge backend requerido.

## Empalme realizado (ejecución anterior — gap-empalme-27850000711-b3)

- **EventInvitationModal:** `loadEvents` con error/reintento; empty states eventos e invitados.
- **LocationSection:** empty state sin coordenadas; mapa embebido condicional.
- **MyInvitationsView:** props `loadError`/`onRetry`; badges estado invitación.
- **EventsView:** skeleton carga inicial; empty CTA eventos publicados; callbacks `onViewAllNearby`/`onViewAllRecommended`.
- **CommentsSheet:** contador en título; loading/error; avatares `avatarUrl`.
- **ProfileView:** badge contador comentarios en experiencia de servicio.
- **FavoritesView:** loading; copy tab perfiles corregido.
- **NotificationsContext:** propiedad `isEmpty` derivada.
- **CreatePostSheet:** `onPublish` async; reset solo tras éxito.
- **PreferencesRefundSection / MainInfoSection:** cards con borde Lovable.
- **SeatLocationModal / EventDetailView:** reintento en error de mapa/evento.
- **AuthLogo:** hero gradiente y tipografía Lovable.
- **AIAssistantView:** botón volver `ChevronLeft` (sin `←` texto).
- **BankingHub:** `loadError` + reintento; delete documentado BACKEND_REQUIRED.
- **PaymentMethodsDashboard:** menú eliminar deshabilitado (requiere backend).

## Empalme realizado (ejecución anterior — gap-empalme-27850000711-b2)

- **EditGuestModal:** submit async con loading; sin toast prematuro antes de API.
- **ProfileGalleryPage:** prop `loadError` cableada desde fetch.
- **PostCard:** oculta «Seguir» cuando `isOwner`.
- **TopHeader / LovableLayout:** avatar → perfil; deep-link `user-{id}` desde notificaciones.
- **CreateEventView:** subtítulo «Paso N de 7» bajo stepper.
- **StepAccessControl:** hidrata `userCache` desde `formData.hosts`.
- **FollowersSheet:** tab Solicitudes con `RequestRow` + Aceptar vía `followUser`.
- **TransferTicketFlow / TicketDetailView:** filtra `currentUserId` en búsqueda destinatario.
- **RefundTicketFlow:** prop `platformFeeRate` configurable.
- **MyTicketsView / TicketsPage:** `onRefresh` + `onExploreEvents`.
- **StatsEventListView / ProfileStatsPage:** loading/error inline sin Loader full-page.
- **VenueDetailReservation:** `parseVenuePrice` desde amenities en preview.
- **ServiceDetailView:** CTA «Inicia sesión para reservar» sin liveBooking.
- **BookingSheet:** banner vista previa cuando `!isLive`.
- **PaymentGatewaySheet:** título «Confirmar orden» + badge orderId; guard sin orderId.
- **PublishFlowModal:** prop `onSubmitBank` opcional; guard sin simular persistencia.
- **MessagesListView / AIAssistantFAB / ContactImportModal:** UX alineada Lovable.

## Empalme realizado (ejecución anterior — gap-empalme-27850000711-b1)

- **StepAgenda:** validación horarios fin ≥ inicio; empty state por día sin actividades; timeline intacto.
- **StepEventSummary:** secciones `main` y `location` abiertas por defecto.
- **EventPreviewModal:** aviso preview-only; eliminados botones sociales no funcionales.
- **ChatRoomView / PrivateChatView:** sin stubs de ocultar evento; burbujas DM alineadas Lovable.
- **BankingForm:** submit delega a `onComplete`/`BankingHub`; sin SuccessModal antes de API; PayPal bloqueado.
- **EditProfileView:** guardar intereses → BACKEND_REQUIRED (sin toast de éxito ficticio).
- **SideMenu:** ítem «Mis eventos» (`mis-eventos`).
- **MyEventsView / MyServicesView:** empty states enriquecidos con iconografía Lovable.
- **MapView:** prop `loading` con overlay; **ProfileGallery:** skeleton + `loadError`.
- **HostPickerModal:** error de búsqueda; **SeatingCategoryDialog:** validación filas/asientos.
- **InvitationEventDetailView:** stats organizador condicionales (sin ceros ficticios).
- **GuestManagementView:** skeleton de carga; **StepUnified:** barra de progreso por sección.

## Empalme realizado (ejecución anterior — gap-empalme-27849872403-b5)

- **ForgotPassword:** ruta shell `/auth/forgot-password` → `ForgotPasswordView` Lovable con APIs reales.
- **MyReservedVenues/Services:** `formatBookingStatus`, estados vacío/error/reintento; APIs `fetchUserVenueBookings` / `fetchUserServiceBookings`.
- **GlobalSearchView:** `initialQuery`/`initialTab` desde `SearchEventsPage` (`location.state.q` del TopHeader).
- **AdminRefundsPanel / AdminReportsPanel:** paneles standalone con `AdminPaymentsTab` y `AdminHomeTab` (sin redirect stub).
- **StoryViewer:** UI Tailwind fullscreen Lovable; `StoryViewersSheet` montado (viewers API pendiente).
- **MyPostsView:** `onOpenDetail` en ruta inline de `ProfileView` vía `post.detailPath`.
- **TicketPurchaseFlow:** redirect a `/events/:id/checkout` sin mocks.
- **Login / useGuests / AddGuestModal / admin wrappers:** intactos con integración real.

## Empalme realizado (ejecución anterior — gap-empalme-27849872403-b4)

- **AccessControlListView:** navegación real a `/events/{id}` y `/events/create`; sin toasts stub.
- **ScanQRSheet:** detección QR vía `BarcodeDetector` nativo + validación `scanTicketFromQr`.
- **FeedHero:** «Ver todas» → `/events`; `defaultStories` solo en DEV.
- **ForgotPasswordView:** UI Lovable con `getUserByEmail` + `sendPasswordResetLink`.
- **CreateEventPage:** redirección a `/events/published?eventId=` tras publicación.
- **StoryViewersSheet:** montado en `StoryViewer`; empty state documentado (BACKEND_REQUIRED).
- **CompanyContext:** datos empresa visibles en `EditProfileView`.
- **Reservas:** etiquetas de estado localizadas en detalle venue/servicio.

## Empalme realizado (ejecución anterior — gap-empalme-27849872403-b3)

- **EventDetailView:** carga real vía `fetchEventDetail` + `eventDetailToInvitationEvent`; eliminado stub con organizador ficticio.
- **ProfileView:** fix `showComments` (`useState`); favoritos con `toggleEventLike` y navegación a evento.
- **NotificationsContext/Sheet:** `loadError`, `reload`, estados loading/error con reintento.
- **CreatePostSheet:** props `authorId`/`publishing`; sin `user.id: 'me'`.
- **FeedServicesCarousel:** empty state en lugar de ocultar sección.
- **FavoritesView/EventsView:** banner loading descubrimiento; callbacks unlike/open event.
- **LocationSection/MainInfoSection/PreferencesRefundSection/AuthLogo:** headers y UX alineados Lovable.

## Backend pendiente para 100%

| Gap / Feature | lovablePath | webPath | Motivo | Endpoint / Lambda | Tabla DynamoDB | Acción | Prioridad |
|---------------|-------------|---------|--------|-------------------|----------------|--------|-----------|
| PULEP Colombia campos | `src/data/eventFormData.ts` | `packages/shell/src/lovable/data/eventFormData.ts` | Registro PULEP no persiste en evento | Extender `POST/PATCH /events` con `pulep*` | Events | Persistir + validar registro | Media |
| Edit profile password/intereses | `src/components/feed/EditProfileView.tsx` | `packages/shell/src/lovable/components/feed/EditProfileView.tsx` | Reset password e intereses no persisten | Auth Cognito + `PATCH /users/{id}` | Users | Conectar flujos UI | Media |
| Banking form SWIFT/intl | `src/components/banking/BankingForm.tsx` | `packages/shell/src/lovable/components/banking/BankingForm.tsx` | Validación SWIFT servidor; cert upload | Extender `POST /bank-data` | BankAccounts | Validación backend | Alta |
| Chat ban | `src/components/chat/ChatRoomView.tsx` | `packages/shell/src/lovable/components/chat/ChatRoomView.tsx` | Ban participantes sin endpoint | `POST /chat/rooms/{id}/ban` (TBD) | Chats | Endpoint ban | Baja |
| KYC submit | `src/components/feed/KycCertificationView.tsx` | `packages/shell/src/lovable/components/feed/KycCertificationView.tsx` | Envío documento/selfie certificación | `POST /users/{id}/kyc` (TBD) | Users | Integrar proveedor KYC | Alta |
| Búsqueda publicaciones | `src/components/feed/GlobalSearchView.tsx` | `packages/shell/src/lovable/components/feed/GlobalSearchView.tsx` | Tab posts filtra feed localmente | `GET /publications/search?q=` (TBD) | Publications | Endpoint búsqueda full-text | Media |
| Story viewers | `src/components/feed/StoryViewersSheet.tsx` | `packages/shell/src/lovable/components/feed/StoryViewersSheet.tsx` | Lista de visualizaciones por historia | `GET /stories/{id}/viewers` (TBD) | Stories | Exponer endpoint viewers | Media |
| PayPal payout | `src/components/banking/BankingHub.tsx` | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | Tipo PayPal no mapea a `createBankAccount` | Extender `POST /bank-data` | BankAccounts | Soporte PayPal en DoEventsBack | Alta |
| Delete bank account | `src/components/banking/PaymentMethodsDashboard.tsx` | `packages/shell/src/lovable/components/banking/PaymentMethodsDashboard.tsx` | Eliminar método de cobro | `DELETE /bank-data/{id}` (TBD) | BankAccounts | Endpoint eliminación | Media |
| Payment gateway servicios | `src/components/services/PaymentGatewaySheet.tsx` | `packages/shell/src/lovable/components/services/PaymentGatewaySheet.tsx` | Reserva sin `orderId` no puede completar pago | `POST /orders` + gateway | Orders | Crear orden antes de checkout | Alta |
| Publish flow banking | `src/components/events/PublishFlowModal.tsx` | `packages/shell/src/lovable/components/events/PublishFlowModal.tsx` | Persistencia datos bancarios post-publicación | `POST/GET /users/{id}/payment-methods` (TBD) | `UserPaymentMethods` (TBD) | Implementar en DoEventsBack | Alta |
| Booking add-ons | `src/components/services/BookingSheet.tsx` | `packages/shell/src/lovable/components/services/BookingSheet.tsx` | Servicios adicionales por reserva | `GET /services/{id}/addons` (TBD) | TBD | Exponer catálogo real | Media |
| Banking form SWIFT | `src/components/banking/BankingForm.tsx` | `packages/shell/src/lovable/components/banking/BankingForm.tsx` | Validación SWIFT servidor | Mismo contrato banking | Mismo | Validación backend | Alta |
| Chat moderation | `src/components/chat/ChatRoomView.tsx` | `packages/shell/src/lovable/components/chat/ChatRoomView.tsx` | Kick/ban participantes | `POST /chat/rooms/{id}/moderate` (TBD) | TBD | Habilitar `canModerate` con API | Media |
| Edit profile password | `src/components/feed/EditProfileView.tsx` | `packages/shell/src/lovable/components/feed/EditProfileView.tsx` | Reset password vía Cognito/API | Auth endpoints existentes | Users | Conectar flujo UI | Media |
| Venue preview payment | `src/components/venues/VenueDetailReservation.tsx` | `packages/shell/src/lovable/components/venues/VenueDetailReservation.tsx` | Pasarela pago preview sin API | Gateway pagos existente | Orders | Integrar checkout real | Alta |

## Contrato actual encontrado

- `fetchUserServiceBookings`, `fetchUserVenueBookings`
- `searchEvents`, `searchUsers`, `fetchSocialFeed`
- `fetchUserById` (campos KYC: `kycStatus`, `organizerCertified`)
- `followUser`, `fetchPendingFollowRequests`, `fetchFollowersCount`
- Admin: `fetchAdminDashboard`, tabs vía wrappers Lovable
- Guests: `searchUsers`, `searchUserByUsername` vía `useApiGuests`

## Acción realizada

- Cliente frontend alineado; **no despliegue backend**.

## Archivos modificados en DoEventsBack

Ninguno.

## Despliegue

NO DESPLEGADO

## Riesgos

- KYC submit bloqueado hasta integración proveedor identidad.
- Búsqueda posts limitada a filtro cliente sobre feed reciente.
- Auth pages: `LoginView` empalme Lovable (RISKY — revisión humana recomendada).
- Flujos pago/acceso RISKY — revisión humana antes de merge.

## Pendientes

- Re-comparación diseño ≥98% en CI (batch 6, ~18 gaps restantes).
- Endpoint KYC submit y búsqueda publicaciones.
- Story viewers API; delete método cobro; payment gateway servicios.
