import express, { Application } from "express";

import routes from "../routes";
import comment from "../routes/comment";
import crone from "../routes/crone.route";
import game from "../routes/game.route";
import error from "./error";
import swagger from "./swagger";
import responseTracker from "../middleware/responseTracker";

export default function (app: Application): void {
  app.use(express.json());
  // swagger(app);
  app.use(responseTracker);
  app.use("/v1/api", routes);
  app.use("/v1/api/comment", comment);
  app.use("/v1/api/crone", crone);
  app.use("/v1/api/game", game);
  app.use(error);
}
