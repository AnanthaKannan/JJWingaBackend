const Student = require('../models/student');

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



module.exports = { login, getStudentList };