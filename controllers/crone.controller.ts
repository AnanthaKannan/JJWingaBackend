import { Request, Response } from "express";
import logger from "../middleware/logger";

import service from "../service";

export const homeworkRemainder = async (req: Request, res: Response) => {
  const result = await service.homeWorkRemainder();
  return res.status(200).json({
    success: false,
    message: "Homework Remainder succeeded.",
    result,
  });
};

export default { homeworkRemainder };
