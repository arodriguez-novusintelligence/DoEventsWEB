# Reporte empalme de gaps — Run 27904918660

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-21 13:00 UTC |
| Batch | 1 / 6 |
| Gaps en batch | 20 |
| Entorno | [https://dev.doeventsapp.com](https://dev.doeventsapp.com) |

## Resumen de similitud

| Métrica | Antes | Después | Delta |
|---------|-------|---------|-------|
| Similitud global | **80.84%** | **80.84%** | **+0.0%** |
| Gaps pendientes totales | 117 | 117 | +0 |
| Gaps mejorados en batch | — | **5** / 20 | — |

## Empalme realizado (este batch)

| Feature (Lovable) | WEB | Sim. antes | Sim. después | Mejoró |
|-------------------|-----|------------|--------------|--------|
| Event preview | `packages/shell/src/lovable/components/events/EventPreviewModal.tsx` | 84.07% | 84.47% | ✅ |
| My reserved services | `packages/shell/src/lovable/components/purchases/MyReservedServicesView.tsx` | 77.76% | 78.6% | ✅ |
| Service detail | `packages/shell/src/lovable/components/services/ServiceDetailView.tsx` | 82.2% | 81.52% | ⚠️ |
| My purchases | `packages/shell/src/lovable/components/purchases/MyPurchasesView.tsx` | 77.88% | 77.72% | ⚠️ |
| My posts | `packages/shell/src/lovable/components/feed/MyPostsView.tsx` | 79.3% | 79.52% | ✅ |
| Seating map editor | `packages/shell/src/lovable/components/events/SeatingMapEditor.tsx` | 84.63% | 84.58% | ⚠️ |
| Main info section | `packages/shell/src/lovable/components/venues/sections/MainInfoSection.tsx` | 78.92% | 78.92% | ⚠️ |
| Host picker | `packages/shell/src/lovable/components/events/HostPickerModal.tsx` | 82.88% | 82.76% | ⚠️ |
| Aiassistant fab | `packages/shell/src/lovable/components/ai/AIAssistantFAB.tsx` | 84.13% | 84.13% | ⚠️ |
| Ticket detail | `packages/shell/src/lovable/components/tickets/TicketDetailView.tsx` | 77.74% | 77.67% | ⚠️ |
| Step unified | `packages/shell/src/lovable/components/services/StepUnified.tsx` | 80.65% | 80.56% | ⚠️ |
| Seat location | `packages/shell/src/lovable/components/tickets/SeatLocationModal.tsx` | 79.2% | 78.89% | ⚠️ |
| Step access control | `packages/shell/src/lovable/components/events/StepAccessControl.tsx` | 82.42% | 83.1% | ✅ |
| Events | `packages/shell/src/lovable/components/feed/EventsView.tsx` | 81.2% | 81.18% | ⚠️ |
| Banner promocional | `packages/shell/src/lovable/components/feed/FeedBanner.tsx` | 84.72% | 84.72% | ⚠️ |
| Banking hub | `packages/shell/src/lovable/components/banking/BankingHub.tsx` | 79.38% | 78.86% | ⚠️ |
| Refund ticket flow | `packages/shell/src/lovable/components/tickets/RefundTicketFlow.tsx` | 83.84% | 83.93% | ✅ |
| Faqsection | `packages/shell/src/lovable/components/venues/sections/FAQSection.tsx` | 83.72% | 83.56% | ⚠️ |
| Company context | `packages/shell/src/lovable/contexts/CompanyContext.tsx` | 80.45% | 80.45% | ⚠️ |
| Add guest | `packages/shell/src/lovable/components/guests/AddGuestModal.tsx` | 79.45% | 79.45% | ⚠️ |

## Backend pendiente para cerrar al 100%

| Gap / Feature | lovablePath | Motivo | Acción | Prioridad |
|---------------|-------------|--------|--------|-----------|
| Banking delete | ``src/components/banking/BankingHub.tsx`` | Sin endpoint eliminar cuenta | Implementar en DoEventsBack; UI documenta bloqueo | Alta |
| PaymentMethods delete | ``src/components/banking/PaymentMethodsDashboard.tsx`` | Mismo contrato delete | Reutilizar endpoint delete | Alta |
| KYC submit | ``src/components/feed/KycCertificationView.tsx`` | Sin envío documentos KYC | Integración proveedor; botón deshabilitado | Alta |
| EditProfile password/gustos | ``src/components/feed/EditProfileView.tsx`` | Cambio contraseña + intereses persistentes | Conectar flujos UI | Media |
| Booking add-ons | ``src/components/services/BookingSheet.tsx`` | Catálogo servicios adicionales | Exponer catálogo real | Media |
| PublishFlow banking | ``src/components/events/PublishFlowModal.tsx`` | Persistencia banco post-publicación | Implementar en DoEventsBack | Media |
| GlobalSearch posts | ``src/components/feed/GlobalSearchView.tsx`` | Sin búsqueda full-text publicaciones | Endpoint dedicado; UI filtra feed reciente | Media |
| PULEP Colombia campos | ``src/data/eventFormData.ts`` | Registro PULEP no persiste en evento | Persistir + validar registro | Media |
| Service reviews | ``src/components/services/MyServicesView.tsx`` | Reseñas vacías sin API | Exponer endpoint; UI lista vacía real | Baja |

## Gaps frontend aún pendientes

### Autenticación (2)

| Diálogo de términos | Autenticación | `src/components/auth/TermsDialog.tsx` | needs_adaptation | 64.77% |
| Logo de autenticación | Autenticación | `src/components/auth/AuthLogo.tsx` | needs_adaptation | 64.53% |

### Feed / Inicio (17)

| Banner promocional | Feed / Inicio | `src/components/feed/FeedBanner.tsx` | needs_adaptation | 84.72% |
| My posts | Feed / Inicio | `src/components/feed/MyPostsView.tsx` | needs_adaptation | 79.52% |
| Crear publicación | Feed / Inicio | `src/components/feed/CreatePostSheet.tsx` | needs_adaptation | 77.6% |
| Story ers | Feed / Inicio | `src/components/feed/StoryViewersSheet.tsx` | needs_adaptation | 77.38% |
| Report post | Feed / Inicio | `src/components/feed/ReportPostDialog.tsx` | needs_adaptation | 77.27% |
| Banner del feed | Feed / Inicio | `src/components/feed/FeedHero.tsx` | needs_adaptation | 76.3% |
| Notifications | Feed / Inicio | `src/components/feed/NotificationsSheet.tsx` | needs_adaptation | 75.84% |
| Feed services carousel | Feed / Inicio | `src/components/feed/FeedServicesCarousel.tsx` | needs_adaptation | 73.13% |
| Followers | Feed / Inicio | `src/components/feed/FollowersSheet.tsx` | needs_adaptation | 73.08% |
| Comments | Feed / Inicio | `src/components/feed/CommentsSheet.tsx` | needs_adaptation | 72.02% |
| _… 7 más_ | | | | |

### Mi perfil (4)

| Mi galería | Mi perfil | `src/components/feed/ProfileGallery.tsx` | needs_adaptation | 76.78% |
| Comentarios del perfil | Mi perfil | `src/components/feed/ProfileCommentsView.tsx` | needs_adaptation | 45.29% |
| Editar perfil | Mi perfil | `src/components/feed/EditProfileView.tsx` | minor_drift | 92.09% |
| Vista Mi perfil | Mi perfil | `src/components/feed/ProfileView.tsx` | minor_drift | 91.84% |

### Perfil de otros usuarios (1)

| Perfil de otro usuario | Perfil de otros usuarios | `src/components/feed/UserProfileView.tsx` | minor_drift | 89.32% |

### Historias y búsqueda (3)

| Visor de historias | Historias y búsqueda | `src/components/feed/StoryViewer.tsx` | needs_adaptation | 48.91% |
| Búsqueda global | Historias y búsqueda | `src/components/feed/GlobalSearchView.tsx` | needs_adaptation | 11.39% |
| Agregar historia | Historias y búsqueda | `src/components/feed/AddStorySheet.tsx` | needs_adaptation | 5.0% |

### Mapa y eventos (9)

| Seating map editor | Mapa y eventos | `src/components/events/SeatingMapEditor.tsx` | needs_adaptation | 84.58% |
| Host picker | Mapa y eventos | `src/components/events/HostPickerModal.tsx` | needs_adaptation | 82.76% |
| Events | Mapa y eventos | `src/components/feed/EventsView.tsx` | needs_adaptation | 81.18% |
| Event location map | Mapa y eventos | `src/components/events/EventLocationMap.tsx` | needs_adaptation | 74.79% |
| Map | Mapa y eventos | `src/components/feed/MapView.tsx` | needs_adaptation | 47.46% |
| Step refund policy | Mapa y eventos | `src/components/events/StepRefundPolicy.tsx` | minor_drift | 96.35% |
| Favorites | Mapa y eventos | `src/components/feed/FavoritesView.tsx` | minor_drift | 91.06% |
| Step faqs | Mapa y eventos | `src/components/events/StepFaqs.tsx` | minor_drift | 90.59% |
| My events | Mapa y eventos | `src/components/feed/MyEventsView.tsx` | minor_drift | 90.54% |

### Crear / publicar evento (7)

| Step access control | Crear / publicar evento | `src/components/events/StepAccessControl.tsx` | needs_adaptation | 83.1% |
| Publish flow | Crear / publicar evento | `src/components/events/PublishFlowModal.tsx` | needs_adaptation | 53.07% |
| Step event location | Crear / publicar evento | `src/components/events/StepEventLocation.tsx` | minor_drift | 97.1% |
| Create event | Crear / publicar evento | `src/components/events/CreateEventView.tsx` | minor_drift | 93.98% |
| Step agenda | Crear / publicar evento | `src/components/events/StepAgenda.tsx` | minor_drift | 93.95% |
| Step event summary | Crear / publicar evento | `src/components/events/StepEventSummary.tsx` | minor_drift | 93.7% |
| Step event details | Crear / publicar evento | `src/components/events/StepEventDetails.tsx` | minor_drift | 93.66% |

### Detalle de evento (2)

| Event preview | Detalle de evento | `src/components/events/EventPreviewModal.tsx` | needs_adaptation | 84.47% |
| Event detail | Detalle de evento | `src/components/events/EventDetailView.tsx` | needs_adaptation | 46.34% |

### Invitaciones y tickets (3)

| My invitations | Invitaciones y tickets | `src/components/invitations/MyInvitationsView.tsx` | needs_adaptation | 74.83% |
| Ticket purchase flow | Invitaciones y tickets | `src/components/invitations/TicketPurchaseFlow.tsx` | needs_adaptation | 21.88% |
| Invitation event detail | Invitaciones y tickets | `src/components/invitations/InvitationEventDetailView.tsx` | minor_drift | 88.37% |

### Control de acceso (2)

| Access control list | Control de acceso | `src/components/access/AccessControlListView.tsx` | needs_adaptation | 76.03% |
| Scan qr | Control de acceso | `src/components/access/ScanQRSheet.tsx` | needs_adaptation | 68.53% |

### Invitados (7)

| Add guest | Invitados | `src/components/guests/AddGuestModal.tsx` | needs_adaptation | 79.45% |
| Contact import | Invitados | `src/components/guests/ContactImportModal.tsx` | needs_adaptation | 76.63% |
| Event invitation | Invitados | `src/components/guests/EventInvitationModal.tsx` | needs_adaptation | 68.21% |
| Draggable guest card | Invitados | `src/components/guests/DraggableGuestCard.tsx` | minor_drift | 96.01% |
| Group drop zone | Invitados | `src/components/guests/GroupDropZone.tsx` | minor_drift | 89.13% |
| Edit guest | Invitados | `src/components/guests/EditGuestModal.tsx` | minor_drift | 87.35% |
| Guest management | Invitados | `src/components/guests/GuestManagementView.tsx` | minor_drift | 85.65% |

### Chat y mensajes (4)

| Messages list | Chat y mensajes | `src/components/chat/MessagesListView.tsx` | needs_adaptation | 75.59% |
| Private chat | Chat y mensajes | `src/components/chat/PrivateChatView.tsx` | minor_drift | 95.77% |
| Chat settings | Chat y mensajes | `src/components/chat/ChatSettingsSheet.tsx` | minor_drift | 95.23% |
| Chat room | Chat y mensajes | `src/components/chat/ChatRoomView.tsx` | minor_drift | 92.46% |

### Pagos y banca (4)

| Banking hub | Pagos y banca | `src/components/banking/BankingHub.tsx` | needs_adaptation | 78.86% |
| Success | Pagos y banca | `src/components/banking/SuccessModal.tsx` | minor_drift | 95.63% |
| Banking form | Pagos y banca | `src/components/banking/BankingForm.tsx` | minor_drift | 95.37% |
| Payment methods dashboard | Pagos y banca | `src/components/banking/PaymentMethodsDashboard.tsx` | minor_drift | 93.68% |

### Servicios (6)

| Service detail | Servicios | `src/components/services/ServiceDetailView.tsx` | needs_adaptation | 81.52% |
| Step unified | Servicios | `src/components/services/StepUnified.tsx` | needs_adaptation | 80.56% |
| Booking review | Servicios | `src/components/services/BookingReviewSheet.tsx` | needs_adaptation | 72.46% |
| Booking | Servicios | `src/components/services/BookingSheet.tsx` | minor_drift | 93.83% |
| Payment gateway | Servicios | `src/components/services/PaymentGatewaySheet.tsx` | minor_drift | 93.19% |
| My services | Servicios | `src/components/services/MyServicesView.tsx` | minor_drift | 91.87% |

### Asistente IA (2)

| Aiassistant fab | Asistente IA | `src/components/ai/AIAssistantFAB.tsx` | needs_adaptation | 84.13% |
| Aiassistant | Asistente IA | `src/components/ai/AIAssistantView.tsx` | needs_adaptation | 56.83% |

### Panel admin (7)

| Admin refunds panel | Panel admin | `src/components/admin/AdminRefundsPanel.tsx` | needs_adaptation | 21.8% |
| Admin panel | Panel admin | `src/components/admin/AdminPanelView.tsx` | needs_adaptation | 16.81% |
| Admin reports panel | Panel admin | `src/components/admin/AdminReportsPanel.tsx` | needs_adaptation | 16.62% |
| Admin users panel | Panel admin | `src/components/admin/AdminUsersPanel.tsx` | needs_adaptation | 10.21% |
| Payments panel | Panel admin | `src/components/admin/PaymentsPanel.tsx` | needs_adaptation | 9.84% |
| New users panel | Panel admin | `src/components/admin/NewUsersPanel.tsx` | needs_adaptation | 9.34% |
| Support search panel | Panel admin | `src/components/admin/SupportSearchPanel.tsx` | needs_adaptation | 8.09% |

## Próximo paso

Quedan **117** gap(s) frontend. Re-ejecutar workflow `lovable-gap-empalme` con `batch_index=2` (batch_size=20).

Implementar **9** ítem(s) de backend documentados antes de marcar empalme al 100%.
