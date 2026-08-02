import express from "express";
const router = express.Router();

import * as gameCtrl from "../controllers/game.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as schema from "../validates";

router.get("/:level", authenticate, gameCtrl.gameScore);

router.get("/toppers/:level", authenticate, gameCtrl.getGameTopper);

router.post(
  "/score",
  [authenticate, validate(schema.addPoints)],
  gameCtrl.addGameScore,
);

export default router;
