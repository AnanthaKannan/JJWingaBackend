import { Feed, IFeed, TFeedType } from "../models";
import { Types } from "mongoose";

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

export const feedList = (orgId: string): Promise<FeedList[]> => {
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
      $project: {
        _id: 1,
        content: 1,
        type: 1,
        commentCount: 1,
        createdAt: 1,
        filePath: 1,
        likeCount: 1,
        adminName: "$adminInfo.name",
        adminPicPath: "$adminInfo.profilePicPath",
      },
    },
  ]);
};
