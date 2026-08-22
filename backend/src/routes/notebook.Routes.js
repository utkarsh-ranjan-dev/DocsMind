import { Router } from "express";
import { addNotebook, listNotebooks } from "../controllers/notebook.Controller.js";

const router = Router();
router.post("/", addNotebook);
router.get("/", listNotebooks);

export default router;
