import { Request, Response } from "express";
import logger from "../middleware/logger";

import * as gameService from "../service/game.service";

export const getGameTopper = async (req: Request, res: Response) => {
  const level = Number(req.params.level);
  const result = await gameService.getGameTopper(level);
  return res.status(200).json({
    success: true,
    message: "Game topper fetched succeeded.",
    result,
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
