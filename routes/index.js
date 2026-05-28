const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

const admin = [authenticate, authorizeAdmin];

// Auth (public)
router.get("/health", controller.healthCheckController);
router.post("/login", controller.loginController);

// Student — admin only
router.get("/admin/students", ...admin, controller.getStudentListController);
router.post("/admin/students", ...admin, controller.addStudentController);
router.patch(
  "/admin/students/:id",
  ...admin,
  controller.updateStudentController,
);

router.post(
  "/admin/questions/assign",
  ...admin,
  controller.assignQuestionController,
);

// Student (protected)
router.patch(
  "/student/fcm-token",
  authenticate,
  controller.updateStudentFcmTokenController,
);

// Score (protected)
router.get(
  "/scores/:studentId",
  authenticate,
  controller.getScoreByStudentIdController,
);

// Question (protected)
router.get("/admin/questions", ...admin, controller.getQuestionListController);
router.post("/admin/questions", ...admin, controller.addQuestionController);
router.get(
  "/admin/questions/available/:studentId",
  ...admin,
  controller.getAvailableQuestionsForStudentController,
);

// Homework (protected)
router.get(
  "/homework/:studentId/:state",
  authenticate,
  controller.getHomeworkListController,
);
router.get("/homework/:id", authenticate, controller.getHomeworkByIdController);
router.patch(
  "/homework/:id",
  authenticate,
  controller.updateHomeworkController,
);

// notification
router.get(
  "/notifications/:studentId",
  authenticate,
  controller.getNotificationsController,
);

router.post(
  "/admin/notifications",
  ...admin,
  controller.sendNotificationController,
);

module.exports = router;
