import { Request, Response } from "express";
import logger from "../middleware/logger";

import * as groupService from "../service/group.service";

export const groupList = async (req: Request, res: Response) => {
  const { id: adminId, orgId } = req.user;

  const result = await groupService.groupList(orgId, adminId);
  return res.status(200).json({
    success: true,
    message: "Group list fetched successfully.",
    result,
  });
};

export const createGroup = async (req: Request, res: Response) => {
  const { id: adminId, orgId } = req.user;
  const { groupName, userId } = req.body;

  const result = await groupService.createGroup({
    groupName,
    userId,
    orgId,
    createdBy: adminId,
  });

  return res.status(201).json({
    success: true,
    message: "Group created successfully.",
    result,
  });
};

// export const gameScore = async (req: Request, res: Response) => {
//   const level = Number(req.params.level);
//   const data = await gameService.gameScore(req.user.id, level);
//   return res.status(200).json({
//     success: true,
//     message: "Game details fetched succeeded.",
//     data,
//   });
// };

// export const addGameScore = async (req: Request, res: Response) => {
//   const { level, points } = req.body;

//   const result = await gameService.addGameScore(req.user.id, level, points);
//   return res.status(200).json({
//     success: true,
//     message: "Added game score successfully",
//     result,
//   });
// };
