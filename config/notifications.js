const ASSIGNMENT_NOTIFICATION_TYPES = ["homework", "exam"];

const formatQuestionIds = (questions) =>
  questions
    .map((question) => question.questionId)
    .filter(Boolean)
    .join(", ");

const buildAssignmentNotificationText = (questions) => {
  const notifiableQuestions = questions.filter((question) =>
    ASSIGNMENT_NOTIFICATION_TYPES.includes(question.type),
  );

  if (notifiableQuestions.length === 0) {
    return null;
  }

  const notifiableTypes = new Set(
    notifiableQuestions.map((question) => question.type),
  );
  const questionIdsText = formatQuestionIds(notifiableQuestions);
  const questionText = questionIdsText ? `: ${questionIdsText}` : "";

  if (notifiableTypes.size === 1) {
    const type = [...notifiableTypes][0];
    return {
      messageHeader: `New ${type} assigned`,
      messageBody: `You have new ${type} assigned${questionText}.`,
    };
  }

  return {
    messageHeader: "New homework and exam assigned",
    messageBody: `You have new homework and exam assigned${questionText}.`,
  };
};

module.exports = {
  ASSIGNMENT_NOTIFICATION_TYPES,
  buildAssignmentNotificationText,
};
