import { Router } from "express";
import { queryDocument, getSessions, getSessionMessages } from "../controllers/query.Controller.js";

const router = Router();

router.post("/", queryDocument);
router.get("/history", getSessions);
router.get("/history/:sessionId", getSessionMessages);

export default router;
