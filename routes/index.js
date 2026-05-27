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

// Score (protected)
router.get(
  "/scores/:studentId",
  authenticate,
  controller.getScoreByStudentIdController,
);

// Question (protected)
router.get("/questions", authenticate, controller.getQuestionListController);
router.post("/admin/questions/add", ...admin, controller.addQuestionController);
router.get(
  "/questions/available/:studentId",
  authenticate,
  controller.getAvailableQuestionsForStudentController,
);

// Homework (protected)
router.get(
  "/homework/:studentId",
  authenticate,
  controller.getHomeworkListController,
);
router.get(
  "/homework/id/:id",
  authenticate,
  controller.getHomeworkByIdController,
);
router.patch(
  "/homework/:id",
  authenticate,
  controller.updateHomeworkController,
);

module.exports = router;
