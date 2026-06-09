const {
  login,
  loginUsingDeviceId,
  getStudentList,
  getStudentsBySameDeviceId,
  getQuestionList,
  getPracticeQuestionList,
  getHomeworkList,
  getAvailableQuestionsForStudent,
  updateHomework,
  getScoreByStudentId,
  getHomeworkById,
  assignQuestion,
  assignPracticeQuestionsToSelf,
  addStudent,
  updateStudent,
  removeStudentDeviceId,
  updateFcmToken,
  uploadFile,
  getFileUploadList,
  updateFileUploadName,
  deleteFileUpload,
  deleteProfilePic,
  downloadFileUpload,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  sendBulkNotification,
  getNotificationList,
  getWeeklyRankings,
} = require("../service");
const {
  hasField,
  sendOptionalStudentLevelError,
  validateQuestionType,
  validateStudentLevel,
} = require("../utils/validation");

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

  const levelErrorResponse = sendOptionalStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  const data = await getStudentList(
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

const getStudentsBySameDeviceIdController = async (req, res) => {
  try {
    const data = await getStudentsBySameDeviceId(req.user.deviceIds);

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

  const levelErrorResponse = sendOptionalStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  const rankingLevel = level === undefined ? null : Number(level);
  const data = await getWeeklyRankings(rankingLevel, req.user);

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
  console.error(`[${context}]`, error);
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

  const levelErrorResponse = sendOptionalStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  const typeErrorResponse = sendQuestionTypeError(res, type, false);
  if (typeErrorResponse) return typeErrorResponse;

  const data = await getQuestionList(
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
    const { studentId, questionIds } = req.body;

    // Validate inputs
    if (!studentId || !Array.isArray(questionIds) || questionIds.length < 1) {
      return res.status(400).json({
        success: false,
        message: "studentId and questionIds are required",
      });
    }

    const data = await assignQuestion(studentId, questionIds);

    return res.status(201).json({
      success: true,
      message: `${data.homeworks.length} question(s) assigned successfully`,
      ...data,
    });
  } catch (error) {
    logControllerError("assignQuestionController", error);

    const isClientError = ["One or more questions not found"].includes(
      error.message,
    );

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

const addStudentController = async (req, res) => {
  const { name, level } = req.body;

  if (!name) {
    return sendBadRequest(res, "name is required");
  }

  const levelErrorResponse = sendStudentLevelError(res, level);
  if (levelErrorResponse) return levelErrorResponse;

  await addStudent({ name, level: Number(level), createdBy: req.user.id });

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

  await updateStudent(id, updateData);

  return res.status(200).json({
    success: true,
    message: "Student updated successfully",
  });
};

const updateStudentFcmTokenController = async (req, res) => {
  const { fcmToken } = req.body;

  if (!fcmToken) {
    return res.status(400).json({
      success: false,
      message: "fcmToken is required",
    });
  }

  const isStudent = req.user.role === "student";
  await updateFcmToken(req.user.id, fcmToken, isStudent);

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
    await deleteProfilePic(req.user);

    return res.status(200).json({
      success: true,
      message: "Profile picture deleted successfully",
    });
  } catch (error) {
    logControllerError("deleteProfilePicController", error);

    const isClientError = ["User not found", "Profile picture not found"].includes(
      error.message,
    );

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to delete profile picture",
    });
  }
};

const removeStudentDeviceIdController = async (req, res) => {
  try {
    const { studentId, deviceId } = req.body;
    const { deviceIds } = req.user;

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

    await removeStudentDeviceId(studentId, deviceId);

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
      (!Array.isArray(updateData.questions) || updateData.questions.length === 0)
    ) {
      return sendBadRequest(res, "questions must be a non-empty array");
    }

    await updateQuestion(id, updateData);

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

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required",
      });
    }

    const data = await deleteQuestion(id);

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

const updateMyStudentController = async (req, res) => {
  try {
    const studentId = req.user.id; // from auth middleware
    const updateData = req.body;

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

    await updateStudent(studentId, updateData);

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

module.exports = {
  getStudentListController,
  getStudentsBySameDeviceIdController,
  addStudentController,
  updateStudentController,
  removeStudentDeviceIdController,
  updateStudentFcmTokenController,
  getQuestionListController,
  getPracticeQuestionListController,
  addQuestionController,
  updateQuestionController,
  deleteQuestionController,
  assignQuestionController,
  assignPracticeQuestionsToSelfController,
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
  getRankingController,
  updateMyStudentController,
  loginUsingDeviceIdController,
  uploadFileController,
  getFileUploadListController,
  updateFileUploadNameController,
  deleteFileUploadController,
  deleteProfilePicController,
  downloadFileUploadController,
};
