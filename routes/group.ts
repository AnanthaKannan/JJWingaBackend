import express from "express";
const router = express.Router();

import * as groupCtrl from "../controllers/group.controller";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as schema from "../validates";

const admin = [authenticate, authorizeAdmin];

router.get("/", authenticate, ...admin, groupCtrl.groupList);
router.get(
  "/:groupId/student",
  authenticate,
  ...admin,
  groupCtrl.groupStudentList,
);
router.post("/", ...admin, validate(schema.createGroup), groupCtrl.createGroup);

router.put(
  "/:groupId",
  ...admin,
  validate(schema.updateGroup),
  groupCtrl.updateGroup,
);

router.delete("/:groupId", ...admin, groupCtrl.deleteGroup);

export default router;
