import {asyncHandler} from "../utils/AsyncHandler.js"
import {ApiError} from "../utils/ApiEror.js"
import {processDocument} from "../services/loader.Services.js"
import {getVectorStore,addChunk,getAllDocuments,deleteDocument} from "../model/documentModel.js"



const feedDocument = asyncHandler(async(req,res)=>{
    if(!req.file)
    {
        throw new ApiError(400,"Please upload the file");
    };

    const {path, fileType, originalName} = req.file;

    const chunk= await processDocument(path, fileType,originalName);

    await addChunk(chunk);

    res.status(200).json({
        success: true,
        message: "file uploaded successfuky",
        fileName:originalName,
        totalChunk: chunk.length
    });
});

const listDocuments= asyncHandler(async(req,res)=>{
    const docs= await getAllDocuments();

    res.status(200).json({
        success: true,
        document:docs
    });
});

const removeDocument= asyncHandler(async(req,res)=>{
    const {sourceName} = req.body;

    if(!sourceName)
    {
        throw new ApiError(400,"Enter valid Fie NAme");
    }


    await deleteDocument(sourceName);

    res.status(200).json({
        success:true,
        message:`${sourceName} deleted successfully`
    });
});


export {feedDocument,listDocuments,removeDocument}

