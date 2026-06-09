const QUESTION_TYPES = ["homework", "exam", "practice"];

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

const validateOptionalStudentLevel = (level) => {
  if (level === undefined) {
    return null;
  }

  if (String(level).trim() === "" || Number.isNaN(Number(level))) {
    return "level must be a number";
  }

  return null;
};

const sendOptionalStudentLevelError = (res, level) => {
  const levelError = validateOptionalStudentLevel(level);

  return levelError
    ? res.status(400).json({
        success: false,
        message: levelError,
      })
    : null;
};

const validateQuestionType = (type, isRequired = true) => {
  if (isMissingRequiredValue(type)) {
    return isRequired ? "type is required" : null;
  }

  if (!QUESTION_TYPES.includes(type)) {
    return `type must be one of: ${QUESTION_TYPES.join(", ")}`;
  }

  return null;
};

module.exports = {
  QUESTION_TYPES,
  hasField,
  isMissingRequiredValue,
  sendOptionalStudentLevelError,
  validateOptionalStudentLevel,
  validateQuestionType,
  validateStudentLevel,
};
