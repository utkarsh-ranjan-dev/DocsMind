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

        // ── CONVERSATIONAL MEMORY ────────────────────────────────────────
        // Fetch last 6 messages from this session to give the AI context
        // about what was discussed before, so follow-up questions work.
        let chatHistory = "";
        try {
            const session = await getChatSessionById(sessionId, userId);
            if (session && session.messages && session.messages.length > 0) {
                const recentMessages = session.messages.slice(-6); // last 6 messages
                chatHistory = recentMessages
                    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
                    .join("\n");
            }
        } catch (e) {
            // If no session exists yet, just start fresh
        }
        // ────────────────────────────────────────────────────────────────

        // ── WEB FALLBACK ────────────────────────────────────────────────
        // If no relevant chunks found in the documents, fall back to
        // Gemini's own general knowledge and warn the user.
        if (result.length === 0) {
            res.write(`data: ${JSON.stringify({ type: 'sources', sources: [], detailedSources: [], isWebFallback: true })}\n\n`);

            const fallbackPrompt = PromptTemplate.fromTemplate(
                `You are a helpful AI assistant called DocsMind.
The user's uploaded documents do not contain relevant information for this question.
Use your own general knowledge to answer. Use the Conversation History below to understand any follow-up questions.

Conversation History (most recent last):
{chat_history}

Current Question: {question}

Answer:`
            );
            const fallbackStream = await llm.stream(await fallbackPrompt.format({ question, chat_history: chatHistory || "No previous conversation." }));
            let fallbackAnswer = "";

            for await (const chunk of fallbackStream) {
                fallbackAnswer += chunk.content;
                res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk.content })}\n\n`);
            }

            await saveChatMessage(sessionId, notebookId, 'user', question, [], userId);
            await saveChatMessage(sessionId, notebookId, 'ai', fallbackAnswer, [], userId);

            res.write(`data: ${JSON.stringify({ type: 'done', sessionId, isWebFallback: true })}\n\n`);
            res.end();
            return;
        }
        // ────────────────────────────────────────────────────────────────

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
            `You are DocsMind, an intelligent AI assistant.

You have been given Context extracted from the user's uploaded documents, and a Conversation History of what was discussed earlier in this chat session.

RULES:
1. If the user says a casual greeting (like "hi" or "hello"), respond warmly and ask how you can help.
2. Use the Conversation History to understand the full context of the question, especially for follow-up questions (e.g. "what is its life?" refers to the topic discussed just before).
3. If the Context clearly contains the answer, answer using ONLY that Context.
4. If the Context does NOT contain enough information to answer, STILL answer using your own general knowledge — but you MUST start your entire response with the exact token: §WEB§
   Do NOT explain why you are using general knowledge. Just start with §WEB§ and then give the answer directly.

Conversation History (most recent last):
{chat_history}

Context from Documents:
{context}

Current Question:
{question}

Answer:`
        );

        const prompt = await promptTemplate.format({ context, question, chat_history: chatHistory || "No previous conversation." });
        const stream = await llm.stream(prompt);
        let fullAnswer = "";
        let isWebFallback = false;
        let prefixBuffer = "";
        let prefixChecked = false;

        for await (const chunk of stream) {
            const content = chunk.content;
            fullAnswer += content;

            if (!prefixChecked) {
                prefixBuffer += content;
                // Wait until we have at least 6 chars to detect the §WEB§ marker
                if (prefixBuffer.length >= 6) {
                    prefixChecked = true;
                    if (prefixBuffer.startsWith("§WEB§")) {
                        isWebFallback = true;
                        // Send the fallback warning event
                        res.write(`data: ${JSON.stringify({ type: 'fallback', isWebFallback: true })}\n\n`);
                        // Strip the marker and stream the rest
                        const stripped = prefixBuffer.replace("§WEB§", "").trimStart();
                        if (stripped) res.write(`data: ${JSON.stringify({ type: 'chunk', content: stripped })}\n\n`);
                    } else {
                        // Normal response — flush the buffered prefix
                        res.write(`data: ${JSON.stringify({ type: 'chunk', content: prefixBuffer })}\n\n`);
                    }
                }
            } else {
                res.write(`data: ${JSON.stringify({ type: 'chunk', content: content })}\n\n`);
            }
        }

        // Strip §WEB§ from saved answer too
        const cleanAnswer = fullAnswer.replace("§WEB§", "").trimStart();

        await saveChatMessage(sessionId, notebookId, 'user', question, [], userId);
        await saveChatMessage(sessionId, notebookId, 'ai', cleanAnswer, isWebFallback ? [] : detailedSources, userId);

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


const simplifyText = asyncHandler(async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).end();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const simplifyPrompt = PromptTemplate.fromTemplate(
            `You are a plain-language translator. 
Your job is to rewrite the following text so that a 10-year-old can understand it.
Rules:
- Use very simple, everyday words. Avoid jargon, technical terms, and complex vocabulary.
- Keep sentences short and easy to follow.
- Preserve all the key facts and meaning from the original.
- Use a friendly, conversational tone.
- Do NOT add any introduction like "Here is the simplified version". Just output the simplified text directly.

Original Text:
{text}

Simplified Version:`
        );

        const prompt = await simplifyPrompt.format({ text });
        const stream = await llm.stream(prompt);

        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk.content })}\n\n`);
        }

        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
    } catch (error) {
        console.error("Simplify error", error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
    }
});

export { queryDocument, streamQueryDocument, streamPublicQuery, simplifyText, getSessions, getSessionMessages, renameSession };
