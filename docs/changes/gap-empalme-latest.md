# Gap empalme — batch 1 (run 27839776030)

**Fecha:** 2026-06-19  
**Rama:** `feature/cicd/dev-automation`  
**Similitud antes:** 60.49% · **Objetivo:** 98%

## Resumen ejecutivo

Se cerraron **20 gaps** del manifiesto batch 1 mediante empalme en componentes existentes (sin copy-paste Lovable, sin mocks en runtime de `pages/`). El build `npm run build:devaws` finalizó **OK**.

## Empalme realizado (frontend)

| Área | Componente | Resultado |
|------|------------|-----------|
| Chat | PrivateChatView | Import `X`, delete vía `onDeleteMessage` |
| Chat | ChatRoomView | Moderación oculta sin API (`canModerate`) |
| Notificaciones | NotificationsContext | Eliminado bloque `initialNotifications` (fixture muerto) |
| Notificaciones | NotificationsSheet | Indicador visual no leídas (ring) |
| Eventos | StepAgenda, StepEventSummary, EventPreviewModal, HostPickerModal | UX preview/resumen/anfitrión alineada |
| Invitaciones | InvitationEventDetailView, TicketPurchaseFlow, MyInvitationsPage | Checkout real `/events/:id/checkout` |
| Mapa | MapView + mapAdapter | Horario real (`horaIni`/`horaFin`), Google Maps directions |
| Servicios | MyServicesView, StepUnified | Reseñas honestas (sin 0.0 ficticio), secciones accesibles |
| Feed | MyEventsView, EditProfileView | Ratings solo con datos; validación username |
| Banca | BankingForm, SuccessModal | Sin simulación SWIFT/cuenta; callback default method |
| IA | AIAssistantFAB | Safe-area + ring PRO |
| Invitados | GuestManagementView | Sin localStorage ficticio de conteos |
| Venues | SeatingCategoryDialog | Copy preview alineado |

## Backend pendiente

| Gap | Motivo | Prioridad |
|-----|--------|-----------|
| BankingForm / BankingHub | APIs persistencia métodos de pago y verificación cuenta | Alta |
| MyServicesView reviews | Endpoint ratings servicios | Media |
| ChatRoomView moderación | API kick/ban chat | Media |
| EditProfileView password/interests | Endpoints auth/perfil completos | Media |

## Gaps restantes

Tras este batch quedan **~98 gaps** en manifiestos posteriores (batches 2–6).

## Validación

- `npm run build:devaws`: **SUCCESS**
- Anti-mock `grep` en `pages/`: sin mocks nuevos (solo tipos preexistentes)
