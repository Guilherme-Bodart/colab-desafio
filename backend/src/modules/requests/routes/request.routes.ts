import { Router } from "express";
import { createRequestController } from "../controllers/create-request.controller";

export const requestRouter = Router();

requestRouter.post("/", createRequestController);
