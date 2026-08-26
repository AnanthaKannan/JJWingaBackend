import { Request, Response } from "express";

import {
  login,
  loginUsingDeviceId,
  getStudentList,
  getMessageStudentList,
  getStudentsBySameDeviceId,
  changePassword,
  getQuestionList,
  getPracticeQuestionList,
  getHomeworkList,
  getAvailableQuestionsForStudent,
  updateHomework,
  getScoreByStudentId,
  getHomeworkById,
  assignQuestion,
  unassignQuestion,
  assignQuestionsByLevels,
  assignPracticeQuestionsToSelf,
  unassignPracticeQuestionsFromSelf,
  addStudent,
  updateStudent,
  resetStudentPassword,
  removeStudentDeviceId,
  updateFcmToken,
  uploadFile,
  getFileUploadList,
  updateFileUploadName,
  deleteFileUpload,
  deleteProfilePic,
  downloadFileUpload,
  addMessage,
  getMessageList,
  getUnreadMessageCount,
  markMessagesAsRead,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  sendBulkNotification,
  sendAppreciationNotifications,
  getNotificationList,
  getWeeklyRankings,
  addAdmin,
  updateAdmin,
  getAdminList,
  getOrgDetail,
  getAdminDetail,
} from "../service";
import {
  hasField,
  sendOptionalStudentLevelError,
  validateQuestionType,
  validateStudentLevel,
} from "../utils/validation";
import { getFormattedUptime } from "../utils";
import logger from "../middleware/logger";
import { userTypeEnum } from "@constants";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

interface UploadedFile {
  buffer: Buffer;
  contentType: string;
  fileName: string;
  downloadName?: string;
}

export interface StudentAuthUser {
  id: string;
  role: "student";
  name: string;
  orgId: string;
  studentId: string;
  createdBy: string;
  deviceIds: string[];
}

export interface AdminAuthUser {
  id: string;
  role: "admin";
  name: string;
  orgId: string;
  adminId: string;
  roles: string[];
  deviceIds: string[];
}

export type AuthUser = StudentAuthUser | AdminAuthUser;
declare global {
  namespace Express {
    interface Request {
      user: AuthUser;
      file: any;
    }
  }
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

const logControllerError = (context: string, error: unknown) => {
  logger.error({ err: error, context }, "controller_error");
};

const sendBadRequest = (res: Response, message: string) =>
  res.status(400).json({
    success: false,
    message,
  });

const sendQuestionTypeError = (
  res: Response,
  type: string | undefined,
  isRequired = true,
) => {
  const typeError = validateQuestionType(type, isRequired);
  return typeError ? sendBadRequest(res, typeError) : null;
};

const sendStudentLevelError = (res: Response, level: unknown) => {
  const levelError = validateStudentLevel(level);
  return levelError ? sendBadRequest(res, levelError) : null;
};

const sendBooleanFieldError = (
  res: Response,
  field: string,
  value: unknown,
) => {
  if (value === undefined || typeof value === "boolean") {
    return null;
  }

  return sendBadRequest(res, `${field} must be a boolean`);
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const loginController = async (req: Request, res: Response) => {
  try {
    const { username, password, deviceId } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const data = await login(username, password, deviceId);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      ...data,
    });
  } catch (error) {
    logControllerError("loginController", error);

    const message = getErrorMessage(error);
    const isClientError = ["Invalid username or password"].includes(message);

    return res.status(isClientError ? 401 : 500).json({
      success: false,
      message: message || "Failed to login",
    });
  }
};

const loginUsingDeviceIdController = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { deviceIds } = req.user;

    const data = await loginUsingDeviceId(studentId, deviceIds ?? []);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      ...data,
    });
  } catch (error) {
    logControllerError("loginUsingDeviceIdController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "Device ID not found in token",
      "Student not found for this device",
      "Invalid username or password",
    ].includes(message);

    return res.status(isClientError ? 401 : 500).json({
      success: false,
      message: message || "Failed to login",
    });
  }
};

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

const getStudentListController = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const search = (req.query.search as string)?.trim() || "";
  const { level } = req.query;
  const { orgId } = req.user;

  const levelErrorResponse = sendOptionalStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  const data = await getStudentList(
    orgId as string,
    req.user.id,
    page,
    limit,
    search,
    level === undefined ? null : Number(level),
  );

  return res.status(200).json({
    success: true,
    message: search
      ? `Search results for "${search}"`
      : "Student list fetched successfully",
    ...data,
  });
};

const getMessageStudentListController = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const search = (req.query.search as string)?.trim() || "";
  const { level } = req.query;

  const levelErrorResponse = sendOptionalStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  const data = await getMessageStudentList(
    req.user.orgId as string,
    req.user.id,
    page,
    limit,
    search,
    level === undefined ? null : Number(level),
  );

  return res.status(200).json({
    success: true,
    message: search
      ? `Message student search results for "${search}"`
      : "Message student list fetched successfully",
    ...data,
  });
};

const getStudentsBySameDeviceIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const data = await getStudentsBySameDeviceId(
      req.user.orgId as string,
      req.user.deviceIds ?? [],
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      message: "Students with same device ID fetched successfully",
      ...data,
    });
  } catch (error) {
    logControllerError("getStudentsBySameDeviceIdController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "Student not found",
      "Device ID is not assigned for this student",
    ].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Failed to fetch students",
    });
  }
};

const getRankingController = async (req: Request, res: Response) => {
  const { level } = req.query;
  const { orgId } = req.user;

  const levelErrorResponse = sendOptionalStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  const rankingLevel = level === undefined ? null : Number(level);
  const data = await getWeeklyRankings(orgId as string, rankingLevel, req.user);

  return res.status(200).json({
    success: true,
    message:
      rankingLevel === null
        ? "Ranking list fetched successfully"
        : `Ranking list fetched successfully for level ${rankingLevel}`,
    data,
  });
};

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

const getQuestionListController = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const search = (req.query.search as string)?.trim() || "";
  const { level } = req.query;
  const type = (req.query.type as string)?.trim();
  const { orgId } = req.user;

  const levelErrorResponse = sendOptionalStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  const typeErrorResponse = sendQuestionTypeError(res, type, false);
  if (typeErrorResponse) return typeErrorResponse;

  const data = await getQuestionList(
    orgId as string,
    page,
    limit,
    search,
    level === undefined ? null : Number(level),
    type || null,
  );

  return res.status(200).json({
    success: true,
    message: search
      ? `Search results for "${search}"`
      : "Question list fetched successfully",
    ...data,
  });
};

const getPracticeQuestionListController = async (
  req: Request,
  res: Response,
) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const search = (req.query.search as string)?.trim() || "";
  const { level } = req.query;
  const { orgId } = req.user;

  const levelErrorResponse = sendOptionalStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  const data = await getPracticeQuestionList(
    orgId as string,
    page,
    limit,
    search,
    level === undefined ? null : Number(level),
    req.user.role === "student" ? req.user.id : null,
  );

  return res.status(200).json({
    success: true,
    message: search
      ? `Practice questions matching "${search}"`
      : "Practice questions fetched successfully",
    ...data,
  });
};

const getHomeworkListController = async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const state = req.params.state as string;
  const { page, limit, sortBy, sortOrder } = req.query as {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
  };

  const type = (req.query.type as string)?.trim();

  if (!studentId) {
    return sendBadRequest(res, "Student ID is required");
  }

  // Validate state if provided
  const validStates = ["NEW", "PROGRESS", "COMPLETED"];
  if (state && !validStates.includes(state.toUpperCase())) {
    return sendBadRequest(
      res,
      `Invalid state. Must be one of: ${validStates.join(", ")}`,
    );
  }

  const validSortFields = ["createdAt", "updatedAt"];
  if (sortBy && !validSortFields.includes(sortBy)) {
    return sendBadRequest(
      res,
      `Invalid sortBy. Must be one of: ${validSortFields.join(", ")}`,
    );
  }

  const normalizedSortOrder = sortOrder?.toLowerCase();
  const validSortOrders = ["asc", "desc"];
  if (normalizedSortOrder && !validSortOrders.includes(normalizedSortOrder)) {
    return sendBadRequest(res, "Invalid sortOrder. Must be asc or desc");
  }

  const typeErrorResponse = sendQuestionTypeError(res, type, false);
  if (typeErrorResponse) return typeErrorResponse;

  const data = await getHomeworkList(
    studentId,
    state,
    parseInt(page as string) || 1,
    parseInt(limit as string) || 15,
    sortBy as string,
    (normalizedSortOrder as "asc" | "desc") || "desc",
    type || null,
  );

  return res.status(200).json({
    success: true,
    message: "Homework list fetched successfully",
    ...data,
  });
};

const getAvailableQuestionsForStudentController = async (
  req: Request,
  res: Response,
) => {
  const { studentId } = req.params;
  const { page, limit, level } = req.query;
  const search = req.query.search as string;
  const { orgId } = req.user;
  const type = (req.query.type as string)?.trim();

  if (!studentId) {
    return sendBadRequest(res, "Student ID is required");
  }

  const levelErrorResponse = sendOptionalStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  const typeErrorResponse = sendQuestionTypeError(res, type, false);
  if (typeErrorResponse) return typeErrorResponse;

  const data = await getAvailableQuestionsForStudent(
    orgId as string,
    studentId,
    parseInt(page as string) || 1,
    parseInt(limit as string) || 15,
    search?.trim() || "",
    level === undefined ? null : Number(level),
    type || null,
  );

  return res.status(200).json({
    success: true,
    message: search
      ? `Available questions matching "${search}"`
      : "Available questions fetched successfully",
    ...data,
  });
};

const getScoreByStudentIdController = async (req: Request, res: Response) => {
  const { studentId } = req.params;

  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: "Student ID is required",
    });
  }

  const score = await getScoreByStudentId(studentId);

  return res.status(200).json({
    success: true,
    message: "Score fetched successfully",
    ...score,
  });
};

const getHomeworkByIdController = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Homework ID is required",
    });
  }

  const homework = await getHomeworkById(id);

  return res.status(200).json({
    success: true,
    message: "Homework fetched successfully",
    homework,
  });
};

const assignQuestionController = async (req: Request, res: Response) => {
  try {
    const { studentId, levels, questionIds } = req.body;
    const { orgId, id: adminId } = req.user;
    const hasStudentId = Boolean(studentId);
    const hasLevels = Array.isArray(levels) && levels.length > 0;

    if (hasStudentId === hasLevels) {
      return res.status(400).json({
        success: false,
        message: "Send either studentId or levels",
      });
    }

    if (!Array.isArray(questionIds) || questionIds.length < 1) {
      return res.status(400).json({
        success: false,
        message: "questionIds are required",
      });
    }

    const data = hasStudentId
      ? await assignQuestion(orgId as string, adminId, studentId, questionIds)
      : await assignQuestionsByLevels(
          orgId as string,
          adminId,
          levels,
          questionIds,
        );

    return res.status(201).json({
      success: true,
      message: `Homework question(s) assigned successfully`,
      ...data,
    });
  } catch (error) {
    logControllerError("assignQuestionController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "One or more questions not found",
      "levels must be a non-empty array of numbers",
      "No students found for levels",
    ].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Internal server error",
    });
  }
};

const unassignQuestionController = async (req: Request, res: Response) => {
  try {
    const { studentId, questionIds } = req.body;

    if (!studentId) {
      return sendBadRequest(res, "studentId is required");
    }

    if (!Array.isArray(questionIds) || questionIds.length < 1) {
      return sendBadRequest(res, "questionIds are required");
    }

    const data = await unassignQuestion(studentId, questionIds);

    return res.status(200).json({
      success: true,
      message: `${data.deletedCount} homework question(s) unassigned successfully`,
      ...data,
    });
  } catch (error) {
    logControllerError("unassignQuestionController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "studentId is required",
      "questionIds are required",
      "Invalid studentId or questionIds",
      "One or more questions are not assigned",
    ].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Internal server error",
    });
  }
};

const normalizeQuestionIds = (body: Record<string, any>): string[] => {
  if (Array.isArray(body.questionIds)) {
    return body.questionIds;
  }

  return body.questionId ? [body.questionId] : [];
};

const assignPracticeQuestionsToSelfController = async (
  req: Request,
  res: Response,
) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Student only.",
      });
    }

    const questionIds = normalizeQuestionIds(req.body);

    if (questionIds.length < 1) {
      return sendBadRequest(res, "questionIds are required");
    }

    const data = await assignPracticeQuestionsToSelf(req.user.id, questionIds);

    return res.status(201).json({
      success: true,
      message: `${data.homeworks.length} practice question(s) assigned successfully`,
      ...data,
    });
  } catch (error) {
    logControllerError("assignPracticeQuestionsToSelfController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "questionIds are required",
      "Invalid questionIds",
      "One or more practice questions not found",
    ].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Internal server error",
    });
  }
};

const unassignPracticeQuestionsFromSelfController = async (
  req: Request,
  res: Response,
) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Student only.",
      });
    }

    const questionIds = normalizeQuestionIds(req.body);

    if (questionIds.length < 1) {
      return sendBadRequest(res, "questionIds are required");
    }

    const data = await unassignPracticeQuestionsFromSelf(
      req.user.id,
      questionIds,
    );

    return res.status(200).json({
      success: true,
      message: `${data.deletedCount} practice question(s) unassigned successfully`,
    });
  } catch (error) {
    logControllerError("unassignPracticeQuestionsFromSelfController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "questionIds are required",
      "Invalid questionIds",
      "One or more practice questions not found",
      "One or more practice questions are not assigned",
      "Practice questions can only be unassigned while assigned",
    ].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Internal server error",
    });
  }
};

// ---------------------------------------------------------------------------
// Student mutations
// ---------------------------------------------------------------------------

const addStudentController = async (req: Request, res: Response) => {
  const { name, level } = req.body;
  const { orgId, id: createdBy } = req.user;

  if (!name) {
    return sendBadRequest(res, "name is required");
  }

  const levelErrorResponse = sendStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  const data = await addStudent({
    orgId: orgId as string,
    name,
    level: Number(level),
    createdBy,
  });

  return res.status(201).json({
    success: true,
    message: "Student added successfully",
    ...data,
  });
};

const updateStudentController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!id) {
    return sendBadRequest(res, "Student ID is required");
  }

  if (!updateData || Object.keys(updateData).length === 0) {
    return sendBadRequest(res, "No update data provided");
  }

  if (hasField(updateData, "level")) {
    const levelErrorResponse = sendStudentLevelError(res, updateData.level);
    if (levelErrorResponse) return levelErrorResponse;

    updateData.level = Number(updateData.level);
  }

  await updateStudent(id, updateData, req.user.orgId as string);

  return res.status(200).json({
    success: true,
    message: "Student updated successfully",
  });
};

const resetStudentPasswordController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { orgId } = req.user;

    if (!id) {
      return sendBadRequest(res, "Student ID is required");
    }

    const data = await resetStudentPassword(id, orgId as string);

    return res.status(200).json({
      success: true,
      message: "Student password reset successfully",
      data,
    });
  } catch (error) {
    logControllerError("resetStudentPasswordController", error);

    const message = getErrorMessage(error);
    const isClientError = ["Student not found"].includes(message);
    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Failed to reset student password",
    });
  }
};

const updateStudentFcmTokenController = async (req: Request, res: Response) => {
  const { fcmToken } = req.body;
  const { orgId } = req.user;

  if (!fcmToken) {
    return res.status(400).json({
      success: false,
      message: "fcmToken is required",
    });
  }

  const isStudent = req.user.role === userTypeEnum.STUDENT;
  await updateFcmToken(orgId, req.user.id, fcmToken, isStudent);

  return res.status(200).json({
    success: true,
    message: "FCM token updated successfully",
  });
};

// ---------------------------------------------------------------------------
// File uploads
// ---------------------------------------------------------------------------

const uploadFileController = async (req: Request, res: Response) => {
  try {
    const { orgId, id } = req.user;

    if (req.body?.path === "feed") {
      if (req.body?.type === "file") {
      } else if (req.body?.type === "content") {
        if (!req.body?.content) {
          return res.status(400).json({
            success: false,
            message: '"Content" should be valid content',
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Type should be "file" or "content',
        });
      }
    }

    const file = await uploadFile(
      orgId as string,
      req.file,
      req.user,
      req.body?.path,
      req.body?.name,
      id,
      req.body?.content,
      req.body?.type,
    );

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      file,
    });
  } catch (error) {
    logControllerError("uploadFileController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "file is required",
      "path is required",
      "name is required",
      "profile picture must be an image",
    ].includes(message);
    const isForbiddenError = [
      "Only admin can upload practice or celebration files",
    ].includes(message);

    return res.status(isForbiddenError ? 403 : isClientError ? 400 : 500).json({
      success: false,
      message: message || "Failed to upload file",
    });
  }
};

const getFileUploadListController = async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string)?.trim();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const { orgId } = req.user;

    const data = await getFileUploadList(orgId as string, type, page, limit);

    return res.status(200).json({
      success: true,
      message: "File upload list fetched successfully",
      ...data,
    });
  } catch (error) {
    logControllerError("getFileUploadListController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "type must be one of: practice, celebration",
    ].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Failed to fetch file uploads",
    });
  }
};

const sendDownloadResponse = (res: Response, file: UploadedFile) => {
  const downloadName = String(file.downloadName || file.fileName || "download")
    .replace(/[\r\n"]/g, "")
    .trim();

  res.setHeader("Content-Type", file.contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${downloadName || "download"}"`,
  );
  return res.status(200).send(file.buffer);
};

const updateFileUploadNameController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const { orgId } = req.user;

    await updateFileUploadName(orgId as string, id, name);

    return res.status(200).json({
      success: true,
      message: "File upload name updated successfully",
    });
  } catch (error) {
    logControllerError("updateFileUploadNameController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "fileUploadId is required",
      "name is required",
      "File upload not found",
    ].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Failed to update file upload",
    });
  }
};

const downloadFileUploadController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = await downloadFileUpload(id);

    return sendDownloadResponse(res, file);
  } catch (error) {
    logControllerError("downloadFileUploadController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "fileUploadId is required",
      "File upload not found",
    ].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Failed to download file upload",
    });
  }
};

const deleteFileUploadController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { orgId } = req.user;

    await deleteFileUpload(orgId as string, id);

    return res.status(200).json({
      success: true,
      message: "File upload deleted successfully",
    });
  } catch (error) {
    logControllerError("deleteFileUploadController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "fileUploadId is required",
      "File upload not found",
    ].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Failed to delete file upload",
    });
  }
};

const deleteProfilePicController = async (req: Request, res: Response) => {
  try {
    await deleteProfilePic(req.user.orgId as string, req.user);

    return res.status(200).json({
      success: true,
      message: "Profile picture deleted successfully",
    });
  } catch (error) {
    logControllerError("deleteProfilePicController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "User not found",
      "Profile picture not found",
    ].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Failed to delete profile picture",
    });
  }
};

const removeStudentDeviceIdController = async (req: Request, res: Response) => {
  try {
    const { studentId, deviceId } = req.body;
    const { deviceIds, orgId } = req.user;

    if (req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Student only.",
      });
    }

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "studentId is required",
      });
    }

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: "Device ID not found in token",
      });
    }

    if (!deviceIds?.some((id) => id === deviceId)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You are not authorized person for this operation.",
      });
    }

    await removeStudentDeviceId(orgId as string, studentId, deviceId);

    return res.status(200).json({
      success: true,
      message: "Device ID removed successfully",
    });
  } catch (error) {
    logControllerError("removeStudentDeviceIdController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "Student not found",
      "deviceId is required",
      "Device ID not found in token",
    ].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Internal server error",
    });
  }
};

// ---------------------------------------------------------------------------
// Question mutations
// ---------------------------------------------------------------------------

const addQuestionController = async (req: Request, res: Response) => {
  const { questionId, level, type, questions, marks, oral } = req.body;
  const { orgId, id: createdBy } = req.user;

  if (!questionId) {
    return sendBadRequest(res, "questionId is required");
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return sendBadRequest(res, "questions must be a non-empty array");
  }

  const typeErrorResponse = sendQuestionTypeError(res, type);
  if (typeErrorResponse) return typeErrorResponse;

  if (marks !== undefined && !Array.isArray(marks)) {
    return sendBadRequest(res, "marks must be an array");
  }

  const oralErrorResponse = sendBooleanFieldError(res, "oral", oral);
  if (oralErrorResponse) return oralErrorResponse;

  const levelErrorResponse = sendStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  await addQuestion({
    createdBy,
    orgId: orgId as string,
    questionId,
    level: Number(level),
    type,
    questions,
    marks,
    oral,
  });

  return res.status(201).json({
    success: true,
    message: "Question added successfully",
  });
};

const updateQuestionController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return sendBadRequest(res, "Question ID is required");
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return sendBadRequest(res, "No update data provided");
    }

    if (hasField(updateData, "level")) {
      const levelErrorResponse = sendStudentLevelError(res, updateData.level);
      if (levelErrorResponse) return levelErrorResponse;

      updateData.level = Number(updateData.level);
    }

    if (hasField(updateData, "type")) {
      const typeErrorResponse = sendQuestionTypeError(res, updateData.type);
      if (typeErrorResponse) return typeErrorResponse;
    }

    if (hasField(updateData, "marks") && !Array.isArray(updateData.marks)) {
      return sendBadRequest(res, "marks must be an array");
    }

    if (hasField(updateData, "oral")) {
      const oralErrorResponse = sendBooleanFieldError(
        res,
        "oral",
        updateData.oral,
      );
      if (oralErrorResponse) return oralErrorResponse;
    }

    if (
      hasField(updateData, "questions") &&
      (!Array.isArray(updateData.questions) ||
        updateData.questions.length === 0)
    ) {
      return sendBadRequest(res, "questions must be a non-empty array");
    }

    await updateQuestion(req.user.orgId as string, id, updateData);

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
    });
  } catch (error) {
    logControllerError("updateQuestionController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "Question not found",
      "No valid fields provided to update",
    ].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Internal server error",
    });
  }
};

const deleteQuestionController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { orgId } = req.user;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required",
      });
    }

    const data = await deleteQuestion(orgId as string, id);

    return res.status(200).json({
      success: true,
      message:
        data.deleteType === "soft"
          ? "Question soft deleted successfully"
          : "Question deleted successfully",
    });
  } catch (error) {
    logControllerError("deleteQuestionController", error);

    const message = getErrorMessage(error);
    const isClientError = ["Question not found"].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Internal server error",
    });
  }
};

const updateHomeworkController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Homework ID is required",
    });
  }

  if (!updateData || Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No update data provided",
    });
  }

  const data = await updateHomework(id, updateData);

  return res.status(200).json({
    success: true,
    message: "Homework updated successfully",
    ...data,
  });
};

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

const healthCheckController = (req: Request, res: Response) => {
  if (req.query.status) {
    const memUsage = process.memoryUsage();
    return res.status(200).json({
      status: "OK",
      uptime: getFormattedUptime(),
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      },
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

const getNotificationsController = async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 15;

  const result = await getNotificationList(studentId, page, limit, "student");

  return res.status(200).json({
    success: true,
    data: result.notifications,
    meta: result.meta,
  });
};

const getAdminNotificationsController = async (req: Request, res: Response) => {
  const adminId = req.user.id;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 15;

  const result = await getNotificationList(adminId, page, limit, "admin");

  return res.status(200).json({
    success: true,
    data: result.notifications,
    meta: result.meta,
  });
};

const sendNotificationController = async (req: Request, res: Response) => {
  const { studentIds, messageHeader, messageBody } = req.body;
  const sentBy = req.user.id; // from auth middleware

  // Validate studentIds
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "studentIds must be a non-empty array",
    });
  }

  const result = await sendBulkNotification(
    studentIds.map((id: string) => ({ id })),
    messageHeader,
    messageBody,
    sentBy,
  );

  return res.status(201).json({
    success: true,
    message: `Notification sent to ${result.sentCount} of ${result.totalRequested} students`,
    data: result,
  });
};

const sendAppreciationNotificationsController = async (
  req: Request,
  res: Response,
) => {
  const result = await sendAppreciationNotifications();

  return res.status(201).json({
    success: true,
    message: `Appreciation notification sent to ${result.sentCount} of ${result.totalRequested} completed homework`,
    data: result,
  });
};

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

const addMessageController = async (req: Request, res: Response) => {
  try {
    const { message, receivedTo } = req.body;

    const data = await addMessage(req.user, message, receivedTo);

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: data.message,
    });
  } catch (error) {
    logControllerError("addMessageController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "message is required",
      "receivedTo is required",
      "Invalid receivedTo",
      "Invalid sender",
      "Student not found",
      "Admin not found",
    ].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Failed to send message",
    });
  }
};

const getMessagesController = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const { id, role, orgId } = req.user;
    const userId =
      (req.params.studentId as string) ||
      (req.query.studentId as string) ||
      null;

    const result = await getMessageList(req.user, page, limit, userId);
    let adminDetails = {};
    if (role === userTypeEnum.STUDENT) {
      adminDetails = await getAdminDetail(orgId, id);
    }

    return res.status(200).json({
      success: true,
      adminDetails,
      data: result.messages,
      meta: result.meta,
    });
  } catch (error) {
    logControllerError("getMessagesController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "Invalid user",
      "Invalid userId",
      "Student not found",
      "Admin not found",
    ].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Failed to fetch messages",
    });
  }
};

const getUnreadMessageCountController = async (req: Request, res: Response) => {
  try {
    const result = await getUnreadMessageCount(req.user);

    return res.status(200).json({
      success: true,
      message: "Unread message count fetched successfully",
      data: result,
    });
  } catch (error) {
    logControllerError("getUnreadMessageCountController", error);

    const message = getErrorMessage(error);
    const isClientError = ["Invalid user"].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Failed to fetch unread message count",
    });
  }
};

const markMessagesAsReadController = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const userId = body.userId || body.studentId || null;
    const messageIds = body.messageIds || [];

    const result = await markMessagesAsRead(req.user, userId, messageIds);

    return res.status(200).json({
      success: true,
      message: "Messages marked as read",
      ...result,
    });
  } catch (error) {
    logControllerError("markMessagesAsReadController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "Invalid user",
      "Invalid userId",
      "messageIds must be an array",
      "Invalid messageIds",
    ].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Failed to update messages",
    });
  }
};

const updateMyStudentController = async (req: Request, res: Response) => {
  try {
    const studentId = req.user.id; // from auth middleware
    const updateData = req.body;
    const { orgId } = req.user;

    if (req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Student only.",
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No update data provided",
      });
    }

    await updateStudent(studentId, updateData, orgId as string);

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
    });
  } catch (error) {
    logControllerError("updateMyStudentController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "Student not found",
      "No valid fields provided to update",
    ].includes(message);
    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Internal server error",
    });
  }
};

const changePasswordController = async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const { orgId } = req.user;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    if (
      confirmNewPassword !== undefined &&
      confirmNewPassword !== newPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "New password confirmation does not match",
      });
    }

    await changePassword(
      orgId as string,
      req.user.id,
      req.user.role,
      oldPassword,
      newPassword,
    );

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    logControllerError("changePasswordController", error);

    const message = getErrorMessage(error);
    const isClientError = [
      "Old password and new password are required",
      "Old password is incorrect",
      "New password must be different from the current password",
      "User not found",
      "Invalid user role",
      "New password confirmation does not match",
    ].includes(message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: message || "Failed to update password",
    });
  }
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

const addAdminController = async (req: Request, res: Response) => {
  try {
    const { orgId } = req.user;
    const { name, profilePicPath } = req.body;

    if (!name || !orgId) {
      return res
        .status(400)
        .json({ message: "name, password and orgId are required" });
    }

    const admin = await addAdmin({
      name,
      profilePicPath,
      orgId: orgId as string,
      roles: null,
    });
    return res.status(201).json({
      message: "Admin created successfully",
      success: true,
      data: admin,
    });
  } catch (error) {
    logControllerError("changePasswordController", error);
    const message = getErrorMessage(error);
    if (message === "Organization not found") {
      return res.status(404).json({ success: false, message });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: message,
    });
  }
};

const updateAdminController = async (req: Request, res: Response) => {
  try {
    const { id: adminId } = req.params;
    const { orgId } = req.user;
    const data = await updateAdmin(adminId, orgId as string, req.body);
    return res.status(200).json({
      message: "Admin updated successfully",
      success: true,
      ...data,
    });
  } catch (error) {
    logControllerError("changePasswordController", error);
    const message = getErrorMessage(error);
    if (message === "Admin not found") {
      return res.status(404).json({ success: false, message });
    }
    if (message === "No valid fields to update") {
      return res.status(400).json({ success: false, message });
    }
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: message,
    });
  }
};

const getAdminListController = async (req: Request, res: Response) => {
  const { orgId, id } = req.user;
  const data = await getAdminList(id, orgId as string);
  return res.status(200).json({
    success: true,
    message: "Admins list fetched successfully",
    ...data,
  });
};

const getOrgDetailController = async (req: Request, res: Response) => {
  const { orgId } = req.user;
  const data = await getOrgDetail(orgId as string);
  return res.status(200).json({
    success: true,
    message: "Organization detail fetched successfully",
    ...data,
  });
};

export {
  addAdminController,
  updateAdminController,
  getAdminListController,
  getStudentListController,
  getMessageStudentListController,
  getStudentsBySameDeviceIdController,
  addStudentController,
  updateStudentController,
  resetStudentPasswordController,
  removeStudentDeviceIdController,
  updateStudentFcmTokenController,
  getQuestionListController,
  getPracticeQuestionListController,
  addQuestionController,
  updateQuestionController,
  deleteQuestionController,
  assignQuestionController,
  unassignQuestionController,
  assignPracticeQuestionsToSelfController,
  unassignPracticeQuestionsFromSelfController,
  getHomeworkListController,
  getHomeworkByIdController,
  updateHomeworkController,
  getAvailableQuestionsForStudentController,
  getScoreByStudentIdController,
  loginController,
  healthCheckController,
  getNotificationsController,
  getAdminNotificationsController,
  sendNotificationController,
  sendAppreciationNotificationsController,
  addMessageController,
  getMessagesController,
  getUnreadMessageCountController,
  markMessagesAsReadController,
  getRankingController,
  updateMyStudentController,
  changePasswordController,
  loginUsingDeviceIdController,
  uploadFileController,
  getFileUploadListController,
  updateFileUploadNameController,
  deleteFileUploadController,
  deleteProfilePicController,
  downloadFileUploadController,
  getOrgDetailController,
};
