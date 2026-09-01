import { Router } from "express";
import { feedDocument, feedUrl, listDocuments, removeDocument, getStats, summarizeNotebook } from "../controllers/document.Controller.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

router.post("/feed", upload.single("document"), feedDocument);
router.post("/feed-url", feedUrl);
router.get("/", listDocuments);
router.delete("/", removeDocument);
router.get("/stats", getStats);
router.post("/summarize", summarizeNotebook);

export default router;

