import { Request, Response } from "express";
import logger from "../middleware/logger";

import * as gameService from "../service/game.service";
import { success } from "zod";

export const getGameTopper = async (req: Request, res: Response) => {
  const level = Number(req.params.level);

  if (req.user.role === "admin")
    return res.status(403).json({
      success: false,
      message: "Forbidden for Admin",
    });

  const { createdBy } = req.user;

  const result = await gameService.getGameTopper(createdBy, level);
  return res.status(200).json({
    success: true,
    message: "Game topper fetched succeeded.",
    result,
  });
};

export const gameScore = async (req: Request, res: Response) => {
  const level = Number(req.params.level);
  const data = await gameService.gameScore(req.user.id, level);
  return res.status(200).json({
    success: true,
    message: "Game details fetched succeeded.",
    data,
  });
};

export const addGameScore = async (req: Request, res: Response) => {
  const { level, points } = req.body;

  const result = await gameService.addGameScore(req.user.id, level, points);
  return res.status(200).json({
    success: true,
    message: "Added game score successfully",
    result,
  });
};
