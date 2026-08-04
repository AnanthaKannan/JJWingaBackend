import express, { Router } from "express";

import * as cmdCtrl from "../controllers/comment";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as schema from "../validates";

const router: Router = express.Router();

router.post("/", authenticate, validate(schema.addComment), cmdCtrl.addComment);
router.get("/parent/:feedId", authenticate, cmdCtrl.getParentComment);
router.get("/child/:parentId", authenticate, cmdCtrl.getChildComment);

router.put(
  "/like",
  authenticate,
  validate(schema.toggleLike),
  cmdCtrl.toggleLike,
);

export default router;
