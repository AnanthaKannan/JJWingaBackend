import express from "express";
const router = express.Router();
import controller from "../controllers";
import * as cronCtrl from "../controllers/crone.controller";
import { apiKeyValidation } from "../middleware/auth";

router.post(
  "/notifications/appreciations",
  apiKeyValidation,
  controller.sendAppreciationNotificationsController,
);

router.post(
  "/notifications/homework-reminder",
  apiKeyValidation,
  cronCtrl.homeworkRemainder,
);

router.post("/assign-homework", apiKeyValidation, cronCtrl.assignHomework);

export default router;
