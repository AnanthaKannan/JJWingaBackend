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

export const addOrg = z.object({
  name: z.string(),
  studentPrefix: z.string().min(1).max(3),
  teacherPrefix: z.string().min(1).max(3),
  email: z.email(),
  adminName: z.string(),
});
