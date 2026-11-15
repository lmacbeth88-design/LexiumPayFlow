# Core backend

Backend API de Lexium PayFlow: obligaciones escolares, creación de solicitudes CoDi y bitácora SHA-256.

## Requisitos

- Node.js 22.18 o superior
- PostgreSQL
- Credenciales Pey emitidas para la escuela que opera esta instancia

## Arranque

1. Copia `.env.example` a `.env.local` y define valores reales. `SCHOOL_ID` y las credenciales Pey corresponden a una sola escuela por despliegue. No compartas credenciales entre escuelas ni uses una cuenta integradora para recibir pagos de terceros.
2. Ejecuta `npm install`.
3. Ejecuta `npm run db:migrate`.
4. Ejecuta `npm run dev`.

Todos los endpoints `/api/*` requieren `Authorization: Bearer <PAYFLOW_API_KEY>`.

## Endpoints

- `GET /api/obligations?status=pending&limit=50`
- `POST /api/obligations`
- `GET /api/obligations/:id`
- `PATCH /api/obligations/:id`
- `DELETE /api/obligations/:id` (archivo lógico, conserva evidencia)
- `POST /api/payment-requests` con `{ "obligationId": "<uuid>" }`

Los importes se expresan como enteros en centavos de MXN (`amountCents`); no se aceptan cantidades de punto flotante.

## Integración Pey

La solicitud de cobro se envía al URL formado por `PEY_API_BASE_URL` y `PEY_CODI_REQUEST_PATH`, con Bearer token e idempotency key. El adaptador envía JSON con `amountCents`, `currency`, `concept`, `reference` y `callbackUrl`; valida una respuesta JSON con `transactionId`, `paymentUrl` y opcionalmente `qrCode`.

Este contrato es la interfaz provisional del adaptador: los documentos del proyecto no incluyen la especificación oficial de Pey. Antes de usar credenciales reales, confirma y ajusta ruta, autenticación, nombres/formato de campos, respuesta e idempotencia contra la documentación oficial de Pey.

## Auditoría

Los cambios de obligaciones y solicitudes se escriben en `audit_ledger` dentro de la misma transacción de base de datos. Cada entrada contiene estado anterior/nuevo, actor, origen, timestamp e identificador de transacción; `event_hash` se calcula con SHA-256 y referencia `previous_hash`. Un trigger impide `UPDATE` y `DELETE` ordinarios. Esto hace detectables alteraciones en la cadena, no promete inmutabilidad ante administradores con privilegios de base de datos.
