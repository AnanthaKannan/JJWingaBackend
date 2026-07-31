const express = require("express");
const router = express.Router();
const cmdCtrl = require("../controllers/comment");
const {
  authenticate,
  authorizeAdmin,
  authorizeSuperAdminRole,
} = require("../middleware/auth");
const { uploadSingleFile } = require("../middleware/upload");

const admin = [authenticate, authorizeAdmin];
const superAdmin = [authenticate, authorizeSuperAdminRole];

router.post("/", authenticate, cmdCtrl.addComment);
router.get("/parent/:imageId", authenticate, cmdCtrl.getParentComment);
router.get("/child/:parentId", authenticate, cmdCtrl.getChildComment);

router.put("/like", authenticate, cmdCtrl.toggleCommentLike);

module.exports = router;
