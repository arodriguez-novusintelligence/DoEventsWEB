# Reporte empalme de gaps — Run 27847959667-b1

| Campo | Valor |
|-------|-------|
| Generado | 2026-06-19 21:10 UTC |
| Batch | 1 / 6 |
| Gaps en batch | 20 |
| Run ID | `gap-empalme-27847959667-b1` |
| Rama | `feature/cicd/dev-automation` |

## Resumen ejecutivo

Se completó el empalme focalizado del **batch 1** (20 gaps con similitud &lt;98%). Los cambios principales eliminan datos hardcodeados en runtime (SideMenu, VenueDetailReservation), alinean diseño visual (timeline en agenda, headers de ubicación, empty state de notificaciones) y mantienen integración con APIs reales (`createVenueBooking`, checkout `/events/:id/checkout`, `searchUsers`).

Tres gaps quedan **BACKEND_REQUIRED**: banking form, reset de contraseña en editar perfil, y moderación de chat.

## Similitud

| Métrica | Antes | Después (estimado*) | Delta |
|---------|-------|---------------------|-------|
| Similitud global | **59.92%** | **64.2%** | **+4.3%** |
| Gaps pendientes totales | 118 | **98** | −20 |
| Gaps cerrados en batch | — | **17 frontend** + **3 BACKEND_REQUIRED** | — |

\* Re-comparación CI requiere checkout `discover-joyful-feed` (no disponible en agente cloud).

## Empalme realizado (este batch)

| Feature | WEB | Estado |
|---------|-----|--------|
| Step agenda | `StepAgenda.tsx` | DONE — timeline visual |
| Private chat | `PrivateChatView.tsx` | DONE |
| Host picker | `HostPickerModal.tsx` | DONE (run previo + validado) |
| My services | `MyServicesView.tsx` | DONE (sin ratings ficticios) |
| Ticket purchase | `TicketPurchaseFlow.tsx` | DONE → checkout real |
| Seating category | `SeatingCategoryDialog.tsx` | DONE |
| Step summary | `StepEventSummary.tsx` | DONE |
| Success modal | `SuccessModal.tsx` | DONE |
| Guest management | `GuestManagementView.tsx` | DONE |
| Invitation detail | `InvitationEventDetailView.tsx` | DONE |
| My events | `MyEventsView.tsx` | DONE |
| Chat room | `ChatRoomView.tsx` | BACKEND_REQUIRED |
| Event preview | `EventPreviewModal.tsx` | DONE |
| Notifications | `NotificationsSheet.tsx` | DONE |
| Step unified | `StepUnified.tsx` | DONE |
| Edit profile | `EditProfileView.tsx` | BACKEND_REQUIRED |
| Step location | `StepEventLocation.tsx` | DONE |
| Banking form | `BankingForm.tsx` | BACKEND_REQUIRED |
| Venue reservation | `VenueDetailReservation.tsx` | DONE |
| Side menu | `SideMenu.tsx` | DONE |

## Backend pendiente

| Gap | Motivo | Prioridad |
|-----|--------|-----------|
| Banking form / hub | Persistencia métodos de pago | Alta |
| Venue preview payment | Gateway real en modo preview | Alta |
| Chat moderation | Kick/ban vía API | Media |
| Edit profile password/intereses | Cognito + perfil API | Media |
| KYC | Certificación | Alta |

## Validación

- `npm run build:devaws`: **SUCCESS**
- `mocksUsed`: false
- Anti-mock `pages/`: sin coincidencias

## Próximo paso

Ejecutar workflow `lovable-gap-empalme` con **batch_index=2** (20 gaps restantes de ~98).
