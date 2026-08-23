import { Router } from "express";
import { addNotebook, listNotebooks, toggleShare } from "../controllers/notebook.Controller.js";

const router = Router();
router.post("/", addNotebook);
router.get("/", listNotebooks);
router.put("/:id/share", toggleShare);

export default router;
