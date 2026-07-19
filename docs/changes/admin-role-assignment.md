# Asignación de roles de administración

## Problema
Usuarios promovidos a admin en el backoffice no veían el enlace «Panel de administración» en el menú lateral.

## Causas
1. **Cuentas duplicadas** por el mismo correo (p. ej. Google OAuth creaba un registro nuevo sin vincular el existente).
2. **Rol asignado a un `userId` distinto** al de la sesión activa del usuario.
3. **Sesión sin refresco**: el menú solo consultaba el rol al montar la app; tras asignar admin hacía falta recargar o volver a iniciar sesión.

## Cambios
- **Backoffice** (`patchUser`): propaga `platformRole` a todas las cuentas con el mismo email.
- **Login OAuth**: si el correo ya existe en `EmailIndex`, vincula `platformUserId` en lugar de crear usuario nuevo.
- **Login email/contraseña**: prioriza la cuenta con rol elevado cuando hay duplicados.
- **Frontend**: `canAccessAdminPanel`, refresco al recuperar foco/cada 60s, persistencia de `platformRole` en sesión.
- **AdminStaffTab**: muestra ID de cuenta y aviso de correo duplicado.

## Verificación
1. Asignar rol admin a `lucamo823@gmail.com` en `/admin?tab=admin`.
2. El usuario cierra sesión y vuelve a entrar (o recarga la app).
3. En el menú lateral debe aparecer «Panel de administración».

## Deploy DEV
```powershell
cd DoEventsBack/aws-lambda-backoffice
npx serverless deploy --config serverless.dev.yml --stage dev --region sa-east-1

cd ../aws-lambda-login
npx serverless deploy --config serverless.dev.yml --stage dev --region sa-east-1

cd ../aws-lambda-subscriptions
npx serverless deploy --config serverless.dev.yml --stage dev --region sa-east-1

cd ../../DoEventsWEB
npm run build:devaws
npm run deploy:devaws
```
