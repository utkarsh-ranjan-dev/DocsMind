import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import dotenv from "dotenv";

dotenv.config();

const llm= new GoogleGenerativeAIEmbeddings({
    modelName: "gemini-1.5-flash",
    temperature:0
});


export {llm}