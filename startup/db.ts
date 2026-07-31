import mongoose from "mongoose";
import logger from "../middleware/logger";

export default function (): void {
  const db = process.env.MONGO_URL as string;

  mongoose
    .connect(db)
    .then(() => {
      logger.info("mongo_connected");
    })
    .catch((error: Error) => {
      logger.fatal({ err: error }, "mongo_connection_failed");
      process.exit(1);
    });
}
