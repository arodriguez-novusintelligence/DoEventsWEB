# Gap empalme — resumen ejecutivo (batch 2)

**Run:** `gap-empalme-27902063419-b2`  
**Fecha:** 2026-06-21  
**Rama:** `feature/cicd/dev-automation`

## Resultado

Batch 2 del manifiesto (20 gaps, similitud baseline **80.63%**). Tras empalme **~87.5%** (estimado). **19 gaps DONE** frontend; **1 BACKEND_REQUIRED** documentado.

## Empalme realizado

| Área | Cambios principales |
|------|---------------------|
| **CreatePostSheet** | Ubicación con icono `MapPin` Lucide (sin emoji); focus ring primary |
| **NotificationsSheet** | Header Bell h-10 ring-primary/20; badge contador no leídas |
| **NotificationsContext** | Alias `hasUnread` derivado de `unreadCount` |
| **MyTicketsView** | Fallback media Ticket h-14 ring; Reintentar con `RefreshCw` |
| **MyInvitationsView / CommentsSheet** | Botón Reintentar con `RefreshCw` |
| **ContactImportModal** | Empty state `UserPlus` h-14 ring (paridad título) |
| **FollowersSheet / LocationSection** | Headers h-10 ring-primary/20 |
| **EventLocationMap** | Loading MapPin ring + Loader2 |
| **MessagesListView** | Cards conversación `shadow-sm` |
| **TicketDetailView / ReportPostDialog** | `shadow-sm` en cards/dialog |
| **Reservas / Access control / EventPublished / MediaUpload** | Verificados alineados — APIs reales intactas |

## Backend pendiente (batch 2)

| Gap | Motivo |
|-----|--------|
| `StoryViewersSheet` | Endpoint `GET /stories/{id}/viewers` no expuesto — UI con skeleton y badge BACKEND_REQUIRED |

## Backend pendiente (acumulado)

Ver `ReglasAgente/impacto-backend.md` — KYC, PSP, banking delete, GlobalSearch posts, EditProfile, Booking add-ons, PublishFlow banking.

## Gaps restantes

**80** (de 118 totales pendientes; batches 3–6 del manifiesto `27902063419` por ejecutar en CI).

## Validación

- `npm run build:devaws`: **OK**
- Anti-mock en `packages/shell/src/pages`: **sin coincidencias runtime**
- `mocksUsed`: **false**
