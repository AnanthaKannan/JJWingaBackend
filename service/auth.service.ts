import { Admin, Student } from "@models";
import { UserType } from "@types";
import { userTypeEnum } from "@constants";

export const logOut = (
  orgId: string,
  studentId: string,
  role: UserType,
  deviceId?: string,
  fcmToken?: string,
) => {
  if (!deviceId && !fcmToken) return;

  const pull: Record<string, string> = {};

  if (deviceId) {
    pull.deviceIds = deviceId;
  }

  if (fcmToken) {
    pull.fcmTokens = fcmToken;
  }

  const filter = {
    _id: studentId,
    orgId,
  };

  if (role === userTypeEnum.ADMIN) {
    return Admin.updateOne(filter, {
      $pull: pull,
    });
  }

  return Student.updateOne(filter, {
    $pull: pull,
  });
};
