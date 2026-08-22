import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import dotenv from "dotenv";

dotenv.config({ path: './backend/.env' });

const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-2", 
    apiKey: process.env.GOOGLE_API_KEY
});

export {embeddings};
