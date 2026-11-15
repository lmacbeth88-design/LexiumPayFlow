# 🚀 Lexium PayFlow — Fase 1: MVP Funcional y Arquitectura Validada

**Lexium PayFlow** es una propuesta de agente inteligente de conciliación y cobranza no-custodial para instituciones educativas en México, diseñada para operar sobre CoDi y la API de Pey.

> **Alcance de esta demo:** el dashboard y el agente usan datos sintéticos. Se puede mostrar la experiencia de consulta, cobranza y conciliación, pero el dashboard todavía no está conectado al backend, no se reciben webhooks y no se procesan pagos reales. La integración con Pey usa un contrato provisional.

## ✅ Estado actual del proyecto (Fase 1)

Está implementada la arquitectura base y una experiencia funcional de demostración:

- **Monorepo:** dashboard, motor de agente, contratos compartidos y backend. Typecheck y builds pasan localmente.
- **Dashboard administrativo:** módulos de resumen, cobranza, alumnos, conciliación, auditoría y generación/descarga de QR. Los datos son de demostración y los envíos están simulados.
- **Motor de agente:** 10 herramientas implementadas, con validación de esquemas y pruebas. El dashboard también ofrece transcripción de voz con NVIDIA NIM/Whisper y consultas locales sobre los datos demo; no es un agente conversacional general ni ejecuta pagos por voz.
- **Bitácora de auditoría verificable:** registro append-only con encadenamiento de hashes SHA-256, diseñado para detectar alteraciones. No se garantiza inmutabilidad frente a administradores con privilegios sobre la base de datos.
- **Backend inicial:** CRUD de obligaciones, archivo lógico y creación de solicitudes de pago CoDi mediante un adaptador con contrato provisional.

## 🗺️ Roadmap hacia la entrega final — 12 de diciembre

Plan de trabajo para las próximas cuatro semanas. Los componentes externos que aún no se integran permanecen en modo de demostración controlada.

1. **Semanas 1–2:** confirmar la especificación oficial de la API de Pey, sustituir el contrato provisional y preparar PostgreSQL en un entorno de staging.
2. **Semana 3:** implementar y probar webhooks para la conciliación automática: **QR → pago → webhook → bitácora → dashboard**.
3. **Semana 4:** reforzar seguridad —permisos por escuela, rotación de credenciales e idempotencia— y pulir la experiencia para la demostración final.

Consulta también el [roadmap detallado](./ROADMAP.md).

## 🛠️ Cómo ejecutar el demo de Fase 1

Requisitos: **Node.js 22.18.0** y **Corepack**. Desde la raíz del repositorio:

```bash
corepack pnpm install
corepack pnpm dev
```

Abre <http://127.0.0.1:3000>. No necesitas PostgreSQL ni credenciales de Pey para recorrer el dashboard y el agente con datos demo.

### Transcripción de voz (opcional)

La transcripción requiere una clave de NVIDIA NIM configurada solo en el servidor:

1. Copia `apps/admin-dashboard/.env.example` a `apps/admin-dashboard/.env.local`.
2. Asigna `NVIDIA_NIM_API_KEY` y reinicia el dashboard.

No uses el prefijo `NEXT_PUBLIC_` ni publiques la clave. El audio se envía a NVIDIA para transcripción y la aplicación no lo persiste.

## 🧪 Validaciones

```bash
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

GitHub Actions ejecuta estas validaciones en cada pull request y push a las ramas principales.

## 🧱 Estructura

- `apps/admin-dashboard` — dashboard Next.js y experiencia del agente.
- `apps/ai-agent-engine` — herramientas, políticas y demo del agente.
- `apps/core-backend` — API Next.js y persistencia PostgreSQL.
- `packages/shared-contracts` — esquemas Zod y contratos compartidos.

## 🔐 Seguridad y limitaciones

- El demo usa datos sintéticos; no emite cobros ni envía mensajes.
- El dashboard aún no consume la API del backend. La API de Pey y la creación de solicitudes deben validarse contra su especificación oficial antes de usar credenciales reales.
- No se ha implementado el webhook de pagos. No expongas el endpoint de voz ni la API a Internet sin autenticación, límites de uso y controles de privacidad adecuados.
- PayFlow está diseñado para no custodiar ni concentrar fondos: cada escuela debe operar con sus propias credenciales y cuenta destino.

## Enlaces

- [Perfil de GitHub](https://github.com/lmacbeth88-design)
- [Roadmap detallado](./ROADMAP.md)

## Licencia

Pendiente de definir. No asumas permisos de uso, modificación o distribución hasta que se agregue una licencia.
