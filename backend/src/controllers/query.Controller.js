import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiEror.js";
import {llm} from "../services/llm.Services.js"
import { similarSearchChunk } from "../model/queryModel.js";

const askQuestion= asyncHandler(async(req,res)=>{
    const {question}= req.body;

    if(!question)
    {
        throw new ApiError(400,"Please question toh do ");
    }

    const chunk=await similarSearchChunk(question);

    if(chunk.length===0)
    {
        // FIX: Added "return" so the code stops here and doesn't crash trying to continue below
        return res.status(200).json({
            answer: "Please thoda aur data toh do tab batayunga ",
            sources:[]
        });
    }


    // FIX: Renamed "content" to "context" so it matches the ${context} variable used in the prompt below
    const context = chunk.map(chunk=> chunk.pageContent).join("\n\n");


    const prompt = `
        You are a helpful assistant. Answer the user's question based ONLY on the context below. 
        If the answer is not in the context, say "I don't know based on the provided documents."
        
        Context:
        ${context}
        
        Question:
        ${question}
        
        Answer:
    `;


    const response = await llm.invoke(prompt);

    // Reverted back to the canonical LangChain metadata path
    const sources = chunk.map(chunk=> chunk.metadata.source);

    const uniqueSources = [... new Set(sources)];

    res.status(200).json({
        success: true,
        answer: response.content,
        source: uniqueSources
    });
});

export {askQuestion}