import { GameScore } from "../models";
import { Types } from "mongoose";

export const addGameScore = async (
  studentId: string,
  level: number,
  points: number,
): Promise<void> => {
  await GameScore.findOneAndUpdate(
    {
      studentId: new Types.ObjectId(studentId),
      level,
    },
    { $max: { points } },
    { upsert: true },
  );
};

interface TopStudent {
  studentId: Types.ObjectId;
  name: string;
  profilePic: string;
  points: number;
}

export const gameScore = async (studentId: string) => {
  const scoreDetails = await GameScore.findOne({
    studentId: new Types.ObjectId(studentId),
  });
  return scoreDetails;
};

export const getGameTopper = (
  teacherId: string,
  level: number,
): Promise<TopStudent[]> => {
  return GameScore.aggregate<TopStudent>([
    { $match: { level } },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "studentInfo",
      },
    },
    { $unwind: "$studentInfo" },
    { $match: { "studentInfo.createdBy": new Types.ObjectId(teacherId) } },
    { $sort: { points: -1 } },
    { $limit: 5 },
    {
      $project: {
        _id: 0,
        studentId: "$studentInfo._id",
        name: "$studentInfo.name",
        profilePic: "$studentInfo.profilePicPath",
        points: 1,
      },
    },
  ]);
};
