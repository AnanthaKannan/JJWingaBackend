const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const { generateToken } = require("../middleware/auth");
const {
  buildUploadPath,
  getSupabaseClient,
  getSupabaseStorageTarget,
} = require("../utils/supabaseStorage");
const {
  Student,
  HomeWork,
  Admin,
  IdGen,
  Question,
  Score,
  Notification,
  FileUpload,
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

const login = async (username, password, deviceId, validatePassword = true) => {
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
  if (validatePassword) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid username or password");
    }
  }

  // Step 5: Generate JWT
  let deviceIds = user.deviceIds;
  if (deviceId) {
    if (deviceIds?.length > 0) deviceIds.push(deviceId);
    else deviceIds = [deviceId];
  }
  const payload = {
    id: user._id,
    role,
    ...(role === "student"
      ? { studentId: user.studentId, deviceIds, createdBy: user.createdBy }
      : { adminId: user.adminId }),
  };

  const token = generateToken(payload);
  return {
    token,
    role,
    user: {
      id: user._id,
      name: user.name,
      profilePicPath: user.profilePicPath,
      ...(role === "student"
        ? {
            studentId: user.studentId,
            level: user.level,
            vertical: user.vertical,
            hasLoginSameDevice: user.hasLoginSameDevice,
          }
        : { adminId: user.adminId }),
    },
  };
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

const getStudentList = async (adminId, page = 1, limit = 15, search = "") => {
  const skip = (page - 1) * limit;
  const adminObjectId = new mongoose.Types.ObjectId(adminId);

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

const getStudentsBySameDeviceId = async (deviceIds) => {
  if (!deviceIds || deviceIds.length === 0) {
    throw new Error("Device ID is not assigned for this student");
  }

  const students = await Student.find({
    deviceIds: { $in: deviceIds },
  })
    .select("_id studentId name deviceIds vertical")
    .sort({ name: 1 })
    .lean();

  return {
    students,
    count: students.length,
  };
};

const getQuestionList = async (
  page = 1,
  limit = 15,
  search = "",
  level = null,
) => {
  const skip = (page - 1) * limit;

  const query = {
    isDeleted: { $ne: true },
    ...(search ? { questionId: { $regex: search, $options: "i" } } : {}),
    ...(level === null ? {} : { level }),
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

const getHomeworkList = async (
  studentId,
  state = null,
  page = 1,
  limit = 15,
  sortBy = "createdAt",
  sortOrder = "desc",
) => {
  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  // Build query
  const query = { studentId };
  if (state) {
    query.state = state.toUpperCase();
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
  studentId,
  page = 1,
  limit = 15,
  search = "",
  level = null,
) => {
  const skip = (page - 1) * limit;
  const studentObjectId = new mongoose.Types.ObjectId(studentId);

  const pipeline = [
    {
      $match: { isDeleted: { $ne: true } },
    },
    ...(level === null ? [] : [{ $match: { level } }]),
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

  const questions = await Question.find({
    _id: { $in: questionIds },
    isDeleted: { $ne: true },
  });
  if (questions.length !== questionIds.length) {
    throw new Error("One or more questions not found");
  }

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
  const { name, level, createdBy } = studentData;

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
  const password = `Welcome${idGen.studentLastId}`;

  // 4. Create student
  const student = await Student.create({
    studentId,
    name,
    level,
    password,
    createdBy,
  });

  // 5. Create an empty score record for the student
  await Score.create({ studentId: student._id });

  return { student };
};

const updateStudent = async (studentObjectId, updateData) => {
  // 1. Validate student exists
  const student = await Student.findById(studentObjectId);
  if (!student) throw new Error("Student not found");

  // 2. Whitelist allowed fields
  const allowedFields = ["name", "password", "vertical", "deviceId", "level"];
  const filteredData = Object.keys(updateData)
    .filter((key) => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updateData[key];
      return obj;
    }, {});

  if (Object.keys(filteredData).length === 0) {
    throw new Error("No valid fields provided to update");
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

const removeStudentDeviceId = async (studentObjectId, deviceId) => {
  const deviceIdsToRemove = [deviceId];

  if (deviceIdsToRemove.length === 0) {
    throw new Error("deviceId is required");
  }

  const student = await Student.findById(studentObjectId);
  if (!student) throw new Error("Student not found");

  const removeSet = new Set(deviceIdsToRemove);
  student.deviceIds = student.deviceIds.filter(
    (value) => !removeSet.has(value),
  );

  await student.save({ validateModifiedOnly: true });
};

const updateFcmToken = async (userId, fcmToken, isStudent) => {
  if (isStudent) {
    const studentId = userId;
    await Student.findByIdAndUpdate(
      studentId,
      { fcmTokens: [fcmToken] }, // replace entire array with the new single token
    );
  } else {
    const adminId = userId;
    await Admin.findByIdAndUpdate(
      adminId,
      { fcmTokens: [fcmToken] }, // replace entire array with the new single token
    );
  }
};

const updateProfilePicPath = async (user, profilePicPath) => {
  if (user?.role === "student") {
    await Student.findByIdAndUpdate(user.id, { profilePicPath });
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

const createFileUploadRecord = async (name, filePath, type) => {
  if (!["practice", "celebration"].includes(type)) {
    return null;
  }

  return FileUpload.create({
    name: name.trim(),
    filePath,
    type,
  });
};

const uploadFile = async (file, user, formPath = "", name = "") => {
  if (!file) {
    throw new Error("file is required");
  }

  if (typeof formPath !== "string" || formPath.trim() === "") {
    throw new Error("path is required");
  }

  const uploadType = formPath.trim();
  validateFileUploadRecord(user, name, uploadType);

  const { bucket, prefix } = getSupabaseStorageTarget();

  const supabase = getSupabaseClient();
  const path = buildUploadPath(file, user, prefix, formPath);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
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

  const fileUpload = await createFileUploadRecord(name, data.path, uploadType);

  return {
    bucket,
    path: data.path,
    url: publicUrlData.publicUrl,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    ...(fileUpload ? { fileUpload } : {}),
  };
};

const updateFileUploadName = async (fileUploadId, name) => {
  if (!fileUploadId) {
    throw new Error("fileUploadId is required");
  }

  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("name is required");
  }

  const fileUpload = await FileUpload.findByIdAndUpdate(
    fileUploadId,
    { name: name.trim() },
    { new: true, runValidators: true },
  );

  if (!fileUpload) {
    throw new Error("File upload not found");
  }

  return { fileUpload };
};

const deleteFileUpload = async (fileUploadId) => {
  if (!fileUploadId) {
    throw new Error("fileUploadId is required");
  }

  const fileUpload = await FileUpload.findById(fileUploadId);
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

const deleteProfilePic = async (user) => {
  const Model = user?.role === "student" ? Student : Admin;
  const account = await Model.findById(user?.id).select("profilePicPath");

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

const addQuestion = async (questionData) => {
  const { questionId, level, questions } = questionData;

  // 1. Check if questionId already exists
  const existing = await Question.findOne({ questionId });
  if (existing) throw new Error("Question ID already exists");

  // 2. Create question
  await Question.create({
    questionId,
    level,
    questions: questions ?? [],
  });
};

const updateQuestion = async (questionObjectId, updateData) => {
  const question = await Question.findById(questionObjectId);
  if (!question) throw new Error("Question not found");

  const allowedFields = ["questionId", "level"];
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

const deleteQuestion = async (questionObjectId) => {
  const question = await Question.findById(questionObjectId);
  if (!question) throw new Error("Question not found");

  const isAssigned = await HomeWork.exists({ questionId: questionObjectId });

  if (isAssigned) {
    question.isDeleted = true;
    await question.save();

    return { deleteType: "soft", question };
  }

  await question.deleteOne();

  return { deleteType: "hard" };
};

const createHomeworkCompletedNotification = async (homework) => {
  const student = await Student.findById(homework.studentId).select(
    "studentId name createdBy",
  );

  if (!student?.createdBy) {
    return null;
  }

  const adminDetail = await Admin.findById(student.createdBy).select(
    "fcmTokens",
  );
  const question = await Question.findById(homework.questionId).select(
    "questionId",
  );
  const homeworkName = question?.questionId;

  const notification = await Notification.create({
    adminId: student.createdBy,
    sentBy: student._id,
    sentByModel: "Student",
    messageHeader: "Homework completed",
    messageBody: `${student.name} has completed homework - ${homeworkName}.`,
  });

  await sendPushNotification(
    adminDetail?.fcmTokens?.[0],
    notification.messageHeader,
    notification.messageBody,
  );

  return notification;
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

    // send notification to admin
    await createHomeworkCompletedNotification(homework);
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

const sendPushNotification = async (token, title, body) => {
  try {
    if (!token) throw new Error("Invalid fcm token");

    await admin.messaging().send({
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

const resolveWeeklyRankingScope = async (level, user) => {
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

const getWeeklyRankings = async (level = null, user = null) => {
  const { level: rankingLevel, adminId: rankingAdminId } =
    await resolveWeeklyRankingScope(level, user);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const studentAdminFilter = rankingAdminId
    ? [
        {
          $match: {
            "student.createdBy": new mongoose.Types.ObjectId(rankingAdminId),
          },
        },
      ]
    : [];

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
    // Step 1: Filter only COMPLETED homework from last 7 days
    {
      $match: {
        state: "COMPLETED",
        updatedAt: { $gte: sevenDaysAgo },
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

const seedAdminScreenData = async () => {
  const adminData = {
    _id: new mongoose.Types.ObjectId("6a16d4108349e449c87c7806"),
    adminId: "JW001",
    name: "Sobhana",
    password: "$2b$10$tw.cZEpo5FjvxEMe6JDodea4LtodzAM1aV2D7sfcNCKY7hV5ghHk2",
  };

  const existingAdmin = await Admin.findOne({ adminId: adminData.adminId });
  const admin =
    existingAdmin ||
    (await Admin.findOneAndUpdate(
      { adminId: adminData.adminId },
      { $setOnInsert: adminData },
      { new: true, upsert: true },
    ));

  const existingIdGen = await IdGen.findOne({});

  const idGen = await IdGen.findOneAndUpdate(
    {},
    {
      $setOnInsert: {
        _id: new mongoose.Types.ObjectId("6a195c89699fb18c51477740"),
        studentLastId: 100,
      },
    },
    { new: true, upsert: true },
  );

  return {
    admin: {
      data: admin,
      created: !existingAdmin,
    },
    idGen: {
      data: idGen,
      created: !existingIdGen,
    },
  };
};

module.exports = {
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
  addQuestion,
  deleteQuestion,
  getNotificationList,
  sendBulkNotification,
  updateFcmToken,
  uploadFile,
  updateFileUploadName,
  deleteFileUpload,
  deleteProfilePic,
  downloadFileUpload,
  getWeeklyRankings,
  seedAdminScreenData,
  updateQuestion,
};
