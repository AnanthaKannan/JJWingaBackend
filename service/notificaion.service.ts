const admin = require("firebase-admin");
import { SendResponse } from "firebase-admin/messaging";

import logger from "../middleware/logger";
import { getTokenSuffix, chunk } from "../utils";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const FCM_BATCH_LIMIT = 500; // sendEachForMulticast's per-call token limit

export const sendPushNotificationSingle = async (
  token: string,
  title: string,
  body: string,
) => {
  try {
    if (!token) {
      logger.warn({ title }, "push_notification_skipped_missing_token");
      return;
    }

    await admin.messaging().send({
      token,
      notification: { title, body },
    });
  } catch (error) {
    // Log but don't throw — DB entry already saved, push failure is non-critical
    logger.error(
      {
        err: error,
        title,
        tokenSuffix: getTokenSuffix(token),
      },
      "push_notification_failed",
    );
  }
};

export const sendPushNotificationBulk = async (
  tokens: string[],
  title: string,
  body: string,
): Promise<{
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}> => {
  const validTokens = (tokens ?? []).filter(Boolean);

  if (validTokens.length === 0) {
    logger.warn({ title }, "push_notification_skipped_missing_tokens");
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  let successCount = 0;
  let failureCount = 0;
  const invalidTokens: string[] = [];

  const batches = chunk(validTokens, FCM_BATCH_LIMIT);

  for (const batch of batches) {
    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
      });

      successCount += response.successCount;
      failureCount += response.failureCount;

      response.responses.forEach((res: SendResponse, idx: number) => {
        if (!res.success) {
          const badToken = batch[idx];
          invalidTokens.push(badToken);
          logger.error(
            {
              err: res.error,
              title,
              tokenSuffix: getTokenSuffix(badToken),
            },
            "push_notification_failed",
          );
        }
      });
    } catch (error) {
      // Log but don't throw — DB entry already saved, push failure is non-critical
      failureCount += batch.length;
      logger.error(
        { err: error, title, batchSize: batch.length },
        "push_notification_batch_failed",
      );
    }
  }

  return { successCount, failureCount, invalidTokens };
};
