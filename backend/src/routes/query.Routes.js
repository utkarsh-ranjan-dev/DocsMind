import { Router } from "express";
import { queryDocument, streamQueryDocument, getSessions, getSessionMessages, renameSession } from "../controllers/query.Controller.js";

const router = Router();

router.post("/", queryDocument);
router.post("/stream", streamQueryDocument);
router.get("/history", getSessions);
router.get("/history/:sessionId", getSessionMessages);

export default router;

