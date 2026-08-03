import { Types } from "mongoose";
import { Comment, FileUpload, Feed, Like } from "../models";
import { getUserType } from "../utils";
import { UserType } from "../types";

interface AddCommentResult {
  id: Types.ObjectId;
}

interface ToggleLikeResult {
  liked: boolean;
  likeCount: number;
}

export const addComment = async (
  userId: string,
  feedId: string,
  content: string,
  role: UserType,
  parentId: string | null = null,
): Promise<AddCommentResult> => {
  const data = await Comment.create({
    userId,
    feedId,
    content,
    parentId, // if the parentId present, then it is consider as a parent comment
    userType: getUserType(role),
  });
  await Feed.updateOne({ _id: feedId }, { $inc: { commentCount: 1 } });
  return { id: data._id };
};

export const getParentComment = async (
  feedId: string,
  page: number = 1,
  limit: number = 100,
) => {
  const skip = (page - 1) * limit;
  const data = await Comment.find({
    feedId,
    parentId: null,
    isBlocked: false,
  })
    .select("-feedId -parentId")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "name profilePicPath");
  return data;
};

export const getChildComment = async (
  parentId: string,
  page: number = 1,
  limit: number = 100,
) => {
  const skip = (page - 1) * limit;
  const data = await Comment.find({
    parentId,
    isBlocked: false,
  })
    .select("-imageId -parentId")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "name profilePicPath");
  return data;
};

export const toggleLike = async (
  userId: string,
  feedId: string,
  role: UserType,
): Promise<ToggleLikeResult> => {
  // try to remove first — if userId exists in likedBy, $pull removes it
  const queryObj = {
    feedId,
    userId,
    userType: getUserType(role),
  };
  const alreadyLiked = await Like.exists(queryObj);

  if (alreadyLiked) {
    // unlike
    const updated = await Feed.findOneAndUpdate(
      { _id: feedId },
      {
        $inc: { likeCount: -1 },
      },
      { new: true },
    );
    await Like.deleteOne(queryObj);
    return { liked: false, likeCount: updated!.likeCount };
  } else {
    // like
    const updated = await Feed.findOneAndUpdate(
      { _id: feedId },
      {
        $addToSet: { likedBy: userId },
        $inc: { likeCount: 1 },
      },
      { new: true },
    );
    await Like.create(queryObj);

    return { liked: true, likeCount: updated!.likeCount };
  }
};
