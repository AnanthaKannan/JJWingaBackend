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
