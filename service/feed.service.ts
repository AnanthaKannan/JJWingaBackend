import { Feed, IFeed, TFeedType, Comment, Like, Student } from "../models";
import { Types } from "mongoose";
import { sendPushNotificationBulk } from "./notificaion.service";
import { NEW_FEED_PUBLISHED, userTypeModelEnum } from "@constants";

interface CreateFeedParams {
  orgId: string;
  type: TFeedType;
  filePath: string;
  content: string;
  createdBy: string;
}

export const createFeed = async ({
  ...params
}: CreateFeedParams): Promise<IFeed> => {
  const { orgId, type, filePath, content, createdBy } = params;

  const feed = await Feed.create({
    orgId,
    type,
    filePath,
    content,
    createdBy,
  });

  const students = await Student.find({
    orgId,
    createdBy,
  })
    .select("fcmTokens -_id")
    .lean();

  const tokens = students.flatMap((student) => student.fcmTokens ?? []);
  const { title, body } = NEW_FEED_PUBLISHED;

  const notifications = students.map((student) => ({
    studentId: student._id.toString(),
    sentBy: userTypeModelEnum.STUDENT,
  }));

  await sendPushNotificationBulk(tokens, title, body, notifications);

  return feed;
};

interface FeedList {
  _id: Types.ObjectId;
  content: string;
  type: TFeedType;
  commentCount: number;
  likeCount: number;
  adminName: string;
  adminPicPath: string;
}

export const feedList = (
  orgId: string,
  userId: string,
): Promise<FeedList[]> => {
  return Feed.aggregate<FeedList>([
    { $match: { orgId: new Types.ObjectId(orgId) } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "admins",
        localField: "createdBy",
        foreignField: "_id",
        as: "adminInfo",
      },
    },
    { $unwind: "$adminInfo" },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "feedId",
        as: "likeInfo",
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        type: 1,
        commentCount: 1,
        createdAt: 1,
        filePath: 1,
        likeCount: 1,
        createdBy: 1,
        adminName: "$adminInfo.name",
        adminPicPath: "$adminInfo.profilePicPath",
        isLikedByMe: {
          $eq: [
            { $arrayElemAt: ["$likeInfo.userId", 0] },
            new Types.ObjectId(userId),
          ],
        },
      },
    },
  ]);
};

export const updateCommentCount = (feedId: string, increaseBy: number) => {
  return Feed.updateOne(
    { _id: feedId },
    { $inc: { commentCount: increaseBy } },
  );
};

export const updateLikeCount = (
  orgId: string,
  feedId: string,
  increaseBy: number,
) => {
  return Feed.findOneAndUpdate(
    { _id: feedId, orgId },
    {
      $inc: { likeCount: increaseBy },
    },
    { new: true },
  );
};

export const deleteFeed = async (
  orgId: string,
  adminId: string,
  feedId: string,
) => {
  await Comment.deleteMany({ orgId, feedOwnerId: adminId, feedId });
  await Like.deleteMany({ orgId, feedId });

  const result = await Feed.findOneAndDelete({ _id: feedId, orgId });
  if (!result) throw new Error(`${feedId} is invalid`);

  // TODO: remove the image from the bucket
};
