const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const {
  authenticate,
  authorizeAdmin,
  apiKeyValidation,
  authorizeSuperAdminRole,
} = require("../middleware/auth");
const { uploadSingleFile } = require("../middleware/upload");

const admin = [authenticate, authorizeAdmin];
const superAdmin = [authenticate, authorizeSuperAdminRole];

// Auth (public)
router.get("/health", controller.healthCheckController);
router.post("/login", controller.loginController);
router.post(
  "/login/:studentId",
  authenticate,
  controller.loginUsingDeviceIdController,
);

// Student — admin only
router.get("/admin/students", ...admin, controller.getStudentListController);
router.post("/admin/students", ...admin, controller.addStudentController);
router.patch(
  "/admin/students/:id",
  ...admin,
  controller.updateStudentController,
);
router.post(
  "/admin/students/:id/reset-password",
  ...admin,
  controller.resetStudentPasswordController,
);

router.get(
  "/admin/registrations",
  ...admin,
  controller.getRegistrationListController,
);
router.post(
  "/admin/registrations",
  ...admin,
  controller.createRegistrationController,
);
router.delete(
  "/admin/registrations/:id",
  ...admin,
  controller.deleteRegistrationController,
);

router.get("/ranking", authenticate, controller.getRankingController);
router.patch("/student", authenticate, controller.updateMyStudentController);
router.patch(
  "/change-password",
  authenticate,
  controller.changePasswordController,
);
router.delete(
  "/student/device-id",
  authenticate,
  controller.removeStudentDeviceIdController,
);

router.post(
  "/admin/questions/assign",
  ...admin,
  controller.assignQuestionController,
);
router.delete(
  "/admin/questions/assign",
  ...admin,
  controller.unassignQuestionController,
);

// Student (protected)
router.get(
  "/student/same-device",
  authenticate,
  controller.getStudentsBySameDeviceIdController,
);

// we can deprecate
router.patch(
  "/student/fcm-token", // we are using this for student and admin both places
  authenticate,
  controller.updateStudentFcmTokenController,
);

router.patch(
  "/fcm-token", // we are using this for student and admin both places
  authenticate,
  controller.updateStudentFcmTokenController,
);

router.post(
  "/uploads",
  authenticate,
  uploadSingleFile,
  controller.uploadFileController,
);
router.get(
  "/file-uploads",
  authenticate,
  controller.getFileUploadListController,
);
router.delete(
  "/profile-pic",
  authenticate,
  controller.deleteProfilePicController,
);

// Score (protected)
router.get(
  "/scores/:studentId",
  authenticate,
  controller.getScoreByStudentIdController,
);

// Question (protected)
router.get(
  "/student/questions/practice",
  authenticate,
  controller.getPracticeQuestionListController,
);
router.post(
  "/student/questions/practice/assign",
  authenticate,
  controller.assignPracticeQuestionsToSelfController,
);
router.delete(
  "/student/questions/practice/assign",
  authenticate,
  controller.unassignPracticeQuestionsFromSelfController,
);
router.get(
  "/questions/practice",
  authenticate,
  controller.getPracticeQuestionListController,
);
router.get("/admin/questions", ...admin, controller.getQuestionListController);
router.post("/admin/questions", ...admin, controller.addQuestionController);
router.patch(
  "/admin/questions/:id",
  ...admin,
  controller.updateQuestionController,
);
router.delete(
  "/admin/questions/:id",
  ...admin,
  controller.deleteQuestionController,
);
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

router.get(
  "/admin/notifications",
  ...admin,
  controller.getAdminNotificationsController,
);

router.post(
  "/admin/notifications",
  ...admin,
  controller.sendNotificationController,
);

// messages
router.get(
  "/admin/messages/students",
  ...admin,
  controller.getMessageStudentListController,
);
router.get(
  "/messages/unread-count",
  authenticate,
  controller.getUnreadMessageCountController,
);
router.get("/messages", authenticate, controller.getMessagesController);
router.post("/messages", authenticate, controller.addMessageController);
router.patch(
  "/messages/read",
  authenticate,
  controller.markMessagesAsReadController,
);

router.patch(
  "/admin/file-uploads/:id",
  ...superAdmin,
  controller.updateFileUploadNameController,
);
router.delete(
  "/admin/file-uploads/:id",
  ...superAdmin,
  controller.deleteFileUploadController,
);
// router.get(
//   "/file-uploads/:id/download",
//   authenticate,
//   controller.downloadFileUploadController,
// );

router.post("/admin/teacher", ...superAdmin, controller.addAdminController);
router.get("/admin/teacher", ...superAdmin, controller.getAdminListController);
router.patch(
  "/admin/teacher/:id",
  ...superAdmin,
  controller.updateAdminController,
);

router.get("/admin/org", ...superAdmin, controller.getOrgDetailController);

router.post(
  "/crone/notifications/appreciations",
  apiKeyValidation,
  controller.sendAppreciationNotificationsController,
);

module.exports = router;
