import { Student } from "@models";

export const getStudentsToken = async (
  orgId: string,
  createdBy: string,
  studentIds: string[],
): Promise<string[]> => {
  const students = await Student.find({
    orgId,
    createdBy,
    _id: { $in: studentIds },
  })
    .select("fcmTokens -_id")
    .lean();

  const tokens = students.flatMap((student) => student.fcmTokens ?? []);
  return tokens;
};
