import fs from "fs";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ApiError } from "../utils/apiError.js";



const processDocument= async(filePath, fileType, ORiginalName )=>{
    try {
        let loader;

        if(fileType==="application/pdf")
            loader= new PDFLoader(filePath);

        else if(fileType==="applicaton/vnd.openxmlformats-officedocuments.wordprocessingml.document")
            loader= new DocxLoader(filePath);

        else if(fileType==="text/plain")
            loadder= new TextLoader(fileType);

        else{
            throw new ApiError(400, "file format not supported");
        }


        const rawText = await loader.load();

        const textSplitter= new RecursiveCharacterTextSplitter({
            chunkSize:1000,
            chunkOverlap: 200
        });

        const chunks = new textSplitter.splitDocuments(rawText);

        const chunkWithMetaData= chunks.map((chunk)=>{
            chunk.metaData={...chunk.metaData, source: originalName}
            return chunk;
        });

        fs.unlinkSync(filePath);
        return chunkWithMetaData;
        
    } catch (error) {
        if(fs.existsSync(filePath))
        {
            fs.unlinkSync(filePath)

        }
    throw new ApiError(500, "file process me dikkat :" + error.message);

        
    }
};

export {processDocument};