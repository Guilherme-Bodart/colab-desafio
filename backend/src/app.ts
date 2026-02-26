import cors from "cors";
import express from "express";
import { healthRouter } from "./modules/health/routes/health.routes";
import { requestRouter } from "./modules/requests/routes/request.routes";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/requests", requestRouter);

  return app;
}
