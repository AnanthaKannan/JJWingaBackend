const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const { generateToken } = require("../middleware/auth");
const {
  Student,
  HomeWork,
  Admin,
  IdGen,
  Question,
  Score,
  Notification,
} = require("../models");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const login = async (username, password) => {
  let user = null;
  let role = null;

  // Step 1: Try Student login
  user = await Student.findOne({ studentId: username });
  if (user) {
    role = "student";
  }

  // Step 2: Fallback to Admin login
  if (!user) {
    user = await Admin.findOne({ adminId: username });
    if (user) {
      role = "admin";
    }
  }

  // Step 3: No user found
  if (!user) {
    throw new Error("Invalid username or password");
  }

  // Step 4: Validate password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid username or password");
  }

  // Step 5: Generate JWT
  const payload = {
    id: user._id,
    role,
    ...(role === "student"
      ? { studentId: user.studentId }
      : { adminId: user.adminId }),
  };

  const token = generateToken(payload);
  return {
    token,
    role,
    user: {
      id: user._id,
      name: user.name,
      ...(role === "student"
        ? { studentId: user.studentId, vertical: user.vertical }
        : { adminId: user.adminId }),
    },
  };
};

const getStudentList = async (adminId, page = 1, limit = 15, search = "") => {
  const skip = (page - 1) * limit;
  const adminObjectId = mongoose.Types.ObjectId(adminId);

  const matchStage = [
    { $match: { createdBy: adminObjectId } },
    ...(search
      ? [{ $match: { name: { $regex: search, $options: "i" } } }]
      : []),
  ];

  const pipeline = [
    ...matchStage,
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
        score: { $arrayElemAt: ["$score", 0] },
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
    { $sort: { createdAt: -1 } },
  ];

  const [students, countResult] = await Promise.all([
    Student.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
    Student.aggregate([...pipeline, { $count: "total" }]),
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

const getQuestionList = async (page = 1, limit = 15, search = "") => {
  const skip = (page - 1) * limit;

  const query = search ? { questionId: { $regex: search, $options: "i" } } : {};

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

const getHomeworkList = async (
  studentId,
  state = null,
  page = 1,
  limit = 15,
) => {
  const skip = (page - 1) * limit;

  // Build query
  const query = { studentId };
  if (state) {
    query.state = state.toUpperCase();
  }

  const [homeworks, total] = await Promise.all([
    HomeWork.find(query)
      .populate("questionId") // resolve full question data
      .sort({ createdAt: -1 }) // newest first
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
  studentId,
  page = 1,
  limit = 15,
  search = "",
) => {
  const skip = (page - 1) * limit;
  const studentObjectId = new mongoose.Types.ObjectId(studentId);

  const pipeline = [
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
    .select("assigned new progress completed correct wrong timeTaken")
    .lean();

  if (!score) {
    throw new Error("Score not found for this student");
  }

  return score;
};

const getHomeworkById = async (id) => {
  const homework = await HomeWork.findById(id).populate("questionId"); // resolve full question data

  if (!homework) {
    throw new Error("Homework not found");
  }

  return homework;
};

const assignQuestion = async (studentId, questionIds) => {
  // 1. Validate student exists
  // const student = await Student.findById(studentId);
  // if (!student) throw new Error('Student not found');

  // // 2. Validate all questions exist
  // const questions = await Question.find({ _id: { $in: questionIds } });
  // if (questions.length !== questionIds.length) {
  //   throw new Error('One or more questions not found');
  // }

  // 3. Check for already assigned questions (avoid duplicates)
  // const existing = await HomeWork.find({ studentId, questionId: { $in: questionIds } });
  // if (existing.length > 0) {
  //   const alreadyAssigned = existing.map((hw) => hw.questionId.toString());
  //   throw new Error(`Questions already assigned: ${alreadyAssigned.join(', ')}`);
  // }

  // 4. Build and bulk insert homework records
  const homeworkDocs = questionIds.map((questionId) => ({
    studentId,
    questionId,
    state: "NEW",
  }));

  const homeworks = await HomeWork.insertMany(homeworkDocs, { ordered: false });

  // 5. Increment assigned and new in score by total count (upsert if score doc doesn't exist)
  const score = await Score.findOneAndUpdate(
    { studentId },
    { $inc: { assigned: homeworks.length, new: homeworks.length } },
    { new: true, upsert: true },
  );

  return { homeworks, score };
};

const addStudent = async (studentData) => {
  const { name, password, createdBy } = studentData;

  // 1. Validate admin exists
  // const admin = await Admin.findById(createdBy);
  // if (!admin) throw new Error("Admin not found");

  // 2. Increment idGen and get new studentLastId
  const idGen = await IdGen.findOneAndUpdate(
    {},
    { $inc: { studentLastId: 1 } },
    { new: true, upsert: true },
  );

  // 3. Generate studentId e.g. "JJ101"
  const studentId = `JJ${idGen.studentLastId}`;

  // 4. Create student
  const student = await Student.create({
    studentId,
    name,
    password,
    createdBy,
  });

  // 5. Create an empty score record for the student
  const score = await Score.create({ studentId: student._id });

  return { student };
};

const updateStudent = async (studentObjectId, updateData) => {
  // 1. Validate student exists
  const student = await Student.findById(studentObjectId);
  if (!student) throw new Error("Student not found");

  // 2. Whitelist allowed fields
  const allowedFields = ["name", "password", "vertical", "fcmTokens"];
  const filteredData = Object.keys(updateData)
    .filter((key) => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updateData[key];
      return obj;
    }, {});

  if (Object.keys(filteredData).length === 0) {
    throw new Error("No valid fields provided to update");
  }

  if (Object.prototype.hasOwnProperty.call(filteredData, "fcmTokens")) {
    const normalizedTokens = Array.isArray(filteredData.fcmTokens)
      ? filteredData.fcmTokens
      : [filteredData.fcmTokens];

    filteredData.fcmTokens = [
      ...new Set(normalizedTokens.filter((token) => token && token.trim())),
    ];
  }

  // 3. Apply updates to the document and save
  //    (so pre('save') password hash hook triggers if password is changed)
  Object.assign(student, filteredData);
  await student.save();
};

const updateFcmToken = async (studentId, fcmToken) => {
  await Student.findByIdAndUpdate(
    studentId,
    { fcmTokens: [fcmToken] }, // replace entire array with the new single token
  );
};

const addQuestion = async (questionData) => {
  const { questionId, questions } = questionData;

  // 1. Check if questionId already exists
  const existing = await Question.findOne({ questionId });
  if (existing) throw new Error("Question ID already exists");

  // 2. Create question
  const question = await Question.create({
    questionId,
    questions: questions ?? [],
  });
};

const updateHomework = async (homeworkId, updateData) => {
  const { state, answers, results, timer } = updateData;

  // 1. Validate homework exists
  const homework = await HomeWork.findById(homeworkId);
  if (!homework) throw new Error("Homework not found");

  const prevState = homework.state;
  const newState = state ?? prevState;

  // 2. Build score increment object based on state transition
  const scoreInc = {};

  if (prevState !== newState) {
    // Decrement previous state
    if (prevState === "NEW") scoreInc.new = -1;
    if (prevState === "PROGRESS") scoreInc.progress = -1;

    // Increment new state
    if (newState === "PROGRESS")
      scoreInc.progress = (scoreInc.progress ?? 0) + 1;
    if (newState === "COMPLETED") scoreInc.completed = 1;
  }

  // 3. If completed, update correct, wrong and add to timeTaken
  if (newState === "COMPLETED") {
    const correct = results?.filter(Boolean).length ?? 0;
    const wrong = results?.filter((r) => !r).length ?? 0;

    scoreInc.correct = correct;
    scoreInc.wrong = wrong;
    scoreInc.timeTaken = timer ?? 0;
  }

  // 4. Update homework fields
  if (state) homework.state = state;
  if (answers) homework.answers = answers;
  if (results) homework.results = results;
  if (timer !== undefined) homework.timer = timer;

  await homework.save();

  // 5. Update score atomically
  const score = await Score.findOneAndUpdate(
    { studentId: homework.studentId },
    { $inc: scoreInc },
    { new: true },
  );

  return { homework, score };
};

const getNotificationList = async (studentId, page = 1, limit = 15) => {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find({ studentId })
      .select("-studentId") // exclude studentId (already known)
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ studentId }),
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

const sendPushNotification = async (token, title, body) => {
  try {
    console.log("token", token, title, body);
    if (!token) throw new Error("Invalid fcm token");

    const res = await admin.messaging().send({
      token,
      notification: { title, body },
    });
  } catch (error) {
    // Log but don't throw — DB entry already saved, push failure is non-critical
    console.error(
      `Failed to send push notification to token ${token}:`,
      error.message,
    );
  }
};

const sendBulkNotification = async (
  students,
  messageHeader,
  messageBody,
  sentBy,
) => {
  // Step 1: Build notification documents for DB
  const notifications = students.map(({ id }) => ({
    studentId: id,
    messageHeader,
    messageBody,
    sentBy,
  }));

  // Step 2: Bulk insert — single DB round trip
  const result = await Notification.insertMany(notifications, {
    ordered: false,
  });
  // ordered: false — continues inserting remaining docs even if one fails

  // Step 3: Send FCM push notifications to all tokens in parallel
  await Promise.allSettled(
    students.map(({ tokens }) =>
      sendPushNotification(tokens[0], messageHeader, messageBody),
    ),
  );
  // Promise.allSettled — ensures all push attempts run even if some fail

  return {
    sentCount: result.length,
    totalRequested: students.length,
  };
};

module.exports = {
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
  addQuestion,
  getNotificationList,
  sendBulkNotification,
  updateFcmToken,
};
