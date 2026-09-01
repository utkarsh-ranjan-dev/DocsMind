import { Router } from "express";
import { queryDocument, streamQueryDocument, streamPublicQuery, simplifyText, getSessions, getSessionMessages, renameSession } from "../controllers/query.Controller.js";

const router = Router();

router.post("/", queryDocument);
router.post("/stream", streamQueryDocument);
router.post("/simplify", simplifyText);
router.get("/sessions", getSessions);
router.get("/sessions/:sessionId", getSessionMessages);
router.put("/sessions/:sessionId", renameSession);
router.get("/history", getSessions);
router.get("/history/:sessionId", getSessionMessages);

export default router;

