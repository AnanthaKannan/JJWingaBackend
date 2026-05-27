const Student = require('../models/student');
const HomeWork = require('../models/homework');
const Admin = require('../models/admin');
const Idgen = require('../models/idgen');
const Question = require('../models/question');
const Score = require('../models/score');


const { generateToken } = require('../middleware/auth')

const login = async (username, password) => {
  let user = null;
  let role = null;

  // Step 1: Try Student login
  user = await Student.findOne({ studentId: username });
  if (user) {
    role = 'student';
  }

  // Step 2: Fallback to Admin login
  if (!user) {
    user = await Admin.findOne({ adminId: username });
    if (user) {
      role = 'admin';
    }
  }

  // Step 3: No user found
  if (!user) {
    throw new Error('Invalid username or password');
  }

  // Step 4: Validate password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid username or password');
  }

  // Step 5: Generate JWT
  const payload = {
    id: user._id,
    role,
    ...(role === 'student' ? { studentId: user.studentId } : { adminId: user.adminId }),
  };


  return {
    token: generateToken,
    role,
    user: {
      id: user._id,
      name: user.name,
      ...(role === 'student' ? { studentId: user.studentId } : { adminId: user.adminId }),
    },
  };
};

const getStudentList = async (page = 1, limit = 15) => {
  const skip = (page - 1) * limit;

  const [students, total] = await Promise.all([
    Student.find()
      .select('-password')         // exclude password
      .populate('createdBy', 'name adminId') // include admin name & id
      .sort({ createdAt: -1 })     // newest first
      .skip(skip)
      .limit(limit),
    Student.countDocuments(),
  ]);

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

const getQuestionList = async (page = 1, limit = 15) => {
  const skip = (page - 1) * limit;

  const [questions, total] = await Promise.all([
    Question.find()
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit),
    Question.countDocuments(),
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

const getHomeworkList = async (studentId, state = null, page = 1, limit = 15) => {
  const skip = (page - 1) * limit;

  // Build query
  const query = { studentId };
  if (state) {
    query.state = state.toUpperCase();
  }

  const [homeworks, total] = await Promise.all([
    HomeWork.find(query)
      .populate('questionId')        // resolve full question data
      .sort({ createdAt: -1 })       // newest first
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


const getAvailableQuestionsForStudent = async (studentId, page = 1, limit = 15) => {
  const skip = (page - 1) * limit;
  const studentObjectId = new mongoose.Types.ObjectId(studentId);

  const pipeline = [
    {
      // Join with homeworks collection to check if question is assigned to this student
      $lookup: {
        from: 'homeworks',
        let: { questionId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$questionId', '$$questionId'] },
                  { $eq: ['$studentId', studentObjectId] },
                ],
              },
            },
          },
        ],
        as: 'assignedHomework',
      },
    },
    {
      // Only keep questions NOT assigned to this student
      $match: { assignedHomework: { $size: 0 } },
    },
    {
      // Remove the joined field from output
      $project: { assignedHomework: 0 },
    },
    { $sort: { createdAt: -1 } },
  ];

  const [questions, countResult] = await Promise.all([
    Question.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
    Question.aggregate([...pipeline, { $count: 'total' }]),
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
    .populate('studentId', 'name studentId'); // resolve student name & id

  if (!score) {
    throw new Error('Score not found for this student');
  }

  return score;
};

module.exports = {
  login, getStudentList, getQuestionList, getHomeworkList, getAvailableQuestionsForStudent,
  getScoreByStudentId
};