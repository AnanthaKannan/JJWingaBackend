import { Request, Response } from "express";
import * as command from "../service/comment";
import { UserType } from "../types";

export const addComment = async (req: Request, res: Response) => {
  const { feedId, content, parentId } = req.body; // if parentId exist then it is consider as child command
  const {
    id: userId,
    role,
    orgId,
  } = req.user as { id: string; role: UserType; orgId: string };

  const data = await command.addComment(
    orgId,
    userId,
    feedId,
    content,
    role,
    parentId,
  );

  return res.status(201).json({
    success: true,
    message: "comment added successfully.",
    data,
  });
};

export const getParentComment = async (req: Request, res: Response) => {
  const feedId = req.params.feedId as string;
  const { orgId, id: userId } = req.user;

  const data = await command.getParentComment(orgId, userId, feedId);

  return res.status(200).json({
    success: true,
    message: "comment fetched successfully.",
    data,
  });
};

export const nonApproveCommentList = async (req: Request, res: Response) => {
  const { id: adminId, orgId } = req.user; // as { id: string; orgId: string };

  const data = await command.nonApproveCommentList(orgId, adminId);

  return res.status(200).json({
    success: true,
    message: "comment fetched successfully.",
    data,
  });
};

export const getChildComment = async (req: Request, res: Response) => {
  const parentId = req.params.parentId as string;

  const data = await command.getChildComment(parentId);

  return res.status(200).json({
    success: true,
    message: "comment fetched successfully.",
    data,
  });
};

export const toggleLike = async (req: Request, res: Response) => {
  const { feedId } = req.body;
  const {
    orgId,
    id: userId,
    role,
  } = req.user as { role: UserType; id: string; orgId: string };

  const data = await command.toggleLike(orgId, userId, feedId, role);

  return res.status(201).json({
    success: true,
    message: "messages added successfully.",
    ...data,
  });
};

export const approveComment = async (req: Request, res: Response) => {
  const commentId = req.params.commentId as string;
  const { orgId } = req.user;

  const data = await command.approveComment(orgId, commentId);

  return res.status(200).json({
    success: true,
    message: "comment approved successfully.",
    data,
  });
};

export const rejectComment = async (req: Request, res: Response) => {
  const commentId = req.params.commentId as string;
  const { orgId } = req.user;

  const data = await command.rejectComment(orgId, commentId);

  return res.status(200).json({
    success: true,
    message: "comment approved successfully.",
    data,
  });
};

export const deleteComment = async (req: Request, res: Response) => {
  const commentId = req.params.commentId as string;
  const { orgId, id } = req.user;

  await command.deleteComment(orgId, id, commentId);

  return res.status(200).json({
    success: true,
    message: "comment deleted successfully.",
  });
};
