import { Request, Response } from "express";

import * as authService from "@service/auth.service";
import { UserType } from "@types";

export const logOut = async (
  req: Request<{}, {}, { deviceId?: string; fcmToken?: string }>,
  res: Response,
) => {
  const {
    id: userId,
    role,
    orgId,
  } = req.user as {
    id: string;
    role: UserType;
    orgId: string;
  };

  const { fcmToken, deviceId } = req.body;

  await authService.logOut(orgId, userId, role, deviceId, fcmToken);

  return res.status(200).json({
    success: true,
    message: "logged out successfully.",
  });
};
