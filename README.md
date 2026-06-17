# DoEventsWEB

Aplicación web de DoEvents con arquitectura de **microfrontends**, migrada desde DoEventsFront (React Native/Expo).

## Tecnología

| Componente | Tecnología | Motivo |
|-----------|-----------|--------|
| Framework | React 18 + TypeScript | Misma base que DoEventsFront, reutilización de lógica |
| Build | Vite 6 | Rápido, moderno, soporte Module Federation |
| Microfrontends | @module-federation/vite | Despliegue independiente por módulo |
| Estado | Redux Toolkit | Compatible con DoEventsFront |
| Responsive | CSS custom (design tokens) | Adaptable móvil y escritorio |

> **Nota sobre Flutter**: Se eligió React web por compatibilidad directa con DoEventsFront. Cuando la web esté estable, se puede empaquetar con Capacitor o migrar UI a Flutter reutilizando las APIs.

## Estructura del monorepo

```
DoEventsWEB/
├── config/environments/     # Configuración centralizada por entorno
├── packages/
│   ├── shared/              # Tema, API client, store, componentes compartidos
│   ├── shell/               # Host app (orquestador de microfrontends)
│   └── mfe-auth/            # Microfrontend: Autenticación (Fase 1)
├── infrastructure/aws/      # Scripts y docs de despliegue QA
└── .env.example             # Variables de entorno
```

## Fases de migración

| Fase | Módulo | Estado |
|------|--------|--------|
| **1** | Autenticación (login, registro, OTP, gustos, recuperar contraseña) | ✅ Implementado |
| 2 | Creación de eventos | Pendiente (tras validación Fase 1) |
| 3 | Chat | Pendiente |
| 4 | Notificaciones, perfil, boletas... | Pendiente |

## Configuración de entorno

Toda la configuración está centralizada en `config/environments/index.ts`:

```typescript
import { getEnvironment } from './config/environments';

const env = getEnvironment();
console.log(env.apiBaseUrl);      // https://api-qa.doeventsapp.com
console.log(env.webBaseUrl);      // https://doeventsapp-pre.com
console.log(env.endpoints.login); // https://api-qa.doeventsapp.com/login
```

Entornos disponibles: `dev`, `qa`, `prod`

## Desarrollo local

```powershell
cd DoEventsWEB
npm install
npm run dev:all    # Inicia shell (5173) + mfe-auth (5001)
```

Abrir: http://localhost:5173/auth/login

## Build QA

```powershell
$env:DOEVENTS_ENV="qa"
npm run build
```

## Entorno QA (AWS us-east-2)

| Recurso | Valor |
|---------|-------|
| API Gateway | `https://api-qa.doeventsapp.com` |
| Web (pre) | `https://doeventsapp-pre.com` |
| DynamoDB | Tablas con sufijo `-qa` (ej: `Client-qa`) |
| Lambdas | Prefijo `qa-` (ej: `qa-aws-lambda-login`) |
| Región | `us-east-2` |

Ver [infrastructure/aws/README.md](./infrastructure/aws/README.md) para despliegue completo.

## OAuth 2.0 — Credenciales pendientes

Para habilitar login con Google, Facebook y Apple necesitamos que configures:

1. **Google Cloud Console**: OAuth 2.0 Client ID (Web)
   - Authorized redirect URI: `https://doeventsapp-pre.com/auth/callback`
2. **Meta Developers**: Facebook App ID
   - Valid OAuth Redirect URI: `https://doeventsapp-pre.com/auth/callback`
3. **Apple Developer**: Services ID
   - Return URL: `https://doeventsapp-pre.com/auth/callback`

Una vez creados, actualiza `.env.qa` o `config/environments/index.ts` y habilita `oauth.*.enabled = true`.

## Backend

Los cambios de backend para la migración web van en la rama `feature/migracionWEB` de **DoEventsBack** (CORS, redirect URLs OAuth web).

## Repositorio

```powershell
cd DoEventsWEB
git init
git add .
git commit -m "feat: Fase 1 - autenticación web con microfrontends"
# Crear repo remoto DoEventsWEB y push
git remote add origin <URL_REPO_DOEVENTS_WEB>
git push -u origin main
```
