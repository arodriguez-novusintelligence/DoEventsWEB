# Google OAuth → Cognito QA

Client ID (público, ya configurado en DoEventsWEB):
```
465354618241-o281g4an56hcrvmjgc3p727otg2fej8m.apps.googleusercontent.com
```

Client Secret → **solo en AWS Cognito** (está en `.env.qa` local, no en git).

## Conectar Google en Cognito (us-east-2)

1. [Cognito us-east-2](https://us-east-2.console.aws.amazon.com/cognito/home?region=us-east-2)
2. User Pool QA → **Sign-in experience** → **Federated identity provider sign-in**
3. **Add identity provider** → **Google**
4. Completar:

| Campo | Valor |
|-------|-------|
| Google app ID | `465354618241-o281g4an56hcrvmjgc3p727otg2fej8m.apps.googleusercontent.com` |
| Google app secret | *(valor de GOOGLE_CLIENT_SECRET en `.env.qa`)* |
| Authorized scopes | `profile email openid` |

5. **Save changes**

## Verificar URIs en Google Cloud

Deben estar en **Credenciales → OAuth Client**:

**Orígenes JavaScript autorizados:**
```
https://qa.doeventsapp.com
```

**URIs de redireccionamiento autorizados:**
```
https://qa.doeventsapp.com/auth/callback
https://doevents-qa.auth.us-east-2.amazoncognito.com/oauth2/idpresponse
```

## Comportamiento actual de DoEventsWEB

| Estado Cognito | Botón Google |
|----------------|--------------|
| Cognito **sin** configurar | Login directo Google → Lambda `/googleOAuth` |
| Cognito **configurado** | Redirect a Cognito Hosted UI → Google |

Cuando completes `VITE_COGNITO_CLIENT_ID` en `.env.qa`, el flujo pasará automáticamente a Cognito.
