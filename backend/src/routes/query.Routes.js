import {similarSearchChunk} from "../model/queryModel.js"
import express from "express";
import {askQuestion} from "../controllers/query.Controller.js"


const router= express.Router();

router.post("/", askQuestion);

export default router
