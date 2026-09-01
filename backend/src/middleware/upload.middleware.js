import path from "path";
import multer from "multer";
import { ApiError } from "../utils/ApiEror.js";

const storage  = multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null, path.join(process.cwd(), "uploads"));
    },
    filename : (req,file,cb)=>{ 
        const uniqueSuffix = Date.now()+"-"+ Math.round(Math.random()*1E9);
        cb(null, uniqueSuffix+"-"+file.originalname); 
    }
    
});


const fileFilter = (req,file,cb)=>{
    // Added ppt, pptx, and image formats (png, jpg, jpeg)
    const allowedFile = /pdf|docx|txt|pptx|ppt|png|jpg|jpeg/;

    const extName = allowedFile.test(path.extname(file.originalname).toLowerCase()); 

    if(extName)
    {
        cb(null,true);
    }
    else
    {
        cb( new ApiError(400,"file type not supported "),false);
    }
}

export const upload= multer({
        storage : storage,
        fileFilter:fileFilter,
        limits: { fileSize: 100 * 1024 * 1024 } 
    });