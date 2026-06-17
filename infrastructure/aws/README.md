# DoEventsWEB - Despliegue QA en AWS (us-east-2)

Este documento describe cómo desplegar la aplicación web en el entorno QA usando:
- **API Gateway QA**: `https://api-qa.doeventsapp.com`
- **Dominio web**: `https://doeventsapp-pre.com`
- **Región AWS**: `us-east-2`

## Arquitectura de despliegue

```
Route53 (doeventsapp-pre.com)
    └── CloudFront Distribution
            ├── /              → S3 bucket (shell - host app)
            └── /mfe-auth/*    → S3 bucket (microfrontend auth)
    Cognito User Pool (OAuth 2.0)
    API Gateway QA (api-qa.doeventsapp.com)
            └── Lambdas qa-aws-lambda-*
    DynamoDB (*-qa tables)
```

## Prerrequisitos

1. AWS CLI configurado con acceso a `us-east-2`
2. Node.js >= 20
3. Certificado ACM en `us-east-1` para CloudFront (requerido para dominios custom)
4. Hosted Zone Route53 para `doeventsapp.com`

## Paso 1: Build de la aplicación

```powershell
cd DoEventsWEB
npm install
$env:DOEVENTS_ENV="qa"
npm run build
```

Los artefactos quedan en:
- `packages/shell/dist/` — aplicación host
- `packages/mfe-auth/dist/` — microfrontend de autenticación

## Paso 2: Crear buckets S3

```powershell
aws s3 mb s3://doevents-web-qa-shell --region us-east-2
aws s3 mb s3://doevents-web-qa-mfe-auth --region us-east-2
```

Subir artefactos:

```powershell
aws s3 sync packages/shell/dist/ s3://doevents-web-qa-shell/ --delete
aws s3 sync packages/mfe-auth/dist/ s3://doevents-web-qa-mfe-auth/ --delete --prefix mfe-auth/
```

## Paso 3: CloudFront

Crear una distribución CloudFront con:
- **Origin 1**: `doevents-web-qa-shell.s3.us-east-2.amazonaws.com` (default)
- **Origin 2**: `doevents-web-qa-mfe-auth.s3.us-east-2.amazonaws.com` (path `/mfe-auth/*`)
- **Default root object**: `index.html`
- **Error pages**: 403/404 → `/index.html` (200) para SPA routing
- **Alternate domain**: `doeventsapp-pre.com`
- **SSL Certificate**: ACM cert para `doeventsapp-pre.com`

## Paso 4: Cognito User Pool (QA)

En [AWS Console us-east-2](https://us-east-2.console.aws.amazon.com/cognito/home?region=us-east-2):

1. Crear User Pool `doevents-web-qa`
2. Crear App Client con:
   - **Callback URLs**: `https://doeventsapp-pre.com/auth/callback`
   - **Sign-out URLs**: `https://doeventsapp-pre.com/auth/login`
   - **OAuth 2.0 flows**: Authorization code grant
   - **Scopes**: openid, email, profile
3. Configurar dominio Cognito: `doevents-qa.auth.us-east-2.amazoncognito.com`
4. Actualizar `config/environments/index.ts` con:
   - `cognito.userPoolId`
   - `cognito.clientId`

### Identity Providers (OAuth 2.0)

| Provider | Configuración requerida |
|----------|------------------------|
| Google   | Client ID + Secret (consola Google Cloud) |
| Facebook | App ID + Secret (Meta Developers) |
| Apple    | Services ID + Key (Apple Developer) |

**Importante**: Los redirect URIs deben incluir:
- `https://doeventsapp-pre.com/auth/callback`
- `https://doevents-qa.auth.us-east-2.amazoncognito.com/oauth2/idpresponse`

## Paso 5: Route53

Crear registro A (Alias) en la hosted zone `doeventsapp.com`:

```
doeventsapp-pre.com  →  Alias  →  CloudFront distribution
```

## Paso 6: CORS en API Gateway QA

Verificar que `api-qa.doeventsapp.com` permita:
- **Origin**: `https://doeventsapp-pre.com`
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization

Los cambios de CORS para lambdas están en la rama `feature/migracionWEB` de DoEventsBack.

## Variables de entorno

Copiar `.env.example` a `.env.qa` y completar:

```env
VITE_DOEVENTS_ENV=qa
VITE_GOOGLE_CLIENT_ID=
VITE_FACEBOOK_APP_ID=
VITE_APPLE_CLIENT_ID=
```

## Verificación

1. Abrir `https://doeventsapp-pre.com/auth/login`
2. Probar login con usuario QA existente
3. Probar flujo de registro → OTP → gustos
4. Probar recuperación de contraseña

## Script automatizado

Ver `infrastructure/aws/deploy-qa.ps1` para despliegue automatizado.
