const { Comment, FileUpload } = require("../models");

module.exports.addComment = async (
  userId,
  imageId,
  content,
  role,
  parentId = null,
) => {
  const userType = role === "student" ? "Student" : "Admin";
  const data = await Comment.create({
    userId,
    imageId,
    content,
    parentId, // if the parentId pres
    userType,
  });
  await FileUpload.updateOne({ _id: imageId }, { $inc: { commentCount: 1 } });
  return { id: data._id };
};

module.exports.getParentComment = async (imageId, page = 1, limit = 100) => {
  const skip = (page - 1) * limit;
  const data = await Comment.find({
    imageId,
    parentId: null,
    isBlocked: false,
  })
    .select("-imageId -parentId")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "name profilePicPath");
  return data;
};

module.exports.getChildComment = async (parentId, page = 1, limit = 100) => {
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

module.exports.toggleCommentLike = async (userId, imageId) => {
  // try to remove first — if userId exists in likedBy, $pull removes it
  const alreadyLiked = await FileUpload.findOne({
    _id: imageId,
    likedBy: userId,
  }).select("_id");

  if (alreadyLiked) {
    // unlike
    const updated = await FileUpload.findOneAndUpdate(
      { _id: imageId, likedBy: userId },
      {
        $pull: { likedBy: userId },
        $inc: { likeCount: -1 },
      },
      { new: true },
    );
    return { liked: false, likeCount: updated.likeCount };
  } else {
    // like
    const updated = await FileUpload.findOneAndUpdate(
      { _id: imageId, likedBy: { $ne: userId } },
      {
        $addToSet: { likedBy: userId },
        $inc: { likeCount: 1 },
      },
      { new: true },
    );
    return { liked: true, likeCount: updated.likeCount };
  }
};
