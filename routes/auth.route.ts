import express from "express";
const router = express.Router();

import * as authCtrl from "@controllers/auth.controller";
import { authenticate } from "@middleware/auth";
import { validate } from "@middleware/validate";
import * as schema from "@validates";

router.post(
  "/logout",
  authenticate,
  validate(schema.logoutSchema),
  authCtrl.logOut,
);

export default router;
