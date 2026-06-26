const {
  login,
  loginUsingDeviceId,
  getStudentList,
  getMessageStudentList,
  getStudentsBySameDeviceId,
  createRegistration,
  getRegistrationList,
  deleteRegistration,
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
  getNotificationList,
  getWeeklyRankings,
  addAdmin,
  updateAdmin,
  getAdminList,
} = require("../service");
const {
  hasField,
  sendOptionalStudentLevelError,
  validateQuestionType,
  validateStudentLevel,
} = require("../utils/validation");
const logger = require("../middleware/logger");

const loginController = async (req, res) => {
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

    const isClientError = ["Invalid username or password"].includes(
      error.message,
    );

    return res.status(isClientError ? 401 : 500).json({
      success: false,
      message: error.message || "Failed to login",
    });
  }
};

const loginUsingDeviceIdController = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { deviceIds } = req.user;

    const data = await loginUsingDeviceId(studentId, deviceIds);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      ...data,
    });
  } catch (error) {
    logControllerError("loginUsingDeviceIdController", error);

    const isClientError = [
      "Device ID not found in token",
      "Student not found for this device",
      "Invalid username or password",
    ].includes(error.message);

    return res.status(isClientError ? 401 : 500).json({
      success: false,
      message: error.message || "Failed to login",
    });
  }
};

const getStudentListController = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const search = req.query.search?.trim() || "";
  const { level } = req.query;
  const { orgId } = req.user;

  const levelErrorResponse = sendOptionalStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  const data = await getStudentList(
    orgId,
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

const getMessageStudentListController = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const search = req.query.search?.trim() || "";
  const { level } = req.query;

  const levelErrorResponse = sendOptionalStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  const data = await getMessageStudentList(
    req.user.orgId,
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

const getStudentsBySameDeviceIdController = async (req, res) => {
  try {
    const data = await getStudentsBySameDeviceId(
      req.user.orgId,
      req.user.deviceIds,
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      message: "Students with same device ID fetched successfully",
      ...data,
    });
  } catch (error) {
    logControllerError("getStudentsBySameDeviceIdController", error);

    const isClientError = [
      "Student not found",
      "Device ID is not assigned for this student",
    ].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to fetch students",
    });
  }
};

const getRankingController = async (req, res) => {
  const { level } = req.query;
  const { orgId } = req.user;

  const levelErrorResponse = sendOptionalStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  const rankingLevel = level === undefined ? null : Number(level);
  const data = await getWeeklyRankings(orgId, rankingLevel, req.user);

  return res.status(200).json({
    success: true,
    message:
      rankingLevel === null
        ? "Ranking list fetched successfully"
        : `Ranking list fetched successfully for level ${rankingLevel}`,
    data,
  });
};

const logControllerError = (context, error) => {
  logger.error({ err: error, context }, "controller_error");
};

const sendBadRequest = (res, message) =>
  res.status(400).json({
    success: false,
    message,
  });

const sendQuestionTypeError = (res, type, isRequired = true) => {
  const typeError = validateQuestionType(type, isRequired);
  return typeError ? sendBadRequest(res, typeError) : null;
};

const sendStudentLevelError = (res, level) => {
  const levelError = validateStudentLevel(level);
  return levelError ? sendBadRequest(res, levelError) : null;
};

const sendBooleanFieldError = (res, field, value) => {
  if (value === undefined || typeof value === "boolean") {
    return null;
  }

  return sendBadRequest(res, `${field} must be a boolean`);
};

const getQuestionListController = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const search = req.query.search?.trim() || "";
  const { level } = req.query;
  const type = req.query.type?.trim();
  const { orgId } = req.user;

  const levelErrorResponse = sendOptionalStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  const typeErrorResponse = sendQuestionTypeError(res, type, false);
  if (typeErrorResponse) return typeErrorResponse;

  const data = await getQuestionList(
    orgId,
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

const getPracticeQuestionListController = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const search = req.query.search?.trim() || "";
  const { level } = req.query;

  const levelErrorResponse = sendOptionalStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  const data = await getPracticeQuestionList(
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

const getHomeworkListController = async (req, res) => {
  const { studentId, state } = req.params;
  const { page, limit, sortBy, sortOrder } = req.query;
  const type = req.query.type?.trim();

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
    state || null,
    parseInt(page) || 1,
    parseInt(limit) || 15,
    sortBy,
    normalizedSortOrder,
    type || null,
  );

  return res.status(200).json({
    success: true,
    message: "Homework list fetched successfully",
    ...data,
  });
};

const getAvailableQuestionsForStudentController = async (req, res) => {
  const { studentId } = req.params;
  const { page, limit, search, level } = req.query;
  const type = req.query.type?.trim();

  if (!studentId) {
    return sendBadRequest(res, "Student ID is required");
  }

  const levelErrorResponse = sendOptionalStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  const typeErrorResponse = sendQuestionTypeError(res, type, false);
  if (typeErrorResponse) return typeErrorResponse;

  const data = await getAvailableQuestionsForStudent(
    studentId,
    parseInt(page) || 1,
    parseInt(limit) || 15,
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

const getScoreByStudentIdController = async (req, res) => {
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

const getHomeworkByIdController = async (req, res) => {
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

const assignQuestionController = async (req, res) => {
  try {
    const { studentId, levels, questionIds } = req.body;
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
      ? await assignQuestion(req.user.id, studentId, questionIds)
      : await assignQuestionsByLevels(req.user.id, levels, questionIds);

    return res.status(201).json({
      success: true,
      message: `Homework question(s) assigned successfully`,
      ...data,
    });
  } catch (error) {
    logControllerError("assignQuestionController", error);

    const isClientError = [
      "One or more questions not found",
      "levels must be a non-empty array of numbers",
      "No students found for levels",
    ].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const unassignQuestionController = async (req, res) => {
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

    const isClientError = [
      "studentId is required",
      "questionIds are required",
      "Invalid studentId or questionIds",
      "One or more questions are not assigned",
    ].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const normalizeQuestionIds = (body) => {
  if (Array.isArray(body.questionIds)) {
    return body.questionIds;
  }

  return body.questionId ? [body.questionId] : [];
};

const assignPracticeQuestionsToSelfController = async (req, res) => {
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

    const isClientError = [
      "questionIds are required",
      "Invalid questionIds",
      "One or more practice questions not found",
    ].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const unassignPracticeQuestionsFromSelfController = async (req, res) => {
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

    const isClientError = [
      "questionIds are required",
      "Invalid questionIds",
      "One or more practice questions not found",
      "One or more practice questions are not assigned",
      "Practice questions can only be unassigned while assigned",
    ].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const addStudentController = async (req, res) => {
  const { name, level } = req.body;
  const { orgId, id: createdBy } = req.user;

  if (!name) {
    return sendBadRequest(res, "name is required");
  }

  const levelErrorResponse = sendStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  await addStudent({
    name,
    level: Number(level),
    orgId,
    createdBy,
  });

  return res.status(201).json({
    success: true,
    message: "Student added successfully",
  });
};

const updateStudentController = async (req, res) => {
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

  await updateStudent(id, updateData, req.user.orgId);

  return res.status(200).json({
    success: true,
    message: "Student updated successfully",
  });
};

const resetStudentPasswordController = async (req, res) => {
  try {
    const { id } = req.params;
    const { orgId } = req.user;

    if (!id) {
      return sendBadRequest(res, "Student ID is required");
    }

    const data = await resetStudentPassword(id, orgId);

    return res.status(200).json({
      success: true,
      message: "Student password reset successfully",
      data,
    });
  } catch (error) {
    logControllerError("resetStudentPasswordController", error);

    const isClientError = ["Student not found"].includes(error.message);
    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to reset student password",
    });
  }
};

const updateStudentFcmTokenController = async (req, res) => {
  const { fcmToken } = req.body;
  const { orgId } = req.user;

  if (!fcmToken) {
    return res.status(400).json({
      success: false,
      message: "fcmToken is required",
    });
  }

  const isStudent = req.user.role === "student";
  await updateFcmToken(orgId, req.user.id, fcmToken, isStudent);

  return res.status(200).json({
    success: true,
    message: "FCM token updated successfully",
  });
};

const uploadFileController = async (req, res) => {
  try {
    const file = await uploadFile(
      req.file,
      req.user,
      req.body?.path,
      req.body?.name,
    );

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      file,
    });
  } catch (error) {
    logControllerError("uploadFileController", error);

    const isClientError = [
      "file is required",
      "path is required",
      "name is required",
      "profile picture must be an image",
    ].includes(error.message);
    const isForbiddenError = [
      "Only admin can upload practice or celebration files",
    ].includes(error.message);

    return res.status(isForbiddenError ? 403 : isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to upload file",
    });
  }
};

const getFileUploadListController = async (req, res) => {
  try {
    const type = req.query.type?.trim();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;

    const data = await getFileUploadList(type, page, limit);

    return res.status(200).json({
      success: true,
      message: "File upload list fetched successfully",
      ...data,
    });
  } catch (error) {
    logControllerError("getFileUploadListController", error);

    const isClientError = [
      "type must be one of: practice, celebration",
    ].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to fetch file uploads",
    });
  }
};

const sendDownloadResponse = (res, file) => {
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

const updateFileUploadNameController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    await updateFileUploadName(id, name);

    return res.status(200).json({
      success: true,
      message: "File upload name updated successfully",
    });
  } catch (error) {
    logControllerError("updateFileUploadNameController", error);

    const isClientError = [
      "fileUploadId is required",
      "name is required",
      "File upload not found",
    ].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to update file upload",
    });
  }
};

const downloadFileUploadController = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await downloadFileUpload(id);

    return sendDownloadResponse(res, file);
  } catch (error) {
    logControllerError("downloadFileUploadController", error);

    const isClientError = [
      "fileUploadId is required",
      "File upload not found",
    ].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to download file upload",
    });
  }
};

const deleteFileUploadController = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteFileUpload(id);

    return res.status(200).json({
      success: true,
      message: "File upload deleted successfully",
    });
  } catch (error) {
    logControllerError("deleteFileUploadController", error);

    const isClientError = [
      "fileUploadId is required",
      "File upload not found",
    ].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to delete file upload",
    });
  }
};

const deleteProfilePicController = async (req, res) => {
  try {
    await deleteProfilePic(req.user.orgId, req.user);

    return res.status(200).json({
      success: true,
      message: "Profile picture deleted successfully",
    });
  } catch (error) {
    logControllerError("deleteProfilePicController", error);

    const isClientError = [
      "User not found",
      "Profile picture not found",
    ].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to delete profile picture",
    });
  }
};

const removeStudentDeviceIdController = async (req, res) => {
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

    if (!deviceIds.some((id) => id === deviceId)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You are not authorized person for this operation.",
      });
    }

    await removeStudentDeviceId(orgId, studentId, deviceId);

    return res.status(200).json({
      success: true,
      message: "Device ID removed successfully",
    });
  } catch (error) {
    logControllerError("removeStudentDeviceIdController", error);

    const isClientError = [
      "Student not found",
      "deviceId is required",
      "Device ID not found in token",
    ].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const addQuestionController = async (req, res) => {
  const { questionId, level, type, questions, marks, oral } = req.body;
  const { orgId } = req.user;

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
    orgId,
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

const updateQuestionController = async (req, res) => {
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

    await updateQuestion(req.user.orgId, id, updateData);

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
    });
  } catch (error) {
    logControllerError("updateQuestionController", error);

    const isClientError = [
      "Question not found",
      "No valid fields provided to update",
    ].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const deleteQuestionController = async (req, res) => {
  try {
    const { id } = req.params;
    const { orgId } = req.user;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required",
      });
    }

    const data = await deleteQuestion(orgId, id);

    return res.status(200).json({
      success: true,
      message:
        data.deleteType === "soft"
          ? "Question soft deleted successfully"
          : "Question deleted successfully",
    });
  } catch (error) {
    logControllerError("deleteQuestionController", error);

    const isClientError = ["Question not found"].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const updateHomeworkController = async (req, res) => {
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

const healthCheckController = (req, res) => {
  if (req.query.status) {
    const memUsage = process.memoryUsage();
    return res.status(200).json({
      status: "OK",
      uptime: process.uptime(),
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

const getNotificationsController = async (req, res) => {
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

const getAdminNotificationsController = async (req, res) => {
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

const sendNotificationController = async (req, res) => {
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
    studentIds,
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

const addMessageController = async (req, res) => {
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

    const isClientError = [
      "message is required",
      "receivedTo is required",
      "Invalid receivedTo",
      "Invalid sender",
      "Student not found",
      "Admin not found",
    ].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to send message",
    });
  }
};

const getMessagesController = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const userId = req.query.userId || req.query.studentId || null;

    const result = await getMessageList(req.user, page, limit, userId);

    return res.status(200).json({
      success: true,
      data: result.messages,
      meta: result.meta,
    });
  } catch (error) {
    logControllerError("getMessagesController", error);

    const isClientError = [
      "Invalid user",
      "Invalid userId",
      "Student not found",
      "Admin not found",
    ].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to fetch messages",
    });
  }
};

const createRegistrationController = async (req, res) => {
  try {
    const data = await createRegistration(req.body, req.user.id);

    return res.status(201).json({
      success: true,
      message: "Registration created successfully",
      ...data,
    });
  } catch (error) {
    logControllerError("createRegistrationController", error);

    const isClientError = ["studentName is required"].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to create registration",
    });
  }
};

const getRegistrationListController = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const search = req.query.search?.trim() || "";

  const data = await getRegistrationList(req.user.id, page, limit, search);

  return res.status(200).json({
    success: true,
    message: search
      ? `Registration search results for "${search}"`
      : "Registration list fetched successfully",
    ...data,
  });
};

const deleteRegistrationController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendBadRequest(res, "Registration ID is required");
    }

    await deleteRegistration(id, req.user.id);

    return res.status(200).json({
      success: true,
      message: "Registration deleted successfully",
    });
  } catch (error) {
    logControllerError("deleteRegistrationController", error);

    const isClientError = [
      "Invalid registrationId",
      "Registration not found",
    ].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to delete registration",
    });
  }
};

const getUnreadMessageCountController = async (req, res) => {
  try {
    const result = await getUnreadMessageCount(req.user);

    return res.status(200).json({
      success: true,
      message: "Unread message count fetched successfully",
      data: result,
    });
  } catch (error) {
    logControllerError("getUnreadMessageCountController", error);

    const isClientError = ["Invalid user"].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to fetch unread message count",
    });
  }
};

const markMessagesAsReadController = async (req, res) => {
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

    const isClientError = [
      "Invalid user",
      "Invalid userId",
      "messageIds must be an array",
      "Invalid messageIds",
    ].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to update messages",
    });
  }
};

const updateMyStudentController = async (req, res) => {
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

    await updateStudent(studentId, updateData, orgId);

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
    });
  } catch (error) {
    logControllerError("updateMyStudentController", error);

    const isClientError = [
      "Student not found",
      "No valid fields provided to update",
    ].includes(error.message);
    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const changePasswordController = async (req, res) => {
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
      orgId,
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

    const isClientError = [
      "Old password and new password are required",
      "Old password is incorrect",
      "New password must be different from the current password",
      "User not found",
      "Invalid user role",
      "New password confirmation does not match",
    ].includes(error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to update password",
    });
  }
};

const addAdminController = async (req, res) => {
  try {
    const { orgId } = req.user;
    const { name, profilePicPath } = req.body;

    if (!name || !orgId) {
      return res
        .status(400)
        .json({ message: "name, password and orgId are required" });
    }

    const admin = await addAdmin({ name, profilePicPath, orgId });
    return res.status(201).json({
      message: "Admin created successfully",
      success: true,
      data: admin,
    });
  } catch (error) {
    logControllerError("changePasswordController", error);
    if (error.message === "Organization not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const updateAdminController = async (req, res) => {
  try {
    const { id: adminId } = req.params;
    const { orgId } = req.user;
    const data = await updateAdmin(adminId, orgId, req.body);
    return res.status(200).json({
      message: "Admin updated successfully",
      success: true,
      ...data,
    });
  } catch (error) {
    logControllerError("changePasswordController", error);
    if (error.message === "Admin not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === "No valid fields to update") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
};

const getAdminListController = async (req, res) => {
  try {
    const { orgId, id } = req.user;
    const data = await getAdminList(id, orgId);
    return res.status(200).json({
      success: true,
      message: "Admins list fetched successfully",
      ...data,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  addAdminController,
  updateAdminController,
  getAdminListController,
  getStudentListController,
  getMessageStudentListController,
  getStudentsBySameDeviceIdController,
  createRegistrationController,
  getRegistrationListController,
  deleteRegistrationController,
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
};
