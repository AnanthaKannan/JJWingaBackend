import express, { Router } from "express";

import * as cmdCtrl from "../controllers/comment";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as schema from "../validates";

const router: Router = express.Router();

router.post("/", authenticate, validate(schema.addComment), cmdCtrl.addComment);

router.put("/:commentId/approve", authenticate, cmdCtrl.approveComment);

router.delete("/parent/:commentId", authenticate, cmdCtrl.deleteComment);

router.get(
  "admin/non-approve-comment",
  authenticate,
  cmdCtrl.nonApproveComment,
);

router.get("/child/:parentId", authenticate, cmdCtrl.getChildComment);
router.get("/parent/:feedId", authenticate, cmdCtrl.getParentComment);

router.put(
  "/like",
  authenticate,
  validate(schema.toggleLike),
  cmdCtrl.toggleLike,
);

export default router;
