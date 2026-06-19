# Reporte empalme de gaps — Run 27840572801

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-19 17:47 UTC |
| Batch | 2 / 6 |
| Gaps en batch | 20 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **59.92%** | **59.92%** | **+0.0%** |
| Gaps pendientes totales | 118 | 118 | +0 |
| Gaps mejorados en batch | — | **0** / 20 | — |

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Sim. antes | Sim. después | Mejoró |
|-------------------|-----|------------|--------------|--------|
| Followers | `packages/shell/src/lovable/components/feed/FollowersSheet.tsx` | 64.83% | 64.83% | ⚠️ |
| Messages list | `packages/shell/src/lovable/components/chat/MessagesListView.tsx` | 51.87% | 51.87% | ⚠️ |
| Booking | `packages/shell/src/lovable/components/services/BookingSheet.tsx` | 62.57% | 62.57% | ⚠️ |
| Map | `packages/shell/src/lovable/components/feed/MapView.tsx` | 67.73% | 67.73% | ⚠️ |
| Ticket detail | `packages/shell/src/lovable/components/tickets/TicketDetailView.tsx` | 53.73% | 53.73% | ⚠️ |
| Step access control | `packages/shell/src/lovable/components/events/StepAccessControl.tsx` | 63.1% | 63.1% | ⚠️ |
| Edit guest | `packages/shell/src/lovable/components/guests/EditGuestModal.tsx` | 65.78% | 65.78% | ⚠️ |
| My venues | `packages/shell/src/lovable/components/venues/MyVenuesView.tsx` | 64.22% | 64.22% | ⚠️ |
| Post card | `packages/shell/src/lovable/components/feed/PostCard.tsx` | 63.34% | 63.34% | ⚠️ |
| Aiassistant fab | `packages/shell/src/lovable/components/ai/AIAssistantFAB.tsx` | 55.71% | 55.71% | ⚠️ |
| Service detail | `packages/shell/src/lovable/components/services/ServiceDetailView.tsx` | 62.28% | 62.28% | ⚠️ |
| Publish flow | `packages/shell/src/lovable/components/events/PublishFlowModal.tsx` | 65.39% | 65.39% | ⚠️ |
| Transfer ticket flow | `packages/shell/src/lovable/components/tickets/TransferTicketFlow.tsx` | 63.26% | 63.26% | ⚠️ |
| Stats event list | `packages/shell/src/lovable/components/stats/StatsEventListView.tsx` | 57.51% | 57.51% | ⚠️ |
| Top header | `packages/shell/src/lovable/components/feed/TopHeader.tsx` | 67.62% | 67.62% | ⚠️ |
| Create event | `packages/shell/src/lovable/components/events/CreateEventView.tsx` | 64.07% | 64.07% | ⚠️ |
| Step event details | `packages/shell/src/lovable/components/events/StepEventDetails.tsx` | 65.23% | 65.23% | ⚠️ |
| Mi galería | `packages/shell/src/lovable/components/feed/ProfileGallery.tsx` | 65.74% | 65.74% | ⚠️ |
| Refund ticket flow | `packages/shell/src/lovable/components/tickets/RefundTicketFlow.tsx` | 53.89% | 53.89% | ⚠️ |
| Contact import | `packages/shell/src/lovable/components/guests/ContactImportModal.tsx` | 56.4% | 56.4% | ⚠️ |

## Backend pendiente para cerrar al 100%

| Gap / Feature | lovablePath | Motivo | Acción | Prioridad |
|---------------|-------------|--------|--------|-----------|
| Banking form | ``src/components/banking/BankingForm.tsx`` | Persistencia métodos de pago y verificación cuenta | Implementar en DoEventsBack | Alta |
| Banking hub | ``src/components/banking/BankingHub.tsx`` | Listado métodos guardados | Bridge frontend cuando exista API | Alta |
| Service reviews | ``src/components/services/MyServicesView.tsx`` | Ratings reales por servicio | Ocultar UI hasta API | Media |
| Chat moderation | ``src/components/chat/ChatRoomView.tsx`` | Kick/ban participantes | Habilitar `canModerate` con API | Media |
| Edit profile interests | ``src/components/feed/EditProfileView.tsx`` | Intereses y password reset | Conectar flujos UI-only | Media |
| KYC | ``src/components/feed/KycCertificationView.tsx`` | Certificación KYC | Documentado run anterior | Alta |

## Gaps frontend aún pendientes

### Autenticación (6)

| Logo de autenticación | Autenticación | `src/components/auth/AuthLogo.tsx` | needs_adaptation | 47.69% |
| Diálogo de términos | Autenticación | `src/components/auth/TermsDialog.tsx` | needs_adaptation | 10.28% |
| Olvidé mi contraseña | Autenticación | `src/pages/ForgotPassword.tsx` | needs_adaptation | 4.16% |
| Restablecer contraseña | Autenticación | `src/pages/ResetPassword.tsx` | needs_adaptation | 3.91% |
| Login | Autenticación | `src/pages/Login.tsx` | needs_adaptation | 1.09% |
| Registro | Autenticación | `src/pages/SignUp.tsx` | needs_adaptation | 0.54% |

### Feed / Inicio (15)

| Notifications | Feed / Inicio | `src/components/feed/NotificationsSheet.tsx` | needs_adaptation | 69.91% |
| Followers | Feed / Inicio | `src/components/feed/FollowersSheet.tsx` | needs_adaptation | 64.83% |
| Post card | Feed / Inicio | `src/components/feed/PostCard.tsx` | needs_adaptation | 63.34% |
| Comments | Feed / Inicio | `src/components/feed/CommentsSheet.tsx` | needs_adaptation | 39.19% |
| Crear publicación | Feed / Inicio | `src/components/feed/CreatePostSheet.tsx` | needs_adaptation | 37.02% |
| Feed services carousel | Feed / Inicio | `src/components/feed/FeedServicesCarousel.tsx` | needs_adaptation | 30.6% |
| Report post | Feed / Inicio | `src/components/feed/ReportPostDialog.tsx` | needs_adaptation | 14.83% |
| Banner del feed | Feed / Inicio | `src/components/feed/FeedHero.tsx` | needs_adaptation | 14.26% |
| My posts | Feed / Inicio | `src/components/feed/MyPostsView.tsx` | needs_adaptation | 13.37% |
| Story ers | Feed / Inicio | `src/components/feed/StoryViewersSheet.tsx` | needs_adaptation | 6.71% |
| _… 5 más_ | | | | |

### Mi perfil (4)

| Editar perfil | Mi perfil | `src/components/feed/EditProfileView.tsx` | needs_adaptation | 69.46% |
| Mi galería | Mi perfil | `src/components/feed/ProfileGallery.tsx` | needs_adaptation | 65.74% |
| Vista Mi perfil | Mi perfil | `src/components/feed/ProfileView.tsx` | needs_adaptation | 36.48% |
| Comentarios del perfil | Mi perfil | `src/components/feed/ProfileCommentsView.tsx` | needs_adaptation | 8.45% |

### Perfil de otros usuarios (1)

| Perfil de otro usuario | Perfil de otros usuarios | `src/components/feed/UserProfileView.tsx` | minor_drift | 96.97% |

### Historias y búsqueda (3)

| Búsqueda global | Historias y búsqueda | `src/components/feed/GlobalSearchView.tsx` | needs_adaptation | 3.6% |
| Visor de historias | Historias y búsqueda | `src/components/feed/StoryViewer.tsx` | needs_adaptation | 2.38% |
| Agregar historia | Historias y búsqueda | `src/components/feed/AddStorySheet.tsx` | needs_adaptation | 0.18% |

### Mapa y eventos (6)

| Host picker | Mapa y eventos | `src/components/events/HostPickerModal.tsx` | needs_adaptation | 79.84% |
| My events | Mapa y eventos | `src/components/feed/MyEventsView.tsx` | needs_adaptation | 73.31% |
| Map | Mapa y eventos | `src/components/feed/MapView.tsx` | needs_adaptation | 67.73% |
| Events | Mapa y eventos | `src/components/feed/EventsView.tsx` | needs_adaptation | 39.44% |
| Favorites | Mapa y eventos | `src/components/feed/FavoritesView.tsx` | needs_adaptation | 38.67% |
| Seating map editor | Mapa y eventos | `src/components/events/SeatingMapEditor.tsx` | minor_drift | 91.0% |

### Crear / publicar evento (7)

| Step agenda | Crear / publicar evento | `src/components/events/StepAgenda.tsx` | needs_adaptation | 84.23% |
| Step event summary | Crear / publicar evento | `src/components/events/StepEventSummary.tsx` | needs_adaptation | 76.25% |
| Step event location | Crear / publicar evento | `src/components/events/StepEventLocation.tsx` | needs_adaptation | 69.09% |
| Publish flow | Crear / publicar evento | `src/components/events/PublishFlowModal.tsx` | needs_adaptation | 65.39% |
| Step event details | Crear / publicar evento | `src/components/events/StepEventDetails.tsx` | needs_adaptation | 65.23% |
| Create event | Crear / publicar evento | `src/components/events/CreateEventView.tsx` | needs_adaptation | 64.07% |
| Step access control | Crear / publicar evento | `src/components/events/StepAccessControl.tsx` | needs_adaptation | 63.1% |

### Detalle de evento (2)

| Event preview | Detalle de evento | `src/components/events/EventPreviewModal.tsx` | needs_adaptation | 71.71% |
| Event detail | Detalle de evento | `src/components/events/EventDetailView.tsx` | needs_adaptation | 34.62% |

### Invitaciones y tickets (3)

| Ticket purchase flow | Invitaciones y tickets | `src/components/invitations/TicketPurchaseFlow.tsx` | needs_adaptation | 78.45% |
| Invitation event detail | Invitaciones y tickets | `src/components/invitations/InvitationEventDetailView.tsx` | needs_adaptation | 73.66% |
| My invitations | Invitaciones y tickets | `src/components/invitations/MyInvitationsView.tsx` | needs_adaptation | 48.93% |

### Control de acceso (2)

| Access control list | Control de acceso | `src/components/access/AccessControlListView.tsx` | needs_adaptation | 18.31% |
| Scan qr | Control de acceso | `src/components/access/ScanQRSheet.tsx` | needs_adaptation | 13.64% |

### Invitados (7)

| Guest management | Invitados | `src/components/guests/GuestManagementView.tsx` | needs_adaptation | 74.75% |
| Edit guest | Invitados | `src/components/guests/EditGuestModal.tsx` | needs_adaptation | 65.78% |
| Contact import | Invitados | `src/components/guests/ContactImportModal.tsx` | needs_adaptation | 56.4% |
| Event invitation | Invitados | `src/components/guests/EventInvitationModal.tsx` | needs_adaptation | 43.3% |
| Add guest | Invitados | `src/components/guests/AddGuestModal.tsx` | needs_adaptation | 2.4% |
| Group drop zone | Invitados | `src/components/guests/GroupDropZone.tsx` | minor_drift | 96.91% |
| Draggable guest card | Invitados | `src/components/guests/DraggableGuestCard.tsx` | minor_drift | 95.08% |

### Chat y mensajes (4)

| Private chat | Chat y mensajes | `src/components/chat/PrivateChatView.tsx` | needs_adaptation | 84.23% |
| Chat room | Chat y mensajes | `src/components/chat/ChatRoomView.tsx` | needs_adaptation | 72.12% |
| Messages list | Chat y mensajes | `src/components/chat/MessagesListView.tsx` | needs_adaptation | 51.87% |
| Chat settings | Chat y mensajes | `src/components/chat/ChatSettingsSheet.tsx` | minor_drift | 97.92% |

### Pagos y banca (4)

| Success | Pagos y banca | `src/components/banking/SuccessModal.tsx` | needs_adaptation | 75.85% |
| Banking form | Pagos y banca | `src/components/banking/BankingForm.tsx` | needs_adaptation | 68.52% |
| Banking hub | Pagos y banca | `src/components/banking/BankingHub.tsx` | needs_adaptation | 18.88% |
| Payment methods dashboard | Pagos y banca | `src/components/banking/PaymentMethodsDashboard.tsx` | needs_adaptation | 18.56% |

### Servicios (6)

| My services | Servicios | `src/components/services/MyServicesView.tsx` | needs_adaptation | 79.58% |
| Step unified | Servicios | `src/components/services/StepUnified.tsx` | needs_adaptation | 69.91% |
| Booking | Servicios | `src/components/services/BookingSheet.tsx` | needs_adaptation | 62.57% |
| Service detail | Servicios | `src/components/services/ServiceDetailView.tsx` | needs_adaptation | 62.28% |
| Payment gateway | Servicios | `src/components/services/PaymentGatewaySheet.tsx` | needs_adaptation | 50.87% |
| Booking review | Servicios | `src/components/services/BookingReviewSheet.tsx` | needs_adaptation | 15.78% |

### Asistente IA (2)

| Aiassistant fab | Asistente IA | `src/components/ai/AIAssistantFAB.tsx` | needs_adaptation | 55.71% |
| Aiassistant | Asistente IA | `src/components/ai/AIAssistantView.tsx` | needs_adaptation | 20.34% |

### Panel admin (8)

| Admin users panel | Panel admin | `src/components/admin/AdminUsersPanel.tsx` | needs_adaptation | 2.47% |
| Payments panel | Panel admin | `src/components/admin/PaymentsPanel.tsx` | needs_adaptation | 2.25% |
| New users panel | Panel admin | `src/components/admin/NewUsersPanel.tsx` | needs_adaptation | 2.15% |
| Admin refunds panel | Panel admin | `src/components/admin/AdminRefundsPanel.tsx` | needs_adaptation | 2.1% |
| Support search panel | Panel admin | `src/components/admin/SupportSearchPanel.tsx` | needs_adaptation | 2.0% |
| Admin panel | Panel admin | `src/components/admin/AdminPanelView.tsx` | needs_adaptation | 1.24% |
| Admin reports panel | Panel admin | `src/components/admin/AdminReportsPanel.tsx` | needs_adaptation | 0.99% |
| Event sales detail | Panel admin | `src/components/admin/EventSalesDetail.tsx` | needs_adaptation | 0.17% |

## Próximo paso

Quedan **118** gap(s) frontend. Re-ejecutar workflow `lovable-gap-empalme` con `batch_index=3` (batch_size=20).

Implementar **6** ítem(s) de backend documentados antes de marcar empalme al 100%.
