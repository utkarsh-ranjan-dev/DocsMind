import path from "path";
import multer from "multer";
import { ApiError } from "../utils/ApiEror.js";

const storage  = multer.diskStorage({
    destination: (req,file,cb)=>{
        // FIX: Use absolute path so it works regardless of where the server is launched from
        cb(null, path.join(process.cwd(), "uploads"));
    },
    filename : (req,file,cb)=>{ // FIX 2: Changed "fileName" to "filename" (Multer requires lowercase 'n')
        const uniqueSuffix = Date.now()+"-"+ Math.round(Math.random()*1E9);
        cb(null, uniqueSuffix+"-"+file.originalname); // FIX 3: Changed "file.fileName" to "file.originalname" (Multer property name)
    }
    
});


const fileFilter = (req,file,cb)=>{
    const allowedFile = /pdf|docx|txt/;

    const extName = allowedFile.test(path.extname(file.originalname).toLowerCase()); // FIX 4: Changed "file.originalName" to "file.originalname" (Multer forces lowercase)

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
        limits: { fileSize: 50 * 1024 * 1024 } 
    });