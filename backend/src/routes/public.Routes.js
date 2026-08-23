import { Router } from "express";
import { getPublicNotebook } from "../controllers/notebook.Controller.js";
import { streamPublicQuery } from "../controllers/query.Controller.js";

const router = Router();
router.get("/notebooks/:id", getPublicNotebook);
router.post("/query/stream", streamPublicQuery);

export default router;
