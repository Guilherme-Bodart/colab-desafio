import { Router } from "express";
import { createRequestController } from "../controllers/create-request.controller";
import { getRequestByIdController } from "../controllers/get-request-by-id.controller";
import { listRequestsController } from "../controllers/list-requests.controller";
import { updateRequestStatusController } from "../controllers/update-request-status.controller";

export const requestRouter = Router();

requestRouter.get("/", listRequestsController);
requestRouter.get("/:id", getRequestByIdController);
requestRouter.patch("/:id", updateRequestStatusController);
requestRouter.patch("/:id/status", updateRequestStatusController);
requestRouter.post("/", createRequestController);
