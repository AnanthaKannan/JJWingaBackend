// schemas/student.schema.ts
import { z } from "zod";

export const verifyPrefix = z.object({
  prefix: z.string().min(1),
  type: z.enum(["admin", "student"]),
});

export const sendOtp = z.object({
  email: z.email(),
});

const emptyToUndefined = (val: unknown) =>
  val === "" || val === null ? undefined : val;

export const createFeed = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("file"),
    filePath: z.string().trim().min(1, "File path is required"),
    content: z.preprocess(emptyToUndefined, z.undefined()),
  }),
  z.object({
    type: z.literal("content"),
    content: z.string().trim().min(1, "Content is required"),
    filePath: z.preprocess(emptyToUndefined, z.undefined()),
  }),
]);

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

export const addPoints = z.object({
  level: z.number(),
  points: z.number(),
});
