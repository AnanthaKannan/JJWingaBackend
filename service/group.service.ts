import { Types } from "mongoose";

import { NotFoundError } from "@errors";
import { Group, Student, Message } from "@models";
import { getUserType } from "@utils";
import { NEW_MESSAGE, userTypeEnum } from "@constants";

import { getStudentsToken } from "@service/student.service";
import { sendPushNotificationBulk } from "@service/notificaion.service";

interface CreateGroupParams {
  groupName: string;
  studentIds: string[];
  orgId: string;
  createdBy: string;
}

export const createGroup = async ({
  groupName,
  studentIds,
  orgId,
  createdBy,
}: CreateGroupParams) => {
  const studentIdsObj = studentIds.map((id) => new Types.ObjectId(id));

  const group = await Group.create({
    groupName,
    studentIds: studentIdsObj,
    orgId,
    createdBy,
  });

  return group;
};

export const groupList = (orgId: string, adminId: string) => {
  return Group.find({ orgId, createdBy: adminId })
    .select("groupName studentIds")
    .populate({
      path: "studentIds",
      select: "name profilePicPath",
    })
    .lean();
};

export const getGroupDetails = (
  orgId: string,
  adminId: string,
  groupId: string,
) => {
  return Group.findOne({ _id: groupId, orgId, createdBy: adminId })
    .select("messages")
    .lean();
};

export const updateGroup = async (
  orgId: string,
  adminId: string,
  groupId: string,
  updateData: { groupName?: string; studentIds?: string[] },
) => {
  const updateFields: any = {};
  if (updateData.groupName) updateFields.groupName = updateData.groupName;
  if (updateData.studentIds) {
    updateFields.studentIds = updateData.studentIds.map(
      (id) => new Types.ObjectId(id),
    );
  }

  const result = await Group.findOneAndUpdate(
    { _id: groupId, orgId, createdBy: adminId },
    { $set: updateFields },
    { new: true },
  );

  if (!result) throw new Error("Group not found");
  return result;
};

export const deleteGroup = async (
  orgId: string,
  adminId: string,
  groupId: string,
) => {
  const result = await Group.findOneAndDelete({
    _id: groupId,
    orgId,
    createdBy: adminId,
  });
  if (!result) throw new Error("Group not found");
  return result;
};

const sendMessageGroupToEveryOne = async (
  orgId: string,
  adminId: string,
  studentIds: string[],
  message: string,
) => {
  const sendByModel = getUserType(userTypeEnum.ADMIN);
  const receivedToModel = getUserType(userTypeEnum.STUDENT);

  const messagesData = studentIds.map((studentId) => ({
    message: message.trim(),
    sendBy: adminId,
    sendByModel,
    receivedTo: studentId,
    receivedToModel,
  }));

  const result = await Message.insertMany(messagesData, {
    ordered: false, // MongoDB tries to insert all documents, even if some fail.
  });

  const tokens = await getStudentsToken(orgId, adminId, studentIds);
  const notificationDetails = await sendPushNotificationBulk(
    tokens,
    NEW_MESSAGE,
    message,
  );
  return notificationDetails;
};

export const sendGroupMessage = async (
  orgId: string,
  adminId: string,
  groupId: string,
  message: string,
) => {
  const groupDetails = await Group.findOneAndUpdate(
    { _id: groupId, orgId, createdBy: adminId },
    { $push: { messages: { text: message } } },
    { new: true },
  ).lean();

  const studentObjectIds = groupDetails?.studentIds;

  if (!studentObjectIds) {
    throw new NotFoundError(`Students not found on this ${groupId}`);
  }

  const studentIds = groupDetails.studentIds.map((id) => id.toString());

  const result = await sendMessageGroupToEveryOne(
    orgId,
    adminId,
    studentIds,
    message,
  );
  return result;
};

export const messageList = (
  orgId: string,
  adminId: string,
  groupId: string,
) => {
  return Group.findOne({ _id: groupId, orgId, createdBy: adminId })
    .select("messages")
    .lean();
};
