const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

const authenticate = (req, res, next) => {
  const token = req.header("x-access-token");
  if (!token) {
    console.log(`Request to ${req.path} failed — no token provided`);
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log(
      `Request to ${req.path} — user: ${req.user.id} - name: ${req?.user?.name} role: ${req.user.role}`,
    );
    next();
  } catch {
    console.log(`Request to ${req.path} failed — invalid token`);
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

const generateToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    console.log(`Request to ${req.path} failed — admin access required`);
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }
  next();
};

module.exports = {
  authenticate,
  generateToken,
  authorizeAdmin,
};
