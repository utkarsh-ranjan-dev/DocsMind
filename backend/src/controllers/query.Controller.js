import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiEror.js";
import { getVectorStore, saveChatMessage, getChatSessions, getChatSessionById } from "../model/documentModel.js";
import { llm } from "../services/llm.Services.js";
import { PromptTemplate } from "@langchain/core/prompts";

const queryDocument = asyncHandler(async (req, res) => {
    const { question, sessionId = 'default-session' } = req.body;
    if (!question) throw new ApiError(400, "Need the query");

    const vectorStore = getVectorStore();
    const result = await vectorStore.similaritySearch(question, 5);

    const context = result.map((chunk) => chunk.pageContent).join("\n");
    // Get unique sources
    const sources = [...new Set(result.map((chunk) => chunk.metadata.source))];

    // Build detailed sources with exact content for frontend Source Preview
    const detailedSources = result.map(chunk => ({
        fileName: chunk.metadata.source,
        text: chunk.pageContent
    }));

    const promptTemplate = PromptTemplate.fromTemplate(
        `You are an AI assistant. Answer the question based strictly on the provided context.
        
        Context:
        {context}
        
        Question:
        {question}
        
        Answer:`
    );

    const prompt = await promptTemplate.format({ context, question });
    const aiResponse = await llm.invoke(prompt);
    const answerText = aiResponse.content;

    // Save to History
    await saveChatMessage(sessionId, 'user', question);
    await saveChatMessage(sessionId, 'ai', answerText, detailedSources);

    res.status(200).json({
        success: true,
        answer: answerText,
        source: sources,
        detailedSources: detailedSources,
        sessionId
    });
});

const getSessions = asyncHandler(async (req, res) => {
    const sessions = await getChatSessions();
    res.status(200).json({ success: true, sessions });
});

const getSessionMessages = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const session = await getChatSessionById(sessionId);
    res.status(200).json({ 
        success: true, 
        messages: session ? session.messages : [] 
    });
});

export { queryDocument, getSessions, getSessionMessages };
