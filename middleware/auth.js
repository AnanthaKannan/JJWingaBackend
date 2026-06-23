const jwt = require("jsonwebtoken");
const logger = require("./logger");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const API_KEY = process.env.API_KEY;

const getRequestContext = (req) => ({
  method: req.method,
  path: req.originalUrl || req.path,
  ip: req.ip,
});

const authenticate = (req, res, next) => {
  const token = req.header("x-access-token");
  if (!token) {
    logger.warn(getRequestContext(req), "auth_missing_token");
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    logger.debug(
      {
        ...getRequestContext(req),
        userId: req.user.id,
        name: req.user.name,
        role: req.user.role,
      },
      "auth_success",
    );
    next();
  } catch (error) {
    logger.warn(
      { ...getRequestContext(req), err: error },
      "auth_invalid_token",
    );
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
    logger.warn(
      {
        ...getRequestContext(req),
        userId: req.user.id,
        role: req.user.role,
      },
      "auth_admin_required",
    );
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }
  next();
};

const authorizeSuperAdminRole = (req, res, next) => {
  if (!req.user.roles?.some((role) => role === "superadmin")) {
    logger.warn(
      {
        ...getRequestContext(req),
        userId: req.user.id,
        role: req.user.role,
      },
      "auth_superadmin_required",
    );
    return res.status(403).json({
      success: false,
      message: "Access denied. Superadmin only.",
    });
  }
  next();
};

const apiKeyValidation = (req, res, next) => {
  const apiKey = req.header("api-key");
  if (apiKey !== API_KEY) {
    logger.warn({ ...getRequestContext(req) }, "auth_invalid_api_key");
    return res.status(401).json({
      success: false,
      message: "Access denied.",
    });
  }
  next();
};

module.exports = {
  authenticate,
  generateToken,
  authorizeAdmin,
  apiKeyValidation,
  authorizeSuperAdminRole,
};
