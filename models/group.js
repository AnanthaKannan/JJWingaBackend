const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
    },
    students: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Student",
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Creator (Admin) reference is required"],
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Creator (Organization) reference is required"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Prevent duplicate group names within the same org
groupSchema.index({ orgId: 1, groupName: 1 }, { unique: true });

// Speeds up "which groups is this student in" queries
groupSchema.index({ students: 1 });

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;

// // All students in a group (populate)
// const group = await Group.findById(groupId).populate("students");

// // All groups a student belongs to (reverse lookup)
// const groups = await Group.find({ students: studentId, orgId });

// // Add a student to a group (avoids duplicates)
// await Group.updateOne(
//   { _id: groupId },
//   { $addToSet: { students: studentId } }
// );

// // Remove a student from a group
// await Group.updateOne(
//   { _id: groupId },
//   { $pull: { students: studentId } }
// );
