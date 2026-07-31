import { Document } from "mongoose";

export type UserType = "student" | "teacher";

export interface IOtpVerification extends Document {
  email: string;
  otpHash: string;
  purpose: string;
  attempts: number;
  verified: boolean;
  createdAt: Date;
}

export interface ServiceResult {
  success: boolean;
  message: string;
  errorCode?: string;
  otp?: string; // TODO: Remove OTP from the response
}

export type OrganizationState = "paid" | "unpaid" | "free";

interface IBillMonth {
  from?: Date;
  to?: Date;
}

export interface IOrganization extends Document {
  name: string;
  profilePicPath: string;
  studentPrefix: string;
  teacherPrefix: string;
  studentIdGen: number;
  teacherIdGen: number;
  billMonth?: IBillMonth;
  totalStudent?: number;
  pricePerStudent: number;
  total?: number;
  state: OrganizationState;
}

export type AddOrgParam = {
  name: string;
  studentPrefix: string;
  teacherPrefix: string;
  profilePicPath: string;
  email: string;
  adminName: string;
};
