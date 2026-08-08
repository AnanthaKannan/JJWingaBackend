import { Request, Response } from "express";
import logger from "../middleware/logger";

import * as groupService from "../service/group.service";

interface CreateGroupBody {
  groupName: string;
  userIds: string[];
}

export const groupList = async (req: Request, res: Response) => {
  const { id: adminId, orgId } = req.user;

  const result = await groupService.groupList(orgId, adminId);
  return res.status(200).json({
    success: true,
    message: "Group list fetched successfully.",
    result,
  });
};

export const createGroup = async (
  req: Request<{}, {}, CreateGroupBody>,
  res: Response,
) => {
  const { id: adminId, orgId } = req.user;
  const { groupName, userIds } = req.body;

  const result = await groupService.createGroup({
    groupName,
    userIds,
    orgId,
    createdBy: adminId,
  });

  return res.status(201).json({
    success: true,
    message: "Group created successfully.",
    result,
  });
};

interface UpdateGroupBody {
  groupName?: string;
  userIds?: string[];
}

export const updateGroup = async (
  req: Request<{ groupId: string }, {}, UpdateGroupBody>,
  res: Response,
) => {
  const { id: adminId, orgId } = req.user;
  const { groupName, userIds } = req.body;
  const groupId = req.params.groupId;

  const result = await groupService.updateGroup(orgId, adminId, groupId, {
    groupName,
    userIds,
  });

  return res.status(200).json({
    success: true,
    message: "Group updated successfully.",
    result,
  });
};

export const deleteGroup = async (
  req: Request<{ groupId: string }, {}, any>,
  res: Response,
) => {
  const { id: adminId, orgId } = req.user;
  const { groupId } = req.params;

  await groupService.deleteGroup(orgId, adminId, groupId);

  return res.status(200).json({
    success: true,
    message: "Group deleted successfully.",
  });
};
