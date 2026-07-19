# NADF en DoEventsWEB

Rama de trabajo NADF: **`feature/NovusAIDevelopmentFramework`**

## Cómo disparar

1. Abre un issue con la plantilla **NADF — requerimiento DoEvents**, o añade el label `nadf`.
2. El workflow [NADF DoEvents issue → DEV](../.github/workflows/nadf-issue-dev.yml) ejecuta:
   - Complexity Routing (WEB / Back / ambos)
   - Cloud Agent (solo el alcance del issue)
   - Build + deploy DEV (S3/CloudFront) si hay OIDC AWS

Issues: https://github.com/arodriguez-novusintelligence/DoEventsWEB/issues

Back hermano: https://github.com/arodriguez-novusintelligence/DoEventsBack (misma rama NADF).
