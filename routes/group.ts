import express from "express";
const router = express.Router();

import * as groupCtrl from "../controllers/group.controller";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as schema from "../validates";

const feedAdmin = [authenticate, authorizeAdmin];

router.get("/", authenticate, ...feedAdmin, groupCtrl.groupList);

router.post(
  "/",
  ...feedAdmin,
  validate(schema.createGroup),
  groupCtrl.createGroup,
);

// router.post(
//   "/admin/content",
//   ...feedAdmin,
//   validate(schema.createFeed),
//   feedCtrl.createFeed,
// );

// router.delete("/admin/:feedId", ...feedAdmin, feedCtrl.deleteFeed);

export default router;
