const {
  login,
  getStudentList,
  getQuestionList,
  getHomeworkList,
  getAvailableQuestionsForStudent,
  updateHomework,
  getScoreByStudentId,
  getHomeworkById,
  assignQuestion,
  addStudent,
  updateStudent,
  updateFcmToken,
  addQuestion,
  sendBulkNotification,
  getNotificationList,
} = require("../service");

const loginController = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const data = await login(username, password);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      ...data,
    });
  } catch (error) {
    const isClientError = ["Invalid username or password"].includes(
      error.message,
    );

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

const getQuestionListController = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const search = req.query.search?.trim() || "";

  const data = await getQuestionList(page, limit, search);

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
  const { page, limit } = req.query;

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

  const data = await getHomeworkList(
    studentId,
    state || null,
    parseInt(page) || 1,
    parseInt(limit) || 15,
  );

  return res.status(200).json({
    success: true,
    message: "Homework list fetched successfully",
    ...data,
  });
};

const getAvailableQuestionsForStudentController = async (req, res) => {
  const { studentId } = req.params;
  const { page, limit, search } = req.query;

  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: "Student ID is required",
    });
  }

  const data = await getAvailableQuestionsForStudent(
    studentId,
    parseInt(page) || 1,
    parseInt(limit) || 15,
    search?.trim() || "",
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
};

const addStudentController = async (req, res) => {
  const { name, password = "Welcome123" } = req.body;

  if (!name || !password) {
    return res.status(400).json({
      success: false,
      message: "name, password and createdBy are required",
    });
  }

  await addStudent({ name, password, createdBy: req.user.id });

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

  const tokenList = await updateFcmToken(req.user.id, fcmToken);

  return res.status(200).json({
    success: true,
    message: "FCM token updated successfully",
  });
};

const addQuestionController = async (req, res) => {
  const { questionId, questions } = req.body;

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

  await addQuestion({ questionId, questions });

  return res.status(201).json({
    success: true,
    message: "Question added successfully",
  });
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

  const result = await getNotificationList(studentId, page, limit);

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

module.exports = {
  getStudentListController,
  addStudentController,
  updateStudentController,
  updateStudentFcmTokenController,
  getQuestionListController,
  addQuestionController,
  assignQuestionController,
  getHomeworkListController,
  getHomeworkByIdController,
  updateHomeworkController,
  getAvailableQuestionsForStudentController,
  getScoreByStudentIdController,
  loginController,
  healthCheckController,
  getNotificationsController,
  sendNotificationController,
};
