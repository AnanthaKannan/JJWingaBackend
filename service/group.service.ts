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
