import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiEror.js";
import { getVectorStore, saveChatMessage, getChatSessions, getChatSessionById } from "../model/documentModel.js";
import { llm } from "../services/llm.Services.js";
import { PromptTemplate } from "@langchain/core/prompts";

const queryDocument = asyncHandler(async (req, res) => {
    const { question, sessionId = 'default-session', notebookId } = req.body;
    const userId = req.auth.userId;
    if (!question || !notebookId) throw new ApiError(400, "Missing question or notebookId");

    const vectorStore = getVectorStore();
    
    const filter = {
        preFilter: {
            "notebookId": { "$eq": notebookId }
        }
    };

    // --- QUERY OPTIMIZATION STEP ---
    const rewritePrompt = PromptTemplate.fromTemplate(
        `You are a search query optimizer. \nFix any spelling mistakes or typos in the user's question to make it optimal for a database search.\nDo NOT answer the question. Do NOT add extra words. Just output the corrected question text.\nIf the question is already perfectly spelled, output it exactly as is.\n\nOriginal: {question}\nOptimized:`
    );
    const optimizedResponse = await llm.invoke(await rewritePrompt.format({ question }));
    const optimizedQuery = optimizedResponse.content.trim();
    console.log("Original Query:", question, " | Optimized Query:", optimizedQuery);
    // -------------------------------

    const result = await vectorStore.similaritySearch(optimizedQuery, 7, filter);

    const context = result.map((chunk) => chunk.pageContent).join("\n");
    const sources = [...new Set(result.map((chunk) => chunk.metadata.source))];
    const grouped = {};
    result.forEach(chunk => {
        const name = chunk.metadata.source;
        if (!grouped[name]) {
            grouped[name] = { fileName: name, text: [] };
        }
        grouped[name].text.push(chunk.pageContent);
    });
    
    const detailedSources = Object.values(grouped).map(doc => ({
        fileName: doc.fileName,
        text: doc.text.join("\n\n---\n\n")
    }));

    const promptTemplate = PromptTemplate.fromTemplate(
        `You are DocsMind, an intelligent AI assistant. 
        You have access to a specific set of documents uploaded by the user to this workspace/notebook.
        
        If the user says a casual greeting (like "hi" or "hello"), respond politely and ask how you can help them with their documents.
        Otherwise, answer their question using ONLY the information provided in the Context below. 
        If the answer cannot be found in the Context, do NOT make up an answer. Instead, politely explain that the current workspace documents do not contain information about that.

        Context:
        {context}
        
        Question:
        {question}
        
        Answer:`
    );

    const prompt = await promptTemplate.format({ context, question });
    const aiResponse = await llm.invoke(prompt);
    const answerText = aiResponse.content;

    await saveChatMessage(sessionId, notebookId, 'user', question, [], userId);
    await saveChatMessage(sessionId, notebookId, 'ai', answerText, detailedSources, userId);

    res.status(200).json({
        success: true, answer: answerText, source: sources, detailedSources, sessionId
    });
});

const getSessions = asyncHandler(async (req, res) => {
    const { notebookId } = req.query;
    const userId = req.auth.userId;
    const sessions = await getChatSessions(notebookId, userId);
    res.status(200).json({ success: true, sessions });
});

const getSessionMessages = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.auth.userId;
    const session = await getChatSessionById(sessionId, userId);
    res.status(200).json({ success: true, messages: session ? session.messages : [] });
});

const renameSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { name } = req.body;
    const userId = req.auth.userId;
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });
    
    // Import dynamically or ensure it's imported at the top
    const { renameChatSession } = await import("../model/documentModel.js");
    await renameChatSession(sessionId, userId, name);
    res.status(200).json({ success: true, message: "Session renamed" });
});
const streamQueryDocument = asyncHandler(async (req, res) => {
    const { question, sessionId = 'default-session', notebookId } = req.body;
    const userId = req.auth.userId;
    if (!question || !notebookId) return res.status(400).end();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const vectorStore = getVectorStore();
        const filter = { preFilter: { "notebookId": { "$eq": notebookId } } };

        const rewritePrompt = PromptTemplate.fromTemplate(
            `You are a search query optimizer. \nFix any spelling mistakes or typos in the user's question to make it optimal for a database search.\nDo NOT answer the question. Do NOT add extra words. Just output the corrected question text.\nIf the question is already perfectly spelled, output it exactly as is.\n\nOriginal: {question}\nOptimized:`
        );
        const optimizedResponse = await llm.invoke(await rewritePrompt.format({ question }));
        const optimizedQuery = optimizedResponse.content.trim();

        const result = await vectorStore.similaritySearch(optimizedQuery, 7, filter);

        const context = result.map((chunk) => chunk.pageContent).join("\n");
        const sources = [...new Set(result.map((chunk) => chunk.metadata.source))];
        const grouped = {};
        result.forEach(chunk => {
            const name = chunk.metadata.source;
            if (!grouped[name]) {
                grouped[name] = { fileName: name, text: [] };
            }
            grouped[name].text.push(chunk.pageContent);
        });
        
        const detailedSources = Object.values(grouped).map(doc => ({
            fileName: doc.fileName,
            text: doc.text.join("\n\n---\n\n")
        }));

        res.write(`data: ${JSON.stringify({ type: 'sources', sources, detailedSources })}\n\n`);

        const promptTemplate = PromptTemplate.fromTemplate(
            `You are DocsMind, an intelligent AI assistant. \nYou have access to a specific set of documents uploaded by the user to this workspace/notebook.\n\nIf the user says a casual greeting (like "hi" or "hello"), respond politely and ask how you can help them with their documents.\nOtherwise, answer their question using ONLY the information provided in the Context below. \nIf the answer cannot be found in the Context, do NOT make up an answer. Instead, politely explain that the current workspace documents do not contain information about that.\n\nContext:\n{context}\n\nQuestion:\n{question}\n\nAnswer:`
        );

        const prompt = await promptTemplate.format({ context, question });
        const stream = await llm.stream(prompt);
        let fullAnswer = "";

        for await (const chunk of stream) {
            fullAnswer += chunk.content;
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk.content })}\n\n`);
        }

        await saveChatMessage(sessionId, notebookId, 'user', question, [], userId);
        await saveChatMessage(sessionId, notebookId, 'ai', fullAnswer, detailedSources, userId);

        res.write(`data: ${JSON.stringify({ type: 'done', sessionId })}\n\n`);
        res.end();
    } catch (error) {
        console.error("Streaming error", error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
    }
});

const streamPublicQuery = asyncHandler(async (req, res) => {
    const { question, notebookId } = req.body;
    if (!question || !notebookId) return res.status(400).end();

    const { getNotebookById } = await import("../model/documentModel.js");
    const notebook = await getNotebookById(notebookId);
    
    if (!notebook || !notebook.isPublic) {
        res.status(403).json({ error: "Access denied" });
        return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const vectorStore = getVectorStore();
        const filter = { preFilter: { "notebookId": { "$eq": notebookId } } };

        const rewritePrompt = PromptTemplate.fromTemplate(
            `You are a search query optimizer. \nFix any spelling mistakes or typos in the user's question to make it optimal for a database search.\nDo NOT answer the question. Do NOT add extra words. Just output the corrected question text.\nIf the question is already perfectly spelled, output it exactly as is.\n\nOriginal: {question}\nOptimized:`
        );
        const optimizedResponse = await llm.invoke(await rewritePrompt.format({ question }));
        const optimizedQuery = optimizedResponse.content.trim();

        const result = await vectorStore.similaritySearch(optimizedQuery, 7, filter);

        const context = result.map((chunk) => chunk.pageContent).join("\n");
        const sources = [...new Set(result.map((chunk) => chunk.metadata.source))];
        const grouped = {};
        result.forEach(chunk => {
            const name = chunk.metadata.source;
            if (!grouped[name]) {
                grouped[name] = { fileName: name, text: [] };
            }
            grouped[name].text.push(chunk.pageContent);
        });
        
        const detailedSources = Object.values(grouped).map(doc => ({
            fileName: doc.fileName,
            text: doc.text.join("\n\n---\n\n")
        }));

        res.write(`data: ${JSON.stringify({ type: 'sources', sources, detailedSources })}\n\n`);

        const promptTemplate = PromptTemplate.fromTemplate(
            `You are DocsMind, an intelligent AI assistant. \nYou have access to a specific set of documents uploaded by the user to this workspace/notebook.\n\nIf the user says a casual greeting (like "hi" or "hello"), respond politely and ask how you can help them with their documents.\nOtherwise, answer their question using ONLY the information provided in the Context below. \nIf the answer cannot be found in the Context, do NOT make up an answer. Instead, politely explain that the current workspace documents do not contain information about that.\n\nContext:\n{context}\n\nQuestion:\n{question}\n\nAnswer:`
        );

        const prompt = await promptTemplate.format({ context, question });
        const stream = await llm.stream(prompt);

        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk.content })}\n\n`);
        }

        res.write(`data: ${JSON.stringify({ type: 'done', sessionId: 'public' })}\n\n`);
        res.end();
    } catch (error) {
        console.error("Streaming error", error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
    }
});

export { queryDocument, streamQueryDocument, streamPublicQuery, getSessions, getSessionMessages, renameSession };






