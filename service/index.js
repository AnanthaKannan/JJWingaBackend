const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const { generateToken } = require("../middleware/auth");
const logger = require("../middleware/logger");
const {
  buildUploadPath,
  getSupabaseClient,
  getSupabaseStorageTarget,
} = require("../utils/supabaseStorage");
const {
  Student,
  HomeWork,
  Admin,
  Question,
  Score,
  Notification,
  FileUpload,
  Message,
  Registration,
  Organization,
} = require("../models");
const { buildAssignmentNotificationText } = require("../config/notifications");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const login = async (username, password, deviceId, validatePassword = true) => {
  let user = null;
  let role = null;

  // Step 1: Try Student login
  user = await Student.findOne({
    studentId: username,
    isDeleted: { $ne: true },
  });
  if (user) {
    role = "student";
  }

  // Step 2: Fallback to Admin login
  if (!user) {
    user = await Admin.findOne({ adminId: username, isDeleted: { $ne: true } });
    if (user) {
      role = "admin";
    }
  }

  // Step 3: No user found
  if (!user) {
    throw new Error("Invalid username or password");
  }

  // Step 4: Validate password
  if (validatePassword) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid username or password");
    }
  }

  if (!user?.deviceIds?.some((id) => id === deviceId) && role === "student") {
    // add the deviceId to the student if it is not exist
    await updateStudent(user._id, { deviceId }, user?.orgId);
  }

  // Step 5: Generate JWT
  let deviceIds = user.deviceIds;
  if (deviceId) {
    if (deviceIds?.length > 0) deviceIds.push(deviceId);
    else deviceIds = [deviceId];
  }
  const payload = {
    id: user._id,
    name: user.name,
    orgId: user.orgId,
    role,
    ...(role === "student"
      ? { studentId: user.studentId, deviceIds, createdBy: user.createdBy }
      : { adminId: user.adminId, roles: user.roles }),
  };

  const token = generateToken(payload);
  console.log("generate token--------------", token);
  return {
    token,
    role,
    orgId: user.orgId,
    user: {
      id: user._id,
      name: user.name,
      profilePicPath: user.profilePicPath,
      ...(role === "student"
        ? {
            studentId: user.studentId,
            level: user.level,
            vertical: user.vertical,
          }
        : { adminId: user.adminId, roles: user.roles }),
    },
  };
};

const buildQuestionTypeFilter = (type) => {
  if (type === "homework") {
    return { $or: [{ type: "homework" }, { type: { $exists: false } }] };
  }

  return { type };
};

const changePassword = async (
  orgId,
  userId,
  role,
  oldPassword,
  newPassword,
) => {
  if (!oldPassword || !newPassword) {
    throw new Error("Old password and new password are required");
  }

  if (role !== "student" && role !== "admin") {
    throw new Error("Invalid user role");
  }

  const Model = role === "student" ? Student : Admin;
  const user = await Model.findOne({
    _id: userId,
    orgId,
  });
  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new Error("Old password is incorrect");
  }

  if (oldPassword === newPassword) {
    throw new Error("New password must be different from the current password");
  }

  user.password = newPassword;
  await user.save();
};

const loginUsingDeviceId = async (studentId, deviceIds) => {
  if (deviceIds.length === 0) {
    throw new Error("Device ID not found in token");
  }

  const student = await Student.findOne({
    _id: studentId,
    deviceIds: { $in: deviceIds },
  }).select("studentId");

  if (!student) {
    throw new Error("Student not found for this device");
  }

  return login(student.studentId, null, null, false);
};

const getStudentList = async (
  orgId,
  adminId,
  page = 1,
  limit = 15,
  search = "",
  level = null,
) => {
  const skip = (page - 1) * limit;
  const adminObjectId = new mongoose.Types.ObjectId(adminId);
  const orgObjectId = new mongoose.Types.ObjectId(orgId);

  const matchStage = {
    orgId: orgObjectId,
    createdBy: adminObjectId,
    ...(search && {
      name: { $regex: search, $options: "i" },
    }),
    ...(level !== null && { level }),
  };

  const pipeline = [
    {
      $match: matchStage,
    },

    // Sort before pagination
    {
      $sort: {
        studentId: -1,
      },
    },

    {
      $lookup: {
        from: "scores",
        localField: "_id",
        foreignField: "studentId",
        as: "score",
      },
    },

    {
      $addFields: {
        score: {
          $arrayElemAt: ["$score", 0],
        },
      },
    },

    {
      $project: {
        password: 0,
        createdAt: 0,
        updatedAt: 0,
        createdBy: 0,
        __v: 0,

        "score.studentId": 0,
        "score.createdAt": 0,
        "score.updatedAt": 0,
        "score._id": 0,
        "score.__v": 0,
      },
    },

    {
      $skip: skip,
    },

    {
      $limit: limit,
    },
  ];

  const [students, countResult] = await Promise.all([
    Student.aggregate(pipeline),
    Student.aggregate([
      {
        $match: matchStage,
      },
      {
        $count: "total",
      },
    ]),
  ]);

  const total = countResult[0]?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    students,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const getMessageStudentList = async (
  orgId,
  adminId,
  page = 1,
  limit = 15,
  search = "",
  level = null,
) => {
  const skip = (page - 1) * limit;
  const adminObjectId = new mongoose.Types.ObjectId(adminId);
  const orgObjectId = new mongoose.Types.ObjectId(orgId);

  const matchStage = [
    { $match: { createdBy: adminObjectId, orgId: orgObjectId } },
    ...(search
      ? [{ $match: { name: { $regex: search, $options: "i" } } }]
      : []),
    ...(level === null ? [] : [{ $match: { level } }]),
  ];

  const pipeline = [
    ...matchStage,
    {
      $lookup: {
        from: "messages",
        let: { studentId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$sendBy", "$$studentId"] },
                  { $eq: ["$sendByModel", "Student"] },
                  { $eq: ["$receivedTo", adminObjectId] },
                  { $eq: ["$receivedToModel", "Admin"] },
                  { $ne: ["$hasRead", true] },
                ],
              },
            },
          },
          { $count: "count" },
        ],
        as: "unreadMessages",
      },
    },
    {
      $addFields: {
        unreadMessageCount: {
          $ifNull: [{ $arrayElemAt: ["$unreadMessages.count", 0] }, 0],
        },
      },
    },
    {
      $project: {
        password: 0,
        deviceIds: 0,
        fcmTokens: 0,
        createdBy: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
        unreadMessages: 0,
      },
    },
    { $sort: { unreadMessageCount: 1, name: 1 } },
  ];

  const [students, countResult] = await Promise.all([
    Student.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
    Student.aggregate([...matchStage, { $count: "total" }]),
  ]);

  const total = countResult[0]?.total || 0;

  return {
    students,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

const getStudentsBySameDeviceId = async (orgId, deviceIds, id) => {
  if (!deviceIds || deviceIds.length === 0) {
    throw new Error("Device ID is not assigned for this student");
  }
  console.log(deviceIds, id);
  const students = await Student.find({
    _id: { $ne: id },
    orgId,
    deviceIds: { $in: deviceIds },
  })
    .select("_id studentId name deviceIds profilePicPath")
    .sort({ name: 1 })
    .lean();

  return {
    students,
    count: students.length,
  };
};

const getQuestionList = async (
  orgId,
  page = 1,
  limit = 15,
  search = "",
  level = null,
  type = null,
) => {
  const skip = (page - 1) * limit;

  const query = {
    orgId,
    isDeleted: { $ne: true },
    ...(search ? { questionId: { $regex: search, $options: "i" } } : {}),
    ...(level === null ? {} : { level }),
    ...(type === null ? {} : buildQuestionTypeFilter(type)),
  };

  const [questions, total] = await Promise.all([
    Question.find(query)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Question.countDocuments(query),
  ]);

  return {
    questions,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

const getPracticeQuestionList = async (
  orgId,
  page = 1,
  limit = 15,
  search = "",
  level = null,
  studentId = null,
) => {
  if (studentId) {
    return getAvailableQuestionsForStudent(
      orgId,
      studentId,
      page,
      limit,
      search,
      level,
      "practice",
    );
  }

  return getQuestionList(page, limit, search, level, "practice");
};

const getHomeworkList = async (
  studentId,
  state = null,
  page = 1,
  limit = 15,
  sortBy = "createdAt",
  sortOrder = "desc",
  type = null,
) => {
  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  // Build query
  const query = { studentId };
  if (state) {
    query.state = state.toUpperCase();
  }

  if (type) {
    const questionIds = await Question.find({
      isDeleted: { $ne: true },
      ...buildQuestionTypeFilter(type),
    }).distinct("_id");
    query.questionId = { $in: questionIds };
  }

  const [homeworks, total] = await Promise.all([
    HomeWork.find(query)
      .populate("questionId") // resolve full question data
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit),
    HomeWork.countDocuments(query),
  ]);

  return {
    homeworks,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

const getAvailableQuestionsForStudent = async (
  orgId,
  studentId,
  page = 1,
  limit = 15,
  search = "",
  level = null,
  type = null,
) => {
  const skip = (page - 1) * limit;
  const studentObjectId = new mongoose.Types.ObjectId(studentId);
  const orgObjectId = new mongoose.Types.ObjectId(orgId);

  const pipeline = [
    {
      $match: { orgId: orgObjectId, isDeleted: { $ne: true } },
    },
    ...(level === null ? [] : [{ $match: { level } }]),
    ...(type === null ? [] : [{ $match: buildQuestionTypeFilter(type) }]),
    // Search by questionId if provided
    ...(search
      ? [{ $match: { questionId: { $regex: search, $options: "i" } } }]
      : []),
    {
      $lookup: {
        from: "homeworks",
        let: { questionId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$questionId", "$$questionId"] },
                  { $eq: ["$studentId", studentObjectId] },
                ],
              },
            },
          },
        ],
        as: "assignedHomework",
      },
    },
    {
      $match: { assignedHomework: { $size: 0 } },
    },
    {
      $project: {
        assignedHomework: 0,
        __v: 0,
      },
    },
    { $sort: { createdAt: -1 } },
  ];

  const [questions, countResult] = await Promise.all([
    Question.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
    Question.aggregate([...pipeline, { $count: "total" }]),
  ]);

  const total = countResult[0]?.total || 0;

  return {
    questions,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

const getScoreByStudentId = async (studentId) => {
  const score = await Score.findOne({ studentId })
    .select(
      "assigned new progress completed correct wrong timeTaken practiceAssigned practiceNew practiceProgress practiceCompleted practiceCorrect practiceWrong practiceTimeTaken",
    )
    .lean();

  if (!score) {
    throw new Error("Score not found for this student");
  }

  return score;
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
};

const getHomeworkById = async (id) => {
  const homework = await HomeWork.findById(id).populate("questionId"); // resolve full question data

  if (!homework) {
    throw new Error("Homework not found");
  }

  return homework;
};

const createRegistration = async (registrationData, createdBy) => {
  const studentName = registrationData?.studentName?.trim();

  if (!studentName) {
    throw new Error("studentName is required");
  }

  const registration = await Registration.create({
    ...registrationData,
    studentName,
    createdBy,
  });

  return { registration };
};

const getRegistrationList = async (
  adminId,
  page = 1,
  limit = 15,
  search = "",
) => {
  const skip = (page - 1) * limit;
  const query = {
    createdBy: adminId,
    ...(search
      ? {
          $or: [
            { studentName: { $regex: search, $options: "i" } },
            { fatherName: { $regex: search, $options: "i" } },
            { motherName: { $regex: search, $options: "i" } },
            { studentCode: { $regex: search, $options: "i" } },
          ],
        }
      : {}),
  };

  const [registrations, total] = await Promise.all([
    Registration.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Registration.countDocuments(query),
  ]);

  return {
    registrations,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

const deleteRegistration = async (registrationId, adminId) => {
  if (!mongoose.Types.ObjectId.isValid(registrationId)) {
    throw new Error("Invalid registrationId");
  }

  const registration = await Registration.findOne({
    _id: registrationId,
    createdBy: adminId,
  });

  if (!registration) {
    throw new Error("Registration not found");
  }

  await registration.deleteOne();

  return { registrationId };
};

const sendAssignmentNotifications = async (
  assignmentsByStudent,
  questionMap,
  sentBy,
) => {
  const studentIds = Object.keys(assignmentsByStudent).filter(
    (studentId) => assignmentsByStudent[studentId].length > 0,
  );

  if (studentIds.length === 0) {
    logger.info("assignment_notifications_skipped_no_students");
    return { sentCount: 0, totalRequested: 0 };
  }

  const studentDocs = await Student.find(
    { _id: { $in: studentIds } },
    { fcmTokens: 1 },
  );
  const tokenMap = studentDocs.reduce((acc, student) => {
    acc[student._id.toString()] = student.fcmTokens?.[0] || null;
    return acc;
  }, {});

  const notifications = studentIds
    .map((studentId) => {
      const assignedQuestions = assignmentsByStudent[studentId]
        .map((questionId) => questionMap.get(questionId.toString()))
        .filter(Boolean);
      const message = buildAssignmentNotificationText(assignedQuestions);

      return message
        ? {
            studentId,
            sentBy,
            sentByModel: "Admin",
            ...message,
          }
        : null;
    })
    .filter(Boolean);

  if (notifications.length === 0) {
    logger.info(
      { totalRequested: studentIds.length },
      "assignment_notifications_skipped_no_notifiable_questions",
    );
    return { sentCount: 0, totalRequested: studentIds.length };
  }

  const result = await Notification.insertMany(notifications, {
    ordered: false,
  });

  await Promise.allSettled(
    notifications.map((notification) =>
      sendPushNotification(
        tokenMap[notification.studentId.toString()],
        notification.messageHeader,
        notification.messageBody,
      ),
    ),
  );

  logger.info(
    {
      sentCount: result.length,
      totalRequested: studentIds.length,
    },
    "assignment_notifications_created",
  );

  return {
    sentCount: result.length,
    totalRequested: studentIds.length,
  };
};

const getAssignedQuestionIdsByStudent = async (studentIds, questionIds) => {
  const homeworks = await HomeWork.find({
    studentId: { $in: studentIds },
    questionId: { $in: questionIds },
  }).select("studentId questionId");

  return homeworks.reduce((acc, homework) => {
    const studentId = homework.studentId.toString();
    const questionId = homework.questionId.toString();

    if (!acc.has(studentId)) {
      acc.set(studentId, new Set());
    }

    acc.get(studentId).add(questionId);
    return acc;
  }, new Map());
};

const getAssignmentScoreIncrement = (questionIds, questionMap) =>
  questionIds.reduce((scoreInc, questionId) => {
    const isPractice =
      questionMap.get(questionId.toString())?.type === "practice";

    addScoreIncrement(scoreInc, "assigned", 1, isPractice);
    addScoreIncrement(scoreInc, "new", 1, isPractice);

    return scoreInc;
  }, {});

const getAssignmentQuestionDetails = (questionIds, questionMap) =>
  questionIds
    .map((questionId) => questionMap.get(questionId.toString()))
    .filter(Boolean)
    .map((question) => ({
      id: question._id,
      questionId: question.questionId,
      type: question.type,
    }));

const assignQuestion = async (orgId, adminId, studentId, questionIds) => {
  const uniqueQuestionIds = [...new Set(toArray(questionIds).map(String))];

  const questions = await Question.find({
    orgId,
    _id: { $in: uniqueQuestionIds },
    isDeleted: { $ne: true },
  });
  if (questions.length !== uniqueQuestionIds.length) {
    throw new Error("One or more questions not found");
  }

  const questionMap = new Map(
    questions.map((question) => [question._id.toString(), question]),
  );
  const assignedByStudent = await getAssignedQuestionIdsByStudent(
    [studentId],
    uniqueQuestionIds,
  );
  const existingQuestionIds = assignedByStudent.get(studentId.toString());
  const questionIdsToAssign = uniqueQuestionIds.filter(
    (questionId) => !existingQuestionIds?.has(questionId),
  );

  if (questionIdsToAssign.length === 0) {
    return {
      assignedCount: 0,
      skippedQuestionIds: uniqueQuestionIds,
      notifications: { sentCount: 0, totalRequested: 0 },
    };
  }

  const homeworkDocs = questionIdsToAssign.map((questionId) => ({
    studentId,
    questionId,
    state: "NEW",
  }));

  const homeworks = await HomeWork.insertMany(homeworkDocs, { ordered: false });

  await Score.findOneAndUpdate(
    { studentId },
    {
      $inc: getAssignmentScoreIncrement(questionIdsToAssign, questionMap),
    },
    { new: true, upsert: true },
  );
  const notifications = await sendAssignmentNotifications(
    { [studentId.toString()]: questionIdsToAssign },
    questionMap,
    adminId,
  );

  return {
    assignedCount: homeworks.length,
    skippedQuestionIds: uniqueQuestionIds.filter((questionId) =>
      existingQuestionIds?.has(questionId),
    ),
    notifications,
  };
};

const assignQuestionsByLevels = async (orgId, adminId, levels, questionIds) => {
  const uniqueLevels = [...new Set(toArray(levels).map(Number))];
  const uniqueQuestionIds = [...new Set(toArray(questionIds).map(String))];

  if (uniqueLevels.length === 0 || uniqueLevels.some(Number.isNaN)) {
    throw new Error("levels must be a non-empty array of numbers");
  }

  const questions = await Question.find({
    _id: { $in: uniqueQuestionIds },
    orgId,
    isDeleted: { $ne: true },
  });

  if (questions.length !== uniqueQuestionIds.length) {
    throw new Error("One or more questions not found");
  }
  const questionMap = new Map(
    questions.map((question) => [question._id.toString(), question]),
  );

  const students = await Student.find({
    createdBy: adminId,
    orgId,
    level: { $in: uniqueLevels },
  }).select("_id studentId name level");

  if (students.length === 0) {
    throw new Error("No students found for levels");
  }

  const studentIds = students.map((student) => student._id.toString());
  const assignedByStudent = await getAssignedQuestionIdsByStudent(
    studentIds,
    uniqueQuestionIds,
  );
  const assignmentsByStudent = {};
  const skippedByStudent = {};
  const getStudentAssignmentResult = (student) => {
    const studentObjectId = student._id.toString();
    const assignedQuestionIds = assignmentsByStudent[studentObjectId] || [];
    const skippedQuestionIds = skippedByStudent[studentObjectId] || [];

    return {
      id: student._id,
      studentId: student.studentId,
      name: student.name,
      level: student.level,
      assignedQuestionIds,
      assignedQuestions: getAssignmentQuestionDetails(
        assignedQuestionIds,
        questionMap,
      ),
      skippedQuestionIds,
      skippedQuestions: getAssignmentQuestionDetails(
        skippedQuestionIds,
        questionMap,
      ),
    };
  };

  const homeworkDocs = students.flatMap((student) =>
    uniqueQuestionIds
      .filter((questionId) => {
        const studentId = student._id.toString();
        const shouldAssign = !assignedByStudent.get(studentId)?.has(questionId);

        if (shouldAssign) {
          assignmentsByStudent[studentId] = [
            ...(assignmentsByStudent[studentId] || []),
            questionId,
          ];
        } else {
          skippedByStudent[studentId] = [
            ...(skippedByStudent[studentId] || []),
            questionId,
          ];
        }

        return shouldAssign;
      })
      .map((questionId) => ({
        studentId: student._id,
        questionId,
        state: "NEW",
      })),
  );

  if (homeworkDocs.length === 0) {
    return {
      assignedCount: 0,
      skippedCount: students.length * uniqueQuestionIds.length,
      students: students.map(getStudentAssignmentResult),
      notifications: { sentCount: 0, totalRequested: 0 },
    };
  }

  const homeworks = await HomeWork.insertMany(homeworkDocs, { ordered: false });

  const scoreUpdates = Object.entries(assignmentsByStudent).map(
    ([studentId, assignedQuestionIds]) => {
      return {
        updateOne: {
          filter: { studentId },
          update: {
            $inc: getAssignmentScoreIncrement(assignedQuestionIds, questionMap),
          },
          upsert: true,
        },
      };
    },
  );

  await Score.bulkWrite(scoreUpdates);
  const notifications = await sendAssignmentNotifications(
    assignmentsByStudent,
    questionMap,
    adminId,
  );

  return {
    assignedCount: homeworks.length,
    skippedCount: students.length * uniqueQuestionIds.length - homeworks.length,
    students: students.map(getStudentAssignmentResult),
    notifications,
  };
};

const getUnassignScoreIncrement = (homeworks) =>
  homeworks.reduce((scoreInc, homework) => {
    const isPractice = homework.questionId?.type === "practice";

    addScoreIncrement(scoreInc, "assigned", -1, isPractice);

    if (homework.state === "NEW") {
      addScoreIncrement(scoreInc, "new", -1, isPractice);
    }

    if (homework.state === "PROGRESS") {
      addScoreIncrement(scoreInc, "progress", -1, isPractice);
    }

    if (homework.state === "COMPLETED") {
      addScoreIncrement(scoreInc, "completed", -1, isPractice);

      const stats = getCompletionStats(homework.results, homework.timer);
      addScoreIncrement(scoreInc, "correct", -stats.correct, isPractice);
      addScoreIncrement(scoreInc, "wrong", -stats.wrong, isPractice);
      addScoreIncrement(scoreInc, "timeTaken", -stats.timeTaken, isPractice);
    }

    return scoreInc;
  }, {});

const unassignQuestion = async (studentId, questionIds) => {
  const uniqueQuestionIds = [...new Set(toArray(questionIds).map(String))];

  if (!studentId) {
    throw new Error("studentId is required");
  }

  if (uniqueQuestionIds.length === 0) {
    throw new Error("questionIds are required");
  }

  if (
    !mongoose.Types.ObjectId.isValid(studentId) ||
    uniqueQuestionIds.some(
      (questionId) => !mongoose.Types.ObjectId.isValid(questionId),
    )
  ) {
    throw new Error("Invalid studentId or questionIds");
  }

  const homeworks = await HomeWork.find({
    studentId,
    questionId: { $in: uniqueQuestionIds },
  }).populate("questionId", "type");

  const assignedQuestionIds = new Set(
    homeworks.map((homework) => homework.questionId?._id?.toString()),
  );
  const unassignedQuestionIds = uniqueQuestionIds.filter(
    (questionId) => !assignedQuestionIds.has(questionId),
  );

  if (unassignedQuestionIds.length > 0) {
    throw new Error("One or more questions are not assigned");
  }

  await HomeWork.deleteMany({
    _id: { $in: homeworks.map((homework) => homework._id) },
  });

  const scoreInc = getUnassignScoreIncrement(homeworks);
  const score = await Score.findOneAndUpdate(
    { studentId },
    { $inc: scoreInc },
    { new: true, upsert: true },
  );

  return {
    unassignedQuestionIds: uniqueQuestionIds,
    deletedCount: homeworks.length,
    score,
  };
};

const assignPracticeQuestionsToSelf = async (studentId, questionIds) => {
  const uniqueQuestionIds = [...new Set(toArray(questionIds).map(String))];

  if (uniqueQuestionIds.length === 0) {
    throw new Error("questionIds are required");
  }

  if (
    uniqueQuestionIds.some(
      (questionId) => !mongoose.Types.ObjectId.isValid(questionId),
    )
  ) {
    throw new Error("Invalid questionIds");
  }

  const questions = await Question.find({
    _id: { $in: uniqueQuestionIds },
    type: "practice",
    isDeleted: { $ne: true },
  }).select("_id");

  if (questions.length !== uniqueQuestionIds.length) {
    throw new Error("One or more practice questions not found");
  }

  const existingQuestionIds = await HomeWork.find({
    studentId,
    questionId: { $in: uniqueQuestionIds },
  }).distinct("questionId");
  const existingSet = new Set(existingQuestionIds.map(String));
  const questionIdsToAssign = uniqueQuestionIds.filter(
    (questionId) => !existingSet.has(questionId),
  );

  if (questionIdsToAssign.length === 0) {
    return {
      homeworks: [],
      skippedQuestionIds: uniqueQuestionIds,
      score: await Score.findOne({ studentId }),
    };
  }

  const homeworkDocs = questionIdsToAssign.map((questionId) => ({
    studentId,
    questionId,
    state: "NEW",
  }));

  const homeworks = await HomeWork.insertMany(homeworkDocs, { ordered: false });

  const score = await Score.findOneAndUpdate(
    { studentId },
    {
      $inc: {
        practiceAssigned: homeworks.length,
        practiceNew: homeworks.length,
      },
    },
    { new: true, upsert: true },
  );

  return {
    homeworks,
    skippedQuestionIds: uniqueQuestionIds.filter((questionId) =>
      existingSet.has(questionId),
    ),
    score,
  };
};

const unassignPracticeQuestionsFromSelf = async (studentId, questionIds) => {
  const uniqueQuestionIds = [...new Set(toArray(questionIds).map(String))];

  if (uniqueQuestionIds.length === 0) {
    throw new Error("questionIds are required");
  }

  if (
    uniqueQuestionIds.some(
      (questionId) => !mongoose.Types.ObjectId.isValid(questionId),
    )
  ) {
    throw new Error("Invalid questionIds");
  }

  const questions = await Question.find({
    _id: { $in: uniqueQuestionIds },
    type: "practice",
    isDeleted: { $ne: true },
  }).select("_id");

  if (questions.length !== uniqueQuestionIds.length) {
    throw new Error("One or more practice questions not found");
  }

  const homeworks = await HomeWork.find({
    studentId,
    questionId: { $in: uniqueQuestionIds },
  }).select("_id questionId state");

  const assignedQuestionIds = new Set(
    homeworks.map((homework) => homework.questionId.toString()),
  );
  const unassignedQuestionIds = uniqueQuestionIds.filter(
    (questionId) => !assignedQuestionIds.has(questionId),
  );

  if (unassignedQuestionIds.length > 0) {
    throw new Error("One or more practice questions are not assigned");
  }

  const nonNewHomeworks = homeworks.filter(
    (homework) => homework.state !== "NEW",
  );

  if (nonNewHomeworks.length > 0) {
    throw new Error("Practice questions can only be unassigned while assigned");
  }

  await HomeWork.deleteMany({
    _id: { $in: homeworks.map((homework) => homework._id) },
  });

  const score = await Score.findOneAndUpdate(
    { studentId },
    {
      $inc: {
        practiceAssigned: -homeworks.length,
        practiceNew: -homeworks.length,
      },
    },
    { new: true },
  );

  return {
    unassignedQuestionIds: uniqueQuestionIds,
    deletedCount: homeworks.length,
    score,
  };
};

const addStudent = async (studentData) => {
  const { orgId, name, level, createdBy } = studentData;

  // 2. Increment idGen and get new studentLastId

  const org = await Organization.findByIdAndUpdate(
    orgId,
    { $inc: { studentIdGen: 1 } },
    { new: false }, // get the value BEFORE increment
  );

  // 3. Generate studentId e.g. "JJ101"
  const studentId = `${org.studentPrefix}${org.studentIdGen}`;
  const password = `Welcome${org.studentIdGen}`;

  // 4. Create student
  const student = await Student.create({
    studentId,
    orgId,
    name,
    level,
    password,
    createdBy,
  });

  // 5. Create an empty score record for the student
  await Score.create({ studentId: student._id });

  return { student };
};

const resetStudentPassword = async (studentObjectId, orgId) => {
  const student = await Student.findOne({
    _id: studentObjectId,
    orgId,
  });

  if (!student) {
    throw new Error("Student not found");
  }

  const newPassword = `Welcome${student.studentId.replace(/\D/g, "")}`;
  student.password = newPassword;
  await student.save();

  return {
    studentId: student.studentId,
    name: student.name,
    password: newPassword,
  };
};

const updateStudent = async (studentObjectId, updateData, orgId) => {
  // 1. Validate student exists
  const student = await Student.findOne({
    _id: studentObjectId,
    orgId,
  });
  if (!student) throw new Error("Student not found");

  // 2. Whitelist allowed fields
  const allowedFields = [
    "name",
    "password",
    "vertical",
    "deviceId",
    "level",
    "isDeleted",
  ];
  const filteredData = Object.keys(updateData)
    .filter((key) => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updateData[key];
      return obj;
    }, {});

  if (Object.keys(filteredData).length === 0) {
    throw new Error("No valid fields provided to update");
  }

  if (filteredData?.isDeleted === true) {
    filteredData.deletedDate = new Date();
  } else if (filteredData?.isDeleted === false) {
    filteredData.deletedDate = null;
  }

  if (Object.prototype.hasOwnProperty.call(filteredData, "deviceId")) {
    const currentDeviceIds = student.deviceIds;
    const incomingDeviceIds = [filteredData.deviceId];
    const mergedDeviceIds = [...currentDeviceIds, ...incomingDeviceIds];

    filteredData.deviceIds = [...new Set(mergedDeviceIds)];
  }

  if (Object.keys(filteredData).length === 0) {
    return;
  }

  // 3. Apply updates to the document and save
  //    (so pre('save') password hash hook triggers if password is changed)
  Object.assign(student, filteredData);
  await student.save({ validateModifiedOnly: true });
};

const removeStudentDeviceId = async (orgId, studentObjectId, deviceId) => {
  const deviceIdsToRemove = [deviceId];

  if (deviceIdsToRemove.length === 0) {
    throw new Error("deviceId is required");
  }

  const student = await Student.findOne({
    _id: studentObjectId,
    orgId,
  });
  if (!student) throw new Error("Student not found");

  const removeSet = new Set(deviceIdsToRemove);
  student.deviceIds = student.deviceIds.filter(
    (value) => !removeSet.has(value),
  );

  await student.save({ validateModifiedOnly: true });
};

const updateFcmToken = async (orgId, userId, fcmToken, isStudent) => {
  if (isStudent) {
    const studentId = userId;
    await Student.findOneAndUpdate(
      { _id: studentId, orgId },
      { fcmTokens: [fcmToken] }, // replace entire array with the new single token
    );
  } else {
    const adminId = userId;
    await Admin.findOneAndUpdate(
      { _id: adminId, orgId },
      { fcmTokens: [fcmToken] }, // replace entire array with the new single token
    );
  }
};

const updateProfilePicPath = async (user, profilePicPath) => {
  if (user?.role === "student") {
    await Student.findOneAndUpdate(user.id, { profilePicPath });
    return;
  }

  if (user?.role === "admin") {
    await Admin.findByIdAndUpdate(user.id, { profilePicPath });
  }
};

const deleteSupabaseFile = async (filePath) => {
  if (!filePath) {
    return;
  }

  const { bucket } = getSupabaseStorageTarget();
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.from(bucket).remove([filePath]);

  if (error) {
    throw new Error(error.message || "Failed to delete file");
  }
};

const downloadSupabaseFile = async (filePath) => {
  if (!filePath) {
    throw new Error("filePath is required");
  }

  const { bucket } = getSupabaseStorageTarget();
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(filePath);

  if (error) {
    throw new Error(error.message || "Failed to download file");
  }

  const arrayBuffer = await data.arrayBuffer();
  const fileName = filePath.split("/").filter(Boolean).pop() || "download";

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: data.type || "application/octet-stream",
    fileName,
  };
};

const isFileUploadType = (type) => ["practice", "celebration"].includes(type);
const validateFileUploadRecord = (user, name, type) => {
  if (!isFileUploadType(type)) {
    return;
  }

  if (user?.role !== "admin") {
    throw new Error("Only admin can upload practice or celebration files");
  }

  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("name is required");
  }
};

const createFileUploadRecord = async (orgId, name, filePath, type, file) => {
  if (!["practice", "celebration"].includes(type)) {
    return null;
  }

  return FileUpload.create({
    name: name.trim(),
    orgId,
    filePath,
    fileSize: file.size,
    fileFormat: file.mimetype,
    type,
  });
};

const isProfileUpload = (formPath) => formPath.trim() === "profile";

const isImageUpload = (file) => file?.mimetype?.startsWith("image/");

const prepareProfilePic = (file, formPath) => {
  if (!isProfileUpload(formPath)) {
    return file;
  }

  if (!isImageUpload(file)) {
    throw new Error("profile picture must be an image");
  }

  return file;
};

const getFileUploadList = async (orgId, type, page = 1, limit = 15) => {
  if (!isFileUploadType(type)) {
    throw new Error("type must be one of: practice, celebration");
  }

  const skip = (page - 1) * limit;
  const query = { type, orgId };

  const [fileUploads, total] = await Promise.all([
    FileUpload.find(query)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    FileUpload.countDocuments(query),
  ]);

  return {
    fileUploads,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

const uploadFile = async (orgId, file, user, formPath = "", name = "") => {
  if (!file) {
    throw new Error("file is required");
  }

  if (typeof formPath !== "string" || formPath.trim() === "") {
    throw new Error("path is required");
  }

  const uploadType = formPath.trim();
  validateFileUploadRecord(user, name, uploadType);

  const preparedFile = prepareProfilePic(file, uploadType);
  const { bucket, prefix } = getSupabaseStorageTarget();

  const supabase = getSupabaseClient();
  const path = buildUploadPath(preparedFile, user, prefix, formPath);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, preparedFile.buffer, {
      contentType: preparedFile.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || "Failed to upload file");
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  if (formPath.trim() === "profile") {
    await updateProfilePicPath(user, data.path);
  }

  const fileUpload = await createFileUploadRecord(
    orgId,
    name,
    data.path,
    uploadType,
    preparedFile,
  );

  return {
    bucket,
    path: data.path,
    url: publicUrlData.publicUrl,
    originalName: preparedFile.originalname,
    mimeType: preparedFile.mimetype,
    size: preparedFile.size,
    ...(fileUpload ? { fileUpload } : {}),
  };
};

const updateFileUploadName = async (orgId, fileUploadId, name) => {
  if (!fileUploadId) {
    throw new Error("fileUploadId is required");
  }

  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("name is required");
  }

  const fileUpload = await FileUpload.findOneAndUpdate(
    {
      orgId: new mongoose.Types.ObjectId(orgId),
      _id: new mongoose.Types.ObjectId(fileUploadId),
    },
    { name: name.trim() },
    { new: true, runValidators: true },
  );

  if (!fileUpload) {
    throw new Error("File upload not found");
  }

  return { fileUpload };
};

const deleteFileUpload = async (orgId, fileUploadId) => {
  if (!fileUploadId) {
    throw new Error("fileUploadId is required");
  }

  const fileUpload = await FileUpload.findOne({ _id: fileUploadId, orgId });
  if (!fileUpload) {
    throw new Error("File upload not found");
  }

  await deleteSupabaseFile(fileUpload.filePath);
  await fileUpload.deleteOne();

  return { fileUploadId };
};

const downloadFileUpload = async (fileUploadId) => {
  if (!fileUploadId) {
    throw new Error("fileUploadId is required");
  }

  const fileUpload = await FileUpload.findById(fileUploadId);
  if (!fileUpload) {
    throw new Error("File upload not found");
  }

  const file = await downloadSupabaseFile(fileUpload.filePath);

  return {
    ...file,
    downloadName: `${fileUpload.name}-${file.fileName}`,
  };
};

const deleteProfilePic = async (orgId, user) => {
  const Model = user?.role === "student" ? Student : Admin;
  const account = await Model.findOne({
    _id: user?.id,
    orgId,
  }).select("profilePicPath");

  if (!account) {
    throw new Error("User not found");
  }

  if (!account.profilePicPath) {
    throw new Error("Profile picture not found");
  }

  await deleteSupabaseFile(account.profilePicPath);
  account.profilePicPath = "";
  await account.save({ validateModifiedOnly: true });
};

const getMessageUserModel = (role) => {
  if (role === "admin") return "Admin";
  if (role === "student") return "Student";
  return null;
};

const addMessage = async (user, message, receivedTo) => {
  if (typeof message !== "string" || message.trim() === "") {
    throw new Error("message is required");
  }

  if (!receivedTo) {
    throw new Error("receivedTo is required");
  }

  if (!mongoose.Types.ObjectId.isValid(receivedTo)) {
    throw new Error("Invalid receivedTo");
  }

  const sendByModel = getMessageUserModel(user?.role);
  if (!sendByModel) {
    throw new Error("Invalid sender");
  }

  const receivedToModel = user.role === "admin" ? "Student" : "Admin";

  if (user.role === "admin") {
    const student = await Student.findOne({
      _id: receivedTo,
      createdBy: user.id,
    }).select("_id");

    if (!student) {
      throw new Error("Student not found");
    }
  }

  if (user.role === "student") {
    const student = await Student.findById(user.id).select("createdBy");

    if (!student) {
      throw new Error("Student not found");
    }

    if (student.createdBy.toString() !== receivedTo.toString()) {
      throw new Error("Admin not found");
    }
  }

  const createdMessage = await Message.create({
    message: message.trim(),
    sendBy: user.id,
    sendByModel,
    receivedTo,
    receivedToModel,
  });

  await sendMessageNotification(createdMessage);

  return { message: createdMessage };
};

const getMessageReceiver = async (createdMessage) => {
  const model = createdMessage.receivedToModel === "Admin" ? Admin : Student;

  return model.findById(createdMessage.receivedTo).select("fcmTokens").lean();
};

const sendMessageNotification = async (createdMessage) => {
  const receiver = await getMessageReceiver(createdMessage);

  await sendPushNotification(
    receiver?.fcmTokens?.[0],
    "New message",
    createdMessage.message,
  );
};

const markMessagesAsRead = async (
  user,
  conversationUserId = null,
  messageIds = [],
) => {
  const userModel = getMessageUserModel(user?.role);
  if (!userModel) {
    throw new Error("Invalid user");
  }

  if (
    conversationUserId &&
    !mongoose.Types.ObjectId.isValid(conversationUserId)
  ) {
    throw new Error("Invalid userId");
  }

  if (!Array.isArray(messageIds)) {
    throw new Error("messageIds must be an array");
  }

  if (
    messageIds.length > 0 &&
    messageIds.some((id) => !mongoose.Types.ObjectId.isValid(id))
  ) {
    throw new Error("Invalid messageIds");
  }

  const filter = {
    receivedTo: user.id,
    receivedToModel: userModel,
    hasRead: { $ne: true },
    ...(conversationUserId
      ? {
          sendBy: conversationUserId,
        }
      : {}),
    ...(messageIds.length > 0
      ? {
          _id: { $in: messageIds },
        }
      : {}),
  };

  const result = await Message.updateMany(filter, { $set: { hasRead: true } });

  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};

const getUnreadMessageCount = async (user) => {
  const userModel = getMessageUserModel(user?.role);
  if (!userModel) {
    throw new Error("Invalid user");
  }

  const unreadCount = await Message.countDocuments({
    receivedTo: user.id,
    receivedToModel: userModel,
    hasRead: { $ne: true },
  });

  return { unreadCount };
};

const getMessageList = async (user, page = 1, limit = 15, userId = null) => {
  const userModel = getMessageUserModel(user?.role);
  if (!userModel) {
    throw new Error("Invalid user");
  }

  const skip = (page - 1) * limit;
  let conversationUserId = userId;

  if (
    conversationUserId &&
    !mongoose.Types.ObjectId.isValid(conversationUserId)
  ) {
    throw new Error("Invalid userId");
  }

  const currentUserFilter = {
    $or: [
      { sendBy: user.id, sendByModel: userModel },
      { receivedTo: user.id, receivedToModel: userModel },
    ],
  };

  const conversationFilter = conversationUserId
    ? {
        $or: [
          { sendBy: conversationUserId },
          { receivedTo: conversationUserId },
        ],
      }
    : {};

  const query = { $and: [currentUserFilter, conversationFilter] };

  const [messages, total] = await Promise.all([
    Message.find(query)
      .populate("sendBy", "name studentId adminId profilePicPath")
      .populate("receivedTo", "name studentId adminId profilePicPath")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Message.countDocuments(query),
  ]);

  return {
    messages,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

const addQuestion = async (questionData) => {
  const { orgId, questionId, level, type, questions, marks, oral, createdBy } =
    questionData;

  // 1. Check if questionId already exists
  const existing = await Question.findOne({
    questionId,
    createdBy,
    type,
    orgId,
    isDeleted: { $ne: true },
  });
  if (existing) throw new Error("Question ID already exists");

  // 2. Create question
  await Question.create({
    questionId,
    createdBy,
    level,
    type,
    orgId,
    questions: questions ?? [],
    ...(marks === undefined ? {} : { marks }),
    ...(oral === undefined ? {} : { oral }),
  });
};

const updateQuestion = async (orgId, questionObjectId, updateData) => {
  const question = await Question.findOne({
    _id: questionObjectId,
    orgId,
  });
  if (!question) throw new Error("Question not found");

  const allowedFields = [
    "questionId",
    "level",
    "type",
    "questions",
    "marks",
    "oral",
  ];
  const filteredData = Object.keys(updateData)
    .filter((key) => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updateData[key];
      return obj;
    }, {});

  if (Object.keys(filteredData).length === 0) {
    throw new Error("No valid fields provided to update");
  }

  Object.assign(question, filteredData);
  await question.save();

  return { question };
};

const deleteQuestion = async (orgId, questionObjectId) => {
  const question = await Question.findOne({
    _id: questionObjectId,
    orgId,
  });
  if (!question) throw new Error("Question not found");

  const isAssigned = await HomeWork.exists({ questionId: questionObjectId });

  if (isAssigned) {
    question.isDeleted = true;
    await question.save();

    return { deleteType: "soft" };
  }

  await question.deleteOne();

  return { deleteType: "hard" };
};

const COMPLETION_NOTIFICATION_TEXT = {
  homework: {
    label: "homework",
    messageHeader: "Homework completed",
  },
  exam: {
    label: "exam",
    messageHeader: "Exam completed",
  },
  practice: {
    label: "practice",
    messageHeader: "Practice completed",
  },
};

const buildCompletionNotificationText = (studentName, question) => {
  const typeText =
    COMPLETION_NOTIFICATION_TEXT[question?.type] ||
    COMPLETION_NOTIFICATION_TEXT.homework;
  const questionText = question?.questionId ? ` - ${question.questionId}` : "";

  return {
    messageHeader: typeText.messageHeader,
    messageBody: `${studentName} has completed ${typeText.label}${questionText}.`,
  };
};

const createHomeworkCompletedNotification = async (homework) => {
  const student = await Student.findById(homework.studentId).select(
    "studentId name createdBy",
  );

  if (!student?.createdBy) {
    logger.warn(
      { homeworkId: homework._id, studentId: homework.studentId },
      "homework_completion_notification_skipped_missing_admin",
    );
    return null;
  }

  const adminDetail = await Admin.findById(student.createdBy).select(
    "fcmTokens",
  );
  const question = await Question.findById(homework.questionId)
    .select("questionId type")
    .lean();
  const completionMessage = buildCompletionNotificationText(
    student.name,
    question,
  );

  const notification = await Notification.create({
    adminId: student.createdBy,
    sentBy: student._id,
    sentByModel: "Student",
    ...completionMessage,
  });

  await sendPushNotification(
    adminDetail?.fcmTokens?.[0],
    notification.messageHeader,
    notification.messageBody,
  );

  logger.info(
    {
      notificationId: notification._id,
      homeworkId: homework._id,
      studentId: student._id,
      adminId: student.createdBy,
    },
    "homework_completion_notification_created",
  );

  return notification;
};

const addScoreIncrement = (scoreInc, field, value, isPractice) => {
  if (!value) {
    return;
  }

  const scoreField = isPractice
    ? `practice${field[0].toUpperCase()}${field.slice(1)}`
    : field;

  scoreInc[scoreField] = (scoreInc[scoreField] ?? 0) + value;
};

const getCompletionStats = (results = [], timer = 0) => ({
  correct: results.filter(Boolean).length,
  wrong: results.filter((result) => !result).length,
  timeTaken: timer ?? 0,
});

const updateHomework = async (homeworkId, updateData) => {
  const { state, answers, results, timer } = updateData;

  // 1. Validate homework exists
  const homework = await HomeWork.findById(homeworkId);
  if (!homework) throw new Error("Homework not found");

  const question = await Question.findById(homework.questionId)
    .select("type")
    .lean();
  const isPractice = question?.type === "practice";
  const prevState = homework.state;
  const newState = state ?? prevState;
  const nextResults = results ?? homework.results;
  const nextTimer = timer ?? homework.timer;

  // 2. Build score increment object based on state transition
  const scoreInc = {};

  if (prevState !== newState) {
    // Decrement previous state
    if (prevState === "NEW") addScoreIncrement(scoreInc, "new", -1, isPractice);
    if (prevState === "PROGRESS")
      addScoreIncrement(scoreInc, "progress", -1, isPractice);
    if (prevState === "COMPLETED")
      addScoreIncrement(scoreInc, "completed", -1, isPractice);

    // Increment new state
    if (newState === "PROGRESS")
      addScoreIncrement(scoreInc, "progress", 1, isPractice);
    if (newState === "COMPLETED")
      addScoreIncrement(scoreInc, "completed", 1, isPractice);
  }

  // 3. Keep completion details in sync when entering, leaving, or editing completed homework.
  if (prevState === "COMPLETED") {
    const previousStats = getCompletionStats(homework.results, homework.timer);

    addScoreIncrement(scoreInc, "correct", -previousStats.correct, isPractice);
    addScoreIncrement(scoreInc, "wrong", -previousStats.wrong, isPractice);
    addScoreIncrement(
      scoreInc,
      "timeTaken",
      -previousStats.timeTaken,
      isPractice,
    );
  }

  if (newState === "COMPLETED") {
    const nextStats = getCompletionStats(nextResults, nextTimer);

    addScoreIncrement(scoreInc, "correct", nextStats.correct, isPractice);
    addScoreIncrement(scoreInc, "wrong", nextStats.wrong, isPractice);
    addScoreIncrement(scoreInc, "timeTaken", nextStats.timeTaken, isPractice);
  }

  if (prevState !== "COMPLETED" && newState === "COMPLETED") {
    await createHomeworkCompletedNotification(homework);
  }

  // 4. Update homework fields
  if (state) homework.state = state;
  if (Object.prototype.hasOwnProperty.call(updateData, "answers"))
    homework.answers = answers;
  if (Object.prototype.hasOwnProperty.call(updateData, "results"))
    homework.results = results;
  if (timer !== undefined) homework.timer = timer;

  await homework.save();

  // 5. Update score atomically
  if (Object.keys(scoreInc).length > 0) {
    await Score.findOneAndUpdate(
      { studentId: homework.studentId },
      { $inc: scoreInc },
      { new: true, upsert: true },
    );
  }

  return {};
};

const getNotificationList = async (
  recipientId,
  page = 1,
  limit = 15,
  recipientType,
) => {
  const skip = (page - 1) * limit;
  const recipientFilter =
    recipientType === "admin"
      ? { adminId: recipientId }
      : { studentId: recipientId };

  const [notifications, total] = await Promise.all([
    Notification.find(recipientFilter)
      .select("-studentId -adminId") // exclude recipient id (already known)
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(recipientFilter),
  ]);

  return {
    notifications,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

const getTokenSuffix = (token) =>
  typeof token === "string" && token.length > 6 ? token.slice(-6) : null;

const sendPushNotification = async (token, title, body) => {
  try {
    if (!token) {
      logger.warn({ title }, "push_notification_skipped_missing_token");
      return;
    }

    await admin.messaging().send({
      token,
      notification: { title, body },
    });
  } catch (error) {
    // Log but don't throw — DB entry already saved, push failure is non-critical
    logger.error(
      {
        err: error,
        title,
        tokenSuffix: getTokenSuffix(token),
      },
      "push_notification_failed",
    );
  }
};

const sendBulkNotification = async (
  students,
  messageHeader,
  messageBody,
  sentBy,
) => {
  const studentIds = students.map(({ id }) => id);

  // Step 1: Fetch FCM tokens from DB for all students in one query
  const studentDocs = await Student.find(
    { _id: { $in: studentIds } },
    { fcmTokens: 1 }, // only fetch fcmTokens field
  );

  // Step 2: Build a map of studentId -> fcmToken for quick lookup
  const tokenMap = studentDocs.reduce((acc, student) => {
    acc[student._id.toString()] = student.fcmTokens?.[0] || null;
    return acc;
  }, {});

  // Step 3: Build notification documents for DB
  const notifications = studentIds.map((studentId) => ({
    studentId,
    messageHeader,
    messageBody,
    sentBy,
  }));

  // Step 4: Bulk insert — single DB round trip
  const result = await Notification.insertMany(notifications, {
    ordered: false,
  });

  // Step 5: Send FCM push notifications to all students in parallel
  await Promise.allSettled(
    studentIds.map((id) =>
      sendPushNotification(tokenMap[id], messageHeader, messageBody),
    ),
  );
  // Promise.allSettled — ensures all push attempts run even if some fail

  logger.info(
    {
      sentCount: result.length,
      totalRequested: students.length,
    },
    "bulk_notifications_created",
  );

  return {
    sentCount: result.length,
    totalRequested: students.length,
  };
};

const resolveStudentRankingLevel = (student) => {
  if (
    Object.prototype.hasOwnProperty.call(student || {}, "level") &&
    student.level !== undefined &&
    student.level !== null &&
    String(student.level).trim() !== ""
  ) {
    return Number(student.level);
  }

  return null;
};

const resolveMonthlyRankingScope = async (level, user) => {
  const scope = {
    level,
    adminId: null,
  };

  if (user?.role === "admin") {
    scope.adminId = user.id;
    return scope;
  }

  if (user?.role === "student") {
    const needsLevel = level === null;
    let student = null;

    if (needsLevel) {
      student = await Student.findById(user.id).select("level").lean();
    }

    scope.level = needsLevel ? resolveStudentRankingLevel(student) : level;
    scope.adminId = user.createdBy;
  }

  return scope;
};

const getWeeklyRankings = async (orgId, level = null, user = null) => {
  const { level: rankingLevel, adminId: rankingAdminId } =
    await resolveMonthlyRankingScope(level, user);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const studentAdminFilter = [
    {
      $match: {
        "student.createdBy": new mongoose.Types.ObjectId(rankingAdminId),
        "student.orgId": new mongoose.Types.ObjectId(orgId),
      },
    },
  ];
  const studentLevelFilter =
    rankingLevel === null
      ? []
      : [
          {
            $match: {
              "student.level": rankingLevel,
            },
          },
        ];

  const rankings = await HomeWork.aggregate([
    // Step 1: Filter only COMPLETED homework from the current month
    {
      $match: {
        state: "COMPLETED",
        updatedAt: { $gte: monthStart },
      },
    },

    // Step 2: Calculate correct count and total questions per homework
    {
      $addFields: {
        correctCount: {
          $size: {
            $filter: {
              input: "$results",
              as: "result",
              cond: { $eq: ["$$result", true] },
            },
          },
        },
        totalQuestions: { $size: "$results" },
      },
    },

    // Step 3: Group by student — sum correctCount, totalQuestions, timer
    {
      $group: {
        _id: "$studentId",
        totalCorrect: { $sum: "$correctCount" },
        totalQuestions: { $sum: "$totalQuestions" },
        totalTimer: { $sum: "$timer" },
        completedCount: { $sum: 1 },
      },
    },

    // Step 4: Join with students collection to get student details
    {
      $lookup: {
        from: "students",
        localField: "_id",
        foreignField: "_id",
        as: "student",
      },
    },
    {
      $addFields: {
        student: { $arrayElemAt: ["$student", 0] },
      },
    },
    ...studentAdminFilter,
    ...studentLevelFilter,

    // Step 5: Calculate accuracy and a composite score for ranking
    {
      $addFields: {
        accuracy: {
          $cond: [
            { $eq: ["$totalQuestions", 0] },
            0,
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$totalCorrect", "$totalQuestions"] },
                    100,
                  ],
                },
                2,
              ],
            },
          ],
        },
        // composite score: accuracy weighted more, timer penalises (lower is better)
        // multiply timer by small factor so it doesn't overpower accuracy
        compositeScore: {
          $subtract: [
            {
              $add: [
                "$totalCorrect",
                {
                  $cond: [
                    { $eq: ["$totalQuestions", 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ["$totalCorrect", "$totalQuestions"] },
                        100,
                      ],
                    },
                  ],
                },
              ],
            },
            { $multiply: ["$totalTimer", 0.001] }, // small timer penalty
          ],
        },
      },
    },

    // Step 6: Add rank using $setWindowFields with single sortBy field
    {
      $setWindowFields: {
        sortBy: { compositeScore: -1 },
        output: {
          rank: { $rank: {} },
        },
      },
    },

    // Step 7: Sort and limit to top 10
    { $sort: { rank: 1 } },
    { $limit: 10 },

    // Step 8: Shape the final output
    {
      $project: {
        _id: 0,
        rank: 1,
        studentId: "$_id",
        name: "$student.name",
        studentCode: "$student.studentId",
        level: "$student.level",
        profilePicPath: "$student.profilePicPath",
        totalCorrect: 1,
        totalQuestions: 1,
        accuracy: 1,
        totalTimer: 1,
        completedCount: 1,
      },
    },
  ]);

  return rankings;
};

const addOrganization = async ({
  name,
  studentPrefix,
  teacherPrefix,
  profilePicPath,
}) => {
  if (!name) throw new Error("name not found");
  if (!studentPrefix) throw new Error("studentPrefix not found");
  if (!teacherPrefix) throw new Error("teacherPrefix not found");

  const org = new Organization({
    name,
    studentPrefix,
    teacherPrefix,
    ...(profilePicPath && { profilePicPath }),
  });

  return await org.save();
};

const getAdminList = async (id, orgId, page = 1, limit = 15) => {
  const skip = (page - 1) * limit;

  const query = { orgId, _id: { $ne: id } };

  const [admins, total] = await Promise.all([
    Admin.find(query)
      .select("-password -fcmTokens -orgId -roles -updatedAt") // exclude recipient id (already known)
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit),
    Admin.countDocuments(query),
  ]);

  return {
    admins,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

const updateAdmin = async (adminId, orgId, updates) => {
  const allowed = ["name", "profilePicPath", "password", "isDeleted"];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowed.includes(key)),
  );

  if (!Object.keys(filtered).length)
    throw new Error("No valid fields to update");

  const admin = await Admin.findOne({ _id: adminId, orgId });
  if (!admin) throw new Error("Admin not found");

  if (filtered?.isDeleted === true) {
    filtered.deletedDate = new Date();
  } else if (filtered?.isDeleted === false) {
    filtered.deletedDate = null;
  }

  Object.assign(admin, filtered);
  await admin.save(); // triggers bcrypt pre-save hook if password changed
  return {};
};

const addAdmin = async ({ name, orgId, roles, profilePicPath }) => {
  if (!orgId) throw new Error("Organization not found");
  if (!name) throw new Error("Name not found");

  const org = await Organization.findByIdAndUpdate(
    orgId,
    { $inc: { teacherIdGen: 1 } },
    { new: false }, // get the value BEFORE increment
  );

  const adminId = `${org.teacherPrefix}${org.teacherIdGen}`; // e.g. TE100
  const password = `Teacher${org.teacherIdGen}`;

  const admin = new Admin({
    adminId,
    name,
    orgId,
    password,
    ...(profilePicPath && { profilePicPath }),
    ...(roles && { roles }),
  });

  await admin.save();
  return { password, adminId };
};

const getOrgDetail = async (orgId) => {
  const orgDetail = await Organization.findOne({ _id: orgId });
  return {
    orgDetail,
  };
};

module.exports = {
  login,
  addAdmin,
  updateAdmin,
  loginUsingDeviceId,
  getAdminList,
  changePassword,
  getOrgDetail,
  getStudentList,
  getMessageStudentList,
  getStudentsBySameDeviceId,
  createRegistration,
  getRegistrationList,
  deleteRegistration,
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
  addQuestion,
  deleteQuestion,
  getNotificationList,
  sendBulkNotification,
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
  getWeeklyRankings,
  updateQuestion,
  addOrganization,
};
