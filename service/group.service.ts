import { Group } from "../models";
import { Types } from "mongoose";

interface CreateGroupParams {
  groupName: string;
  userIds: string[];
  orgId: string;
  createdBy: string;
}

export const createGroup = async ({
  groupName,
  userIds,
  orgId,
  createdBy,
}: CreateGroupParams) => {
  const userIdsObj = userIds.map((id) => new Types.ObjectId(id));

  const group = await Group.create({
    groupName,
    userIds: userIdsObj,
    orgId,
    createdBy,
  });

  return group;
};

export const groupList = (orgId: string, adminId: string) => {
  return Group.find({ orgId, createdBy: adminId }).select("groupName");
};

export const updateGroup = async (
  orgId: string,
  adminId: string,
  groupId: string,
  updateData: { groupName?: string; userIds?: string[] },
) => {
  const updateFields: any = {};
  if (updateData.groupName) updateFields.groupName = updateData.groupName;
  if (updateData.userIds) {
    updateFields.userId = updateData.userIds.map(
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
