const {
  login,
  loginUsingDeviceId,
  getStudentList,
  getStudentsBySameDeviceId,
  getQuestionList,
  getHomeworkList,
  getAvailableQuestionsForStudent,
  updateHomework,
  getScoreByStudentId,
  getHomeworkById,
  assignQuestion,
  addStudent,
  updateStudent,
  removeStudentDeviceId,
  updateFcmToken,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  sendBulkNotification,
  getNotificationList,
  getWeeklyRankings,
} = require("../service");

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

  const data = await getStudentList(req.user.id, page, limit, search);

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

  if (
    level !== undefined &&
    (String(level).trim() === "" || Number.isNaN(Number(level)))
  ) {
    return res.status(400).json({
      success: false,
      message: "level must be a number",
    });
  }

  const data = await getWeeklyRankings(
    level === undefined ? null : Number(level),
  );

  return res.status(200).json({
    success: true,
    message:
      level === undefined
        ? "Ranking list fetched successfully"
        : `Ranking list fetched successfully for level ${Number(level)}`,
    data,
  });
};

const hasField = (data, field) =>
  Object.prototype.hasOwnProperty.call(data, field);

const isMissingRequiredValue = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

const validateStudentLevel = (level) => {
  if (isMissingRequiredValue(level)) {
    return "level is required";
  }

  if (Number.isNaN(Number(level))) {
    return "level must be a number";
  }

  return null;
};

const logControllerError = (context, error) => {
  console.error(`[${context}]`, error);
};

const getQuestionListController = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const search = req.query.search?.trim() || "";
  const { level } = req.query;

  if (
    level !== undefined &&
    (String(level).trim() === "" || Number.isNaN(Number(level)))
  ) {
    return res.status(400).json({
      success: false,
      message: "level must be a number",
    });
  }

  const data = await getQuestionList(
    page,
    limit,
    search,
    level === undefined ? null : Number(level),
  );

  return res.status(200).json({
    success: true,
    message: search
      ? `Search results for "${search}"`
      : "Question list fetched successfully",
    ...data,
  });
};

const getHomeworkListController = async (req, res) => {
  const { studentId, state } = req.params;
  const { page, limit, sortBy, sortOrder } = req.query;

  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: "Student ID is required",
    });
  }

  // Validate state if provided
  const validStates = ["NEW", "PROGRESS", "COMPLETED"];
  if (state && !validStates.includes(state.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: `Invalid state. Must be one of: ${validStates.join(", ")}`,
    });
  }

  const validSortFields = ["createdAt", "updatedAt"];
  if (sortBy && !validSortFields.includes(sortBy)) {
    return res.status(400).json({
      success: false,
      message: `Invalid sortBy. Must be one of: ${validSortFields.join(", ")}`,
    });
  }

  const normalizedSortOrder = sortOrder?.toLowerCase();
  const validSortOrders = ["asc", "desc"];
  if (normalizedSortOrder && !validSortOrders.includes(normalizedSortOrder)) {
    return res.status(400).json({
      success: false,
      message: "Invalid sortOrder. Must be asc or desc",
    });
  }

  const data = await getHomeworkList(
    studentId,
    state || null,
    parseInt(page) || 1,
    parseInt(limit) || 15,
    sortBy,
    normalizedSortOrder,
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

  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: "Student ID is required",
    });
  }

  if (
    level !== undefined &&
    (String(level).trim() === "" || Number.isNaN(Number(level)))
  ) {
    return res.status(400).json({
      success: false,
      message: "level must be a number",
    });
  }

  const data = await getAvailableQuestionsForStudent(
    studentId,
    parseInt(page) || 1,
    parseInt(limit) || 15,
    search?.trim() || "",
    level === undefined ? null : Number(level),
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

const addStudentController = async (req, res) => {
  const { name, level } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "name is required",
    });
  }

  const levelError = validateStudentLevel(level);
  if (levelError) {
    return res.status(400).json({
      success: false,
      message: levelError,
    });
  }

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
    return res.status(400).json({
      success: false,
      message: "Student ID is required",
    });
  }

  if (!updateData || Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No update data provided",
    });
  }

  if (hasField(updateData, "level")) {
    const levelError = validateStudentLevel(updateData.level);
    if (levelError) {
      return res.status(400).json({
        success: false,
        message: levelError,
      });
    }

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
  const { questionId, level, questions } = req.body;

  if (!questionId) {
    return res.status(400).json({
      success: false,
      message: "questionId is required",
    });
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({
      success: false,
      message: "questions must be a non-empty array",
    });
  }

  const levelError = validateStudentLevel(level);
  if (levelError) {
    return res.status(400).json({
      success: false,
      message: levelError,
    });
  }

  await addQuestion({ questionId, level: Number(level), questions });

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
      return res.status(400).json({
        success: false,
        message: "Question ID is required",
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No update data provided",
      });
    }

    if (hasField(updateData, "level")) {
      const levelError = validateStudentLevel(updateData.level);
      if (levelError) {
        return res.status(400).json({
          success: false,
          message: levelError,
        });
      }

      updateData.level = Number(updateData.level);
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
  addQuestionController,
  updateQuestionController,
  deleteQuestionController,
  assignQuestionController,
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
};
