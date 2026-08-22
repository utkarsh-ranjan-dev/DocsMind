import { Router } from "express";
import { getInsights } from "../controllers/insights.Controller.js";

const router = Router();
router.get("/", getInsights);
export default router;
