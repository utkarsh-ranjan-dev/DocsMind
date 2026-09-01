import fs from "fs";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import officeParser from "officeparser";
import Tesseract from "tesseract.js";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ApiError } from "../utils/ApiEror.js";

const processDocument = async (filePath, mimetype, originalName) => {
    try {
        let rawText = "";

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

        } else if (ext === "pptx" || ext === "ppt") {
            // Use officeparser for powerpoint
            rawText = await officeParser.parseOfficeAsync(filePath);

        } else if (ext === "png" || ext === "jpg" || ext === "jpeg") {
            // Use Tesseract for OCR on images
            const result = await Tesseract.recognize(filePath, 'eng');
            rawText = result.data.text;

        } else if (mimetype === "text/plain" || ext === "txt") {
            rawText = fs.readFileSync(filePath, "utf-8");

        } else {
            throw new ApiError(400, `file format not supported. Received mimetype: ${mimetype}, extension: ${ext}`);
        }

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
        throw new ApiError(500, "file process me error :" + error.message);
    }
};

import axios from 'axios';
import * as cheerio from 'cheerio';

const processUrl = async (url) => {
    try {
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(response.data);
        
        // Remove scripts, styles, and empty elements
        $('script, style, noscript, iframe, img, svg').remove();
        let rawText = $('body').text().replace(/\s+/g, ' ').trim();

        if (!rawText) throw new Error("No readable text found on this URL.");

        const rawDocs = [new Document({ pageContent: rawText, metadata: { source: url } })];

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200
        });

        const chunks = await textSplitter.splitDocuments(rawDocs);
        return { chunks, size: rawText.length };
    } catch (error) {
        throw new ApiError(500, "URL parsing failed: " + error.message);
    }
};

export { processDocument, processUrl };
