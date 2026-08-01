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

export const getGameTopper = (level: number): Promise<TopStudent[]> => {
  return GameScore.aggregate<TopStudent>([
    { $match: { level } },
    { $sort: { points: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "studentInfo",
      },
    },
    { $unwind: "$studentInfo" },
    {
      $project: {
        _id: 0,
        student: "$studentInfo._id",
        name: "$studentInfo.name",
        profilePic: "$studentInfo.profilePicPath",
        points: 1,
      },
    },
  ]);
};
