import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from "dotenv";

dotenv.config({ path: './backend/.env' });

const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash", // FIX: Updated to an available model for this API key
    temperature: 0,
    apiKey: process.env.GOOGLE_API_KEY
});

export {llm}