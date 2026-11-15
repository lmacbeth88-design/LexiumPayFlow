import { z } from "zod";
import { SchoolIdSchema } from "./common";

export const SchoolSchema = z.object({
  id: SchoolIdSchema,
  name: z.string().min(1),
  campus: z.string().min(1).optional(),
  cycle: z.string().min(1).describe("Ciclo escolar, por ejemplo 2026-2027"),
  timezone: z.string().min(1).describe("Zona horaria IANA"),
});

export type School = z.infer<typeof SchoolSchema>;
