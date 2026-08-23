import { Router } from "express";
import { feedDocument, listDocuments, removeDocument, getStats, summarizeNotebook } from "../controllers/document.Controller.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

router.post("/feed", upload.single("document"), feedDocument);
router.get("/", listDocuments);
router.delete("/", removeDocument);
router.get("/stats", getStats);
router.post("/summarize", summarizeNotebook);

export default router;

