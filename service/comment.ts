import { Types } from "mongoose";
import { Comment, FileUpload, Feed, Like } from "../models";
import { getUserType } from "../utils";
import { userType, UserType } from "../types";
import { updateCommentCount, updateLikeCount } from "./feed.service";

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
  let approved = false;

  if (role === userType.ADMIN) {
    approved = true;
  }

  const feed = await Feed.findById(feedId).select("createdBy").lean();

  if (!feed) throw new Error(`feed not available for ${feedId}`);

  const data = await Comment.create({
    userId,
    feedId,
    content,
    approved,
    parentId, // if the parentId present, then it is consider as a parent comment
    feedOwnerId: feed.createdBy,
    userType: getUserType(role),
  });
  return { id: data._id };
};

export const getParentComment = async (
  orgId: string,
  userId: string,
  feedId: string,
  page: number = 1,
  limit: number = 100,
) => {
  const skip = (page - 1) * limit;
  const data = await Comment.find({
    orgId,
    feedId,
    parentId: null,
    $or: [{ approve: true }, { approve: false, userId }],
  })
    .select("-feedId -parentId")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "name profilePicPath")
    .lean();

  const result = data.map(({ userId, ...rest }) => ({
    ...rest,
    userDetail: userId,
  }));

  return result;
};

export const nonApproveComment = async (
  orgId: string,
  adminId: string,
  page: number = 1,
  limit: number = 100,
) => {
  const skip = (page - 1) * limit;

  Comment.find({ orgId, feedOwnerId: adminId, approved: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return "";
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
    .populate("userDetail", "name profilePicPath");
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
    const updated = await updateLikeCount(feedId, -1);
    await Like.deleteOne(queryObj);
    return { liked: false, likeCount: updated!.likeCount };
  } else {
    // like
    const updated = await updateLikeCount(feedId, 1);
    await Like.create(queryObj);

    return { liked: true, likeCount: updated!.likeCount };
  }
};

export const approveComment = async (orgId: string, commentId: string) => {
  const result = await Comment.findOneAndUpdate(
    { _id: commentId, orgId },
    {
      $set: { approved: true },
    },
  );
  if (!result) throw new Error(`${commentId} is invalid`);
  await updateCommentCount(result.feedId.toString(), 1);
};

export const deleteComment = async (
  orgId: string,
  userId: string,
  commentId: string,
) => {
  const result = await Comment.findOneAndDelete({
    _id: commentId,
    orgId,
    userId,
  });
  if (!result) throw new Error(`${commentId} is invalid`);

  await updateCommentCount(result.feedId.toString(), -1);
};
