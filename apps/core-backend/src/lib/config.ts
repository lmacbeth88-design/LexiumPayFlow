import { z } from "zod";

const environmentSchema = z.object({
  DATABASE_URL: z.string().url(),
  SCHOOL_ID: z.string().min(1),
  PAYFLOW_API_KEY: z.string().min(32),
  PEY_API_BASE_URL: z.string().url(),
  PEY_API_KEY: z.string().min(1),
  PEY_CODI_REQUEST_PATH: z.string().startsWith("/"),
  PEY_CALLBACK_URL: z.string().url(),
});

export function getConfig() {
  const parsed = environmentSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Configuración inválida: ${z.treeifyError(parsed.error)}`);
  }
  return parsed.data;
}
