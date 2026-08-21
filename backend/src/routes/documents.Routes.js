import express from "express";
import {feedDocument,listDocuments,removeDocument} from "../controllers/document.Controller.js";
import {upload} from "../middleware/upload.middleware.js";


const router=express.Router();


router.post("/feed",upload.single("document").feedDocument);

router.get("/", listDocuments);

router.delete("/", removeDocument);


export default router
