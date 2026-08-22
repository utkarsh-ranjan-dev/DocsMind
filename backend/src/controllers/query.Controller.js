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

    const result = await vectorStore.similaritySearch(question, 7, filter);

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

export { queryDocument, getSessions, getSessionMessages };


