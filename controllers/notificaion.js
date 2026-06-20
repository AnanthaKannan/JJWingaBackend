require("dotenv").config();

const express = require("express");
const admin = require("firebase-admin");
const logger = require("../middleware/logger");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const app = express();
app.use(express.json());

app.post("/send-notification", async (req, res) => {
  try {
    const { token, title, body } = req.body;
    await admin.messaging().send({ token, notification: { title, body } });
    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "standalone_notification_failed");
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  logger.info({ port: PORT }, "notification_server_listening"),
);
