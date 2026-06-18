# DoEventsWEB — Guía de desarrollo local

Documentación de referencia para clonar, instalar, ejecutar y probar la aplicación web de **Do.Events** en `localhost`.

---

## 1. Información del proyecto

| Campo | Valor |
|-------|--------|
| **Nombre** | `doevents-web` |
| **Versión** | `0.1.0` |
| **Repositorio** | [github.com/doeventsrepo/DoEventsWEB](https://github.com/doeventsrepo/DoEventsWEB) — rama `develop` |
| **Código base** | Migración desde **DoEventsFront** (React Native / Expo) hacia **React 18 + TypeScript + Vite** |
| **Diseño UI** | Componentes portados desde **Lovable** (`version_17_06_2026` → `packages/shell/src/lovable`) |
| **Backend** | APIs REST en **DoEventsBack** (`api-qa.doeventsapp.com` en QA) |
| **Arquitectura** | Monorepo npm workspaces + **Module Federation** (microfrontends) |

---

## 2. Stack y dependencias principales

### Raíz (`package.json`)

| Dependencia | Versión | Uso |
|-------------|---------|-----|
| Node.js | `>= 20` | Runtime obligatorio |
| TypeScript | `^5.7.3` | Tipado |
| concurrently | `^9.1.2` | Ejecutar shell + auth en paralelo |

### Workspaces

| Paquete | Rol | Tecnologías clave |
|---------|-----|-------------------|
| `@doevents/shared` | API clients, Redux store, utilidades, tema | React 18, Redux Toolkit, axios |
| `@doevents/shell` | App host (rutas, layout, feed, eventos, perfil) | Vite 6, React Router 6, Radix UI, Tailwind |
| `@doevents/mfe-auth` | Microfrontend de autenticación | Vite 6, Module Federation |

### Integraciones

- **AWS API Gateway** — auth, eventos, lugares, servicios, chat, IA (`/ai/*`)
- **CloudFront + S3** — hosting estático QA/prod
- **Google Maps** — mapas en creación de eventos/lugares
- **Wompi** — pagos y suscripciones PRO (según entorno)

---

## 3. Estructura del repositorio

```
DoEventsWEB/
├── config/environments/       # URLs y endpoints por entorno (dev, qa, prod)
├── packages/
│   ├── shared/                # Código compartido entre microfrontends
│   ├── shell/                 # Aplicación principal
│   │   └── src/lovable/       # UI portada desde Lovable
│   └── mfe-auth/              # Login, registro, OTP, OAuth
├── infrastructure/aws/        # Scripts PowerShell de despliegue QA
├── .env.example               # Plantilla de variables locales
├── package.json
├── DESARROLLO.md              # Este archivo
└── README.md
```

---

## 4. Requisitos previos

1. **Node.js 20+** — [https://nodejs.org](https://nodejs.org)
2. **npm 10+** (incluido con Node)
3. **AWS CLI** (solo si vas a desplegar a QA)
4. Cuenta de usuario en entorno **QA** o **dev** del backend para probar login y APIs

---

## 5. Configuración inicial

```powershell
# 1. Clonar frontend (rama develop)
git clone https://github.com/doeventsrepo/DoEventsWEB.git
cd DoEventsWEB
git checkout develop

# 2. Instalar dependencias del monorepo
npm install

# 3. Variables de entorno locales (copiar plantilla)
copy .env.example .env.local
# Opcional: VITE_GOOGLE_MAPS_API_KEY para mapas en localhost
# Sin .env.local el dev apunta a API QA con valores por defecto en config/environments/
```

### Repositorios hermanos (opcional según tu rol)

```powershell
# Backend serverless (lambdas, DynamoDB)
git clone https://github.com/doeventsrepo/DoEventsBack.git
cd DoEventsBack && git checkout develop

# Asistente IA (/ai/*) — solo si trabajas en el chat o agentes
git clone https://github.com/doeventsrepo/DoEventsIA.git
cd DoEventsIA && git checkout develop
npm install
copy .env.example .env   # CURSOR_API_KEY solo para deploy local de IA
```

### Entornos (`config/environments/index.ts`)

| Entorno | Variable | API base | Web |
|---------|----------|----------|-----|
| Desarrollo | `DOEVENTS_ENV=dev` o por defecto | Configurado en `index.ts` | localhost |
| QA | `DOEVENTS_ENV=qa` | `https://api-qa.doeventsapp.com` | `https://qa.doeventsapp.com` |
| Producción | `DOEVENTS_ENV=prod` | `https://api.doeventsapp.com` | `https://doeventsapp.com` |

En local, sin variable explícita, el build de desarrollo suele apuntar a **QA** para tener datos reales de prueba.

---

## 6. Ejecutar en localhost

### Opción A — Shell + Auth (recomendado)

```powershell
npm run dev:all
```

| Servicio | URL |
|----------|-----|
| Shell (app principal) | http://localhost:5173 |
| Login | http://localhost:5173/auth/login |
| Microfrontend auth (remoto) | http://localhost:5001 |

### Opción B — Solo shell

```powershell
npm run dev
```

### Opción C — Solo módulo auth

```powershell
npm run dev:auth
```

---

## 7. Cómo probar en localhost

### Autenticación

1. Abre http://localhost:5173/auth/login
2. Inicia sesión con teléfono/OTP o Google/Apple (si están habilitados en QA)
3. Tras login, el shell carga el feed y el menú lateral

### Flujos principales

| Flujo | Ruta local | Notas |
|-------|------------|-------|
| Feed / muro | `/` | Requiere sesión |
| Mis eventos | `/my-events` | Crear, duplicar, publicar |
| Crear evento | `/events/create` | Wizard 7 pasos |
| Asistente IA | `/assistant` | Requiere plan PRO en QA |
| Perfil | `/profile` | Planes, lugares, servicios |
| Invitados | `/guests` | Gestión de invitaciones |

### Build de verificación

```powershell
# Build modo QA (igual que pipeline de despliegue)
npm run build:qa

# Previsualizar build estático
npm run preview
```

### Despliegue a QA (opcional)

```powershell
npm run deploy:qa
```

Requiere credenciales AWS con permisos sobre S3 `doevents-web-qa` y CloudFront.

---

## 8. Relación con otros repositorios

| Repositorio | URL | Relación |
|-------------|-----|----------|
| **DoEventsWEB** | [doeventsrepo/DoEventsWEB](https://github.com/doeventsrepo/DoEventsWEB) | Este frontend |
| **DoEventsBack** | [doeventsrepo/DoEventsBack](https://github.com/doeventsrepo/DoEventsBack) | Lambdas y APIs consumidas por `@doevents/shared` |
| **DoEventsIA** | [doeventsrepo/DoEventsIA](https://github.com/doeventsrepo/DoEventsIA) | Asistente IA — endpoint `/ai/chat` |
| **discover-joyful-feed** | [doeventsrepo/discover-joyful-feed](https://github.com/doeventsrepo/discover-joyful-feed) | Diseño Lovable de referencia (no es runtime) |
| **DoEventsFront** | App móvil Expo (repo legado) | Referencia de lógica migrada a web |

---

## 9. Solución de problemas

| Problema | Solución |
|----------|----------|
| Puerto 5173 ocupado | Cierra otras instancias de Vite o cambia puerto en `packages/shell/package.json` |
| Error CORS en API | Verifica que el backend QA permita `http://localhost:5173` |
| Module Federation no carga auth | Ejecuta `npm run dev:all` (auth en 5001) |
| `npm install` falla | Usa Node 20+, borra `node_modules` y `package-lock.json`, reinstala |

---

## 10. Versión y changelog

- **v0.1.0** — Arquitectura microfrontends, auth, feed, eventos, lugares, servicios, asistente IA, perfil y suscripciones integrados con backend QA.

*Última actualización: junio 2026*
