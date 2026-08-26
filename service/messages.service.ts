import { Message } from "@models";

export const deleteMessage = (userId: string, messageId: string) => {
  return Message.deleteOne({ _id: messageId, sendBy: userId });
};
