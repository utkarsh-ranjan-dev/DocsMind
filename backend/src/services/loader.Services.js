import fs from "fs";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ApiError } from "../utils/ApiEror.js";

const processDocument = async (filePath, mimetype, originalName) => {
    try {
        let rawText = "";

        // Check by both mimetype AND file extension (more reliable)
        const ext = originalName.split('.').pop().toLowerCase();

        if (mimetype === "application/pdf" || ext === "pdf") {
            const dataBuffer = fs.readFileSync(filePath);
            const parser = new PDFParse({ data: dataBuffer });
            const result = await parser.getText();
            rawText = result.text;
            await parser.destroy();

        } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === "docx") {
            const result = await mammoth.extractRawText({ path: filePath });
            rawText = result.value;

        } else if (mimetype === "text/plain" || ext === "txt") {
            rawText = fs.readFileSync(filePath, "utf-8");

        } else {
            throw new ApiError(400, `file format not supported. Received mimetype: ${mimetype}, extension: ${ext}`);
        }

        // Wrap raw text into a LangChain Document object
        const rawDocs = [new Document({ pageContent: rawText, metadata: { source: originalName } })];

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200
        });

        const chunks = await textSplitter.splitDocuments(rawDocs);
        fs.unlinkSync(filePath);
        return chunks;

    } catch (error) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw new ApiError(500, "file process me dikkat :" + error.message);
    }
};

export { processDocument };
