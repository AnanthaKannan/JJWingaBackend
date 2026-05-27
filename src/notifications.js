const admin = require('./firebase');

const db = admin.firestore();
const messaging = admin.messaging();

const STUDENTS = 'students';
const PUSH_NOTIFICATIONS = 'pushNotifications';

const serializeError = error => ({
  code: error?.code ?? 'unknown',
  message: error?.message ?? String(error),
});

const updateNotification = (notificationRef, data) =>
  notificationRef.update({
    ...data,
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

async function sendHomeworkPushNotification(notificationRef, notification) {
  const studentId = notification.studentId;

  if (!studentId) {
    const result = { status: 'failed', error: 'Missing studentId' };
    await updateNotification(notificationRef, result);
    return result;
  }

  const studentRef = db.collection(STUDENTS).doc(studentId);
  const studentSnap = await studentRef.get();

  if (!studentSnap.exists) {
    const result = { status: 'failed', error: `Student ${studentId} not found` };
    await updateNotification(notificationRef, result);
    return result;
  }

  const tokens = studentSnap.data()?.fcmTokens ?? [];

  if (tokens.length === 0) {
    const result = {
      status: 'failed',
      error: 'No FCM tokens registered for student',
    };
    await updateNotification(notificationRef, result);
    return result;
  }

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: notification.title ?? 'New homework assigned',
      body: notification.body ?? 'You have new homework to attend.',
    },
    data: {
      type: 'HOMEWORK_ASSIGNED',
      studentId,
      questionIds: JSON.stringify(notification.questionIds ?? []),
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
      },
    },
  });

  const invalidTokens = response.responses
    .map((result, index) => {
      const code = result.error?.code;
      const isInvalid =
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered';

      return isInvalid ? tokens[index] : null;
    })
    .filter(Boolean);

  if (invalidTokens.length > 0) {
    await studentRef.update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  const errors = response.responses
    .map((result, index) =>
      result.error
        ? {
            tokenIndex: index,
            ...serializeError(result.error),
          }
        : null,
    )
    .filter(Boolean);

  const result = {
    status: response.failureCount > 0 ? 'partial' : 'sent',
    successCount: response.successCount,
    failureCount: response.failureCount,
    errors,
  };

  await updateNotification(notificationRef, result);
  return result;
}

async function sendNotificationById(notificationId) {
  const notificationRef = db.collection(PUSH_NOTIFICATIONS).doc(notificationId);
  const notificationSnap = await notificationRef.get();

  if (!notificationSnap.exists) {
    return {
      status: 'failed',
      error: `Notification ${notificationId} not found`,
    };
  }

  await notificationRef.update({
    status: 'processing',
    processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  try {
    return await sendHomeworkPushNotification(
      notificationRef,
      notificationSnap.data(),
    );
  } catch (error) {
    const result = {
      status: 'failed',
      error: serializeError(error),
    };
    await updateNotification(notificationRef, result);
    return result;
  }
}

async function processPendingNotifications() {
  const snapshot = await db
    .collection(PUSH_NOTIFICATIONS)
    .where('status', '==', 'pending')
    .get();

  const results = [];

  for (const docSnap of snapshot.docs) {
    const result = await sendNotificationById(docSnap.id);
    results.push({
      notificationId: docSnap.id,
      ...result,
    });
  }

  return results;
}

module.exports = {
  processPendingNotifications,
  sendNotificationById,
};
