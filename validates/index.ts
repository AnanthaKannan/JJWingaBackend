// schemas/student.schema.ts
import { z } from "zod";

export const verifyPrefix = z.object({
  prefix: z.string().min(1),
  type: z.enum(["admin", "student"]),
});

export const sendOtp = z.object({
  email: z.email(),
});

export const verifyOtp = z.object({
  email: z.email(),
  otp: z.string().min(6).max(6),
});
