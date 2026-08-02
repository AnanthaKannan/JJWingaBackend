import { Request, Response } from "express";
import logger from "../middleware/logger";

import * as feedService from "../service/feed.service";

export const feedList = async (req: Request, res: Response) => {
  const data = await feedService.feedList(req.user.orgId);
  return res.status(200).json({
    success: true,
    message: "Feed list fetched succeeded.",
    data,
  });
};

export const createFeed = async (req: Request, res: Response) => {
  const result = await feedService.createFeed({
    ...req.body,
    orgId: req.user.orgId,
    createdBy: req.user.id,
  });
  return res.status(200).json({
    success: true,
    message: "Feed created successfully",
    result,
  });
};
