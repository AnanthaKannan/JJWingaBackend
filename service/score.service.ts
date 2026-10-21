import { Types } from "mongoose";
import { HomeWork, Question, Score, Student } from "../models";
import { NotFoundError } from "../errors";

const scoreFields = [
  "assigned",
  "new",
  "progress",
  "completed",
  "correct",
  "wrong",
  "timeTaken",
  "practiceAssigned",
  "practiceNew",
  "practiceProgress",
  "practiceCompleted",
  "practiceCorrect",
  "practiceWrong",
  "practiceTimeTaken",
] as const;

type ScoreValues = Record<(typeof scoreFields)[number], number>;

export const recalculateStudentScore = async (
  adminId: string,
  studentId: string,
) => {
  const studentObjectId = new Types.ObjectId(studentId);
  const adminObjectId = new Types.ObjectId(adminId);
  const student = await Student.findOne({
    _id: studentObjectId,
    createdBy: adminObjectId,
  })
    .select("_id")
    .lean();

  if (!student) {
    throw new NotFoundError("Student");
  }

  const homeworks = await HomeWork.find({ studentId: studentObjectId })
    .select("questionId state results timer")
    .lean();
  const questionIds = [
    ...new Set(homeworks.map(({ questionId }) => questionId)),
  ];
  const questions = await Question.find({ _id: { $in: questionIds } })
    .select("type")
    .lean();
  const questionTypeById = new Map(
    questions.map((question) => [question._id.toString(), question.type]),
  );

  const values: ScoreValues = Object.fromEntries(
    scoreFields.map((field) => [field, 0]),
  ) as ScoreValues;

  for (const homework of homeworks) {
    const isPractice =
      questionTypeById.get(homework.questionId.toString()) === "practice";
    const prefix = isPractice ? "practice" : "";
    const field = (name: string) =>
      (isPractice
        ? `${prefix}${name[0].toUpperCase()}${name.slice(1)}`
        : name) as keyof ScoreValues;

    values[field("assigned")] += 1;
    values[field(homework.state.toLowerCase())] += 1;

    if (homework.state === "COMPLETED") {
      const results = homework.results ?? [];
      values[field("correct")] += results.filter(Boolean).length;
      values[field("wrong")] += results.filter((result) => !result).length;
      values[field("timeTaken")] += homework.timer ?? 0;
    }
  }

  return Score.findOneAndUpdate(
    { studentId: studentObjectId },
    { $set: values, $setOnInsert: { studentId: studentObjectId } },
    { new: true, upsert: true },
  )
    .select(scoreFields.join(" "))
    .lean();
};
