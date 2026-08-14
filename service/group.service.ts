import { NotFoundError } from "../errors";
import { Group, Student } from "../models";
import { Types } from "mongoose";

interface CreateGroupParams {
  groupName: string;
  studentIds: string[];
  orgId: string;
  createdBy: string;
}

export const createGroup = async ({
  groupName,
  studentIds,
  orgId,
  createdBy,
}: CreateGroupParams) => {
  const studentIdsObj = studentIds.map((id) => new Types.ObjectId(id));

  const group = await Group.create({
    groupName,
    studentIds: studentIdsObj,
    orgId,
    createdBy,
  });

  return group;
};

export const groupList = (orgId: string, adminId: string) => {
  return Group.find({ orgId, createdBy: adminId })
    .select("groupName studentIds")
    .lean();
};

export const getGroupDetails = (
  orgId: string,
  adminId: string,
  groupId: string,
) => {
  return Group.findOne({ _id: groupId, orgId, createdBy: adminId })
    .select("messages")
    .lean();
};

export const groupStudentList = async (
  orgId: string,
  adminId: string,
  groupId: string,
) => {
  const group = await Group.findOne({
    _id: groupId,
    orgId: orgId,
    createdBy: adminId,
  })
    .select("studentIds")
    .lean();

  if (!group) throw new NotFoundError(`Group ${groupId} not found`);

  const studentList = await Student.find({
    _id: { $in: group.studentIds },
  })
    .select("_id studentId name")
    .lean();
  return studentList;
};

export const updateGroup = async (
  orgId: string,
  adminId: string,
  groupId: string,
  updateData: { groupName?: string; studentIds?: string[] },
) => {
  const updateFields: any = {};
  if (updateData.groupName) updateFields.groupName = updateData.groupName;
  if (updateData.studentIds) {
    updateFields.studentIds = updateData.studentIds.map(
      (id) => new Types.ObjectId(id),
    );
  }

  const result = await Group.findOneAndUpdate(
    { _id: groupId, orgId, createdBy: adminId },
    { $set: updateFields },
    { new: true },
  );

  if (!result) throw new Error("Group not found");
  return result;
};

export const deleteGroup = async (
  orgId: string,
  adminId: string,
  groupId: string,
) => {
  const result = await Group.findOneAndDelete({
    _id: groupId,
    orgId,
    createdBy: adminId,
  });
  if (!result) throw new Error("Group not found");
  return result;
};

export const sendGroupMessage = async (
  orgId: string,
  adminId: string,
  groupId: string,
  message: string,
) => {
  await Group.updateOne(
    { _id: groupId, orgId, createdBy: adminId },
    { $push: { messages: { text: message } } },
  );

  // TODO: send the message to all the students
};
