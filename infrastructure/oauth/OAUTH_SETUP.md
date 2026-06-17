# Guía OAuth 2.0 — DoEventsWEB (QA)

Entorno QA:
- **Web:** `https://doeventsapp-pre.com`
- **Local:** `http://localhost:5173`
- **Cognito (QA):** `https://doevents-qa.auth.us-east-2.amazoncognito.com`
- **Región AWS:** `us-east-2`

---

## Resumen: qué URI poner en cada sitio

| Plataforma | Campo | URIs para QA | URIs para local |
|------------|-------|--------------|-----------------|
| **Google Cloud** | Orígenes JavaScript autorizados | `https://doeventsapp-pre.com` | `http://localhost:5173` |
| **Google Cloud** | URIs de redireccionamiento | `https://doeventsapp-pre.com/auth/callback` | `http://localhost:5173/auth/callback` |
| **Google Cloud** | (si usas Cognito) Redireccionamiento extra | `https://doevents-qa.auth.us-east-2.amazoncognito.com/oauth2/idpresponse` | — |
| **Facebook** | Valid OAuth Redirect URIs | `https://doeventsapp-pre.com/auth/callback` | `http://localhost:5173/auth/callback` |
| **Facebook** | (si usas Cognito) | `https://doevents-qa.auth.us-east-2.amazoncognito.com/oauth2/idpresponse` | — |
| **Apple** | Return URLs | `https://doeventsapp-pre.com/auth/callback` | `https://localhost:5173/auth/callback` |
| **Apple** | (si usas Cognito) | `https://doevents-qa.auth.us-east-2.amazoncognito.com/oauth2/idpresponse` | — |
| **Cognito** | Callback URLs | `https://doeventsapp-pre.com/auth/callback` | `http://localhost:5173/auth/callback` |
| **Cognito** | Sign-out URLs | `https://doeventsapp-pre.com/auth/login` | `http://localhost:5173/auth/login` |

> **Nota Apple local:** Apple exige HTTPS incluso en localhost. Para pruebas locales usa QA o un túnel (ngrok) con HTTPS.

---

## 1. Google Cloud Console

### Paso a paso

1. Entra a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto (o crea uno: **DoEvents Web QA**)
3. Menú → **APIs y servicios** → **Credenciales**
4. **+ Crear credenciales** → **ID de cliente de OAuth**
5. Si te lo pide, configura la **Pantalla de consentimiento OAuth**:
   - Tipo: **Externo** (o Interno si es solo tu org)
   - Nombre: `DoEvents`
   - Correo de asistencia: tu email
   - Dominios autorizados: `doeventsapp.com`
   - Ámbitos: `email`, `profile`, `openid`
6. Tipo de aplicación: **Aplicación web**
7. Nombre: `DoEventsWEB QA`

### URIs que debes pegar

**Orígenes autorizados de JavaScript:**
```
https://doeventsapp-pre.com
http://localhost:5173
```

**URIs de redireccionamiento autorizados:**
```
https://doeventsapp-pre.com/auth/callback
http://localhost:5173/auth/callback
https://doevents-qa.auth.us-east-2.amazoncognito.com/oauth2/idpresponse
```

8. Clic en **Crear**
9. Copia el **Client ID** (termina en `.apps.googleusercontent.com`)
10. Copia el **Client Secret** (lo necesitarás en Cognito si usas Hosted UI)

### Qué me envías

```
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx   (solo para Cognito, no va en el frontend)
```

---

## 2. Meta (Facebook) Developers

### URIs exactas para Facebook (copiar tal cual, una por línea)

En **Facebook Login → Configuración → URI de redireccionamiento de OAuth válidos**, pega **cada URI en una línea separada** (sin comas, sin espacios al final):

```
https://doevents-qa.auth.us-east-2.amazoncognito.com/oauth2/idpresponse
https://doeventsapp-pre.com/auth/callback
http://localhost:5173/auth/callback
```

> **Importante con Cognito:** La URI que Facebook exige al conectar con AWS es casi siempre la de **Cognito** (`.../oauth2/idpresponse`), no la de tu web. Si el error muestra otra URL, copia **exactamente** la que aparece en el mensaje de error o en la consola de Cognito.

### Si sale: "Este URI de redireccionamiento no es válido para esta aplicación"

1. **No uses el botón "Validar" todavía** — primero pega la URI en la lista y pulsa **Guardar cambios**.
2. Ve a la ruta correcta del panel (no "Dominios de la app"):
   - [developers.facebook.com](https://developers.facebook.com/) → tu app → **Inicio de sesión con Facebook** → **Configuración**
3. Activa estas opciones en la misma pantalla:
   - **Inicio de sesión del cliente OAuth** → Sí
   - **Inicio de sesión OAuth web** → Sí
   - **Inicio de sesión OAuth embebido** → Sí (recomendado)
4. En **Dominios de la app** (Configuración → Básica) pon solo el dominio **sin** `https://` ni rutas:
   ```
   doeventsapp-pre.com
   localhost
   ```
5. Si ya creaste Cognito con **otro prefijo** de dominio (no `doevents-qa`), la URI será distinta. En AWS Cognito → User Pool → **App integration** → **Domain** copia el dominio real y usa:
   ```
   https://TU-DOMINIO-REAL.auth.us-east-2.amazoncognito.com/oauth2/idpresponse
   ```
6. Espera 1–2 minutos tras guardar en Facebook y vuelve a validar en Cognito.

### Errores frecuentes

| Error | Solución |
|-------|----------|
| Barra final `/` de más | Usar `.../oauth2/idpresponse` **sin** `/` al final |
| `www.` de más o de menos | Debe coincidir exacto con tu dominio |
| URI en "Dominios de la app" | Ahí va solo `doeventsapp-pre.com`, la URI completa va en Facebook Login → Configuración |
| Producto Facebook Login no añadido | Panel → **Añadir producto** → **Inicio de sesión con Facebook** |

### Paso a paso

1. Entra a [Meta for Developers](https://developers.facebook.com/)
2. **Mis apps** → **Crear app**
3. Tipo: **Autenticar y solicitar datos de usuarios con inicio de sesión con Facebook**
4. Nombre: `DoEvents Web QA`
5. En el panel de la app → **Inicio de sesión con Facebook** → **Configurar** → **Web**
6. URL del sitio: `https://doeventsapp-pre.com`

### URIs que debes pegar

En **Inicio de sesión con Facebook** → **Configuración**:

**Valid OAuth Redirect URIs:**
```
https://doeventsapp-pre.com/auth/callback
http://localhost:5173/auth/callback
https://doevents-qa.auth.us-east-2.amazoncognito.com/oauth2/idpresponse
```

7. Activa el producto si está en modo desarrollo
8. **Configuración** → **Básica** → copia **App ID** y **App Secret**

### Modo Live

Para usuarios reales fuera de testers, cambia la app a **Live** en el panel superior.

### Qué me envías

```
FACEBOOK_APP_ID=xxxxxxxx
FACEBOOK_APP_SECRET=xxxxxxxx   (solo para Cognito/backend)
```

---

## 3. Apple Developer

### Paso a paso

1. Entra a [Apple Developer](https://developer.apple.com/account/)
2. **Certificates, Identifiers & Profiles** → **Identifiers**

#### 3.1 App ID (si no existe)
- **+** → **App IDs** → **App**
- Description: `DoEvents`
- Bundle ID: `com.doeventsapp.web` (ejemplo)
- Capabilities: **Sign In with Apple**

#### 3.2 Services ID (este es el Client ID web)
- **+** → **Services IDs**
- Description: `DoEvents Web QA`
- Identifier: `com.doeventsapp.web.qa` ← este valor va en `VITE_APPLE_CLIENT_ID`
- Activa **Sign In with Apple** → **Configure**:
  - Primary App ID: el App ID anterior
  - **Domains:** `doeventsapp-pre.com`
  - **Return URLs:**
    ```
    https://doeventsapp-pre.com/auth/callback
    https://doevents-qa.auth.us-east-2.amazoncognito.com/oauth2/idpresponse
    ```

#### 3.3 Key para Sign In with Apple
- **Keys** → **+**
- Nombre: `DoEvents Apple Sign In Key`
- Activa **Sign In with Apple** → Configure con tu App ID
- **Register** → descarga el archivo `.p8` (solo una vez)
- Anota el **Key ID**

#### 3.4 Team ID
- En la esquina superior derecha de Apple Developer → **Membership** → **Team ID**

### Qué me envías

```
APPLE_SERVICES_ID=com.doeventsapp.web.qa
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY=<contenido del archivo .p8>
```

---

## 4. AWS Cognito (us-east-2) — QA

Consola: [Cognito us-east-2](https://us-east-2.console.aws.amazon.com/cognito/home?region=us-east-2)

### 4.1 Crear User Pool

1. **Create user pool**
2. **Sign-in options:** Email (y opcional teléfono)
3. **Federated identity providers:** lo configuramos después
4. Nombre sugerido: `doevents-web-qa`
5. App client name: `doevents-web-qa-client`
6. **Don't generate a client secret** (app SPA / web pública)

### 4.2 Dominio Cognito

1. User Pool → **App integration** → **Domain**
2. Tipo: **Cognito domain**
3. Prefijo: `doevents-qa`
4. Resultado: `doevents-qa.auth.us-east-2.amazoncognito.com`

### 4.3 App client — URLs

En **App client** → **Hosted UI** (o Login pages):

| Campo | Valor |
|-------|-------|
| Allowed callback URLs | `https://doeventsapp-pre.com/auth/callback`, `http://localhost:5173/auth/callback` |
| Allowed sign-out URLs | `https://doeventsapp-pre.com/auth/login`, `http://localhost:5173/auth/login` |
| Identity providers | Google, Facebook, Sign in with Apple |
| OAuth 2.0 grant types | Authorization code grant |
| OpenID Connect scopes | `openid`, `email`, `profile` |

### 4.4 Conectar Google en Cognito

User Pool → **Sign-in experience** → **Federated identity provider sign-in** → **Add identity provider** → **Google**

| Campo | Valor |
|-------|-------|
| Google app ID | Client ID de Google Cloud |
| Google app secret | Client Secret de Google Cloud |
| Authorized scopes | `profile email openid` |

### 4.5 Conectar Facebook en Cognito

**Add identity provider** → **Facebook**

| Campo | Valor |
|-------|-------|
| App ID | Facebook App ID |
| App secret | Facebook App Secret |
| Authorized scopes | `public_profile,email` |

### 4.6 Conectar Apple en Cognito

**Add identity provider** → **Sign in with Apple**

| Campo | Valor |
|-------|-------|
| Services ID | `com.doeventsapp.web.qa` |
| Team ID | Tu Team ID |
| Key ID | Key ID del .p8 |
| Private key | Contenido del archivo .p8 |

### 4.7 Qué me envías de Cognito

```
VITE_COGNITO_USER_POOL_ID=us-east-2_XXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_DOMAIN=doevents-qa.auth.us-east-2.amazoncognito.com
```

---

## 5. Actualizar DoEventsWEB

Cuando tengas los valores, complétalos en `.env.qa`:

```env
VITE_DOEVENTS_ENV=qa
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=xxxxxxxx
VITE_APPLE_CLIENT_ID=com.doeventsapp.web.qa
VITE_COGNITO_USER_POOL_ID=us-east-2_XXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxx
VITE_COGNITO_DOMAIN=doevents-qa.auth.us-east-2.amazoncognito.com
```

Rebuild y despliegue:
```powershell
cd DoEventsWEB
npm run build:qa
.\infrastructure\aws\deploy-qa.ps1
```

---

## 6. Flujo de autenticación (cómo encaja todo)

```
Usuario → Botón Google/Facebook/Apple en doeventsapp-pre.com
       → Cognito Hosted UI (o SDK directo)
       → Proveedor OAuth (Google/Meta/Apple)
       → Redirect a /auth/callback
       → DoEventsWEB procesa token
       → Lambda /googleOAuth o /appleOAuth (DoEventsBack)
       → JWT de sesión DoEvents
```

---

## Checklist rápido

- [ ] Google: Client ID + Secret creados con URIs de arriba
- [ ] Facebook: App ID + Secret con redirect URIs
- [ ] Apple: Services ID + Key .p8 + Team ID
- [ ] Cognito QA: User Pool + dominio + 3 identity providers
- [ ] `.env.qa` completado en DoEventsWEB
- [ ] Build QA y deploy a S3/CloudFront
- [ ] Probar login social en `https://doeventsapp-pre.com/auth/login`
