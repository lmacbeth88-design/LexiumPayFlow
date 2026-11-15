import { z } from "zod";
import {
  GuardianIdSchema,
  IsoDateTimeSchema,
  SchoolIdSchema,
  StudentIdSchema,
} from "./common";

export const EducationLevelSchema = z.enum([
  "preescolar",
  "primaria",
  "secundaria",
  "bachillerato",
]);

export const StudentStatusSchema = z.enum(["active", "inactive", "graduated"]);

export const GuardianRelationshipSchema = z.enum([
  "madre",
  "padre",
  "tutor",
  "otro",
]);

export const GuardianSchema = z.object({
  id: GuardianIdSchema,
  studentIds: z.array(StudentIdSchema),
  fullName: z.string().min(1),
  relationship: GuardianRelationshipSchema,
  phone: z.string().min(8),
  email: z.string().email().optional(),
});

export type Guardian = z.infer<typeof GuardianSchema>;

export const StudentSchema = z.object({
  id: StudentIdSchema,
  schoolId: SchoolIdSchema,
  firstName: z.string().min(1),
  lastNamePaternal: z.string().min(1),
  lastNameMaternal: z.string().min(1).optional(),
  fullName: z.string().min(1),
  level: EducationLevelSchema,
  grade: z.string().min(1),
  group: z.string().min(1),
  status: StudentStatusSchema,
  guardianIds: z.array(GuardianIdSchema).min(1),
  createdAt: IsoDateTimeSchema,
});

export type Student = z.infer<typeof StudentSchema>;

export const StudentSummarySchema = z.object({
  id: StudentIdSchema,
  fullName: z.string().min(1),
  level: EducationLevelSchema,
  grade: z.string().min(1),
  group: z.string().min(1),
  status: StudentStatusSchema,
  guardianName: z.string().nullable(),
  guardianPhone: z.string().nullable(),
  balanceDueCents: z.number().int().nonnegative(),
});

export type StudentSummary = z.infer<typeof StudentSummarySchema>;
