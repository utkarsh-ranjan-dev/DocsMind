import { asyncHandler } from "../utils/AsyncHandler.js"
import { ApiError } from "../utils/ApiEror.js"
import { processDocument, processUrl } from "../services/loader.Services.js"
import { getVectorStore, addChunk, getAllDocuments, deleteDocument, addDocumentMetadata, getStorageStats } from "../model/documentModel.js"

const feedDocument = asyncHandler(async(req, res) => {
    if (!req.file) throw new ApiError(400, "Please upload the file");
    
    const { notebookId } = req.body;
    const userId = req.auth.userId;
    if (!notebookId) throw new ApiError(400, "notebookId is required");

    const { path, mimetype, originalname, size } = req.file;
    const chunk = await processDocument(path, mimetype, originalname);

    chunk.forEach(c => {
        c.metadata = { ...c.metadata, notebookId, userId };
    });

    await addChunk(chunk);

    await addDocumentMetadata({
        fileName: originalname,
        mimetype: mimetype,
        size: size || chunk.length * 100,
        uploadedAt: new Date(),
        status: 'Indexed',
        notebookId: notebookId,
        userId: userId
    });

    res.status(200).json({ success: true, message: "file uploaded", fileName: originalname });
});

const feedUrl = asyncHandler(async(req, res) => {
    const { url, notebookId } = req.body;
    const userId = req.auth.userId;
    
    if (!url || !notebookId) throw new ApiError(400, "URL and notebookId are required");

    const { chunks, size } = await processUrl(url);

    chunks.forEach(c => {
        c.metadata = { ...c.metadata, notebookId, userId };
    });

    await addChunk(chunks);

    await addDocumentMetadata({
        fileName: url,
        mimetype: 'text/html',
        size: size,
        uploadedAt: new Date(),
        status: 'Indexed',
        notebookId: notebookId,
        userId: userId
    });

    res.status(200).json({ success: true, message: "URL content extracted and indexed", fileName: url });
});

const listDocuments = asyncHandler(async(req, res) => {
    const { notebookId } = req.query;
    const userId = req.auth.userId;
    const docs = await getAllDocuments(notebookId, userId);
    res.status(200).json({ success: true, document: docs });
});

const removeDocument = asyncHandler(async(req, res) => {
    const { fileName, notebookId } = req.body;
    const userId = req.auth.userId;
    if (!fileName || !notebookId) throw new ApiError(400, "Missing parameters");
    await deleteDocument(fileName, notebookId, userId);
    res.status(200).json({ success: true, message: `${fileName} deleted` });
});

const getStats = asyncHandler(async(req, res) => {
    const userId = req.auth.userId;
    const stats = await getStorageStats(userId);
    res.status(200).json({ success: true, stats });
});

const summarizeNotebook = asyncHandler(async (req, res) => {
    const { notebookId } = req.body;
    const userId = req.auth.userId;
    if (!notebookId) return res.status(400).json({ success: false, message: "notebookId required" });

    const { getVectorStore } = await import("../model/documentModel.js");
    const vectorStore = getVectorStore();
    
    const result = await vectorStore.similaritySearch("summary overview key points main idea", 20, {
        preFilter: { "notebookId": { "$eq": notebookId } }
    });

    if (result.length === 0) {
        return res.status(400).json({ success: false, message: "No documents found to summarize." });
    }

    const context = result.map((chunk) => chunk.pageContent).join("\n\n");
    
    const { llm } = await import("../services/llm.Services.js");
    const { PromptTemplate } = await import("@langchain/core/prompts");

    const promptTemplate = PromptTemplate.fromTemplate(
        `You are an expert analyst. Create a beautifully formatted, highly detailed Executive Summary and Study Guide based on the following document context.
        Use Markdown formatting. Include headings, bullet points, and highlight key themes or facts.
        
        Document Context:
        {context}
        
        Executive Summary:`
    );

    const prompt = await promptTemplate.format({ context });
    const aiResponse = await llm.invoke(prompt);
    
    res.status(200).json({ success: true, summary: aiResponse.content });
});

export { feedDocument, feedUrl, listDocuments, removeDocument, getStats, summarizeNotebook };

