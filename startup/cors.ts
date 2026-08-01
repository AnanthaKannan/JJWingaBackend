import cors, { CorsOptions } from "cors";
import { Application } from "express";

export default function (app: Application): void {
  const corsOptions: CorsOptions = {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    exposedHeaders: "*",
    optionsSuccessStatus: 204,
  };
  app.use(cors(corsOptions));
}
