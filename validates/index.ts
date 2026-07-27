// schemas/student.schema.ts
import { z } from "zod";

export const verifyPrefixSchema = z.object({
  prefix: z.string().min(1),
  type: z.enum(["admin", "student"]),
});
