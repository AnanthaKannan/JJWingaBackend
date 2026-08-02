import express from "express";
const router = express.Router();

import * as feedCtrl from "../controllers/feed.controller";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as schema from "../validates";

const feedAdmin = [authenticate, authorizeAdmin];

router.get("/", authenticate, feedCtrl.feedList);

router.post(
  "/admin/content",
  ...feedAdmin,
  validate(schema.createFeed),
  feedCtrl.createFeed,
);

export default router;
