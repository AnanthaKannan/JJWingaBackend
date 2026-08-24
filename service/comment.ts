import { Types } from "mongoose";
import { Comment, FileUpload, Feed, Like, Admin, Student } from "@models";
import { getUserType } from "@utils";
import { UserType } from "@types";
import {
  COMMENT_APPROVED_BY_ADMIN,
  NEW_COMMENT_ADDED_BY_STUDENT,
  userTypeEnum,
} from "@constants";
import { updateCommentCount, updateLikeCount } from "@service/feed.service";
import { sendPushNotificationBulk } from "./notificaion.service";

interface AddCommentResult {
  id: Types.ObjectId;
}

interface ToggleLikeResult {
  liked: boolean;
  likeCount: number;
}

export const addComment = async (
  orgId: string,
  userId: string,
  feedId: string,
  content: string,
  role: UserType,
  parentId: string | null = null,
): Promise<AddCommentResult> => {
  let approved = false;

  if (role === userTypeEnum.ADMIN) {
    approved = true;
    await updateCommentCount(feedId, 1);
  }

  const feed = await Feed.findOne({ _id: feedId, orgId })
    .select("createdBy")
    .lean();

  if (!feed) throw new Error(`feed not available for ${feedId}`);

  const data = await Comment.create({
    orgId,
    userId,
    feedId,
    content,
    approved,
    parentId, // if the parentId present, then it is consider as a parent comment
    feedOwnerId: feed.createdBy,
    userType: getUserType(role),
  });

  const response = { id: data._id };
  if (role === userTypeEnum.ADMIN) {
    return response;
  }

  // if it is comment by admin, need to send the notification to the admin
  const adminDetail = await Admin.findOne({ _id: feed.createdBy, orgId })
    .select("fcmTokens")
    .lean();
  const tokens = adminDetail?.fcmTokens;

  if (tokens) {
    const { title, body } = NEW_COMMENT_ADDED_BY_STUDENT;
    await sendPushNotificationBulk(tokens, title, body);
  }

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
    $or: [{ approved: true }, { approved: false, userId }],
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

export const nonApproveCommentList = async (
  orgId: string,
  adminId: string,
  page: number = 1,
  limit: number = 100,
) => {
  const skip = (page - 1) * limit;

  const data = await Comment.find({
    orgId,
    feedOwnerId: adminId,
    approved: false,
  })
    .select("-parentId -replyCount -approved -feedOwnerId")
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
  orgId: string,
  userId: string,
  feedId: string,
  role: UserType,
): Promise<ToggleLikeResult> => {
  // try to remove first — if userId exists in likedBy, $pull removes it
  const queryObj = {
    orgId,
    feedId,
    userId,
    userType: getUserType(role),
  };
  const alreadyLiked = await Like.exists(queryObj);

  if (alreadyLiked) {
    // unlike
    const updated = await updateLikeCount(orgId, feedId, -1);
    await Like.deleteOne(queryObj);
    return { liked: false, likeCount: updated!.likeCount };
  } else {
    // like
    const updated = await updateLikeCount(orgId, feedId, 1);
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

  const studentDetails = await Student.findOne({ _id: result.userId, orgId })
    .select("fcmTokens")
    .lean();
  const tokens = studentDetails?.fcmTokens;

  if (tokens) {
    const { title, body } = COMMENT_APPROVED_BY_ADMIN;
    await sendPushNotificationBulk(tokens, title, body);
  }
};

export const rejectComment = async (orgId: string, commentId: string) => {
  const result = await Comment.findOneAndDelete({
    _id: commentId,
    orgId,
    approved: false,
  });

  if (!result) throw new Error(`${commentId} is invalid`);

  const studentDetails = await Student.findOne({ _id: result.userId, orgId })
    .select("fcmTokens")
    .lean();
  const tokens = studentDetails?.fcmTokens;

  if (tokens) {
    const { title, body } = COMMENT_APPROVED_BY_ADMIN;
    await sendPushNotificationBulk(tokens, title, body);
  }
};

export const deleteComment = async (
  orgId: string,
  userId: string,
  commentId: string,
) => {
  const result = await Comment.findOneAndDelete({
    _id: commentId,
    orgId,
    $or: [{ userId }, { feedOwnerId: userId }], // can delete by the user who is commented, or admin who is owner
  });
  if (!result) throw new Error(`commentId ${commentId} is invalid`);

  if (result.approved) await updateCommentCount(result.feedId.toString(), -1);
};
