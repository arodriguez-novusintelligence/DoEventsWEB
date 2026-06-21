# Gap empalme — resumen ejecutivo (batch 1)

**Run:** `gap-empalme-27902063419-b1`  
**Fecha:** 2026-06-21  
**Rama:** `feature/cicd/dev-automation`

## Resultado

Batch 1 del manifiesto (20 gaps, similitud baseline **79.44%**). Tras empalme **~83.6%** (estimado). **19 gaps DONE** frontend; **1 BACKEND_REQUIRED** documentado.

## Empalme realizado

| Área | Cambios principales |
|------|---------------------|
| **ResetPassword / SignUp** | Ruta `/auth/reset-password` → `ResetPasswordView`; `SignUpView` con `CreateAccountPage embedded`; aliases `SignUpPage`/`ResetPasswordPage` en mfe-auth |
| **index.css** | Creado `packages/shell/src/index.css` (port-map); `.floating-action-button` en tokens DSF |
| **EventsView** | Chips categoría con tokens semánticos (`primary/accent/secondary`) en lugar de pink/violet hardcoded |
| **StepAccessControl / HostPickerModal** | `MapPin` Lucide; header icon `ring-primary/20` |
| **SeatingMapEditor** | `ImageIcon` Lucide en picker de formas |
| **AddGuestModal** | `Loader2` en búsqueda (consistencia Lovable) |
| **FeedBanner, ServiceDetailView, RefundTicketFlow, etc.** | Verificados alineados — rings h-14, Loader2, shadow-sm intactos |

## Backend pendiente (batch 1)

| Gap | Motivo |
|-----|--------|
| `BankingHub` | Delete cuenta bancaria + PayPal payout — sin endpoint `DELETE /bank-accounts/{id}` |

## Backend pendiente (acumulado)

Ver `ReglasAgente/impacto-backend.md` — KYC, PSP, story viewers, banking delete, GlobalSearch posts, EditProfile, Booking add-ons, PublishFlow banking.

## Gaps restantes

**100** (de 120 totales pendientes; batches 2–6 del manifiesto `27902063419` por ejecutar en CI).

## Validación

- `npm run build:devaws`: **OK**
- Anti-mock en `packages/shell/src/pages`: **sin coincidencias runtime**
- `mocksUsed`: **false**
