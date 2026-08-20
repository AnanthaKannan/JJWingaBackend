import { Request, Response } from "express";
import logger from "../middleware/logger";

import * as groupService from "../service/group.service";

interface CreateGroupBody {
  groupName: string;
  studentIds: string[];
}

export const groupList = async (req: Request, res: Response) => {
  const { id: adminId, orgId } = req.user;

  const data = await groupService.groupList(orgId, adminId);
  return res.status(200).json({
    success: true,
    message: "Group list fetched successfully.",
    data,
  });
};

export const sendGroupMessage = async (
  req: Request<{ groupId: string }, {}, { message: string }>,
  res: Response,
) => {
  const { id: adminId, orgId } = req.user;
  const { groupId } = req.params;
  const { message } = req.body;

  const data = await groupService.sendGroupMessage(
    orgId,
    adminId,
    groupId,
    message,
  );
  return res.status(200).json({
    success: true,
    message: "Group message sent successfully.",
    data,
  });
};

export const createGroup = async (
  req: Request<{}, {}, CreateGroupBody>,
  res: Response,
) => {
  const { id: adminId, orgId } = req.user;
  const { groupName, studentIds } = req.body;

  const data = await groupService.createGroup({
    groupName,
    studentIds,
    orgId,
    createdBy: adminId,
  });

  return res.status(201).json({
    success: true,
    message: "Group created successfully.",
    data,
  });
};

interface UpdateGroupBody {
  groupName?: string;
  studentIds?: string[];
}

export const updateGroup = async (
  req: Request<{ groupId: string }, {}, UpdateGroupBody>,
  res: Response,
) => {
  const { id: adminId, orgId } = req.user;
  const { groupName, studentIds } = req.body;
  const groupId = req.params.groupId;

  const data = await groupService.updateGroup(orgId, adminId, groupId, {
    groupName,
    studentIds,
  });

  return res.status(200).json({
    success: true,
    message: "Group updated successfully.",
    data,
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

export const messageList = async (
  req: Request<{ groupId: string }>,
  res: Response,
) => {
  const { id: adminId, orgId } = req.user;
  const { groupId } = req.params;

  const data = await groupService.messageList(orgId, adminId, groupId);
  return res.status(200).json({
    success: true,
    message: "Message list fetched successfully.",
    data: data?.messages || [],
  });
};
