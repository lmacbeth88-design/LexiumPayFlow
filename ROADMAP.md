# Roadmap del MVP

El orden prioriza un demo confiable de extremo a extremo para escuelas. Las tareas de abajo siguen pendientes; la interfaz actual es una demostración con datos sintéticos.

## Prioridad 1 — Flujo verificable de pago

- [ ] Confirmar la especificación oficial de Pey y habilitar un entorno de pruebas.
- [ ] Alinear el adaptador y los contratos compartidos con la API oficial.
- [ ] Implementar recepción autenticada de webhooks, idempotencia y validación de montos/referencias.
- [ ] Conciliar el resultado confirmado y registrar cada transición en la bitácora.
- [ ] Probar creación, confirmación, duplicados y errores sin procesar dinero real.

## Prioridad 2 — Dashboard conectado

- [ ] Configurar PostgreSQL y datos de prueba reproducibles.
- [ ] Conectar obligaciones, solicitudes y conciliación del dashboard con el backend.
- [ ] Mostrar estados de carga, errores de red y resultado confirmado del pago.
- [ ] Mantener los envíos por WhatsApp, correo o SMS simulados hasta contar con proveedor y autorización.

## Prioridad 3 — Acceso seguro y demo

- [ ] Agregar autenticación de usuarios y permisos por escuela.
- [ ] Proteger y limitar los endpoints, incluida la transcripción de voz si se expone fuera de localhost.
- [ ] Preparar un recorrido de demostración completo con datos sintéticos y sin credenciales de producción.
- [ ] Definir política de privacidad y licencia del repositorio antes de una publicación más amplia.

## Después del MVP

- [ ] Integrar canales reales de mensajería.
- [ ] Evaluar comprobantes descargables y automatizaciones adicionales.
- [ ] Considerar otras industrias solo después de validar el flujo escolar.
