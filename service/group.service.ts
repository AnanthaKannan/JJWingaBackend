import { Group } from "../models";
import { Types } from "mongoose";

interface CreateGroupParams {
  groupName: string;
  userId: string[];
  orgId: string;
  createdBy: string;
}

export const createGroup = async ({
  groupName,
  userId,
  orgId,
  createdBy,
}: CreateGroupParams) => {
  const userIds = userId.map((id) => new Types.ObjectId(id));

  const group = await Group.create({
    groupName,
    userId: userIds,
    orgId,
    createdBy,
  });

  return group;
};

// interface CreateFeedParams {
//   orgId: string;
//   type: TFeedType;
//   filePath: string;
//   content: string;
//   createdBy: string;
// }

// export const createFeed = async ({
//   ...params
// }: CreateFeedParams): Promise<IFeed> => {
//   const { orgId, type, filePath, content, createdBy } = params;

//   const feed = await Feed.create({
//     orgId,
//     type,
//     filePath,
//     content,
//     createdBy,
//   });

//   return feed;
// };

export const groupList = (orgId: string, adminId: string) => {
  return Group.find({ orgId, createdBy: adminId }).select("groupName");
};

// export const updateCommentCount = (feedId: string, increaseBy: number) => {
//   return Feed.updateOne(
//     { _id: feedId },
//     { $inc: { commentCount: increaseBy } },
//   );
// };

// export const updateLikeCount = (
//   orgId: string,
//   feedId: string,
//   increaseBy: number,
// ) => {
//   return Feed.findOneAndUpdate(
//     { _id: feedId, orgId },
//     {
//       $inc: { likeCount: increaseBy },
//     },
//     { new: true },
//   );
// };

// export const deleteFeed = async (
//   orgId: string,
//   adminId: string,
//   feedId: string,
// ) => {
//   await Comment.deleteMany({ orgId, feedOwnerId: adminId, feedId });
//   await Like.deleteMany({ orgId, feedId });

//   const result = await Feed.findOneAndDelete({ _id: feedId, orgId });
//   if (!result) throw new Error(`${feedId} is invalid`);

//   // TODO: remove the image from the bucket
// };
