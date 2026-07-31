const command = require("../service/comment");

module.exports.addComment = async (req, res) => {
  const { imageId, content, parentId } = req.body; // if parentId exist then it is consider as child command
  const { id: userId, role } = req.user;

  const data = await command.addComment(
    userId,
    imageId,
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

module.exports.getParentComment = async (req, res) => {
  const { imageId } = req.params;

  const data = await command.getParentComment(imageId);

  return res.status(200).json({
    success: true,
    message: "comment fetched successfully.",
    data,
  });
};

module.exports.getChildComment = async (req, res) => {
  const { parentId } = req.params;

  const data = await command.getChildComment(parentId);

  return res.status(200).json({
    success: true,
    message: "comment fetched successfully.",
    data,
  });
};

module.exports.toggleCommentLike = async (req, res) => {
  const { imageId } = req.body;
  const { id: userId } = req.user;

  const data = await command.toggleCommentLike(userId, imageId);

  return res.status(201).json({
    success: true,
    message: "messages added successfully.",
    ...data,
  });
};
